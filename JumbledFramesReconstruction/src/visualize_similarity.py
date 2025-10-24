"""
Visualization Module

This module creates visual representations of the frame similarity matrix
and reconstruction results. Generates heatmaps and charts for analysis.

Author: AI Assistant
Date: 2025-10-24
"""

import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
import os
from typing import Optional, List


def plot_similarity_heatmap(similarity_matrix: np.ndarray, 
                           output_path: str,
                           title: str = "Frame Similarity Matrix",
                           figsize: tuple = (12, 10)) -> None:
    """
    Create and save a heatmap visualization of the frame similarity matrix.
    
    This visualization helps understand which frames are similar to each other.
    Bright colors indicate high similarity, dark colors indicate low similarity.
    
    Args:
        similarity_matrix (np.ndarray): NxN matrix of frame similarities
        output_path (str): Path to save the heatmap image
        title (str): Title for the plot
        figsize (tuple): Figure size (width, height) in inches
    """
    
    print(f"📊 Generating similarity heatmap...")
    
    # Create output directory if needed
    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
    
    # Create figure
    plt.figure(figsize=figsize)
    
    # Create heatmap
    sns.heatmap(
        similarity_matrix,
        cmap='viridis',
        cbar_kws={'label': 'Similarity Score'},
        square=True,
        xticklabels=False,  # Hide tick labels for clarity with many frames
        yticklabels=False
    )
    
    plt.title(title, fontsize=16, fontweight='bold')
    plt.xlabel('Frame Index', fontsize=12)
    plt.ylabel('Frame Index', fontsize=12)
    
    # Add text annotation
    n_frames = similarity_matrix.shape[0]
    plt.text(
        0.5, -0.08, 
        f'Matrix Size: {n_frames}×{n_frames} frames',
        ha='center', va='top', transform=plt.gca().transAxes,
        fontsize=10, style='italic'
    )
    
    plt.tight_layout()
    
    # Save figure
    plt.savefig(output_path, dpi=150, bbox_inches='tight')
    plt.close()
    
    print(f"✅ Heatmap saved to: {output_path}")


def plot_similarity_statistics(similarity_matrix: np.ndarray,
                               output_path: str) -> None:
    """
    Create statistical plots of the similarity distribution.
    
    Args:
        similarity_matrix (np.ndarray): NxN matrix of frame similarities
        output_path (str): Path to save the plot
    """
    
    print(f"📊 Generating similarity statistics...")
    
    # Create output directory if needed
    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
    
    # Extract upper triangle (excluding diagonal) for statistics
    n_frames = similarity_matrix.shape[0]
    upper_triangle_indices = np.triu_indices(n_frames, k=1)
    similarities = similarity_matrix[upper_triangle_indices]
    
    # Create figure with subplots
    fig, axes = plt.subplots(2, 2, figsize=(14, 10))
    fig.suptitle('Frame Similarity Statistics', fontsize=16, fontweight='bold')
    
    # 1. Histogram
    axes[0, 0].hist(similarities, bins=50, edgecolor='black', alpha=0.7)
    axes[0, 0].set_xlabel('Similarity Score')
    axes[0, 0].set_ylabel('Frequency')
    axes[0, 0].set_title('Distribution of Frame Similarities')
    axes[0, 0].axvline(np.mean(similarities), color='red', linestyle='--', 
                       label=f'Mean: {np.mean(similarities):.3f}')
    axes[0, 0].legend()
    
    # 2. Box plot
    axes[0, 1].boxplot(similarities, vert=True)
    axes[0, 1].set_ylabel('Similarity Score')
    axes[0, 1].set_title('Box Plot of Similarities')
    axes[0, 1].grid(axis='y', alpha=0.3)
    
    # 3. Max similarity per frame
    max_similarities = []
    for i in range(n_frames):
        row_sims = similarity_matrix[i].copy()
        row_sims[i] = -np.inf  # Exclude self-similarity
        max_similarities.append(np.max(row_sims))
    
    axes[1, 0].plot(max_similarities, linewidth=1)
    axes[1, 0].set_xlabel('Frame Index')
    axes[1, 0].set_ylabel('Max Similarity to Other Frames')
    axes[1, 0].set_title('Maximum Similarity per Frame')
    axes[1, 0].grid(alpha=0.3)
    
    # 4. Statistics table
    axes[1, 1].axis('off')
    stats_text = f"""
    Statistical Summary
    {'=' * 40}
    
    Total Frames:        {n_frames}
    Total Comparisons:   {len(similarities):,}
    
    Mean Similarity:     {np.mean(similarities):.4f}
    Median Similarity:   {np.median(similarities):.4f}
    Std Deviation:       {np.std(similarities):.4f}
    
    Min Similarity:      {np.min(similarities):.4f}
    Max Similarity:      {np.max(similarities):.4f}
    
    25th Percentile:     {np.percentile(similarities, 25):.4f}
    75th Percentile:     {np.percentile(similarities, 75):.4f}
    """
    
    axes[1, 1].text(0.1, 0.9, stats_text, transform=axes[1, 1].transAxes,
                   fontsize=11, verticalalignment='top', fontfamily='monospace')
    
    plt.tight_layout()
    
    # Save figure
    plt.savefig(output_path, dpi=150, bbox_inches='tight')
    plt.close()
    
    print(f"✅ Statistics plot saved to: {output_path}")


