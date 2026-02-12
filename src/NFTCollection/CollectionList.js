import api from 'src/utils/api';
import React, { useState, useEffect, useContext, useCallback, memo, useRef } from 'react';
import { ThemeContext } from 'src/context/AppContext';
import { formatMonthYearDate, fNumber, fIntNumber, fVolume, normalizeCollectionName } from 'src/utils/formatters';
import { ChevronLeft, ChevronRight, ChevronDown, List } from 'lucide-react';
import { cn } from 'src/utils/cn';
import NFTSparklineChart from './NFTSparklineChart';

// Styled Components
const Container = ({ className, children, ...p }) => (
  <div className={cn('flex flex-col w-full p-0 m-0 overflow-visible', className)} style={{ contain: 'layout style' }} {...p}>{children}</div>
);

const TableContainer = ({ darkMode, className, children, ...p }) => (
  <div
    className={cn(
      'flex justify-start gap-0 p-0 overflow-x-auto overflow-y-visible w-full min-w-0 box-border bg-transparent rounded-xl backdrop-blur-[12px] border-[1.5px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
      darkMode ? 'border-white/10' : 'border-black/[0.06]',
      className
    )}
    {...p}
  >{children}</div>
);

const StyledTable = ({ className, children, ...p }) => (
  <table className={cn('w-full border-collapse m-0 p-0', className)} style={{ tableLayout: 'fixed', contain: 'layout style' }} {...p}>{children}</table>
);

const StyledTableBody = ({ darkMode, className, children, ...p }) => (
  <tbody
    className={cn('m-0 p-0', darkMode ? '[&_tr:hover]:bg-white/[0.02]' : '[&_tr:hover]:bg-black/[0.01]', className)}
    {...p}
  >{children}</tbody>
);

const StyledRow = ({ darkMode, className, children, ...p }) => (
  <tr
    className={cn(
      'border-b-[1.5px] cursor-pointer transition-all duration-150',
      darkMode ? 'border-white/10 hover:bg-white/[0.02]' : 'border-black/[0.06] hover:bg-black/[0.01]',
      className
    )}
    {...p}
  >{children}</tr>
);

const StyledCell = ({ isCollectionColumn, align, fontWeight, color, darkMode, width, className, children, ...p }) => (
  <td
    className={cn(
      'py-[14px] px-2 text-sm align-middle font-mono tabular-nums first-of-type:pl-3 last-of-type:pr-1',
      isCollectionColumn ? 'whitespace-normal min-w-[200px]' : 'whitespace-nowrap',
      className
    )}
    style={{
      textAlign: align || 'left',
      fontWeight: fontWeight || 400,
      color: color || (darkMode ? 'rgba(255,255,255,0.9)' : '#1a1a1a'),
      width: width || 'auto'
    }}
    {...p}
  >{children}</td>
);

// Mobile components
const MobileCollectionCard = ({ darkMode, className, children, ...p }) => (
  <div
    className={cn(
      'flex w-full py-[10px] px-3 border-b-[1.5px] cursor-pointer box-border items-center transition-all duration-150',
      darkMode ? 'border-white/10 hover:bg-white/[0.02]' : 'border-black/[0.06] hover:bg-black/[0.01]',
      className
    )}
    {...p}
  >{children}</div>
);

const MobileCollectionInfo = ({ className, children, ...p }) => (
  <div className={cn('flex-[2] flex items-center gap-[10px] px-1 min-w-0', className)} {...p}>{children}</div>
);

const MobileCell = ({ flex, align, fontWeight, color, darkMode, minWidth, wordBreak, lineHeight, className, children, ...p }) => (
  <div
    className={cn('px-[6px] text-sm font-mono tabular-nums', className)}
    style={{ flex: flex || 1, textAlign: align || 'right', fontWeight: fontWeight || 400, color: color || (darkMode ? 'rgba(255,255,255,0.9)' : '#1a1a1a'), minWidth: minWidth || 'auto', wordBreak: wordBreak || 'normal', lineHeight: lineHeight || 'normal' }}
    {...p}
  >{children}</div>
);

const CollectionImage = ({ isMobile, darkMode, className, children, ...p }) => (
  <div
    className={cn('rounded-lg overflow-hidden shrink-0', darkMode ? 'bg-white/[0.05]' : 'bg-black/[0.03]', className)}
    style={{ width: isMobile ? '28px' : '36px', height: isMobile ? '28px' : '36px' }}
    {...p}
  >{children}</div>
);

const CollectionDetails = ({ className, children, ...p }) => (
  <div className={cn('flex-1 min-w-0 flex flex-col gap-[2px]', className)} {...p}>{children}</div>
);

const CollectionName = ({ isMobile, darkMode, className, children, ...p }) => (
  <span
    className={cn('font-medium overflow-hidden text-ellipsis whitespace-nowrap block leading-[1.4] font-sans', darkMode ? 'text-white' : 'text-[#1a1a1a]', className)}
    style={{ fontSize: isMobile ? '14px' : '15px', maxWidth: isMobile ? '120px' : '180px' }}
    {...p}
  >{children}</span>
);

