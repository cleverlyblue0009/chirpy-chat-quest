# 🏗️ Project Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        MAIN.PY                                  │
│                  (Orchestration Layer)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ extract_frames   │ │ frame_similarity │ │ reconstruct_     │
│                  │ │                  │ │ sequence         │
│ • VideoCapture   │ │ • Histogram      │ │ • Similarity     │
│ • Frame saving   │ │ • MSE            │ │   Matrix         │
│ • Validation     │ │ • Structural     │ │ • Greedy NN      │
└──────────────────┘ └──────────────────┘ └──────────────────┘
         │                    │                     │
         └────────────────────┼─────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ video_builder    │ │ visualize_       │ │ utils            │
│                  │ │ similarity       │ │                  │
│ • VideoWriter    │ │ • Heatmaps       │ │ • Timing         │
│ • Frame encoding │ │ • Statistics     │ │ • Logging        │
│ • Validation     │ │ • Path plots     │ │ • Validation     │
└──────────────────┘ └──────────────────┘ └──────────────────┘
         │                    │                     │
         └────────────────────┼─────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   OUTPUT FILES   │
                    │                  │
                    │ • Video          │
                    │ • Logs           │
                    │ • Visualizations │
                    └──────────────────┘
```

## Data Flow

```
Input Video (jumbled_video.mp4)
         │
         │ [extract_frames.py]
         ▼
    Frame Files (frame_0001.jpg ... frame_0300.jpg)
         │
         │ [frame_similarity.py]
         ▼
  Similarity Matrix [300 x 300]
         │
         │ [reconstruct_sequence.py + multiprocessing]
         ▼
  Ordered Frame Indices [0, 145, 23, 189, ...]
         │
         │ [video_builder.py]
         ▼
Reconstructed Video (reconstructed_video.mp4)
         │
         │ [visualize_similarity.py]
         ▼
   Visualizations (heatmaps, statistics)
```

## Module Dependencies

```
main.py
├── src.extract_frames
│   ├── cv2 (OpenCV)
│   ├── tqdm
│   └── os
├── src.frame_similarity
│   ├── cv2 (OpenCV)
│   └── numpy
├── src.reconstruct_sequence
│   ├── src.frame_similarity
│   ├── numpy
│   ├── tqdm
│   └── concurrent.futures
├── src.video_builder
│   ├── cv2 (OpenCV)
│   └── tqdm
├── src.visualize_similarity
│   ├── numpy
│   ├── matplotlib
│   └── seaborn
└── src.utils
    ├── time
    ├── platform
    └── datetime
```

## Class/Function Hierarchy

### extract_frames.py
```
extract_frames(video_path, output_folder) → (frames, width, height)
├── cv2.VideoCapture()
├── cap.read() [loop]
└── cv2.imwrite()

validate_extracted_frames(folder, count) → bool
└── os.listdir() + cv2.imread()
```

### frame_similarity.py
```
frame_similarity(frame1, frame2, method) → float
├── compute_histogram_similarity()
│   ├── cv2.cvtColor(BGR→HSV)
│   ├── cv2.calcHist()
│   └── cv2.compareHist(CORREL)
├── compute_mse()
│   └── np.mean((f1 - f2)²)
├── compute_structural_similarity()
│   ├── cv2.Canny()
│   └── np.corrcoef()
└── compute_feature_similarity()
    ├── cv2.ORB_create() / cv2.SIFT_create()
    └── cv2.BFMatcher()
```

### reconstruct_sequence.py
```
reconstruct_sequence(frames_folder) → (ordered_frames, matrix)
├── compute_similarity_matrix()
│   ├── [Parallel] compute_similarity_pair() × N²
│   └── ProcessPoolExecutor
└── greedy_nearest_neighbor()
    └── [Loop] argmax(similarities[unused])
```

### video_builder.py
```
create_video(ordered_frames, output_path, fps) → bool
├── cv2.VideoWriter()
├── [Loop] out.write(frame)
└── out.release()

validate_video(video_path) → bool
└── cv2.VideoCapture() [test]
```

### visualize_similarity.py
```
create_all_visualizations(matrix, sequence, output_dir)
├── plot_similarity_heatmap()
│   └── sns.heatmap()
├── plot_similarity_statistics()
│   ├── plt.hist()
│   ├── plt.boxplot()
│   └── statistics table
└── plot_reconstruction_path()
    ├── heatmap with path overlay
    └── similarity along path
```

### utils.py
```
measure_execution_time(func) → decorator
├── time.time() [start]
├── func(*args, **kwargs)
└── time.time() [end]

create_execution_log(path, operations, time)
├── get_system_info()
└── log_to_file()
```

## Algorithm Complexity Analysis

### Time Complexity
```
Operation                   | Complexity      | Example (300 frames)
---------------------------|-----------------|---------------------
Frame Extraction           | O(n)            | 300 operations
Similarity Matrix          | O(n² × m)       | 90,000 × 2M pixels
Greedy Reconstruction      | O(n²)           | 90,000 comparisons
Video Generation           | O(n)            | 300 writes
Visualization              | O(n²)           | 90,000 entries
---------------------------|-----------------|---------------------
TOTAL (dominated by)       | O(n² × m)       | ~180 billion ops
```

### Space Complexity
```
Data Structure             | Size            | Example (300 frames)
---------------------------|-----------------|---------------------
Similarity Matrix          | O(n²)           | 300×300 = 90K floats
Frame Storage (temp)       | O(n × m)        | 300 × 2MB = 600MB
Ordered Indices            | O(n)            | 300 integers
Visualizations             | O(n²)           | Matrix plots
---------------------------|-----------------|---------------------
Peak Memory                | O(n² + n×m)     | ~2-4 GB
```

## Performance Optimization Strategies

### 1. Multiprocessing
```python
# Sequential: 180 seconds
for i, j in pairs:
    similarity[i,j] = compute_similarity(frames[i], frames[j])

