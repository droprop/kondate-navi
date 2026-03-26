import os
import sys
import re
import datetime
import requests
import logging
import argparse
from bs4 import BeautifulSoup

# ターミナルの文字化け対策
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# ロギングの設定
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
log_dir = os.path.join(BASE_DIR, "logs")
os.makedirs(log_dir, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [CHECK] %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(log_dir, "system.log"), encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

INDEX_URL = "https://www.city.urayasu.lg.jp/kodomo/gakko/kyushoku/index.html"
LINE_API_URL = "https://api.line.me/v2/bot/message/push"

def get_menu_page_url():
    """一覧ページから給食献立ページのURLを取得する"""
    try:
        response = requests.get(INDEX_URL, timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "html.parser")
        link = soup.find("a", string=re.compile(r"給食献立"))
        if not link:
            return None
        return requests.compat.urljoin(INDEX_URL, link.get("href"))
    except Exception as e:
        logger.error(f"インデックスページの取得に失敗しました: {e}")
        return None

def check_next_month_menu(year, month):
    """特定の年月の献立がサイト上に公開されているかチェックする"""
    menu_page_url = get_menu_page_url()
    if not menu_page_url:
        return False, None

    try:
        response = requests.get(menu_page_url, timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.content, "html.parser")
        
        reiwa_year = year - 2018
        target_text = f"令和{reiwa_year}年{month}月分献立予定表"
        
        # ページ内に該当のテキストが含まれるリンクがあるか確認
        links = soup.find_all("a")
        for a in links:
            if target_text in a.get_text():
                return True, target_text
                
        return False, None
    except Exception as e:
        logger.error(f"詳細ページのチェック中にエラーが発生しました: {e}")
        return False, None

def send_line_notification(token, user_id, message):
    """LINE Messaging APIを使用して通知を送信する"""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    payload = {
        "to": user_id,
        "messages": [
            {
                "type": "text",
                "text": message
            }
        ]
    }
    try:
        response = requests.post(LINE_API_URL, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        logger.info("LINE通知を送信しました。")
        return True
    except Exception as e:
        logger.error(f"LINE通知の送信に失敗しました: {e}")
        if hasattr(e, 'response') and e.response is not None:
             logger.error(f"Response: {e.response.text}")
        return False

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="フォルダが存在しても強制的に通知を送る")
    parser.add_argument("--test-line", action="store_true", help="強制的にテスト通知をLINEへ送る")
    args = parser.parse_args()

    # 環境変数または直接指定からトークン等を取得
    line_token = os.environ.get("LINE_CHANNEL_ACCESS_TOKEN")
    line_user_id = os.environ.get("LINE_USER_ID")

    if not line_token or not line_user_id:
        logger.error("環境変数 LINE_CHANNEL_ACCESS_TOKEN または LINE_USER_ID が設定されていません。")
        sys.exit(1)

    # ターゲット候補の作成（当月と翌月）
    now = datetime.datetime.now()
    check_targets = [
        (now.year, now.month),
        (now.year + (1 if now.month == 12 else 0), 1 if now.month == 12 else now.month + 1)
    ]

    for year, month in check_targets:
        target_dir = os.path.join(BASE_DIR, "downloads", f"{year:04d}{month:02d}")
        
        # すでにダウンロード済み（＝処理済み）の月なら次の候補へ
        # ※--force がついている場合はスキップしない
        if not args.force and os.path.exists(target_dir):
            if not args.test_line:
                logger.info(f"スキップ: {year}年{month}月は既にデータが存在するため、チェック不要です。")
                continue

        logger.info(f"チェック開始: {year}年{month}月分の献立を探しています...")
        
        found = False
        label = None

        if args.test_line:
            logger.info("テストモード: サイトチェックをスキップしてテストメッセージを送信します。")
            found = True
            label = f"テスト通知（{year}年{month}月分想定）"
        else:
            found, label = check_next_month_menu(year, month)
        
        if found:
            logger.info(f"【発見】{label} が公開されています！")
            # メッセージの見栄えを少し調整
            msg = f"🔔 【献立ナビ】更新されました！\n\n浦安市公式サイトにて「{label}」の公開を確認しました！\n\nお手すきの際に、以下のコマンドを実行してアプリを更新してください：\n\npython src/run_pipeline.py"
            send_line_notification(line_token, line_user_id, msg)
            break # 1つ見つかったらそこで終了（1回の実行で1つの通知に抑える）
        else:
            logger.info(f"{year}年{month}月分はまだ公開されていませんでした。")

if __name__ == "__main__":
    main()
