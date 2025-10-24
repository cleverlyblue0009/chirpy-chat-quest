"""
Frame Extraction Module
=======================
This module handles extracting individual frames from a video file.
"""

import cv2
import os
from typing import Tuple


def extract_frames(video_path: str, output_folder: str) -> Tuple[int, Tuple[int, int]]:
    """
    Extract all frames from a video file and save them as numbered JPEG images.
    
    Args:
        video_path (str): Path to the input video file
        output_folder (str): Directory where frames will be saved
        
    Returns:
        tuple: (frame_count, (width, height)) - Number of frames extracted and frame dimensions
        
    Raises:
        FileNotFoundError: If video file doesn't exist
        ValueError: If video cannot be opened
    """
    # Check if video file exists
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found: {video_path}")
    
    # Create output folder if it doesn't exist
    os.makedirs(output_folder, exist_ok=True)
    
    # Open the video file
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        raise ValueError(f"Could not open video file: {video_path}")
    
    # Get video properties
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    print(f"📹 Video Properties:")
    print(f"   - Total Frames: {total_frames}")
    print(f"   - FPS: {fps}")
    print(f"   - Resolution: {width}x{height}")
    print(f"\n🎬 Extracting frames to: {output_folder}")
    
    frame_count = 0
    
    # Extract frames one by one
    while True:
        ret, frame = cap.read()
        
        if not ret:
            break
        
        # Format frame number with leading zeros (e.g., frame_0001.jpg)
        frame_filename = os.path.join(output_folder, f"frame_{frame_count:04d}.jpg")
        
        # Save frame as JPEG
        cv2.imwrite(frame_filename, frame, [cv2.IMWRITE_JPEG_QUALITY, 95])
        
        frame_count += 1
        
        # Progress indicator
        if frame_count % 30 == 0:
            print(f"   Extracted {frame_count}/{total_frames} frames...", end='\r')
    
    # Release video capture object
    cap.release()
    
    print(f"\n✅ Successfully extracted {frame_count} frames!")
    
    return frame_count, (width, height)


def load_frame(frame_path: str) -> cv2.Mat:
    """
    Load a single frame from disk.
    
    Args:
        frame_path (str): Path to the frame image file
        
    Returns:
        cv2.Mat: The loaded frame as a numpy array
        
    Raises:
        FileNotFoundError: If frame file doesn't exist
    """
    if not os.path.exists(frame_path):
        raise FileNotFoundError(f"Frame file not found: {frame_path}")
    
    frame = cv2.imread(frame_path)
    
    if frame is None:
        raise ValueError(f"Could not read frame: {frame_path}")
    
    return frame


def get_frame_paths(frames_folder: str) -> list:
    """
    Get sorted list of all frame file paths in a directory.
    
    Args:
        frames_folder (str): Directory containing frame images
        
    Returns:
        list: Sorted list of frame file paths
    """
    frame_files = [f for f in os.listdir(frames_folder) if f.endswith(('.jpg', '.png'))]
    frame_files.sort()  # Sort to maintain order
    
    return [os.path.join(frames_folder, f) for f in frame_files]
