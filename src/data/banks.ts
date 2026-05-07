export type Bank = {
  id: string;
  name: string;
  short: string;
  /** 简化色块作为像素级 logo 替代 */
  color: string;
  glyph: string;
  /** 类型：股份制 / 城商行 / 农商行 / 消金 / 国有 */
  kind: "国有" | "股份制" | "城商行" | "农商行" | "消金";
};

export const BANKS: Bank[] = [
  { id: "spdb", name: "浦发银行", short: "SPDB", color: "#e94d4d", glyph: "浦", kind: "股份制" },
  { id: "ceb", name: "光大银行", short: "CEB", color: "#7848d8", glyph: "光", kind: "股份制" },
  { id: "gzcb", name: "广州银行", short: "GZCB", color: "#3aa3ff", glyph: "广", kind: "城商行" },
  { id: "jsb", name: "江苏银行", short: "JSB", color: "#2db777", glyph: "苏", kind: "城商行" },
  { id: "syb", name: "盛京银行", short: "SYB", color: "#ff5e6c", glyph: "盛", kind: "城商行" },
  { id: "ncb", name: "南海农商", short: "NHRCB", color: "#ffa83a", glyph: "南", kind: "农商行" },
  { id: "zycf", name: "中原消费金融", short: "ZYCF", color: "#3ad6c4", glyph: "中", kind: "消金" },
  { id: "psbc", name: "邮储银行", short: "PSBC", color: "#39b54a", glyph: "邮", kind: "国有" },
  { id: "fsrc", name: "佛山农商", short: "FSRC", color: "#f0b94a", glyph: "佛", kind: "农商行" },
  { id: "njcb", name: "南京银行", short: "NJCB", color: "#3ec3ff", glyph: "宁", kind: "城商行" },
  { id: "bob", name: "北京银行", short: "BOB", color: "#cc4b3a", glyph: "京", kind: "城商行" },
  { id: "hzb", name: "杭州银行", short: "HZB", color: "#5a8cff", glyph: "杭", kind: "城商行" },
];
