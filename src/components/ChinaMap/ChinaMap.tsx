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

const KEY_CITIES = [
  "bj", "sh", "gz", "sz", "cq",
  "cd", "wh", "hz", "nj", "cs",
  "xa", "jn", "sy", "hb", "fz",
  "km", "nn", "ur", "lz_lhasa", "hk_city",
];

type Spark = { id: number; x: number; y: number; color: string; size: number };

const starColors = ["#9be7ff", "#78d4ff", "#56c4ff", "#b0ecff", "#ffe9b3"];
const pickStarColor = () => starColors[Math.floor(Math.random() * starColors.length)];

const FLOAT_LABELS = [
  "审批通过", "风控识别", "¥48.3万", "¥12.7万", "+1笔放款",
  "合规校验", "¥156万", "授信完成", "+3笔撮合", "智能决策",
  "¥89.2万", "身份核验", "风险拦截", "¥23.5万", "贷后监控",
  "+5笔交易", "额度评估", "¥67.8万", "反欺诈", "信用评分",
  "秒级审批", "¥203万", "模型命中", "+8笔授信", "策略触发",
];
const LABEL_COLORS = ["#56c4ff", "#2fd996", "#a78bfa", "#ffb84d", "#ff5e6c"];

type CityPulse = { id: number; x: number; y: number; color: string };
type DataLabel = { id: number; x: number; y: number; text: string; color: string };
type FlyDot = { id: number; pathD: string; dur: number };

// ── 实时事件流数据 ──
const EVENT_TEMPLATES = [
  { action: "贷款审批通过", gen: () => `¥${(Math.random() * 200 + 5).toFixed(1)}万` },
  { action: "风控模型命中", gen: () => `${(Math.random() * 50 + 1).toFixed(0)}ms` },
  { action: "反欺诈拦截", gen: () => ["高风险", "中风险"][Math.floor(Math.random() * 2)] },
  { action: "授信额度评估", gen: () => `¥${(Math.random() * 100 + 10).toFixed(0)}万` },
  { action: "身份核验完成", gen: () => "已通过" },
  { action: "智能决策引擎", gen: () => `策略${Math.floor(Math.random() * 20 + 1)}号` },
  { action: "贷后监控预警", gen: () => ["低风险", "中风险"][Math.floor(Math.random() * 2)] },
  { action: "实时撮合完成", gen: () => `+${Math.floor(Math.random() * 5 + 1)}笔` },
  { action: "信用评分更新", gen: () => `${Math.floor(Math.random() * 200 + 600)}分` },
  { action: "合规校验通过", gen: () => "合规" },
  { action: "秒级放款完成", gen: () => `¥${(Math.random() * 80 + 3).toFixed(1)}万` },
  { action: "智能催收触达", gen: () => `批次${Math.floor(Math.random() * 50 + 1)}` },
];

const CITY_NAMES = ["北京", "上海", "广州", "深圳", "重庆", "成都", "武汉", "杭州", "南京", "长沙", "西安", "济南", "沈阳", "哈尔滨", "福州", "昆明", "南宁"];

type FeedEvent = {
  id: number;
  city: string;
  action: string;
  detail: string;
  color: string;
  time: string;
};

const genTime = () => {
  const h = String(Math.floor(Math.random() * 24)).padStart(2, "0");
  const m = String(Math.floor(Math.random() * 60)).padStart(2, "0");
  const s = String(Math.floor(Math.random() * 60)).padStart(2, "0");
  return `${h}:${m}:${s}`;
};

