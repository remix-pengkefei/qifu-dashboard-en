export type Bank = {
  id: string;
  name: string;
  short: string;
  color: string;
  glyph: string;
  kind: "银行" | "消金" | "科技" | "信托" | "农商行";
};

export const BANKS: Bank[] = [
  { id: "bob", name: "北京银行", short: "BOB", color: "#cc4b3a", glyph: "京", kind: "银行" },
  { id: "hzb", name: "杭州银行", short: "HZB", color: "#5a8cff", glyph: "杭", kind: "银行" },
  { id: "jsb", name: "江苏银行", short: "JSB", color: "#2db777", glyph: "苏", kind: "银行" },
  { id: "nbb", name: "宁波银行", short: "NBB", color: "#56c4ff", glyph: "甬", kind: "银行" },
  { id: "njb", name: "南京银行", short: "NJB", color: "#3ec3ff", glyph: "宁", kind: "银行" },
  { id: "shb", name: "上海银行", short: "SHB", color: "#e94d4d", glyph: "沪", kind: "银行" },
  { id: "zlxj", name: "招联消金", short: "ZLXJ", color: "#ff6b35", glyph: "招", kind: "消金" },
  { id: "msxj", name: "马上消金", short: "MSXJ", color: "#3ad6c4", glyph: "马", kind: "消金" },
  { id: "xyxj", name: "兴业消金", short: "XYXJ", color: "#7848d8", glyph: "兴", kind: "消金" },
  { id: "paxj", name: "平安消金", short: "PAXJ", color: "#f0b94a", glyph: "安", kind: "消金" },
  { id: "jdxj", name: "京东消金", short: "JDXJ", color: "#e94d4d", glyph: "东", kind: "科技" },
  { id: "dsm", name: "度小满", short: "DSM", color: "#39b54a", glyph: "度", kind: "科技" },
];
