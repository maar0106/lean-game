import { TASK_TIMES, VARIABILITY_CV } from "./constants.js";
import { makeRng, normalSample } from "./rng.js";
import type {
  ScenarioConfig,
  RouteConfig,
  SimResult,
  SimTick,
  StopSnapshot,
  ScoreWeights,
} from "./types.js";

const DEFAULT_WEIGHTS: ScoreWeights = {
  serviceLevel: 10000,
  inventoryCost: 50,
  travelCost: 1,
  stockoutPenalty: 5,
};

/**
 * Compute route cycle time in seconds using the workbook Delivery Route Calc formula.
 * Useful pre-run for the plan estimator (W1).
 */
export function computeRouteCycleTime(
  stopCount: number,
  totalContainersPerRun: number,
  totalFeet: number
): number {
  const pickTime = totalContainersPerRun * TASK_TIMES.E_SUPERMARKET_PER_ITEM;
  const travelTime = totalFeet * TASK_TIMES.B_TRAVEL_PER_FOOT;
  const serviceTime =
    stopCount * (TASK_TIMES.A_WALK + TASK_TIMES.C_MOUNT_DISMOUNT) +
    totalContainersPerRun * TASK_TIMES.D_DELIVER_PER_CONTAINER;
  return pickTime + travelTime + serviceTime;
}

