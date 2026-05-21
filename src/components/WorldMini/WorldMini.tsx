import { useMemo } from "react";
import { geoEquirectangular, geoPath } from "d3-geo";
import { CHINA_REF_COORD, WORLD_COUNTRIES } from "../../data/regions";
import { useWorldGeoJson } from "../../utils/useWorldGeoJson";
import "./WorldMini.css";

/**
 * Global partnerships mini world map:
 *  - Renders with real world GeoJSON (all country outlines)
 *  - Uses geoEquirectangular fitSize to auto-scale to panel size
 *  - Highlights China + 4 overseas partners + arc connections
 *  - Bottom two-column list of 4 countries
 */

const W = 300;
const H = 150;

export const WorldMini = () => {
  const world = useWorldGeoJson();

  const projection = useMemo(() => {
    if (!world) return null;
    return geoEquirectangular().fitSize([W, H], world);
  }, [world]);

  const path = useMemo(() => (projection ? geoPath(projection) : null), [projection]);

  const countryPaths = useMemo(() => {
    if (!world || !path) return [];
    return (world.features as any[]).map((f, idx) => ({
      id: idx,
      name: f.properties?.name,
      d: path(f as any) || "",
      isChina: f.properties?.name === "China",
    }));
  }, [world, path]);

  const project = (coord: [number, number]): [number, number] => {
    if (!projection) return [0, 0];
    const p = projection(coord);
    return p ? [p[0], p[1]] : [0, 0];
  };

  const chinaPt = project(CHINA_REF_COORD);
  const partners = WORLD_COUNTRIES.map((w) => ({ ...w, pt: project(w.coord) }));

  return (
    <div className="wm">
      <div className="wm-head">
        <span className="wm-bar" />
        Global Partners
        <span className="wm-en">{WORLD_COUNTRIES.length} Countries</span>
      </div>

      <svg className="wm-svg" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="wm-china-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(86,196,255,0.85)" />
            <stop offset="100%" stopColor="rgba(86,196,255,0)" />
          </radialGradient>
          <radialGradient id="wm-partner-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(47,217,150,0.85)" />
            <stop offset="100%" stopColor="rgba(47,217,150,0)" />
          </radialGradient>
        </defs>

        {/* Lat/lon grid background */}
        <g className="wm-grid">
          {[1, 2, 3].map((i) => (
            <line
              key={`h-${i}`}
              x1="0"
              y1={(H * i) / 4}
              x2={W}
              y2={(H * i) / 4}
              stroke="rgba(86,196,255,0.06)"
              strokeWidth="0.5"
              strokeDasharray="2 4"
            />
          ))}
          {[1, 2, 3, 4, 5].map((i) => (
            <line
              key={`v-${i}`}
              x1={(W * i) / 6}
              y1="0"
              x2={(W * i) / 6}
              y2={H}
              stroke="rgba(86,196,255,0.06)"
              strokeWidth="0.5"
              strokeDasharray="2 4"
            />
          ))}
        </g>

        {/* Real country outlines */}
        <g className="wm-countries">
          {countryPaths.map((c) =>
            c.isChina ? (
              <path
                key={c.id}
                d={c.d}
                fill="rgba(86, 196, 255, 0.45)"
                stroke="rgba(155, 231, 255, 0.95)"
                strokeWidth="0.6"
                strokeLinejoin="round"
              />
            ) : (
              <path
                key={c.id}
                d={c.d}
                fill="rgba(28, 70, 140, 0.32)"
                stroke="rgba(120, 190, 240, 0.4)"
                strokeWidth="0.4"
                strokeLinejoin="round"
              />
            )
          )}
        </g>

        {/* Arcs: China -> 4 countries */}
        <g>
          {partners.map((p, i) => {
            const midX = (chinaPt[0] + p.pt[0]) / 2;
            const midY = Math.min(chinaPt[1], p.pt[1]) - 16;
            return (
              <g key={p.id}>
                <path
                  d={`M${chinaPt[0]},${chinaPt[1]} Q${midX},${midY} ${p.pt[0]},${p.pt[1]}`}
                  fill="none"
                  stroke="rgba(47,217,150,0.25)"
                  strokeWidth="0.7"
                />
                <path
                  d={`M${chinaPt[0]},${chinaPt[1]} Q${midX},${midY} ${p.pt[0]},${p.pt[1]}`}
                  fill="none"
                  stroke="rgba(47,217,150,0.95)"
                  strokeWidth="1"
                  strokeDasharray="3 12"
                  className="wm-arc"
                  style={{ animationDelay: `${i * 0.4}s` }}
                />
              </g>
            );
          })}
        </g>

        {/* China point */}
        <g transform={`translate(${chinaPt[0]},${chinaPt[1]})`}>
          <circle r="9" fill="url(#wm-china-glow)" />
          <circle r="3" fill="#56c4ff" className="wm-pulse" />
          <circle r="1.4" fill="#fff" />
          <text className="wm-china-label" x="0" y="-7" textAnchor="middle">China</text>
        </g>

        {/* 4 overseas points */}
        {partners.map((p) => (
          <g key={p.id} transform={`translate(${p.pt[0]},${p.pt[1]})`}>
            <circle r="7" fill="url(#wm-partner-glow)" />
            <circle r="2.3" fill="#2fd996" className="wm-pulse" />
            <circle r="1" fill="#fff" />
          </g>
        ))}
      </svg>

      <div className="wm-list">
        {WORLD_COUNTRIES.map((w) => (
          <div key={w.id} className="wm-item">
            <span className="wm-dot" />
            <div className="wm-text">
              <div className="wm-cn">{w.en}</div>
              <div className="wm-en-line">{w.en}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
