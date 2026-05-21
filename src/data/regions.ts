/** China provincial capitals + major cities — [longitude, latitude] */
export type CityNode = {
  id: string;
  name: string;
  coord: [number, number];
  /** tier 1=municipality/core finance  2=provincial capital  3=major economic city  4=international */
  tier: 1 | 2 | 3 | 4;
  zone: "North" | "East" | "South" | "Central" | "Southwest" | "Northwest" | "Northeast" | "International";
};

export const CITY_NODES: CityNode[] = [
  // ── 4 municipalities (tier 1)
  { id: "bj", name: "Beijing", coord: [116.405, 39.904], tier: 1, zone: "North" },
  { id: "tj", name: "Tianjin", coord: [117.190, 39.125], tier: 1, zone: "North" },
  { id: "sh", name: "Shanghai", coord: [121.473, 31.230], tier: 1, zone: "East" },
  { id: "cq", name: "Chongqing", coord: [106.505, 29.533], tier: 1, zone: "Southwest" },

  // ── 26 provincial capitals / autonomous region capitals (tier 2)
  { id: "sjz", name: "Shijiazhuang", coord: [114.502, 38.045], tier: 2, zone: "North" },
  { id: "ty", name: "Taiyuan", coord: [112.549, 37.857], tier: 2, zone: "North" },
  { id: "hhht", name: "Hohhot", coord: [111.671, 40.818], tier: 2, zone: "North" },
  { id: "sy", name: "Shenyang", coord: [123.429, 41.797], tier: 2, zone: "Northeast" },
  { id: "cc", name: "Changchun", coord: [125.325, 43.887], tier: 2, zone: "Northeast" },
  { id: "hb", name: "Harbin", coord: [126.642, 45.757], tier: 2, zone: "Northeast" },
  { id: "nj", name: "Nanjing", coord: [118.767, 32.041], tier: 2, zone: "East" },
  { id: "hz", name: "Hangzhou", coord: [120.154, 30.287], tier: 2, zone: "East" },
  { id: "hf", name: "Hefei", coord: [117.283, 31.861], tier: 2, zone: "East" },
  { id: "fz", name: "Fuzhou", coord: [119.296, 26.075], tier: 2, zone: "East" },
  { id: "nc", name: "Nanchang", coord: [115.892, 28.676], tier: 2, zone: "East" },
  { id: "jn", name: "Jinan", coord: [117.001, 36.676], tier: 2, zone: "East" },
  { id: "zz", name: "Zhengzhou", coord: [113.665, 34.758], tier: 2, zone: "Central" },
  { id: "wh", name: "Wuhan", coord: [114.299, 30.584], tier: 2, zone: "Central" },
  { id: "cs", name: "Changsha", coord: [112.982, 28.194], tier: 2, zone: "Central" },
  { id: "gz", name: "Guangzhou", coord: [113.281, 23.125], tier: 1, zone: "South" },
  { id: "nn", name: "Nanning", coord: [108.320, 22.824], tier: 2, zone: "South" },
  { id: "hk_city", name: "Haikou", coord: [110.331, 20.032], tier: 2, zone: "South" },
  { id: "cd", name: "Chengdu", coord: [104.066, 30.659], tier: 2, zone: "Southwest" },
  { id: "gy", name: "Guiyang", coord: [106.713, 26.578], tier: 2, zone: "Southwest" },
  { id: "km", name: "Kunming", coord: [102.712, 25.041], tier: 2, zone: "Southwest" },
  { id: "lz_lhasa", name: "Lhasa", coord: [91.132, 29.660], tier: 2, zone: "Southwest" },
  { id: "xa", name: "Xi'an", coord: [108.948, 34.263], tier: 2, zone: "Northwest" },
  { id: "lz", name: "Lanzhou", coord: [103.824, 36.058], tier: 2, zone: "Northwest" },
  { id: "xn", name: "Xining", coord: [101.778, 36.623], tier: 2, zone: "Northwest" },
  { id: "yc", name: "Yinchuan", coord: [106.278, 38.466], tier: 2, zone: "Northwest" },
  { id: "ur", name: "Urumqi", coord: [87.618, 43.793], tier: 2, zone: "Northwest" },

  // ── Major economic cities (tier 3)
  { id: "sz", name: "Shenzhen", coord: [114.057, 22.543], tier: 1, zone: "South" },
  { id: "su", name: "Suzhou", coord: [120.619, 31.299], tier: 3, zone: "East" },
  { id: "wx", name: "Wuxi", coord: [120.302, 31.575], tier: 3, zone: "East" },
  { id: "qd", name: "Qingdao", coord: [120.383, 36.066], tier: 3, zone: "East" },
  { id: "nb", name: "Ningbo", coord: [121.624, 29.860], tier: 3, zone: "East" },
  { id: "xm", name: "Xiamen", coord: [118.110, 24.490], tier: 3, zone: "East" },
  { id: "fs", name: "Foshan", coord: [113.122, 23.029], tier: 3, zone: "South" },
  { id: "dl", name: "Dalian", coord: [121.620, 38.914], tier: 3, zone: "Northeast" },

  // ── Hong Kong, Macau, Taiwan (key financial nodes)
  { id: "hk", name: "Hong Kong", coord: [114.174, 22.320], tier: 1, zone: "South" },
  { id: "mo", name: "Macau", coord: [113.549, 22.199], tier: 2, zone: "South" },
  { id: "tp", name: "Taipei", coord: [121.565, 25.033], tier: 3, zone: "East" },
];

