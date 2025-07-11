import { alpha, createTheme, darken } from '@mui/material';
import '@mui/lab/themeAugmentation';

const themeColors = {
  primary: '#147DFE',
  secondary: '#8B92A8',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  black: '#FFFFFF',
  white: '#000000',
  primaryAlt: '#0A0E1A',
  trueWhite: '#ffffff'
};

const createAlphaColors = (color) => ({
  5: alpha(color, 0.02),
  10: alpha(color, 0.1),
  30: alpha(color, 0.3),
  50: alpha(color, 0.5),
  70: alpha(color, 0.7),
  100: color
});

export const XrplToDarkTheme = createTheme({
  spacing: 9,
  shape: { borderRadius: 10 },
  
  palette: {
    mode: 'dark',
    common: {
      black: themeColors.black,
      white: themeColors.white
    },
    primary: {
      lighter: alpha(themeColors.primary, 0.1),
      light: alpha(themeColors.primary, 0.3),
      main: themeColors.primary,
      dark: darken(themeColors.primary, 0.2),
      contrastText: '#fff'
    },
    secondary: {
      lighter: alpha(themeColors.secondary, 0.1),
      light: alpha(themeColors.secondary, 0.3),
      main: themeColors.secondary,
      dark: darken(themeColors.secondary, 0.2),
      contrastText: '#fff'
    },
    error: {
      lighter: alpha(themeColors.error, 0.1),
      light: alpha(themeColors.error, 0.3),
      main: themeColors.error,
      dark: darken(themeColors.error, 0.2),
      contrastText: '#fff'
    },
    warning: {
      lighter: alpha(themeColors.warning, 0.1),
      light: alpha(themeColors.warning, 0.3),
      main: themeColors.warning,
      dark: darken(themeColors.warning, 0.2)
    },
    info: {
      lighter: alpha(themeColors.info, 0.1),
      light: alpha(themeColors.info, 0.3),
      main: themeColors.info,
      dark: darken(themeColors.info, 0.2),
      contrastText: '#fff'
    },
    success: {
      lighter: alpha(themeColors.success, 0.1),
      light: alpha(themeColors.success, 0.3),
      main: themeColors.success,
      dark: darken(themeColors.success, 0.2),
      contrastText: '#fff'
    },
    text: {
      primary: themeColors.black,
      secondary: alpha(themeColors.black, 0.7),
      disabled: alpha(themeColors.black, 0.5)
    },
    background: {
      paper: themeColors.white,
      default: '#000000'
    },
    action: {
      active: themeColors.black,
      hover: alpha(themeColors.primary, 0.1),
      selected: alpha(themeColors.black, 0.1),
      disabled: alpha(themeColors.black, 0.5),
      disabledBackground: alpha(themeColors.black, 0.05)
    }
  },

  colors: {
    alpha: {
      white: createAlphaColors(themeColors.white),
      trueWhite: createAlphaColors(themeColors.trueWhite),
      black: createAlphaColors(themeColors.black)
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
    }
  },

  general: {
    reactFrameworkColor: '#007b5580',
    borderRadiusSm: '6px',
    borderRadius: '10px',
    borderRadiusLg: '12px',
    borderRadiusXl: '16px',
    backgroundAlt: '#08060b70',
    backgroundAsset: '#000000',
    backgroundTrait: '#00ff7f10',
    borderTrait: '#00ff7f'
  },

  header: {
    height: '80px',
    background: '#111827',
    boxShadow: '0px 1px 0px #1F2937'
  },

  sidebar: {
    background: themeColors.primaryAlt,
    textColor: themeColors.secondary,
    width: '290px'
  },

  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
    h1: { fontWeight: 700, fontSize: '1.2rem' },
    h2: { fontWeight: 700, fontSize: '1rem' },
    h3: { fontWeight: 700, fontSize: '0.9rem' },
    h4: { fontWeight: 600, fontSize: 16 },
    h5: { fontWeight: 700, fontSize: 14 },
    h6: { fontSize: 15 },
    body1: { fontSize: 14 },
    body2: { fontSize: 14 },
    button: { fontWeight: 600 },
    caption: { fontSize: 13 }
  },

  shadows: Array(25).fill('none'),

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: '#000000',
          scrollbarColor: `${alpha('#147DFE', 0.5)} ${alpha('#000000', 0.3)}`,
          '&::-webkit-scrollbar': {
            backgroundColor: alpha('#000000', 0.3),
            width: '8px',
            height: '8px'
          },
          '&::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            backgroundColor: alpha('#147DFE', 0.5),
            border: `1px solid ${alpha('#147DFE', 0.3)}`
          }
        },
        ':root': {
          '--swiper-theme-color': themeColors.primary,
          colorScheme: 'dark'
        }
      }
    },
    MuiButton: {
      defaultProps: { disableRipple: true },
      styleOverrides: {
        root: {
          fontWeight: 'bold',
          textTransform: 'none',
          paddingLeft: 16,
          paddingRight: 16,
          transition: 'all 0.2s'
        },
        contained: {
          backgroundColor: themeColors.primary,
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          '&:hover': {
            backgroundColor: alpha(themeColors.primary, 0.8),
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
          }
        },
        sizeSmall: {
          padding: '8px 16px',
          lineHeight: 1.5
        },
        sizeMedium: {
          padding: '10px 20px'
        },
        sizeLarge: {
          padding: '12px 24px'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: `linear-gradient(135deg, 
            ${alpha('#111827', 0.5)} 0%, 
            ${alpha('#111827', 0.3)} 50%,
            ${alpha('#111827', 0.4)} 100%)`,
          border: `1px solid ${alpha('#1F2937', 0.15)}`,
          backdropFilter: 'blur(60px) saturate(180%)',
          boxShadow: `0 10px 40px ${alpha('#000000', 0.18)}`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 15px 50px ${alpha('#000000', 0.22)}`
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          border: `1px solid ${alpha('#1F2937', 0.15)}`,
          background: `linear-gradient(135deg, 
            ${alpha('#111827', 0.5)} 0%, 
            ${alpha('#111827', 0.3)} 50%,
            ${alpha('#111827', 0.4)} 100%)`,
          backdropFilter: 'blur(60px) saturate(180%)',
          boxShadow: `0 10px 40px ${alpha('#000000', 0.18)}`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: `0 15px 50px ${alpha('#000000', 0.22)}`,
            borderColor: alpha('#147DFE', 0.4)
          }
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: { backgroundColor: '#000000' }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          color: themeColors.black,
          background: alpha('#222531', 1),
          padding: '8px 16px',
          fontSize: 13
        },
        arrow: { color: alpha('#222531', 1) }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          background: alpha(themeColors.black, 0.1),
          border: 0,
          height: 1
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(themeColors.black, 0.5)
          },
          '&.Mui-focused:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: themeColors.primary
          }
        }
      }
    },
    MuiLink: {
      defaultProps: {
        underline: 'hover',
        color: '#2de370 !important'
      }
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '0 !important',
          padding: '0 !important'
        }
      }
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: '16px !important',
          paddingRight: '16px !important'
        },
        maxWidthLg: {
          maxWidth: '1700px !important'
        },
        maxWidthXl: {
          maxWidth: '2000px !important'
        }
      }
    }
  }
});