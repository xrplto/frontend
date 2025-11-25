import React, { useState, useEffect, useContext } from 'react';
import styled from '@emotion/styled';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import { Loader2, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';

// Constants
const getTokenImageUrl = (issuer, currency) => {
  return `https://xrpl.to/api/token_logo/${issuer}/${currency}`;
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

  const [richList, setRichList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalHolders, setTotalHolders] = useState(0);
  const [totalTrustlines, setTotalTrustlines] = useState(0);
  const [totalSupply, setTotalSupply] = useState(0);
  const limit = 20;

  const ammAccount = amm || token?.AMM;

  useEffect(() => {
    const fetchRichList = async () => {
      if (!token || !token.md5) {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `https://api.xrpl.to/api/richlist/${token.md5}?start=${(page - 1) * limit}&limit=${limit}`
        );
        const data = await response.json();

        if (data.result === 'success') {
          setRichList(data.richList || []);
          const actualHolders = data.length || data.richList?.length || 0;
          setTotalHolders(actualHolders);
          const trustlineCount = token?.trustlines || token?.holders || 0;
          setTotalTrustlines(trustlineCount);
          const supply =
            token.supply ||
            token.total_supply ||
            (data.richList && data.richList.length > 0 && data.richList[0].holding
              ? parseFloat(data.richList[0].balance) / (parseFloat(data.richList[0].holding) / 100)
              : 0);
          setTotalSupply(supply);
          setTotalPages(Math.ceil((actualHolders || 100) / limit));
        }
      } catch (error) {
        console.error('Error fetching rich list:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRichList();
  }, [token?.md5, page]);

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
    if (rank === 1) return 'bg-yellow-500/15 text-yellow-500 border-yellow-500/30';
    if (rank === 2) return 'bg-gray-400/15 text-gray-400 border-gray-400/30';
    if (rank === 3) return 'bg-orange-600/15 text-orange-600 border-orange-600/30';
    return isDark ? 'bg-white/10 text-white/60 border-white/20' : 'bg-gray-100 text-gray-600 border-gray-200';
  };

  return (
    <div className="space-y-4">
      <div className={cn(
        'overflow-hidden rounded-xl border-[1.5px]',
        isDark ? 'border-white/10' : 'border-gray-200'
      )}>
        <table className="w-full">
          <thead>
            <tr className={cn('border-b', isDark ? 'border-white/10' : 'border-gray-200')}>
              <th className={cn('px-4 py-3 text-left text-[13px] font-medium', isDark ? 'text-white/60' : 'text-gray-500')}>Rank</th>
              <th className={cn('px-4 py-3 text-left text-[13px] font-medium', isDark ? 'text-white/60' : 'text-gray-500')}>Address</th>
              <th className={cn('px-4 py-3 text-right text-[13px] font-medium', isDark ? 'text-white/60' : 'text-gray-500')}>Balance</th>
              <th className={cn('px-4 py-3 text-right text-[13px] font-medium', isDark ? 'text-white/60' : 'text-gray-500')}>% of Supply</th>
              <th className={cn('px-4 py-3 text-right text-[13px] font-medium', isDark ? 'text-white/60' : 'text-gray-500')}>24h Change</th>
            </tr>
          </thead>
          <tbody>
            {richList.map((holder, index) => {
              const rank = holder.id || (page - 1) * limit + index + 1;
              const percentOfSupply =
                holder.holding ||
                (totalSupply > 0
                  ? ((parseFloat(holder.balance) / parseFloat(totalSupply)) * 100).toFixed(2)
                  : '0');

              return (
                <tr
                  key={holder.account || index}
                  className={cn(
                    'border-b transition-colors',
                    isDark ? 'border-white/5 hover:bg-primary/5' : 'border-gray-100 hover:bg-gray-50'
                  )}
                >
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex h-5 w-5 items-center justify-center rounded text-[13px] font-normal border',
                      getRankStyle(rank)
                    )}>
                      {rank}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/profile/${holder.account}`}
                        className="text-[13px] font-normal text-primary hover:underline"
                      >
                        {holder.account
                          ? `${holder.account.slice(0, 6)}...${holder.account.slice(-6)}`
                          : 'Unknown'}
                      </Link>
                      {holder.freeze && (
                        <span className="rounded border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-[10px] text-red-500">
                          Frozen
                        </span>
                      )}
                      {ammAccount && holder.account === ammAccount && (
                        <span className="rounded bg-primary px-1.5 py-0.5 text-[10px] text-white">
                          AMM
                        </span>
                      )}
                      {token.issuer && holder.account === token.issuer && (
                        <span className={cn(
                          'rounded px-1.5 py-0.5 text-[10px]',
                          isDark ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                        )}>
                          {token.creator && holder.account === token.creator ? 'Issuer/Creator' : 'Issuer'}
                        </span>
                      )}
                      {token.creator && holder.account === token.creator && holder.account !== token.issuer && (
                        <span className="rounded bg-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-500">
                          Creator
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <img
                        src={getTokenImageUrl(token.issuer, token.currency)}
                        alt={decodeCurrency(token.currency)}
                        className="h-4 w-4 rounded-full"
                      />
                      <span className={cn('text-[13px] font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                        {formatNumber(holder.balance)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className={cn(
                      'text-[13px]',
                      parseFloat(percentOfSupply) > 10 ? 'text-yellow-500' : isDark ? 'text-white' : 'text-gray-900'
                    )}>
                      {percentOfSupply}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {holder.balance24h !== undefined && holder.balance24h !== null ? (
                      (() => {
                        const change = parseFloat(holder.balance) - parseFloat(holder.balance24h);
                        const changePercent =
                          holder.balance24h > 0
                            ? ((change / parseFloat(holder.balance24h)) * 100).toFixed(2)
                            : 0;
                        const isPositive = change >= 0;

                        return (
                          <span className={cn(
                            'text-[13px] font-medium',
                            isPositive ? 'text-green-500' : 'text-red-500'
                          )}>
                            {isPositive ? '▲' : '▼'} {formatNumber(Math.abs(change))} ({isPositive ? '+' : ''}{changePercent}%)
                          </span>
                        );
                      })()
                    ) : (
                      <span className={cn('text-[13px]', isDark ? 'text-white/40' : 'text-gray-400')}>-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => handlePageChange(1)}
            disabled={page === 1}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg border-[1.5px] transition-colors disabled:opacity-30',
              isDark ? 'border-white/10 hover:border-primary hover:bg-primary/5' : 'border-gray-200 hover:border-primary hover:bg-primary/5'
            )}
          >
            <ChevronsLeft size={16} />
          </button>
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg border-[1.5px] transition-colors disabled:opacity-30',
              isDark ? 'border-white/10 hover:border-primary hover:bg-primary/5' : 'border-gray-200 hover:border-primary hover:bg-primary/5'
            )}
          >
            <ChevronLeft size={16} />
          </button>
          <span className={cn('px-4 text-[13px]', isDark ? 'text-white/60' : 'text-gray-600')}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg border-[1.5px] transition-colors disabled:opacity-30',
              isDark ? 'border-white/10 hover:border-primary hover:bg-primary/5' : 'border-gray-200 hover:border-primary hover:bg-primary/5'
            )}
          >
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => handlePageChange(totalPages)}
            disabled={page === totalPages}
            className={cn(
              'flex h-8 w-8 items-center justify-center rounded-lg border-[1.5px] transition-colors disabled:opacity-30',
              isDark ? 'border-white/10 hover:border-primary hover:bg-primary/5' : 'border-gray-200 hover:border-primary hover:bg-primary/5'
            )}
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default RichList;
