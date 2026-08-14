/**
 * EndoCore Design Tokens (TypeScript)
 * Single source of truth for all design values used in inline styles.
 * CSS custom properties in index.css are the primary source;
 * these constants are for component inline style needs.
 */

export const EC = {
  // ── Backgrounds ────────────────────────────────────────────
  bg:       "#050505",
  surface1: "#0B0B0D",
  surface2: "#111216",
  surface3: "#16171C",

  // ── Borders ────────────────────────────────────────────────
  border:   "rgba(255,255,255,0.06)",
  borderMd: "rgba(255,255,255,0.09)",

  // ── Typography ─────────────────────────────────────────────
  textPrimary:   "#F5F5F5",
  textSecondary: "#8A8A8F",
  textTertiary:  "#4A4A50",

  // ── Accent — Cyan ──────────────────────────────────────────
  cyan:         "#00E5FF",
  cyanDim:      "rgba(0,229,255,0.12)",
  cyanBorder:   "rgba(0,229,255,0.22)",
  cyanGlow:     "rgba(0,229,255,0.08)",

  // ── Accent — Orange ────────────────────────────────────────
  orange:       "#FF8A00",
  orangeDim:    "rgba(255,138,0,0.12)",
  orangeBorder: "rgba(255,138,0,0.22)",

  // ── Success ─────────────────────────────────────────────────
  success:       "#35D07F",
  successDim:    "rgba(53,208,127,0.12)",
  successBorder: "rgba(53,208,127,0.22)",

  // ── Spacing ─────────────────────────────────────────────────
  space: {
    xs:  4,
    sm:  8,
    md:  12,
    lg:  16,
    xl:  20,
    "2xl": 24,
    "3xl": 32,
  },

  // ── Page ────────────────────────────────────────────────────
  pageX: 18,  // horizontal page padding px

  // ── Border Radius ──────────────────────────────────────────
  radius: {
    sm:   14,
    md:   20,
    lg:   24,
    xl:   28,
    pill: 999,
  },

  // ── Shadows ────────────────────────────────────────────────
  shadow: {
    sm: "0 1px 3px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)",
    md: "0 4px 16px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06)",
    lg: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)",
  },

  // ── Typography sizes (px) ──────────────────────────────────
  type: {
    screenTitle: 24,
    sectionLabel: 11,
    metricLarge: 44,
    metricMedium: 28,
    body: 15,
    label: 13,
    caption: 12,
    micro: 11,
  },

  // ── Z-indices ──────────────────────────────────────────────
  z: {
    header: 100,
    bottomNav: 100,
    modal: 200,
    toast: 300,
  },
} as const;

export type ECTokens = typeof EC;
