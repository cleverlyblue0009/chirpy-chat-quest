# Usage Examples

This document provides detailed usage examples for the Jumbled Frames Reconstruction project.

---

## Basic Examples

### 1. Simple Reconstruction

The most basic usage - reconstruct a jumbled video with default settings:

```bash
python main.py
```

**Expected behavior**:
- Looks for `jumbled_video.mp4` in the current directory
- Extracts frames to `frames/` folder
- Reconstructs using optical flow
- Saves output to `output/reconstructed_video.mp4`

---

### 2. Custom Input Video

Specify a different input video:

```bash
python main.py --input /path/to/my_shuffled_video.mp4
```

---

### 3. With Visualizations

Generate optical flow visualizations:

```bash
python main.py --visualize
```

**Output includes**:
- `output/optical_flow_example.png` - Main flow visualization
- `output/flow_pair_01.png` through `flow_pair_05.png` - Quality samples

---

### 4. Full Analysis with Heatmap

Run complete analysis including similarity heatmap:

```bash
python main.py --visualize --heatmap
```

**⚠️ Warning**: Heatmap generation is computationally expensive!

---

## Advanced Examples

### 5. Custom Frame Rate

Reconstruct video with 60 FPS instead of default 30:

```bash
python main.py --fps 60
```

---

### 6. Custom Output Directory

Save results to a specific location:

```bash
python main.py --output-dir /path/to/results/
```

---

### 7. Resume from Extracted Frames

If you already extracted frames and want to skip that step:

```bash
python main.py --skip-extraction
```

**Use case**: You've already extracted frames and want to try reconstruction again without re-extracting.

---

### 8. Complete Custom Configuration

Combine multiple options:

```bash
python main.py \
  --input ~/Videos/shuffled.mp4 \
  --output-dir ~/Desktop/reconstruction_results/ \
  --fps 24 \
  --visualize \
  --frames-dir temp_frames/
```

---

## Programmatic Usage

You can also use the modules programmatically in your own Python scripts:

### Example 1: Basic Reconstruction Script

```python
from src.extract_frames import extract_frames
from src.reconstruct_sequence import reconstruct_sequence
from src.video_builder import create_video

# Extract frames
frame_count, dimensions = extract_frames('input.mp4', 'frames/')

# Reconstruct sequence
ordered_frames = reconstruct_sequence('frames/', method='opticalflow')

# Create output video
create_video(ordered_frames, 'output.mp4', fps=30)
```

### Example 2: Custom Similarity Analysis

```python
from src.extract_frames import load_frame
from src.optical_flow_similarity import optical_flow_similarity

# Load two frames
frame1 = load_frame('frames/frame_0001.jpg')
frame2 = load_frame('frames/frame_0002.jpg')

# Compute similarity
similarity_score = optical_flow_similarity(frame1, frame2)

print(f"Similarity: {similarity_score:.4f}")
# Output: Similarity: 0.8523
```

### Example 3: Batch Processing

```python
import os
import glob

videos = glob.glob('input_videos/*.mp4')

for video_path in videos:
    video_name = os.path.basename(video_path).replace('.mp4', '')
    
    # Create custom directories
    frames_dir = f'frames/{video_name}/'
    output_dir = f'output/{video_name}/'
    
    # Process
    extract_frames(video_path, frames_dir)
    ordered_frames = reconstruct_sequence(frames_dir)
    create_video(ordered_frames, f'{output_dir}/reconstructed.mp4')
```

---

## Performance Tuning

### For Faster Processing

```bash
# Skip visualization (saves time)
python main.py

# Use lower resolution input
# (resize video before processing using ffmpeg)
ffmpeg -i input.mp4 -vf scale=960:540 input_small.mp4
python main.py --input input_small.mp4
```

### For Better Quality

```bash
# Use higher FPS
python main.py --fps 60

# Generate full analysis
python main.py --visualize --heatmap
```

---

## Troubleshooting Examples

### Problem: "Video file not found"

```bash
# Check your video path
ls -la jumbled_video.mp4

# Or use absolute path
python main.py --input $(pwd)/my_video.mp4
```

### Problem: Out of memory

```python
# Edit src/optical_flow_similarity.py
# Add frame resizing before optical flow computation:

def optical_flow_similarity(frame1, frame2):
    # Resize to half resolution
    frame1 = cv2.resize(frame1, None, fx=0.5, fy=0.5)
    frame2 = cv2.resize(frame2, None, fx=0.5, fy=0.5)
    
    # ... rest of the function
```

### Problem: Slow reconstruction

```bash
# Process fewer frames for testing
# Manually delete some frames from frames/ folder
rm frames/frame_01[5-9]*.jpg  # Keep only first 150 frames
python main.py --skip-extraction
```

---

## Expected Output

After successful execution, you should see:

```
╔══════════════════════════════════════════════════════════════════╗
║                                                                  ║
║        JUMBLED FRAMES RECONSTRUCTION CHALLENGE                   ║
║        Using Optical Flow-Based Motion Analysis                  ║
║                                                                  ║
╚══════════════════════════════════════════════════════════════════╝

======================================================================
  STEP 1: VIDEO ANALYSIS
======================================================================
📊 Video Information:
   Resolution: 1920x1080
   Frame Count: 300
   FPS: 30.00
   Duration: 10.00 seconds

======================================================================
  STEP 2: FRAME EXTRACTION
======================================================================
📹 Video Properties:
   - Total Frames: 300
   - FPS: 30.0
   - Resolution: 1920x1080

🎬 Extracting frames to: frames
✅ Successfully extracted 300 frames!

======================================================================
  STEP 3: SEQUENCE RECONSTRUCTION
======================================================================

🔄 Reconstructing sequence using opticalflow method...
   Total frames: 300
   Starting frame: frame_0001.jpg

🔗 Building sequence: 100%|██████████| 299/299 [00:42<00:00, 7.0frame/s]

✅ Sequence reconstruction complete!
   Total frames ordered: 300

======================================================================
  STEP 4: VIDEO GENERATION
======================================================================

🎬 Creating video from 300 frames...
   Output: output/reconstructed_video.mp4
   FPS: 30
   Resolution: 1920x1080

✍️  Writing frames: 100%|██████████| 300/300 [00:10<00:00, 29.1frame/s]

✅ Video created successfully!
   File: output/reconstructed_video.mp4
   Size: 45.23 MB
   Duration: 10.00 seconds

======================================================================
  RECONSTRUCTION COMPLETE!
======================================================================

✅ Successfully reconstructed video!

📦 Output Files:
   • Video: output/reconstructed_video.mp4
   • Frame order: output/frame_order.txt
   • Execution log: output/execution_log.txt

⏱️  Total Execution Time: 55.67 seconds

======================================================================
  Thank you for using Jumbled Frames Reconstruction!
======================================================================
```

---

## Tips & Best Practices

1. **Start small**: Test with a short video (3-5 seconds) first
2. **Check video quality**: Higher quality input = better results
3. **Monitor memory**: Large videos may require more RAM
4. **Save intermediate results**: Use `--skip-extraction` to avoid re-processing
5. **Validate output**: Always watch the reconstructed video to verify quality

---

## Need Help?

- Check the main [README.md](README.md) for detailed documentation
- Open an issue on GitHub if you encounter problems
- Share your results and improvements with the community!
