import React, { useContext, memo, useMemo, useCallback, useState, useRef, useEffect } from 'react';
import styled from '@emotion/styled';
import { AppContext } from 'src/AppContext';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import ViewListIcon from '@mui/icons-material/ViewList';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { useSelector, useDispatch } from 'react-redux';
import { selectFilteredCount } from 'src/redux/statusSlice';
import { alpha } from '@mui/material';

// ============== TokenListHead Styles ==============
const StyledTableHead = styled.thead`
  position: sticky;
  top: ${(props) => props.scrollTopLength || 0}px;
  z-index: 100;
  overflow: visible !important;
  background: ${(props) =>
    props.darkMode
      ? 'linear-gradient(180deg, rgba(18, 18, 18, 0.98) 0%, rgba(18, 18, 18, 0.95) 100%)'
      : 'linear-gradient(180deg, rgba(255, 255, 255, 0.98) 0%, rgba(255, 255, 255, 0.95) 100%)'};
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);

  &::after {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    bottom: 0;
    height: 1px;
    background: linear-gradient(
      90deg,
      transparent 0%,
      ${(props) => props.darkMode ? 'rgba(66, 133, 244, 0.15)' : 'rgba(66, 133, 244, 0.1)'} 50%,
      transparent 100%
    );
  }
`;

