"""
Frame Extraction Module

This module handles extracting individual frames from a shuffled video file.
It uses OpenCV to read the video and save each frame as a numbered JPEG image.

Author: AI Assistant
Date: 2025-10-24
"""

import cv2
import os
from tqdm import tqdm
from typing import Tuple


def extract_frames(video_path: str, output_folder: str) -> Tuple[int, int, int]:
    """
    Extract all frames from a video file and save them as individual images.
    
    Args:
        video_path (str): Path to the input video file (e.g., 'jumbled_video.mp4')
        output_folder (str): Directory where extracted frames will be saved
        
    Returns:
        Tuple[int, int, int]: (total_frames, frame_width, frame_height)
        
    Raises:
        FileNotFoundError: If the video file doesn't exist
        ValueError: If the video cannot be opened or has no frames
    """
    
    # Validate input video exists
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found: {video_path}")
    
    # Create output directory if it doesn't exist
    os.makedirs(output_folder, exist_ok=True)
    
    print(f"📹 Opening video: {video_path}")
    
    # Open the video file
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        raise ValueError(f"Failed to open video file: {video_path}")
    
    # Get video properties
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = int(cap.get(cv2.CAP_PROP_FPS))
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    print(f"📊 Video Info: {total_frames} frames, {fps} FPS, {width}x{height} resolution")
    
    if total_frames == 0:
        raise ValueError("Video has no frames to extract")
    
    # Extract frames with progress bar
    print(f"🎬 Extracting frames to: {output_folder}")
    
    frame_count = 0
    with tqdm(total=total_frames, desc="Extracting frames", unit="frame") as pbar:
        while True:
            ret, frame = cap.read()
            
            if not ret:
                break
            
            # Generate padded filename (e.g., frame_0001.jpg, frame_0002.jpg)
            frame_filename = os.path.join(output_folder, f"frame_{frame_count:04d}.jpg")
            
            # Save frame as JPEG
            cv2.imwrite(frame_filename, frame)
            
            frame_count += 1
            pbar.update(1)
    
    # Release video capture object
    cap.release()
    
    print(f"✅ Successfully extracted {frame_count} frames")
    
    return frame_count, width, height


def validate_extracted_frames(frames_folder: str, expected_count: int = None) -> bool:
    """
    Validate that frames were extracted correctly.
    
    Args:
        frames_folder (str): Path to folder containing extracted frames
        expected_count (int, optional): Expected number of frames
        
    Returns:
        bool: True if validation passes, False otherwise
    """
    
    if not os.path.exists(frames_folder):
        print(f"❌ Frames folder does not exist: {frames_folder}")
        return False
    
    frame_files = sorted([f for f in os.listdir(frames_folder) if f.endswith('.jpg')])
    actual_count = len(frame_files)
    
    print(f"🔍 Found {actual_count} frame files in {frames_folder}")
    
    if expected_count and actual_count != expected_count:
        print(f"⚠️  Warning: Expected {expected_count} frames but found {actual_count}")
        return False
    
    # Check that at least one frame can be read
    if actual_count > 0:
        test_frame_path = os.path.join(frames_folder, frame_files[0])
        test_frame = cv2.imread(test_frame_path)
        
        if test_frame is None:
            print(f"❌ Cannot read frame file: {test_frame_path}")
            return False
    
    print(f"✅ Frame validation passed")
    return True


if __name__ == "__main__":
    # Example usage for testing
    print("This module should be imported, not run directly.")
    print("Use: from src.extract_frames import extract_frames")
