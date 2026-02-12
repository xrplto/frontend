import React, { useContext, useState } from 'react';
import { Palette, Sun, Moon } from 'lucide-react';
import { cn } from 'src/utils/cn';
import { ThemeContext } from 'src/context/AppContext';

const themes = [
  {
    id: 'XrplToLightTheme',
    name: 'Light',
    icon: <Sun size={16} />,
    color: '#ffffff'
  },
  {
    id: 'XrplToDarkTheme',
    name: 'Dark',
    icon: <Moon size={16} />,
    color: '#000000'
  }
];

export default function ThemeSwitcher() {
  const { themeName, setTheme } = useContext(ThemeContext);
  const [anchorEl, setAnchorEl] = useState(null);
  const isDark = themeName === 'XrplToDarkTheme';

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleThemeChange = (themeId) => {
    setTheme(themeId);
    handleClose();
  };

  const currentTheme = themes.find((t) => t.id === themeName) || themes[0];

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className={cn(
          'rounded-md p-1 min-w-8 w-8 h-8 border-none flex items-center justify-center',
          isDark ? 'bg-primary/[0.08] hover:bg-primary/20' : 'bg-primary/[0.08] hover:bg-primary/20'
        )}
      >
        <Palette size={16} />
      </button>

      {anchorEl && (
        <>
          <div className="fixed inset-0 z-40" onClick={handleClose} />
          <div
            className={cn(
              'absolute mt-1 min-w-[160px] rounded-2xl border z-50 right-0',
              isDark
                ? 'bg-black/90 backdrop-blur-2xl border-[#3f96fe]/10 shadow-[0_8px_40px_rgba(0,0,0,0.6)]'
                : 'bg-white/98 backdrop-blur-2xl border-gray-200 shadow-[0_8px_32px_rgba(0,0,0,0.08)]'
            )}
          >
            <div className="p-1">
              {themes.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => handleThemeChange(theme.id)}
                  className={cn(
                    'w-full rounded-lg px-2.5 py-2 min-h-9 flex items-center gap-2 border-none cursor-pointer my-0.5 text-left',
                    themeName === theme.id
                      ? isDark
                        ? 'bg-primary/[0.08] hover:bg-primary/20'
                        : 'bg-primary/[0.08] hover:bg-primary/20'
                      : isDark
                        ? 'bg-transparent hover:bg-white/[0.06]'
                        : 'bg-transparent hover:bg-gray-100'
                  )}
                >
                  <div
                    className="flex items-center justify-center w-6 h-6 rounded-md border"
                    style={{
                      backgroundColor: theme.color,
                      borderColor: theme.id === 'XrplToLightTheme' ? '#e0e0e0' : 'transparent'
                    }}
                  >
                    <Palette size={16} className="text-white" />
                  </div>
                  <span className="text-sm">{theme.name}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
