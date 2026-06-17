interface Props {
  value: number; // 0 = continuous loop; otherwise minutes between launches
  onChange: (v: number) => void;
}

const MIN = 5;
const MAX = 480;
const STEP = 5;
const DEFAULT_TIMED = 90; // value to restore when switching off Loop

export default function CadenceDial({ value, onChange }: Props) {
  const isLoop = value === 0;
  // The slider always shows a valid timed value, even while Loop is active
  const sliderValue = isLoop ? DEFAULT_TIMED : value;

  return (
    <div className="cadence-dial">
      <label className="section-label">Delivery Cadence</label>

      <div className="cadence-modes">
        <button
          className={`cadence-btn ${isLoop ? "active" : ""}`}
          onClick={() => onChange(0)}
          title="Relaunch the route the instant the tugger returns"
        >
          ↻ Loop
        </button>
        <button
          className={`cadence-btn ${!isLoop ? "active" : ""}`}
          onClick={() => onChange(sliderValue)}
          title="Launch the route on a fixed timer"
        >
          ⏱ Timed
        </button>
      </div>

      <div className={`cadence-slider-row ${isLoop ? "disabled" : ""}`}>
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={sliderValue}
          disabled={isLoop}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-label="Delivery cadence in minutes"
        />
        <span className="cadence-readout">
          {isLoop ? "—" : `${sliderValue} min`}
        </span>
      </div>

      <p className="cadence-hint">
        {isLoop
          ? "Continuous loop — the tugger heads back out the moment it returns."
          : `Launch a new run every ${sliderValue} minutes.`}
      </p>
    </div>
  );
}
