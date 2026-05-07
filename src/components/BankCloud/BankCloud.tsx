import { useEffect, useMemo, useRef, useState } from "react";
import cloud from "d3-cloud";
import { BANKS_167 } from "../../data/banks167";
import { useSize } from "../../utils/useSize";
import "./BankCloud.css";

/**
 * 167 家合作银行 · 真 3D 椭球词云
 *  - 用 Fibonacci 球面分布把 167 个词均匀撒在单位球面上
 *  - X 方向拉伸（椭球），让投影呈横向椭圆
 *  - 每帧绕 Y 轴旋转（主） + 微小 X 倾斜（让球感更立体）
 *  - 投影后按 z 深度做 opacity / 字号 / z-order 排序，前重后轻
 *
 *  - 顶部 4 大智能体卡
 *  - 调用：随机选一个"当前在前面可见"的词 → 高亮 + SVG 弧线连到智能体
 */

const AGENTS = [
  { id: "approver", name: "AI 审批官", color: "#56c4ff", iconKey: "approver" },
  { id: "risk", name: "AI 决策助手", color: "#9be7ff", iconKey: "risk" },
  { id: "compliance", name: "AI 合规助手", color: "#2fd996", iconKey: "compliance" },
  { id: "marketing", name: "AI 营销助手", color: "#ffb84d", iconKey: "marketing" },
];

const baseAgentCalls: Record<string, number> = {
  approver: 12407,
  risk: 8654,
  compliance: 6210,
  marketing: 9831,
};

type SphereWord = {
  idx: number;
  text: string;
  weight: number;
  color?: string;
  badgeColor: string;
  badgeChar: string;
  size: number;
  /** 单位球面坐标（半径 1） */
  ux: number;
  uy: number;
  uz: number;
};

/** 按银行名匹配类别 → 徽章配色 */
const categoryColor = (name: string): string => {
  if (/工商|建设|农业|中国银行|交通|邮储|中国/.test(name)) return "#cc4b3a"; // 国有大行
  if (/招商|浦发|光大|中信|华夏|民生|兴业|平安|广发|恒丰|浙商|渤海/.test(name)) return "#3a6cff"; // 股份制
  if (/农商|农村|村镇/.test(name)) return "#2db777"; // 农商
  if (/消费金融|消金/.test(name)) return "#ffa83a"; // 消金
  if (/微众|网商|新网|众邦|华瑞|中关村|亿联|蓝海|裕民|振兴|富民|三湘|客商|锡商|金城|百信/.test(name))
    return "#7a55cc"; // 民营
  return "#56c4ff"; // 城商行 / 默认
};

/** 取银行名首字（去掉"银行""消费金融"等修饰前缀） */
const badgeChar = (name: string): string => {
  // 优先去掉常见后缀，留实质名
  const trimmed = name
    .replace(/(银行|消费金融|消金|融资担保|金融|股份|有限公司)$/g, "")
    .replace(/(银行|消费金融|消金|融资担保)/g, "")
    .trim();
  return (trimmed || name).charAt(0);
};

type ActiveCall = {
  id: number;
  bankIdx: number;
  agentIdx: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
};

