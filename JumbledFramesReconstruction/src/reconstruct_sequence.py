"""
Sequence Reconstruction Module

This module implements the core algorithm for reconstructing the original frame order
from shuffled frames. Uses a greedy nearest-neighbor approach with multiprocessing
for efficiency.

Author: AI Assistant
Date: 2025-10-24
"""

import os
import numpy as np
from typing import List, Tuple, Optional
from tqdm import tqdm
from concurrent.futures import ProcessPoolExecutor, as_completed
import cv2

from src.frame_similarity import frame_similarity, load_frame


def compute_similarity_pair(args: Tuple[str, str, str]) -> Tuple[int, int, float]:
    """
    Compute similarity between two frames (used for parallel processing).
    
    Args:
        args: Tuple of (frame1_path, frame2_path, method)
        
    Returns:
        Tuple[int, int, float]: (frame1_idx, frame2_idx, similarity_score)
    """
    frame1_path, frame2_path, idx1, idx2, method = args
    
    frame1 = load_frame(frame1_path)
    frame2 = load_frame(frame2_path)
    
    if frame1 is None or frame2 is None:
        return (idx1, idx2, 0.0)
    
    similarity = frame_similarity(frame1, frame2, method=method)
    
    return (idx1, idx2, similarity)


def compute_similarity_matrix(frame_paths: List[str], 
                              method: str = 'combined',
                              use_multiprocessing: bool = True,
                              max_workers: int = None) -> np.ndarray:
    """
    Compute pairwise similarity matrix for all frames.
    
    This creates an NxN matrix where element [i,j] represents the similarity
    between frame i and frame j. Uses multiprocessing for speed.
    
    Args:
        frame_paths (List[str]): List of paths to frame images
        method (str): Similarity computation method
        use_multiprocessing (bool): Whether to use parallel processing
        max_workers (int): Number of worker processes (None = auto)
        
    Returns:
        np.ndarray: NxN similarity matrix
    """
    
    n_frames = len(frame_paths)
    similarity_matrix = np.zeros((n_frames, n_frames))
    
    print(f"🧮 Computing similarity matrix for {n_frames} frames...")
    
    # Diagonal is always 1 (frame is identical to itself)
    np.fill_diagonal(similarity_matrix, 1.0)
    
    # Prepare pairs to compare (only upper triangle, since matrix is symmetric)
    pairs = []
    for i in range(n_frames):
        for j in range(i + 1, n_frames):
            pairs.append((frame_paths[i], frame_paths[j], i, j, method))
    
    total_comparisons = len(pairs)
    
    if use_multiprocessing and total_comparisons > 100:
        # Use multiprocessing for large datasets
        print(f"⚡ Using multiprocessing with {max_workers or 'auto'} workers")
        
        with ProcessPoolExecutor(max_workers=max_workers) as executor:
            futures = [executor.submit(compute_similarity_pair, pair) for pair in pairs]
            
            with tqdm(total=total_comparisons, desc="Computing similarities", unit="pair") as pbar:
                for future in as_completed(futures):
                    i, j, similarity = future.result()
                    similarity_matrix[i, j] = similarity
                    similarity_matrix[j, i] = similarity  # Symmetric
                    pbar.update(1)
    else:
        # Sequential processing for small datasets
        print(f"🔄 Using sequential processing")
        
        with tqdm(total=total_comparisons, desc="Computing similarities", unit="pair") as pbar:
            for pair in pairs:
                i, j, similarity = compute_similarity_pair(pair)
                similarity_matrix[i, j] = similarity
                similarity_matrix[j, i] = similarity  # Symmetric
                pbar.update(1)
    
    print(f"✅ Similarity matrix computed")
    
    return similarity_matrix


def greedy_nearest_neighbor(similarity_matrix: np.ndarray, 
                            start_idx: Optional[int] = None) -> List[int]:
    """
    Reconstruct frame sequence using greedy nearest-neighbor algorithm.
    
    Algorithm:
    1. Start with a random frame (or specified start frame)
    2. Find the most similar unvisited frame
    3. Add it to the sequence
    4. Repeat until all frames are ordered
    
    Args:
        similarity_matrix (np.ndarray): NxN similarity matrix
        start_idx (int, optional): Index of starting frame (None = random)
        
    Returns:
        List[int]: Ordered list of frame indices
    """
    
    n_frames = similarity_matrix.shape[0]
    
    # Initialize
    used = np.zeros(n_frames, dtype=bool)
    sequence = []
    
    # Choose starting frame
    if start_idx is None:
        current_idx = np.random.randint(0, n_frames)
    else:
        current_idx = start_idx
    
    sequence.append(current_idx)
    used[current_idx] = True
    
    print(f"🎯 Starting greedy reconstruction from frame {current_idx}")
    
    # Greedy selection
    with tqdm(total=n_frames - 1, desc="Reconstructing sequence", unit="frame") as pbar:
        while len(sequence) < n_frames:
            # Get similarities from current frame to all other frames
            similarities = similarity_matrix[current_idx].copy()
            
            # Mask already used frames
            similarities[used] = -np.inf
            
            # Find most similar unused frame
            next_idx = np.argmax(similarities)
            
            # Add to sequence
            sequence.append(next_idx)
            used[next_idx] = True
            current_idx = next_idx
            
            pbar.update(1)
    
    print(f"✅ Sequence reconstruction complete: {len(sequence)} frames ordered")
    
    return sequence


def reconstruct_sequence(frames_folder: str, 
                        method: str = 'combined',
                        use_multiprocessing: bool = True,
                        start_idx: Optional[int] = None) -> Tuple[List[str], np.ndarray]:
    """
    Main function to reconstruct the original sequence of shuffled frames.
    
    This is the high-level function that orchestrates the entire reconstruction
    process: loading frames, computing similarities, and ordering frames.
    
    Args:
        frames_folder (str): Path to folder containing extracted frames
        method (str): Similarity computation method
        use_multiprocessing (bool): Whether to use parallel processing
        start_idx (int, optional): Index of starting frame
        
    Returns:
        Tuple[List[str], np.ndarray]: (ordered_frame_paths, similarity_matrix)
        
    Raises:
        FileNotFoundError: If frames folder doesn't exist
        ValueError: If no frames found in folder
    """
    
    # Validate input
    if not os.path.exists(frames_folder):
        raise FileNotFoundError(f"Frames folder not found: {frames_folder}")
    
    # Get all frame files
    frame_files = sorted([f for f in os.listdir(frames_folder) if f.endswith('.jpg')])
    
    if len(frame_files) == 0:
        raise ValueError(f"No frames found in: {frames_folder}")
    
    print(f"📂 Found {len(frame_files)} frames in {frames_folder}")
    
    # Build full paths
    frame_paths = [os.path.join(frames_folder, f) for f in frame_files]
    
    # Compute similarity matrix
    similarity_matrix = compute_similarity_matrix(
        frame_paths, 
        method=method,
        use_multiprocessing=use_multiprocessing
    )
    
    # Reconstruct sequence using greedy algorithm
    ordered_indices = greedy_nearest_neighbor(similarity_matrix, start_idx=start_idx)
    
    # Build ordered frame paths
    ordered_frame_paths = [frame_paths[idx] for idx in ordered_indices]
    
    return ordered_frame_paths, similarity_matrix


if __name__ == "__main__":
    # Example usage for testing
    print("This module should be imported, not run directly.")
    print("Use: from src.reconstruct_sequence import reconstruct_sequence")
