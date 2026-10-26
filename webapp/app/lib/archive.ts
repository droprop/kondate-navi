import fs from 'fs';
import path from 'path';
import { DailyMenu } from './menu';
import { SCHOOL_CATEGORIES } from './schools';

export interface MonthKey {
  year: number;
  month: number;
  /** URL slug: e.g. "2026-10" */
  ym: string;
  /** File base: e.g. "2026_10" */
  fileKey: string;
}

export interface FacilityInfo {
  facilityName: string;
  shortName: string;
  schoolTypeLabel: string;
  schools: string[];
  anchorId: string;
}

export const FACILITIES: FacilityInfo[] = [
  {
    facilityName: '浦安市千鳥学校給食センター 第一調理場',
    shortName: '第一調理場（小学校）',
    schoolTypeLabel: '小学校8校',
    schools: SCHOOL_CATEGORIES.primary.schools
      .filter((s) => s.facility.includes('第一調理場'))
      .map((s) => s.name),
    anchorId: 'facility-1',
  },
  {
    facilityName: '浦安市千鳥学校給食センター 第二調理場',
    shortName: '第二調理場（小学校）',
    schoolTypeLabel: '小学校9校',
    schools: SCHOOL_CATEGORIES.primary.schools
      .filter((s) => s.facility.includes('第二調理場'))
      .map((s) => s.name),
    anchorId: 'facility-2',
  },
  {
    facilityName: '浦安市千鳥学校給食センター 第三調理場',
    shortName: '第三調理場（中学校）',
    schoolTypeLabel: '市内中学校すべて',
    schools: ['浦安中学校', '堀江中学校', '見明川中学校', '入船中学校', '富岡中学校', '美浜中学校', '日の出中学校', '明海中学校', '高洲中学校'],
    anchorId: 'facility-3',
  },
];

function getDataDir(): string {
  const publicDataDir = path.join(process.cwd(), 'public', 'data');
  if (fs.existsSync(publicDataDir)) {
    return publicDataDir;
  }
  return path.join(process.cwd(), '..', 'data');
}

/**
 * 利用可能なすべての年月を取得（新しい順）
 */
export function getAvailableMonths(): MonthKey[] {
  const dataDir = getDataDir();
  if (!fs.existsSync(dataDir)) return [];

  const files = fs.readdirSync(dataDir);
  const months: MonthKey[] = [];

  for (const file of files) {
    const match = /^(\d{4})_(\d{1,2})\.json$/.exec(file);
    if (!match) continue;
    const year = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    months.push({
      year,
      month,
      ym: `${year}-${month}`,
      fileKey: `${year}_${month}`,
    });
  }

  return months.sort((a, b) => {
    if (a.year !== b.year) return b.year - a.year;
    return b.month - a.month;
  });
}

/**
 * 指定した年月（"2026-10" など）の献立データを読み込む
 */
export function getMonthMenus(ym: string): { meta: MonthKey; menus: DailyMenu[] } | null {
  const match = /^(\d{4})-(\d{1,2})$/.exec(ym);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const fileKey = `${year}_${month}`;
  const filePath = path.join(getDataDir(), `${fileKey}.json`);

  if (!fs.existsSync(filePath)) return null;

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as { menus?: DailyMenu[] };
    return {
      meta: { year, month, ym: `${year}-${month}`, fileKey },
      menus: parsed.menus || [],
    };
  } catch {
    return null;
  }
}
