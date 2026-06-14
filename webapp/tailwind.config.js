/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // 既定: 欧文Outfit → 日本語はOSのシステム角ゴシック
        sans: [
          'var(--font-outfit)', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI',
          'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Noto Sans JP',
          'Yu Gothic UI', 'Yu Gothic', 'Meiryo', 'sans-serif',
        ],
        // 数字・欧文専用（日付の大きな数字、栄養価など）
        en: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
