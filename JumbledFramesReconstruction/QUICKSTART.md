# ⚡ Quick Start Guide

Get started with Jumbled Frames Reconstruction in under 5 minutes!

---

## 📦 Installation (2 minutes)

### Step 1: Navigate to Project

```bash
cd JumbledFramesReconstruction
```

### Step 2: Install Dependencies

```bash
pip install -r requirements.txt
```

**That's it!** You're ready to go.

---

## 🎬 First Run (3 minutes)

### Step 1: Prepare Your Video

Place your jumbled video in the project folder:

```bash
# Option 1: Copy your video
cp /path/to/your/shuffled_video.mp4 jumbled_video.mp4

# Option 2: Or use the --input flag later
```

### Step 2: Run the Reconstruction

```bash
python main.py
```

### Step 3: Watch Your Result!

```bash
# Output video will be at:
output/reconstructed_video.mp4

# Open it with your favorite video player
```

---

## 🎯 What Just Happened?

The program:

1. ✅ Extracted 300 frames from your video
2. ✅ Analyzed motion patterns using optical flow
3. ✅ Reconstructed the correct frame order
4. ✅ Built the final video

---

## 📊 Check the Results

Your `output/` folder now contains:

```
output/
├── reconstructed_video.mp4    ← Your reconstructed video!
├── frame_order.txt            ← The reconstruction order
└── execution_log.txt          ← Performance stats
```

---

## 🎨 Want Visualizations?

Run with the `--visualize` flag:

```bash
python main.py --visualize
```

This creates optical flow visualizations showing the motion patterns used for reconstruction.

---

## 🐛 Troubleshooting

### Error: "Video file not found"

**Solution**: Specify your video path:

```bash
python main.py --input /full/path/to/your/video.mp4
```

### Error: "No module named 'cv2'"

**Solution**: Install OpenCV:

```bash
pip install opencv-python
```

### Error: "Out of memory"

**Solution**: Use a shorter video for testing (< 5 seconds) or reduce resolution.

---

## 📚 Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [USAGE_EXAMPLES.md](USAGE_EXAMPLES.md) for advanced usage
- Experiment with the `--fps` and `--visualize` options

---

## 🚀 Command Cheat Sheet

```bash
# Basic reconstruction
python main.py

# With custom input
python main.py --input my_video.mp4

# With visualizations
python main.py --visualize

# Full analysis
python main.py --visualize --heatmap

# Custom FPS
python main.py --fps 60

# Help
python main.py --help
```

---

## ✅ Success!

You've successfully reconstructed your first jumbled video using optical flow!

**Questions?** Open an issue on GitHub or check the documentation.

**Enjoying the project?** Give it a ⭐ on GitHub!
