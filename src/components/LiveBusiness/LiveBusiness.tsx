import { useEffect, useState } from "react";
import "./LiveBusiness.css";

const cumBase = {
  loanAmount: 232_820_147.93,
  creditUsers: 62_387_600,
  borrowers: 39_391_600,
  loanCount: 573_742_849,
  microBiz: 8_855_600,
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
        loanAmount: p.loanAmount + (Math.random() * 18 + 5),
        creditUsers: p.creditUsers + Math.floor(Math.random() * 120 + 30),
        borrowers: p.borrowers + Math.floor(Math.random() * 80 + 20),
        loanCount: p.loanCount + Math.floor(Math.random() * 6 + 2),
        microBiz: p.microBiz + Math.floor(Math.random() * 6 + 3),
      }));
    };

    const id = window.setInterval(tick, 600);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  const cards = [
    { label: "Total Loans (¥10K)", value: "¥" + fmtWan2(cum.loanAmount) },
    { label: "Total Credit Users", value: cum.creditUsers.toLocaleString() },
    { label: "Total Borrowers", value: cum.borrowers.toLocaleString() },
    { label: "Total Loan Count", value: cum.loanCount.toLocaleString() },
    { label: "Total SME Users", value: cum.microBiz.toLocaleString() },
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