export function simulate(
  scenario: ScenarioConfig,
  route: RouteConfig,
  weights: ScoreWeights = DEFAULT_WEIGHTS
): SimResult {
  const { seed, shiftLengthSeconds, taktSeconds, stops, returnDistanceFeet } = scenario;
  const rng = makeRng(seed);

  // Build stop index
  const stopMap = Object.fromEntries(stops.map((s) => [s.id, s]));

  // Initial inventory = linesideMax (full at shift start)
  const inventory: Record<string, number> = Object.fromEntries(
    stops.map((s) => [s.id, s.linesideMax])
  );

  const inventoryBySec: Record<string, number[]> = Object.fromEntries(
    stops.map((s) => [s.id, []])
  );
  const downSeconds: Record<string, number> = Object.fromEntries(
    stops.map((s) => [s.id, 0])
  );

  // Build ordered stop configs for the route
  const orderedStops = route.stopSequence.map((id) => stopMap[id]);

  // Precompute route distances: supermarket→stop[0]→…→stop[n-1]→supermarket
  // Each stop's distanceFromPrev is measured from the previous stop in the route
  const segmentFeet: number[] = orderedStops.map((s) => s.distanceFromPrev);
  const totalRouteFeet =
    segmentFeet.reduce((a, b) => a + b, 0) + returnDistanceFeet;
  const totalContainersPerRun = route.stopSequence.reduce(
    (acc, id) => acc + (route.quantityPerStop[id] ?? 1),
    0
  );

  // Tugger state machine
  type TuggerPhase =
    | { type: "waiting"; launchAt: number }
    | { type: "picking"; doneAt: number }
    | { type: "traveling"; toStopIdx: number; doneAt: number; feetForSeg: number; feetSoFar: number }
    | { type: "serving"; stopIdx: number; doneAt: number }
    | { type: "returning"; doneAt: number; feetSoFar: number };

  let phase: TuggerPhase = { type: "picking", doneAt: totalContainersPerRun * TASK_TIMES.E_SUPERMARKET_PER_ITEM };

  const ticks: SimTick[] = [];
  let totalTravelFeet = 0;
  let totalPickingSeconds = 0;
  let deliveriesMade = 0;
  let nextTaktAt = taktSeconds;
  let totalDownSeconds = 0;

  for (let sec = 0; sec < shiftLengthSeconds; sec++) {
    // --- Consume usage at each takt cycle ---
    if (sec >= nextTaktAt) {
      nextTaktAt += taktSeconds;
      for (const stop of stops) {
        const cv = VARIABILITY_CV[stop.variability];
        const usage = normalSample(rng, stop.usagePerCycle, cv);
        inventory[stop.id] = Math.max(0, inventory[stop.id] - usage);
      }
    }

    // --- Tugger state machine step ---
    let tuggerPositionFraction = 0;
    let tuggerSegment = "supermarket→supermarket";
    let tuggerState: SimTick["tuggerState"] = "picking";
    let activeStop: string | null = null;

    switch (phase.type) {
      case "waiting":
        if (sec >= phase.launchAt) {
          const pickSecs = totalContainersPerRun * TASK_TIMES.E_SUPERMARKET_PER_ITEM;
          totalPickingSeconds += pickSecs;
          phase = { type: "picking", doneAt: sec + pickSecs };
        }
        tuggerState = "traveling";
        tuggerSegment = "supermarket→supermarket";
        tuggerPositionFraction = 0;
        break;

      case "picking":
        tuggerState = "picking";
        tuggerSegment = "supermarket→supermarket";
        tuggerPositionFraction = 0;
        if (sec >= phase.doneAt) {
          // Start traveling to first stop
          const feet = segmentFeet[0];
          totalTravelFeet += feet;
          phase = {
            type: "traveling",
            toStopIdx: 0,
            doneAt: sec + feet * TASK_TIMES.B_TRAVEL_PER_FOOT,
            feetForSeg: feet,
            feetSoFar: 0,
          };
        }
        break;

      case "traveling": {
        const { toStopIdx, doneAt, feetForSeg } = phase;
        const elapsed = sec - (doneAt - feetForSeg * TASK_TIMES.B_TRAVEL_PER_FOOT);
        tuggerPositionFraction = Math.min(1, elapsed / (feetForSeg * TASK_TIMES.B_TRAVEL_PER_FOOT));
        const destId = orderedStops[toStopIdx]?.id ?? "supermarket";
        const prevId = toStopIdx === 0 ? "supermarket" : orderedStops[toStopIdx - 1].id;
        tuggerSegment = `${prevId}→${destId}`;
        tuggerState = "traveling";

        if (sec >= doneAt) {
          // Arrive at stop — service time = A + C + D*qty
          const qty = route.quantityPerStop[destId] ?? 1;
          const serviceSecs =
            TASK_TIMES.A_WALK +
            TASK_TIMES.C_MOUNT_DISMOUNT +
            qty * TASK_TIMES.D_DELIVER_PER_CONTAINER;
          phase = { type: "serving", stopIdx: toStopIdx, doneAt: sec + serviceSecs };
        }
        break;
      }

      case "serving": {
        const { stopIdx, doneAt } = phase;
        const stop = orderedStops[stopIdx];
        tuggerState = "serving";
        tuggerSegment = `${stopIdx === 0 ? "supermarket" : orderedStops[stopIdx - 1].id}→${stop.id}`;
        tuggerPositionFraction = 1;
        activeStop = stop.id;

        if (sec >= doneAt) {
          // Deliver containers (qty = number of kanban bins)
          const qty = route.quantityPerStop[stop.id] ?? 1;
          const pieces = qty * stopMap[stop.id].piecesPerContainer;
          const cap = stopMap[stop.id].linesideMax;
          inventory[stop.id] = Math.min(cap, inventory[stop.id] + pieces);
          deliveriesMade++;

          const nextIdx = stopIdx + 1;
          if (nextIdx < orderedStops.length) {
            const feet = segmentFeet[nextIdx];
            totalTravelFeet += feet;
            phase = {
              type: "traveling",
              toStopIdx: nextIdx,
              doneAt: sec + feet * TASK_TIMES.B_TRAVEL_PER_FOOT,
              feetForSeg: feet,
              feetSoFar: 0,
            };
          } else {
            // Return to supermarket
            totalTravelFeet += returnDistanceFeet;
            phase = {
              type: "returning",
              doneAt: sec + returnDistanceFeet * TASK_TIMES.B_TRAVEL_PER_FOOT,
              feetSoFar: 0,
            };
          }
        }
        break;
      }

      case "returning": {
        const lastStop = orderedStops[orderedStops.length - 1];
        tuggerSegment = `${lastStop.id}→supermarket`;
        tuggerState = "traveling";
        const elapsed = sec - (phase.doneAt - returnDistanceFeet * TASK_TIMES.B_TRAVEL_PER_FOOT);
        tuggerPositionFraction = Math.min(1, elapsed / (returnDistanceFeet * TASK_TIMES.B_TRAVEL_PER_FOOT));

        if (sec >= phase.doneAt) {
          if (route.cadenceSeconds === 0) {
            // Continuous loop — immediately start picking again
            const pickSecs = totalContainersPerRun * TASK_TIMES.E_SUPERMARKET_PER_ITEM;
            totalPickingSeconds += pickSecs;
            phase = { type: "picking", doneAt: sec + pickSecs };
          } else {
            // Wait until next cadence window
            const launchAt = Math.ceil(sec / route.cadenceSeconds) * route.cadenceSeconds;
            phase = { type: "waiting", launchAt };
          }
        }
        break;
      }
    }

    // --- Record stop snapshots ---
    const stopSnaps: Record<string, StopSnapshot> = {};
    for (const stop of stops) {
      const inv = inventory[stop.id];
      const isDown = inv <= 0;
      if (isDown) {
        downSeconds[stop.id]++;
        totalDownSeconds++;
      }
      stopSnaps[stop.id] = { inventory: inv, isDown };
      inventoryBySec[stop.id].push(inv);
    }

    ticks.push({
      second: sec,
      stops: stopSnaps,
      tuggerPositionFraction,
      tuggerSegment,
      tuggerState,
      activeStop,
    });
  }

  // --- Aggregate results ---
  const stopCount = stops.length;
  const totalStopSeconds = stopCount * shiftLengthSeconds;
  const totalDownStopSeconds = Object.values(downSeconds).reduce((a, b) => a + b, 0);
  const uptimePercent = 100 * (1 - totalDownStopSeconds / totalStopSeconds);

  const allInventoryValues = stops.flatMap((s) => inventoryBySec[s.id]);
  const avgLinesideInventory =
    allInventoryValues.reduce((a, b) => a + b, 0) / allInventoryValues.length;
  const peakLinesideInventory = Math.max(...allInventoryValues);

  const downMinutesPerStop = Object.fromEntries(
    Object.entries(downSeconds).map(([id, secs]) => [id, secs / 60])
  );
  const totalDownMinutes = totalDownStopSeconds / 60;

  const score =
    weights.serviceLevel * (uptimePercent / 100) -
    weights.inventoryCost * avgLinesideInventory -
    (weights.travelCost * totalTravelFeet) / 1000 -
    weights.stockoutPenalty * totalDownMinutes;

  return {
    ticks,
    inventoryBySec,
    downMinutesPerStop,
    totalTravelFeet,
    totalPickingSeconds,
    avgLinesideInventory,
    peakLinesideInventory,
    deliveriesMade,
    uptimePercent,
    score,
  };
}
