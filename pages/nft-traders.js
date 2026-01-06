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

// Styled Components - matching CollectionList pattern
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

const Badge = styled.span`
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  font-weight: 500;
  background: ${({ type }) =>
    type === 'buyer' ? 'rgba(59, 130, 246, 0.12)' :
    type === 'seller' ? 'rgba(239,68,68,0.12)' :
    type === 'both' ? 'rgba(168,85,247,0.12)' : 'rgba(234,179,8,0.12)'};
  color: ${({ type }) =>
    type === 'buyer' ? '#3b82f6' :
    type === 'seller' ? '#ef4444' :
    type === 'both' ? '#a855f7' : '#eab308'};
`;



// Pagination Components
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
  { id: 'combinedProfit', label: 'TOTAL P/L', align: 'right', width: '80px', sortable: true },
  { id: 'profit', label: 'REALIZED', align: 'right', width: '75px', sortable: true },
  { id: 'unrealizedProfit', label: 'UNREALIZED', align: 'right', width: '80px', sortable: true },
  { id: 'roi', label: 'ROI %', align: 'right', width: '55px', sortable: true },
  { id: 'totalTrades', label: 'TRADES', align: 'right', width: '60px', sortable: true },
  { id: 'winRate', label: 'WIN %', align: 'right', width: '55px', sortable: true },
  { id: 'lastActive', label: 'LAST TRADE', align: 'right', width: '80px' },
];

export default function TradersPage({ traders: initialTraders = [] }) {
  const { themeName } = useContext(AppContext);
  const darkMode = themeName === 'XrplToDarkTheme';
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState('combinedProfit');
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const rowsPerPage = 20;

  // Client-side sorting
  const sortedTraders = [...initialTraders].sort((a, b) => {
    const aVal = a[sortBy] ?? 0;
    const bVal = b[sortBy] ?? 0;
    return bVal - aVal;
  });

  const handleSortChange = (key) => {
    setPage(0);
    setSortBy(key);
  };

  const getLastActive = (t) => t.lastTrade ? formatDistanceToNowStrict(new Date(t.lastTrade)) : '-';

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
        <Title darkMode={darkMode}>NFT Traders Leaderboard</Title>
        <Subtitle darkMode={darkMode}>Click column headers to sort</Subtitle>


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
                    const addr = trader._id || trader.address;
                    const cp = trader.combinedProfit || 0;
                    const rp = trader.profit || 0;
                    const up = trader.unrealizedProfit || 0;
                    const roi = trader.roi || 0;
                    return (
                      <tr key={addr || idx}>
                        <StyledTd align="center" darkMode={darkMode} color={darkMode ? 'rgba(255,255,255,0.4)' : '#919EAB'}>
                          {page * rowsPerPage + idx + 1}
                        </StyledTd>
                        <StyledTd darkMode={darkMode}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                            <TraderLink href={`/address/${addr}`}>
                              {addr ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : '-'}
                            </TraderLink>
                            {trader.traderType && <Badge type={trader.traderType}>{trader.traderType}</Badge>}
                          </div>
                        </StyledTd>
                        <StyledTd align="right" darkMode={darkMode} style={{ fontWeight: 500, fontSize: 12 }}>
                          {fVolume(trader.totalVolume || 0)}
                        </StyledTd>
                        <StyledTd align="right" style={{ color: cp >= 0 ? '#10b981' : '#ef4444', fontWeight: 600, fontSize: 12 }}>
                          {cp >= 0 ? '+' : ''}{fVolume(cp)}
                        </StyledTd>
                        <StyledTd align="right" style={{ color: rp >= 0 ? '#10b981' : '#ef4444', fontSize: 11 }}>
                          {rp >= 0 ? '+' : ''}{fVolume(rp)}
                        </StyledTd>
                        <StyledTd align="right" style={{ color: up >= 0 ? '#10b981' : '#ef4444', fontSize: 11, opacity: 0.8 }}>
                          {up >= 0 ? '+' : ''}{fVolume(up)}
                        </StyledTd>
                        <StyledTd align="right" style={{ color: roi >= 0 ? '#10b981' : '#ef4444', fontSize: 11 }}>
                          {roi >= 0 ? '+' : ''}{roi.toFixed(1)}%
                        </StyledTd>
                        <StyledTd align="right" darkMode={darkMode} style={{ fontSize: 11 }}>
                          {fNumber(trader.totalTrades || 0)}
                        </StyledTd>
                        <StyledTd align="right" darkMode={darkMode} style={{ fontSize: 11 }}>
                          {(trader.winRate || 0).toFixed(0)}%
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
    const response = await axios.get(`${BASE_URL}/nft/analytics/traders?sortBy=combinedProfit&limit=100`);
    const traders = response.data.traders || [];
    return { props: { traders } };
  } catch (error) {
    console.error('Failed to fetch traders:', error.message);
    return { props: { traders: [] } };
  }
}
