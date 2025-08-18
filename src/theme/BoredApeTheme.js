import { alpha, createTheme, darken, lighten } from '@mui/material';
import '@mui/lab/themeAugmentation';

// Bored Ape color palette - Enhanced with high shine
const themeColors = {
  primary: '#FFD700',      // Pure Gold from banana hair and jersey
  secondary: '#40E0D0',    // Diamond Turquoise from ape face
  success: '#00FF87',      // Neon Spring Green for bullish sentiment
  warning: '#F4A460',      // Satin Sandy Brown from skin
  error: '#FF6B6B',        // Soft Red
  info: '#1E90FF',         // Royal Dodger Blue from background
  black: '#0A0A0A',        // Ultra Deep Black
  white: '#FEFEFE',        // Pristine White
  primaryAlt: '#008B8B',   // Deep Cyan
  trueWhite: '#FFFFFF',
  gold: '#FFF700',         // Bright Gold
  diamond: '#E0FFFF'       // Diamond shine
};

const colors = {
  gradients: {
    blue1: 'linear-gradient(135deg, #40E0D0 0%, #00E5E5 25%, #00CED1 50%, #40E0D0 100%)',
    blue2: 'linear-gradient(135deg, #1E90FF 0%, #00BFFF 25%, #0080FF 50%, #1E90FF 100%)',
    blue3: 'linear-gradient(127.55deg, #008B8B 3.73%, #40E0D0 50%, #00E5E5 92.26%)',
    blue4: 'linear-gradient(-20deg, #40E0D0 0%, #FFD700 33%, #FFF700 66%, #40E0D0 100%)',
    blue5: 'linear-gradient(135deg, #1E90FF 0%, #00FF87 25%, #00BFFF 75%, #40E0D0 100%)',
    orange1: 'linear-gradient(135deg, #FFD700 0%, #FFF700 25%, #FFA500 75%, #FFD700 100%)',
    orange2: 'linear-gradient(135deg, #F4A460 0%, #FFB6C1 50%, #DDA0DD 100%)',
    orange3: 'linear-gradient(120deg, #FFD700 0%, #FFF700 25%, #40E0D0 75%, #00E5E5 100%)',
    purple1: 'linear-gradient(135deg, #40E0D0 0%, #9370DB 50%, #BA55D3 100%)',
    purple3: 'linear-gradient(135deg, #9370DB 0%, #BA55D3 50%, #8A2BE2 100%)',
    pink1: 'linear-gradient(135deg, #F4A460 0%, #FFDAB9 50%, #FFB6C1 100%)',
    pink2: 'linear-gradient(135deg, #DDA0DD 0%, #FF69B4 50%, #DA70D6 100%)',
    green1: 'linear-gradient(135deg, #40E0D0 0%, #00E5E5 50%, #48D1CC 100%)',
    green2: 'linear-gradient(to bottom, #00FA9A 0%, #40E0D0 50%, #00E5E5 100%)',
    black1: 'linear-gradient(100.66deg, #1A1A1A 0%, #0A0A0A 50%, #000000 100%)',
    black2: 'linear-gradient(60deg, #0A0A0A 0%, #008B8B 50%, #40E0D0 100%)',
    gold1: 'linear-gradient(135deg, #FFD700 0%, #FFF700 20%, #FFD700 40%, #FFA500 60%, #FFD700 80%, #FFF700 100%)',
    diamond1: 'linear-gradient(135deg, #40E0D0 0%, #E0FFFF 25%, #40E0D0 50%, #00D4FF 75%, #40E0D0 100%)'
  },
  shadows: {
    success: '0px 0px 20px rgba(0, 255, 135, 0.6), 0px 4px 16px rgba(0, 255, 135, 0.4), 0px 8px 32px rgba(0, 255, 135, 0.3)',
    error: '0px 0px 20px rgba(255, 107, 107, 0.6), 0px 4px 16px rgba(255, 107, 107, 0.4), 0px 8px 32px rgba(255, 107, 107, 0.3)',
    info: '0px 0px 20px rgba(30, 144, 255, 0.6), 0px 4px 16px rgba(30, 144, 255, 0.4), 0px 8px 32px rgba(30, 144, 255, 0.3)',
    primary: '0px 0px 30px rgba(255, 215, 0, 0.8), 0px 4px 20px rgba(255, 215, 0, 0.6), 0px 12px 40px rgba(255, 215, 0, 0.4)',
    warning: '0px 0px 20px rgba(244, 164, 96, 0.6), 0px 4px 16px rgba(244, 164, 96, 0.4), 0px 8px 32px rgba(244, 164, 96, 0.3)',
    card: '0px 0px 40px rgba(64, 224, 208, 0.25), 0px 8px 32px rgba(64, 224, 208, 0.2), 0px 2px 8px rgba(0, 0, 0, 0.3)',
    cardSm: '0px 0px 20px rgba(64, 224, 208, 0.2), 0px 4px 16px rgba(64, 224, 208, 0.15), 0px 1px 4px rgba(0, 0, 0, 0.2)',
    cardLg: '0px 0px 60px rgba(255, 215, 0, 0.35), 0px 16px 56px rgba(255, 215, 0, 0.25), 0px 8px 32px rgba(64, 224, 208, 0.2)',
    gold: '0px 0px 40px rgba(255, 247, 0, 0.8), 0px 0px 80px rgba(255, 215, 0, 0.6), 0px 0px 120px rgba(255, 215, 0, 0.4)',
    diamond: '0px 0px 30px rgba(224, 255, 255, 0.8), 0px 0px 60px rgba(64, 224, 208, 0.6), 0px 0px 90px rgba(64, 224, 208, 0.4)'
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
  typography: {
    fontFamily: "'JetBrains Mono', 'Courier New', monospace",
    fontSize: 14,
    h1: { fontFamily: "'JetBrains Mono', monospace" },
    h2: { fontFamily: "'JetBrains Mono', monospace" },
    h3: { fontFamily: "'JetBrains Mono', monospace" },
    h4: { fontFamily: "'JetBrains Mono', monospace" },
    h5: { fontFamily: "'JetBrains Mono', monospace" },
    h6: { fontFamily: "'JetBrains Mono', monospace" },
    body1: { fontVariantNumeric: "tabular-nums" },
    body2: { fontVariantNumeric: "tabular-nums" }
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
    reactFrameworkColor: '#40E0D080',
    borderRadiusSm: '8px',
    borderRadius: '12px',
    borderRadiusLg: '16px',
    borderRadiusXl: '20px',
    backgroundAlt: alpha('#008B8B', 0.4),
    backgroundAsset: `linear-gradient(135deg, ${alpha('#40E0D0', 0.08)} 0%, ${alpha('#00D4FF', 0.05)} 100%)`,
    backgroundTrait: `linear-gradient(135deg, ${alpha('#FFD700', 0.15)} 0%, ${alpha('#FFF700', 0.08)} 100%)`,
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
    boxShadow: '0px 0px 30px rgba(64, 224, 208, 0.3), 0px 4px 24px rgba(64, 224, 208, 0.2)',
    width: '290px'
  },
  header: {
    height: '80px',
    background: alpha('#0F0F0F', 0.9),
    boxShadow: '0px 0px 20px rgba(255, 215, 0, 0.3), 0px 2px 12px rgba(255, 215, 0, 0.2)',
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
      primary: '#FFFFFF',
      secondary: alpha('#FFD700', 0.85),
      disabled: alpha('#40E0D0', 0.5)
    },
    background: {
      paper: 'rgba(0, 139, 139, 0.01)', // Very transparent to avoid alpha() errors
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
          backgroundColor: 'transparent',
          background: 'transparent',
          backdropFilter: 'none',
          border: `1px solid ${alpha('#40E0D0', 0.3)}`,
          borderRadius: '16px',
          boxShadow: '0px 0px 30px rgba(64, 224, 208, 0.15), 0px 8px 32px rgba(64, 224, 208, 0.1), inset 0px 1px 1px rgba(255, 255, 255, 0.1)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            display: 'none'
          },
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0px 0px 40px rgba(255, 215, 0, 0.25), 0px 12px 40px rgba(64, 224, 208, 0.2), inset 0px 1px 1px rgba(255, 255, 255, 0.2)',
            borderColor: alpha('#FFD700', 0.5)
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
          transition: 'all 0.3s ease',
          color: themeColors.black
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
        },
        contained: {
          background: 'linear-gradient(135deg, #FFD700 0%, #FFF700 25%, #FFA500 75%, #FFD700 100%)',
          boxShadow: '0px 0px 20px rgba(255, 215, 0, 0.5), 0px 4px 16px rgba(255, 215, 0, 0.3), inset 0px 1px 1px rgba(255, 255, 255, 0.4)',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.5) 50%, transparent 70%)',
            transform: 'rotate(45deg)',
            transition: 'all 0.6s',
            opacity: 0
          },
          '&:hover': {
            background: 'linear-gradient(135deg, #FFF700 0%, #FFD700 25%, #FFB84D 75%, #FFF700 100%)',
            boxShadow: '0px 0px 30px rgba(255, 215, 0, 0.7), 0px 6px 24px rgba(255, 215, 0, 0.5), inset 0px 1px 1px rgba(255, 255, 255, 0.6)',
            transform: 'translateY(-2px) scale(1.02)',
            '&::before': {
              animation: 'shine 0.6s ease-in-out'
            }
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
          letterSpacing: '-0.02em',
          color: themeColors.primary,
          textShadow: '0 0 20px rgba(255, 215, 0, 0.5)'
        },
        h2: {
          fontWeight: 600,
          letterSpacing: '-0.01em',
          color: themeColors.primary,
          textShadow: '0 0 15px rgba(255, 215, 0, 0.4)'
        },
        h3: {
          fontWeight: 600,
          color: themeColors.secondary,
          textShadow: '0 0 10px rgba(64, 224, 208, 0.4)'
        },
        h4: {
          fontWeight: 600,
          color: themeColors.secondary,
          textShadow: '0 0 8px rgba(64, 224, 208, 0.3)'
        },
        h5: {
          color: '#FFFFFF'
        },
        h6: {
          color: '#FFFFFF'
        },
        body1: {
          color: '#FFFFFF'
        },
        body2: {
          color: alpha('#FFFFFF', 0.85)
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '16px',
          border: `1px solid ${alpha('#40E0D0', 0.3)}`,
          background: 'transparent',
          fontWeight: 500,
          boxShadow: 'none',
          color: themeColors.secondary,
          '&:hover': {
            background: alpha('#40E0D0', 0.05),
            borderColor: alpha('#FFD700', 0.5),
            boxShadow: '0px 0px 20px rgba(255, 215, 0, 0.3)',
            color: themeColors.primary
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
          background: 'transparent',
          backdropFilter: 'none',
          boxShadow: '0px 0px 30px rgba(64, 224, 208, 0.12), 0px 8px 32px rgba(64, 224, 208, 0.08), inset 0px 1px 1px rgba(255, 255, 255, 0.05)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
          position: 'relative',
          '&::after': {
            display: 'none'
          },
          '&:hover': {
            transform: 'translateY(-6px) scale(1.02)',
            boxShadow: '0px 0px 50px rgba(255, 215, 0, 0.25), 0px 16px 56px rgba(255, 215, 0, 0.15), inset 0px 1px 1px rgba(255, 255, 255, 0.1)',
            borderColor: alpha('#FFD700', 0.5),
            '&::after': {
              opacity: 1
            }
          }
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: alpha('#40E0D0', 0.1),
          color: '#FFFFFF'
        },
        head: {
          fontWeight: 600,
          color: themeColors.primary,
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
              borderWidth: '2px',
              boxShadow: '0px 0px 20px rgba(255, 215, 0, 0.3)'
            }
          }
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          background: `linear-gradient(135deg, ${alpha('#0A0A0A', 0.98)} 0%, ${alpha('#1A1A1A', 0.95)} 100%)`,
          border: `1px solid ${alpha('#FFD700', 0.4)}`,
          color: themeColors.white,
          borderRadius: '12px',
          backdropFilter: 'blur(20px) saturate(180%)',
          fontSize: '0.8125rem',
          padding: '10px 16px',
          boxShadow: '0px 0px 30px rgba(255, 215, 0, 0.3), 0px 8px 24px rgba(0, 0, 0, 0.4)'
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
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '120%',
            height: '120%',
            backgroundImage: `url('/static/boredapexrp.png')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            opacity: 0.08,
            filter: 'contrast(1.3) brightness(1.2) saturate(1.2)',
            zIndex: -2,
            pointerEvents: 'none',
            animation: 'floatBackground 20s ease-in-out infinite'
          },
          '&::after': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(ellipse at center, transparent 0%, rgba(10, 10, 10, 0.4) 40%, rgba(10, 10, 10, 0.8) 80%, rgba(10, 10, 10, 0.95) 100%)`,
            pointerEvents: 'none',
            zIndex: -1
          },
          scrollbarColor: `${alpha('#FFD700', 0.6)} ${alpha('#0A0A0A', 0.4)}`,
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            backgroundColor: alpha('#1A1A1A', 0.3),
            width: '10px',
            height: '10px'
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 10,
            background: `linear-gradient(135deg, ${alpha('#FFD700', 0.6)} 0%, ${alpha('#FFA500', 0.5)} 100%)`,
            border: `2px solid ${alpha('#FFD700', 0.3)}`,
            boxShadow: '0px 0px 10px rgba(255, 215, 0, 0.3)',
          },
          '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
            background: `linear-gradient(135deg, ${alpha('#FFF700', 0.8)} 0%, ${alpha('#FFD700', 0.7)} 100%)`,
            boxShadow: '0px 0px 20px rgba(255, 215, 0, 0.5)'
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
        '@keyframes shine': {
          '0%': {
            opacity: 0,
            transform: 'translateX(-100%) translateY(-100%)'
          },
          '50%': {
            opacity: 1
          },
          '100%': {
            opacity: 0,
            transform: 'translateX(100%) translateY(100%)'
          }
        },
        '@keyframes goldPulse': {
          '0%': {
            boxShadow: '0 0 30px rgba(255, 215, 0, 0.4)'
          },
          '50%': {
            boxShadow: '0 0 50px rgba(255, 215, 0, 0.8), 0 0 80px rgba(255, 215, 0, 0.4)'
          },
          '100%': {
            boxShadow: '0 0 30px rgba(255, 215, 0, 0.4)'
          }
        },
        '@keyframes floatBackground': {
          '0%, 100%': {
            transform: 'translate(-50%, -50%) scale(1.0)'
          },
          '25%': {
            transform: 'translate(-48%, -52%) scale(1.02)'
          },
          '50%': {
            transform: 'translate(-52%, -48%) scale(1.05)'
          },
          '75%': {
            transform: 'translate(-48%, -50%) scale(1.02)'
          }
        }
      }
    }
  },
  shape: {
    borderRadius: 12
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