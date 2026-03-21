import sys
import os
import re
import urllib.parse
import datetime
import requests
import logging

# ターミナルの文字化け対策
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# ロギングの設定 (プロジェクトのルート/logs/transcribe.log へ)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
log_dir = os.path.join(BASE_DIR, "logs")
os.makedirs(log_dir, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(log_dir, "system.log"), encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

from bs4 import BeautifulSoup

INDEX_URL = "https://www.city.urayasu.lg.jp/kodomo/gakko/kyushoku/index.html"

def get_menu_page_url():
    """一覧ページから給食献立ページのURLを取得する"""
    response = requests.get(INDEX_URL)
    response.raise_for_status()
    soup = BeautifulSoup(response.content, "html.parser")
    
    # "給食献立"というテキストを含み、かつaタグであるものを探す
    link = soup.find("a", string=re.compile(r"給食献立"))
    if not link:
        raise ValueError("給食献立のリンクが見つかりませんでした。")
        
    return urllib.parse.urljoin(INDEX_URL, link.get("href"))

def download_pdfs(year=None, month=None):
    """献立予定表PDFをダウンロードする処理
    
    Args:
        year: 対象の年（西暦）。指定がない場合は現在の年
        month: 対象の月。指定がない場合は現在の月
    """
    if year is None or month is None:
        now = datetime.datetime.now()
        year = year or now.year
        month = month or now.month
        
    reiwa_year = year - 2018
    
    menu_page_url = get_menu_page_url()
    logger.info(f"詳細ページのURL: {menu_page_url}")
    
    response = requests.get(menu_page_url)
    response.raise_for_status()
    soup = BeautifulSoup(response.content, "html.parser")
    
    # 検索対象の文字列 (例: 令和8年2月分献立予定表)
    target_text = f"令和{reiwa_year}年{month}月分献立予定表"
    logger.info(f"検索対象: {target_text}")
    
    # プロジェクトのルートディレクトリを取得 (srcの親ディレクトリ)
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    # 保存先フォルダの作成 (downloads/YYYYMM形式)
    folder_name = f"{year:04d}{month:02d}"
    download_dir = os.path.join(base_dir, "downloads", folder_name)
    os.makedirs(download_dir, exist_ok=True)
    
    # 見出しタグから「第一調理場」「第二調理場（第ニも含む）」を探す
    # サイト上の表記揺れ（漢数字の二とカタカナのニ）を吸収する正規表現
    headers = soup.find_all(re.compile(r"^h[1-6]$"), string=re.compile(r"小学校給食.*第[一二ニ]調理場"))
    
    if not headers:
        logger.warning("警告: ページ内に第一調理場・第二調理場の見出しが見つかりませんでした。")
        return []
    
    downloaded_files = []
    
    for header in headers:
        header_text = header.get_text()
        logger.info(f"見出し発見: {header_text}")
        
        # 見出しの次の要素からリンクを探していく
        curr_elem = header.find_next_sibling()
        found_link = None
        
        # 次の見出しが来るまで探索
        while curr_elem and curr_elem.name not in ["h1", "h2", "h3", "h4", "h5", "h6"]:
            links = curr_elem.find_all("a") if hasattr(curr_elem, "find_all") else []
            # curr_elem自身がAタグの場合
            if curr_elem.name == "a":
                links.append(curr_elem)
                
            for a in links:
                a_text = a.get_text()
                if target_text in a_text:
                    found_link = urllib.parse.urljoin(menu_page_url, a.get("href"))
                    break
                    
            if found_link:
                break
            curr_elem = curr_elem.find_next_sibling()
            
        if found_link:
            # 第一か第二かを判定してファイル名に付与
            suffix = "第一調理場" if "第一" in header_text else "第二調理場"
            
            # 元のファイル名をURLから抽出
            parsed_url = urllib.parse.urlparse(found_link)
            original_filename = os.path.basename(parsed_url.path)
            
            filepath = os.path.join(download_dir, f"献立予定表_{suffix}_{original_filename}")
            
            logger.info(f"ダウンロード中: {found_link} -> {filepath}")
            pdf_response = requests.get(found_link)
            pdf_response.raise_for_status()
            
            with open(filepath, "wb") as f:
                f.write(pdf_response.content)
            
            downloaded_files.append(filepath)
            logger.info(f"保存完了: {filepath}")
        else:
            logger.warning(f"警告: '{header_text}' の下に '{target_text}' のリンクが見つかりませんでした。")

    return downloaded_files

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("year", type=int, nargs="?", default=None)
    parser.add_argument("month", type=int, nargs="?", default=None)
    args = parser.parse_args()
    download_pdfs(args.year, args.month)
