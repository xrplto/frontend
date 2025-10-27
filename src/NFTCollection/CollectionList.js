import axios from 'axios';
import React, { useState, useEffect, useContext, useMemo, useCallback, memo, useRef } from 'react';
import ReactDOM from 'react-dom';
import styled from '@emotion/styled';
import { useTheme } from '@mui/material/styles';
import { AppContext } from 'src/AppContext';
import { formatMonthYearDate } from 'src/utils/formatters';
import { fNumber, fIntNumber, fVolume } from 'src/utils/formatters';
import dynamic from 'next/dynamic';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import ViewListIcon from '@mui/icons-material/ViewList';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import { alpha, Box } from '@mui/material';
import { MobileHeader, HeaderCell } from 'src/TokenList/TokenRow';

// Lazy load chart component
const Sparkline = dynamic(() => import('src/components/Sparkline'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        width: '200px',
        height: '45px',
        background: 'rgba(128, 128, 128, 0.05)',
        borderRadius: '4px'
      }}
    />
  )
});

// Optimized chart wrapper with direct canvas rendering
const OptimizedChart = memo(
  ({ salesData, darkMode }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [tooltip, setTooltip] = useState(null);
    const chartRef = useRef(null);
    const canvasRef = useRef(null);
    const observerRef = useRef(null);
    const pointsRef = useRef([]);
    const theme = useTheme();

    useEffect(() => {
      if (!chartRef.current) return;

      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (observerRef.current) {
              observerRef.current.disconnect();
            }
          }
        },
        {
          rootMargin: '100px',
          threshold: 0.01
        }
      );

      observerRef.current.observe(chartRef.current);

      return () => {
        if (observerRef.current) {
          observerRef.current.disconnect();
        }
      };
    }, []);

    // Draw chart on canvas
    useEffect(() => {
      if (!salesData || !canvasRef.current || !isVisible) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!salesData.length) return;

      // Set canvas size
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      const width = rect.width;
      const height = rect.height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      if (salesData.length < 2) return;

      // Calculate min/max for scaling
      const values = salesData.map((d) => d.value);
      const minValue = Math.min(...values);
      const maxValue = Math.max(...values);
      const range = maxValue - minValue;

      // Scale points to canvas with padding
      const padding = height * 0.1;
      const chartHeight = height - padding * 2;

      const points = salesData.map((item, index) => {
        const x = (index / (salesData.length - 1)) * width;
        const y =
          range === 0
            ? height / 2
            : padding + chartHeight - ((item.value - minValue) / range) * chartHeight;
        return { x, y, value: item.value, sales: item.sales, date: item.date };
      });

      pointsRef.current = points;

      const color = '#00AB55';

      // Draw gradient fill
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, color + '66');
      gradient.addColorStop(1, color + '00');

      ctx.beginPath();
      ctx.moveTo(points[0].x, height - padding);
      points.forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.lineTo(points[points.length - 1].x, height - padding);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw line
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.forEach((point) => ctx.lineTo(point.x, point.y));
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }, [salesData, isVisible, theme]);

    const handleMouseMove = (e) => {
      if (!pointsRef.current.length) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const closest = pointsRef.current.reduce((prev, curr) =>
        Math.abs(curr.x - x) < Math.abs(prev.x - x) ? curr : prev
      );
      setTooltip({
        ...closest,
        screenX: e.clientX,
        screenY: e.clientY
      });
    };

    const handleMouseLeave = () => setTooltip(null);

    // Don't render chart until visible
    if (!isVisible) {
      return (
        <div
          ref={chartRef}
          style={{
            width: '200px',
            height: '45px',
            background: 'rgba(128, 128, 128, 0.05)',
            borderRadius: '4px',
            contain: 'layout size style'
          }}
        />
      );
    }

    return (
      <div
        ref={chartRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          width: '200px',
          height: '45px',
          display: 'inline-block',
          contain: 'layout size style',
          position: 'relative'
        }}
      >
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%',
            display: 'block'
          }}
        />
        {tooltip && typeof window !== 'undefined' && ReactDOM.createPortal(
          <div
            style={{
              position: 'fixed',
              left: tooltip.screenX + 10,
              top: tooltip.screenY - 50,
              background: 'rgba(0,0,0,0.9)',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: '4px',
              fontSize: '11px',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              zIndex: 9999
            }}
          >
            <div>{tooltip.date}</div>
            <div>Vol: ✕{tooltip.value.toFixed(2)}</div>
            <div>Sales: {tooltip.sales}</div>
          </div>,
          document.body
        )}
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      JSON.stringify(prevProps.salesData) === JSON.stringify(nextProps.salesData) &&
      prevProps.darkMode === nextProps.darkMode
    );
  }
);

