import { alpha, createTheme, darken, lighten } from '@mui/material/styles';

// Florida Synthwave color palette
const themeColors = {
  primary: '#ff1493', // Hot Pink
  secondary: '#ff6b35', // Vibrant Orange
  success: '#7fffd4', // Aquamarine
  warning: '#ffd700', // Gold
  error: '#ff1744', // Neon Red
  info: '#00bfff', // Deep Sky Blue
  black: '#0d0818', // Dark Purple Black
  white: '#fff5ee', // Seashell
  primaryAlt: '#2d1b69', // Deep Purple
  trueWhite: '#ffffff'
};

const colors = {
  gradients: {
    blue1: 'linear-gradient(135deg, #00bfff 0%, #ff1493 100%)',
    blue2: 'linear-gradient(135deg, #7fffd4 0%, #ff6b35 100%)',
    blue3: 'linear-gradient(127.55deg, #2d1b69 3.73%, #ff1493 92.26%)',
    blue4: 'linear-gradient(-20deg, #ff6b35 0%, #ff1493 100%)',
    blue5: 'linear-gradient(135deg, #00bfff 10%, #2d1b69 100%)',
    orange1: 'linear-gradient(135deg, #ff6b35 0%, #ffd700 100%)',
    orange2: 'linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%)',
    orange3: 'linear-gradient(120deg, #ffd700 0%, #ff6b35 100%)',
    purple1: 'linear-gradient(135deg, #ff1493 0%, #2d1b69 100%)',
    purple3: 'linear-gradient(135deg, #9370db 0%, #2d1b69 100%)',
    pink1: 'linear-gradient(135deg, #ff69b4 0%, #ff1493 100%)',
    pink2: 'linear-gradient(135deg, #ff1493 0%, #c71585 100%)',
    green1: 'linear-gradient(135deg, #7fffd4 0%, #00bfff 100%)',
    green2: 'linear-gradient(to bottom, #40e0d0 0%, #7fffd4 100%)',
    black1: 'linear-gradient(100.66deg, #2d1b69 6.56%, #0d0818 93.57%)',
    black2: 'linear-gradient(60deg, #0d0818 0%, #2d1b69 100%)'
  },
  shadows: {
    success: '0px 0px 20px rgba(127, 255, 212, 0.5), 0px 0px 40px rgba(127, 255, 212, 0.3)',
    error: '0px 0px 20px rgba(255, 23, 68, 0.5), 0px 0px 40px rgba(255, 23, 68, 0.3)',
    info: '0px 0px 20px rgba(0, 191, 255, 0.5), 0px 0px 40px rgba(0, 191, 255, 0.3)',
    primary: '0px 0px 20px rgba(255, 20, 147, 0.5), 0px 0px 40px rgba(255, 20, 147, 0.3)',
    warning: '0px 0px 20px rgba(255, 215, 0, 0.5), 0px 0px 40px rgba(255, 215, 0, 0.3)',
    card: '0px 0px 30px rgba(255, 20, 147, 0.2), inset 0px 0px 2px rgba(255, 107, 53, 0.5)',
    cardSm: '0px 0px 15px rgba(255, 20, 147, 0.2), inset 0px 0px 1px rgba(255, 107, 53, 0.5)',
    cardLg: '0px 0px 60px rgba(255, 107, 53, 0.3), 0px 0px 120px rgba(255, 20, 147, 0.2)'
  },
  layout: {
    general: {
      bodyBg: '#0d0818'
    },
    sidebar: {
      background: alpha('#2d1b69', 0.8),
      textColor: '#ff1493',
      dividerBg: alpha('#ff1493', 0.1),
      menuItemColor: '#ff6b35',
      menuItemColorActive: '#ff1493',
      menuItemBg: 'transparent',
      menuItemBgActive: alpha('#ff1493', 0.1),
      menuItemIconColor: '#7fffd4',
      menuItemIconColorActive: '#ff1493',
      menuItemHeadingColor: '#ffd700'
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

export const SyncWaveTheme = createTheme({
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
  pagination: {
    background: alpha('#2d1b69', 0.6),
    backgroundHover: alpha('#ff1493', 0.15),
    border: alpha('#ff1493', 0.2),
    textColor: '#ff1493',
    selectedBackground: 'linear-gradient(135deg, #ff1493 0%, #ff6b35 100%)',
    selectedTextColor: themeColors.black,
    boxShadow: '0px 0px 15px rgba(255, 20, 147, 0.2)'
  },
  general: {
    reactFrameworkColor: '#ff149380',
    borderRadiusSm: '4px',
    borderRadius: '8px',
    borderRadiusLg: '12px',
    borderRadiusXl: '16px',
    backgroundAlt: alpha('#2d1b69', 0.5),
    backgroundAsset: alpha('#ff1493', 0.05),
    backgroundTrait: alpha('#ff6b35', 0.1),
    borderTrait: '#ff6b35'
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
    boxShadow: '0px 0px 30px rgba(255, 20, 147, 0.3)',
    width: '290px'
  },
  header: {
    height: '80px',
    background: alpha('#0d0818', 0.8),
    boxShadow: '0px 0px 20px rgba(255, 107, 53, 0.3)',
    textColor: colors.secondary.main
  },
  spacing: 9,
  currency: {
    background1: alpha('#ff1493', 0.1),
    background2: alpha('#ff6b35', 0.1),
    border: `1px solid ${alpha('#ff1493', 0.3)}`
  },

  walletDialog: {
    background: alpha('#2d1b69', 0.95),
    backgroundSecondary: alpha('#2d1b69', 0.6),
    border: alpha('#ff1493', 0.2)
  },

  chart: {
    background: alpha('#0d0818', 0.8),
    gridColor: alpha('#ff1493', 0.1),
    borderColor: alpha('#ff6b35', 0.3)
  },
  palette: {
    common: {
      black: themeColors.white,
      white: themeColors.black
    },
    mode: 'dark',
    primary: {
      light: colors.primary.light,
      main: colors.primary.main,
      dark: colors.primary.dark,
      contrastText: themeColors.black
    },
    secondary: {
      light: colors.secondary.light,
      main: colors.secondary.main,
      dark: colors.secondary.dark,
      contrastText: themeColors.black
    },
    error: {
      light: colors.error.light,
      main: colors.error.main,
      dark: colors.error.dark,
      contrastText: themeColors.white
    },
    success: {
      light: colors.success.light,
      main: colors.success.main,
      dark: colors.success.dark,
      contrastText: themeColors.black
    },
    info: {
      light: colors.info.light,
      main: colors.info.main,
      dark: colors.info.dark,
      contrastText: themeColors.black
    },
    warning: {
      light: colors.warning.light,
      main: colors.warning.main,
      dark: colors.warning.dark,
      contrastText: themeColors.black
    },
    text: {
      primary: '#ff1493',
      secondary: alpha('#ff6b35', 0.8),
      disabled: alpha('#ff1493', 0.5)
    },
    background: {
      paper: alpha('#2d1b69', 0.8),
      default: '#0d0818'
    },
    action: {
      active: colors.alpha.white[100],
      hover: alpha(themeColors.primary, 0.2),
      hoverOpacity: 0.2,
      selected: alpha(themeColors.primary, 0.3),
      selectedOpacity: 0.3,
      disabled: alpha(themeColors.white, 0.3),
      disabledBackground: alpha(themeColors.white, 0.1),
      disabledOpacity: 0.38,
      focus: alpha(themeColors.primary, 0.2),
      focusOpacity: 0.2,
      activatedOpacity: 0.24
    },
    divider: alpha('#ff1493', 0.2),
    tonalOffset: 0.5
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
  components: {
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
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: alpha('#2d1b69', 0.8),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha('#ff1493', 0.2)}`,
          boxShadow: '0px 0px 20px rgba(255, 20, 147, 0.1)',
          '&:hover': {
            boxShadow: '0px 0px 30px rgba(255, 20, 147, 0.2)',
            borderColor: alpha('#ff1493', 0.4)
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          borderRadius: '4px',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: '-100%',
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, transparent, rgba(255, 107, 53, 0.4), transparent)',
            transition: 'left 0.5s'
          },
          '&:hover::before': {
            left: '100%'
          }
        },
        contained: {
          background: 'linear-gradient(135deg, #ff1493 0%, #ff6b35 100%)',
          boxShadow: '0px 0px 15px rgba(255, 20, 147, 0.5)',
          '&:hover': {
            background: 'linear-gradient(135deg, #ff1493 0%, #ffd700 100%)',
            boxShadow: '0px 0px 25px rgba(255, 107, 53, 0.7)'
          }
        },
        outlined: {
          borderColor: themeColors.primary,
          color: themeColors.primary,
          '&:hover': {
            borderColor: themeColors.primary,
            backgroundColor: alpha(themeColors.primary, 0.1),
            boxShadow: '0px 0px 15px rgba(255, 20, 147, 0.3)'
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
    MuiTypography: {
      styleOverrides: {
        root: {
          textShadow: '0 0 10px currentColor'
        },
        h1: {
          fontFamily: '"Orbitron", "Roboto", "Arial", sans-serif',
          textTransform: 'uppercase',
          letterSpacing: '0.1em'
        },
        h2: {
          fontFamily: '"Orbitron", "Roboto", "Arial", sans-serif',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '4px',
          border: `1px solid ${alpha('#ff1493', 0.3)}`,
          backgroundColor: alpha('#ff1493', 0.1),
          '&:hover': {
            backgroundColor: alpha('#ff1493', 0.2),
            boxShadow: '0px 0px 10px rgba(255, 20, 147, 0.5)'
          }
        }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: alpha('#ff1493', 0.2),
          '&::before, &::after': {
            borderColor: alpha('#ff1493', 0.2)
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          border: `1px solid ${alpha('#ff1493', 0.2)}`,
          background: alpha('#2d1b69', 0.6),
          backdropFilter: 'blur(10px)',
          boxShadow: '0px 0px 20px rgba(255, 20, 147, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0px 0px 40px rgba(255, 107, 53, 0.3)',
            borderColor: alpha('#ff6b35', 0.5)
          }
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: alpha('#ff1493', 0.1),
          color: alpha('#ff1493', 0.9)
        },
        head: {
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: themeColors.primary,
          borderBottomColor: alpha('#ff1493', 0.3)
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: alpha('#ff1493', 0.3)
            },
            '&:hover fieldset': {
              borderColor: alpha('#ff1493', 0.5)
            },
            '&.Mui-focused fieldset': {
              borderColor: themeColors.primary,
              boxShadow: '0px 0px 10px rgba(255, 20, 147, 0.3)'
            }
          }
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: alpha('#2d1b69', 0.95),
          border: `1px solid ${alpha('#ff1493', 0.3)}`,
          color: themeColors.primary,
          boxShadow: '0px 0px 20px rgba(255, 20, 147, 0.3)',
          backdropFilter: 'blur(10px)'
        },
        arrow: {
          color: alpha('#2d1b69', 0.95),
          '&::before': {
            border: `1px solid ${alpha('#ff1493', 0.3)}`
          }
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
            textShadow: '0 0 20px currentColor'
          }
        }
      }
    },
    MuiPagination: {
      styleOverrides: {
        root: {
          '& .MuiPaginationItem-root': {
            backgroundColor: alpha('#2d1b69', 0.6),
            color: '#ff1493',
            border: `1px solid ${alpha('#ff1493', 0.2)}`,
            backdropFilter: 'blur(10px)',
            textShadow: '0 0 5px currentColor',
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: alpha('#ff1493', 0.15),
              borderColor: alpha('#ff1493', 0.5),
              boxShadow: '0px 0px 15px rgba(255, 20, 147, 0.3)',
              transform: 'scale(1.05)'
            },
            '&.Mui-selected': {
              background: 'linear-gradient(135deg, #ff1493 0%, #ff6b35 100%)',
              color: themeColors.black,
              borderColor: '#ff1493',
              boxShadow: '0px 0px 20px rgba(255, 20, 147, 0.5)',
              textShadow: 'none',
              '&:hover': {
                background: 'linear-gradient(135deg, #ff1493 0%, #ffd700 100%)',
                boxShadow: '0px 0px 25px rgba(255, 107, 53, 0.7)'
              }
            }
          }
        }
      }
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          backgroundColor: alpha('#2d1b69', 0.6),
          backdropFilter: 'blur(10px)',
          borderTop: `1px solid ${alpha('#ff1493', 0.2)}`,
          color: '#ff1493',
          boxShadow: '0px 0px 10px rgba(255, 20, 147, 0.1)'
        },
        selectIcon: {
          color: alpha('#ff1493', 0.7)
        },
        select: {
          color: '#ff1493',
          textShadow: '0 0 5px currentColor'
        },
        menuItem: {
          backgroundColor: alpha('#2d1b69', 0.95),
          color: '#ff1493',
          '&:hover': {
            backgroundColor: alpha('#ff1493', 0.15),
            boxShadow: '0px 0px 10px rgba(255, 20, 147, 0.3)'
          }
        }
      }
    },
    MuiCssBaseline: {
      styleOverrides: {
        'html, body': {
          width: '100%',
          height: '100%'
        },
        body: {
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100%',
          width: '100%',
          flex: 1,
          background: '#0d0818',
          position: 'relative',
          '&::after': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(ellipse at center, transparent 0%, rgba(13, 8, 24, 0.4) 50%, rgba(13, 8, 24, 0.8) 100%)`,
            pointerEvents: 'none',
            zIndex: -1
          },
          scrollbarColor: `${alpha('#ff1493', 0.5)} ${alpha('#2d1b69', 0.3)}`,
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            backgroundColor: alpha('#2d1b69', 0.3),
            width: '8px',
            height: '8px'
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            backgroundColor: alpha('#ff1493', 0.5),
            border: `1px solid ${alpha('#ff1493', 0.3)}`
          },
          '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
            backgroundColor: alpha('#ff1493', 0.7),
            boxShadow: '0 0 10px rgba(255, 20, 147, 0.5)'
          }
        },
        '#__next': {
          width: '100%',
          display: 'flex',
          flex: 1,
          flexDirection: 'column'
        },
        html: {
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100%',
          width: '100%',
          MozOsxFontSmoothing: 'grayscale',
          WebkitFontSmoothing: 'antialiased'
        },
        '@keyframes neon-glow': {
          '0%': {
            textShadow: '0 0 10px currentColor, 0 0 20px currentColor'
          },
          '50%': {
            textShadow: '0 0 20px currentColor, 0 0 40px currentColor'
          },
          '100%': {
            textShadow: '0 0 10px currentColor, 0 0 20px currentColor'
          }
        },
        '@keyframes scan-line': {
          '0%': {
            transform: 'translateY(-100%)'
          },
          '100%': {
            transform: 'translateY(100%)'
          }
        },
      }
    }
  },
  shape: {
    borderRadius: 8
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2rem',
      letterSpacing: '0.1em',
      textTransform: 'uppercase'
    },
    h2: {
      fontWeight: 700,
      fontSize: '1.5rem',
      letterSpacing: '0.05em',
      textTransform: 'uppercase'
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.25rem',
      letterSpacing: '0.05em'
    },
    h4: {
      fontWeight: 600,
      fontSize: '1rem',
      letterSpacing: '0.03em'
    },
    body1: {
      fontSize: '0.875rem',
      letterSpacing: '0.02em'
    },
    body2: {
      fontSize: '0.875rem',
      letterSpacing: '0.02em'
    },
    button: {
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase'
    }
  },
  shadows: [
    'none',
    '0px 0px 10px rgba(255, 20, 147, 0.1)',
    '0px 0px 15px rgba(255, 20, 147, 0.15)',
    '0px 0px 20px rgba(255, 20, 147, 0.2)',
    '0px 0px 25px rgba(255, 20, 147, 0.25)',
    '0px 0px 30px rgba(255, 20, 147, 0.3)',
    '0px 0px 35px rgba(255, 20, 147, 0.35)',
    '0px 0px 40px rgba(255, 20, 147, 0.4)',
    '0px 0px 45px rgba(255, 20, 147, 0.45)',
    '0px 0px 50px rgba(255, 20, 147, 0.5)',
    '0px 0px 55px rgba(255, 107, 53, 0.3)',
    '0px 0px 60px rgba(255, 107, 53, 0.35)',
    '0px 0px 65px rgba(255, 107, 53, 0.4)',
    '0px 0px 70px rgba(255, 107, 53, 0.45)',
    '0px 0px 75px rgba(255, 107, 53, 0.5)',
    '0px 0px 80px rgba(255, 107, 53, 0.55)',
    '0px 0px 85px rgba(255, 107, 53, 0.6)',
    '0px 0px 90px rgba(255, 107, 53, 0.65)',
    '0px 0px 95px rgba(255, 107, 53, 0.7)',
    '0px 0px 100px rgba(255, 215, 0, 0.5)',
    '0px 0px 105px rgba(255, 215, 0, 0.6)',
    '0px 0px 110px rgba(255, 215, 0, 0.7)',
    '0px 0px 115px rgba(255, 215, 0, 0.8)',
    '0px 0px 120px rgba(255, 215, 0, 0.9)',
    '0px 0px 125px rgba(255, 215, 0, 1)'
  ]
});
