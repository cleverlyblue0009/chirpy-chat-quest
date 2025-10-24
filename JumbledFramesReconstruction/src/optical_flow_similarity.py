"""
Optical Flow Similarity Module
================================
This module computes similarity between frames using optical flow analysis.
"""

import cv2
import numpy as np
from typing import Tuple


def optical_flow_similarity(frame1: np.ndarray, frame2: np.ndarray) -> float:
    """
    Calculate similarity between two frames using Farneback optical flow.
    
    The algorithm works by:
    1. Converting frames to grayscale
    2. Computing dense optical flow vectors using Farneback method
    3. Analyzing flow magnitude and direction coherence
    4. Returning a normalized similarity score (0 = different, 1 = very similar)
    
    Args:
        frame1 (np.ndarray): First frame (BGR image)
        frame2 (np.ndarray): Second frame (BGR image)
        
    Returns:
        float: Similarity score between 0 and 1
               Higher values indicate better motion continuity
    """
    # Convert frames to grayscale for optical flow computation
    gray1 = cv2.cvtColor(frame1, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(frame2, cv2.COLOR_BGR2GRAY)
    
    # Compute dense optical flow using Farneback method
    # Parameters explanation:
    # - pyr_scale=0.5: pyramid scale (faster processing)
    # - levels=3: number of pyramid layers
    # - winsize=15: averaging window size
    # - iterations=3: number of iterations at each pyramid level
    # - poly_n=5: size of pixel neighborhood
    # - poly_sigma=1.2: standard deviation for Gaussian smoothing
    # - flags=0: operation flags
    flow = cv2.calcOpticalFlowFarneback(
        gray1, gray2,
        None,
        pyr_scale=0.5,
        levels=3,
        winsize=15,
        iterations=3,
        poly_n=5,
        poly_sigma=1.2,
        flags=0
    )
    
    # Calculate flow magnitude and angle
    magnitude, angle = cv2.cartToPolar(flow[..., 0], flow[..., 1])
    
    # Compute average flow magnitude (how much motion)
    avg_magnitude = np.mean(magnitude)
    
    # Compute flow coherence (consistency of direction)
    # Standard deviation of angles - lower is more coherent
    angle_std = np.std(angle)
    
    # Compute normalized similarity score
    # Lower magnitude and higher coherence = better match
    # Normalize magnitude (typical range: 0-50 pixels)
    magnitude_score = np.exp(-avg_magnitude / 10.0)
    
    # Normalize angle coherence (std deviation range: 0-π)
    coherence_score = np.exp(-angle_std / 1.0)
    
    # Combined similarity score (weighted average)
    # Weight magnitude more heavily as it's more indicative of temporal continuity
    similarity = 0.7 * magnitude_score + 0.3 * coherence_score
    
    return float(similarity)


def compute_flow_field(frame1: np.ndarray, frame2: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """
    Compute the optical flow field between two frames.
    
    Args:
        frame1 (np.ndarray): First frame (BGR image)
        frame2 (np.ndarray): Second frame (BGR image)
        
    Returns:
        tuple: (magnitude, angle) - Flow magnitude and angle arrays
    """
    # Convert to grayscale
    gray1 = cv2.cvtColor(frame1, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(frame2, cv2.COLOR_BGR2GRAY)
    
    # Compute optical flow
    flow = cv2.calcOpticalFlowFarneback(
        gray1, gray2,
        None,
        pyr_scale=0.5,
        levels=3,
        winsize=15,
        iterations=3,
        poly_n=5,
        poly_sigma=1.2,
        flags=0
    )
    
    # Calculate magnitude and angle
    magnitude, angle = cv2.cartToPolar(flow[..., 0], flow[..., 1])
    
    return magnitude, angle


def batch_similarity_computation(frame: np.ndarray, 
                                 candidate_frames: list, 
                                 frame_paths: list) -> list:
    """
    Compute similarity between one frame and multiple candidate frames.
    This function is designed for parallel processing.
    
    Args:
        frame (np.ndarray): Reference frame
        candidate_frames (list): List of candidate frame arrays
        frame_paths (list): Paths to candidate frames (for tracking)
        
    Returns:
        list: List of tuples (frame_path, similarity_score)
    """
    results = []
    
    for candidate_frame, frame_path in zip(candidate_frames, frame_paths):
        similarity = optical_flow_similarity(frame, candidate_frame)
        results.append((frame_path, similarity))
    
    return results


def compare_all_pairs(frames: list) -> np.ndarray:
    """
    Compute similarity matrix for all pairs of frames.
    Warning: This is computationally expensive for large frame sets.
    
    Args:
        frames (list): List of frame arrays
        
    Returns:
        np.ndarray: NxN similarity matrix where N is the number of frames
    """
    n_frames = len(frames)
    similarity_matrix = np.zeros((n_frames, n_frames))
    
    for i in range(n_frames):
        for j in range(n_frames):
            if i == j:
                similarity_matrix[i, j] = 1.0  # Frame is identical to itself
            else:
                similarity_matrix[i, j] = optical_flow_similarity(frames[i], frames[j])
    
    return similarity_matrix
