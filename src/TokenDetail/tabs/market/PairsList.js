import { useEffect, useRef, useState, useContext } from 'react';
import { ArrowLeftRight, TrendingUp, TrendingDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import Link from 'next/link';

// Utils
import { cn } from 'src/utils/cn';
import { fNumber } from 'src/utils/formatters';
import { AppContext } from 'src/AppContext';
import { useInView } from 'react-intersection-observer';

// ----------------------------------------------------------------------
import Sparkline from 'src/components/Sparkline';

// ----------------------------------------------------------------------

const ChartBox = ({ isDark, sparkline, id, isMobile }) => {
  const BASE_URL = process.env.API_URL;
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  return (
    <div ref={ref}>
      {inView ? (
        sparkline ? (
          <div className={cn(
            'overflow-hidden rounded-xl border-[1.5px] transition-all hover:scale-[1.02]',
            isMobile ? 'w-20 h-[30px]' : 'w-[180px] h-[60px]',
            isDark ? 'border-white/5 hover:border-white/20' : 'border-gray-200 hover:border-gray-400'
          )}>
            <Sparkline
              url={`${BASE_URL}/sparkline/${sparkline}?period=24h`}
              showGradient={true}
              lineWidth={2}
              style={{
                width: '100%',
                height: '100%'
              }}
              opts={{
                renderer: 'svg',
                width: isMobile ? 80 : 180,
                height: isMobile ? 30 : 60,
                animation: false,
                devicePixelRatio: window.devicePixelRatio || 1
              }}
            />
          </div>
        ) : (
          <div className={cn(
            'flex items-center justify-center rounded-xl border-[1.5px] opacity-50',
            isMobile ? 'w-20 h-[30px]' : 'w-[180px] h-[60px]',
            isDark ? 'border-white/5' : 'border-gray-200'
          )}>
            <span className={cn(
              'text-[11px] font-normal',
              isDark ? 'text-white/40' : 'text-gray-400'
            )}>
              No Chart Data
            </span>
          </div>
        )
      ) : (
        <div className={cn(
          'flex items-center justify-center rounded-xl',
          isMobile ? 'w-20 h-[30px]' : 'w-[180px] h-[60px]'
        )} />
      )}
    </div>
  );
};

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.substr(0, n - 1) + '...' : str;
}