def plot_reconstruction_path(similarity_matrix: np.ndarray,
                            sequence: List[int],
                            output_path: str) -> None:
    """
    Visualize the path taken through the similarity matrix during reconstruction.
    
    Args:
        similarity_matrix (np.ndarray): NxN matrix of frame similarities
        sequence (List[int]): Ordered list of frame indices
        output_path (str): Path to save the visualization
    """
    
    print(f"📊 Generating reconstruction path visualization...")
    
    # Create output directory if needed
    output_dir = os.path.dirname(output_path)
    if output_dir and not os.path.exists(output_dir):
        os.makedirs(output_dir, exist_ok=True)
    
    # Create figure
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(16, 7))
    fig.suptitle('Reconstruction Path Analysis', fontsize=16, fontweight='bold')
    
    # 1. Heatmap with reconstruction path overlay
    sns.heatmap(
        similarity_matrix,
        cmap='viridis',
        cbar_kws={'label': 'Similarity Score'},
        square=True,
        xticklabels=False,
        yticklabels=False,
        ax=ax1
    )
    
    # Overlay the path
    path_x = []
    path_y = []
    for i in range(len(sequence) - 1):
        path_x.append(sequence[i + 1])
        path_y.append(sequence[i])
    
    ax1.scatter(path_x, path_y, c='red', s=1, alpha=0.5, label='Reconstruction Path')
    ax1.set_title('Similarity Matrix with Reconstruction Path')
    ax1.set_xlabel('Frame Index (Next)')
    ax1.set_ylabel('Frame Index (Current)')
    
    # 2. Similarity along reconstruction path
    path_similarities = []
    for i in range(len(sequence) - 1):
        sim = similarity_matrix[sequence[i], sequence[i + 1]]
        path_similarities.append(sim)
    
    ax2.plot(path_similarities, linewidth=1)
    ax2.set_xlabel('Step in Reconstruction')
    ax2.set_ylabel('Similarity to Next Frame')
    ax2.set_title('Frame-to-Frame Similarity Along Reconstruction')
    ax2.grid(alpha=0.3)
    ax2.axhline(np.mean(path_similarities), color='red', linestyle='--',
               label=f'Mean: {np.mean(path_similarities):.3f}')
    ax2.legend()
    
    plt.tight_layout()
    
    # Save figure
    plt.savefig(output_path, dpi=150, bbox_inches='tight')
    plt.close()
    
    print(f"✅ Reconstruction path visualization saved to: {output_path}")


def create_all_visualizations(similarity_matrix: np.ndarray,
                             sequence: Optional[List[int]] = None,
                             output_dir: str = "output") -> None:
    """
    Create all available visualizations and save to output directory.
    
    Args:
        similarity_matrix (np.ndarray): NxN matrix of frame similarities
        sequence (List[int], optional): Reconstruction sequence
        output_dir (str): Directory to save visualizations
    """
    
    print("📊 Creating all visualizations...")
    
    # Heatmap
    plot_similarity_heatmap(
        similarity_matrix,
        os.path.join(output_dir, "similarity_heatmap.png")
    )
    
    # Statistics
    plot_similarity_statistics(
        similarity_matrix,
        os.path.join(output_dir, "similarity_statistics.png")
    )
    
    # Reconstruction path (if sequence provided)
    if sequence is not None:
        plot_reconstruction_path(
            similarity_matrix,
            sequence,
            os.path.join(output_dir, "reconstruction_path.png")
        )
    
    print("✅ All visualizations complete")


if __name__ == "__main__":
    # Example usage for testing
    print("This module should be imported, not run directly.")
    print("Use: from src.visualize_similarity import plot_similarity_heatmap")
