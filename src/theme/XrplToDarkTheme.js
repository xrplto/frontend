import { alpha, createTheme, darken } from '@mui/material';

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
      primary: themeColors.white,
      secondary: alpha(themeColors.white, 0.7),
      disabled: alpha(themeColors.white, 0.5)
    },
    background: {
      paper: '#000000',
      default: '#000000'
    },
    action: {
      active: themeColors.white,
      hover: alpha(themeColors.primary, 0.1),
      selected: alpha(themeColors.white, 0.1),
      disabled: alpha(themeColors.white, 0.5),
      disabledBackground: alpha(themeColors.white, 0.05)
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
    borderRadiusSm: '8px',
    borderRadius: '12px',
    borderRadiusLg: '16px',
    borderRadiusXl: '20px',
    backgroundAlt: '#000000',
    backgroundAsset: '#000000',
    backgroundTrait: '#ffffff10',
    borderTrait: '#ffffff',
    glassMorphism: 'rgba(255, 255, 255, 0.05)',
    cardBackground: '#000000',
    surfaceElevated: '#111111'
  },

  header: {
    height: '80px',
    background: '#000000',
    boxShadow: '0px 1px 0px rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(20px) saturate(180%)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
  },

  sidebar: {
    background: themeColors.primaryAlt,
    textColor: themeColors.secondary,
    width: '290px'
  },
  
  walletDialog: {
    background: 'rgba(0, 0, 0, 0.95)',
    backgroundSecondary: 'rgba(0, 0, 0, 0.6)',
    border: alpha('#ffffff', 0.1)
  },

  chart: {
    background: '#000000',
    gridColor: alpha('#ffffff', 0.1),
    borderColor: alpha('#ffffff', 0.2)
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

  shadows: [
    'none',
    '0 1px 3px rgba(0, 0, 0, 0.3)',
    '0 4px 6px rgba(0, 0, 0, 0.3)',
    '0 10px 15px rgba(0, 0, 0, 0.3)',
    '0 20px 25px rgba(0, 0, 0, 0.3)',
    '0 25px 50px rgba(0, 0, 0, 0.5)',
    ...Array(19).fill('0 25px 50px rgba(0, 0, 0, 0.5)')
  ],

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: '#000000',
          contain: 'layout style',
          scrollbarWidth: 'thin',
          scrollbarColor: '#475569 #1E293B',
          '&::-webkit-scrollbar': {
            width: '6px',
            height: '6px'
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: '#1E293B'
          },
          '&::-webkit-scrollbar-thumb': {
            borderRadius: 6,
            backgroundColor: '#475569'
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#64748B'
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
          transition: 'background-color 0.15s ease, border-color 0.15s ease, transform 0.15s ease',
          willChange: 'transform'
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
          background: `linear-gradient(145deg, 
            ${alpha('#000000', 0.9)} 0%, 
            ${alpha('#111111', 0.6)} 50%,
            ${alpha('#000000', 0.95)} 100%)`,
          border: `1px solid ${alpha('#ffffff', 0.08)}`,
          backdropFilter: 'blur(40px) saturate(200%)',
          boxShadow: `0 8px 32px ${alpha('#000000', 0.4)}, inset 0 1px 0 ${alpha('#ffffff', 0.1)}`,
          transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
          willChange: 'transform',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 20px 60px ${alpha('#000000', 0.3)}, inset 0 1px 0 ${alpha('#ffffff', 0.15)}`,
            borderColor: alpha('#ffffff', 0.12)
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          border: `1px solid ${alpha('#ffffff', 0.08)}`,
          background: `linear-gradient(145deg, 
            ${alpha('#000000', 0.9)} 0%, 
            ${alpha('#111111', 0.6)} 50%,
            ${alpha('#000000', 0.95)} 100%)`,
          backdropFilter: 'blur(40px) saturate(200%)',
          boxShadow: `0 8px 32px ${alpha('#000000', 0.4)}, inset 0 1px 0 ${alpha('#ffffff', 0.1)}`,
          transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
          willChange: 'transform',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: `0 20px 60px ${alpha('#000000', 0.3)}, inset 0 1px 0 ${alpha('#ffffff', 0.15)}`,
            borderColor: alpha(themeColors.primary, 0.5)
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
          color: themeColors.white,
          background: alpha('#000000', 0.95),
          border: `1px solid ${alpha('#ffffff', 0.1)}`,
          backdropFilter: 'blur(20px) saturate(180%)',
          padding: '12px 16px',
          fontSize: 13,
          borderRadius: '8px'
        },
        arrow: { color: alpha('#000000', 0.95) }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          background: alpha(themeColors.white, 0.1),
          border: 0,
          height: 1
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: alpha(themeColors.white, 0.5)
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
    },
    MuiPagination: {
      styleOverrides: {
        root: {
          '& .MuiPaginationItem-root': {
            backgroundColor: alpha('#000000', 0.8),
            color: themeColors.white,
            border: `1px solid ${alpha('#ffffff', 0.1)}`,
            backdropFilter: 'blur(20px) saturate(180%)',
            borderRadius: '8px',
            '&:hover': {
              backgroundColor: alpha(themeColors.primary, 0.2),
              borderColor: alpha(themeColors.primary, 0.6),
              transform: 'scale(1.05)'
            },
            '&.Mui-selected': {
              backgroundColor: themeColors.primary,
              color: themeColors.white,
              borderColor: themeColors.primary,
              boxShadow: `0 4px 16px ${alpha(themeColors.primary, 0.3)}`,
              '&:hover': {
                backgroundColor: alpha(themeColors.primary, 0.8)
              }
            }
          }
        }
      }
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          backgroundColor: alpha('#000000', 0.9),
          backdropFilter: 'blur(20px) saturate(180%)',
          borderTop: `1px solid ${alpha('#ffffff', 0.08)}`,
          color: themeColors.white
        },
        selectIcon: {
          color: alpha(themeColors.white, 0.7)
        },
        select: {
          color: themeColors.white
        },
      }
    }
  }
});