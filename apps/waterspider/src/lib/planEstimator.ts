/**
 * Pre-run cycle time estimator — mirrors the workbook Delivery Route Calc sheet.
 * Same arithmetic the tick sim uses, so the player plans with accurate numbers.
 */

const A = 6;        // walk tugger ↔ cart (s)
const B = 0.272;    // travel per foot (s)
const C = 3.9;      // mount/dismount (s)
const D = 12;       // deliver full + pick up empty, per container (s)
const E = 27.4;     // supermarket locate-and-pick, per container (s)

export interface CycleEstimate {
  pickSeconds: number;
  travelSeconds: number;
  serviceSeconds: number;
  totalSeconds: number;
  totalMinutes: number;
  totalFeet: number;
  totalContainers: number;
}

export function estimateCycle(
  stopCount: number,
  totalContainers: number,
  totalFeet: number
): CycleEstimate {
  const pickSeconds = totalContainers * E;
  const travelSeconds = totalFeet * B;
  const serviceSeconds =
    stopCount * (A + C) + totalContainers * D;
  const totalSeconds = pickSeconds + travelSeconds + serviceSeconds;
  return {
    pickSeconds,
    travelSeconds,
    serviceSeconds,
    totalSeconds,
    totalMinutes: totalSeconds / 60,
    totalFeet,
    totalContainers,
  };
}
