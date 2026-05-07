import { useEffect, useRef, useState } from "react";
import "./Header.css";

const NEWS_ITEMS = [
  `奇富科技连续两年荣获Extel亚洲"最受尊敬公司"称号`,
  `奇富科技成为2025年央视财经新媒体金融科技合作伙伴`,
  `奇富科技CEO受邀出席中国发展高层论坛2025年年会`,
  `奇富科技入选AIIA人工智能先锋案例，大模型赋能小微`,
  `奇富科技论文入选IJCAI 2025国际人工智能顶级会议`,
  `奇富科技语音情感框架受邀亮相IEEE ASRU 2025大会`,
  `奇富科技连续六年入选毕马威中国领先金融科技企业榜`,
  `奇富科技通过中国信通院数据安全治理能力最高级认证`,
  `奇富科技荣获2024年度ESG先锋60"社会责任优秀奖"`,
  `奇富科技ICDAR国际文档分析与识别大赛OCR荣获榜首`,
  `奇富科技信贷多模态大模型Qfin-VL综合评测排名第一`,
  `奇富科技联合工信部助力脐橙产业，科技赋能乡村振兴`,
  `奇富科技累计协助环保企业发放绿色贷款超过245亿元`,
  `奇富科技2025年助力小微企业放款超千亿惠及百万用户`,
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
        <img src="/assets/logo/qifu-official.png" alt="奇富科技" className="hdr-logo-img" />
        <span className="hdr-slogan">用先进科技改变金融服务</span>
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
          企业荣誉
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
