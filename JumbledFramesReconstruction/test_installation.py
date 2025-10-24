#!/usr/bin/env python3
"""
Installation Test Script
========================
Run this script to verify that all dependencies are properly installed.

Usage:
    python test_installation.py
"""

import sys

def test_imports():
    """Test that all required modules can be imported."""
    print("=" * 70)
    print("TESTING INSTALLATION")
    print("=" * 70)
    print()
    
    tests_passed = 0
    tests_failed = 0
    
    # Test OpenCV
    print("📦 Testing OpenCV... ", end="")
    try:
        import cv2
        version = cv2.__version__
        print(f"✅ OK (version {version})")
        tests_passed += 1
    except ImportError as e:
        print(f"❌ FAILED")
        print(f"   Error: {e}")
        tests_failed += 1
    
    # Test NumPy
    print("📦 Testing NumPy... ", end="")
    try:
        import numpy as np
        version = np.__version__
        print(f"✅ OK (version {version})")
        tests_passed += 1
    except ImportError as e:
        print(f"❌ FAILED")
        print(f"   Error: {e}")
        tests_failed += 1
    
    # Test tqdm
    print("📦 Testing tqdm... ", end="")
    try:
        import tqdm
        version = tqdm.__version__
        print(f"✅ OK (version {version})")
        tests_passed += 1
    except ImportError as e:
        print(f"❌ FAILED")
        print(f"   Error: {e}")
        tests_failed += 1
    
    # Test matplotlib
    print("📦 Testing matplotlib... ", end="")
    try:
        import matplotlib
        version = matplotlib.__version__
        print(f"✅ OK (version {version})")
        tests_passed += 1
    except ImportError as e:
        print(f"❌ FAILED")
        print(f"   Error: {e}")
        tests_failed += 1
    
    print()
    print("-" * 70)
    
    # Test project modules
    print("\n📚 Testing project modules...")
    print()
    
    # Test src package
    print("📦 Testing src package... ", end="")
    try:
        sys.path.insert(0, 'src')
        import extract_frames
        import optical_flow_similarity
        import reconstruct_sequence
        import video_builder
        import visualize_flow
        import utils
        print("✅ OK")
        tests_passed += 1
    except ImportError as e:
        print(f"❌ FAILED")
        print(f"   Error: {e}")
        tests_failed += 1
    
    # Summary
    print()
    print("=" * 70)
    print("TEST SUMMARY")
    print("=" * 70)
    print(f"✅ Tests passed: {tests_passed}")
    print(f"❌ Tests failed: {tests_failed}")
    print()
    
    if tests_failed == 0:
        print("🎉 All tests passed! Your installation is ready.")
        print()
        print("Next steps:")
        print("  1. Place your jumbled video as 'jumbled_video.mp4'")
        print("  2. Run: python main.py")
        print()
        return True
    else:
        print("⚠️  Some tests failed. Please install missing dependencies:")
        print("   pip install -r requirements.txt")
        print()
        return False


def test_opencv_functionality():
    """Test basic OpenCV optical flow functionality."""
    print("\n" + "=" * 70)
    print("TESTING OPENCV OPTICAL FLOW")
    print("=" * 70)
    print()
    
    try:
        import cv2
        import numpy as np
        
        print("🧪 Creating test frames... ", end="")
        # Create two simple test frames
        frame1 = np.zeros((100, 100), dtype=np.uint8)
        frame2 = np.zeros((100, 100), dtype=np.uint8)
        
        # Add a moving square
        frame1[40:60, 30:50] = 255
        frame2[40:60, 35:55] = 255  # Shifted 5 pixels right
        print("✅ OK")
        
        print("🧪 Computing optical flow... ", end="")
        # Compute optical flow
        flow = cv2.calcOpticalFlowFarneback(
            frame1, frame2, None,
            pyr_scale=0.5, levels=3, winsize=15,
            iterations=3, poly_n=5, poly_sigma=1.2, flags=0
        )
        print("✅ OK")
        
        print("🧪 Analyzing flow vectors... ", end="")
        # Check that flow was computed
        magnitude = np.sqrt(flow[..., 0]**2 + flow[..., 1]**2)
        avg_magnitude = np.mean(magnitude)
        print(f"✅ OK (avg magnitude: {avg_magnitude:.2f})")
        
        print()
        print("✅ OpenCV optical flow is working correctly!")
        return True
        
    except Exception as e:
        print(f"❌ FAILED")
        print(f"   Error: {e}")
        print()
        print("⚠️  OpenCV optical flow test failed.")
        return False


def main():
    """Main test function."""
    print()
    print("🔧 Jumbled Frames Reconstruction - Installation Test")
    print()
    
    # Run import tests
    imports_ok = test_imports()
    
    if imports_ok:
        # Run functionality tests
        functionality_ok = test_opencv_functionality()
        
        if functionality_ok:
            print("\n" + "=" * 70)
            print("🎊 SUCCESS! Everything is working correctly!")
            print("=" * 70)
            print()
            sys.exit(0)
    
    print("\n" + "=" * 70)
    print("❌ Installation test failed. Please fix the errors above.")
    print("=" * 70)
    print()
    sys.exit(1)


if __name__ == '__main__':
    main()
