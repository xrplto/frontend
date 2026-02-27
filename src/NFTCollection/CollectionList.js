import api from 'src/utils/api';
import React, { useState, useEffect, useContext, useCallback, memo, useRef } from 'react';
import { ThemeContext } from 'src/context/AppContext';
import { formatMonthYearDate, fNumber, fIntNumber, fVolume, normalizeCollectionName } from 'src/utils/formatters';
import { ChevronLeft, ChevronRight, ChevronDown, List } from 'lucide-react';
import { cn } from 'src/utils/cn';
import NFTSparklineChart from './NFTSparklineChart';

// Styled Components
const Container = ({ className, children, ...p }) => (
  <div
    className={cn('flex flex-col w-full p-0 m-0 overflow-visible dark:[background-image:repeating-linear-gradient(0deg,transparent,transparent_39px,rgba(255,255,255,0.02)_39px,rgba(255,255,255,0.02)_40px)] dark:[background-size:100%_40px] dark:shadow-[0_0_30px_rgba(255,255,255,0.03),0_0_60px_rgba(255,255,255,0.01)]', className)}
    style={{ contain: 'layout style' }}
    {...p}
  >{children}</div>
);

const TableContainer = ({ className, children, ...p }) => (
  <div
    className={cn(
      'flex justify-start gap-0 p-0 overflow-x-auto overflow-y-visible w-full min-w-0 box-border rounded-xl backdrop-blur-md border-[1.5px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
      'border-black/[0.06] bg-white dark:border-white/[0.08] dark:bg-white/[0.02]',
      className
    )}
    {...p}
  >{children}</div>
);

const StyledTable = ({ className, children, ...p }) => (
  <table className={cn('w-full border-collapse m-0 p-0', className)} style={{ tableLayout: 'fixed', contain: 'layout style' }} {...p}>{children}</table>
);

const StyledTableBody = ({ className, children, ...p }) => (
  <tbody
    className={cn('m-0 p-0', className)}
    {...p}
  >{children}</tbody>
);

const StyledRow = ({ className, children, ...p }) => (
  <tr
    className={cn(
      'tr-row border-b-[1.5px] cursor-pointer transition-[background-color,box-shadow] duration-200',
      'border-black/[0.06] hover:bg-black/[0.01] dark:border-white/10 dark:hover:bg-white/[0.03] dark:hover:shadow-[inset_0_0_20px_rgba(19,125,254,0.04)]',
      className
    )}
    {...p}
  >{children}</tr>
);

const StyledCell = ({ isFirst, isLast, isCollectionColumn, align, fontWeight, color, className, children, ...p }) => (
  <td
    className={cn(
      'py-[7px] text-[14px] align-middle font-mono tabular-nums',
      isCollectionColumn ? 'whitespace-normal' : 'whitespace-nowrap',
      className
    )}
    style={{
      paddingLeft: isFirst ? '16px' : '8px',
      paddingRight: isLast ? '16px' : '8px',
      textAlign: align || 'left',
      fontWeight: fontWeight || 400,
      color: color || ('#1a1a2e dark:rgba(255,255,255,0.85)')
    }}
    {...p}
  >{children}</td>
);

// Mobile components
const MobileCollectionCard = ({ className, children, ...p }) => (
  <div
    className={cn(
      'mobile-card flex w-full py-3 px-3.5 border-b-[1.5px] cursor-pointer box-border items-center transition-[background-color] duration-200',
      'border-black/[0.06] hover:bg-black/[0.01] dark:border-white/10 dark:hover:bg-white/[0.03]',
      className
    )}
    style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 48px' }}
    {...p}
  >{children}</div>
);

const MobileCollectionInfo = ({ className, children, ...p }) => (
  <div className={cn('flex-[2] flex items-center gap-3 px-1 min-w-0', className)} {...p}>{children}</div>
);

const MobileCell = ({ flex, align, fontWeight, color, minWidth, wordBreak, lineHeight, className, children, ...p }) => (
  <div
    className={cn('px-[6px] text-[14px] font-mono tabular-nums overflow-hidden text-ellipsis whitespace-nowrap', className)}
    style={{ flex: flex || 1, textAlign: align || 'right', fontWeight: fontWeight || 400, color: color || ('#1a1a2e dark:rgba(255,255,255,0.85)'), minWidth: minWidth || 'auto', wordBreak: wordBreak || 'normal', lineHeight: lineHeight || 'normal' }}
    {...p}
  >{children}</div>
);

