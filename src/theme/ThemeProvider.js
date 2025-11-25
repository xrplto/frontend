import { useContext, useState, useEffect } from 'react';
import { AppContext } from 'src/AppContext';

// Simple theme provider wrapper - MUI ThemeProvider removed
// All styling now uses Tailwind CSS with isDark pattern from AppContext
const ThemeProviderWrapper = (props) => {
  const [isMounted, setIsMounted] = useState(false);
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    // Update document class for global dark mode support
    if (typeof document !== 'undefined') {
      if (isDark) {
        document.documentElement.classList.add('dark');
        document.body.style.backgroundColor = '#000000';
        document.body.style.color = '#ffffff';
      } else {
        document.documentElement.classList.remove('dark');
        document.body.style.backgroundColor = '#ffffff';
        document.body.style.color = '#000000';
      }
    }
  }, [isDark]);

  if (!isMounted) {
    return null;
  }

  return <>{props.children}</>;
};

export default ThemeProviderWrapper;
