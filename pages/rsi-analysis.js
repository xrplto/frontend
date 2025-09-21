import { useState, useMemo, useContext, useEffect, useRef, useCallback, memo } from 'react';
import { Box, Container, Grid, styled as muiStyled, Toolbar, useMediaQuery, useTheme } from '@mui/material';
import Topbar from 'src/components/Topbar';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import NumberTooltip from 'src/components/NumberTooltip';
import { useRouter } from 'next/router';
import axios from 'axios';
import styled from '@emotion/styled';
import { AppContext } from 'src/AppContext';
import { useDispatch, useSelector } from 'react-redux';
import { update_metrics, selectMetrics } from 'src/redux/statusSlice';
import { currencySymbols } from 'src/utils/constants';
import { fNumber } from 'src/utils/formatNumber';
import Decimal from 'decimal.js-light';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import FilterListIcon from '@mui/icons-material/FilterList';
import Image from 'next/image';

const OverviewWrapper = muiStyled(Box)(
  ({ theme }) => `
    overflow: hidden;
    flex: 1;
    margin: 0;
    padding: 0;
    ${theme.breakpoints.down('md')} {
      margin: 0;
      padding: 0;
    }
`
);

// ============= RSI TOOLBAR STYLES =============
const ToolbarContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-radius: 12px;
  border: 1px solid ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)')};
  background: ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 255, 255, 0.95)')};
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.04);
  padding: 20px;
  margin-bottom: 20px;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)')};
    background: ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 1)')};
  }

  @media (max-width: 768px) {
    padding: 16px;
    gap: 10px;
  }
`;

const ToolbarRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: ${(props) => (props.spaceBetween ? 'space-between' : 'flex-start')};
  gap: 16px;
  flex-wrap: wrap;
  width: 100%;

  @media (max-width: 968px) {
    gap: 12px;
    flex-direction: ${(props) => (props.spaceBetween ? 'column' : 'row')};
    align-items: ${(props) => (props.spaceBetween ? 'stretch' : 'center')};
  }
`;

const SearchInput = styled.input`
  padding: 10px 16px;
  border: 1px solid ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(145, 158, 171, 0.2)')};
  border-radius: 10px;
  background: ${(props) => props.darkMode ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.95)'};
  color: ${(props) => (props.darkMode ? '#fff' : '#333')};
  font-size: 0.875rem;
  height: 44px;
  min-width: 240px;
  max-width: 300px;
  transition: all 0.3s ease;
  font-weight: 400;

  &::placeholder {
    color: ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)')};
  }

  &:hover {
    border-color: ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(145, 158, 171, 0.3)')};
  }

  &:focus {
    outline: none;
    border-color: rgba(33, 150, 243, 0.5);
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
  }

  @media (max-width: 968px) {
    min-width: 100%;
    max-width: 100%;
    height: 40px;
  }
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 18px;
  border: 1px solid ${(props) => (props.selected ? 'rgba(33, 150, 243, 0.3)' : 'rgba(145, 158, 171, 0.15)')};
  border-radius: 10px;
  background: ${(props) => {
    if (props.selected) return 'rgba(33, 150, 243, 0.1)';
    if (props.variant === 'outlined') return 'transparent';
    return props.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)';
  }};
  color: ${(props) => {
    if (props.selected) return '#2196f3';
    return props.darkMode ? '#fff' : '#333';
  }};
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
  transition: all 0.3s ease;
  height: 44px;
  min-width: fit-content;

  &:hover {
    background: ${(props) => {
      if (props.selected) return 'rgba(33, 150, 243, 0.15)';
      return props.darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)';
    }};
    border-color: ${(props) => (props.selected ? 'rgba(33, 150, 243, 0.4)' : 'rgba(145, 158, 171, 0.25)')};
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    height: 40px;
    padding: 8px 14px;
    font-size: 0.8rem;
  }
`;

const FilterGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 10px;
  background: ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)')};
  border: 1px solid ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)')};
  transition: all 0.3s ease;

  &:hover {
    background: ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)')};
  }
`;

const FilterInput = styled.input`
  padding: 8px 12px;
  border: 1px solid ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(145, 158, 171, 0.2)')};
  border-radius: 8px;
  background: ${(props) => props.darkMode ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.95)'};
  color: ${(props) => (props.darkMode ? '#fff' : '#333')};
  font-size: 0.75rem;
  height: 36px;
  width: 90px;
  transition: all 0.3s ease;

  &::placeholder {
    color: ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)')};
  }

  &:hover {
    border-color: ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(145, 158, 171, 0.3)')};
  }

  &:focus {
    outline: none;
    border-color: rgba(33, 150, 243, 0.4);
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
  }
