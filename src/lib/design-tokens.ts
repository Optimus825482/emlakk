// ============================================================================
// DESIGN TOKENS - Merkezi Tailwind CSS Token Sistemi
// ============================================================================
// Bu dosya, projede tutarlı görünüm için merkezi design token tanımları içerir.
// Tüm componentler bu token'ları kullanmalıdır.
// ============================================================================

// =============================================================================
// CORE TOKENS
// =============================================================================

export const tokens = {
  // Border Radius
  radius: {
    sm: "rounded-lg", // 8px - küçük elementler
    md: "rounded-xl", // 12px - kartlar
    lg: "rounded-2xl", // 16px - modal, büyük kartlar
    full: "rounded-full", // pill şekilleri
  },

  // Spacing
  spacing: {
    card: "p-5",
    section: "space-y-6",
    stack: "space-y-4",
    inline: "space-x-2",
  },

  // Typography
  typography: {
    pageTitle: "text-2xl font-bold text-white tracking-tight uppercase",
    sectionTitle: "text-lg font-semibold text-white",
    label: "text-sm font-medium text-slate-300",
    body: "text-sm text-slate-400",
    caption: "text-xs text-slate-500",
  },

  // Colors (semantic)
  colors: {
    primary: "emerald",
    danger: "red",
    warning: "yellow",
    info: "blue",
    neutral: "slate",
  },

  // Shadows
  shadow: {
    card: "shadow-lg shadow-black/20",
    dropdown: "shadow-xl shadow-black/30",
    button: "shadow-lg shadow-emerald-500/20",
  },

  // Transitions
  transition: {
    fast: "transition-all duration-150",
    normal: "transition-all duration-200",
    slow: "transition-all duration-300",
  },
} as const;

// =============================================================================
// COMPONENT TOKENS
// =============================================================================

export const components = {
  card: {
    base: "bg-slate-800 border border-slate-700 rounded-xl p-5",
    hover: "hover:border-slate-600",
    active: "border-emerald-500/30 bg-slate-800/80",
  },

  button: {
    primary:
      "bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold uppercase tracking-wider",
    secondary: "bg-slate-700 hover:bg-slate-600 text-white",
    danger: "bg-red-500 hover:bg-red-400 text-white",
    ghost: "hover:bg-slate-700 text-slate-400 hover:text-white",
  },

  input: {
    base: "bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent",
    label: "block text-sm font-medium text-slate-300 mb-1",
    error: "border-red-500 focus:ring-red-500",
  },

  badge: {
    active: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
    pending: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20",
    sold: "bg-red-500/10 text-red-400 border border-red-500/20",
    draft: "bg-slate-500/10 text-slate-400 border border-slate-500/20",
  },

  sidebar: {
    item: "flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors",
    active: "bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-400",
  },
} as const;

// =============================================================================
// ICON SIZES
// =============================================================================

export const iconSizes = {
  xs: "text-[16px]",
  sm: "text-[20px]",
  md: "text-[24px]",
  lg: "text-[32px]",
  xl: "text-[40px]",
} as const;

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Tailwind class'larını birleştirir, falsy değerleri filtreler
 * @example cn('base-class', isActive && 'active-class', 'another-class')
 */
export function cn(...classes: (string | undefined | false | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type TokenRadius = keyof typeof tokens.radius;
export type TokenSpacing = keyof typeof tokens.spacing;
export type TokenTypography = keyof typeof tokens.typography;
export type TokenShadow = keyof typeof tokens.shadow;
export type TokenTransition = keyof typeof tokens.transition;
export type ComponentCard = keyof typeof components.card;
export type ComponentButton = keyof typeof components.button;
export type ComponentInput = keyof typeof components.input;
export type ComponentBadge = keyof typeof components.badge;
export type ComponentSidebar = keyof typeof components.sidebar;
export type IconSize = keyof typeof iconSizes;
