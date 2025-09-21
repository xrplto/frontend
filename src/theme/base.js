import { XrplToDarkTheme } from './XrplToDarkTheme';
import { XrplToLightTheme } from './XrplToLightTheme';
import { SyncWaveTheme } from './SyncWaveTheme';
import { rippleBlueTheme } from './rippleBlueTheme';
import { LiquidLedgerTheme } from './LiquidLedgerTheme';
import { BirdTheme } from './BirdTheme';

const themeMap = {
  XrplToDarkTheme,
  XrplToLightTheme,
  SyncWaveTheme,
  RippleBlueTheme: rippleBlueTheme,
  LiquidLedgerTheme,
  BirdTheme
};

export function themeCreator(themeName) {
  // Handle legacy boolean parameter for backward compatibility
  if (typeof themeName === 'boolean') {
    return themeName ? XrplToDarkTheme : XrplToLightTheme;
  }

  // Return the requested theme or default to light theme
  return themeMap[themeName] || XrplToLightTheme;
}