`;

const FilterLabel = styled.span`
  font-size: 0.75rem;
  color: ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)')};
  white-space: nowrap;
  font-weight: 500;
`;

// ============= RSI HEATMAP STYLES =============
const HeatMapContainer = styled.div`
  width: 100%;
  height: 350px;
  position: relative;
  background: ${(props) => (props.darkMode ? '#1a1a1a' : '#ffffff')};
  border-radius: 12px;
  border: 1px solid ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)')};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  margin: 20px 0;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  }

  @media (max-width: 768px) {
    height: 280px;
    margin: 16px 0;
  }
`;

const Canvas = styled.canvas`
  width: 100%;
  height: 100%;
  cursor: crosshair;
`;

const HeatMapTitle = styled.div`
  position: absolute;
  top: 20px;
  left: 20px;
  font-size: 18px;
  font-weight: 700;
  color: ${(props) => (props.darkMode ? '#fff' : '#000')};
  z-index: 100;
  letter-spacing: 0.5px;

  @media (max-width: 768px) {
    font-size: 16px;
    top: 16px;
    left: 16px;
  }
`;

const TimeframeButtons = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 6px;
  z-index: 100;

  @media (max-width: 768px) {
    position: relative;
    top: auto;
    right: auto;
    margin: 12px 0;
    justify-content: center;
    flex-wrap: wrap;
    padding: 0 16px;
  }
`;

