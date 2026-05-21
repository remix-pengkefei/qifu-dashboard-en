import { useEffect, useState } from "react";
import { BANKS } from "../../data/banks";
import "./BankCalls.css";

/**
 * 167 partner banks agent call status:
 *  - Top: 167 total count + "live calls"
 *  - Body: top 8 bank call ranking (logo + name + call count + progress bar)
 *  - Every 1 second, randomly increment one bank by +N to simulate calls
 */

const baseCalls: Record<string, number> = {
  spdb: 4218,
  ceb: 3854,
  jsb: 5126,
  syb: 2107,
  zycf: 6342,
  psbc: 4793,
  bob: 4517,
  njcb: 3982,
  hzb: 3206,
  gzcb: 2941,
  fsrc: 1665,
  ncb: 1884,
};

export const BankCalls = () => {
  const [calls, setCalls] = useState<Record<string, number>>(baseCalls);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const tick = () => {
      if (!alive) return;
      const bank = BANKS[Math.floor(Math.random() * BANKS.length)];
      const delta = Math.floor(Math.random() * 7 + 1);
      setCalls((prev) => ({ ...prev, [bank.id]: (prev[bank.id] || 0) + delta }));
      setBusy(bank.id);
      window.setTimeout(() => {
        setBusy((cur) => (cur === bank.id ? null : cur));
      }, 700);
    };
    const id = window.setInterval(tick, 600);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, []);

  // Sort by call count descending, take top 8
  const ranked = [...BANKS]
    .map((b) => ({ ...b, count: calls[b.id] ?? 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const maxCount = ranked[0]?.count || 1;
  const totalCalls = Object.values(calls).reduce((s, n) => s + n, 0);

  return (
    <section className="bc">
      <div className="bc-h">
        <span className="bc-bar" />
        Partner Banks · Call Ranking
        <span className="bc-meta">
          <em className="num">235</em> Partners
        </span>
      </div>

      <div className="bc-summary">
        <div className="bc-sum-cell">
          <div className="bc-sum-label">Total Calls</div>
          <div className="bc-sum-value num">{totalCalls.toLocaleString()}</div>
        </div>
        <div className="bc-sum-cell">
          <div className="bc-sum-label">Active</div>
          <div className="bc-sum-value num">
            {Object.values(calls).filter((c) => c > 0).length}
            <em className="bc-sum-em"> / 235</em>
          </div>
        </div>
      </div>

      <div className="bc-list">
        {ranked.map((b, i) => {
          const pct = (b.count / maxCount) * 100;
          const isBusy = b.id === busy;
          return (
            <div key={b.id} className={`bc-row ${isBusy ? "bc-busy" : ""}`}>
              <div className="bc-rank num">{(i + 1).toString().padStart(2, "0")}</div>
              <img src={`/assets/banks/bank-${b.id}.svg`} alt={b.name} className="bc-svg" />
              <div className="bc-text">
                <div className="bc-name">
                  {b.name}
                  {isBusy && <span className="bc-plus">+</span>}
                </div>
                <div className="bc-bar-track">
                  <div
                    className="bc-bar-fill"
                    style={{
                      width: `${pct}%`,
                      background: b.color,
                      boxShadow: `0 0 6px ${b.color}88`,
                    }}
                  />
                </div>
              </div>
              <div className="bc-count num">{b.count.toLocaleString()}</div>
            </div>
          );
        })}
      </div>

      <div className="bc-foot">
        <span>· Data refreshed per second · Source: Deepbank Agent Platform</span>
      </div>
    </section>
  );
};
