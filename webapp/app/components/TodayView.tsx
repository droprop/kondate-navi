'use client';

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, UtensilsCrossed } from 'lucide-react';
import { DailyMenu, sortMenuItems, parseMenuItem } from '../lib/menu';

interface TodayViewProps {
  currentDate: Date;
  displayMenu: DailyMenu | undefined;
  selectedSchool: string;
  onPrevDay: () => void;
  onNextDay: () => void;
}

export default function TodayView({
  currentDate,
  displayMenu,
  selectedSchool,
  onPrevDay,
  onNextDay,
}: TodayViewProps) {
  return (
    <div className="space-y-4">
      {/* 日付ナビゲーション */}
      <div className="flex items-center justify-between px-2">
        <button
          onClick={onPrevDay}
          aria-label="前の日へ"
          className="p-2 text-orange-400 active:scale-95 transition hover:bg-orange-50 rounded-full mb-5"
        >
          <ChevronLeft size={28} />
        </button>
        <div className="text-center flex flex-col items-center">
          <div className="font-en text-[10px] font-black text-stone-500 uppercase tracking-widest leading-none mb-1">
            {currentDate.getFullYear()} / {currentDate.getMonth() + 1}
          </div>
          <div className="flex items-baseline gap-1">
            <div className="font-en text-4xl font-black text-stone-800 tracking-tighter leading-none">
              {currentDate.getDate()}
            </div>
            <span className="text-lg font-bold text-stone-800">日</span>
          </div>
          <div className={`text-sm font-bold px-3 py-0.5 rounded-full shadow-sm mt-1.5 border ${
            currentDate.getDay() === 0 ? 'bg-red-50 text-red-600 border-red-100' :
            currentDate.getDay() === 6 ? 'bg-blue-50 text-blue-600 border-blue-100' :
            'bg-orange-50 text-orange-600 border-orange-100'
          }`}>
            {currentDate.toLocaleDateString('ja-JP', { weekday: 'short' })}曜日
          </div>
        </div>
        <button
          onClick={onNextDay}
          aria-label="次の日へ"
          className="p-2 text-orange-400 active:scale-95 transition hover:bg-orange-50 rounded-full mb-5"
        >
          <ChevronRight size={28} />
        </button>
      </div>

      {selectedSchool && (
        // 左右スワイプで前日／翌日へ移動できる（モバイル向け）
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          dragDirectionLock
          onDragEnd={(_, info) => {
            if (info.offset.x < -60) onNextDay();
            else if (info.offset.x > 60) onPrevDay();
          }}
        >
          {displayMenu ? (
            <motion.div
              key={displayMenu.date_id}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-4"
            >
              {/* お箸アラート */}
              {displayMenu.needs_chopsticks ? (
                <div className="bg-orange-500 text-white rounded-2xl py-[9px] px-4 flex items-center justify-center gap-3 shadow-md shadow-orange-500/20 ring-1 ring-white/20">
                  <span className="text-xl chopstick-bounce">🥢</span>
                  <span className="font-bold text-sm tracking-wide">今日はおはしを持っていこう！</span>
                </div>
              ) : (
                <div className="bg-stone-100 text-stone-500 rounded-2xl py-[9px] px-4 flex items-center justify-center gap-3 border border-stone-200/50">
                  <span className="text-xl opacity-50">🥄</span>
                  <span className="text-sm font-bold tracking-wide">今日はおはしいらないよ（スプーン等）</span>
                </div>
              )}

              {/* メニューリスト */}
              <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
                <div className="px-5 py-3 border-b border-stone-50 bg-stone-50/50 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-stone-500 tracking-widest">きょうのこんだて</span>
                </div>
                <ul className="divide-y divide-stone-50">
                  {sortMenuItems(displayMenu.menu_items).map((item, i) => {
                    const { isMain, emoji, name } = parseMenuItem(item);
                    return (
                      <li key={i} className={`px-5 py-2.5 flex items-center gap-4 transition relative ${isMain ? 'bg-gradient-to-r from-orange-50/80 to-white' : 'active:bg-stone-50'}`}>
                        {isMain && (
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 to-amber-300" />
                        )}
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-sm transition-transform duration-500 ${isMain ? 'bg-white ring-2 ring-orange-200 scale-105 shadow-orange-100' : 'bg-stone-50 border border-stone-100 grayscale-[0.2]'}`}>
                          {emoji}
                        </div>
                        <div className="flex flex-col">
                          <span className={`leading-snug text-base ${isMain ? 'text-stone-900 font-bold tracking-tight' : 'text-stone-700 font-medium'}`}>
                            {name}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* 栄養グリッド */}
              <div className="bg-white rounded-2xl p-3 border border-stone-100 shadow-sm flex items-center justify-between gap-1 overflow-x-auto custom-scrollbar">
                {[
                  { label: 'エネルギー', val: displayMenu.nutrition.energy_kcal, unit: 'kcal', color: 'text-orange-500' },
                  { label: '塩分', val: displayMenu.nutrition.salt_g, unit: 'g', color: 'text-stone-700' },
                  { label: 'タンパク質', val: displayMenu.nutrition.protein_g, unit: 'g', color: 'text-stone-700' },
                  { label: '脂質', val: displayMenu.nutrition.fat_g, unit: 'g', color: 'text-stone-700' },
                ].map((n, i) => (
                  <div key={i} className="flex flex-col items-center flex-1 min-w-[65px]">
                    <span className="text-[11px] font-medium text-stone-500 whitespace-nowrap">{n.label}</span>
                    <span className={`font-en text-base font-medium ${n.color} whitespace-nowrap`}>
                      {n.val} <small className="text-[10px] font-normal">{n.unit}</small>
                    </span>
                  </div>
                ))}
              </div>

              {/* 三色食品群 */}
              <div className="bg-white rounded-3xl p-5 border border-stone-100 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-stone-50 pb-2 mb-2">
                  <div className="bg-orange-100 p-1 rounded-md text-orange-600"><UtensilsCrossed size={12}/></div>
                  <span className="text-xs font-bold text-stone-700 tracking-widest">三色食品群</span>
                </div>
                <div className="space-y-4">
                  {[
                    { color: 'bg-rose-400 shadow-rose-200', label: '赤（血や肉や骨をつくる）', items: displayMenu.ingredients.body_building },
                    { color: 'bg-amber-400 shadow-amber-200', label: '黄（熱や力のもとになる）', items: displayMenu.ingredients.energy_source },
                    { color: 'bg-emerald-400 shadow-emerald-200', label: '緑（体の調子を整える）', items: displayMenu.ingredients.body_regulating },
                  ].map((g, i) => (
                    <div key={i}>
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className={`w-2.5 h-2.5 rounded-full shadow-lg ${g.color}`}></div>
                        <span className="text-[11px] font-bold text-stone-500">{g.label}</span>
                      </div>
                      <p className="text-[11px] font-medium text-stone-700 opacity-80 leading-relaxed pl-4.5">
                        {g.items.join('、')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="py-20 text-center opacity-40 flex flex-col items-center justify-center space-y-4">
              <UtensilsCrossed size={48} />
              <p className="font-bold text-sm">
                この日は給食がありません<br/>
                <span className="text-xs font-normal opacity-80 mt-1 block">（または献立未登録）</span>
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
