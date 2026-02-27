import React, { useState } from 'react';
import { cn } from 'src/utils/cn';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import { Droplets, Loader2, CheckCircle, XCircle } from 'lucide-react';

const API_URL = 'https://api.xrpl.to/v1';

const PageWrapper = ({ className, children, ...p }) => (
  <div className={cn('min-h-screen flex flex-col', className)} {...p}>
    {children}
  </div>
);

const Container = ({ className, children, ...p }) => (
  <div
    className={cn('max-w-[600px] mx-auto flex-1 py-10 px-4', className)}
    {...p}
  >
    {children}
  </div>
);

const Title = ({ className, children, ...p }) => (
  <h1
    className={cn(
      'text-[2rem] font-semibold text-center mb-2 flex items-center justify-center gap-3',
      'text-black dark:text-white',
      className
    )}
    {...p}
  >
    {children}
  </h1>
);

const Subtitle = ({ className, children, ...p }) => (
  <p
    className={cn('text-center mb-8 text-sm', 'text-black/50 dark:text-white/50', className)}
    {...p}
  >
    {children}
  </p>
);

const Card = ({ className, children, ...p }) => (
  <div
    className={cn(
      'rounded-xl p-6 border',
      'bg-black/[0.02] border-black/10 dark:bg-white/[0.03] dark:border-white/10',
      className
    )}
    {...p}
  >
    {children}
  </div>
);

const Label = ({ className, children, ...p }) => (
  <label
    className={cn('block text-xs font-medium mb-2 uppercase tracking-[0.5px]', 'text-black/70 dark:text-white/70', className)}
    {...p}
  >
    {children}
  </label>
);

const Input = ({ className, ...p }) => (
  <input
    className={cn(
      'w-full px-4 py-3 text-sm rounded-lg outline-none font-mono border focus:border-[#3b82f6]',
      'border-black/[0.15] bg-white text-black dark:border-white/[0.15] dark:bg-[rgba(0,0,0,0.3)] dark:text-white',
      className
    )}
    {...p}
  />
);

const Button = ({ className, children, ...p }) => (
  <button
    className={cn(
      'w-full py-3.5 mt-4 text-sm font-semibold rounded-lg border-none bg-[#3b82f6] text-white cursor-pointer flex items-center justify-center gap-2',
      'hover:enabled:bg-[#2563eb]',
      'disabled:opacity-60 disabled:cursor-not-allowed',
      className
    )}
    {...p}
  >
    {children}
  </button>
);

const Message = ({ className, children, success, error, ...p }) => (
  <div
    className={cn(
      'mt-4 p-3 px-4 rounded-lg text-[13px] flex items-start gap-2.5 border',
      success && 'bg-green-500/10 border-green-500/30 text-green-500',
      error && 'bg-red-500/10 border-red-500/30 text-red-500',
      className
    )}
    {...p}
  >
    {children}
  </div>
);

const Info = ({ className, children, ...p }) => (
  <div
    className={cn(
      'mt-6 p-4 rounded-lg text-[13px] leading-relaxed',
      'bg-blue-500/5 text-black/60 dark:bg-blue-500/10 dark:text-white/60',
      className
    )}
    {...p}
  >
    {children}
  </div>
);

const TxLink = ({ className, children, ...p }) => (
  <a
    className={cn(
      'text-[#3b82f6] no-underline break-all hover:underline',
      className
    )}
    {...p}
  >
    {children}
  </a>
);

export default function FaucetPage() {
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!address.trim() || loading) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`${API_URL}/faucet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: address.trim() })
      });
      const data = await res.json();

      if (data.success) {
        setResult({ success: true, hash: data.hash, amount: data.amount });
        setAddress('');
      } else {
        setResult({ error: data.error, retryAfter: data.retryAfterSeconds });
      }
    } catch (err) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const formatCooldown = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${mins}m`;
  };

  return (
    <PageWrapper>
      <Header />
      <Container>
        <Title>
          <Droplets size={32} color="#3b82f6" />
          Testnet Faucet
        </Title>
        <Subtitle>
          Get free XRP for development and testing on XRPL Testnet<br />
          <code className="text-[11px] opacity-70">wss://s.altnet.rippletest.net:51233</code>
        </Subtitle>

        <Card>
          <form onSubmit={handleSubmit}>
            <Label>Your Testnet Wallet Address</Label>
            <Input
              type="text"
              placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !address.trim()}>
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Droplets size={18} />
                  Request 200 XRP
                </>
              )}
            </Button>
          </form>

          {result?.success && (
            <Message success>
              <CheckCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                <strong>Success!</strong> Sent {result.amount} XRP<br />
                <TxLink
                  href={`https://testnet.xrpl.org/transactions/${result.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View transaction: {result.hash.slice(0, 20)}...
                </TxLink>
              </div>
            </Message>
          )}

          {result?.error && (
            <Message error>
              <XCircle size={18} className="shrink-0 mt-0.5" />
              <div>
                {result.error === 'cooldown active' ? (
                  <>
                    <strong>Cooldown Active</strong><br />
                    This address already received XRP. Try again in {formatCooldown(result.retryAfter)}.
                  </>
                ) : (
                  <>
                    <strong>Error:</strong> {result.error}
                  </>
                )}
              </div>
            </Message>
          )}
        </Card>

        <Info>
          <strong>Testnet Only:</strong> This faucet provides XRP on the XRPL Testnet network only (no real value).<br /><br />
          <strong>Server:</strong> <code>wss://s.altnet.rippletest.net:51233</code><br />
          <strong>Limit:</strong> 200 XRP per address every 24 hours
        </Info>
      </Container>
      <Footer />
    </PageWrapper>
  );
}

export async function getStaticProps() {
  return {
    props: {
      ogp: {
        canonical: 'https://xrpl.to/faucet',
        title: 'Faucet | Get Testnet XRP',
        url: 'https://xrpl.to/faucet',
        imgUrl: 'https://xrpl.to/api/og/faucet',
        imgType: 'image/png',
        desc: 'Get free testnet XRP for development and testing on the XRP Ledger.'
      }
    }
  };
}
