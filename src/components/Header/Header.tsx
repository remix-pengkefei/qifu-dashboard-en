import { useEffect, useRef, useState } from "react";
import "./Header.css";

const NEWS_ITEMS = [
  `QiFu Tech named Extel Asia's Most Respected Company for two consecutive years`,
  `QiFu Tech became CCTV Finance's 2025 fintech media partner`,
  `QiFu Tech CEO invited to speak at China Development Forum 2025`,
  `QiFu Tech selected as AIIA AI Pioneer Case for LLM-powered SME lending`,
  `QiFu Tech paper accepted at IJCAI 2025 international AI conference`,
  `QiFu Tech speech-emotion framework showcased at IEEE ASRU 2025`,
  `QiFu Tech named a KPMG China Leading Fintech for six consecutive years`,
  `QiFu Tech achieved top-level data security certification from CAICT`,
  `QiFu Tech won the 2024 ESG Pioneer 60 Social Responsibility Award`,
  `QiFu Tech ranked first in ICDAR international OCR competition`,
  `QiFu Tech credit multimodal LLM Qfin-VL ranked #1 in comprehensive evaluation`,
  `QiFu Tech partnered with MIIT to empower the navel orange industry with tech`,
  `QiFu Tech facilitated over ¥24.5B in green loans for eco-friendly enterprises`,
  `QiFu Tech helped SMEs secure over ¥100B in loans in 2025, benefiting millions`,
];

export const Header = () => {
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<"enter" | "show" | "exit">("enter");
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    let cur = 0;

    const run = () => {
      if (!aliveRef.current) return;
      setIdx(cur);
      setPhase("enter");

      setTimeout(() => {
        if (!aliveRef.current) return;
        setPhase("show");

        setTimeout(() => {
          if (!aliveRef.current) return;
          setPhase("exit");

          setTimeout(() => {
            if (!aliveRef.current) return;
            cur = (cur + 1) % NEWS_ITEMS.length;
            run();
          }, 600);
        }, 8000);
      }, 700);
    };

    run();
    return () => { aliveRef.current = false; };
  }, []);

  return (
    <header className="hdr">
      <div className="hdr-l">
        <img src="/assets/logo/qifu-official.png" alt="QiFu Tech" className="hdr-logo-img" />
        <span className="hdr-slogan">AI-Powered Future Finance</span>
      </div>

      <div className="hdr-honor">
        <div className="hdr-news-title">
          <svg className="hdr-news-icon" viewBox="0 0 20 22" fill="none">
            <path d="M7.5 1h5l1 2h-7z" fill="#e8a830" />
            <path d="M6.5 3L10 9.5 13.5 3" fill="none" stroke="#c8880a" strokeWidth="1.2" strokeLinecap="round" />
            <circle cx="10" cy="14" r="6.5" fill="url(#hdr-medal-g)" stroke="#c8880a" strokeWidth="0.8" />
            <path d="M10 9.8l1.3 2.6 2.9.4-2.1 2 .5 2.9L10 16.2l-2.6 1.5.5-2.9-2.1-2 2.9-.4z" fill="rgba(255,255,255,0.35)" />
            <defs>
              <radialGradient id="hdr-medal-g" cx="45%" cy="40%">
                <stop offset="0%" stopColor="#ffe6a0" />
                <stop offset="60%" stopColor="#e8a830" />
                <stop offset="100%" stopColor="#b07808" />
              </radialGradient>
            </defs>
          </svg>
          Honors
        </div>
        <div className="hdr-news-divider" />
        <div className="hdr-news-scroll">
          <div className={`hdr-news hdr-evt-${phase}`} key={idx}>
            <span className="hdr-news-text">{NEWS_ITEMS[idx]}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
