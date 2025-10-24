#!/usr/bin/env python3
"""
Jumbled Frames Reconstruction Challenge - Main Script

This is the main entry point for the video reconstruction pipeline.
It orchestrates all steps: frame extraction, similarity computation, 
sequence reconstruction, and video generation.

Author: AI Assistant
Date: 2025-10-24
Usage: python main.py
"""

import os
import sys
import time
from pathlib import Path

# Add src directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.extract_frames import extract_frames, validate_extracted_frames
from src.reconstruct_sequence import reconstruct_sequence
from src.video_builder import create_video, validate_video
from src.visualize_similarity import create_all_visualizations
from src.utils import (
    print_banner, 
    get_system_info, 
    create_execution_log,
    validate_file_exists,
    format_time
)


def main():
    """
    Main function that orchestrates the entire reconstruction pipeline.
    """
    
    # ========================================================================
    # CONFIGURATION
    # ========================================================================
    
    # Input/Output paths
    INPUT_VIDEO = "jumbled_video.mp4"
    FRAMES_FOLDER = "frames"
    OUTPUT_FOLDER = "output"
    OUTPUT_VIDEO = os.path.join(OUTPUT_FOLDER, "reconstructed_video.mp4")
    EXECUTION_LOG = os.path.join(OUTPUT_FOLDER, "execution_log.txt")
    
    # Processing parameters
    FPS = 30  # Frames per second for output video
    SIMILARITY_METHOD = 'combined'  # Options: 'histogram', 'mse', 'structural', 'combined'
    USE_MULTIPROCESSING = True  # Enable parallel processing
    
    # ========================================================================
    # START EXECUTION
    # ========================================================================
    
    print_banner("JUMBLED FRAMES RECONSTRUCTION CHALLENGE")
    
    print("🚀 Starting video reconstruction pipeline")
    print(f"📂 Working directory: {os.getcwd()}\n")
    
    # Display system information
    sys_info = get_system_info()
    print("💻 System Information:")
    print(f"   Platform: {sys_info['platform']}")
    print(f"   Python: {sys_info['python_version']}")
    print(f"   CPU Cores: {sys_info['cpu_count']}")
    print()
    
    # Track execution times
    operations = []
    total_start_time = time.time()
    
    # ========================================================================
    # STEP 1: VALIDATE INPUT
    # ========================================================================
    
    print_banner("STEP 1: INPUT VALIDATION")
    
    if not validate_file_exists(INPUT_VIDEO, "Input video"):
        print("\n❌ ERROR: Please place 'jumbled_video.mp4' in the project root directory")
        print("   Then run this script again.\n")
        return False
    
    # ========================================================================
    # STEP 2: EXTRACT FRAMES
    # ========================================================================
    
    print_banner("STEP 2: FRAME EXTRACTION")
    
    step_start = time.time()
    
    try:
        total_frames, width, height = extract_frames(INPUT_VIDEO, FRAMES_FOLDER)
        
        # Validate extraction
        if not validate_extracted_frames(FRAMES_FOLDER, total_frames):
            print("❌ Frame extraction validation failed")
            return False
        
        step_time = time.time() - step_start
        operations.append(("Frame Extraction", step_time))
        
    except Exception as e:
        print(f"❌ Error during frame extraction: {e}")
        return False
    
    # ========================================================================
    # STEP 3: RECONSTRUCT SEQUENCE
    # ========================================================================
    
    print_banner("STEP 3: SEQUENCE RECONSTRUCTION")
    
    step_start = time.time()
    
    try:
        # Run the reconstruction algorithm
        ordered_frames, similarity_matrix = reconstruct_sequence(
            FRAMES_FOLDER,
            method=SIMILARITY_METHOD,
            use_multiprocessing=USE_MULTIPROCESSING
        )
        
        print(f"📊 Reconstructed sequence of {len(ordered_frames)} frames")
        
        step_time = time.time() - step_start
        operations.append(("Sequence Reconstruction", step_time))
        
    except Exception as e:
        print(f"❌ Error during sequence reconstruction: {e}")
        return False
    
    # ========================================================================
    # STEP 4: CREATE OUTPUT VIDEO
    # ========================================================================
    
    print_banner("STEP 4: VIDEO GENERATION")
    
    step_start = time.time()
    
    try:
        # Create output directory
        os.makedirs(OUTPUT_FOLDER, exist_ok=True)
        
        # Build video from ordered frames
        success = create_video(
            ordered_frames,
            OUTPUT_VIDEO,
            fps=FPS
        )
        
        if not success:
            print("❌ Video creation failed")
            return False
        
        # Validate output video
        if not validate_video(OUTPUT_VIDEO):
            print("❌ Output video validation failed")
            return False
        
        step_time = time.time() - step_start
        operations.append(("Video Generation", step_time))
        
    except Exception as e:
        print(f"❌ Error during video generation: {e}")
        return False
    
    # ========================================================================
    # STEP 5: CREATE VISUALIZATIONS
    # ========================================================================
    
    print_banner("STEP 5: VISUALIZATION GENERATION")
    
    step_start = time.time()
    
    try:
        # Extract sequence indices from ordered frames
        sequence_indices = []
        frame_files = sorted([f for f in os.listdir(FRAMES_FOLDER) if f.endswith('.jpg')])
        frame_to_index = {os.path.join(FRAMES_FOLDER, f): i for i, f in enumerate(frame_files)}
        
        for frame_path in ordered_frames:
            sequence_indices.append(frame_to_index[frame_path])
        
        # Generate all visualizations
        create_all_visualizations(
            similarity_matrix,
            sequence_indices,
            OUTPUT_FOLDER
        )
        
        step_time = time.time() - step_start
        operations.append(("Visualization Generation", step_time))
        
    except Exception as e:
        print(f"⚠️  Warning: Visualization generation failed: {e}")
        # Don't return False - visualizations are optional
    
    # ========================================================================
    # STEP 6: GENERATE EXECUTION LOG
    # ========================================================================
    
    print_banner("STEP 6: EXECUTION LOG")
    
    total_time = time.time() - total_start_time
    
    try:
        create_execution_log(
            EXECUTION_LOG,
            operations,
            total_time,
            success=True
        )
    except Exception as e:
        print(f"⚠️  Warning: Could not create execution log: {e}")
    
    # ========================================================================
    # COMPLETION SUMMARY
    # ========================================================================
    
    print_banner("✅ RECONSTRUCTION COMPLETE!")
    
    print(f"📊 Summary:")
    print(f"   Total Frames Processed: {total_frames}")
    print(f"   Video Resolution: {width}x{height}")
    print(f"   Output FPS: {FPS}")
    print(f"   Total Execution Time: {format_time(total_time)}")
    print()
    
    print(f"📁 Output Files:")
    print(f"   ✅ Reconstructed Video: {OUTPUT_VIDEO}")
    print(f"   ✅ Execution Log: {EXECUTION_LOG}")
    print(f"   ✅ Similarity Heatmap: {os.path.join(OUTPUT_FOLDER, 'similarity_heatmap.png')}")
    print(f"   ✅ Statistics Plot: {os.path.join(OUTPUT_FOLDER, 'similarity_statistics.png')}")
    print(f"   ✅ Reconstruction Path: {os.path.join(OUTPUT_FOLDER, 'reconstruction_path.png')}")
    print()
    
    print("🎉 You can now view the reconstructed video and analysis results!")
    print()
    
    return True


if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Execution interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
