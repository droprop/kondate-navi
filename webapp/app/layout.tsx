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
  title: "浦安市の小学校 給食・献立ナビ (非公式)",
  description: "浦安市の小学校の給食献立をスマホで簡単チェック！第一調理場・第二調理場に対応。毎日のメニュー、お箸の必要有無、栄養素がすぐわかる便利な非公式アプリです。",
  keywords: ["浦安市", "給食", "献立", "小学校", "メニュー", "千鳥学校給食センター"],
  manifest: "https://kondate-navi.web.app/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "こんだてナビ",
  },
  openGraph: {
    title: "浦安市の小学校 給食・献立ナビ",
    description: "今日の給食はなにかな？浦安市の小学校の献立をスマホで簡単チェック！第一・第二調理場対応の非公式アプリ。",
    url: "https://kondate-navi.web.app",
    siteName: "浦安市 給食 こんだてナビ",
    locale: "ja_JP",
    type: "website",
    images: [{
      url: "https://kondate-navi.web.app/opengraph-image.png",
      width: 1200,
      height: 630,
      alt: "浦安市の小学校 給食・献立ナビ",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "浦安市の小学校 給食・献立ナビ",
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
      </body>
      <GoogleAnalytics gaId="G-WJG0XFQ7X8" />
    </html>
  );
}
