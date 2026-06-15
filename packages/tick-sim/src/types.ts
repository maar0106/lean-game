import type { VariabilityLevel } from "./constants.js";

export interface StopConfig {
  id: string;
  /** Pieces consumed per takt cycle */
  usagePerCycle: number;
  variability: VariabilityLevel;
  /** Maximum pieces that can sit lineside at this stop */
  linesideMax: number;
  /** Pieces per container (kanban bin size) — delivery replenishes qty×piecesPerContainer pieces */
  piecesPerContainer: number;
  /** Distance in feet from the previous stop in the route (index 0 = supermarket → stop 0) */
  distanceFromPrev: number;
}

export interface RouteConfig {
  /** Ordered stop IDs (supermarket is implicit start/end) */
  stopSequence: string[];
  /** Relaunch interval in seconds (0 = continuous loop) */
  cadenceSeconds: number;
  /** Pieces delivered per visit, keyed by stop ID */
  quantityPerStop: Record<string, number>;
}

export interface ScenarioConfig {
  seed: number;
  shiftLengthSeconds: number;
  taktSeconds: number;
  stops: StopConfig[];
  /** Feet from last stop back to supermarket */
  returnDistanceFeet: number;
}

/** Per-second state snapshot for one stop */
export interface StopSnapshot {
  inventory: number;
  isDown: boolean;
}

export interface SimTick {
  second: number;
  stops: Record<string, StopSnapshot>;
  tuggerPositionFraction: number; // 0–1 along current segment
  tuggerSegment: string; // "supermarket→{id}" | "{id}→{id}" | "{id}→supermarket"
  tuggerState: "picking" | "traveling" | "serving";
  activeStop: string | null;
}

export interface SimResult {
  ticks: SimTick[];
  /** Inventory time-series per stop (indexed by second) */
  inventoryBySec: Record<string, number[]>;
  downMinutesPerStop: Record<string, number>;
  totalTravelFeet: number;
  totalPickingSeconds: number;
  avgLinesideInventory: number;
  peakLinesideInventory: number;
  deliveriesMade: number;
  uptimePercent: number;
  score: number;
}

export interface ScoreWeights {
  serviceLevel: number;   // points multiplier for uptime%
  inventoryCost: number;  // per piece avg lineside
  travelCost: number;     // per 1000 feet
  stockoutPenalty: number; // multiplier on down-minutes
}
