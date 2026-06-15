/** Seeded deterministic PRNG (mulberry32) — same sequence in Node and browser */
export function makeRng(seed: number) {
  let s = seed >>> 0;
  return function (): number {
    s += 0x6d2b79f5;
    let z = s;
    z = Math.imul(z ^ (z >>> 15), z | 1);
    z ^= z + Math.imul(z ^ (z >>> 7), z | 61);
    return ((z ^ (z >>> 14)) >>> 0) / 0x100000000;
  };
}

/** Box-Muller normal sample using the RNG */
export function normalSample(rng: () => number, mean: number, cv: number): number {
  if (cv === 0) return mean;
  const u1 = Math.max(rng(), 1e-10);
  const u2 = rng();
  const std = mean * cv;
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.max(0, mean + std * z);
}
