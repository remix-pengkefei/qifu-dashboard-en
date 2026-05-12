import { useEffect, useMemo, useRef, useState } from "react";
import { useChinaGeoJson, useWorldGeoJson } from "../../utils/useGeoJson";
import { useSize } from "../../utils/useSize";
import {
  buildPathFn,
  cleanFeatures,
  createChinaProjection,
  geoBounds,
  geoContains,
  projectPoint,
} from "../../utils/projection";
import { CITY_NODES, MAJOR_LINKS } from "../../data/regions";
import "./ChinaMap.css";

const NEIGHBOR_LABELS: { name: string; coord: [number, number] }[] = [
  { name: "Russia", coord: [100, 54] },
  { name: "Mongolia", coord: [104, 47] },
  { name: "Kazakhstan", coord: [75, 45] },
  { name: "India", coord: [82, 22] },
  { name: "Myanmar", coord: [97, 20] },
  { name: "Vietnam", coord: [107, 17] },
  { name: "Laos", coord: [103, 19] },
  { name: "Nepal", coord: [84, 28.5] },
  { name: "Pakistan", coord: [70, 30] },
  { name: "N. Korea", coord: [127, 40] },
  { name: "S. Korea", coord: [127.5, 36] },
  { name: "Japan", coord: [136, 36] },
  { name: "Philippines", coord: [121, 14] },
];

const KEY_CITIES = [
  "bj", "sh", "gz", "sz", "cq", "tj",
  "cd", "wh", "hz", "nj", "cs",
  "xa", "jn", "sy", "hb", "fz",
  "km", "nn", "ur", "lz_lhasa", "hk_city",
  "sjz", "ty", "hhht", "cc", "hf", "nc",
  "zz", "gy", "lz", "xn", "yc",
  "qd", "dl", "xm", "hk",
];

type Spark = { id: number; x: number; y: number; color: string; size: number };

const starColors = ["#9be7ff", "#78d4ff", "#56c4ff", "#b0ecff", "#ffe9b3"];
const pickStarColor = () => starColors[Math.floor(Math.random() * starColors.length)];

const PULSE_COLORS = ["#56c4ff", "#2fd996", "#a78bfa", "#ffb84d", "#ff5e6c"];

type CityPulse = { id: number; x: number; y: number; color: string };
type FlyDot = { id: number; pathD: string; dur: number };
// ── 业务类型定义（颜色贯穿事件流+心电图） ──
const BIZ_TYPES = [
  { key: "credit",   label: "智能信贷", color: "#e8b866", weight: 40 },
  { key: "risk",     label: "风控决策", color: "#36d6b6", weight: 12 },
  { key: "sme",      label: "小微金融", color: "#56c4ff", weight: 25 },
  { key: "platform", label: "联合放款", color: "#7b8cce", weight: 13 },
  { key: "postloan", label: "贷后管理", color: "#78909c", weight: 10 },
] as const;

const BIZ_POOL: typeof BIZ_TYPES[number][] = [];
BIZ_TYPES.forEach((b) => { for (let i = 0; i < b.weight; i++) BIZ_POOL.push(b); });
const pickBiz = () => BIZ_POOL[Math.floor(Math.random() * BIZ_POOL.length)];

const FEED_BANKS = [
  "杭州银行", "北京银行", "上海银行", "宁波银行", "江苏银行",
  "民生银行", "西安银行", "兰州银行", "青岛银行", "徽商银行",
  "吉林银行", "汉口银行", "廊坊银行", "齐鲁银行", "天津银行",
  "甘肃银行", "长安银行", "广州银行", "恒丰银行", "东营银行",
  "南京银行", "威海银行", "九江银行", "桂林银行", "昆仑银行",
  "烟台银行", "百信银行", "石嘴山银行", "海口银行", "张家口银行",
  "辽宁盛京银行", "重庆农商行", "东莞农商行", "上海农商行",
  "苏州农商行", "昆山农商行", "天津农商", "贵阳农商行",
];
const FEED_PERSONS = [
  "张明", "李华", "王峰", "陈林", "刘强", "赵玲", "黄国", "周燕",
  "吴辉", "孙丽", "何杰", "马芳", "谢平", "邓伟", "韩海", "萧勇",
  "高志远", "林婷", "杨帆", "朱磊", "徐宏", "曹敏", "唐亮", "彭程",
  "蒋欣", "沈涛", "郭晓", "田雨", "苏建", "范明杰", "许晴", "石磊",
  "卢峰", "段瑜", "钟毅", "潘洁",
];
const FEED_COMPANIES = [
  "兴达纺织厂", "大丰贸易", "利和科技", "明达电子", "长江材料",
  "新兴食品", "振兴机械", "远达商贸", "光明制造", "海丰物流",
  "安康建设", "富强实业", "恒通钢铁", "锦绣服饰", "永盛化工",
  "国泰包装", "宏图建材", "博达通讯", "三和汽配", "金鼎模具",
  "万达门窗", "天成物业", "顺达运输", "丰华农业", "中恒新能源",
  "同创电气", "合力液压", "鸿盛塑业", "正泰电器", "长城精工",
];
const CREDIT_VERBS = [
  "发放消费贷", "发放信用贷", "审批放款", "完成授信放款",
  "发放装修贷", "发放教育贷", "发放医疗贷", "极速放款",
];
const SME_VERBS = [
  "发放经营贷", "发放设备贷", "发放周转贷", "完成供应链放款",
  "发放采购贷", "发放仓储贷",
];
const _pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
const fmtAmount = (wan: number): string => {
  if (wan >= 10000) return `¥${(wan / 10000).toFixed(1)}亿`;
  if (wan >= 100) return `¥${Math.round(wan)}万`;
  if (wan >= 1) return `¥${wan.toFixed(1)}万`;
  return `¥${Math.round(wan * 10000)}元`;
};
const maskName = (n: string) => n[0] + "*".repeat(n.length - 1);
const AGENT_MAP: Record<string, string[]> = {
  credit: ["AI审批官", "AI信贷助手", "AI放款助手"],
  sme: ["AI审批官", "AI小微助手", "AI企业评估"],
  risk: ["AI风控助手", "AI反欺诈引擎", "AI信用评估"],
};


type FeedEvent = {
  id: number;
  bizLabel: string;
  action: string;
  detail: string;
  color: string;
  time: string;
};

