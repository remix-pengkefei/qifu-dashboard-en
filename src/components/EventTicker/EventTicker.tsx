import { useEffect, useRef, useState } from "react";
import { useApp } from "../../store/AppContext";
import type { LiveEvent } from "../../engine/eventGen";
import "./EventTicker.css";

/** Agent name -> icon path */
const agentIcon = (name: string): string => {
  if (name.includes("Approv")) return "/assets/agents/agent-approver.svg";
  if (name.includes("Risk") || name.includes("Decision")) return "/assets/agents/agent-risk.svg";
  if (name.includes("Compliance")) return "/assets/agents/agent-compliance.svg";
  if (name.includes("Marketing")) return "/assets/agents/agent-marketing.svg";
  if (name.includes("Post")) return "/assets/agents/agent-post.svg";
  if (name.includes("Service")) return "/assets/agents/agent-service.svg";
  return "/assets/agents/agent-approver.svg";
};

/** Build a full description sentence for the event */
const fmtWan = (wan: number): string => {
  if (wan >= 10000) return `${(wan / 10000).toFixed(1)}B`;
  if (wan >= 100) return `${Math.round(wan)}0K`;
  if (wan >= 1) return `${wan.toFixed(1)}0K`;
  return `${Math.round(wan * 10000)}`;
};
const buildDesc = (e: LiveEvent): string => {
  const wan = Math.random() * 24 + 1;
  const amount = fmtWan(wan);
  const bank = e.bank || "Partner";
  const agent = e.agent || "AI Agent";

  if (e.level === "risk") {
    return `${bank} triggered risk alert: ${e.action}, ${agent} intervened for real-time blocking and manual review`;
  }
  if (e.level === "warn") {
    return `${bank} ${e.scene} scenario ${e.action}, ${agent} flagged for review, est. amount ¥${amount}`;
  }
  if (e.level === "ok") {
    return `${bank} ${e.scene} scenario ${e.action} completed, ${agent} confirmed disbursement ¥${amount} credited`;
  }
  return `${bank} ${e.scene} scenario ${e.action}, ${agent} processing, applied amount ¥${amount}`;
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

  // Queue new events
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

  // Ticker loop: enter(0.6s) -> show(5s) -> exit(0.5s) -> next item
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
        <span className="etk-title">Live Events</span>
      </div>

      <div className="etk-marquee">
        <div className={`etk-event lvl-${current.level} etk-${phase}`} key={current.id}>
          {/* 1. icon */}
          <img className="etk-icon" src={current.icon} alt="" />
          {/* 2. event description */}
          <span className="etk-desc">{current.desc}</span>
          {/* 3. time */}
          <span className="etk-ago num">{current.agoSec}s ago</span>
        </div>
      </div>

      <div className="etk-scan" />
    </div>
  );
};