// ============= RSI TABLE STYLES =============
const TableContainer = styled.div`
  overflow-x: auto;
  width: 100%;
  border-radius: 12px;
  border: 1px solid ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)')};
  background: ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.02)' : '#ffffff')};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  scrollbar-width: thin;
  scrollbar-color: ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)')} transparent;

  &::-webkit-scrollbar {
    height: 8px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)')};
    border-radius: 4px;
  }
`;

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 800px;
`;

const StyledTh = styled.th`
  padding: 18px 16px;
  text-align: ${(props) => props.align || 'left'};
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: ${(props) => (props.darkMode ? '#bbb' : '#666')};
  background: ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)')};
  border-bottom: 2px solid ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)')};
  cursor: ${(props) => props.sortable ? 'pointer' : 'default'};
  transition: all 0.3s ease;
  position: sticky;
  top: 0;
  z-index: 10;
  white-space: nowrap;

  &:hover {
    color: ${(props) => props.sortable ? (props.darkMode ? '#fff' : '#000') : 'inherit'};
    background: ${(props) => props.sortable ? (props.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)') : 'inherit'};
  }

  &:first-of-type {
    border-top-left-radius: 12px;
  }

  &:last-of-type {
    border-top-right-radius: 12px;
  }
`;

const StyledTr = styled.tr`
  border-bottom: 1px solid ${(props) => props.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: ${(props) => props.darkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)'};
    transform: translateY(-1px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &:last-child {
    border-bottom: none;
  }
`;

const StyledTd = styled.td`
  padding: 16px;
  font-size: 14px;
  color: ${(props) => props.darkMode ? '#fff' : '#333'};
  text-align: ${(props) => props.align || 'left'};
  vertical-align: middle;
  white-space: nowrap;

  &:first-of-type {
    font-weight: 500;
    color: ${(props) => props.darkMode ? '#bbb' : '#666'};
  }
`;

const RSIBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  min-width: 50px;
  background: ${(props) => props.bgColor};
  color: ${(props) => props.color};
  border: 1px solid ${(props) => props.borderColor || 'transparent'};
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.05);
  }
`;

const TokenInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  flex: 1;
`;

const TokenImage = styled.img`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 2px solid ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')};
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
    border-color: rgba(33, 150, 243, 0.5);
  }
`;

const TokenDetails = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
`;

const TokenName = styled.div`
  font-weight: 600;
  font-size: 15px;
  color: ${(props) => (props.darkMode ? '#fff' : '#000')};
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
`;

const TokenSymbol = styled.div`
  font-size: 12px;
  color: ${(props) => (props.darkMode ? '#bbb' : '#666')};
  opacity: 0.8;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100px;
  margin-top: 2px;
`;

const PriceChange = styled.span`
  color: ${(props) => props.positive ? '#4caf50' : '#f44336'};
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  background: ${(props) => props.positive ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)'};
  font-size: 13px;
`;

const RowsSelector = styled.select`
  padding: 10px 16px;
  border: 1px solid ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(145, 158, 171, 0.2)')};
  border-radius: 10px;
  background: ${(props) => props.darkMode ? 'rgba(17, 24, 39, 0.8)' : 'rgba(255, 255, 255, 0.95)'};
  color: ${(props) => (props.darkMode ? '#fff' : '#333')};
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  height: 44px;
  min-width: 120px;
  transition: all 0.3s ease;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 14px center;
  background-size: 16px;
  padding-right: 40px;

  &:hover {
    border-color: ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.25)' : 'rgba(145, 158, 171, 0.3)')};
  }

  &:focus {
    outline: none;
    border-color: rgba(33, 150, 243, 0.5);
    box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
  }

  option {
    background: ${(props) => (props.darkMode ? '#1a1a1a' : '#ffffff')};
    color: ${(props) => (props.darkMode ? '#fff' : '#333')};
    padding: 10px;
  }

  @media (max-width: 768px) {
    height: 40px;
    min-width: 100px;
  }
`;

// ============= MAIN COMPONENT =============
function RSIAnalysisPage({ data }) {
  const [tokens, setTokens] = useState(() => data ? data.tokens : []);
  const [timeframe, setTimeframe] = useState('24h');
  const [filterName, setFilterName] = useState('');
  const [minMarketCap, setMinMarketCap] = useState('5000');
  const [minVolume24h, setMinVolume24h] = useState('2000');
  const [showFilters, setShowFilters] = useState(false);
  const [order, setOrder] = useState('desc');
  const [orderBy, setOrderBy] = useState('rsi24h');
  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(50);

  const { darkMode, activeFiatCurrency } = useContext(AppContext);
  const metrics = useSelector(selectMetrics);
  const exchRate = metrics[activeFiatCurrency] || 1;
  const isMobile = useMediaQuery('(max-width:600px)');
  const canvasRef = useRef(null);
  const BASE_URL = process.env.API_URL;
  const theme = useTheme();

  // Load tokens from API
  const loadTokens = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        start: page * rows,
        limit: rows,
        sortBy: orderBy,
        sortType: order,
        timeframe,
        filter: filterName,
        minMarketCap,
        minVolume24h
      });

      const response = await axios.get(`${BASE_URL}/rsi?${params}`);
      if (response.data && response.data.tokens) {
        setTokens(response.data.tokens);
      }
    } catch (error) {
      console.error('Error loading RSI data:', error);
    }
  }, [page, rows, orderBy, order, timeframe, filterName, minMarketCap, minVolume24h, BASE_URL]);

  useEffect(() => {
    loadTokens();
  }, [timeframe, orderBy, order, page, filterName, minMarketCap, minVolume24h]);

  // Get RSI value for timeframe
  const getRSIValue = (token) => {
    switch (timeframe) {
      case '15m': return token.rsi15m;
      case '1h': return token.rsi1h;
      case '4h': return token.rsi4h;
      case '24h': return token.rsi24h;
      case '7d': return token.rsi7d;
      case '30d': return token.rsi30d;
      case '90d': return token.rsi90d;
      default: return token.rsi24h;
    }
  };

  // Get RSI color
  const getRSIColor = (rsi) => {
    if (!rsi || isNaN(rsi)) return {
      bg: 'transparent',
      color: darkMode ? '#666' : '#999',
      borderColor: 'transparent'
    };
    if (rsi >= 70) return {
      bg: 'rgba(244, 67, 54, 0.15)',
      color: '#f44336',
      borderColor: 'rgba(244, 67, 54, 0.3)'
    };
    if (rsi <= 30) return {
      bg: 'rgba(76, 175, 80, 0.15)',
      color: '#4caf50',
      borderColor: 'rgba(76, 175, 80, 0.3)'
    };
    return {
      bg: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
      color: darkMode ? '#fff' : '#000',
      borderColor: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
    };
  };

  // Enhanced heat map drawing
  const drawHeatMap = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !tokens.length) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = 60;

    // Clear canvas
    ctx.fillStyle = darkMode ? '#1a1a1a' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Draw grid
    ctx.strokeStyle = darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    // Horizontal grid lines (RSI levels)
    [20, 30, 50, 70, 80].forEach(level => {
      const y = height - padding - ((level / 100) * (height - padding * 2));
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding / 2, y);
      ctx.stroke();
    });

    // Vertical grid lines
    for (let i = 1; i <= 4; i++) {
      const x = padding + (i * (width - padding * 1.5) / 5);
      ctx.beginPath();
      ctx.moveTo(x, padding);
      ctx.lineTo(x, height - padding);
      ctx.stroke();
    }

    ctx.setLineDash([]);

    // Draw RSI zone highlights
    ctx.fillStyle = darkMode ? 'rgba(244, 67, 54, 0.08)' : 'rgba(244, 67, 54, 0.05)';
    const overboughtY = height - padding - ((70 / 100) * (height - padding * 2));
    ctx.fillRect(padding, padding, width - padding * 1.5, overboughtY - padding);

    ctx.fillStyle = darkMode ? 'rgba(76, 175, 80, 0.08)' : 'rgba(76, 175, 80, 0.05)';
    const oversoldY = height - padding - ((30 / 100) * (height - padding * 2));
    ctx.fillRect(padding, oversoldY, width - padding * 1.5, height - padding - oversoldY);

    // Draw tokens
    const validTokens = tokens.filter(token => {
      const rsi = getRSIValue(token);
      return rsi && token.marketcap && rsi >= 0 && rsi <= 100;
    }).slice(0, 100);

    if (validTokens.length > 0) {
      const marketCaps = validTokens.map(t => t.marketcap);
      const minMC = Math.min(...marketCaps);
      const maxMC = Math.max(...marketCaps);
      const logMinMC = Math.log10(Math.max(minMC, 1));
      const logMaxMC = Math.log10(Math.max(maxMC, 1));

      validTokens.forEach((token, index) => {
        const rsi = getRSIValue(token);
        const marketCap = token.marketcap || 1;

        // Position based on log scale for market cap
        const logMC = Math.log10(Math.max(marketCap, 1));
        const xNormalized = logMaxMC > logMinMC ? (logMC - logMinMC) / (logMaxMC - logMinMC) : 0.5;
        const x = padding + (xNormalized * (width - padding * 1.5));
        const y = height - padding - ((rsi / 100) * (height - padding * 2));

        // Size based on market cap
        const size = Math.max(4, Math.min(20, Math.sqrt(marketCap / 1000000) * 3 + 3));

        // Color based on RSI
        let color;
        if (rsi >= 70) color = '#f44336';
        else if (rsi <= 30) color = '#4caf50';
        else color = '#2196f3';

        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();

        // Add border
        ctx.strokeStyle = darkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Add symbol for larger bubbles
        if (size > 8 && token.user) {
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 10px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(token.user.substring(0, 3).toUpperCase(), x, y);
        }
      });
    }

    // Draw axes labels
    ctx.fillStyle = darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)';
    ctx.font = '12px Arial';

    // Y-axis labels (RSI)
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    [0, 20, 30, 50, 70, 80, 100].forEach(level => {
      const y = height - padding - ((level / 100) * (height - padding * 2));
      ctx.fillText(level.toString(), padding - 10, y);
    });

    // X-axis title
    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`RSI ${timeframe.toUpperCase()}`, 0, 0);
    ctx.restore();

    // Market cap title
    ctx.textAlign = 'center';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`Market Cap (${activeFiatCurrency})`, width / 2, height - 20);

  }, [tokens, timeframe, darkMode, activeFiatCurrency]);

  useEffect(() => {
    const timer = setTimeout(drawHeatMap, 100);
    return () => clearTimeout(timer);
  }, [drawHeatMap]);

  const handleSort = (field) => {
    if (orderBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderBy(field);
      setOrder('desc');
    }
  };

  const timeframes = [
    { value: '15m', label: '15M' },
    { value: '1h', label: '1H' },
    { value: '4h', label: '4H' },
    { value: '24h', label: '24H' },
    { value: '7d', label: '7D' },
    { value: '30d', label: '30D' },
    { value: '90d', label: '90D' }
  ];

  return (
    <OverviewWrapper>
      {!isMobile && <Toolbar id="back-to-top-anchor" />}
      {!isMobile ? <Topbar /> : ''}
      <Header />
      {isMobile ? <Topbar /> : ''}

      <Container maxWidth="xl" sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} lg={11} xl={10}>
            {/* Enhanced Toolbar */}
            <ToolbarContainer darkMode={darkMode}>
              <ToolbarRow spaceBetween>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', flex: 1 }}>
                  <SearchInput
                    darkMode={darkMode}
                    placeholder="Search tokens..."
                    value={filterName}
                    onChange={(e) => setFilterName(e.target.value)}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <FilterLabel darkMode={darkMode}>Timeframe:</FilterLabel>
                    {timeframes.map(tf => (
                      <Button
                        key={tf.value}
                        darkMode={darkMode}
                        selected={timeframe === tf.value}
                        onClick={() => setTimeframe(tf.value)}
                      >
                        {tf.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <RowsSelector
                    darkMode={darkMode}
                    value={rows}
                    onChange={(e) => setRows(Number(e.target.value))}
                  >
                    <option value={25}>25 rows</option>
                    <option value={50}>50 rows</option>
                    <option value={100}>100 rows</option>
                    <option value={250}>250 rows</option>
                  </RowsSelector>
                </div>
              </ToolbarRow>

              <ToolbarRow>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                  <Button
                    darkMode={darkMode}
                    variant="outlined"
                    onClick={() => { setMinMarketCap(''); setMinVolume24h(''); }}
                  >
                    Clear Filters
                  </Button>
                  <Button
                    darkMode={darkMode}
                    onClick={() => setShowFilters(!showFilters)}
                    selected={showFilters}
                  >
                    <FilterListIcon style={{ fontSize: '16px' }} />
                    Advanced Filters
                  </Button>
                </div>
              </ToolbarRow>

              {showFilters && (
                <ToolbarRow>
                  <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <FilterGroup darkMode={darkMode}>
                      <FilterLabel darkMode={darkMode}>Market Cap (min):</FilterLabel>
                      <FilterInput
                        darkMode={darkMode}
                        placeholder="Min"
                        value={minMarketCap}
                        onChange={(e) => setMinMarketCap(e.target.value)}
                      />
                    </FilterGroup>
                    <FilterGroup darkMode={darkMode}>
                      <FilterLabel darkMode={darkMode}>Volume 24h (min):</FilterLabel>
                      <FilterInput
                        darkMode={darkMode}
                        placeholder="Min"
                        value={minVolume24h}
                        onChange={(e) => setMinVolume24h(e.target.value)}
                      />
                    </FilterGroup>
                  </div>
                </ToolbarRow>
              )}
            </ToolbarContainer>

            {/* Enhanced Heat Map */}
            <HeatMapContainer darkMode={darkMode}>
              <HeatMapTitle darkMode={darkMode}>
                Token RSI Heatmap - {timeframe.toUpperCase()}
              </HeatMapTitle>
              <Canvas ref={canvasRef} />
            </HeatMapContainer>

            {/* Enhanced Table */}
            <TableContainer darkMode={darkMode}>
              <StyledTable>
                <thead>
                  <tr>
                    <StyledTh darkMode={darkMode}>#</StyledTh>
                    <StyledTh darkMode={darkMode}>Token</StyledTh>
                    <StyledTh darkMode={darkMode} sortable onClick={() => handleSort('exch')} align="right">
                      Price
                    </StyledTh>
                    <StyledTh darkMode={darkMode} sortable onClick={() => handleSort('pro24h')} align="right">
                      24h Change
                    </StyledTh>
                    <StyledTh darkMode={darkMode} sortable onClick={() => handleSort('vol24hxrp')} align="right">
                      Volume 24h
                    </StyledTh>
                    <StyledTh darkMode={darkMode} sortable onClick={() => handleSort('marketcap')} align="right">
                      Market Cap
                    </StyledTh>
                    <StyledTh darkMode={darkMode} sortable onClick={() => handleSort(`rsi${timeframe}`)} align="center">
                      RSI {timeframe.toUpperCase()}
                    </StyledTh>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((token, idx) => {
                    const rsi = getRSIValue(token);
                    const rsiColors = getRSIColor(rsi);
                    const marketCapFiat = new Decimal(token.marketcap || 0).div(exchRate).toNumber();
                    const volumeFiat = new Decimal(token.vol24hxrp || 0).div(exchRate).toNumber();
                    const priceFiat = new Decimal(token.exch || 0).div(exchRate).toNumber();

                    return (
                      <StyledTr
                        key={token.md5}
                        darkMode={darkMode}
                        onClick={() => window.location.href = `/token/${token.slug}`}
                      >
                        <StyledTd darkMode={darkMode}>{idx + 1}</StyledTd>
                        <StyledTd darkMode={darkMode}>
                          <TokenInfo>
                            <TokenImage
                              darkMode={darkMode}
                              src={`https://s1.xrpl.to/token/${token.md5}`}
                              alt={token.name}
                              onError={(e) => { e.target.style.display = 'none' }}
                            />
                            <TokenDetails>
                              <TokenName darkMode={darkMode}>{token.name}</TokenName>
                              <TokenSymbol darkMode={darkMode}>{token.user}</TokenSymbol>
                            </TokenDetails>
                          </TokenInfo>
                        </StyledTd>
                        <StyledTd darkMode={darkMode} align="right">
                          {priceFiat && priceFiat > 0 ? (
                            <NumberTooltip number={priceFiat}>
                              {currencySymbols[activeFiatCurrency]}{fNumber(priceFiat)}
                            </NumberTooltip>
                          ) : (
                            `${currencySymbols[activeFiatCurrency]}0.00`
                          )}
                        </StyledTd>
                        <StyledTd darkMode={darkMode} align="right">
                          <PriceChange positive={token.pro24h >= 0}>
                            {token.pro24h >= 0 ? '+' : ''}{token.pro24h?.toFixed(2) || '0.00'}%
                          </PriceChange>
                        </StyledTd>
                        <StyledTd darkMode={darkMode} align="right">
                          {volumeFiat && volumeFiat > 0 ? (
                            <NumberTooltip number={volumeFiat}>
                              {currencySymbols[activeFiatCurrency]}
                              {volumeFiat >= 1e6 ? `${(volumeFiat / 1e6).toFixed(1)}M` :
                               volumeFiat >= 1e3 ? `${(volumeFiat / 1e3).toFixed(1)}K` :
                               fNumber(volumeFiat)}
                            </NumberTooltip>
                          ) : (
                            `${currencySymbols[activeFiatCurrency]}0`
                          )}
                        </StyledTd>
                        <StyledTd darkMode={darkMode} align="right">
                          {marketCapFiat && marketCapFiat > 0 ? (
                            <NumberTooltip number={marketCapFiat}>
                              {currencySymbols[activeFiatCurrency]}
                              {marketCapFiat >= 1e6 ? `${(marketCapFiat / 1e6).toFixed(1)}M` :
                               marketCapFiat >= 1e3 ? `${(marketCapFiat / 1e3).toFixed(1)}K` :
                               fNumber(marketCapFiat)}
                            </NumberTooltip>
                          ) : (
                            `${currencySymbols[activeFiatCurrency]}0`
                          )}
                        </StyledTd>
                        <StyledTd darkMode={darkMode} align="center">
                          <RSIBadge
                            bgColor={rsiColors.bg}
                            color={rsiColors.color}
                            borderColor={rsiColors.borderColor}
                          >
                            {rsi ? rsi.toFixed(1) : '-'}
                          </RSIBadge>
                        </StyledTd>
                      </StyledTr>
                    );
                  })}
                </tbody>
              </StyledTable>
            </TableContainer>
          </Grid>
        </Grid>
      </Container>

      <ScrollToTop />
      <Footer />
    </OverviewWrapper>
  );
}

export default RSIAnalysisPage;

export async function getStaticProps() {
  const BASE_URL = process.env.API_URL;

  try {
    const [tokensRes, tagsRes] = await Promise.all([
      axios.get(`${BASE_URL}/rsi?sortBy=rsi24h&sortType=desc&limit=100&minMarketCap=5000&minVolume24h=2000`),
      axios.get(`${BASE_URL}/tags`)
    ]);

    return {
      props: {
        data: {
          tokens: tokensRes.data.tokens || [],
          tags: tagsRes.data || []
        },
        ogp: {
          canonical: 'https://xrpl.to/rsi-analysis',
          title: 'RSI Analysis | XRPL Token Technical Indicators',
          url: 'https://xrpl.to/rsi-analysis',
          imgUrl: 'https://xrpl.to/static/ogp.webp',
          desc: 'Advanced RSI analysis for XRPL tokens. Track overbought and oversold conditions with interactive heatmaps and detailed technical indicators.',
          keywords: 'RSI analysis, XRPL tokens, technical indicators, overbought oversold, XRP trading, token analysis, crypto RSI, XRPL trading'
        }
      },
      revalidate: 60
    };
  } catch (error) {
    console.error('Error fetching RSI data:', error);
    return {
      props: { data: { tokens: [], tags: [] } },
      revalidate: 60
    };
  }
}