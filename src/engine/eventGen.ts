import { BANKS } from "../data/banks";
import { AGENTS } from "../data/agents";
import { ACTIONS, RISK_EVENTS, SCENES, ZONES } from "../data/scenes";
import { formatTime, nextSeq, pick, rand, randInt } from "./random";

export type EventLevel = "normal" | "warn" | "risk" | "ok";
export type Mode = "overview" | "bank" | "agent";

export type LiveEvent = {
  id: number;
  time: string;
  bank?: string;
  bankColor?: string;
  zone: string;
  scene: string;
  action: string;
  agent?: string;
  level: EventLevel;
};

const levelRoll = (): EventLevel => {
  const r = Math.random();
  if (r < 0.07) return "risk";
  if (r < 0.18) return "warn";
  if (r < 0.42) return "ok";
  return "normal";
};

const buildBase = (level: EventLevel, _mode: Mode): LiveEvent => {
  const bank = pick(BANKS);
  const zone = pick(ZONES);
  const scene = pick(SCENES);
  const agent = pick(AGENTS);

  let action: string;
  if (level === "risk") action = pick(RISK_EVENTS);
  else if (level === "ok") action = pick(["智能审批通过", "用信划款执行", "提前还款受理"]);
  else action = pick(ACTIONS);

  // 每条事件都写全：银行、区域、场景、动作、智能体
  return {
    id: nextSeq(),
    time: formatTime(new Date()),
    bank: bank.name,
    bankColor: bank.color,
    zone,
    scene,
    action,
    agent: agent.name,
    level,
  };
};

export const genEvent = (mode: Mode): LiveEvent => buildBase(levelRoll(), mode);

export const genInitialBatch = (mode: Mode, n: number): LiveEvent[] => {
  const out: LiveEvent[] = [];
  for (let i = 0; i < n; i++) {
    const ev = genEvent(mode);
    // 时间稍微往前推一点
    const d = new Date(Date.now() - Math.floor(rand(2, 30)) * 1000);
    ev.time = formatTime(d);
    out.push(ev);
  }
  return out;
};

export const genCounters = (mode: Mode) => ({
  totalEvents: randInt(1100, 1400),
  trade: randInt(550, 720),
  risk: randInt(28, 65),
  service: randInt(220, 320),
  alert: randInt(120, 180),
  modeTag: mode,
});
