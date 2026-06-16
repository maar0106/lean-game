import type { CycleEstimate } from "../lib/planEstimator";
import InfoAccordion from "./InfoAccordion";

interface Props {
  estimate: CycleEstimate | null;
  cadenceMinutes: number;
  shiftMinutes: number;
}

function fmt(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
}

export default function CycleEstimatePanel({ estimate, cadenceMinutes, shiftMinutes }: Props) {
  if (!estimate || estimate.totalContainers === 0) {
    return (
      <div className="estimate-panel empty">
        Add stops to see estimated cycle time
      </div>
    );
  }

  const cycleMin = estimate.totalMinutes;
  const runsPerShift =
    cadenceMinutes === 0
      ? Math.floor(shiftMinutes / cycleMin)
      : Math.floor(shiftMinutes / cadenceMinutes);

  const tooLong = cadenceMinutes > 0 && cycleMin > cadenceMinutes;
  const pickPct = Math.round((estimate.pickSeconds / estimate.totalSeconds) * 100);
  const travelPct = Math.round((estimate.travelSeconds / estimate.totalSeconds) * 100);
  const servicePct = 100 - pickPct - travelPct;

  return (
    <div className={`estimate-panel ${tooLong ? "warn" : ""}`}>
      <div className="est-headline">
        <span className="est-total">{fmt(estimate.totalSeconds)}</span>
        <span className="est-label"> cycle time</span>
      </div>
      <div className="est-breakdown">
        <span title="Supermarket pick time">🏪 {fmt(estimate.pickSeconds)} pick ({pickPct}%)</span>
        <span title="Travel time">🚜 {fmt(estimate.travelSeconds)} travel ({travelPct}%)</span>
        <span title="Stop service time">🔧 {fmt(estimate.serviceSeconds)} service ({servicePct}%)</span>
      </div>
      <div className="est-stats">
        <span>{Math.round(estimate.totalFeet)} ft · {estimate.totalContainers} bins · ~{runsPerShift} runs/shift</span>
      </div>
      {tooLong && (
        <div className="est-warn">
          ⚠ Cycle longer than cadence — you'd launch the next run before
          finishing this one. Reduce containers, drop a stop, or pick a
          longer cadence.
        </div>
      )}

      <InfoAccordion title="What do these numbers mean?">
        <dl className="est-explain">
          <dt>Cycle time ({fmt(estimate.totalSeconds)})</dt>
          <dd>
            How long one full lap of your route takes, start to finish:
            picking containers at the supermarket, traveling between
            every stop, and unloading at each one. This is the real-world
            clock time your plan costs — not a guess, it's computed from
            the same task-time table the workshop uses.
          </dd>

          <dt>🏪 Pick ({fmt(estimate.pickSeconds)}, {pickPct}%)</dt>
          <dd>
            Time spent at the supermarket locating and picking up every
            container before you even start moving. Each container costs
            27.4 seconds to pick, no matter how big it is — so loading 12
            containers costs 12× that, parked in one place. This is why
            "deliver everything in one huge batch" quietly loses: the
            picking time alone can eat the whole cycle.
          </dd>

          <dt>🚜 Travel ({fmt(estimate.travelSeconds)}, {travelPct}%)</dt>
          <dd>
            Time the tugger spends physically moving between stops, at a
            fixed 2.5 mph. Driven entirely by total route distance (shown
            below in feet) — tighter stop sequencing shortens this.
          </dd>

          <dt>🔧 Service ({fmt(estimate.serviceSeconds)}, {servicePct}%)</dt>
          <dd>
            Time spent at each stop: walking to the cart, mounting /
            dismounting the tugger, and physically dropping off full
            containers while picking up empties. More stops or more
            containers per stop both add to this.
          </dd>

          <dt>{Math.round(estimate.totalFeet)} ft</dt>
          <dd>Total distance the tugger covers in one lap — supermarket to every stop in order, and back.</dd>

          <dt>{estimate.totalContainers} bins</dt>
          <dd>Total containers (kanban bins) you're delivering in one lap, summed across every stop on the route.</dd>

          <dt>~{runsPerShift} runs/shift</dt>
          <dd>
            How many times you could complete this route in an 8-hour
            shift, given your cycle time and cadence. More runs means
            each stop gets restocked more often — which means it can run
            leaner without risking a stockout.
          </dd>

          <dt>The warning</dt>
          <dd>
            If your cycle time is longer than your chosen cadence, you're
            asking to launch a new run before the last one is even done —
            physically impossible with one tugger. Either shrink the
            route (fewer containers, fewer stops) or stretch the cadence.
          </dd>
        </dl>
      </InfoAccordion>
    </div>
  );
}
