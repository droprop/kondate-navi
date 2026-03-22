"""
Generate Web App Data

Reads raw JSON files from `results/*/` and aggregates them into Month-based JSON files `data/YYYY_M.json`.
"""

import os
import sys
import json
import re
import logging
from pathlib import Path

# Setup centralized logging
BASE_DIR = Path(__file__).resolve().parent.parent
log_dir = BASE_DIR / "logs"
log_dir.mkdir(parents=True, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [GENERATE_DATA] %(message)s",
    handlers=[
        logging.FileHandler(log_dir / "system.log", encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

RESULTS_DIR = BASE_DIR / "results"
OUTPUT_DIR = BASE_DIR / "data"

import argparse

RESULTS_DIR = BASE_DIR / "results"
OUTPUT_DIR = BASE_DIR / "data"

def generate_data(year=None, month=None):
    if not RESULTS_DIR.exists():
        logger.warning(f"Directory {RESULTS_DIR} not found. Outputting nothing.")
        return

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    month_cache = {}  # "2026_4": [menus...]
    
    # ターゲットディレクトリの決定
    if year and month:
        target_folders = [RESULTS_DIR / f"{year:04d}{month:02d}"]
    else:
        # 引数がない場合は、resultsディレクトリ内のすべてのフォルダを対象にする（従来互換）
        target_folders = [d for d in RESULTS_DIR.iterdir() if d.is_dir()]

    for month_folder in target_folders:
        if month_folder.exists():
            for file_path in month_folder.glob("*.json"):
                with open(file_path, "r", encoding="utf-8") as f:
                    try:
                        data = json.load(f)
                    except json.JSONDecodeError as e:
                        logger.error(f"Failed to parse {file_path}: {e}")
                        continue
                
                if "daily_menus" in data:
                    meta = data.get("meta", {})
                    ym_str = meta.get("year_month", "")
                    
                    # Extract year and month
                    # 初期値としてフォルダ名などから推測
                    folder_name = month_folder.name
                    try:
                        f_year = int(folder_name[:4])
                        f_month = int(folder_name[4:6])
                    except:
                        f_year, f_month = 2026, 1
                    
                    m_match = re.search(r"(\d{4})年(\d+)月", ym_str)
                    if m_match:
                        f_year = int(m_match.group(1))
                        f_month = int(m_match.group(2))
                    else:
                        m_match = re.search(r"令和(\d+)年(\d+)月", ym_str)
                        if m_match:
                            f_year = 2018 + int(m_match.group(1))
                            f_month = int(m_match.group(2))
                    
                    facility_name = meta.get("facility_name", "")
                    
                    for m in data["daily_menus"]:
                        entry = dict(m)
                        entry["facility_name"] = facility_name
                        entry["year"] = f_year
                        entry["month"] = f_month
                        entry["date_id"] = f"{f_year}-{f_month}-{m['date']}"
                        
                        key = f"{f_year}_{f_month}"
                        if key not in month_cache:
                            month_cache[key] = []
                        month_cache[key].append(entry)

    # Output monthly files
    if not month_cache:
        logger.warning("No data found to aggregate.")
        return

    for key, menus in month_cache.items():
        month_file = OUTPUT_DIR / f"{key}.json"
        with open(month_file, "w", encoding="utf-8") as f:
            json.dump({"menus": menus}, f, ensure_ascii=False, indent=2)
        logger.info(f"Generated data/{key}.json with {len(menus)} records.")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--year", type=int, help="Target year")
    parser.add_argument("--month", type=int, help="Target month")
    args = parser.parse_args()
    generate_data(args.year, args.month)
