"""
Utility Functions Module

This module contains helper functions for timing, logging, and system information.
Used throughout the project for debugging and performance monitoring.

Author: AI Assistant
Date: 2025-10-24
"""

import time
import os
import sys
import platform
from datetime import datetime
from functools import wraps
from typing import Callable, Any, Tuple


def measure_execution_time(func: Callable) -> Callable:
    """
    Decorator to measure and log execution time of a function.
    
    Usage:
        @measure_execution_time
        def my_function():
            # function code
    
    Args:
        func (Callable): Function to be timed
        
    Returns:
        Callable: Wrapped function that measures execution time
    """
    
    @wraps(func)
    def wrapper(*args, **kwargs) -> Any:
        print(f"\n⏱️  Starting: {func.__name__}")
        start_time = time.time()
        
        try:
            result = func(*args, **kwargs)
            end_time = time.time()
            elapsed = end_time - start_time
            
            print(f"✅ Completed: {func.__name__}")
            print(f"⏱️  Execution time: {format_time(elapsed)}")
            
            return result
            
        except Exception as e:
            end_time = time.time()
            elapsed = end_time - start_time
            
            print(f"❌ Failed: {func.__name__}")
            print(f"⏱️  Execution time before failure: {format_time(elapsed)}")
            raise e
    
    return wrapper


def format_time(seconds: float) -> str:
    """
    Format time in seconds to human-readable string.
    
    Args:
        seconds (float): Time in seconds
        
    Returns:
        str: Formatted time string (e.g., "2m 34s" or "45.2s")
    """
    
    if seconds < 60:
        return f"{seconds:.2f}s"
    elif seconds < 3600:
        minutes = int(seconds // 60)
        secs = seconds % 60
        return f"{minutes}m {secs:.1f}s"
    else:
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = seconds % 60
        return f"{hours}h {minutes}m {secs:.1f}s"


def get_system_info() -> dict:
    """
    Get system information for logging.
    
    Returns:
        dict: System information including OS, Python version, CPU count, etc.
    """
    
    info = {
        'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        'platform': platform.platform(),
        'python_version': sys.version.split()[0],
        'cpu_count': os.cpu_count(),
        'working_directory': os.getcwd()
    }
    
    return info


def log_to_file(log_path: str, content: str, mode: str = 'a') -> None:
    """
    Write content to a log file.
    
    Args:
        log_path (str): Path to log file
        content (str): Content to write
        mode (str): File open mode ('a' for append, 'w' for overwrite)
    """
    
    # Create output directory if needed
    log_dir = os.path.dirname(log_path)
    if log_dir and not os.path.exists(log_dir):
        os.makedirs(log_dir, exist_ok=True)
    
    with open(log_path, mode, encoding='utf-8') as f:
        f.write(content)
        if not content.endswith('\n'):
            f.write('\n')


def create_execution_log(log_path: str, 
                        operations: list,
                        total_time: float,
                        success: bool = True) -> None:
    """
    Create a comprehensive execution log file.
    
    Args:
        log_path (str): Path to save log file
        operations (list): List of tuples (operation_name, time_seconds)
        total_time (float): Total execution time in seconds
        success (bool): Whether execution completed successfully
    """
    
    sys_info = get_system_info()
    
    log_content = "=" * 70 + "\n"
    log_content += "JUMBLED FRAMES RECONSTRUCTION - EXECUTION LOG\n"
    log_content += "=" * 70 + "\n\n"
    
    log_content += "SYSTEM INFORMATION\n"
    log_content += "-" * 70 + "\n"
    log_content += f"Timestamp:         {sys_info['timestamp']}\n"
    log_content += f"Platform:          {sys_info['platform']}\n"
    log_content += f"Python Version:    {sys_info['python_version']}\n"
    log_content += f"CPU Count:         {sys_info['cpu_count']}\n"
    log_content += f"Working Directory: {sys_info['working_directory']}\n\n"
    
    log_content += "EXECUTION SUMMARY\n"
    log_content += "-" * 70 + "\n"
    log_content += f"Status:            {'✅ SUCCESS' if success else '❌ FAILED'}\n"
    log_content += f"Total Time:        {format_time(total_time)}\n"
    log_content += f"Total Operations:  {len(operations)}\n\n"
    
    log_content += "OPERATION BREAKDOWN\n"
    log_content += "-" * 70 + "\n"
    
    for i, (op_name, op_time) in enumerate(operations, 1):
        percentage = (op_time / total_time * 100) if total_time > 0 else 0
        log_content += f"{i:2d}. {op_name:<40} {format_time(op_time):>12} ({percentage:5.1f}%)\n"
    
    log_content += "\n" + "=" * 70 + "\n"
    log_content += "END OF LOG\n"
    log_content += "=" * 70 + "\n"
    
    log_to_file(log_path, log_content, mode='w')
    print(f"📝 Execution log saved to: {log_path}")


def validate_file_exists(file_path: str, description: str = "File") -> bool:
    """
    Validate that a file exists and print appropriate message.
    
    Args:
        file_path (str): Path to file to check
        description (str): Description of the file for error messages
        
    Returns:
        bool: True if file exists, False otherwise
    """
    
    if os.path.exists(file_path):
        print(f"✅ {description} found: {file_path}")
        return True
    else:
        print(f"❌ {description} not found: {file_path}")
        return False


def validate_directory_exists(dir_path: str, description: str = "Directory") -> bool:
    """
    Validate that a directory exists and print appropriate message.
    
    Args:
        dir_path (str): Path to directory to check
        description (str): Description of the directory for error messages
        
    Returns:
        bool: True if directory exists, False otherwise
    """
    
    if os.path.isdir(dir_path):
        print(f"✅ {description} found: {dir_path}")
        return True
    else:
        print(f"❌ {description} not found: {dir_path}")
        return False


def print_banner(text: str) -> None:
    """
    Print a formatted banner for section headers.
    
    Args:
        text (str): Text to display in banner
    """
    
    print("\n" + "=" * 70)
    print(f"  {text}")
    print("=" * 70 + "\n")


if __name__ == "__main__":
    # Example usage for testing
    print("This module should be imported, not run directly.")
    print("Use: from src.utils import measure_execution_time")
