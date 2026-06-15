import React from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { RouteStop, Layout } from "../lib/types";

interface SortableRowProps {
  rs: RouteStop;
  index: number;
  stop: { label: string; linesideMax: number; piecesPerContainer: number };
  onRemove: (id: string) => void;
  onSetContainers: (id: string, n: number) => void;
}

function SortableRow({ rs, index, stop, onRemove, onSetContainers }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: rs.stopId });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const maxContainers = Math.ceil(stop.linesideMax / stop.piecesPerContainer);

  return (
    <div ref={setNodeRef} style={style} className="route-row">
      <span className="drag-handle" {...attributes} {...listeners}>⠿</span>
      <span className="stop-order">{index + 1}</span>
      <span className="stop-label">{stop.label}</span>
      <div className="qty-control">
        <button
          onClick={() => onSetContainers(rs.stopId, Math.max(1, rs.containers - 1))}
          aria-label="Fewer containers"
        >−</button>
        <span className="qty-value">{rs.containers}</span>
        <button
          onClick={() => onSetContainers(rs.stopId, Math.min(maxContainers, rs.containers + 1))}
          aria-label="More containers"
        >+</button>
      </div>
      <span className="bins-label">
        {rs.containers * stop.piecesPerContainer} pcs
      </span>
      <button className="remove-btn" onClick={() => onRemove(rs.stopId)} aria-label="Remove stop">✕</button>
    </div>
  );
}

interface Props {
  sequence: RouteStop[];
  layout: Layout;
  onChange: (seq: RouteStop[]) => void;
}

export default function RouteSequencer({ sequence, layout, onChange }: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const stopMap = Object.fromEntries(layout.stops.map((s) => [s.id, s]));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIdx = sequence.findIndex((s) => s.stopId === active.id);
      const newIdx = sequence.findIndex((s) => s.stopId === over.id);
      onChange(arrayMove(sequence, oldIdx, newIdx));
    }
  }

  function handleRemove(id: string) {
    onChange(sequence.filter((s) => s.stopId !== id));
  }

  function handleSetContainers(id: string, n: number) {
    onChange(sequence.map((s) => (s.stopId === id ? { ...s, containers: n } : s)));
  }

  if (sequence.length === 0) {
    return (
      <div className="sequencer-empty">
        Tap stops on the map to add them to your route
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={sequence.map((s) => s.stopId)} strategy={verticalListSortingStrategy}>
        <div className="sequencer">
          {sequence.map((rs, i) => (
            <SortableRow
              key={rs.stopId}
              rs={rs}
              index={i}
              stop={stopMap[rs.stopId]}
              onRemove={handleRemove}
              onSetContainers={handleSetContainers}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
