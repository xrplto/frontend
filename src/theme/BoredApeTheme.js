import { alpha, createTheme, darken, lighten } from '@mui/material';
import '@mui/lab/themeAugmentation';

// Bored Ape color palette extracted from the image
const themeColors = {
  primary: '#FFD700',      // Gold/Yellow from banana hair and jersey
  secondary: '#40E0D0',    // Turquoise from ape face
  success: '#00D4FF',      // Sky Blue from diamond earring
  warning: '#F4A460',      // Sandy Brown from skin
  error: '#FF6B6B',        // Soft Red
  info: '#1E90FF',         // Dodger Blue from background
  black: '#1A1A1A',        // Deep Black
  white: '#FAFAFA',        // Off White
  primaryAlt: '#008B8B',   // Dark Cyan
  trueWhite: '#FFFFFF'
};

const colors = {
  gradients: {
    blue1: 'linear-gradient(135deg, #40E0D0 0%, #00CED1 100%)',
    blue2: 'linear-gradient(135deg, #1E90FF 0%, #0080FF 100%)',
    blue3: 'linear-gradient(127.55deg, #008B8B 3.73%, #40E0D0 92.26%)',
    blue4: 'linear-gradient(-20deg, #40E0D0 0%, #FFD700 100%)',
    blue5: 'linear-gradient(135deg, #1E90FF 10%, #00BFFF 100%)',
    orange1: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
    orange2: 'linear-gradient(135deg, #F4A460 0%, #DDA0DD 100%)',
    orange3: 'linear-gradient(120deg, #FFD700 0%, #40E0D0 100%)',
    purple1: 'linear-gradient(135deg, #40E0D0 0%, #BA55D3 100%)',
    purple3: 'linear-gradient(135deg, #9370DB 0%, #8A2BE2 100%)',
    pink1: 'linear-gradient(135deg, #F4A460 0%, #FFB6C1 100%)',
    pink2: 'linear-gradient(135deg, #DDA0DD 0%, #DA70D6 100%)',
    green1: 'linear-gradient(135deg, #40E0D0 0%, #48D1CC 100%)',
    green2: 'linear-gradient(to bottom, #00FA9A 0%, #40E0D0 100%)',
    black1: 'linear-gradient(100.66deg, #2A2A2A 6.56%, #1A1A1A 93.57%)',
    black2: 'linear-gradient(60deg, #1A1A1A 0%, #008B8B 100%)'
  },
  shadows: {
    success: '0px 4px 12px rgba(0, 212, 255, 0.4), 0px 8px 24px rgba(0, 212, 255, 0.2)',
    error: '0px 4px 12px rgba(255, 107, 107, 0.4), 0px 8px 24px rgba(255, 107, 107, 0.2)',
    info: '0px 4px 12px rgba(30, 144, 255, 0.4), 0px 8px 24px rgba(30, 144, 255, 0.2)',
    primary: '0px 4px 12px rgba(255, 215, 0, 0.4), 0px 8px 24px rgba(255, 215, 0, 0.2)',
    warning: '0px 4px 12px rgba(244, 164, 96, 0.4), 0px 8px 24px rgba(244, 164, 96, 0.2)',
    card: '0px 8px 24px rgba(64, 224, 208, 0.15), 0px 2px 8px rgba(0, 0, 0, 0.2)',
    cardSm: '0px 4px 12px rgba(64, 224, 208, 0.12), 0px 1px 4px rgba(0, 0, 0, 0.15)',
    cardLg: '0px 16px 48px rgba(255, 215, 0, 0.2), 0px 8px 24px rgba(64, 224, 208, 0.15)'
  },
  layout: {
    general: {
      bodyBg: '#0F0F0F'
    },
    sidebar: {
      background: alpha('#1A1A1A', 0.95),
      textColor: '#40E0D0',
      dividerBg: alpha('#40E0D0', 0.1),
      menuItemColor: '#48D1CC',
      menuItemColorActive: '#FFD700',
      menuItemBg: 'transparent',
      menuItemBgActive: alpha('#FFD700', 0.15),
      menuItemIconColor: '#FFD700',
      menuItemIconColorActive: '#FFA500',
      menuItemHeadingColor: '#F4A460'
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

export const BoredApeTheme = createTheme({
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
    reactFrameworkColor: '#40E0D080',
    borderRadiusSm: '8px',
    borderRadius: '12px',
    borderRadiusLg: '16px',
    borderRadiusXl: '20px',
    backgroundAlt: alpha('#008B8B', 0.4),
    backgroundAsset: alpha('#40E0D0', 0.08),
    backgroundTrait: alpha('#FFD700', 0.12),
    borderTrait: '#FFD700'
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
    boxShadow: '0px 4px 24px rgba(64, 224, 208, 0.2)',
    width: '290px'
  },
  header: {
    height: '80px',
    background: alpha('#0F0F0F', 0.9),
    boxShadow: '0px 2px 12px rgba(255, 215, 0, 0.2)',
    textColor: colors.secondary.main
  },
  spacing: 9,
  currency: {
    background1: alpha('#FFD700', 0.12),
    background2: alpha('#40E0D0', 0.12), 
    border: `1px solid ${alpha('#FFD700', 0.4)}`
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
      contrastText: themeColors.white
    },
    warning: {
      light: colors.warning.light,
      main: colors.warning.main,
      dark: colors.warning.dark,
      contrastText: themeColors.black
    },
    text: {
      primary: '#FAFAFA',
      secondary: alpha('#FAFAFA', 0.7),
      disabled: alpha('#FAFAFA', 0.5)
    },
    background: {
      paper: alpha('#008B8B', 0.3),
      default: '#0F0F0F'
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
    divider: alpha('#40E0D0', 0.15),
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
          backgroundColor: alpha('#1A1A1A', 0.85),
          backdropFilter: 'blur(8px)',
          border: `1px solid ${alpha('#40E0D0', 0.2)}`,
          borderRadius: '12px',
          boxShadow: '0px 8px 24px rgba(64, 224, 208, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0px 12px 36px rgba(64, 224, 208, 0.15)',
            borderColor: alpha('#FFD700', 0.3)
          }
        }
      }
    },
    MuiButton: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          textTransform: 'none',
          letterSpacing: '0.02em',
          borderRadius: '8px',
          padding: '8px 16px',
          transition: 'all 0.3s ease'
        },
        contained: {
          background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
          boxShadow: '0px 4px 12px rgba(255, 215, 0, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #FFD700 0%, #FFB84D 100%)',
            boxShadow: '0px 6px 18px rgba(255, 215, 0, 0.4)',
            transform: 'translateY(-1px)'
          }
        },
        outlined: {
          borderColor: themeColors.secondary,
          color: themeColors.secondary,
          borderWidth: '2px',
          '&:hover': {
            borderColor: themeColors.primary,
            backgroundColor: alpha(themeColors.secondary, 0.08),
            borderWidth: '2px'
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
          fontWeight: 700,
          letterSpacing: '-0.02em'
        },
        h2: {
          fontWeight: 600,
          letterSpacing: '-0.01em'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          border: `1px solid ${alpha('#40E0D0', 0.3)}`,
          backgroundColor: alpha('#40E0D0', 0.1),
          fontWeight: 500,
          '&:hover': {
            backgroundColor: alpha('#40E0D0', 0.2),
            borderColor: alpha('#FFD700', 0.4)
          }
        }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: alpha('#40E0D0', 0.15),
          '&::before, &::after': {
            borderColor: alpha('#40E0D0', 0.15),
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          border: `1px solid ${alpha('#40E0D0', 0.15)}`,
          background: alpha('#1A1A1A', 0.7),
          backdropFilter: 'blur(8px)',
          boxShadow: '0px 8px 24px rgba(64, 224, 208, 0.08)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0px 16px 48px rgba(255, 215, 0, 0.15)',
            borderColor: alpha('#FFD700', 0.3)
          }
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: alpha('#40E0D0', 0.1),
          color: alpha('#FAFAFA', 0.9)
        },
        head: {
          fontWeight: 600,
          color: themeColors.secondary,
          borderBottomColor: alpha('#40E0D0', 0.2)
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: '8px',
            '& fieldset': {
              borderColor: alpha('#40E0D0', 0.3),
              borderWidth: '1.5px'
            },
            '&:hover fieldset': {
              borderColor: alpha('#40E0D0', 0.5),
            },
            '&.Mui-focused fieldset': {
              borderColor: themeColors.primary,
              borderWidth: '2px'
            }
          }
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: alpha('#1A1A1A', 0.95),
          border: `1px solid ${alpha('#FFD700', 0.3)}`,
          color: themeColors.white,
          borderRadius: '8px',
          backdropFilter: 'blur(8px)',
          fontSize: '0.8125rem',
          padding: '8px 12px'
        },
        arrow: {
          color: alpha('#1A1A1A', 0.95),
          '&::before': {
            border: `1px solid ${alpha('#FFD700', 0.3)}`
          }
        }
      }
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: themeColors.secondary,
          textDecoration: 'none',
          transition: 'all 0.2s ease',
          '&:hover': {
            color: themeColors.primary,
            textDecoration: 'underline'
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
          background: '#0F0F0F',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `url('/static/boredapexrp.png')`,
            backgroundSize: '250px',
            backgroundRepeat: 'repeat',
            opacity: 0.02,
            zIndex: -2,
            pointerEvents: 'none'
          },
          '&::after': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(ellipse at center, transparent 0%, rgba(15, 15, 15, 0.6) 50%, rgba(15, 15, 15, 0.9) 100%)`,
            pointerEvents: 'none',
            zIndex: -1
          },
          scrollbarColor: `${alpha('#FFD700', 0.5)} ${alpha('#1A1A1A', 0.3)}`,
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            backgroundColor: alpha('#1A1A1A', 0.3),
            width: '10px',
            height: '10px'
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 10,
            backgroundColor: alpha('#FFD700', 0.5),
            border: `2px solid ${alpha('#1A1A1A', 0.3)}`,
          },
          '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
            backgroundColor: alpha('#FFD700', 0.7)
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
    borderRadius: 12
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
      fontSize: '2rem'
    },
    h2: {
      fontWeight: 600,
      fontSize: '1.5rem'
    },
    h3: {
      fontWeight: 600,
      fontSize: '1.25rem'
    },
    h4: {
      fontWeight: 600,
      fontSize: '1rem'
    },
    body1: {
      fontSize: '0.875rem'
    },
    body2: {
      fontSize: '0.875rem'
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.02em'
    }
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0, 0, 0, 0.1)',
    '0px 4px 8px rgba(0, 0, 0, 0.12)',
    '0px 6px 12px rgba(0, 0, 0, 0.14)',
    '0px 8px 16px rgba(0, 0, 0, 0.16)',
    '0px 10px 20px rgba(0, 0, 0, 0.18)',
    '0px 12px 24px rgba(0, 0, 0, 0.2)',
    '0px 14px 28px rgba(0, 0, 0, 0.22)',
    '0px 16px 32px rgba(0, 0, 0, 0.24)',
    '0px 18px 36px rgba(0, 0, 0, 0.26)',
    '0px 20px 40px rgba(0, 0, 0, 0.28)',
    '0px 22px 44px rgba(0, 0, 0, 0.3)',
    '0px 24px 48px rgba(0, 0, 0, 0.32)',
    '0px 26px 52px rgba(0, 0, 0, 0.34)',
    '0px 28px 56px rgba(0, 0, 0, 0.36)',
    '0px 30px 60px rgba(0, 0, 0, 0.38)',
    '0px 32px 64px rgba(0, 0, 0, 0.4)',
    '0px 34px 68px rgba(0, 0, 0, 0.42)',
    '0px 36px 72px rgba(0, 0, 0, 0.44)',
    '0px 38px 76px rgba(0, 0, 0, 0.46)',
    '0px 40px 80px rgba(0, 0, 0, 0.48)',
    '0px 42px 84px rgba(0, 0, 0, 0.5)',
    '0px 44px 88px rgba(0, 0, 0, 0.52)',
    '0px 46px 92px rgba(0, 0, 0, 0.54)',
    '0px 48px 96px rgba(0, 0, 0, 0.56)'
  ]
});