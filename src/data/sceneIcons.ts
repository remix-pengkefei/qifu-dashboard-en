/** Business scene text → scene icon id mapping */
export const SCENE_TO_ICON: Record<string, string> = {
  "Manufacturing Working Capital": "factory",
  "SME Business Loan": "sme",
  "Supply Chain Financing": "supply",
  "Consumer Installment": "consumer",
  "E-commerce Payment": "ecom",
  "Auto Financing": "auto",
  "F&B Business Loan": "food",
  "Apparel Supply Chain": "apparel",
  "Home Materials": "home",
  "Agricultural Purchase": "agri",
  "Construction Settlement": "business",
  "Individual Business": "sme",
  "Cross-border Trade": "trade",
  "Medical Equipment": "medical",
  "Education Business": "edu",
  "Logistics Fleet": "logistics",
};

export const sceneIconUrl = (sceneText: string): string => {
  const id = SCENE_TO_ICON[sceneText] || "business";
  return `/assets/scenes/scene-${id}.svg`;
};
