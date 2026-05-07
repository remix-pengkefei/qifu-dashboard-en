import { useEffect, useRef, useState } from "react";
import "./LiveBusiness.css";

/**
 * 核心指标卡（中区地图下方）：
 *  - 主数字：成立以来累计数据（公开财报 FY2025）
 *  - 副数字：今日实时（按年度÷365 推算日均基线 + 实时递增）
 */

/** 成立以来累计基线 */
const cumBase = {
  loanAmount: 2_000_000_000_000,
  creditUsers: 63_600_000,
  borrowers: 38_900_000,
  loanCount: 87_025_089,
  microBiz: 4_560_000,
};

/** 今日起始 */
const todayBase = {
  loanAmount: 3_200_000_000,
  creditUsers: 8_500,
  borrowers: 5_200,
  loanCount: 112_000,
  microBiz: 1_280,
};

type Nums = {
  loanAmount: number;
  creditUsers: number;
  borrowers: number;
  loanCount: number;
  microBiz: number;
};

const CARD_COLORS = ["#56c4ff", "#a78bfa", "#2fd996", "#ffb84d", "#ff5e6c"];

const fmtYi = (n: number) => (n / 100_000_000).toFixed(2) + " 亿";
const fmtWan = (n: number) => (n / 10_000).toFixed(1) + " 万";

export const LiveBusiness = () => {
  const [cum, setCum] = useState<Nums>(cumBase);
  const [today, setToday] = useState<Nums>(todayBase);
  const [blipIdx, setBlipIdx] = useState<number | null>(null);
  const blipTimer = useRef<number>(0);

  useEffect(() => {
    let alive = true;
    const tick = () => {
      if (!alive) return;

      const dLoanAmt = Math.floor(Math.random() * 80000 + 60000);
      const dCredit = Math.random() < 0.3 ? 1 : 0;
      const dBorrow = Math.random() < 0.2 ? 1 : 0;
      const dCount = Math.floor(Math.random() * 3 + 1);
      const dMicro = Math.random() < 0.25 ? 1 : 0;

      // 选一个有增量的卡片做 blip
      const deltas = [dLoanAmt, dCredit, dBorrow, dCount, dMicro];
      const active = deltas.map((d, i) => (d > 0 ? i : -1)).filter((i) => i >= 0);
      const pick = active[Math.floor(Math.random() * active.length)];

      if (pick !== undefined) {
        setBlipIdx(pick);
        // 通知地图冒泡
        window.dispatchEvent(
          new CustomEvent("biz-spark", { detail: { color: CARD_COLORS[pick] } })
        );
        clearTimeout(blipTimer.current);
        blipTimer.current = window.setTimeout(() => setBlipIdx(null), 600);
      }

      setCum((p) => ({
        loanAmount: p.loanAmount + dLoanAmt,
        creditUsers: p.creditUsers + dCredit,
        borrowers: p.borrowers + dBorrow,
        loanCount: p.loanCount + dCount,
        microBiz: p.microBiz + dMicro,
      }));
      setToday((p) => ({
        loanAmount: p.loanAmount + dLoanAmt,
        creditUsers: p.creditUsers + dCredit,
        borrowers: p.borrowers + dBorrow,
        loanCount: p.loanCount + dCount,
        microBiz: p.microBiz + dMicro,
      }));
    };

    const id = window.setInterval(tick, 1000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  const cards = [
    {
      label: "累计撮合放款",
      value: "¥" + (cum.loanAmount / 100_000_000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " 亿",
      todayLabel: "今日撮合",
      todayValue: "¥" + fmtYi(today.loanAmount),
    },
    {
      label: "累计授信用户",
      value: fmtWan(cum.creditUsers),
      todayLabel: "今日新增",
      todayValue: "+" + today.creditUsers.toLocaleString(),
    },
    {
      label: "累计成功借款人",
      value: fmtWan(cum.borrowers),
      todayLabel: "今日新增",
      todayValue: "+" + today.borrowers.toLocaleString(),
    },
    {
      label: "累计放款笔数",
      value: cum.loanCount.toLocaleString(),
      todayLabel: "今日放款",
      todayValue: "+" + today.loanCount.toLocaleString() + " 笔",
    },
    {
      label: "累计小微服务用户",
      value: fmtWan(cum.microBiz),
      todayLabel: "今日新增",
      todayValue: "+" + today.microBiz.toLocaleString(),
    },
  ];

  return (
    <div className="lb">
      <div className="lb-cards">
        {cards.map((c, i) => (
          <div key={i} className="lb-card">
            <div className="lb-card-label">{c.label}</div>
            <div className="lb-card-value num">{c.value}</div>
            <div className="lb-card-sub">
              <span className="lb-sub-label">{c.todayLabel}</span>
              <span className="lb-sub-value num">{c.todayValue}</span>
            </div>
            {blipIdx === i && (
              <span className="lb-blip-text" style={{ color: CARD_COLORS[i] }}>+1</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
