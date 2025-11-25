import Head from 'next/head';
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';

function Status404() {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  return (
    <>
      <Head>
        <title>404 | XRPL.to</title>
        <meta name="description" content="Page not found" />
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className={cn(
        "min-h-screen flex items-center justify-center",
        isDark ? "bg-black" : "bg-white"
      )}>
        <div className="mx-auto max-w-xl px-4 text-center">
          <h1 className={cn(
            "text-6xl sm:text-[6rem] font-normal leading-none mb-4",
            isDark ? "text-white/20" : "text-black/20"
          )}>
            404
          </h1>

          <h2 className={cn(
            "text-[1.1rem] sm:text-[1.25rem] font-normal mb-2",
            isDark ? "text-white" : "text-gray-900"
          )}>
            Page not found
          </h2>

          <p className={cn(
            "text-[15px] mb-8",
            isDark ? "text-white/60" : "text-gray-600"
          )}>
            The page you're looking for doesn't exist
          </p>

          <a
            href="/"
            className={cn(
              "inline-block px-6 py-3 rounded-xl border-[1.5px] text-[0.95rem] font-normal transition-all",
              "text-primary",
              isDark
                ? "border-white/20 hover:border-primary hover:bg-primary/5"
                : "border-gray-200 hover:border-primary hover:bg-primary/5"
            )}
          >
            Return home
          </a>
        </div>
      </div>
    </>
  );
}

export default Status404;
