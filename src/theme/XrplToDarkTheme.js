/**
 * XRPL.to Dark Theme - 2025 Modern DEX Design
 *
 * Design Philosophy:
 * - Pure black background (#000) for OLED optimization and premium feel
 * - Cyan/Light blue accent (#00D4FF) for a futuristic, high-tech vibe
 * - Glassmorphism with subtle frosted glass effects
 * - Minimal, clean interfaces optimized for chart reading and data visualization
 * - Subtle glow effects for depth without overwhelming the UI
 */

const alpha = (color, opacity) => {
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
};

// Core accent color - electric cyan/light blue
const ACCENT = '#00D4FF';
const ACCENT_RGB = '0, 212, 255';

// Secondary accent - subtle purple for depth
const ACCENT_SECONDARY = '#7B61FF';
const ACCENT_SECONDARY_RGB = '123, 97, 255';

export const XrplToDarkTheme = {
  colors: {
    // Electric cyan primary - modern DEX aesthetic
    primary: ACCENT,
    primaryHover: '#33DDFF',
    primaryMuted: `rgba(${ACCENT_RGB}, 0.15)`,

    // Secondary purple accent for variety
    secondary: ACCENT_SECONDARY,
    secondaryMuted: `rgba(${ACCENT_SECONDARY_RGB}, 0.15)`,

    // Semantic colors with modern tones
    success: '#00FF88',
    successMuted: 'rgba(0, 255, 136, 0.15)',
    warning: '#FFB800',
    warningMuted: 'rgba(255, 184, 0, 0.15)',
    error: '#FF3366',
    errorMuted: 'rgba(255, 51, 102, 0.15)',
    info: ACCENT,

    // Base colors
    black: '#000000',
    white: '#FFFFFF',

    // Neutral scale - ultra dark with subtle blue undertones
    neutral: {
      50: '#000000',   // Pure black base
      100: '#050507',  // Near black
      200: '#0A0A0F',  // Card backgrounds
      300: '#0F0F16',  // Elevated surfaces
      400: '#16161F',  // Borders, dividers
      500: '#3A3A4A',  // Muted text
      600: '#6B6B7A',  // Secondary text
      700: '#9A9AAA',  // Body text
      800: '#D0D0DD',  // Emphasized text
      900: '#F5F5FA'   // Primary text
    },

    // Text colors for convenience
    text: {
      primary: '#F5F5FA',
      secondary: '#9A9AAA',
      muted: '#6B6B7A',
      disabled: '#3A3A4A'
    }
  },

  general: {
    borderRadiusSm: '8px',
    borderRadius: '12px',
    borderRadiusLg: '16px',
    borderRadiusXl: '24px',

    // Backgrounds - pure black base
    background: '#000000',
    backgroundAlt: '#050507',
    backgroundAsset: '#0A0A0F',

    // Glassmorphism effects
    glassMorphism: `rgba(${ACCENT_RGB}, 0.03)`,
    glassBackground: 'rgba(10, 10, 15, 0.8)',
    glassBackdrop: 'blur(20px) saturate(180%)',

    // Card styles
    cardBackground: `rgba(${ACCENT_RGB}, 0.02)`,
    cardBackgroundHover: `rgba(${ACCENT_RGB}, 0.05)`,
    cardBackgroundSolid: '#0A0A0F',
    cardBorder: `rgba(${ACCENT_RGB}, 0.08)`,
    cardBorderHover: `rgba(${ACCENT_RGB}, 0.2)`,

    // Surface elevations
    surfaceElevated: '#0F0F16',
    surfaceOverlay: 'rgba(0, 0, 0, 0.85)',

    // Accent glows - subtle ambient lighting effect
    accentGlow: `radial-gradient(ellipse 60% 40% at 50% -10%, rgba(${ACCENT_RGB}, 0.15), transparent)`,
    accentGlowStrong: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(${ACCENT_RGB}, 0.25), transparent)`,
    accentGlowSubtle: `radial-gradient(circle at 50% 0%, rgba(${ACCENT_RGB}, 0.08), transparent 50%)`,

    // Corner glow for cards
    cornerGlow: `radial-gradient(circle at 0% 0%, rgba(${ACCENT_RGB}, 0.1), transparent 40%)`,

    // Borders
    borderSubtle: `rgba(${ACCENT_RGB}, 0.06)`,
    borderMedium: `rgba(${ACCENT_RGB}, 0.12)`,
    borderStrong: `rgba(${ACCENT_RGB}, 0.2)`,
    borderGlow: `0 0 0 1px rgba(${ACCENT_RGB}, 0.1), 0 0 20px rgba(${ACCENT_RGB}, 0.05)`,

    // Interactive states
    hoverGlow: `0 0 30px rgba(${ACCENT_RGB}, 0.1)`,
    focusRing: `0 0 0 2px rgba(${ACCENT_RGB}, 0.3)`,
    activeGlow: `0 0 40px rgba(${ACCENT_RGB}, 0.15)`,

    // Gradient accents
    gradientPrimary: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_SECONDARY} 100%)`,
    gradientSubtle: `linear-gradient(180deg, rgba(${ACCENT_RGB}, 0.05) 0%, transparent 100%)`,
    gradientCard: `linear-gradient(180deg, rgba(${ACCENT_RGB}, 0.03) 0%, rgba(${ACCENT_RGB}, 0.01) 100%)`
  },

  header: {
    height: '56px',
    background: 'rgba(0, 0, 0, 0.9)',
    boxShadow: `0 1px 0 rgba(${ACCENT_RGB}, 0.06)`,
    backdropFilter: 'blur(20px) saturate(180%)',
    borderBottom: `1px solid rgba(${ACCENT_RGB}, 0.06)`,
    textColor: '#F5F5FA',
    // Subtle glow under header
    glow: `0 4px 30px rgba(${ACCENT_RGB}, 0.03)`
  },

  sidebar: {
    background: '#050507',
    textColor: '#6B6B7A',
    textColorHover: '#F5F5FA',
    textColorActive: ACCENT,
    width: '280px',
    itemHover: `rgba(${ACCENT_RGB}, 0.05)`,
    itemActive: `rgba(${ACCENT_RGB}, 0.1)`,
    border: `rgba(${ACCENT_RGB}, 0.06)`
  },

  walletDialog: {
    background: '#0A0A0F',
    backgroundSecondary: '#0F0F16',
    border: `rgba(${ACCENT_RGB}, 0.1)`,
    glow: `0 0 60px rgba(${ACCENT_RGB}, 0.08)`,
    backdrop: 'rgba(0, 0, 0, 0.9)'
  },

  currency: {
    background1: `rgba(${ACCENT_RGB}, 0.04)`,
    background2: `rgba(${ACCENT_RGB}, 0.08)`,
    border: `1px solid rgba(${ACCENT_RGB}, 0.1)`,
    inputBackground: '#0A0A0F',
    inputBorder: `rgba(${ACCENT_RGB}, 0.12)`,
    inputFocus: `rgba(${ACCENT_RGB}, 0.25)`
  },

  chart: {
    background: 'transparent',
    gridColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: `rgba(${ACCENT_RGB}, 0.06)`,
    // Chart-specific colors
    upColor: '#00FF88',
    downColor: '#FF3366',
    volumeColor: `rgba(${ACCENT_RGB}, 0.3)`,
    crosshairColor: `rgba(${ACCENT_RGB}, 0.5)`,
    tooltipBackground: 'rgba(10, 10, 15, 0.95)',
    tooltipBorder: `rgba(${ACCENT_RGB}, 0.15)`
  },

  table: {
    headerBg: 'transparent',
    headerText: '#6B6B7A',
    rowBorder: 'rgba(255, 255, 255, 0.04)',
    rowHover: `rgba(${ACCENT_RGB}, 0.03)`,
    rowSelected: `rgba(${ACCENT_RGB}, 0.08)`,
    cellPadding: '16px 12px',
    // Zebra striping (optional)
    rowAlt: 'rgba(255, 255, 255, 0.01)'
  },

  // Button styles
  button: {
    primary: {
      background: ACCENT,
      backgroundHover: '#33DDFF',
      text: '#000000',
      border: 'none',
      glow: `0 0 20px rgba(${ACCENT_RGB}, 0.3)`
    },
    secondary: {
      background: 'transparent',
      backgroundHover: `rgba(${ACCENT_RGB}, 0.1)`,
      text: ACCENT,
      border: `1px solid rgba(${ACCENT_RGB}, 0.3)`,
      borderHover: `1px solid rgba(${ACCENT_RGB}, 0.5)`
    },
    ghost: {
      background: 'transparent',
      backgroundHover: `rgba(${ACCENT_RGB}, 0.05)`,
      text: '#9A9AAA',
      textHover: '#F5F5FA'
    }
  },

  // Input styles
  input: {
    background: '#0A0A0F',
    backgroundFocus: '#0F0F16',
    border: `rgba(${ACCENT_RGB}, 0.1)`,
    borderFocus: `rgba(${ACCENT_RGB}, 0.3)`,
    text: '#F5F5FA',
    placeholder: '#3A3A4A',
    focusGlow: `0 0 0 3px rgba(${ACCENT_RGB}, 0.1)`
  },

  // Badge/Tag styles
  badge: {
    default: {
      background: 'rgba(255, 255, 255, 0.06)',
      text: '#9A9AAA'
    },
    primary: {
      background: `rgba(${ACCENT_RGB}, 0.15)`,
      text: ACCENT
    },
    success: {
      background: 'rgba(0, 255, 136, 0.15)',
      text: '#00FF88'
    },
    warning: {
      background: 'rgba(255, 184, 0, 0.15)',
      text: '#FFB800'
    },
    error: {
      background: 'rgba(255, 51, 102, 0.15)',
      text: '#FF3366'
    }
  },

  typography: {
    fontFamily: 'var(--font-inter), "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    fontFamilyMono: '"JetBrains Mono", "SF Mono", "Fira Code", "Consolas", monospace',
    fontSize: 13,
    fontVariantNumeric: 'tabular-nums',
    // Font weights
    fontWeightLight: 300,
    fontWeightNormal: 400,
    fontWeightMedium: 500,
    fontWeightSemibold: 600
  },

  // Animation/transition tokens
  motion: {
    fast: '100ms ease-out',
    normal: '200ms ease-out',
    slow: '300ms ease-out',
    spring: '300ms cubic-bezier(0.34, 1.56, 0.64, 1)'
  },

  // Scrollbar styling
  scrollbar: {
    track: 'transparent',
    thumb: `rgba(${ACCENT_RGB}, 0.15)`,
    thumbHover: `rgba(${ACCENT_RGB}, 0.25)`,
    width: '6px'
  },

  // Selection styling
  selection: {
    background: `rgba(${ACCENT_RGB}, 0.3)`,
    text: '#FFFFFF'
  }
};
