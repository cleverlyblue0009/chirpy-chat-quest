"""
Jumbled Frames Reconstruction - Source Package

This package contains all the core modules for video frame reconstruction.
"""

__version__ = "1.0.0"
__author__ = "AI Assistant"

# Make key functions easily importable
from .extract_frames import extract_frames
from .frame_similarity import frame_similarity
from .reconstruct_sequence import reconstruct_sequence
from .video_builder import create_video
from .visualize_similarity import create_all_visualizations

__all__ = [
    'extract_frames',
    'frame_similarity',
    'reconstruct_sequence',
    'create_video',
    'create_all_visualizations'
]
