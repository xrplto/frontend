import * as React from 'react';
import { useState, useContext, useEffect } from 'react';
import { Search } from 'lucide-react';
import { cn } from 'src/utils/cn';
import { AppContext } from 'src/AppContext';

const NavSearchBar = ({
  id,
  placeholder,
  fullSearch,
  setFullSearch,
  onOpenSearchModal,
  ...props
}) => {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  useEffect(() => {
    const handleKeyPress = (event) => {
      // Don't trigger if user is typing in an input field
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
      }

      if (event.key === '/' && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        onOpenSearchModal();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [onOpenSearchModal]);

  const openModal = (event) => {
    event.stopPropagation();
    onOpenSearchModal();
  };

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border-[1.5px] px-4 py-2 h-9 w-[280px] cursor-pointer",
        isDark
          ? "bg-white/[0.02] border-white/20 hover:bg-primary/5 hover:border-primary/30"
          : "bg-black/[0.02] border-gray-200 hover:bg-primary/5 hover:border-primary/30"
      )}
      onClick={openModal}
      {...props}
    >
      <Search
        size={18}
        className={isDark ? "text-white/60" : "text-gray-500/60"}
      />
      <span className={cn(
        "flex-1 text-sm font-normal",
        isDark ? "text-white/70" : "text-gray-500/70"
      )}>
        {placeholder || 'Search'}
      </span>
      <div className={cn(
        "flex items-center justify-center px-2 h-[22px] rounded-md border-[1.5px] text-xs font-normal font-mono",
        isDark
          ? "bg-white/[0.08] border-white/15 text-white/60"
          : "bg-gray-100 border-gray-200 text-gray-500/60"
      )}>
        /
      </div>
    </div>
  );
};

export default NavSearchBar;
