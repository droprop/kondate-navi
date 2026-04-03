import os
import sys
import argparse
import base64
import json
from pathlib import Path
from pydantic import BaseModel, Field
import fitz  # PyMuPDF
import cv2
import numpy as np
import concurrent.futures
import logging

# ターミナルの文字化け対策
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# プロジェクトのルートディレクトリ
BASE_DIR = Path(__file__).resolve().parent.parent

# ロギングの設定
log_dir = BASE_DIR / "logs"
log_dir.mkdir(parents=True, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(log_dir / "system.log", encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

from google import genai
from google.genai import types

# 出力データのスキーマ定義 (Pydantic)
class MetaInfo(BaseModel):
    year_month: str = Field(description="令和X年X月")
    target: str = Field(description="こんだてよてい表（小学校用）など")
    facility_name: str = Field(description="〇〇給食センターなど")

class Ingredients(BaseModel):
    energy_source: list[str] = Field(description="おもにねつやちからのもとになるもの")
    body_building: list[str] = Field(description="おもにからだをつくるもの")
    body_regulating: list[str] = Field(description="おもにからだのちょうしをととのえるもの")

class Nutrition(BaseModel):
    energy_kcal: float | None = Field(description="エネルギー(Kcal)")
    protein_g: float | None = Field(description="たんぱく質(g)")
    fat_g: float | None = Field(description="脂質(g)")
    salt_g: float | None = Field(description="塩分(g)")

class DailyMenu(BaseModel):
    date: int = Field(description="日 (数値)")
    day_of_week: str = Field(description="曜日")
    needs_chopsticks: bool = Field(description="お箸持参フラグ")
    menu_items: list[str] = Field(description="献立名")
    ingredients: Ingredients = Field(description="各種材料")
    nutrition: Nutrition = Field(description="栄養価データ")

class MonthlyMenuReport(BaseModel):
    meta: MetaInfo
    daily_menus: list[DailyMenu]

def get_all_pdfs() -> list[Path]:
    """downloads フォルダから全てのPDFファイルを取得する"""
    downloads_dir = BASE_DIR / "downloads"
    if not downloads_dir.exists():
        return []
        
    return list(downloads_dir.glob("**/*.pdf"))

def detect_chopsticks_mapping(pdf_path: Path) -> dict:
    """OpenCVとPyMuPDFを使用して、物理的なレイアウトからお箸判定(丸の有無)を高精度に抽出する"""
    logger.info(f"[{pdf_path.name}] OpenCVによる箸フラグ(〇)の画像解析を開始...")
    doc = fitz.open(pdf_path)
    page = doc.load_page(0)
    
    # 1. カレンダー列のヘッダー「日」を探す (Dynamic Anchor)
    anchor_x = None
    words = page.get_text("words")
    for w in words:
        x0, y0, x1, y1, text = w[:5]
        if 40 < y0 < 150 and x0 < 200 and text.strip() == "日":
            anchor_x = (x0 + x1) / 2
            break
            
    if anchor_x is None:
        logger.warning(f"[{pdf_path.name}] ヘッダー『日』が見つからなかったため、OpenCV解析をスキップします。")
        return {}

    # 2. 画像から真円度と半径の高い 〇 を抽出
    zoom = 300 / 72
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, alpha=False)
    img_data = np.frombuffer(pix.samples, dtype=np.uint8).reshape(pix.height, pix.width, pix.n)
    img_gray = cv2.cvtColor(img_data, cv2.COLOR_RGB2GRAY) if pix.n == 3 else cv2.cvtColor(img_data, cv2.COLOR_RGBA2GRAY)
    
    thresh = cv2.adaptiveThreshold(img_gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 15, 5)
    contours, _ = cv2.findContours(thresh, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    
    circles = []
    anchor_x_300dpi = float(anchor_x) * zoom
    for cnt in contours:
        approx = cv2.approxPolyDP(cnt, 0.01 * cv2.arcLength(cnt, True), True)
        if len(approx) > 8:
            (cx, cy), radius = cv2.minEnclosingCircle(cnt)
            if 20 < radius < 50 and cv2.contourArea(cnt) > 0:
                circularity = cv2.contourArea(cnt) / (np.pi * (radius ** 2))
                if 0.5 < circularity < 1.2:
                    if abs(cx - anchor_x_300dpi) < 100:
                        circles.append((int(cx), int(cy), int(radius)))

    # 3. 日付と〇図形のマッチング
    date_needs_chopsticks = {}
    for w in words:
        x0, y0, x1, y1, text = w[:5]
        text_center_x = (x0 + x1) / 2
        if text.strip().isdigit() and 1 <= int(text.strip()) <= 31:
            if abs(text_center_x - anchor_x) < 30: 
                day_text = text.strip()
                day = int(day_text)
                text_center_y_300dpi = ((y0 + y1) / 2) * zoom
                text_center_x_300dpi = ((x0 + x1) / 2) * zoom
                
                if day not in date_needs_chopsticks:
                    has_circle = False
                    for cx, cy, cr in circles:
                        dist = np.sqrt((cx - text_center_x_300dpi)**2 + (cy - text_center_y_300dpi)**2)
                        if dist < 60: 
                            has_circle = True
                            break
                    date_needs_chopsticks[day] = has_circle
                
    logger.info(f"[{pdf_path.name}] 画像解析完了: {len(date_needs_chopsticks)}日分のお箸フラグを抽出しました。")
    return date_needs_chopsticks

def transcribe_pdf(pdf_path: Path, model_name: str = "gemini-3.1-pro-preview", project_id: str | None = None, location: str = "global") -> str:
    """Gemini APIを使用してPDFから構造化データを抽出する"""
    
    # Vertex AI の場合
    # credentials は GOOGLE_APPLICATION_CREDENTIALS 環境変数または gcloud auth application-default login から自動取得される前提
    if not project_id:
        # 環境変数からプロジェクトIDを取得してみる（GoogleCloudShellなどの場合）
        project_id = os.environ.get("GOOGLE_CLOUD_PROJECT")
        if not project_id:
            raise ValueError("GCPプロジェクトIDが見つかりません。--project 引数で指定してください。")
            
    client = genai.Client(vertexai=True, project=project_id, location=location)
    logger.info(f"Vertex AI (プロジェクト: {project_id}, リージョン: {location}) を使用して接続します...")
    
    logger.info(f"ファイル {pdf_path.name} を画像に変換中...")
    
    # 変換した画像の保存先 (月別ディレクトリ)
    month_dir_name = pdf_path.parent.name
    images_dir = BASE_DIR / "images" / month_dir_name
    images_dir.mkdir(parents=True, exist_ok=True)
    
    image_parts = []
    
    # PyMuPDFでPDFを開く
    doc = fitz.open(pdf_path)
    if len(doc) > 0:
        page_num = 0  # 1ページ目のみ処理する
        page = doc.load_page(page_num)
        
        # 背景が透過してGemini側で真っ黒になるのを防ぐため、明示的に白背景を敷く
        page.wrap_contents()
        page.draw_rect(page.rect, color=(1, 1, 1), fill=(1, 1, 1), overlay=False)
        
        # 300 DPI相当でレンダリング (zoom = 300/72 = 4.166...)
        zoom = 300 / 72
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        
        # PNGとして保存
        image_filename = f"{pdf_path.stem}_page{page_num + 1}.png"
        image_path = images_dir / image_filename
        pix.save(str(image_path))
        logger.info(f"[ログ] 画像を保存しました: {image_filename}")
        
        logger.info("[ログ] 画像をメモリにロードしてAPI送信用のPartオブジェクトを作成しています...")
        # API送信用のPartオブジェクトを作成
        with open(image_path, "rb") as f:
            image_bytes = f.read()
            
        image_parts.append(
            types.Part.from_bytes(
                data=image_bytes,
                mime_type='image/png',
            )
        )
        
    doc.close()

    logger.info(f"[ログ] モデル '{model_name}' を使用して呼び出し準備完了...")
    
    prompt = """あなたはプロフェッショナルなデータ抽出AIです。
添付された小・中学校の給食献立表の画像から、必要な情報を読み取り、後続のプログラムで処理しやすい厳格なJSONフォーマットで出力してください。

【抽出範囲と除外条件（重要）】
・**出典の限定 (Source Isolation)**: メニュー項目や材料データは、必ずメインのカレンダー（表）の中からのみ抽出してください。
・画像の最下部にある「今月の献立について」やコラム等の「表の外」にある情報は、たとえ補足説明が含まれていても、抽出の根拠として**絶対に**使用しないでください。
・表の内容と表の外の内容が矛盾する場合、必ず「表の中の文字」を正としてください。

【データ加工の厳格なルール】
1. **逐語的かつ自然な抽出 (Literalism & Non-Normalization)**: 
  ・基本ルール: 児童向けのひらがな表記は、大人が読む自然な漢字交じり表記に変換してください（例：「ぎゅうにゅう」→「牛乳」）。
  ・**非正規化の徹底**: 漢字変換する際、元の言葉に含まれる形容詞や特定の表現、固有名詞を勝手に削ったり、一般的な名称に置き換えたり（正規化）しないでください。
    - 良い例: 「やきぼうぎょうざ」→「焼き棒餃子」（"棒"を削らずに残す）
    - 悪い例: 「やきぼうぎょうざ」→「焼き餃子」（一般的すぎる名称への丸めは不可）
  ・**自己補正の禁止 (Anti-Correction)**: 文脈や材料欄の情報、あるいはAI自身の知識に基づいて、献立名を「より正しいと思われる名称」に書き換えることは厳禁です。
    - たとえ材料欄と献立名が矛盾しているように見えても、献立列にある文字を信じてそのまま書き起こしてください。
2. **箸持参フラグ (needs_chopsticks)**: 全て false を設定してください（外部ロジックで画像解析するため）。
3. **配列化（Array）**: 献立名や材料は、改行やスペースを区切りとして個別のアイテムとして配列に格納してください。
4. **数値の型**: 栄養価データと日付は数値（Number）として出力してください。
5. **メタ情報**: target にはタイトル（例：「こんだてよてい表（小学校用）」）を設定してください。


【出力JSONフォーマット】
以下の構造に必ず従い、Markdownのコードブロック（```json など）は一切使用せず、最初の中括弧 `{` から最後の中括弧 `}` までの生のJSON文字列のみを出力してください。前後に挨拶や説明のテキストも絶対に含めないでください。

{
  "meta": {
    "year_month": "令和X年X月",
    "target": "こんだてよてい表（小学校用）",
    "facility_name": "〇〇給食センター"
  },
  "daily_menus": [
    {
      "date": 2,
      "day_of_week": "月",
      "needs_chopsticks": false,
      "menu_items": [
        "ごはん",
        "牛乳",
        "ししゃもの青のり揚げ",
        "春雨サラダ",
        "マーボー豆腐",
        "しらぬいゼリー"
      ],
      "ingredients": {
        "energy_source": ["米", "でんぷん", "油", "春雨", "砂糖", "ゼリー"],
        "body_building": ["牛乳", "子持ちししゃも", "あおさ", "まぐろ", "豚肉", "豆腐", "大豆", "みそ"],
        "body_regulating": ["にんにく", "もやし", "小松菜", "にんじん", "とうもろこし", "しょうが", "たまねぎ", "長ねぎ"]
      },
      "nutrition": {
        "energy_kcal": 656,
        "protein_g": 25.8,
        "fat_g": 23.3,
        "salt_g": 2.0
      }
    }
  ]
}"""

    # 画像とプロンプトを結合してプロンプトデータを作成
    contents = image_parts + [prompt]

    logger.info(f"[ログ] {model_name} の generate_content を開始します。（API通信中です。数十秒〜数分かかる場合があります...）")
    
    # タイムアウト付きでAPIを呼び出すための内部関数
    def _call_api():
        return client.models.generate_content(
            model=model_name,
            contents=contents,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=MonthlyMenuReport,
                temperature=0.1, # より安定的・決定論的な抽出のため低めに設定
            ),
        )

    # 最大3.5分(210秒)でタイムアウトさせる
    TIMEOUT_SECONDS = 210
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(_call_api)
        try:
            response = future.result(timeout=TIMEOUT_SECONDS)
            logger.info(f"[ログ] generate_content からの応答を正常に受信しました！")
            
            # トークン消費量の出力
            if response.usage_metadata:
                usage = response.usage_metadata
                logger.info(f"消費トークン: 入力={usage.prompt_token_count}, 出力={usage.candidates_token_count}, 合計={usage.total_token_count}")
                
            return response.text
        except concurrent.futures.TimeoutError:
            logger.error(f"[エラー] APIからの応答が {TIMEOUT_SECONDS} 秒を超えたため、タイムアウトとして処理を強制中断しました。")
            raise TimeoutError(f"Gemini API 呼び出しが {TIMEOUT_SECONDS} 秒でタイムアウトしました。")

def main():
    parser = argparse.ArgumentParser(description="PDF献立表からGemini APIでデータを構造化抽出します。")
    parser.add_argument("--model", type=str, default="gemini-3.1-pro-preview", 
                        help="使用するGeminiのモデル名 (デフォルト: gemini-3.1-pro-preview)")
    parser.add_argument("--pdf", type=str, 
                        help="特定のPDFファイルを指定する場合のパス (指定がない場合はdownloadsから全取得して未処理のものを実行)")
    parser.add_argument("--output-dir", type=str, default="raw_results",
                        help="結果のJSONを保存するディレクトリ名 (デフォルト: raw_results)")
    parser.add_argument("--force", action="store_true",
                        help="既にJSONが存在しても上書きして再実行する")
    parser.add_argument("--project", type=str, default="argon-tuner-349921",
                        help="Vertex AI 用のGCPプロジェクトID")
    parser.add_argument("--location", type=str, default="global",
                        help="Vertex AI 用のリージョン (デフォルト: global)")
    parser.add_argument("--year", type=int, help="特定の年月のみ処理する場合の対象年")
    parser.add_argument("--month", type=int, help="特定の年月のみ処理する場合の対象月")
    
    args = parser.parse_args()
    
    try:
        # 1. 保存先の準備
        output_dir = BASE_DIR / args.output_dir
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # 2. 対象PDFのリストアップ
        target_pdfs = []
        if args.pdf:
            pdf_path = Path(args.pdf)
            if not pdf_path.exists():
                raise FileNotFoundError(f"指定されたPDFが見つかりません: {pdf_path}")
            target_pdfs.append(pdf_path)
        elif args.year and args.month:
            target_dir = BASE_DIR / "downloads" / f"{args.year:04d}{args.month:02d}"
            if target_dir.exists():
                target_pdfs = list(target_dir.glob("*.pdf"))
            if not target_pdfs:
                logger.warning(f"指定された年月 ({args.year}/{args.month}) のPDFが見つかりません: {target_dir}")
                return
        else:
            target_pdfs = get_all_pdfs()
            if not target_pdfs:
                logger.warning("処理対象のPDFファイルが見つかりません。先にダウンロードを実行してください。")
                return
                
        logger.info(f"処理対象となるPDFは {len(target_pdfs)} 件です。")
        
        # 3. 各PDFに対して文字起こしを実行
        for pdf_path in target_pdfs:
            # 出力先の決定 (月別ディレクトリ)
            month_dir_name = pdf_path.parent.name
            month_output_dir = output_dir / month_dir_name
            month_output_dir.mkdir(parents=True, exist_ok=True)
            
            output_filename = f"{pdf_path.stem}.json"
            output_path = month_output_dir / output_filename
            
            # すでに処理済みかチェック
            if output_path.exists() and not args.force:
                logger.info(f"スキップ: {output_filename} は既に存在します。（上書きするには --force を指定）")
                continue
                
            logger.info(f"--- {pdf_path.name} の処理を開始 ---")
            
            try:
                json_result = transcribe_pdf(
                    pdf_path, 
                    model_name=args.model,
                    project_id=args.project,
                    location=args.location
                )
                parsed_data = json.loads(json_result)
                
                # 画像解析で箸判定フラグを上書き
                cv_chopsticks_flags = detect_chopsticks_mapping(pdf_path)
                for menu in parsed_data.get("daily_menus", []):
                    day = menu.get("date")
                    if day in cv_chopsticks_flags:
                        menu["needs_chopsticks"] = cv_chopsticks_flags[day]
                        
                with open(output_path, "w", encoding="utf-8") as f:
                    json.dump(parsed_data, f, ensure_ascii=False, indent=2)
                    
                logger.info(f"抽出完了! 結果を保存しました: {output_path}")
            except Exception as e:
                logger.error(f"[{pdf_path.name}] の処理中にエラーが発生しました: {e}")
                # エラーが出ても次のファイルの処理を継続する
                continue
                
        logger.info("全ての処理が完了しました。")
        
    except Exception as e:
        logger.error(f"予期せぬエラーが発生しました: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
