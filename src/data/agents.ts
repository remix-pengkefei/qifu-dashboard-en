export type Agent = {
  id: string;
  name: string;
  desc: string;
  icon: string;
  baseTasks: number;
};

export const AGENTS: Agent[] = [
  { id: "approver", name: "AI 审批官", desc: "智能审批与额度决策", icon: "approver", baseTasks: 147820 },
  { id: "risk", name: "风控助手", desc: "实时反欺诈与额度风控", icon: "risk", baseTasks: 112935 },
  { id: "compliance", name: "合规助手", desc: "规则校验与文件审核", icon: "compliance", baseTasks: 89641 },
  { id: "marketing", name: "营销助手", desc: "客群洞察与策略匹配", icon: "marketing", baseTasks: 135208 },
  { id: "post", name: "贷后助手", desc: "贷后跟踪与提醒回收", icon: "post", baseTasks: 76503 },
  { id: "service", name: "服务助手", desc: "客户问询与流程引导", icon: "service", baseTasks: 91374 },
];