export default function PairsList({ token, pairs }) {
  const BASE_URL = process.env.API_URL;
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [isMobile, setIsMobile] = useState(false);
  const { name, exch, pro7d, pro24h, md5, slug } = token;
  let user = token.user;
  if (!user) user = name;

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(pairs.length / itemsPerPage);
  const paginatedPairs = pairs.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="space-y-2">
      {/* Table Headers */}
      <div className={cn(
        'hidden md:grid grid-cols-[0.5fr_2fr_1.5fr_1.5fr_1fr_1.5fr_1.5fr_0.5fr] gap-4 p-4 rounded-t-xl border-[1.5px]',
        isDark ? 'border-white/[0.08]' : 'border-gray-200'
      )}>
        <span className={cn('text-[12px] font-medium uppercase tracking-wide', isDark ? 'text-white/60' : 'text-gray-500')}>#</span>
        <span className={cn('text-[12px] font-medium uppercase tracking-wide', isDark ? 'text-white/60' : 'text-gray-500')}>Pair</span>
        <span className={cn('text-[12px] font-medium uppercase tracking-wide', isDark ? 'text-white/60' : 'text-gray-500')}>24h Chart</span>
        <span className={cn('text-[12px] font-medium uppercase tracking-wide', isDark ? 'text-white/60' : 'text-gray-500')}>Volume (24h)</span>
        <span className={cn('text-[12px] font-medium uppercase tracking-wide', isDark ? 'text-white/60' : 'text-gray-500')}>Trades</span>
        <span className={cn('text-[12px] font-medium uppercase tracking-wide', isDark ? 'text-white/60' : 'text-gray-500')}>Issuer</span>
        <span className={cn('text-[12px] font-medium uppercase tracking-wide', isDark ? 'text-white/60' : 'text-gray-500')}>Domain</span>
        <span></span>
      </div>

      <div className="space-y-1">
        {paginatedPairs.map((row) => {
          const { id, pair, curr1, curr2, count } = row;
          const name1 = curr1.name;
          const name2 = curr2.name;

          let user1 = curr1.user;
          let user2 = curr2.user;

          if (!user1) user1 = curr1.issuer;
          if (!user2) user2 = curr2.issuer;

          user1 = truncate(user1, 12);
          user2 = truncate(user2, 12);

          let xrpltoDexURL = `/token/${slug}/trade`;

          let sparkline = '';
          let sparklineToken = null;

          if (id === 1) {
            sparkline = curr1.md5;
            sparklineToken = curr1;
          } else {
            if (curr2.currency !== 'XRP' && curr2.md5) {
              sparkline = curr2.md5;
              sparklineToken = curr2;
            } else if (curr1.currency !== 'XRP' && curr1.md5) {
              sparkline = curr1.md5;
              sparklineToken = curr1;
            }
          }

          const volumePercentage = Math.min(100, Math.max(5, (Math.log10(count + 1) / 5) * 100));

          return (
            <div
              key={pair}
              className={cn(
                'relative rounded-xl border-[1.5px] overflow-hidden transition-all hover:-translate-y-0.5',
                isDark
                  ? 'border-white/[0.08] hover:border-primary/30'
                  : 'border-gray-200 hover:border-primary/30'
              )}
            >
              {/* Volume Indicator */}
              <div
                className={cn(
                  'absolute left-0 top-0 h-full rounded-xl transition-all',
                  isDark ? 'bg-primary/5' : 'bg-primary/3'
                )}
                style={{ width: `${volumePercentage}%` }}
              />

              <div className="relative p-3">
                <div className={cn(
                  'grid gap-3 items-center',
                  'grid-cols-1 sm:grid-cols-2',
                  'md:grid-cols-[0.5fr_2fr_1.5fr_1.5fr_1fr_1.5fr_1.5fr_0.5fr]'
                )}>
                  {/* Rank */}
                  <div className="hidden md:block">
                    <span className={cn('text-[14px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                      {id}
                    </span>
                  </div>

                  {/* Pair */}
                  <div className="flex items-center gap-1.5">
                    <img
                      src={
                        curr1.md5
                          ? `https://s1.xrpl.to/token/${curr1.md5}`
                          : curr1.currency === 'XRP'
                            ? `https://s1.xrpl.to/token/84e5efeb89c4eae8f68188982dc290d8`
                            : undefined
                      }
                      alt={name1}
                      className="w-5 h-5 rounded-full"
                    />
                    <span className={cn('text-[14px] font-medium text-primary')}>
                      {name1}
                    </span>
                    <ArrowLeftRight size={16} className={isDark ? 'text-white/40' : 'text-gray-400'} />
                    <img
                      src={
                        curr2.md5
                          ? `https://s1.xrpl.to/token/${curr2.md5}`
                          : curr2.currency === 'XRP'
                            ? `https://s1.xrpl.to/token/84e5efeb89c4eae8f68188982dc290d8`
                            : undefined
                      }
                      alt={name2}
                      className="w-5 h-5 rounded-full"
                    />
                    <span className={cn('text-[14px] font-medium text-primary')}>
                      {name2}
                    </span>
                  </div>

                  {/* Chart */}
                  <div className="hidden md:block">
                    <ChartBox
                      isDark={isDark}
                      sparkline={sparkline}
                      id={id}
                      isMobile={isMobile}
                    />
                  </div>

                  {/* Volume */}
                  <div>
                    <span className={cn('text-[11px] block md:hidden', isDark ? 'text-white/60' : 'text-gray-500')}>
                      Volume (24h)
                    </span>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1">
                        <span className={cn('text-[14px] font-medium text-primary')}>
                          {fNumber(curr1.value)}
                        </span>
                        <span className="text-[12px] text-primary">
                          {name1}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className={cn('text-[14px] font-medium text-primary')}>
                          {fNumber(curr2.value)}
                        </span>
                        <span className="text-[12px] text-primary">
                          {name2}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Trades */}
                  <div>
                    <span className={cn('text-[11px] block md:hidden', isDark ? 'text-white/60' : 'text-gray-500')}>
                      Trades (24h)
                    </span>
                    <span className={cn('text-[14px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                      {fNumber(count)}
                    </span>
                  </div>

                  {/* Issuer */}
                  <div className="hidden md:block space-y-0.5">
                    {id === 1 && (
                      <a
                        href={`https://bithomp.com/explorer/${curr1.issuer}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-[13px] font-normal text-primary hover:underline"
                      >
                        {user1}
                      </a>
                    )}
                    {curr2.issuer && curr2.issuer !== 'XRPL' && (
                      <a
                        href={`https://bithomp.com/explorer/${curr2.issuer}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-[13px] font-normal text-primary hover:underline"
                      >
                        {user2}
                      </a>
                    )}
                  </div>

                  {/* Domain */}
                  <div className="hidden md:block space-y-0.5">
                    {id === 1 && curr1.domain && (
                      <a
                        href={`https://${curr1.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          'block text-[13px] font-normal hover:underline',
                          isDark ? 'text-white/60 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                        )}
                      >
                        {curr1.domain}
                      </a>
                    )}
                    {curr2.domain && (
                      <a
                        href={`https://${curr2.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                          'block text-[13px] font-normal hover:underline',
                          isDark ? 'text-white/60 hover:text-white' : 'text-gray-500 hover:text-gray-900'
                        )}
                      >
                        {curr2.domain}
                      </a>
                    )}
                  </div>

                  {/* Actions - Empty */}
                  <div className="hidden md:block" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-xl border-[1.5px] transition-colors disabled:opacity-30',
              isDark ? 'border-white/[0.08] hover:border-primary hover:bg-primary/5' : 'border-gray-200 hover:border-primary hover:bg-primary/5'
            )}
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-xl border-[1.5px] transition-colors disabled:opacity-30',
              isDark ? 'border-white/[0.08] hover:border-primary hover:bg-primary/5' : 'border-gray-200 hover:border-primary hover:bg-primary/5'
            )}
          >
            <ChevronLeft size={16} />
          </button>
          <span className={cn('px-4 text-[13px]', isDark ? 'text-white/60' : 'text-gray-600')}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === totalPages}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-xl border-[1.5px] transition-colors disabled:opacity-30',
              isDark ? 'border-white/[0.08] hover:border-primary hover:bg-primary/5' : 'border-gray-200 hover:border-primary hover:bg-primary/5'
            )}
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page === totalPages}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-xl border-[1.5px] transition-colors disabled:opacity-30',
              isDark ? 'border-white/[0.08] hover:border-primary hover:bg-primary/5' : 'border-gray-200 hover:border-primary hover:bg-primary/5'
            )}
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
