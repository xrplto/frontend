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

export const XrplToDarkTheme = {
  colors: {
    primary: '#147DFE',
    secondary: '#8B92A8',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3',
    black: '#000000',
    white: '#FFFFFF',
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
  },

  general: {
    borderRadiusSm: '8px',
    borderRadius: '12px',
    borderRadiusLg: '16px',
    borderRadiusXl: '20px',
    background: 'linear-gradient(135deg, #0a0a0f 0%, #0d0d14 25%, #080810 50%, #0a0a12 75%, #050508 100%)',
    backgroundAlt: '#08080c',
    backgroundAsset: '#0a0a10',
    glassMorphism: 'rgba(255, 255, 255, 0.03)',
    cardBackground: 'rgba(12, 12, 18, 0.8)',
    cardBackgroundSolid: '#0c0c12',
    surfaceElevated: 'rgba(18, 18, 26, 0.9)',
    accentGlow: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(20, 125, 254, 0.15), transparent)',
    borderSubtle: 'rgba(255, 255, 255, 0.06)',
    borderMedium: 'rgba(255, 255, 255, 0.1)'
  },

  header: {
    height: '80px',
    background: 'rgba(8, 8, 12, 0.85)',
    boxShadow: '0 1px 0 rgba(255, 255, 255, 0.04), 0 4px 24px rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(24px) saturate(180%)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    textColor: '#FFFFFF'
  },

  sidebar: {
    background: '#0A0E1A',
    textColor: '#8B92A8',
    width: '290px'
  },

  walletDialog: {
    background: '#000000',
    backgroundSecondary: '#0c0c12',
    border: 'rgba(255, 255, 255, 0.1)'
  },

  currency: {
    background1: 'rgba(255, 255, 255, 0.05)',
    background2: 'rgba(255, 255, 255, 0.08)',
    border: '1px solid rgba(255, 255, 255, 0.1)'
  },

  chart: {
    background: 'rgba(10, 10, 16, 0.6)',
    gridColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)'
  },

  typography: {
    fontFamily: 'var(--font-inter), "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    fontSize: 14,
    fontVariantNumeric: 'tabular-nums'
  }
};
