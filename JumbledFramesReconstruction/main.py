#!/usr/bin/env python3
"""
Jumbled Frames Reconstruction - Main Entry Point
=================================================
This script reconstructs a shuffled video using optical flow-based frame ordering.

Usage:
    python main.py --input jumbled_video.mp4 --method opticalflow
    python main.py --help
"""

import os
import sys
import argparse
import time
from pathlib import Path

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from src.extract_frames import extract_frames, get_frame_paths
from src.reconstruct_sequence import reconstruct_sequence, save_reconstruction_order, validate_reconstruction
from src.video_builder import create_video, extract_video_info
from src.visualize_flow import (visualize_optical_flow, 
                                create_similarity_heatmap,
                                visualize_reconstruction_quality)
from src.utils import ExecutionLogger, print_section_header, format_time
from src.extract_frames import load_frame


def print_banner():
    """Print a nice banner for the program."""
    banner = """
    ╔══════════════════════════════════════════════════════════════════╗
    ║                                                                  ║
    ║        JUMBLED FRAMES RECONSTRUCTION CHALLENGE                   ║
    ║        Using Optical Flow-Based Motion Analysis                  ║
    ║                                                                  ║
    ╚══════════════════════════════════════════════════════════════════╝
    """
    print(banner)


def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(
        description='Reconstruct shuffled video frames using optical flow',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --input jumbled_video.mp4
  %(prog)s --input video.mp4 --method opticalflow --fps 30
  %(prog)s --input video.mp4 --visualize --heatmap
        """
    )
    
    parser.add_argument(
        '--input', '-i',
        type=str,
        default='jumbled_video.mp4',
        help='Path to input jumbled video file (default: jumbled_video.mp4)'
    )
    
    parser.add_argument(
        '--method', '-m',
        type=str,
        default='opticalflow',
        choices=['opticalflow'],
        help='Reconstruction method to use (default: opticalflow)'
    )
    
    parser.add_argument(
        '--fps',
        type=int,
        default=30,
        help='Frames per second for output video (default: 30)'
    )
    
    parser.add_argument(
        '--frames-dir',
        type=str,
        default='frames',
        help='Directory to store extracted frames (default: frames/)'
    )
    
    parser.add_argument(
        '--output-dir',
        type=str,
        default='output',
        help='Directory for output files (default: output/)'
    )
    
    parser.add_argument(
        '--visualize',
        action='store_true',
        help='Create optical flow visualizations'
    )
    
    parser.add_argument(
        '--heatmap',
        action='store_true',
        help='Create similarity heatmap (computationally expensive)'
    )
    
    parser.add_argument(
        '--skip-extraction',
        action='store_true',
        help='Skip frame extraction if frames already exist'
    )
    
    return parser.parse_args()


def main():
    """Main execution function."""
    # Parse arguments
    args = parse_arguments()
    
    # Print banner
    print_banner()
    
    # Initialize execution logger
    log_file = os.path.join(args.output_dir, 'execution_log.txt')
    logger = ExecutionLogger(log_file)
    
    # Create output directory
    os.makedirs(args.output_dir, exist_ok=True)
    
    # Record start time
    total_start_time = time.time()
    
    logger.log("🚀 Starting Jumbled Frames Reconstruction")
    logger.log(f"   Input video: {args.input}")
    logger.log(f"   Method: {args.method}")
    logger.log(f"   Output directory: {args.output_dir}")
    
    # Check if input video exists
    if not os.path.exists(args.input):
        print(f"\n❌ Error: Input video not found: {args.input}")
        print("   Please place your jumbled video file in the project root.")
        print("   Or specify the path using --input <path>")
        sys.exit(1)
    
    # Extract video info
    print_section_header("STEP 1: VIDEO ANALYSIS")
    video_info = extract_video_info(args.input)
    if video_info:
        print(f"📊 Video Information:")
        print(f"   Resolution: {video_info['width']}x{video_info['height']}")
        print(f"   Frame Count: {video_info['frame_count']}")
        print(f"   FPS: {video_info['fps']:.2f}")
        print(f"   Duration: {video_info['duration']:.2f} seconds")
        logger.log(f"Video info: {video_info}")
    
    # Step 1: Extract frames
    print_section_header("STEP 2: FRAME EXTRACTION")
    
    if args.skip_extraction and os.path.exists(args.frames_dir):
        existing_frames = len(get_frame_paths(args.frames_dir))
        if existing_frames > 0:
            print(f"⏭️  Skipping extraction - found {existing_frames} existing frames")
            logger.log(f"Skipped extraction - {existing_frames} frames already exist")
        else:
            args.skip_extraction = False
    
    if not args.skip_extraction:
        try:
            frame_count, dimensions = extract_frames(args.input, args.frames_dir)
            logger.log(f"Extracted {frame_count} frames at {dimensions} resolution")
        except Exception as e:
            print(f"\n❌ Error during frame extraction: {e}")
            logger.log(f"ERROR: Frame extraction failed - {e}")
            sys.exit(1)
    
    # Step 2: Reconstruct sequence
    print_section_header("STEP 3: SEQUENCE RECONSTRUCTION")
    
    try:
        reconstruction_start = time.time()
        ordered_frames = reconstruct_sequence(args.frames_dir, method=args.method)
        reconstruction_time = time.time() - reconstruction_start
        
        logger.log(f"Reconstruction completed in {reconstruction_time:.2f} seconds")
        logger.log(f"Ordered {len(ordered_frames)} frames")
        
        # Validate reconstruction
        if validate_reconstruction(ordered_frames):
            print("✅ Reconstruction validation passed!")
            logger.log("Reconstruction validation: PASSED")
        else:
            print("⚠️  Warning: Reconstruction validation failed!")
            logger.log("Reconstruction validation: FAILED")
        
        # Save reconstruction order
        order_file = os.path.join(args.output_dir, 'frame_order.txt')
        save_reconstruction_order(ordered_frames, order_file)
        
    except Exception as e:
        print(f"\n❌ Error during reconstruction: {e}")
        logger.log(f"ERROR: Reconstruction failed - {e}")
        sys.exit(1)
    
    # Step 3: Create output video
    print_section_header("STEP 4: VIDEO GENERATION")
    
    output_video_path = os.path.join(args.output_dir, 'reconstructed_video.mp4')
    
    try:
        video_start = time.time()
        success = create_video(ordered_frames, output_video_path, fps=args.fps)
        video_time = time.time() - video_start
        
        if success:
            logger.log(f"Video created in {video_time:.2f} seconds")
        else:
            logger.log("ERROR: Video creation failed")
            print("\n❌ Failed to create output video")
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Error during video creation: {e}")
        logger.log(f"ERROR: Video creation failed - {e}")
        sys.exit(1)
    
    # Step 4: Visualizations (optional)
    if args.visualize:
        print_section_header("STEP 5: OPTICAL FLOW VISUALIZATION")
        
        try:
            # Visualize flow between first two reconstructed frames
            if len(ordered_frames) >= 2:
                frame1 = load_frame(ordered_frames[0])
                frame2 = load_frame(ordered_frames[1])
                flow_vis_path = os.path.join(args.output_dir, 'optical_flow_example.png')
                visualize_optical_flow(frame1, frame2, flow_vis_path)
                logger.log("Created optical flow visualization")
            
            # Create multiple quality samples
            visualize_reconstruction_quality(
                ordered_frames,
                args.output_dir,
                num_samples=5
            )
            logger.log("Created reconstruction quality visualizations")
            
        except Exception as e:
            print(f"⚠️  Warning: Visualization failed - {e}")
            logger.log(f"WARNING: Visualization failed - {e}")
    
    # Step 5: Similarity heatmap (optional, expensive)
    if args.heatmap:
        print_section_header("STEP 6: SIMILARITY HEATMAP")
        
        try:
            heatmap_path = os.path.join(args.output_dir, 'similarity_heatmap.png')
            create_similarity_heatmap(ordered_frames, heatmap_path, sample_size=50)
            logger.log("Created similarity heatmap")
        except Exception as e:
            print(f"⚠️  Warning: Heatmap generation failed - {e}")
            logger.log(f"WARNING: Heatmap generation failed - {e}")
    
    # Calculate total execution time
    total_time = time.time() - total_start_time
    
    # Final summary
    print_section_header("RECONSTRUCTION COMPLETE!")
    print(f"\n✅ Successfully reconstructed video!")
    print(f"\n📦 Output Files:")
    print(f"   • Video: {output_video_path}")
    print(f"   • Frame order: {order_file}")
    if args.visualize:
        print(f"   • Flow visualization: {os.path.join(args.output_dir, 'optical_flow_example.png')}")
    if args.heatmap:
        print(f"   • Similarity heatmap: {os.path.join(args.output_dir, 'similarity_heatmap.png')}")
    print(f"   • Execution log: {log_file}")
    
    print(f"\n⏱️  Total Execution Time: {format_time(total_time)}")
    
    logger.log(f"Total execution time: {total_time:.2f} seconds")
    logger.log("Reconstruction pipeline completed successfully!")
    logger.save()
    
    print("\n" + "="*70)
    print("  Thank you for using Jumbled Frames Reconstruction!")
    print("="*70 + "\n")


if __name__ == '__main__':
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Process interrupted by user")
        sys.exit(130)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
