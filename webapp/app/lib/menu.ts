export interface DailyMenu {
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

/**
 * メニュー項目の表示順ソート
 * 1. 主菜（★）を最優先
 * 2. 牛乳を最後尾に
 */
export function sortMenuItems(items: string[]): string[] {
  return [...items].sort((a, b) => {
    if (a.startsWith('★') && !b.startsWith('★')) return -1;
    if (!a.startsWith('★') && b.startsWith('★')) return 1;
    const isMilkA = a.includes('牛乳');
    const isMilkB = b.includes('牛乳');
    if (isMilkA && !isMilkB) return 1;
    if (!isMilkA && isMilkB) return -1;
    return 0;
  });
}

/**
 * メニュー項目文字列を「主菜フラグ・絵文字・名前」に分離する
 * Gemini出力例: "★🍞 シュガー揚げパン"
 */
export function parseMenuItem(item: string): { isMain: boolean; emoji: string; name: string } {
  const isMain = item.startsWith('★');
  const cleanStr = (isMain ? item.substring(1) : item).trim();

  const spaceIdx = cleanStr.indexOf(' ');
  if (spaceIdx > 0 && spaceIdx <= 4) {
    return { isMain, emoji: cleanStr.substring(0, spaceIdx), name: cleanStr.substring(spaceIdx + 1) };
  }
  return { isMain, emoji: '🍴', name: cleanStr };
}
