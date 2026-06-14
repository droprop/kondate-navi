export const SCHOOL_CATEGORIES = {
  juniorHigh: {
    label: "中学校",
    icon: "🎓",
    schools: [
      { name: "浦安市内中学校すべて", facility: "浦安市千鳥学校給食センター 第三調理場" },
    ]
  },
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
  }
} as const;

export const ALL_SCHOOLS = [...SCHOOL_CATEGORIES.primary.schools, ...SCHOOL_CATEGORIES.juniorHigh.schools];

export const SCHOOL_MAPPING: Record<string, { facility: string }> = Object.fromEntries(
  ALL_SCHOOLS.map(s => [s.name, { facility: s.facility }])
);
