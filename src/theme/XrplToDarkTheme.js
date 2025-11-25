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
    backgroundAlt: '#000000',
    backgroundAsset: '#000000',
    backgroundTrait: alpha('#ffffff', 0.1),
    borderTrait: '#ffffff',
    glassMorphism: 'rgba(255, 255, 255, 0.05)',
    cardBackground: '#000000',
    surfaceElevated: '#111111'
  },

  // Header configuration
  header: {
    height: '80px',
    background: '#000000',
    boxShadow: '0px 1px 0px rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px) saturate(180%)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
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
    background: '#000000',
    gridColor: alpha('#ffffff', 0.1),
    borderColor: alpha('#ffffff', 0.2)
  },

  // Typography
  typography: {
    fontFamily: 'var(--font-inter), "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    fontSize: 14,
    fontVariantNumeric: 'tabular-nums'
  }
};
