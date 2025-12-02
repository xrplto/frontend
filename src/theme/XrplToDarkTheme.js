// Simplified Dark Theme - No MUI dependencies
// Color configuration for dark mode

const themeColors = {
  primary: '#147DFE',
  secondary: '#8B92A8',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  black: '#000000',
  white: '#FFFFFF',
  primaryAlt: '#0A0E1A',
  trueWhite: '#ffffff',
  neutral: {
    50: '#18181B',
    100: '#27272A',
    200: '#3F3F46',
    300: '#52525B',
    400: '#71717A',
    500: '#A1A1AA',
    600: '#D4D4D8',
    700: '#E4E4E7',
    800: '#F4F4F5',
    900: '#FAFAFA'
  }
};

// Simple alpha helper (replaces MUI's alpha function)
const alpha = (color, opacity) => {
  // Convert hex to rgba
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  return color;
};

// Simple darken helper
const darken = (color, amount) => color; // Simplified - return original

export const XrplToDarkTheme = {
  // Core color palette
  colors: {
    primary: themeColors.primary,
    secondary: themeColors.secondary,
    success: themeColors.success,
    warning: themeColors.warning,
    error: themeColors.error,
    info: themeColors.info,
    black: themeColors.black,
    white: themeColors.white,
    neutral: themeColors.neutral,

    // Alpha variations
    alpha: {
      white: {
        5: alpha(themeColors.white, 0.02),
        10: alpha(themeColors.white, 0.1),
        30: alpha(themeColors.white, 0.3),
        50: alpha(themeColors.white, 0.5),
        70: alpha(themeColors.white, 0.7),
        100: themeColors.white
      },
      black: {
        5: alpha(themeColors.black, 0.02),
        10: alpha(themeColors.black, 0.1),
        30: alpha(themeColors.black, 0.3),
        50: alpha(themeColors.black, 0.5),
        70: alpha(themeColors.black, 0.7),
        100: themeColors.black
      }
    }
  },

  // Layout configuration
  general: {
    borderRadiusSm: '8px',
    borderRadius: '12px',
    borderRadiusLg: '16px',
    borderRadiusXl: '20px',
    // Premium dark background with subtle gradient
    background: 'linear-gradient(135deg, #0a0a0f 0%, #0d0d14 25%, #080810 50%, #0a0a12 75%, #050508 100%)',
    backgroundAlt: '#08080c',
    backgroundAsset: '#0a0a10',
    backgroundTrait: alpha('#ffffff', 0.08),
    borderTrait: '#ffffff',
    // Enhanced glass morphism for premium feel
    glassMorphism: 'rgba(255, 255, 255, 0.03)',
    glassMorphismHover: 'rgba(255, 255, 255, 0.06)',
    cardBackground: 'rgba(12, 12, 18, 0.8)',
    cardBackgroundSolid: '#0c0c12',
    surfaceElevated: 'rgba(18, 18, 26, 0.9)',
    // Subtle accent glow for depth
    accentGlow: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(20, 125, 254, 0.15), transparent)',
    accentGlowGreen: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(16, 185, 129, 0.08), transparent)',
    // Premium border styling
    borderSubtle: 'rgba(255, 255, 255, 0.06)',
    borderMedium: 'rgba(255, 255, 255, 0.1)',
    borderStrong: 'rgba(255, 255, 255, 0.15)'
  },

  // Header configuration
  header: {
    height: '80px',
    background: 'rgba(8, 8, 12, 0.85)',
    boxShadow: '0 1px 0 rgba(255, 255, 255, 0.04), 0 4px 24px rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(24px) saturate(180%)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    textColor: themeColors.white
  },

  // Sidebar configuration
  sidebar: {
    background: themeColors.primaryAlt,
    textColor: themeColors.secondary,
    width: '290px'
  },

  // Wallet dialog
  walletDialog: {
    background: 'rgba(0, 0, 0, 0.95)',
    backgroundSecondary: 'rgba(0, 0, 0, 0.6)',
    border: alpha('#ffffff', 0.1)
  },

  // Currency component
  currency: {
    background1: alpha('#ffffff', 0.05),
    background2: alpha('#ffffff', 0.08),
    border: `1px solid ${alpha('#ffffff', 0.1)}`
  },

  // Chart configuration
  chart: {
    background: 'rgba(10, 10, 16, 0.6)',
    gridColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },

  // Typography
  typography: {
    fontFamily: 'var(--font-inter), "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    fontSize: 14,
    fontVariantNumeric: 'tabular-nums'
  }
};
