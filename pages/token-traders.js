import { useState, useContext } from 'react';
import axios from 'axios';
import styled from '@emotion/styled';
import { AppContext } from 'src/AppContext';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import { fNumber, fVolume, formatDistanceToNowStrict } from 'src/utils/formatters';
import Link from 'next/link';

const BASE_URL = 'https://api.xrpl.to/api';

const Container = styled.div`
  max-width: 1920px;
  margin: 0 auto;
  padding: 24px 16px;
`;

const Title = styled.h1`
  font-size: 22px;
  font-weight: 400;
  margin-bottom: 4px;
  color: ${({ darkMode }) => (darkMode ? '#fff' : '#212B36')};
`;

const Subtitle = styled.p`
  font-size: 13px;
  margin-bottom: 24px;
  color: ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.5)' : '#637381')};
`;

const TableContainer = styled.div`
  overflow-x: auto;
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
`;

const StyledTableHead = styled.thead`
  position: sticky;
  top: 0;
  z-index: 10;
  background: ${({ darkMode }) => (darkMode ? '#0a0a0a' : '#ffffff')};
  backdrop-filter: blur(12px);
`;

const StyledTh = styled.th`
  font-weight: 500;
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)')};
  padding: 16px 12px;
  border-bottom: 1px solid ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)')};
  text-align: ${({ align }) => align || 'left'};
  width: ${({ width }) => width || 'auto'};
  cursor: ${({ sortable }) => (sortable ? 'pointer' : 'default')};
  white-space: nowrap;
  font-family: inherit;
  transition: color 0.15s ease;

  &:hover {
    color: ${({ sortable, darkMode }) => (sortable ? '#3b82f6' : (darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.45)'))};
  }
`;

const StyledTbody = styled.tbody`
  tr {
    border-bottom: 1px solid ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')};
    transition: background 0.2s ease;
    &:hover {
      background: ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)')};
    }
  }
`;

const StyledTd = styled.td`
  padding: 18px 12px;
  font-size: 13px;
  letter-spacing: 0.01em;
  color: ${({ color, darkMode }) => color || (darkMode ? '#fff' : '#212B36')};
  text-align: ${({ align }) => align || 'left'};
  vertical-align: middle;
  white-space: nowrap;
`;

const SortIndicator = styled.span`
  display: inline-block;
  margin-left: 4px;
  font-size: 8px;
  color: #3b82f6;
  transform: ${({ direction }) => (direction === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)')};
  transition: transform 0.15s ease;
`;

const TraderLink = styled(Link)`
  color: #3b82f6;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.15s ease;
  &:hover {
    color: #60a5fa;
    text-decoration: underline;
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 16px;
  padding: 6px 10px;
  min-height: 36px;
  border-radius: 8px;
  background: ${({ darkMode }) => (darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)')};
  border: 1px solid ${({ darkMode }) => (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')};
`;

const NavButton = styled.button`
  width: 26px;
  height: 26px;
  border-radius: 5px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ darkMode }) => (darkMode ? '#fff' : '#212B36')};
  transition: background 0.2s ease;

  &:hover:not(:disabled) { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
`;

const PageButton = styled.button`
  min-width: 22px;
  height: 22px;
  border-radius: 5px;
  border: none;
  background: ${({ selected }) => (selected ? '#3b82f6' : 'transparent')};
  color: ${({ selected, darkMode }) => (selected ? '#fff' : (darkMode ? '#fff' : '#212B36'))};
  cursor: pointer;
  font-size: 11px;
  font-weight: ${({ selected }) => (selected ? 500 : 400)};
  padding: 0 4px;
  transition: background 0.2s ease;

  &:hover:not(:disabled) { background: ${({ selected }) => (selected ? '#2563eb' : 'rgba(59, 130, 246, 0.1)')}; }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 64px 16px;
  border-radius: 12px;
  border: 1.5px dashed ${({ darkMode }) => (darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)')};
`;

