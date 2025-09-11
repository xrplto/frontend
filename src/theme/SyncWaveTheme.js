import { alpha, createTheme, darken, lighten } from '@mui/material';

// Cyberpunk-inspired color palette
const themeColors = {
  primary: '#00ffff',      // Cyan
  secondary: '#ff00ff',    // Magenta
  success: '#00ff00',      // Neon Green
  warning: '#ffff00',      // Neon Yellow
  error: '#ff0066',        // Hot Pink
  info: '#00ccff',         // Electric Blue
  black: '#0a0a0a',        // Deep Black
  white: '#f0f0f0',        // Off White
  primaryAlt: '#1a0033',   // Deep Purple
  trueWhite: '#ffffff'
};

const colors = {
  gradients: {
    blue1: 'linear-gradient(135deg, #00ffff 0%, #0080ff 100%)',
    blue2: 'linear-gradient(135deg, #00ccff 0%, #0066ff 100%)',
    blue3: 'linear-gradient(127.55deg, #1a0033 3.73%, #330066 92.26%)',
    blue4: 'linear-gradient(-20deg, #00ffff 0%, #ff00ff 100%)',
    blue5: 'linear-gradient(135deg, #0099ff 10%, #003366 100%)',
    orange1: 'linear-gradient(135deg, #ff00ff 0%, #ff0066 100%)',
    orange2: 'linear-gradient(135deg, #ff66cc 0%, #ff0099 100%)',
    orange3: 'linear-gradient(120deg, #ffff00 0%, #ff00ff 100%)',
    purple1: 'linear-gradient(135deg, #00ffff 0%, #9900ff 100%)',
    purple3: 'linear-gradient(135deg, #cc00ff 0%, #6600cc 100%)',
    pink1: 'linear-gradient(135deg, #ff99ff 0%, #ff00ff 100%)',
    pink2: 'linear-gradient(135deg, #ff0099 0%, #cc0066 100%)',
    green1: 'linear-gradient(135deg, #00ff00 0%, #00ffff 100%)',
    green2: 'linear-gradient(to bottom, #00ff99 0%, #00ffff 100%)',
    black1: 'linear-gradient(100.66deg, #1a1a1a 6.56%, #000000 93.57%)',
    black2: 'linear-gradient(60deg, #0a0a0a 0%, #1a0033 100%)'
  },
  shadows: {
    success: '0px 0px 20px rgba(0, 255, 0, 0.5), 0px 0px 40px rgba(0, 255, 0, 0.3)',
    error: '0px 0px 20px rgba(255, 0, 102, 0.5), 0px 0px 40px rgba(255, 0, 102, 0.3)',
    info: '0px 0px 20px rgba(0, 255, 255, 0.5), 0px 0px 40px rgba(0, 255, 255, 0.3)',
    primary: '0px 0px 20px rgba(0, 255, 255, 0.5), 0px 0px 40px rgba(0, 255, 255, 0.3)',
    warning: '0px 0px 20px rgba(255, 255, 0, 0.5), 0px 0px 40px rgba(255, 255, 0, 0.3)',
    card: '0px 0px 30px rgba(0, 255, 255, 0.2), inset 0px 0px 2px rgba(0, 255, 255, 0.5)',
    cardSm: '0px 0px 15px rgba(0, 255, 255, 0.2), inset 0px 0px 1px rgba(0, 255, 255, 0.5)',
    cardLg: '0px 0px 60px rgba(255, 0, 255, 0.3), 0px 0px 120px rgba(0, 255, 255, 0.2)'
  },
  layout: {
    general: {
      bodyBg: '#030310'
    },
    sidebar: {
      background: alpha('#1a0033', 0.8),
      textColor: '#00ffff',
      dividerBg: alpha('#00ffff', 0.1),
      menuItemColor: '#00ccff',
      menuItemColorActive: '#00ffff',
      menuItemBg: 'transparent',
      menuItemBgActive: alpha('#00ffff', 0.1),
      menuItemIconColor: '#ff00ff',
      menuItemIconColorActive: '#00ffff',
      menuItemHeadingColor: '#ff00ff'
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
  pagination: {
    background: alpha('#1a0033', 0.6),
    backgroundHover: alpha('#00ffff', 0.15),
    border: alpha('#00ffff', 0.2),
    textColor: '#00ffff',
    selectedBackground: 'linear-gradient(135deg, #00ffff 0%, #0080ff 100%)',
    selectedTextColor: themeColors.black,
    boxShadow: '0px 0px 15px rgba(0, 255, 255, 0.2)'
  },
  general: {
    reactFrameworkColor: '#00ffff80',
    borderRadiusSm: '4px',
    borderRadius: '8px',
    borderRadiusLg: '12px',
    borderRadiusXl: '16px',
    backgroundAlt: alpha('#1a0033', 0.5),
    backgroundAsset: alpha('#00ffff', 0.05),
    backgroundTrait: alpha('#ff00ff', 0.1),
    borderTrait: '#ff00ff'
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
    boxShadow: '0px 0px 30px rgba(0, 255, 255, 0.3)',
    width: '290px'
  },
  header: {
    height: '80px',
    background: alpha('#0a0a0a', 0.8),
    boxShadow: '0px 0px 20px rgba(0, 255, 255, 0.3)',
    textColor: colors.secondary.main
  },
  spacing: 9,
  currency: {
    background1: alpha('#00ffff', 0.1),
    background2: alpha('#ff00ff', 0.1), 
    border: `1px solid ${alpha('#00ffff', 0.3)}`
  },
  
  walletDialog: {
    background: alpha('#1a0033', 0.95),
    backgroundSecondary: alpha('#1a0033', 0.6),
    border: alpha('#00ffff', 0.2)
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
      primary: '#00ffff',
      secondary: alpha('#00ffff', 0.7),
      disabled: alpha('#00ffff', 0.5)
    },
    background: {
      paper: alpha('#1a0033', 0.8),
      default: '#030310'
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
    divider: alpha('#00ffff', 0.2),
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
          backgroundColor: alpha('#1a0033', 0.8),
          backdropFilter: 'blur(10px)',
          border: `1px solid ${alpha('#00ffff', 0.2)}`,
          boxShadow: '0px 0px 20px rgba(0, 255, 255, 0.1)',
          '&:hover': {
            boxShadow: '0px 0px 30px rgba(0, 255, 255, 0.2)',
            borderColor: alpha('#00ffff', 0.4)
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
            background: 'linear-gradient(90deg, transparent, rgba(0, 255, 255, 0.4), transparent)',
            transition: 'left 0.5s',
          },
          '&:hover::before': {
            left: '100%',
          }
        },
        contained: {
          background: 'linear-gradient(135deg, #00ffff 0%, #0080ff 100%)',
          boxShadow: '0px 0px 15px rgba(0, 255, 255, 0.5)',
          '&:hover': {
            background: 'linear-gradient(135deg, #00ffff 0%, #00ccff 100%)',
            boxShadow: '0px 0px 25px rgba(0, 255, 255, 0.7)'
          }
        },
        outlined: {
          borderColor: themeColors.primary,
          color: themeColors.primary,
          '&:hover': {
            borderColor: themeColors.primary,
            backgroundColor: alpha(themeColors.primary, 0.1),
            boxShadow: '0px 0px 15px rgba(0, 255, 255, 0.3)'
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
          border: `1px solid ${alpha('#00ffff', 0.3)}`,
          backgroundColor: alpha('#00ffff', 0.1),
          '&:hover': {
            backgroundColor: alpha('#00ffff', 0.2),
            boxShadow: '0px 0px 10px rgba(0, 255, 255, 0.5)'
          }
        }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: alpha('#00ffff', 0.2),
          '&::before, &::after': {
            borderColor: alpha('#00ffff', 0.2),
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          border: `1px solid ${alpha('#00ffff', 0.2)}`,
          background: alpha('#1a0033', 0.6),
          backdropFilter: 'blur(10px)',
          boxShadow: '0px 0px 20px rgba(0, 255, 255, 0.1)',
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0px 0px 40px rgba(0, 255, 255, 0.3)',
            borderColor: alpha('#00ffff', 0.5)
          }
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: alpha('#00ffff', 0.1),
          color: alpha('#00ffff', 0.9)
        },
        head: {
          fontWeight: 'bold',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          color: themeColors.primary,
          borderBottomColor: alpha('#00ffff', 0.3)
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: alpha('#00ffff', 0.3),
            },
            '&:hover fieldset': {
              borderColor: alpha('#00ffff', 0.5),
            },
            '&.Mui-focused fieldset': {
              borderColor: themeColors.primary,
              boxShadow: '0px 0px 10px rgba(0, 255, 255, 0.3)'
            }
          }
        }
      }
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: alpha('#1a0033', 0.95),
          border: `1px solid ${alpha('#00ffff', 0.3)}`,
          color: themeColors.primary,
          boxShadow: '0px 0px 20px rgba(0, 255, 255, 0.3)',
          backdropFilter: 'blur(10px)'
        },
        arrow: {
          color: alpha('#1a0033', 0.95),
          '&::before': {
            border: `1px solid ${alpha('#00ffff', 0.3)}`
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
            backgroundColor: alpha('#1a0033', 0.6),
            color: '#00ffff',
            border: `1px solid ${alpha('#00ffff', 0.2)}`,
            backdropFilter: 'blur(10px)',
            textShadow: '0 0 5px currentColor',
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: alpha('#00ffff', 0.15),
              borderColor: alpha('#00ffff', 0.5),
              boxShadow: '0px 0px 15px rgba(0, 255, 255, 0.3)',
              transform: 'scale(1.05)'
            },
            '&.Mui-selected': {
              background: 'linear-gradient(135deg, #00ffff 0%, #0080ff 100%)',
              color: themeColors.black,
              borderColor: '#00ffff',
              boxShadow: '0px 0px 20px rgba(0, 255, 255, 0.5)',
              textShadow: 'none',
              '&:hover': {
                background: 'linear-gradient(135deg, #00ffff 0%, #00ccff 100%)',
                boxShadow: '0px 0px 25px rgba(0, 255, 255, 0.7)'
              }
            }
          }
        }
      }
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          backgroundColor: alpha('#1a0033', 0.6),
          backdropFilter: 'blur(10px)',
          borderTop: `1px solid ${alpha('#00ffff', 0.2)}`,
          color: '#00ffff',
          boxShadow: '0px 0px 10px rgba(0, 255, 255, 0.1)'
        },
        selectIcon: {
          color: alpha('#00ffff', 0.7)
        },
        select: {
          color: '#00ffff',
          textShadow: '0 0 5px currentColor'
        },
        menuItem: {
          backgroundColor: alpha('#1a0033', 0.95),
          color: '#00ffff',
          '&:hover': {
            backgroundColor: alpha('#00ffff', 0.15),
            boxShadow: '0px 0px 10px rgba(0, 255, 255, 0.3)'
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
          background: '#030310',
          position: 'relative',
          '&::before': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              linear-gradient(rgba(0, 255, 255, 0.08) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 255, 255, 0.08) 1px, transparent 1px),
              linear-gradient(rgba(255, 0, 255, 0.04) 2px, transparent 2px),
              linear-gradient(90deg, rgba(255, 0, 255, 0.04) 2px, transparent 2px)
            `,
            backgroundSize: '50px 50px, 50px 50px, 100px 100px, 100px 100px',
            backgroundPosition: '0 0, 0 0, 0 0, 0 0',
            animation: 'grid-move 20s linear infinite',
            zIndex: -1,
            pointerEvents: 'none'
          },
          '&::after': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(ellipse at center, transparent 0%, rgba(3, 3, 16, 0.4) 50%, rgba(3, 3, 16, 0.8) 100%)`,
            pointerEvents: 'none',
            zIndex: -1
          },
          scrollbarColor: `${alpha('#00ffff', 0.5)} ${alpha('#1a0033', 0.3)}`,
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            backgroundColor: alpha('#1a0033', 0.3),
            width: '8px',
            height: '8px'
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            backgroundColor: alpha('#00ffff', 0.5),
            border: `1px solid ${alpha('#00ffff', 0.3)}`,
          },
          '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
            backgroundColor: alpha('#00ffff', 0.7),
            boxShadow: '0 0 10px rgba(0, 255, 255, 0.5)'
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
            textShadow: '0 0 10px currentColor, 0 0 20px currentColor',
          },
          '50%': {
            textShadow: '0 0 20px currentColor, 0 0 40px currentColor',
          },
          '100%': {
            textShadow: '0 0 10px currentColor, 0 0 20px currentColor',
          }
        },
        '@keyframes scan-line': {
          '0%': {
            transform: 'translateY(-100%)',
          },
          '100%': {
            transform: 'translateY(100%)',
          }
        },
        '@keyframes grid-move': {
          '0%': {
            backgroundPosition: '0 0, 0 0, 0 0, 0 0',
          },
          '100%': {
            backgroundPosition: '50px 50px, -50px -50px, 100px 100px, -100px -100px',
          }
        }
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
    '0px 0px 10px rgba(0, 255, 255, 0.1)',
    '0px 0px 15px rgba(0, 255, 255, 0.15)',
    '0px 0px 20px rgba(0, 255, 255, 0.2)',
    '0px 0px 25px rgba(0, 255, 255, 0.25)',
    '0px 0px 30px rgba(0, 255, 255, 0.3)',
    '0px 0px 35px rgba(0, 255, 255, 0.35)',
    '0px 0px 40px rgba(0, 255, 255, 0.4)',
    '0px 0px 45px rgba(0, 255, 255, 0.45)',
    '0px 0px 50px rgba(0, 255, 255, 0.5)',
    '0px 0px 55px rgba(255, 0, 255, 0.3)',
    '0px 0px 60px rgba(255, 0, 255, 0.35)',
    '0px 0px 65px rgba(255, 0, 255, 0.4)',
    '0px 0px 70px rgba(255, 0, 255, 0.45)',
    '0px 0px 75px rgba(255, 0, 255, 0.5)',
    '0px 0px 80px rgba(255, 0, 255, 0.55)',
    '0px 0px 85px rgba(255, 0, 255, 0.6)',
    '0px 0px 90px rgba(255, 0, 255, 0.65)',
    '0px 0px 95px rgba(255, 0, 255, 0.7)',
    '0px 0px 100px rgba(255, 0, 255, 0.75)',
    '0px 0px 105px rgba(255, 0, 255, 0.8)',
    '0px 0px 110px rgba(255, 0, 255, 0.85)',
    '0px 0px 115px rgba(255, 0, 255, 0.9)',
    '0px 0px 120px rgba(255, 0, 255, 0.95)',
    '0px 0px 125px rgba(255, 0, 255, 1)'
  ]
});