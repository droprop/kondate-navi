import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronLeft, UtensilsCrossed } from 'lucide-react';
import { SCHOOL_CATEGORIES } from '../lib/schools';
import { SITE_URL } from '../site';

/**
 * アプリ本体（/）はクライアント側で献立を取得するため、静的HTMLには本文がほとんど含まれない。
 * 説明・対応校・FAQ をこの独立ページに置くことで、トップの見た目を変えずに
 * インデックス対象の本文を確保する。CSSで隠す方法はクローキング扱いになるため取らない。
 */

export const metadata: Metadata = {
  title: 'こんだてボードについて｜浦安市の給食献立アプリの使い方と対応校',
  description:
    '浦安市立の小学校17校・中学校の給食献立を確認できる非公式アプリ「こんだてボード」の説明ページです。対応している学校の一覧、使い方、献立データの作り方、よくある質問を掲載しています。',
  alternates: { canonical: '/about' },
  openGraph: {
    title: 'こんだてボードについて｜浦安市の給食献立アプリ',
    description:
      '浦安市立の小学校17校・中学校の給食献立を確認できる非公式アプリの説明ページ。対応校一覧・使い方・よくある質問。',
    url: `${SITE_URL}/about`,
    type: 'article',
  },
};

// 調理場ごとに小学校をまとめる。schools.ts を唯一の情報源にして表記ゆれを防ぐ。
const PRIMARY_BY_FACILITY = SCHOOL_CATEGORIES.primary.schools.reduce<Record<string, string[]>>(
  (acc, s) => {
    (acc[s.facility] ||= []).push(s.name);
    return acc;
  },
  {}
);

