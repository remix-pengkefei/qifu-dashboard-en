import { useMemo } from "react";
import { useApp } from "../../store/AppContext";
import { useSize } from "../../utils/useSize";
import "./AgentHub.css";

const INPUT_LEFT = [
  { id: "持牌银行", label: "持牌银行" },
  { id: "城商行", label: "城商行" },
  { id: "农商行", label: "农商行" },
  { id: "消金机构", label: "消金机构" },
];
const INPUT_RIGHT = [
  { id: "小微商户", label: "小微商户" },
  { id: "供应链", label: "供应链工厂" },
  { id: "经营客户", label: "经营客户" },
  { id: "消费用户", label: "消费用户" },
];

export const AgentHub = () => {
  const { ref, size } = useSize<HTMLDivElement>();
  const W = size.width || 1;
  const H = size.height || 1;
  const { agents, metrics } = useApp();

  /**
   * 区域分配（防止重叠的关键）：
   *   顶部 banner / 角标:        0 ~ 44
   *   两侧 wave 面板（窄）:       50 ~ 50+waveH
   *   中央作战区（hub + agents）: 50 ~ H-180
   *   底部能力柱:                H-160 ~ H-90
   *   底部 stats:                H-72 ~ H-8
   *   左右 input source 列:     位于中央作战区两侧之外（不会进入 wave 区）
   */
  const TOP_RESERVED = 50;
  const BOTTOM_RESERVED = 175; // stats(72) + capacity row(95) + spacing
  const battleTop = TOP_RESERVED + 20;
  const battleBottom = H - BOTTOM_RESERVED;
  const battleH = Math.max(battleBottom - battleTop, 240);

  // 中枢
  const hubSize = Math.min(battleH * 0.42, 200);
  const cx = W / 2;
  const cy = battleTop + battleH * 0.5;

  // 6 个智能体节点
  const agentPositions = useMemo(() => {
    // 移动端没有 wave 占用左右两侧，所以可用半径更大
    const sidesUsed = W >= 1024 ? 320 : 60;
    const rx = Math.max(80, Math.min((W - sidesUsed) * 0.35, 280));
    const ry = Math.max(70, Math.min(battleH * 0.34, 150));
    return agents.map((a, i) => {
      const ang = (i / agents.length) * Math.PI * 2 - Math.PI / 2;
      return {
        ...a,
        x: cx + Math.cos(ang) * rx,
        y: cy + Math.sin(ang) * ry,
        ang,
      };
    });
  }, [agents, cx, cy, W, battleH]);

  // 输入源位置（避开 wave 面板，放在 wave 下方）
  const sourcesTop = TOP_RESERVED + 110; // wave 面板高度约 100
  const sourcesH = Math.min(battleH * 0.7, 320);
  const leftSources = useMemo(
    () =>
      INPUT_LEFT.map((s, i) => ({
        ...s,
        x: 28,
        y: sourcesTop + i * (sourcesH / (INPUT_LEFT.length - 1 || 1)),
      })),
    [sourcesTop, sourcesH]
  );
  const rightSources = useMemo(
    () =>
      INPUT_RIGHT.map((s, i) => ({
        ...s,
        x: W - 28,
        y: sourcesTop + i * (sourcesH / (INPUT_RIGHT.length - 1 || 1)),
      })),
    [W, sourcesTop, sourcesH]
  );

  const capacities = useMemo(() => {
    return agents.map((a, i) => ({
      ...a,
      pct: Math.min(99, Math.max(45, a.load + (i % 2 === 0 ? 6 : -3))),
    }));
  }, [agents]);

  return (
    <div ref={ref} className="ah">
      <div className="ah-banner">
        智能体编队作战中枢 · 实时调度
        <span className="ah-banner-en">AGENT FLEET COMMAND CENTER</span>
      </div>

      <div className="ah-corner-l">
        <span className="dot" /> 调度协议 · ONLINE
      </div>
      <div className="ah-corner-r">在岗 6 / 6 · 高效任务 6h 内 218</div>

      {/* 两侧 wave 面板（顶部） */}
      <div className="ah-wave-l">
        <div className="ah-wave-h">实时数据 / Realtime</div>
        <img src="/assets/waves/wave-realtime.svg" alt="" />
        <div className="ah-wave-meta num">采样 · {metrics.activeTasks.toLocaleString()} req/s</div>
      </div>
      <div className="ah-wave-r">
        <div className="ah-wave-h">结构化数据 / Structured</div>
        <img src="/assets/waves/wave-structured.svg" alt="" />
        <div className="ah-wave-meta num">入库 · {metrics.loanCnt.toLocaleString()} rec/h</div>
      </div>

      {/* SVG 链路层 */}
      <svg className="ah-svg" viewBox={`0 0 ${W} ${H}`}>
        <g>
          {leftSources.map((s, i) => (
            <line
              key={`il-${i}`}
              x1={s.x}
              y1={s.y}
              x2={cx}
              y2={cy}
              stroke="rgba(86,196,255,0.18)"
              strokeWidth={0.7}
              strokeDasharray="2 6"
            />
          ))}
          {rightSources.map((s, i) => (
            <line
              key={`ir-${i}`}
              x1={s.x}
              y1={s.y}
              x2={cx}
              y2={cy}
              stroke="rgba(86,196,255,0.18)"
              strokeWidth={0.7}
              strokeDasharray="2 6"
            />
          ))}
        </g>

        <g>
          {agentPositions.map((a, i) => (
            <g key={`d-${a.id}`}>
              <line x1={cx} y1={cy} x2={a.x} y2={a.y} stroke="rgba(86,196,255,0.32)" strokeWidth={1} />
              <line
                x1={cx}
                y1={cy}
                x2={a.x}
                y2={a.y}
                stroke="rgba(86,196,255,0.95)"
                strokeWidth={1.6}
                strokeDasharray="3 18"
                className="ah-flow-out"
                style={{ animationDelay: `${(i % 4) * 0.4}s` }}
              />
            </g>
          ))}
        </g>

        <g>
          {agentPositions.slice(0, 3).map((a, i) => {
            const tgt = leftSources[i % leftSources.length];
            return (
              <line
                key={`rl-${i}`}
                x1={a.x}
                y1={a.y}
                x2={tgt.x}
                y2={tgt.y}
                stroke="rgba(47,217,150,0.65)"
                strokeWidth={1}
                strokeDasharray="3 14"
                className="ah-flow-back"
                style={{ animationDelay: `${i * 0.5}s` }}
              />
            );
          })}
          {agentPositions.slice(3, 6).map((a, i) => {
            const tgt = rightSources[i % rightSources.length];
            return (
              <line
                key={`rr-${i}`}
                x1={a.x}
                y1={a.y}
                x2={tgt.x}
                y2={tgt.y}
                stroke="rgba(47,217,150,0.65)"
                strokeWidth={1}
                strokeDasharray="3 14"
                className="ah-flow-back"
                style={{ animationDelay: `${0.3 + i * 0.5}s` }}
              />
            );
          })}
        </g>
      </svg>

      <img
        src="/assets/hubs/hub-agent.png"
        alt=""
        className="ah-hub-img"
        style={{
          width: hubSize,
          height: hubSize,
          left: cx - hubSize / 2,
          top: cy - hubSize / 2,
        }}
      />
      <div
        className="ah-hub-label"
        style={{ left: cx, top: cy + hubSize / 2 + 2 }}
      >
        <div className="ah-hub-title">智能体作战中枢</div>
        <div className="ah-hub-sub">QFIN AGENT COMMAND</div>
      </div>

      {agentPositions.map((a) => (
        <div
          key={a.id}
          className={`ah-agent ah-agent-${a.status}`}
          style={{ left: a.x - 50, top: a.y - 50 }}
        >
          <img className="ah-agent-img" src={`/assets/agents/agent-${a.id}.svg`} alt={a.name} />
          <div className="ah-agent-name">{a.name}</div>
          <div className="ah-agent-load num">{a.load}%</div>
        </div>
      ))}

      {leftSources.map((s) => (
        <div key={`ls-${s.id}`} className="ah-src ah-src-l" style={{ left: s.x - 8, top: s.y - 14 }}>
          <span className="ah-src-dot" />
          <span className="ah-src-label">{s.label}</span>
        </div>
      ))}
      {rightSources.map((s) => (
        <div key={`rs-${s.id}`} className="ah-src ah-src-r" style={{ left: s.x - 110, top: s.y - 14 }}>
          <span className="ah-src-label">{s.label}</span>
          <span className="ah-src-dot" style={{ background: "#2fd996", boxShadow: "0 0 6px #2fd996" }} />
        </div>
      ))}

      {/* 底部执行能力 */}
      <div className="ah-cap-row">
        <div className="ah-cap-row-h">智能体执行能力 · 近 24h</div>
        <div className="ah-cap-grid">
          {capacities.map((c) => (
            <div key={c.id} className="ah-cap">
              <div className="ah-cap-name">{c.name}</div>
              <div className="ah-cap-bar">
                <div className="ah-cap-bar-fill" style={{ width: `${c.pct}%` }} />
              </div>
              <div className="ah-cap-pct num">{c.pct.toFixed(1)}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* 底部 stats */}
      <div className="ah-stats">
        <div className="ah-stat">
          <div className="ah-stat-label">智能体调用</div>
          <div className="ah-stat-value num">{metrics.activeTasks.toLocaleString()}</div>
        </div>
        <div className="ah-stat">
          <div className="ah-stat-label">协同准确率</div>
          <div className="ah-stat-value num good">98.12<em>%</em></div>
        </div>
        <div className="ah-stat">
          <div className="ah-stat-label">平均响应</div>
          <div className="ah-stat-value num">{metrics.avgResponse}<em>ms</em></div>
        </div>
        <div className="ah-stat">
          <div className="ah-stat-label">异常事件</div>
          <div className="ah-stat-value num warn">{metrics.abnormal}</div>
        </div>
      </div>
    </div>
  );
};
