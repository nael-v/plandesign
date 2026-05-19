/**
 * Design System Tokens
 * Centralized design tokens for colors, spacing, typography, etc.
 */

export const colors = {
  // Semantic
  success: "var(--success)",
  successLight: "var(--success-light)",
  warning: "var(--warning)",
  warningLight: "var(--warning-light)",
  error: "var(--error)",
  errorLight: "var(--error-light)",
  info: "var(--info)",
  infoLight: "var(--info-light)",

  // Slate Palette
  slate: {
    50: "var(--slate-50)",
    100: "var(--slate-100)",
    200: "var(--slate-200)",
    300: "var(--slate-300)",
    400: "var(--slate-400)",
    500: "var(--slate-500)",
    600: "var(--slate-600)",
    700: "var(--slate-700)",
    800: "var(--slate-800)",
    900: "var(--slate-900)",
  },

  // Extended Colors
  emerald: {
    50: "var(--emerald-50)",
    100: "var(--emerald-100)",
    500: "var(--emerald-500)",
    600: "var(--emerald-600)",
  },
  amber: {
    50: "var(--amber-50)",
    100: "var(--amber-100)",
    500: "var(--amber-500)",
  },
  red: {
    50: "var(--red-50)",
    100: "var(--red-100)",
    500: "var(--red-500)",
  },
  blue: {
    50: "var(--blue-50)",
    100: "var(--blue-100)",
    500: "var(--blue-500)",
    600: "var(--blue-600)",
  },
};

export const spacing = {
  0: "var(--space-0)",
  1: "var(--space-1)",
  2: "var(--space-2)",
  3: "var(--space-3)",
  4: "var(--space-4)",
  6: "var(--space-6)",
  8: "var(--space-8)",
  12: "var(--space-12)",
  16: "var(--space-16)",
  20: "var(--space-20)",
  24: "var(--space-24)",
};

export const typography = {
  sizes: {
    xs: "var(--text-xs)",
    sm: "var(--text-sm)",
    base: "var(--text-base)",
    lg: "var(--text-lg)",
    xl: "var(--text-xl)",
    "2xl": "var(--text-2xl)",
    "3xl": "var(--text-3xl)",
  },
  weights: {
    regular: "var(--font-weight-regular)",
    medium: "var(--font-weight-medium)",
    semibold: "var(--font-weight-semibold)",
    bold: "var(--font-weight-bold)",
  },
  lineHeights: {
    tight: "var(--line-height-tight)",
    normal: "var(--line-height-normal)",
    relaxed: "var(--line-height-relaxed)",
  },
};

export const radius = {
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
  xl: "var(--radius-xl)",
  "2xl": "var(--radius-2xl)",
  "3xl": "var(--radius-3xl)",
  full: "var(--radius-full)",
};

export const shadows = {
  xs: "var(--shadow-xs)",
  sm: "var(--shadow-sm)",
  md: "var(--shadow-md)",
  lg: "var(--shadow-lg)",
  xl: "var(--shadow-xl)",
  "2xl": "var(--shadow-2xl)",
};

export const durations = {
  75: "var(--duration-75)",
  100: "var(--duration-100)",
  150: "var(--duration-150)",
  200: "var(--duration-200)",
  300: "var(--duration-300)",
  500: "var(--duration-500)",
  700: "var(--duration-700)",
  1000: "var(--duration-1000)",
};

export const easing = {
  linear: "linear",
  in: "cubic-bezier(0.4, 0, 1, 1)",
  out: "cubic-bezier(0, 0, 0.2, 1)",
  inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
};

/**
 * Responsive breakpoints (Tailwind standard)
 */
export const breakpoints = {
  sm: "640px",
  md: "768px",
  lg: "1024px",
  xl: "1280px",
  "2xl": "1536px",
};

/**
 * Status color mapping
 */
export const statusColors = {
  success: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    badge: "bg-emerald-50 text-emerald-700",
  },
  warning: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    badge: "bg-amber-50 text-amber-700",
  },
  error: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    badge: "bg-red-50 text-red-700",
  },
  info: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    badge: "bg-blue-50 text-blue-700",
  },
};
