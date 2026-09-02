import type { Config } from "tailwindcss";

/** ---------------------------------------------------------------
 *  TREE-LIFE design tokens — §7.1 color, §7.2 typography
 *  Do NOT use Tailwind's default palette or type scale anywhere
 *  in the project; everything routes through these tokens.
 * --------------------------------------------------------------- */
const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    // ─── Reset defaults we don't want leaking through ───────────
    colors: {
      transparent: "transparent",
      current: "currentColor",
      white: "#FFFFFF",
      black: "#000000",

      // §7.1 Brand palette
      "ink-bark": "#23281B",
      "field-parchment": "#EDE9DA",
      "moss-canopy": "#4B6B3A",
      "laterite-clay": "#A6472B",
      "turmeric-ochre": "#C99A2E",
      "slate-bark": "#6B6558",

      // Tints / shades used in UI (derived, not extra tokens)
      "moss-canopy-light": "#6A9556",
      "moss-canopy-dark": "#344D29",
      "laterite-clay-light": "#C4633D",
      "turmeric-ochre-light": "#E8B84B",
      "field-parchment-dark": "#D8D3C2",
      "ink-bark-muted": "#3D4430",

      // UI Semantic Tokens (distinct from tree-status ramp)
      "ui-error": "#D9381E",         // A sharp alert red, distinct from the earthy laterite-clay
      "ui-focus-ring": "#2563EB",    // Accessible blue, completely distinct from moss-canopy
      "ui-disabled-bg": "#EAE7DD",
      "ui-disabled-text": "#9CA3AF",
    },

    fontFamily: {
      // §7.2 Typography roles
      display: ['"Fraunces"', "Georgia", "serif"],
      sans: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
      mono: ['"IBM Plex Mono"', "Menlo", "monospace"],
      // Indic script fonts — loaded dynamically per active language
      devanagari: ['"Noto Sans Devanagari"', "sans-serif"], // Hindi, Marathi
      kannada: ['"Noto Sans Kannada"', "sans-serif"],
      tamil: ['"Noto Sans Tamil"', "sans-serif"],
      telugu: ['"Noto Sans Telugu"', "sans-serif"],
      bengali: ['"Noto Sans Bengali"', "sans-serif"],
      gujarati: ['"Noto Sans Gujarati"', "sans-serif"],
      malayalam: ['"Noto Sans Malayalam"', "sans-serif"],
      gurmukhi: ['"Noto Sans Gurmukhi"', "sans-serif"], // Punjabi
      oriya: ['"Noto Sans Oriya"', "sans-serif"],
      arabic: ['"Noto Sans Arabic"', "sans-serif"], // Urdu
      assamese: ['"Noto Sans Bengali"', "sans-serif"], // uses same script as Bengali
    },

    extend: {
      // Tracking used for tree-ID "stamped tag" feel (Fraunces display)
      letterSpacing: {
        "tag-id": "0.18em",
        "tag-id-sm": "0.12em",
      },

      // Line-height overrides for Indic scripts (need more breathing room)
      lineHeight: {
        indic: "1.8",
        "indic-tight": "1.6",
      },

      borderRadius: {
        tag: "12px",   // outer tag card corners
        "tag-inner": "8px",
      },

      boxShadow: {
        tag: "0 2px 8px 0 rgba(35,40,27,0.10), 0 1px 2px 0 rgba(35,40,27,0.06)",
        "tag-hover": "0 4px 16px 0 rgba(35,40,27,0.14)",
        "tag-raised": "0 6px 24px 0 rgba(35,40,27,0.18)",
      },

      // Status-color semantic aliases (used in status badge + timeline nodes)
      // Referenced via CSS custom-property bridge in index.css
      spacing: {
        "tap-min": "48px", // WCAG AA minimum tap target
        "tag-hole": "14px",
      },

      animation: {
        "tag-settle": "tagSettle 320ms cubic-bezier(0.34,1.56,0.64,1) forwards",
        "trunk-draw": "trunkDraw 600ms ease-out forwards",
        "fade-up": "fadeUp 240ms ease-out forwards",
      },

      keyframes: {
        tagSettle: {
          "0%": { transform: "translateY(-6px) scale(0.98)", opacity: "0.8" },
          "100%": { transform: "translateY(0) scale(1)", opacity: "1" },
        },
        trunkDraw: {
          "0%": { strokeDashoffset: "100%" },
          "100%": { strokeDashoffset: "0%" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
