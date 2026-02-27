import { useRouter } from 'next/router';
import api from 'src/utils/api';
import { useState, useContext } from 'react';
import { ThemeContext } from 'src/context/AppContext';
import { cn } from 'src/utils/cn';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import { getHashIcon } from 'src/utils/formatters';

const AccountAvatar = ({ account }) => {
  const [imgSrc, setImgSrc] = useState(`https://s1.xrpl.to/account/${account}`);

  const handleImageError = () => {
    setImgSrc(getHashIcon(account));
  };

  return (
    <img
      src={imgSrc}
      onError={handleImageError}
      alt={account}
      className="mr-2 h-8 w-8 rounded-full"
    />
  );
};

const LedgerDetails = ({ ledgerData, transactions, error }) => {
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  const {
    ledger_index,
    close_time,
    close_time_human,
    ledger_hash,
    parent_hash,
    txn_count,
    total_coins,
    parent_close_time
  } = ledgerData;
  const ledgerIndex = parseInt(ledger_index, 10);
  const closeTimeLocale = close_time_human
    ? new Date(close_time_human).toLocaleString()
    : 'Unknown';
  const totalXrp = total_coins ? (total_coins / 1000000).toLocaleString() : 'Unknown';
  const xrpBurned = total_coins
    ? ((100000000000000000 - total_coins) / 1000000).toLocaleString()
    : 'Unknown';
  const closeTime = close_time && parent_close_time ? close_time - parent_close_time : null;

  const shortenAddress = (address) => {
    if (!address) return '';
    if (address.length <= 20) return address;
    return `${address.slice(0, 10)}...${address.slice(-10)}`;
  };

  const shortenHash = (hash) => {
    if (!hash) return '';
    if (hash.length <= 10) return hash;
    return `${hash.slice(0, 5)}...${hash.slice(-5)}`;
  };

  const sortedTransactions = [...transactions].sort(
    (a, b) => a.meta.TransactionIndex - b.meta.TransactionIndex
  );

  return (
    <div
      className={cn(
        'rounded-xl border-[1.5px] p-4 sm:p-6 md:p-8',
        'border-gray-200 dark:border-white/10'
      )}
    >
      <h2 className={cn('mb-2 text-xl font-medium', 'text-gray-900 dark:text-white')}>
        Ledger transactions #{ledger_index}
      </h2>
      <p className={cn('mb-4 text-[13px]', 'text-gray-500 dark:text-white/60')}>
        {closeTimeLocale}
      </p>

      <div className="my-4 flex items-center justify-center gap-4">
        <button
          onClick={() => (window.location.href = `/ledger/${ledgerIndex - 1}`)}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg border-[1.5px] transition-colors',
            'border-gray-200 hover:border-primary hover:bg-primary/5 dark:border-white/10 dark:hover:border-primary dark:hover:bg-primary/5'
          )}
        >
          <ChevronLeft size={20} />
        </button>
        <span className={cn('text-lg font-medium', 'text-gray-900 dark:text-white')}>
          #{ledgerIndex}
        </span>
        <button
          onClick={() => (window.location.href = `/ledger/${ledgerIndex + 1}`)}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg border-[1.5px] transition-colors',
            'border-gray-200 hover:border-primary hover:bg-primary/5 dark:border-white/10 dark:hover:border-primary dark:hover:bg-primary/5'
          )}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={cn('border-b', 'border-gray-200 dark:border-white/10')}>
              <th
                className={cn(
                  'px-4 py-3 text-left text-[13px] font-medium',
                  'text-gray-500 dark:text-white/60'
                )}
              >
                Index
              </th>
              <th
                className={cn(
                  'px-4 py-3 text-left text-[13px] font-medium',
                  'text-gray-500 dark:text-white/60'
                )}
              >
                Type
              </th>
              <th
                className={cn(
                  'px-4 py-3 text-left text-[13px] font-medium',
                  'text-gray-500 dark:text-white/60'
                )}
              >
                Address
              </th>
              <th
                className={cn(
                  'px-4 py-3 text-left text-[13px] font-medium',
                  'text-gray-500 dark:text-white/60'
                )}
              >
                Status
              </th>
              <th
                className={cn(
                  'px-4 py-3 text-left text-[13px] font-medium',
                  'text-gray-500 dark:text-white/60'
                )}
              >
                Hash
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedTransactions.map((tx) => (
              <tr
                key={tx.hash}
                className={cn(
                  'border-b transition-colors',
                  'border-gray-100 hover:bg-gray-50 dark:border-white/5 dark:hover:bg-primary/5'
                )}
              >
                <td
                  className={cn('px-4 py-3 text-[13px]', 'text-gray-900 dark:text-white')}
                >
                  {tx.meta.TransactionIndex}
                </td>
                <td
                  className={cn('px-4 py-3 text-[13px]', 'text-gray-900 dark:text-white')}
                >
                  {tx.tx_json?.TransactionType}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <AccountAvatar account={tx.tx_json?.Account} />
                    <span
                      onClick={() => (window.location.href = `/address/${tx.tx_json?.Account}`)}
                      className="cursor-pointer text-[13px] text-primary hover:underline"
                    >
                      {shortenAddress(tx.tx_json?.Account)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'text-[13px]',
                      tx.meta.TransactionResult === 'tesSUCCESS' ? 'text-green-500' : 'text-red-500'
                    )}
                  >
                    {tx.meta.TransactionResult}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    onClick={() => (window.location.href = `/tx/${tx.hash}`)}
                    className="cursor-pointer text-[13px] text-primary hover:underline"
                  >
                    {shortenHash(tx.hash)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div
        className={cn(
          'mt-6 border-t pt-6 space-y-3',
          'border-gray-200 dark:border-white/10'
        )}
      >
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <p className={cn('text-[13px]', 'text-gray-500 dark:text-white/60')}>
            <span className={'text-gray-400 dark:text-white/40'}>Closed:</span>{' '}
            {closeTimeLocale}
          </p>
          {closeTime && (
            <p className={cn('text-[13px]', 'text-gray-500 dark:text-white/60')}>
              <span className={'text-gray-400 dark:text-white/40'}>Interval:</span>{' '}
              {closeTime}s
            </p>
          )}
          <p className={cn('text-[13px]', 'text-gray-500 dark:text-white/60')}>
            <span className={'text-gray-400 dark:text-white/40'}>Transactions:</span>{' '}
            {txn_count}
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <p className={cn('text-[13px]', 'text-gray-500 dark:text-white/60')}>
            <span className={'text-gray-400 dark:text-white/40'}>Total XRP:</span>{' '}
            {totalXrp}
          </p>
          <p className={cn('text-[13px]', 'text-orange-600 dark:text-orange-400/80')}>
            <span className={'text-gray-400 dark:text-white/40'}>XRP Burned:</span>{' '}
            {xrpBurned}
          </p>
        </div>
        <p
          className={cn(
            'text-[13px] font-mono break-all',
            'text-gray-500 dark:text-white/60'
          )}
        >
          <span className={cn('font-sans', 'text-gray-400 dark:text-white/40')}>
            Ledger hash:
          </span>{' '}
          {ledger_hash}
        </p>
        <p
          className={cn(
            'text-[13px] font-mono break-all',
            'text-gray-500 dark:text-white/60'
          )}
        >
          <span className={cn('font-sans', 'text-gray-400 dark:text-white/40')}>
            Parent hash:
          </span>{' '}
          {parent_hash}
        </p>
      </div>
    </div>
  );
};

