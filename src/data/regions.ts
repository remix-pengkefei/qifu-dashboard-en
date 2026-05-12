/** 中国省会 + 主要经济城市 — [经度, 纬度] */
export type CityNode = {
  id: string;
  name: string;
  coord: [number, number];
  /** tier 1=直辖市/核心金融  2=省会  3=经济强市  4=国际映射 */
  tier: 1 | 2 | 3 | 4;
  zone: "华北" | "华东" | "华南" | "华中" | "西南" | "西北" | "东北" | "国际";
};

export const CITY_NODES: CityNode[] = [
  // ── 4 直辖市（tier 1）
  { id: "bj", name: "北京", coord: [116.405, 39.904], tier: 1, zone: "华北" },
  { id: "tj", name: "天津", coord: [117.190, 39.125], tier: 1, zone: "华北" },
  { id: "sh", name: "上海", coord: [121.473, 31.230], tier: 1, zone: "华东" },
  { id: "cq", name: "重庆", coord: [106.505, 29.533], tier: 1, zone: "西南" },

  // ── 26 省会 / 自治区首府（tier 2）
  { id: "sjz", name: "石家庄", coord: [114.502, 38.045], tier: 2, zone: "华北" },
  { id: "ty", name: "太原", coord: [112.549, 37.857], tier: 2, zone: "华北" },
  { id: "hhht", name: "呼和浩特", coord: [111.671, 40.818], tier: 2, zone: "华北" },
  { id: "sy", name: "沈阳", coord: [123.429, 41.797], tier: 2, zone: "东北" },
  { id: "cc", name: "长春", coord: [125.325, 43.887], tier: 2, zone: "东北" },
  { id: "hb", name: "哈尔滨", coord: [126.642, 45.757], tier: 2, zone: "东北" },
  { id: "nj", name: "南京", coord: [118.767, 32.041], tier: 2, zone: "华东" },
  { id: "hz", name: "杭州", coord: [120.154, 30.287], tier: 2, zone: "华东" },
  { id: "hf", name: "合肥", coord: [117.283, 31.861], tier: 2, zone: "华东" },
  { id: "fz", name: "福州", coord: [119.296, 26.075], tier: 2, zone: "华东" },
  { id: "nc", name: "南昌", coord: [115.892, 28.676], tier: 2, zone: "华东" },
  { id: "jn", name: "济南", coord: [117.001, 36.676], tier: 2, zone: "华东" },
  { id: "zz", name: "郑州", coord: [113.665, 34.758], tier: 2, zone: "华中" },
  { id: "wh", name: "武汉", coord: [114.299, 30.584], tier: 2, zone: "华中" },
  { id: "cs", name: "长沙", coord: [112.982, 28.194], tier: 2, zone: "华中" },
  { id: "gz", name: "广州", coord: [113.281, 23.125], tier: 1, zone: "华南" },
  { id: "nn", name: "南宁", coord: [108.320, 22.824], tier: 2, zone: "华南" },
  { id: "hk_city", name: "海口", coord: [110.331, 20.032], tier: 2, zone: "华南" },
  { id: "cd", name: "成都", coord: [104.066, 30.659], tier: 2, zone: "西南" },
  { id: "gy", name: "贵阳", coord: [106.713, 26.578], tier: 2, zone: "西南" },
  { id: "km", name: "昆明", coord: [102.712, 25.041], tier: 2, zone: "西南" },
  { id: "lz_lhasa", name: "拉萨", coord: [91.132, 29.660], tier: 2, zone: "西南" },
  { id: "xa", name: "西安", coord: [108.948, 34.263], tier: 2, zone: "西北" },
  { id: "lz", name: "兰州", coord: [103.824, 36.058], tier: 2, zone: "西北" },
  { id: "xn", name: "西宁", coord: [101.778, 36.623], tier: 2, zone: "西北" },
  { id: "yc", name: "银川", coord: [106.278, 38.466], tier: 2, zone: "西北" },
  { id: "ur", name: "乌鲁木齐", coord: [87.618, 43.793], tier: 2, zone: "西北" },

  // ── 经济强市（tier 3）
  { id: "sz", name: "深圳", coord: [114.057, 22.543], tier: 1, zone: "华南" },
  { id: "su", name: "苏州", coord: [120.619, 31.299], tier: 3, zone: "华东" },
  { id: "wx", name: "无锡", coord: [120.302, 31.575], tier: 3, zone: "华东" },
  { id: "qd", name: "青岛", coord: [120.383, 36.066], tier: 3, zone: "华东" },
  { id: "nb", name: "宁波", coord: [121.624, 29.860], tier: 3, zone: "华东" },
  { id: "xm", name: "厦门", coord: [118.110, 24.490], tier: 3, zone: "华东" },
  { id: "fs", name: "佛山", coord: [113.122, 23.029], tier: 3, zone: "华南" },
  { id: "dl", name: "大连", coord: [121.620, 38.914], tier: 3, zone: "东北" },

  // ── 港澳台（重要金融节点）
  { id: "hk", name: "香港", coord: [114.174, 22.320], tier: 1, zone: "华南" },
  { id: "mo", name: "澳门", coord: [113.549, 22.199], tier: 2, zone: "华南" },
  { id: "tp", name: "台北", coord: [121.565, 25.033], tier: 3, zone: "华东" },
];

/** 国内主要金融链路（按真实区域协同） */
export const MAJOR_LINKS: [string, string][] = [
  // 京津冀
  ["bj", "tj"],
  ["bj", "sjz"],
  // 长三角
  ["sh", "hz"], ["sh", "nj"], ["sh", "su"], ["su", "nj"], ["sh", "hf"], ["sh", "nb"],
  // 大湾区
  ["gz", "sz"], ["gz", "fs"], ["sz", "hk"], ["hk", "mo"],
  // 跨区主干
  ["bj", "sh"], ["bj", "gz"], ["bj", "cd"], ["sh", "wh"], ["sh", "qd"],
  ["sz", "cd"], ["sz", "wh"], ["wh", "cs"], ["wh", "zz"], ["cd", "cq"], ["cd", "xa"],
  // 西部
  ["xa", "lz"], ["lz", "ur"], ["lz", "xn"], ["cd", "lz_lhasa"], ["cq", "gy"], ["km", "nn"],
  // 东北
  ["bj", "sy"], ["sy", "cc"], ["cc", "hb"], ["sy", "dl"],
  // 华南
  ["gz", "nn"], ["gz", "fz"], ["fz", "xm"], ["nn", "hk_city"], ["xm", "tp"],
  // 山东 / 河南
  ["jn", "qd"], ["zz", "jn"],
];

/** 海外合作国家（4 个，含中英文 + 真实经纬度，用于迷你世界地图） */
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

/** 中国在迷你世界图上的代表点（北京） */
export const CHINA_REF_COORD: [number, number] = [104, 36];

/** （保留：兼容旧代码引用，但已不再使用） */
export const GLOBAL_ARCS: [string, string][] = [];
