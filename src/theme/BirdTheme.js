import { alpha, createTheme, darken, lighten } from '@mui/material';
import '@mui/lab/themeAugmentation';

// Minimalist Bird theme - monochrome pixel art inspired
const themeColors = {
  primary: '#1A1A1A',      // Black from bird
  secondary: '#F5F5F5',    // Off-white background
  success: '#2E2E2E',      // Dark gray
  warning: '#808080',      // Medium gray
  error: '#4A4A4A',        // Charcoal
  info: '#D3D3D3',         // Light gray
  black: '#000000',        // Pure black
  white: '#FFFFFF',        // Pure white
  primaryAlt: '#333333',   // Dark gray alt
  trueWhite: '#FFFFFF'
};

const colors = {
  gradients: {
    blue1: 'linear-gradient(135deg, #1A1A1A 0%, #2E2E2E 100%)',
    blue2: 'linear-gradient(135deg, #333333 0%, #1A1A1A 100%)',
    blue3: 'linear-gradient(127.55deg, #000000 3.73%, #333333 92.26%)',
    blue4: 'linear-gradient(-20deg, #1A1A1A 0%, #808080 100%)',
    blue5: 'linear-gradient(135deg, #2E2E2E 10%, #000000 100%)',
    orange1: 'linear-gradient(135deg, #4A4A4A 0%, #2E2E2E 100%)',
    orange2: 'linear-gradient(135deg, #808080 0%, #4A4A4A 100%)',
    orange3: 'linear-gradient(120deg, #D3D3D3 0%, #808080 100%)',
    purple1: 'linear-gradient(135deg, #333333 0%, #666666 100%)',
    purple3: 'linear-gradient(135deg, #4A4A4A 0%, #1A1A1A 100%)',
    pink1: 'linear-gradient(135deg, #D3D3D3 0%, #A9A9A9 100%)',
    pink2: 'linear-gradient(135deg, #A9A9A9 0%, #808080 100%)',
    green1: 'linear-gradient(135deg, #2E2E2E 0%, #4A4A4A 100%)',
    green2: 'linear-gradient(to bottom, #333333 0%, #1A1A1A 100%)',
    black1: 'linear-gradient(100.66deg, #1A1A1A 6.56%, #000000 93.57%)',
    black2: 'linear-gradient(60deg, #000000 0%, #333333 100%)'
  },
  shadows: {
    success: '0px 2px 8px rgba(46, 46, 46, 0.3)',
    error: '0px 2px 8px rgba(74, 74, 74, 0.3)',
    info: '0px 2px 8px rgba(211, 211, 211, 0.3)',
    primary: '0px 2px 8px rgba(26, 26, 26, 0.4)',
    warning: '0px 2px 8px rgba(128, 128, 128, 0.3)',
    card: '0px 4px 16px rgba(0, 0, 0, 0.1)',
    cardSm: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    cardLg: '0px 8px 32px rgba(0, 0, 0, 0.12)'
  },
  layout: {
    general: {
      bodyBg: '#F5F5F5'
    },
    sidebar: {
      background: alpha('#FFFFFF', 0.98),
      textColor: '#1A1A1A',
      dividerBg: alpha('#1A1A1A', 0.1),
      menuItemColor: '#333333',
      menuItemColorActive: '#000000',
      menuItemBg: 'transparent',
      menuItemBgActive: alpha('#1A1A1A', 0.08),
      menuItemIconColor: '#4A4A4A',
      menuItemIconColorActive: '#1A1A1A',
      menuItemHeadingColor: '#808080'
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
    lighter: alpha(themeColors.primary, 0.08),
    light: alpha(themeColors.primary, 0.2),
    main: themeColors.primary,
    dark: darken(themeColors.primary, 0.1)
  },
  secondary: {
    lighter: alpha(themeColors.secondary, 0.85),
    light: alpha(themeColors.secondary, 0.7),
    main: themeColors.secondary,
    dark: darken(themeColors.secondary, 0.1)
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

export const BirdTheme = createTheme({
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
    reactFrameworkColor: '#1A1A1A20',
    borderRadiusSm: '2px',
    borderRadius: '4px',
    borderRadiusLg: '6px',
    borderRadiusXl: '8px',
    backgroundAlt: alpha('#F5F5F5', 0.95),
    backgroundAsset: alpha('#1A1A1A', 0.04),
    backgroundTrait: alpha('#333333', 0.08),
    borderTrait: '#1A1A1A'
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
    boxShadow: '0px 2px 16px rgba(0, 0, 0, 0.08)',
    width: '290px'
  },
  header: {
    height: '80px',
    background: alpha('#FFFFFF', 0.98),
    boxShadow: '0px 1px 8px rgba(0, 0, 0, 0.08)',
    textColor: colors.primary.main
  },
  spacing: 9,
  currency: {
    background1: alpha('#1A1A1A', 0.06),
    background2: alpha('#333333', 0.06), 
    border: `1px solid ${alpha('#1A1A1A', 0.2)}`
  },
  palette: {
    common: {
      black: themeColors.black,
      white: themeColors.white
    },
    mode: 'light',
    primary: {
      light: colors.primary.light,
      main: colors.primary.main,
      dark: colors.primary.dark,
      contrastText: themeColors.white
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
      contrastText: themeColors.white
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
      contrastText: themeColors.white
    },
    text: {
      primary: '#1A1A1A',
      secondary: alpha('#1A1A1A', 0.7),
      disabled: alpha('#1A1A1A', 0.4)
    },
    background: {
      paper: '#FFFFFF',
      default: '#F5F5F5'
    },
    action: {
      active: colors.alpha.black[100],
      hover: alpha(themeColors.black, 0.04),
      hoverOpacity: 0.04,
      selected: alpha(themeColors.black, 0.08),
      selectedOpacity: 0.08,
      disabled: alpha(themeColors.black, 0.26),
      disabledBackground: alpha(themeColors.black, 0.12),
      disabledOpacity: 0.38,
      focus: alpha(themeColors.black, 0.12),
      focusOpacity: 0.12,
      activatedOpacity: 0.12
    },
    divider: alpha('#1A1A1A', 0.12),
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
          maxWidth: '1600px !important'
        },
        maxWidthXl: {
          maxWidth: '1920px !important'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#FFFFFF',
          border: `1px solid ${alpha('#1A1A1A', 0.08)}`,
          borderRadius: '4px',
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.06)',
          transition: 'all 0.2s ease',
          '&:hover': {
            boxShadow: '0px 4px 16px rgba(0, 0, 0, 0.08)',
            borderColor: alpha('#1A1A1A', 0.12)
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 500,
          textTransform: 'none',
          letterSpacing: '0.01em',
          borderRadius: '2px',
          padding: '6px 14px',
          transition: 'all 0.15s ease'
        },
        contained: {
          backgroundColor: themeColors.primary,
          color: themeColors.white,
          boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.2)',
          '&:hover': {
            backgroundColor: darken(themeColors.primary, 0.1),
            boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.25)'
          }
        },
        outlined: {
          borderColor: themeColors.primary,
          color: themeColors.primary,
          borderWidth: '1px',
          '&:hover': {
            borderColor: darken(themeColors.primary, 0.1),
            backgroundColor: alpha(themeColors.primary, 0.04),
            borderWidth: '1px'
          }
        }
      }
    },
    MuiTypography: {
      styleOverrides: {
        root: {
          color: 'inherit'
        },
        h1: {
          fontWeight: 600,
          letterSpacing: '-0.01em'
        },
        h2: {
          fontWeight: 500,
          letterSpacing: '-0.005em'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '2px',
          border: `1px solid ${alpha('#1A1A1A', 0.15)}`,
          backgroundColor: alpha('#1A1A1A', 0.04),
          fontWeight: 500,
          '&:hover': {
            backgroundColor: alpha('#1A1A1A', 0.08),
            borderColor: alpha('#1A1A1A', 0.25)
          }
        }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: alpha('#1A1A1A', 0.12),
          '&::before, &::after': {
            borderColor: alpha('#1A1A1A', 0.12),
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '4px',
          border: `1px solid ${alpha('#1A1A1A', 0.08)}`,
          backgroundColor: '#FFFFFF',
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.04)',
          transition: 'all 0.2s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0px 8px 24px rgba(0, 0, 0, 0.08)',
            borderColor: alpha('#1A1A1A', 0.15)
          }
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: alpha('#1A1A1A', 0.08),
          color: alpha('#1A1A1A', 0.87)
        },
        head: {
          fontWeight: 600,
          color: themeColors.primary,
          borderBottomColor: alpha('#1A1A1A', 0.15)
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '2px',
            '& fieldset': {
              borderColor: alpha('#1A1A1A', 0.23),
              borderWidth: '1px'
            },
            '&:hover fieldset': {
              borderColor: alpha('#1A1A1A', 0.4),
            },
            '&.Mui-focused fieldset': {
              borderColor: themeColors.primary,
              borderWidth: '1.5px'
            }
          }
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: alpha('#1A1A1A', 0.9),
          color: themeColors.white,
          borderRadius: '2px',
          fontSize: '0.75rem',
          padding: '6px 10px'
        },
        arrow: {
          color: alpha('#1A1A1A', 0.9)
        }
      }
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: themeColors.primary,
          textDecoration: 'none',
          transition: 'all 0.15s ease',
          '&:hover': {
            textDecoration: 'underline',
            textDecorationThickness: '1px'
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
          background: '#F5F5F5',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url('/static/birdjpg.png')`,
            backgroundSize: '150px',
            backgroundRepeat: 'repeat',
            opacity: 0.15,
            zIndex: -1,
            pointerEvents: 'none',
            imageRendering: 'pixelated'
          },
          scrollbarColor: `${alpha('#1A1A1A', 0.4)} ${alpha('#1A1A1A', 0.08)}`,
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            backgroundColor: alpha('#1A1A1A', 0.08),
            width: '8px',
            height: '8px'
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 0,
            backgroundColor: alpha('#1A1A1A', 0.4),
            border: `1px solid ${alpha('#1A1A1A', 0.08)}`,
          },
          '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
            backgroundColor: alpha('#1A1A1A', 0.6)
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
        }
      }
    }
  },
  shape: {
    borderRadius: 4
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 600,
      fontSize: '2rem'
    },
    h2: {
      fontWeight: 500,
      fontSize: '1.5rem'
    },
    h3: {
      fontWeight: 500,
      fontSize: '1.25rem'
    },
    h4: {
      fontWeight: 500,
      fontSize: '1rem'
    },
    body1: {
      fontSize: '0.875rem'
    },
    body2: {
      fontSize: '0.875rem'
    },
    button: {
      fontWeight: 500,
      letterSpacing: '0.01em'
    }
  },
  shadows: [
    'none',
    '0px 1px 2px rgba(0, 0, 0, 0.04)',
    '0px 1px 3px rgba(0, 0, 0, 0.05)',
    '0px 2px 4px rgba(0, 0, 0, 0.06)',
    '0px 2px 6px rgba(0, 0, 0, 0.07)',
    '0px 3px 8px rgba(0, 0, 0, 0.08)',
    '0px 4px 10px rgba(0, 0, 0, 0.09)',
    '0px 5px 12px rgba(0, 0, 0, 0.1)',
    '0px 6px 14px rgba(0, 0, 0, 0.11)',
    '0px 7px 16px rgba(0, 0, 0, 0.12)',
    '0px 8px 18px rgba(0, 0, 0, 0.13)',
    '0px 9px 20px rgba(0, 0, 0, 0.14)',
    '0px 10px 22px rgba(0, 0, 0, 0.15)',
    '0px 11px 24px rgba(0, 0, 0, 0.16)',
    '0px 12px 26px rgba(0, 0, 0, 0.17)',
    '0px 13px 28px rgba(0, 0, 0, 0.18)',
    '0px 14px 30px rgba(0, 0, 0, 0.19)',
    '0px 15px 32px rgba(0, 0, 0, 0.2)',
    '0px 16px 34px rgba(0, 0, 0, 0.21)',
    '0px 17px 36px rgba(0, 0, 0, 0.22)',
    '0px 18px 38px rgba(0, 0, 0, 0.23)',
    '0px 19px 40px rgba(0, 0, 0, 0.24)',
    '0px 20px 42px rgba(0, 0, 0, 0.25)',
    '0px 21px 44px rgba(0, 0, 0, 0.26)',
    '0px 22px 46px rgba(0, 0, 0, 0.27)'
  ]
});