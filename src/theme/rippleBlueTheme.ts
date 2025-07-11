import { createTheme, responsiveFontSizes, ThemeOptions, alpha } from '@mui/material/styles';

const baseTheme: ThemeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#0080ff',
      light: '#4da3ff',
      dark: '#0066cc',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#00c5d7',
      light: '#4dd7e5',
      dark: '#0099a8',
      contrastText: '#ffffff',
    },
    background: {
      default: '#eaf6ff',
      paper: '#ffffff',
    },
    text: {
      primary: '#043b6f',
      secondary: '#085a9c',
    },
    error: {
      main: '#ff4757',
      light: '#ff6b7a',
      dark: '#d63031',
    },
    warning: {
      main: '#ffa502',
      light: '#ffb84d',
      dark: '#ff8c00',
    },
    success: {
      main: '#00d2a0',
      light: '#4de6c0',
      dark: '#00a880',
    },
    info: {
      main: '#0080ff',
    },
    divider: 'rgba(0,128,255,0.08)',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, letterSpacing: '-0.02em' },
    h2: { fontWeight: 700, letterSpacing: '-0.01em' },
    h3: { fontWeight: 600, letterSpacing: '-0.01em' },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 500, letterSpacing: '0.01em' },
    subtitle2: { fontWeight: 500, letterSpacing: '0.01em' },
    body1: { letterSpacing: '0.005em' },
    body2: { letterSpacing: '0.005em' },
    button: { fontWeight: 600, textTransform: 'none', letterSpacing: '0.02em' },
  },
  shape: {
    borderRadius: 14,
  },
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
    '0 25px 50px 0 rgba(0,128,255,0.54)',
  ],
  components: {
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '0 !important',
          padding: '0 !important'
        }
      }
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
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
            pointerEvents: 'none',
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
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none',
            },
          },
          '@keyframes rippleWater': {
            '0%': {
              transform: 'translate(-50%, -50%) scale(0.4)',
              opacity: 0,
            },
            '20%': {
              opacity: 0.6,
            },
            '100%': {
              transform: 'translate(-50%, -50%) scale(5)',
              opacity: 0,
            },
          },
          '@keyframes shimmer': {
            '0%': { transform: 'translateX(-100%)' },
            '100%': { transform: 'translateX(100%)' },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(6px)',
          backgroundColor: alpha('#ffffff', 0.8),
          border: '1px solid rgba(0,128,255,0.12)',
          backgroundImage: 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            backdropFilter: 'blur(8px)',
            borderColor: alpha('#0080ff', 0.2),
          },
        },
        elevation1: { boxShadow: '0 2px 8px 0 rgba(0,128,255,0.08)' },
        elevation2: { boxShadow: '0 4px 12px 0 rgba(0,128,255,0.12)' },
        elevation3: { boxShadow: '0 6px 16px 0 rgba(0,128,255,0.16)' },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          padding: '8px 20px',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        },
        containedPrimary: {
          background: 'linear-gradient(180deg, #0080ff 0%, #0066cc 100%)',
          boxShadow: '0 4px 8px 0 rgba(0,128,255,0.25)',
          '&:hover': {
            background: 'linear-gradient(180deg, #1a8fff 0%, #0080ff 100%)',
            boxShadow: '0 6px 12px 0 rgba(0,128,255,0.35)',
            transform: 'translateY(-1px)',
          },
          '&:active': {
            transform: 'translateY(0)',
            boxShadow: '0 2px 4px 0 rgba(0,128,255,0.25)',
          },
        },
        containedSecondary: {
          background: 'linear-gradient(180deg, #00c5d7 0%, #0099a8 100%)',
          boxShadow: '0 4px 8px 0 rgba(0,197,215,0.25)',
          '&:hover': {
            background: 'linear-gradient(180deg, #1ad0e0 0%, #00c5d7 100%)',
            boxShadow: '0 6px 12px 0 rgba(0,197,215,0.35)',
            transform: 'translateY(-1px)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
            transform: 'translateY(-1px)',
          },
        },
        text: {
          '&:hover': {
            backgroundColor: alpha('#0080ff', 0.08),
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            '&:hover': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: alpha('#0080ff', 0.4),
              },
            },
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: 2,
                boxShadow: '0 0 0 4px rgba(0,128,255,0.1)',
              },
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(10px)',
          backgroundColor: alpha('#ffffff', 0.85),
          border: '1px solid rgba(0,128,255,0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 8px 24px 0 rgba(0,128,255,0.15)',
            borderColor: alpha('#0080ff', 0.15),
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'scale(1.05)',
          },
        },
        filled: {
          backdropFilter: 'blur(4px)',
          backgroundColor: alpha('#0080ff', 0.1),
          '&:hover': {
            backgroundColor: alpha('#0080ff', 0.15),
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'scale(1.1)',
            backgroundColor: alpha('#0080ff', 0.08),
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          '& .MuiSwitch-track': {
            backgroundColor: alpha('#085a9c', 0.3),
          },
          '& .MuiSwitch-thumb': {
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 4px rgba(0,128,255,0.2)',
          },
        },
        colorPrimary: {
          '&.Mui-checked': {
            '& .MuiSwitch-thumb': {
              background: 'linear-gradient(45deg, #0080ff 30%, #00c5d7 90%)',
            },
          },
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: alpha('#043b6f', 0.95),
          backdropFilter: 'blur(8px)',
          borderRadius: 10,
          fontSize: '0.875rem',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(12px)',
          backgroundColor: alpha('#ffffff', 0.9),
          borderBottom: '1px solid rgba(0,128,255,0.08)',
          boxShadow: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backdropFilter: 'blur(12px)',
          backgroundColor: alpha('#ffffff', 0.95),
          borderRight: '1px solid rgba(0,128,255,0.08)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backdropFilter: 'blur(12px)',
          backgroundColor: alpha('#ffffff', 0.95),
          boxShadow: '0 24px 48px 0 rgba(0,128,255,0.2)',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          backdropFilter: 'blur(8px)',
        },
        standardInfo: {
          backgroundColor: alpha('#0080ff', 0.1),
          color: '#043b6f',
        },
        standardSuccess: {
          backgroundColor: alpha('#00d2a0', 0.1),
          color: '#00735a',
        },
        standardWarning: {
          backgroundColor: alpha('#ffa502', 0.1),
          color: '#995f00',
        },
        standardError: {
          backgroundColor: alpha('#ff4757', 0.1),
          color: '#a62834',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          backgroundColor: alpha('#0080ff', 0.1),
        },
        bar: {
          borderRadius: 14,
          background: 'linear-gradient(90deg, #0080ff 0%, #00c5d7 100%)',
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: alpha('#0080ff', 0.08),
          '&::after': {
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
            animation: 'shimmer 1.5s infinite',
          },
        },
      },
    },
  },
};

