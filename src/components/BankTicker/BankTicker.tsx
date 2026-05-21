import { useEffect, useRef, useState } from "react";
import { BANKS } from "../../data/banks";
import "./BankTicker.css";

/**
 * Bank word-cloud ticker:
 *  - 12 banks in a horizontal infinite-scroll marquee
 *  - Card shows: bank logo + name + current transaction count
 *  - Cloud effect: higher count = larger card, brighter font weight
 *  - When a bank has a new transaction: card flashes, count +1, floating "+1" indicator
 */

const baseCounts: Record<string, number> = {
  spdb: 4218,
  ceb: 3854,
  gzcb: 2941,
  jsb: 5126,
  syb: 2107,
  ncb: 1884,
  zycf: 6342,
  psbc: 4793,
  fsrc: 1665,
  njcb: 3982,
  bob: 4517,
  hzb: 3206,
};

type Burst = { id: number; bankId: string };

export const BankTicker = () => {
  const [counts, setCounts] = useState<Record<string, number>>(baseCounts);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const burstSeq = useRef(1);

  useEffect(() => {
    let alive = true;
    const tick = () => {
      if (!alive) return;
      const bank = BANKS[Math.floor(Math.random() * BANKS.length)];
      const id = burstSeq.current++;
      setCounts((prev) => ({ ...prev, [bank.id]: (prev[bank.id] || 0) + 1 }));
      setBursts((prev) => [...prev, { id, bankId: bank.id }]);
      window.setTimeout(() => {
        setBursts((prev) => prev.filter((b) => b.id !== id));
      }, 1400);
    };
    const interval = window.setInterval(tick, 380 + Math.random() * 220);
    return () => {
      alive = false;
      window.clearInterval(interval);
    };
  }, []);

  // Scrolling list: 12 banks x N copies, ensuring no blank gaps in marquee
  const looped = [...BANKS, ...BANKS, ...BANKS];

  return (
    <div className="bt">
      <div className="bt-head">
        <span className="bt-bar" />
        Bank Activity Cloud
        <span className="bt-meta">235 Partners · 24/7</span>
      </div>

      <div className="bt-track-mask">
        <div className="bt-track">
          {looped.map((b, i) => {
            const isBusy = bursts.some((x) => x.bankId === b.id);
            const cnt = counts[b.id] ?? 0;
            // Add weight to card based on transaction count (cloud effect)
            const sizeClass =
              cnt > 5000 ? "bt-xl" : cnt > 4000 ? "bt-lg" : cnt > 2500 ? "bt-md" : "bt-sm";
            return (
              <div
                key={`${b.id}-${i}`}
                className={`bt-card ${sizeClass} ${isBusy ? "bt-busy" : ""}`}
                style={{ borderColor: isBusy ? b.color : `${b.color}55` }}
              >
                <span className="bt-led" style={{ background: b.color, boxShadow: `0 0 8px ${b.color}` }} />
                <img src={`/assets/banks/bank-${b.id}.svg`} alt={b.name} className="bt-svg" />
                <div className="bt-info">
                  <div className="bt-name">{b.name}</div>
                  <div className="bt-count num">
                    {cnt.toLocaleString()}
                    <em> txns</em>
                  </div>
                </div>
                {isBusy && (
                  <span className="bt-plus">+1</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
