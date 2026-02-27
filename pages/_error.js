import Head from 'next/head';
import { useContext } from 'react';
import { ThemeContext } from 'src/context/AppContext';
import { cn } from 'src/utils/cn';

function ErrorPage({ statusCode }) {
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';

  return (
    <>
      <Head>
        <title>{statusCode || 'Error'} | XRPL.to</title>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <div
        className={cn(
          'min-h-screen flex items-center justify-center',
          'bg-white dark:bg-black'
        )}
      >
        <div className="mx-auto max-w-xl px-4 text-center">
          <p
            className={cn(
              'text-4xl font-medium mb-4',
              'text-gray-600 dark:text-white/80'
            )}
          >
            {statusCode || 'Error'}
          </p>

          <p
            className={cn(
              'text-sm font-medium tracking-widest mb-2',
              'text-gray-600 dark:text-white/80'
            )}
          >
            {statusCode === 500
              ? 'INTERNAL SERVER ERROR'
              : statusCode === 400
                ? 'BAD REQUEST'
                : 'SOMETHING WENT WRONG'}
          </p>

          <p className={cn('text-xs mb-8', 'text-gray-400 dark:text-white/30')}>
            {statusCode === 500
              ? 'The server encountered an error'
              : statusCode === 400
                ? 'The request could not be processed'
                : 'An unexpected error occurred'}
          </p>

          <a
            href="/"
            className={cn(
              'inline-block px-6 py-3 rounded-xl border-[1.5px] text-[0.95rem] font-normal transition-all',
              'text-primary',
              'border-gray-200 hover:border-primary hover:bg-primary/5 dark:border-white/20 dark:hover:border-primary dark:hover:bg-primary/5'
            )}
          >
            Return home
          </a>
        </div>
      </div>
    </>
  );
}

// Strip hostname and other internal details from error page props
ErrorPage.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default ErrorPage;
