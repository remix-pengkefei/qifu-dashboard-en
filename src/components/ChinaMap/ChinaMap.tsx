import { useEffect, useMemo, useRef, useState } from "react";
import { useChinaGeoJson } from "../../utils/useGeoJson";
import { useSize } from "../../utils/useSize";
import {
  buildPathFn,
  cleanFeatures,
  createChinaProjection,
  geoBounds,
  geoContains,
  projectPoint,
} from "../../utils/projection";
import { CITY_NODES } from "../../data/regions";
import { WorldMini } from "../WorldMini/WorldMini";
import "./ChinaMap.css";

/** 只标注主要城市 */
const KEY_CITIES = [
  "bj", "sh", "gz", "sz", "cq",
  "cd", "wh", "hz", "nj", "cs",
  "xa", "jn", "sy", "hb", "fz",
  "km", "nn", "ur", "lz_lhasa", "hk_city",
];

type Spark = { id: number; x: number; y: number; color: string; size: number };

/** 星光底色 — 明亮冷色调 */
const starColors = [
  "#9be7ff",
  "#78d4ff",
  "#56c4ff",
  "#b0ecff",
  "#ffe9b3",
];
const pickStarColor = () => starColors[Math.floor(Math.random() * starColors.length)];

export const ChinaMap = () => {
  const geo = useChinaGeoJson();
  const { ref, size } = useSize<HTMLDivElement>();

  const W = size.width || 1;
  const H = size.height || 1;
  const mapTop = 8;
  const mapH = Math.max(H - 16, 100);
  const mapW = W;

  const projection = useMemo(() => {
    if (!geo) return null;
    return createChinaProjection(mapW, mapH, geo, 14);
  }, [geo, mapW, mapH]);

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

  // 经纬度网格线
  const graticule = useMemo(() => {
    if (!projection) return { lats: [], lons: [] };
    const lats: string[] = [];
    const lons: string[] = [];
    // 纬线 18°~50°，每 5°
    for (let lat = 18; lat <= 50; lat += 5) {
      const pts: string[] = [];
      for (let lon = 73; lon <= 136; lon += 1) {
        const p = projectPoint(projection, [lon, lat]);
        if (p) pts.push(`${p[0]},${p[1]}`);
      }
      if (pts.length > 1) lats.push("M" + pts.join("L"));
    }
    // 经线 75°~135°，每 10°
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

  // 主要城市投影
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

  // 上海 → 各主要城市飞线
  const flightLines = useMemo(() => {
    if (!projection) return [];
    const shNode = CITY_NODES.find((n) => n.id === "sh");
    if (!shNode) return [];
    const shPt = projectPoint(projection, shNode.coord);
    if (!shPt) return [];
    const targets = [
      "bj", "gz", "sz", "cq", "cd", "wh", "cs", "xa",
      "sy", "hb", "km", "nn", "fz", "jn", "hz", "nj", "ur",
    ];
    return targets.map((tid) => {
      const tc = CITY_NODES.find((n) => n.id === tid);
      if (!tc) return null;
      const tPt = projectPoint(projection, tc.coord);
      if (!tPt) return null;
      const mx = (shPt[0] + tPt[0]) / 2;
      const my = (shPt[1] + tPt[1]) / 2;
      const dx = tPt[0] - shPt[0];
      const dy = tPt[1] - shPt[1];
      const dist = Math.sqrt(dx * dx + dy * dy);
      const bend = dist * 0.2;
      const nx = -dy / dist;
      const ny = dx / dist;
      const cx = mx + nx * bend;
      const cy = my + ny * bend;
      const d = `M${shPt[0]},${shPt[1]} Q${cx},${cy} ${tPt[0]},${tPt[1]}`;
      // 飞行时长按距离：近的快，远的慢
      const flyDur = 1.8 + (dist / 200) * 1.5;
      return { id: tid, d, flyDur };
    }).filter(Boolean) as { id: string; d: string; flyDur: number }[];
  }, [projection]);

  // 随机发射飞行光点
  type FlyDot = { id: number; pathD: string; dur: number };
  const flySeqRef = useRef(0);
  const [flyDots, setFlyDots] = useState<FlyDot[]>([]);

  useEffect(() => {
    if (!flightLines.length) return;
    let alive = true;
    const fire = () => {
      if (!alive) return;
      // 随机挑 1~3 条线同时发射
      const count = 1 + Math.floor(Math.random() * 3);
      const picked = new Set<number>();
      while (picked.size < count) {
        picked.add(Math.floor(Math.random() * flightLines.length));
      }
      const batch: FlyDot[] = [];
      picked.forEach((idx) => {
        const fl = flightLines[idx];
        batch.push({ id: flySeqRef.current++, pathD: fl.d, dur: fl.flyDur });
      });
      setFlyDots((prev) => [...prev.slice(-20), ...batch]);
      // 最长的飞完后清除
      const maxDur = Math.max(...batch.map((b) => b.dur));
      const ids = batch.map((b) => b.id);
      window.setTimeout(() => {
        setFlyDots((prev) => prev.filter((d) => !ids.includes(d.id)));
      }, maxDur * 1000 + 100);
      // 下一次发射间隔 1.5~4s
      window.setTimeout(fire, 1500 + Math.random() * 2500);
    };
    const initTimer = window.setTimeout(fire, 500);
    return () => { alive = false; clearTimeout(initTimer); };
  }, [flightLines]);

  // 预生成大量省份内部采样点
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

  // ── 星光层：高频持续闪烁 ──
  const starSeqRef = useRef(1);
  const [stars, setStars] = useState<Spark[]>([]);

  useEffect(() => {
    if (!projectedSamples.length) return;
    let alive = true;

    const tick = () => {
      if (!alive) return;
      const pts = projectedRef.current;
      // 每次冒 5~10 个星光
      const count = 5 + Math.floor(Math.random() * 6);
      const batch: Spark[] = [];
      for (let i = 0; i < count; i++) {
        const pt = pts[Math.floor(Math.random() * pts.length)];
        batch.push({
          id: starSeqRef.current++,
          x: pt[0],
          y: pt[1],
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

    // 每 80ms 一波
    const id = window.setInterval(tick, 80);
    return () => { alive = false; window.clearInterval(id); };
  }, [projectedSamples.length]); // eslint-disable-line

  // ── 业务联动彩色亮点 ──
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
    <div ref={ref} className="cm">
      <div className="cm-head">
        <span className="cm-bar" />
        全国业务覆盖 · 实时态势
        <span className="cm-meta">
          覆盖 <em className="cm-em num">31</em> 省 · <em className="cm-em num">367</em> 城市
        </span>
      </div>
      <svg
        className="cm-svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* 中国版图裁切区域 */}
        <defs>
          <clipPath id="cm-china-clip">
            {provincePaths.map((p) => (
              <path key={p.id} d={p.d} />
            ))}
          </clipPath>
        </defs>

        <g transform={`translate(0, ${mapTop})`}>
          {/* 经纬度网格 */}
          <g className="cm-graticule">
            {graticule.lats.map((d, i) => (
              <path key={`lat-${i}`} d={d} />
            ))}
            {graticule.lons.map((d, i) => (
              <path key={`lon-${i}`} d={d} />
            ))}
          </g>

          {/* 省份轮廓 */}
          <g className="cm-china">
            {provincePaths.map((p) => (
              <path
                key={p.id}
                d={p.d}
                fill="rgba(26, 64, 130, 0.22)"
                stroke="rgba(120, 190, 240, 0.55)"
                strokeWidth="0.9"
                strokeLinejoin="round"
                className="cm-province"
              />
            ))}
          </g>

          {/* 上海飞线 — 静态底线 */}
          <g className="cm-flights">
            {flightLines.map((fl) => (
              <path key={fl.id} d={fl.d} className="cm-flight-line" />
            ))}
          </g>
          {/* 飞行光点 — 随机发射 */}
          <g className="cm-fly-dots">
            {flyDots.map((fd) => (
              <circle key={fd.id} r="3" className="cm-flight-dot">
                <animateMotion
                  dur={`${fd.dur}s`}
                  begin="0s"
                  fill="freeze"
                  path={fd.pathD}
                />
              </circle>
            ))}
          </g>

          {/* 星光层 — 裁切到中国版图内 */}
          <g className="cm-stars" clipPath="url(#cm-china-clip)">
            {stars.map((s) => (
              <circle
                key={s.id}
                cx={s.x}
                cy={s.y}
                r={s.size}
                fill={s.color}
                className="cm-star"
              />
            ))}
          </g>

          {/* 业务联动彩色亮点 — 裁切到中国版图内 */}
          <g className="cm-biz-sparks" clipPath="url(#cm-china-clip)">
            {bizSparks.map((s) => (
              <g key={s.id} transform={`translate(${s.x},${s.y})`}>
                <circle r="12" fill={s.color} opacity="0.1" className="cm-biz-wave" />
                <circle r="4" fill={s.color} opacity="0.3" className="cm-biz-ring" />
                <circle r={s.size} fill={s.color} className="cm-biz-core" />
              </g>
            ))}
          </g>

          {/* 主要城市标注 */}
          <g className="cm-cities">
            {keyCityProjected.map((c) => (
              <g key={c.id} transform={`translate(${c.x},${c.y})`}>
                <circle
                  r={c.tier === 1 ? 2.5 : 1.8}
                  fill={c.tier === 1 ? "#9be7ff" : "rgba(155,231,255,0.6)"}
                  className="cm-city-dot"
                />
                <text className="cm-city-label" x={0} y={-6} textAnchor="middle">
                  {c.name}
                </text>
              </g>
            ))}
          </g>
        </g>
      </svg>

      <WorldMini />
    </div>
  );
};
