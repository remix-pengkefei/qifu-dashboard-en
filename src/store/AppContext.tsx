import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import { AGENTS } from "../data/agents";
import { drift, randInt } from "../engine/random";
import {
  genCounters,
  genEvent,
  genInitialBatch,
  type LiveEvent,
  type Mode,
} from "../engine/eventGen";

const MAX_EVENTS = 28;

type AgentState = {
  id: string;
  name: string;
  desc: string;
  tasks: number;
  load: number; // 0-100
  status: "running" | "busy" | "calm";
};

type Counters = {
  totalEvents: number;
  trade: number;
  risk: number;
  service: number;
  alert: number;
};

type TopMetrics = {
  activeOrgs: number; // 当前活跃机构
  activeTasks: number; // 当前运行任务
  responseZones: number; // 当前响应区域
  riskScore: number; // 风险综合评分
  stability: number; // 系统稳定性 %
  avgResponse: number; // 平均响应 ms
  abnormal: number; // 当前异常数
  loanYTD: number; // 年累放款（万元）
  aum: number; // AUM（亿元）
  loanCnt: number; // 年累放款笔数
  serveCnt: number; // 服务客户数
  apiCalls: number; // 调用次数
};

type State = {
  mode: Mode;
  events: LiveEvent[];
  counters: Counters;
  agents: AgentState[];
  metrics: TopMetrics;
  clock: string;
  date: string;
};

type Action =
  | { type: "SET_MODE"; mode: Mode }
  | { type: "TICK_EVENT"; ev: LiveEvent }
  | { type: "TICK_METRICS" }
  | { type: "TICK_CLOCK"; time: string; date: string }
  | { type: "RESEED"; events: LiveEvent[]; counters: Counters };

const initAgents = (): AgentState[] =>
  AGENTS.map((a) => ({
    id: a.id,
    name: a.name,
    desc: a.desc,
    tasks: a.baseTasks + randInt(-30, 30),
    load: randInt(58, 92),
    status: "running",
  }));

const initMetrics = (): TopMetrics => ({
  activeOrgs: 167,
  activeTasks: 24560,
  responseZones: 92,
  riskScore: 752,
  stability: 99.992,
  avgResponse: 218,
  abnormal: 6,
  loanYTD: 12810769,
  aum: 1039.26,
  loanCnt: 8927364,
  serveCnt: 7321,
  apiCalls: 2184,
});

const fmtClock = () => {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return {
    time: `${hh}:${mm}:${ss}`,
    date: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
  };
};

const initialState = (mode: Mode): State => ({
  mode,
  events: genInitialBatch(mode, 14),
  counters: genCounters(mode),
  agents: initAgents(),
  metrics: initMetrics(),
  clock: fmtClock().time,
  date: fmtClock().date,
});

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_MODE":
      return state.mode === action.mode ? state : { ...state, mode: action.mode };
    case "TICK_EVENT": {
      const events = [action.ev, ...state.events].slice(0, MAX_EVENTS);
      const counters: Counters = {
        ...state.counters,
        totalEvents: state.counters.totalEvents + 1,
        trade: action.ev.level === "ok" ? state.counters.trade + 1 : state.counters.trade,
        risk: action.ev.level === "risk" ? state.counters.risk + 1 : state.counters.risk,
        service: state.counters.service + (Math.random() < 0.4 ? 1 : 0),
        alert: action.ev.level === "warn" ? state.counters.alert + 1 : state.counters.alert,
      };
      return { ...state, events, counters };
    }
    case "TICK_METRICS": {
      const m = state.metrics;
      const metrics: TopMetrics = {
        ...m,
        activeOrgs: drift(m.activeOrgs, 0.02),
        activeTasks: drift(m.activeTasks, 0.005),
        responseZones: Math.min(100, Math.max(70, drift(m.responseZones, 0.03))),
        riskScore: Math.min(900, Math.max(600, drift(m.riskScore, 0.01))),
        stability: Math.min(99.999, Math.max(99.95, m.stability + (Math.random() - 0.5) * 0.005)),
        avgResponse: Math.min(280, Math.max(180, drift(m.avgResponse, 0.04))),
        abnormal: Math.min(15, Math.max(0, m.abnormal + (Math.random() < 0.7 ? 0 : Math.random() < 0.5 ? -1 : 1))),
        loanYTD: m.loanYTD + randInt(15, 280),
        aum: +(m.aum + (Math.random() - 0.4) * 0.04).toFixed(2),
        loanCnt: m.loanCnt + randInt(2, 18),
        serveCnt: m.serveCnt + (Math.random() < 0.3 ? 1 : 0),
        apiCalls: m.apiCalls + randInt(0, 4),
      };
      const agents: AgentState[] = state.agents.map((a) => ({
        ...a,
        tasks: drift(a.tasks, 0.005),
        load: Math.min(99, Math.max(35, drift(a.load, 0.05))),
        status: a.load > 88 ? "busy" : a.load < 50 ? "calm" : "running",
      }));
      return { ...state, metrics, agents };
    }
    case "TICK_CLOCK":
      return { ...state, clock: action.time, date: action.date };
    case "RESEED":
      return { ...state, events: action.events, counters: action.counters };
    default:
      return state;
  }
};

type Ctx = State & {
  setMode: (m: Mode) => void;
};

const AppContext = createContext<Ctx | null>(null);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(reducer, initialState("overview"));
  const modeRef = useRef(state.mode);
  modeRef.current = state.mode;

  const setMode = useCallback((m: Mode) => {
    dispatch({ type: "SET_MODE", mode: m });
    // 模式切换：重新种事件流但保留连续滚动感
    const nextEvents = genInitialBatch(m, 14);
    const nextCounters = genCounters(m);
    dispatch({ type: "RESEED", events: nextEvents, counters: nextCounters });
  }, []);

  // 事件流：每 800–1500ms 一条
  useEffect(() => {
    let timer: number;
    const tick = () => {
      dispatch({ type: "TICK_EVENT", ev: genEvent(modeRef.current) });
      timer = window.setTimeout(tick, 800 + Math.random() * 700);
    };
    timer = window.setTimeout(tick, 600);
    return () => window.clearTimeout(timer);
  }, []);

  // 指标 / 智能体波动：每 2.4s
  useEffect(() => {
    const id = window.setInterval(() => dispatch({ type: "TICK_METRICS" }), 2400);
    return () => window.clearInterval(id);
  }, []);

  // 时钟：每 1s
  useEffect(() => {
    const id = window.setInterval(() => {
      const c = fmtClock();
      dispatch({ type: "TICK_CLOCK", time: c.time, date: c.date });
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const value = useMemo<Ctx>(() => ({ ...state, setMode }), [state, setMode]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): Ctx => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("AppContext missing");
  return ctx;
};
