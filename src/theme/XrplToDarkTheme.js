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
    primary: '#3b82f6',
    secondary: '#8B92A8',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    black: '#000000',
    white: '#FFFFFF',
    neutral: {
      50: '#0a0a0f',
      100: '#111118',
      200: '#1a1a24',
      300: '#252532',
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
    background: 'linear-gradient(135deg, #000008 0%, #020818 25%, #040d28 50%, #020818 75%, #000008 100%)',
    backgroundAlt: 'linear-gradient(180deg, #000008 0%, #021020 50%, #000510 100%)',
    backgroundAsset: 'radial-gradient(ellipse at top, #081530 0%, #040c20 50%, #010815 100%)',
    glassMorphism: 'rgba(59, 130, 246, 0.05)',
    cardBackground: 'rgba(4, 12, 30, 0.95)',
    cardBackgroundSolid: '#040c1e',
    surfaceElevated: 'rgba(6, 16, 38, 0.98)',
    accentGlow: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59, 130, 246, 0.18), transparent)',
    borderSubtle: 'rgba(59, 130, 246, 0.1)',
    borderMedium: 'rgba(59, 130, 246, 0.2)'
  },

  header: {
    height: '80px',
    background: 'rgba(2, 10, 25, 0.95)',
    boxShadow: '0 1px 0 rgba(59, 130, 246, 0.15)',
    backdropFilter: 'blur(20px)',
    borderBottom: '1px solid rgba(59, 130, 246, 0.15)',
    textColor: '#FFFFFF'
  },

  sidebar: {
    background: '#010815',
    textColor: '#A0A0A0',
    width: '290px'
  },

  walletDialog: {
    background: '#020a1a',
    backgroundSecondary: '#040c1e',
    border: 'rgba(59, 130, 246, 0.2)'
  },

  currency: {
    background1: 'rgba(59, 130, 246, 0.08)',
    background2: 'rgba(59, 130, 246, 0.12)',
    border: '1px solid rgba(59, 130, 246, 0.15)'
  },

  chart: {
    background: 'rgba(2, 10, 24, 0.9)',
    gridColor: 'rgba(59, 130, 246, 0.08)',
    borderColor: 'rgba(59, 130, 246, 0.15)'
  },

  typography: {
    fontFamily: 'var(--font-inter), "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    fontSize: 14,
    fontVariantNumeric: 'tabular-nums'
  }
};
