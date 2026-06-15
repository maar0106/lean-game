export interface LayoutStop {
  id: string;
  label: string;
  x: number;
  y: number;
  linesideMax: number;
  usagePerCycle: number;
  piecesPerContainer: number;
}

export interface PathSegment {
  from: string;
  to: string;
  feet: number;
}

export interface Layout {
  viewport: { width: number; height: number };
  supermarket: { id: string; label: string; x: number; y: number };
  stops: LayoutStop[];
  pathSegments: PathSegment[];
}

export interface RouteStop {
  stopId: string;
  containers: number; // how many bins delivered per visit
}

export interface Plan {
  sequence: RouteStop[]; // ordered; supermarket implicit start/end
  cadenceMinutes: number; // 0 = continuous loop
}
