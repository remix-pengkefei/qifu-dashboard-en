import { useEffect, useRef, useState } from "react";
import { useApp } from "../../store/AppContext";
import type { LiveEvent } from "../../engine/eventGen";
import "./EventTicker.css";

/** 智能体名称 → icon 路径 */
const agentIcon = (name: string): string => {
  if (name.includes("审批")) return "/assets/agents/agent-approver.svg";
  if (name.includes("风控") || name.includes("决策")) return "/assets/agents/agent-risk.svg";
  if (name.includes("合规")) return "/assets/agents/agent-compliance.svg";
  if (name.includes("营销")) return "/assets/agents/agent-marketing.svg";
  if (name.includes("贷后")) return "/assets/agents/agent-post.svg";
  if (name.includes("服务")) return "/assets/agents/agent-service.svg";
  return "/assets/agents/agent-approver.svg";
};

/** 把事件拼成一句完整的描述 */
const fmtWan = (wan: number): string => {
  if (wan >= 10000) return `${(wan / 10000).toFixed(1)}亿`;
  if (wan >= 100) return `${Math.round(wan)}万`;
  if (wan >= 1) return `${wan.toFixed(1)}万`;
  return `${Math.round(wan * 10000)}元`;
};
const buildDesc = (e: LiveEvent): string => {
  const wan = Math.random() * 24 + 1;
  const amount = fmtWan(wan);
  const bank = e.bank || "合作机构";
  const agent = e.agent || "AI 智能体";

  if (e.level === "risk") {
    return `${bank}触发风险预警：${e.action}，${agent}已介入实时拦截并启动人工复核流程`;
  }
  if (e.level === "warn") {
    return `${bank}${e.scene}场景${e.action}，${agent}标记为待复核，预计金额 ¥${amount}`;
  }
  if (e.level === "ok") {
    return `${bank}${e.scene}场景${e.action}完成，${agent}确认放款 ¥${amount}已到账`;
  }
  return `${bank}${e.scene}场景${e.action}，${agent}正在处理中，申请金额 ¥${amount}`;
};

type TickerItem = {
  id: number;
  icon: string;
  desc: string;
  level: LiveEvent["level"];
  agoSec: number;
};

export const EventTicker = () => {
  const { events } = useApp();
  const [current, setCurrent] = useState<TickerItem | null>(null);
  const [phase, setPhase] = useState<"enter" | "show" | "exit">("show");
  const queueRef = useRef<TickerItem[]>([]);
  const showingIdRef = useRef<number>(-1);
  const seqRef = useRef(0);

  // 新事件入队
  useEffect(() => {
    if (!events.length) return;
    const latest = events[0];
    if (latest.id !== showingIdRef.current && !queueRef.current.some((q) => q.id === latest.id)) {
      queueRef.current.push({
        id: latest.id,
        icon: agentIcon(latest.agent || ""),
        desc: buildDesc(latest),
        level: latest.level,
        agoSec: Math.floor(Math.random() * 5 + 1),
      });
    }
  }, [events]);

  // 跑马灯循环：enter(0.6s) → show(5s) → exit(0.5s) → 下一条
  useEffect(() => {
    let alive = true;

    const next = () => {
      if (!alive) return;
      let item = queueRef.current.shift();
      if (!item) {
        if (events.length > 0) {
          const pick = events[Math.floor(Math.random() * Math.min(events.length, 8))];
          item = {
            id: --seqRef.current,
            icon: agentIcon(pick.agent || ""),
            desc: buildDesc(pick),
            level: pick.level,
            agoSec: Math.floor(Math.random() * 20 + 5),
          };
        } else {
          setTimeout(next, 500);
          return;
        }
      }
      run(item);
    };

    const run = (item: TickerItem) => {
      if (!alive) return;
      showingIdRef.current = item.id;
      setCurrent(item);
      setPhase("enter");

      setTimeout(() => {
        if (!alive) return;
        setPhase("show");

        setTimeout(() => {
          if (!alive) return;
          setPhase("exit");

          setTimeout(() => {
            if (!alive) return;
            next();
          }, 500);
        }, 5000);
      }, 600);
    };

    const initTimer = setTimeout(next, 400);
    return () => {
      alive = false;
      clearTimeout(initTimer);
    };
  }, [events.length > 0]); // eslint-disable-line

  if (!current) return null;

  return (
    <div className="etk">
      <div className="etk-left">
        <i className="etk-bar" />
        <span className="etk-title">实时事件流</span>
      </div>

      <div className="etk-marquee">
        <div className={`etk-event lvl-${current.level} etk-${phase}`} key={current.id}>
          {/* 1. icon */}
          <img className="etk-icon" src={current.icon} alt="" />
          {/* 2. 事件描述 */}
          <span className="etk-desc">{current.desc}</span>
          {/* 3. 时间 */}
          <span className="etk-ago num">{current.agoSec}秒前</span>
        </div>
      </div>

      <div className="etk-scan" />
    </div>
  );
};
