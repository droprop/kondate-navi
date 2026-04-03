'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  UtensilsCrossed, 
  School, 
  Settings, 
  ChevronDown,
  AlertTriangle,
  Info
} from 'lucide-react';

const SCHOOL_CATEGORIES = {
  primary: {
    label: "小学校",
    icon: "🎒",
    schools: [
      { name: "浦安小学校", facility: "浦安市千鳥学校給食センター 第一調理場" },
      { name: "南小学校", facility: "浦安市千鳥学校給食センター 第一調理場" },
      { name: "北部小学校", facility: "浦安市千鳥学校給食センター 第一調理場" },
      { name: "美浜南小学校", facility: "浦安市千鳥学校給食センター 第一調理場" },
      { name: "東小学校", facility: "浦安市千鳥学校給食センター 第一調理場" },
      { name: "舞浜小学校", facility: "浦安市千鳥学校給食センター 第一調理場" },
      { name: "美浜北小学校", facility: "浦安市千鳥学校給食センター 第一調理場" },
      { name: "入船小学校", facility: "浦安市千鳥学校給食センター 第一調理場" },
      { name: "見明川小学校", facility: "浦安市千鳥学校給食センター 第二調理場" },
      { name: "富岡小学校", facility: "浦安市千鳥学校給食センター 第二調理場" },
      { name: "日の出小学校", facility: "浦安市千鳥学校給食センター 第二調理場" },
      { name: "明海小学校", facility: "浦安市千鳥学校給食センター 第二調理場" },
      { name: "高洲小学校", facility: "浦安市千鳥学校給食センター 第二調理場" },
      { name: "日の出南小学校", facility: "浦安市千鳥学校給食センター 第二調理場" },
      { name: "明海南小学校", facility: "浦安市千鳥学校給食センター 第二調理場" },
      { name: "高洲北小学校", facility: "浦安市千鳥学校給食センター 第二調理場" },
      { name: "東野小学校", facility: "浦安市千鳥学校給食センター 第二調理場" },
    ]
  },
  juniorHigh: {
    label: "中学校",
    icon: "🎓",
    schools: [
      { name: "浦安市内中学校すべて", facility: "浦安市千鳥学校給食センター 第三調理場" },
    ]
  }
};

const ALL_SCHOOLS = [...SCHOOL_CATEGORIES.primary.schools, ...SCHOOL_CATEGORIES.juniorHigh.schools];
const SCHOOL_MAPPING: Record<string, { facility: string }> = Object.fromEntries(
  ALL_SCHOOLS.map(s => [s.name, { facility: s.facility }])
);



interface DailyMenu {
  date: number;
  day_of_week: string;
  needs_chopsticks: boolean;
  menu_items: string[];
  facility_name: string;
  year: number;
  month: number;
  date_id: string;
  ingredients: {
    energy_source: string[];
    body_building: string[];
    body_regulating: string[];
  };
  nutrition: {
    energy_kcal: number;
    protein_g: number;
    fat_g: number;
    salt_g: number;
  };
}

