

const OPTIONS = [
  { label: "Loop", value: 0, desc: "Relaunch immediately on return" },
  { label: "30 min", value: 30, desc: "Every 30 minutes" },
  { label: "60 min", value: 60, desc: "Every 60 minutes" },
  { label: "90 min", value: 90, desc: "Every 90 minutes" },
  { label: "120 min", value: 120, desc: "Every 2 hours" },
  { label: "240 min", value: 240, desc: "Every 4 hours" },
  { label: "480 min", value: 480, desc: "Once per shift" },
];

interface Props {
  value: number;
  onChange: (v: number) => void;
}

export default function CadenceDial({ value, onChange }: Props) {
  return (
    <div className="cadence-dial">
      <label className="section-label">Delivery Cadence</label>
      <div className="cadence-options">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            className={`cadence-btn ${value === opt.value ? "active" : ""}`}
            onClick={() => onChange(opt.value)}
            title={opt.desc}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
