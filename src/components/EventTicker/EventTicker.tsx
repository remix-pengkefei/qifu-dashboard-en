import { useEffect, useRef, useState } from "react";
import { useApp } from "../../store/AppContext";
import type { LiveEvent } from "../../engine/eventGen";
import { sceneIconUrl } from "../../data/sceneIcons";
import "./EventTicker.css";

const levelLabel: Record<LiveEvent["level"], string> = {
  normal: "运行中",
  ok: "已完成",
  warn: "复核中",
  risk: "风险拦截",
};

const levelStatusIcon: Record<LiveEvent["level"], string> = {
  normal: "/assets/status/status-running.svg",
  ok: "/assets/status/status-running.svg",
  warn: "/assets/status/status-busy.svg",
  risk: "/assets/status/status-error.svg",
};

export const EventTicker = () => {
  const { events, counters } = useApp();
  const [current, setCurrent] = useState<LiveEvent | null>(null);
  const [phase, setPhase] = useState<"enter" | "show" | "exit">("show");
  const queueRef = useRef<LiveEvent[]>([]);
  const showingIdRef = useRef<number>(-1);

  // 新事件入队
  useEffect(() => {
    if (!events.length) return;
    const latest = events[0];
    if (latest.id !== showingIdRef.current) {
      queueRef.current.push(latest);
    }
  }, [events]);

  // 跑马灯循环：取一条 → enter(0.5s) → show(2.5s) → exit(0.5s) → 下一条
  useEffect(() => {
    let alive = true;
    const next = () => {
      if (!alive) return;

      // 从队列取，没有就从 events 里随机展示
      const ev = queueRef.current.shift();
      if (!ev) {
        // 空闲时从已有事件轮播
        if (events.length > 0) {
          const pick = events[Math.floor(Math.random() * Math.min(events.length, 8))];
          run(pick);
        } else {
          setTimeout(next, 500);
        }
        return;
      }
      run(ev);
    };

    const run = (ev: LiveEvent) => {
      if (!alive) return;
      showingIdRef.current = ev.id;
      setCurrent(ev);
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
        }, 3000);
      }, 500);
    };

    // 启动
    const initTimer = setTimeout(next, 300);
    return () => {
      alive = false;
      clearTimeout(initTimer);
    };
  }, [events.length > 0]); // eslint-disable-line

  if (!current) return null;

  return (
    <div className="etk">
      {/* 左侧：标题 + 统计 */}
      <div className="etk-left">
        <i className="etk-bar" />
        <span className="etk-title">实时事件流</span>
        <div className="etk-stats num">
          <span className="etk-stat etk-stat-on">
            全部 <em>{counters.totalEvents.toLocaleString()}</em>
          </span>
          <span className="etk-stat">
            交易 <em>{counters.trade}</em>
          </span>
          <span className="etk-stat etk-stat-warn">
            风控 <em>{counters.risk}</em>
          </span>
          <span className="etk-stat">
            服务 <em>{counters.service}</em>
          </span>
          <span className="etk-stat etk-stat-amber">
            预警 <em>{counters.alert}</em>
          </span>
        </div>
      </div>

      {/* 右侧：跑马灯区域 */}
      <div className="etk-marquee">
        <div className={`etk-event lvl-${current.level} etk-${phase}`} key={current.id}>
          {/* 竖线指示器 */}
          <i className={`etk-indicator ind-${current.level}`} />

          {/* 时间 */}
          <span className="etk-time num">{current.time}</span>

          {/* 场景图标 */}
          <img
            className="etk-scene-icon"
            src={current.level === "risk" ? "/assets/alert-hex.svg" : sceneIconUrl(current.scene)}
            alt=""
          />

          {/* 银行 */}
          {current.bank && (
            <span
              className="etk-bank"
              style={{ color: current.bankColor, borderColor: `${current.bankColor}66` }}
            >
              {current.bank}
            </span>
          )}

          {/* 区域 */}
          <span className="etk-zone">{current.zone}</span>

          {/* 分隔 */}
          <span className="etk-sep">|</span>

          {/* 场景 */}
          <span className="etk-scene">{current.scene}</span>

          {/* 分隔 */}
          <span className="etk-sep">-</span>

          {/* 动作 */}
          <span className="etk-action">{current.action}</span>

          {/* 智能体 */}
          {current.agent && (
            <>
              <span className="etk-sep">/</span>
              <span className="etk-agent">{current.agent}</span>
            </>
          )}

          {/* 状态标签 */}
          <span className={`etk-tag tag-${current.level}`}>
            <img src={levelStatusIcon[current.level]} alt="" className="etk-tag-icon" />
            {levelLabel[current.level]}
          </span>
        </div>
      </div>

      {/* 扫描线 */}
      <div className="etk-scan" />
    </div>
  );
};
