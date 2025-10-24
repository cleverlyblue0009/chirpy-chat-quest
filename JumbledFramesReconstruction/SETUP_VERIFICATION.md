# ✅ Setup Verification Checklist

Use this checklist to verify your Jumbled Frames Reconstruction project is properly set up.

---

## 📁 File Structure Verification

Check that the following files and folders exist:

### ✅ Root Directory

- [ ] `main.py` - Main entry point
- [ ] `requirements.txt` - Dependencies list
- [ ] `test_installation.py` - Installation test script
- [ ] `.gitignore` - Git ignore patterns

### ✅ Documentation

- [ ] `README.md` - Main documentation
- [ ] `QUICKSTART.md` - Quick start guide
- [ ] `USAGE_EXAMPLES.md` - Usage examples
- [ ] `PROJECT_SUMMARY.md` - Project overview
- [ ] `SETUP_VERIFICATION.md` - This file

### ✅ Source Code (`src/` folder)

- [ ] `src/__init__.py` - Package initialization
- [ ] `src/extract_frames.py` - Frame extraction module
- [ ] `src/optical_flow_similarity.py` - Optical flow module
- [ ] `src/reconstruct_sequence.py` - Reconstruction algorithm
- [ ] `src/video_builder.py` - Video generation module
- [ ] `src/visualize_flow.py` - Visualization module
- [ ] `src/utils.py` - Utility functions

### ✅ Working Directories

- [ ] `frames/` - Empty folder for extracted frames
- [ ] `output/` - Empty folder for results

---

## 🔧 Dependency Verification

### Step 1: Run Installation Test

```bash
python test_installation.py
```

**Expected Output:**
```
======================================================================
TESTING INSTALLATION
======================================================================

📦 Testing OpenCV... ✅ OK (version 4.x.x)
📦 Testing NumPy... ✅ OK (version 1.x.x)
📦 Testing tqdm... ✅ OK (version 4.x.x)
📦 Testing matplotlib... ✅ OK (version 3.x.x)

📚 Testing project modules...

📦 Testing src package... ✅ OK

======================================================================
TEST SUMMARY
======================================================================
✅ Tests passed: 5
❌ Tests failed: 0

🎉 All tests passed! Your installation is ready.
```

### Step 2: Manual Import Test

```bash
python -c "import cv2, numpy, tqdm, matplotlib; print('✅ All imports successful')"
```

### Step 3: Check Installed Versions

```bash
pip list | grep -E "opencv|numpy|tqdm|matplotlib"
```

**Expected Output:**
```
matplotlib    3.7.0 (or higher)
numpy         1.24.0 (or higher)
opencv-python 4.8.0 (or higher)
tqdm          4.65.0 (or higher)
```

---

## 🧪 Functionality Test

### Quick Smoke Test

Create a minimal test to verify the pipeline works:

```bash
# This will test if the main script runs without errors
python main.py --help
```

**Expected Output:**
```
usage: main.py [-h] [--input INPUT] [--method {opticalflow}] [--fps FPS]
               [--frames-dir FRAMES_DIR] [--output-dir OUTPUT_DIR]
               [--visualize] [--heatmap] [--skip-extraction]

Reconstruct shuffled video frames using optical flow
...
```

---

## 📊 Code Quality Checks

### Check Python Syntax

```bash
# Verify no syntax errors in Python files
python -m py_compile main.py
python -m py_compile test_installation.py
python -m py_compile src/*.py
```

No output = success!

### Check for Missing Imports

```bash
# This should not produce errors
python -c "from src import *"
```

---

## 🎯 Ready to Run Checklist

Before running a full reconstruction, verify:

- [ ] ✅ All dependencies installed (`test_installation.py` passes)
- [ ] ✅ All source files present
- [ ] ✅ `frames/` and `output/` folders exist
- [ ] ✅ You have a video file to test with
- [ ] ✅ Enough disk space (at least 1GB free for 300 frames)
- [ ] ✅ Python 3.8 or higher installed

---

## 🚀 First Run Test

### Option 1: Create a Test Video (If You Don't Have One)

```bash
# Create a simple test video using ffmpeg
ffmpeg -f lavfi -i testsrc=duration=3:size=640x480:rate=10 -pix_fmt yuv420p test_video.mp4
```

### Option 2: Run with Your Video

```bash
python main.py --input your_video.mp4 --fps 10
```

**Expected Behavior:**
1. ✅ Extracts frames to `frames/` folder
2. ✅ Shows progress bars during reconstruction
3. ✅ Creates `output/reconstructed_video.mp4`
4. ✅ Generates logs in `output/execution_log.txt`

---

## 🐛 Troubleshooting

### Issue: "No module named 'cv2'"

**Solution:**
```bash
pip install opencv-python
```

### Issue: "Permission denied" on main.py

**Solution:**
```bash
chmod +x main.py test_installation.py
```

### Issue: "No such file or directory: 'frames/'"

**Solution:**
```bash
mkdir -p frames output
```

### Issue: Python version too old

**Check version:**
```bash
python --version
```

**Required:** Python 3.8 or higher

**Solution:** Install Python 3.8+
```bash
# Ubuntu/Debian
sudo apt install python3.8

# macOS (using Homebrew)
brew install python@3.8

# Windows: Download from python.org
```

---

## ✅ Final Verification

Run all checks:

```bash
# 1. Check file structure
ls -la | grep -E "main.py|requirements.txt|README.md"
ls -la src/ | grep -E "extract_frames|optical_flow"

# 2. Test installation
python test_installation.py

# 3. Check help
python main.py --help

# 4. Verify folders
ls -ld frames output
```

If all commands succeed, you're ready to go! 🎉

---

## 📝 Success Criteria

✅ **Installation Complete** when:
1. `test_installation.py` shows all tests passing
2. `python main.py --help` displays help message
3. All source files are present
4. No import errors when importing src modules

✅ **Project Ready** when:
1. You have a video file to process
2. `frames/` and `output/` directories exist
3. At least 1GB free disk space
4. All dependencies installed

---

## 🎊 You're All Set!

If everything above checks out, you're ready to reconstruct videos!

**Next Steps:**
1. Read [QUICKSTART.md](QUICKSTART.md) for a 5-minute tutorial
2. Place your video and run: `python main.py`
3. Check [USAGE_EXAMPLES.md](USAGE_EXAMPLES.md) for advanced usage

---

## 📞 Still Having Issues?

1. **Recheck Python version**: `python --version` (need 3.8+)
2. **Reinstall dependencies**: `pip install -r requirements.txt --force-reinstall`
3. **Check documentation**: Review [README.md](README.md)
4. **Run test script**: `python test_installation.py`

---

<div align="center">

**Happy Reconstructing! 🎬**

</div>
