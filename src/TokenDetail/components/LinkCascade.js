import { useContext } from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from 'src/utils/cn';
import { AppContext } from 'src/AppContext';

export default function LinkCascade({ token, tabID, tabLabels }) {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  return (
    <div className={cn("flex items-center gap-2 mb-2 py-1")}>
      <Link
        href="/"
        className={cn(
          "text-[13px] font-normal text-primary no-underline opacity-80 hover:opacity-100 transition-opacity"
        )}
      >
        Tokens
      </Link>
      <ChevronRight size={16} className="opacity-40" />

      {tabID > 0 ? (
        <>
          <Link
            href={`/token/${token.slug}`}
            className={cn(
              "text-[13px] font-normal text-primary no-underline opacity-80 hover:opacity-100 transition-opacity"
            )}
          >
            {token.name}
          </Link>
          <ChevronRight size={16} className="opacity-40" />
          <span
            className={cn(
              "text-[13px] font-normal opacity-70",
              isDark ? "text-white" : "text-gray-900"
            )}
          >
            {tabLabels[tabID]}
          </span>
        </>
      ) : (
        <span
          className={cn(
            "text-[13px] font-normal opacity-90",
            isDark ? "text-white" : "text-gray-900"
          )}
        >
          {token.name}
        </span>
      )}
    </div>
  );
}
