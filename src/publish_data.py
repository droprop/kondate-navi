import sys
import os
import argparse
import shutil
import json
import logging
import subprocess

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
log_dir = os.path.join(BASE_DIR, "logs")
os.makedirs(log_dir, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [PUBLISH] %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(log_dir, "system.log"), encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

def main():
    parser = argparse.ArgumentParser(description="Validates data, copies to frontend, and pushes to Git.")
    parser.add_argument("--year", type=int, required=True, help="Target year")
    parser.add_argument("--month", type=int, required=True, help="Target month")
    args = parser.parse_args()

    target_year = args.year
    target_month = args.month

    # Step 1: Copy data to webapp/public/data
    logger.info(f"Copying data to local Next.js environment...")
    src_data_dir = os.path.join(BASE_DIR, "data")
    dest_data_dir = os.path.join(BASE_DIR, "webapp", "public", "data")
    os.makedirs(dest_data_dir, exist_ok=True)
    try:
        if os.path.exists(src_data_dir):
            for item in os.listdir(src_data_dir):
                if item.endswith(".json"):
                    shutil.copy2(os.path.join(src_data_dir, item), os.path.join(dest_data_dir, item))
            logger.info("Successfully copied data to webapp/public/data/.")
        else:
            logger.warning("Source data directory not found for copying.")
    except Exception as e:
        logger.error(f"Failed to copy data: {e}")

    # Step 2: Validation
    logger.info(f"Validating Output Data for {target_year}/{target_month}...")
    output_file = os.path.join(src_data_dir, f"{target_year}_{target_month}.json")
    if not os.path.exists(output_file):
        logger.error(f"Validation failed: Data file {output_file} does not exist. Aborting push.")
        sys.exit(1)
        
    try:
        with open(output_file, 'r', encoding='utf-8') as f:
            output_json = json.load(f)
            if "menus" not in output_json or len(output_json["menus"]) == 0:
                logger.error(f"Validation failed: No menu items found in {output_file}. Aborting push.")
                sys.exit(1)
        logger.info("Validation passed: Output JSON has valid menu items.")
    except Exception as e:
        logger.error(f"Validation failed: Could not parse output json: {e}. Aborting push.")
        sys.exit(1)

    # Step 3: Git Sync
    logger.info(f"Synchronizing with GitHub Repository...")
    os.chdir(BASE_DIR)
    try:
        # Stage changes
        # 最終的なWeb用JSONデータのみをGit管理し、PDFや中間処理結果は除外する
        subprocess.run(["git", "add", "data", "webapp/public/data"], check=True)
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