const StyledTableCell = styled.th`
  font-weight: 600;
  font-size: 0.7rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)')};
  padding: ${(props) => (props.isMobile ? '14px 8px' : '14px 12px')};
  border-bottom: 1px solid
    ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)')};
  white-space: ${(props) => (props.isTokenColumn ? 'normal' : 'nowrap')};
  text-align: ${(props) => props.align || 'left'};
  width: ${(props) => props.width || 'auto'};
  min-width: ${(props) => (props.isTokenColumn ? '250px' : props.width || 'auto')};
  box-sizing: border-box;
  cursor: ${(props) => (props.sortable ? 'pointer' : 'default')};
  position: ${(props) => (props.sticky ? 'sticky' : 'relative')};
  left: ${(props) => props.left || 'unset'};
  z-index: ${(props) => (props.sticky ? 101 : 'auto')};
  background: ${(props) => (props.sticky ? (props.darkMode ? '#121212' : '#fff') : 'transparent')};
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  overflow: visible !important;

  &:hover {
    color: ${(props) => (props.sortable ? (props.darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)') : 'inherit')};
  }

  ${(props) =>
    props.scrollLeft &&
    props.stickyThird &&
    `
    &::after {
      content: "";
      position: absolute;
      right: -1px;
      top: 0;
      bottom: 0;
      width: 1px;
      background: ${props.darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'};
      box-shadow: 2px 0 4px rgba(0, 0, 0, 0.08);
    }
  `}
`;

const SortIndicator = styled.span`
  display: inline-block;
  margin-left: 4px;
  font-size: 0.6rem;
  color: ${(props) => (props.active ? '#4285f4' : props.darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)')};
  transform: ${(props) => (props.direction === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)')};
  opacity: ${(props) => (props.active ? 1 : 0.6)};
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
    border-radius: 4px;
    font-size: 14px !important;
    white-space: nowrap;
    z-index: 99999999 !important;
    transition: none !important;
    pointer-events: none;
    border: 2px solid yellow !important;

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
  padding: 4px 8px;
  border-radius: 16px;
  background: ${({ theme }) => theme.pagination?.background || theme.palette.background.paper};
  border: 1px solid ${({ theme }) => theme.pagination?.border || alpha(theme.palette.divider, 0.12)};
  box-shadow: ${({ theme }) => theme.pagination?.boxShadow || '0 2px 4px rgba(0, 0, 0, 0.04)'};
  backdrop-filter: blur(10px);

  @media (max-width: 900px) {
    width: 100%;
    justify-content: center;
    padding: 2px 4px;
  }
`;

const RowsSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 16px;
  background: ${({ theme }) => theme.pagination?.background || theme.palette.background.paper};
  border: 1px solid ${({ theme }) => theme.pagination?.border || alpha(theme.palette.divider, 0.12)};
  box-shadow: ${({ theme }) => theme.pagination?.boxShadow || '0 2px 4px rgba(0, 0, 0, 0.04)'};
  backdrop-filter: blur(10px);

  @media (max-width: 900px) {
    flex: 1;
    min-width: calc(50% - 8px);
    justify-content: center;
    padding: 4px 8px;
    gap: 2px;
  }
`;

const InfoBox = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  border: 1px solid ${({ theme }) => theme.pagination?.border || alpha(theme.palette.divider, 0.12)};
  border-radius: 16px;
  background: ${({ theme }) => theme.pagination?.background || theme.palette.background.paper};
  box-shadow: ${({ theme }) => theme.pagination?.boxShadow || '0 2px 4px rgba(0, 0, 0, 0.04)'};
  padding: 4px 8px;
  backdrop-filter: blur(10px);

  @media (max-width: 900px) {
    flex: 1;
    min-width: calc(50% - 8px);
    justify-content: flex-start;
    gap: 4px;
    padding: 4px 8px;
  }
`;

const Chip = styled.span`
  font-size: 12px;
  font-weight: 600;
  padding: 2px 6px;
  border: 1px solid ${({ theme }) => theme.pagination?.border || alpha(theme.palette.divider, 0.32)};
  border-radius: 6px;
  color: ${({ theme }) => theme.pagination?.textColor || theme.palette.text.primary};
`;

const Text = styled.span`
  font-size: 12px;
  color: ${({ theme }) => theme.pagination?.textColor || theme.palette.text.secondary};
  font-weight: ${(props) => props.fontWeight || 500};
`;

const NavButton = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: inherit;
  padding: 0;

  &:hover:not(:disabled) {
    background: ${({ theme }) =>
      theme.pagination?.backgroundHover || alpha(theme.palette.primary.main, 0.08)};
  }

  &:disabled {
    color: ${({ theme }) => alpha(theme.pagination?.textColor || theme.palette.text.primary, 0.48)};
    cursor: not-allowed;
  }
`;

const PageButton = styled.button`
  min-width: 20px;
  height: 20px;
  border-radius: 6px;
  border: none;
  background: ${(props) =>
    props.selected
      ? props.theme.pagination?.selectedBackground || props.theme.palette.primary.main
      : 'transparent'};
  color: ${(props) =>
    props.selected ? props.theme.pagination?.selectedTextColor || 'white' : 'inherit'};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 4px;
  margin: 0;
  font-size: 12px;
  font-weight: ${(props) => (props.selected ? 600 : 500)};

  &:hover:not(:disabled) {
    background: ${(props) =>
      props.selected
        ? props.theme.palette.primary.dark || '#1976D2'
        : props.theme.pagination?.backgroundHover || alpha(props.theme.palette.primary.main, 0.08)};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
`;

const Select = styled.div`
  position: relative;
  display: inline-block;
`;

const SelectButton = styled.button`
  background: transparent;
  border: none;
  color: ${({ theme }) => theme.palette.primary.main};
  font-weight: 600;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 2px;
  min-width: 40px;

  &:hover {
    background: ${({ theme }) => alpha(theme.palette.primary.main, 0.04)};
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
  background: ${({ theme }) => theme.palette.background.paper};
  border: 1px solid ${({ theme }) => alpha(theme.palette.divider, 0.12)};
  border-radius: 4px;
  box-shadow: ${({ theme }) => theme.shadows?.[4] || '0 4px 12px rgba(0, 0, 0, 0.15)'};
  z-index: 1000;
  min-width: 60px;
  backdrop-filter: blur(10px);
`;

const SelectOption = styled.button`
  display: block;
  width: 100%;
  padding: 6px 12px;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
  font-size: 12px;
  color: ${({ theme }) => theme.palette.text.primary};

  &:hover {
    background: ${({ theme }) => alpha(theme.palette.action.hover, 0.04)};
  }
`;

const CenterBox = styled.div`
  flex-grow: 1;
  display: flex;
  justify-content: center;
`;

const DESKTOP_TABLE_HEAD = [
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
  },
  {
    id: 'exch',
    label: 'PRICE',
    align: 'right',
    width: '8%',
    order: true,
    sticky: false,
    mobileHide: false
  },
  {
    id: 'pro5m',
    label: '5M %',
    align: 'right',
    width: '7%',
    order: true,
    sticky: false,
    mobileHide: true,
    tooltip: '5 minute change'
  },
  {
    id: 'pro1h',
    label: '1H %',
    align: 'right',
    width: '7%',
    order: true,
    sticky: false,
    mobileHide: true,
    tooltip: '1 hour change'
  },
  {
    id: 'pro24h',
    label: '24H %',
    align: 'right',
    width: '7%',
    order: true,
    sticky: false,
    mobileHide: false,
    tooltip: '24 hour change'
  },
  {
    id: 'pro7d',
    label: '7D %',
    align: 'right',
    width: '7%',
    order: true,
    sticky: false,
    mobileHide: true,
    tooltip: '7 day change'
  },
  {
    id: 'vol24hxrp',
    label: 'VOLUME',
    align: 'right',
    width: '8%',
    order: true,
    sticky: false,
    mobileHide: true,
    tooltip: '24h volume in XRP'
  },
  {
    id: 'dateon',
    label: 'CREATED',
    align: 'right',
    width: '8%',
    order: true,
    sticky: false,
    mobileHide: true,
    tooltip: 'Token creation date'
  },
  {
    id: 'vol24htx',
    label: 'TRADES',
    align: 'right',
    width: '7%',
    order: true,
    sticky: false,
    mobileHide: true,
    tooltip: '24h trade count'
  },
  {
    id: 'tvl',
    label: 'TVL',
    align: 'right',
    width: '10%',
    order: true,
    sticky: false,
    mobileHide: true,
    tooltip: 'Total Value Locked'
  },
  {
    id: 'marketcap',
    label: 'MARKET CAP',
    align: 'right',
    width: '10%',
    order: true,
    sticky: false,
    mobileHide: true,
    tooltip: 'Market capitalization'
  },
  {
    id: 'holders',
    label: 'HOLDERS',
    align: 'right',
    width: '10%',
    order: true,
    sticky: false,
    mobileHide: true,
    tooltip: 'Number of holders'
  },
  {
    id: 'origin',
    label: 'ORIGIN',
    align: 'right',
    width: '13%',
    order: true,
    sticky: false,
    mobileHide: true,
    tooltip: 'Token origin',
    style: { paddingRight: '16px' }
  },
  {
    id: 'historyGraph',
    label: 'LAST 24H',
    align: 'right',
    width: '15%',
    order: false,
    sticky: false,
    mobileHide: true,
    style: { paddingLeft: '16px' }
  }
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
        volume24h: 'VOL',
        volume7d: 'V7D',
        marketCap: 'MCAP',
        tvl: 'TVL',
        holders: 'HLDR',
        trades: 'TRDS',
        supply: 'SUPP',
        created: 'AGE',
        origin: 'ORIG',
        pro5m: '5M%',
        pro1h: '1H%',
        pro24h: '24H%',
        pro7d: '7D%',
        pro30d: '30D%'
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
            label: '1H %',
            align: 'right',
            width: '8%',
            order: true,
            tooltip: '1 hour change'
          },
          {
            id: 'pro24h',
            label: '24H %',
            align: 'right',
            width: '8%',
            order: true,
            tooltip: '24 hour change'
          },
          {
            id: 'pro7d',
            label: '7D %',
            align: 'right',
            width: '8%',
            order: true,
            tooltip: '7 day change'
          },
          {
            id: 'pro30d',
            label: '30D %',
            align: 'right',
            width: '8%',
            order: true,
            tooltip: '30 day estimate'
          },
          {
            id: 'vol24hxrp',
            label: 'VOL 24H',
            align: 'right',
            width: '10%',
            order: true,
            tooltip: '24h volume'
          },
          {
            id: 'vol7d',
            label: 'VOL 7D',
            align: 'right',
            width: '10%',
            order: true,
            tooltip: '7d volume estimate'
          },
          { id: 'historyGraph', label: 'SPARKLINE', align: 'center', width: '15%', order: false }
        ];

      case 'marketData':
        return [
          ...baseHeaders,
          { id: 'exch', label: 'PRICE', align: 'right', width: '10%', order: true },
          {
            id: 'marketcap',
            label: 'MARKET CAP',
            align: 'right',
            width: '12%',
            order: true,
            tooltip: 'Market capitalization'
          },
          {
            id: 'vol24hxrp',
            label: 'VOLUME',
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
            label: 'HOLDERS',
            align: 'right',
            width: '10%',
            order: true,
            tooltip: 'Number of holders'
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
            label: 'ORIGIN',
            align: 'right',
            width: '10%',
            order: true,
            tooltip: 'Token origin'
          }
        ];

      case 'topGainers':
        return [
          ...baseHeaders,
          { id: 'exch', label: 'PRICE', align: 'right', width: '10%', order: true },
          {
            id: 'pro5m',
            label: '5M %',
            align: 'right',
            width: '8%',
            order: true,
            tooltip: '5 minute change'
          },
          {
            id: 'pro1h',
            label: '1H %',
            align: 'right',
            width: '8%',
            order: true,
            tooltip: '1 hour change'
          },
          {
            id: 'pro24h',
            label: '24H %',
            align: 'right',
            width: '8%',
            order: true,
            tooltip: '24 hour change'
          },
          {
            id: 'pro7d',
            label: '7D %',
            align: 'right',
            width: '8%',
            order: true,
            tooltip: '7 day change'
          },
          {
            id: 'vol24hxrp',
            label: 'VOLUME',
            align: 'right',
            width: '10%',
            order: true,
            tooltip: '24h volume'
          },
          { id: 'historyGraph', label: 'LAST 24H', align: 'center', width: '15%', order: false }
        ];

      case 'trader':
        return [
          ...baseHeaders,
          { id: 'exch', label: 'PRICE', align: 'right', width: '10%', order: true },
          {
            id: 'vol24htx',
            label: 'TRADES',
            align: 'right',
            width: '10%',
            order: true,
            tooltip: '24h trade count'
          },
          {
            id: 'vol24hxrp',
            label: 'VOLUME',
            align: 'right',
            width: '10%',
            order: true,
            tooltip: '24h volume'
          },
          {
            id: 'pro24h',
            label: '24H %',
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
            label: 'CREATED',
            align: 'right',
            width: '10%',
            order: true,
            tooltip: 'Token creation date'
          },
          { id: 'historyGraph', label: 'LAST 24H', align: 'center', width: '15%', order: false }
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
                label: '5M %',
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
                label: '1H %',
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
                label: '24H %',
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
                label: '7D %',
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
                label: '30D %',
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
                label: 'VOLUME 24H',
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
                label: 'VOLUME 7D',
                align: 'right',
                width: '130px',
                order: true,
                tooltip: '7d volume estimate',
                style: extraStyle
              });
              break;
            case 'marketCap':
              customHeaders.push({
                id: 'marketcap',
                label: 'MARKET CAP',
                align: 'right',
                width: '140px',
                order: true,
                tooltip: 'Market capitalization',
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
                label: 'HOLDERS',
                align: 'right',
                width: '100px',
                order: true,
                tooltip: 'Number of holders',
                style: extraStyle
              });
              break;
            case 'trades':
              customHeaders.push({
                id: 'vol24htx',
                label: 'TRADES',
                align: 'right',
                width: '100px',
                order: true,
                tooltip: '24h trade count',
                style: extraStyle
              });
              break;
            case 'created':
              customHeaders.push({
                id: 'dateon',
                label: 'CREATED',
                align: 'right',
                width: '100px',
                order: true,
                tooltip: 'Token creation date',
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
                label: 'ORIGIN',
                align: 'right',
                width: '90px',
                order: true,
                tooltip: 'Token origin',
                style: extraStyle
              });
              break;
            case 'sparkline':
              customHeaders.push({
                id: 'historyGraph',
                label: 'LAST 24H',
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
                    {headCell.label}
                    {orderBy === headCell.id && (
                      <SortIndicator active={true} direction={order} darkMode={darkMode}>
                        ▼
                      </SortIndicator>
                    )}
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
export const TokenListToolbar = memo(function TokenListToolbar({ rows, setRows, page, setPage, tokens }) {
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
      <InfoBox>
        <Chip>{`${start}-${end} of ${currentFilteredCount.toLocaleString()}`}</Chip>
        <Text>tokens</Text>
      </InfoBox>

      <CenterBox>
        <PaginationContainer>
          <NavButton onClick={handleFirstPage} disabled={page === 0} title="First page">
            <FirstPageIcon sx={{ width: 14, height: 14 }} />
          </NavButton>

          {getPageNumbers().map((pageNum, idx) => {
            if (pageNum === '...') {
              return (
                <span key={`ellipsis-${idx}`} style={{ padding: '0 4px', fontSize: '12px' }}>
                  ...
                </span>
              );
            }
            return (
              <PageButton
                key={pageNum}
                selected={pageNum === page + 1}
                onClick={() => handleChangePage(pageNum - 1)}
              >
                {pageNum}
              </PageButton>
            );
          })}

          <NavButton onClick={handleLastPage} disabled={page === page_count - 1} title="Last page">
            <LastPageIcon sx={{ width: 14, height: 14 }} />
          </NavButton>
        </PaginationContainer>
      </CenterBox>

      <RowsSelector>
        <ViewListIcon sx={{ width: 14, height: 14 }} />
        <Text>Rows</Text>
        <Select ref={selectRef}>
          <SelectButton onClick={() => setSelectOpen(!selectOpen)}>
            {rows}
            <ArrowDropDownIcon sx={{ width: 16, height: 16 }} />
          </SelectButton>
          {selectOpen && (
            <SelectMenu>
              <SelectOption onClick={() => handleChangeRows(100)}>100</SelectOption>
              <SelectOption onClick={() => handleChangeRows(50)}>50</SelectOption>
              <SelectOption onClick={() => handleChangeRows(20)}>20</SelectOption>
            </SelectMenu>
          )}
        </Select>
      </RowsSelector>
    </StyledToolbar>
  );
});

export default { TokenListHead, TokenListToolbar };