const LedgerPage = ({ ledgerData, transactions, error }) => {
  const router = useRouter();
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="mx-auto w-full max-w-[1920px] flex-1 px-4 py-8">
        <div className="mb-6">
          <h1 className={cn('text-2xl font-medium', 'text-gray-900 dark:text-white')}>
            Ledger Details
          </h1>
        </div>
        {error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <LedgerDetails ledgerData={ledgerData} transactions={transactions} />
        )}
      </div>
      <Footer />
    </div>
  );
};

export async function getServerSideProps(context) {
  const { index } = context.params;

  if (!/^\d+$/.test(index)) {
    return {
      props: { ledgerData: null, transactions: [], error: 'Invalid ledger index format.' }
    };
  }

  // Reject obviously invalid ledger indices (current ledger is ~95M as of 2026)
  const ledgerNum = parseInt(index, 10);
  if (ledgerNum > 999999999 || ledgerNum < 1) {
    return {
      props: { ledgerData: null, transactions: [], error: 'Ledger index out of valid range.' }
    };
  }

  try {
    const res = await api.get(`https://api.xrpl.to/v1/ledger/${index}?expand=true`, {
      timeout: 8000
    });
    const ledgerData = res.data;
    const transactions = ledgerData?.transactions || [];
    return {
      props: { ledgerData, transactions, error: null }
    };
  } catch (error) {
    console.error(error?.message || error);
    return {
      props: { ledgerData: null, transactions: [], error: 'Failed to fetch ledger data.' }
    };
  }
}

export default LedgerPage;