const darkTheme: ThemeOptions = {
  ...baseTheme,
  palette: {
    mode: 'dark',
    primary: {
      main: '#1a8fff',
      light: '#4da3ff',
      dark: '#0066cc',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#00d9ed',
      light: '#4de6f2',
      dark: '#00a8bd',
      contrastText: '#ffffff',
    },
    background: {
      default: '#001429',
      paper: '#002244',
    },
    text: {
      primary: '#b3d9ff',
      secondary: '#66b3ff',
    },
    error: {
      main: '#ff6b7a',
      light: '#ff8a95',
      dark: '#ff4757',
    },
    warning: {
      main: '#ffb84d',
      light: '#ffc670',
      dark: '#ffa502',
    },
    success: {
      main: '#4de6c0',
      light: '#70ecd0',
      dark: '#00d2a0',
    },
    info: {
      main: '#1a8fff',
    },
    divider: 'rgba(26,143,255,0.12)',
  },
  components: {
    ...baseTheme.components,
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: '0 !important',
          padding: '0 !important'
        }
      }
    },
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          position: 'relative',
          scrollBehavior: 'smooth',
          '&::before': {
            content: '""',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(circle at 50% 20%, #002952 0%, #001429 70%)',
            zIndex: -3,
            pointerEvents: 'none',
          },
          '&::after': {
            content: '""',
            position: 'fixed',
            top: '50%',
            left: '50%',
            width: '100vmax',
            height: '100vmax',
            background: 'radial-gradient(circle, rgba(26,143,255,0.2) 0%, transparent 50%)',
            transform: 'translate(-50%, -50%) scale(0.4)',
            opacity: 0,
            zIndex: -2,
            pointerEvents: 'none',
            animation: 'rippleWater 8s linear infinite',
            '@media (prefers-reduced-motion: reduce)': {
              animation: 'none',
            },
          },
          '@keyframes rippleWater': {
            '0%': {
              transform: 'translate(-50%, -50%) scale(0.4)',
              opacity: 0,
            },
            '20%': {
              opacity: 0.4,
            },
            '100%': {
              transform: 'translate(-50%, -50%) scale(5)',
              opacity: 0,
            },
          },
          '@keyframes shimmer': {
            '0%': { transform: 'translateX(-100%)' },
            '100%': { transform: 'translateX(100%)' },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(6px)',
          backgroundColor: alpha('#002244', 0.8),
          border: '1px solid rgba(26,143,255,0.12)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(10px)',
          backgroundColor: alpha('#002244', 0.85),
          border: '1px solid rgba(26,143,255,0.08)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(12px)',
          backgroundColor: alpha('#001429', 0.9),
          borderBottom: '1px solid rgba(26,143,255,0.08)',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backdropFilter: 'blur(12px)',
          backgroundColor: alpha('#001429', 0.95),
          borderRight: '1px solid rgba(26,143,255,0.08)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backdropFilter: 'blur(12px)',
          backgroundColor: alpha('#002244', 0.95),
          boxShadow: '0 24px 48px 0 rgba(0,0,0,0.4)',
        },
      },
    },
  },
};

export const rippleBlueTheme = responsiveFontSizes(createTheme(baseTheme));

export const createRippleBlueTheme = ({ dark = false }: { dark?: boolean } = {}) => 
  responsiveFontSizes(createTheme(dark ? darkTheme : baseTheme));