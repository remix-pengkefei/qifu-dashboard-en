import { geoPath, geoTransform, geoContains, geoBounds } from "d3-geo";

export { geoContains, geoBounds };

/**
 * 中国地图自定义投影：
 *  - 自动用 GeoJSON 真实经纬度边界做 fit（精确）
 *  - 经度做 cos(meanLat) 压缩（中国均纬 ~36°，cos≈0.81），让地图比例更"圆润"
 *    而不是 geoIdentity 那种把经纬度当 1:1 直接映射造成的"太扁"
 *  - 不走 d3-geo Mercator 球面裁剪，避免 winding 不一致问题
 */

const cleanFeatures = (features: any[]) => {
  return features
    .filter((f) => f?.properties?.name && f.properties.name.trim().length > 0)
    .map((f) => {
      // 海南省：只保留主岛（lat > 17），去除三沙
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
  /** 让 geoPath 能用：把 ProjectFn 包成 geoTransform 风格的 stream */
  stream?: any;
  meanLat: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  cosLat: number;
};

/**
 * 创建带 cos(lat) 校正的中国投影函数。
 * 返回一个 (lon, lat) → (x, y) 的函数，同时附带 d3-geo 兼容的 stream。
 */
export const createChinaProjection = (
  width: number,
  height: number,
  geo: any,
  margin = 16
): ChinaProjection => {
  const cleaned = cleanFeatures(geo.features as any[]);

  // 收集所有点求 bbox
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

/** 把 ChinaProjection 包成 d3-geo 可用的 stream，再喂给 geoPath */
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
