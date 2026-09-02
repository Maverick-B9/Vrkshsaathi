/**
 * Dynamically loads the required Noto Sans font for the active language.
 * We do not want to bundle or preload all 10 Indic fonts, as that
 * would kill performance on low-end devices.
 */

const FONT_LINKS: Record<string, string> = {
  hi: "https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600&display=swap",
  mr: "https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600&display=swap",
  kn: "https://fonts.googleapis.com/css2?family=Noto+Sans+Kannada:wght@400;500;600&display=swap",
  ta: "https://fonts.googleapis.com/css2?family=Noto+Sans+Tamil:wght@400;500;600&display=swap",
  te: "https://fonts.googleapis.com/css2?family=Noto+Sans+Telugu:wght@400;500;600&display=swap",
  bn: "https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600&display=swap",
  as: "https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600&display=swap", // Assamese uses Bengali script
  gu: "https://fonts.googleapis.com/css2?family=Noto+Sans+Gujarati:wght@400;500;600&display=swap",
  ml: "https://fonts.googleapis.com/css2?family=Noto+Sans+Malayalam:wght@400;500;600&display=swap",
  pa: "https://fonts.googleapis.com/css2?family=Noto+Sans+Gurmukhi:wght@400;500;600&display=swap",
  or: "https://fonts.googleapis.com/css2?family=Noto+Sans+Oriya:wght@400;500;600&display=swap",
  ur: "https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;500;600&display=swap",
};

export function loadLanguageFont(langCode: string) {
  const url = FONT_LINKS[langCode];
  if (!url) return; // e.g. English, which uses IBM Plex Sans already loaded in index.css

  const existing = document.querySelector(`link[href="${url}"]`);
  if (existing) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  document.head.appendChild(link);
}
