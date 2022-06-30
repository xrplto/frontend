// import { DarkSpacesTheme } from './schemes/DarkSpacesTheme';
// import { GreenFieldsTheme } from './schemes/GreenFieldsTheme';
// import { GreyGooseTheme } from './schemes/GreyGooseTheme';
// import { NebulaFighterTheme } from './schemes/NebulaFighterTheme';
// import { PureLightTheme } from './schemes/PureLightTheme';
// import { PurpleFlowTheme } from './schemes/PurpleFlowTheme';
import { XrplToDarkTheme } from './schemes/XrplToDarkTheme';
import { XrplToLightTheme } from './schemes/XrplToLightTheme';

const themeMap = {
    // DarkSpacesTheme,
    // GreenFieldsTheme,
    // GreyGooseTheme,
    // NebulaFighterTheme,
    // PureLightTheme,
    // PurpleFlowTheme,
    XrplToDarkTheme,
    XrplToLightTheme,
};

export function themeCreator(dark) {
    let theme;
    if (dark)
        theme = 'XrplToDarkTheme';
    else
        theme = 'XrplToLightTheme';
    return themeMap[theme];
}
