import { geoPath, geoTransform, geoContains, geoBounds } from "d3-geo";

export { geoContains, geoBounds };

/**
 * China map custom projection:
 *  - Auto-fits using real GeoJSON lat/lon boundaries (precise)
 *  - Applies cos(meanLat) compression on longitude (China mean lat ~36 deg, cos~0.81)
 *    for more proportional rendering instead of geoIdentity's 1:1 flat mapping
 *  - Avoids d3-geo Mercator sphere clipping to prevent winding inconsistencies
 */

const cleanFeatures = (features: any[]) => {
  return features
    .filter((f) => f?.properties?.name && f.properties.name.trim().length > 0)
    .map((f) => {
      // Hainan: keep only main island (lat > 17), remove Sansha
      if (f.properties?.name === "海南省" && f.geometry?.type === "MultiPolygon") {
        const filtered = f.geometry.coordinates.filter((poly: any[][]) =>
          poly[0].some((pt: number[]) => pt[1] > 17)
        );
        return { ...f, geometry: { ...f.geometry, coordinates: filtered } };
      }
      return f;
    });
};

type ProjectFn = (coord: [number, number]) => [number, number];

export type ChinaProjection = ProjectFn & {
  /** For geoPath compatibility: wrap ProjectFn as a geoTransform-style stream */
  stream?: any;
  meanLat: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  cosLat: number;
};

/**
 * Create a China projection function with cos(lat) correction.
 * Returns a (lon, lat) -> (x, y) function with a d3-geo compatible stream.
 */
export const createChinaProjection = (
  width: number,
  height: number,
  geo: any,
  margin = 16
): ChinaProjection => {
  const cleaned = cleanFeatures(geo.features as any[]);

  // Collect all points to compute bbox
  let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
  const visit = (c: any) => {
    if (typeof c[0] === "number") {
      if (c[0] < minLon) minLon = c[0];
      if (c[0] > maxLon) maxLon = c[0];
      if (c[1] < minLat) minLat = c[1];
      if (c[1] > maxLat) maxLat = c[1];
      return;
    }
    for (const x of c) visit(x);
  };
  for (const f of cleaned) visit(f.geometry.coordinates);

  const meanLat = (minLat + maxLat) / 2;
  const cosLat = Math.cos((meanLat * Math.PI) / 180);

  const dataW = (maxLon - minLon) * cosLat;
  const dataH = maxLat - minLat;

  const usableW = Math.max(width - margin * 2, 100);
  const usableH = Math.max(height - margin * 2, 100);

  const scale = Math.min(usableW / dataW, usableH / dataH);

  const renderedW = dataW * scale;
  const renderedH = dataH * scale;

  const offsetX = (width - renderedW) / 2;
  const offsetY = (height - renderedH) / 2;

  const project: ProjectFn = ([lon, lat]) => [
    offsetX + (lon - minLon) * cosLat * scale,
    offsetY + (maxLat - lat) * scale,
  ];

  const fn = project as ChinaProjection;
  fn.meanLat = meanLat;
  fn.scale = scale;
  fn.offsetX = offsetX;
  fn.offsetY = offsetY;
  fn.cosLat = cosLat;

  return fn;
};

/** Wrap ChinaProjection as a d3-geo compatible stream for geoPath */
export const buildPathFn = (projection: ChinaProjection) => {
  const transform = geoTransform({
    point(lon: number, lat: number) {
      const [x, y] = projection([lon, lat]);
      (this as any).stream.point(x, y);
    },
  });
  return geoPath(transform as any);
};

export const projectPoint = (
  projection: ChinaProjection,
  coord: [number, number]
): [number, number] | null => {
  const p = projection(coord);
  return p && Number.isFinite(p[0]) ? p : null;
};

export { cleanFeatures };
