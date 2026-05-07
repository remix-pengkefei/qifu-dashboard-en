import { useEffect, useRef, useState } from "react";
import { BANKS } from "../../data/banks";
import { SCENES } from "../../data/scenes";
import "./LiveBusiness.css";

/**
 * 业务实时进展条（中区地图下方）：
 *  - 顶部：滚动展示"刚刚完成的业务"（marquee 风格）
 *  - 下方：5 个核心指标卡，每个显示总量基线（公开数据）+ 实时累加
 *
 * 数据基线来自奇富 2025 全年公开财报 / 年报：
 *  - 累计放款笔数 87,025,089（2025 全年 4 季度合计）
 *  - 累计授信用户 6360 万
 *  - 累计借款人   3890 万
 *  - 当日撮合放款额（按全年 3270.7 亿 ÷ 365 估算 ≈ 8.96 亿/日）
 *  - 智能体决策次数（"过亿条历史决策" + 实时累加）
 */

const ACTIONS = [
  "完成一笔授信",
  "完成一笔放款",
  "完成一次智能审批",
  "完成一次合规校验",
  "完成一次风险拦截",
  "完成一次贷后回访",
  "完成一次智能营销匹配",
  "完成一次客户响应",
];

const baseline = {
  loanCount: 87_025_089, // 2025 累计放款笔数
  creditUsers: 63_600_000, // 累计授信用户
  borrowers: 38_900_000, // 累计成功借款人
  todayLoan: 8_960_000_000, // 当日撮合放款额（≈ 8.96 亿）
  agentDecisions: 100_000_000, // 智能体累计决策（过亿条）
};

type Counters = {
  loanCount: number;
  creditUsers: number;
  borrowers: number;
  todayLoan: number;
  agentDecisions: number;
};

type Burst = { id: number; text: string; bankColor: string };

export const LiveBusiness = () => {
  const [counters, setCounters] = useState<Counters>(baseline);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const burstSeq = useRef(1);

  // 数字滚动 + 事件 marquee
  useEffect(() => {
    let alive = true;
    const tick = () => {
      if (!alive) return;
      // 模拟一笔新业务发生
      const bank = BANKS[Math.floor(Math.random() * BANKS.length)];
      const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
      const scene = SCENES[Math.floor(Math.random() * SCENES.length)];
      const amount = (Math.random() * 30 + 1).toFixed(1);

      const id = burstSeq.current++;
      setBursts((prev) => [
        ...prev.slice(-12),
        {
          id,
          text: `${bank.name} · ${action} · ${scene} · ${amount} 万元`,
          bankColor: bank.color,
        },
      ]);

      // 计数器累加
      setCounters((prev) => ({
        loanCount: prev.loanCount + 1,
        creditUsers: prev.creditUsers + (Math.random() < 0.3 ? 1 : 0),
        borrowers: prev.borrowers + (Math.random() < 0.2 ? 1 : 0),
        todayLoan: prev.todayLoan + Math.floor(Math.random() * 80000 + 20000),
        agentDecisions: prev.agentDecisions + Math.floor(Math.random() * 4 + 2),
      }));

      // 旧的 burst 在动画结束后移除
      window.setTimeout(() => {
        setBursts((prev) => prev.filter((b) => b.id !== id));
      }, 7000);
    };
    const interval = window.setInterval(tick, 350 + Math.random() * 250);
    return () => {
      alive = false;
      window.clearInterval(interval);
    };
  }, []);

  // 把数字格式化得醒目
  const fmtBigYi = (n: number): string => {
    // 大于 1 亿用"亿"展示
    if (n >= 100_000_000) return (n / 100_000_000).toFixed(2) + " 亿";
    if (n >= 10_000) return (n / 10_000).toFixed(1) + " 万";
    return n.toLocaleString();
  };

  const cards = [
    {
      label: "累计撮合放款笔数",
      value: counters.loanCount.toLocaleString(),
      sub: "持续增长中",
    },
    {
      label: "累计授信用户",
      value: fmtBigYi(counters.creditUsers),
      sub: "持续增长中",
    },
    {
      label: "累计成功借款人",
      value: fmtBigYi(counters.borrowers),
      sub: "持续增长中",
    },
    {
      label: "当日撮合放款额",
      value: "¥" + fmtBigYi(counters.todayLoan),
      sub: "今日实时",
    },
    {
      label: "智能体决策次数",
      value: fmtBigYi(counters.agentDecisions),
      sub: "Deepbank 实时",
    },
  ];

  return (
    <div className="lb">
      {/* 滚动事件流 */}
      <div className="lb-marquee">
        <span className="lb-bar" />
        <span className="lb-tag">实时业务</span>
        <div className="lb-marquee-track">
          {bursts.map((b) => (
            <span key={b.id} className="lb-msg" style={{ borderLeftColor: b.bankColor }}>
              {b.text}
            </span>
          ))}
        </div>
      </div>

      {/* 5 个总数卡片（实时累加） */}
      <div className="lb-cards">
        {cards.map((c, i) => (
          <div key={i} className="lb-card">
            <div className="lb-card-label">{c.label}</div>
            <div className="lb-card-value num">{c.value}</div>
            <div className="lb-card-sub">
              <span className="lb-up">▲</span>
              {c.sub}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
