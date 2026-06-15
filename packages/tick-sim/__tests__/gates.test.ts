/**
 * §8.1 Workbook-agreement gates — these must stay green before any release.
 *
 * Gate 1: KanbanDemo reproduction
 *   Single stop, bin 40, usage 5/cycle, variability Medium, delivery every 6 cycles.
 *   Verifies sawtooth shape: inventory drains ~5/cycle and refills by 40 at delivery.
 *
 * Gate 2: Delivery Route Calc agreement
 *   Reference route hand-computed on the workbook sheet:
 *   810 ft total, 135 containers, 14 stops → route cycle time must match to the second.
 */

import { describe, it, expect } from "vitest";
import { simulate, computeRouteCycleTime } from "../src/simulate.js";
import { TASK_TIMES } from "../src/constants.js";
import type { ScenarioConfig, RouteConfig } from "../src/types.js";

// ─── Gate 1: KanbanDemo reproduction ────────────────────────────────────────

describe("Gate 1 — KanbanDemo reproduction", () => {
  const TAKT = 90; // seconds
  const USAGE = 5; // pieces per cycle
  const BIN = 40;
  const DELIVERY_EVERY_N_CYCLES = 6;
  const cadenceSeconds = TAKT * DELIVERY_EVERY_N_CYCLES; // 540 s

  const scenario: ScenarioConfig = {
    seed: 42,
    shiftLengthSeconds: 480 * 60, // 8-hour shift
    taktSeconds: TAKT,
    stops: [
      {
        id: "demo",
        usagePerCycle: USAGE,
        variability: "None", // deterministic for exact match
        linesideMax: BIN,
        piecesPerContainer: BIN, // one kanban bin holds 40 pieces
        distanceFromPrev: 50,
      },
    ],
    returnDistanceFeet: 50,
  };

  const route: RouteConfig = {
    stopSequence: ["demo"],
    cadenceSeconds,
    quantityPerStop: { demo: 1 }, // 1 container (bin of 40 pieces) per delivery
  };

  it("inventory never goes below 0 under None variability", () => {
    const result = simulate(scenario, route);
    const series = result.inventoryBySec["demo"];
    expect(Math.min(...series)).toBeGreaterThanOrEqual(0);
  });

  it("sawtooth: inventory drains roughly 5 pieces per takt cycle", () => {
    // Under None variability usage should be exactly 5/cycle
    const result = simulate(scenario, route);
    const series = result.inventoryBySec["demo"];
    // After first takt cycle (90 s), inventory should be ~35
    expect(series[TAKT]).toBeCloseTo(BIN - USAGE, 0);
  });

  it("refills to linesideMax on delivery", () => {
    const result = simulate(scenario, route);
    const series = result.inventoryBySec["demo"];
    // Find any local max after the first delivery — should be at or near BIN
    const peakAfterDelivery = Math.max(...series.slice(cadenceSeconds));
    expect(peakAfterDelivery).toBe(BIN);
  });

  it("uptime is 100% under None variability with adequate bin", () => {
    const result = simulate(scenario, route);
    expect(result.uptimePercent).toBeCloseTo(100, 0);
  });
});

// ─── Gate 2: Delivery Route Calc agreement ──────────────────────────────────

describe("Gate 2 — Delivery Route Calc (workbook formula)", () => {
  /**
   * Reference from workbook answer sheet (Lesson 9 exercise):
   *   14 stops, 810 ft total route, 135 containers total (≈9.6 avg/stop, rounded)
   *
   * Formula (workbook Delivery Route Standards):
   *   Pick time  = 135 × 27.4  = 3,699 s
   *   Travel     = 810 × 0.272 = 220.3 s
   *   Service    = 14 × (6 + 3.9) + 135 × 12 = 138.6 + 1,620 = 1,758.6 s
   *   Total      = 5,677.9 s  ≈ 5,678 s
   */
  const STOPS = 14;
  const CONTAINERS = 135;
  const FEET = 810;

  const EXPECTED_SECONDS =
    CONTAINERS * TASK_TIMES.E_SUPERMARKET_PER_ITEM +
    FEET * TASK_TIMES.B_TRAVEL_PER_FOOT +
    STOPS * (TASK_TIMES.A_WALK + TASK_TIMES.C_MOUNT_DISMOUNT) +
    CONTAINERS * TASK_TIMES.D_DELIVER_PER_CONTAINER;

  it("computeRouteCycleTime matches workbook formula to the second", () => {
    const computed = computeRouteCycleTime(STOPS, CONTAINERS, FEET);
    expect(computed).toBeCloseTo(EXPECTED_SECONDS, 0);
  });

  it("cycle time is approximately 94.6 minutes (workbook answer)", () => {
    const computed = computeRouteCycleTime(STOPS, CONTAINERS, FEET);
    const minutes = computed / 60;
    // Workbook answer: ~94–95 min for this reference scenario
    expect(minutes).toBeGreaterThan(90);
    expect(minutes).toBeLessThan(100);
  });
});
