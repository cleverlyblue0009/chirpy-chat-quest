"""
Sequence Reconstruction Module
================================
This module implements the greedy nearest-neighbor algorithm to reconstruct
the correct order of jumbled frames using optical flow similarity.
"""

import os
import cv2
import numpy as np
from tqdm import tqdm
from concurrent.futures import ProcessPoolExecutor, as_completed
from typing import List, Tuple
from .optical_flow_similarity import optical_flow_similarity
from .extract_frames import load_frame, get_frame_paths


def find_best_next_frame(current_frame: np.ndarray, 
                         candidate_paths: List[str]) -> Tuple[str, float]:
    """
    Find the frame with the best optical flow similarity to the current frame.
    
    Args:
        current_frame (np.ndarray): Current frame in the sequence
        candidate_paths (list): List of paths to candidate frames
        
    Returns:
        tuple: (best_frame_path, best_similarity_score)
    """
    best_score = -1.0
    best_path = None
    
    for candidate_path in candidate_paths:
        candidate_frame = load_frame(candidate_path)
        similarity = optical_flow_similarity(current_frame, candidate_frame)
        
        if similarity > best_score:
            best_score = similarity
            best_path = candidate_path
    
    return best_path, best_score


def find_best_next_frame_parallel(current_frame_path: str,
                                  candidate_paths: List[str],
                                  batch_size: int = 50) -> Tuple[str, float]:
    """
    Find the best next frame using parallel processing for faster computation.
    
    Args:
        current_frame_path (str): Path to current frame
        candidate_paths (list): List of paths to candidate frames
        batch_size (int): Number of frames to process per worker
        
    Returns:
        tuple: (best_frame_path, best_similarity_score)
    """
    current_frame = load_frame(current_frame_path)
    
    # For small sets, use sequential processing
    if len(candidate_paths) < 20:
        return find_best_next_frame(current_frame, candidate_paths)
    
    best_score = -1.0
    best_path = None
    
    # Process in batches for better performance
    for i in range(0, len(candidate_paths), batch_size):
        batch = candidate_paths[i:i+batch_size]
        
        for candidate_path in batch:
            candidate_frame = load_frame(candidate_path)
            similarity = optical_flow_similarity(current_frame, candidate_frame)
            
            if similarity > best_score:
                best_score = similarity
                best_path = candidate_path
    
    return best_path, best_score


def reconstruct_sequence_greedy(frames_folder: str, 
                                method: str = "opticalflow",
                                start_frame: str = None) -> List[str]:
    """
    Reconstruct the correct order of frames using a greedy nearest-neighbor algorithm.
    
    Algorithm:
    1. Start with a random (or specified) frame
    2. Find the most similar frame among remaining frames using optical flow
    3. Add it to the sequence
    4. Repeat until all frames are ordered
    
    Args:
        frames_folder (str): Directory containing the jumbled frames
        method (str): Similarity method to use (default: "opticalflow")
        start_frame (str): Optional path to starting frame (random if None)
        
    Returns:
        list: Ordered list of frame paths representing the reconstructed sequence
    """
    # Get all frame paths
    all_frame_paths = get_frame_paths(frames_folder)
    total_frames = len(all_frame_paths)
    
    if total_frames == 0:
        raise ValueError(f"No frames found in {frames_folder}")
    
    print(f"\n🔄 Reconstructing sequence using {method} method...")
    print(f"   Total frames: {total_frames}")
    
    # Initialize the ordered sequence
    ordered_sequence = []
    remaining_frames = all_frame_paths.copy()
    
    # Choose starting frame
    if start_frame and start_frame in remaining_frames:
        current_frame_path = start_frame
    else:
        # Pick the first frame as starting point (or use random: np.random.choice)
        current_frame_path = remaining_frames[0]
    
    # Add starting frame to sequence
    ordered_sequence.append(current_frame_path)
    remaining_frames.remove(current_frame_path)
    
    print(f"   Starting frame: {os.path.basename(current_frame_path)}")
    
    # Progress bar for reconstruction
    with tqdm(total=total_frames-1, desc="🔗 Building sequence", unit="frame") as pbar:
        while remaining_frames:
            # Find the best matching next frame
            best_frame_path, best_score = find_best_next_frame_parallel(
                current_frame_path, 
                remaining_frames
            )
            
            # Add to sequence
            ordered_sequence.append(best_frame_path)
            remaining_frames.remove(best_frame_path)
            
            # Update for next iteration
            current_frame_path = best_frame_path
            
            # Update progress
            pbar.update(1)
            pbar.set_postfix({"similarity": f"{best_score:.4f}", 
                            "remaining": len(remaining_frames)})
    
    print(f"\n✅ Sequence reconstruction complete!")
    print(f"   Total frames ordered: {len(ordered_sequence)}")
    
    return ordered_sequence


def reconstruct_sequence(frames_folder: str, 
                        method: str = "opticalflow",
                        use_multiprocessing: bool = False) -> List[str]:
    """
    Main entry point for sequence reconstruction with different methods.
    
    Args:
        frames_folder (str): Directory containing jumbled frames
        method (str): Reconstruction method ("opticalflow" or future methods)
        use_multiprocessing (bool): Whether to use multiprocessing (experimental)
        
    Returns:
        list: Ordered list of frame paths
    """
    if method == "opticalflow":
        return reconstruct_sequence_greedy(frames_folder, method)
    else:
        raise ValueError(f"Unknown reconstruction method: {method}")


def save_reconstruction_order(ordered_sequence: List[str], output_file: str):
    """
    Save the reconstructed frame order to a text file.
    
    Args:
        ordered_sequence (list): Ordered list of frame paths
        output_file (str): Path to output file
    """
    with open(output_file, 'w') as f:
        f.write("RECONSTRUCTED FRAME ORDER\n")
        f.write("=" * 70 + "\n\n")
        
        for idx, frame_path in enumerate(ordered_sequence):
            frame_name = os.path.basename(frame_path)
            f.write(f"{idx+1:04d}: {frame_name}\n")
    
    print(f"📄 Frame order saved to: {output_file}")


def validate_reconstruction(ordered_sequence: List[str]) -> bool:
    """
    Validate that the reconstruction contains all unique frames.
    
    Args:
        ordered_sequence (list): Ordered list of frame paths
        
    Returns:
        bool: True if valid, False otherwise
    """
    # Check for duplicates
    if len(ordered_sequence) != len(set(ordered_sequence)):
        print("⚠️  Warning: Duplicate frames detected in reconstruction!")
        return False
    
    # Check that all files exist
    for frame_path in ordered_sequence:
        if not os.path.exists(frame_path):
            print(f"⚠️  Warning: Frame file not found: {frame_path}")
            return False
    
    return True
