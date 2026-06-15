"""
Validate Aggregated Lunch Data (Quality Gate)

`data/YYYY_M.json`（generate_data.py の出力）を検証し、AI抽出にありがちな
「それっぽいが間違ったデータ」を公開前に検出する。

- ERROR  : 決定的に壊れている（暦と曜日の不一致・空メニュー・日付重複/不正）。
           1件でもあれば exit 1 で publish を止める。
- WARNING: 壊れている可能性が高いが断定できない（栄養値の外れ・牛乳欠落・
           箸フラグ全同一・★主菜の欠落・調理場不足）。既定では公開を止めない。
           --strict 指定時は WARNING も ERROR 扱いにする。

しきい値は既存データ（2026_1〜2026_6 / 276日分）の実測レンジに基づく:
  kcal 601-894 / 塩分 1.6-3.6 / たんぱく 19.5-37.4 / 脂質 13.9-37.8 / 牛乳100%

Usage:
  python src/validate_data.py --year 2026 --month 6
  python src/validate_data.py            # data/ 内の全月を検証
  python src/validate_data.py --strict   # 警告も失敗扱いにする
"""

import sys
import json
import argparse
import logging
import datetime
from pathlib import Path
from collections import defaultdict

if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"

log_dir = BASE_DIR / "logs"
log_dir.mkdir(parents=True, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [VALIDATE] %(message)s",
    handlers=[
        logging.FileHandler(log_dir / "system.log", encoding="utf-8"),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger(__name__)

# 曜日番号(月=0)→日本語表記
WEEKDAYS = ["月", "火", "水", "木", "金", "土", "日"]

# 期待される調理場（部分一致で判定し、名称の表記揺れに強くする）
EXPECTED_FACILITIES = ["第一調理場", "第二調理場", "第三調理場"]

# 栄養価の妥当域（外れたら WARNING）。実測レンジに安全マージンを取った値。
NUTRITION_BOUNDS = {
    "energy_kcal": (300, 1200),
    "salt_g": (0.1, 8.0),
    "protein_g": (5, 60),
    "fat_g": (3, 70),
}


class Report:
    """1ファイル分の検証結果。errors があれば公開を止める。"""

    def __init__(self, label: str):
        self.label = label
        self.errors: list[str] = []
        self.warnings: list[str] = []

    def error(self, msg: str):
        self.errors.append(msg)

    def warn(self, msg: str):
        self.warnings.append(msg)


def facility_short(name: str) -> str:
    """ログ用に調理場名を短く（'... 第一調理場' → '第一調理場'）"""
    for suf in EXPECTED_FACILITIES:
        if suf in name:
            return suf
    return name


def validate_month_file(path: Path) -> Report:
    rep = Report(path.name)

    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception as e:
        rep.error(f"JSONとして読み込めません: {e}")
        return rep

    menus = data.get("menus")
    if not isinstance(menus, list) or len(menus) == 0:
        rep.error("menus が空、または配列ではありません。")
        return rep

    # 調理場ごとにグループ化
    by_facility: dict[str, list[dict]] = defaultdict(list)
    for m in menus:
        by_facility[m.get("facility_name", "(不明)")].append(m)

    # --- 月全体: 調理場の欠落チェック（WARNING） ---
    present = set()
    for name in by_facility:
        for suf in EXPECTED_FACILITIES:
            if suf in name:
                present.add(suf)
    missing = [s for s in EXPECTED_FACILITIES if s not in present]
    if missing:
        rep.warn(f"調理場が不足している可能性: {', '.join(missing)} のデータがありません。")

    # --- 調理場 × 日ごとの検証 ---
    for facility, items in by_facility.items():
        fshort = facility_short(facility)
        seen_dates: set[int] = set()
        chopstick_flags: list[bool] = []
        star_days = 0

        for m in items:
            date = m.get("date")
            dow = m.get("day_of_week")
            tag = f"{fshort} {date}日"

            # 日付の妥当性（ERROR）
            valid_date = None
            try:
                valid_date = datetime.date(int(m["year"]), int(m["month"]), int(date))
            except Exception:
                rep.error(f"{tag}: 日付 year/month/date が不正です ({m.get('year')}/{m.get('month')}/{date})。")

            # 日付重複（ERROR）
            if date in seen_dates:
                rep.error(f"{fshort}: {date}日 が重複しています。")
            seen_dates.add(date)

            # 曜日と暦の整合（ERROR・決定的）
            if valid_date is not None:
                real = WEEKDAYS[valid_date.weekday()]
                if dow != real:
                    rep.error(f"{tag}: 曜日が暦と不一致です（記載『{dow}』/ 実際『{real}』）。")

            # メニュー項目（ERROR）
            mi = m.get("menu_items")
            if not isinstance(mi, list) or len(mi) == 0:
                rep.error(f"{tag}: menu_items が空です。")
                mi = []
            elif any((not isinstance(x, str) or x.strip() == "") for x in mi):
                rep.error(f"{tag}: menu_items に空文字の項目があります。")

            # 栄養価（WARNING）
            nut = m.get("nutrition") or {}
            for key, (lo, hi) in NUTRITION_BOUNDS.items():
                v = nut.get(key)
                if v is None:
                    rep.warn(f"{tag}: 栄養値 {key} が null です。")
                elif not (lo <= v <= hi):
                    rep.warn(f"{tag}: 栄養値 {key}={v} が妥当域 [{lo}, {hi}] の外です。")

            # 牛乳の有無（WARNING・給食はほぼ毎日牛乳が出る）
            if not any("牛乳" in x for x in mi):
                rep.warn(f"{tag}: 牛乳が見当たりません（抽出漏れの可能性）。")

            # 集計
            chopstick_flags.append(bool(m.get("needs_chopsticks")))
            if any(isinstance(x, str) and x.startswith("★") for x in mi):
                star_days += 1

        n = len(items)

        # 箸フラグが月内で全て同一（WARNING・OpenCV判定の破綻を疑う）
        if n >= 5 and len(set(chopstick_flags)) == 1:
            state = "全てtrue" if chopstick_flags[0] else "全てfalse"
            rep.warn(f"{fshort}: 箸フラグが{n}日すべて同一（{state}）。画像解析が壊れている可能性があります。")

        # ★主菜がほとんど無い（WARNING・enrich の失敗を疑う）
        if n > 0 and star_days / n < 0.5:
            rep.warn(f"{fshort}: ★主菜のある日が {star_days}/{n} 日のみ。絵文字/主菜付与(enrich)が失敗している可能性があります。")

    return rep


def main():
    parser = argparse.ArgumentParser(description="集約済み献立データ(data/YYYY_M.json)の品質検証ゲート。")
    parser.add_argument("--year", type=int, help="検証対象の年")
    parser.add_argument("--month", type=int, help="検証対象の月")
    parser.add_argument("--strict", action="store_true", help="WARNING も失敗(exit 1)として扱う")
    args = parser.parse_args()

    if args.year and args.month:
        targets = [DATA_DIR / f"{args.year}_{args.month}.json"]
    else:
        targets = sorted(DATA_DIR.glob("*.json"))

    if not targets:
        logger.error("検証対象のデータファイルが見つかりません。")
        sys.exit(1)

    total_errors = 0
    total_warnings = 0

    for path in targets:
        if not path.exists():
            logger.error(f"ファイルが存在しません: {path}")
            total_errors += 1
            continue

        rep = validate_month_file(path)
        total_errors += len(rep.errors)
        total_warnings += len(rep.warnings)

        if not rep.errors and not rep.warnings:
            logger.info(f"✅ {rep.label}: 問題なし")
            continue

        logger.info(f"--- {rep.label}: ERROR {len(rep.errors)}件 / WARNING {len(rep.warnings)}件 ---")
        for e in rep.errors:
            logger.error(f"  [ERROR] {e}")
        for w in rep.warnings:
            logger.warning(f"  [WARN]  {w}")

    logger.info("====================================================")
    logger.info(f"検証完了: ERROR 合計 {total_errors}件 / WARNING 合計 {total_warnings}件")

    failed = total_errors > 0 or (args.strict and total_warnings > 0)
    if failed:
        logger.error("検証に失敗しました。データの公開を中止すべきです。")
        sys.exit(1)
    else:
        logger.info("検証に合格しました。")
        sys.exit(0)


if __name__ == "__main__":
    main()
