import { alpha, createTheme, darken, lighten, responsiveFontSizes } from '@mui/material/styles';

// Ripple Blue color palette
const themeColors = {
  primary: '#0080ff', // Bright Blue
  secondary: '#00c5d7', // Cyan
  success: '#00d2a0', // Turquoise
  warning: '#ffa502', // Orange
  error: '#ff4757', // Red
  info: '#0080ff', // Blue
  black: '#043b6f', // Dark Blue
  white: '#ffffff', // Pure White
  primaryAlt: '#001429', // Deep Dark Blue
  trueWhite: '#ffffff'
};

const colors = {
  gradients: {
    blue1: 'linear-gradient(135deg, #0080ff 0%, #0066cc 100%)',
    blue2: 'linear-gradient(135deg, #00c5d7 0%, #0099a8 100%)',
    blue3: 'linear-gradient(127.55deg, #001429 3.73%, #002952 92.26%)',
    blue4: 'linear-gradient(-20deg, #0080ff 0%, #00c5d7 100%)',
    blue5: 'linear-gradient(135deg, #4da3ff 10%, #001429 100%)',
    orange1: 'linear-gradient(135deg, #ffa502 0%, #ff8c00 100%)',
    orange2: 'linear-gradient(135deg, #ffb84d 0%, #ff9900 100%)',
    orange3: 'linear-gradient(120deg, #ffa502 0%, #ff4757 100%)',
    purple1: 'linear-gradient(135deg, #0080ff 0%, #4000ff 100%)',
    purple3: 'linear-gradient(135deg, #6666ff 0%, #3333cc 100%)',
    pink1: 'linear-gradient(135deg, #ff99cc 0%, #ff4757 100%)',
    pink2: 'linear-gradient(135deg, #ff6b7a 0%, #d63031 100%)',
    green1: 'linear-gradient(135deg, #00d2a0 0%, #00c5d7 100%)',
    green2: 'linear-gradient(to bottom, #4de6c0 0%, #00d2a0 100%)',
    black1: 'linear-gradient(100.66deg, #043b6f 6.56%, #001429 93.57%)',
    black2: 'linear-gradient(60deg, #001429 0%, #043b6f 100%)'
  },
  shadows: {
    success: '0px 0px 20px rgba(0, 210, 160, 0.5), 0px 0px 40px rgba(0, 210, 160, 0.3)',
    error: '0px 0px 20px rgba(255, 71, 87, 0.5), 0px 0px 40px rgba(255, 71, 87, 0.3)',
    info: '0px 0px 20px rgba(0, 128, 255, 0.5), 0px 0px 40px rgba(0, 128, 255, 0.3)',
    primary: '0px 0px 20px rgba(0, 128, 255, 0.5), 0px 0px 40px rgba(0, 128, 255, 0.3)',
    warning: '0px 0px 20px rgba(255, 165, 2, 0.5), 0px 0px 40px rgba(255, 165, 2, 0.3)',
    card: '0px 0px 30px rgba(0, 128, 255, 0.2), inset 0px 0px 2px rgba(0, 128, 255, 0.5)',
    cardSm: '0px 0px 15px rgba(0, 128, 255, 0.2), inset 0px 0px 1px rgba(0, 128, 255, 0.5)',
    cardLg: '0px 0px 60px rgba(0, 197, 215, 0.3), 0px 0px 120px rgba(0, 128, 255, 0.2)'
  },
  layout: {
    general: {
      bodyBg: '#eaf6ff'
    },
    sidebar: {
      background: alpha('#ffffff', 0.8),
      textColor: '#043b6f',
      dividerBg: alpha('#0080ff', 0.1),
      menuItemColor: '#085a9c',
      menuItemColorActive: '#0080ff',
      menuItemBg: 'transparent',
      menuItemBgActive: alpha('#0080ff', 0.1),
      menuItemIconColor: '#00c5d7',
      menuItemIconColorActive: '#0080ff',
      menuItemHeadingColor: '#00c5d7'
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

export const rippleBlueTheme = createTheme({
  typography: {
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    fontSize: 14,
    h1: { fontFamily: "'JetBrains Mono', monospace" },
    h2: { fontFamily: "'JetBrains Mono', monospace" },
    h3: { fontFamily: "'JetBrains Mono', monospace" },
    h4: { fontFamily: "'JetBrains Mono', monospace" },
    h5: { fontFamily: "'JetBrains Mono', monospace" },
    h6: { fontFamily: "'JetBrains Mono', monospace" },
    body1: { fontVariantNumeric: 'tabular-nums' },
    body2: { fontVariantNumeric: 'tabular-nums' }
  },
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
    reactFrameworkColor: '#0080ff80',
    borderRadiusSm: '10px',
    borderRadius: '14px',
    borderRadiusLg: '18px',
    borderRadiusXl: '22px',
    backgroundAlt: alpha('#ffffff', 0.5),
    backgroundAsset: alpha('#0080ff', 0.05),
    backgroundTrait: alpha('#00c5d7', 0.1),
    borderTrait: '#00c5d7'
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
    boxShadow: '0px 0px 30px rgba(0, 128, 255, 0.3)',
    width: '290px'
  },
  header: {
    height: '80px',
    background: alpha('#ffffff', 0.8),
    boxShadow: '0px 0px 20px rgba(0, 128, 255, 0.3)',
    textColor: colors.secondary.main
  },
  spacing: 9,
  currency: {
    background1: alpha('#0080ff', 0.1),
    background2: alpha('#00c5d7', 0.1),
    border: `1px solid ${alpha('#0080ff', 0.3)}`
  },

  chart: {
    background: alpha('#ffffff', 0.9),
    gridColor: alpha('#0080ff', 0.08),
    borderColor: alpha('#0080ff', 0.15)
  },
  palette: {
    common: {
      black: themeColors.black,
      white: themeColors.white
    },
    mode: 'light',
    primary: { main: '#0080ff', light: '#4da3ff', dark: '#0066cc', contrastText: '#ffffff' },
    secondary: { main: '#00c5d7', light: '#4dd7e5', dark: '#0099a8', contrastText: '#ffffff' },
    background: { default: '#eaf6ff', paper: '#ffffff' },
    text: { primary: '#043b6f', secondary: '#085a9c', disabled: alpha('#043b6f', 0.5) },
    error: { main: '#ff4757', light: '#ff6b7a', dark: '#d63031', contrastText: '#ffffff' },
    warning: { main: '#ffa502', light: '#ffb84d', dark: '#ff8c00', contrastText: '#ffffff' },
    success: { main: '#00d2a0', light: '#4de6c0', dark: '#00a880', contrastText: '#ffffff' },
    info: { main: '#0080ff', light: '#4da3ff', dark: '#0066cc', contrastText: '#ffffff' },
    action: {
      active: colors.alpha.black[100],
      hover: alpha(themeColors.primary, 0.1),
      hoverOpacity: 0.1,
      selected: alpha(themeColors.primary, 0.2),
      selectedOpacity: 0.2,
      disabled: alpha(themeColors.black, 0.3),
      disabledBackground: alpha(themeColors.black, 0.05),
      disabledOpacity: 0.38,
      focus: alpha(themeColors.primary, 0.1),
      focusOpacity: 0.1,
      activatedOpacity: 0.12
    },
    divider: 'rgba(0,128,255,0.08)',
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
  shape: { borderRadius: 14 },
  shadows: [
    'none',
    '0 2px 4px 0 rgba(0,128,255,0.08)',
    '0 3px 6px 0 rgba(0,128,255,0.10)',
    '0 4px 8px 0 rgba(0,128,255,0.12)',
    '0 5px 10px 0 rgba(0,128,255,0.14)',
    '0 6px 12px 0 rgba(0,128,255,0.16)',
    '0 7px 14px 0 rgba(0,128,255,0.18)',
    '0 8px 16px 0 rgba(0,128,255,0.20)',
    '0 9px 18px 0 rgba(0,128,255,0.22)',
    '0 10px 20px 0 rgba(0,128,255,0.24)',
    '0 11px 22px 0 rgba(0,128,255,0.26)',
    '0 12px 24px 0 rgba(0,128,255,0.28)',
    '0 13px 26px 0 rgba(0,128,255,0.30)',
    '0 14px 28px 0 rgba(0,128,255,0.32)',
    '0 15px 30px 0 rgba(0,128,255,0.34)',
    '0 16px 32px 0 rgba(0,128,255,0.36)',
    '0 17px 34px 0 rgba(0,128,255,0.38)',
    '0 18px 36px 0 rgba(0,128,255,0.40)',
    '0 19px 38px 0 rgba(0,128,255,0.42)',
    '0 20px 40px 0 rgba(0,128,255,0.44)',
    '0 21px 42px 0 rgba(0,128,255,0.46)',
    '0 22px 44px 0 rgba(0,128,255,0.48)',
    '0 23px 46px 0 rgba(0,128,255,0.50)',
    '0 24px 48px 0 rgba(0,128,255,0.52)',
    '0 25px 50px 0 rgba(0,128,255,0.54)'
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
          background: '#eaf6ff',
          position: 'relative',
          scrollBehavior: 'smooth',
          '&::before': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 50% 20%, #bde4ff 0%, #eaf6ff 70%)',
            zIndex: -3,
            pointerEvents: 'none'
          },
          '&::after': {
            content: '""',
            position: 'fixed',
            top: '50%',
            left: '50%',
            width: '100vmax',
            height: '100vmax',
            background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 50%)',
            transform: 'translate(-50%, -50%) scale(0.4)',
            opacity: 0,
            zIndex: -2,
            pointerEvents: 'none',
            animation: 'rippleWater 8s linear infinite',
            '@media (prefers-reduced-motion: reduce)': { animation: 'none' }
          },
          scrollbarColor: `${alpha('#0080ff', 0.5)} ${alpha('#eaf6ff', 0.3)}`,
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            backgroundColor: alpha('#eaf6ff', 0.3),
            width: '8px',
            height: '8px'
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            backgroundColor: alpha('#0080ff', 0.5),
            border: `1px solid ${alpha('#0080ff', 0.3)}`
          },
          '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
            backgroundColor: alpha('#0080ff', 0.7),
            boxShadow: '0 0 10px rgba(0, 128, 255, 0.5)'
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
        '@keyframes rippleWater': {
          '0%': { transform: 'translate(-50%, -50%) scale(0.4)', opacity: 0 },
          '20%': { opacity: 0.6 },
          '100%': { transform: 'translate(-50%, -50%) scale(5)', opacity: 0 }
        },
        '@keyframes shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: alpha('#ffffff', 0.8),
          backdropFilter: 'blur(6px)',
          border: '1px solid rgba(0,128,255,0.12)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': { backdropFilter: 'blur(8px)', borderColor: alpha('#0080ff', 0.2) }
        },
        elevation1: { boxShadow: '0 2px 8px 0 rgba(0,128,255,0.08)' },
        elevation2: { boxShadow: '0 4px 12px 0 rgba(0,128,255,0.12)' },
        elevation3: { boxShadow: '0 6px 16px 0 rgba(0,128,255,0.16)' }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          padding: '8px 20px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        },
        containedPrimary: {
          background: 'linear-gradient(180deg, #0080ff 0%, #0066cc 100%)',
          boxShadow: '0 4px 8px 0 rgba(0,128,255,0.25)',
          '&:hover': {
            background: 'linear-gradient(180deg, #1a8fff 0%, #0080ff 100%)',
            boxShadow: '0 6px 12px 0 rgba(0,128,255,0.35)',
            transform: 'translateY(-1px)'
          },
          '&:active': { transform: 'translateY(0)', boxShadow: '0 2px 4px 0 rgba(0,128,255,0.25)' }
        },
        containedSecondary: {
          background: 'linear-gradient(180deg, #00c5d7 0%, #0099a8 100%)',
          boxShadow: '0 4px 8px 0 rgba(0,197,215,0.25)',
          '&:hover': {
            background: 'linear-gradient(180deg, #1ad0e0 0%, #00c5d7 100%)',
            boxShadow: '0 6px 12px 0 rgba(0,197,215,0.35)',
            transform: 'translateY(-1px)'
          }
        },
        outlined: {
          borderWidth: 2,
          '&:hover': { borderWidth: 2, transform: 'translateY(-1px)' }
        },
        text: { '&:hover': { backgroundColor: alpha('#0080ff', 0.08) } },
        sizeSmall: { padding: '8px 16px', lineHeight: 1.5 },
        sizeMedium: { padding: '10px 20px' },
        sizeLarge: { padding: '12px 24px' }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': { borderColor: alpha('#0080ff', 0.4) }
            },
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: 2,
                boxShadow: '0 0 0 4px rgba(0,128,255,0.1)'
              }
            }
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '14px',
          border: '1px solid rgba(0,128,255,0.08)',
          background: alpha('#ffffff', 0.85),
          backdropFilter: 'blur(10px)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px 0 rgba(0,128,255,0.15)',
            borderColor: alpha('#0080ff', 0.15)
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': { transform: 'scale(1.05)' }
        },
        filled: {
          backdropFilter: 'blur(4px)',
          backgroundColor: alpha('#0080ff', 0.1),
          '&:hover': { backgroundColor: alpha('#0080ff', 0.15) }
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': { transform: 'scale(1.1)', backgroundColor: alpha('#0080ff', 0.08) }
        }
      }
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-track': { backgroundColor: alpha('#085a9c', 0.3) },
          '& .MuiSwitch-thumb': {
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 4px rgba(0,128,255,0.2)'
          }
        },
        colorPrimary: {
          '&.Mui-checked': {
            '& .MuiSwitch-thumb': { background: 'linear-gradient(45deg, #0080ff 30%, #00c5d7 90%)' }
          }
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: alpha('#043b6f', 0.95),
          backdropFilter: 'blur(8px)',
          borderRadius: 10,
          fontSize: '0.875rem',
          color: '#ffffff',
          boxShadow: '0px 0px 20px rgba(0, 128, 255, 0.3)'
        },
        arrow: { color: alpha('#043b6f', 0.95) }
      }
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(12px)',
          backgroundColor: alpha('#ffffff', 0.9),
          borderBottom: '1px solid rgba(0,128,255,0.08)',
          boxShadow: 'none'
        }
      }
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backdropFilter: 'blur(12px)',
          backgroundColor: alpha('#ffffff', 0.95),
          borderRight: '1px solid rgba(0,128,255,0.08)'
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backdropFilter: 'blur(12px)',
          backgroundColor: alpha('#ffffff', 0.95),
          boxShadow: '0 24px 48px 0 rgba(0,128,255,0.2)'
        }
      }
    },
    MuiAlert: {
      styleOverrides: {
        root: { borderRadius: 14, backdropFilter: 'blur(8px)' },
        standardInfo: { backgroundColor: alpha('#0080ff', 0.1), color: '#043b6f' },
        standardSuccess: { backgroundColor: alpha('#00d2a0', 0.1), color: '#00735a' },
        standardWarning: { backgroundColor: alpha('#ffa502', 0.1), color: '#995f00' },
        standardError: { backgroundColor: alpha('#ff4757', 0.1), color: '#a62834' }
      }
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: { borderRadius: 14, backgroundColor: alpha('#0080ff', 0.1) },
        bar: { borderRadius: 14, background: 'linear-gradient(90deg, #0080ff 0%, #00c5d7 100%)' }
      }
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: alpha('#0080ff', 0.08),
          '&::after': {
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            animation: 'shimmer 1.5s infinite'
          }
        }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: alpha('#0080ff', 0.12),
          '&::before, &::after': { borderColor: alpha('#0080ff', 0.12) }
        }
      }
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: themeColors.primary,
          textDecoration: 'none',
          transition: 'all 0.3s ease',
          '&:hover': {
            color: lighten(themeColors.primary, 0.2),
            textDecoration: 'underline'
          }
        }
      }
    }
  }
});

