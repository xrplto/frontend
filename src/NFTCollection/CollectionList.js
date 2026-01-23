import axios from 'axios';
import React, { useState, useEffect, useContext, useCallback, memo, useRef } from 'react';
import styled from '@emotion/styled';
import { AppContext } from 'src/context/AppContext';
import { formatMonthYearDate, fNumber, fIntNumber, fVolume, normalizeCollectionName } from 'src/utils/formatters';
import { ChevronLeft, ChevronRight, ChevronDown, List } from 'lucide-react';
import { cn } from 'src/utils/cn';
import NFTSparklineChart from './NFTSparklineChart';

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 0;
  margin: 0;
  contain: layout style;
  overflow: visible;
`;

const TableContainer = styled.div`
  display: flex;
  justify-content: flex-start;
  gap: 0;
  padding: 0;
  overflow-x: auto;
  overflow-y: visible;
  width: 100%;
  min-width: 0;
  scrollbar-width: none;
  box-sizing: border-box;
  background: transparent;
  border: 1.5px solid
    ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)')};
  border-radius: 12px;
  backdrop-filter: blur(12px);

  &::-webkit-scrollbar {
    display: none;
  }
`;

const StyledTable = styled.table`
  table-layout: fixed;
  width: 100%;
  border-collapse: collapse;
  contain: layout style;
  margin: 0;
  padding: 0;
`;

const StyledTableBody = styled.tbody`
  margin: 0;
  padding: 0;

  tr {
    margin: 0;
    padding: 0;

    &:hover {
      background: ${(props) =>
        props.darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)'};
    }
  }
`;

const StyledRow = styled.tr`
  border-bottom: 1.5px solid
    ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)')};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: ${(props) =>
      props.darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)'};
  }
`;

const StyledCell = styled.td`
  padding: 14px 8px;
  white-space: ${(props) => (props.isCollectionColumn ? 'normal' : 'nowrap')};
  text-align: ${(props) => props.align || 'left'};
  font-size: 14px;
  font-weight: ${(props) => props.fontWeight || 400};
  color: ${(props) => props.color || (props.darkMode ? 'rgba(255, 255, 255, 0.9)' : '#1a1a1a')};
  vertical-align: middle;
  width: ${(props) => props.width || 'auto'};
  min-width: ${(props) => (props.isCollectionColumn ? '200px' : 'auto')};
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;

  &:first-of-type {
    padding-left: 12px;
  }

  &:last-of-type {
    padding-right: 4px;
  }
`;

// Mobile components
const MobileCollectionCard = styled.div`
  display: flex;
  width: 100%;
  padding: 10px 12px;
  border-bottom: 1.5px solid
    ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)')};
  cursor: pointer;
  box-sizing: border-box;
  align-items: center;
  transition: all 0.15s ease;

  &:hover {
    background: ${(props) =>
      props.darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)'};
  }
`;

const MobileCollectionInfo = styled.div`
  flex: 2;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 4px;
  min-width: 0;
`;

const MobileCell = styled.div`
  flex: ${(props) => props.flex || 1};
  text-align: ${(props) => props.align || 'right'};
  padding: 0 6px;
  font-weight: ${(props) => props.fontWeight || 400};
  font-size: 14px;
  color: ${(props) => props.color || (props.darkMode ? 'rgba(255, 255, 255, 0.9)' : '#1a1a1a')};
  min-width: ${(props) => props.minWidth || 'auto'};
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
  ${(props) => props.wordBreak && `word-break: ${props.wordBreak};`}
  ${(props) => props.lineHeight && `line-height: ${props.lineHeight};`}
`;

const CollectionImage = styled.div`
  width: ${(props) => (props.isMobile ? '28px' : '36px')};
  height: ${(props) => (props.isMobile ? '28px' : '36px')};
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  background: ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)')};
`;

const CollectionDetails = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const CollectionName = styled.span`
  font-weight: 500;
  font-size: ${(props) => (props.isMobile ? '14px' : '15px')};
  color: ${(props) => (props.darkMode ? '#FFFFFF' : '#1a1a1a')};
  max-width: ${(props) => (props.isMobile ? '120px' : '180px')};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  line-height: 1.4;
  font-family: var(--font-sans);
