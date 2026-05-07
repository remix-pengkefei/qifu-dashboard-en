import { useEffect, useState } from "react";

let cache: any | null = null;
let pending: Promise<any> | null = null;

export const useChinaGeoJson = () => {
  const [geo, setGeo] = useState<any | null>(cache);
  useEffect(() => {
    if (cache) return;
    if (!pending) {
      pending = fetch("/geo/china.json").then((r) => r.json());
    }
    pending.then((d) => {
      cache = d;
      setGeo(d);
    });
  }, []);
  return geo;
};

let worldCache: any | null = null;
let worldPending: Promise<any> | null = null;

export const useWorldGeoJson = () => {
  const [geo, setGeo] = useState<any | null>(worldCache);
  useEffect(() => {
    if (worldCache) return;
    if (!worldPending) {
      worldPending = fetch("/geo/world.json").then((r) => r.json());
    }
    worldPending.then((d) => {
      worldCache = d;
      setGeo(d);
    });
  }, []);
  return geo;
};
