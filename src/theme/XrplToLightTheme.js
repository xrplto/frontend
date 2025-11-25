// Simplified Light Theme - No MUI dependencies
// Color configuration for light mode

const themeColors = {
  primary: '#147DFE',
  secondary: '#64748B',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  black: '#000000',
  white: '#ffffff',
  primaryAlt: '#E5F3FF',
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A'
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

// Simple lighten/darken helpers
const lighten = (color, amount) => color; // Simplified - return original
const darken = (color, amount) => color; // Simplified - return original

export const XrplToLightTheme = {
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
    backgroundAlt: '#F8FAFC',
    backgroundAsset: '#F1F5F9',
    backgroundTrait: '#E0F2FE',
    borderTrait: '#0EA5E9',
    surfaceElevated: '#FFFFFF',
    surfaceHover: '#F8FAFC',
    surfacePressed: '#F1F5F9'
  },

  // Header configuration
  header: {
    height: '80px',
    background: '#FFFFFF',
    boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
    textColor: themeColors.black,
    borderBottom: '1px solid #E2E8F0'
  },

  // Sidebar configuration
  sidebar: {
    background: themeColors.white,
    textColor: themeColors.secondary,
    dividerBg: '#FFFFFF',
    menuItemColor: '#242E6F',
    menuItemColorActive: themeColors.primary,
    menuItemBg: themeColors.white,
    menuItemBgActive: '#FFFFFF',
    boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
    width: '290px'
  },

  // Wallet dialog
  walletDialog: {
    background: '#FFFFFF',
    backgroundSecondary: alpha('#F8F9FA', 0.95),
    border: alpha('#E5E7EB', 0.2)
  },

  // Currency component
  currency: {
    background1: '#E9ECEF',
    background2: '#F8F9FA',
    border: '1.5px solid #E0E7EC'
  },

  // Chart configuration
  chart: {
    background: '#FFFFFF',
    gridColor: '#F1F5F9',
    borderColor: '#E2E8F0'
  },

  // Typography
  typography: {
    fontFamily: 'var(--font-inter), "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    fontSize: 14,
    fontVariantNumeric: 'tabular-nums'
  }
};
