'use client';

import { UtensilsCrossed } from 'lucide-react';

/**
 * 初回ロード用スケルトン。
 * 実際のレイアウト（ヘッダー＋タブ＋日付＋カード）と同じ形を出すことで、
 * 読み込み完了時のレイアウトシフトを防ぐ。ヘッダーは本物を表示する。
 */
export default function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-[#FFFDF9] font-sans text-stone-800 pb-10">
      <header className="bg-white/95 backdrop-blur-md border-b border-stone-100 px-4 py-3 sticky top-0 z-30 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-orange-100 p-1.5 rounded-lg text-orange-600">
              <UtensilsCrossed size={18} />
            </div>
            <h1 className="text-base font-bold text-stone-700 tracking-tight">こんだてボード</h1>
          </div>
          <div className="h-8 w-24 bg-stone-100 rounded-full animate-pulse" />
        </div>
      </header>

      <main className="max-w-md mx-auto p-3 sm:p-4 space-y-4">
        <div className="h-11 bg-stone-100 rounded-2xl animate-pulse" />
        <div className="flex justify-center py-2">
          <div className="h-16 w-32 bg-stone-100 rounded-2xl animate-pulse" />
        </div>
        <div className="h-12 bg-stone-100 rounded-2xl animate-pulse" />
        <div className="h-64 bg-stone-100 rounded-3xl animate-pulse" />
        <div className="h-16 bg-stone-100 rounded-2xl animate-pulse" />
        <div className="h-40 bg-stone-100 rounded-3xl animate-pulse" />
      </main>
    </div>
  );
}
