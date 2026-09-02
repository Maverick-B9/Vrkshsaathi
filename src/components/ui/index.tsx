/**
 * VrkshSaathi UI Primitives
 * Button, Input, Select, Chip, Modal, Toast, Spinner, EmptyState
 *
 * All styled against the §7.1 design tokens. No Tailwind defaults.
 * Every interactive element has a min tap-target of 48px (WCAG AA).
 */
import React, { forwardRef, useEffect } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";

export { AIHealthBadge } from "./AIHealthBadge";

// ─────────────────────────────────────────────────────────────────
// Button
// ─────────────────────────────────────────────────────────────────
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize    = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  ButtonVariant;
  size?:     ButtonSize;
  loading?:  boolean;
  fullWidth?: boolean;
  leftIcon?:  React.ReactNode;
}

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:   "bg-moss-canopy text-white hover:bg-moss-canopy-dark active:bg-moss-canopy-dark disabled:bg-ui-disabled-bg disabled:text-ui-disabled-text",
  secondary: "bg-field-parchment border border-field-parchment-dark text-ink-bark hover:border-slate-bark active:bg-field-parchment-dark disabled:bg-ui-disabled-bg disabled:text-ui-disabled-text disabled:border-transparent",
  ghost:     "bg-transparent text-moss-canopy hover:bg-moss-canopy/10 active:bg-moss-canopy/20 disabled:text-ui-disabled-text disabled:hover:bg-transparent",
  danger:    "bg-laterite-clay text-white hover:bg-laterite-clay-light active:bg-laterite-clay disabled:bg-ui-disabled-bg disabled:text-ui-disabled-text",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "text-sm px-3 py-2 min-h-[40px]",
  md: "text-base px-4 py-3 min-h-[48px]",
  lg: "text-lg px-6 py-3.5 min-h-[56px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size    = "md",
      loading = false,
      fullWidth = false,
      leftIcon,
      children,
      disabled,
      className = "",
      ...props
    },
    ref
  ) {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`
          inline-flex items-center justify-center gap-2 font-sans font-medium
          rounded-tag-inner transition-colors duration-100
          focus-visible:ring-2 focus-visible:ring-ui-focus-ring focus-visible:outline-none
          ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]}
          ${fullWidth ? "w-full" : ""}
          ${className}
        `}
        {...props}
      >
        {loading ? <Spinner size="sm" color="current" /> : leftIcon}
        {children}
      </button>
    );
  }
);

// ─────────────────────────────────────────────────────────────────
// Input
// ─────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:    string;
  error?:    string;
  hint?:     string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, hint, className = "", id, ...props }, ref) {
    const inputId = id ?? `input-${Math.random().toString(36).slice(2, 7)}`;
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="font-sans text-sm text-ink-bark font-medium">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`
            w-full rounded-tag-inner border bg-white px-4 py-3 min-h-[48px]
            font-sans text-ink-bark placeholder:text-slate-bark
            transition-colors duration-100
            ${error
              ? "border-ui-error focus:ring-ui-error"
              : "border-field-parchment-dark focus:border-moss-canopy focus:ring-ui-focus-ring"
            }
            focus:outline-none focus:ring-2
            disabled:bg-ui-disabled-bg disabled:text-ui-disabled-text disabled:border-transparent
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="font-sans text-sm text-ui-error" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="font-sans text-xs text-slate-bark">{hint}</p>
        )}
      </div>
    );
  }
);

// ─────────────────────────────────────────────────────────────────
// Select
// ─────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?:   string;
  error?:   string;
  options:  { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ label, error, options, className = "", id, ...props }, ref) {
    const selectId = id ?? `select-${Math.random().toString(36).slice(2, 7)}`;
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={selectId} className="font-sans text-sm text-ink-bark font-medium">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`
            w-full rounded-tag-inner border bg-white px-4 py-3 min-h-[48px]
            font-sans text-ink-bark appearance-none cursor-pointer
            ${error
              ? "border-ui-error focus:ring-ui-error"
              : "border-field-parchment-dark focus:border-moss-canopy focus:ring-ui-focus-ring"
            }
            focus:outline-none focus:ring-2
            disabled:bg-ui-disabled-bg disabled:text-ui-disabled-text disabled:border-transparent disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {error && (
          <p className="font-sans text-sm text-ui-error" role="alert">{error}</p>
        )}
      </div>
    );
  }
);

