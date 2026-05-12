import { useEffect, useRef, useState } from "react";
import { BANKS } from "../../data/banks";
import "./BankTicker.css";

/**
 * 银行词云跑马灯：
 *  - 12 家银行排成横向队列，无限循环跑马灯
 *  - 卡片显示：行 logo + 行名 + 当前业务量
 *  - 词云感：业务量越大，卡片越大、字号越亮（按 fontWeight）
 *  - 当某银行"刚发生一笔业务"：卡片整体高光闪一下，业务量数字 +1，并飘出"+1"提示
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

  // 滚动列表：原 12 家 × 重复 N 份，确保跑马灯不留白
  const looped = [...BANKS, ...BANKS, ...BANKS];

  return (
    <div className="bt">
      <div className="bt-head">
        <span className="bt-bar" />
        银行业务实时词云
        <span className="bt-meta">235 家合作机构 · 全天候</span>
      </div>

      <div className="bt-track-mask">
        <div className="bt-track">
          {looped.map((b, i) => {
            const isBusy = bursts.some((x) => x.bankId === b.id);
            const cnt = counts[b.id] ?? 0;
            // 按业务量给卡片加 weight（词云感）
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
                    <em>笔</em>
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
