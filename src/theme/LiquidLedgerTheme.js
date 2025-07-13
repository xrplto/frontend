import { alpha, createTheme, darken, lighten } from '@mui/material';
import '@mui/lab/themeAugmentation';

// XRP Ledger inspired color palette - liquidity, speed, trust
const themeColors = {
  primary: '#23292F',      // Deep Charcoal (XRPL Brand)
  secondary: '#00D4E6',    // Liquid Cyan
  success: '#00E676',      // Validator Green
  warning: '#FFB74D',      // Consensus Amber
  error: '#FF5252',        // Failed Transaction Red
  info: '#536DFE',         // Network Blue
  black: '#0A0E12',        // Ledger Black
  white: '#F8FAFB',        // Paper White
  primaryAlt: '#1C2126',   // Dark Slate
  trueWhite: '#FFFFFF',
  accent: '#7B61FF',       // Purple Accent
  teal: '#00BFA5',         // Teal Accent
  gold: '#FFD700'          // Gold Accent
};

const colors = {
  gradients: {
    blue1: 'linear-gradient(135deg, #00D4E6 0%, #536DFE 100%)',
    blue2: 'linear-gradient(135deg, #536DFE 0%, #7B61FF 100%)',
    blue3: 'linear-gradient(127.55deg, #0A0E12 3.73%, #1C2126 92.26%)',
    blue4: 'linear-gradient(-20deg, #00D4E6 0%, #00BFA5 50%, #00E676 100%)',
    blue5: 'linear-gradient(135deg, #536DFE 10%, #0A0E12 100%)',
    orange1: 'linear-gradient(135deg, #FFB74D 0%, #FF8A65 100%)',
    orange2: 'linear-gradient(135deg, #FFCC80 0%, #FFD700 100%)',
    orange3: 'linear-gradient(120deg, #FFB74D 0%, #FF5252 100%)',
    purple1: 'linear-gradient(135deg, #536DFE 0%, #7B61FF 50%, #9C27B0 100%)',
    purple3: 'linear-gradient(135deg, #7B61FF 0%, #536DFE 100%)',
    pink1: 'linear-gradient(135deg, #F8BBD0 0%, #E91E63 100%)',
    pink2: 'linear-gradient(135deg, #FF5252 0%, #E91E63 100%)',
    green1: 'linear-gradient(135deg, #00E676 0%, #00BFA5 50%, #00D4E6 100%)',
    green2: 'linear-gradient(to bottom, #69F0AE 0%, #00E676 100%)',
    black1: 'linear-gradient(100.66deg, #1C2126 6.56%, #0A0E12 93.57%)',
    black2: 'linear-gradient(60deg, #0A0E12 0%, #23292F 100%)',
    ripple: 'radial-gradient(circle at 50% 50%, rgba(0, 212, 230, 0.3) 0%, transparent 50%)',
    mesh: 'radial-gradient(at 50% 50%, #00D4E6 0%, transparent 50%), radial-gradient(at 80% 80%, #7B61FF 0%, transparent 50%), radial-gradient(at 20% 80%, #00BFA5 0%, transparent 50%)',
    aurora: 'linear-gradient(45deg, #00D4E6 0%, #7B61FF 25%, #00BFA5 50%, #536DFE 75%, #00D4E6 100%)',
    holographic: 'linear-gradient(45deg, #00D4E6, #7B61FF, #00BFA5, #FFD700, #00D4E6)'
  },
  shadows: {
    success: '0px 0px 20px rgba(0, 230, 118, 0.5), 0px 0px 40px rgba(0, 230, 118, 0.3), inset 0px 0px 20px rgba(0, 230, 118, 0.1)',
    error: '0px 0px 20px rgba(255, 82, 82, 0.5), 0px 0px 40px rgba(255, 82, 82, 0.3), inset 0px 0px 20px rgba(255, 82, 82, 0.1)',
    info: '0px 0px 20px rgba(83, 109, 254, 0.5), 0px 0px 40px rgba(83, 109, 254, 0.3), inset 0px 0px 20px rgba(83, 109, 254, 0.1)',
    primary: '0px 0px 20px rgba(0, 212, 230, 0.5), 0px 0px 40px rgba(123, 97, 255, 0.3)',
    warning: '0px 0px 20px rgba(255, 183, 77, 0.5), 0px 0px 40px rgba(255, 183, 77, 0.3), inset 0px 0px 20px rgba(255, 215, 0, 0.2)',
    card: '0px 10px 40px rgba(0, 212, 230, 0.2), 0px 2px 20px rgba(123, 97, 255, 0.15), inset 0px 0px 60px rgba(0, 212, 230, 0.05)',
    cardSm: '0px 5px 20px rgba(0, 212, 230, 0.15), 0px 2px 10px rgba(123, 97, 255, 0.1)',
    cardLg: '0px 20px 60px rgba(0, 212, 230, 0.25), 0px 5px 40px rgba(123, 97, 255, 0.2), inset 0px 0px 80px rgba(0, 191, 165, 0.1)',
    glow: '0 0 30px rgba(0, 212, 230, 0.6), 0 0 60px rgba(0, 212, 230, 0.4), 0 0 90px rgba(0, 212, 230, 0.2)'
  },
  layout: {
    general: {
      bodyBg: '#F0F4F7'
    },
    sidebar: {
      background: alpha('#FFFFFF', 0.95),
      textColor: '#23292F',
      dividerBg: alpha('#00D4E6', 0.1),
      menuItemColor: '#5A6670',
      menuItemColorActive: '#00D4E6',
      menuItemBg: 'transparent',
      menuItemBgActive: alpha('#00D4E6', 0.08),
      menuItemIconColor: '#536DFE',
      menuItemIconColorActive: '#00D4E6',
      menuItemHeadingColor: '#23292F'
    }
  },
  alpha: {
    white: {
      5: alpha(themeColors.white, 0.02),
      10: alpha(themeColors.white, 0.1),
      30: alpha(themeColors.white, 0.3),
      50: alpha(themeColors.white, 0.5),
      70: alpha(themeColors.white, 0.7),
      100: themeColors.white
    },
    trueWhite: {
      5: alpha(themeColors.trueWhite, 0.02),
      10: alpha(themeColors.trueWhite, 0.1),
      30: alpha(themeColors.trueWhite, 0.3),
      50: alpha(themeColors.trueWhite, 0.5),
      70: alpha(themeColors.trueWhite, 0.7),
      100: themeColors.trueWhite
    },
    black: {
      5: alpha(themeColors.black, 0.02),
      10: alpha(themeColors.black, 0.1),
      30: alpha(themeColors.black, 0.3),
      50: alpha(themeColors.black, 0.5),
      70: alpha(themeColors.black, 0.7),
      100: themeColors.black
    }
  },
  primary: {
    lighter: alpha(themeColors.primary, 0.1),
    light: alpha(themeColors.primary, 0.3),
    main: themeColors.primary,
    dark: darken(themeColors.primary, 0.2)
  },
  secondary: {
    lighter: alpha(themeColors.secondary, 0.1),
    light: alpha(themeColors.secondary, 0.3),
    main: themeColors.secondary,
    dark: darken(themeColors.secondary, 0.2)
  },
  success: {
    lighter: alpha(themeColors.success, 0.1),
    light: alpha(themeColors.success, 0.3),
    main: themeColors.success,
    dark: darken(themeColors.success, 0.2)
  },
  warning: {
    lighter: alpha(themeColors.warning, 0.1),
    light: alpha(themeColors.warning, 0.3),
    main: themeColors.warning,
    dark: darken(themeColors.warning, 0.2)
  },
  error: {
    lighter: alpha(themeColors.error, 0.1),
    light: alpha(themeColors.error, 0.3),
    main: themeColors.error,
    dark: darken(themeColors.error, 0.2)
  },
  info: {
    lighter: alpha(themeColors.info, 0.1),
    light: alpha(themeColors.info, 0.3),
    main: themeColors.info,
    dark: darken(themeColors.info, 0.2)
  }
};

