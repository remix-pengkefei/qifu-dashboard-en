export type Bank = {
  id: string;
  name: string;
  short: string;
  color: string;
  glyph: string;
  kind: "Bank" | "Consumer Finance" | "Fintech" | "Trust" | "Rural Bank";
};

export const BANKS: Bank[] = [
  { id: "bob", name: "Bank of Beijing", short: "BOB", color: "#cc4b3a", glyph: "B", kind: "Bank" },
  { id: "hzb", name: "Bank of Hangzhou", short: "HZB", color: "#5a8cff", glyph: "H", kind: "Bank" },
  { id: "jsb", name: "Bank of Jiangsu", short: "JSB", color: "#2db777", glyph: "J", kind: "Bank" },
  { id: "nbb", name: "Bank of Ningbo", short: "NBB", color: "#56c4ff", glyph: "N", kind: "Bank" },
  { id: "njb", name: "Bank of Nanjing", short: "NJB", color: "#3ec3ff", glyph: "NJ", kind: "Bank" },
  { id: "shb", name: "Bank of Shanghai", short: "SHB", color: "#e94d4d", glyph: "S", kind: "Bank" },
  { id: "zlxj", name: "Zhaolian CF", short: "ZLXJ", color: "#ff6b35", glyph: "Z", kind: "Consumer Finance" },
  { id: "msxj", name: "MaShang CF", short: "MSXJ", color: "#3ad6c4", glyph: "M", kind: "Consumer Finance" },
  { id: "xyxj", name: "CIB CF", short: "XYXJ", color: "#7848d8", glyph: "C", kind: "Consumer Finance" },
  { id: "paxj", name: "Ping An CF", short: "PAXJ", color: "#f0b94a", glyph: "P", kind: "Consumer Finance" },
  { id: "jdxj", name: "JD Finance", short: "JDXJ", color: "#e94d4d", glyph: "JD", kind: "Fintech" },
  { id: "dsm", name: "Du Xiaoman", short: "DSM", color: "#39b54a", glyph: "D", kind: "Fintech" },
];
