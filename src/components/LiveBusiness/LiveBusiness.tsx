import { useEffect, useRef, useState } from "react";
import "./LiveBusiness.css";

const cumBase = {
  loanAmount: 2_000_000_000_000,
  creditUsers: 63_600_000,
  borrowers: 38_900_000,
  loanCount: 87_025_089,
  microBiz: 4_560_000,
};

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

const CARD_COLORS = ["#00ff41", "#00ff41", "#00ff41", "#00ff41", "#00ff41"];

const fmtYi = (n: number) => (n / 100_000_000).toFixed(2) + " 亿";
const fmtWan = (n: number) => (n / 10_000).toFixed(1) + " 万";

const FlipChar = ({ char }: { char: string }) => {
  if (/\d/.test(char)) {
    const n = parseInt(char);
    return (
      <span className="lb-flip-slot">
        <span
          className="lb-flip-strip"
          style={{ transform: `translateY(${-n * 10}%)` }}
        >
          {Array.from({ length: 10 }, (_, i) => (
            <span key={i} className="lb-flip-cell">
              {i}
            </span>
          ))}
        </span>
      </span>
    );
  }
  return <span className="lb-flip-static">{char}</span>;
};

const FlipNumber = ({ value }: { value: string }) => (
  <span className="lb-flip-num">
    {value.split("").map((ch, i) => (
      <FlipChar key={i} char={ch} />
    ))}
  </span>
);

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

      const deltas = [dLoanAmt, dCredit, dBorrow, dCount, dMicro];
      const active = deltas.map((d, i) => (d > 0 ? i : -1)).filter((i) => i >= 0);
      const pick = active[Math.floor(Math.random() * active.length)];

      if (pick !== undefined) {
        setBlipIdx(pick);
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
      value:
        "¥" +
        (cum.loanAmount / 100_000_000)
          .toFixed(0)
          .replace(/\B(?=(\d{3})+(?!\d))/g, ",") +
        " 亿",
      sub: "今日 ¥" + fmtYi(today.loanAmount),
    },
    {
      label: "累计授信用户",
      value: fmtWan(cum.creditUsers),
      sub: "今日 +" + today.creditUsers.toLocaleString(),
    },
    {
      label: "累计成功借款人",
      value: fmtWan(cum.borrowers),
      sub: "今日 +" + today.borrowers.toLocaleString(),
    },
    {
      label: "累计放款笔数",
      value: cum.loanCount.toLocaleString(),
      sub: "今日 +" + today.loanCount.toLocaleString() + " 笔",
    },
    {
      label: "累计小微服务用户",
      value: fmtWan(cum.microBiz),
      sub: "今日 +" + today.microBiz.toLocaleString(),
    },
  ];

  return (
    <div className="lb">
      {cards.map((c, i) => (
        <div key={i} className={`lb-cell${blipIdx === i ? " lb-cell-blip" : ""}`}>
          <span className="lb-label">{c.label}</span>
          <span className="lb-value">
            <FlipNumber value={c.value} />
          </span>
          <span className="lb-sub">{c.sub}</span>
        </div>
      ))}
    </div>
  );
};