# Parallel: 23 seconds (8x speedup on 8-core)
with ProcessPoolExecutor(max_workers=8) as executor:
    futures = [executor.submit(compute_similarity_pair, pair) 
               for pair in pairs]
    for future in as_completed(futures):
        i, j, sim = future.result()
        similarity[i,j] = sim
```

### 2. Matrix Symmetry
```python
# Naive: Compute all N² pairs
for i in range(n):
    for j in range(n):
        matrix[i,j] = similarity(frames[i], frames[j])

# Optimized: Compute only upper triangle (N²/2 pairs)
for i in range(n):
    for j in range(i+1, n):
        sim = similarity(frames[i], frames[j])
        matrix[i,j] = sim
        matrix[j,i] = sim  # Symmetric
```

### 3. NumPy Vectorization
```python
# Slow: Python loops
mse = 0
for i in range(height):
    for j in range(width):
        mse += (frame1[i,j] - frame2[i,j]) ** 2
mse /= (height * width)

# Fast: NumPy vectorized
mse = np.mean((frame1 - frame2) ** 2)
```

## Configuration & Extensibility

### Adding New Similarity Metrics

```python
# In frame_similarity.py:

def compute_custom_similarity(frame1, frame2):
    """Your custom similarity metric."""
    # Implement your algorithm here
    return similarity_score

# In frame_similarity() function:
elif method == 'custom':
    return compute_custom_similarity(frame1, frame2)
```

### Adding New Reconstruction Algorithms

```python
# In reconstruct_sequence.py:

def optimal_reconstruction(similarity_matrix):
    """
    Dynamic programming or other advanced algorithm.
    """
    # Implement your algorithm here
    return ordered_indices

# In reconstruct_sequence() function:
if algorithm == 'optimal':
    ordered_indices = optimal_reconstruction(similarity_matrix)
```

### Adding New Visualizations

```python
# In visualize_similarity.py:

def plot_custom_analysis(similarity_matrix, output_path):
    """Your custom visualization."""
    plt.figure()
    # Create your plot
    plt.savefig(output_path)
    plt.close()

# In create_all_visualizations():
plot_custom_analysis(similarity_matrix, 
                     os.path.join(output_dir, "custom.png"))
```

## Error Handling Strategy

```
┌─────────────────────────────────────────┐
│          Main Execution Flow            │
└─────────────────────────────────────────┘
              │
              │ try:
              ▼
    ┌──────────────────┐
    │  Extract Frames  │ → FileNotFoundError
    └──────────────────┘   ValueError
              │
              │ try:
              ▼
    ┌──────────────────┐
    │  Compute Matrix  │ → ImportError
    └──────────────────┘   MemoryError
              │
              │ try:
              ▼
    ┌──────────────────┐
    │  Reconstruct     │ → IndexError
    └──────────────────┘   KeyError
              │
              │ try:
              ▼
    ┌──────────────────┐
    │  Create Video    │ → IOError
    └──────────────────┘   CodecError
              │
              ▼
    ┌──────────────────┐
    │  Visualizations  │ → (Non-critical)
    └──────────────────┘   Continue on error
              │
              ▼
         ✅ Success
```

## Testing Strategy

```
Unit Tests (test_*.py)
├── test_extract_frames()
│   ├── Test with valid video
│   ├── Test with missing video
│   └── Test frame count
├── test_frame_similarity()
│   ├── Test identical frames → 1.0
│   ├── Test different frames → <1.0
│   └── Test all methods
├── test_reconstruct_sequence()
│   ├── Test small dataset
│   └── Test matrix construction
└── test_video_builder()
    ├── Test video creation
    └── Test codec support

Integration Tests
└── test_full_pipeline()
    └── End-to-end test with sample video

Installation Test (test_installation.py)
├── Check Python version
├── Check dependencies
├── Check project structure
└── Check module imports
```

---

## Quick Reference

### Key Files
- **main.py**: Entry point, orchestration
- **extract_frames.py**: Video → frames
- **frame_similarity.py**: Frame comparison
- **reconstruct_sequence.py**: Core algorithm
- **video_builder.py**: Frames → video
- **visualize_similarity.py**: Analysis plots
- **utils.py**: Helper functions

### Key Functions
- `extract_frames()`: Extract from video
- `frame_similarity()`: Compare two frames
- `compute_similarity_matrix()`: All pairs
- `greedy_nearest_neighbor()`: Reconstruct order
- `create_video()`: Generate output
- `create_all_visualizations()`: Analysis

### Key Data Structures
- `similarity_matrix`: NxN NumPy array
- `ordered_frames`: List of frame paths
- `sequence`: List of frame indices
- `operations`: List of (name, time) tuples

---

*This architecture supports 300 frames at 1080p with ~3 minute runtime on modern hardware.*
