import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { GoogleAnalytics } from '@next/third-parties/google';
import "./globals.css";
import { SITE_URL } from "./site";

// 欧文・数字用（日付の大きな数字や栄養価の数値に使用）。
// 日本語本文は端末のシステムフォント（iOS=ヒラギノ角ゴ / Android=Noto Sans CJK / Win=游ゴシック）を
// 使うため Web フォントは読み込まない。0バイトで一瞬表示でき、各OSで最も鮮明に出る。
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const viewport: Viewport = {
  themeColor: [{ color: "#f97316" }],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: '/' },
  title: "浦安市の給食献立 - こんだてボード｜今日・今月の小中学校メニュー予定表",
  description: "浦安市の小学校（全17校・第一/第二調理場）・中学校（第三調理場）の給食献立をPDFなしでスマホから1秒確認！今日・明日のメニュー、お箸の要否、栄養価や食材（三色食品群）がすぐわかる保護者運営の無料献立表アプリです。",
  keywords: ["浦安市", "給食", "献立", "献立表", "小学校", "中学校", "今日", "メニュー", "千鳥学校給食センター", "第一調理場", "第二調理場", "第三調理場"],
  applicationName: "こんだてボード",
  manifest: `${SITE_URL}/manifest.json`,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "こんだてボード",
  },
  openGraph: {
    title: "浦安市の給食献立 - こんだてボード｜今日・今月の小中学校メニュー予定表",
    description: "今日の給食はなにかな？浦安市の小学校・中学校の給食献立をPDFなしで1秒チェック。全調理場対応の献立予定表アプリ。",
    url: `${SITE_URL}/`,
    siteName: "こんだてボード",
    locale: "ja_JP",
    type: "website",
    images: [{
      url: `${SITE_URL}/opengraph-image.png`,
      width: 1200,
      height: 630,
      alt: "浦安市の小・中学校 給食献立アプリ こんだてボード",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "浦安市の給食献立 - こんだてボード｜今日・今月の小中学校メニュー",
    description: "今日の給食はなにかな？浦安市の小・中学校の給食献立をスマホで簡単チェック！",
    images: [`${SITE_URL}/opengraph-image.png`],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={outfit.variable} suppressHydrationWarning>
      <head>
        {/*
          Firebase Hosting は kondate-navi.web.app / kondate-navi.firebaseapp.com でも
          同一の内容を配信してしまい、Google が旧ホストを正規 URL に選んで
          カスタムドメイン側がインデックスから外れる。firebase.json はホスト名で
          リダイレクトを分岐できないため、正規ホスト以外はここで送り返す。
          描画前に実行させたいので next/script ではなくインラインで置く。
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var c=${JSON.stringify(new URL(SITE_URL).hostname)},h=location.hostname;if(h!==c&&h!=="localhost"&&h!=="127.0.0.1"&&!h.endsWith(".local")){location.replace("https://"+c+location.pathname+location.search+location.hash);return;}if(localStorage.getItem("selectedSchool")){var s=document.createElement("style");s.id="ks-init";s.textContent=".initial-guide-only{display:none!important}";document.head.appendChild(s);}}catch(e){}})();`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "こんだてボード",
                "alternateName": ["浦安こんだてボード"],
                "url": `${SITE_URL}/`
              },
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                "name": "こんだてボード",
                "url": `${SITE_URL}/`,
                "operatingSystem": "Web",
                "applicationCategory": "EducationalApplication",
                "description": "浦安市の小学校（第一・第二調理場）・中学校（第三調理場）の給食献立をスマホでさっと確認。公開された献立表を分かりやすく表示する、保護者による非公式の献立予定表アプリです。毎日のメニューやお箸の要否をすぐにチェックできます。",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "JPY"
                },
                "author": {
                  "@type": "Organization",
                  "name": "こんだてボード プロジェクト"
                }
              }
            ])
          }}
        />
      </head>
      <body>
        {children}
      </body>
      <GoogleAnalytics gaId="G-WJG0XFQ7X8" />
    </html>
  );
}
