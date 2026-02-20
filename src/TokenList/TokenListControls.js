import React, { useContext, memo, useMemo, useCallback, useState, useRef, useEffect } from 'react';
import { ThemeContext } from 'src/context/AppContext';
import {
  ChevronsLeft,
  ChevronsRight,
  List,
  ChevronDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { selectFilteredCount } from 'src/redux/statusSlice';
import { cn } from 'src/utils/cn';

// ============== TokenListHead Styles ==============
const StyledTableHead = ({ darkMode, className, children, ...p }) => (
  <thead
    className={cn('relative z-[100] backdrop-blur-[12px]', darkMode ? 'bg-black/90' : 'bg-white', className)}
    {...p}
  >{children}</thead>
);

const StyledTableCell = ({ darkMode, isMobile, align, sortable, sticky, left, width, className, children, stickyThird, scrollLeft, isTokenColumn, style: extraStyle, ...p }) => (
  <th
    className={cn(
      'font-medium text-[11px] tracking-[0.04em] uppercase whitespace-nowrap box-border font-[inherit]',
      'first-of-type:pl-3 last-of-type:pr-3',
      darkMode ? 'text-white/60 border-b border-white/[0.08]' : 'text-black/60 border-b border-black/[0.06]',
      sortable ? 'cursor-pointer' : 'cursor-default',
      sortable && (darkMode ? 'hover:text-white/80' : 'hover:text-black/80'),
      sticky ? 'sticky z-[101]' : 'relative',
      sticky && (darkMode ? 'bg-transparent' : 'bg-white/95'),
      !sticky && 'bg-transparent',
      className
    )}
    style={{
      padding: isMobile ? '12px 6px' : '14px 4px',
      textAlign: align || 'left',
      left: left || 'unset',
      width: width ? `${width}px` : 'auto',
      maxWidth: width ? `${width}px` : 'none',
      ...extraStyle
    }}
    {...p}
  >{children}</th>
);

const SortIndicator = ({ active, darkMode, direction, className, children, ...p }) => (
  <span
    className={cn('inline-block ml-[6px] text-[8px] transition-[transform,opacity] duration-150', className)}
    style={{
      color: active ? '#4285f4' : (darkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'),
      transform: direction === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)',
      opacity: active ? 1 : 0.5
    }}
    {...p}
  >{children}</span>
);

const Tooltip = ({ className, children, ...p }) => (
  <div className={cn('relative inline-block', className)} {...p}>{children}</div>
);

// ============== TokenListToolbar Styles ==============
const StyledToolbar = ({ className, children, ...p }) => (
  <div
    className={cn('flex items-center justify-between py-1 gap-[6px] flex-wrap max-[900px]:flex-row max-[900px]:items-stretch max-[900px]:flex-wrap max-[900px]:gap-[2px] max-[900px]:p-[2px]', className)}
    {...p}
  >{children}</div>
);

const PaginationContainer = ({ isDark, className, children, ...p }) => (
  <div
    className={cn(
      'flex items-center gap-1 py-[6px] px-[10px] min-h-[36px] rounded-lg border',
      'max-[900px]:w-full max-[900px]:justify-center max-[900px]:py-1 max-[900px]:px-2 max-[900px]:gap-[2px]',
      isDark ? 'bg-transparent border-white/[0.08]' : 'bg-white border-black/[0.08]',
      className
    )}
    {...p}
  >{children}</div>
);

const RowsSelector = ({ isDark, className, children, ...p }) => (
  <div
    className={cn(
      'flex items-center gap-1 py-[6px] px-[10px] min-h-[36px] rounded-lg border',
      'max-[900px]:flex-1 max-[900px]:min-w-[calc(50%-8px)] max-[900px]:justify-center max-[900px]:py-1 max-[900px]:px-2 max-[900px]:gap-[3px]',
      isDark ? 'bg-transparent border-white/[0.08]' : 'bg-white border-black/[0.08]',
      className
    )}
    {...p}
  >{children}</div>
);

const InfoBox = ({ isDark, className, children, ...p }) => (
  <div
    className={cn(
      'flex items-center gap-1 flex-wrap py-[6px] px-[10px] min-h-[36px] border rounded-lg',
      'max-[900px]:flex-1 max-[900px]:min-w-[calc(50%-8px)] max-[900px]:justify-start max-[900px]:gap-[3px] max-[900px]:py-1 max-[900px]:px-2',
      isDark ? 'bg-transparent border-white/[0.08]' : 'bg-white border-black/[0.08]',
      className
    )}
    {...p}
  >{children}</div>
);

const Chip = ({ isDark, className, children, ...p }) => (
  <span
    className={cn('text-[11px] font-medium tabular-nums py-[2px] px-[6px] border rounded', isDark ? 'border-white/[0.08] text-white' : 'border-black/[0.08] text-black', className)}
    {...p}
  >{children}</span>
);

const Text = ({ isDark, fontWeight, className, children, ...p }) => (
  <span
    className={cn('text-[11px] tabular-nums font-normal', isDark ? 'text-white/60' : 'text-black/65', className)}
    style={fontWeight ? { fontWeight } : undefined}
    {...p}
  >{children}</span>
);

const NavButton = ({ isDark, className, children, ...p }) => (
  <button
    className={cn(
      'w-[26px] h-[26px] rounded-lg border-none bg-transparent cursor-pointer inline-flex items-center justify-center p-0',
      isDark ? 'text-white/70 hover:enabled:bg-blue-500/10 disabled:text-white/20' : 'text-black/70 hover:enabled:bg-blue-500/[0.08] disabled:text-black/20',
      'disabled:cursor-not-allowed',
      className
    )}
    {...p}
  >{children}</button>
);

const PageButton = ({ selected, isDark, className, children, ...p }) => (
  <button
    className={cn(
      'min-w-[22px] h-[22px] rounded-lg border-none cursor-pointer inline-flex items-center justify-center px-[5px] m-0 text-[11px] tabular-nums',
      'disabled:cursor-not-allowed disabled:opacity-30',
      selected
        ? 'bg-[#4285f4] text-white font-medium hover:enabled:bg-[#3b7de8]'
        : cn(isDark ? 'text-white/80' : 'text-black/80', 'bg-transparent font-normal', isDark ? 'hover:enabled:bg-blue-500/10' : 'hover:enabled:bg-blue-500/[0.08]'),
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
    className={cn('bg-transparent border-none text-blue-500 font-medium text-[11px] cursor-pointer p-0 flex items-center gap-px min-w-[36px] hover:opacity-80', className)}
    {...p}
  >{children}</button>
);

const SelectMenu = ({ isDark, className, children, ...p }) => (
  <div
    className={cn('absolute top-full right-0 mt-1 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)] z-[1000] min-w-[50px] border', isDark ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-black/10', className)}
    {...p}
  >{children}</div>
);

const SelectOption = ({ isDark, className, children, ...p }) => (
  <button
    className={cn('block w-full py-[5px] px-[10px] border-none bg-transparent text-left cursor-pointer text-[11px]', isDark ? 'text-white hover:bg-blue-500/10' : 'text-black hover:bg-blue-500/[0.06]', className)}
    {...p}
  >{children}</button>
);

const CenterBox = ({ className, children, ...p }) => (
  <div className={cn('grow flex justify-center', className)} {...p}>{children}</div>
);

const DESKTOP_TABLE_HEAD = [
  { id: 'star', label: '', align: 'center', order: false, mobileHide: true },
  { id: 'rank', label: '#', align: 'center', order: false, mobileHide: true },
  { id: 'token', label: 'TOKEN', align: 'left', order: true, mobileHide: false },
  { id: 'exch', label: 'PRICE', align: 'right', order: true, mobileHide: false },
  {
    id: 'sparkline',
    label: 'TRENDING 24H',
    align: 'center',
    order: false,
    mobileHide: true,
    width: 128
  },
  { id: 'pro5m', label: '5M %', align: 'right', order: true, mobileHide: true },
  { id: 'pro1h', label: '1H %', align: 'right', order: true, mobileHide: true },
  { id: 'pro24h', label: '24H %', align: 'right', order: true, mobileHide: false },
  { id: 'pro7d', label: '7D %', align: 'right', order: true, mobileHide: true },
  { id: 'vol24hxrp', label: 'VOL (24H)', align: 'right', order: true, mobileHide: true },
  { id: 'dateon', label: 'CREATED', align: 'right', order: true, mobileHide: true },
  { id: 'vol24htx', label: 'TRADES', align: 'right', order: true, mobileHide: true },
  { id: 'tvl', label: 'LIQUIDITY', align: 'right', order: true, mobileHide: true },
  { id: 'marketcap', label: 'MARKET CAP', align: 'right', order: true, mobileHide: true },
  { id: 'holders', label: 'HOLDERS', align: 'right', order: true, mobileHide: true },
  { id: 'origin', label: 'SOURCE', align: 'right', order: true, mobileHide: true, style: { paddingLeft: 12, paddingRight: 16 } }
];

// ============== TokenListHead Component ==============
export const TokenListHead = memo(function TokenListHead({
  order,
  orderBy,
  onRequestSort,
  scrollLeft,
  tokens = [],
  darkMode,
  isMobile,
  isLoggedIn = false,
  viewMode = 'classic',
  customColumns = []
}) {
  const createSortHandler = useMemo(
    () => (id, no) => (event) => {
      onRequestSort(event, id, no);
    },
    [onRequestSort]
  );

  const getStickyLeft = useMemo(
    () => (id) => {
      return 'unset'; // No sticky columns anymore
    },
    []
  );

  // Get appropriate table headers based on view mode
  const getTableHeaders = () => {
    if (isMobile) {
      // Mobile column abbreviation map - matches all available options
      const mobileLabels = {
        price: 'PRICE',
        volume24h: 'VOL 24H',
        volume7d: 'VOL 7D',
        marketCap: 'MCAP',
        tvl: 'LIQ',
        holders: 'HOLDERS',
        trades: 'TRADES',
        supply: 'SUPPLY',
        created: 'CREATED',
        origin: 'SOURCE',
        pro5m: '5M %',
        pro1h: '1H %',
        pro24h: '24H %',
        pro7d: '7D %',
        pro30d: '30D %'
      };

      // Always use customColumns when available, regardless of viewMode
      let mobileCol1 = 'price';
      let mobileCol2 = 'pro24h';

      if (customColumns && customColumns.length >= 2) {
        mobileCol1 = customColumns[0];
        mobileCol2 = customColumns[1];
      }

      const mobileHeaders = [
        {
          id: 'token',
          label: 'TOKEN',
          align: 'left',
          width: '60%',
          order: true,
          sticky: false,
          mobileHide: false
        },
        {
          id: mobileCol1,
          label: mobileLabels[mobileCol1] || 'DATA',
          align: 'right',
          width: '20%',
          order: true,
          sticky: false,
          mobileHide: false
        },
        {
          id: mobileCol2,
          label: mobileLabels[mobileCol2] || 'VALUE',
          align: 'right',
          width: '20%',
          order: true,
          sticky: false,
          mobileHide: false
        }
      ];

      return mobileHeaders;
    }

    const baseHeaders = [
      {
        id: 'star',
        label: '',
        align: 'center',
        width: '40px',
        order: false,
        sticky: false,
        mobileHide: true
      },
      {
        id: 'rank',
        label: '#',
        align: 'center',
        width: '40px',
        order: false,
        sticky: false,
        mobileHide: true
      },
      {
        id: 'token',
        label: 'TOKEN',
        align: 'left',
        width: '250px',
        order: true,
        sticky: false,
        mobileHide: false
      }
    ];

    switch (viewMode) {
      case 'priceChange':
        return [
          ...baseHeaders,
          { id: 'exch', label: 'PRICE', align: 'right', width: '10%', order: true },
          {
            id: 'pro5m',
            label: '5M',
            align: 'right',
            width: '7%',
            order: true,
            tooltip: '5 minute change'
          },
          {
            id: 'pro1h',
            label: '1H',
            align: 'right',
            width: '7%',
            order: true,
            tooltip: '1 hour change'
          },
          {
            id: 'pro24h',
            label: '24H',
            align: 'right',
            width: '7%',
            order: true,
            tooltip: '24 hour change'
          },
          {
            id: 'pro7d',
            label: '7D',
            align: 'right',
            width: '7%',
            order: true,
            tooltip: '7 day change'
          },
          {
            id: 'pro30d',
            label: '30D',
            align: 'right',
            width: '7%',
            order: true,
            tooltip: '30 day estimate'
          },
          {
            id: 'vol24hxrp',
            label: 'VOL',
            align: 'right',
            width: '10%',
            order: true,
            tooltip: '24h volume'
          },
          { id: 'historyGraph', label: 'CHART', align: 'center', width: '15%', order: false }
        ];

      case 'marketData':
        return [
          ...baseHeaders,
          { id: 'exch', label: 'PRICE', align: 'right', width: '10%', order: true },
          {
            id: 'marketcap',
            label: 'MCAP',
            align: 'right',
            width: '12%',
            order: true,
            tooltip: 'Market cap'
          },
          {
            id: 'vol24hxrp',
            label: 'VOL',
            align: 'right',
            width: '10%',
            order: true,
            tooltip: '24h volume'
          },
          {
            id: 'tvl',
            label: 'TVL',
            align: 'right',
            width: '10%',
            order: true,
            tooltip: 'Total Value Locked'
          },
          {
            id: 'holders',
            label: 'HLDR',
            align: 'right',
            width: '10%',
            order: true,
            tooltip: 'Holders'
          },
          {
            id: 'supply',
            label: 'SUPPLY',
            align: 'right',
            width: '10%',
            order: true,
            tooltip: 'Total supply'
          },
          {
            id: 'origin',
            label: 'SRC',
            align: 'right',
            width: '10%',
            order: true,
            tooltip: 'Origin',
            style: { paddingLeft: 12, paddingRight: 16 }
          }
        ];

      case 'topGainers':
        return [
          ...baseHeaders,
          { id: 'exch', label: 'PRICE', align: 'right', width: '10%', order: true },
          {
            id: 'pro5m',
            label: '5M',
            align: 'right',
            width: '7%',
            order: true,
            tooltip: '5 minute change'
          },
          {
            id: 'pro1h',
            label: '1H',
            align: 'right',
            width: '7%',
            order: true,
            tooltip: '1 hour change'
          },
          {
            id: 'pro24h',
            label: '24H',
            align: 'right',
            width: '7%',
            order: true,
            tooltip: '24 hour change'
          },
          {
            id: 'pro7d',
            label: '7D',
            align: 'right',
            width: '7%',
            order: true,
            tooltip: '7 day change'
          },
          {
            id: 'vol24hxrp',
            label: 'VOL',
            align: 'right',
            width: '10%',
            order: true,
            tooltip: '24h volume'
          },
          {
            id: 'marketcap',
            label: 'MCAP',
            align: 'right',
            width: '10%',
            order: true,
            tooltip: 'Market cap'
          },
          { id: 'historyGraph', label: 'CHART', align: 'center', width: '15%', order: false }
        ];

      case 'trader':
        return [
          ...baseHeaders,
          { id: 'exch', label: 'PRICE', align: 'right', width: '10%', order: true },
          {
            id: 'pro5m',
            label: '5M',
            align: 'right',
            width: '8%',
            order: true,
            tooltip: '5 minute change'
          },
          {
            id: 'pro1h',
            label: '1H',
            align: 'right',
            width: '8%',
            order: true,
            tooltip: '1 hour change'
          },
          {
            id: 'pro24h',
            label: '24H',
            align: 'right',
            width: '8%',
            order: true,
            tooltip: '24 hour change'
          },
          {
            id: 'vol24hxrp',
            label: 'VOL',
            align: 'right',
            width: '10%',
            order: true,
            tooltip: '24h volume'
          },
          {
            id: 'vol24htx',
            label: 'TXS',
            align: 'right',
            width: '8%',
            order: true,
            tooltip: '24h trades'
          },
          {
            id: 'tvl',
            label: 'TVL',
            align: 'right',
            width: '10%',
            order: true,
            tooltip: 'Total Value Locked'
          },
          { id: 'historyGraph', label: 'CHART', align: 'center', width: '15%', order: false }
        ];

      case 'custom':
        const customHeaders = [
          {
            id: 'star',
            label: '',
            align: 'center',
            width: '40px',
            order: false,
            sticky: false,
            mobileHide: true
          },
          {
            id: 'rank',
            label: '#',
            align: 'center',
            width: '40px',
            order: false,
            sticky: false,
            mobileHide: true
          },
          {
            id: 'token',
            label: 'TOKEN',
            align: 'left',
            width: '250px',
            order: true,
            sticky: false,
            mobileHide: false
          }
        ];

        // Use default columns if customColumns is empty or undefined
        const columnsToUse =
          customColumns && customColumns.length > 0
            ? customColumns
            : ['price', 'pro24h', 'volume24h', 'marketCap', 'sparkline'];

        // Track if this is the last column being added
        let columnIndex = 0;
        const totalColumns = columnsToUse.length;

        // Add headers based on selected columns with fixed pixel widths
        columnsToUse.forEach((column, idx) => {
          const isLastColumn = idx === totalColumns - 1;
          const extraStyle = isLastColumn && column !== 'sparkline' ? { paddingRight: '24px' } : {};

          switch (column) {
            case 'price':
              customHeaders.push({
                id: 'exch',
                label: 'PRICE',
                align: 'right',
                width: '120px',
                order: true,
                style: extraStyle
              });
              break;
            case 'pro5m':
              customHeaders.push({
                id: 'pro5m',
                label: '5M',
                align: 'right',
                width: '90px',
                order: true,
                tooltip: '5 minute change',
                style: extraStyle
              });
              break;
            case 'pro1h':
              customHeaders.push({
                id: 'pro1h',
                label: '1H',
                align: 'right',
                width: '90px',
                order: true,
                tooltip: '1 hour change',
                style: extraStyle
              });
              break;
            case 'pro24h':
              customHeaders.push({
                id: 'pro24h',
                label: '24H',
                align: 'right',
                width: '90px',
                order: true,
                tooltip: '24 hour change',
                style: extraStyle
              });
              break;
            case 'pro7d':
              customHeaders.push({
                id: 'pro7d',
                label: '7D',
                align: 'right',
                width: '90px',
                order: true,
                tooltip: '7 day change',
                style: extraStyle
              });
              break;
            case 'pro30d':
              customHeaders.push({
                id: 'pro30d',
                label: '30D',
                align: 'right',
                width: '90px',
                order: true,
                tooltip: '30 day estimate',
                style: extraStyle
              });
              break;
            case 'volume24h':
              customHeaders.push({
                id: 'vol24hxrp',
                label: 'VOL',
                align: 'right',
                width: '130px',
                order: true,
                tooltip: '24h volume',
                style: extraStyle
              });
              break;
            case 'volume7d':
              customHeaders.push({
                id: 'vol7d',
                label: 'V7D',
                align: 'right',
                width: '130px',
                order: true,
                tooltip: '7d volume',
                style: extraStyle
              });
              break;
            case 'marketCap':
              customHeaders.push({
                id: 'marketcap',
                label: 'MCAP',
                align: 'right',
                width: '140px',
                order: true,
                tooltip: 'Market cap',
                style: extraStyle
              });
              break;
            case 'tvl':
              customHeaders.push({
                id: 'tvl',
                label: 'TVL',
                align: 'right',
                width: '120px',
                order: true,
                tooltip: 'Total Value Locked',
                style: extraStyle
              });
              break;
            case 'holders':
              customHeaders.push({
                id: 'holders',
                label: 'HLDR',
                align: 'right',
                width: '100px',
                order: true,
                tooltip: 'Holders',
                style: extraStyle
              });
              break;
            case 'trades':
              customHeaders.push({
                id: 'vol24htx',
                label: 'TXS',
                align: 'right',
                width: '100px',
                order: true,
                tooltip: '24h trades',
                style: extraStyle
              });
              break;
            case 'created':
              customHeaders.push({
                id: 'dateon',
                label: 'AGE',
                align: 'right',
                width: '100px',
                order: true,
                tooltip: 'Token age',
                style: extraStyle
              });
              break;
            case 'supply':
              customHeaders.push({
                id: 'supply',
                label: 'SUPPLY',
                align: 'right',
                width: '120px',
                order: true,
                tooltip: 'Total supply',
                style: extraStyle
              });
              break;
            case 'origin':
              customHeaders.push({
                id: 'origin',
                label: 'SRC',
                align: 'right',
                width: '90px',
                order: true,
                tooltip: 'Origin',
                style: { ...extraStyle, paddingLeft: 12, paddingRight: 16 }
              });
              break;
            case 'sparkline':
              customHeaders.push({
                id: 'historyGraph',
                label: 'CHART',
                align: 'right',
                width: '15%',
                order: false,
                style: { paddingLeft: '16px' }
              });
              break;
          }
        });

        return customHeaders;

      case 'classic':
      default:
        return DESKTOP_TABLE_HEAD;
    }
  };

  const TABLE_HEAD = getTableHeaders();

  // Always include star column to prevent layout shift when login state changes
  const filteredTableHead = TABLE_HEAD;

  return (
    <>
      <StyledTableHead darkMode={darkMode}>
        <tr>
          {filteredTableHead.map((headCell) => {
            const isSticky = headCell.sticky && (!isMobile || !headCell.mobileHide);

            return (
              <StyledTableCell
                key={headCell.id}
                align={headCell.align}
                width={headCell.width}
                darkMode={darkMode}
                isMobile={isMobile}
                sortable={headCell.order}
                sticky={isSticky}
                left={isSticky ? getStickyLeft(headCell.id) : 'unset'}
                stickyThird={headCell.id === 'token'}
                scrollLeft={scrollLeft && headCell.id === 'token'}
                isTokenColumn={headCell.id === 'token'}
                onClick={headCell.order ? createSortHandler(headCell.id, headCell.no) : undefined}
                style={headCell.style || {}}
              >
                {headCell.order ? (
                  <span>
                    {headCell.id === 'vol24hxrp' ? (
                      <>
                        Volume <span className="opacity-70 text-[10px]">24h</span>
                      </>
                    ) : (
                      headCell.label
                    )}
                    {orderBy === headCell.id && (
                      <SortIndicator active={true} direction={order} darkMode={darkMode}>
                        ▼
                      </SortIndicator>
                    )}
                  </span>
                ) : headCell.id === 'sparkline' ? (
                  <span>
                    Trendline <span className="opacity-70 text-[10px]">24h</span>
                  </span>
                ) : (
                  headCell.label
                )}
              </StyledTableCell>
            );
          })}
        </tr>
      </StyledTableHead>
    </>
  );
});

// ============== TokenListToolbar Component ==============
export const TokenListToolbar = memo(function TokenListToolbar({
  rows,
  setRows,
  page,
  setPage,
  tokens
}) {
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const filteredCount = useSelector(selectFilteredCount);
  const [selectOpen, setSelectOpen] = useState(false);
  const selectRef = useRef(null);

  const currentFilteredCount = filteredCount ?? 0;
  const num = currentFilteredCount / rows;
  let page_count = Math.floor(num);
  if (num % 1 !== 0) page_count++;
  page_count = Math.max(page_count, 1);

  const start = currentFilteredCount > 0 ? page * rows + 1 : 0;
  let end = start + rows - 1;
  if (end > currentFilteredCount) end = currentFilteredCount;

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

  const handleChangePage = useCallback(
    (newPage) => {
      setPage(newPage);
      gotoTop({ target: document });
    },
    [setPage, gotoTop]
  );

  const handleFirstPage = useCallback(() => {
    setPage(0);
    gotoTop({ target: document });
  }, [setPage, gotoTop]);

  const handleLastPage = useCallback(() => {
    setPage(page_count - 1);
    gotoTop({ target: document });
  }, [setPage, gotoTop, page_count]);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const current = page + 1;
    const total = page_count;

    if (total <= 7) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
    } else {
      if (current <= 3) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      } else if (current >= total - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(total);
      }
    }
    return pages;
  };

  return (
    <StyledToolbar>
      <InfoBox isDark={isDark} role="status" aria-label={`Showing ${start} to ${end} of ${currentFilteredCount.toLocaleString()} tokens`}>
        <Chip isDark={isDark}>{`${start}-${end} of ${currentFilteredCount.toLocaleString()}`}</Chip>
        <Text isDark={isDark}>tokens</Text>
      </InfoBox>

      <nav aria-label="Pagination" className="flex items-center justify-center gap-1 pt-3">
        <button
          type="button"
          onClick={() => handleChangePage(page - 1)}
          disabled={page === 0}
          aria-label="Previous page"
          className={cn(
            'p-1.5 rounded-md transition-[background-color]',
            page === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10',
            isDark ? 'text-white/50' : 'text-gray-500'
          )}
        >
          <ChevronLeft size={14} />
        </button>
        <span
          className={cn(
            'text-[11px] px-2 tabular-nums',
            isDark ? 'text-white/60' : 'text-gray-600'
          )}
        >
          {page + 1} / {page_count}
        </span>
        <button
          type="button"
          onClick={() => handleChangePage(page + 1)}
          disabled={page === page_count - 1}
          aria-label="Next page"
          className={cn(
            'p-1.5 rounded-md transition-[background-color]',
            page === page_count - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10',
            isDark ? 'text-white/50' : 'text-gray-500'
          )}
        >
          <ChevronRight size={14} />
        </button>
      </nav>

      <RowsSelector isDark={isDark}>
        <List size={12} />
        <Text isDark={isDark}>Rows</Text>
        <Select ref={selectRef}>
          <SelectButton onClick={() => setSelectOpen(!selectOpen)} aria-label={`Rows per page: ${rows}`} aria-expanded={selectOpen}>
            {rows}
            <ChevronDown size={12} />
          </SelectButton>
          {selectOpen && (
            <SelectMenu isDark={isDark}>
              <SelectOption isDark={isDark} onClick={() => handleChangeRows(100)}>
                100
              </SelectOption>
              <SelectOption isDark={isDark} onClick={() => handleChangeRows(50)}>
                50
              </SelectOption>
              <SelectOption isDark={isDark} onClick={() => handleChangeRows(20)}>
                20
              </SelectOption>
            </SelectMenu>
          )}
        </Select>
      </RowsSelector>
    </StyledToolbar>
  );
});

const TokenListControls = { TokenListHead, TokenListToolbar };

export default TokenListControls;
