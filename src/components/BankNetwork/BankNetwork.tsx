import { useMemo } from "react";
import { BANKS } from "../../data/banks";
import { useApp } from "../../store/AppContext";
import { useSize } from "../../utils/useSize";
import "./BankNetwork.css";

/**
 * Bank mode layout strategy — parallel ops:
 *   Left 6 bank cards (vertical) / Right 6 bank cards (vertical)
 *   Upper center: agent dispatch sub-hub (hub-bank.png)
 *   Lower center: 8 industry/segment scene icons (horizontal)
 *
 * Zone allocation (based on container size W x H):
 *   Top banner: 0 ~ 44px
 *   Left/right bank cols: 50 ~ H-90 (leave room for bottom stats)
 *   Center hub: centered between the two columns
 *   Scene row: bottom of center column
 *   Bottom stats: H-72 ~ H-8
 */

const SCENE_TARGETS: { id: string; label: string }[] = [
  { id: "factory", label: "Manufacturing" },
  { id: "auto", label: "Auto Dealer" },
  { id: "electronics", label: "Electronics" },
  { id: "supply", label: "Supply Chain" },
  { id: "ecom", label: "E-commerce" },
  { id: "sme", label: "SME" },
  { id: "logistics", label: "Logistics" },
  { id: "food", label: "F&B" },
];

const BANK_TO_SCENE: Record<string, number[]> = {
  spdb: [0, 5],
  ceb: [1, 7],
  gzcb: [2],
  jsb: [0, 4],
  syb: [6],
  ncb: [5],
  zycf: [4, 7],
  psbc: [3],
  fsrc: [5],
  njcb: [2, 3],
  bob: [6, 1],
  hzb: [4],
};

const BANK_TO_HUB = new Set(["spdb", "jsb", "ceb", "psbc", "njcb", "hzb", "zycf", "ncb"]);

