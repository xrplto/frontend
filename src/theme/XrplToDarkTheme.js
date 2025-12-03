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
    background: 'linear-gradient(135deg, #000000 0%, #0a0a0f 25%, #050510 50%, #0a0a0a 75%, #000000 100%)',
    backgroundAlt: 'linear-gradient(180deg, #050508 0%, #080810 50%, #050505 100%)',
    backgroundAsset: 'radial-gradient(ellipse at top, #0c0c14 0%, #080808 50%, #050508 100%)',
    glassMorphism: 'rgba(255, 255, 255, 0.04)',
    cardBackground: 'rgba(10, 10, 10, 0.95)',
    cardBackgroundSolid: '#0a0a0a',
    surfaceElevated: 'rgba(15, 15, 15, 0.98)',
    accentGlow: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(255, 255, 255, 0.08), transparent)',
    borderSubtle: 'rgba(255, 255, 255, 0.08)',
    borderMedium: 'rgba(255, 255, 255, 0.15)'
  },

  header: {
    height: '80px',
    background: 'rgba(0, 0, 0, 0.9)',
    boxShadow: '0 1px 0 rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
    textColor: '#FFFFFF'
  },

  sidebar: {
    background: '#000000',
    textColor: '#A0A0A0',
    width: '290px'
  },

  walletDialog: {
    background: '#000000',
    backgroundSecondary: '#080808',
    border: 'rgba(255, 255, 255, 0.15)'
  },

  currency: {
    background1: 'rgba(255, 255, 255, 0.06)',
    background2: 'rgba(255, 255, 255, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.12)'
  },

  chart: {
    background: 'rgba(0, 0, 0, 0.8)',
    gridColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.12)'
  },

  typography: {
    fontFamily: 'var(--font-inter), "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    fontSize: 14,
    fontVariantNumeric: 'tabular-nums'
  }
};
