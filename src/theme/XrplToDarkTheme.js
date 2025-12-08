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
    secondary: '#6b7280',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    black: '#000000',
    white: '#FFFFFF',
    neutral: {
      50: '#050508',
      100: '#0a0a0f',
      200: '#12121a',
      300: '#1a1a24',
      400: '#52525b',
      500: '#71717a',
      600: '#a1a1aa',
      700: '#d4d4d8',
      800: '#e4e4e7',
      900: '#fafafa'
    }
  },

  general: {
    borderRadiusSm: '8px',
    borderRadius: '12px',
    borderRadiusLg: '16px',
    borderRadiusXl: '20px',
    background: '#030303',
    backgroundAlt: '#050508',
    backgroundAsset: '#0a0a0f',
    glassMorphism: 'rgba(59, 130, 246, 0.02)',
    cardBackground: 'rgba(59, 130, 246, 0.02)',
    cardBackgroundSolid: '#0a0a0f',
    surfaceElevated: '#0f0f14',
    accentGlow: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59, 130, 246, 0.12), transparent)',
    borderSubtle: 'rgba(59, 130, 246, 0.08)',
    borderMedium: 'rgba(59, 130, 246, 0.15)'
  },

  header: {
    height: '56px',
    background: 'rgba(5, 5, 8, 0.95)',
    boxShadow: 'none',
    backdropFilter: 'blur(12px)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
    textColor: '#FFFFFF'
  },

  sidebar: {
    background: '#050508',
    textColor: '#71717a',
    width: '280px'
  },

  walletDialog: {
    background: '#0a0a0f',
    backgroundSecondary: '#12121a',
    border: 'rgba(255, 255, 255, 0.08)'
  },

  currency: {
    background1: 'rgba(59, 130, 246, 0.04)',
    background2: 'rgba(59, 130, 246, 0.08)',
    border: '1px solid rgba(59, 130, 246, 0.1)'
  },

  chart: {
    background: 'transparent',
    gridColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.06)'
  },

  table: {
    headerBg: 'transparent',
    rowBorder: 'rgba(255, 255, 255, 0.06)',
    rowHover: 'rgba(255, 255, 255, 0.02)',
    cellPadding: '16px 12px'
  },

  typography: {
    fontFamily: 'var(--font-inter), "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    fontSize: 13,
    fontVariantNumeric: 'tabular-nums'
  }
};
