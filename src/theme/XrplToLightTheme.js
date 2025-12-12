/**
 * XRPL.to Light Theme - 2025 Modern DEX Design
 * Clean, airy aesthetic with cyan accents matching dark theme
 */

// Core accent color - electric cyan (matches dark theme)
const ACCENT = '#0099CC';
const ACCENT_RGB = '0, 153, 204';

// Secondary accent
const ACCENT_SECONDARY = '#6366F1';
const ACCENT_SECONDARY_RGB = '99, 102, 241';

export const XrplToLightTheme = {
  colors: {
    primary: ACCENT,
    primaryHover: '#00AADD',
    primaryMuted: `rgba(${ACCENT_RGB}, 0.12)`,

    secondary: ACCENT_SECONDARY,
    secondaryMuted: `rgba(${ACCENT_SECONDARY_RGB}, 0.12)`,

    success: '#00C853',
    successMuted: 'rgba(0, 200, 83, 0.12)',
    warning: '#FF9800',
    warningMuted: 'rgba(255, 152, 0, 0.12)',
    error: '#F44336',
    errorMuted: 'rgba(244, 67, 54, 0.12)',
    info: ACCENT,

    black: '#000000',
    white: '#FFFFFF',

    neutral: {
      50: '#FFFFFF',
      100: '#FAFBFC',
      200: '#F4F6F8',
      300: '#E8ECF0',
      400: '#D0D5DC',
      500: '#9AA4B0',
      600: '#6B7685',
      700: '#4A5568',
      800: '#2D3748',
      900: '#1A202C'
    },

    text: {
      primary: '#1A202C',
      secondary: '#4A5568',
      muted: '#6B7685',
      disabled: '#9AA4B0'
    }
  },

  general: {
    borderRadiusSm: '8px',
    borderRadius: '12px',
    borderRadiusLg: '16px',
    borderRadiusXl: '24px',

    background: '#FAFBFC',
    backgroundAlt: '#F4F6F8',
    backgroundAsset: '#FFFFFF',

    glassMorphism: `rgba(${ACCENT_RGB}, 0.03)`,
    glassBackground: 'rgba(255, 255, 255, 0.8)',
    glassBackdrop: 'blur(20px) saturate(180%)',

    cardBackground: `rgba(${ACCENT_RGB}, 0.02)`,
    cardBackgroundHover: `rgba(${ACCENT_RGB}, 0.05)`,
    cardBackgroundSolid: '#FFFFFF',
    cardBorder: `rgba(${ACCENT_RGB}, 0.1)`,
    cardBorderHover: `rgba(${ACCENT_RGB}, 0.25)`,

    surfaceElevated: '#FFFFFF',
    surfaceOverlay: 'rgba(255, 255, 255, 0.9)',

    accentGlow: `radial-gradient(ellipse 60% 40% at 50% -10%, rgba(${ACCENT_RGB}, 0.1), transparent)`,
    accentGlowStrong: `radial-gradient(ellipse 80% 50% at 50% -20%, rgba(${ACCENT_RGB}, 0.15), transparent)`,
    accentGlowSubtle: `radial-gradient(circle at 50% 0%, rgba(${ACCENT_RGB}, 0.06), transparent 50%)`,
    cornerGlow: `radial-gradient(circle at 0% 0%, rgba(${ACCENT_RGB}, 0.08), transparent 40%)`,

    borderSubtle: `rgba(${ACCENT_RGB}, 0.08)`,
    borderMedium: `rgba(${ACCENT_RGB}, 0.15)`,
    borderStrong: `rgba(${ACCENT_RGB}, 0.25)`,
    borderGlow: `0 0 0 1px rgba(${ACCENT_RGB}, 0.1), 0 0 20px rgba(${ACCENT_RGB}, 0.05)`,

    hoverGlow: `0 0 30px rgba(${ACCENT_RGB}, 0.08)`,
    focusRing: `0 0 0 2px rgba(${ACCENT_RGB}, 0.25)`,
    activeGlow: `0 0 40px rgba(${ACCENT_RGB}, 0.1)`,

    gradientPrimary: `linear-gradient(135deg, ${ACCENT} 0%, ${ACCENT_SECONDARY} 100%)`,
    gradientSubtle: `linear-gradient(180deg, rgba(${ACCENT_RGB}, 0.04) 0%, transparent 100%)`,
    gradientCard: `linear-gradient(180deg, rgba(${ACCENT_RGB}, 0.02) 0%, rgba(${ACCENT_RGB}, 0.01) 100%)`
  },

  header: {
    height: '56px',
    background: 'rgba(255, 255, 255, 0.9)',
    boxShadow: `0 1px 0 rgba(${ACCENT_RGB}, 0.08)`,
    backdropFilter: 'blur(20px) saturate(180%)',
    borderBottom: `1px solid rgba(${ACCENT_RGB}, 0.08)`,
    textColor: '#1A202C',
    glow: `0 4px 30px rgba(${ACCENT_RGB}, 0.03)`
  },

  sidebar: {
    background: '#F4F6F8',
    textColor: '#6B7685',
    textColorHover: '#1A202C',
    textColorActive: ACCENT,
    width: '280px',
    itemHover: `rgba(${ACCENT_RGB}, 0.06)`,
    itemActive: `rgba(${ACCENT_RGB}, 0.1)`,
    border: `rgba(${ACCENT_RGB}, 0.08)`
  },

  walletDialog: {
    background: '#FFFFFF',
    backgroundSecondary: '#F4F6F8',
    border: `rgba(${ACCENT_RGB}, 0.12)`,
    glow: `0 0 60px rgba(${ACCENT_RGB}, 0.06)`,
    backdrop: 'rgba(255, 255, 255, 0.9)'
  },

  currency: {
    background1: `rgba(${ACCENT_RGB}, 0.04)`,
    background2: `rgba(${ACCENT_RGB}, 0.08)`,
    border: `1px solid rgba(${ACCENT_RGB}, 0.12)`,
    inputBackground: '#FFFFFF',
    inputBorder: `rgba(${ACCENT_RGB}, 0.15)`,
    inputFocus: `rgba(${ACCENT_RGB}, 0.3)`
  },

  chart: {
    background: 'transparent',
    gridColor: 'rgba(0, 0, 0, 0.04)',
    borderColor: `rgba(${ACCENT_RGB}, 0.08)`,
    upColor: '#00C853',
    downColor: '#F44336',
    volumeColor: `rgba(${ACCENT_RGB}, 0.25)`,
    crosshairColor: `rgba(${ACCENT_RGB}, 0.5)`,
    tooltipBackground: 'rgba(255, 255, 255, 0.95)',
    tooltipBorder: `rgba(${ACCENT_RGB}, 0.15)`
  },

  table: {
    headerBg: 'transparent',
    headerText: '#6B7685',
    rowBorder: 'rgba(0, 0, 0, 0.05)',
    rowHover: `rgba(${ACCENT_RGB}, 0.04)`,
    rowSelected: `rgba(${ACCENT_RGB}, 0.08)`,
    cellPadding: '16px 12px',
    rowAlt: 'rgba(0, 0, 0, 0.01)'
  },

  button: {
    primary: {
      background: ACCENT,
      backgroundHover: '#00AADD',
      text: '#FFFFFF',
      border: 'none',
      glow: `0 0 20px rgba(${ACCENT_RGB}, 0.25)`
    },
    secondary: {
      background: 'transparent',
      backgroundHover: `rgba(${ACCENT_RGB}, 0.08)`,
      text: ACCENT,
      border: `1px solid rgba(${ACCENT_RGB}, 0.3)`,
      borderHover: `1px solid rgba(${ACCENT_RGB}, 0.5)`
    },
    ghost: {
      background: 'transparent',
      backgroundHover: `rgba(${ACCENT_RGB}, 0.06)`,
      text: '#4A5568',
      textHover: '#1A202C'
    }
  },

  input: {
    background: '#FFFFFF',
    backgroundFocus: '#FFFFFF',
    border: `rgba(${ACCENT_RGB}, 0.15)`,
    borderFocus: `rgba(${ACCENT_RGB}, 0.4)`,
    text: '#1A202C',
    placeholder: '#9AA4B0',
    focusGlow: `0 0 0 3px rgba(${ACCENT_RGB}, 0.1)`
  },

  badge: {
    default: {
      background: 'rgba(0, 0, 0, 0.05)',
      text: '#4A5568'
    },
    primary: {
      background: `rgba(${ACCENT_RGB}, 0.12)`,
      text: ACCENT
    },
    success: {
      background: 'rgba(0, 200, 83, 0.12)',
      text: '#00C853'
    },
    warning: {
      background: 'rgba(255, 152, 0, 0.12)',
      text: '#FF9800'
    },
    error: {
      background: 'rgba(244, 67, 54, 0.12)',
      text: '#F44336'
    }
  },

  typography: {
    fontFamily: 'var(--font-inter), "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    fontFamilyMono: '"JetBrains Mono", "SF Mono", "Fira Code", "Consolas", monospace',
    fontSize: 13,
    fontVariantNumeric: 'tabular-nums',
    fontWeightLight: 300,
    fontWeightNormal: 400,
    fontWeightMedium: 500,
    fontWeightSemibold: 600
  },

  motion: {
    fast: '100ms ease-out',
    normal: '200ms ease-out',
    slow: '300ms ease-out',
    spring: '300ms cubic-bezier(0.34, 1.56, 0.64, 1)'
  },

  scrollbar: {
    track: 'transparent',
    thumb: `rgba(${ACCENT_RGB}, 0.2)`,
    thumbHover: `rgba(${ACCENT_RGB}, 0.35)`,
    width: '6px'
  },

  selection: {
    background: `rgba(${ACCENT_RGB}, 0.25)`,
    text: '#1A202C'
  }
};