const FAQ: { q: string; a: string }[] = [
  {
    q: 'お箸が必要な日はどうすればわかりますか？',
    a: '献立表にお箸のマークがある日は、その日の画面の一番上に「今日はおはしを持っていこう！」と表示されます。マークがない日は「今日はおはしいらないよ（スプーン等）」と表示されます。月の一覧画面でも、お箸が必要な日には箸のアイコンが付きます。',
  },
  {
    q: '献立はいつ更新されますか？',
    a: '浦安市が翌月分の献立予定表を公開したあと、順次反映しています。多くの場合、前月の下旬から月初にかけて公開されます。アプリを開いたときに自動で最新の内容を取得するため、更新のための操作は必要ありません。',
  },
  {
    q: 'アレルギーの情報は確認できますか？',
    a: 'このアプリが表示しているのは、献立名・三色食品群の食材・栄養価のみです。アレルギー表示には対応していません。食物アレルギーに関わる情報は、必ず学校または浦安市が配布する公式の資料でご確認ください。',
  },
  {
    q: '公式の献立表との違いは何ですか？',
    a: '掲載している内容は浦安市が公開している献立予定表と同じものですが、AIによる読み取りを経ているため、誤りが含まれる可能性があります。表示内容はあくまで参考としてご利用いただき、正確な情報は公式の献立表をご確認ください。',
  },
  {
    q: '通信できない場所でも見られますか？',
    a: '一度表示した月の献立は端末内に保存されるため、電波の届かない場所でも直前に見た内容を確認できます。ホーム画面に追加しておくと、アプリのように全画面で素早く開けます。',
  },
  {
    q: '利用に費用はかかりますか？',
    a: '無料です。広告も掲載していません。保護者が個人で運営しているアプリで、浦安市および各学校とは関係ありません。',
  },
];

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-3xl border border-stone-100 shadow-sm px-5 py-5 space-y-3">
      <h2 className="text-base font-bold text-stone-800 tracking-tight border-b border-stone-100 pb-2">
        {title}
      </h2>
      <div className="space-y-3 text-sm leading-relaxed text-stone-600">{children}</div>
    </section>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#FFFDF9] text-stone-800 pb-10">
      <header className="bg-white/95 backdrop-blur-md border-b border-stone-100 px-4 py-3 sticky top-0 z-30 shadow-sm">
        <div className="max-w-md mx-auto flex items-center gap-2">
          <Link
            href="/"
            aria-label="献立の画面にもどる"
            className="p-1.5 -ml-1.5 text-orange-500 rounded-full hover:bg-orange-50 active:scale-95 transition"
          >
            <ChevronLeft size={22} />
          </Link>
          <div className="bg-orange-100 p-1.5 rounded-lg text-orange-600">
            <UtensilsCrossed size={18} />
          </div>
          <h1 className="text-base font-bold text-stone-700 tracking-tight">
            こんだてボードについて
          </h1>
        </div>
      </header>

      <main className="max-w-md mx-auto p-3 sm:p-4 space-y-3">
        <Card title="こんだてボードとは">
          <p>
            こんだてボードは、浦安市立の小学校・中学校で提供される給食の献立を、スマートフォンから素早く確認できるようにした非公式アプリです。浦安市が毎月公開している「献立予定表」のPDFを自動で取得し、日付ごとに見やすく並べ直しています。PDFを開いて拡大縮小しながら目的の日付を探す必要がなく、その日の献立・お箸の要否・栄養価・使われている食材を一目で確認できます。
          </p>
          <p>
            浦安市の学校給食は千鳥学校給食センターで調理されており、小学校は第一調理場と第二調理場、中学校は第三調理場が担当しています。調理場ごとに献立が異なるため、通っている学校を一度選んでおくだけで、その学校に対応した献立だけが表示されるようにしています。選んだ学校は端末内に保存され、次に開いたときも同じ学校の献立がそのまま表示されます。
          </p>
          <p>
            毎日の献立に加えて、エネルギー・たんぱく質・脂質・塩分の栄養価と、赤（血や肉や骨をつくる）・黄（熱や力のもとになる）・緑（体の調子を整える）の三色食品群ごとの食材も掲載しています。夕食の献立を考えるときに、給食と重ならないよう確認する使い方もできます。
          </p>
        </Card>

        <Card title="対応している学校（浦安市立 全27校）">
          <p>
            浦安市立の全小学校17校と全中学校に対応しています。学校は調理を担当する調理場ごとに分かれています。
          </p>
          {Object.entries(PRIMARY_BY_FACILITY).map(([facility, names]) => (
            <div key={facility}>
              <h3 className="font-bold text-stone-700 mb-1">
                {facility.replace('浦安市千鳥学校給食センター ', '')}（小学校{names.length}校）
              </h3>
              <p>{names.join('、')}</p>
            </div>
          ))}
          <div>
            <h3 className="font-bold text-stone-700 mb-1">第三調理場（中学校）</h3>
            <p>
              浦安市立の中学校は全校が第三調理場で調理されており、献立が共通です。そのため設定画面では「浦安市内中学校すべて」としてまとめています。
            </p>
          </div>
        </Card>

        <Card title="使い方">
          <p>
            <strong className="text-stone-700">1. 学校を選ぶ</strong>
            <br />
            画面右上の「学校を選択」から、お子さんが通っている学校を選びます。選んだ内容は保存されるので、次回からは開くだけで献立が表示されます。
          </p>
          <p>
            <strong className="text-stone-700">2. 今日の献立を見る</strong>
            <br />
            「今日」タブでは、その日の献立・お箸の要否・栄養価・三色食品群が表示されます。左右にスワイプするか、日付の両脇にある矢印で前日・翌日に移動できます。
          </p>
          <p>
            <strong className="text-stone-700">3. 月の一覧で見る</strong>
            <br />
            「一覧」タブでは、その月の献立が日付順に並びます。今日の行は自動的に画面中央に表示されます。気になる日をタップすると、その日の詳しい内容に移動します。
          </p>
          <p>
            <strong className="text-stone-700">4. ホーム画面に追加する</strong>
            <br />
            ブラウザの「ホーム画面に追加」を行うと、アプリのアイコンから全画面で開けるようになります。iPhoneは共有ボタンから、Androidはメニューから追加できます。
          </p>
        </Card>

        <Card title="献立データの作り方と、正確性について">
          <p>
            こんだてボードの献立は、浦安市の公式サイトで公開されている献立予定表のPDFをそのまま出典としています。人の手で入力し直しているのではなく、公開されたPDFを自動で取得し、記載されている献立名・食材・栄養価を読み取って表示しています。お箸のマークについては、文字情報ではなく献立表の画像そのものを解析して判定しています。
          </p>
          <p>
            読み取った内容は、公開する前に自動で検証しています。日付と曜日が実際の暦と一致しているか、献立が空になっている日がないか、同じ日付が重複していないか、栄養価が現実的な範囲に収まっているか、といった点を機械的に確認し、問題が見つかった場合は公開を中止する仕組みにしています。
          </p>
          <p>
            ただし、この仕組みは誤りをゼロにするものではありません。読み取りの誤りや、公開後の献立変更が反映されていない可能性があります。表示内容は参考としてご利用いただき、アレルギーへの対応など重要な判断が必要な場面では、必ず学校または浦安市が配布する公式の資料をご確認ください。
          </p>
        </Card>

        <Card title="よくある質問">
          {FAQ.map((item) => (
            <div key={item.q}>
              <h3 className="font-bold text-stone-700 mb-1">{item.q}</h3>
              <p>{item.a}</p>
            </div>
          ))}
        </Card>

        <div className="pt-2 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white border border-stone-200 shadow-sm rounded-full text-sm font-bold text-stone-600 hover:text-orange-600 hover:border-orange-200 transition-all active:scale-95"
          >
            <ChevronLeft size={16} />
            <span>献立をみる</span>
          </Link>
        </div>
      </main>
    </div>
  );
}
