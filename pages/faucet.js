import React, { useContext, useState } from 'react';
import styled from '@emotion/styled';
import { AppContext } from 'src/context/AppContext';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import { Droplets, Loader2, CheckCircle, XCircle } from 'lucide-react';

const API_URL = 'https://api.xrpl.to/v1';

const PageWrapper = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Container = styled.div`
  max-width: 600px;
  margin: 0 auto;
  padding: 40px 16px;
  flex: 1;
`;

const Title = styled.h1`
  font-size: 2rem;
  font-weight: 600;
  text-align: center;
  margin-bottom: 8px;
  color: ${p => p.isDark ? '#fff' : '#000'};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
`;

const Subtitle = styled.p`
  text-align: center;
  color: ${p => p.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'};
  margin-bottom: 32px;
  font-size: 14px;
`;

const Card = styled.div`
  background: ${p => p.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'};
  border: 1px solid ${p => p.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
  border-radius: 12px;
  padding: 24px;
`;

const Label = styled.label`
  display: block;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 8px;
  color: ${p => p.isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  font-size: 14px;
  border-radius: 8px;
  border: 1px solid ${p => p.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'};
  background: ${p => p.isDark ? 'rgba(0,0,0,0.3)' : '#fff'};
  color: ${p => p.isDark ? '#fff' : '#000'};
  outline: none;
  font-family: monospace;

  &:focus {
    border-color: #3b82f6;
  }

  &::placeholder {
    color: ${p => p.isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'};
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 14px;
  margin-top: 16px;
  font-size: 14px;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  background: #3b82f6;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover:not(:disabled) {
    background: #2563eb;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Message = styled.div`
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  display: flex;
  align-items: flex-start;
  gap: 10px;

  ${p => p.success && `
    background: rgba(34, 197, 94, 0.1);
    border: 1px solid rgba(34, 197, 94, 0.3);
    color: #22c55e;
  `}

  ${p => p.error && `
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid rgba(239, 68, 68, 0.3);
    color: #ef4444;
  `}
`;

const Info = styled.div`
  margin-top: 24px;
  padding: 16px;
  background: ${p => p.isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'};
  border-radius: 8px;
  font-size: 13px;
  color: ${p => p.isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'};
  line-height: 1.6;
`;

const TxLink = styled.a`
  color: #3b82f6;
  text-decoration: none;
  word-break: break-all;

  &:hover {
    text-decoration: underline;
  }
`;

export default function FaucetPage() {
  const { darkMode } = useContext(AppContext);
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
        <Title isDark={darkMode}>
          <Droplets size={32} color="#3b82f6" />
          Testnet Faucet
        </Title>
        <Subtitle isDark={darkMode}>
          Get free XRP for development and testing on XRPL Testnet<br />
          <code style={{ fontSize: 11, opacity: 0.7 }}>wss://s.altnet.rippletest.net:51233</code>
        </Subtitle>

        <Card isDark={darkMode}>
          <form onSubmit={handleSubmit}>
            <Label isDark={darkMode}>Your Testnet Wallet Address</Label>
            <Input
              isDark={darkMode}
              type="text"
              placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={loading}
            />
            <Button type="submit" disabled={loading || !address.trim()}>
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
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
              <CheckCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
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
              <XCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
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

        <Info isDark={darkMode}>
          <strong>Testnet Only:</strong> This faucet provides XRP on the XRPL Testnet network only (no real value).<br /><br />
          <strong>Server:</strong> <code>wss://s.altnet.rippletest.net:51233</code><br />
          <strong>Limit:</strong> 200 XRP per address every 24 hours
        </Info>
      </Container>
      <Footer />
    </PageWrapper>
  );
}
