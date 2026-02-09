#!/usr/bin/env python
"""Start Django server for E2E tests with database setup."""
import os
import sys
import subprocess
import time
from pathlib import Path

# Change to the API directory (where manage.py is)
BASE_DIR = Path(__file__).resolve().parent.parent
os.chdir(BASE_DIR)

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

def run_command(cmd_args, description):
    """Run a Django management command using the current Python interpreter."""
    print(f"{description}...", flush=True)
    try:
        result = subprocess.run(
            [sys.executable, 'manage.py'] + cmd_args,
            cwd=BASE_DIR,
            check=True,
            text=True
        )
        return True
    except subprocess.CalledProcessError as e:
        print(f"Warning: {description} failed (exit code {e.returncode})", file=sys.stderr, flush=True)
        return False

def check_database():
    """Check if database is ready."""
    try:
        result = subprocess.run(
            [sys.executable, 'manage.py', 'check', '--database', 'default'],
            cwd=BASE_DIR,
            capture_output=True,
            text=True,
            timeout=5
        )
        return result.returncode == 0
    except (subprocess.TimeoutExpired, subprocess.CalledProcessError):
        return False

def main():
    """Main entry point."""
    print("Starting API server for E2E tests...", flush=True)
    
    # Wait for database (with timeout)
    print("Waiting for database to be ready...", flush=True)
    max_attempts = 30
    for attempt in range(max_attempts):
        if check_database():
            print("Database is ready!", flush=True)
            break
        if attempt < max_attempts - 1:
            time.sleep(1)
    else:
        print("Warning: Database might not be ready, but continuing...", flush=True)

    # Run migrations
    run_command(['migrate', '--noinput'], 'Running migrations')

    # Seed admin user
    run_command(['seed_admin'], 'Seeding admin user')

    # Start the server (this will replace the current process)
    print("Starting Django development server...", flush=True)
    os.execvp(sys.executable, [sys.executable, 'manage.py', 'runserver', '0.0.0.0:8000'])

if __name__ == '__main__':
    main()
