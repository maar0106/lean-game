
import type { CycleEstimate } from "../lib/planEstimator";

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

  return (
    <div className={`estimate-panel ${tooLong ? "warn" : ""}`}>
      <div className="est-headline">
        <span className="est-total">{fmt(estimate.totalSeconds)}</span>
        <span className="est-label"> cycle time</span>
      </div>
      <div className="est-breakdown">
        <span title="Supermarket pick time">🏪 {fmt(estimate.pickSeconds)} pick ({pickPct}%)</span>
        <span title="Travel time">🚜 {fmt(estimate.travelSeconds)} travel</span>
        <span title="Stop service time">🔧 {fmt(estimate.serviceSeconds)} service</span>
      </div>
      <div className="est-stats">
        <span>{Math.round(estimate.totalFeet)} ft · {estimate.totalContainers} bins · ~{runsPerShift} runs/shift</span>
      </div>
      {tooLong && (
        <div className="est-warn">
          ⚠ Cycle longer than cadence — reduce containers or add stops
        </div>
      )}
    </div>
  );
}
