import { useMemo } from "react";
import { BANKS } from "../../data/banks";
import { useApp } from "../../store/AppContext";
import { useSize } from "../../utils/useSize";
import "./BankNetwork.css";

/**
 * 银行态布局策略 — 多战线并行：
 *   左侧 6 张银行卡（垂直列） / 右侧 6 张银行卡（垂直列）
 *   中央偏上：智能体调度子枢纽（hub-bank.png）
 *   中央偏下：8 个产业 / 客群场景图标（横向列）
 *
 * 区域分配（基于实际容器尺寸 W x H）：
 *   顶部 banner: 0 ~ 44px
 *   左右银行列: 50 ~ H-90 (留底部 stats)
 *   中央枢纽:    在两列之间居中区域
 *   场景柱:      中央列底部
 *   底部 stats:  H-72 ~ H-8
 */

const SCENE_TARGETS: { id: string; label: string }[] = [
  { id: "factory", label: "制造业" },
  { id: "auto", label: "汽车经销" },
  { id: "electronics", label: "电子制造" },
  { id: "supply", label: "供应链" },
  { id: "ecom", label: "电商商户" },
  { id: "sme", label: "小微商户" },
  { id: "logistics", label: "物流车队" },
  { id: "food", label: "餐饮门店" },
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

  // 布局区域（防止重叠的核心边界值）
  const TOP_RESERVED = 44;       // 顶部 banner / 角标
  const BOTTOM_RESERVED = 80;    // 底部 stats 卡
  const stageTop = TOP_RESERVED + 6;
  const stageBottom = H - BOTTOM_RESERVED - 6;
  const stageH = Math.max(stageBottom - stageTop, 200);

  // 银行卡片尺寸
  const cardW = Math.min(150, Math.max(120, W * 0.108));
  const cardH = Math.round(cardW / 1.6);
  const colInset = 14;

  // 银行 6 行垂直分布
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

  // 中区可用宽度（左右银行列之外）
  const centerLeft = colInset + cardW + 20;
  const centerRight = W - colInset - cardW - 20;
  const centerW = centerRight - centerLeft;
  const centerCx = (centerLeft + centerRight) / 2;

  // 中枢
  const hubSize = Math.min(centerW * 0.32, stageH * 0.36, 200);
  const hubX = centerCx;
  const hubY = stageTop + stageH * 0.32;

  // 场景图标位置（中央带宽内横向均布）
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
      {/* 顶部 banner */}
      <div className="bn-banner">
        银行合作实时作战网络 · 多战线并发
        <span className="bn-banner-en">PARALLEL BANK COLLABORATION</span>
      </div>

      <div className="bn-corner-l">
        <span className="dot" /> 智能体在岗 · {agents.length}
      </div>
      <div className="bn-corner-r">在线机构 · {metrics.activeOrgs}</div>

      {/* 中枢 PNG */}
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
        <div className="bn-hub-title">智能体服务中枢</div>
        <div className="bn-hub-sub">QFIN AGENT HUB</div>
      </div>

      {/* SVG 链路层 */}
      <svg className="bn-svg" viewBox={`0 0 ${W} ${H}`}>
        {/* 银行 → 中枢 */}
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

        {/* 银行 → 场景 */}
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

        {/* 中枢 → 场景 */}
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

      {/* 银行卡片 */}
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

      {/* 场景图标 */}
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

      {/* 底部 stats */}
      <div className="bn-stats">
        <div className="bn-stat">
          <div className="bn-stat-label">合作机构</div>
          <div className="bn-stat-value num">235<em>家</em></div>
        </div>
        <div className="bn-stat">
          <div className="bn-stat-label">活跃机构</div>
          <div className="bn-stat-value num">{metrics.activeOrgs}<em>家</em></div>
        </div>
        <div className="bn-stat">
          <div className="bn-stat-label">银行调用智能体</div>
          <div className="bn-stat-value num">{metrics.activeTasks.toLocaleString()}<em>次</em></div>
        </div>
        <div className="bn-stat">
          <div className="bn-stat-label">系统稳定性</div>
          <div className="bn-stat-value num good">{metrics.stability.toFixed(2)}<em>%</em></div>
        </div>
        <div className="bn-stat">
          <div className="bn-stat-label">平均响应</div>
          <div className="bn-stat-value num">{metrics.avgResponse}<em>ms</em></div>
        </div>
        <div className="bn-stat">
          <div className="bn-stat-label">异常拦截</div>
          <div className="bn-stat-value num warn">{metrics.abnormal}</div>
        </div>
      </div>
    </div>
  );
};
