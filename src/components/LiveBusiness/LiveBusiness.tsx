import { useEffect, useState } from "react";
import "./LiveBusiness.css";

const cumBase = {
  loanAmount: 232_820_147.93,
  creditUsers: 6238.76,
  borrowers: 3939.16,
  loanCount: 573_742_849,
  microBiz: 885.56,
};

type Nums = {
  loanAmount: number;
  creditUsers: number;
  borrowers: number;
  loanCount: number;
  microBiz: number;
};

const fmtWan2 = (n: number) => {
  const s = n.toFixed(2);
  return s.replace(/\B(?=(\d{3})+\.)/g, ",");
};

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

  useEffect(() => {
    let alive = true;
    const tick = () => {
      if (!alive) return;
      setCum((p) => ({
        loanAmount: p.loanAmount + (Math.random() * 6 + 2),
        creditUsers: p.creditUsers + (Math.random() * 0.03 + 0.005),
        borrowers: p.borrowers + (Math.random() * 0.02 + 0.003),
        loanCount: p.loanCount + Math.floor(Math.random() * 3 + 1),
        microBiz: p.microBiz + (Math.random() * 0.008 + 0.001),
      }));
    };

    const id = window.setInterval(tick, 1000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  const cards = [
    { label: "累计放款（万元）", value: "¥" + fmtWan2(cum.loanAmount) },
    { label: "累计授信用户（万人）", value: fmtWan2(cum.creditUsers) },
    { label: "累计成功借款人（万人）", value: fmtWan2(cum.borrowers) },
    { label: "累计放款笔数", value: cum.loanCount.toLocaleString() },
    { label: "累计小微服务用户（万人）", value: fmtWan2(cum.microBiz) },
  ];

  return (
    <div className="lb">
      {cards.map((c, i) => (
        <div key={i} className="lb-cell">
          <span className="lb-label">{c.label}</span>
          <span className="lb-value">
            <FlipNumber value={c.value} />
          </span>
        </div>
      ))}
    </div>
  );
};
