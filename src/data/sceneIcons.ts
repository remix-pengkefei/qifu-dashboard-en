/** 业务场景文案 → scene 图标 id 的映射 */
export const SCENE_TO_ICON: Record<string, string> = {
  "制造业经营周转": "factory",
  "小微商户经营贷": "sme",
  "供应链订单融资": "supply",
  "消费金融分期": "consumer",
  "电子商务货款": "ecom",
  "汽车融资": "auto",
  "餐饮经营贷": "food",
  "服装产业链": "apparel",
  "家居建材经营": "home",
  "农产品收购": "agri",
  "工程结算融资": "business",
  "个体工商户": "sme",
  "跨境贸易回款": "trade",
  "医疗器械经营": "medical",
  "教培行业经营": "edu",
  "物流车队经营": "logistics",
};

export const sceneIconUrl = (sceneText: string): string => {
  const id = SCENE_TO_ICON[sceneText] || "business";
  return `/assets/scenes/scene-${id}.svg`;
};
