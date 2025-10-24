"""
Video Builder Module

This module handles creating a video file from an ordered sequence of frames.
Uses OpenCV's VideoWriter to encode frames into a standard MP4 video.

Author: AI Assistant
Date: 2025-10-24
"""

import cv2
import os
from typing import List, Tuple
from tqdm import tqdm


def create_video(ordered_frames: List[str], 
                output_path: str, 
                fps: int = 30,
                codec: str = 'mp4v') -> bool:
    """
    Create a video file from an ordered list of frame images.
    
    This function reads frames in the specified order and encodes them into
    a video file with the given FPS (frames per second).
    
    Args:
        ordered_frames (List[str]): List of frame file paths in desired order
        output_path (str): Path where output video will be saved (e.g., 'output.mp4')
        fps (int): Frames per second for output video (default: 30)
        codec (str): Video codec to use (default: 'mp4v' for MP4)
        
    Returns:
        bool: True if video creation succeeded, False otherwise
        
    Raises:
        ValueError: If ordered_frames is empty or frames have inconsistent sizes
    """
    
    if len(ordered_frames) == 0:
        raise ValueError("Cannot create video: ordered_frames list is empty")
    
    print(f"🎬 Creating video from {len(ordered_frames)} frames...")
    print(f"📹 Output: {output_path}")
    print(f"⚙️  Settings: {fps} FPS, codec: {codec}")
    
    # Read first frame to get dimensions
    first_frame = cv2.imread(ordered_frames[0])
    
    if first_frame is None:
        raise ValueError(f"Cannot read first frame: {ordered_frames[0]}")
    
    height, width, _ = first_frame.shape
    print(f"📐 Video dimensions: {width}x{height}")
    
    # Create output directory if needed
    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
    
    # Initialize VideoWriter
    fourcc = cv2.VideoWriter_fourcc(*codec)
    out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))
    
    if not out.isOpened():
        raise ValueError(f"Failed to create video writer for: {output_path}")
    
    # Write frames with progress bar
    frames_written = 0
    frames_skipped = 0
    
    with tqdm(total=len(ordered_frames), desc="Writing video", unit="frame") as pbar:
        for frame_path in ordered_frames:
            # Read frame
            frame = cv2.imread(frame_path)
            
            if frame is None:
                print(f"⚠️  Skipping unreadable frame: {frame_path}")
                frames_skipped += 1
                pbar.update(1)
                continue
            
            # Check dimensions match
            if frame.shape[:2] != (height, width):
                # Resize if dimensions don't match
                frame = cv2.resize(frame, (width, height))
            
            # Write frame to video
            out.write(frame)
            frames_written += 1
            
            pbar.update(1)
    
    # Release VideoWriter
    out.release()
    
    # Report results
    print(f"✅ Video created successfully: {output_path}")
    print(f"📊 Stats: {frames_written} frames written, {frames_skipped} frames skipped")
    
    # Verify output file exists and has size
    if os.path.exists(output_path):
        file_size_mb = os.path.getsize(output_path) / (1024 * 1024)
        print(f"💾 File size: {file_size_mb:.2f} MB")
        return True
    else:
        print(f"❌ Error: Output file not created")
        return False


def validate_video(video_path: str) -> bool:
    """
    Validate that a video file can be opened and has frames.
    
    Args:
        video_path (str): Path to video file to validate
        
    Returns:
        bool: True if video is valid, False otherwise
    """
    
    if not os.path.exists(video_path):
        print(f"❌ Video file does not exist: {video_path}")
        return False
    
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        print(f"❌ Cannot open video file: {video_path}")
        return False
    
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    cap.release()
    
    print(f"✅ Video validation passed:")
    print(f"   - Frames: {total_frames}")
    print(f"   - FPS: {fps}")
    print(f"   - Resolution: {width}x{height}")
    
    return total_frames > 0


def compare_videos(original_path: str, reconstructed_path: str) -> dict:
    """
    Compare properties of original and reconstructed videos.
    
    Args:
        original_path (str): Path to original video
        reconstructed_path (str): Path to reconstructed video
        
    Returns:
        dict: Comparison statistics
    """
    
    print("📊 Comparing videos...")
    
    # Open both videos
    cap_orig = cv2.VideoCapture(original_path)
    cap_recon = cv2.VideoCapture(reconstructed_path)
    
    if not cap_orig.isOpened() or not cap_recon.isOpened():
        print("❌ Cannot open one or both videos for comparison")
        return {}
    
    # Get properties
    stats = {
        'original_frames': int(cap_orig.get(cv2.CAP_PROP_FRAME_COUNT)),
        'reconstructed_frames': int(cap_recon.get(cv2.CAP_PROP_FRAME_COUNT)),
        'original_fps': cap_orig.get(cv2.CAP_PROP_FPS),
        'reconstructed_fps': cap_recon.get(cv2.CAP_PROP_FPS),
        'original_resolution': (
            int(cap_orig.get(cv2.CAP_PROP_FRAME_WIDTH)),
            int(cap_orig.get(cv2.CAP_PROP_FRAME_HEIGHT))
        ),
        'reconstructed_resolution': (
            int(cap_recon.get(cv2.CAP_PROP_FRAME_WIDTH)),
            int(cap_recon.get(cv2.CAP_PROP_FRAME_HEIGHT))
        )
    }
    
    cap_orig.release()
    cap_recon.release()
    
    # Print comparison
    print(f"   Original: {stats['original_frames']} frames @ {stats['original_fps']} FPS")
    print(f"   Reconstructed: {stats['reconstructed_frames']} frames @ {stats['reconstructed_fps']} FPS")
    print(f"   Match: {'✅ Yes' if stats['original_frames'] == stats['reconstructed_frames'] else '❌ No'}")
    
    return stats


if __name__ == "__main__":
    # Example usage for testing
    print("This module should be imported, not run directly.")
    print("Use: from src.video_builder import create_video")
