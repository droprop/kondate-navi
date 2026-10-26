'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  UtensilsCrossed,
  School,
  Settings,
  Download,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';

import { SCHOOL_CATEGORIES, SCHOOL_MAPPING } from '../lib/schools';
import { DailyMenu, sortMenuItems, parseMenuItem } from '../lib/menu';
import TodayView from './TodayView';
import MonthListView from './MonthListView';
import SettingsDialog from './SettingsDialog';
import InstallDialog from './InstallDialog';
import SiteFooter from './SiteFooter';

export interface FacilitySample {
  facilityName: string;
  shortLabel: string;
  subLabel: string;
  schools: string[];
  sampleMenu: DailyMenu;
}

interface HomeClientProps {
  facilitySamples: FacilitySample[];
}

export default function HomeClient({
  facilitySamples,
}: HomeClientProps) {
  const [menusCache, setMenusCache] = useState<Record<string, DailyMenu[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [isSettingOpen, setIsSettingOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [viewMode, setViewMode] = useState<'today' | 'calendar'>('today');
  const [isStandalone, setIsStandalone] = useState(true); // 初期値trueでチラつき防止
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [deviceOS, setDeviceOS] = useState<'ios' | 'android' | 'other'>('other');
  const [previewFacilityIdx, setPreviewFacilityIdx] = useState(0);

  useEffect(() => {
    const savedSchool = localStorage.getItem('selectedSchool');
    if (savedSchool && SCHOOL_MAPPING[savedSchool]) {
      setSelectedSchool(savedSchool);
    }
    // React state に反映されたので初期チラつき防止用の style タグは役目を終えて削除
    const initStyle = document.getElementById('ks-init');
    if (initStyle) {
      initStyle.remove();
    }

    // PWA判定とOS判定
    if (typeof window !== 'undefined') {
      const navigatorWithStandalone = window.navigator as Navigator & { standalone?: boolean };
      const isPwa =
        window.matchMedia('(display-mode: standalone)').matches ||
        navigatorWithStandalone.standalone === true;
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
            setMenusCache((prev) => ({ ...prev, [cacheKey]: parsed }));
          }
        } catch (e) {
          console.error('Cache parse error', e);
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
            setMenusCache((prev) => ({ ...prev, [cacheKey]: [] }));
          }
          return;
        }

        const data = await res.json();
        const apiMenus = data.menus || [];

        // 3. 取得した最新データでメモリとLocalStorageの両方を上書きする
        setMenusCache((prev) => ({ ...prev, [cacheKey]: apiMenus }));
        localStorage.setItem(localSWRKey, JSON.stringify(apiMenus));
      } catch (err) {
        console.error(`Failed to load menu data for ${cacheKey}:`, err);
        if (!cachedString) setMenusCache((prev) => ({ ...prev, [cacheKey]: [] }));
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
    return currentMonthMenusData.find(
      (menu) =>
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
      .filter((menu) => menu.facility_name === facility && menu.year === y && menu.month === m)
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

  const handleSelectSchoolAndScroll = (name: string) => {
    transitionUpdate(() => {
      setSelectedSchool(name);
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  };

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
              <span className="text-xs font-bold whitespace-nowrap max-w-[8rem] truncate">
                {selectedSchool || '学校を選択'}
              </span>
              <Settings size={14} className="shrink-0" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto p-3 sm:p-4 space-y-4">
        {/* 学校未選択時のプロンプト（従来の洗練されたファーストビューカード） */}
        {!selectedSchool && (
          <div
            className="initial-guide-only bg-white rounded-3xl p-8 text-center shadow-sm border border-orange-100 space-y-4"
          >
            <div className="bg-orange-50 w-20 h-20 rounded-2xl flex items-center justify-center text-orange-500 mx-auto">
              <School size={40} />
            </div>
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-stone-700">通っている学校を選んでね！</h2>
              <p className="text-sm text-stone-500 px-4 leading-relaxed">
                学校を選ぶと、今日・明日の給食や今月の献立を確認できます。
              </p>
            </div>
            <button
              onClick={() => setIsSettingOpen(true)}
              className="w-full bg-orange-500 text-white py-3 rounded-2xl font-bold shadow-lg shadow-orange-500/20 active:scale-[0.98] transition"
            >
              学校を選ぶ
            </button>
          </div>
        )}

        {/* タブ */}
        <div className="flex bg-stone-100 p-1 rounded-2xl shadow-inner-sm">
          <button
            onClick={() => changeView('today')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
              viewMode === 'today' ? 'bg-white text-orange-600 shadow-sm' : 'text-stone-600'
            }`}
          >
            今日
          </button>
          <button
            onClick={() => changeView('calendar')}
            className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${
              viewMode === 'calendar' ? 'bg-white text-orange-600 shadow-sm' : 'text-stone-600'
            }`}
          >
            一覧
          </button>
        </div>

        {viewMode === 'today' ? (
          <TodayView
            currentDate={currentDate}
            displayMenu={displayMenu}
            selectedSchool={selectedSchool}
            loading={loading}
            onPrevDay={() => shiftDate(-1)}
            onNextDay={() => shiftDate(1)}
          />
        ) : (
          <MonthListView
            currentDate={currentDate}
            menus={currentMonthMenus}
            selectedSchool={selectedSchool}
            loading={loading}
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

        {/*
          学校未選択時（初回訪問者 ＆ Googleクローラー）のみ下に続くショーケース＆学校一覧。
          一度学校を選択すると非表示になり、普段のストイックなアプリ画面を一切邪魔しない。
        */}
        {!selectedSchool && facilitySamples.length > 0 && (
          <div className="initial-guide-only pt-2 space-y-5">
            {/* 1. 実際の献立表示イメージ（実データ連動ショーケース） */}
            <section
              aria-label="こんだてボードの表示イメージと献立例"
              className="bg-white rounded-3xl p-5 border border-stone-100 shadow-sm space-y-4"
            >
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-50 border border-orange-100 text-orange-600 text-[11px] font-bold">
                  <Sparkles size={12} />
                  <span>表示イメージ（実際の献立データ）</span>
                </div>
                <h2 className="text-base font-bold text-stone-800 tracking-tight">
                  毎日の給食・お箸・栄養価がひと目でわかる
                </h2>
                <p className="text-xs text-stone-500 leading-relaxed">
                  浦安市の小学校（第一・第二調理場）・中学校（第三調理場）の献立予定表から、その日のメニューや食材を見やすく整理して表示します。
                </p>
              </div>

              {/* 調理場切り替えタブ */}
              <div className="flex bg-stone-100 p-1 rounded-2xl gap-1">
                {facilitySamples.map((sample, idx) => (
                  <button
                    key={sample.facilityName}
                    onClick={() => setPreviewFacilityIdx(idx)}
                    className={`flex-1 py-2 px-1 rounded-xl text-xs font-bold transition-all text-center ${
                      previewFacilityIdx === idx
                        ? 'bg-white text-orange-600 shadow-sm'
                        : 'text-stone-600 hover:text-stone-800'
                    }`}
                  >
                    <div>{sample.shortLabel}</div>
                    <div className="text-[10px] font-medium opacity-75">{sample.subLabel}</div>
                  </button>
                ))}
              </div>

              {/* 各調理場の実際の献立プレビュー（TodayViewと完全統一のデザイン） */}
              {facilitySamples.map((sample, idx) => {
                const menu = sample.sampleMenu;
                const isVisible = previewFacilityIdx === idx;
                return (
                  <div
                    key={sample.facilityName}
                    className={isVisible ? 'space-y-3.5' : 'hidden'}
                  >
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-bold text-stone-600">
                        📅 {menu.year}年{menu.month}月{menu.date}日（{menu.day_of_week}）の献立例
                      </span>
                      <span className="text-[11px] font-medium text-stone-500">
                        {sample.shortLabel}
                      </span>
                    </div>

                    {/* お箸アラート */}
                    {menu.needs_chopsticks ? (
                      <div className="bg-orange-500 text-white rounded-2xl py-[9px] px-4 flex items-center justify-center gap-3 shadow-md shadow-orange-500/20 ring-1 ring-white/20">
                        <span className="text-xl">🥢</span>
                        <span className="font-bold text-sm sm:text-base tracking-wide">
                          今日はおはしを持っていこう！
                        </span>
                      </div>
                    ) : (
                      <div className="bg-stone-100 text-stone-600 rounded-2xl py-[9px] px-4 flex items-center justify-center gap-3 border border-stone-200/50">
                        <span className="text-xl">🥄</span>
                        <span className="text-sm sm:text-base font-bold tracking-wide">
                          今日はおはしいらないよ（スプーン等）
                        </span>
                      </div>
                    )}

                    {/* メニューリスト */}
                    <div className="bg-[#FFFDF9] rounded-3xl border border-stone-100 overflow-hidden">
                      <div className="px-4 py-2.5 border-b border-stone-100 bg-stone-50/60 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-stone-500 tracking-widest">
                          きょうのこんだて
                        </span>
                        <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                          ★は主菜・メイン
                        </span>
                      </div>
                      <ul className="divide-y divide-stone-100/80">
                        {sortMenuItems(menu.menu_items).map((item, i) => {
                          const { isMain, emoji, name } = parseMenuItem(item);
                          return (
                            <li
                              key={i}
                              className={`px-4 py-2.5 flex items-center gap-3.5 relative ${
                                isMain ? 'bg-gradient-to-r from-orange-50/80 to-white' : 'bg-white'
                              }`}
                            >
                              {isMain && (
                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-400 to-amber-300" />
                              )}
                              <div
                                className={`w-9 h-9 rounded-2xl flex items-center justify-center text-lg shrink-0 shadow-sm ${
                                  isMain
                                    ? 'bg-white ring-2 ring-orange-200 shadow-orange-100'
                                    : 'bg-stone-50 border border-stone-100'
                                }`}
                              >
                                {emoji}
                              </div>
                              <span
                                className={`leading-snug text-sm sm:text-base ${
                                  isMain
                                    ? 'text-stone-900 font-bold tracking-tight'
                                    : 'text-stone-700 font-medium'
                                }`}
                              >
                                {name}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>

                    {/* 栄養グリッド */}
                    <div className="bg-[#FFFDF9] rounded-2xl p-3 border border-stone-100 flex items-center justify-between gap-1">
                      {[
                        {
                          label: 'エネルギー',
                          val: menu.nutrition.energy_kcal,
                          unit: 'kcal',
                          color: 'text-orange-500',
                        },
                        {
                          label: '塩分',
                          val: menu.nutrition.salt_g,
                          unit: 'g',
                          color: 'text-stone-700',
                        },
                        {
                          label: 'タンパク質',
                          val: menu.nutrition.protein_g,
                          unit: 'g',
                          color: 'text-stone-700',
                        },
                        {
                          label: '脂質',
                          val: menu.nutrition.fat_g,
                          unit: 'g',
                          color: 'text-stone-700',
                        },
                      ].map((n, i) => (
                        <div key={i} className="flex flex-col items-center flex-1">
                          <span className="text-[11px] font-medium text-stone-500 whitespace-nowrap">
                            {n.label}
                          </span>
                          <span className={`font-en text-sm sm:text-base font-medium ${n.color}`}>
                            {n.val} <small className="text-[11px] font-normal">{n.unit}</small>
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* 三色食品群 */}
                    <div className="bg-[#FFFDF9] rounded-2xl p-4 border border-stone-100 space-y-2.5">
                      <div className="flex items-center gap-2 border-b border-stone-100 pb-1.5">
                        <div className="bg-orange-100 p-1 rounded-md text-orange-600">
                          <UtensilsCrossed size={11} />
                        </div>
                        <span className="text-xs font-bold text-stone-700 tracking-widest">
                          三色食品群（使用食材）
                        </span>
                      </div>
                      <div className="space-y-2">
                        {[
                          {
                            color: 'bg-rose-400',
                            label: '赤（血や肉や骨をつくる）',
                            items: menu.ingredients.body_building,
                          },
                          {
                            color: 'bg-amber-400',
                            label: '黄（熱や力のもとになる）',
                            items: menu.ingredients.energy_source,
                          },
                          {
                            color: 'bg-emerald-400',
                            label: '緑（体の調子を整える）',
                            items: menu.ingredients.body_regulating,
                          },
                        ].map((g, i) => (
                          <div key={i}>
                            <div className="flex items-center gap-2 mb-0.5">
                              <div className={`w-2 h-2 rounded-full ${g.color}`} />
                              <span className="text-[11px] font-bold text-stone-600">{g.label}</span>
                            </div>
                            <p className="text-[11px] font-medium text-stone-500 leading-relaxed pl-4">
                              {g.items.join('、')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </section>

            {/* 2. 調理場別の対応校一覧（ここからも1タップで学校選択可能） */}
            <section
              aria-label="浦安市立の小・中学校と調理場一覧"
              className="bg-white rounded-3xl p-5 border border-stone-100 shadow-sm space-y-4"
            >
              <div className="space-y-1">
                <h2 className="text-base font-bold text-stone-800 tracking-tight">
                  対応している浦安市立の小・中学校（全27校）
                </h2>
                <p className="text-xs text-stone-500 leading-relaxed">
                  千鳥学校給食センターの第一・第二・第三調理場すべてに対応しています。下の学校名をタップしてそのまま献立を見ることもできます。
                </p>
              </div>

              <div className="space-y-4">
                {/* 中学校（第三調理場） */}
                <div className="p-3.5 rounded-2xl bg-stone-50/70 border border-stone-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <span>🎓</span>
                      <span>第三調理場（浦安市立中学校 全9校共通）</span>
                    </h3>
                  </div>
                  <p className="text-[11px] text-stone-500 leading-relaxed">
                    浦安中・堀江中・見明川中・入船中・富岡中・美浜中・日の出中・明海中・高洲中
                  </p>
                  {SCHOOL_CATEGORIES.juniorHigh.schools.map((s) => (
                    <button
                      key={s.name}
                      onClick={() => handleSelectSchoolAndScroll(s.name)}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-white border border-orange-200 text-xs font-bold text-orange-600 hover:bg-orange-500 hover:text-white transition shadow-sm flex items-center justify-between"
                    >
                      <span>{s.name} の献立を見る</span>
                      <span>→</span>
                    </button>
                  ))}
                </div>

                {/* 小学校 第一調理場・第二調理場 */}
                {[
                  {
                    title: '第一調理場（小学校8校）',
                    schools: SCHOOL_CATEGORIES.primary.schools.filter((s) =>
                      s.facility.includes('第一調理場')
                    ),
                  },
                  {
                    title: '第二調理場（小学校9校）',
                    schools: SCHOOL_CATEGORIES.primary.schools.filter((s) =>
                      s.facility.includes('第二調理場')
                    ),
                  },
                ].map((group) => (
                  <div
                    key={group.title}
                    className="p-3.5 rounded-2xl bg-stone-50/70 border border-stone-100 space-y-2.5"
                  >
                    <h3 className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                      <span>🎒</span>
                      <span>{group.title}</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-1.5">
                      {group.schools.map((s) => (
                        <button
                          key={s.name}
                          onClick={() => handleSelectSchoolAndScroll(s.name)}
                          className="py-2 px-3 rounded-xl bg-white border border-stone-200/80 text-xs font-bold text-stone-700 hover:border-orange-300 hover:text-orange-600 active:scale-95 transition text-left truncate"
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 3. こんだてボードの3つの特徴 */}
            <section
              aria-label="こんだてボードの特徴"
              className="bg-white rounded-3xl p-5 border border-stone-100 shadow-sm space-y-3"
            >
              <h2 className="text-base font-bold text-stone-800 tracking-tight">
                こんだてボードの3つの特徴
              </h2>
              <div className="grid gap-2.5">
                {[
                  {
                    title: 'PDFを開かずに1秒で今日の給食がわかる',
                    desc: '毎月公開される献立予定表PDFを探して拡大する必要はありません。選んだ学校の献立がすぐに開きます。',
                  },
                  {
                    title: 'お箸が必要な日を大きくお知らせ',
                    desc: '献立表のお箸マークを自動で判定し、「今日はおはしを持っていこう！」と分かりやすく表示します。',
                  },
                  {
                    title: '栄養価と三色食品群で夕飯づくりの参考に',
                    desc: 'カロリー・塩分・タンパク質・脂質と、赤・黄・緑の食材がわかるため、夕食の献立決めにも役立ちます。',
                  },
                ].map((feat) => (
                  <div
                    key={feat.title}
                    className="flex items-start gap-2.5 p-3 rounded-2xl bg-stone-50/60 border border-stone-100"
                  >
                    <CheckCircle2 size={16} className="text-orange-500 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <h3 className="text-xs font-bold text-stone-700">{feat.title}</h3>
                      <p className="text-[11px] text-stone-500 leading-relaxed">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
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
