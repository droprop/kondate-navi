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

const SCHOOL_MAPPING: Record<string, { facility: string, center: string }> = {
  "浦安小学校": { facility: "浦安市千鳥学校給食センター 第一調理場", center: "第一調理場" },
  "南小学校": { facility: "浦安市千鳥学校給食センター 第一調理場", center: "第一調理場" },
  "北部小学校": { facility: "浦安市千鳥学校給食センター 第一調理場", center: "第一調理場" },
  "美浜南小学校": { facility: "浦安市千鳥学校給食センター 第一調理場", center: "第一調理場" },
  "東小学校": { facility: "浦安市千鳥学校給食センター 第一調理場", center: "第一調理場" },
  "舞浜小学校": { facility: "浦安市千鳥学校給食センター 第一調理場", center: "第一調理場" },
  "美浜北小学校": { facility: "浦安市千鳥学校給食センター 第一調理場", center: "第一調理場" },
  "入船小学校": { facility: "浦安市千鳥学校給食センター 第一調理場", center: "第一調理場" },
  "見明川小学校": { facility: "浦安市千鳥学校給食センター 第二調理場", center: "第二調理場" },
  "富岡小学校": { facility: "浦安市千鳥学校給食センター 第二調理場", center: "第二調理場" },
  "日の出小学校": { facility: "浦安市千鳥学校給食センター 第二調理場", center: "第二調理場" },
  "明海小学校": { facility: "浦安市千鳥学校給食センター 第二調理場", center: "第二調理場" },
  "高洲小学校": { facility: "浦安市千鳥学校給食センター 第二調理場", center: "第二調理場" },
  "日の出南小学校": { facility: "浦安市千鳥学校給食センター 第二調理場", center: "第二調理場" },
  "明海南小学校": { facility: "浦安市千鳥学校給食センター 第二調理場", center: "第二調理場" },
  "高洲北小学校": { facility: "浦安市千鳥学校給食センター 第二調理場", center: "第二調理場" },
  "東野小学校": { facility: "浦安市千鳥学校給食センター 第二調理場", center: "第二調理場" },
};

const PRIORITIZED_MAPPING: [string, string][] = [
  // 1. 飲み物
  ["牛乳", "🥛"], ["ミルメーク", "🥛"], ["ヨーグルト", "🥛"],

  // 2. 麺類 (「焼きそば」等が下位の「焼」に吸われないよう上位に)
  ["スパゲティ", "🍝"], ["スパゲッティ", "🍝"], ["パスタ", "🍝"],
  ["うどん", "🍜"], ["ラーメン", "🍜"], ["焼きそば", "🍜"], ["ちゃんぽん", "🍜"], ["ほうとう", "🍜"], ["めん", "🍜"], ["麺", "🍜"],

  // 3. 完成料理・丼・カレー
  ["カレー", "🍛"], ["ハヤシ", "🍛"], ["丼", "🍚"], ["どん", "🍚"], ["親子", "🍚"], ["ピラフ", "🍚"], ["ビビンバ", "🍚"], ["チャーハン", "🍚"],

  // 4. 汁物
  ["スープ", "🍲"], ["汁", "🍲"], ["ワンタン", "🍲"], ["シチュー", "🍲"], ["ポトフ", "🍲"], ["すいとん", "🍲"], ["椀", "🍲"],

  // 5. デザート（お菓子・お餅などスイーツ系 ※パンや調理法より強いため最優先）
  ["ゼリー", "🍮"], ["プリン", "🍮"], ["タルト", "🍮"], ["クレープ", "🍮"], ["ケーキ", "🍮"],
  ["だんご", "🍡"], ["団子", "🍡"], ["餅", "🍡"], ["もち", "🍡"], ["おはぎ", "🍡"], ["大福", "🍡"], ["ぜんざい", "🍡"],
  ["ポンチ", "🍎"], ["フルーツ", "🍎"],

  // 6. メイン食材 (魚・肉・卵・チーズ)
  ["魚", "🐟"], ["いわし", "🐟"], ["イワシ", "🐟"], ["さば", "🐟"], ["サバ", "🐟"], ["さわら", "🐟"], ["ししゃも", "🐟"], ["シシャモ", "🐟"], ["かつお", "🐟"], ["カツオ", "🐟"], ["鯛", "🐟"], ["たい", "🐟"], ["さんま", "🐟"], ["サンマ", "🐟"], ["めばる", "🐟"], ["いか", "🐟"], ["イカ", "🐟"], ["小魚", "🐟"], ["さけ", "🐟"], ["サケ", "🐟"], ["鮭", "🐟"], ["あじ", "🐟"], ["アジ", "🐟"], ["ます", "🐟"], ["マス", "🐟"], ["えび", "🐟"], ["エビ", "🐟"], ["マヒマヒ", "🐟"], ["メヒカリ", "🐟"], ["ニギス", "🐟"], ["ホキ", "🐟"], ["ほっけ", "🐟"], ["コノシロ", "🐟"], ["シーフード", "🐟"], ["ちくわ", "🐟"], ["かまぼこ", "🐟"], ["さんがやき", "🐟"],
  ["肉", "🥩"], ["豚", "🥩"], ["牛", "🥩"], ["鶏", "🥩"], ["とり", "🥩"], ["チキン", "🥩"], ["ポーク", "🥩"], ["レバー", "🥩"], ["ハンバーグ", "🥩"], ["カツ", "🥩"], ["唐揚げ", "🥩"], ["から揚げ", "🥩"], ["とり天", "🥩"], ["コロッケ", "🥩"], ["マーボー", "🥩"], ["麻婆", "🥩"], ["餃子", "🥩"], ["ぎょうざ", "🥩"], ["シュウマイ", "🥩"], ["しゅうまい", "🥩"], ["春巻き", "🥩"], ["ウインナー", "🥩"], ["フランクフルト", "🥩"], ["プルコギ", "🥩"], ["すきやき", "🥩"],
  ["卵", "🥚"], ["玉子", "🥚"], ["たまご", "🥚"], ["オムレツ", "🥚"],
  ["チーズ", "🧀"], ["グラタン", "🧀"],

  // 7. 主食 (ごはん・パン)
  ["揚げパン", "🍞"], ["パン", "🍞"], ["コッペパン", "🍞"], ["食パン", "🍞"], ["ラスク", "🍞"],
  ["ご飯", "🍚"], ["ごはん", "🍚"], ["麦ごはん", "🍚"], ["麦ご飯", "🍚"], ["赤飯", "🍚"],

  // 8. 副菜 (サラダ・和え物・漬け物・野菜・豆)
  ["サラダ", "🥗"], ["和え", "🥗"], ["あえ", "🥗"], ["マリネ", "🥗"], ["春雨", "🥗"], ["はるさめ", "🥗"], ["ナムル", "🥗"], ["バンバンジー", "🥗"], ["漬け", "🥗"],
  ["納豆", "🥗"], ["豆腐", "🥗"], ["わかめ", "🥗"], ["ひじき", "🥗"], ["海苔", "🥗"], ["のり", "🥗"],
  ["野菜", "🥗"], ["ポテト", "🥗"], ["大学", "🥗"],
  ["豆", "🫘"], ["ビーンズ", "🫘"], ["大豆", "🫘"],

  // 9. 調理法 (上記にマッチしなかった場合のセーフティーネット)
  ["フライ", "🍤"], ["フリッター", "🍤"], ["天ぷら", "🍤"], ["揚げ", "🍤"],
  ["煮", "🥣"],
  ["炒め", "🍳"], ["焼", "🍳"],

  // 10. 生の果物 (りんごパン等に誤爆しないよう「パンより下」の最後尾に配置)
  ["りんご", "🍎"], ["みかん", "🍎"], ["いちご", "🍎"], ["桃", "🍎"], ["もも", "🍎"], ["バナナ", "🍎"], ["レモン", "🍎"], ["オレンジ", "🍎"],

  // 11. その他
  ["お祝い", "🎉"]
];

