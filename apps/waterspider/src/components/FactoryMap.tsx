
import type { Layout, RouteStop } from "../lib/types";

interface Props {
  layout: Layout;
  sequence: RouteStop[];
  onToggleStop: (id: string) => void;
}

const STOP_R = 18;
const SM_R = 22;
const COLORS = {
  smFill: "#92400e",
  smStroke: "#78350f",
  stopIdle: "#1e3a5f",
  stopActive: "#0ea5e9",
  stopStroke: "#0369a1",
  routeLine: "#f59e0b",
  text: "#f8fafc",
  badge: "#f59e0b",
  badgeText: "#1c1917",
};

export default function FactoryMap({ layout, sequence, onToggleStop }: Props) {
  const { supermarket, stops } = layout;
  const width = 380;
  const height = 400; // stops span y=60..340; add padding

  const activeIds = new Set(sequence.map((s) => s.stopId));
  const orderMap = new Map(sequence.map((s, i) => [s.stopId, i + 1]));

  // Build route polyline: supermarket → ...sequence → supermarket
  const allNodes = [supermarket, ...sequence.map((s) => stops.find((st) => st.id === s.stopId)!), supermarket];
  const routePoints = allNodes
    .filter(Boolean)
    .map((n) => `${n.x},${n.y}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{ width: "100%", maxWidth: width, display: "block" }}
      aria-label="Factory floor map"
    >
      {/* Background */}
      <rect width={width} height={height} fill="#0f172a" rx={12} />

      {/* Aisle guides */}
      <rect x={10} y={40} width={360} height={320} rx={8} fill="none" stroke="#1e293b" strokeWidth={1} />
      <line x1={10} y1={110} x2={370} y2={110} stroke="#1e293b" strokeWidth={1} strokeDasharray="4 4" />
      <line x1={10} y1={200} x2={370} y2={200} stroke="#1e293b" strokeWidth={1} strokeDasharray="4 4" />
      <line x1={10} y1={290} x2={370} y2={290} stroke="#1e293b" strokeWidth={1} strokeDasharray="4 4" />

      {/* Route line */}
      {sequence.length > 0 && (
        <polyline
          points={routePoints}
          fill="none"
          stroke={COLORS.routeLine}
          strokeWidth={3}
          strokeDasharray="8 4"
          strokeLinecap="round"
          opacity={0.85}
        />
      )}

      {/* Stops */}
      {stops.map((stop) => {
        const active = activeIds.has(stop.id);
        const order = orderMap.get(stop.id);
        return (
          <g
            key={stop.id}
            onClick={() => onToggleStop(stop.id)}
            style={{ cursor: "pointer" }}
            role="button"
            aria-label={`${stop.label}${active ? ` — stop ${order}` : " — click to add"}`}
          >
            <circle
              cx={stop.x}
              cy={stop.y}
              r={STOP_R}
              fill={active ? COLORS.stopActive : COLORS.stopIdle}
              stroke={active ? COLORS.stopStroke : "#334155"}
              strokeWidth={active ? 2.5 : 1.5}
            />
            {/* Order badge */}
            {active && order !== undefined && (
              <circle cx={stop.x + 12} cy={stop.y - 12} r={9} fill={COLORS.badge} />
            )}
            {active && order !== undefined && (
              <text
                x={stop.x + 12}
                y={stop.y - 12}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={9}
                fontWeight="bold"
                fill={COLORS.badgeText}
              >
                {order}
              </text>
            )}
            <text
              x={stop.x}
              y={stop.y + STOP_R + 10}
              textAnchor="middle"
              fontSize={8}
              fill={active ? "#e2e8f0" : "#64748b"}
              fontWeight={active ? "600" : "400"}
            >
              {stop.label}
            </text>
          </g>
        );
      })}

      {/* Supermarket anchor */}
      <g>
        <rect
          x={supermarket.x - SM_R}
          y={supermarket.y - SM_R}
          width={SM_R * 2}
          height={SM_R * 2}
          rx={6}
          fill={COLORS.smFill}
          stroke={COLORS.smStroke}
          strokeWidth={2}
        />
        <text
          x={supermarket.x}
          y={supermarket.y}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={14}
          fill={COLORS.text}
        >
          🏪
        </text>
        <text
          x={supermarket.x}
          y={supermarket.y + SM_R + 10}
          textAnchor="middle"
          fontSize={8}
          fill="#94a3b8"
        >
          Supermarket
        </text>
      </g>
    </svg>
  );
}
