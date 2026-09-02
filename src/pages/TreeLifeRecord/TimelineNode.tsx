import React from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { TimelineEvent } from "./useTreeHistory";

interface TimelineNodeProps {
  event: TimelineEvent;
  isLast: boolean;
}

export function TimelineNode({ event, isLast }: TimelineNodeProps) {
  const prefersReducedMotion = useReducedMotion();

  // Animation variants
  const nodeVariants: Variants = {
    hidden: { 
      opacity: 0, 
      y: prefersReducedMotion ? 0 : 20,
      scale: prefersReducedMotion ? 1 : 0.95
    },
    visible: { 
      opacity: 1, 
      y: 0,
      scale: 1,
      transition: { 
        duration: prefersReducedMotion ? 0.2 : 0.5,
        ease: "easeOut"
      }
    }
  };

  // Determine icon and colors based on event type
  let icon = "•";
  let bgClass = "bg-field-parchment-dark";
  let textClass = "text-ink-bark";

  if (event.type === "PLANTED" || event.type === "REGISTERED") {
    icon = "🌱";
    bgClass = "bg-moss-canopy/20 border-moss-canopy";
    textClass = "text-moss-canopy-dark";
  } else if (event.type === "REPORTED") {
    icon = "⚠️";
    bgClass = "bg-turmeric-ochre/20 border-turmeric-ochre";
    textClass = "text-ink-bark";
  } else if (event.type === "RESOLVED" || event.type === "VERIFIED") {
    icon = "✅";
    bgClass = "bg-moss-canopy text-white";
    textClass = "text-moss-canopy-dark";
  } else if (event.type === "UPCOMING_CHECKPOINT") {
    icon = "○"; // Hollow due node
    bgClass = "bg-transparent border-2 border-slate-bark border-dashed";
    textClass = "text-slate-bark";
  } else if (event.type === "DIED") {
    icon = "🪦";
    bgClass = "bg-laterite-clay text-white";
    textClass = "text-laterite-clay-light";
  }

  const formattedDate = new Date(event.timestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

  return (
    <motion.div 
      className="relative flex gap-4 w-full"
      variants={nodeVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
    >
      {/* Connecting Line */}
      {!isLast && (
        <div 
          className={`absolute left-[19px] top-10 bottom-[-24px] w-0.5 z-0 ${
            event.isFuture ? "border-l-2 border-dashed border-slate-bark/30" : "bg-field-parchment-dark"
          }`}
          aria-hidden="true"
        />
      )}

      {/* Node Marker */}
      <div 
        className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full shrink-0 ${bgClass}`}
        aria-hidden="true"
      >
        <span className="text-sm font-medium">{icon}</span>
      </div>

      {/* Content */}
      <div className={`pb-8 pt-1 ${event.isFuture ? "opacity-60" : ""}`}>
        <div className="flex items-baseline gap-2">
          <h3 className={`font-sans text-lg font-medium ${textClass}`}>
            {event.title}
          </h3>
          <span className="font-mono text-xs text-slate-bark tracking-wide">
            {formattedDate}
          </span>
        </div>
        {event.description && (
          <p className="font-sans text-sm text-slate-bark mt-1">
            {event.description}
          </p>
        )}
      </div>
    </motion.div>
  );
}