const getEmoji = (menuName: string) => {
  for (const [key, emoji] of PRIORITIZED_MAPPING) {
    if (menuName.includes(key)) {
      return emoji;
    }
  }
  return "🍴";
};

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
              <span className="sr-only">浦安市の小学校 給食・献立メニュー一覧 </span>
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
                        {displayMenu.menu_items.map((item, i) => (
                          <li key={i} className="px-5 py-2.5 flex items-center gap-3 active:bg-stone-50 transition">
                            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-xl shrink-0">
                              {getEmoji(item)}
                            </div>
                            <span className="text-stone-800 font-bold text-base leading-snug">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>


                    {/* 栄養グリッド */}
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { label: 'エネルギー', val: displayMenu.nutrition.energy_kcal, unit: 'kcal', color: 'text-orange-500' },
                        { label: '塩分', val: displayMenu.nutrition.salt_g, unit: 'g', color: 'text-stone-700' },
                        { label: 'タンパク質', val: displayMenu.nutrition.protein_g, unit: 'g', color: 'text-stone-700' },
                        { label: '脂質', val: displayMenu.nutrition.fat_g, unit: 'g', color: 'text-stone-700' },
                      ].map((n, i) => (
                        <div key={i} className="bg-white rounded-2xl p-4 border border-stone-100 shadow-sm flex flex-col items-center">
                          <span className="text-[10px] font-bold text-stone-400 mb-1">{n.label}</span>
                          <span className={`text-xl font-black ${n.color}`}>{n.val} <small className="text-[10px] font-bold">{n.unit}</small></span>
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
                          {m.menu_items.join(' / ')}
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
              className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t-[2.5rem] z-50 p-8 shadow-2xl border-t border-stone-100"
            >
              <div className="w-12 h-1.5 bg-stone-100 rounded-full mx-auto mb-8 cursor-pointer" onClick={() => setIsSettingOpen(false)} />
              <div className="space-y-6 pb-4">
                <div className="flex items-center gap-4">
                  <div className="bg-orange-100 p-3 rounded-2xl text-orange-600">
                    <School size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-stone-800 tracking-tight">学校の設定</h2>
                    <p className="text-xs text-stone-400 font-bold">お住まいの地域の学校を選んでください</p>
                  </div>
                </div>
                
                <div className="relative">
                  <select 
                    className="w-full bg-stone-50 border border-stone-100 rounded-2xl p-4 appearance-none font-bold text-stone-700 outline-none focus:ring-2 focus:ring-orange-200 transition-all text-base"
                    onChange={(e) => {
                      if (e.target.value) {
                        setSelectedSchool(e.target.value);
                        setIsSettingOpen(false);
                      }
                    }}
                    value={selectedSchool}
                  >
                    <option value="">小学校を選択してね</option>
                    {Object.keys(SCHOOL_MAPPING).sort().map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 pointer-events-none" size={20} />
                </div>

                <div className="bg-stone-50 p-4 rounded-2xl">
                  <p className="text-[10px] text-stone-400 font-bold leading-relaxed">
                    ※一度選択すると、次回から自動的にこの学校の献立が表示されます。後でいつでも変更可能です。
                  </p>
                </div>

                <button 
                  onClick={() => setIsSettingOpen(false)}
                  className="w-full py-4 text-stone-300 font-black text-xs uppercase tracking-widest active:text-orange-400 transition"
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
