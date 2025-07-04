import { XrplToDarkTheme } from './XrplToDarkTheme';
import { XrplToLightTheme } from './XrplToLightTheme';

const themeMap = {
  XrplToDarkTheme,
  XrplToLightTheme
};

export function themeCreator(dark) {
  if (dark) return XrplToDarkTheme;
  else return XrplToLightTheme;
}
