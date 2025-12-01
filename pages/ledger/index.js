import axios from 'axios';
import { useState, useContext } from 'react';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
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
      className="w-8 h-8 rounded-full mr-2"
    />
  );
};

const LedgerDetails = ({ ledgerData, error, isDark }) => {
  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  const { ledger } = ledgerData;
  const { ledger_index, close_time, transactions } = ledger;

  const closeTimeISO = rippleTimeToISO8601(close_time);
  const closeTimeLocale = new Date(closeTimeISO).toLocaleString();

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
      "p-4 sm:p-6 md:p-8 rounded-xl border-[1.5px]",
      isDark ? "border-white/10 bg-transparent" : "border-gray-200 bg-transparent"
    )}>
      <h2 className="text-xl font-normal mb-2">
        Ledger transactions #{ledger_index}
      </h2>
      <p className={cn(
        "text-[15px] mb-4",
        isDark ? "text-white/60" : "text-gray-600"
      )}>
        {closeTimeLocale}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={cn(
              "border-b-[1.5px]",
              isDark ? "border-white/10" : "border-gray-200"
            )}>
              <th className="text-left py-3 px-2 text-[11px] font-medium uppercase tracking-wide text-white/60">Index</th>
              <th className="text-left py-3 px-2 text-[11px] font-medium uppercase tracking-wide text-white/60">Type</th>
              <th className="text-left py-3 px-2 text-[11px] font-medium uppercase tracking-wide text-white/60">Address</th>
              <th className="text-left py-3 px-2 text-[11px] font-medium uppercase tracking-wide text-white/60">Status</th>
              <th className="text-left py-3 px-2 text-[11px] font-medium uppercase tracking-wide text-white/60">Hash</th>
            </tr>
          </thead>
          <tbody>
            {sortedTransactions.map((tx) => (
              <tr key={tx.hash} className={cn(
                "border-b-[1.5px]",
                isDark ? "border-white/5" : "border-gray-100"
              )}>
                <td className="py-3 px-2 text-[13px]">{tx.metaData.TransactionIndex}</td>
                <td className="py-3 px-2 text-[13px]">{tx.TransactionType}</td>
                <td className="py-3 px-2">
                  <div className="flex items-center">
                    <AccountAvatar account={tx.Account} />
                    <span
                      onClick={() => (window.location.href = `/profile/${tx.Account}`)}
                      className="text-primary cursor-pointer hover:underline text-[13px]"
                    >
                      {shortenAddress(tx.Account)}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-2">
                  <span className={cn(
                    "text-[13px]",
                    tx.metaData.TransactionResult === 'tesSUCCESS' ? 'text-green-500' : 'text-red-500'
                  )}>
                    {tx.metaData.TransactionResult}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <span
                    onClick={() => (window.location.href = `/tx/${tx.hash}`)}
                    className="text-primary cursor-pointer hover:underline text-[13px]"
                  >
                    {shortenHash(tx.hash)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={cn(
        "pt-4 mt-4 border-t-[1.5px]",
        isDark ? "border-white/10" : "border-gray-200"
      )}>
        <p className={cn(
          "text-[13px] mb-1",
          isDark ? "text-white/60" : "text-gray-600"
        )}>
          Ledger Unix close time: {close_time}
        </p>
        <p className={cn(
          "text-[13px]",
          isDark ? "text-white/60" : "text-gray-600"
        )}>
          Ledger UTC close time: {closeTimeISO}
        </p>
      </div>
    </div>
  );
};

const LatestLedgerPage = ({ ledgerData, error }) => {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1 py-8 max-w-screen-lg mx-auto w-full px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-normal mb-2">
            Latest Ledger
          </h1>
        </div>
        {error ? (
          <div className="text-red-500">{error}</div>
        ) : (
          <LedgerDetails ledgerData={ledgerData} isDark={isDark} />
        )}
      </div>
      <Footer />
    </div>
  );
};

export async function getServerSideProps() {
  try {
    const response = await axios.get('https://api.xrpscan.com/api/v1/ledger');
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

export default LatestLedgerPage;
