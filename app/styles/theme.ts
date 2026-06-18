// Dark theme ported 1:1 from the legacy index.html `:root` variables.
// CSS-var names map to camelCase keys (e.g. --green-bg -> greenBg).

export const theme = {
  bg: "#0f1117",
  surface: "#1a1d27",
  surface2: "#22263a",
  border: "#2e3450",
  accent: "#FF9900",
  accent2: "#4a90d9",
  text: "#e8eaf0",
  text2: "#8b90a8",
  green: "#2ecc71",
  greenBg: "#0d2e1a",
  red: "#e74c3c",
  redBg: "#2d0d0d",
  tagBg: "#1e2640",
  yellow: "#f39c12",
} as const;

export type AppTheme = typeof theme;
