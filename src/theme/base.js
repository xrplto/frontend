import { XrplToDarkTheme } from './XrplToDarkTheme';
import { XrplToLightTheme } from './XrplToLightTheme';

const themeMap = {
  XrplToDarkTheme,
  XrplToLightTheme
};

export function themeCreator(themeName) {
  // Simple theme selection - expects 'XrplToDarkTheme' or 'XrplToLightTheme'
  return themeMap[themeName] || XrplToLightTheme;
}
