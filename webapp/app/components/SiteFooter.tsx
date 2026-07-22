import { MessageSquare } from 'lucide-react';

export default function SiteFooter() {
  return (
    <footer className="max-w-md mx-auto pt-4 pb-6 px-4 text-center space-y-3 border-t border-stone-200">
      <p className="text-[10px] font-medium text-stone-500 leading-relaxed max-w-[320px] mx-auto">
        浦安市が公開する献立表をAIで読み取り、見やすく表示しています。正確な情報は
        <a
          href="https://www.city.urayasu.lg.jp/kodomo/gakko/kyushoku/1016584.html"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold underline decoration-stone-300 underline-offset-2 hover:text-orange-600"
        >
          公式の献立表
        </a>
        をご確認ください。
      </p>
      <p className="text-[10px] font-medium text-stone-400">
        保護者が運営する、浦安市の非公式アプリです。
      </p>
      <a
        href="https://forms.gle/tWGr4133CAUkTfdLA"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-stone-200 shadow-sm rounded-full text-[11px] font-bold text-stone-500 hover:text-orange-500 hover:border-orange-200 hover:shadow-md transition-all active:scale-95 mx-auto"
      >
        <MessageSquare size={14} />
        <span>アプリへのご意見・ご要望はこちら</span>
      </a>
    </footer>
  );
}