/** Major domestic financial links (by real regional collaboration) */
export const MAJOR_LINKS: [string, string][] = [
  // Beijing-Tianjin-Hebei
  ["bj", "tj"],
  ["bj", "sjz"],
  // Yangtze River Delta
  ["sh", "hz"], ["sh", "nj"], ["sh", "su"], ["su", "nj"], ["sh", "hf"], ["sh", "nb"],
  // Greater Bay Area
  ["gz", "sz"], ["gz", "fs"], ["sz", "hk"], ["hk", "mo"],
  // Cross-region trunk
  ["bj", "sh"], ["bj", "gz"], ["bj", "cd"], ["sh", "wh"], ["sh", "qd"],
  ["sz", "cd"], ["sz", "wh"], ["wh", "cs"], ["wh", "zz"], ["cd", "cq"], ["cd", "xa"],
  // Western
  ["xa", "lz"], ["lz", "ur"], ["lz", "xn"], ["cd", "lz_lhasa"], ["cq", "gy"], ["km", "nn"],
  // Northeast
  ["bj", "sy"], ["sy", "cc"], ["cc", "hb"], ["sy", "dl"],
  // South
  ["gz", "nn"], ["gz", "fz"], ["fz", "xm"], ["nn", "hk_city"], ["xm", "tp"],
  // Shandong / Henan
  ["jn", "qd"], ["zz", "jn"],
];

/** Overseas partner countries (4, with Chinese & English + real coordinates, for mini world map) */
export const WORLD_COUNTRIES: {
  id: string;
  cn: string;
  en: string;
  coord: [number, number]; // [lon, lat]
  flag: string;
}[] = [
  { id: "vn", cn: "越南 · 河内", en: "Vietnam · Hanoi", coord: [105.85, 21.03], flag: "🇻🇳" },
  { id: "uk", cn: "英国 · 伦敦", en: "UK · London", coord: [-0.13, 51.51], flag: "🇬🇧" },
  { id: "ca", cn: "加拿大 · 多伦多", en: "Canada · Toronto", coord: [-79.38, 43.65], flag: "🇨🇦" },
  { id: "mx", cn: "墨西哥 · 墨西哥城", en: "Mexico · Mexico City", coord: [-99.13, 19.43], flag: "🇲🇽" },
];

/** China reference point on mini world map (Beijing) */
export const CHINA_REF_COORD: [number, number] = [104, 36];

/** (Reserved: backward-compatible with old code references, no longer used) */
export const GLOBAL_ARCS: [string, string][] = [];
