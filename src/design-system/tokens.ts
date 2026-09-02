/**
 * TREE-LIFE Design Tokens — JS/TS constants
 * These mirror the Tailwind config and CSS custom properties so
 * they can be used in SVG, canvas, Framer Motion, and any context
 * where Tailwind class names cannot be applied.
 */

export const COLORS = {
  inkBark:          "#23281B",
  fieldParchment:   "#EDE9DA",
  mossCanopy:       "#4B6B3A",
  lateriteClay:     "#A6472B",
  turmericOchre:    "#C99A2E",
  slateBark:        "#6B6558",
  // Derived
  mossCanopyLight:  "#6A9556",
  mossCanopyDark:   "#344D29",
  lateriteClayLight:"#C4633D",
  fieldParchmentDark:"#D8D3C2",
  inkBarkMuted:     "#3D4430",
  white:            "#FFFFFF",
} as const;

export const STATUS_COLORS = {
  HEALTHY:         COLORS.mossCanopy,
  NEEDS_ATTENTION: COLORS.turmericOchre,
  DEAD:            COLORS.lateriteClay,
  REPLACED:        COLORS.slateBark,
} as const;

export const STATUS_LABELS = {
  HEALTHY:         "Healthy",
  NEEDS_ATTENTION: "Needs attention",
  DEAD:            "Dead / damaged",
  REPLACED:        "Replaced",
} as const;

export const STATUS_EMOJI = {
  HEALTHY:         "🟢",
  NEEDS_ATTENTION: "🟡",
  DEAD:            "🔴",
  REPLACED:        "⚪",
} as const;

/** Trunk-line weight used on the life-record timeline */
export const TRUNK_STROKE_WIDTH = 3;

/** Tag card border radius in px */
export const TAG_RADIUS = 12;

/** Punch-hole diameter in px */
export const HOLE_DIAMETER = 14;

export type TreeStatus = keyof typeof STATUS_COLORS;