export const LiquidLedgerTheme = createTheme({
  colors: {
    gradients: colors.gradients,
    shadows: colors.shadows,
    alpha: colors.alpha,
    primary: colors.primary,
    secondary: colors.secondary,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.info
  },
  general: {
    reactFrameworkColor: '#00D4E680',
    borderRadiusSm: '8px',
    borderRadius: '12px',
    borderRadiusLg: '16px',
    borderRadiusXl: '24px',
    backgroundAlt: alpha('#FFFFFF', 0.7),
    backgroundAsset: alpha('#00D4E6', 0.04),
    backgroundTrait: alpha('#536DFE', 0.08),
    borderTrait: '#536DFE'
  },
  sidebar: {
    background: colors.layout.sidebar.background,
    textColor: colors.layout.sidebar.textColor,
    dividerBg: colors.layout.sidebar.dividerBg,
    menuItemColor: colors.layout.sidebar.menuItemColor,
    menuItemColorActive: colors.layout.sidebar.menuItemColorActive,
    menuItemBg: colors.layout.sidebar.menuItemBg,
    menuItemBgActive: colors.layout.sidebar.menuItemBgActive,
    menuItemIconColor: colors.layout.sidebar.menuItemIconColor,
    menuItemIconColorActive: colors.layout.sidebar.menuItemIconColorActive,
    menuItemHeadingColor: colors.layout.sidebar.menuItemHeadingColor,
    boxShadow: '0px 0px 30px rgba(0, 0, 0, 0.08)',
    width: '290px'
  },
  header: {
    height: '80px',
    background: alpha('#FFFFFF', 0.95),
    boxShadow: '0px 2px 10px rgba(0, 0, 0, 0.05)',
    textColor: colors.primary.main
  },
  spacing: 9,
  currency: {
    background1: alpha('#00D4E6', 0.08),
    background2: alpha('#536DFE', 0.08), 
    border: `1px solid ${alpha('#00D4E6', 0.2)}`
  },
  palette: {
    common: {
      black: themeColors.black,
      white: themeColors.white
    },
    mode: 'light',
    primary: { main: '#23292F', light: '#3A424A', dark: '#1A1F24', contrastText: '#FFFFFF' },
    secondary: { main: '#00D4E6', light: '#33DDEB', dark: '#00A8B8', contrastText: '#000000' },
    background: { default: '#F0F4F7', paper: '#FFFFFF' },
    text: { primary: '#23292F', secondary: '#5A6670', disabled: alpha('#23292F', 0.5) },
    error: { main: '#FF5252', light: '#FF7575', dark: '#E04848', contrastText: '#FFFFFF' },
    warning: { main: '#FFB74D', light: '#FFC670', dark: '#F5A033', contrastText: '#000000' },
    success: { main: '#00E676', light: '#33EB96', dark: '#00C65A', contrastText: '#000000' },
    info: { main: '#536DFE', light: '#758AFE', dark: '#3F51E7', contrastText: '#FFFFFF' },
    action: {
      active: colors.alpha.black[100],
      hover: alpha(themeColors.secondary, 0.08),
      hoverOpacity: 0.08,
      selected: alpha(themeColors.secondary, 0.12),
      selectedOpacity: 0.12,
      disabled: alpha(themeColors.black, 0.3),
      disabledBackground: alpha(themeColors.black, 0.05),
      disabledOpacity: 0.38,
      focus: alpha(themeColors.secondary, 0.12),
      focusOpacity: 0.12,
      activatedOpacity: 0.12
    },
    divider: 'rgba(0,0,0,0.06)',
    tonalOffset: 0.2
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920
    }
  },
  typography: {
    fontFamily: '"Inter", "SF Pro Display", "Segoe UI", "Roboto", "Arial", sans-serif',
    h1: { 
      fontWeight: 700, 
      fontSize: '2.5rem', 
      letterSpacing: '-0.03em',
      background: colors.gradients.blue1,
      backgroundClip: 'text',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      textShadow: '0 2px 10px rgba(0,212,230,0.3)'
    },
    h2: { 
      fontWeight: 600, 
      fontSize: '1.75rem', 
      letterSpacing: '-0.025em',
      color: themeColors.primary
    },
    h3: { fontWeight: 500, fontSize: '1.25rem', letterSpacing: '-0.015em' },
    h4: { fontWeight: 500, fontSize: '1rem' },
    h5: { fontWeight: 500, fontSize: '0.875rem' },
    h6: { fontWeight: 500, fontSize: '0.75rem' },
    subtitle1: { fontWeight: 400, letterSpacing: '0.01em' },
    subtitle2: { fontWeight: 400, letterSpacing: '0.01em' },
    body1: { fontSize: '0.875rem', letterSpacing: '0.005em', lineHeight: 1.6 },
    body2: { fontSize: '0.875rem', letterSpacing: '0.005em', lineHeight: 1.6 },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.02em' }
  },
  shape: { borderRadius: 12 },
  shadows: [
    'none',
    '0 1px 3px 0 rgba(0,0,0,0.04)',
    '0 2px 4px 0 rgba(0,0,0,0.06)',
    '0 3px 6px 0 rgba(0,0,0,0.08)',
    '0 4px 8px 0 rgba(0,0,0,0.10)',
    '0 5px 10px 0 rgba(0,0,0,0.12)',
    '0 6px 12px 0 rgba(0,0,0,0.14)',
    '0 7px 14px 0 rgba(0,0,0,0.16)',
    '0 8px 16px 0 rgba(0,0,0,0.18)',
    '0 9px 18px 0 rgba(0,0,0,0.20)',
    '0 10px 20px 0 rgba(0,0,0,0.22)',
    '0 11px 22px 0 rgba(0,0,0,0.24)',
    '0 12px 24px 0 rgba(0,0,0,0.26)',
    '0 13px 26px 0 rgba(0,0,0,0.28)',
    '0 14px 28px 0 rgba(0,0,0,0.30)',
    '0 15px 30px 0 rgba(0,0,0,0.32)',
    '0 16px 32px 0 rgba(0,0,0,0.34)',
    '0 17px 34px 0 rgba(0,0,0,0.36)',
    '0 18px 36px 0 rgba(0,0,0,0.38)',
    '0 19px 38px 0 rgba(0,0,0,0.40)',
    '0 20px 40px 0 rgba(0,0,0,0.42)',
    '0 21px 42px 0 rgba(0,0,0,0.44)',
    '0 22px 44px 0 rgba(0,0,0,0.46)',
    '0 23px 46px 0 rgba(0,0,0,0.48)',
    '0 24px 48px 0 rgba(0,0,0,0.50)'
  ],
  components: {
    MuiToolbar: {
      styleOverrides: {
        root: { minHeight: '0 !important', padding: '0 !important' }
      }
    },
    MuiContainer: {
      styleOverrides: {
        root: { paddingLeft: '16px !important', paddingRight: '16px !important' },
        maxWidthLg: { maxWidth: '1700px !important' },
        maxWidthXl: { maxWidth: '2000px !important' }
      }
    },
    MuiCssBaseline: {
      styleOverrides: {
        'html, body': { width: '100%', height: '100%' },
        body: {
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100%',
          width: '100%',
          flex: 1,
          background: 'linear-gradient(135deg, #F0F4F7 0%, #E8F5F9 50%, #F3E5F5 100%)',
          position: 'relative',
          scrollBehavior: 'smooth',
          '&::before': {
            content: '""',
            position: 'fixed',
            top: '-50%',
            left: '-50%',
            right: '-50%',
            bottom: '-50%',
            background: `
              radial-gradient(circle at 20% 30%, rgba(0,212,230,0.15) 0%, transparent 40%),
              radial-gradient(circle at 80% 70%, rgba(123,97,255,0.1) 0%, transparent 40%),
              radial-gradient(circle at 50% 50%, rgba(0,191,165,0.08) 0%, transparent 60%)
            `,
            zIndex: -3,
            pointerEvents: 'none',
            animation: 'floatingOrbs 20s ease-in-out infinite',
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' }
          },
          '&::after': {
            content: '""',
            position: 'fixed',
            top: '50%',
            left: '50%',
            width: '300vmax',
            height: '300vmax',
            background: colors.gradients.aurora,
            opacity: 0.03,
            transform: 'translate(-50%, -50%) rotate(0deg)',
            zIndex: -2,
            pointerEvents: 'none',
            animation: 'liquidFlow 40s linear infinite',
            filter: 'blur(40px)',
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' }
          },
          scrollbarColor: `${alpha('#00D4E6', 0.3)} ${alpha('#F0F4F7', 0.3)}`,
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            backgroundColor: alpha('#F0F4F7', 0.3),
            width: '10px',
            height: '10px'
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 10,
            backgroundColor: alpha('#00D4E6', 0.3),
            border: `2px solid transparent`,
            backgroundClip: 'content-box'
          },
          '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
            backgroundColor: alpha('#00D4E6', 0.5)
          }
        },
        '#__next': { width: '100%', display: 'flex', flex: 1, flexDirection: 'column' },
        html: {
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100%',
          width: '100%',
          MozOsxFontSmoothing: 'grayscale',
          WebkitFontSmoothing: 'antialiased'
        },
        '@keyframes liquidFlow': {
          '0%': { transform: 'translate(-50%, -50%) rotate(0deg)' },
          '100%': { transform: 'translate(-50%, -50%) rotate(360deg)' }
        },
        '@keyframes ripplePulse': {
          '0%': { transform: 'scale(0.8)', opacity: 0.5 },
          '50%': { transform: 'scale(1.2)', opacity: 0.2 },
          '100%': { transform: 'scale(0.8)', opacity: 0.5 }
        },
        '@keyframes floatingOrbs': {
          '0%, 100%': { transform: 'scale(1) translate(0, 0)' },
          '25%': { transform: 'scale(1.1) translate(30px, -30px)' },
          '50%': { transform: 'scale(0.9) translate(-20px, 20px)' },
          '75%': { transform: 'scale(1.05) translate(-30px, -10px)' }
        },
        '@keyframes shimmerWave': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        },
        '@keyframes glowPulse': {
          '0%, 100%': { opacity: 0.4, filter: 'blur(20px)' },
          '50%': { opacity: 0.8, filter: 'blur(30px)' }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: alpha('#FFFFFF', 0.9),
          backdropFilter: 'blur(20px) saturate(150%)',
          border: '1px solid rgba(0,212,230,0.1)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(0,212,230,0.1), transparent)',
            transition: 'left 0.6s ease',
            pointerEvents: 'none'
          },
          '&:hover': { 
            boxShadow: colors.shadows.card,
            borderColor: alpha('#00D4E6', 0.2),
            transform: 'translateY(-2px)',
            '&::before': { left: '100%' }
          }
        },
        elevation1: { boxShadow: colors.shadows.cardSm },
        elevation2: { boxShadow: colors.shadows.card },
        elevation3: { boxShadow: colors.shadows.cardLg }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: { 
          borderRadius: 12, 
          padding: '12px 28px', 
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          fontWeight: 500,
          position: 'relative',
          overflow: 'hidden',
          textTransform: 'none',
          letterSpacing: '0.02em',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '0',
            height: '0',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
            transform: 'translate(-50%, -50%)',
            transition: 'width 0.6s, height 0.6s',
            pointerEvents: 'none'
          },
          '&:hover::before': {
            width: '300px',
            height: '300px'
          }
        },
        containedPrimary: {
          background: colors.gradients.black1,
          color: '#FFFFFF',
          boxShadow: '0 4px 15px rgba(35,41,47,0.2)',
          border: '1px solid transparent',
          '&:hover': {
            background: colors.gradients.blue5,
            boxShadow: colors.shadows.primary,
            transform: 'translateY(-2px)',
            borderColor: alpha('#00D4E6', 0.3)
          },
          '&:active': { transform: 'translateY(0)' }
        },
        containedSecondary: {
          background: colors.gradients.blue1,
          color: '#FFFFFF',
          boxShadow: colors.shadows.cardSm,
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 12,
            background: colors.gradients.holographic,
            opacity: 0,
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none'
          },
          '&:hover': {
            boxShadow: colors.shadows.glow,
            transform: 'translateY(-2px) scale(1.02)',
            '&::after': { opacity: 0.3 }
          }
        },
        outlined: {
          borderWidth: 2,
          borderColor: alpha('#00D4E6', 0.5),
          color: '#00D4E6',
          position: 'relative',
          background: 'transparent',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            borderRadius: 12,
            padding: '2px',
            background: colors.gradients.blue1,
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            opacity: 0,
            transition: 'opacity 0.3s ease'
          },
          '&:hover': { 
            borderColor: 'transparent',
            transform: 'translateY(-1px)',
            '&::before': { opacity: 1 }
          }
        },
        text: { 
          color: '#00D4E6',
          '&:hover': { 
            backgroundColor: alpha('#00D4E6', 0.08),
            color: '#00BFA5'
          } 
        },
        sizeSmall: { padding: '8px 16px', fontSize: '0.875rem' },
        sizeMedium: { padding: '10px 24px' },
        sizeLarge: { padding: '12px 32px' }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            transition: 'all 0.2s ease',
            '&:hover': { '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#00D4E6', 0.3) } },
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: '#00D4E6',
                borderWidth: 1.5
              }
            }
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '20px',
          border: '1px solid transparent',
          background: `linear-gradient(${alpha('#FFFFFF', 0.9)}, ${alpha('#FFFFFF', 0.9)}) padding-box,
                       ${colors.gradients.blue1} border-box`,
          backdropFilter: 'blur(20px) saturate(150%)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: colors.gradients.mesh,
            opacity: 0,
            transition: 'opacity 0.4s ease',
            pointerEvents: 'none'
          },
          '&::after': {
            content: '""',
            position: 'absolute',
            top: '-100%',
            left: '-100%',
            width: '300%',
            height: '300%',
            background: `radial-gradient(circle, ${alpha('#00D4E6', 0.4)} 0%, transparent 40%),
                         radial-gradient(circle at 80% 20%, ${alpha('#7B61FF', 0.3)} 0%, transparent 40%)`,
            animation: 'glowPulse 4s ease-in-out infinite',
            pointerEvents: 'none',
            opacity: 0,
            transition: 'opacity 0.4s ease'
          },
          '&:hover': {
            transform: 'translateY(-4px) scale(1.02)',
            boxShadow: colors.shadows.cardLg,
            '&::before': { opacity: 0.05 },
            '&::after': { opacity: 1 }
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(10px)',
          border: '1px solid transparent',
          background: `linear-gradient(${alpha('#00D4E6', 0.08)}, ${alpha('#00D4E6', 0.08)}) padding-box,
                       ${colors.gradients.blue1} border-box`,
          '&:hover': { 
            transform: 'scale(1.05)',
            boxShadow: '0 4px 12px rgba(0,212,230,0.2)'
          }
        },
        filled: {
          backgroundColor: 'transparent',
          '&:hover': { backgroundColor: alpha('#00D4E6', 0.15) }
        },
        outlined: {
          borderWidth: 1.5,
          '&:hover': {
            backgroundColor: alpha('#00D4E6', 0.05)
          }
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.2s ease',
          '&:hover': { 
            transform: 'scale(1.08)',
            backgroundColor: alpha('#00D4E6', 0.05)
          }
        }
      }
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-track': { backgroundColor: alpha('#5A6670', 0.3) },
          '& .MuiSwitch-thumb': { 
            backgroundColor: '#FFFFFF',
            boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
          }
        },
        colorPrimary: {
          '&.Mui-checked': {
            '& .MuiSwitch-thumb': { 
              background: 'linear-gradient(45deg, #00D4E6 30%, #536DFE 90%)'
            }
          }
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: alpha('#23292F', 0.92),
          backdropFilter: 'blur(8px)',
          borderRadius: 8,
          fontSize: '0.75rem',
          color: '#FFFFFF',
          boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.15)'
        },
        arrow: { color: alpha('#23292F', 0.92) }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(10px)',
          backgroundColor: alpha('#FFFFFF', 0.9),
          borderBottom: '1px solid rgba(0,0,0,0.05)',
          boxShadow: 'none'
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backdropFilter: 'blur(10px)',
          backgroundColor: alpha('#FFFFFF', 0.98),
          borderRight: '1px solid rgba(0,0,0,0.05)'
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backdropFilter: 'blur(10px)',
          backgroundColor: alpha('#FFFFFF', 0.98),
          boxShadow: '0 24px 48px 0 rgba(0,0,0,0.12)'
        }
      }
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 12, backdropFilter: 'blur(8px)' },
        standardInfo: { backgroundColor: alpha('#536DFE', 0.08), color: '#3F51E7' },
        standardSuccess: { backgroundColor: alpha('#00E676', 0.08), color: '#00A055' },
        standardWarning: { backgroundColor: alpha('#FFB74D', 0.08), color: '#E68A00' },
        standardError: { backgroundColor: alpha('#FF5252', 0.08), color: '#D84343' }
      }
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { 
          borderRadius: 12, 
          backgroundColor: alpha('#00D4E6', 0.1),
          height: 8,
          overflow: 'hidden',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
            animation: 'shimmerWave 2s infinite'
          }
        },
        bar: { 
          borderRadius: 12, 
          background: colors.gradients.aurora,
          backgroundSize: '200% 100%',
          animation: 'liquidFlow 3s linear infinite'
        }
      }
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: alpha('#00D4E6', 0.06),
          '&::after': {
            background: 'linear-gradient(90deg, transparent, rgba(0,212,230,0.1), transparent)'
          }
        }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: alpha('#000000', 0.06),
          '&::before, &::after': { borderColor: alpha('#000000', 0.06) }
        }
      }
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: '#00D4E6',
          textDecoration: 'none',
          transition: 'all 0.2s ease',
          '&:hover': {
            color: lighten('#00D4E6', 0.2),
            textDecoration: 'underline'
          }
        }
      }
    }
  }
});

