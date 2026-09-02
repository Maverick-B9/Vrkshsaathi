/**
 * LivingTag — TREE-LIFE's signature component.
 *
 * One shape reused everywhere a tree is represented:
 *   - Citizen landing page (lg)
 *   - Dashboard tree-cards (sm)
 *   - QR carrier printout (md)
 *   - Timeline node markers (xs)
 *
 * The punch-hole-and-loop mark (top-left) is the single visual idea
 * worth design effort — do NOT add gradients, glassmorphism, or
 * stock illustration alongside it.
 *
 * Framer Motion "tag-settle" animation fires on mount:
 * translateY(-6px) → (0), scale(0.98) → (1) — a physical-feeling
 * ease-out that reinforces the "placing a tag" metaphor.
 */
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { PunchHoleMotif } from "./PunchHoleMotif";
import { StatusBadge } from "@/components/StatusBadge/StatusBadge";
import type { TreeStatus } from "@/types/firestore";

// ─── Size presets ────────────────────────────────────────────────
type TagSize = "xs" | "sm" | "md" | "lg";

interface TagSizeConfig {
  outer:     string; // Tailwind classes for the card
  idFont:    string;
  metaFont:  string;
  gap:       string;
  motifSize: "xs" | "sm" | "md" | "lg";
  badgeSize: "sm" | "md" | "lg";
  padding:   string;
}

const SIZE_CONFIG: Record<TagSize, TagSizeConfig> = {
  xs: {
    outer:     "rounded-[8px] min-w-[80px]",
    idFont:    "font-display text-xs tracking-tag-id-sm font-semibold uppercase",
    metaFont:  "font-sans text-[10px]",
    gap:       "gap-0.5",
    motifSize: "xs",
    badgeSize: "sm",
    padding:   "p-2",
  },
  sm: {
    outer:     "rounded-tag min-w-[160px]",
    idFont:    "font-display text-sm tracking-tag-id-sm font-semibold uppercase",
    metaFont:  "font-sans text-xs",
    gap:       "gap-1",
    motifSize: "sm",
    badgeSize: "sm",
    padding:   "p-3",
  },
  md: {
    outer:     "rounded-tag min-w-[220px]",
    idFont:    "font-display text-base tracking-tag-id font-semibold uppercase",
    metaFont:  "font-sans text-sm",
    gap:       "gap-1.5",
    motifSize: "md",
    badgeSize: "md",
    padding:   "p-4",
  },
  lg: {
    outer:     "rounded-tag min-w-[280px]",
    idFont:    "font-display text-xl tracking-tag-id font-semibold uppercase",
    metaFont:  "font-sans text-base",
    gap:       "gap-2",
    motifSize: "lg",
    badgeSize: "lg",
    padding:   "p-5",
  },
};

// ─── Animation variants ──────────────────────────────────────────
const SETTLE_VARIANTS: Variants = {
  initial: { y: -6, scale: 0.98, opacity: 0.85 },
  animate: {
    y: 0, scale: 1, opacity: 1,
    transition: {
      type:      "spring",
      stiffness: 400,
      damping:   28,
      mass:      0.8,
    },
  },
};

// ─── Props ───────────────────────────────────────────────────────
interface LivingTagProps {
  treeId:          string;
  species:         string;
  ward:            string;
  status:          TreeStatus;
  custodianName?:  string;
  lastVerifiedAt?: Date | null;
  size?:           TagSize;
  /** If true, wraps the card in a link to /tree/:treeId */
  asLink?:         boolean;
  onClick?:        () => void;
  className?:      string;
  /** Disable the settle animation (e.g. for list renders with many items) */
  noAnimate?:      boolean;
  qrCodeUrl?:      string;
}

// ─── Component ───────────────────────────────────────────────────
export function LivingTag({
  treeId,
  species,
  ward,
  status,
  custodianName,
  lastVerifiedAt,
  size      = "md",
  onClick,
  className = "",
  noAnimate = false,
  qrCodeUrl,
}: LivingTagProps) {
  const cfg = SIZE_CONFIG[size];
  const prefersReducedMotion = useReducedMotion();

  const formattedDate = lastVerifiedAt
    ? new Intl.DateTimeFormat("en-IN", {
        day:   "numeric",
        month: "short",
        year:  size === "lg" ? "numeric" : undefined,
      }).format(lastVerifiedAt)
    : null;

  const card = (
    <div
      className={`
        bg-white shadow-tag border border-field-parchment-dark
        ${cfg.outer} ${cfg.padding}
        flex flex-col ${cfg.gap}
        ${onClick ? "cursor-pointer active:shadow-tag-raised" : ""}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => e.key === "Enter" && onClick() : undefined}
    >
      {/* ── Top row: punch-hole motif + tree ID ── */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <PunchHoleMotif
            size={cfg.motifSize}
          bgColor="#FFFFFF"
          rimColor="#6B6558"
          wireColor="#6B6558"
        />
          <span
            className={`${cfg.idFont} text-ink-bark flex-1 min-w-0 truncate`}
            aria-label={`Tree ID: ${treeId}`}
          >
            {treeId}
          </span>
        </div>
        
        {qrCodeUrl && (
          <div className="shrink-0 ml-2">
            <a href={qrCodeUrl} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
              <img src={qrCodeUrl} alt="QR Code" className="w-10 h-10 border border-field-parchment-dark rounded-sm bg-white" />
            </a>
          </div>
        )}
      </div>

      {/* ── Species + ward ── */}
      <div className={`${cfg.metaFont} text-slate-bark`}>
        {species} · {ward}
      </div>

      {/* ── Status badge ── */}
      <StatusBadge status={status} size={cfg.badgeSize} />

      {/* ── Custodian + last verified (sm and up) ── */}
      {size !== "xs" && (custodianName || formattedDate) && (
        <div className={`${cfg.metaFont} text-slate-bark flex flex-col gap-0.5 mt-0.5`}>
          {custodianName && (
            <span>Looked after by <strong className="text-ink-bark">{custodianName}</strong></span>
          )}
          {formattedDate && (
            <span className="font-mono text-[0.8em]">Verified {formattedDate}</span>
          )}
        </div>
      )}
    </div>
  );

  if (noAnimate || prefersReducedMotion) return card;

  return (
    <motion.div
      variants={SETTLE_VARIANTS}
      initial="initial"
      animate="animate"
      style={{ display: "contents" }}
    >
      {card}
    </motion.div>
  );
}
