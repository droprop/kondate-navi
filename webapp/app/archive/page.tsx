import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Calendar, UtensilsCrossed, Smartphone } from 'lucide-react';
import { getAvailableMonths, getMonthMenus, FACILITIES } from '../lib/archive';
import { parseMenuItem } from '../lib/menu';
import { SITE_URL } from '../site';
import SiteFooter from '../components/SiteFooter';

export const metadata: Metadata = {
  title: '浦安市の給食献立 月別一覧（小学校・中学校の献立予定表）｜こんだてボード',
  description:
    '浦安市立の小学校（第一調理場・第二調理場）および中学校（第三調理場）の月別給食献立予定表アーカイブです。各月の毎日のメニュー、お箸の要否、栄養価（カロリー・塩分・タンパク質・脂質）、使用食材一覧を確認できます。',
  alternates: { canonical: '/archive' },
  openGraph: {
    title: '浦安市の給食献立 月別一覧｜こんだてボード',
    description:
      '浦安市立の小学校17校・中学校の月別給食献立予定表一覧。毎日のメニュー・栄養価・食材を掲載。',
    url: `${SITE_URL}/archive`,
    type: 'website',
  },
};

export default function ArchiveIndexPage() {
  const months = getAvailableMonths();

  const monthsWithSummary = months.map((m) => {
    const data = getMonthMenus(m.ym);
    const menus = data?.menus || [];
    const uniqueDays = new Set(menus.map((item) => item.date)).size;
    // 代表的な主菜（★付き）を最大4件ピックアップ
    const mainDishes: string[] = [];
    for (const menu of menus) {
      for (const rawItem of menu.menu_items) {
        if (rawItem.startsWith('★')) {
          const { name } = parseMenuItem(rawItem);
          if (name && !mainDishes.includes(name)) {
            mainDishes.push(name);
          }
        }
        if (mainDishes.length >= 4) break;
      }
      if (mainDishes.length >= 4) break;
    }
    return {
      ...m,
      daysCount: uniqueDays,
      sampleDishes: mainDishes,
    };
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: '浦安市の給食献立 - こんだてボード',
        item: `${SITE_URL}/`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: '月別の給食献立一覧',
        item: `${SITE_URL}/archive`,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#FFFDF9] text-stone-800 pb-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="bg-white/95 backdrop-blur-md border-b border-stone-100 px-4 py-3 sticky top-0 z-30 shadow-sm">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link
              href="/"
              aria-label="こんだてボードのトップへ戻る"
              className="p-1.5 -ml-1.5 text-orange-500 rounded-full hover:bg-orange-50 active:scale-95 transition"
            >
              <ChevronLeft size={22} />
            </Link>
            <div className="bg-orange-100 p-1.5 rounded-lg text-orange-600">
              <UtensilsCrossed size={18} />
            </div>
            <h1 className="text-base font-bold text-stone-700 tracking-tight">
              浦安市の給食 月別献立一覧
            </h1>
          </div>
          <Link
            href="/"
            className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200 hover:bg-orange-100 transition"
          >
            今日の献立へ
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto p-3 sm:p-4 space-y-4">
        {/* メインSPAへの誘導カード */}
        <section className="bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-3xl p-5 shadow-md shadow-orange-500/15 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="bg-white/20 p-2 rounded-xl">
              <Smartphone size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold leading-snug">
                学校を選んで「今日の給食」を1秒チェック！
              </h2>
              <p className="text-xs text-white/90 mt-0.5">
                トップページでは通っている小・中学校を保存して毎日サクサク確認できます
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="block w-full bg-white text-orange-600 text-center py-2.5 rounded-2xl text-sm font-bold shadow-sm hover:bg-orange-50 active:scale-[0.99] transition"
          >
            こんだてボード（アプリ画面）を開く
          </Link>
        </section>

        {/* 月別アーカイブリスト */}
        <section className="bg-white rounded-3xl border border-stone-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-2.5">
            <Calendar size={18} className="text-orange-500" />
            <h2 className="text-base font-bold text-stone-800 tracking-tight">
              月別の給食献立予定表（全調理場）
            </h2>
          </div>
          <p className="text-xs text-stone-500 leading-relaxed">
            浦安市千鳥学校給食センター（第一調理場・第二調理場・第三調理場）の月別献立表データです。各月のメニュー・お箸の要否・栄養価・三色食品群の食材一覧を掲載しています。
          </p>

          <div className="grid gap-2.5 pt-1">
            {monthsWithSummary.map((m) => (
              <Link
                key={m.ym}
                href={`/archive/${m.ym}`}
                className="group block p-4 rounded-2xl border border-stone-100 bg-stone-50/50 hover:bg-orange-50/50 hover:border-orange-200 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-2">
                    <span className="font-en text-lg font-black text-stone-800 group-hover:text-orange-600 transition-colors">
                      {m.year}年 {m.month}月
                    </span>
                    <span className="text-xs font-bold text-stone-500">
                      の給食献立（{m.daysCount}日分）
                    </span>
                  </div>
                  <ChevronRight
                    size={18}
                    className="text-stone-400 group-hover:text-orange-500 transition-transform group-hover:translate-x-0.5"
                  />
                </div>
                {m.sampleDishes.length > 0 && (
                  <p className="text-xs text-stone-500 mt-1.5 line-clamp-1">
                    主な献立：{m.sampleDishes.join('、')} ほか
                  </p>
                )}
              </Link>
            ))}
          </div>
        </section>

        {/* 調理場と対応校の案内 */}
        <section className="bg-white rounded-3xl border border-stone-100 shadow-sm p-5 space-y-3">
          <h2 className="text-base font-bold text-stone-800 tracking-tight border-b border-stone-100 pb-2">
            浦安市の学校給食 調理場と対応校一覧
          </h2>
          <div className="space-y-3 text-xs leading-relaxed text-stone-600">
            {FACILITIES.map((f) => (
              <div key={f.anchorId} className="p-3 rounded-2xl bg-stone-50/70 border border-stone-100">
                <h3 className="font-bold text-stone-700 text-sm mb-1">
                  {f.shortName}（{f.schoolTypeLabel}）
                </h3>
                <p className="text-stone-600">{f.schools.join('・')}</p>
              </div>
            ))}
          </div>
        </section>

        <SiteFooter />
      </main>
    </div>
  );
}
