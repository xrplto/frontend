import { useContext, useState, useEffect } from 'react';
import { AppContext } from 'src/AppContext';

const ThemeProviderWrapper = (props) => {
  const [isMounted, setIsMounted] = useState(false);
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (isDark) {
        root.classList.add('dark');
        document.body.style.backgroundColor = '#000000';
        document.body.style.color = '#f5f5f5';
      } else {
        root.classList.remove('dark');
        document.body.style.backgroundColor = '#ffffff';
        document.body.style.color = '#0a0a0a';
      }
    }
  }, [isDark]);

  if (!isMounted) {
    return null;
  }

  return <>{props.children}</>;
};

export default ThemeProviderWrapper;
