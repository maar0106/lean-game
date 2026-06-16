import type { Layout, RouteStop } from "./types.js";

/** Build a lookup: "A→B" => feet */
export function buildSegmentMap(layout: Layout): Map<string, number> {
  const m = new Map<string, number>();
  for (const seg of layout.pathSegments) {
    m.set(`${seg.from}→${seg.to}`, seg.feet);
    m.set(`${seg.to}→${seg.from}`, seg.feet); // bidirectional
  }
  return m;
}

export function routeTotalFeet(
  sequence: RouteStop[],
  segMap: Map<string, number>
): number {
  if (sequence.length === 0) return 0;
  const ids = ["supermarket", ...sequence.map((s) => s.stopId), "supermarket"];
  let total = 0;
  for (let i = 0; i < ids.length - 1; i++) {
    total += segMap.get(`${ids[i]}→${ids[i + 1]}`) ?? 0;
  }
  return total;
}
