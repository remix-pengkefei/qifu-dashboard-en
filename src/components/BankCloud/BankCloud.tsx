import { useEffect, useMemo, useRef, useState } from "react";
import { BANKS_167 } from "../../data/banks167";
import { useSize } from "../../utils/useSize";
import "./BankCloud.css";

/**
 * 167 partner banks - true 3D ellipsoidal word cloud
 *  - Uses Fibonacci sphere distribution to evenly place 167 words on a unit sphere
 *  - X-axis stretched (ellipsoid) for horizontal ellipse projection
 *  - Each frame rotates around Y-axis (primary) + slight X tilt for depth
 *  - After projection, sorts by z-depth for opacity/font-size/z-order (front heavy, back light)
 *
 *  - Top 4 AI agent cards
 *  - Call animation: randomly pick a visible front-facing word -> highlight + SVG arc to agent
 */

const AGENTS = [
  { id: "approver", name: "AI Approver", color: "#56c4ff", iconKey: "approver" },
  { id: "risk", name: "AI Risk Control", color: "#8b9dff", iconKey: "risk" },
  { id: "compliance", name: "AI Compliance", color: "#5be8c0", iconKey: "compliance" },
  { id: "marketing", name: "AI Marketing", color: "#e8b85e", iconKey: "marketing" },
];

const baseAgentCalls: Record<string, number> = {
  approver: 927_258,
  risk: 967_184,
  compliance: 832_461,
  marketing: 1_159_073,
};

type SphereWord = {
  idx: number;
  text: string;
  weight: number;
  color?: string;
  badgeColor: string;
  badgeChar: string;
  size: number;
  /** Unit sphere coordinates (radius 1) */
  ux: number;
  uy: number;
  uz: number;
};

/** Match bank name to category -> badge color */
const categoryColor = (name: string): string => {
  if (/ICBC|CCB|ABC|Bank of China|BoCom|PSBC/.test(name)) return "#cc4b3a"; // Big state banks
  if (/SPD|Everbright|CITIC|Huaxia|Minsheng|CIB|Ping An|Evergrowing|Zheshang|Bohai/.test(name)) return "#3a6cff"; // Joint-stock
  if (/RCB|Rural/.test(name)) return "#2db777"; // Rural
  if (/\bCF\b|Consumer Finance/.test(name)) return "#ffa83a"; // CF
  if (/WeBank|MYbank|Zhongbang|ZGC|Fumin|Yilian|Zhenxing|Fubon|aiBank/.test(name))
    return "#7a55cc"; // Private / digital
  return "#56c4ff"; // City banks / default
};

/** Get the first character of bank name */
const badgeChar = (name: string): string => {
  const trimmed = name
    .replace(/\s*(Bank|CF|Finance|Trust|Guarantee|RCB|Micro-loan|Tech)\s*/gi, "")
    .replace(/\s*(Bank of|of)\s*/gi, "")
    .trim();
  return (trimmed || name).charAt(0);
};

