#!/usr/bin/env python3
"""
A2A Travel Packing Agents - Start All Script (Python version)
Cross-platform script to start all travel packing agents
"""

import subprocess
import time
import signal
import sys
import os
from typing import List

AGENTS = [
    {"name": "Personal Belongings", "file": "personal_belongings.py", "port": 9997, "emoji": "🎒"},
    {"name": "Clothing", "file": "clothing.py", "port": 9998, "emoji": "👕"},
    {"name": "Search", "file": "search.py", "port": 9999, "emoji": "🔍"},
    {"name": "Documents", "file": "documents.py", "port": 9995, "emoji": "📄"},
    {"name": "Research", "file": "research.py", "port": 9996, "emoji": "🗺️"},
    {"name": "Packing", "file": "packing.py", "port": 9994, "emoji": "📦"},
]

processes: List[subprocess.Popen] = []

def cleanup_processes():
    """Clean up existing processes on agent ports"""
    print("Cleaning up existing processes...")
    for agent in AGENTS:
        try:
            # Try to kill processes on the port (Unix/Linux/macOS)
            subprocess.run(
                f"lsof -ti:{agent['port']} | xargs kill -9",
                shell=True,
                check=False,
                capture_output=True
            )
        except:
            pass

def signal_handler(sig, frame):
    """Handle Ctrl+C gracefully"""
    print("\n🛑 Stopping all agents...")
    for process in processes:
        try:
            process.terminate()
            process.wait(timeout=5)
        except:
            try:
                process.kill()
            except:
                pass
    print("✅ All agents stopped!")
    sys.exit(0)

def main():
    print("🧳 Starting all travel packing agents...")

    # Setup signal handler for graceful shutdown
    signal.signal(signal.SIGINT, signal_handler)

    cleanup_processes()

    print("Starting agents...")

    # Start all agents in the background
    for agent in AGENTS:
        print(f"  {agent['emoji']} {agent['name']} Agent (Port {agent['port']})...")
        try:
            # Use shell=True for simpler process management
            process = subprocess.Popen(
                f"uv run python {agent['file']}",
                shell=True,
                stdout=subprocess.DEVNULL,
                stderr=subprocess.DEVNULL,
                cwd=os.path.dirname(os.path.abspath(__file__))
            )
            processes.append(process)
            time.sleep(1)  # Longer delay for startup
        except Exception as e:
            print(f"❌ Failed to start {agent['name']} Agent: {e}")
            continue

    # Wait for startup
    time.sleep(5)

    print("")
    print("✅ All agents started successfully!")
    print("")
    print("Agent Status:")
    for agent in AGENTS:
        print(f"  {agent['name']:18}: http://localhost:{agent['port']}")

    print("")
    print("🌍 Frontend: http://localhost:3000")
    print("")
    print("Press Ctrl+C to stop all agents")

    # Keep the script running and monitor processes
    try:
        while True:
            time.sleep(10)  # Check every 10 seconds
            # Optionally check if processes are still alive
            alive_count = sum(1 for p in processes if p.poll() is None)
            if alive_count == 0:
                print("⚠️  All agents have stopped")
                break
    except KeyboardInterrupt:
        signal_handler(signal.SIGINT, None)

if __name__ == "__main__":
    main()