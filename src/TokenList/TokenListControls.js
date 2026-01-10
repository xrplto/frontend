import React, { useContext, memo, useMemo, useCallback, useState, useRef, useEffect } from 'react';
import styled from '@emotion/styled';
import { AppContext } from 'src/AppContext';
import { ChevronsLeft, ChevronsRight, List, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { selectFilteredCount } from 'src/redux/statusSlice';
import { cn } from 'src/utils/cn';

// ============== TokenListHead Styles ==============
const StyledTableHead = styled.thead`
  position: sticky;
  top: ${(props) => props.scrollTopLength || 0}px;
  z-index: 100;
  background: ${(props) => (props.darkMode ? 'transparent' : 'rgba(255, 255, 255, 0.95)')};
  backdrop-filter: blur(12px);
`;

const StyledTableCell = styled.th`
  font-weight: 500;
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.45)')};
  padding: ${(props) => (props.isMobile ? '12px 6px' : '14px 4px')};
  border-bottom: 1px solid
    ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)')};
  white-space: nowrap;
  text-align: ${(props) => props.align || 'left'};
  box-sizing: border-box;
  cursor: ${(props) => (props.sortable ? 'pointer' : 'default')};
  position: ${(props) => (props.sticky ? 'sticky' : 'relative')};
  left: ${(props) => props.left || 'unset'};
  z-index: ${(props) => (props.sticky ? 101 : 'auto')};
  background: ${(props) => (props.sticky ? (props.darkMode ? 'transparent' : 'rgba(255, 255, 255, 0.95)') : 'transparent')};
  font-family: inherit;
  transition: color 0.15s ease;
  width: ${(props) => (props.width ? `${props.width}px` : 'auto')};
  max-width: ${(props) => (props.width ? `${props.width}px` : 'none')};

  &:first-of-type {
    padding-left: 12px;
  }

  &:last-of-type {
    padding-right: 12px;
  }

  &:hover {
    color: ${(props) => (props.sortable ? (props.darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)') : 'inherit')};
  }
`;

const SortIndicator = styled.span`
  display: inline-block;
  margin-left: 6px;
  font-size: 8px;
  color: ${(props) => (props.active ? '#4285f4' : props.darkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)')};
  transform: ${(props) => (props.direction === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)')};
  opacity: ${(props) => (props.active ? 1 : 0.5)};
  transition: transform 0.15s ease, color 0.15s ease;
`;

const Tooltip = styled.div`
  position: relative;
  display: inline-block;

  .tooltip-content {
    visibility: hidden;
    opacity: 0;
    position: fixed !important;
    background-color: red !important;
    color: white !important;
    padding: 8px 12px !important;
    border-radius: 8px;
    font-size: 14px !important;
    white-space: nowrap;
    z-index: 99999999 !important;
    transition: none !important;
    pointer-events: none;

    &:after {
      content: '';
      position: absolute;
      top: 100%;
      left: 50%;
      margin-left: -5px;
      border-width: 5px;
      border-style: solid;
      border-color: rgba(0, 0, 0, 0.9) transparent transparent transparent;
    }
  }
`;

// ============== TokenListToolbar Styles ==============
const StyledToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0;
  gap: 6px;
  flex-wrap: wrap;

  @media (max-width: 900px) {
    flex-direction: row;
    align-items: stretch;
    flex-wrap: wrap;
    gap: 2px;
    padding: 2px;
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  min-height: 36px;
  border-radius: 8px;
  background: ${({ isDark }) => isDark ? 'transparent' : '#fff'};
  border: 1px solid ${({ isDark }) => isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};

  @media (max-width: 900px) {
    width: 100%;
    justify-content: center;
    padding: 4px 8px;
    gap: 2px;
  }
`;

const RowsSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  min-height: 36px;
  border-radius: 8px;
  background: ${({ isDark }) => isDark ? 'transparent' : '#fff'};
  border: 1px solid ${({ isDark }) => isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};

  @media (max-width: 900px) {
    flex: 1;
    min-width: calc(50% - 8px);
    justify-content: center;
    padding: 4px 8px;
    gap: 3px;
  }
`;

const InfoBox = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  padding: 6px 10px;
  min-height: 36px;
  border: 1px solid ${({ isDark }) => isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};
  border-radius: 8px;
  background: ${({ isDark }) => isDark ? 'transparent' : '#fff'};

  @media (max-width: 900px) {
    flex: 1;
    min-width: calc(50% - 8px);
    justify-content: flex-start;
    gap: 3px;
    padding: 4px 8px;
  }
`;

const Chip = styled.span`
  font-size: 11px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  padding: 2px 6px;
  border: 1px solid ${({ isDark }) => isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};
  border-radius: 4px;
  color: ${({ isDark }) => isDark ? '#fff' : '#000'};
`;

const Text = styled.span`
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  color: ${({ isDark }) => isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)'};
  font-weight: ${(props) => props.fontWeight || 400};
`;

const NavButton = styled.button`
  width: 26px;
  height: 26px;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ isDark }) => isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'};
  padding: 0;

  &:hover:not(:disabled) {
    background: ${({ isDark }) => isDark ? 'rgba(66, 133, 244, 0.1)' : 'rgba(66, 133, 244, 0.08)'};
  }

  &:disabled {
    color: ${({ isDark }) => isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
    cursor: not-allowed;
  }
`;

const PageButton = styled.button`
  min-width: 22px;
  height: 22px;
  border-radius: 8px;
  border: none;
  background: ${(props) => props.selected ? '#4285f4' : 'transparent'};
  color: ${(props) => props.selected ? 'white' : props.isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 5px;
  margin: 0;
  font-size: 11px;
  font-weight: ${(props) => (props.selected ? 500 : 400)};
  font-variant-numeric: tabular-nums;

  &:hover:not(:disabled) {
    background: ${(props) =>
      props.selected ? '#3b7de8' : props.isDark ? 'rgba(66, 133, 244, 0.1)' : 'rgba(66, 133, 244, 0.08)'};
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
  gap: 1px;
  min-width: 36px;

  &:hover {
    opacity: 0.8;
  }
`;

const SelectMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: ${({ isDark }) => isDark ? '#1a1a1a' : '#fff'};
  border: 1px solid ${({ isDark }) => isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  min-width: 50px;
`;

const SelectOption = styled.button`
  display: block;
  width: 100%;
  padding: 5px 10px;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font-size: 11px;
  color: ${({ isDark }) => isDark ? '#fff' : '#000'};

  &:hover {
    background: ${({ isDark }) => isDark ? 'rgba(66, 133, 244, 0.1)' : 'rgba(66, 133, 244, 0.06)'};
  }
`;

const CenterBox = styled.div`
  flex-grow: 1;
  display: flex;
  justify-content: center;
`;

const DESKTOP_TABLE_HEAD = [
  { id: 'star', label: '', align: 'center', order: false, mobileHide: true },
  { id: 'rank', label: '#', align: 'center', order: false, mobileHide: true },
  { id: 'token', label: 'TOKEN', align: 'left', order: true, mobileHide: false },
  { id: 'exch', label: 'PRICE', align: 'right', order: true, mobileHide: false },
  { id: 'sparkline', label: 'TRENDING 24H', align: 'center', order: false, mobileHide: true, width: 128 },
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
  { id: 'origin', label: 'SOURCE', align: 'right', order: true, mobileHide: true }
];


// ============== TokenListHead Component ==============
export const TokenListHead = memo(function TokenListHead({
  order,
  orderBy,
  onRequestSort,
  scrollLeft,
  tokens = [],
  scrollTopLength,
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
            id: 'pro7d',
            label: '7D',
            align: 'right',
            width: '8%',
            order: true,
            tooltip: '7 day change'
          },
          {
            id: 'pro30d',
            label: '30D',
            align: 'right',
            width: '8%',
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
          {
            id: 'vol7d',
            label: 'V7D',
            align: 'right',
            width: '10%',
            order: true,
            tooltip: '7d volume'
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
            tooltip: 'Origin'
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
            id: 'pro7d',
            label: '7D',
            align: 'right',
            width: '8%',
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
          { id: 'historyGraph', label: 'CHART', align: 'center', width: '15%', order: false }
        ];

      case 'trader':
        return [
          ...baseHeaders,
          { id: 'exch', label: 'PRICE', align: 'right', width: '10%', order: true },
          {
            id: 'vol24htx',
            label: 'TXS',
            align: 'right',
            width: '10%',
            order: true,
            tooltip: '24h trades'
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
            id: 'pro24h',
            label: '24H',
            align: 'right',
            width: '8%',
            order: true,
            tooltip: '24 hour change'
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
            id: 'dateon',
            label: 'AGE',
            align: 'right',
            width: '10%',
            order: true,
            tooltip: 'Token age'
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
                style: extraStyle
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

  // Filter out star column if user is not logged in
  const filteredTableHead = TABLE_HEAD.filter((headCell) => {
    if (headCell.id === 'star' && !isLoggedIn) return false;
    return true;
  });

  return (
    <>
      <StyledTableHead scrollTopLength={scrollTopLength} darkMode={darkMode}>
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
                      <>Volume <span style={{ opacity: 0.5, fontSize: '10px' }}>24h</span></>
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
                  <span>Trendline <span style={{ opacity: 0.5, fontSize: '10px' }}>24h</span></span>
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
export const TokenListToolbar = memo(function TokenListToolbar({ rows, setRows, page, setPage, tokens }) {
  const { themeName } = useContext(AppContext);
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
      <InfoBox isDark={isDark}>
        <Chip isDark={isDark}>{`${start}-${end} of ${currentFilteredCount.toLocaleString()}`}</Chip>
        <Text isDark={isDark}>tokens</Text>
      </InfoBox>

      <div className="flex items-center justify-center gap-1 pt-3">
        <button
          type="button"
          onClick={() => handleChangePage(page - 1)}
          disabled={page === 0}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            page === 0 ? "opacity-30 cursor-not-allowed" : "hover:bg-white/10",
            isDark ? "text-white/50" : "text-gray-500"
          )}
        >
          <ChevronLeft size={14} />
        </button>
        <span className={cn("text-[11px] px-2 tabular-nums", isDark ? "text-white/40" : "text-gray-500")}>
          {page + 1} / {page_count}
        </span>
        <button
          type="button"
          onClick={() => handleChangePage(page + 1)}
          disabled={page === page_count - 1}
          className={cn(
            "p-1.5 rounded-md transition-colors",
            page === page_count - 1 ? "opacity-30 cursor-not-allowed" : "hover:bg-white/10",
            isDark ? "text-white/50" : "text-gray-500"
          )}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <RowsSelector isDark={isDark}>
        <List size={12} />
        <Text isDark={isDark}>Rows</Text>
        <Select ref={selectRef}>
          <SelectButton onClick={() => setSelectOpen(!selectOpen)}>
            {rows}
            <ChevronDown size={12} />
          </SelectButton>
          {selectOpen && (
            <SelectMenu isDark={isDark}>
              <SelectOption isDark={isDark} onClick={() => handleChangeRows(100)}>100</SelectOption>
              <SelectOption isDark={isDark} onClick={() => handleChangeRows(50)}>50</SelectOption>
              <SelectOption isDark={isDark} onClick={() => handleChangeRows(20)}>20</SelectOption>
            </SelectMenu>
          )}
        </Select>
      </RowsSelector>
    </StyledToolbar>
  );
});

const TokenListControls = { TokenListHead, TokenListToolbar };

export default TokenListControls;