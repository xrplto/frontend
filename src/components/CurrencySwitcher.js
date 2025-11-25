import React, { useState, useEffect, useContext } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from 'src/utils/cn';
import { AppContext } from 'src/AppContext';

// Constants
const currencyConfig = {
  availableFiatCurrencies: ['XRP', 'USD', 'EUR', 'JPY', 'CNH'],
  activeFiatCurrency: 'XRP'
};

const currencyIcons = {
  USD: '💵',
  EUR: '💶',
  JPY: '💴',
  CNH: '🈷️',
  XRP: '✕'
};

export default function CurrencySwitcher() {
  const { activeFiatCurrency, toggleFiatCurrency, themeName } = useContext(AppContext);
  const [activeCurrency, setActiveCurrency] = useState(activeFiatCurrency);
  const { availableFiatCurrencies } = currencyConfig;
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const isDark = themeName === 'XrplToDarkTheme';

  useEffect(() => {
    const defaultIndex = availableFiatCurrencies?.indexOf(activeFiatCurrency);
    defaultIndex > -1
      ? setActiveCurrency(availableFiatCurrencies[defaultIndex])
      : setActiveCurrency('XRP');
  }, [activeFiatCurrency]);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleChange = (newValue) => {
    toggleFiatCurrency(newValue);
    setActiveCurrency(newValue);
    handleClose();
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        aria-controls={open ? 'currency-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        aria-label="Select currency"
        className={cn(
          "flex items-center gap-1 px-2 py-1.5 rounded-md cursor-pointer border-[1.5px] min-w-[60px] h-8 text-xs font-normal",
          isDark
            ? "bg-white/[0.04] border-white/[0.08] text-white hover:bg-white/[0.06] hover:border-white/[0.12]"
            : "bg-black/[0.02] border-black/[0.08] text-gray-900 hover:bg-black/[0.04] hover:border-black/[0.12]"
        )}
      >
        <span className="text-sm">{currencyIcons[activeCurrency]}</span>
        <span className="font-medium tracking-wide">{activeCurrency}</span>
        <ChevronDown
          size={14}
          className={cn(
            "opacity-70 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {anchorEl && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={handleClose}
          />
          <div className={cn(
            "absolute mt-1 min-w-[120px] max-w-[140px] rounded-xl border-[1.5px] z-50",
            isDark
              ? "bg-black/95 border-white/[0.12] backdrop-blur-xl"
              : "bg-white/95 border-gray-200 backdrop-blur-xl"
          )}>
            <div className="p-1">
              {availableFiatCurrencies.map((option) => (
                <button
                  key={option}
                  onClick={() => handleChange(option)}
                  className={cn(
                    "w-full rounded-lg px-2.5 py-2 min-h-9 flex items-center justify-between gap-2 border-none cursor-pointer my-0.5",
                    option === activeCurrency
                      ? isDark
                        ? "bg-white/[0.08] hover:bg-white/[0.1]"
                        : "bg-black/[0.05] hover:bg-black/[0.06]"
                      : isDark
                      ? "bg-transparent hover:bg-white/[0.06]"
                      : "bg-transparent hover:bg-black/[0.04]"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm flex items-center">{currencyIcons[option]}</span>
                    <span className={cn(
                      "text-xs",
                      option === activeCurrency ? "font-semibold" : "font-normal"
                    )}>
                      {option}
                    </span>
                  </div>
                  {option === activeCurrency && (
                    <Check size={14} className="opacity-70" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
