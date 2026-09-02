import React from "react";
import { motion } from "framer-motion";

interface AIHealthBadgeProps {
  signal: string;
  className?: string;
}

export function AIHealthBadge({ signal, className = "" }: AIHealthBadgeProps) {
  // We constrain the visual output strictly to condition observations.
  // The system must never auto-categorize causal factors like "Vandalism" or "Drought" here.
  
  let theme = "bg-field-parchment border-slate-bark/30 text-slate-bark";
  let icon = "✨";

  const lowerSignal = signal.toLowerCase();
  
  // Basic heuristic for the mock display; in reality the AI provides the constrained text directly
  if (lowerSignal.includes("healthy") || lowerSignal.includes("green") || lowerSignal.includes("thriving")) {
    theme = "bg-moss-canopy/10 border-moss-canopy/30 text-moss-canopy-dark";
  } else if (lowerSignal.includes("damage") || lowerSignal.includes("wilt") || lowerSignal.includes("dry")) {
    theme = "bg-laterite-clay/10 border-laterite-clay/30 text-laterite-clay";
  } else if (lowerSignal.includes("inconclusive") || lowerSignal.includes("unclear")) {
    theme = "bg-slate-bark/10 border-slate-bark/30 text-ink-bark";
    icon = "🔍";
  }

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${theme} ${className}`}
      title="Automated visual assessment by Gemini Vision"
    >
      <span className="text-[10px] leading-none" aria-hidden="true">{icon}</span>
      <span className="font-mono text-[10px] font-medium tracking-wide uppercase">
        AI: {signal}
      </span>
    </motion.div>
  );
}