const TABLE_HEAD = [
  { id: 'rank', label: '#', align: 'center', width: '32px' },
  { id: 'trader', label: 'TRADER', align: 'left', width: '120px' },
  { id: 'totalVolume', label: 'VOLUME', align: 'right', width: '75px', sortable: true },
  { id: 'totalTrades', label: 'TRADES', align: 'right', width: '60px', sortable: true },
  { id: 'buyVolume', label: 'BOUGHT (XRP)', align: 'right', width: '85px', sortable: true, color: 'buy' },
  { id: 'sellVolume', label: 'SOLD (XRP)', align: 'right', width: '85px', sortable: true, color: 'sell' },
  { id: 'dexAmm', label: 'DEX / AMM', align: 'center', width: '100px' },
  { id: 'totalProfit', label: 'P/L', align: 'right', width: '80px', sortable: true },
  { id: 'roi', label: 'ROI %', align: 'right', width: '55px', sortable: true },
  { id: 'winRate', label: 'WIN %', align: 'right', width: '55px', sortable: true },
  { id: 'washTradingScore', label: 'WASH', align: 'right', width: '60px', sortable: true },
  { id: 'lastActive', label: 'LAST TRADE', align: 'right', width: '80px' },
];

export default function TokenTradersPage({ traders: initialTraders = [] }) {
  const { themeName } = useContext(AppContext);
  const darkMode = themeName === 'XrplToDarkTheme';
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState('totalProfit');
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const rowsPerPage = 20;

  const sortedTraders = [...initialTraders].sort((a, b) => {
    const aVal = a[sortBy] ?? 0;
    const bVal = b[sortBy] ?? 0;
    return bVal - aVal;
  });

  const handleSortChange = (key) => {
    setPage(0);
    setSortBy(key);
  };

  const getLastActive = (t) => t.lastTradeDate ? formatDistanceToNowStrict(new Date(t.lastTradeDate)) : '-';

  const paginatedTraders = sortedTraders.slice(page * rowsPerPage, (page + 1) * rowsPerPage);
  const totalPages = Math.ceil(sortedTraders.length / rowsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    const current = page + 1;
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (current <= 3) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages);
    } else if (current >= totalPages - 2) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', current - 1, current, current + 1, '...', totalPages);
    }
    return pages;
  };

  return (
    <div style={{ minHeight: '100vh', overflow: 'hidden' }}>
      <div id="back-to-top-anchor" style={{ height: 24 }} />
      <Header
        notificationPanelOpen={notificationPanelOpen}
        onNotificationPanelToggle={setNotificationPanelOpen}
      />

      <Container>
        <Title darkMode={darkMode}>Token Traders Leaderboard</Title>
        <Subtitle darkMode={darkMode}>Top traders by profit on XRPL DEX</Subtitle>

        {initialTraders.length === 0 ? (
          <EmptyState darkMode={darkMode}>
            <div style={{ fontSize: 16, marginBottom: 8, color: darkMode ? 'rgba(255,255,255,0.6)' : '#637381' }}>
              No Traders Data
            </div>
            <div style={{ fontSize: 13, color: darkMode ? 'rgba(255,255,255,0.4)' : '#919EAB' }}>
              Trader data will appear here when available
            </div>
          </EmptyState>
        ) : (
          <>
            <TableContainer>
              <StyledTable>
                <StyledTableHead darkMode={darkMode}>
                  <tr>
                    {TABLE_HEAD.map((col) => (
                      <StyledTh
                        key={col.id}
                        darkMode={darkMode}
                        align={col.align}
                        width={col.width}
                        sortable={col.sortable}
                        onClick={() => col.sortable && handleSortChange(col.id)}
                        style={sortBy === col.id ? { color: '#3b82f6' } : {}}
                      >
                        {col.label}
                        {sortBy === col.id && <SortIndicator>▼</SortIndicator>}
                      </StyledTh>
                    ))}
                  </tr>
                </StyledTableHead>
                <StyledTbody darkMode={darkMode}>
                  {paginatedTraders.map((trader, idx) => {
                    const addr = trader.address;
                    const tp = trader.totalProfit || 0;
                    const roi = trader.roi || 0;
                    const bought = trader.buyVolume || 0;
                    const sold = trader.sellVolume || 0;
                    return (
                      <tr key={addr || idx}>
                        <StyledTd align="center" darkMode={darkMode} color={darkMode ? 'rgba(255,255,255,0.4)' : '#919EAB'}>
                          {page * rowsPerPage + idx + 1}
                        </StyledTd>
                        <StyledTd darkMode={darkMode}>
                          <TraderLink href={`/address/${addr}`}>
                            {addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '-'}
                          </TraderLink>
                        </StyledTd>
                        <StyledTd align="right" darkMode={darkMode} style={{ fontWeight: 500, fontSize: 12 }}>
                          {fVolume(trader.totalVolume || 0)}
                        </StyledTd>
                        <StyledTd align="right" darkMode={darkMode} style={{ fontSize: 11 }}>
                          {fNumber(trader.totalTrades || 0)}
                        </StyledTd>
                        <StyledTd align="right" style={{ color: '#10b981', fontSize: 12 }}>
                          {fVolume(bought)}
                        </StyledTd>
                        <StyledTd align="right" style={{ color: '#ef4444', fontSize: 12 }}>
                          {fVolume(sold)}
                        </StyledTd>
                        <StyledTd align="center" darkMode={darkMode} style={{ fontSize: 11 }}>
                          {(() => {
                            const dex = trader.dexVolume || 0;
                            const amm = trader.ammVolume || 0;
                            const total = dex + amm;
                            if (total === 0) return '-';
                            const dexPct = Math.round((dex / total) * 100);
                            const ammPct = 100 - dexPct;
                            return (
                              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                                <span style={{ color: '#3b82f6' }}>{dexPct}%</span>
                                <span style={{ color: darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)' }}>/</span>
                                <span style={{ color: '#8b5cf6' }}>{ammPct}%</span>
                              </span>
                            );
                          })()}
                        </StyledTd>
                        <StyledTd align="right" style={{ color: tp >= 0 ? '#10b981' : '#ef4444', fontWeight: 600, fontSize: 12 }}>
                          {tp >= 0 ? '+' : ''}{fVolume(tp)}
                        </StyledTd>
                        <StyledTd align="right" style={{ color: roi >= 0 ? '#10b981' : '#ef4444', fontSize: 11 }}>
                          {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                        </StyledTd>
                        <StyledTd align="right" darkMode={darkMode} style={{ fontSize: 11 }}>
                          {(trader.winRate || 0).toFixed(0)}%
                        </StyledTd>
                        <StyledTd align="right" style={{ fontSize: 11, color: trader.washTradingScore > 0 ? '#f59e0b' : (darkMode ? 'rgba(255,255,255,0.3)' : '#d1d5db') }}>
                          {trader.washTradingScore > 0 ? fNumber(trader.washTradingScore) : '-'}
                        </StyledTd>
                        <StyledTd align="right" darkMode={darkMode} color={darkMode ? 'rgba(255,255,255,0.5)' : '#637381'} style={{ fontSize: 11 }}>
                          {getLastActive(trader)}
                        </StyledTd>
                      </tr>
                    );
                  })}
                </StyledTbody>
              </StyledTable>
            </TableContainer>

            {totalPages > 1 && (
              <PaginationContainer darkMode={darkMode}>
                <NavButton darkMode={darkMode} onClick={() => setPage(0)} disabled={page === 0}>
                  <ChevronsLeft size={12} />
                </NavButton>
                {getPageNumbers().map((p, i) =>
                  p === '...' ? (
                    <span key={`e${i}`} style={{ padding: '0 2px', fontSize: 11 }}>...</span>
                  ) : (
                    <PageButton key={p} selected={p === page + 1} darkMode={darkMode} onClick={() => setPage(p - 1)}>
                      {p}
                    </PageButton>
                  )
                )}
                <NavButton darkMode={darkMode} onClick={() => setPage(totalPages - 1)} disabled={page === totalPages - 1}>
                  <ChevronsRight size={12} />
                </NavButton>
              </PaginationContainer>
            )}
          </>
        )}
      </Container>

      <ScrollToTop />
      <Footer />
    </div>
  );
}

export async function getServerSideProps() {
  try {
    const response = await axios.get(`${BASE_URL}/token/analytics/traders?sortBy=totalProfit&limit=100`);
    const traders = response.data.data || response.data.traders || [];
    return { props: { traders } };
  } catch (error) {
    console.error('Failed to fetch token traders:', error.message);
    return { props: { traders: [] } };
  }
}