const CollectionImage = ({ isMobile, className, children, ...p }) => (
  <div
    className={cn('rounded-lg overflow-hidden shrink-0', 'bg-black/[0.03] dark:bg-white/[0.05]', className)}
    style={{ width: isMobile ? '30px' : '34px', height: isMobile ? '30px' : '34px' }}
    {...p}
  >{children}</div>
);

const CollectionDetails = ({ className, children, ...p }) => (
  <div className={cn('flex-1 min-w-0 flex flex-col gap-[3px]', className)} {...p}>{children}</div>
);

const CollectionName = ({ isMobile, className, children, ...p }) => (
  <span
    className={cn('font-semibold overflow-hidden text-ellipsis whitespace-nowrap block leading-[1.4] font-sans tracking-[-0.01em]', 'text-[#1a1a2e] dark:text-white/95', className)}
    style={{ fontSize: isMobile ? '14px' : '15px', maxWidth: isMobile ? '130px' : '190px' }}
    {...p}
  >{children}</span>
);

const CollectionSubtext = ({ isMobile, className, children, ...p }) => (
  <span
    className={cn('font-medium block overflow-hidden text-ellipsis whitespace-nowrap leading-[1.3] uppercase tracking-[0.02em] font-sans', 'text-black/40 dark:text-white/35', className)}
    style={{ fontSize: isMobile ? '11px' : '12px', maxWidth: isMobile ? '130px' : '190px' }}
    {...p}
  >{children}</span>
);