OptimizedChart.displayName = 'OptimizedChart';

// Styled Components - TokenList Pattern
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
  padding-top: 2px;
  padding-bottom: 2px;
  padding-left: ${(props) => (props.isMobile ? '0' : '0')};
  padding-right: ${(props) => (props.isMobile ? '0' : '0')};
  overflow-x: auto;
  overflow-y: visible;
  width: 100%;
  min-width: 0;
  scrollbar-width: none;
  box-sizing: border-box;

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
      background: ${(props) => (props.darkMode ? 'rgba(66, 133, 244, 0.02)' : 'rgba(66, 133, 244, 0.015)')};
    }
  }

  td {
    padding: 12px 10px;
  }
`;

const StyledRow = styled.tr`
  border-bottom: 1px solid ${(props) => (props.theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)')};
  cursor: pointer;

  &:hover {
    background: ${(props) => (props.theme.palette.mode === 'dark' ? 'rgba(66, 133, 244, 0.02)' : 'rgba(66, 133, 244, 0.015)')};
  }
`;

const StyledCell = styled.td`
  padding: 12px 10px;
  white-space: ${(props) => (props.isCollectionColumn ? 'normal' : 'nowrap')};
  text-align: ${(props) => props.align || 'left'};
  font-size: 13px;
  font-weight: ${(props) => props.fontWeight || 400};
  color: ${(props) => props.color || props.theme.palette.text.primary};
  vertical-align: middle;
  width: ${(props) => props.width || 'auto'};
  min-width: ${(props) => (props.isCollectionColumn ? '250px' : 'auto')};
`;

// Mobile components
const MobileCollectionCard = styled.div`
  display: flex;
  width: 100%;
  padding: 10px 8px;
  border-bottom: 1px solid ${(props) => (props.theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)')};
  cursor: pointer;
  box-sizing: border-box;
  align-items: center;

  &:hover {
    background: ${(props) => (props.theme.palette.mode === 'dark' ? 'rgba(66, 133, 244, 0.02)' : 'rgba(66, 133, 244, 0.015)')};
  }
`;

const MobileCollectionInfo = styled.div`
  flex: 2;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 2px;
  min-width: 0;
`;

const MobileCell = styled.div`
  flex: ${(props) => props.flex || 1};
  text-align: ${(props) => props.align || 'right'};
  padding: 0 2px;
  font-weight: ${(props) => props.fontWeight || 500};
  font-size: 11px;
  color: ${(props) => props.color || props.theme.palette.text.primary};
  min-width: ${(props) => props.minWidth || 'auto'};
  ${(props) => props.wordBreak && `word-break: ${props.wordBreak};`}
  ${(props) => props.lineHeight && `line-height: ${props.lineHeight};`}
`;

const CollectionImage = styled.div`
  width: ${(props) => (props.isMobile ? '20px' : '28px')};
  height: ${(props) => (props.isMobile ? '20px' : '28px')};
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
  background: ${(props) => (props.theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)')};
`;

const CollectionDetails = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const CollectionName = styled.span`
  font-weight: 500;
  font-size: ${(props) => (props.isMobile ? '11px' : '13px')};
  color: ${(props) => props.theme.palette.text.primary};
  max-width: ${(props) => (props.isMobile ? '100px' : '150px')};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  line-height: 1.2;
`;

const CollectionSubtext = styled.span`
  font-size: ${(props) => (props.isMobile ? '9px' : '10px')};
  color: ${(props) => props.theme.palette.text.secondary};
  opacity: 1;
  font-weight: 400;
  display: block;
  max-width: ${(props) => (props.isMobile ? '100px' : '150px')};
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.2;
  margin-top: 0;
`;

// Toolbar styled components
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
  gap: 6px;
  padding: 8px 14px;
  min-height: 48px;
  border-radius: 12px;
  background: ${({ theme }) => theme.palette.background.paper};
  border: 1.5px solid ${({ theme }) => alpha(theme.palette.divider, 0.2)};
  box-shadow: none;

  @media (max-width: 900px) {
    width: 100%;
    justify-content: center;
    padding: 6px 10px;
    gap: 4px;
  }
`;

const RowsSelector = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  min-height: 48px;
  border-radius: 12px;
  background: ${({ theme }) => theme.palette.background.paper};
  border: 1.5px solid ${({ theme }) => alpha(theme.palette.divider, 0.2)};
  box-shadow: none;

  @media (max-width: 900px) {
    flex: 1;
    min-width: calc(50% - 8px);
    justify-content: center;
    padding: 6px 10px;
    gap: 4px;
  }
`;

const InfoBox = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 8px 14px;
  min-height: 48px;
  border: 1.5px solid ${({ theme }) => alpha(theme.palette.divider, 0.2)};
  border-radius: 12px;
  background: ${({ theme }) => theme.palette.background.paper};
  box-shadow: none;

  @media (max-width: 900px) {
    flex: 1;
    min-width: calc(50% - 8px);
    justify-content: flex-start;
    gap: 4px;
    padding: 6px 10px;
  }
`;

const Chip = styled.span`
  font-size: 13px;
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  padding: 2px 6px;
  border: 1.5px solid ${({ theme }) => alpha(theme.palette.divider, 0.2)};
  border-radius: 6px;
  color: ${({ theme }) => theme.palette.text.primary};
`;

const Text = styled.span`
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  color: ${({ theme }) => theme.palette.text.secondary};
  font-weight: ${(props) => props.fontWeight || 400};
`;

const NavButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.palette.text.primary || 'inherit'};
  padding: 0;

  &:hover:not(:disabled) {
    background: ${({ theme }) => alpha(theme.palette.primary.main, 0.08)};
  }

  &:disabled {
    color: ${({ theme }) => alpha(theme.palette.text.primary, 0.3)};
    cursor: not-allowed;
  }
`;

const PageButton = styled.button`
  min-width: 24px;
  height: 24px;
  border-radius: 8px;
  border: none;
  background: ${(props) => (props.selected ? props.theme.palette.primary.main : 'transparent')};
  color: ${(props) =>
    props.selected ? 'white' : props.theme.palette.text.primary || 'inherit'};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 6px;
  margin: 0;
  font-size: 13px;
  font-weight: ${(props) => (props.selected ? 500 : 400)};
  font-variant-numeric: tabular-nums;

  &:hover:not(:disabled) {
    background: ${(props) =>
      props.selected ? props.theme.palette.primary.dark || '#1976D2' : alpha(props.theme.palette.primary.main, 0.08)};
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
  border: 1.5px solid ${({ theme }) => alpha(theme.palette.divider, 0.12)};
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

const StyledTableHead = styled.thead`
  position: sticky;
  top: ${(props) => props.scrollTopLength || 0}px;
  z-index: 100;
  background: ${(props) => (props.darkMode ? 'rgba(18, 18, 18, 0.98)' : 'rgba(255, 255, 255, 0.98)')};
  backdrop-filter: blur(10px);
`;

const StyledTableCell = styled.th`
  font-weight: 500;
  font-size: 0.7rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)')};
  padding: 14px 12px;
  border-bottom: 1px solid ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)')};
  white-space: ${(props) => (props.isCollectionColumn ? 'normal' : 'nowrap')};
  text-align: ${(props) => props.align || 'left'};
  width: ${(props) => props.width || 'auto'};
  min-width: ${(props) => (props.isCollectionColumn ? '250px' : props.width || 'auto')};
  box-sizing: border-box;
  cursor: ${(props) => (props.sortable ? 'pointer' : 'default')};
  font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

  &:hover {
    color: ${(props) =>
      props.sortable ? (props.darkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)') : 'inherit'};
  }
`;

const SortIndicator = styled.span`
  display: inline-block;
  margin-left: 4px;
  font-size: 0.6rem;
  color: ${(props) =>
    props.active ? '#4285f4' : props.darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'};
  transform: ${(props) => (props.direction === 'asc' ? 'rotate(180deg)' : 'rotate(0deg)')};
  opacity: ${(props) => (props.active ? 1 : 0.6)};
`;

const MobileContainer = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0;
  padding: 0;
  margin: 0;
  background: ${(props) => props.theme.palette.background.default};
`;

// Table Head Configuration
const TABLE_HEAD_MOBILE = [
  { id: 'name', label: 'COLLECTION', align: 'left', width: '40%', order: false },
  { id: 'floor.amount', label: 'FLOOR', align: 'right', width: '20%', order: true },
  { id: 'floor1dPercent', label: '24H %', align: 'right', width: '20%', order: true },
  { id: 'totalVolume', label: 'VOL', align: 'right', width: '20%', order: true }
];

const TABLE_HEAD_DESKTOP = [
  { id: 'rank', label: '#', align: 'center', width: '40px', order: false },
  { id: 'name', label: 'COLLECTION', align: 'left', width: '250px', order: false },
  { id: 'floor.amount', label: 'FLOOR', align: 'right', width: '10%', order: true },
  { id: 'floor1dPercent', label: 'FLOOR 24H %', align: 'right', width: '10%', order: true },
  { id: 'totalVol24h', label: 'VOLUME (24H)', align: 'right', width: '12%', order: true },
  { id: 'sales24h', label: 'SALES (24H)', align: 'right', width: '10%', order: true },
  { id: 'marketcap.amount', label: 'MARKET CAP', align: 'right', width: '12%', order: true },
  { id: 'listedCount', label: 'LISTED', align: 'right', width: '8%', order: true },
  { id: 'owners', label: 'OWNERS', align: 'right', width: '8%', order: true },
  { id: 'items', label: 'SUPPLY', align: 'right', width: '8%', order: true },
  { id: 'origin', label: 'ORIGIN', align: 'right', width: '8%', order: true },
  { id: 'created', label: 'CREATED', align: 'right', width: '8%', order: true },
  { id: 'sparkline', label: '30D CHART', align: 'center', width: '12%', order: false, style: { paddingLeft: '16px' } }
];

// ListHead Component
const ListHead = memo(({ order, orderBy, onRequestSort, scrollTopLength = 0, darkMode, isMobile }) => {
  const createSortHandler = useCallback(
    (id) => (event) => {
      onRequestSort(event, id);
    },
    [onRequestSort]
  );

  const TABLE_HEAD = isMobile ? TABLE_HEAD_MOBILE : TABLE_HEAD_DESKTOP;

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
        ))}
      </tr>
    </StyledTableHead>
  );
});

// Optimized image component
const OptimizedImage = memo(
  ({ src, alt, size }) => {
    const [imgSrc, setImgSrc] = useState(src);

    const handleError = useCallback(() => {
      setImgSrc('/static/alt.webp');
    }, []);

    return (
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden' }}>
        <img
          src={imgSrc}
          alt={alt}
          onError={handleError}
          style={{
            width: size,
            height: size,
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
  const theme = useTheme();
  const { name, slug, logoImage, floor, floor1dPercent, totalVolume } = collection;

  // Handle name being an object or string
  const collectionName = typeof name === 'string' ? name : (name?.name || 'Unnamed Collection');

  const logoImageUrl = `https://s1.xrpl.to/nft-collection/${logoImage}`;
  const floorPrice = floor?.amount || 0;
  const floorChangePercent = floor1dPercent || 0;

  const getFloorChangeColor = (percent) => {
    if (percent > 0) return theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32';
    if (percent < 0) return theme.palette.mode === 'dark' ? '#EF5350' : '#C62828';
    return theme.palette.text.secondary;
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
          <OptimizedImage src={logoImageUrl} alt={collectionName} size={20} />
        </CollectionImage>
        <CollectionDetails>
          <CollectionName isMobile={true}>{collectionName}</CollectionName>
          <CollectionSubtext isMobile={true}>{slug}</CollectionSubtext>
        </CollectionDetails>
      </MobileCollectionInfo>

      <MobileCell flex={1.2} align="right">
        ✕ {fNumber(floorPrice)}
      </MobileCell>

      <MobileCell flex={0.9} align="right" color={getFloorChangeColor(floorChangePercent)}>
        {formatFloorChange(floorChangePercent)}
      </MobileCell>

      <MobileCell flex={1} align="right" color="#00AB55">
        ✕ {fVolume(totalVolume || 0)}
      </MobileCell>
    </MobileCollectionCard>
  );
};

// Desktop Collection Row Component
const DesktopCollectionRow = ({ collection, idx, darkMode, handleRowClick }) => {
  const theme = useTheme();
  const {
    name,
    slug,
    logoImage,
    items,
    floor,
    floor1dPercent,
    totalVol24h,
    sales24h,
    marketcap,
    listedCount,
    owners,
    created,
    graphData30d,
    origin
  } = collection;

  // Handle name being an object or string
  const collectionName = typeof name === 'string' ? name : (name?.name || 'Unnamed Collection');

  const logoImageUrl = `https://s1.xrpl.to/nft-collection/${logoImage}`;
  const floorPrice = floor?.amount || 0;
  const floorChangePercent = floor1dPercent || 0;
  const volume24h = fVolume(totalVol24h || 0);
  const marketCapAmount = marketcap?.amount || 0;
  const strDateTime = formatMonthYearDate(created);

  const getFloorChangeColor = (percent) => {
    if (percent > 0) return theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32';
    if (percent < 0) return theme.palette.mode === 'dark' ? '#EF5350' : '#C62828';
    return theme.palette.text.secondary;
  };

  const formatFloorChange = (percent) => {
    if (percent === 0) return '0%';
    const sign = percent > 0 ? '+' : '';
    return `${sign}${percent.toFixed(1)}%`;
  };

  const getMarketCapColor = (mcap) => {
    if (!mcap || isNaN(mcap)) return theme.palette.text.primary;
    // Elite: $5M+ (3% - dark green)
    if (mcap >= 5e6) return theme.palette.mode === 'dark' ? '#2E7D32' : '#1B5E20';
    // Established: $1M-$5M (8% - green)
    if (mcap >= 1e6) return theme.palette.mode === 'dark' ? '#4CAF50' : '#2E7D32';
    // Mid-tier: $100K-$1M (24% - blue)
    if (mcap >= 1e5) return theme.palette.mode === 'dark' ? '#42A5F5' : '#1976D2';
    // Small: $10K-$100K (32% - yellow)
    if (mcap >= 1e4) return theme.palette.mode === 'dark' ? '#FFC107' : '#F57F17';
    // Micro: $1K-$10K (orange)
    if (mcap >= 1e3) return theme.palette.mode === 'dark' ? '#FF9800' : '#E65100';
    // Nano: <$1K (red)
    return theme.palette.mode === 'dark' ? '#EF5350' : '#C62828';
  };

  // Process chart data
  const salesData = useMemo(() => {
    if (!graphData30d || !Array.isArray(graphData30d)) return null;

    const processedData = graphData30d
      .filter((item) => item && item.date)
      .map((item) => ({
        date: item.date,
        value: item.volume || 0,
        sales: item.sales || 0
      }))
      .slice(-50);

    if (processedData.length === 0) return null;
    return processedData;
  }, [graphData30d]);

  return (
    <StyledRow onClick={handleRowClick}>
      <StyledCell align="center" darkMode={darkMode} style={{ width: '40px', minWidth: '40px', maxWidth: '40px' }}>
        <span style={{ fontWeight: '400', color: theme.palette.text.secondary }}>{idx + 1}</span>
      </StyledCell>

      <StyledCell
        align="left"
        darkMode={darkMode}
        isCollectionColumn={true}
        style={{ width: '250px', minWidth: '250px', maxWidth: '250px' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CollectionImage>
            <OptimizedImage src={logoImageUrl} alt={collectionName} size={28} />
          </CollectionImage>
          <div style={{ minWidth: 0, flex: 1 }}>
            <CollectionName title={collectionName}>{collectionName}</CollectionName>
          </div>
        </div>
      </StyledCell>

      <StyledCell align="right" darkMode={darkMode} fontWeight={500}>
        ✕ {fNumber(floorPrice)}
      </StyledCell>

      <StyledCell align="right" darkMode={darkMode} color={getFloorChangeColor(floorChangePercent)} fontWeight={500}>
        {formatFloorChange(floorChangePercent)}
      </StyledCell>

      <StyledCell align="right" darkMode={darkMode} color="#00AB55" fontWeight={500}>
        ✕ {volume24h}
      </StyledCell>

      <StyledCell align="right" darkMode={darkMode} fontWeight={500}>
        {fIntNumber(sales24h || 0)}
      </StyledCell>

      <StyledCell align="right" darkMode={darkMode} color={getMarketCapColor(marketCapAmount)} fontWeight={500}>
        ✕ {fVolume(marketCapAmount)}
      </StyledCell>

      <StyledCell align="right" darkMode={darkMode} fontWeight={500}>
        {fIntNumber(listedCount || 0)}
      </StyledCell>

      <StyledCell align="right" darkMode={darkMode} fontWeight={500}>
        {fIntNumber(owners || 0)}
      </StyledCell>

      <StyledCell align="right" darkMode={darkMode} fontWeight={500}>
        {fIntNumber(items)}
      </StyledCell>

      <StyledCell align="right" darkMode={darkMode} fontWeight={500}>
        {origin || 'XRPL'}
      </StyledCell>

      <StyledCell align="right" darkMode={darkMode} fontWeight={500}>
        <span style={{ fontSize: '11px' }}>{strDateTime}</span>
      </StyledCell>

      <StyledCell align="center" darkMode={darkMode} style={{ minWidth: '220px', paddingLeft: '16px', overflow: 'visible', position: 'relative', zIndex: 101 }}>
        {salesData ? (
          <OptimizedChart salesData={salesData} darkMode={darkMode} />
        ) : (
          <span style={{ color: theme.palette.text.disabled, fontSize: '12px' }}>No data</span>
        )}
      </StyledCell>
    </StyledRow>
  );
};

// Main Collection Row Component
const CollectionRow = memo(
  function CollectionRow({ collection, idx, isMobile, darkMode }) {
    const { slug } = collection;

    const handleRowClick = useCallback(() => {
      window.location.href = `/collection/${slug}`;
    }, [slug]);

    if (isMobile) {
      return <MobileCollectionRow collection={collection} darkMode={darkMode} handleRowClick={handleRowClick} />;
    }

    return <DesktopCollectionRow collection={collection} idx={idx} darkMode={darkMode} handleRowClick={handleRowClick} />;
  },
  (prevProps, nextProps) => {
    const prev = prevProps.collection;
    const next = nextProps.collection;

    return (
      prev.slug === next.slug &&
      prev.floor?.amount === next.floor?.amount &&
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

  const start = total > 0 ? page * rows + 1 : 0;
  let end = start + rows - 1;
  if (end > total) end = total;

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
        <Chip>{`${start}-${end} of ${total.toLocaleString()}`}</Chip>
        <Text>collections</Text>
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
              <PageButton key={pageNum} selected={pageNum === page + 1} onClick={() => handleChangePage(pageNum - 1)}>
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

// Main CollectionList Component
export default function CollectionList({ type, category }) {
  const BASE_URL = 'https://api.xrpl.to/api';
  const { darkMode } = useContext(AppContext);

  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(50);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('totalVol24h');

  const [total, setTotal] = useState(0);
  const [collections, setCollections] = useState([]);

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

  useEffect(() => {
    const loadCollections = () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: rows.toString(),
        sortBy: orderBy,
        order: order
      });

      axios
        .get(`${BASE_URL}/nft/collections?${params.toString()}`)
        .then((res) => {
          try {
            if (res.status === 200 && res.data) {
              const ret = res.data;
              setTotal(ret.pagination?.total || ret.count || 0);
              setCollections(ret.collections || []);
            }
          } catch (error) {
          }
        })
        .catch((err) => {
        });
    };
    loadCollections();
  }, [sync, order, orderBy, page, rows]);

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

  return (
    <Container>
      {isMobile ? (
        <MobileContainer darkMode={darkMode}>
          <MobileHeader darkMode={darkMode}>
            <HeaderCell flex={2} align="left" sortable={false}>
              COLLECTION
            </HeaderCell>
            <HeaderCell flex={1.2} align="right" sortable={false}>
              FLOOR
            </HeaderCell>
            <HeaderCell flex={0.9} align="right" sortable={false}>
              24H %
            </HeaderCell>
            <HeaderCell flex={1} align="right" sortable={false}>
              VOL
            </HeaderCell>
          </MobileHeader>
          {collections.map((collection, idx) => (
            <CollectionRow
              key={collection.slug || collection.name || idx}
              collection={collection}
              idx={page * rows + idx}
              isMobile={true}
              darkMode={darkMode}
            />
          ))}
        </MobileContainer>
      ) : (
        <TableContainer>
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
              {collections.map((collection, idx) => (
                <CollectionRow
                  key={collection.slug || collection.name || idx}
                  collection={collection}
                  idx={page * rows + idx}
                  isMobile={false}
                  darkMode={darkMode}
                />
              ))}
            </StyledTableBody>
          </StyledTable>
        </TableContainer>
      )}
      <div style={{ marginTop: '8px' }}>
        <ListToolbar rows={rows} setRows={setRows} page={page} setPage={setPage} total={total} />
      </div>
    </Container>
  );
}
