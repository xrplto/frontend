import { useRouter } from 'next/router';
import axios from 'axios';
import { useState, useContext } from 'react';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import { rippleTimeToISO8601 } from 'src/utils/parseUtils';
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

const LedgerDetails = ({ ledgerData, error }) => {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  const { ledger } = ledgerData;
  const { ledger_index, close_time, transactions } = ledger;

  const ledgerIndex = parseInt(ledger_index, 10);
  const closeTimeISO = rippleTimeToISO8601(close_time);
  const closeTimeLocale = closeTimeISO ? new Date(closeTimeISO).toLocaleString() : 'Unknown';

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
    (a, b) => a.metaData.TransactionIndex - b.metaData.TransactionIndex
  );

  return (
    <div className={cn(
      'rounded-xl border-[1.5px] p-4 sm:p-6 md:p-8',
      isDark ? 'border-white/10' : 'border-gray-200'
    )}>
      <h2 className={cn('mb-2 text-xl font-medium', isDark ? 'text-white' : 'text-gray-900')}>
        Ledger transactions #{ledger_index}
      </h2>
      <p className={cn('mb-4 text-[13px]', isDark ? 'text-white/60' : 'text-gray-500')}>
        {closeTimeLocale}
      </p>

      <div className="my-4 flex items-center justify-center gap-4">
        <button
          onClick={() => (window.location.href = `/ledger/${ledgerIndex - 1}`)}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg border-[1.5px] transition-colors',
            isDark ? 'border-white/10 hover:border-primary hover:bg-primary/5' : 'border-gray-200 hover:border-primary hover:bg-primary/5'
          )}
        >
          <ChevronLeft size={20} />
        </button>
        <span className={cn('text-lg font-medium', isDark ? 'text-white' : 'text-gray-900')}>
          #{ledgerIndex}
        </span>
        <button
          onClick={() => (window.location.href = `/ledger/${ledgerIndex + 1}`)}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg border-[1.5px] transition-colors',
            isDark ? 'border-white/10 hover:border-primary hover:bg-primary/5' : 'border-gray-200 hover:border-primary hover:bg-primary/5'
          )}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={cn('border-b', isDark ? 'border-white/10' : 'border-gray-200')}>
              <th className={cn('px-4 py-3 text-left text-[13px] font-medium', isDark ? 'text-white/60' : 'text-gray-500')}>Index</th>
              <th className={cn('px-4 py-3 text-left text-[13px] font-medium', isDark ? 'text-white/60' : 'text-gray-500')}>Type</th>
              <th className={cn('px-4 py-3 text-left text-[13px] font-medium', isDark ? 'text-white/60' : 'text-gray-500')}>Address</th>
              <th className={cn('px-4 py-3 text-left text-[13px] font-medium', isDark ? 'text-white/60' : 'text-gray-500')}>Status</th>
              <th className={cn('px-4 py-3 text-left text-[13px] font-medium', isDark ? 'text-white/60' : 'text-gray-500')}>Hash</th>
            </tr>
          </thead>
          <tbody>
            {sortedTransactions.map((tx) => (
              <tr
                key={tx.hash}
                className={cn('border-b transition-colors', isDark ? 'border-white/5 hover:bg-primary/5' : 'border-gray-100 hover:bg-gray-50')}
              >
                <td className={cn('px-4 py-3 text-[13px]', isDark ? 'text-white' : 'text-gray-900')}>
                  {tx.metaData.TransactionIndex}
                </td>
                <td className={cn('px-4 py-3 text-[13px]', isDark ? 'text-white' : 'text-gray-900')}>
                  {tx.TransactionType}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center">
                    <AccountAvatar account={tx.Account} />
                    <span
                      onClick={() => (window.location.href = `/profile/${tx.Account}`)}
                      className="cursor-pointer text-[13px] text-primary hover:underline"
                    >
                      {shortenAddress(tx.Account)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={cn(
                    'text-[13px]',
                    tx.metaData.TransactionResult === 'tesSUCCESS' ? 'text-green-500' : 'text-red-500'
                  )}>
                    {tx.metaData.TransactionResult}
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

      <div className={cn('mt-6 border-t pt-6', isDark ? 'border-white/10' : 'border-gray-200')}>
        <p className={cn('text-[13px]', isDark ? 'text-white/60' : 'text-gray-500')}>
          Ledger Unix close time: {close_time}
        </p>
        <p className={cn('text-[13px]', isDark ? 'text-white/60' : 'text-gray-500')}>
          Ledger UTC close time: {closeTimeISO}
        </p>
      </div>
    </div>
  );
};

const LedgerPage = ({ ledgerData, error }) => {
  const router = useRouter();
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  if (router.isFallback) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
        <div className="mb-6">
          <h1 className={cn('text-2xl font-medium', isDark ? 'text-white' : 'text-gray-900')}>
            Ledger Details
          </h1>
        </div>
        {error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <LedgerDetails ledgerData={ledgerData} />
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
      props: {
        ledgerData: null,
        error: 'Invalid ledger index format.'
      }
    };
  }

  try {
    const response = await axios.get(`https://api.xrpscan.com/api/v1/ledger/${index}`);
    return {
      props: {
        ledgerData: response.data,
        error: null
      }
    };
  } catch (error) {
    console.error(error);
    return {
      props: {
        ledgerData: null,
        error: 'Failed to fetch ledger data.'
      }
    };
  }
}

export default LedgerPage;
