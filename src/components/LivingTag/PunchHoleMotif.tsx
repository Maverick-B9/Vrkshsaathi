/**
 * PunchHoleMotif — the SVG punch-hole + wire-loop mark.
 *
 * This is TREE-LIFE's signature element, placed in the top-left
 * corner of every Living Tag card, at every scale. It reads as the
 * physical tag loop that a nursery worker wires to a sapling's branch.
 *
 * The motif consists of:
 *  - A filled circle (the punched hole, filled with the background colour)
 *  - A slightly larger ring (the hole's rim)
 *  - A short curved path (the wire loop emerging from the hole)
 */
import type { CSSProperties } from "react";

interface PunchHoleMotifProps {
  /** Background colour that fills the hole (should match card background) */
  bgColor?: string;
  rimColor?: string;
  wireColor?: string;
  size?: "xs" | "sm" | "md" | "lg";
  style?: CSSProperties;
  className?: string;
}

const SIZE_MAP = {
  xs: { hole: 8,  rim: 10, wireWidth: 1,   viewBox: "0 0 22 14" },
  sm: { hole: 10, rim: 13, wireWidth: 1.5, viewBox: "0 0 26 16" },
  md: { hole: 14, rim: 18, wireWidth: 2,   viewBox: "0 0 34 20" },
  lg: { hole: 18, rim: 23, wireWidth: 2.5, viewBox: "0 0 44 26" },
};

export function PunchHoleMotif({
  bgColor   = "#EDE9DA",
  rimColor  = "#6B6558",
  wireColor = "#6B6558",
  size      = "md",
  style,
  className,
}: PunchHoleMotifProps) {
  const s = SIZE_MAP[size];
  // Centre the hole within the viewbox
  const cx = s.hole / 2 + 2;
  const cy = s.hole / 2 + (size === "xs" ? 2 : 3);
  const rimR = s.rim / 2;

  // Wire path: a quadratic curve emerging from the right of the hole,
  // arcing upward and away — mimics the twisted-wire tag loop.
  const wireStart = { x: cx + rimR - 1, y: cy };
  const wireEnd   = { x: parseFloat(s.viewBox.split(" ")[2]) - 2, y: 3 };
  const wireCtrl  = {
    x: wireStart.x + (wireEnd.x - wireStart.x) * 0.5,
    y: wireStart.y - (wireEnd.x - wireStart.x) * 0.5,
  };

  return (
    <svg
      width={s.viewBox.split(" ")[2]}
      height={s.viewBox.split(" ")[3]}
      viewBox={s.viewBox}
      fill="none"
      aria-hidden="true"
      style={style}
      className={className}
    >
      {/* Hole rim (slightly larger circle behind) */}
      <circle
        cx={cx} cy={cy}
        r={rimR}
        fill={rimColor}
        opacity={0.35}
      />
      {/* Hole fill (punched out) */}
      <circle
        cx={cx} cy={cy}
        r={rimR - s.wireWidth * 0.8}
        fill={bgColor}
        stroke={rimColor}
        strokeWidth={s.wireWidth * 0.8}
      />
      {/* Wire loop */}
      <path
        d={`M ${wireStart.x} ${wireStart.y} Q ${wireCtrl.x} ${wireCtrl.y} ${wireEnd.x} ${wireEnd.y}`}
        stroke={wireColor}
        strokeWidth={s.wireWidth}
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
