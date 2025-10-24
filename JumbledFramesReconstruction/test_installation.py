#!/usr/bin/env python3
"""
Installation Test Script

Run this script to verify that all dependencies are correctly installed
and the project structure is set up properly.

Usage: python test_installation.py
"""

import sys
import os


def print_status(message, status):
    """Print a status message with emoji."""
    emoji = "✅" if status else "❌"
    print(f"{emoji} {message}")
    return status


def test_imports():
    """Test that all required libraries can be imported."""
    print("\n📦 Testing Package Imports...")
    print("-" * 50)
    
    all_ok = True
    
    # Test core dependencies
    packages = [
        ('cv2', 'opencv-python'),
        ('numpy', 'numpy'),
        ('matplotlib', 'matplotlib'),
        ('seaborn', 'seaborn'),
        ('tqdm', 'tqdm'),
        ('skimage', 'scikit-image'),
        ('scipy', 'scipy')
    ]
    
    for module_name, package_name in packages:
        try:
            __import__(module_name)
            print_status(f"{package_name}: Installed", True)
        except ImportError:
            print_status(f"{package_name}: NOT FOUND", False)
            print(f"   Install with: pip install {package_name}")
            all_ok = False
    
    return all_ok


def test_project_structure():
    """Test that project directories exist."""
    print("\n📁 Testing Project Structure...")
    print("-" * 50)
    
    all_ok = True
    
    required_dirs = [
        'src',
        'frames',
        'output'
    ]
    
    required_files = [
        'main.py',
        'requirements.txt',
        'README.md',
        'src/extract_frames.py',
        'src/frame_similarity.py',
        'src/reconstruct_sequence.py',
        'src/video_builder.py',
        'src/utils.py',
        'src/visualize_similarity.py'
    ]
    
    for directory in required_dirs:
        exists = os.path.isdir(directory)
        print_status(f"Directory: {directory}", exists)
        all_ok = all_ok and exists
    
    for file in required_files:
        exists = os.path.isfile(file)
        print_status(f"File: {file}", exists)
        all_ok = all_ok and exists
    
    return all_ok


def test_opencv_video_support():
    """Test OpenCV video codec support."""
    print("\n🎬 Testing OpenCV Video Support...")
    print("-" * 50)
    
    try:
        import cv2
        
        # Check for common video codecs
        codecs = ['mp4v', 'avc1', 'XVID', 'MJPG']
        
        for codec in codecs:
            fourcc = cv2.VideoWriter_fourcc(*codec)
            status = fourcc != -1
            print_status(f"Codec '{codec}' support", status)
        
        return True
        
    except Exception as e:
        print_status(f"OpenCV test failed: {e}", False)
        return False


def test_module_imports():
    """Test that project modules can be imported."""
    print("\n🔧 Testing Project Modules...")
    print("-" * 50)
    
    all_ok = True
    
    # Add src to path
    sys.path.insert(0, 'src')
    
    modules = [
        'extract_frames',
        'frame_similarity',
        'reconstruct_sequence',
        'video_builder',
        'utils',
        'visualize_similarity'
    ]
    
    for module in modules:
        try:
            __import__(module)
            print_status(f"Module: {module}", True)
        except ImportError as e:
            print_status(f"Module: {module}", False)
            print(f"   Error: {e}")
            all_ok = False
    
    return all_ok


def test_python_version():
    """Check Python version."""
    print("\n🐍 Testing Python Version...")
    print("-" * 50)
    
    version = sys.version_info
    current = f"{version.major}.{version.minor}.{version.micro}"
    required = (3, 10)
    
    ok = (version.major, version.minor) >= required
    
    print(f"   Current: Python {current}")
    print(f"   Required: Python {required[0]}.{required[1]}+")
    
    print_status(f"Python version OK", ok)
    
    return ok


def main():
    """Run all tests."""
    print("=" * 50)
    print("  INSTALLATION TEST - Jumbled Frames Reconstruction")
    print("=" * 50)
    
    tests = [
        ("Python Version", test_python_version),
        ("Package Imports", test_imports),
        ("Project Structure", test_project_structure),
        ("OpenCV Video Support", test_opencv_video_support),
        ("Project Modules", test_module_imports)
    ]
    
    results = []
    
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result))
        except Exception as e:
            print(f"\n❌ Test '{test_name}' failed with error: {e}")
            results.append((test_name, False))
    
    # Summary
    print("\n" + "=" * 50)
    print("  TEST SUMMARY")
    print("=" * 50)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        print_status(f"{test_name}", result)
    
    print("-" * 50)
    print(f"   Tests Passed: {passed}/{total}")
    
    if passed == total:
        print("\n🎉 SUCCESS! All tests passed!")
        print("   You're ready to run: python main.py")
        return True
    else:
        print("\n⚠️  Some tests failed. Please resolve issues before running main.py")
        return False


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
