"""
Frame Similarity Module

This module implements multiple methods for computing similarity between video frames.
Includes histogram correlation, Mean Squared Error (MSE), and optional feature matching.

Author: AI Assistant
Date: 2025-10-24
"""

import cv2
import numpy as np
from typing import Tuple, Optional


def compute_histogram_similarity(frame1: np.ndarray, frame2: np.ndarray) -> float:
    """
    Compute similarity between two frames using color histogram correlation.
    
    This method compares the color distributions of two frames. Higher values
    indicate more similar frames (range: -1 to 1, where 1 is identical).
    
    Args:
        frame1 (np.ndarray): First frame as BGR image
        frame2 (np.ndarray): Second frame as BGR image
        
    Returns:
        float: Correlation coefficient (higher = more similar)
    """
    
    # Convert to HSV color space (more robust to lighting changes)
    hsv1 = cv2.cvtColor(frame1, cv2.COLOR_BGR2HSV)
    hsv2 = cv2.cvtColor(frame2, cv2.COLOR_BGR2HSV)
    
    # Calculate histogram for each channel
    hist1 = cv2.calcHist([hsv1], [0, 1, 2], None, [8, 8, 8], [0, 180, 0, 256, 0, 256])
    hist2 = cv2.calcHist([hsv2], [0, 1, 2], None, [8, 8, 8], [0, 180, 0, 256, 0, 256])
    
    # Normalize histograms
    hist1 = cv2.normalize(hist1, hist1).flatten()
    hist2 = cv2.normalize(hist2, hist2).flatten()
    
    # Compute correlation (returns value between -1 and 1)
    correlation = cv2.compareHist(hist1, hist2, cv2.HISTCMP_CORREL)
    
    return correlation


def compute_mse(frame1: np.ndarray, frame2: np.ndarray) -> float:
    """
    Compute Mean Squared Error between two frames.
    
    Lower MSE values indicate more similar frames. We return the negative
    to maintain consistency where higher values = more similar.
    
    Args:
        frame1 (np.ndarray): First frame as BGR image
        frame2 (np.ndarray): Second frame as BGR image
        
    Returns:
        float: Negative MSE (higher = more similar, 0 = identical)
    """
    
    # Ensure frames have same dimensions
    if frame1.shape != frame2.shape:
        # Resize frame2 to match frame1
        frame2 = cv2.resize(frame2, (frame1.shape[1], frame1.shape[0]))
    
    # Compute MSE
    mse = np.mean((frame1.astype(float) - frame2.astype(float)) ** 2)
    
    # Return negative MSE (so higher values mean more similar)
    return -mse


def compute_structural_similarity(frame1: np.ndarray, frame2: np.ndarray) -> float:
    """
    Compute structural similarity using edge detection.
    
    This method compares the edge patterns in frames, which is useful for
    detecting changes in scene structure.
    
    Args:
        frame1 (np.ndarray): First frame as BGR image
        frame2 (np.ndarray): Second frame as BGR image
        
    Returns:
        float: Structural similarity score (higher = more similar)
    """
    
    # Convert to grayscale
    gray1 = cv2.cvtColor(frame1, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(frame2, cv2.COLOR_BGR2GRAY)
    
    # Ensure same dimensions
    if gray1.shape != gray2.shape:
        gray2 = cv2.resize(gray2, (gray1.shape[1], gray1.shape[0]))
    
    # Apply Canny edge detection
    edges1 = cv2.Canny(gray1, 50, 150)
    edges2 = cv2.Canny(gray2, 50, 150)
    
    # Compute correlation between edge maps
    edges1_norm = edges1.flatten().astype(float) / 255.0
    edges2_norm = edges2.flatten().astype(float) / 255.0
    
    # Calculate correlation coefficient
    correlation = np.corrcoef(edges1_norm, edges2_norm)[0, 1]
    
    # Handle NaN (occurs when edges are all zeros)
    if np.isnan(correlation):
        correlation = 0.0
    
    return correlation


def compute_feature_similarity(frame1: np.ndarray, frame2: np.ndarray, 
                               method: str = 'ORB') -> float:
    """
    Compute similarity using feature matching (ORB or SIFT).
    
    This is a more advanced method that detects and matches keypoints
    between frames. Useful for detecting similar scenes even with transformations.
    
    Args:
        frame1 (np.ndarray): First frame as BGR image
        frame2 (np.ndarray): Second frame as BGR image
        method (str): Feature detection method ('ORB' or 'SIFT')
        
    Returns:
        float: Feature match score (higher = more similar)
    """
    
    # Convert to grayscale
    gray1 = cv2.cvtColor(frame1, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(frame2, cv2.COLOR_BGR2GRAY)
    
    try:
        if method == 'ORB':
            # Create ORB detector
            detector = cv2.ORB_create(nfeatures=500)
        else:
            # Create SIFT detector (may not be available in all OpenCV builds)
            detector = cv2.SIFT_create()
        
        # Detect keypoints and compute descriptors
        kp1, des1 = detector.detectAndCompute(gray1, None)
        kp2, des2 = detector.detectAndCompute(gray2, None)
        
        # Return 0 if no features found
        if des1 is None or des2 is None or len(des1) == 0 or len(des2) == 0:
            return 0.0
        
        # Create matcher
        if method == 'ORB':
            matcher = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
        else:
            matcher = cv2.BFMatcher(cv2.NORM_L2, crossCheck=True)
        
        # Match descriptors
        matches = matcher.match(des1, des2)
        
        # Calculate match score (normalized by number of keypoints)
        match_score = len(matches) / max(len(kp1), len(kp2))
        
        return match_score
        
    except Exception as e:
        # Fallback if feature detection fails
        print(f"⚠️  Feature matching failed: {e}")
        return 0.0


def frame_similarity(frame1: np.ndarray, frame2: np.ndarray, 
                     method: str = 'combined') -> float:
    """
    Compute overall similarity between two frames using specified method(s).
    
    This is the main function to call for comparing frames. It combines
    multiple similarity metrics for robust comparison.
    
    Args:
        frame1 (np.ndarray): First frame as BGR image
        frame2 (np.ndarray): Second frame as BGR image
        method (str): Similarity method - 'histogram', 'mse', 'structural', 
                     'features', or 'combined' (default)
        
    Returns:
        float: Similarity score (higher = more similar)
    """
    
    if method == 'histogram':
        return compute_histogram_similarity(frame1, frame2)
    
    elif method == 'mse':
        return compute_mse(frame1, frame2)
    
    elif method == 'structural':
        return compute_structural_similarity(frame1, frame2)
    
    elif method == 'features':
        return compute_feature_similarity(frame1, frame2)
    
    elif method == 'combined':
        # Combine multiple methods with weighted average
        hist_sim = compute_histogram_similarity(frame1, frame2)
        struct_sim = compute_structural_similarity(frame1, frame2)
        
        # Weighted combination (histogram is more reliable for video sequences)
        combined_score = 0.7 * hist_sim + 0.3 * struct_sim
        
        return combined_score
    
    else:
        raise ValueError(f"Unknown similarity method: {method}")


def load_frame(frame_path: str) -> Optional[np.ndarray]:
    """
    Load a frame from disk.
    
    Args:
        frame_path (str): Path to the frame image file
        
    Returns:
        np.ndarray or None: Loaded frame or None if loading fails
    """
    
    frame = cv2.imread(frame_path)
    
    if frame is None:
        print(f"⚠️  Failed to load frame: {frame_path}")
        return None
    
    return frame


if __name__ == "__main__":
    # Example usage for testing
    print("This module should be imported, not run directly.")
    print("Use: from src.frame_similarity import frame_similarity")
