import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChevronLeft, ChevronRight, UtensilsCrossed, Smartphone, Calendar } from 'lucide-react';
import { getAvailableMonths, getMonthMenus, FACILITIES } from '../../lib/archive';
import { sortMenuItems, parseMenuItem } from '../../lib/menu';
import { SITE_URL } from '../../site';
import SiteFooter from '../../components/SiteFooter';

interface PageProps {
  params: Promise<{ ym: string }>;
}

export function generateStaticParams(): { ym: string }[] {
  return getAvailableMonths().map((m) => ({ ym: m.ym }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { ym } = await params;
  const data = getMonthMenus(ym);
  if (!data) {
    return {
      title: '献立データが見つかりません｜こんだてボード',
    };
  }

  const { year, month } = data.meta;
  const title = `浦安市の給食献立（${year}年${month}月）小学校・中学校の全メニューと栄養価｜こんだてボード`;
  const description = `${year}年${month}月の浦安市立小学校（第一調理場・第二調理場 全17校）および中学校（第三調理場）の給食献立予定表です。毎日のメニュー、お箸の要否、エネルギー・塩分などの栄養価、三色食品群の食材一覧を掲載しています。`;

  return {
    title,
    description,
    alternates: { canonical: `/archive/${ym}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/archive/${ym}`,
      type: 'article',
    },
  };
}

export default async function ArchiveMonthPage({ params }: PageProps) {
  const { ym } = await params;
  const data = getMonthMenus(ym);
  if (!data) {
    notFound();
  }

  const { year, month } = data.meta;
  const allMonths = getAvailableMonths(); // 新しい順
  const currentIdx = allMonths.findIndex((m) => m.ym === ym);
  const newerMonth = currentIdx > 0 ? allMonths[currentIdx - 1] : null;
  const olderMonth =
    currentIdx >= 0 && currentIdx < allMonths.length - 1 ? allMonths[currentIdx + 1] : null;

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
      {
        '@type': 'ListItem',
        position: 3,
        name: `${year}年${month}月の給食献立`,
        item: `${SITE_URL}/archive/${ym}`,
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
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href="/archive"
              aria-label="月別一覧へ戻る"
              className="p-1.5 -ml-1.5 text-orange-500 rounded-full hover:bg-orange-50 active:scale-95 transition shrink-0"
            >
              <ChevronLeft size={22} />
            </Link>
            <div className="bg-orange-100 p-1.5 rounded-lg text-orange-600 shrink-0">
              <UtensilsCrossed size={18} />
            </div>
            <h1 className="text-sm sm:text-base font-bold text-stone-700 tracking-tight truncate">
              浦安市の給食献立（{year}年{month}月）
            </h1>
          </div>
          <Link
            href="/"
            className="text-xs font-bold text-white bg-orange-500 px-3 py-1.5 rounded-full shadow-sm hover:bg-orange-600 transition shrink-0"
          >
            アプリで開く
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto p-3 sm:p-4 space-y-4">
        {/* メインSPAへの誘導バナー */}
        <section className="bg-white rounded-3xl border border-orange-200 p-4 shadow-sm space-y-2.5">
          <div className="flex items-start gap-3">
            <div className="bg-orange-100 text-orange-600 p-2 rounded-2xl shrink-0 mt-0.5">
              <Smartphone size={20} />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-bold text-stone-800">
                学校別の「今日・明日の献立」をすぐ見るなら
              </h2>
              <p className="text-xs text-stone-600 leading-relaxed">
                トップページで通っている小・中学校を1回選ぶだけで、毎日の献立やお箸の要否が1秒で表示されます。
              </p>
            </div>
          </div>
          <Link
            href="/"
            className="block w-full bg-orange-500 text-white text-center py-2.5 rounded-2xl text-xs font-bold shadow-sm hover:bg-orange-600 active:scale-[0.99] transition"
          >
            こんだてボード（学校別ページ）を開く
          </Link>
        </section>

        {/* 調理場ジャンプナビゲーション */}
        <nav
          aria-label="調理場別の献立へ移動"
          className="bg-white rounded-3xl border border-stone-100 p-4 shadow-sm space-y-2.5"
        >
          <p className="text-xs font-bold text-stone-600">
            {year}年{month}月の献立（調理場を選んで移動）
          </p>
          <div className="grid grid-cols-3 gap-2">
            {FACILITIES.map((f) => (
              <a
                key={f.anchorId}
                href={`#${f.anchorId}`}
                className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-stone-50 border border-stone-100 hover:border-orange-200 hover:bg-orange-50/60 transition text-center"
              >
                <span className="text-xs font-bold text-orange-600">
                  {f.shortName.replace(/（.+）/, '')}
                </span>
                <span className="text-[10px] font-medium text-stone-500 mt-0.5">
                  {f.schoolTypeLabel}
                </span>
              </a>
            ))}
          </div>
        </nav>

        {/* 各調理場の献立セクション */}
        {FACILITIES.map((facility, facilityIdx) => {
          const facilityMenus = data.menus
            .filter((m) => m.facility_name === facility.facilityName)
            .sort((a, b) => a.date - b.date);

          return (
            <section
              key={facility.anchorId}
              id={facility.anchorId}
              className={`bg-white rounded-3xl border border-stone-100 shadow-sm p-4 sm:p-5 space-y-4 scroll-mt-16 ${
                facilityIdx > 0 ? 'cv-auto' : ''
              }`}
            >
              <div className="border-b border-stone-100 pb-3 space-y-1.5">
                <span className="inline-block text-[11px] font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full">
                  {year}年{month}月 献立予定表
                </span>
                <h2 className="text-base font-bold text-stone-800 tracking-tight">
                  {facility.shortName}の給食献立
                </h2>
                <p className="text-xs text-stone-500 leading-relaxed">
                  <strong className="text-stone-600">対象校：</strong>
                  {facility.schools.join('・')}
                </p>
              </div>

              {facilityMenus.length > 0 ? (
                <div className="divide-y divide-stone-100">
                  {facilityMenus.map((m) => {
                    const sortedItems = sortMenuItems(m.menu_items);
                    const allIngredients = [
                      ...(m.ingredients?.body_building || []),
                      ...(m.ingredients?.energy_source || []),
                      ...(m.ingredients?.body_regulating || []),
                    ];

                    return (
                      <article key={m.date_id} className="py-3.5 first:pt-1 last:pb-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-baseline gap-1.5">
                            <h3 className="text-sm font-black text-stone-800">
                              {month}月{m.date}日（{m.day_of_week}）
                            </h3>
                          </div>
                          {m.needs_chopsticks ? (
                            <span className="text-[11px] font-bold text-orange-700 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full">
                              🥢 お箸が必要
                            </span>
                          ) : (
                            <span className="text-[11px] font-medium text-stone-500 bg-stone-50 px-2 py-0.5 rounded-full">
                              🥄 スプーン等
                            </span>
                          )}
                        </div>

                        <ul className="flex flex-wrap gap-1.5">
                          {sortedItems.map((item, idx) => {
                            const { isMain, emoji, name } = parseMenuItem(item);
                            return (
                              <li
                                key={idx}
                                className={`text-xs px-2.5 py-1 rounded-xl flex items-center gap-1 ${
                                  isMain
                                    ? 'bg-orange-50 text-stone-900 font-bold border border-orange-200/80'
                                    : 'bg-stone-50 text-stone-700 font-medium border border-stone-100'
                                }`}
                              >
                                <span>{emoji}</span>
                                <span>{name}</span>
                              </li>
                            );
                          })}
                        </ul>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-stone-500">
                          <span>
                            エネルギー:{' '}
                            <strong className="text-stone-700">{m.nutrition.energy_kcal}kcal</strong>
                          </span>
                          <span>
                            タンパク質:{' '}
                            <strong className="text-stone-700">{m.nutrition.protein_g}g</strong>
                          </span>
                          <span>
                            脂質: <strong className="text-stone-700">{m.nutrition.fat_g}g</strong>
                          </span>
                          <span>
                            塩分: <strong className="text-stone-700">{m.nutrition.salt_g}g</strong>
                          </span>
                        </div>

                        {allIngredients.length > 0 && (
                          <p className="text-[11px] text-stone-500 leading-relaxed">
                            <span className="font-bold text-stone-600">主な食材：</span>
                            {allIngredients.join('、')}
                          </p>
                        )}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-stone-500 py-4 text-center">
                  この調理場の献立データはありません。
                </p>
              )}
            </section>
          );
        })}

        {/* 前月・翌月ナビゲーション */}
        <nav
          aria-label="前後の月の献立へ移動"
          className="flex items-center justify-between gap-2 pt-2"
        >
          {olderMonth ? (
            <Link
              href={`/archive/${olderMonth.ym}`}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-stone-200 rounded-2xl text-xs font-bold text-stone-600 hover:border-orange-200 hover:text-orange-600 transition shadow-sm"
            >
              <ChevronLeft size={16} />
              <span>
                {olderMonth.year}年{olderMonth.month}月
              </span>
            </Link>
          ) : (
            <div />
          )}

          <Link
            href="/archive"
            className="flex items-center gap-1 px-3.5 py-2.5 bg-stone-100 rounded-2xl text-xs font-bold text-stone-600 hover:bg-stone-200 transition"
          >
            <Calendar size={14} />
            <span>月別一覧</span>
          </Link>

          {newerMonth ? (
            <Link
              href={`/archive/${newerMonth.ym}`}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-stone-200 rounded-2xl text-xs font-bold text-stone-600 hover:border-orange-200 hover:text-orange-600 transition shadow-sm"
            >
              <span>
                {newerMonth.year}年{newerMonth.month}月
              </span>
              <ChevronRight size={16} />
            </Link>
          ) : (
            <div />
          )}
        </nav>

        <SiteFooter />
      </main>
    </div>
  );
}
