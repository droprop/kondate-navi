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

def generate_data():
    if not RESULTS_DIR.exists():
        logger.warning(f"Directory {RESULTS_DIR} not found. Outputting nothing.")
        return

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    month_cache = {}  # "2026_4": [menus...]
    all_menus = []

    for month_folder in RESULTS_DIR.iterdir():
        if month_folder.is_dir():
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
                    year, month_num = 2026, 1
                    
                    m_match = re.search(r"(\d{4})年(\d+)月", ym_str)
                    if m_match:
                        year = int(m_match.group(1))
                        month_num = int(m_match.group(2))
                    else:
                        m_match = re.search(r"令和(\d+)年(\d+)月", ym_str)
                        if m_match:
                            year = 2018 + int(m_match.group(1))
                            month_num = int(m_match.group(2))
                    
                    facility_name = meta.get("facility_name", "")
                    
                    for m in data["daily_menus"]:
                        entry = dict(m)
                        entry["facility_name"] = facility_name
                        entry["year"] = year
                        entry["month"] = month_num
                        entry["date_id"] = f"{year}-{month_num}-{m['date']}"
                        
                        key = f"{year}_{month_num}"
                        if key not in month_cache:
                            month_cache[key] = []
                        month_cache[key].append(entry)
                        all_menus.append(entry)

    # Output monthly files
    for key, menus in month_cache.items():
        month_file = OUTPUT_DIR / f"{key}.json"
        with open(month_file, "w", encoding="utf-8") as f:
            json.dump({"menus": menus}, f, ensure_ascii=False, indent=2)
        logger.info(f"Generated data/{key}.json with {len(menus)} records.")

    # Output master file
    out_file = OUTPUT_DIR / "all_menus.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump({"menus": all_menus}, f, ensure_ascii=False, indent=2)
    logger.info(f"Successfully generated master all_menus.json with {len(all_menus)} total records.")

if __name__ == "__main__":
    generate_data()
