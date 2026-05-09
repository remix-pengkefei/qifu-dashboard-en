import { useEffect, useMemo, useRef, useState } from "react";
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
  { id: "risk", name: "AI 风控助手", color: "#8b9dff", iconKey: "risk" },
  { id: "compliance", name: "AI 合规助手", color: "#5be8c0", iconKey: "compliance" },
  { id: "marketing", name: "AI 营销助手", color: "#e8b85e", iconKey: "marketing" },
];

const baseAgentCalls: Record<string, number> = {
  approver: 128_530,
  risk: 96_718,
  compliance: 83_246,
  marketing: 115_907,
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

export const BankCloud = () => {
  const { ref: cloudRef, size: cloudSize } = useSize<HTMLDivElement>();

  const [agentCalls, setAgentCalls] = useState<Record<string, number>>(baseAgentCalls);
  const [agentBlip, setAgentBlip] = useState<string | null>(null);
  const [hitBankIdx, setHitBankIdx] = useState(-1);
  const [hitColor, setHitColor] = useState("");

  // 字号档位：基准值（对应 ~500px 容器宽度 / 1920px 视口）
  const fontScale = Math.max((cloudSize.width || 500) / 500, 0.6);
  const sizeOf = (w: number) =>
    (({ 1: 9, 2: 11, 3: 14, 4: 18, 5: 22 } as Record<number, number>)[w] || 12) * fontScale;

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

  // 用 ref 持有最新 rendered，避免 effect 依赖每帧变化的 rendered 数组
  const renderedRef = useRef(rendered);
  renderedRef.current = rendered;

  // 调用动效：每 800–1800ms 随机选一个智能体 + 一个可见银行
  // 智能体闪 + 计数 +1 + 银行同色高亮
  useEffect(() => {
    let alive = true;
    const fire = () => {
      if (!alive) return;
      const cur = renderedRef.current;
      if (!cur.length) return;
      // 仅前半球可见词
      const candidates = cur.filter((w) => w.rz > 0.1);
      if (!candidates.length) return;

      const word = candidates[Math.floor(Math.random() * candidates.length)];
      const agent = AGENTS[Math.floor(Math.random() * AGENTS.length)];

      // 智能体闪亮 + 计数 +1
      setAgentBlip(agent.id);
      setAgentCalls((prev) => ({ ...prev, [agent.id]: (prev[agent.id] || 0) + 1 }));

      // 银行同色高亮
      setHitBankIdx(word.idx);
      setHitColor(agent.color);

      // 350ms 后清智能体闪
      window.setTimeout(() => {
        if (!alive) return;
        setAgentBlip((c) => (c === agent.id ? null : c));
      }, 350);

      // 450ms 后清银行高亮
      window.setTimeout(() => {
        if (!alive) return;
        setHitBankIdx((c) => (c === word.idx ? -1 : c));
        setHitColor("");
      }, 450);
    };

    // 循环：随机间隔 400–900ms
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

  // 椭圆边框（视觉提示）
  const W = cloudSize.width || 0;
  const H = cloudSize.height || 0;

  return (
    <div className="bcl">
      <div className="bcl-head">
        <span className="bcl-bar" />
        合作银行调用 · AI 智能体
      </div>

      <div className="bcl-subtitle">
        AI 智能体实时响应 <em>167</em> 家合作银行
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

            {/* 词：纯文字，靠字号 / 字重区分层次；被调用时用智能体颜色高亮 */}
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
                <em>次</em>
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
