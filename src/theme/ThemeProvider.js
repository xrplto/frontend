import { useContext, useEffect } from 'react';
import { ThemeContext } from 'src/context/AppContext';
import { themeCreator } from './base';

const ThemeProviderWrapper = (props) => {
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      const theme = themeCreator(themeName);
      
      if (isDark) {
        root.classList.add('dark');
        root.classList.remove('light');
        document.body.style.backgroundColor = theme.palette.background.default;
        document.body.style.backgroundImage = 'none';
        document.body.style.color = theme.palette.text.primary;
      } else {
        root.classList.remove('dark');
        root.classList.add('light');
        document.body.style.backgroundColor = theme.palette.background.default;
        document.body.style.backgroundImage = 'radial-gradient(circle at 50% -20%, rgba(20, 125, 254, 0.05), transparent 80%)';
        document.body.style.color = theme.palette.text.primary;
      }
      document.body.style.backgroundAttachment = 'fixed';
    }
  }, [isDark, themeName]);

  return <>{props.children}</>;
};

export default ThemeProviderWrapper;