export const BankCloud = () => {
  const { ref: cloudRef, size: cloudSize } = useSize<HTMLDivElement>();

  const [agentCalls, setAgentCalls] = useState<Record<string, number>>(baseAgentCalls);
  const [agentBlip, setAgentBlip] = useState<string | null>(null);
  const [hitBankIdx, setHitBankIdx] = useState(-1);
  const [hitColor, setHitColor] = useState("");

  // Font size tiers: base values (for ~500px container width / 1920px viewport)
  const fontScale = Math.max((cloudSize.width || 500) / 500, 0.6);
  const sizeOf = (w: number) =>
    (({ 1: 9, 2: 11, 3: 14, 4: 18, 5: 22 } as Record<number, number>)[w] || 12) * fontScale;

  // Fibonacci sphere uniform distribution: 167 banks evenly placed on sphere
  // Key fix: stable pseudo-random shuffle to avoid large words (CF/private banks)
  // clustering at the end, which Fibonacci would place at the bottom hemisphere
  const spherePoints = useMemo<SphereWord[]>(() => {
    // Simple LCG PRNG (fixed seed, consistent shuffle across renders)
    let s = 1337;
    const rng = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    const shuffled = [...BANKS_167]
      .map((b, i) => ({ b, i, k: rng() }))
      .sort((a, b) => a.k - b.k)
      .map((x) => x.b);

    const N = shuffled.length;
    const phi = (Math.sqrt(5) - 1) / 2; // Golden ratio
    return shuffled.map((b, i) => {
      const y = 1 - (i + 0.5) * 2 / N; // -1 → 1
      const r = Math.sqrt(1 - y * y);
      const theta = 2 * Math.PI * phi * i;
      return {
        idx: i,
        text: b.name,
        weight: b.weight,
        color: b.color,
        badgeColor: b.color || categoryColor(b.name),
        badgeChar: badgeChar(b.name),
        size: sizeOf(b.weight),
        ux: r * Math.cos(theta),
        uy: y,
        uz: r * Math.sin(theta),
      };
    });
  }, []);

  // Rotation angle (radians) - advances each frame
  const [rot, setRot] = useState({ x: 0.18, y: 0 });
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const speedY = 0.22; // Primary rotation speed rad/s
    const speedX = 0.04; // Micro wobble
    const tick = (t: number) => {
      if (last) {
        const dt = (t - last) / 1000;
        setRot((r) => ({
          x: 0.18 + Math.sin(t / 4000) * 0.08, // +/-0.08 rad micro tilt
          y: r.y + dt * speedY,
        }));
        void speedX;
      }
      last = t;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  // Ellipsoid radii (horizontal ratio 1.35)
  const R_x = Math.max((cloudSize.width || 0) * 0.48, 100);
  const R_y = Math.max(R_x / 1.35, 80);
  const R_z = R_x; // z uses same size as x, otherwise rotation distorts

  // Current frame projected 2D coords + z depth
  const projected = useMemo(() => {
    const cosY = Math.cos(rot.y);
    const sinY = Math.sin(rot.y);
    const cosX = Math.cos(rot.x);
    const sinX = Math.sin(rot.x);
    return spherePoints.map((p) => {
      // Y rotation
      const x1 = p.ux * cosY + p.uz * sinY;
      const z1 = -p.ux * sinY + p.uz * cosY;
      const y1 = p.uy;
      // X rotation
      const y2 = y1 * cosX - z1 * sinX;
      const z2 = y1 * sinX + z1 * cosX;
      return {
        ...p,
        rx: x1, // -1..1
        ry: y2,
        rz: z2, // -1..1 (positive=front, negative=back)
      };
    });
  }, [rot, spherePoints]);

  // Project to screen coords + center vs edge emphasis derivation
  const rendered = useMemo(() => {
    return projected
      .map((w) => {
        const screenX = w.rx * R_x;
        const screenY = w.ry * R_y;
        // Screen "centerness": closer (rx,ry) to origin -> 1 (center), farther -> 0 (edge)
        const distNorm = Math.min(1, Math.sqrt(w.rx * w.rx + w.ry * w.ry));
        const centerness = 1 - distNorm; // 1=dead center, 0=ellipsoid edge
        // Depth (front/back) also contributes slightly
        const depth = (w.rz + 1) / 2; // 0(back) -> 1(front)
        // Combined: "near center + near front" words are brighter and larger
        const emphasis = centerness * 0.75 + depth * 0.25;
        const opacity = 0.18 + 0.82 * emphasis;
        const scale = 0.55 + 0.7 * emphasis; // Enlarged - center 1.25x, edge 0.55x
        return {
          ...w,
          screenX,
          screenY,
          centerness,
          depth,
          emphasis,
          opacity,
          scale,
        };
      })
      .sort((a, b) => a.emphasis - b.emphasis); // Edge drawn at bottom layer, center at top layer
  }, [projected, R_x, R_y]);

  // Use ref for latest rendered to avoid effect depending on per-frame rendered array
  const renderedRef = useRef(rendered);
  renderedRef.current = rendered;

  // Call animation: every 800-1800ms pick a random agent + a visible bank
  // Agent flashes + count +1 + bank same-color highlight
  useEffect(() => {
    let alive = true;
    const fire = () => {
      if (!alive) return;
      const cur = renderedRef.current;
      if (!cur.length) return;
      // Only front-hemisphere visible words
      const candidates = cur.filter((w) => w.rz > 0.1);
      if (!candidates.length) return;

      const word = candidates[Math.floor(Math.random() * candidates.length)];
      const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)];

      // Agent flash + count +1
      setAgentBlip(agent.id);
      setAgentCalls((prev) => ({ ...prev, [agent.id]: (prev[agent.id] || 0) + 1 }));

      // Bank same-color highlight
      setHitBankIdx(word.idx);
      setHitColor(agent.color);

      // Clear agent flash after 350ms
      window.setTimeout(() => {
        if (!alive) return;
        setAgentBlip((c) => (c === agent.id ? null : c));
      }, 350);

      // Clear bank highlight after 450ms
      window.setTimeout(() => {
        if (!alive) return;
        setHitBankIdx((c) => (c === word.idx ? -1 : c));
        setHitColor("");
      }, 450);
    };

    // Loop: random interval 400-900ms
    let timer: number;
    const schedule = () => {
      timer = window.setTimeout(() => {
        fire();
        if (alive) schedule();
      }, 400 + Math.random() * 500);
    };
    schedule();

    return () => {
      alive = false;
      window.clearTimeout(timer);
    };
  }, [cloudRef]);

  const totalCalls = Object.values(agentCalls).reduce((s, n) => s + n, 0);

  // Ellipse border (visual hint)
  const W = cloudSize.width || 0;
  const H = cloudSize.height || 0;

  return (
    <div className="bcl">
      <div className="bcl-head">
        <span className="bcl-bar" />
        Partner Banks · AI Agents
      </div>

      <div className="bcl-subtitle">
        AI Agents serving <em>235</em> partner institutions in real time
      </div>

      <div className="bcl-cloud" ref={cloudRef}>
        {W > 0 && H > 0 && (
          <svg
            className="bcl-cloud-svg"
            width={W}
            height={H}
            viewBox={`${-W / 2} ${-H / 2} ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <radialGradient id="bcl-bg" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(86,196,255,0.12)" />
                <stop offset="100%" stopColor="rgba(86,196,255,0)" />
              </radialGradient>
            </defs>

            {/* Soft glow base (no hard-edge ellipse, cleaner sphere feel) */}
            <ellipse cx="0" cy="0" rx={R_x + 8} ry={R_y + 8} fill="url(#bcl-bg)" stroke="none" />

            {/* Words: pure text, differentiated by font-size/weight; highlighted with agent color on call */}
            {rendered.map((w) => {
              const isHit = w.idx === hitBankIdx;
              const fontSize = sizeOf(w.weight) * w.scale;
              const fill = isHit
                ? hitColor
                : w.weight === 5
                ? "rgba(235, 245, 255, 0.95)"
                : w.weight === 4
                ? "rgba(210, 228, 245, 0.88)"
                : w.weight === 3
                ? "rgba(180, 200, 220, 0.78)"
                : w.weight === 2
                ? "rgba(150, 175, 200, 0.65)"
                : "rgba(125, 150, 175, 0.55)";
              const fontWeight =
                w.weight === 5 ? 700 : w.weight === 4 ? 600 : w.weight === 3 ? 500 : 400;
              return (
                <text
                  key={w.idx}
                  className={`bcl-word ${isHit ? "bcl-word-active" : ""}`}
                  x={w.screenX}
                  y={w.screenY}
                  fontSize={isHit ? fontSize * 1.15 : fontSize}
                  fontWeight={isHit ? 700 : fontWeight}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={fill}
                  opacity={isHit ? 1 : w.opacity}
                  style={isHit ? { filter: `drop-shadow(0 0 8px ${hitColor})` } : undefined}
                >
                  {w.text}
                </text>
              );
            })}
          </svg>
        )}
      </div>

      <div className="bcl-agents">
        {AGENTS.map((a, i) => (
          <div
            key={a.id}
            className={`bcl-agent ${agentBlip === a.id ? "bcl-agent-blip" : ""}`}
            style={{
              borderColor: a.color,
              "--agent-glow": `${a.color}66`,
            } as React.CSSProperties}
          >
            <img className="bcl-agent-icon" src={`/assets/agents/agent-${a.iconKey}.svg`} alt="" />
            <div className="bcl-agent-info">
              <div className="bcl-agent-name">{a.name}</div>
              <div className="bcl-agent-count num" style={{ color: a.color }}>
                {(agentCalls[a.id] ?? 0).toLocaleString()}
                <em> calls</em>
              </div>
            </div>
            {agentBlip === a.id && (
              <span className="bcl-agent-plus" style={{ color: a.color, textShadow: `0 0 6px ${a.color}` }}>+1</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