// ─────────────────────────────────────────────────────────────────
// Chip — selectable category chip for incident report
// ─────────────────────────────────────────────────────────────────
interface ChipProps {
  label:     string;
  selected?: boolean;
  onClick?:  () => void;
  icon?:     string;
  disabled?: boolean;
}

export function Chip({ label, selected, onClick, icon, disabled }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px]
        rounded-full border font-sans text-sm font-medium
        transition-colors duration-100
        ${selected
          ? "bg-moss-canopy text-white border-moss-canopy"
          : "bg-white text-ink-bark border-field-parchment-dark hover:border-moss-canopy"
        }
        disabled:bg-ui-disabled-bg disabled:text-ui-disabled-text disabled:border-transparent disabled:cursor-not-allowed
        focus-visible:ring-2 focus-visible:ring-ui-focus-ring focus-visible:outline-none
      `}
      aria-pressed={selected}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {label}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────
// Modal
// ─────────────────────────────────────────────────────────────────
interface ModalProps {
  open:        boolean;
  onClose:     () => void;
  title?:      string;
  children:    React.ReactNode;
  size?:       "sm" | "md" | "lg";
}

export function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const widthClass = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-lg" }[size];
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-ink-bark/40 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          {/* Panel */}
          <motion.div
            className={`
              fixed inset-x-4 bottom-4 z-50 bg-white rounded-tag shadow-tag-raised
              ${widthClass} mx-auto p-6
            `}
            initial={{ y: prefersReducedMotion ? 0 : 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1, transition: { type: prefersReducedMotion ? false : "spring", stiffness: 380, damping: 30, duration: prefersReducedMotion ? 0 : undefined } }}
            exit={{ y: prefersReducedMotion ? 0 : 40, opacity: 0, transition: { duration: prefersReducedMotion ? 0 : 0.15 } }}
            role="dialog"
            aria-modal="true"
            aria-labelledby={title ? "modal-title" : undefined}
          >
            {title && (
              <div className="flex items-center justify-between mb-4">
                <h2 id="modal-title" className="font-display text-lg text-ink-bark">
                  {title}
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-field-parchment text-slate-bark"
                  aria-label="Close"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─────────────────────────────────────────────────────────────────
// Toast — spec-compliant copy voice ("Reported — thank you")
// ─────────────────────────────────────────────────────────────────
type ToastVariant = "success" | "error" | "warning" | "info";

interface ToastProps {
  message:   string;
  variant?:  ToastVariant;
  onDismiss?: () => void;
}

const TOAST_STYLES: Record<ToastVariant, string> = {
  success: "bg-moss-canopy text-white",
  error:   "bg-laterite-clay text-white",
  warning: "bg-turmeric-ochre text-ink-bark",
  info:    "bg-ink-bark text-white",
};

const TOAST_ICONS: Record<ToastVariant, string> = {
  success: "✓",
  error:   "✕",
  warning: "⚠",
  info:    "ℹ",
};

export function Toast({ message, variant = "info", onDismiss }: ToastProps) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      className={`
        flex items-center gap-3 px-4 py-3 rounded-tag shadow-tag-raised
        font-sans text-sm font-medium max-w-sm w-full
        ${TOAST_STYLES[variant]}
      `}
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16, scale: prefersReducedMotion ? 1 : 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1, transition: { duration: prefersReducedMotion ? 0 : undefined } }}
      exit={{ opacity: 0, y: prefersReducedMotion ? 0 : 8, scale: prefersReducedMotion ? 1 : 0.97, transition: { duration: prefersReducedMotion ? 0 : undefined } }}
      role="alert"
      aria-live="polite"
    >
      <span aria-hidden="true" className="text-base">
        {TOAST_ICONS[variant]}
      </span>
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="opacity-75 hover:opacity-100 p-1"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Toast Container — fixed bottom centre
// ─────────────────────────────────────────────────────────────────
export function ToastContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed bottom-6 inset-x-4 z-50 flex flex-col gap-2 items-center pointer-events-none">
      <AnimatePresence mode="popLayout">{children}</AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Spinner
// ─────────────────────────────────────────────────────────────────
interface SpinnerProps {
  size?:  "sm" | "md" | "lg";
  color?: "moss" | "white" | "current";
}

const SPINNER_SIZES  = { sm: 16, md: 24, lg: 36 };
const SPINNER_COLORS = {
  moss:    "#4B6B3A",
  white:   "#FFFFFF",
  current: "currentColor",
};

export function Spinner({ size = "md", color = "moss" }: SpinnerProps) {
  const px  = SPINNER_SIZES[size];
  const col = SPINNER_COLORS[color];
  return (
    <svg
      width={px} height={px}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin"
      aria-label="Loading"
      role="status"
    >
      <circle
        cx="12" cy="12" r="10"
        stroke={col} strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="40 22"
        opacity="0.9"
      />
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────
// EmptyState — invitations, not apologies (§7.6 copy voice)
// ─────────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon?:       string; // emoji or short text
  title:       string;
  description?: string;
  action?:     React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center gap-4 py-16 px-6">
      {icon && (
        <span className="text-5xl" aria-hidden="true">{icon}</span>
      )}
      {/* Logo watermark - subtle, on-brand */}
      <img src="/logo.jpg" alt="VrkshSaathi" className="w-12 h-12 object-contain opacity-30 grayscale" aria-hidden="true" />
      <div className="flex flex-col gap-2">
        <p className="font-display text-lg text-ink-bark">{title}</p>
        {description && (
          <p className="font-sans text-sm text-slate-bark max-w-xs">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Textarea
// ─────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?:  string;
  error?:  string;
  hint?:   string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, hint, className = "", id, ...props }, ref) {
    const textareaId = id ?? `textarea-${Math.random().toString(36).slice(2, 7)}`;
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={textareaId} className="font-sans text-sm text-ink-bark font-medium">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`
            w-full rounded-tag-inner border bg-white px-4 py-3
            font-sans text-ink-bark placeholder:text-slate-bark
            resize-none transition-colors duration-100
            ${error
              ? "border-ui-error focus:ring-ui-error"
              : "border-field-parchment-dark focus:border-moss-canopy focus:ring-ui-focus-ring"
            }
            focus:outline-none focus:ring-2
            disabled:bg-ui-disabled-bg disabled:text-ui-disabled-text disabled:border-transparent
            ${className}
          `}
          rows={props.rows ?? 3}
          {...props}
        />
        {error && (
          <p className="font-sans text-sm text-ui-error" role="alert">{error}</p>
        )}
        {hint && !error && (
          <p className="font-sans text-xs text-slate-bark">{hint}</p>
        )}
      </div>
    );
  }
);

// ─────────────────────────────────────────────────────────────────
// CountdownTimer — for custodian incident queue deadlines
// ─────────────────────────────────────────────────────────────────
import { useState, useEffect as useEffectTimer } from "react";

interface CountdownTimerProps {
  deadline: string | Date;
  className?: string;
}

export function CountdownTimer({ deadline, className = "" }: CountdownTimerProps) {
  const getDeadlineTime = () => {
    return typeof deadline === "string" ? new Date(deadline).getTime() : deadline.getTime();
  };

  const [remaining, setRemaining] = useState<number>(
    getDeadlineTime() - Date.now()
  );

  useEffectTimer(() => {
    const id = setInterval(() => {
      setRemaining(getDeadlineTime() - Date.now());
    }, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  if (remaining <= 0) {
    return (
      <span
        className={`font-mono text-sm text-ui-error font-medium ${className}`}
        aria-label="Deadline exceeded"
      >
        EXPIRED
      </span>
    );
  }

  const totalSecs = Math.floor(remaining / 1000);
  const hours     = Math.floor(totalSecs / 3600);
  const mins      = Math.floor((totalSecs % 3600) / 60);
  const isUrgent  = remaining < 6 * 3600 * 1000; // < 6 hours

  const formatted = `${hours}h ${mins}m`;

  return (
    <span
      className={`
        font-mono text-sm font-medium tabular-nums
        ${isUrgent ? "text-turmeric-ochre" : "text-slate-bark"}
        ${className}
      `}
      aria-label={`Time remaining: ${formatted}`}
    >
      {formatted}
    </span>
  );
}
