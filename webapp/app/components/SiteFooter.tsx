import Link from 'next/link';
import { MessageSquare } from 'lucide-react';

export default function SiteFooter() {
  return (
    <footer className="max-w-md mx-auto pt-4 pb-6 px-4 text-center space-y-3 border-t border-stone-200">
      {/*
        免責と「非公式」の明示は打消し表示にあたるため、ページ内の他の補助テキスト
        （曜日ラベル・栄養ラベル等の 11px / stone-500）より小さくも薄くもしないこと。
        同サイズ・やや濃いめ = 相対的な目立ちにくさがない、という水準で止めている。
      */}
      <p className="text-[11px] font-medium text-stone-600 leading-relaxed max-w-[330px] mx-auto">
        浦安市が公開する献立表をAIで読み取り、見やすく表示しています。正確な情報は
        <a
          href="https://www.city.urayasu.lg.jp/kodomo/gakko/kyushoku/1016584.html"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold underline decoration-stone-400 underline-offset-2 hover:text-orange-600"
        >
          公式の献立表
        </a>
        をご確認ください。アレルギー等の重要な情報は必ず公式の献立表でご確認ください。
      </p>
      <p className="text-[11px] font-medium text-stone-600">
        保護者が運営する、浦安市の非公式アプリです。
        {/* /about への導線。ユーザーの入口であると同時に、クローラーの巡回経路にもなる */}
        <Link
          href="/about"
          className="ml-1.5 font-bold underline decoration-stone-400 underline-offset-2 hover:text-orange-600"
        >
          このアプリについて
        </Link>
      </p>
      <a
        href="https://forms.gle/tWGr4133CAUkTfdLA"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-stone-200 shadow-sm rounded-full text-[11px] font-bold text-stone-600 hover:text-orange-600 hover:border-orange-200 hover:shadow-md transition-all active:scale-95 mx-auto"
      >
        <MessageSquare size={14} />
        <span>アプリへのご意見・ご要望はこちら</span>
      </a>
    </footer>
  );
}