const genTime = () => {
  const now = new Date();
  const offset = Math.floor(Math.random() * 30);
  const t = new Date(now.getTime() - offset * 1000);
  const h = String(t.getHours()).padStart(2, "0");
  const m = String(t.getMinutes()).padStart(2, "0");
  const s = String(t.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

const _seenKeys = new Set<string>();
const _genOnce = (biz: typeof BIZ_TYPES[number]) => {
  const bank = _pick(FEED_BANKS);
  let title: string;
  let detail: string;
  let actionLabel: string;
  const agents = AGENT_MAP[biz.key];
  switch (biz.key) {
    case "credit": {
      const p = maskName(_pick(FEED_PERSONS));
      title = `给 ${p} ${_pick(CREDIT_VERBS)}`;
      detail = fmtAmount(Math.random() * 14 + 1);
      actionLabel = `调用${_pick(agents)}`;
      break;
    }
    case "sme": {
      const c = _pick(FEED_COMPANIES);
      title = `${bank} 给 ${c} ${_pick(SME_VERBS)}`;
      detail = fmtAmount(Math.random() * 60 + 30);
      actionLabel = `调用${_pick(agents)}`;
      break;
    }
    case "risk": {
      const p = maskName(_pick(FEED_PERSONS));
      title = _pick([
        `${bank} 给 ${p} 风控审批通过`,
        `${bank} 给 ${p} 完成信用评估`,
      ]);
      detail = `${Math.floor(Math.random() * 200 + 650)}分`;
      actionLabel = `调用${_pick(agents)}`;
      break;
    }
    case "platform": {
      const c = _pick(FEED_COMPANIES);
      title = _pick([
        `${bank} 对接 ${c} 完成授信`,
        `${bank} 联合 ${c} 放款`,
      ]);
      detail = fmtAmount(Math.random() * 60 + 30);
      actionLabel = biz.label;
      break;
    }
    case "postloan": {
      const p = maskName(_pick(FEED_PERSONS));
      title = _pick([
        `${bank} ${p} 按时还款`,
        `${bank} ${p} 贷后回访正常`,
      ]);
      detail = fmtAmount(Math.random() * 14 + 1);
      actionLabel = biz.label;
      break;
    }
  }
  return { title: `${title} ${detail}`, actionLabel };
};

const genEvent = (id: number, forceBiz?: typeof BIZ_TYPES[number]): FeedEvent => {
  const biz = forceBiz ?? pickBiz();
  let r = _genOnce(biz);
  let attempts = 0;
  while (_seenKeys.has(r.title) && attempts < 30) { r = _genOnce(biz); attempts++; }
  _seenKeys.add(r.title);
  if (_seenKeys.size > 2000) _seenKeys.clear();
  return {
    id,
    bizLabel: r.title,
    action: r.actionLabel,
    detail: "",
    color: biz.color,
    time: genTime(),
  };
};

const genBatch = (count: number, seq: { current: number }): FeedEvent[] => {
  return Array.from({ length: count }, () => genEvent(seq.current++));
};

// ── 事件流组件 ──
const FEED_COUNT = 8;
const FLIP_GAP = 140;
const FLIP_PAUSE = 2000;

const EventFeed = () => {
  const seqRef = useRef(0);
  const nextBatchRef = useRef<FeedEvent[]>([]);
  const [events, setEvents] = useState<FeedEvent[]>(() => genBatch(FEED_COUNT, seqRef));
  const [flipKeys, setFlipKeys] = useState<number[]>(() => Array(FEED_COUNT).fill(0));

  useEffect(() => {
    let alive = true;
    let idx = 0;

    const flipOne = () => {
      if (!alive) return;
      if (idx === 0) {
        nextBatchRef.current = genBatch(FEED_COUNT, seqRef);
      }
      const ci = idx;
      const evt = nextBatchRef.current[ci];
      setEvents((prev) => { const n = [...prev]; n[ci] = evt; return n; });
      setFlipKeys((prev) => { const n = [...prev]; n[ci] = prev[ci] + 1; return n; });
      idx++;
      if (idx < FEED_COUNT) {
        window.setTimeout(flipOne, FLIP_GAP);
      } else {
        idx = 0;
        window.setTimeout(flipOne, FLIP_PAUSE);
      }
    };

    window.setTimeout(flipOne, 1000);
    return () => { alive = false; };
  }, []);

  return (
    <div className="cm-feed">
      <div className="cm-feed-head">
        <span className="cm-feed-dot" />
        实时事件流
        <span className="cm-meta">
          覆盖 <em className="cm-em num">31</em> 省 · <em className="cm-em num">318</em> 城
        </span>
      </div>
      <div className="cm-feed-list">
        {events.map((e, i) => (
          <div
            key={`${flipKeys[i]}-${i}`}
            className="cm-feed-item"
            style={{ "--ac": e.color } as React.CSSProperties}
          >
            <div className="cm-feed-row1">
              <span className="cm-feed-biz">{e.bizLabel}</span>
              <span className="cm-feed-detail">{e.detail}</span>
            </div>
            <div className="cm-feed-row2">
              <span className="cm-feed-action">{e.action}</span>
              <span className="cm-feed-time">{e.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── 心电图波形：只往上跳，高度=请求量，颜色=业务类型 ──
const WAVE_SEGMENTS = BIZ_TYPES.map((b) => ({ label: b.label, color: b.color }));

const waveBuf: number[] = [];
let waveT = 0;
let waveAccum = 0;

type WaveDot = { idx: number; seg: number };
const waveDots: WaveDot[] = [];
let nextDotT = 0;

const WAVE_RATE = 120;
const WAVE_MS = 1000 / WAVE_RATE;

function pushWavePoint() {
  waveT++;
  let v = 0.15;
  v += Math.abs(Math.sin(waveT * 0.008)) * 0.25;
  v += Math.abs(Math.sin(waveT * 0.025 + 1.3)) * 0.18;
  v += Math.abs(Math.sin(waveT * 0.07 + 2.7)) * 0.12;
  v += Math.abs(Math.sin(waveT * 0.18)) * 0.08;
  v += Math.abs(Math.sin(waveT * 0.5 + 0.8)) * 0.05;
  v += Math.random() * 0.05;
  if (Math.random() < 0.04) v += Math.random() * 0.3 + 0.15;
  waveBuf.push(Math.min(0.95, v));

  if (waveT >= nextDotT) {
    const seg = pickBiz();
    const si = WAVE_SEGMENTS.findIndex((s) => s.label === seg.label);
    waveDots.push({ idx: waveBuf.length - 1, seg: si >= 0 ? si : 0 });
    nextDotT = waveT + 3 + Math.floor(Math.random() * 8);
  }
}

let waveInited = false;
function initWave(maxPts: number) {
  if (waveInited) return;
  waveInited = true;
  for (let i = 0; i < maxPts + 10; i++) pushWavePoint();
}

function drawWaves(canvas: HTMLCanvasElement, dt: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  if (w < 1 || h < 1) return;
  const dpr = window.devicePixelRatio || 1;
  const maxPts = Math.ceil(w / dpr);

  initWave(maxPts);

  waveAccum += dt;
  let pushed = 0;
  while (waveAccum >= WAVE_MS && pushed < 12) {
    waveAccum -= WAVE_MS;
    pushWavePoint();
    pushed++;
  }

  while (waveBuf.length > maxPts + 10) {
    waveBuf.shift();
    for (const d of waveDots) d.idx--;
  }
  while (waveDots.length > 0 && waveDots[0].idx < -1) waveDots.shift();

  const frac = waveAccum / WAVE_MS;
  const pxPerPt = w / (maxPts - 1);
  const scrollOff = frac * pxPerPt;

  ctx.clearRect(0, 0, w, h);

  const baseline = h * 0.85;
  const maxH = h * 0.7;
  const len = waveBuf.length;
  if (len < 2) return;

  const startIdx = len - maxPts - 1;

  ctx.save();
  ctx.strokeStyle = "rgba(86, 196, 255, 0.7)";
  ctx.lineWidth = 1 * dpr;
  ctx.beginPath();
  for (let j = Math.max(0, startIdx); j < len; j++) {
    const px = (j - startIdx) * pxPerPt - scrollOff;
    const y = baseline - waveBuf[j] * maxH;
    j === Math.max(0, startIdx) ? ctx.moveTo(px, y) : ctx.lineTo(px, y);
  }
  ctx.stroke();
  ctx.restore();

  const dotR = 2 * dpr;
  for (const d of waveDots) {
    if (d.idx < startIdx || d.idx >= len) continue;
    const px = (d.idx - startIdx) * pxPerPt - scrollOff;
    if (px < -dotR || px > w + dotR) continue;
    const y = baseline - waveBuf[d.idx] * maxH;
    const color = WAVE_SEGMENTS[d.seg].color;

    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px, y, dotR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

const WaveMonitor = () => {
  const boxRef = useRef<HTMLDivElement>(null);
  const cvRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const box = boxRef.current;
    const cv = cvRef.current;
    if (!box || !cv) return;
    let id = 0;
    let alive = true;

    const fit = () => {
      const dpr = window.devicePixelRatio || 1;
      const r = box.getBoundingClientRect();
      if (r.width < 1 || r.height < 1) return;
      cv.width = Math.round(r.width * dpr);
      cv.height = Math.round(r.height * dpr);
      cv.style.width = r.width + "px";
      cv.style.height = r.height + "px";
    };
    requestAnimationFrame(fit);
    const ro = new ResizeObserver(fit);
    ro.observe(box);

    let prevTs = 0;
    const loop = (ts: number) => {
      if (!alive) return;
      const dt = prevTs === 0 ? 16 : Math.min(ts - prevTs, 50);
      prevTs = ts;
      drawWaves(cv, dt);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);

    return () => { alive = false; cancelAnimationFrame(id); ro.disconnect(); };
  }, []);

  return (
    <div className="cm-wave" ref={boxRef}>
      <div className="cm-wave-labels">
        {WAVE_SEGMENTS.map((ch, i) => (
          <span key={i} className="cm-wave-tag" style={{ color: ch.color }}>
            <span className="cm-wave-tag-dot" style={{ background: ch.color }} />
            {ch.label}
          </span>
        ))}
      </div>
      <canvas ref={cvRef} className="cm-wave-canvas" />
    </div>
  );
};

// ── 业务热力散点层（航空俯瞰城市灯光） ──
const HEAT_CITIES = CITY_NODES.map((c) => ({
  coord: c.coord,
  weight: c.tier === 1 ? 1.0 : c.tier === 2 ? 0.45 : c.tier === 3 ? 0.25 : 0.12,
  name: c.name,
}));

// extra population corridors (small towns between major cities)
const EXTRA_POINTS: [number, number, number][] = [
  // 长三角密集带
  [120.9, 31.4, 0.15], [121.1, 30.9, 0.12], [120.5, 30.5, 0.1],
  [119.5, 31.8, 0.08], [119.9, 30.8, 0.08], [121.4, 29.3, 0.06],
  // 珠三角密集带
  [113.5, 22.8, 0.15], [113.8, 22.6, 0.12], [114.3, 23.1, 0.1],
  [112.9, 23.3, 0.08], [113.1, 22.5, 0.06],
  // 京津冀
  [116.8, 39.5, 0.1], [115.5, 38.8, 0.08], [117.5, 39.7, 0.06],
  [115.0, 39.5, 0.05], [116.1, 38.3, 0.04],
  // 成渝
  [105.3, 30.1, 0.08], [106.0, 29.8, 0.06], [104.7, 29.3, 0.04],
  // 中部走廊
  [113.4, 30.2, 0.06], [113.0, 28.8, 0.05], [115.0, 30.5, 0.05],
  [112.5, 34.2, 0.05], [116.5, 33.5, 0.04], [111.7, 29.4, 0.04],
  [114.5, 36.6, 0.04], [113.7, 27.8, 0.04],
  // 东部沿海带
  [119.0, 25.5, 0.05], [118.5, 24.9, 0.06], [120.7, 28.0, 0.05],
  [117.3, 34.8, 0.04], [118.3, 33.9, 0.04], [116.7, 23.4, 0.05],
  [110.4, 21.2, 0.04], [109.1, 21.5, 0.03],
  // ── 东北 ──
  [124.5, 42.8, 0.05], [125.8, 44.5, 0.04], [123.0, 41.1, 0.06],
  [121.6, 38.9, 0.06], [122.0, 41.1, 0.04], [123.9, 47.3, 0.03],
  [124.8, 45.7, 0.03], [126.9, 47.4, 0.03], [129.6, 44.6, 0.02],
  [127.0, 41.8, 0.02], [130.3, 47.3, 0.02], [121.2, 45.0, 0.02],
  [120.4, 41.8, 0.03], [122.8, 45.2, 0.02],
  // ── 内蒙古 ──
  [109.8, 40.6, 0.05], [110.0, 41.0, 0.04], [106.8, 39.7, 0.04],
  [114.0, 40.8, 0.04], [116.8, 43.6, 0.03], [119.7, 49.2, 0.03],
  [117.4, 47.4, 0.03], [108.7, 40.0, 0.03], [112.0, 43.0, 0.03],
  [115.0, 42.0, 0.03], [120.7, 48.0, 0.03],
  [107.5, 40.8, 0.03], [113.0, 42.0, 0.03], [118.5, 46.0, 0.02],
  [116.0, 44.5, 0.02], [121.5, 47.0, 0.02], [110.5, 42.5, 0.02],
  [108.0, 41.5, 0.02], [114.5, 44.0, 0.02],
  // ── 新疆 ──
  [87.6, 43.8, 0.06], [86.1, 41.8, 0.04], [81.3, 43.9, 0.04],
  [80.3, 41.2, 0.04], [76.0, 39.5, 0.04], [79.9, 37.1, 0.03],
  [88.1, 47.8, 0.03], [84.9, 45.6, 0.03], [89.2, 42.9, 0.03],
  [85.0, 41.0, 0.03], [91.7, 46.7, 0.03],
  [83.0, 46.0, 0.03], [78.0, 41.0, 0.03], [82.5, 44.5, 0.03],
  [90.5, 45.0, 0.03], [86.5, 44.2, 0.03], [77.5, 37.5, 0.02],
  [83.5, 40.0, 0.02], [88.0, 40.5, 0.02], [93.5, 43.0, 0.02],
  [79.0, 43.0, 0.02], [85.5, 48.0, 0.02],
  // ── 西藏 ──
  [91.1, 29.7, 0.05], [88.9, 29.3, 0.03], [86.0, 29.0, 0.03],
  [97.2, 31.5, 0.03], [94.4, 29.7, 0.03], [80.1, 32.5, 0.02],
  [84.2, 31.5, 0.02], [92.0, 31.0, 0.02],
  [82.0, 30.0, 0.02], [86.5, 32.0, 0.02], [89.0, 31.5, 0.02],
  [95.5, 30.5, 0.02], [83.5, 29.5, 0.02], [79.0, 31.0, 0.02],
  [87.0, 30.5, 0.02], [93.0, 32.5, 0.02], [85.0, 33.0, 0.01],
  // ── 青海 ──
  [101.8, 36.6, 0.05], [97.4, 37.4, 0.03], [95.4, 33.0, 0.02],
  [100.6, 34.5, 0.03], [102.0, 35.0, 0.03], [98.1, 36.4, 0.03],
  [96.0, 35.5, 0.02], [99.0, 33.5, 0.02], [94.5, 36.0, 0.02],
  [97.0, 35.0, 0.02], [100.0, 36.0, 0.02], [93.0, 34.5, 0.02],
  // ── 甘肃 ──
  [103.8, 36.1, 0.05], [98.3, 39.7, 0.04], [104.6, 35.6, 0.04],
  [105.7, 34.6, 0.04], [106.7, 35.5, 0.04], [100.5, 38.9, 0.03],
  [97.0, 39.0, 0.03], [95.0, 40.1, 0.03], [102.2, 38.0, 0.03],
  [99.5, 39.5, 0.02], [93.5, 40.5, 0.02], [101.0, 37.0, 0.02],
  // ── 宁夏 ──
  [106.3, 38.5, 0.04], [105.2, 37.5, 0.03],
  // ── 云贵 ──
  [106.6, 26.6, 0.05], [104.8, 26.6, 0.04], [100.2, 26.9, 0.03],
  [103.8, 25.0, 0.04], [106.7, 27.7, 0.03], [107.9, 27.1, 0.03],
  [104.3, 23.4, 0.02], [108.3, 22.8, 0.03],
  // ── 广西 ──
  [109.4, 24.3, 0.04], [110.3, 25.3, 0.03], [107.4, 23.7, 0.03],
  [111.3, 23.5, 0.03], [108.1, 24.7, 0.02],
  // ── 陕西 ──
  [108.9, 34.3, 0.06], [109.5, 36.6, 0.03], [107.1, 34.4, 0.03],
  [107.8, 33.1, 0.02], [110.1, 35.1, 0.03],
  // ── 山西 ──
  [112.5, 37.9, 0.05], [113.1, 36.2, 0.03], [111.5, 36.1, 0.03],
  [112.7, 35.5, 0.03], [113.3, 40.1, 0.03],
  // ── 海南 ──
  [110.3, 20.0, 0.04], [109.5, 18.2, 0.03], [110.0, 19.2, 0.02],
  // ── 河南补充 ──
  [114.3, 34.0, 0.05], [112.4, 35.0, 0.04], [115.6, 34.4, 0.04],
  [111.2, 34.0, 0.03], [113.9, 33.0, 0.03], [114.0, 32.1, 0.03],
  // ── 安徽补充 ──
  [117.8, 30.9, 0.04], [116.5, 31.7, 0.04], [118.3, 32.9, 0.03],
  [115.8, 33.9, 0.03], [117.0, 30.0, 0.03],
  // ── 江西补充 ──
  [115.0, 27.8, 0.04], [114.4, 27.1, 0.04], [116.4, 28.3, 0.03],
  [114.9, 26.0, 0.03], [117.0, 29.3, 0.03], [116.0, 25.8, 0.02],
  // ── 湖北补充 ──
  [112.1, 31.0, 0.04], [110.8, 32.6, 0.03], [111.3, 30.7, 0.03],
  [109.5, 30.3, 0.03], [113.4, 31.7, 0.03],
  // ── 湖南补充 ──
  [110.0, 27.2, 0.04], [109.7, 28.3, 0.03], [111.6, 26.4, 0.03],
  [112.6, 27.0, 0.03], [110.5, 29.4, 0.03],
  // ── 四川盆地 ──
  [105.1, 31.5, 0.04], [106.8, 31.2, 0.03], [103.0, 30.0, 0.03],
  [104.8, 28.8, 0.03], [105.6, 30.8, 0.03], [107.5, 31.8, 0.02],
  // ── 吉林补充 ──
  [126.5, 43.8, 0.03], [127.5, 42.9, 0.02], [124.3, 43.2, 0.02],
  // ── 黑龙江补充 ──
  [128.0, 46.6, 0.03], [124.0, 46.6, 0.02], [127.5, 50.2, 0.01],
  [131.0, 46.0, 0.02],
  // ── 河北补充 ──
  [114.5, 37.1, 0.04], [116.1, 39.6, 0.03], [118.2, 39.6, 0.03],
  [115.5, 37.7, 0.03],
  // ── 山东补充 ──
  [118.0, 36.8, 0.04], [119.1, 35.4, 0.03], [116.0, 35.4, 0.03],
  [121.4, 37.5, 0.03],
  // ── 台湾 ──
  [121.565, 25.033, 0.06], [121.52, 25.08, 0.04], [121.45, 25.00, 0.03],
  [120.684, 24.148, 0.05], [120.72, 24.20, 0.03], [120.65, 24.08, 0.03],
  [120.311, 22.620, 0.04], [120.35, 22.68, 0.03], [120.28, 22.58, 0.02],
  [121.0, 24.6, 0.03], [120.95, 23.8, 0.03], [121.2, 23.0, 0.03],
  [120.5, 23.5, 0.02], [120.8, 22.9, 0.02], [121.1, 23.5, 0.02],
];

type StaticDot = { x: number; y: number; alpha: number; r: number; phase: number };
type FlashDot = { x: number; y: number; life: number; maxLife: number; r: number };

const HeatCanvas = ({
  projection,
  width,
  height,
  mapTop,
  chinaPaths,
}: {
  projection: any;
  width: number;
  height: number;
  mapTop: number;
  chinaPaths: string[];
}) => {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const staticRef = useRef<HTMLCanvasElement | null>(null);
  const maskRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!projection || width < 1 || height < 1 || !chinaPaths.length) return;
    const cv = cvRef.current;
    if (!cv) return;

    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(width * dpr);
    cv.height = Math.round(height * dpr);
    cv.style.width = width + "px";
    cv.style.height = height + "px";

    const cw = cv.width;
    const ch = cv.height;

    // Pre-build china clip path for efficient per-frame clipping
    const chinaPath2D = new Path2D();
    for (const d of chinaPaths) {
      chinaPath2D.addPath(new Path2D(d));
    }

    // Offscreen canvases at reduced resolution to prevent memory exhaustion
    // Full-res 11520×4320 canvas = ~200MB each; keep offscreen under ~56MB
    const maxOffDim = 6144;
    const offRatio = Math.min(1, maxOffDim / Math.max(cw, ch));
    const ocw = Math.round(cw * offRatio);
    const och = Math.round(ch * offRatio);

    // Build mask at reduced resolution
    const maskCanvas = document.createElement("canvas");
    maskCanvas.width = ocw;
    maskCanvas.height = och;
    const mctx = maskCanvas.getContext("2d")!;
    mctx.scale(dpr * offRatio, dpr * offRatio);
    mctx.translate(0, mapTop);
    mctx.fillStyle = "#fff";
    mctx.fill(chinaPath2D);

    // pre-generate ALL static dots (coordinates in full-res pixel space)
    const allSources: { cx: number; cy: number; weight: number }[] = [];
    HEAT_CITIES.forEach((city) => {
      const p = projectPoint(projection, city.coord);
      if (!p) return;
      allSources.push({ cx: p[0] * dpr, cy: (p[1] + mapTop) * dpr, weight: city.weight });
    });
    EXTRA_POINTS.forEach(([lon, lat, w]) => {
      const p = projectPoint(projection, [lon, lat]);
      if (!p) return;
      allSources.push({ cx: p[0] * dpr, cy: (p[1] + mapTop) * dpr, weight: w });
    });

    const baseArea = 1920 * 1080;
    const currentArea = width * height;
    const areaRatio = currentArea / baseArea;
    const isLargeScreen = areaRatio > 4;
    const countScale = Math.max(1, Math.min(areaRatio, 20));
    const flashScale = Math.max(1, Math.min(Math.sqrt(areaRatio), 8));
    const sizeBoost = Math.max(1, Math.pow(areaRatio, 0.55));
    const spreadBoost = Math.max(1, Math.pow(areaRatio, 0.25));
    const dotMultiplier = 2000 * countScale;

    const staticDots: StaticDot[] = [];
    allSources.forEach((src) => {
      const count = Math.round(src.weight * dotMultiplier);
      const spread = (45 + src.weight * 50) * dpr * spreadBoost;
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.random();
        const dist = r * r * spread;
        const baseAlpha = isLargeScreen
          ? 0.4 + Math.random() * 0.25
          : (0.3 + Math.random() * 0.5) * src.weight;
        staticDots.push({
          x: src.cx + Math.cos(angle) * dist,
          y: src.cy + Math.sin(angle) * dist,
          alpha: Math.min(1, baseAlpha),
          r: (0.8 + Math.random() * 1.5) * dpr * sizeBoost,
          phase: Math.random() * Math.PI * 2,
        });
      }
    });

    // bake static layer at reduced resolution, then scale up when drawing
    const offscreen = document.createElement("canvas");
    offscreen.width = ocw;
    offscreen.height = och;
    const octx = offscreen.getContext("2d")!;
    octx.globalCompositeOperation = "lighter";

    // Glow pass: large soft halos for bloom effect on large screens
    if (isLargeScreen) {
      // Outer glow — wide, soft
      for (const d of staticDots) {
        const sx = d.x * offRatio;
        const sy = d.y * offRatio;
        const glowR = Math.max(3, d.r * offRatio * 5);
        if (sx < -glowR || sx >= ocw + glowR || sy < -glowR || sy >= och + glowR) continue;
        octx.globalAlpha = d.alpha * 0.06;
        octx.fillStyle = "rgb(50, 120, 230)";
        octx.beginPath();
        octx.arc(sx, sy, glowR, 0, Math.PI * 2);
        octx.fill();
      }
      // Inner glow — tighter, brighter
      for (const d of staticDots) {
        const sx = d.x * offRatio;
        const sy = d.y * offRatio;
        const glowR = Math.max(2, d.r * offRatio * 2.5);
        if (sx < -glowR || sx >= ocw + glowR || sy < -glowR || sy >= och + glowR) continue;
        octx.globalAlpha = d.alpha * 0.15;
        octx.fillStyle = "rgb(80, 160, 240)";
        octx.beginPath();
        octx.arc(sx, sy, glowR, 0, Math.PI * 2);
        octx.fill();
      }
    }

    // Core dots — bright centers
    for (const d of staticDots) {
      const sx = d.x * offRatio;
      const sy = d.y * offRatio;
      const sr = Math.max(0.8, d.r * offRatio);
      if (sx < 0 || sx >= ocw || sy < 0 || sy >= och) continue;
      octx.globalAlpha = d.alpha;
      octx.fillStyle = isLargeScreen ? "rgb(130, 195, 255)" : "rgb(60, 140, 220)";
      octx.beginPath();
      octx.arc(sx, sy, sr, 0, Math.PI * 2);
      octx.fill();
    }
    octx.globalCompositeOperation = "destination-in";
    octx.globalAlpha = 1;
    octx.drawImage(maskCanvas, 0, 0);
    staticRef.current = offscreen;

    // flash dots (real-time business sparks with clusters)
    const flashDots: FlashDot[] = [];
    let alive = true;

    const loop = () => {
      if (!alive) return;
      const ctx = cv.getContext("2d");
      if (!ctx || !staticRef.current) { requestAnimationFrame(loop); return; }

      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(staticRef.current, 0, 0, cw, ch);
      ctx.globalCompositeOperation = "lighter";

      // spawn flash dots — each main dot brings a cluster of smaller ones
      const spawnCount = Math.round((3 + Math.floor(Math.random() * 4)) * flashScale);
      for (let s = 0; s < spawnCount; s++) {
        const src = allSources[Math.floor(Math.random() * allSources.length)];
        const spread = (20 + src.weight * 45) * dpr * spreadBoost;
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * spread;
        const mainX = src.cx + Math.cos(angle) * dist;
        const mainY = src.cy + Math.sin(angle) * dist;
        flashDots.push({
          x: mainX, y: mainY,
          life: 0, maxLife: 40 + Math.random() * 60,
          r: (3.0 + Math.random() * 4.0) * dpr * sizeBoost,
        });
        const clusterCount = (isLargeScreen ? 5 : 3) + Math.floor(Math.random() * 5);
        for (let c = 0; c < clusterCount; c++) {
          const ca = Math.random() * Math.PI * 2;
          const cd = (4 + Math.random() * 16) * dpr * sizeBoost;
          flashDots.push({
            x: mainX + Math.cos(ca) * cd,
            y: mainY + Math.sin(ca) * cd,
            life: Math.floor(Math.random() * 8),
            maxLife: 25 + Math.random() * 40,
            r: (1.0 + Math.random() * 2.0) * dpr * sizeBoost,
          });
        }
      }

      // draw + update flash dots
      for (let i = flashDots.length - 1; i >= 0; i--) {
        const f = flashDots[i];
        f.life++;
        const p = f.life / f.maxLife;
        if (p >= 1) { flashDots.splice(i, 1); continue; }
        const a = p < 0.12 ? p / 0.12 : 1 - (p - 0.12) / 0.88;
        // Glow halos for flash dots on large screens
        if (isLargeScreen) {
          ctx.globalAlpha = a * 0.08;
          ctx.fillStyle = "rgb(50, 130, 240)";
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r * (0.8 + a) * 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = a * 0.25;
          ctx.fillStyle = "rgb(100, 180, 250)";
          ctx.beginPath();
          ctx.arc(f.x, f.y, f.r * (0.6 + a * 0.8) * 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = a * 0.75;
        ctx.fillStyle = isLargeScreen ? "rgb(210, 235, 255)" : "#cef";
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r * (0.4 + a * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }

      // clip to China boundary using Path2D fill (no full-res mask canvas needed)
      ctx.globalCompositeOperation = "destination-in";
      ctx.globalAlpha = 1;
      ctx.save();
      ctx.setTransform(dpr, 0, 0, dpr, 0, mapTop * dpr);
      ctx.fillStyle = "#fff";
      ctx.fill(chinaPath2D);
      ctx.restore();

      while (flashDots.length > 2000 * flashScale) flashDots.shift();

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    return () => { alive = false; };
  }, [projection, width, height, mapTop, chinaPaths]);

  return (
    <canvas
      ref={cvRef}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
};

export const ChinaMap = () => {
  const geo = useChinaGeoJson();
  const worldGeo = useWorldGeoJson();
  const mapRef = useRef<HTMLDivElement>(null);
  const { ref, size } = useSize<HTMLDivElement>();

  const W = size.width || 1;
  const H = size.height || 1;
  const mapTop = -5;

  const projection = useMemo(() => {
    if (!geo) return null;
    return createChinaProjection(W, H, geo, 14);
  }, [geo, W, H]);

  const path = useMemo(
    () => (projection ? buildPathFn(projection) : null),
    [projection]
  );

  const cleanedFeatures = useMemo(
    () => (geo ? cleanFeatures(geo.features as any[]) : []),
    [geo]
  );

  const provincePaths = useMemo(() => {
    if (!path) return [];
    return cleanedFeatures
      .map((f, idx) => ({
        id: f.properties?.adcode ?? idx,
        d: path(f as any) || "",
      }));
  }, [cleanedFeatures, path]);

  const worldPaths = useMemo(() => {
    if (!path || !worldGeo) return [];
    return worldGeo.features
      .filter((f: any) => f.properties?.name !== "China")
      .map((f: any, idx: number) => {
        const d = path(f as any);
        if (!d) return null;
        return { id: idx, d };
      })
      .filter(Boolean) as { id: number; d: string }[];
  }, [path, worldGeo]);

  const graticule = useMemo(() => {
    if (!projection) return { lats: [], lons: [] };
    const lats: string[] = [];
    const lons: string[] = [];
    for (let lat = 18; lat <= 50; lat += 5) {
      const pts: string[] = [];
      for (let lon = 73; lon <= 136; lon += 1) {
        const p = projectPoint(projection, [lon, lat]);
        if (p) pts.push(`${p[0]},${p[1]}`);
      }
      if (pts.length > 1) lats.push("M" + pts.join("L"));
    }
    for (let lon = 75; lon <= 135; lon += 10) {
      const pts: string[] = [];
      for (let lat = 16; lat <= 54; lat += 1) {
        const p = projectPoint(projection, [lon, lat]);
        if (p) pts.push(`${p[0]},${p[1]}`);
      }
      if (pts.length > 1) lons.push("M" + pts.join("L"));
    }
    return { lats, lons };
  }, [projection]);

  const keyCityProjected = useMemo(() => {
    if (!projection) return [];
    return KEY_CITIES.map((id) => {
      const c = CITY_NODES.find((n) => n.id === id);
      if (!c) return null;
      const p = projectPoint(projection, c.coord);
      if (!p) return null;
      return { id, name: c.name, x: p[0], y: p[1], tier: c.tier };
    }).filter(Boolean) as { id: string; name: string; x: number; y: number; tier: number }[];
  }, [projection]);

  const neighborProjected = useMemo(() => {
    if (!projection) return [];
    return NEIGHBOR_LABELS.map((n) => {
      const p = projectPoint(projection, n.coord);
      if (!p) return null;
      return { name: n.name, x: p[0], y: p[1] };
    }).filter(Boolean) as { name: string; x: number; y: number }[];
  }, [projection]);

  const chinaPathStrings = useMemo(() => provincePaths.map((p) => p.d), [provincePaths]);

  const flightLines = useMemo(() => {
    if (!projection) return [];
    return MAJOR_LINKS.map(([fromId, toId]) => {
      const fromNode = CITY_NODES.find((n) => n.id === fromId);
      const toNode = CITY_NODES.find((n) => n.id === toId);
      if (!fromNode || !toNode) return null;
      const fromPt = projectPoint(projection, fromNode.coord);
      const toPt = projectPoint(projection, toNode.coord);
      if (!fromPt || !toPt) return null;
      const mx = (fromPt[0] + toPt[0]) / 2;
      const my = (fromPt[1] + toPt[1]) / 2;
      const dx = toPt[0] - fromPt[0];
      const dy = toPt[1] - fromPt[1];
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) return null;
      const bend = dist * 0.18;
      const nx = -dy / dist;
      const ny = dx / dist;
      const cx = mx + nx * bend;
      const cy = my + ny * bend;
      const d = `M${fromPt[0]},${fromPt[1]} Q${cx},${cy} ${toPt[0]},${toPt[1]}`;
      const dRev = `M${toPt[0]},${toPt[1]} Q${cx},${cy} ${fromPt[0]},${fromPt[1]}`;
      const flyDur = 1.0 + (dist / 200) * 1.2;
      return { id: `${fromId}-${toId}`, d, dRev, flyDur };
    }).filter(Boolean) as { id: string; d: string; dRev: string; flyDur: number }[];
  }, [projection]);

  const flySeqRef = useRef(0);
  const [flyDots, setFlyDots] = useState<FlyDot[]>([]);
  const flightLinesRef = useRef(flightLines);
  flightLinesRef.current = flightLines;

  useEffect(() => {
    if (!flightLines.length) return;
    let alive = true;
    const fire = () => {
      if (!alive) return;
      const lines = flightLinesRef.current;
      const count = 2 + Math.floor(Math.random() * 4);
      const batch: FlyDot[] = [];
      for (let i = 0; i < count; i++) {
        const fl = lines[Math.floor(Math.random() * lines.length)];
        const reverse = Math.random() > 0.5;
        batch.push({
          id: flySeqRef.current++,
          pathD: reverse ? fl.dRev : fl.d,
          dur: fl.flyDur * (0.8 + Math.random() * 0.4),
        });
      }
      setFlyDots((prev) => [...prev.slice(-50), ...batch]);
      const maxDur = Math.max(...batch.map((b) => b.dur));
      const ids = batch.map((b) => b.id);
      window.setTimeout(() => {
        setFlyDots((prev) => prev.filter((d) => !ids.includes(d.id)));
      }, maxDur * 1000 + 100);
      window.setTimeout(fire, 400 + Math.random() * 800);
    };
    const t = window.setTimeout(fire, 300);
    return () => { alive = false; clearTimeout(t); };
  }, [flightLines]);

  const pulseSeqRef = useRef(0);
  const [cityPulses, setCityPulses] = useState<CityPulse[]>([]);
  const keyCityRef = useRef(keyCityProjected);
  keyCityRef.current = keyCityProjected;

  useEffect(() => {
    if (!keyCityProjected.length) return;
    let alive = true;
    const fire = () => {
      if (!alive) return;
      const cities = keyCityRef.current;
      const count = 2 + Math.floor(Math.random() * 3);
      const batch: CityPulse[] = [];
      for (let i = 0; i < count; i++) {
        const city = cities[Math.floor(Math.random() * cities.length)];
        batch.push({
          id: pulseSeqRef.current++,
          x: city.x,
          y: city.y,
          color: PULSE_COLORS[Math.floor(Math.random() * PULSE_COLORS.length)],
        });
      }
      setCityPulses((prev) => [...prev.slice(-25), ...batch]);
      const ids = batch.map((p) => p.id);
      window.setTimeout(() => {
        setCityPulses((prev) => prev.filter((p) => !ids.includes(p.id)));
      }, 2000);
      window.setTimeout(fire, 600 + Math.random() * 1000);
    };
    const t = window.setTimeout(fire, 400);
    return () => { alive = false; clearTimeout(t); };
  }, [keyCityProjected]);


  const [heatProvinces, setHeatProvinces] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!provincePaths.length) return;
    let alive = true;
    const fire = () => {
      if (!alive) return;
      const count = 2 + Math.floor(Math.random() * 4);
      const indices = new Set<number>();
      while (indices.size < count) {
        indices.add(Math.floor(Math.random() * provincePaths.length));
      }
      setHeatProvinces(indices);
      window.setTimeout(() => {
        if (alive) setHeatProvinces(new Set());
      }, 1200);
      window.setTimeout(fire, 800 + Math.random() * 1200);
    };
    const t = window.setTimeout(fire, 600);
    return () => { alive = false; clearTimeout(t); };
  }, [provincePaths.length]);

  const projectedSamples = useMemo(() => {
    if (!projection || !cleanedFeatures.length) return [];
    const pts: [number, number][] = [];
    for (const f of cleanedFeatures) {
      try {
        const [[minLon, minLat], [maxLon, maxLat]] = geoBounds(f as any);
        let attempts = 0;
        while (pts.length < 600 && attempts < 4000) {
          const lon = minLon + Math.random() * (maxLon - minLon);
          const lat = minLat + Math.random() * (maxLat - minLat);
          if (geoContains(f as any, [lon, lat])) {
            const p = projectPoint(projection, [lon, lat]);
            if (p) pts.push(p);
          }
          attempts++;
        }
      } catch { /* skip */ }
    }
    return pts;
  }, [projection, cleanedFeatures]);

  const projectedRef = useRef(projectedSamples);
  projectedRef.current = projectedSamples;

  const starSeqRef = useRef(1);
  const [stars, setStars] = useState<Spark[]>([]);

  useEffect(() => {
    if (!projectedSamples.length) return;
    let alive = true;
    const tick = () => {
      if (!alive) return;
      const pts = projectedRef.current;
      const count = 5 + Math.floor(Math.random() * 6);
      const batch: Spark[] = [];
      for (let i = 0; i < count; i++) {
        const pt = pts[Math.floor(Math.random() * pts.length)];
        batch.push({
          id: starSeqRef.current++,
          x: pt[0], y: pt[1],
          color: pickStarColor(),
          size: 1.5 + Math.random() * 2,
        });
      }
      setStars((prev) => [...prev.slice(-120), ...batch]);
      const ids = batch.map((s) => s.id);
      window.setTimeout(() => {
        setStars((prev) => prev.filter((s) => !ids.includes(s.id)));
      }, 1500 + Math.random() * 800);
    };
    const id = window.setInterval(tick, 80);
    return () => { alive = false; window.clearInterval(id); };
  }, [projectedSamples.length]); // eslint-disable-line

  const bizSeqRef = useRef(100000);
  const [bizSparks, setBizSparks] = useState<Spark[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const pts = projectedRef.current;
      if (!pts.length) return;
      const { color } = (e as CustomEvent).detail;
      const count = 3 + Math.floor(Math.random() * 3);
      const batch: Spark[] = [];
      for (let i = 0; i < count; i++) {
        const pt = pts[Math.floor(Math.random() * pts.length)];
        batch.push({ id: bizSeqRef.current++, x: pt[0], y: pt[1], color, size: 2.5 });
      }
      setBizSparks((prev) => [...prev.slice(-30), ...batch]);
      const ids = batch.map((s) => s.id);
      window.setTimeout(() => {
        setBizSparks((prev) => prev.filter((s) => !ids.includes(s.id)));
      }, 1800);
    };
    window.addEventListener("biz-spark", handler);
    return () => window.removeEventListener("biz-spark", handler);
  }, []);

  return (
    <div className="cm">
      <div className="cm-head">
        <span className="cm-bar" />
        全国业务覆盖 · 实时态势
      </div>
      <div className="cm-body">
        <div ref={ref} className="cm-map">
          <svg
            className="cm-svg"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <clipPath id="cm-china-clip">
                {provincePaths.map((p) => (
                  <path key={p.id} d={p.d} />
                ))}
              </clipPath>
              <radialGradient id="cm-pulse-grad">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.6" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </radialGradient>
            </defs>

            <g transform={`translate(0, ${mapTop})`}>
              {/* 周边国家轮廓（暗底） */}
              <g className="cm-world">
                {worldPaths.map((w) => (
                  <path key={w.id} d={w.d} className="cm-world-country" />
                ))}
              </g>

              <g className="cm-neighbor-labels">
                {neighborProjected.map((n) => (
                  <text
                    key={n.name}
                    x={n.x}
                    y={n.y}
                    className="cm-neighbor-label"
                    textAnchor="middle"
                  >
                    {n.name}
                  </text>
                ))}
              </g>

              <g className="cm-graticule">
                {graticule.lats.map((d, i) => <path key={`lat-${i}`} d={d} />)}
                {graticule.lons.map((d, i) => <path key={`lon-${i}`} d={d} />)}
              </g>

              <g className="cm-china">
                {provincePaths.map((p) => (
                  <path
                    key={p.id}
                    d={p.d}
                    fill="rgba(8, 18, 40, 0.3)"
                    stroke="rgba(80, 160, 220, 0.25)"
                    strokeWidth="0.6"
                    strokeLinejoin="round"
                  />
                ))}
              </g>

              <g className="cm-flights">
                {flightLines.map((fl) => (
                  <path key={fl.id} d={fl.d} className="cm-flight-line" />
                ))}
              </g>

              <g className="cm-fly-dots">
                {flyDots.map((fd) => (
                  <circle key={fd.id} r="2.5" className="cm-flight-dot">
                    <animateMotion
                      dur={`${fd.dur}s`}
                      begin="0s"
                      fill="freeze"
                      path={fd.pathD}
                    />
                  </circle>
                ))}
              </g>

              <g className="cm-pulses" clipPath="url(#cm-china-clip)">
                {cityPulses.map((p) => (
                  <g key={p.id} transform={`translate(${p.x},${p.y})`} style={{ color: p.color }}>
                    <circle r="3" fill="currentColor" opacity="0.8" className="cm-pulse-core" />
                    <circle r="6" fill="none" stroke="currentColor" strokeWidth="1.5" className="cm-pulse-ring1" />
                    <circle r="6" fill="none" stroke="currentColor" strokeWidth="0.8" className="cm-pulse-ring2" />
                  </g>
                ))}
              </g>

              <g className="cm-stars" clipPath="url(#cm-china-clip)">
                {stars.map((s) => (
                  <circle key={s.id} cx={s.x} cy={s.y} r={s.size} fill={s.color} className="cm-star" />
                ))}
              </g>

              <g className="cm-biz-sparks" clipPath="url(#cm-china-clip)">
                {bizSparks.map((s) => (
                  <g key={s.id} transform={`translate(${s.x},${s.y})`}>
                    <circle r="12" fill={s.color} opacity="0.1" className="cm-biz-wave" />
                    <circle r="4" fill={s.color} opacity="0.3" className="cm-biz-ring" />
                    <circle r={s.size} fill={s.color} className="cm-biz-core" />
                  </g>
                ))}
              </g>

              <g className="cm-cities">
                {keyCityProjected.map((c) => (
                  <g key={c.id} transform={`translate(${c.x},${c.y})`}>
                    <circle
                      r={c.tier === 1 ? 3 : 2}
                      fill={c.tier === 1 ? "#fff" : "rgba(155,231,255,0.8)"}
                      className="cm-city-dot"
                    />
                    {c.tier === 1 && (
                      <circle r="6" fill="none" stroke="rgba(86,196,255,0.4)" strokeWidth="0.8" className="cm-city-ring" />
                    )}
                    <text className="cm-city-label" x={0} y={-8} textAnchor="middle">
                      {c.name}
                    </text>
                  </g>
                ))}
              </g>
            </g>
          </svg>
          {projection && <HeatCanvas projection={projection} width={W} height={H} mapTop={mapTop} chinaPaths={chinaPathStrings} />}
        </div>

        <EventFeed />
      </div>

      {/* 底部心跳波形图 */}
      <WaveMonitor />
    </div>
  );
};
