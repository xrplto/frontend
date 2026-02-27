import { useState, useEffect, useContext, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Check, Copy, RefreshCw, ExternalLink } from 'lucide-react';
import { cn } from 'src/utils/cn';
import { ThemeContext } from 'src/context/AppContext';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import { trackExchange } from 'src/components/BridgeTracker';

const BRIDGE_API_URL = 'https://api.xrpl.to/v1/bridge';

const BridgeStatusPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const [txData, setTxData] = useState(null);
  const [txStatus, setTxStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Load from localStorage (cached data for instant display), API fetch sets final loading state
  useEffect(() => {
    if (!id) return;
    const stored = localStorage.getItem(`bridge_tx_${id}`);
    if (stored) {
      try {
        setTxData(JSON.parse(stored));
      } catch (e) {
        console.warn('Failed to parse cached bridge data:', e);
        localStorage.removeItem(`bridge_tx_${id}`);
      }
    }
    // Don't setLoading(false) here — let the API fetch effect handle it
  }, [id]);

  // Fetch status from API
  const fetchStatus = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`${BRIDGE_API_URL}/status?id=${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          setError('Exchange not found');
        } else {
          throw new Error('Failed to fetch status');
        }
        return;
      }
      const data = await res.json();
      setTxStatus(data);
      setError('');
      // Register with global tracker if pending
      if (data.status && !['finished', 'failed', 'refunded', 'expired'].includes(data.status)) {
        trackExchange(id, { fromCurrency: data.fromCurrency, status: data.status });
      }
    } catch (err) {
      setError('Failed to fetch status');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Poll status
  useEffect(() => {
    if (!id) return;
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, [id, fetchStatus]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div
        className={cn(
          'min-h-screen flex items-center justify-center',
          'bg-gray-50 dark:bg-black'
        )}
      >
        <div
          className={cn('text-[13px]', 'text-gray-500 dark:text-[rgba(255,255,255,0.5)]')}
        >
          Loading...
        </div>
      </div>
    );
  }

  const statusOrder = ['waiting', 'confirming', 'exchanging', 'sending', 'finished'];
  const currentStatus = txStatus?.status || 'waiting';
  const currentIdx = statusOrder.indexOf(currentStatus);
  const isFailed = currentStatus === 'failed' || currentStatus === 'refunded';

  return (
    <>
      <Header />
      <div className={cn('min-h-screen py-12 px-4', 'bg-gray-50 dark:bg-black')}>
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <h1
              className={cn(
                'text-[20px] font-normal mb-1',
                'text-gray-900 dark:text-white'
              )}
            >
              Bridge Status
            </h1>
            <p
              className={cn(
                'text-[12px]',
                'text-gray-400 dark:text-[rgba(255,255,255,0.4)]'
              )}
            >
              ID: {id}
            </p>
          </div>

          {error && !txStatus ? (
            <div
              className={cn(
                'rounded-[12px] border p-6 text-center',
                'border-gray-200 bg-white dark:border-[rgba(255,255,255,0.1)] dark:bg-[rgba(255,255,255,0.02)]'
              )}
            >
              <p className="text-[#f44336] text-[13px] mb-4">{error}</p>
              <p
                className={cn(
                  'text-[11px]',
                  'text-gray-400 dark:text-[rgba(255,255,255,0.4)]'
                )}
              >
                This exchange ID may be invalid or expired.
              </p>
            </div>
          ) : (
            <>
              {/* Status Card */}
              <div
                className={cn(
                  'rounded-[12px] border p-5 mb-4',
                  'border-gray-200 bg-white dark:border-[rgba(255,255,255,0.1)] dark:bg-[rgba(255,255,255,0.02)]'
                )}
              >
                <div className="flex items-center justify-between mb-4">
                  <span
                    className={cn(
                      'text-[10px] uppercase tracking-wide',
                      'text-gray-400 dark:text-[rgba(255,255,255,0.4)]'
                    )}
                  >
                    Progress
                  </span>
                  <button
                    onClick={fetchStatus}
                    className={cn(
                      'p-1.5 rounded transition-colors',
                      'hover:bg-gray-100 dark:hover:bg-[rgba(255,255,255,0.05)]'
                    )}
                  >
                    <RefreshCw
                      size={14}
                      className={'text-gray-400 dark:text-[rgba(255,255,255,0.4)]'}
                    />
                  </button>
                </div>

                {/* Status Steps */}
                <div className="flex items-center justify-between mb-4">
                  {[
                    { key: 'waiting', label: 'Waiting' },
                    { key: 'confirming', label: 'Confirming' },
                    { key: 'exchanging', label: 'Exchanging' },
                    { key: 'sending', label: 'Sending' },
                    { key: 'finished', label: 'Done' }
                  ].map((step, idx) => {
                    const stepIdx = statusOrder.indexOf(step.key);
                    const isActive = stepIdx <= currentIdx;
                    const isCurrent = step.key === currentStatus;

                    return (
                      <div key={step.key} className="flex flex-col items-center flex-1">
                        <div
                          className={cn(
                            'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-medium mb-1.5 transition-colors',
                            isFailed
                              ? 'bg-[rgba(244,67,54,0.15)] text-[#f44336]'
                              : isActive
                                ? 'bg-[rgba(34,197,94,0.15)] text-[#22c55e]'
                                : 'bg-gray-100 text-gray-400 dark:bg-[rgba(255,255,255,0.05)] dark:text-[rgba(255,255,255,0.3)]'
                          )}
                        >
                          {isActive && !isFailed ? <Check size={14} /> : idx + 1}
                        </div>
                        <span
                          className={cn(
                            'text-[9px]',
                            isCurrent
                              ? 'text-gray-900 dark:text-white'
                              : isActive
                                ? 'text-[#22c55e]'
                                : 'text-gray-400 dark:text-[rgba(255,255,255,0.3)]'
                          )}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Status Messages */}
                {currentStatus === 'waiting' && txStatus?.validUntil && (
                  <div className="text-center p-3 rounded-lg bg-[rgba(59,130,246,0.1)]">
                    <p
                      className={cn(
                        'text-[12px]',
                        'text-gray-600 dark:text-[rgba(255,255,255,0.6)]'
                      )}
                    >
                      Waiting for deposit. Expires {new Date(txStatus.validUntil).toLocaleString()}
                    </p>
                  </div>
                )}
                {currentStatus === 'waiting' && !txStatus?.validUntil && (
                  <div className="text-center p-3 rounded-lg bg-[rgba(59,130,246,0.1)]">
                    <p
                      className={cn(
                        'text-[12px]',
                        'text-gray-600 dark:text-[rgba(255,255,255,0.6)]'
                      )}
                    >
                      Send funds to the deposit address to start the exchange
                    </p>
                  </div>
                )}
                {currentStatus === 'finished' && (
                  <div className="text-center p-3 rounded-lg bg-[rgba(34,197,94,0.1)]">
                    <p className="text-[#22c55e] text-[12px]">
                      Exchange complete! XRP has been sent.
                    </p>
                  </div>
                )}
                {currentStatus === 'failed' && (
                  <div className="text-center p-3 rounded-lg bg-[rgba(244,67,54,0.1)]">
                    <p className="text-[#f44336] text-[12px]">
                      Exchange failed. Please contact support.
                    </p>
                  </div>
                )}
                {currentStatus === 'refunded' && (
                  <div className="text-center p-3 rounded-lg bg-[rgba(255,152,0,0.1)]">
                    <p className="text-[#FF9800] text-[12px]">
                      Funds have been refunded to sender.
                    </p>
                  </div>
                )}
                {currentStatus === 'expired' && (
                  <div className="text-center p-3 rounded-lg bg-[rgba(255,152,0,0.1)]">
                    <p className="text-[#FF9800] text-[12px]">
                      Exchange expired. No deposit was received.
                    </p>
                  </div>
                )}
              </div>

              {/* Exchange Details */}
              {(txData || txStatus) && (
                <div
                  className={cn(
                    'rounded-[12px] border p-5',
                    'border-gray-200 bg-white dark:border-[rgba(255,255,255,0.1)] dark:bg-[rgba(255,255,255,0.02)]'
                  )}
                >
                  <p
                    className={cn(
                      'text-[10px] uppercase tracking-wide mb-3',
                      'text-gray-400 dark:text-[rgba(255,255,255,0.4)]'
                    )}
                  >
                    Details
                  </p>

                  <div className="space-y-3">
                    {/* Exchange */}
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'text-[12px]',
                          'text-gray-600 dark:text-[rgba(255,255,255,0.6)]'
                        )}
                      >
                        Exchange
                      </span>
                      <span
                        className={cn(
                          'text-[12px] font-medium',
                          'text-gray-900 dark:text-white'
                        )}
                      >
                        {txStatus?.amountFrom || txStatus?.expectedAmountFrom || '?'}{' '}
                        {txStatus?.fromCurrency?.toUpperCase() || '?'} →{' '}
                        {txStatus?.amountTo || txStatus?.expectedAmountTo || '~'}{' '}
                        {txStatus?.toCurrency?.toUpperCase() || 'XRP'}
                      </span>
                    </div>

                    {/* Deposit Address */}
                    {txStatus?.payinAddress && (
                      <div>
                        <p
                          className={cn(
                            'text-[10px] mb-1',
                            'text-gray-400 dark:text-[rgba(255,255,255,0.4)]'
                          )}
                        >
                          Deposit Address
                        </p>
                        <div
                          className={cn(
                            'flex items-center justify-between rounded-[8px] border px-3 py-2',
                            'border-gray-100 bg-gray-50 dark:border-[rgba(255,255,255,0.08)] dark:bg-[rgba(0,0,0,0.2)]'
                          )}
                        >
                          <span
                            className={cn(
                              'font-mono text-[10px] truncate mr-2',
                              'text-gray-700 dark:text-[rgba(255,255,255,0.7)]'
                            )}
                          >
                            {txStatus.payinAddress}
                          </span>
                          <button
                            onClick={() => copyToClipboard(txStatus.payinAddress)}
                            className={cn(
                              'flex-shrink-0 p-1 rounded',
                              'hover:bg-gray-100 dark:hover:bg-[rgba(255,255,255,0.05)]'
                            )}
                          >
                            {copied ? (
                              <Check size={12} className="text-[#22c55e]" />
                            ) : (
                              <Copy
                                size={12}
                                className={
                                  'text-gray-400 dark:text-[rgba(255,255,255,0.4)]'
                                }
                              />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Payout Address */}
                    {txStatus?.payoutAddress && (
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            'text-[10px]',
                            'text-gray-400 dark:text-[rgba(255,255,255,0.4)]'
                          )}
                        >
                          XRP Destination
                        </span>
                        <span
                          className={cn(
                            'font-mono text-[10px]',
                            'text-gray-700 dark:text-[rgba(255,255,255,0.7)]'
                          )}
                        >
                          {txStatus.payoutAddress.slice(0, 8)}...{txStatus.payoutAddress.slice(-6)}
                        </span>
                      </div>
                    )}

                    {/* Payin Hash */}
                    {txStatus?.payinHash && (
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            'text-[10px]',
                            'text-gray-400 dark:text-[rgba(255,255,255,0.4)]'
                          )}
                        >
                          Deposit TX
                        </span>
                        <span
                          className={cn(
                            'font-mono text-[10px]',
                            'text-gray-700 dark:text-[rgba(255,255,255,0.7)]'
                          )}
                        >
                          {txStatus.payinHash.slice(0, 12)}...
                        </span>
                      </div>
                    )}

                    {/* Payout Hash */}
                    {txStatus?.payoutHash && (
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            'text-[10px]',
                            'text-gray-400 dark:text-[rgba(255,255,255,0.4)]'
                          )}
                        >
                          XRP TX
                        </span>
                        <a
                          href={`https://xrpl.to/tx/${txStatus.payoutHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[#3b82f6] text-[10px] hover:underline font-mono"
                        >
                          {txStatus.payoutHash.slice(0, 12)}...
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    )}

                    {/* Created */}
                    {txStatus?.createdAt && (
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            'text-[10px]',
                            'text-gray-400 dark:text-[rgba(255,255,255,0.4)]'
                          )}
                        >
                          Created
                        </span>
                        <span
                          className={cn(
                            'text-[10px]',
                            'text-gray-600 dark:text-[rgba(255,255,255,0.6)]'
                          )}
                        >
                          {new Date(txStatus.createdAt).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Updated */}
                    {txStatus?.updatedAt && txStatus.updatedAt !== txStatus.createdAt && (
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            'text-[10px]',
                            'text-gray-400 dark:text-[rgba(255,255,255,0.4)]'
                          )}
                        >
                          Updated
                        </span>
                        <span
                          className={cn(
                            'text-[10px]',
                            'text-gray-600 dark:text-[rgba(255,255,255,0.6)]'
                          )}
                        >
                          {new Date(txStatus.updatedAt).toLocaleString()}
                        </span>
                      </div>
                    )}

                    {/* Deposit Received */}
                    {txStatus?.depositReceivedAt && (
                      <div className="flex items-center justify-between">
                        <span
                          className={cn(
                            'text-[10px]',
                            'text-gray-400 dark:text-[rgba(255,255,255,0.4)]'
                          )}
                        >
                          Deposit Received
                        </span>
                        <span
                          className={cn(
                            'text-[10px]',
                            'text-gray-600 dark:text-[rgba(255,255,255,0.6)]'
                          )}
                        >
                          {new Date(txStatus.depositReceivedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default BridgeStatusPage;

export async function getServerSideProps() {
  return {
    props: {
      ogp: {
        canonical: 'https://xrpl.to/bridge',
        title: 'Bridge | Cross-Chain Token Bridge',
        url: 'https://xrpl.to/bridge',
        imgUrl: 'https://xrpl.to/api/og/bridge',
        imgType: 'image/png',
        desc: 'Bridge tokens across chains to and from the XRP Ledger.'
      }
    }
  };
}
