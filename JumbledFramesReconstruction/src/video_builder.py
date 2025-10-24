"""
Video Builder Module
====================
This module handles creating a video file from an ordered sequence of frames.
"""

import cv2
import os
from tqdm import tqdm
from typing import List, Tuple
from .extract_frames import load_frame


def create_video(ordered_frames: List[str], 
                output_path: str, 
                fps: int = 30,
                codec: str = 'mp4v') -> bool:
    """
    Create a video file from an ordered sequence of frame images.
    
    Args:
        ordered_frames (list): List of frame paths in correct order
        output_path (str): Path where the output video will be saved
        fps (int): Frames per second for the output video (default: 30)
        codec (str): Video codec to use (default: 'mp4v' for MP4)
        
    Returns:
        bool: True if successful, False otherwise
    """
    if not ordered_frames:
        print("❌ Error: No frames provided for video creation")
        return False
    
    print(f"\n🎬 Creating video from {len(ordered_frames)} frames...")
    print(f"   Output: {output_path}")
    print(f"   FPS: {fps}")
    
    # Load first frame to get dimensions
    first_frame = load_frame(ordered_frames[0])
    height, width, _ = first_frame.shape
    
    print(f"   Resolution: {width}x{height}")
    
    # Create output directory if it doesn't exist
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Initialize video writer
    fourcc = cv2.VideoWriter_fourcc(*codec)
    video_writer = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    if not video_writer.isOpened():
        print(f"❌ Error: Could not create video writer for {output_path}")
        return False
    
    # Write frames to video with progress bar
    with tqdm(total=len(ordered_frames), desc="✍️  Writing frames", unit="frame") as pbar:
        for frame_path in ordered_frames:
            try:
                frame = load_frame(frame_path)
                
                # Ensure frame has correct dimensions
                if frame.shape[:2] != (height, width):
                    frame = cv2.resize(frame, (width, height))
                
                video_writer.write(frame)
                pbar.update(1)
                
            except Exception as e:
                print(f"\n⚠️  Warning: Could not process frame {frame_path}: {e}")
                continue
    
    # Release video writer
    video_writer.release()
    
    # Verify output file exists
    if os.path.exists(output_path):
        file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
        print(f"\n✅ Video created successfully!")
        print(f"   File: {output_path}")
        print(f"   Size: {file_size_mb:.2f} MB")
        print(f"   Duration: {len(ordered_frames) / fps:.2f} seconds")
        return True
    else:
        print(f"\n❌ Error: Video file was not created at {output_path}")
        return False


def create_comparison_video(original_frames: List[str],
                           reconstructed_frames: List[str],
                           output_path: str,
                           fps: int = 30) -> bool:
    """
    Create a side-by-side comparison video of original vs reconstructed sequence.
    
    Args:
        original_frames (list): Original frame sequence
        reconstructed_frames (list): Reconstructed frame sequence
        output_path (str): Output video path
        fps (int): Frames per second
        
    Returns:
        bool: True if successful
    """
    if len(original_frames) != len(reconstructed_frames):
        print("⚠️  Warning: Frame count mismatch in comparison video")
        return False
    
    print(f"\n🎬 Creating comparison video...")
    
    # Load first frames to get dimensions
    first_orig = load_frame(original_frames[0])
    first_recon = load_frame(reconstructed_frames[0])
    
    height, width, _ = first_orig.shape
    
    # Create side-by-side canvas
    combined_width = width * 2
    
    # Initialize video writer
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    video_writer = cv2.VideoWriter(output_path, fourcc, fps, (combined_width, height))
    
    if not video_writer.isOpened():
        return False
    
    # Write comparison frames
    with tqdm(total=len(original_frames), desc="Creating comparison", unit="frame") as pbar:
        for orig_path, recon_path in zip(original_frames, reconstructed_frames):
            orig_frame = load_frame(orig_path)
            recon_frame = load_frame(recon_path)
            
            # Resize if needed
            if orig_frame.shape[:2] != (height, width):
                orig_frame = cv2.resize(orig_frame, (width, height))
            if recon_frame.shape[:2] != (height, width):
                recon_frame = cv2.resize(recon_frame, (width, height))
            
            # Combine side by side
            combined = cv2.hconcat([orig_frame, recon_frame])
            
            # Add labels
            cv2.putText(combined, "Original", (10, 30), 
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            cv2.putText(combined, "Reconstructed", (width + 10, 30),
                       cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 2)
            
            video_writer.write(combined)
            pbar.update(1)
    
    video_writer.release()
    
    print(f"✅ Comparison video saved to: {output_path}")
    return True


def extract_video_info(video_path: str) -> dict:
    """
    Extract metadata information from a video file.
    
    Args:
        video_path (str): Path to video file
        
    Returns:
        dict: Video metadata
    """
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        return None
    
    info = {
        'frame_count': int(cap.get(cv2.CAP_PROP_FRAME_COUNT)),
        'fps': cap.get(cv2.CAP_PROP_FPS),
        'width': int(cap.get(cv2.CAP_PROP_FRAME_WIDTH)),
        'height': int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT)),
        'duration': int(cap.get(cv2.CAP_PROP_FRAME_COUNT)) / cap.get(cv2.CAP_PROP_FPS)
    }
    
    cap.release()
    return info