// Toolbar styled components
const StyledToolbar = ({ className, children, ...p }) => (
  <div
    className={cn(
      'flex items-center justify-between py-3 px-4 gap-2 flex-wrap border-t-[1.5px] bg-transparent',
      'max-[900px]:flex-row max-[900px]:items-stretch max-[900px]:flex-wrap max-[900px]:gap-1 max-[900px]:py-[10px] max-[900px]:px-3',
      'border-black/[0.06] dark:border-white/10',
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

const Text = ({ fontWeight, className, children, ...p }) => (
  <span
    className={cn('text-[12px] tabular-nums font-medium tracking-[0.01em]', 'text-[#212B36]/50 dark:text-white/40', className)}
    style={{ fontWeight: fontWeight || 400 }}
    {...p}
  >{children}</span>
);

const NavButton = ({ className, children, ...p }) => (
  <button
    className={cn(
      'w-[26px] h-[26px] rounded-lg border-[1.5px] bg-transparent cursor-pointer inline-flex items-center justify-center p-0 transition-[background-color,border-color] duration-150',
      'disabled:cursor-not-allowed',
      'outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
      'border-black/[0.06] text-[#212B36] hover:enabled:border-black/10 hover:enabled:bg-black/[0.01] disabled:text-[#212B36]/30 dark:border-white/10 dark:text-white dark:hover:enabled:border-white/[0.15] dark:hover:enabled:bg-white/[0.02] dark:disabled:text-white/30',
      className
    )}
    {...p}
  >{children}</button>
);

const PageButton = ({ selected, className, children, ...p }) => (
  <button
    className={cn(
      'min-w-[22px] h-[22px] rounded-lg border-[1.5px] cursor-pointer inline-flex items-center justify-center px-1 m-0 text-[11px] tabular-nums transition-[background-color,border-color] duration-150',
      'disabled:cursor-not-allowed disabled:opacity-30',
      'outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
      selected
        ? 'border-[#4285f4] bg-[#4285f4] text-white font-medium hover:enabled:border-[#1976D2] hover:enabled:bg-[#1976D2] shadow-[0_0_8px_rgba(66,133,244,0.4)]'
        : cn(
            'border-black/[0.06] bg-transparent text-[#212B36] font-normal hover:enabled:border-black/10 hover:enabled:bg-black/[0.01] dark:border-white/10 dark:bg-transparent dark:text-white dark:font-normal dark:hover:enabled:border-white/[0.15] dark:hover:enabled:bg-white/[0.02]'
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
    className={cn('bg-transparent border-none text-[#4285f4] font-medium text-[11px] cursor-pointer p-0 flex items-center gap-[2px] min-w-[36px] hover:bg-blue-400/[0.04] hover:rounded hover:py-[2px] hover:px-1 hover:-my-[2px] hover:-mx-1 outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]', className)}
    {...p}
  >{children}</button>
);

const SelectMenu = ({ className, children, ...p }) => (
  <div
    className={cn('absolute top-full right-0 mt-1 bg-transparent border-[1.5px] rounded-lg z-[1000] min-w-[50px] backdrop-blur-[12px]', 'border-black/[0.06] dark:border-white/10', className)}
    {...p}
  >{children}</div>
);

const SelectOption = ({ className, children, ...p }) => (
  <button
    className={cn('block w-full py-1 px-[10px] border-none bg-transparent text-left cursor-pointer text-[11px] hover:bg-blue-400/[0.04]', 'text-[#212B36] dark:text-white', className)}
    {...p}
  >{children}</button>
);

const CenterBox = ({ className, children, ...p }) => (
  <div className={cn('grow flex justify-center', className)} {...p}>{children}</div>
);

const StyledTableHead = ({ scrollTopLength, className, children, ...p }) => (
  <thead
    className={cn('relative z-[100] backdrop-blur-[12px]', 'bg-white dark:bg-black/90', className)}
    {...p}
  >{children}</thead>
);

const StyledTableCell = ({ isFirst, isLast, isCollectionColumn, align, width, sortable, className, children, ...p }) => (
  <th
    className={cn(
      'font-medium text-[11px] tracking-widest uppercase whitespace-nowrap box-border font-mono',
      'first-of-type:pl-3 last-of-type:pr-3',
      sortable ? 'cursor-pointer' : 'cursor-default',
      'text-black/60 border-b border-black/[0.06] dark:text-white/60 dark:border-b dark:border-white/[0.08]',
      sortable && ('hover:text-black/80 dark:hover:text-white/80'),
      className
    )}
    style={{
      padding: '14px 4px',
      textAlign: align || 'left'
    }}
    {...p}
  >{children}</th>
);

const SortIndicator = ({ active, direction, className, children, ...p }) => (
  <span
    className={cn('inline-block ml-[6px] text-[8px] transition-[opacity,transform] duration-150', className)}
    style={{
      color: active ? '#4285f4' : ('rgba(0,0,0,0.25) dark:rgba(255,255,255,0.25)'),
      transform: direction === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)',
      opacity: active ? 1 : 0.5
    }}
    {...p}
  >{children}</span>
);

const MobileContainer = ({ className, children, ...p }) => (
  <div
    className={cn('w-full flex flex-col gap-0 p-0 m-0 rounded-xl backdrop-blur-md border-[1.5px]', 'border-black/[0.06] bg-white dark:border-white/[0.08] dark:bg-white/[0.02]', className)}
    {...p}
  >{children}</div>
);

const StyledMobileHeader = ({ className, children, ...p }) => (
  <div
    className={cn(
      'flex w-full py-3.5 px-4 bg-transparent backdrop-blur-[12px] border-b text-[11px] font-medium uppercase tracking-widest font-mono sticky top-0 z-10 box-border',
      'border-black/[0.06] text-black/60 dark:border-white/[0.08] dark:text-white/60',
      className
    )}
    {...p}
  >{children}</div>
);

const StyledHeaderCell = ({ flex, align, sortable, className, children, ...p }) => (
  <div
    className={cn(
      'px-[6px]',
      sortable ? 'cursor-pointer' : 'cursor-default',
      sortable && ('hover:text-black/80 dark:hover:text-white/80'),
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
    id: 'totalVol24h',
    label: 'VOL 24H',
    align: 'right',
    width: '20%',
    order: true,
    tooltip: '24h trading volume'
  }
];

const TABLE_HEAD_DESKTOP = [
  { id: 'rank', label: '#', align: 'center', width: '36px', order: false },
  { id: 'name', label: 'COLLECTION', align: 'left', width: '210px', order: false },
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
  },
];

// ListHead Component
const ListHead = memo(
  ({ order, orderBy, onRequestSort, scrollTopLength = 0, isMobile }) => {
    const createSortHandler = useCallback(
      (id) => (event) => {
        onRequestSort(event, id);
      },
      [onRequestSort]
    );

    const TABLE_HEAD = isMobile ? TABLE_HEAD_MOBILE : TABLE_HEAD_DESKTOP;

    // Render label with badge style for time periods
    const renderLabel = (headCell) => {
      const badgeClass = 'text-[9px] font-bold text-white/40';

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
      <StyledTableHead scrollTopLength={scrollTopLength}>
        <tr>
          {TABLE_HEAD.map((headCell, idx) => (
            <StyledTableCell
              key={headCell.id}
              align={headCell.align}
              width={headCell.width}
              sortable={headCell.order}
              isFirst={idx === 0}
              isLast={idx === TABLE_HEAD.length - 1}
              isCollectionColumn={headCell.id === 'name'}
              onClick={headCell.order ? createSortHandler(headCell.id) : undefined}
            >
              {headCell.order ? (
                <span>
                  {renderLabel(headCell)}
                  {orderBy === headCell.id && (
                    <SortIndicator active={true} direction={order}>
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
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
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
const MobileCollectionRow = ({ collection, handleRowClick }) => {
  const { name, slug, logoImage, floor, floor1dPercent, totalVol24h } = collection;

  const collectionName = normalizeCollectionName(name);
  const logoImageUrl = `https://s1.xrpl.to/nft-collection/${logoImage}`;
  const floorPrice = floor || 0;
  const floorChangePercent = floor1dPercent || 0;

  const getFloorChangeColor = (percent) => {
    if (percent > 0) return '#22a86b';
    if (percent < 0) return '#c75050';
    return 'rgba(0, 0, 0, 0.7) dark:rgba(255, dark:255, dark:255, dark:0.7)';
  };

  const formatFloorChange = (percent) => {
    if (percent === 0) return '0%';
    const sign = percent > 0 ? '+' : '';
    return `${sign}${percent.toFixed(1)}%`;
  };

  return (
    <MobileCollectionCard onClick={handleRowClick}>
      <MobileCollectionInfo>
        <CollectionImage isMobile={true}>
          <OptimizedImage src={logoImageUrl} alt={collectionName} size={30} />
        </CollectionImage>
        <CollectionDetails>
          <CollectionName isMobile={true}>
            {collectionName}
          </CollectionName>
          <CollectionSubtext isMobile={true}>
            {slug}
          </CollectionSubtext>
        </CollectionDetails>
      </MobileCollectionInfo>

      <MobileCell flex={1.2} align="right" fontWeight={400}>
        {fNumber(floorPrice)}
      </MobileCell>

      <MobileCell
        flex={0.9}
        align="right"
        color={getFloorChangeColor(floorChangePercent)}
        fontWeight={400}
      >
        {formatFloorChange(floorChangePercent)}
      </MobileCell>

      <MobileCell flex={1} align="right" fontWeight={400}>
        {fVolume(totalVol24h || 0)}
      </MobileCell>
    </MobileCollectionCard>
  );
};

// Desktop Collection Row Component
const DesktopCollectionRow = ({ collection, idx, handleRowClick }) => {
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
    return 'rgba(0, 0, 0, 0.7) dark:rgba(255, dark:255, dark:255, dark:0.7)';
  };

  const formatFloorChange = (percent) => {
    if (percent === 0) return '0%';
    const sign = percent > 0 ? '+' : '';
    return `${sign}${percent.toFixed(1)}%`;
  };

  const getMarketCapColor = () => {
    return '#1a1a1a dark:rgba(255,255,255,0.9)';
  };

  return (
    <StyledRow onClick={handleRowClick}>
      <StyledCell
        align="center"
        isFirst={true}
      >
        <span className={cn('font-medium text-[14px]', 'text-black/40 dark:text-white/35')}>
          {idx + 1}
        </span>
      </StyledCell>

      <StyledCell
        align="left"
        isCollectionColumn={true}
      >
        <div className="flex items-center gap-2.5">
          <CollectionImage>
            <OptimizedImage src={logoImageUrl} alt={collectionName} size={34} />
          </CollectionImage>
          <div className="min-w-0 flex-1">
            <CollectionName title={collectionName}>
              {collectionName}
            </CollectionName>
          </div>
        </div>
      </StyledCell>

      <StyledCell align="right" fontWeight={400}>
        {fNumber(floorPrice)}
      </StyledCell>

      <StyledCell
        align="center"
        className="overflow-visible relative z-[101]"
      >
        <div className="w-full flex justify-center">
          <NFTSparklineChart slug={slug} period="7d" />
        </div>
      </StyledCell>

      <StyledCell
        align="right"
        color={getFloorChangeColor(floorChangePercent)}
        fontWeight={400}
      >
        {formatFloorChange(floorChangePercent)}
      </StyledCell>

      <StyledCell align="right" fontWeight={400}>
        {volume24h}
      </StyledCell>

      <StyledCell align="right" fontWeight={400}>
        {fVolume(totalVolume || 0)}
      </StyledCell>

      <StyledCell align="right" fontWeight={400}>
        <span className={cn('text-[13px]', 'text-black/45 dark:text-white/40')}>
          {strDateTime}
        </span>
      </StyledCell>

      <StyledCell align="right" fontWeight={400}>
        {fIntNumber(sales24h || 0)}
      </StyledCell>

      <StyledCell align="right" fontWeight={400}>
        {fIntNumber(totalSales || 0)}
      </StyledCell>

      <StyledCell align="right" color={getMarketCapColor()} fontWeight={400}>
        {fVolume(marketCapAmount)}
      </StyledCell>

      <StyledCell align="right" fontWeight={400}>
        {fIntNumber(listedCount || 0)}
      </StyledCell>

      <StyledCell align="right" fontWeight={400}>
        {fIntNumber(owners || 0)}
      </StyledCell>

      <StyledCell align="right" fontWeight={400}>
        {fIntNumber(items)}
      </StyledCell>

      <StyledCell align="right" fontWeight={400} isLast={true}>
        <span className={cn('font-sans font-medium', 'text-black/50 dark:text-white/45')}>
          {origin || 'XRPL'}
        </span>
      </StyledCell>
    </StyledRow>
  );
};

// Main Collection Row Component
const CollectionRow = memo(
  function CollectionRow({ collection, idx, isMobile }) {
    const { slug } = collection;

    const handleRowClick = useCallback(() => {
      window.location.href = `/nfts/${slug}`;
    }, [slug]);

    if (isMobile) {
      return (
        <MobileCollectionRow
          collection={collection}
          handleRowClick={handleRowClick}
        />
      );
    }

    return (
      <DesktopCollectionRow
        collection={collection}
        idx={idx}
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
const ListToolbar = memo(function ListToolbar({ rows, setRows, page, setPage, total }) {
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
      <RowsSelector>
        <List size={12} />
        <Text>Rows</Text>
        <Select ref={selectRef}>
          <SelectButton onClick={() => setSelectOpen(!selectOpen)}>
            {rows}
            <ChevronDown size={12} />
          </SelectButton>
          {selectOpen && (
            <SelectMenu>
              <SelectOption onClick={() => handleChangeRows(100)}>
                100
              </SelectOption>
              <SelectOption onClick={() => handleChangeRows(50)}>
                50
              </SelectOption>
              <SelectOption onClick={() => handleChangeRows(20)}>
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
            'p-1.5 rounded-lg border-[1.5px] transition-[background-color,border-color]',
            'outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
            !hasPrev ? 'opacity-30 cursor-not-allowed' : '',
            'text-gray-500 border-black/[0.06] hover:border-black/10 hover:bg-black/[0.01] dark:text-white/50 dark:border-white/10 dark:hover:border-white/[0.15] dark:hover:bg-white/[0.02]'
          )}
        >
          <ChevronLeft size={14} />
        </button>
        <span
          className={cn(
            'text-[11px] px-2 tabular-nums',
            'text-gray-500 dark:text-white/60'
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
            'p-1.5 rounded-lg border-[1.5px] transition-[background-color,border-color]',
            'outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
            !hasNext ? 'opacity-30 cursor-not-allowed' : '',
            'text-gray-500 border-black/[0.06] hover:border-black/10 hover:bg-black/[0.01] dark:text-white/50 dark:border-white/10 dark:hover:border-white/[0.15] dark:hover:bg-white/[0.02]'
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
  origin,
  onGlobalMetrics,
  initialCollections = [],
  initialTotal = 0,
  rows: rowsProp,
  setRows: setRowsProp,
  orderBy: orderByProp,
  setOrderBy: setOrderByProp,
  order: orderProp,
  setOrder: setOrderProp,
  sync: syncProp,
  setSync: setSyncProp
}) {
  const BASE_URL = 'https://api.xrpl.to/v1';
  const { themeName } = useContext(ThemeContext);
  const darkMode = themeName === 'XrplToDarkTheme';

  const [page, setPage] = useState(0);
  const [rowsLocal, setRowsLocal] = useState(20);
  const [orderLocal, setOrderLocal] = useState('desc');
  const [orderByLocal, setOrderByLocal] = useState('totalVol24h');
  const [syncLocal, setSyncLocal] = useState(0);

  const rows = rowsProp !== undefined ? rowsProp : rowsLocal;
  const setRows = setRowsProp || setRowsLocal;
  const order = orderProp !== undefined ? orderProp : orderLocal;
  const setOrder = setOrderProp || setOrderLocal;
  const orderBy = orderByProp !== undefined ? orderByProp : orderByLocal;
  const setOrderBy = setOrderByProp || setOrderByLocal;
  const sync = syncProp !== undefined ? syncProp : syncLocal;
  const setSync = setSyncProp || setSyncLocal;

  const [total, setTotal] = useState(initialTotal);
  const [collections, setCollections] = useState(initialCollections);
  const [globalMetrics, setGlobalMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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

  // Reset page when tag or origin changes
  useEffect(() => {
    setPage(0);
  }, [tag, origin]);

  useEffect(() => {
    // Only fetch if not initial load (page change, sort change, etc)
    if (
      page === 0 &&
      order === 'desc' &&
      orderBy === 'totalVol24h' &&
      rows === 20 &&
      !tag &&
      !origin &&
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
      if (origin) {
        params.set('origin', origin);
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
  }, [sync, order, orderBy, page, rows, tag, origin]);

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
      <Container isDark={darkMode}>
        <div className="p-10 text-center text-[#f44336]">{error}</div>
      </Container>
    );
  }

  if (collections.length === 0) {
    return (
      <Container isDark={darkMode}>
        <div className={cn('p-10 text-center', 'text-black dark:text-white')}>
          No collections found.
        </div>
      </Container>
    );
  }

  return (
    <Container isDark={darkMode}>
      {isMobile ? (
        <MobileContainer>
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
              VOL 24H
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
              />
            );
          })}
        </MobileContainer>
      ) : (
        <TableContainer>
          <StyledTable>
            <colgroup>
              <col style={{ width: '2.5%' }} />  {/* # */}
              <col style={{ width: '12%' }} />   {/* Collection */}
              <col style={{ width: '6.5%' }} />  {/* Floor */}
              <col style={{ width: '8.5%' }} />  {/* Trendline */}
              <col style={{ width: '6%' }} />    {/* Change 24h */}
              <col style={{ width: '7%' }} />    {/* Vol 24h */}
              <col style={{ width: '7%' }} />    {/* Vol All */}
              <col style={{ width: '7.5%' }} />  {/* Created */}
              <col style={{ width: '6%' }} />    {/* Sales 24h */}
              <col style={{ width: '6.5%' }} />  {/* Sales All */}
              <col style={{ width: '8%' }} />    {/* Market Cap */}
              <col style={{ width: '5.5%' }} />  {/* Listed */}
              <col style={{ width: '5.5%' }} />  {/* Owners */}
              <col style={{ width: '5.5%' }} />  {/* Supply */}
              <col style={{ width: '6%' }} />    {/* Source */}
            </colgroup>
            <ListHead
              order={order}
              orderBy={orderBy}
              onRequestSort={handleRequestSort}
              scrollTopLength={0}
              isMobile={false}
            />
            <StyledTableBody>
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
      />
    </Container>
  );
}
