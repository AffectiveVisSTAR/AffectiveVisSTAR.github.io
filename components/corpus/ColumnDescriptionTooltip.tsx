"use client";

import { createPortal } from "react-dom";

type ColumnDescriptionTooltipProps = {
  description: string;
  x: number;
  y: number;
};

export default function ColumnDescriptionTooltip({
  description,
  x,
  y,
}: ColumnDescriptionTooltipProps) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <span
      role="tooltip"
      className="pointer-events-none fixed z-[9999] w-64 rounded border border-neutral-300 bg-white px-2 py-1.5 text-left text-xs normal-case leading-snug text-neutral-800 shadow-lg"
      style={{
        left: 0,
        top: 0,
        transform: `translate3d(${x}px, ${y}px, 0) translate(-50%, calc(-100% - 8px))`,
      }}
    >
      {description}
    </span>,
    document.body,
  );
}
