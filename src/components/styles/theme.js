export const breakpoints = {
  xs: 370,
  sm: 576,
  md: 852,
  lg: 968,
  xl: 1080,
  xxl: 1200
};

const mediaQueries = {
  xs: ``,
  sm: `@media screen and (min-width: ${breakpoints.sm}px)`,
  md: `@media screen and (min-width: ${breakpoints.md}px)`,
  lg: `@media screen and (min-width: ${breakpoints.lg}px)`,
  xl: `@media screen and (min-width: ${breakpoints.xl}px)`,
  xxl: `@media screen and (min-width: ${breakpoints.xxl}px)`
};

const baseColors = {
  white: 'white',
  failure: '#ED4B9E',
  failure33: '#ED4B9E33',
  primary: '#1FC7D4',
  primary0f: '#1FC7D40f',
  primary3D: '#1FC7D43D',
  primaryBright: '#53DEE9',
  primaryDark: '#0098A1',
  success: '#31D0AA',
  success19: '#31D0AA19',
  warning: '#FFB237',
  warning2D: '#ED4B9E2D',
  warning33: '#ED4B9E33'
};

const additionalColors = {
  binance: '#F0B90B',
  overlay: '#452a7a',
  gold: '#FFC700',
  silver: '#B2B2B2',
  bronze: '#E7974D',
  yellow: '#D67E0A'
};
const shadows = {
  level1: '0px 2px 12px -8px rgba(25, 19, 38, 0.1), 0px 1px 1px rgba(25, 19, 38, 0.05)',
  active: '0px 0px 0px 1px #0098A1, 0px 0px 4px 8px rgba(31, 199, 212, 0.4)',
  success: '0px 0px 0px 1px #31D0AA, 0px 0px 0px 4px rgba(49, 208, 170, 0.2)',
  warning: '0px 0px 0px 1px #D67E0A, 0px 0px 0px 4px rgba(214, 126, 10, 0.2)',
  danger: '0px 0px 0px 1px #ED4B9E, 0px 0px 0px 4px rgba(237, 75, 158, 0.2)',
  focus: '0px 0px 0px 1px #7645D9, 0px 0px 0px 4px rgba(118, 69, 217, 0.6)',
  inset: 'inset 0px 2px 2px -1px rgba(74, 74, 104, 0.1)',
  tooltip: '0px 0px 2px rgba(0, 0, 0, 0.2), 0px 4px 12px -8px rgba(14, 14, 44, 0.1)'
};

export const lightColors = {
  ...baseColors,
  ...additionalColors,
  secondary: '#7645D9',
  secondary80: '#7645D980',
  background: '#FAF9FA',
  backgroundDisabled: '#E9EAEB',
  backgroundAlt: '#FFFFFF',
  backgroundAlt2: 'rgba(255, 255, 255, 0.7)',
  cardBorder: '#E7E3EB',
  contrast: '#191326',
  dropdown: '#F6F6F6',
  dropdownDeep: '#EEEEEE',
  invertedContrast: '#FFFFFF',
  input: '#eeeaf4',
  inputSecondary: '#d7caec',
  tertiary: '#EFF4F5',
  text: '#280D5F',
  text99: '#280D5F99',
  textDisabled: '#BDC2C4',
  textSubtle: '#7A6EAA',
  disabled: '#E9EAEB',
  gradientPrimary: 'linear-gradient(228.54deg, #1FC7D4 -13.69%, #7645D9 91.33%)',
  gradientBubblegum: 'linear-gradient(139.73deg, #E5FDFF 0%, #F3EFFF 100%)',
  gradientInverseBubblegum: 'linear-gradient(139.73deg, #F3EFFF 0%, #E5FDFF 100%)',
  gradientCardHeader: 'linear-gradient(111.68deg, #F2ECF2 0%, #E8F2F6 100%)',
  gradientBlue: 'linear-gradient(180deg, #A7E8F1 0%, #94E1F2 100%)',
  gradientViolet: 'linear-gradient(180deg, #E2C9FB 0%, #CDB8FA 100%)',
  gradientVioletAlt: 'linear-gradient(180deg, #CBD7EF 0%, #9A9FD0 100%)',
  gradientGold: 'linear-gradient(180deg, #FFD800 0%, #FDAB32 100%)',
  gradientBold: 'linear-gradient(#53DEE9, #7645D9)'
};

export const darkColors = {
  ...baseColors,
  ...additionalColors,
  secondary: '#A881FC',
  secondary80: '#A881FC80',
  background: '#08060B',
  backgroundDisabled: '#3c3742',
  backgroundAlt: '#27262c',
  backgroundAlt2: 'rgba(39, 38, 44, 0.7)',
  cardBorder: '#383241',
  contrast: '#FFFFFF',
  dropdown: '#1E1D20',
  dropdownDeep: '#100C18',
  invertedContrast: '#191326',
  input: '#372F47',
  inputSecondary: '#262130',
  primaryDark: '#0098A1',
  tertiary: '#353547',
  text: '#F4EEFF',
  text99: '#F4EEFF99',
  textDisabled: '#666171',
  textSubtle: '#B8ADD2',
  disabled: '#524B63',
  gradientPrimary: 'linear-gradient(228.54deg, #1FC7D4 -13.69%, #9A6AFF 91.33%)',
  gradientBubblegum: 'linear-gradient(139.73deg, #313D5C 0%, #3D2A54 100%)',
  gradientInverseBubblegum: 'linear-gradient(139.73deg, #3D2A54 0%, #313D5C 100%)',
  gradientCardHeader: 'linear-gradient(166.77deg, #3B4155 0%, #3A3045 100%)',
  gradientBlue: 'linear-gradient(180deg, #00707F 0%, #19778C 100%)',
  gradientViolet: 'linear-gradient(180deg, #6C4999 0%, #6D4DB2 100%)',
  gradientVioletAlt: 'linear-gradient(180deg, #434575 0%, #66578D 100%)',
  gradientGold: 'linear-gradient(180deg, #FFD800 0%, #FDAB32 100%)',
  gradientBold: 'linear-gradient(#53DEE9, #9A6AFF)'
};

export const theme = (darkMode) => {
  const colors = darkMode ? darkColors : lightColors;
  return {
    siteWidth: 1200,
    breakpoints: Object.values(breakpoints).map((bp) => `${bp}px`),
    mediaQueries,
    // spacing: vars.space,
    // radii: vars.radii,
    zIndices: { ribbon: 9, dropdown: 10, modal: 100 },
    modal: {
      background: colors.backgroundAlt
    },
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: colors.primary,
        contrastText: colors.invertedContrast
      },
      secondary: {
        main: colors.secondary,
        contrastText: colors.invertedContrast
      },
      error: {
        main: colors.failure,
        contrastText: colors.invertedContrast
      },
      warning: {
        main: colors.warning,
        contrastText: colors.invertedContrast
      },
      info: {
        main: colors.primary, // Using primary for info as it's a general informational color
        contrastText: colors.invertedContrast
      },
      success: {
        main: colors.success,
        contrastText: colors.invertedContrast
      },
      background: {
        default: colors.background,
        paper: colors.backgroundAlt
      },
      text: {
        primary: colors.text,
        secondary: colors.textSubtle,
        disabled: colors.textDisabled
      },
      divider: colors.cardBorder
    },
    colors,
    shadows
  };
};
