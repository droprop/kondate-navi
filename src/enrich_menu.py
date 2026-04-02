import os
import sys
import argparse
import json
from pathlib import Path
from pydantic import BaseModel, Field
import concurrent.futures
import logging

if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = Path(__file__).resolve().parent.parent

log_dir = BASE_DIR / "logs"
log_dir.mkdir(parents=True, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [ENRICH] %(message)s",
    handlers=[
        logging.FileHandler(log_dir / "system.log", encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

from google import genai
from google.genai import types

# スキーマ定義 (元のJSON構造を厳格に保持するため)
class MetaInfo(BaseModel):
    year_month: str
    target: str
    facility_name: str

class Ingredients(BaseModel):
    energy_source: list[str]
    body_building: list[str]
    body_regulating: list[str]

class Nutrition(BaseModel):
    energy_kcal: float | None
    protein_g: float | None
    fat_g: float | None
    salt_g: float | None

class DailyMenu(BaseModel):
    date: int
    day_of_week: str
    needs_chopsticks: bool
    menu_items: list[str]
    ingredients: Ingredients
    nutrition: Nutrition

class MonthlyMenuReport(BaseModel):
    meta: MetaInfo
    daily_menus: list[DailyMenu]


PROMPT_TEMPLATE = """あなたは、学校給食の献立データを解析し、保護者や子供が直感的に内容を理解できるように整える「給食データ専門のエディター」です。
以下のルールに従って、提供されるJSONデータの「menu_items」を加工してください。

### 1. 絵文字の付与ルール（イメージのしやすさ重視）
各メニューの先頭に「1つの絵文字 + 半角スペース」を追加してください。
絵文字は、料理の「主役となる食材」や「最終的な料理の形」を正しく表すものを選びます。以下のルールを厳守してください。

- 【肉・魚は「食材」を最優先】
「さばのケチャップ揚げ」や「ししゃものスパイシー揚げ」のように、主役が明確な魚や肉の場合、調理法（🍤など）よりも食材の絵文字（🐟、🍖、🍗、🥩、🐖など）を最優先してください。🍤はエビやイカなどの海鮮揚げ物や天ぷらにのみ使用してください。
- 【マイナーな絵文字の使用禁止（超重要）】
ファラフェル（🧆）やマテ茶（🧉）のような、日本の一般的な食卓で馴染みのないマイナーな絵文字は絶対に使用しないでください。「コロッケ」には主原料のじゃがいも（🥔）や、一般的なおかず（🍽️、🍱）など、誰もがわかる一般的な絵文字を選んでください。
- 【豆と豆腐（大豆加工品）の区別】
「フライビーンズ」のような実際の豆料理には豆（🫘）を使って構いませんが、「豆腐」や「生揚げ」などの加工品に生豆（🫘）は使わないでください。加工品の場合は料理の見た目（鍋🍲、ステーキ🥩など）を優先してください。
- 【不自然な代用の禁止】
「大根の煮物」にじゃがいも（🥔）を当てるような、見た目や味が違う別の野菜での代用は厳禁です。ピッタリの食材がない場合は、「調理法（煮物なら🍲や🍢）」を選んでください。「味付け海苔」等は用途に合わせて（ご飯のお供なら🍙や🍱）を使用してください。
- 【名前のトラップを回避】
「パンダパン」等に含まれる、動物（🐼）や風景（🗻）の絵文字は絶対に使わず、必ず実際の食べ物（🍞、🍮など）を選んでください。

### 2. 主菜（メインディッシュ）の判定と特定
各日のメニューの中から、献立の核となる「主菜」を判定してください。
- 基本は1つですが、給食特有の「ダブル主菜（例：ししゃもの唐揚げ ＋ マーボー豆腐）」のように、タンパク質メインのおかずが2つある場合は、無理に1つに絞らず、自然に2つとも主菜として判定して構いません。
- 丼もの、カレー、麺類の場合は、その一品自体を主菜とします。
- 副菜（サラダ、和え物）や汁物、デザート、牛乳、白米は主菜としません。

主菜と判定した項目には、絵文字の前に「★」を付与してください。
（例：★🍗 鶏の唐揚げ、★🐟 さばの竜田揚げ、★🍲 マーボー豆腐）

### 3. 絶対遵守の制約事項
- JSONの構造（キー名、ネスト、データ型）は一切変更しないでください。
- menu_items 以外の値（date, ingredients, nutrition, meta等）は、1文字も変更しないでください。
- menu_items の配列の順番も変更しないでください。
- 出力は加工済みのJSONデータのみを返してください。解説や挨拶は不要です。

### 対象のJSONデータ
{source_json}
"""

def enrich_json(client, model_name: str, source_json_str: str) -> str:
    prompt = PROMPT_TEMPLATE.format(source_json=source_json_str)
    
    def _call_api():
        return client.models.generate_content(
            model=model_name,
            contents=[prompt],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=MonthlyMenuReport,
                temperature=0.0, # 決定論的に動作させるため0
            ),
        )

    TIMEOUT_SECONDS = 180
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(_call_api)
        try:
            response = future.result(timeout=TIMEOUT_SECONDS)
            if response.usage_metadata:
                usage = response.usage_metadata
                logger.info(f"消費トークン: 入力={usage.prompt_token_count}, 出力={usage.candidates_token_count}, 合計={usage.total_token_count}")
            return response.text
        except concurrent.futures.TimeoutError:
            raise TimeoutError(f"Gemini API 呼び出しが {TIMEOUT_SECONDS} 秒でタイムアウトしました。")

def main():
    parser = argparse.ArgumentParser(description="生JSONをVertex AIでリッチ化（絵文字/主菜フラグ付与）します。")
    parser.add_argument("--model", type=str, default="gemini-3.1-pro-preview", help="Geminiモデル名")
    parser.add_argument("--project", type=str, default="argon-tuner-349921", help="GCPプロジェクトID")
    parser.add_argument("--location", type=str, default="global", help="リージョン")
    parser.add_argument("--year", type=int, help="処理対象の年")
    parser.add_argument("--month", type=int, help="処理対象の月")
    parser.add_argument("--file", type=str, help="特定のJSONファイルを処理する場合")
    
    args = parser.parse_args()
    
    project_id = args.project or os.environ.get("GOOGLE_CLOUD_PROJECT")
    client = genai.Client(vertexai=True, project=project_id, location=args.location)
    
    raw_results_dir = BASE_DIR / "raw_results"
    results_dir = BASE_DIR / "results"
    target_files = []
    
    if args.file:
        f = Path(args.file)
        if f.exists():
            target_files.append(f)
    elif args.year and args.month:
        month_str = f"{args.year:04d}{args.month:02d}"
        month_dir = raw_results_dir / month_str
        if month_dir.exists():
            target_files = list(month_dir.glob("*.json"))
    else:
        target_files = list(raw_results_dir.glob("**/*.json"))
        
    if not target_files:
        logger.info("処理対象のJSONファイルが見つかりません。")
        return
        
    for json_path in target_files:
        logger.info(f"--- リッチ化処理開始: {json_path.name} ---")
        try:
            with open(json_path, "r", encoding="utf-8") as f:
                source_json_str = f.read()
            
            # 出力先のパスを決定する (raw_results -> results)
            # 例: raw_results/202602/xxx.json -> results/202602/xxx.json
            try:
                rel_path = json_path.relative_to(raw_results_dir)
                out_path = results_dir / rel_path
            except ValueError:
                # --file で絶対パス等で指定された場合など、raw_results配下でない場合のフォールバック
                out_path = results_dir / json_path.name
                
            out_path.parent.mkdir(parents=True, exist_ok=True)
            
            # 生データ (raw) と リッチ化済みデータ (out) の更新日時を比較
            if out_path.exists():
                raw_mtime = json_path.stat().st_mtime
                out_mtime = out_path.stat().st_mtime
                
                # リッチ化済みデータの方が新しければスキップ、生データの方が新しければ再実行
                if out_mtime >= raw_mtime:
                    logger.info(f"スキップ: {out_path.name} は最新の状態です（生データより新しい更新日時）。")
                    continue
                else:
                    logger.info(f"再実行: {out_path.name} は生データが更新されているため、リッチ化をやり直します。")

            logger.info("Vertex AI にリッチ化リクエストを送信中...")
            enriched_str = enrich_json(client, args.model, source_json_str)
            
            # パースして検証
            parsed = json.loads(enriched_str)
            
            # 結果を出力先 (results ディレクトリ等) に保存
            with open(out_path, "w", encoding="utf-8") as f:
                json.dump(parsed, f, ensure_ascii=False, indent=2)
                
            logger.info(f"完了: {out_path.name} に絵文字と主菜フラグを付与し、 {out_path} に保存しました。")
            
        except Exception as e:
            logger.error(f"{json_path.name} の処理中にエラーが発生しました: {e}")
            continue
            
    logger.info("すべてのリッチ化処理が完了しました。")

if __name__ == "__main__":
    main()