export default function Home() {
  const [menusCache, setMenusCache] = useState<Record<string, DailyMenu[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [isSettingOpen, setIsSettingOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'today' | 'calendar'>('today');

  useEffect(() => {
    const savedSchool = localStorage.getItem('selectedSchool');
    if (savedSchool && SCHOOL_MAPPING[savedSchool]) {
      setSelectedSchool(savedSchool);
    }
  }, []);

  useEffect(() => {
    if (selectedSchool) {
      localStorage.setItem('selectedSchool', selectedSchool);
    }
  }, [selectedSchool]);

  // 動的Fetch処理 (年月が変わるたびに実行)
  useEffect(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth() + 1;
    const cacheKey = `${y}_${m}`;

    // 既に取得済みの月ならスキップ
    if (menusCache[cacheKey]) {
      setLoading(false);
      return;
    }

    async function loadMonthData() {
      // 1. 【爆速表示】まずは LocalStorage にキャッシュがあれば即座に画面に出す（待ち時間ゼロ）
      const localSWRKey = `swr_menu_${cacheKey}`;
      const cachedString = localStorage.getItem(localSWRKey);
      if (cachedString) {
        try {
          const parsed = JSON.parse(cachedString);
          if (parsed && Array.isArray(parsed)) {
            setMenusCache(prev => ({ ...prev, [cacheKey]: parsed }));
          }
        } catch (e) {
          console.error("Cache parse error", e);
        }
        // ★ SWRの要：キャッシュがあれば、裏側での通信を待たずに即座にローディングを解除して画面を見せる！
        setLoading(false);
      } else {
        // キャッシュがない場合のみローディングUIを出す
        setLoading(true);
      }

      // 2. 【裏側更新】裏で最新のデータを必ず取りに行く（ファイルが差し替えられていれば検知可能）
      try {
        const baseUrl = process.env.NEXT_PUBLIC_MENU_BASE_URL || '/data';
        
        let dataUrl = `${baseUrl}/${cacheKey}.json`;
        if (baseUrl.includes('firebasestorage.googleapis.com')) {
          dataUrl = `${baseUrl}${cacheKey}.json?alt=media`;
        }

        const res = await fetch(dataUrl, { cache: 'no-store' });
        
        if (!res.ok) {
          setMenusCache(prev => ({ ...prev, [cacheKey]: [] }));
          localStorage.removeItem(localSWRKey);
          return;
        }

        const data = await res.json();
        const apiMenus = data.menus || [];
        
        // 3. 取得した最新データでメモリとLocalStorageの両方を上書きする
        setMenusCache(prev => ({ ...prev, [cacheKey]: apiMenus }));
        localStorage.setItem(localSWRKey, JSON.stringify(apiMenus));
      } catch (err) {
        console.error(`Failed to load menu data for ${cacheKey}:`, err);
        if (!cachedString) setMenusCache(prev => ({ ...prev, [cacheKey]: [] }));
      } finally {
        setLoading(false);
      }
    }

    loadMonthData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentDate.getFullYear(), currentDate.getMonth()]);

  const currentMonthMenusData = useMemo(() => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth() + 1;
    return menusCache[`${y}_${m}`] || [];
  }, [menusCache, currentDate]);

  const displayMenu = useMemo(() => {
    if (!selectedSchool) return null;
    const facility = SCHOOL_MAPPING[selectedSchool].facility;
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth() + 1;
    const d = currentDate.getDate();
    return currentMonthMenusData.find(menu => 
      menu.facility_name === facility && 
      menu.year === y &&
      menu.month === m &&
      menu.date === d
    );
  }, [currentMonthMenusData, selectedSchool, currentDate]);

  const currentMonthMenus = useMemo(() => {
    if (!selectedSchool) return [];
    const facility = SCHOOL_MAPPING[selectedSchool].facility;
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth() + 1;
    return currentMonthMenusData
      .filter(menu => menu.facility_name === facility && menu.year === y && menu.month === m)
      .sort((a, b) => a.date - b.date);
  }, [currentMonthMenusData, selectedSchool, currentDate]);

  // スクロールリセットとビュー変更
  const changeView = (mode: 'today' | 'calendar') => {
    setViewMode(mode);
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const handlePrevMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const handleNextMonth = () => {
    const d = new Date(currentDate);
    d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
          <UtensilsCrossed size={48} className="text-orange-400" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFDF9] font-sans text-stone-800 pb-20 selection:bg-orange-200">
      
      {/* ヘッダー */}
      <header className="bg-white/95 backdrop-blur-md border-b border-stone-100 px-4 py-3 sticky top-0 z-30 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-orange-100 p-1.5 rounded-lg text-orange-600">
              <UtensilsCrossed size={18} />
            </div>
            <h1 className="text-base font-bold text-stone-700 tracking-tight flex items-center">
              <span className="sr-only">浦安市 小・中学校 給食・献立メニュー一覧 </span>
              こんだてナビ
            </h1>
          </div>
          <button 
            onClick={() => setIsSettingOpen(true)} 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
              selectedSchool 
                ? 'bg-stone-100 text-stone-600' 
                : 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 active:scale-95'
            }`}
          >
            <span className="text-xs font-bold">{selectedSchool || '学校を選択'}</span>
            <Settings size={14} />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto p-3 sm:p-4 space-y-4">
        
        {/* 学校未選択時のプロンプト */}
        {!selectedSchool && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl p-8 text-center shadow-sm border border-orange-100 space-y-4"
          >
            <div className="bg-orange-50 w-20 h-20 rounded-2xl flex items-center justify-center text-orange-400 mx-auto">
              <School size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-stone-700">まずは学校を選んでね！</h2>
              <p className="text-sm text-stone-400 px-4 leading-relaxed">学校を選択すると、お子様の調理場に合わせた献立が自動で表示されます。</p>
            </div>
            <button 
              onClick={() => setIsSettingOpen(true)}
              className="w-full bg-orange-500 text-white py-3 rounded-2xl font-bold shadow-lg shadow-orange-500/20 active:scale-[0.98] transition"
            >
              学校のリストを見る
            </button>
          </motion.div>
        )}

        {/* タブ */}
        <div className="flex bg-stone-100 p-1 rounded-2xl shadow-inner-sm">
          <button 
            onClick={() => setViewMode('today')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'today' ? 'bg-white text-orange-600 shadow-sm' : 'text-stone-400'}`}
          >
            今日
          </button>
          <button 
            onClick={() => setViewMode('calendar')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'calendar' ? 'bg-white text-orange-600 shadow-sm' : 'text-stone-400'}`}
          >
            一覧
          </button>
        </div>

        {viewMode === 'today' ? (
          <div className="space-y-4">
            {/* 日付ナビゲーション */}
            <div className="flex items-center justify-between px-2">
              <button 
                onClick={handlePrevDay} 
                className="p-2 text-orange-400 active:scale-95 transition hover:bg-orange-50 rounded-full"
              >
                <ChevronLeft size={28} />
              </button>
              <div className="text-center flex flex-col items-center">
                <div className="text-[10px] font-black text-stone-400 uppercase tracking-widest leading-none mb-1">
                  {currentDate.getFullYear()} / {currentDate.getMonth() + 1}
                </div>
                <div className="flex items-baseline gap-1">
                  <div className="text-4xl font-black text-stone-800 tracking-tighter leading-none">
                    {currentDate.getDate()}
                  </div>
                  <span className="text-lg font-bold text-stone-800">日</span>
                </div>
                <div className={`text-sm font-black px-3 py-0.5 rounded-full shadow-sm mt-1.5 border ${
                  currentDate.getDay() === 0 ? 'bg-red-50 text-red-600 border-red-100' : 
                  currentDate.getDay() === 6 ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                  'bg-orange-50 text-orange-600 border-orange-100'
                }`}>
                  {currentDate.toLocaleDateString('ja-JP', { weekday: 'short' })}曜日
                </div>
              </div>
              <button 
                onClick={handleNextDay} 
                className="p-2 text-orange-400 active:scale-95 transition hover:bg-orange-50 rounded-full"
              >
                <ChevronRight size={28} />
              </button>
            </div>

            {selectedSchool && (
              <>
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
                        <span className="text-xl animate-bounce">🥢</span>
                        <span className="font-bold text-sm tracking-wide">今日はおはしを持っていこう！</span>
                      </div>
                    ) : (
                      <div className="bg-stone-100 text-stone-400 rounded-2xl py-[9px] px-4 flex items-center justify-center gap-3 border border-stone-200/50">
                        <span className="text-xl opacity-50">🥄</span>
                        <span className="text-sm font-bold tracking-wide">今日はおはしいらないよ（スプーン等）</span>
                      </div>
                    )}

                    {/* メニューリスト */}
                    <div className="bg-white rounded-3xl shadow-sm border border-stone-100 overflow-hidden">
                      <div className="px-5 py-3 border-b border-stone-50 bg-stone-50/50 flex items-center justify-between">
                        <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest">Menu List</span>
                      </div>
                      <ul className="divide-y divide-stone-50">
                        {[...displayMenu.menu_items].sort((a, b) => {
                          // 1. 主菜（★）を最優先
                          if (a.startsWith('★') && !b.startsWith('★')) return -1;
                          if (!a.startsWith('★') && b.startsWith('★')) return 1;
                          // 2. 牛乳を最後尾に
                          const isMilkA = a.includes('牛乳');
                          const isMilkB = b.includes('牛乳');
                          if (isMilkA && !isMilkB) return 1;
                          if (!isMilkA && isMilkB) return -1;
                          return 0;
                        }).map((item, i) => {
                          const isMain = item.startsWith('★');
                          let cleanStr = isMain ? item.substring(1).trim() : item.trim();
                          
                          // 最初に見つかる絵文字と文字を分離する
                          // Gemini出力例: "🍞 シュガー揚げパン"
                          const spaceIdx = cleanStr.indexOf(' ');
                          let emoji = '🍴';
                          let name = cleanStr;
                          if (spaceIdx > 0 && spaceIdx <= 4) {
                            emoji = cleanStr.substring(0, spaceIdx);
                            name = cleanStr.substring(spaceIdx + 1);
                          }
                          
                          return (
                            <li key={i} className={`px-5 py-2.5 flex items-center gap-4 transition relative ${isMain ? 'bg-gradient-to-r from-orange-50/80 to-white' : 'active:bg-stone-50'}`}>
                              {isMain && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 to-amber-300" />
                              )}
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-sm transition-transform duration-500 ${isMain ? 'bg-white ring-2 ring-orange-200 scale-105 shadow-orange-100' : 'bg-stone-50 border border-stone-100 grayscale-[0.2]'}`}>
                                {emoji}
                              </div>
                              <div className="flex flex-col">
                                <span className={`leading-snug ${isMain ? 'text-stone-900 font-extrabold text-base tracking-tight' : 'text-stone-700 font-bold text-base'}`}>
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
                        { label: 'タンパク', val: displayMenu.nutrition.protein_g, unit: 'g', color: 'text-stone-700' },
                        { label: '脂質', val: displayMenu.nutrition.fat_g, unit: 'g', color: 'text-stone-700' },
                      ].map((n, i) => (
                        <div key={i} className="flex flex-col items-center flex-1 min-w-[65px]">
                          <span className="text-[11px] font-bold text-stone-400 whitespace-nowrap">{n.label}</span>
                          <span className={`text-base font-semibold ${n.color} whitespace-nowrap`}>
                            {n.val} <small className="text-[10px] font-medium">{n.unit}</small>
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* 三色食品群 */}
                    <div className="bg-white rounded-3xl p-5 border border-stone-100 shadow-sm space-y-4">
                      <div className="flex items-center gap-2 border-b border-stone-50 pb-2 mb-2">
                        <div className="bg-orange-100 p-1 rounded-md text-orange-600"><UtensilsCrossed size={12}/></div>
                        <span className="text-xs font-black text-stone-700 uppercase tracking-widest">三色食品群</span>
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
                            <p className="text-[11px] font-bold text-stone-700 opacity-80 leading-relaxed pl-4.5">
                              {g.items.join('、')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="py-20 text-center opacity-30 flex flex-col items-center justify-center space-y-4">
                    <UtensilsCrossed size={48} />
                    <p className="font-bold text-sm">
                      この日は給食がありません<br/>
                      <span className="text-xs font-normal opacity-80 mt-1 block">（または献立未登録）</span>
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* 月ナビゲーション */}
            <div className="flex items-center justify-between px-2 bg-stone-50/50 py-2 rounded-2xl border border-stone-100">
              <button 
                onClick={handlePrevMonth} 
                className="p-2 text-orange-400 active:scale-95 transition hover:bg-orange-50 rounded-xl"
              >
                <ChevronLeft size={24} />
              </button>
              <h3 className="text-lg font-black text-stone-700 tracking-tight flex items-center gap-2">
                {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
              </h3>
              <button 
                onClick={handleNextMonth} 
                className="p-2 text-orange-400 active:scale-95 transition hover:bg-orange-50 rounded-xl"
              >
                <ChevronRight size={24} />
              </button>
            </div>

            {selectedSchool ? (
              <div className="grid gap-2">
                {currentMonthMenus.length > 0 ? (
                  currentMonthMenus.map((m) => (
                    <button 
                      key={m.date_id} 
                      onClick={() => { 
                        const d = new Date(currentDate);
                        d.setDate(m.date);
                        setCurrentDate(d);
                        changeView('today'); 
                      }}
                      className="bg-white p-4 rounded-2xl flex items-center gap-4 text-left border border-stone-50 shadow-sm active:scale-[0.98] active:bg-orange-50 transition-all group"
                    >
                      <div className="w-10 text-center shrink-0">
                        <div className={`text-xl font-black leading-none ${
                          m.day_of_week === '土' ? 'text-blue-500' : m.day_of_week === '日' ? 'text-red-500' : 'text-stone-700'
                        }`}>{m.date}</div>
                        <div className="text-[9px] font-bold text-stone-300 uppercase mt-0.5">{m.day_of_week}</div>
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-stone-600 leading-snug line-clamp-2 group-active:text-orange-600">
                          {[...m.menu_items].sort((a, b) => {
                            // 1. 主菜（★）を最優先
                            if (a.startsWith('★') && !b.startsWith('★')) return -1;
                            if (!a.startsWith('★') && b.startsWith('★')) return 1;
                            // 2. 牛乳を最後尾に
                            const isMilkA = a.includes('牛乳');
                            const isMilkB = b.includes('牛乳');
                            if (isMilkA && !isMilkB) return 1;
                            if (!isMilkA && isMilkB) return -1;
                            return 0;
                          }).map(item => {
                            // 絵文字と★を除去してテキストのみを抽出
                            let clean = item.replace('★', '').trim();
                            const spaceIdx = clean.indexOf(' ');
                            if (spaceIdx > 0 && spaceIdx <= 4) {
                              return clean.substring(spaceIdx + 1);
                            }
                            return clean;
                          }).join(' / ')}
                        </div>
                      </div>
                      {m.needs_chopsticks && <span className="text-xl drop-shadow-sm">🥢</span>}
                    </button>
                  ))
                ) : (
                  <div className="py-20 text-center opacity-20 space-y-2">
                    <Info size={32} className="mx-auto" />
                    <p className="font-bold text-sm">この月のデータはありません</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-20 text-center opacity-30 flex flex-col items-center space-y-3">
                <School size={32} />
                <p className="font-bold text-sm">学校を選択するとリストが表示されます</p>
              </div>
            )}
          </div>
        )}

        {/* Footer inside main for better mobile scrolling visibility */}
        <footer className="max-w-md mx-auto py-1 pb-2 px-4 text-center space-y-1">
          <div className="bg-stone-100/50 rounded-xl p-2 flex flex-col items-center gap-1 border border-stone-200/50 shadow-sm">
            <p className="text-[10px] font-bold text-stone-600 leading-snug text-center">
              ※献立データはAIで自動読み取りしているため、一部表記ゆれ等がある場合があります。正しくは公式の献立表をご確認ください。
            </p>
            <div className="w-8 h-px bg-stone-300 mt-0 mb-0.5" />
            <p className="font-bold text-[9px] tracking-widest text-stone-400 uppercase">
              Personal Development Project
            </p>
            <p className="text-[8px] font-medium leading-relaxed max-w-[280px] mx-auto text-stone-400/80">
              有志により開発・運営されており、自治体の公式サービスではありません。
            </p>
          </div>
        </footer>
      </main>

      {/* 設定モーダル */}
      <AnimatePresence>
        {isSettingOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingOpen(false)}
              className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-40 transition-all"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[2.5rem] z-50 p-6 sm:p-8 shadow-2xl border-t border-stone-100 max-h-[92vh] flex flex-col"
            >
              <div className="w-12 h-1.5 bg-stone-100 rounded-full mx-auto mb-6 shrink-0 cursor-pointer" onClick={() => setIsSettingOpen(false)} />
              <div className="space-y-6 pb-safe overflow-hidden flex flex-col">
                <div className="flex items-center gap-4 shrink-0 px-2">
                  <div className="bg-orange-100 p-3 rounded-2xl text-orange-600">
                    <School size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-stone-800 tracking-tight">学校の設定</h2>
                    <p className="text-xs text-stone-400 font-bold">お住まいの地域の学校を選んでください</p>
                  </div>
                </div>
                
                <div className="space-y-6 overflow-y-auto flex-1 px-1 custom-scrollbar pb-4 min-h-0">
                  {(Object.keys(SCHOOL_CATEGORIES) as Array<keyof typeof SCHOOL_CATEGORIES>).map((catKey) => {
                    const cat = SCHOOL_CATEGORIES[catKey];
                    return (
                      <div key={catKey} className="space-y-3">
                        <div className="flex items-center gap-2 px-1">
                          <span className="text-lg">{cat.icon}</span>
                          <h3 className="text-sm font-black text-stone-400 uppercase tracking-widest">{cat.label}</h3>
                        </div>
                        <div className={`${catKey === 'juniorHigh' ? 'flex' : 'grid grid-cols-2'} gap-2`}>
                          {cat.schools.map((s) => (
                            <button
                              key={s.name}
                              onClick={() => {
                                setSelectedSchool(s.name);
                                setIsSettingOpen(false);
                              }}
                              className={`p-3 rounded-2xl text-sm font-bold text-left transition-all border flex-1 ${
                                selectedSchool === s.name
                                  ? 'bg-orange-500 text-white border-orange-400 shadow-lg shadow-orange-500/20 active:scale-95'
                                  : 'bg-stone-50 text-stone-600 border-stone-100 hover:bg-stone-100 active:bg-stone-200'
                              }`}
                            >
                              {s.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-stone-50 p-4 rounded-2xl shrink-0">
                  <p className="text-[10px] text-stone-400 font-bold leading-relaxed">
                    ※一度選択すると、次回から自動的にこの学校の献立が表示されます。後でいつでも変更可能です。
                  </p>
                </div>

                <button 
                  onClick={() => setIsSettingOpen(false)}
                  className="w-full py-4 text-stone-300 font-black text-xs uppercase tracking-widest active:text-orange-400 transition shrink-0"
                >
                  Close Settings
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