export const BankNetwork = () => {
  const { ref, size } = useSize<HTMLDivElement>();
  const W = size.width || 1;
  const H = size.height || 1;
  const { metrics, agents } = useApp();

  // Layout zones (core boundaries to prevent overlap)
  const TOP_RESERVED = 44;       // Top banner / badges
  const BOTTOM_RESERVED = 80;    // Bottom stats card
  const stageTop = TOP_RESERVED + 6;
  const stageBottom = H - BOTTOM_RESERVED - 6;
  const stageH = Math.max(stageBottom - stageTop, 200);

  // Bank card dimensions
  const cardW = Math.min(150, Math.max(120, W * 0.108));
  const cardH = Math.round(cardW / 1.6);
  const colInset = 14;

  // 6-row vertical bank distribution
  const banksWithPos = useMemo(() => {
    const banksLeft = BANKS.slice(0, 6);
    const banksRight = BANKS.slice(6, 12);
    const slotH = stageH / 6;
    const out: ((typeof BANKS)[number] & { x: number; y: number; side: "L" | "R" })[] = [];
    banksLeft.forEach((b, i) => {
      out.push({
        ...b,
        x: colInset + cardW / 2,
        y: stageTop + slotH * i + slotH / 2,
        side: "L",
      });
    });
    banksRight.forEach((b, i) => {
      out.push({
        ...b,
        x: W - colInset - cardW / 2,
        y: stageTop + slotH * i + slotH / 2,
        side: "R",
      });
    });
    return out;
  }, [W, stageH, cardW, stageTop]);

  // Center usable width (outside bank columns)
  const centerLeft = colInset + cardW + 20;
  const centerRight = W - colInset - cardW - 20;
  const centerW = centerRight - centerLeft;
  const centerCx = (centerLeft + centerRight) / 2;

  // Hub
  const hubSize = Math.min(centerW * 0.32, stageH * 0.36, 200);
  const hubX = centerCx;
  const hubY = stageTop + stageH * 0.32;

  // Scene icon positions (evenly distributed within center band)
  const sceneRow = useMemo(() => {
    const row = SCENE_TARGETS;
    const totalW = Math.min(centerW * 0.92, 700);
    const startX = centerCx - totalW / 2;
    const stepX = totalW / (row.length - 1);
    const y = stageTop + stageH * 0.78;
    return row.map((s, i) => ({
      ...s,
      x: startX + i * stepX,
      y,
    }));
  }, [centerW, centerCx, stageTop, stageH]);

  return (
    <div ref={ref} className="bn">
      {/* Top banner */}
      <div className="bn-banner">
        Bank Collaboration Network · Parallel Ops
        <span className="bn-banner-en">PARALLEL BANK COLLABORATION</span>
      </div>

      <div className="bn-corner-l">
        <span className="dot" /> Agents Active · {agents.length}
      </div>
      <div className="bn-corner-r">Online Institutions · {metrics.activeOrgs}</div>

      {/* Hub PNG */}
      <img
        src="/assets/hubs/hub-bank.png"
        alt=""
        className="bn-hub-img"
        style={{
          width: hubSize,
          height: hubSize,
          left: hubX - hubSize / 2,
          top: hubY - hubSize / 2,
        }}
      />
      <div
        className="bn-hub-label"
        style={{
          left: hubX,
          top: hubY + hubSize / 2 + 2,
        }}
      >
        <div className="bn-hub-title">Agent Service Hub</div>
        <div className="bn-hub-sub">QFIN AGENT HUB</div>
      </div>

      {/* SVG link layer */}
      <svg className="bn-svg" viewBox={`0 0 ${W} ${H}`}>
        {/* Bank -> Hub */}
        <g>
          {banksWithPos.filter((b) => BANK_TO_HUB.has(b.id)).map((b, i) => (
            <g key={`h-${b.id}`}>
              <line x1={b.x} y1={b.y} x2={hubX} y2={hubY} stroke="rgba(86,196,255,0.18)" strokeWidth={0.7} />
              <line
                x1={b.x}
                y1={b.y}
                x2={hubX}
                y2={hubY}
                stroke={b.color}
                strokeWidth={1.4}
                strokeDasharray="3 16"
                opacity={0.85}
                className="bn-flow-in"
                style={{ animationDelay: `${(i % 6) * 0.35}s` }}
              />
            </g>
          ))}
        </g>

        {/* Bank -> Scene */}
        <g>
          {banksWithPos.flatMap((b) => {
            const targets = BANK_TO_SCENE[b.id] || [];
            return targets.map((sceneIdx, j) => {
              const tgt = sceneRow[sceneIdx];
              if (!tgt) return null;
              return (
                <g key={`s-${b.id}-${j}`}>
                  <line x1={b.x} y1={b.y} x2={tgt.x} y2={tgt.y} stroke="rgba(47,217,150,0.16)" strokeWidth={0.7} />
                  <line
                    x1={b.x}
                    y1={b.y}
                    x2={tgt.x}
                    y2={tgt.y}
                    stroke="rgba(47,217,150,0.85)"
                    strokeWidth={1.2}
                    strokeDasharray="3 14"
                    className="bn-flow-out"
                    style={{ animationDelay: `${j * 0.35 + (b.side === "L" ? 0.1 : 0.4)}s` }}
                  />
                </g>
              );
            });
          })}
        </g>

        {/* Hub -> Scene */}
        <g>
          {sceneRow.map((s, i) => (
            <line
              key={i}
              x1={hubX}
              y1={hubY}
              x2={s.x}
              y2={s.y}
              stroke="rgba(86,196,255,0.16)"
              strokeWidth={0.6}
              strokeDasharray="2 6"
            />
          ))}
        </g>
      </svg>

      {/* Bank cards */}
      {banksWithPos.map((b) => (
        <div
          key={b.id}
          className={`bn-bank bn-bank-${b.side.toLowerCase()}`}
          style={{
            left: b.x - cardW / 2,
            top: b.y - cardH / 2,
            width: cardW,
            height: cardH,
          }}
        >
          <img className="bn-bank-svg" src={`/assets/banks/bank-${b.id}.svg`} alt={b.name} />
          <span className="bn-bank-led" style={{ background: b.color, boxShadow: `0 0 6px ${b.color}` }} />
        </div>
      ))}

      {/* Scene icons */}
      {sceneRow.map((s) => (
        <div
          key={s.id}
          className="bn-scene"
          style={{
            left: s.x - 32,
            top: s.y - 26,
          }}
        >
          <img src={`/assets/scenes/scene-${s.id}.svg`} alt={s.label} />
          <div className="bn-scene-label">{s.label}</div>
        </div>
      ))}

      {/* Bottom stats */}
      <div className="bn-stats">
        <div className="bn-stat">
          <div className="bn-stat-label">Partner Institutions</div>
          <div className="bn-stat-value num">235</div>
        </div>
        <div className="bn-stat">
          <div className="bn-stat-label">Active Institutions</div>
          <div className="bn-stat-value num">{metrics.activeOrgs}</div>
        </div>
        <div className="bn-stat">
          <div className="bn-stat-label">Bank Agent Calls</div>
          <div className="bn-stat-value num">{metrics.activeTasks.toLocaleString()}</div>
        </div>
        <div className="bn-stat">
          <div className="bn-stat-label">System Stability</div>
          <div className="bn-stat-value num good">{metrics.stability.toFixed(2)}<em>%</em></div>
        </div>
        <div className="bn-stat">
          <div className="bn-stat-label">Avg Response</div>
          <div className="bn-stat-value num">{metrics.avgResponse}<em>ms</em></div>
        </div>
        <div className="bn-stat">
          <div className="bn-stat-label">Anomaly Blocked</div>
          <div className="bn-stat-value num warn">{metrics.abnormal}</div>
        </div>
      </div>
    </div>
  );
};
