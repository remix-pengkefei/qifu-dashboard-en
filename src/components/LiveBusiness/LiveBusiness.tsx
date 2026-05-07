import { useEffect, useState } from "react";
import "./LiveBusiness.css";

/**
 * 核心指标卡（中区地图下方）：
 *  - 主数字：成立以来累计数据（公开财报 FY2025）
 *  - 副数字：今日实时（按年度÷365 推算日均基线 + 实时递增）
 *
 * 数据基线来自奇富科技 2025 全年公开财报：
 *  - 累计撮合放款 > 2 万亿
 *  - 累计授信用户 6360 万
 *  - 累计成功借款人 3890 万
 *  - 年度放款 3270.7 亿 → 日均 ≈ 8.96 亿
 *  - 智能体决策次数：过亿条
 */

/** 成立以来累计基线 */
const cumBase = {
  loanAmount: 2_000_000_000_000,  // 累计撮合放款 2 万亿
  creditUsers: 63_600_000,         // 累计授信用户 6360 万
  borrowers: 38_900_000,           // 累计成功借款人 3890 万
  loanCount: 87_025_089,           // 累计放款笔数
  microBiz: 4_560_000,              // 累计服务小微用户 456 万
};

/** 今日起始（模拟开盘已有部分量） */
const todayBase = {
  loanAmount: 3_200_000_000,   // 今日已撮合 ~3.2 亿（到当前时间的进度）
  creditUsers: 8_500,           // 今日新增授信
  borrowers: 5_200,             // 今日新增借款人
  loanCount: 112_000,           // 今日放款笔数
  microBiz: 1_280,               // 今日新增小微用户
};

type Nums = {
  loanAmount: number;
  creditUsers: number;
  borrowers: number;
  loanCount: number;
  microBiz: number;
};

const fmtYi = (n: number) => (n / 100_000_000).toFixed(2) + " 亿";
const fmtWan = (n: number) => (n / 10_000).toFixed(1) + " 万";

export const LiveBusiness = () => {
  const [cum, setCum] = useState<Nums>(cumBase);
  const [today, setToday] = useState<Nums>(todayBase);

  useEffect(() => {
    let alive = true;
    const tick = () => {
      if (!alive) return;

      // 不同指标不同增速：
      // 放款金额：每秒 ~10 万（日 8.96 亿 ÷ 86400 ≈ 10.4 万/s）
      const dLoanAmt = Math.floor(Math.random() * 80000 + 60000);
      // 授信用户：每秒 ~0.2（日 ~17000 ÷ 86400）→ 30% 概率 +1
      const dCredit = Math.random() < 0.3 ? 1 : 0;
      // 借款人：更慢，20% 概率 +1
      const dBorrow = Math.random() < 0.2 ? 1 : 0;
      // 放款笔数：每秒 ~2.7（日 ~238000 ÷ 86400）→ 每次 +1~4
      const dCount = Math.floor(Math.random() * 3 + 1);
      // 小微服务：较慢，25% 概率 +1
      const dMicro = Math.random() < 0.25 ? 1 : 0;

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
          </div>
        ))}
      </div>
    </div>
  );
};
