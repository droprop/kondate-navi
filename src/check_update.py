import os
import sys
import re
import datetime
import requests
import logging
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
    # 環境変数または直接指定からトークン等を取得
    line_token = os.environ.get("LINE_CHANNEL_ACCESS_TOKEN")
    line_user_id = os.environ.get("LINE_USER_ID")

    if not line_token or not line_user_id:
        logger.error("環境変数 LINE_CHANNEL_ACCESS_TOKEN または LINE_USER_ID が設定されていません。")
        # ローカルテスト用に引数でも受け取れるようにする場合はここで調整
        sys.exit(1)

    # ターゲット月の計算（基本は翌月）
    now = datetime.datetime.now()
    target_month = now.month + 1
    target_year = now.year
    if target_month > 12:
        target_month = 1
        target_year += 1

    logger.info(f"チェック開始: {target_year}年{target_month}月分の献立を探しています...")
    
    # すでにダウンロード済み（＝処理済み）の月なら通知をスキップする
    target_dir = os.path.join(BASE_DIR, "downloads", f"{target_year:04d}{target_month:02d}")
    if os.path.exists(target_dir):
        logger.info(f"スキップ: 既にフォルダ {target_dir} が存在するため、通知済みと判断しました。")
        return

    found, label = check_next_month_menu(target_year, target_month)
    
    if found:
        logger.info(f"【発見】{label} が公開されています！")
        # メッセージの見栄えを少し調整
        msg = f"🔔 【献立ナビ】更新のお知らせ\n\n浦安市公式サイトにて「{label}」の公開を確認しました！\n\nお手すきの際に、以下のコマンドを実行してアプリを更新してください：\n\npython src/run_pipeline.py"
        send_line_notification(line_token, line_user_id, msg)
    else:
        logger.info("まだ公開されていませんでした。")

if __name__ == "__main__":
    main()