export const createRippleBlueTheme = ({ dark = false } = {}) => {
  if (!dark) return rippleBlueTheme;

  return createTheme({
    ...rippleBlueTheme,
    chart: {
      background: alpha('#001429', 0.9),
      gridColor: alpha('#1a8fff', 0.1),
      borderColor: alpha('#1a8fff', 0.2)
    },
    palette: {
      ...rippleBlueTheme.palette,
      mode: 'dark',
      primary: { main: '#1a8fff', light: '#4da3ff', dark: '#0066cc', contrastText: '#ffffff' },
      secondary: { main: '#00d9ed', light: '#4de6f2', dark: '#00a8bd', contrastText: '#ffffff' },
      background: { default: '#001429', paper: '#002244' },
      text: { primary: '#b3d9ff', secondary: '#66b3ff', disabled: alpha('#b3d9ff', 0.5) },
      error: { main: '#ff6b7a', light: '#ff8a95', dark: '#ff4757', contrastText: '#ffffff' },
      warning: { main: '#ffb84d', light: '#ffc670', dark: '#ffa502', contrastText: '#000000' },
      success: { main: '#4de6c0', light: '#70ecd0', dark: '#00d2a0', contrastText: '#000000' },
      info: { main: '#1a8fff', light: '#4da3ff', dark: '#0066cc', contrastText: '#ffffff' },
      divider: 'rgba(26,143,255,0.12)'
    },
    components: {
      ...rippleBlueTheme.components,
      MuiCssBaseline: {
        styleOverrides: {
          ...rippleBlueTheme.components.MuiCssBaseline.styleOverrides,
          body: {
            ...rippleBlueTheme.components.MuiCssBaseline.styleOverrides.body,
            background: '#001429',
            '&::before': {
              ...rippleBlueTheme.components.MuiCssBaseline.styleOverrides.body['&::before'],
              background: 'radial-gradient(circle at 50% 20%, #002952 0%, #001429 70%)'
            },
            '&::after': {
              ...rippleBlueTheme.components.MuiCssBaseline.styleOverrides.body['&::after'],
              background: 'radial-gradient(circle, rgba(26,143,255,0.2) 0%, transparent 50%)'
            },
            scrollbarColor: `${alpha('#1a8fff', 0.5)} ${alpha('#001429', 0.3)}`,
            '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
              backgroundColor: alpha('#001429', 0.3)
            },
            '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
              backgroundColor: alpha('#1a8fff', 0.5),
              border: `1px solid ${alpha('#1a8fff', 0.3)}`
            },
            '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
              backgroundColor: alpha('#1a8fff', 0.7),
              boxShadow: '0 0 10px rgba(26, 143, 255, 0.5)'
            }
          }
        }
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundColor: alpha('#002244', 0.8),
            border: '1px solid rgba(26,143,255,0.12)'
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            background: alpha('#002244', 0.85),
            border: '1px solid rgba(26,143,255,0.08)'
          }
        }
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundColor: alpha('#001429', 0.9),
            borderBottom: '1px solid rgba(26,143,255,0.08)'
          }
        }
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: alpha('#001429', 0.95),
            borderRight: '1px solid rgba(26,143,255,0.08)'
          }
        }
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundColor: alpha('#002244', 0.95),
            boxShadow: '0 24px 48px 0 rgba(0,0,0,0.4)'
          }
        }
      }
    }
  });
};