// ── 事件流组件 ──
const EventFeed = () => {
  const seqRef = useRef(0);
  const [events, setEvents] = useState<FeedEvent[]>([]);

  useEffect(() => {
    let alive = true;
    const fire = () => {
      if (!alive) return;
      const tpl = EVENT_TEMPLATES[Math.floor(Math.random() * EVENT_TEMPLATES.length)];
      const evt: FeedEvent = {
        id: seqRef.current++,
        city: CITY_NAMES[Math.floor(Math.random() * CITY_NAMES.length)],
        action: tpl.action,
        detail: tpl.gen(),
        color: LABEL_COLORS[Math.floor(Math.random() * LABEL_COLORS.length)],
        time: genTime(),
      };
      setEvents((prev) => [evt, ...prev].slice(0, 40));
      window.setTimeout(fire, 600 + Math.random() * 900);
    };
    fire();
    return () => { alive = false; };
  }, []);

  return (
    <div className="cm-feed">
      <div className="cm-feed-head">
        <span className="cm-feed-dot" />
        实时事件流
      </div>
      <div className="cm-feed-list">
        {events.map((e) => (
          <div key={e.id} className="cm-feed-item" style={{ "--ac": e.color } as React.CSSProperties}>
            <div className="cm-feed-row1">
              <span className="cm-feed-city">{e.city}</span>
              <span className="cm-feed-time">{e.time}</span>
            </div>
            <div className="cm-feed-row2">
              <span className="cm-feed-action">{e.action}</span>
              <span className="cm-feed-detail">{e.detail}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── 心电图波形：只往上跳，高度=请求量，颜色=业务类型 ──
const WAVE_SEGMENTS = [
  { label: "撮合放款", color: "#2fd996" },
  { label: "风控决策", color: "#56c4ff" },
  { label: "预警拦截", color: "#ff5e6c" },
  { label: "智能授信", color: "#a78bfa" },
];

type WavePt = { v: number; seg: number };
const waveBuffer: WavePt[] = [];
let waveT = 0;
let waveSeg = 0;
let waveSegLen = 0;

function drawWaves(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const w = canvas.width;
  const h = canvas.height;
  if (w < 1 || h < 1) return;
  const dpr = window.devicePixelRatio || 1;
  const maxPts = Math.ceil(w / dpr);

  for (let p = 0; p < 4; p++) {
    waveT++;
    if (waveSegLen <= 0) {
      waveSeg = (waveSeg + 1) % WAVE_SEGMENTS.length;
      waveSegLen = 80 + Math.floor(Math.random() * 200);
    }
    waveSegLen--;

    const t = waveT;
    let v = 0;
    v += Math.abs(Math.sin(t * 0.004)) * 0.15;
    v += Math.abs(Math.sin(t * 0.015 + 1.3)) * 0.12;
    v += Math.abs(Math.sin(t * 0.05 + 2.7)) * 0.1;
    v += Math.abs(Math.sin(t * 0.13)) * 0.06;
    v += Math.abs(Math.sin(t * 0.35 + 0.8)) * 0.04;
    v += Math.abs(Math.sin(t * 0.8 + 3.1)) * 0.03;
    v += Math.random() * 0.04;
    if (Math.random() < 0.01) v += Math.random() * 0.25 + 0.1;
    waveBuffer.push({ v: Math.min(0.95, v), seg: waveSeg });
  }
  while (waveBuffer.length > maxPts) waveBuffer.shift();

  ctx.clearRect(0, 0, w, h);

  const baseline = h * 0.88;
  const maxH = h * 0.8;
  const len = waveBuffer.length;

  // baseline
  ctx.save();
  ctx.strokeStyle = "rgba(180, 220, 255, 0.15)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, baseline);
  ctx.lineTo(w, baseline);
  ctx.stroke();
  ctx.restore();

  if (len < 2) return;

  // draw colored line segments
  let runStart = 0;
  for (let i = 1; i <= len; i++) {
    if (i < len && waveBuffer[i].seg === waveBuffer[i - 1].seg) continue;

    const seg = WAVE_SEGMENTS[waveBuffer[runStart].seg];

    ctx.save();
    ctx.strokeStyle = seg.color;
    ctx.lineWidth = 1 * dpr;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    for (let j = runStart; j < i; j++) {
      const x = (j / (maxPts - 1)) * w;
      const y = baseline - waveBuffer[j].v * maxH;
      j === runStart ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();

    runStart = i;
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

    const loop = () => {
      if (!alive) return;
      drawWaves(cv);
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

export const ChinaMap = () => {
  const geo = useChinaGeoJson();
  const worldGeo = useWorldGeoJson();
  const mapRef = useRef<HTMLDivElement>(null);
  const { ref, size } = useSize<HTMLDivElement>();

  const W = size.width || 1;
  const H = size.height || 1;
  const mapTop = 8;

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
    return cleanedFeatures.map((f, idx) => ({
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
          color: LABEL_COLORS[Math.floor(Math.random() * LABEL_COLORS.length)],
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

  const labelSeqRef = useRef(0);
  const [dataLabels, setDataLabels] = useState<DataLabel[]>([]);

  useEffect(() => {
    if (!keyCityProjected.length) return;
    let alive = true;
    const fire = () => {
      if (!alive) return;
      const cities = keyCityRef.current;
      const count = 1 + Math.floor(Math.random() * 2);
      const batch: DataLabel[] = [];
      for (let i = 0; i < count; i++) {
        const city = cities[Math.floor(Math.random() * cities.length)];
        batch.push({
          id: labelSeqRef.current++,
          x: city.x + (Math.random() - 0.5) * 40,
          y: city.y - 8 - Math.random() * 12,
          text: FLOAT_LABELS[Math.floor(Math.random() * FLOAT_LABELS.length)],
          color: LABEL_COLORS[Math.floor(Math.random() * LABEL_COLORS.length)],
        });
      }
      setDataLabels((prev) => [...prev.slice(-18), ...batch]);
      const ids = batch.map((l) => l.id);
      window.setTimeout(() => {
        setDataLabels((prev) => prev.filter((l) => !ids.includes(l.id)));
      }, 2800);
      window.setTimeout(fire, 500 + Math.random() * 700);
    };
    const t = window.setTimeout(fire, 800);
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
        <span className="cm-meta">
          覆盖 <em className="cm-em num">31</em> 省 · <em className="cm-em num">367</em> 城市
        </span>
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

              <g className="cm-graticule">
                {graticule.lats.map((d, i) => <path key={`lat-${i}`} d={d} />)}
                {graticule.lons.map((d, i) => <path key={`lon-${i}`} d={d} />)}
              </g>

              <g className="cm-china">
                {provincePaths.map((p, idx) => (
                  <path
                    key={p.id}
                    d={p.d}
                    fill={heatProvinces.has(idx)
                      ? "rgba(86, 196, 255, 0.18)"
                      : "rgba(26, 64, 130, 0.22)"}
                    stroke={heatProvinces.has(idx)
                      ? "rgba(120, 200, 255, 0.75)"
                      : "rgba(120, 190, 240, 0.55)"}
                    strokeWidth="0.9"
                    strokeLinejoin="round"
                    className="cm-province"
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

              <g className="cm-data-labels" clipPath="url(#cm-china-clip)">
                {dataLabels.map((l) => (
                  <text key={l.id} x={l.x} y={l.y} fill={l.color} className="cm-data-label">
                    {l.text}
                  </text>
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
        </div>

        <EventFeed />
      </div>

      {/* 底部心跳波形图 */}
      <WaveMonitor />
    </div>
  );
};
