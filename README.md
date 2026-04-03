# 🍱 こんだてナビ (浦安市 小・中学校 給食非公式ポータル)

## 📌 プロジェクト概要
浦安市の学校給食（小学校 全17校 & 中学校 全10校相当）の献立PDFを毎月自動でダウンロードし、GeminiのAIパワーを使って構造化データ（JSON）に変換。Firebase上のモダンなWebアプリ（Next.js）でスマホからサクサク見れるようにするPWA対応アプリです。

## ⚙️ システム構成と全体像
- **バックエンド（データ生成）**: Pythonスクリプト (`src/`) + Gemini API 
- **フロントエンド（表示画面）**: Next.js (`webapp/`) + Tailwind CSS
- **インフラ**: GitHub Pages (JSON配信用) + Firebase Hosting (Webアプリ公開用)

---

## 🚀 毎月の運用フロー（通知が来たらやること）

GitHub Actions による自動監視システムから、LINE で「新しい献立 PDF が公開されたよ！」という通知が届いたら、以下の手順を実行するだけで毎月のデータ更新・運用が完結します。

### 手順: マスターパイプラインの実行
VSCode等のターミナルを開き、プロジェクトのルートディレクトリで以下の「魔法のコマンド」を1回だけ実行します。

```bash
# 通常（翌月分を自動取得して Git に Push する場合）
python src\run_pipeline.py --push

# イレギュラー（今月分が遅れて公開された場合や、特定の月を指定する場合）
python src\run_pipeline.py --year 2026 --month 4 --push
```

**【このスクリプトが自動でやってくれること】**
1. 最新のPDF（指定月、または翌月分）を市のサイトから自動ダウンロード（小・中学校の両方）
2. AI（Gemini）と画像解析（OpenCV）で「主菜・メニュー・食材・お箸の有無」をJSON抽出
3. `enrich_menu.py` により絵文字を自動付与し、重要メニュー（★）を最上位へソート
4. 完成したJSONを GitHub Pages の公開ディレクトリへ反映（アプリは自動更新されます）

スクリプトが「Pipeline Processing Complete」と表示したら運用完了です。
[https://kondate-navi.web.app/](https://kondate-navi.web.app/) で最新の年月が表示されるか確認してください。

---

## 🛠️ トラブルシューティング・手動操作
万が一、絵文字の判定ルールなどをより良くするためにフロントエンド（Reactのコード等）側を修正した場合は、以下のコマンドでWebアプリ自体を再デプロイしてください。
※JSONの更新だけなら再デプロイは不要です。

```bash
cd webapp
npm run build
npx firebase deploy --only hosting
```

## 📊 アクセス解析について
- **Google Analytics (GA4)** が連携されています。
- 親御さんがどの月の献立を最も見ているかなどのトラフィック（アクセス数）は、GA4のダッシュボード「レポート > エンゲージメント」等からいつでも確認可能です。
