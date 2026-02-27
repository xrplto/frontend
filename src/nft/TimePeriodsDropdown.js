import { useState, useContext } from 'react';
import { ThemeContext } from 'src/context/AppContext';
import { cn } from 'src/utils/cn';
import { ChevronDown } from 'lucide-react';

export default function TimePeriods() {
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const periods = [7, 14, 30, 60, 90, 100, 200];

  return (
    <div className="relative">
      <button
        className={cn(
          'flex items-center gap-2 rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-normal',
          'border-gray-300 hover:bg-gray-100 dark:border-white/15 dark:hover:bg-primary/5'
        )}
        onClick={handleClick}
      >
        All time
        <ChevronDown size={16} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={handleClose} />
          <div
            className={cn(
              'absolute right-0 top-full mt-2 z-50 min-w-[160px] rounded-xl border-[1.5px] p-1',
              'border-gray-200 bg-white dark:border-white/10 dark:bg-black'
            )}
          >
            {periods.map((period) => (
              <button
                key={period}
                onClick={handleClose}
                className={cn(
                  'w-full rounded-lg px-3 py-2 text-left text-[13px] font-normal',
                  'hover:bg-gray-100 dark:hover:bg-white/5'
                )}
              >
                {period > 90 ? (period > 100 ? 'All time' : 'Last Year') : `Last ${period} days`}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
