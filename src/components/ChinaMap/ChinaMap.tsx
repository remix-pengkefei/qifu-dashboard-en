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
import { CITY_NODES, MAJOR_LINKS } from "../../data/regions";
import { WorldMini } from "../WorldMini/WorldMini";
import "./ChinaMap.css";

const tierStyle: Record<
  number,
  { r: number; color: string; ring: string; labelSize: number }
> = {
  1: { r: 4.5, color: "#ffe9b3", ring: "rgba(255,233,179,0.45)", labelSize: 12 },
  2: { r: 3.4, color: "#9be7ff", ring: "rgba(155,231,255,0.32)", labelSize: 10 },
  3: { r: 2.6, color: "#9be7ff", ring: "rgba(155,231,255,0.22)", labelSize: 9 },
  4: { r: 4.2, color: "#2fd996", ring: "rgba(47,217,150,0.4)", labelSize: 11 },
};

type Spark = { id: number; x: number; y: number; bornAt: number };

export const ChinaMap = () => {
  const geo = useChinaGeoJson();
  const { ref, size } = useSize<HTMLDivElement>();

  const W = size.width || 1;
  const H = size.height || 1;

  const mapTop = 8;
  const mapBottom = H - 8;
  const mapH = Math.max(mapBottom - mapTop, 100);
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
      name: f.properties?.name,
    }));
  }, [cleanedFeatures, path]);

  // 预生成每个省份内部的随机采样点（经纬度），用于"业务发生"微闪
  const provinceSamples = useMemo(() => {
    if (!cleanedFeatures.length) return [];
    const out: { feature: any; samples: [number, number][] }[] = [];
    for (const f of cleanedFeatures) {
      try {
        const [[minLon, minLat], [maxLon, maxLat]] = geoBounds(f as any);
        const samples: [number, number][] = [];
        let attempts = 0;
        // 尝试取 80 个样本点，最多尝试 1500 次
        while (samples.length < 80 && attempts < 1500) {
          const lon = minLon + Math.random() * (maxLon - minLon);
          const lat = minLat + Math.random() * (maxLat - minLat);
          if (geoContains(f as any, [lon, lat])) {
            samples.push([lon, lat]);
          }
          attempts++;
        }
        if (samples.length > 0) out.push({ feature: f, samples });
      } catch {
        /* skip */
      }
    }
    return out;
  }, [cleanedFeatures]);

  // 把样本点投影到 SVG 坐标
  const projectedSamples = useMemo(() => {
    if (!projection) return [];
    return provinceSamples
      .map(({ samples }) =>
        samples
          .map((s) => projectPoint(projection, s))
          .filter((p) => p) as [number, number][]
      )
      .flat();
  }, [projection, provinceSamples]);

  const cityProjected = useMemo(() => {
    if (!projection) return new Map();
    const m = new Map<
      string,
      { x: number; y: number; tier: 1 | 2 | 3 | 4; name: string; zone: string }
    >();
    for (const c of CITY_NODES) {
      const p = projectPoint(projection, c.coord);
      if (p) m.set(c.id, { x: p[0], y: p[1], tier: c.tier, name: c.name, zone: c.zone });
    }
    return m;
  }, [projection]);

  const internalLinks = useMemo(() => {
    const out: { from: string; to: string; x1: number; y1: number; x2: number; y2: number }[] = [];
    for (const [a, b] of MAJOR_LINKS) {
      const A = cityProjected.get(a);
      const B = cityProjected.get(b);
      if (A && B) out.push({ from: a, to: b, x1: A.x, y1: A.y, x2: B.x, y2: B.y });
    }
    return out;
  }, [cityProjected]);

  // ─── 业务发生微闪：每 ~150ms 在某个省内随机一个点冒一次小光，1.2s 后消失 ───
  const sparkSeqRef = useRef(1);
  const [sparks, setSparks] = useState<Spark[]>([]);

  useEffect(() => {
    if (!projectedSamples.length) return;
    let alive = true;
    const tick = () => {
      if (!alive) return;
      const pt = projectedSamples[Math.floor(Math.random() * projectedSamples.length)];
      const id = sparkSeqRef.current++;
      const now = performance.now();
      setSparks((prev) => [...prev.slice(-40), { id, x: pt[0], y: pt[1], bornAt: now }]);
      // 1300ms 后清除
      window.setTimeout(() => {
        setSparks((prev) => prev.filter((s) => s.id !== id));
      }, 1300);
    };
    const interval = window.setInterval(tick, 130 + Math.random() * 80);
    return () => {
      alive = false;
      window.clearInterval(interval);
    };
  }, [projectedSamples]);

  return (
    <div ref={ref} className="cm">
      <svg
        className="cm-svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <radialGradient id="cm-spark-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(255,233,179,0.95)" />
            <stop offset="60%" stopColor="rgba(255,233,179,0.18)" />
            <stop offset="100%" stopColor="rgba(255,233,179,0)" />
          </radialGradient>
        </defs>

        {/* 地图层（包括省份+链路+城市点）整体下移 mapTop */}
        <g transform={`translate(0, ${mapTop})`}>
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

          <g className="cm-links">
            {internalLinks.map((l, i) => (
              <line
                key={i}
                x1={l.x1}
                y1={l.y1}
                x2={l.x2}
                y2={l.y2}
                stroke="rgba(86,196,255,0.16)"
                strokeWidth="0.7"
              />
            ))}
          </g>

          {/* 业务发生微闪 — 在省份内随机点 */}
          <g className="cm-sparks">
            {sparks.map((s) => (
              <g key={s.id} transform={`translate(${s.x},${s.y})`}>
                <circle r="6" fill="url(#cm-spark-glow)" className="cm-spark-halo" />
                <circle r="1.2" fill="#fff5d6" className="cm-spark-dot" />
              </g>
            ))}
          </g>

          {/* 省会 / 直辖市 / 经济强市 — 常显，不闪 */}
          <g>
            {Array.from(cityProjected.entries()).map(([id, c]) => {
              const s = tierStyle[c.tier];
              return (
                <g key={id} transform={`translate(${c.x},${c.y})`} className="cm-node">
                  {c.tier <= 2 && (
                    <circle r={s.r * 2.2} fill={s.ring} className="cm-node-ring" />
                  )}
                  <circle r={s.r} fill={s.color} className="cm-node-dot" />
                  <circle r={s.r * 0.45} fill="#fff" />
                  <text
                    className="cm-node-label"
                    x={0}
                    y={-s.r - 5}
                    textAnchor="middle"
                    fontSize={s.labelSize}
                  >
                    {c.name}
                  </text>
                </g>
              );
            })}
          </g>
        </g>
      </svg>

      {/* 右下：海外合作迷你世界图 */}
      <WorldMini />
    </div>
  );
};
