import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import { GoogleAnalytics } from '@next/third-parties/google';
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const viewport: Viewport = {
  themeColor: [{ color: "#f97316" }],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://kondate-navi.web.app"),
  alternates: { canonical: '/' },
  title: "浦安市 小学校 給食・こんだてナビ",
  description: "浦安市の小学校（第一・第二調理場）の給食献立をスマホでさっと確認。公開された献立表を AI 解析で分かりやすく表示する、保護者による非公式の献立予定表アプリです。毎日のメニューやお箸の要否をすぐにチェックできます。",
  keywords: ["浦安市", "給食", "献立", "小学校", "メニュー", "千鳥学校給食センター"],
  applicationName: "こんだてナビ",
  manifest: "https://kondate-navi.web.app/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "こんだてナビ",
  },
  openGraph: {
    title: "浦安市 小学校 給食・こんだてナビ",
    description: "今日の給食はなにかな？浦安市の小学校の献立をスマホで簡単チェック。第一・第二調理場対応の献立予定表アプリ。",
    url: "https://kondate-navi.web.app",
    siteName: "こんだてナビ",
    locale: "ja_JP",
    type: "website",
    images: [{
      url: "https://kondate-navi.web.app/opengraph-image.png",
      width: 1200,
      height: 630,
      alt: "浦安市 小学校 給食・こんだてナビ",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "浦安市 小学校 給食・こんだてナビ",
    description: "今日の給食はなにかな？浦安市の小学校の給食献立をスマホで簡単チェック！",
    images: ["https://kondate-navi.web.app/opengraph-image.png"],
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={outfit.variable}>
      <head>
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify([
              {
                "@context": "https://schema.org",
                "@type": "WebSite",
                "name": "こんだてナビ",
                "alternateName": ["浦安市 小学校 給食・こんだてナビ"],
                "url": "https://kondate-navi.web.app"
              },
              {
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                "name": "こんだてナビ",
                "operatingSystem": "Web",
                "applicationCategory": "EducationalApplication",
                "description": "浦安市の小学校の給食献立をスマホで見やすく表示。AIによる献立解析機能を搭載。",
                "offers": {
                  "@type": "Offer",
                  "price": "0",
                  "priceCurrency": "JPY"
                },
                "author": {
                  "@type": "Organization",
                  "name": "こんだてナビ プロジェクト"
                }
              }
            ])
          }}
        />
      </body>
      <GoogleAnalytics gaId="G-WJG0XFQ7X8" />
    </html>
  );
}