const CollectionSubtext = ({ isMobile, darkMode, className, children, ...p }) => (
  <span
    className={cn('font-normal block overflow-hidden text-ellipsis whitespace-nowrap leading-[1.3] uppercase font-sans', darkMode ? 'text-white/45' : 'text-black/50', className)}
    style={{ fontSize: isMobile ? '12px' : '13px', maxWidth: isMobile ? '120px' : '180px' }}
    {...p}
  >{children}</span>
);

// Toolbar styled components
const StyledToolbar = ({ darkMode, className, children, ...p }) => (
  <div
    className={cn(
      'flex items-center justify-between py-3 px-4 gap-2 flex-wrap border-t-[1.5px] bg-transparent',
      'max-[900px]:flex-row max-[900px]:items-stretch max-[900px]:flex-wrap max-[900px]:gap-1 max-[900px]:py-[10px] max-[900px]:px-3',
      darkMode ? 'border-white/10' : 'border-black/[0.06]',
      className
    )}
    {...p}
  >{children}</div>
);

const RowsSelector = ({ className, children, ...p }) => (
  <div
    className={cn('flex items-center gap-[6px] p-0 min-h-[32px] bg-transparent border-none max-[900px]:flex-1 max-[900px]:min-w-[calc(50%-8px)] max-[900px]:justify-center max-[900px]:gap-1', className)}
    {...p}
  >{children}</div>
);

const Text = ({ darkMode, fontWeight, className, children, ...p }) => (
  <span
    className={cn('text-[11px] tabular-nums', darkMode ? 'text-white/60' : 'text-[#212B36]/60', className)}
    style={{ fontWeight: fontWeight || 400 }}
    {...p}
  >{children}</span>
);

const NavButton = ({ darkMode, className, children, ...p }) => (
  <button
    className={cn(
      'w-[26px] h-[26px] rounded-xl border-[1.5px] bg-transparent cursor-pointer inline-flex items-center justify-center p-0 transition-all duration-150',
      'disabled:cursor-not-allowed',
      darkMode
        ? 'border-white/10 text-white hover:enabled:border-white/[0.15] hover:enabled:bg-white/[0.02] disabled:text-white/30'
        : 'border-black/[0.06] text-[#212B36] hover:enabled:border-black/10 hover:enabled:bg-black/[0.01] disabled:text-[#212B36]/30',
      className
    )}
    {...p}
  >{children}</button>
);

const PageButton = ({ selected, darkMode, className, children, ...p }) => (
  <button
    className={cn(
      'min-w-[22px] h-[22px] rounded-xl border-[1.5px] cursor-pointer inline-flex items-center justify-center px-1 m-0 text-[11px] tabular-nums transition-all duration-150',
      'disabled:cursor-not-allowed disabled:opacity-30',
      selected
        ? 'border-[#4285f4] bg-[#4285f4] text-white font-medium hover:enabled:border-[#1976D2] hover:enabled:bg-[#1976D2]'
        : cn(
            darkMode
              ? 'border-white/10 bg-transparent text-white font-normal hover:enabled:border-white/[0.15] hover:enabled:bg-white/[0.02]'
              : 'border-black/[0.06] bg-transparent text-[#212B36] font-normal hover:enabled:border-black/10 hover:enabled:bg-black/[0.01]'
          ),
      className
    )}
    {...p}
  >{children}</button>
);

const Select = ({ className, children, ...p }) => (
  <div className={cn('relative inline-block', className)} {...p}>{children}</div>
);

const SelectButton = ({ className, children, ...p }) => (
  <button
    className={cn('bg-transparent border-none text-[#4285f4] font-medium text-[11px] cursor-pointer p-0 flex items-center gap-[2px] min-w-[36px] hover:bg-blue-400/[0.04] hover:rounded hover:py-[2px] hover:px-1 hover:-my-[2px] hover:-mx-1', className)}
    {...p}
  >{children}</button>
);

const SelectMenu = ({ darkMode, className, children, ...p }) => (
  <div
    className={cn('absolute top-full right-0 mt-1 bg-transparent border-[1.5px] rounded-xl z-[1000] min-w-[50px] backdrop-blur-[12px]', darkMode ? 'border-white/10' : 'border-black/[0.06]', className)}
    {...p}
  >{children}</div>
);

const SelectOption = ({ darkMode, className, children, ...p }) => (
  <button
    className={cn('block w-full py-1 px-[10px] border-none bg-transparent text-left cursor-pointer text-[11px] hover:bg-blue-400/[0.04]', darkMode ? 'text-white' : 'text-[#212B36]', className)}
    {...p}
  >{children}</button>
);

const CenterBox = ({ className, children, ...p }) => (
  <div className={cn('grow flex justify-center', className)} {...p}>{children}</div>
);

const StyledTableHead = ({ scrollTopLength, className, children, ...p }) => (
  <thead
    className={cn('sticky z-[100] bg-transparent backdrop-blur-[12px]', className)}
    style={{ top: scrollTopLength || 0 }}
    {...p}
  >{children}</thead>
);

