import React, { useState, useMemo } from "react";
import layout from "./layout.json";
import type { Layout, RouteStop } from "./lib/types";
import { buildSegmentMap, routeTotalFeet } from "./lib/routeDistance";
import { estimateCycle } from "./lib/planEstimator";
import FactoryMap from "./components/FactoryMap";
import RouteSequencer from "./components/RouteSequencer";
import CadenceDial from "./components/CadenceDial";
import CycleEstimatePanel from "./components/CycleEstimatePanel";
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

  const totalFeet = useMemo(() => routeTotalFeet(sequence, typedLayout, segMap), [sequence]);
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
