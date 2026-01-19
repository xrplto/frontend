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
      <div
        className={cn(
          'min-h-screen flex items-center justify-center',
          isDark ? 'bg-black' : 'bg-white'
        )}
      >
        <div className="mx-auto max-w-xl px-4 text-center">
          {/* Sad Bear */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div
              className={cn(
                'absolute -top-1.5 left-1.5 w-7 h-7 rounded-full',
                isDark ? 'bg-[#4285f4]' : 'bg-blue-400'
              )}
            />
            <div
              className={cn(
                'absolute -top-1.5 right-1.5 w-7 h-7 rounded-full',
                isDark ? 'bg-[#4285f4]' : 'bg-blue-400'
              )}
            />
            <div
              className={cn(
                'absolute top-0.5 left-3 w-3.5 h-3.5 rounded-full',
                isDark ? 'bg-[#3b78e7]' : 'bg-blue-500'
              )}
            />
            <div
              className={cn(
                'absolute top-0.5 right-3 w-3.5 h-3.5 rounded-full',
                isDark ? 'bg-[#3b78e7]' : 'bg-blue-500'
              )}
            />
            <div
              className={cn(
                'absolute top-4 left-1/2 -translate-x-1/2 w-20 h-20 rounded-full',
                isDark ? 'bg-[#4285f4]' : 'bg-blue-400'
              )}
            >
              <div className="absolute top-6 left-4 w-3 h-2.5 rounded-full bg-[#0a0a0a] rotate-[-10deg]" />
              <div className="absolute top-6 right-4 w-3 h-2.5 rounded-full bg-[#0a0a0a] rotate-[10deg]" />
              <div
                className={cn(
                  'absolute bottom-4 left-1/2 -translate-x-1/2 w-7 h-5 rounded-full',
                  isDark ? 'bg-[#5a9fff]' : 'bg-blue-300'
                )}
              >
                <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-2.5 h-2 rounded-full bg-[#0a0a0a]" />
              </div>
              <div
                className={cn(
                  'absolute bottom-2 left-1/2 -translate-x-1/2 w-4 h-2 rounded-t-full border-t-2 border-l-2 border-r-2',
                  isDark ? 'border-[#0a0a0a]' : 'border-blue-600'
                )}
              />
            </div>
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-20 h-20 flex flex-col justify-start gap-[3px] pointer-events-none overflow-hidden rounded-full">
              {[...Array(14)].map((_, i) => (
                <div
                  key={i}
                  className={cn('h-[3px] w-full', isDark ? 'bg-[#0a0a0a]/40' : 'bg-white/40')}
                />
              ))}
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
