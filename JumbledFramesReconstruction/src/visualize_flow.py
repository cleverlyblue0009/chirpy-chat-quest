"""
Optical Flow Visualization Module
===================================
This module provides functions to visualize optical flow fields and create
similarity heatmaps for analysis.
"""

import cv2
import numpy as np
import matplotlib.pyplot as plt
from typing import Tuple, List
from .optical_flow_similarity import compute_flow_field
from .extract_frames import load_frame


def visualize_optical_flow(frame1: np.ndarray, 
                           frame2: np.ndarray, 
                           output_path: str) -> bool:
    """
    Visualize optical flow between two frames using HSV color encoding.
    
    Flow direction is encoded as hue (color), and magnitude as value (brightness).
    
    Args:
        frame1 (np.ndarray): First frame
        frame2 (np.ndarray): Second frame
        output_path (str): Path to save visualization
        
    Returns:
        bool: True if successful
    """
    print(f"\n🎨 Creating optical flow visualization...")
    
    # Compute optical flow
    magnitude, angle = compute_flow_field(frame1, frame2)
    
    # Create HSV image for visualization
    hsv = np.zeros((frame1.shape[0], frame1.shape[1], 3), dtype=np.uint8)
    
    # Hue represents direction (0-180 in OpenCV)
    hsv[..., 0] = angle * 180 / np.pi / 2
    
    # Saturation is set to maximum (255)
    hsv[..., 1] = 255
    
    # Value (brightness) represents magnitude
    # Normalize magnitude to 0-255 range
    hsv[..., 2] = cv2.normalize(magnitude, None, 0, 255, cv2.NORM_MINMAX)
    
    # Convert HSV to BGR for saving
    flow_bgr = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
    
    # Create a side-by-side comparison
    h, w = frame1.shape[:2]
    
    # Resize frames for visualization if too large
    max_width = 640
    if w > max_width:
        scale = max_width / w
        new_h = int(h * scale)
        frame1_resized = cv2.resize(frame1, (max_width, new_h))
        frame2_resized = cv2.resize(frame2, (max_width, new_h))
        flow_bgr_resized = cv2.resize(flow_bgr, (max_width, new_h))
    else:
        frame1_resized = frame1
        frame2_resized = frame2
        flow_bgr_resized = flow_bgr
    
    # Create 3-panel visualization
    combined = cv2.hconcat([frame1_resized, frame2_resized, flow_bgr_resized])
    
    # Add labels
    font = cv2.FONT_HERSHEY_SIMPLEX
    cv2.putText(combined, "Frame 1", (10, 30), font, 0.7, (255, 255, 255), 2)
    cv2.putText(combined, "Frame 2", (frame1_resized.shape[1] + 10, 30), 
                font, 0.7, (255, 255, 255), 2)
    cv2.putText(combined, "Optical Flow", (2 * frame1_resized.shape[1] + 10, 30), 
                font, 0.7, (255, 255, 255), 2)
    
    # Add flow statistics
    avg_magnitude = np.mean(magnitude)
    max_magnitude = np.max(magnitude)
    stats_text = f"Avg Flow: {avg_magnitude:.2f}px | Max: {max_magnitude:.2f}px"
    cv2.putText(combined, stats_text, (10, combined.shape[0] - 10),
                font, 0.5, (255, 255, 0), 1)
    
    # Save visualization
    cv2.imwrite(output_path, combined)
    
    print(f"✅ Flow visualization saved to: {output_path}")
    print(f"   Average flow magnitude: {avg_magnitude:.2f} pixels")
    print(f"   Max flow magnitude: {max_magnitude:.2f} pixels")
    
    return True


