"""
Utility Functions Module
=========================
Helper functions for timing, logging, and general utilities.
"""

import time
import functools
from typing import Callable, Any


def measure_execution_time(func: Callable) -> Callable:
    """
    Decorator to measure and display execution time of a function.
    
    Args:
        func (Callable): Function to be timed
        
    Returns:
        Callable: Wrapped function with timing
    """
    @functools.wraps(func)
    def wrapper(*args, **kwargs) -> Any:
        start_time = time.time()
        print(f"\n⏱️  Starting: {func.__name__}")
        
        result = func(*args, **kwargs)
        
        end_time = time.time()
        elapsed_time = end_time - start_time
        
        # Format time nicely
        if elapsed_time < 60:
            time_str = f"{elapsed_time:.2f} seconds"
        else:
            minutes = int(elapsed_time // 60)
            seconds = elapsed_time % 60
            time_str = f"{minutes} min {seconds:.2f} sec"
        
        print(f"✅ Completed: {func.__name__} in {time_str}")
        
        return result
    
    return wrapper


class ExecutionLogger:
    """
    Class to log execution details and save to file.
    """
    
    def __init__(self, log_file: str):
        """
        Initialize the execution logger.
        
        Args:
            log_file (str): Path to the log file
        """
        self.log_file = log_file
        self.logs = []
        self.start_time = time.time()
    
    def log(self, message: str):
        """
        Add a log message with timestamp.
        
        Args:
            message (str): Message to log
        """
        timestamp = time.time() - self.start_time
        log_entry = f"[{timestamp:.2f}s] {message}"
        self.logs.append(log_entry)
        print(log_entry)
    
    def save(self):
        """
        Save all logs to the log file.
        """
        with open(self.log_file, 'w') as f:
            f.write("=" * 70 + "\n")
            f.write("JUMBLED FRAMES RECONSTRUCTION - EXECUTION LOG\n")
            f.write("=" * 70 + "\n\n")
            
            for log in self.logs:
                f.write(log + "\n")
            
            total_time = time.time() - self.start_time
            f.write("\n" + "=" * 70 + "\n")
            f.write(f"TOTAL EXECUTION TIME: {total_time:.2f} seconds\n")
            f.write("=" * 70 + "\n")
        
        print(f"\n📄 Execution log saved to: {self.log_file}")


def format_time(seconds: float) -> str:
    """
    Format seconds into a human-readable string.
    
    Args:
        seconds (float): Time in seconds
        
    Returns:
        str: Formatted time string
    """
    if seconds < 60:
        return f"{seconds:.2f} seconds"
    elif seconds < 3600:
        minutes = int(seconds // 60)
        remaining_seconds = seconds % 60
        return f"{minutes} min {remaining_seconds:.2f} sec"
    else:
        hours = int(seconds // 3600)
        remaining_minutes = int((seconds % 3600) // 60)
        remaining_seconds = seconds % 60
        return f"{hours} hr {remaining_minutes} min {remaining_seconds:.2f} sec"


def print_section_header(title: str):
    """
    Print a formatted section header.
    
    Args:
        title (str): Section title
    """
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)


def print_progress(current: int, total: int, prefix: str = "Progress"):
    """
    Print a simple progress indicator.
    
    Args:
        current (int): Current progress value
        total (int): Total value
        prefix (str): Prefix text for the progress
    """
    percentage = (current / total) * 100
    print(f"{prefix}: {current}/{total} ({percentage:.1f}%)", end='\r')
