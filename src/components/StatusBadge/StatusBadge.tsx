/**
 * StatusBadge — the shared status indicator for TREE-LIFE.
 *
 * Uses icon + text + color together — never color alone — per §8
 * accessibility requirement and §7.1 design note.
 *
 * The three status colors are the same everywhere: tag cards,
 * dashboards, timeline nodes, leaderboards. One consistent
 * vocabulary across the whole product.
 */
import type { TreeStatus } from "@/types/firestore";

interface StatusBadgeProps {
  status: TreeStatus;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

const STATUS_CONFIG: Record<
  TreeStatus,
  { icon: string; label: string; classes: string }
> = {
  HEALTHY: {
    icon:    "🟢",
    label:   "Healthy",
    classes: "bg-moss-canopy/10 text-moss-canopy-dark border-moss-canopy/30",
  },
  NEEDS_ATTENTION: {
    icon:    "🟡",
    label:   "Needs attention",
    classes: "bg-turmeric-ochre/10 text-ink-bark border-turmeric-ochre/40",
  },
  DEAD: {
    icon:    "🔴",
    label:   "Dead / damaged",
    classes: "bg-laterite-clay/10 text-laterite-clay border-laterite-clay/30",
  },
  REPLACED: {
    icon:    "⚪",
    label:   "Replaced",
    classes: "bg-slate-bark/10 text-slate-bark border-slate-bark/30",
  },
};

const SIZE_CLASSES = {
  sm: "text-xs px-2 py-0.5 gap-1",
  md: "text-sm px-2.5 py-1 gap-1.5",
  lg: "text-base px-3 py-1.5 gap-2",
};

export function StatusBadge({
  status,
  size = "md",
  showIcon = true,
}: StatusBadgeProps) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={`
        inline-flex items-center font-sans font-medium rounded-full border
        ${cfg.classes} ${SIZE_CLASSES[size]}
      `}
      aria-label={`Status: ${cfg.label}`}
    >
      {showIcon && (
        <span aria-hidden="true" className="leading-none">
          {cfg.icon}
        </span>
      )}
      <span>{cfg.label}</span>
    </span>
  );
}
