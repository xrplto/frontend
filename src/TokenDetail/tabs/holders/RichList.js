import React, { useState, useEffect, useContext } from 'react';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import { Loader2, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { MD5 } from 'crypto-js';

// Constants
const getTokenImageUrl = (issuer, currency) => {
  if (currency === 'XRP') {
    return 'https://s1.xrpl.to/token/84e5efeb89c4eae8f68188982dc290d8';
  }
  const tokenIdentifier = issuer + '_' + currency;
  const md5Hash = MD5(tokenIdentifier).toString();
  return `https://s1.xrpl.to/token/${md5Hash}`;
};
const decodeCurrency = (currency) => {
  if (currency === 'XRP') return 'XRP';
  try {
    return Buffer.from(currency, 'hex').toString('utf8').replace(/\x00/g, '');
  } catch {
    return currency;
  }
};

const formatNumber = (num) => {
  if (!num || num === 0) return '0';
  const value = parseFloat(num);
  if (value >= 1e9) return (value / 1e9).toFixed(2) + 'B';
  if (value >= 1e6) return (value / 1e6).toFixed(2) + 'M';
  if (value >= 1e3) return (value / 1e3).toFixed(2) + 'K';
  if (value < 1) return value.toFixed(4);
  return value.toFixed(2);
};

const RichList = ({ token, amm }) => {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [isMobile, setIsMobile] = useState(false);
  const [mobileChecked, setMobileChecked] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    setMobileChecked(true);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [richList, setRichList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalHolders, setTotalHolders] = useState(0);
  const [summary, setSummary] = useState(null);
  const rowsPerPage = isMobile ? 10 : 20;

  const ammAccount = amm || token?.AMM;

  useEffect(() => {
    if (!mobileChecked) return;

    const fetchRichList = async () => {
      if (!token || !token.md5) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `https://api.xrpl.to/api/richlist/${token.md5}?start=${(page - 1) * rowsPerPage}&limit=${rowsPerPage}`
        );
        const data = await response.json();

        if (data.result === 'success') {
          setRichList(data.richList || []);
          setSummary(data.summary || null);
          const actualHolders = data.length || data.richList?.length || 0;
          setTotalHolders(actualHolders);
          setTotalPages(Math.ceil((actualHolders || 100) / rowsPerPage));
        }
      } catch (error) {
        console.error('Error fetching rich list:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRichList();
  }, [token?.md5, page, rowsPerPage, mobileChecked]);

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (!richList || richList.length === 0) {
    return (
      <div className={cn(
        'rounded-xl border-[1.5px] border-dashed py-12 text-center',
        isDark ? 'border-white/20 bg-white/[0.02]' : 'border-gray-300 bg-gray-50'
      )}>
        <h3 className={cn('mb-2 text-base font-medium', isDark ? 'text-white/60' : 'text-gray-500')}>
          No Holder Data Available
        </h3>
        <p className={cn('text-sm', isDark ? 'text-white/40' : 'text-gray-400')}>
          Rich list data will appear here when available
        </p>
      </div>
    );
  }

  const getRankStyle = (rank) => {
    if (rank === 1) return 'bg-yellow-500/15 text-yellow-500';
    if (rank === 2) return 'bg-gray-400/15 text-gray-400';
    if (rank === 3) return 'bg-orange-600/15 text-orange-500';
    return isDark ? 'bg-white/5 text-white/50' : 'bg-gray-100 text-gray-500';
  };

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Top 10', value: summary.top10Hold },
            { label: 'Top 20', value: summary.top20Hold },
            { label: 'Top 50', value: summary.top50Hold },
            { label: 'Top 100', value: summary.top100Hold }
          ].map(({ label, value }) => (
            <div key={label} className={cn(
              'rounded-lg border px-3 py-2',
              isDark ? 'border-white/[0.08] bg-white/[0.02]' : 'border-gray-200 bg-gray-50'
            )}>
              <div className={cn('text-[10px] uppercase tracking-wide', isDark ? 'text-white/40' : 'text-gray-400')}>{label}</div>
              <div className={cn(
                'text-[14px] font-medium',
                value > 70 ? 'text-red-400' : value > 50 ? 'text-yellow-500' : isDark ? 'text-white' : 'text-gray-900'
              )}>
                {value}%
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Table */}
      <div>
        <table className="w-full">
          <thead>
            <tr className={cn('border-b', isDark ? 'border-white/[0.08]' : 'border-gray-200')}>
              <th className={cn('py-2 pr-2 text-left text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>#</th>
              <th className={cn('py-2 px-2 text-left text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>Address</th>
              <th className={cn('py-2 px-2 text-right text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>Balance</th>
              <th className={cn('py-2 pl-2 text-right text-[10px] font-medium uppercase tracking-wider', isDark ? 'text-white/40' : 'text-gray-400')}>Share</th>
            </tr>
          </thead>
          <tbody>
            {richList.map((holder, index) => {
              const rank = holder.id || (page - 1) * rowsPerPage + index + 1;
              const percentOfSupply = holder.holding || 0;

              return (
                <tr
                  key={holder.account || index}
                  className={cn(
                    'border-b',
                    isDark ? 'border-white/5' : 'border-gray-100'
                  )}
                >
                  <td className="py-2 pr-2">
                    <span className={cn(
                      'inline-flex h-5 w-5 items-center justify-center rounded text-[10px] font-medium',
                      getRankStyle(rank)
                    )}>
                      {rank}
                    </span>
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/profile/${holder.account}`}
                        className={cn(
                          'text-[11px] font-mono hover:text-primary',
                          isDark ? 'text-white/80' : 'text-gray-700'
                        )}
                      >
                        {holder.account ? `${holder.account.slice(0, isMobile ? 4 : 6)}...${holder.account.slice(isMobile ? -4 : -6)}` : 'Unknown'}
                      </Link>
                      {ammAccount && holder.account === ammAccount && (
                        <span className="rounded bg-primary/20 px-1 py-0.5 text-[8px] font-medium text-primary">AMM</span>
                      )}
                      {token.issuer && holder.account === token.issuer && (
                        <span className="rounded bg-purple-500/15 px-1 py-0.5 text-[8px] font-medium text-purple-400">Issuer</span>
                      )}
                    </div>
                  </td>
                  <td className={cn('py-2 px-2 text-right text-[11px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                    {formatNumber(holder.balance)}
                  </td>
                  <td className="py-2 pl-2 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <div className={cn('h-1 w-8 overflow-hidden rounded-full', isDark ? 'bg-white/10' : 'bg-gray-200')}>
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(percentOfSupply * 10, 100)}%` }} />
                      </div>
                      <span className={cn(
                        'text-[11px] font-medium tabular-nums',
                        percentOfSupply > 5 ? 'text-yellow-500' : isDark ? 'text-white/70' : 'text-gray-600'
                      )}>
                        {percentOfSupply}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-3">
          <button
            onClick={() => handlePageChange(1)}
            disabled={page === 1}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md border transition-colors disabled:opacity-30',
              isDark ? 'border-white/[0.08] hover:border-primary' : 'border-gray-200 hover:border-primary'
            )}
          >
            <ChevronsLeft size={14} />
          </button>
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md border transition-colors disabled:opacity-30',
              isDark ? 'border-white/[0.08] hover:border-primary' : 'border-gray-200 hover:border-primary'
            )}
          >
            <ChevronLeft size={14} />
          </button>
          <span className={cn('px-3 text-[11px]', isDark ? 'text-white/50' : 'text-gray-500')}>
            {page} / {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md border transition-colors disabled:opacity-30',
              isDark ? 'border-white/[0.08] hover:border-primary' : 'border-gray-200 hover:border-primary'
            )}
          >
            <ChevronRight size={14} />
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={page === totalPages}
            className={cn(
              'flex h-7 w-7 items-center justify-center rounded-md border transition-colors disabled:opacity-30',
              isDark ? 'border-white/[0.08] hover:border-primary' : 'border-gray-200 hover:border-primary'
            )}
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default RichList;