export const BankCloud = () => {
  const wrapRef = useRef<HTMLDivElement>(null);
  const { ref: cloudRef, size: cloudSize } = useSize<HTMLDivElement>();
  const agentRefs = useRef<(HTMLDivElement | null)[]>([]);
  const seqRef = useRef(1);

  const [active, setActive] = useState<ActiveCall[]>([]);
  const [agentCalls, setAgentCalls] = useState<Record<string, number>>(baseAgentCalls);
  const [agentBlip, setAgentBlip] = useState<string | null>(null);

  // 字号档位：weight 1=9, 2=11, 3=14, 4=18, 5=22
  const sizeOf = (w: number) =>
    ({ 1: 9, 2: 11, 3: 14, 4: 18, 5: 22 } as Record<number, number>)[w] || 12;

  // Fibonacci 球面均匀分布：167 个银行均匀撒在球面
  // 关键修复：先用稳定的伪随机洗牌打乱顺序，避免数据里大字（消金/民营）
  // 集中在末尾导致 Fibonacci 把它们都放到球的下半部分
  const spherePoints = useMemo<SphereWord[]>(() => {
    // 简单线性同余 PRNG（固定种子，每次渲染洗牌结果一致）
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
    const phi = (Math.sqrt(5) - 1) / 2; // 黄金分割
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

  // 旋转角度（弧度）— 每帧推进
  const [rot, setRot] = useState({ x: 0.18, y: 0 });
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const speedY = 0.22; // 主转速 rad/s
    const speedX = 0.04; // 微 wobble
    const tick = (t: number) => {
      if (last) {
        const dt = (t - last) / 1000;
        setRot((r) => ({
          x: 0.18 + Math.sin(t / 4000) * 0.08, // ±0.08 rad 微倾斜
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

  // 椭球半径（横向比例 1.35）
  const R_x = Math.max((cloudSize.width || 0) * 0.48, 100);
  const R_y = Math.max(R_x / 1.35, 80);
  const R_z = R_x; // z 用 x 同尺寸，旋转才不会变形

  // 当前帧投影后的 2D 坐标 + z 深度
  const projected = useMemo(() => {
    const cosY = Math.cos(rot.y);
    const sinY = Math.sin(rot.y);
    const cosX = Math.cos(rot.x);
    const sinX = Math.sin(rot.x);
    return spherePoints.map((p) => {
      // Y 旋转
      const x1 = p.ux * cosY + p.uz * sinY;
      const z1 = -p.ux * sinY + p.uz * cosY;
      const y1 = p.uy;
      // X 旋转
      const y2 = y1 * cosX - z1 * sinX;
      const z2 = y1 * sinX + z1 * cosX;
      return {
        ...p,
        rx: x1, // -1..1
        ry: y2,
        rz: z2, // -1..1（前为正、后为负）
      };
    });
  }, [rot, spherePoints]);

  // 投影到屏幕坐标 + 中心 vs 边缘的对比衍生
  const rendered = useMemo(() => {
    return projected
      .map((w) => {
        const screenX = w.rx * R_x;
        const screenY = w.ry * R_y;
        // 屏幕"中心度"：(rx, ry) 距离原点越近越接近 1（中心），越远越接近 0（边缘）
        const distNorm = Math.min(1, Math.sqrt(w.rx * w.rx + w.ry * w.ry));
        const centerness = 1 - distNorm; // 1=正中心, 0=椭球边缘
        // 深度（前后）也保留一点点
        const depth = (w.rz + 1) / 2; // 0(后) → 1(前)
        // 综合："靠中心 + 靠前" 的词更亮更大
        const emphasis = centerness * 0.75 + depth * 0.25;
        const opacity = 0.18 + 0.82 * emphasis;
        const scale = 0.55 + 0.7 * emphasis; // 拉大 — 中心 1.25×，边缘 0.55×
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
      .sort((a, b) => a.emphasis - b.emphasis); // 边缘画在底层、中心画在顶层
  }, [projected, R_x, R_y]);

  // 调用动效：每 220ms 选一个当前在前半球的词，绑定到一个智能体
  useEffect(() => {
    let alive = true;
    const tick = () => {
      if (!alive) return;
      const wrap = wrapRef.current;
      const cloud = cloudRef.current;
      if (!wrap || !cloud) return;
      // 仅在前半球（rz > 0.1）
      const candidates = rendered.filter((w) => w.rz > 0.1);
      if (candidates.length === 0) return;
      const word = candidates[Math.floor(Math.random() * candidates.length)];
      const agentIdx = Math.floor(Math.random() * AGENTS.length);
      const agentEl = agentRefs.current[agentIdx];
      if (!agentEl) return;

      const wrapBox = wrap.getBoundingClientRect();
      const cloudBox = cloud.getBoundingClientRect();
      const cloudCx = cloudBox.left - wrapBox.left + cloudBox.width / 2;
      const cloudCy = cloudBox.top - wrapBox.top + cloudBox.height / 2;
      const aBox = agentEl.getBoundingClientRect();
      const ax = aBox.left - wrapBox.left + aBox.width / 2;
      const ay = aBox.top - wrapBox.top + aBox.height - 2;

      const startX = cloudCx + word.screenX;
      const startY = cloudCy + word.screenY;

      const id = seqRef.current++;
      const agent = AGENTS[agentIdx];

      setActive((prev) => [
        ...prev.slice(-25),
        {
          id,
          bankIdx: word.idx,
          agentIdx,
          startX,
          startY,
          endX: ax,
          endY: ay,
          color: agent.color,
        },
      ]);
      setAgentCalls((prev) => ({ ...prev, [agent.id]: (prev[agent.id] || 0) + 1 }));
      setAgentBlip(agent.id);
      window.setTimeout(() => {
        setActive((prev) => prev.filter((c) => c.id !== id));
      }, 1100);
      window.setTimeout(() => {
        setAgentBlip((cur) => (cur === agent.id ? null : cur));
      }, 600);
    };
    const interval = window.setInterval(tick, 240);
    return () => {
      alive = false;
      window.clearInterval(interval);
    };
  }, [rendered, cloudRef]);

  // 调用线弧形 path
  const arcPath = (c: ActiveCall) => {
    const midX = (c.startX + c.endX) / 2;
    const midY = Math.min(c.startY, c.endY) - 26;
    return `M${c.startX},${c.startY} Q${midX},${midY} ${c.endX},${c.endY}`;
  };

  const totalCalls = Object.values(agentCalls).reduce((s, n) => s + n, 0);
  const activeBankIdx = new Set(active.map((c) => c.bankIdx));

  // 椭圆边框（视觉提示）
  const W = cloudSize.width || 0;
  const H = cloudSize.height || 0;

  return (
    <div className="bcl" ref={wrapRef}>
      <div className="bcl-head">
        <span className="bcl-bar" />
        合作银行调用 · AI 智能体
        <span className="bcl-meta">
          <em className="bcl-em num">167</em> 家合作机构 · 累计调用
          <em className="bcl-em num">{totalCalls.toLocaleString()}</em>
        </span>
      </div>

      <div className="bcl-agents">
        {AGENTS.map((a, i) => (
          <div
            key={a.id}
            ref={(el) => { agentRefs.current[i] = el; }}
            className={`bcl-agent ${agentBlip === a.id ? "bcl-agent-blip" : ""}`}
            style={{ borderColor: a.color }}
          >
            <img className="bcl-agent-icon" src={`/assets/agents/agent-${a.iconKey}.svg`} alt="" />
            <div className="bcl-agent-info">
              <div className="bcl-agent-name">{a.name}</div>
              <div className="bcl-agent-count num" style={{ color: a.color }}>
                {(agentCalls[a.id] ?? 0).toLocaleString()}
                <em>次</em>
              </div>
            </div>
            {agentBlip === a.id && <span className="bcl-agent-plus">+1</span>}
          </div>
        ))}
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

            {/* 微光底（去掉硬边椭圆，让球感更纯净） */}
            <ellipse cx="0" cy="0" rx={R_x + 8} ry={R_y + 8} fill="url(#bcl-bg)" stroke="none" />

            {/* 词：纯文字，靠字号 / 字重区分层次 */}
            {rendered.map((w) => {
              const isActive = activeBankIdx.has(w.idx);
              const fontSize = w.size * w.scale;
              // 单色：根据 weight 给一个亮度档（不再使用品牌色）
              const fill = isActive
                ? "#ffffff"
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
                  className={`bcl-word ${isActive ? "bcl-word-active" : ""}`}
                  x={w.screenX}
                  y={w.screenY}
                  fontSize={fontSize}
                  fontWeight={fontWeight}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={fill}
                  opacity={isActive ? 1 : w.opacity}
                >
                  {w.text}
                </text>
              );
            })}
          </svg>
        )}

        {/* 调用动线（绝对坐标，覆盖整个 bcl 容器） */}
        <svg className="bcl-lines" width="100%" height="100%">
          {active.map((c) => (
            <path
              key={c.id}
              d={arcPath(c)}
              fill="none"
              stroke={c.color}
              strokeWidth="1.4"
              strokeLinecap="round"
              className="bcl-line"
              style={{ filter: `drop-shadow(0 0 4px ${c.color})` }}
            />
          ))}
        </svg>
      </div>
    </div>
  );
};