def create_flow_vectors_visualization(frame1: np.ndarray,
                                      frame2: np.ndarray,
                                      output_path: str,
                                      step: int = 16) -> bool:
    """
    Create a visualization with flow vectors overlaid on the frame.
    
    Args:
        frame1 (np.ndarray): First frame
        frame2 (np.ndarray): Second frame
        output_path (str): Path to save visualization
        step (int): Spacing between flow vectors
        
    Returns:
        bool: True if successful
    """
    # Convert to grayscale
    gray1 = cv2.cvtColor(frame1, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(frame2, cv2.COLOR_BGR2GRAY)
    
    # Compute optical flow
    flow = cv2.calcOpticalFlowFarneback(
        gray1, gray2, None,
        pyr_scale=0.5, levels=3, winsize=15,
        iterations=3, poly_n=5, poly_sigma=1.2, flags=0
    )
    
    # Create output image
    vis = frame1.copy()
    h, w = frame1.shape[:2]
    
    # Draw flow vectors
    for y in range(0, h, step):
        for x in range(0, w, step):
            fx, fy = flow[y, x]
            
            # Skip very small movements
            if np.sqrt(fx**2 + fy**2) < 1.0:
                continue
            
            # Draw arrow
            end_x = int(x + fx)
            end_y = int(y + fy)
            cv2.arrowedLine(vis, (x, y), (end_x, end_y), (0, 255, 0), 1, 
                          tipLength=0.3)
    
    cv2.imwrite(output_path, vis)
    print(f"✅ Vector visualization saved to: {output_path}")
    
    return True


def create_similarity_heatmap(frame_paths: List[str], 
                              output_path: str,
                              sample_size: int = 50) -> bool:
    """
    Create a heatmap showing pairwise similarities between frames.
    
    Note: This is computationally expensive, so we sample a subset of frames.
    
    Args:
        frame_paths (list): List of all frame paths
        output_path (str): Path to save heatmap
        sample_size (int): Number of frames to sample for analysis
        
    Returns:
        bool: True if successful
    """
    print(f"\n📊 Creating similarity heatmap...")
    print(f"   Sampling {sample_size} frames for analysis...")
    
    # Sample frames if there are too many
    if len(frame_paths) > sample_size:
        indices = np.linspace(0, len(frame_paths)-1, sample_size, dtype=int)
        sampled_paths = [frame_paths[i] for i in indices]
    else:
        sampled_paths = frame_paths
    
    # Load sampled frames
    frames = [load_frame(path) for path in sampled_paths]
    n_frames = len(frames)
    
    # Import here to avoid circular dependency
    from .optical_flow_similarity import optical_flow_similarity
    
    # Compute similarity matrix
    similarity_matrix = np.zeros((n_frames, n_frames))
    
    total_comparisons = (n_frames * (n_frames - 1)) // 2
    comparison_count = 0
    
    print(f"   Computing {total_comparisons} pairwise similarities...")
    
    for i in range(n_frames):
        similarity_matrix[i, i] = 1.0  # Self-similarity
        for j in range(i + 1, n_frames):
            sim = optical_flow_similarity(frames[i], frames[j])
            similarity_matrix[i, j] = sim
            similarity_matrix[j, i] = sim  # Symmetric
            
            comparison_count += 1
            if comparison_count % 100 == 0:
                print(f"   Progress: {comparison_count}/{total_comparisons}", end='\r')
    
    print(f"\n   Completed all comparisons!")
    
    # Create heatmap using matplotlib
    plt.figure(figsize=(10, 8))
    plt.imshow(similarity_matrix, cmap='hot', interpolation='nearest')
    plt.colorbar(label='Optical Flow Similarity')
    plt.title('Frame-to-Frame Similarity Heatmap\n(Higher values = more similar motion)')
    plt.xlabel('Frame Index')
    plt.ylabel('Frame Index')
    
    # Save heatmap
    plt.savefig(output_path, dpi=150, bbox_inches='tight')
    plt.close()
    
    print(f"✅ Similarity heatmap saved to: {output_path}")
    
    # Print statistics
    avg_similarity = np.mean(similarity_matrix[np.triu_indices(n_frames, k=1)])
    max_similarity = np.max(similarity_matrix[np.triu_indices(n_frames, k=1)])
    min_similarity = np.min(similarity_matrix[np.triu_indices(n_frames, k=1)])
    
    print(f"   Average similarity: {avg_similarity:.4f}")
    print(f"   Max similarity: {max_similarity:.4f}")
    print(f"   Min similarity: {min_similarity:.4f}")
    
    return True


def visualize_reconstruction_quality(ordered_frames: List[str],
                                    output_folder: str,
                                    num_samples: int = 10) -> bool:
    """
    Visualize the quality of reconstruction by showing optical flow
    between consecutive frames in the reconstructed sequence.
    
    Args:
        ordered_frames (list): Reconstructed frame sequence
        output_folder (str): Folder to save visualizations
        num_samples (int): Number of consecutive pairs to visualize
        
    Returns:
        bool: True if successful
    """
    import os
    
    print(f"\n🔍 Visualizing reconstruction quality...")
    
    # Sample evenly spaced frame pairs
    total_frames = len(ordered_frames)
    indices = np.linspace(0, total_frames - 2, num_samples, dtype=int)
    
    for idx, i in enumerate(indices):
        frame1 = load_frame(ordered_frames[i])
        frame2 = load_frame(ordered_frames[i + 1])
        
        output_path = os.path.join(output_folder, f"flow_pair_{idx+1:02d}.png")
        visualize_optical_flow(frame1, frame2, output_path)
    
    print(f"✅ Created {num_samples} quality visualization samples")
    
    return True