export const createLiquidLedgerTheme = ({ dark = false } = {}) => {
  if (!dark) return LiquidLedgerTheme;
  
  return createTheme({
    ...LiquidLedgerTheme,
    palette: {
      ...LiquidLedgerTheme.palette,
      mode: 'dark',
      primary: { main: '#F8FAFB', light: '#FFFFFF', dark: '#E0E4E8', contrastText: '#000000' },
      secondary: { main: '#00E5F7', light: '#33ECFA', dark: '#00D4E6', contrastText: '#000000' },
      background: { default: '#0A0E12', paper: '#1C2126' },
      text: { primary: '#F8FAFB', secondary: '#B0B8C1', disabled: alpha('#F8FAFB', 0.5) },
      error: { main: '#FF6B6B', light: '#FF8585', dark: '#FF5252', contrastText: '#FFFFFF' },
      warning: { main: '#FFC670', light: '#FFD08A', dark: '#FFB74D', contrastText: '#000000' },
      success: { main: '#33EB96', light: '#52EFA7', dark: '#00E676', contrastText: '#000000' },
      info: { main: '#758AFE', light: '#8E9FFE', dark: '#536DFE', contrastText: '#FFFFFF' },
      divider: 'rgba(255,255,255,0.08)'
    },
    components: {
      ...LiquidLedgerTheme.components,
      MuiCssBaseline: {
        styleOverrides: {
          ...LiquidLedgerTheme.components.MuiCssBaseline.styleOverrides,
          body: {
            ...LiquidLedgerTheme.components.MuiCssBaseline.styleOverrides.body,
            background: 'linear-gradient(135deg, #0A0E12 0%, #0F1419 25%, #0A0E12 50%, #141A20 75%, #0A0E12 100%)',
            '&::before': {
              ...LiquidLedgerTheme.components.MuiCssBaseline.styleOverrides.body['&::before'],
              background: `
                radial-gradient(circle at 20% 30%, rgba(0,212,230,0.2) 0%, transparent 40%),
                radial-gradient(circle at 80% 70%, rgba(123,97,255,0.15) 0%, transparent 40%),
                radial-gradient(circle at 50% 50%, rgba(0,191,165,0.1) 0%, transparent 60%)
              `,
              filter: 'blur(60px)'
            },
            '&::after': {
              ...LiquidLedgerTheme.components.MuiCssBaseline.styleOverrides.body['&::after'],
              background: colors.gradients.aurora,
              opacity: 0.05,
              filter: 'blur(60px)'
            },
            scrollbarColor: `${alpha('#00E5F7', 0.3)} ${alpha('#0A0E12', 0.3)}`,
            '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
              backgroundColor: alpha('#0A0E12', 0.3)
            },
            '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
              backgroundColor: alpha('#00E5F7', 0.3),
              border: `2px solid transparent`
            },
            '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
              backgroundColor: alpha('#00E5F7', 0.5)
            }
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: alpha('#1C2126', 0.8),
            backdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(0,229,247,0.1)',
            '&:hover': {
              borderColor: alpha('#00E5F7', 0.2),
              boxShadow: '0 0 30px rgba(0,229,247,0.1)'
            }
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            background: `linear-gradient(${alpha('#1C2126', 0.9)}, ${alpha('#1C2126', 0.9)}) padding-box,
                         ${colors.gradients.blue2} border-box`,
            backdropFilter: 'blur(30px) saturate(180%)',
            '&::after': {
              background: `radial-gradient(circle, ${alpha('#00E5F7', 0.5)} 0%, transparent 40%),
                           radial-gradient(circle at 80% 20%, ${alpha('#7B61FF', 0.4)} 0%, transparent 40%)`
            },
            '&:hover': {
              borderColor: 'transparent',
              boxShadow: '0 0 50px rgba(0,229,247,0.2), 0 0 100px rgba(123,97,255,0.1)'
            }
          }
        }
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: alpha('#0A0E12', 0.9),
            borderBottom: '1px solid rgba(255,255,255,0.05)'
          }
        }
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: alpha('#0A0E12', 0.98),
            borderRight: '1px solid rgba(255,255,255,0.05)'
          }
        }
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: alpha('#1C2126', 0.98),
            boxShadow: '0 24px 48px 0 rgba(0,0,0,0.4)'
          }
        }
      }
    }
  });
};