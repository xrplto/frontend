import axios from 'axios';
import { useState, useContext } from 'react';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
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
      className="w-8 h-8 rounded-full mr-2"
    />
  );
};

const LedgerDetails = ({ ledgerData, transactions, isDark }) => {
  const { ledger_index, close_time_human, ledger_hash, parent_hash, tx_count, total_coins, close_time, parent_close_time } = ledgerData;
  const closeTimeLocale = close_time_human ? new Date(close_time_human).toLocaleString() : 'Unknown';
  const totalXrp = total_coins ? (total_coins / 1000000).toLocaleString() : 'Unknown';
  const xrpBurned = total_coins ? ((100000000000000000 - total_coins) / 1000000).toLocaleString() : 'Unknown';
  const interval = close_time && parent_close_time ? close_time - parent_close_time : null;

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
    <div className={cn(
      "p-4 sm:p-6 md:p-8 rounded-xl border-[1.5px]",
      isDark ? "border-white/10" : "border-gray-200"
    )}>
      <h2 className={cn("text-xl font-medium mb-2", isDark ? "text-white" : "text-gray-900")}>
        Ledger #{ledger_index}
      </h2>
      <p className={cn("text-[13px] mb-4", isDark ? "text-white/60" : "text-gray-500")}>
        {closeTimeLocale}
      </p>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={cn("border-b", isDark ? "border-white/10" : "border-gray-200")}>
              <th className={cn("text-left py-3 px-2 text-[13px] font-medium", isDark ? "text-white/60" : "text-gray-500")}>Index</th>
              <th className={cn("text-left py-3 px-2 text-[13px] font-medium", isDark ? "text-white/60" : "text-gray-500")}>Type</th>
              <th className={cn("text-left py-3 px-2 text-[13px] font-medium", isDark ? "text-white/60" : "text-gray-500")}>Address</th>
              <th className={cn("text-left py-3 px-2 text-[13px] font-medium", isDark ? "text-white/60" : "text-gray-500")}>Status</th>
              <th className={cn("text-left py-3 px-2 text-[13px] font-medium", isDark ? "text-white/60" : "text-gray-500")}>Hash</th>
            </tr>
          </thead>
          <tbody>
            {sortedTransactions.map((tx) => (
              <tr key={tx.hash} className={cn("border-b transition-colors", isDark ? "border-white/5 hover:bg-primary/5" : "border-gray-100 hover:bg-gray-50")}>
                <td className={cn("py-3 px-2 text-[13px]", isDark ? "text-white" : "text-gray-900")}>{tx.meta.TransactionIndex}</td>
                <td className={cn("py-3 px-2 text-[13px]", isDark ? "text-white" : "text-gray-900")}>{tx.TransactionType}</td>
                <td className="py-3 px-2">
                  <div className="flex items-center">
                    <AccountAvatar account={tx.Account} />
                    <span onClick={() => (window.location.href = `/profile/${tx.Account}`)} className="text-primary cursor-pointer hover:underline text-[13px]">
                      {shortenAddress(tx.Account)}
                    </span>
                  </div>
                </td>
                <td className="py-3 px-2">
                  <span className={cn("text-[13px]", tx.meta.TransactionResult === 'tesSUCCESS' ? 'text-green-500' : 'text-red-500')}>
                    {tx.meta.TransactionResult}
                  </span>
                </td>
                <td className="py-3 px-2">
                  <span onClick={() => (window.location.href = `/tx/${tx.hash}`)} className="text-primary cursor-pointer hover:underline text-[13px]">
                    {shortenHash(tx.hash)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className={cn("mt-6 border-t pt-6 space-y-3", isDark ? "border-white/10" : "border-gray-200")}>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <p className={cn("text-[13px]", isDark ? "text-white/60" : "text-gray-500")}>
            <span className={isDark ? "text-white/40" : "text-gray-400"}>Closed:</span> {closeTimeLocale}
          </p>
          {interval && (
            <p className={cn("text-[13px]", isDark ? "text-white/60" : "text-gray-500")}>
              <span className={isDark ? "text-white/40" : "text-gray-400"}>Interval:</span> {interval}s
            </p>
          )}
          <p className={cn("text-[13px]", isDark ? "text-white/60" : "text-gray-500")}>
            <span className={isDark ? "text-white/40" : "text-gray-400"}>Transactions:</span> {tx_count}
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <p className={cn("text-[13px]", isDark ? "text-white/60" : "text-gray-500")}>
            <span className={isDark ? "text-white/40" : "text-gray-400"}>Total XRP:</span> {totalXrp}
          </p>
          <p className={cn("text-[13px]", isDark ? "text-orange-400/80" : "text-orange-600")}>
            <span className={isDark ? "text-white/40" : "text-gray-400"}>XRP Burned:</span> {xrpBurned}
          </p>
        </div>
        <p className={cn("text-[13px] font-mono break-all", isDark ? "text-white/60" : "text-gray-500")}>
          <span className={cn("font-sans", isDark ? "text-white/40" : "text-gray-400")}>Ledger hash:</span> {ledger_hash}
        </p>
        <p className={cn("text-[13px] font-mono break-all", isDark ? "text-white/60" : "text-gray-500")}>
          <span className={cn("font-sans", isDark ? "text-white/40" : "text-gray-400")}>Parent hash:</span> {parent_hash}
        </p>
      </div>
    </div>
  );
};

const LatestLedgerPage = ({ ledgerData, transactions, error }) => {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="flex-1 py-8 max-w-[1920px] mx-auto w-full px-4">
        <div className="mb-6">
          <h1 className={cn("text-2xl font-medium", isDark ? "text-white" : "text-gray-900")}>
            Latest Ledger
          </h1>
        </div>
        {error ? (
          <p className="text-red-500">{error}</p>
        ) : (
          <LedgerDetails ledgerData={ledgerData} transactions={transactions} isDark={isDark} />
        )}
      </div>
      <Footer />
    </div>
  );
};

export async function getServerSideProps() {
  try {
    const listRes = await axios.get('https://api.xrpscan.com/api/v1/ledger');
    const ledgerIndex = listRes.data.current_ledger;
    const [ledgerRes, txRes] = await Promise.all([
      axios.get(`https://api.xrpscan.com/api/v1/ledger/${ledgerIndex}`),
      axios.get(`https://api.xrpscan.com/api/v1/ledger/${ledgerIndex}/transactions`)
    ]);
    return {
      props: { ledgerData: ledgerRes.data, transactions: txRes.data || [], error: null }
    };
  } catch (error) {
    console.error(error);
    return {
      props: { ledgerData: null, transactions: [], error: 'Failed to fetch ledger data.' }
    };
  }
}

export default LatestLedgerPage;
