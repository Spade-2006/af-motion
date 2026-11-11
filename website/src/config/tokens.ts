/**
 * AF Motion Website — Centralized Design Tokens
 */

export const THEME_TOKENS = {
  colors: {
    background: {
      primary: "#07080a",
      secondary: "#0b0d12",
      tertiary: "#10131a",
      card: "#131620",
      cardHover: "#181c29",
      elevated: "#1d2232",
    },
    borders: {
      subtle: "rgba(255, 255, 255, 0.06)",
      default: "rgba(255, 255, 255, 0.10)",
      active: "rgba(255, 255, 255, 0.20)",
      glow: "rgba(99, 102, 241, 0.35)",
    },
    text: {
      primary: "#f8fafc",
      secondary: "#94a3b8",
      muted: "#64748b",
      faint: "#334155",
    },
    accents: {
      cyan: "#38bdf8",
      cyanGlow: "rgba(56, 189, 248, 0.25)",
      indigo: "#6366f1",
      indigoGlow: "rgba(99, 102, 241, 0.25)",
      violet: "#a855f7",
      emerald: "#10b981",
      amber: "#f59e0b",
      rose: "#f43f5e",
    },
  },
  typography: {
    fonts: {
      sans: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
      mono: '"JetBrains Mono", ui-monospace, SFMono-Regular, monospace',
    },
    scales: {
      hero: "text-5xl sm:text-7xl lg:text-8xl font-extrabold tracking-tight",
      display: "text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight",
      sectionHeading: "text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight",
      subheading: "text-lg sm:text-xl font-medium text-slate-300",
      body: "text-base text-slate-400 leading-relaxed",
      caption: "text-sm text-slate-500",
      code: "font-mono text-xs uppercase tracking-wider",
    },
  },
  shadows: {
    subtle: "0 4px 20px -2px rgba(0, 0, 0, 0.7)",
    elevated: "0 12px 36px -4px rgba(0, 0, 0, 0.8)",
    glowCyan: "0 0 30px -5px rgba(56, 189, 248, 0.25)",
    glowIndigo: "0 0 30px -5px rgba(99, 102, 241, 0.25)",
  },
  motion: {
    spring: {
      stiffness: 280,
      damping: 24,
      mass: 1,
    },
    durations: {
      fast: 200,
      normal: 400,
      slow: 700,
    },
    easings: {
      outExpo: [0.16, 1, 0.3, 1],
      inOutCubic: [0.65, 0, 0.35, 1],
    },
  },
} as const;

export type ThemeTokens = typeof THEME_TOKENS;
