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
        "flex items-center gap-2.5 rounded-lg border px-3 py-1.5 h-8 w-[240px] cursor-pointer transition-all duration-150",
        isDark
          ? "bg-white/[0.04] border-white/10 hover:border-white/20"
          : "bg-gray-50 border-gray-200 hover:border-gray-300"
      )}
      onClick={openModal}
      {...props}
    >
      <Search
        size={15}
        className={isDark ? "text-white/40" : "text-gray-400"}
      />
      <span className={cn(
        "flex-1 text-[13px] font-normal",
        isDark ? "text-white/40" : "text-gray-400"
      )}>
        Search XRPL Tokens
      </span>
      <div className={cn(
        "flex items-center justify-center w-5 h-5 rounded text-[11px] font-normal",
        isDark
          ? "bg-white/[0.06] text-white/30"
          : "bg-gray-200/70 text-gray-400"
      )}>
        /
      </div>
    </div>
  );
};

export default NavSearchBar;
