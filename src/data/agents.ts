export type Agent = {
  id: string;
  name: string;
  desc: string;
  icon: string;
  baseTasks: number;
};

export const AGENTS: Agent[] = [
  { id: "approver", name: "AI Approver", desc: "Smart approval & credit decisions", icon: "approver", baseTasks: 108166 },
  { id: "risk", name: "Risk Control", desc: "Real-time anti-fraud & risk mgmt", icon: "risk", baseTasks: 112935 },
  { id: "compliance", name: "Compliance", desc: "Rule validation & doc review", icon: "compliance", baseTasks: 89641 },
  { id: "marketing", name: "Marketing", desc: "Customer insights & strategy", icon: "marketing", baseTasks: 135208 },
  { id: "post", name: "Post-Loan", desc: "Tracking & collection reminders", icon: "post", baseTasks: 76503 },
  { id: "service", name: "Service", desc: "Customer inquiry & process guidance", icon: "service", baseTasks: 91374 },
];
