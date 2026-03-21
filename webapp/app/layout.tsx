import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
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
  title: "こんだてナビ | 浦安市立学校給食（非公式）",
  description: "浦安市の学校給食献立をスマートにチェック。毎月のメニューや栄養素、お箸情報をサッと確認できるPWA対応アプリです。※非公式・個人開発",
  manifest: "https://kondate-navi.web.app/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "こんだてナビ",
  },
  openGraph: {
    title: "こんだてナビ | 浦安市立学校給食",
    description: "スマホでササッと浦安市の給食献立をチェックできる便利なアプリです。※非公式",
    url: "https://kondate-navi.web.app",
    siteName: "こんだてナビ",
    locale: "ja_JP",
    type: "website",
    images: [{
      url: "https://kondate-navi.web.app/opengraph-image.png",
      width: 1200,
      height: 630,
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "こんだてナビ | 浦安市立学校給食",
    description: "スマホでササッと給食献立をチェック！",
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
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
