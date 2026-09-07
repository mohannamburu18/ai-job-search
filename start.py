"""
Launcher script to run both FastAPI backend and Next.js frontend concurrently.
Usage:
    python start.py
"""

import subprocess
import sys
import time
import os
import signal

def main():
    root = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(root, "frontend")

    print("==================================================")
    print("  Starting LetMeApply — AI Job Search Web App    ")
    print("==================================================")

    # 1. Start FastAPI Backend on port 8000
    print("[1/2] Starting FastAPI Backend on http://127.0.0.1:8000 ...")
    backend_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "backend.app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=root
    )

    # 2. Start Next.js Frontend on port 3000
    print("[2/2] Starting Next.js Frontend on http://localhost:3000 ...")
    shell_flag = sys.platform == "win32"
    frontend_proc = subprocess.Popen(
        ["npm", "run", "dev"],
        cwd=frontend_dir,
        shell=shell_flag
    )

    print("\nApplication successfully launched!")
    print("-> Web App URL:  http://localhost:3000")
    print("-> API Docs:     http://127.0.0.1:8000/docs")
    print("Press Ctrl+C to terminate both servers.\n")

    try:
        while True:
            time.sleep(1)
            if backend_proc.poll() is not None:
                print("Backend terminated unexpectedly.")
                break
            if frontend_proc.poll() is not None:
                print("Frontend terminated unexpectedly.")
                break
    except KeyboardInterrupt:
        print("\nShutting down servers...")
    finally:
        backend_proc.terminate()
        frontend_proc.terminate()

if __name__ == "__main__":
    main()