const StyledTableCell = ({ darkMode, isCollectionColumn, align, width, sortable, className, children, ...p }) => (
  <th
    className={cn(
      'font-medium text-[11px] tracking-[0.05em] uppercase py-[14px] px-2 border-b-[1.5px] box-border font-[inherit] transition-all duration-150',
      'first-of-type:pl-3 last-of-type:pr-3',
      isCollectionColumn ? 'whitespace-normal' : 'whitespace-nowrap',
      sortable ? 'cursor-pointer' : 'cursor-default',
      darkMode ? 'text-white/50 border-white/10' : 'text-black/55 border-black/[0.06]',
      sortable && (darkMode ? 'hover:text-white/80' : 'hover:text-black/80'),
      className
    )}
    style={{ textAlign: align || 'left', width: width || 'auto', minWidth: isCollectionColumn ? '200px' : (width || 'auto') }}
    {...p}
  >{children}</th>
);

const SortIndicator = ({ active, darkMode, direction, className, children, ...p }) => (
  <span
    className={cn('inline-block ml-[6px] text-[8px] transition-all duration-150', className)}
    style={{
      color: active ? '#4285f4' : (darkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'),
      transform: direction === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)',
      opacity: active ? 1 : 0.5
    }}
    {...p}
  >{children}</span>
);

const MobileContainer = ({ darkMode, className, children, ...p }) => (
  <div
    className={cn('w-full flex flex-col gap-0 p-0 m-0 bg-transparent rounded-xl backdrop-blur-[12px] border-[1.5px]', darkMode ? 'border-white/10' : 'border-black/[0.06]', className)}
    {...p}
  >{children}</div>
);

const StyledMobileHeader = ({ isDark, className, children, ...p }) => (
  <div
    className={cn(
      'flex w-full py-3 px-4 bg-transparent backdrop-blur-[12px] border-b-[1.5px] text-[11px] font-medium uppercase tracking-[0.05em] sticky top-0 z-10 box-border',
      isDark ? 'border-white/10 text-white/50' : 'border-black/[0.06] text-black/55',
      className
    )}
    {...p}
  >{children}</div>
);

const StyledHeaderCell = ({ flex, align, sortable, isDark, className, children, ...p }) => (
  <div
    className={cn(
      'px-[6px] transition-[color] duration-150',
      sortable ? 'cursor-pointer' : 'cursor-default',
      sortable && (isDark ? 'hover:text-white/80' : 'hover:text-black/80'),
      className
    )}
    style={{ flex: flex || 1, textAlign: align || 'left' }}
    {...p}
  >{children}</div>
);

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
      const badgeClass = 'opacity-50 text-[10px]';

      switch (headCell.id) {
        case 'totalVol24h':
          return (
            <>
              Volume <span className={badgeClass}>24h</span>
            </>
          );
        case 'totalVolume':
          return (
            <>
              Volume <span className={badgeClass}>All</span>
            </>
          );
        case 'sales24h':
          return (
            <>
              Sales <span className={badgeClass}>24h</span>
            </>
          );
        case 'totalSales':
          return (
            <>
              Sales <span className={badgeClass}>All</span>
            </>
          );
        case 'sparkline':
          return (
            <>
              Trendline <span className={badgeClass}>7d</span>
            </>
          );
        case 'floor1dPercent':
          return (
            <>
              Change <span className={badgeClass}>24h</span>
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
      <div className="rounded overflow-hidden" style={{ width: size, height: size }}>
        <img
          src={imgSrc}
          alt={alt}
          onError={handleError}
          className="w-full h-full object-cover block"
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
        className="w-10 min-w-[40px] max-w-[40px]"
      >
        <span className={cn('font-normal text-[13px]', darkMode ? 'text-white/40' : 'text-black/40')}>
          {idx + 1}
        </span>
      </StyledCell>

      <StyledCell
        align="left"
        darkMode={darkMode}
        isCollectionColumn={true}
        className="w-[220px] min-w-[220px] max-w-[220px]"
      >
        <div className="flex items-center gap-3">
          <CollectionImage darkMode={darkMode}>
            <OptimizedImage src={logoImageUrl} alt={collectionName} size={36} />
          </CollectionImage>
          <div className="min-w-0 flex-1">
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
        className="min-w-[140px] w-[140px] overflow-visible relative z-[101]"
      >
        <div className="w-full flex justify-center">
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
        <span className={cn('text-[13px]', darkMode ? 'text-white/60' : 'text-black/60')}>
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

      <StyledCell align="right" darkMode={darkMode} fontWeight={400} className="pr-4">
        <span className={cn('font-sans', darkMode ? 'text-white/70' : 'text-black/70')}>
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
          aria-label="Previous page"
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
          aria-label="Next page"
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
  const { themeName } = useContext(ThemeContext);
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

      api
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
        <div className="p-10 text-center text-[#f44336]">{error}</div>
      </Container>
    );
  }

  if (collections.length === 0) {
    return (
      <Container>
        <div className={cn('p-10 text-center', darkMode ? 'text-white' : 'text-black')}>
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
