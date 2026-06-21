// Dark theme ported 1:1 from the legacy index.html `:root` variables.
// CSS-var names map to camelCase keys (e.g. --green-bg -> greenBg).

export const theme = {
  bg: "#0f1117",
  // Near-black bar used by the header and the bottom action bar in the Figma
  // quiz design (sits darker than the app background).
  headerBg: "#0a0d14",
  surface: "#1a1d27",
  surface2: "#22263a",
  border: "#2e3450",
  // Figma quiz UI builds surfaces/dividers from translucent white overlays
  // rather than solid panels — keeps depth subtle on the flat dark background.
  overlay: "rgba(255, 255, 255, 0.04)",
  overlaySoft: "rgba(255, 255, 255, 0.02)",
  hairline: "rgba(255, 255, 255, 0.06)",
  hairlineStrong: "rgba(255, 255, 255, 0.07)",
  accent: "#FF9900",
  accent2: "#4a90d9",
  text: "#e8eaf0",
  text2: "#8891ab",
  // Muted monospace tone for Q-numbers, kickers and stat labels.
  textMono: "#6b7494",
  // Slightly dimmer than `text` for option body copy.
  optText: "#c8cde0",
  green: "#22c55e",
  greenBg: "#0d2e1a",
  red: "#e84040",
  redBg: "#2d0d0d",
  tagBg: "#1e2640",
  yellow: "#f39c12",
  fontMono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace",
} as const;

export type AppTheme = typeof theme;
