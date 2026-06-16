import { useState, useMemo } from "react";
import layout from "./layout.json";
import type { Layout, RouteStop } from "./lib/types";
import { buildSegmentMap, routeTotalFeet } from "./lib/routeDistance";
import { estimateCycle } from "./lib/planEstimator";
import FactoryMap from "./components/FactoryMap";
import RouteSequencer from "./components/RouteSequencer";
import CadenceDial from "./components/CadenceDial";
import CycleEstimatePanel from "./components/CycleEstimatePanel";
import InfoAccordion from "./components/InfoAccordion";
import "./App.css";

const SHIFT_MINUTES = 480;
const typedLayout = layout as unknown as Layout;
const segMap = buildSegmentMap(typedLayout);

export default function App() {
  const [sequence, setSequence] = useState<RouteStop[]>([]);
  const [cadenceMinutes, setCadenceMinutes] = useState<number>(60);

  function handleToggleStop(id: string) {
    if (sequence.find((s) => s.stopId === id)) {
      setSequence(sequence.filter((s) => s.stopId !== id));
    } else {
      const stop = typedLayout.stops.find((s) => s.id === id)!;
      const defaultContainers = Math.max(1, Math.ceil(stop.linesideMax / stop.piecesPerContainer / 2));
      setSequence([...sequence, { stopId: id, containers: defaultContainers }]);
    }
  }

  const totalFeet = useMemo(() => routeTotalFeet(sequence, segMap), [sequence]);
  const totalContainers = useMemo(() => sequence.reduce((acc, s) => acc + s.containers, 0), [sequence]);
  const estimate = useMemo(
    () => sequence.length > 0 ? estimateCycle(sequence.length, totalContainers, totalFeet) : null,
    [sequence.length, totalContainers, totalFeet]
  );

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <span className="logo-icon">🕷️</span>
          <div>
            <h1>Water Spider</h1>
            <p>Design your milk run. Feed the line.</p>
          </div>
        </div>
      </header>

      <main className="app-main">
        <section className="howto-section">
          <InfoAccordion title="❔ How to play" defaultOpen={sequence.length === 0}>
            <p>
              You're the <strong>water spider</strong> — the person who runs parts from
              the supermarket out to the line. Every stop on the factory floor eats
              parts constantly while the line runs. Your job is to design a delivery
              loop (a "milk run") that keeps every stop stocked without you wasting
              time or flooding the floor with inventory.
            </p>
            <ol>
              <li><strong>Tap stops on the map</strong> to add them to your route. Tap an added stop again to remove it.</li>
              <li><strong>Drag rows</strong> in "Route Order" to change the visiting sequence — order changes travel distance.</li>
              <li><strong>Use − / +</strong> to set how many containers (kanban bins) you deliver to each stop per visit. More containers = more pieces delivered, but also more time spent picking and unloading.</li>
              <li><strong>Pick a cadence</strong> — how often you relaunch the route. "Loop" means you head out again the instant you return; longer cadences mean longer gaps between visits to every stop.</li>
              <li><strong>Watch the cycle time estimate</strong> below — it tells you, before you ever run the shift, whether your plan is even physically possible in the time you've allowed.</li>
            </ol>
            <p>
              The trade-off is the whole game: <strong>frequent small deliveries</strong> keep
              stations lean but mean more trips and more time at the supermarket picking;
              <strong> infrequent big deliveries</strong> mean fewer trips but each one takes
              longer to pick and unload — and stations sit fuller (more inventory tied up)
              while they wait.
            </p>
          </InfoAccordion>
        </section>

        <section className="map-section">
          <p className="section-hint">Tap stops to add · tap again to remove</p>
          <FactoryMap layout={typedLayout} sequence={sequence} onToggleStop={handleToggleStop} />
        </section>

        <section className="sequence-section">
          <h2 className="section-label">Route Order <span className="stop-count">({sequence.length} stops)</span></h2>
          <RouteSequencer sequence={sequence} layout={typedLayout} onChange={setSequence} />
        </section>

        <section className="cadence-section">
          <CadenceDial value={cadenceMinutes} onChange={setCadenceMinutes} />
        </section>

        <section className="estimate-section">
          <CycleEstimatePanel
            estimate={estimate}
            cadenceMinutes={cadenceMinutes}
            shiftMinutes={SHIFT_MINUTES}
          />
        </section>

        <section className="run-section">
          <button
            className={`run-btn ${sequence.length > 0 ? "ready" : "disabled"}`}
            disabled={sequence.length === 0}
          >
            Run the Shift →
          </button>
          {sequence.length === 0 && <p className="run-hint">Add at least one stop to run</p>}
        </section>
      </main>
    </div>
  );
}
