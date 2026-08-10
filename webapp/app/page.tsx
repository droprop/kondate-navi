'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  UtensilsCrossed,
  School,
  Settings,
  Download
} from 'lucide-react';

import { SCHOOL_MAPPING } from './lib/schools';
import { DailyMenu } from './lib/menu';
import TodayView from './components/TodayView';
import MonthListView from './components/MonthListView';
import SettingsDialog from './components/SettingsDialog';
import InstallDialog from './components/InstallDialog';
import LoadingSkeleton from './components/LoadingSkeleton';
import SiteFooter from './components/SiteFooter';

export default function Home() {
  const [menusCache, setMenusCache] = useState<Record<string, DailyMenu[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [isSettingOpen, setIsSettingOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'today' | 'calendar'>('today');
  const [isStandalone, setIsStandalone] = useState(true); // 初期値trueでチラつき防止
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [deviceOS, setDeviceOS] = useState<'ios' | 'android' | 'other'>('other');

  useEffect(() => {
    const savedSchool = localStorage.getItem('selectedSchool');
    if (savedSchool && SCHOOL_MAPPING[savedSchool]) {
      setSelectedSchool(savedSchool);
    }

    // PWA判定とOS判定
    if (typeof window !== 'undefined') {
      const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
      const isPwa = window.matchMedia('(display-mode: standalone)').matches || navigatorWithStandalone.standalone === true;
      setIsStandalone(isPwa);

      const ua = window.navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) {
        setDeviceOS('ios');
      } else if (/android/.test(ua)) {
        setDeviceOS('android');
      }
    }

    // Service Worker 登録（オフライン時もアプリシェルを表示できるようにする）
    if (process.env.NODE_ENV === 'production' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // 登録失敗してもアプリ動作には影響しない
      });
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

        // no-cache: 毎回サーバーに確認するが、変更がなければ 304 で済む（no-store だと毎回フル取得）
        const res = await fetch(dataUrl, { cache: 'no-cache' });

        if (!res.ok) {
          // デプロイ中の一時的な 404 などで手元のキャッシュを消さない。
          // キャッシュが無いときだけ「データなし」として空配列を入れる。
          if (!cachedString) {
            setMenusCache(prev => ({ ...prev, [cacheKey]: [] }));
          }
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
    if (!selectedSchool) return undefined;
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

  const transitionUpdate = (updateFn: () => void) => {
    const transitionDocument = document as Document & {
      startViewTransition?: (callback: () => void) => void;
    };
    if (typeof transitionDocument.startViewTransition === 'function') {
      transitionDocument.startViewTransition(updateFn);
    } else {
      updateFn();
    }
  };

  // スクロールリセットとビュー変更
  const changeView = (mode: 'today' | 'calendar') => {
    transitionUpdate(() => {
      setViewMode(mode);
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  };

  const shiftDate = (days: number) => {
    transitionUpdate(() => {
      const d = new Date(currentDate);
      d.setDate(d.getDate() + days);
      setCurrentDate(d);
    });
  };

  const shiftMonth = (months: number) => {
    transitionUpdate(() => {
      const d = new Date(currentDate);
      d.setMonth(d.getMonth() + months);
      setCurrentDate(d);
    });
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#FFFDF9] font-sans text-stone-800 pb-10 selection:bg-orange-200">

      {/* ヘッダー */}
      <header className="bg-white/95 backdrop-blur-md border-b border-stone-100 px-4 py-3 sticky top-0 z-30 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-orange-100 p-1.5 rounded-lg text-orange-600">
              <UtensilsCrossed size={18} />
            </div>
            <h1 className="text-base font-bold text-stone-700 tracking-tight flex items-center whitespace-nowrap">
              <span className="sr-only">浦安市の給食献立 </span>
              こんだてボード
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {!isStandalone && (
              <button
                onClick={() => setIsInstallModalOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full transition-all bg-stone-100 text-stone-600 border border-stone-200 active:scale-95"
              >
                <Download size={14} className="text-orange-500 shrink-0" />
                <span className="text-xs font-bold whitespace-nowrap">アプリ化</span>
              </button>
            )}
            <button
              onClick={() => setIsSettingOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all ${
                selectedSchool
                  ? 'bg-stone-100 text-stone-600'
                  : 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 active:scale-95'
              }`}
            >
              <span className="text-xs font-bold whitespace-nowrap max-w-[8rem] truncate">{selectedSchool || '学校を選択'}</span>
              <Settings size={14} className="shrink-0" />
            </button>
          </div>
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
            <div className="bg-orange-50 w-20 h-20 rounded-2xl flex items-center justify-center text-orange-500 mx-auto">
              <School size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-stone-700">通っている学校を選んでね！</h2>
              <p className="text-sm text-stone-500 px-4 leading-relaxed">学校を選ぶと、今日・明日の給食や今月の献立を確認できます。</p>
            </div>
            <button
              onClick={() => setIsSettingOpen(true)}
              className="w-full bg-orange-500 text-white py-3 rounded-2xl font-bold shadow-lg shadow-orange-500/20 active:scale-[0.98] transition"
            >
              学校を選ぶ
            </button>
          </motion.div>
        )}

        {/* タブ */}
        <div className="flex bg-stone-100 p-1 rounded-2xl shadow-inner-sm">
          <button
            onClick={() => changeView('today')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'today' ? 'bg-white text-orange-600 shadow-sm' : 'text-stone-600'}`}
          >
            今日
          </button>
          <button
            onClick={() => changeView('calendar')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'calendar' ? 'bg-white text-orange-600 shadow-sm' : 'text-stone-600'}`}
          >
            一覧
          </button>
        </div>

        {viewMode === 'today' ? (
          <TodayView
            currentDate={currentDate}
            displayMenu={displayMenu}
            selectedSchool={selectedSchool}
            onPrevDay={() => shiftDate(-1)}
            onNextDay={() => shiftDate(1)}
          />
        ) : (
          <MonthListView
            currentDate={currentDate}
            menus={currentMonthMenus}
            selectedSchool={selectedSchool}
            onPrevMonth={() => shiftMonth(-1)}
            onNextMonth={() => shiftMonth(1)}
            onSelectDate={(date) => {
              const d = new Date(currentDate);
              d.setDate(date);
              setCurrentDate(d);
              changeView('today');
            }}
          />
        )}

        {/* Footer inside main for better mobile scrolling visibility */}
        <SiteFooter />
      </main>

      <SettingsDialog
        isOpen={isSettingOpen}
        onClose={() => setIsSettingOpen(false)}
        selectedSchool={selectedSchool}
        onSelectSchool={setSelectedSchool}
      />

      <InstallDialog
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
        deviceOS={deviceOS}
      />

    </div>
  );
}
