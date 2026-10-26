import { getAvailableMonths, getMonthMenus, FACILITIES } from './lib/archive';
import HomeClient, { FacilitySample } from './components/HomeClient';

export default function HomePage() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentDay = now.getDate();

  // 当月のデータがあれば当月、なければ最新の月を取得して初期プレビュー用の献立データを抽出
  const availableMonths = getAvailableMonths();
  const targetYm =
    availableMonths.find((m) => m.year === currentYear && m.month === currentMonth)?.ym ||
    availableMonths[0]?.ym;

  const monthData = targetYm ? getMonthMenus(targetYm) : null;
  const allMenus = monthData?.menus || [];

  const facilitySamples: FacilitySample[] = [];
  const labels = [
    { shortLabel: '第一調理場', subLabel: '小学校8校' },
    { shortLabel: '第二調理場', subLabel: '小学校9校' },
    { shortLabel: '第三調理場', subLabel: '中学校すべて' },
  ];

  FACILITIES.forEach((fac, idx) => {
    const menusForFacility = allMenus
      .filter((m) => m.facility_name === fac.facilityName)
      .sort((a, b) => a.date - b.date);

    if (menusForFacility.length > 0) {
      // 現在日以降で最も近い給食日、なければ月内の代表的な日を選択
      const sampleMenu =
        menusForFacility.find((m) => m.date >= currentDay) ||
        menusForFacility[menusForFacility.length - 1];

      facilitySamples.push({
        facilityName: fac.facilityName,
        shortLabel: labels[idx]?.shortLabel || fac.shortName,
        subLabel: labels[idx]?.subLabel || fac.schoolTypeLabel,
        schools: fac.schools,
        sampleMenu,
      });
    }
  });

  return <HomeClient facilitySamples={facilitySamples} />;
}
