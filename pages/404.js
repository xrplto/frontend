import Head from 'next/head';
import { useContext } from 'react';
import { AppContext } from 'src/context/AppContext';
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
      <div
        className={cn(
          'min-h-screen flex items-center justify-center',
          isDark ? 'bg-black' : 'bg-white'
        )}
      >
        <div className="mx-auto max-w-xl px-4 text-center">
          {/* Sad Bear */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className={cn('absolute -top-1 left-0 w-7 h-7 rounded-full', isDark ? 'bg-white/15' : 'bg-gray-200')}>
              <div className={cn('absolute top-1.5 left-1.5 w-4 h-4 rounded-full', isDark ? 'bg-white/10' : 'bg-gray-100')} />
            </div>
            <div className={cn('absolute -top-1 right-0 w-7 h-7 rounded-full', isDark ? 'bg-white/15' : 'bg-gray-200')}>
              <div className={cn('absolute top-1.5 right-1.5 w-4 h-4 rounded-full', isDark ? 'bg-white/10' : 'bg-gray-100')} />
            </div>
            <div className={cn('absolute top-3 left-1/2 -translate-x-1/2 w-16 h-14 rounded-full', isDark ? 'bg-white/15' : 'bg-gray-200')}>
              <div className="absolute inset-0 rounded-full overflow-hidden">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={cn('h-[2px] w-full', isDark ? 'bg-white/15' : 'bg-gray-300/50')} style={{ marginTop: i * 4 + 2, transform: `translateX(${i % 2 === 0 ? '1px' : '-1px'})` }} />
                ))}
              </div>
              <div className="absolute top-4 left-3 w-4 h-4 flex items-center justify-center">
                <div className={cn('absolute w-3.5 h-[2px] rotate-45', isDark ? 'bg-white/40' : 'bg-gray-400')} />
                <div className={cn('absolute w-3.5 h-[2px] -rotate-45', isDark ? 'bg-white/40' : 'bg-gray-400')} />
              </div>
              <div className="absolute top-4 right-3 w-4 h-4 flex items-center justify-center">
                <div className={cn('absolute w-3.5 h-[2px] rotate-45', isDark ? 'bg-white/40' : 'bg-gray-400')} />
                <div className={cn('absolute w-3.5 h-[2px] -rotate-45', isDark ? 'bg-white/40' : 'bg-gray-400')} />
              </div>
              <div className={cn('absolute bottom-2 left-1/2 -translate-x-1/2 w-8 h-5 rounded-full', isDark ? 'bg-white/10' : 'bg-gray-100')}>
                <div className={cn('absolute top-1 left-1/2 -translate-x-1/2 w-3 h-2.5 rounded-full', isDark ? 'bg-white/25' : 'bg-gray-300')} />
              </div>
            </div>
          </div>

          <p
            className={cn(
              'text-sm font-medium tracking-widest mb-2',
              isDark ? 'text-white/80' : 'text-gray-600'
            )}
          >
            PAGE NOT FOUND
          </p>

          <p className={cn('text-xs mb-8', isDark ? 'text-white/30' : 'text-gray-400')}>
            The page you're looking for doesn't exist
          </p>

          <a
            href="/"
            className={cn(
              'inline-block px-6 py-3 rounded-xl border-[1.5px] text-[0.95rem] font-normal transition-all',
              'text-primary',
              isDark
                ? 'border-white/20 hover:border-primary hover:bg-primary/5'
                : 'border-gray-200 hover:border-primary hover:bg-primary/5'
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