`;

const CollectionSubtext = styled.span`
  font-size: ${(props) => (props.isMobile ? '12px' : '13px')};
  color: ${(props) => (props.darkMode ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.5)')};
  font-weight: 400;
  display: block;
  max-width: ${(props) => (props.isMobile ? '120px' : '180px')};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
  text-transform: uppercase;
  font-family: var(--font-sans);
`;

// Toolbar styled components
const StyledToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  gap: 8px;
  flex-wrap: wrap;
  border-top: 1.5px solid
    ${({ darkMode }) => (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)')};
  background: transparent;

  @media (max-width: 900px) {
    flex-direction: row;
    align-items: stretch;
    flex-wrap: wrap;
    gap: 4px;
    padding: 10px 12px;
  }
`;

const RowsSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0;
  min-height: 32px;
  background: transparent;
  border: none;

  @media (max-width: 900px) {
    flex: 1;
    min-width: calc(50% - 8px);
    justify-content: center;
    gap: 4px;
  }
`;

const Text = styled.span`
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: ${({ darkMode }) => (darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(33, 43, 54, 0.6)')};
  font-weight: ${(props) => props.fontWeight || 400};
`;

const NavButton = styled.button`
  width: 26px;
  height: 26px;
  border-radius: 12px;
  border: 1.5px solid
    ${({ darkMode }) => (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)')};
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ darkMode }) => (darkMode ? '#ffffff' : '#212B36')};
  padding: 0;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    border-color: ${({ darkMode }) =>
      darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'};
    background: ${({ darkMode }) =>
      darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)'};
  }

  &:disabled {
    color: ${({ darkMode }) => (darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(33, 43, 54, 0.3)')};
    cursor: not-allowed;
  }
`;

const PageButton = styled.button`
  min-width: 22px;
  height: 22px;
  border-radius: 12px;
  border: 1.5px solid
    ${(props) =>
      props.selected
        ? '#4285f4'
        : props.darkMode
          ? 'rgba(255, 255, 255, 0.1)'
          : 'rgba(0, 0, 0, 0.06)'};
  background: ${(props) => (props.selected ? '#4285f4' : 'transparent')};
  color: ${(props) => (props.selected ? 'white' : props.darkMode ? '#ffffff' : '#212B36')};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  margin: 0;
  font-size: 11px;
  font-weight: ${(props) => (props.selected ? 500 : 400)};
  font-variant-numeric: tabular-nums;
  transition: all 0.15s ease;

  &:hover:not(:disabled) {
    border-color: ${(props) =>
      props.selected
        ? '#1976D2'
        : props.darkMode
          ? 'rgba(255, 255, 255, 0.15)'
          : 'rgba(0, 0, 0, 0.1)'};
    background: ${(props) =>
      props.selected
        ? '#1976D2'
        : props.darkMode
          ? 'rgba(255, 255, 255, 0.02)'
          : 'rgba(0, 0, 0, 0.01)'};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.3;
  }
`;

const Select = styled.div`
  position: relative;
  display: inline-block;
`;

const SelectButton = styled.button`
  background: transparent;
  border: none;
  color: #4285f4;
  font-weight: 500;
  font-size: 11px;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 36px;

  &:hover {
    background: rgba(66, 133, 244, 0.04);
    border-radius: 4px;
    padding: 2px 4px;
    margin: -2px -4px;
  }
`;

const SelectMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: transparent;
  border: 1.5px solid
    ${({ darkMode }) => (darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)')};
  border-radius: 12px;
  z-index: 1000;
  min-width: 50px;
  backdrop-filter: blur(12px);
`;

const SelectOption = styled.button`
  display: block;
  width: 100%;
  padding: 4px 10px;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font-size: 11px;
  color: ${({ darkMode }) => (darkMode ? '#ffffff' : '#212B36')};

  &:hover {
    background: rgba(66, 133, 244, 0.04);
  }
`;

const CenterBox = styled.div`
  flex-grow: 1;
  display: flex;
  justify-content: center;
`;

const StyledTableHead = styled.thead`
  position: sticky;
  top: ${(props) => props.scrollTopLength || 0}px;
  z-index: 100;
  background: transparent;
  backdrop-filter: blur(12px);
`;

const StyledTableCell = styled.th`
  font-weight: 500;
  font-size: 11px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.55)')};
  padding: 14px 8px;
  border-bottom: 1.5px solid
    ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)')};
  white-space: ${(props) => (props.isCollectionColumn ? 'normal' : 'nowrap')};
  text-align: ${(props) => props.align || 'left'};
  width: ${(props) => props.width || 'auto'};
  min-width: ${(props) => (props.isCollectionColumn ? '200px' : props.width || 'auto')};
  box-sizing: border-box;
  cursor: ${(props) => (props.sortable ? 'pointer' : 'default')};
  font-family: inherit;
  transition: all 0.15s ease;

  &:first-of-type {
    padding-left: 12px;
  }

  &:last-of-type {
    padding-right: 12px;
  }

  &:hover {
    color: ${(props) =>
      props.sortable
        ? props.darkMode
          ? 'rgba(255, 255, 255, 0.8)'
          : 'rgba(0, 0, 0, 0.8)'
        : 'inherit'};
  }
`;

const SortIndicator = styled.span`
  display: inline-block;
  margin-left: 6px;
  font-size: 8px;
  color: ${(props) =>
    props.active
      ? '#4285f4'
      : props.darkMode
        ? 'rgba(255, 255, 255, 0.25)'
        : 'rgba(0, 0, 0, 0.25)'};
  transform: ${(props) => (props.direction === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)')};
  opacity: ${(props) => (props.active ? 1 : 0.5)};
  transition:
    transform 0.15s ease,
    color 0.15s ease;
`;

const MobileContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
  margin: 0;
  background: transparent;
  border: 1.5px solid
    ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)')};
  border-radius: 12px;
  backdrop-filter: blur(12px);
`;

const StyledMobileHeader = styled.div`
  display: flex;
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  backdrop-filter: blur(12px);
  border-bottom: 1.5px solid
    ${(props) => (props.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)')};
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${(props) => (props.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.55)')};
  position: sticky;
  top: 0;
  z-index: 10;
  box-sizing: border-box;
`;

const StyledHeaderCell = styled.div`
  flex: ${(props) => props.flex || 1};
  text-align: ${(props) => props.align || 'left'};
  padding: 0 6px;
  cursor: ${(props) => (props.sortable ? 'pointer' : 'default')};
  transition: color 0.15s ease;

  &:hover {
    color: ${(props) =>
      props.sortable && (props.isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)')};
  }
`;

// Table Head Configuration
const TABLE_HEAD_MOBILE = [
  { id: 'name', label: 'COLLECTION', align: 'left', width: '40%', order: false },
  {
    id: 'floor',
    label: 'FLOOR',
    align: 'right',
    width: '20%',
    order: true,
    tooltip: 'Floor price in XRP'
  },
  {
    id: 'floor1dPercent',
    label: '24H %',
    align: 'right',
    width: '20%',
    order: true,
    tooltip: '24h floor price change'
  },
  {
    id: 'totalVolume',
    label: 'VOLUME',
    align: 'right',
    width: '20%',
    order: true,
    tooltip: 'All-time trading volume'
  }
];

const TABLE_HEAD_DESKTOP = [
  { id: 'rank', label: '#', align: 'center', width: '40px', order: false },
  { id: 'name', label: 'COLLECTION', align: 'left', width: '220px', order: false },
  {
    id: 'floor',
    label: 'FLOOR',
    align: 'right',
    width: 'auto',
    order: true,
    tooltip: 'Floor price in XRP'
  },
  {
    id: 'sparkline',
    label: 'TRENDLINE',
    align: 'center',
    width: '140px',
    order: false,
    tooltip: '7-day floor price trend'
  },
  {
    id: 'floor1dPercent',
    label: '24H %',
    align: 'right',
    width: 'auto',
    order: true,
    tooltip: '24h floor price change'
  },
  {
    id: 'totalVol24h',
    label: 'VOL 24H',
    align: 'right',
    width: 'auto',
    order: true,
    tooltip: '24h trading volume'
  },
  {
    id: 'totalVolume',
    label: 'VOL ALL',
    align: 'right',
    width: 'auto',
    order: true,
    tooltip: 'All-time trading volume'
  },
  {
    id: 'created',
    label: 'CREATED',
    align: 'right',
    width: 'auto',
    order: true,
    tooltip: 'Collection creation date'
  },
  {
    id: 'sales24h',
    label: 'SALES 24H',
    align: 'right',
    width: 'auto',
    order: true,
    tooltip: '24h sales count'
  },
  {
    id: 'totalSales',
    label: 'SALES ALL',
    align: 'right',
    width: 'auto',
    order: true,
    tooltip: 'Total sales count'
  },
  {
    id: 'marketcap.amount',
    label: 'MARKET CAP',
    align: 'right',
    width: 'auto',
    order: true,
    tooltip: 'Floor price × supply'
  },
  {
    id: 'listedCount',
    label: 'LISTED',
    align: 'right',
    width: 'auto',
    order: true,
    tooltip: 'NFTs listed for sale'
  },
  {
    id: 'owners',
    label: 'OWNERS',
    align: 'right',
    width: 'auto',
    order: true,
    tooltip: 'Unique holders'
  },
  {
    id: 'items',
    label: 'SUPPLY',
    align: 'right',
    width: 'auto',
    order: true,
    tooltip: 'Total NFTs in collection'
  },
  {
    id: 'origin',
    label: 'SOURCE',
    align: 'right',
    width: 'auto',
    order: true,
    tooltip: 'Origin marketplace'
  }
];

// ListHead Component
const ListHead = memo(
  ({ order, orderBy, onRequestSort, scrollTopLength = 0, darkMode, isMobile }) => {
    const createSortHandler = useCallback(
      (id) => (event) => {
        onRequestSort(event, id);
      },
      [onRequestSort]
    );

    const TABLE_HEAD = isMobile ? TABLE_HEAD_MOBILE : TABLE_HEAD_DESKTOP;

    // Render label with badge style for time periods
    const renderLabel = (headCell) => {
      const badgeStyle = { opacity: 0.5, fontSize: '10px' };

      switch (headCell.id) {
        case 'totalVol24h':
          return (
            <>
              Volume <span style={badgeStyle}>24h</span>
            </>
          );
        case 'totalVolume':
          return (
            <>
              Volume <span style={badgeStyle}>All</span>
            </>
          );
        case 'sales24h':
          return (
            <>
              Sales <span style={badgeStyle}>24h</span>
            </>
          );
        case 'totalSales':
          return (
            <>
              Sales <span style={badgeStyle}>All</span>
            </>
          );
        case 'sparkline':
          return (
            <>
              Trendline <span style={badgeStyle}>7d</span>
            </>
          );
        case 'floor1dPercent':
          return (
            <>
              Change <span style={badgeStyle}>24h</span>
            </>
          );
        default:
          return headCell.label;
      }
    };

    return (
      <StyledTableHead scrollTopLength={scrollTopLength} darkMode={darkMode}>
        <tr>
          {TABLE_HEAD.map((headCell) => (
            <StyledTableCell
              key={headCell.id}
              align={headCell.align}
              width={headCell.width}
              darkMode={darkMode}
              sortable={headCell.order}
              isCollectionColumn={headCell.id === 'name'}
              onClick={headCell.order ? createSortHandler(headCell.id) : undefined}
              style={headCell.style || {}}
            >
              {headCell.order ? (
                <span>
                  {renderLabel(headCell)}
                  {orderBy === headCell.id && (
                    <SortIndicator active={true} direction={order} darkMode={darkMode}>
                      ▼
                    </SortIndicator>
                  )}
                </span>
              ) : (
                renderLabel(headCell)
              )}
            </StyledTableCell>
          ))}
        </tr>
      </StyledTableHead>
    );
  }
);

// Optimized image component
const OptimizedImage = memo(
  ({ src, alt, size }) => {
    const [imgSrc, setImgSrc] = useState(src);

    const handleError = useCallback(() => {
      setImgSrc('/static/alt.webp');
    }, []);

    return (
      <div style={{ width: size, height: size, borderRadius: '4px', overflow: 'hidden' }}>
        <img
          src={imgSrc}
          alt={alt}
          onError={handleError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block'
          }}
        />
      </div>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.src === nextProps.src && prevProps.size === nextProps.size;
  }
);

OptimizedImage.displayName = 'OptimizedImage';

// Mobile Collection Row Component
const MobileCollectionRow = ({ collection, darkMode, handleRowClick }) => {
  const { name, slug, logoImage, floor, floor1dPercent, totalVolume } = collection;

  const collectionName = normalizeCollectionName(name);
  const logoImageUrl = `https://s1.xrpl.to/nft-collection/${logoImage}`;
  const floorPrice = floor || 0;
  const floorChangePercent = floor1dPercent || 0;

  const getFloorChangeColor = (percent) => {
    if (percent > 0) return '#22a86b';
    if (percent < 0) return '#c75050';
    return darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
  };

  const formatFloorChange = (percent) => {
    if (percent === 0) return '0%';
    const sign = percent > 0 ? '+' : '';
    return `${sign}${percent.toFixed(1)}%`;
  };

  return (
    <MobileCollectionCard onClick={handleRowClick} darkMode={darkMode}>
      <MobileCollectionInfo>
        <CollectionImage isMobile={true} darkMode={darkMode}>
          <OptimizedImage src={logoImageUrl} alt={collectionName} size={28} />
        </CollectionImage>
        <CollectionDetails>
          <CollectionName isMobile={true} darkMode={darkMode}>
            {collectionName}
          </CollectionName>
          <CollectionSubtext isMobile={true} darkMode={darkMode}>
            {slug}
          </CollectionSubtext>
        </CollectionDetails>
      </MobileCollectionInfo>

      <MobileCell flex={1.2} align="right" darkMode={darkMode} fontWeight={400}>
        ✕ {fNumber(floorPrice)}
      </MobileCell>

      <MobileCell
        flex={0.9}
        align="right"
        color={getFloorChangeColor(floorChangePercent)}
        darkMode={darkMode}
        fontWeight={400}
      >
        {formatFloorChange(floorChangePercent)}
      </MobileCell>

      <MobileCell flex={1} align="right" darkMode={darkMode} fontWeight={400}>
        ✕ {fVolume(totalVolume || 0)}
      </MobileCell>
    </MobileCollectionCard>
  );
};

// Desktop Collection Row Component
const DesktopCollectionRow = ({ collection, idx, darkMode, handleRowClick }) => {
  const {
    name,
    slug,
    logoImage,
    items,
    floor,
    floor1dPercent,
    totalVol24h,
    totalVolume,
    sales24h,
    totalSales,
    marketcap,
    listedCount,
    owners,
    created,
    origin
  } = collection;

  const collectionName = normalizeCollectionName(name);
  const logoImageUrl = `https://s1.xrpl.to/nft-collection/${logoImage}`;
  const floorPrice = floor || 0;
  const floorChangePercent = floor1dPercent || 0;
  const volume24h = fVolume(totalVol24h || 0);
  const marketCapAmount = marketcap?.amount || 0;
  const strDateTime = formatMonthYearDate(created);

  const getFloorChangeColor = (percent) => {
    if (percent > 0) return '#22a86b';
    if (percent < 0) return '#c75050';
    return darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
  };

  const formatFloorChange = (percent) => {
    if (percent === 0) return '0%';
    const sign = percent > 0 ? '+' : '';
    return `${sign}${percent.toFixed(1)}%`;
  };

  const getMarketCapColor = () => {
    return darkMode ? 'rgba(255,255,255,0.9)' : '#1a1a1a';
  };

  return (
    <StyledRow onClick={handleRowClick} darkMode={darkMode}>
      <StyledCell
        align="center"
        darkMode={darkMode}
        style={{ width: '40px', minWidth: '40px', maxWidth: '40px' }}
      >
        <span
          style={{
            fontWeight: '400',
            fontSize: '13px',
            color: darkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'
          }}
        >
          {idx + 1}
        </span>
      </StyledCell>

      <StyledCell
        align="left"
        darkMode={darkMode}
        isCollectionColumn={true}
        style={{ width: '220px', minWidth: '220px', maxWidth: '220px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <CollectionImage darkMode={darkMode}>
            <OptimizedImage src={logoImageUrl} alt={collectionName} size={36} />
          </CollectionImage>
          <div style={{ minWidth: 0, flex: 1 }}>
            <CollectionName title={collectionName} darkMode={darkMode}>
              {collectionName}
            </CollectionName>
          </div>
        </div>
      </StyledCell>

      <StyledCell align="right" darkMode={darkMode} fontWeight={400}>
        ✕ {fNumber(floorPrice)}
      </StyledCell>

      <StyledCell
        align="center"
        darkMode={darkMode}
        style={{
          minWidth: '140px',
          width: '140px',
          overflow: 'visible',
          position: 'relative',
          zIndex: 101
        }}
      >
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <NFTSparklineChart slug={slug} period="7d" />
        </div>
      </StyledCell>

      <StyledCell
        align="right"
        darkMode={darkMode}
        color={getFloorChangeColor(floorChangePercent)}
        fontWeight={400}
      >
        {formatFloorChange(floorChangePercent)}
      </StyledCell>

      <StyledCell align="right" darkMode={darkMode} fontWeight={400}>
        ✕ {volume24h}
      </StyledCell>

      <StyledCell align="right" darkMode={darkMode} fontWeight={400}>
        ✕ {fVolume(totalVolume || 0)}
      </StyledCell>

      <StyledCell align="right" darkMode={darkMode} fontWeight={400}>
        <span
          style={{
            fontSize: '13px',
            color: darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)'
          }}
        >
          {strDateTime}
        </span>
      </StyledCell>

      <StyledCell align="right" darkMode={darkMode} fontWeight={400}>
        {fIntNumber(sales24h || 0)}
      </StyledCell>

      <StyledCell align="right" darkMode={darkMode} fontWeight={400}>
        {fIntNumber(totalSales || 0)}
      </StyledCell>

      <StyledCell align="right" darkMode={darkMode} color={getMarketCapColor()} fontWeight={400}>
        ✕ {fVolume(marketCapAmount)}
      </StyledCell>

      <StyledCell align="right" darkMode={darkMode} fontWeight={400}>
        {fIntNumber(listedCount || 0)}
      </StyledCell>

      <StyledCell align="right" darkMode={darkMode} fontWeight={400}>
        {fIntNumber(owners || 0)}
      </StyledCell>

      <StyledCell align="right" darkMode={darkMode} fontWeight={400}>
        {fIntNumber(items)}
      </StyledCell>

      <StyledCell align="right" darkMode={darkMode} fontWeight={400} style={{ paddingRight: '16px' }}>
        <span
          style={{
            fontFamily: 'var(--font-sans)',
            color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
          }}
        >
          {origin || 'XRPL'}
        </span>
      </StyledCell>
    </StyledRow>
  );
};

// Main Collection Row Component
const CollectionRow = memo(
  function CollectionRow({ collection, idx, isMobile, darkMode }) {
    const { slug } = collection;

    const handleRowClick = useCallback(() => {
      window.location.href = `/nfts/${slug}`;
    }, [slug]);

    if (isMobile) {
      return (
        <MobileCollectionRow
          collection={collection}
          darkMode={darkMode}
          handleRowClick={handleRowClick}
        />
      );
    }

    return (
      <DesktopCollectionRow
        collection={collection}
        idx={idx}
        darkMode={darkMode}
        handleRowClick={handleRowClick}
      />
    );
  },
  (prevProps, nextProps) => {
    const prev = prevProps.collection;
    const next = nextProps.collection;

    return (
      prev.slug === next.slug &&
      prev.floor === next.floor &&
      prev.floor1dPercent === next.floor1dPercent &&
      prev.totalVol24h === next.totalVol24h &&
      prev.sales24h === next.sales24h &&
      prevProps.isMobile === nextProps.isMobile &&
      prevProps.darkMode === nextProps.darkMode
    );
  }
);

// ListToolbar Component
const ListToolbar = memo(function ListToolbar({ rows, setRows, page, setPage, total, darkMode }) {
  const [selectOpen, setSelectOpen] = useState(false);
  const selectRef = useRef(null);

  const num = total / rows;
  let page_count = Math.floor(num);
  if (num % 1 !== 0) page_count++;
  page_count = Math.max(page_count, 1);

  const currentPage = page + 1;
  const totalPages = page_count;
  const hasPrev = page > 0;
  const hasNext = page < page_count - 1;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setSelectOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleChangeRows = (value) => {
    setRows(value);
    setSelectOpen(false);
  };

  const gotoTop = useCallback((event) => {
    const anchor = (event.target.ownerDocument || document).querySelector('#back-to-top-anchor');
    if (anchor) {
      anchor.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, []);

  const onPrevHandler = useCallback(() => {
    if (hasPrev) {
      setPage(page - 1);
      gotoTop({ target: document });
    }
  }, [page, hasPrev, setPage, gotoTop]);

  const onNextHandler = useCallback(() => {
    if (hasNext) {
      setPage(page + 1);
      gotoTop({ target: document });
    }
  }, [page, hasNext, setPage, gotoTop]);

  return (
    <StyledToolbar>
      <RowsSelector darkMode={darkMode}>
        <List size={12} />
        <Text darkMode={darkMode}>Rows</Text>
        <Select ref={selectRef}>
          <SelectButton onClick={() => setSelectOpen(!selectOpen)}>
            {rows}
            <ChevronDown size={12} />
          </SelectButton>
          {selectOpen && (
            <SelectMenu darkMode={darkMode}>
              <SelectOption onClick={() => handleChangeRows(100)} darkMode={darkMode}>
                100
              </SelectOption>
              <SelectOption onClick={() => handleChangeRows(50)} darkMode={darkMode}>
                50
              </SelectOption>
              <SelectOption onClick={() => handleChangeRows(20)} darkMode={darkMode}>
                20
              </SelectOption>
            </SelectMenu>
          )}
        </Select>
      </RowsSelector>

      <div className="flex items-center justify-center gap-1 pt-3">
        <button
          type="button"
          onClick={onPrevHandler}
          disabled={!hasPrev}
          className={cn(
            'p-1.5 rounded-xl border-[1.5px] transition-all',
            !hasPrev ? 'opacity-30 cursor-not-allowed' : '',
            darkMode
              ? 'text-white/50 border-white/10 hover:border-white/[0.15] hover:bg-white/[0.02]'
              : 'text-gray-500 border-black/[0.06] hover:border-black/10 hover:bg-black/[0.01]'
          )}
        >
          <ChevronLeft size={14} />
        </button>
        <span
          className={cn(
            'text-[11px] px-2 tabular-nums',
            darkMode ? 'text-white/40' : 'text-gray-500'
          )}
        >
          {currentPage} / {totalPages}
        </span>
        <button
          type="button"
          onClick={onNextHandler}
          disabled={!hasNext}
          className={cn(
            'p-1.5 rounded-xl border-[1.5px] transition-all',
            !hasNext ? 'opacity-30 cursor-not-allowed' : '',
            darkMode
              ? 'text-white/50 border-white/10 hover:border-white/[0.15] hover:bg-white/[0.02]'
              : 'text-gray-500 border-black/[0.06] hover:border-black/10 hover:bg-black/[0.01]'
          )}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </StyledToolbar>
  );
});

// Main CollectionList Component
export default function CollectionList({
  type,
  category,
  tag,
  onGlobalMetrics,
  initialCollections = [],
  initialTotal = 0
}) {
  const BASE_URL = 'https://api.xrpl.to/v1';
  const { themeName } = useContext(AppContext);
  const darkMode = themeName === 'XrplToDarkTheme';

  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(50);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('totalVol24h');

  const [total, setTotal] = useState(initialTotal);
  const [collections, setCollections] = useState(initialCollections);
  const [globalMetrics, setGlobalMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [sync, setSync] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 960;
      setIsMobile(mobile);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset page when tag changes
  useEffect(() => {
    setPage(0);
  }, [tag]);

  useEffect(() => {
    // Only fetch if not initial load (page change, sort change, etc)
    if (
      page === 0 &&
      order === 'desc' &&
      orderBy === 'totalVol24h' &&
      rows === 50 &&
      !tag &&
      initialCollections.length > 0
    ) {
      // Reset to initial data when returning to page 1 with default settings
      setCollections(initialCollections);
      setTotal(initialTotal);
      return;
    }

    const loadCollections = () => {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: rows.toString(),
        sortBy: orderBy,
        order: order,
        includeGlobalMetrics: 'true'
      });

      if (tag) {
        params.set('tag', tag);
      }

      axios
        .get(`${BASE_URL}/nft/collections?${params.toString()}`)
        .then((res) => {
          if (res.status === 200 && res.data) {
            const ret = res.data;
            setTotal(ret.pagination?.total || ret.count || 0);
            setCollections(ret.collections || []);
            if (ret.globalMetrics) {
              setGlobalMetrics(ret.globalMetrics);
              if (onGlobalMetrics) {
                onGlobalMetrics(ret.globalMetrics);
              }
            }
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error('Failed to load collections:', err);
          setError('Failed to load collections. Please try again.');
          setLoading(false);
        });
    };
    loadCollections();
  }, [sync, order, orderBy, page, rows, tag]);

  const handleRequestSort = useCallback(
    (event, id) => {
      const isDesc = orderBy === id && order === 'desc';
      setOrder(isDesc ? 'asc' : 'desc');
      setOrderBy(id);
      setPage(0);
      setSync(sync + 1);
    },
    [orderBy, order, sync]
  );

  if (error) {
    return (
      <Container>
        <div style={{ padding: '40px', textAlign: 'center', color: '#f44336' }}>{error}</div>
      </Container>
    );
  }

  if (collections.length === 0) {
    return (
      <Container>
        <div style={{ padding: '40px', textAlign: 'center', color: darkMode ? '#fff' : '#000' }}>
          No collections found.
        </div>
      </Container>
    );
  }

  return (
    <Container>
      {isMobile ? (
        <MobileContainer darkMode={darkMode}>
          <StyledMobileHeader isDark={darkMode}>
            <StyledHeaderCell flex={2} align="left">
              COLLECTION
            </StyledHeaderCell>
            <StyledHeaderCell flex={1.2} align="right">
              FLOOR
            </StyledHeaderCell>
            <StyledHeaderCell flex={0.9} align="right">
              24H %
            </StyledHeaderCell>
            <StyledHeaderCell flex={1} align="right">
              VOL
            </StyledHeaderCell>
          </StyledMobileHeader>
          {collections.map((collection, idx) => {
            const keyName =
              typeof collection.name === 'object'
                ? collection.name?.collection_name
                : collection.name;
            return (
              <CollectionRow
                key={collection.slug || keyName || idx}
                collection={collection}
                idx={page * rows + idx}
                isMobile={true}
                darkMode={darkMode}
              />
            );
          })}
        </MobileContainer>
      ) : (
        <TableContainer darkMode={darkMode}>
          <StyledTable>
            <ListHead
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
              scrollTopLength={0}
              darkMode={darkMode}
              isMobile={false}
            />
            <StyledTableBody darkMode={darkMode}>
              {collections.map((collection, idx) => {
                const keyName =
                  typeof collection.name === 'object'
                    ? collection.name?.collection_name
                    : collection.name;
                return (
                  <CollectionRow
                    key={collection.slug || keyName || idx}
                    collection={collection}
                    idx={page * rows + idx}
                    isMobile={false}
                    darkMode={darkMode}
                  />
                );
              })}
            </StyledTableBody>
          </StyledTable>
        </TableContainer>
      )}
      <ListToolbar
        rows={rows}
        setRows={setRows}
        page={page}
        setPage={setPage}
        total={total}
        darkMode={darkMode}
      />
    </Container>
  );
}
