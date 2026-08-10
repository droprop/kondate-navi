'use client';

import { useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Info, School } from 'lucide-react';
import { DailyMenu, sortMenuItems, parseMenuItem } from '../lib/menu';

interface MonthListViewProps {
  currentDate: Date;
  menus: DailyMenu[];
  selectedSchool: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDate: (date: number) => void;
}

export default function MonthListView({
  currentDate,
  menus,
  selectedSchool,
  onPrevMonth,
  onNextMonth,
  onSelectDate,
}: MonthListViewProps) {
  const today = new Date();
  const isCurrentMonth =
    today.getFullYear() === currentDate.getFullYear() &&
    today.getMonth() === currentDate.getMonth();

  // 今月を表示しているときは、今日の行まで自動スクロールする
  const todayRowRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (isCurrentMonth && todayRowRef.current) {
      todayRowRef.current.scrollIntoView({ block: 'center' });
    }
  }, [isCurrentMonth, currentDate]);

  return (
    <div className="space-y-4">
      {/* 月ナビゲーション */}
      <div className="flex items-center justify-between px-2 bg-stone-50/50 py-2 rounded-2xl border border-stone-100">
        <button
          onClick={onPrevMonth}
          aria-label="前の月へ"
          className="p-2 text-orange-500 active:scale-95 transition hover:bg-orange-50 rounded-xl"
        >
          <ChevronLeft size={24} />
        </button>
        <h3 className="text-lg font-black text-stone-700 tracking-tight flex items-center gap-2">
          {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
        </h3>
        <button
          onClick={onNextMonth}
          aria-label="次の月へ"
          className="p-2 text-orange-500 active:scale-95 transition hover:bg-orange-50 rounded-xl"
        >
          <ChevronRight size={24} />
        </button>
      </div>

      {selectedSchool ? (
        <div className="grid gap-2">
          {menus.length > 0 ? (
            menus.map((m) => {
              const isToday = isCurrentMonth && m.date === today.getDate();
              return (
                <button
                  key={m.date_id}
                  ref={isToday ? todayRowRef : undefined}
                  onClick={() => onSelectDate(m.date)}
                  className={`p-4 rounded-2xl flex items-center gap-4 text-left shadow-sm active:scale-[0.98] active:bg-orange-50 transition-all group border ${
                    isToday
                      ? 'bg-orange-50/60 border-orange-200 ring-2 ring-orange-200'
                      : 'bg-white border-stone-50'
                  }`}
                >
                  <div className="w-10 text-center shrink-0">
                    <div className={`font-en text-xl font-black leading-none ${
                      m.day_of_week === '土' ? 'text-blue-600' : m.day_of_week === '日' ? 'text-red-600' : 'text-stone-700'
                    }`}>{m.date}</div>
                    <div className="text-[11px] font-bold text-stone-500 mt-0.5">{m.day_of_week}</div>
                    {isToday && (
                      <div className="text-[10px] font-bold text-white bg-orange-500 rounded-full px-1.5 py-px mt-1">今日</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-stone-600 leading-snug line-clamp-2 group-active:text-orange-600">
                      {sortMenuItems(m.menu_items).map(item => parseMenuItem(item).name).join(' / ')}
                    </div>
                  </div>
                  {m.needs_chopsticks && <span className="text-xl drop-shadow-sm">🥢</span>}
                </button>
              );
            })
          ) : (
            <div className="py-20 text-center text-stone-500 space-y-2">
              <Info size={32} className="mx-auto text-stone-400" />
              <p className="font-bold text-sm">この月のデータはありません</p>
            </div>
          )}
        </div>
      ) : (
        <div className="py-20 text-center text-stone-500 flex flex-col items-center space-y-3">
          <School size={32} className="text-stone-400" />
          <p className="font-bold text-sm">学校を選択するとリストが表示されます</p>
        </div>
      )}
    </div>
  );
}
