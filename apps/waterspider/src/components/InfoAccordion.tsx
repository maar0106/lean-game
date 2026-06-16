import { useState, type ReactNode } from "react";

interface Props {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export default function InfoAccordion({ title, children, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="info-accordion">
      <button
        className="info-accordion-toggle"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <span className={`info-chevron ${open ? "open" : ""}`}>▾</span>
      </button>
      {open && <div className="info-accordion-body">{children}</div>}
    </div>
  );
}
