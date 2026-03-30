"""
Master Automation Pipeline

Usage: python src/run_pipeline.py [--year YYYY] [--month M]

This script chains together:
1. PDF Download
2. Gemini Transcription & Region Analysis
3. JSON Aggregation

Logs are universally captured into logs/system.log along with standard output.
"""

import sys
import os
import argparse
from datetime import datetime
import subprocess
import logging

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
log_dir = os.path.join(BASE_DIR, "logs")
os.makedirs(log_dir, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [PIPELINE] %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(log_dir, "system.log"), encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def main():
    parser = argparse.ArgumentParser(description="Master pipeline for downloading, parsing, and aggregating the school lunch menu.")
    parser.add_argument("--year", type=int, help="Target year (e.g. 2026)")
    parser.add_argument("--month", type=int, help="Target month (1-12)")
    parser.add_argument("--push", action="store_true", help="Git commit & push automatically after success")
    args = parser.parse_args()

    now = datetime.now()
    if not args.year or not args.month:
        target_month = now.month + 1
        target_year = now.year
        if target_month > 12:
            target_month = 1
            target_year += 1
    else:
        target_year = args.year
        target_month = args.month

    logger.info(f"=== Starting Automation Pipeline for target: {target_year}/{target_month} ===")
    os.chdir(BASE_DIR)

    # Step 1: Download PDF
    logger.info(f"[Step 1] Triggering PDF Download Tool...")
    dl_cmd = [sys.executable, "src/download_menu.py", str(target_year), str(target_month)]
    result = subprocess.run(dl_cmd)
    if result.returncode != 0:
        logger.error(f"Failed to download PDF for {target_year}/{target_month}.")
        logger.info("The menu might not be published yet. Safely aborting pipeline to try again tomorrow.")
        sys.exit(1)

    # Step 2: Transcribe PDF into JSON
    logger.info(f"[Step 2] Triggering Vertex AI Audio/Image Analysis...")
    transcribe_cmd = [
        sys.executable, "src/transcribe_pdf.py", 
        "--force", 
        "--year", str(target_year), 
        "--month", str(target_month)
    ]
    result = subprocess.run(transcribe_cmd)
    if result.returncode != 0:
        logger.error("Transcribe tool crashed or timed out. Aborting pipeline.")
        sys.exit(1)

    # Step 3: Generate and aggregate data
    logger.info(f"[Step 3] Dispatching Data Aggregator...")
    generate_cmd = [
        sys.executable, "src/generate_data.py",
        "--year", str(target_year),
        "--month", str(target_month)
    ]
    result = subprocess.run(generate_cmd)
    if result.returncode != 0:
        logger.error("Failed to aggregate final data JSON.")
        sys.exit(1)

    logger.info(f"=== Pipeline Processing Complete ===")
    logger.info(f"Artifacts ({target_year}_{target_month}) have been successfully generated.")

    # Step 5: Git Sync (Optional)
    if args.push:
        logger.info(f"[Step 5] Synchronizing with GitHub Repository...")
        try:
            # Stage changes
            subprocess.run(["git", "add", "downloads", "results", "data"], check=True)
            # Commit
            commit_msg = f"auto: update lunch data for {target_year}-{target_month}"
            subprocess.run(["git", "commit", "-m", commit_msg], check=True)
            # Push
            subprocess.run(["git", "push", "origin", "main"], check=True)
            logger.info("Successfully pushed updates to GitHub.")
        except subprocess.CalledProcessError as e:
            logger.error(f"Git synchronization failed: {e}")
            sys.exit(1)

if __name__ == "__main__":
    main()
