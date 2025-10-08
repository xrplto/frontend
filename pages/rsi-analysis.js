import { useState, useEffect, useContext, useRef, useCallback } from 'react';
import { Box, Container, Grid, styled as muiStyled, Toolbar } from '@mui/material';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import { Tooltip } from '@mui/material';
import { useRouter } from 'next/router';
import axios from 'axios';
import styled from '@emotion/styled';
import { AppContext } from 'src/AppContext';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
// Constants
const currencySymbols = {
  USD: '$ ',
  EUR: '€ ',
  JPY: '¥ ',
  CNH: '¥ ',
  XRP: '✕ '
};
import { fNumber } from 'src/utils/formatters';
import Decimal from 'decimal.js-light';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

const Wrapper = muiStyled(Box)(({ theme }) => `
  overflow: hidden;
  flex: 1;
  margin: 0;
  padding: 0;

  ${theme.breakpoints.down('md')} {
    margin: 0;
    padding: 0;
  }
`);

const Controls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 20px;
  padding: 20px;
  background: ${p => p.darkMode ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.95)'};
  border-radius: 12px;
  border: 1px solid ${p => p.darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
  width: 100%;
`;

const ControlRow = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
  width: 100%;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;

    &:not(:last-child) {
      border-bottom: 1px solid ${p => p.darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
      padding-bottom: 12px;
    }
  }
`;

const MobileSection = styled.div`
  @media (max-width: 768px) {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
`;

const MobileButtonGrid = styled.div`
  @media (max-width: 768px) {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    gap: 8px;
    width: 100%;
  }

  @media (min-width: 769px) {
    display: contents;
  }
`;

const MobileFilterGrid = styled.div`
  @media (max-width: 768px) {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 8px;
    width: 100%;
  }

  @media (min-width: 769px) {
    display: contents;
  }
`;

const ActiveFilters = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
  min-height: 24px;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const FilterChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: ${p => p.darkMode ? 'rgba(33,150,243,0.15)' : 'rgba(33,150,243,0.1)'};
  color: #2196f3;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${p => p.darkMode ? 'rgba(33,150,243,0.25)' : 'rgba(33,150,243,0.2)'};
  }

  &::after {
    content: '×';
    font-size: 14px;
    font-weight: bold;
    opacity: 0.7;
  }

  @media (max-width: 768px) {
    padding: 6px 10px;
    font-size: 11px;
  }
`;

const SearchInput = styled.input`
  padding: 10px 16px;
  border: 1px solid ${p => p.darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(145,158,171,0.2)'};
  border-radius: 10px;
  background: ${p => p.darkMode ? 'rgba(17,24,39,0.8)' : 'rgba(255,255,255,0.95)'};
  color: ${p => p.darkMode ? '#fff' : '#333'};
  font-size: 14px;
  min-width: 200px;
  flex: 1;
  max-width: 300px;

  &::placeholder {
    color: ${p => p.darkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'};
  }

  &:focus {
    outline: none;
    border-color: rgba(33,150,243,0.5);
  }
`;

const Button = styled.button`
  padding: 10px 18px;
  border: 1px solid ${p => p.selected ? 'rgba(33,150,243,0.3)' : 'rgba(145,158,171,0.15)'};
  border-radius: 10px;
  background: ${p => p.selected ? 'rgba(33,150,243,0.1)' : p.darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)'};
  color: ${p => p.selected ? '#2196f3' : p.darkMode ? '#fff' : '#333'};
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;

  &:hover {
    background: ${p => p.selected ? 'rgba(33,150,243,0.15)' : p.darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'};
  }
`;

const Select = styled.select`
  padding: 10px 16px;
  padding-right: 32px;
  border: 1px solid ${p => p.selected ? 'rgba(33,150,243,0.3)' : p.darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(145,158,171,0.2)'};
  border-radius: 10px;
  background: ${p => p.selected ? 'rgba(33,150,243,0.1)' : p.darkMode ? 'rgba(17,24,39,0.8)' : 'rgba(255,255,255,0.95)'};
  color: ${p => p.selected ? '#2196f3' : p.darkMode ? '#fff' : '#333'};
  font-size: 14px;
  font-weight: ${p => p.selected ? '600' : '400'};
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 16px;
  transition: all 0.2s;

  &:hover {
    border-color: ${p => p.selected ? 'rgba(33,150,243,0.4)' : p.darkMode ? 'rgba(255,255,255,0.25)' : 'rgba(145,158,171,0.3)'};
  }
`;

const FilterInput = styled.input`
  padding: 8px 12px;
  border: 1px solid ${p => p.darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(145,158,171,0.2)'};
  border-radius: 8px;
  background: ${p => p.darkMode ? 'rgba(17,24,39,0.8)' : 'rgba(255,255,255,0.95)'};
  color: ${p => p.darkMode ? '#fff' : '#333'};
  font-size: 13px;
  width: 100px;

  &::placeholder {
    color: ${p => p.darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'};
  }
`;

const Label = styled.span`
  font-size: 13px;
  color: ${p => p.darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'};
  font-weight: 500;
  white-space: nowrap;
`;

const HeatMap = styled.div`
  width: 100%;
  height: 350px;
  background: ${p => p.darkMode ? '#1a1a1a' : '#fff'};
  border-radius: 12px;
  border: 1px solid ${p => p.darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0,0,0,0.1);
`;

const Canvas = styled.canvas`
  width: 100%;
  height: 100%;
  cursor: crosshair;
`;

const CustomTooltip = styled.div`
  position: fixed;
  background: ${p => p.darkMode ? 'rgba(17,24,39,0.95)' : 'rgba(255,255,255,0.95)'};
  border: 1px solid ${p => p.darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'};
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: ${p => p.darkMode ? '#fff' : '#333'};
  pointer-events: none;
  z-index: 1000;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  white-space: nowrap;
  transform: translate(10px, -50%);
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  border-radius: 12px;
  border: 1px solid ${p => p.darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
  background: ${p => p.darkMode ? 'rgba(255,255,255,0.02)' : '#fff'};
  width: 100%;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  min-width: 100%;
  table-layout: auto;
`;

const Th = styled.th`
  padding: 16px;
  text-align: ${p => p.align || 'left'};
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: ${p => p.darkMode ? '#bbb' : '#666'};
  background: ${p => p.darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)'};
  border-bottom: 2px solid ${p => p.darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
  cursor: ${p => p.sortable ? 'pointer' : 'default'};

  &:hover {
    ${p => p.sortable && `
      color: ${p.darkMode ? '#fff' : '#000'};
      background: ${p.darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
    `}
  }
`;

const Tr = styled.tr`
  border-bottom: 1px solid ${p => p.darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: ${p => p.darkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)'};
  }

  &:last-child {
    border-bottom: none;
  }
`;

const Td = styled.td`
  padding: 14px 16px;
  font-size: 14px;
  color: ${p => p.darkMode ? '#fff' : '#333'};
  text-align: ${p => p.align || 'left'};
`;

const TokenInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const TokenImage = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid ${p => p.darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
`;

const TokenDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const TokenName = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: ${p => p.darkMode ? '#fff' : '#000'};
`;

const TokenSymbol = styled.div`
  font-size: 12px;
  color: ${p => p.darkMode ? '#bbb' : '#666'};
  text-transform: uppercase;
`;

const RSIBadge = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  min-width: 50px;
  background: ${p => p.bg};
  color: ${p => p.color};
  border: 1px solid ${p => p.border};
`;

const PriceChange = styled.span`
  color: ${p => p.positive ? '#4caf50' : '#f44336'};
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 6px;
  background: ${p => p.positive ? 'rgba(76,175,80,0.1)' : 'rgba(244,67,54,0.1)'};
  font-size: 13px;
`;

function RSIAnalysisPage({ data }) {
  const { darkMode, activeFiatCurrency } = useContext(AppContext);
  const metrics = useSelector(selectMetrics);
  const exchRate = metrics[activeFiatCurrency] || 1;
  const canvasRef = useRef(null);
  const router = useRouter();

  const [tokens, setTokens] = useState(data?.tokens || []);
  const [loading, setLoading] = useState(false);
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, data: null });

  // API parameters
  const [params, setParams] = useState({
    start: 0,
    limit: 50,
    sortBy: 'rsi24h',
    sortType: 'desc',
    timeframe: '24h',
    origin: 'FirstLedger',
    minMarketCap: '',
    maxMarketCap: '',
    minVolume24h: '',
    maxVolume24h: '',
    minRsi24h: '',
    maxRsi24h: ''
  });

  const BASE_URL = process.env.API_URL;

  const timeframes = [
    { value: '15m', label: '15M' },
    { value: '1h', label: '1H' },
    { value: '4h', label: '4H' },
    { value: '24h', label: '24H' },
    { value: '7d', label: '7D' },
    { value: '30d', label: '30D' },
    { value: '90d', label: '90D' }
  ];

  const presets = [
    { label: 'Reset', filter: { origin: 'FirstLedger', minMarketCap: '', maxMarketCap: '', minVolume24h: '', maxVolume24h: '' } },
    { label: 'All', filter: {} },
    { label: 'Overbought', filter: { minRsi24h: '70' } },
    { label: 'Oversold', filter: { maxRsi24h: '30' } },
    { label: 'Extreme OB', filter: { minRsi24h: '80' } },
    { label: 'Extreme OS', filter: { maxRsi24h: '20' } },
    { label: 'FirstLedger', filter: { origin: 'FirstLedger', minMarketCap: '25000' } },
    { label: 'Quality', filter: { minMarketCap: '50000', minVolume24h: '5000' } }
  ];

  const loadTokens = useCallback(async () => {
    setLoading(true);
    try {
      const cleanParams = Object.entries(params).reduce((acc, [key, val]) => {
        if (val !== '' && val !== null && val !== undefined) {
          acc[key] = val;
        }
        return acc;
      }, {});

      const response = await axios.get(`${BASE_URL}/rsi`, { params: cleanParams });

      if (response.data?.tokens) {
        setTokens(response.data.tokens);
      }
    } catch (error) {
      console.error('Error loading RSI data:', error);
      setTokens([]);
    } finally {
      setLoading(false);
    }
  }, [params, BASE_URL]);

  useEffect(() => {
    loadTokens();
  }, [params]);

  const updateParam = (key, value) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const setTimeframe = (tf) => {
    setParams(prev => ({
      ...prev,
      timeframe: tf,
      sortBy: `rsi${tf}`,
      [`minRsi${tf}`]: prev[`minRsi${prev.timeframe}`] || '',
      [`maxRsi${tf}`]: prev[`maxRsi${prev.timeframe}`] || '',
      [`minRsi${prev.timeframe}`]: '',
      [`maxRsi${prev.timeframe}`]: ''
    }));
  };

  const applyPreset = (preset) => {
    setParams(prev => ({
      ...prev,
      ...preset.filter,
      start: 0
    }));
  };

  const removeFilter = (filterKey) => {
    setParams(prev => ({
      ...prev,
      [filterKey]: '',
      start: 0
    }));
  };

  const getActiveFilters = () => {
    const filters = [];
    const rsiField = `minRsi${params.timeframe}`;
    const maxRsiField = `maxRsi${params.timeframe}`;

    if (params.origin) filters.push({ key: 'origin', label: `Origin: ${params.origin}`, value: params.origin });
    if (params.minMarketCap) filters.push({ key: 'minMarketCap', label: `Min MC: $${params.minMarketCap}`, value: params.minMarketCap });
    if (params.maxMarketCap) filters.push({ key: 'maxMarketCap', label: `Max MC: $${params.maxMarketCap}`, value: params.maxMarketCap });
    if (params.minVolume24h) filters.push({ key: 'minVolume24h', label: `Min Vol: $${params.minVolume24h}`, value: params.minVolume24h });
    if (params.maxVolume24h) filters.push({ key: 'maxVolume24h', label: `Max Vol: $${params.maxVolume24h}`, value: params.maxVolume24h });
    if (params[rsiField]) filters.push({ key: rsiField, label: `Min RSI: ${params[rsiField]}`, value: params[rsiField] });
    if (params[maxRsiField]) filters.push({ key: maxRsiField, label: `Max RSI: ${params[maxRsiField]}`, value: params[maxRsiField] });

    return filters;
  };

  const handleSort = (field) => {
    setParams(prev => ({
      ...prev,
      sortBy: field,
      sortType: prev.sortBy === field && prev.sortType === 'desc' ? 'asc' : 'desc',
      start: 0
    }));
  };

  const getRSIValue = (token) => {
    const field = `rsi${params.timeframe}`;
    return token[field];
  };

  const getRSIColor = (rsi) => {
    if (!rsi || isNaN(rsi)) return {
      bg: 'transparent',
      color: darkMode ? '#666' : '#999',
      border: 'transparent'
    };

    if (rsi >= 80) return {
      bg: 'rgba(244,67,54,0.2)',
      color: '#ff4444',
      border: 'rgba(244,67,54,0.3)'
    };

    if (rsi >= 70) return {
      bg: 'rgba(244,67,54,0.15)',
      color: '#ff8844',
      border: 'rgba(244,67,54,0.25)'
    };

    if (rsi <= 20) return {
      bg: 'rgba(138,68,255,0.2)',
      color: '#8844ff',
      border: 'rgba(138,68,255,0.3)'
    };

    if (rsi <= 30) return {
      bg: 'rgba(68,138,255,0.15)',
      color: '#4488ff',
      border: 'rgba(68,138,255,0.25)'
    };

    return {
      bg: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      color: darkMode ? '#fff' : '#000',
      border: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
    };
  };

  const handleCanvasMouseMove = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas || !tokens.length) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const padding = 60;

    const validTokens = tokens.filter(token => {
      const rsi = getRSIValue(token);
      return rsi && token.marketcap && rsi >= 0 && rsi <= 100;
    }).slice(0, 100);

    let hoveredToken = null;
    let minDistance = Infinity;

    if (validTokens.length > 0) {
      const marketCaps = validTokens.map(t => t.marketcap);
      const minMC = Math.min(...marketCaps);
      const maxMC = Math.max(...marketCaps);
      const logMinMC = Math.log10(Math.max(minMC, 1));
      const logMaxMC = Math.log10(Math.max(maxMC, 1));

      validTokens.forEach((token, index) => {
        const rsi = getRSIValue(token);
        const marketCap = token.marketcap || 1;
        const logMC = Math.log10(Math.max(marketCap, 1));
        const xNormalized = logMaxMC > logMinMC ? (logMC - logMinMC) / (logMaxMC - logMinMC) : 0.5;
        const baseX = padding + (xNormalized * (rect.width - padding * 1.5));
        const baseY = rect.height - padding - ((rsi / 100) * (rect.height - padding * 2));

        // Add same jitter as in drawHeatMap
        const jitterX = (index % 7 - 3) * 8;
        const jitterY = (Math.floor(index / 7) % 5 - 2) * 6;
        const tokenX = baseX + jitterX;
        const tokenY = baseY + jitterY;

        const distance = Math.sqrt((x - tokenX) ** 2 + (y - tokenY) ** 2);
        const size = Math.max(4, Math.min(20, Math.sqrt(marketCap / 1000000) * 3 + 3));

        if (distance <= size + 8 && distance < minDistance) {
          minDistance = distance;
          hoveredToken = token;
        }
      });
    }

    if (hoveredToken) {
      setTooltip({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        data: hoveredToken
      });
    } else {
      setTooltip({ visible: false, x: 0, y: 0, data: null });
    }
  }, [tokens, getRSIValue]);

  const handleCanvasMouseLeave = useCallback(() => {
    setTooltip({ visible: false, x: 0, y: 0, data: null });
  }, []);

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

    ctx.fillStyle = darkMode ? '#1a1a1a' : '#fff';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);

    [20, 30, 50, 70, 80].forEach(level => {
      const y = height - padding - ((level / 100) * (height - padding * 2));
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding / 2, y);
      ctx.stroke();
    });

    ctx.setLineDash([]);

    ctx.fillStyle = darkMode ? 'rgba(244,67,54,0.08)' : 'rgba(244,67,54,0.05)';
    const overboughtY = height - padding - ((70 / 100) * (height - padding * 2));
    ctx.fillRect(padding, padding, width - padding * 1.5, overboughtY - padding);

    ctx.fillStyle = darkMode ? 'rgba(76,175,80,0.08)' : 'rgba(76,175,80,0.05)';
    const oversoldY = height - padding - ((30 / 100) * (height - padding * 2));
    ctx.fillRect(padding, oversoldY, width - padding * 1.5, height - padding - oversoldY);

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

        const logMC = Math.log10(Math.max(marketCap, 1));
        const xNormalized = logMaxMC > logMinMC ? (logMC - logMinMC) / (logMaxMC - logMinMC) : 0.5;
        const baseX = padding + (xNormalized * (width - padding * 1.5));
        const baseY = height - padding - ((rsi / 100) * (height - padding * 2));

        // Add slight jitter to prevent overlap
        const jitterX = (index % 7 - 3) * 8;
        const jitterY = (Math.floor(index / 7) % 5 - 2) * 6;
        const x = baseX + jitterX;
        const y = baseY + jitterY;

        const size = Math.max(4, Math.min(20, Math.sqrt(marketCap / 1000000) * 3 + 3));

        let color;
        if (rsi >= 80) color = '#ff4444';
        else if (rsi >= 70) color = '#ff8844';
        else if (rsi <= 20) color = '#8844ff';
        else if (rsi <= 30) color = '#4488ff';
        else color = '#44ff44';

        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();

        ctx.strokeStyle = darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Add token name as flag
        if (token.name) {
          const flagX = x + size + 8;
          const flagY = y - 2;

          // Flag background
          ctx.font = '11px Arial';
          ctx.textAlign = 'left';
          const textWidth = ctx.measureText(token.name.substring(0, 12)).width;

          ctx.fillStyle = darkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.9)';
          ctx.fillRect(flagX - 2, flagY - 8, textWidth + 6, 16);

          // Flag border
          ctx.strokeStyle = darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(flagX - 2, flagY - 8, textWidth + 6, 16);

          // Flag text
          ctx.fillStyle = darkMode ? '#fff' : '#333';
          ctx.textBaseline = 'middle';
          ctx.fillText(token.name.substring(0, 12), flagX, flagY);

          // Connector line
          ctx.strokeStyle = darkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x + size, y);
          ctx.lineTo(flagX - 2, flagY);
          ctx.stroke();
        }
      });
    }

    ctx.fillStyle = darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    [0, 20, 30, 50, 70, 80, 100].forEach(level => {
      const y = height - padding - ((level / 100) * (height - padding * 2));
      ctx.fillText(level.toString(), padding - 10, y);
    });

    ctx.save();
    ctx.translate(20, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px Arial';
    ctx.fillText(`RSI ${params.timeframe.toUpperCase()}`, 0, 0);
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.font = 'bold 12px Arial';
    ctx.fillText(`Market Cap (${activeFiatCurrency})`, width / 2, height - 20);
  }, [tokens, params.timeframe, darkMode, activeFiatCurrency, getRSIValue]);

  useEffect(() => {
    const timer = setTimeout(drawHeatMap, 100);
    return () => clearTimeout(timer);
  }, [drawHeatMap]);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 600);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <Wrapper>
      {!isMobile && <Toolbar />}
      <Header />
      <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
        RSI Analysis for XRPL Tokens
      </h1>

      <Container maxWidth="xl">
        <Controls darkMode={darkMode}>
              <ControlRow>
                <MobileSection>
                  <Label darkMode={darkMode}>Timeframe:</Label>
                  <MobileButtonGrid>
                    {timeframes.map(tf => (
                      <Button
                        key={tf.value}
                        darkMode={darkMode}
                        selected={params.timeframe === tf.value}
                        onClick={() => setTimeframe(tf.value)}
                      >
                        {tf.label}
                      </Button>
                    ))}
                  </MobileButtonGrid>
                </MobileSection>
                <div style={{ marginLeft: 'auto' }}>
                  <Select
                    darkMode={darkMode}
                    value={params.limit}
                    onChange={e => updateParam('limit', e.target.value)}
                  >
                    <option value="25">25 rows</option>
                    <option value="50">50 rows</option>
                    <option value="100">100 rows</option>
                  </Select>
                </div>
              </ControlRow>

              <ControlRow>
                <MobileSection>
                  <Label darkMode={darkMode}>Presets:</Label>
                  <MobileButtonGrid>
                    {presets.map(preset => (
                      <Button
                        key={preset.label}
                        darkMode={darkMode}
                        onClick={() => applyPreset(preset)}
                      >
                        {preset.label}
                      </Button>
                    ))}
                  </MobileButtonGrid>
                </MobileSection>
              </ControlRow>

              <ControlRow>
                <MobileSection>
                  <Label darkMode={darkMode}>Filters:</Label>
                  <MobileFilterGrid>
                    <Select
                      darkMode={darkMode}
                      selected={params.origin === 'FirstLedger'}
                      value={params.origin}
                      onChange={e => updateParam('origin', e.target.value)}
                    >
                      <option value="">All Origins</option>
                      <option value="FirstLedger">FirstLedger</option>
                    </Select>
                    <FilterInput
                      darkMode={darkMode}
                      placeholder="Min MC"
                      value={params.minMarketCap}
                      onChange={e => updateParam('minMarketCap', e.target.value)}
                    />
                    <FilterInput
                      darkMode={darkMode}
                      placeholder="Max MC"
                      value={params.maxMarketCap}
                      onChange={e => updateParam('maxMarketCap', e.target.value)}
                    />
                    <FilterInput
                      darkMode={darkMode}
                      placeholder="Min Vol"
                      value={params.minVolume24h}
                      onChange={e => updateParam('minVolume24h', e.target.value)}
                    />
                    <FilterInput
                      darkMode={darkMode}
                      placeholder={`Min RSI ${params.timeframe}`}
                      value={params[`minRsi${params.timeframe}`] || ''}
                      onChange={e => updateParam(`minRsi${params.timeframe}`, e.target.value)}
                    />
                    <FilterInput
                      darkMode={darkMode}
                      placeholder={`Max RSI ${params.timeframe}`}
                      value={params[`maxRsi${params.timeframe}`] || ''}
                      onChange={e => updateParam(`maxRsi${params.timeframe}`, e.target.value)}
                    />
                  </MobileFilterGrid>
                </MobileSection>
              </ControlRow>

              {getActiveFilters().length > 0 && (
                <ControlRow>
                  <MobileSection>
                    <Label darkMode={darkMode}>Active:</Label>
                    <ActiveFilters>
                      {getActiveFilters().map(filter => (
                        <FilterChip
                          key={filter.key}
                          darkMode={darkMode}
                          onClick={() => removeFilter(filter.key)}
                          title="Click to remove filter"
                        >
                          {filter.label}
                        </FilterChip>
                      ))}
                    </ActiveFilters>
                  </MobileSection>
                </ControlRow>
              )}
            </Controls>

            <HeatMap darkMode={darkMode}>
              <Canvas
                ref={canvasRef}
                onMouseMove={handleCanvasMouseMove}
                onMouseLeave={handleCanvasMouseLeave}
              />
              <div style={{
                position: 'absolute',
                top: '20px',
                left: '20px',
                fontSize: '18px',
                fontWeight: '700',
                color: darkMode ? '#fff' : '#000'
              }}>
                RSI Heatmap - {params.timeframe.toUpperCase()}
              </div>
              {tooltip.visible && tooltip.data && (
                <CustomTooltip
                  darkMode={darkMode}
                  style={{ left: tooltip.x, top: tooltip.y }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    {tooltip.data.name}
                  </div>
                  <div>RSI: {getRSIValue(tooltip.data)?.toFixed(1) || 'N/A'}</div>
                  <div>MC: ${(tooltip.data.marketcap / 1000000).toFixed(2)}M</div>
                  <div>24h: {tooltip.data.pro24h >= 0 ? '+' : ''}{tooltip.data.pro24h?.toFixed(2) || '0.00'}%</div>
                </CustomTooltip>
              )}
            </HeatMap>

            <TableWrapper darkMode={darkMode}>
              <Table>
                <thead>
                  <tr>
                    <Th darkMode={darkMode}>#</Th>
                    <Th darkMode={darkMode}>Token</Th>
                    <Th darkMode={darkMode} align="right" sortable onClick={() => handleSort('exch')}>
                      Price
                    </Th>
                    <Th darkMode={darkMode} align="right" sortable onClick={() => handleSort('pro24h')}>
                      24h Change
                    </Th>
                    <Th darkMode={darkMode} align="right" sortable onClick={() => handleSort('vol24hxrp')}>
                      Volume 24h
                    </Th>
                    <Th darkMode={darkMode} align="right" sortable onClick={() => handleSort('marketcap')}>
                      Market Cap
                    </Th>
                    <Th darkMode={darkMode} align="center" sortable onClick={() => handleSort(`rsi${params.timeframe}`)}>
                      RSI {params.timeframe.toUpperCase()}
                    </Th>
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
                      <Tr
                        key={token.md5}
                        darkMode={darkMode}
                        onClick={() => router.push(`/token/${token.slug}`)}
                      >
                        <Td darkMode={darkMode}>{params.start + idx + 1}</Td>
                        <Td darkMode={darkMode}>
                          <TokenInfo>
                            <TokenImage
                              darkMode={darkMode}
                              src={`https://s1.xrpl.to/token/${token.md5}`}
                              alt={token.name}
                              onError={e => e.target.style.display = 'none'}
                            />
                            <TokenDetails>
                              <TokenName darkMode={darkMode}>{token.name}</TokenName>
                              <TokenSymbol darkMode={darkMode}>{token.user}</TokenSymbol>
                            </TokenDetails>
                          </TokenInfo>
                        </Td>
                        <Td darkMode={darkMode} align="right">
                          <span>{currencySymbols[activeFiatCurrency]}{fNumber(priceFiat)}</span>
                        </Td>
                        <Td darkMode={darkMode} align="right">
                          <PriceChange positive={token.pro24h >= 0}>
                            {token.pro24h >= 0 ? '+' : ''}{token.pro24h?.toFixed(2) || '0.00'}%
                          </PriceChange>
                        </Td>
                        <Td darkMode={darkMode} align="right">
                          <span>
                            {currencySymbols[activeFiatCurrency]}
                            {volumeFiat >= 1e6 ? `${(volumeFiat / 1e6).toFixed(1)}M` :
                             volumeFiat >= 1e3 ? `${(volumeFiat / 1e3).toFixed(1)}K` :
                             fNumber(volumeFiat)}
                          </span>
                        </Td>
                        <Td darkMode={darkMode} align="right">
                          <span>
                            {currencySymbols[activeFiatCurrency]}
                            {marketCapFiat >= 1e6 ? `${(marketCapFiat / 1e6).toFixed(1)}M` :
                             marketCapFiat >= 1e3 ? `${(marketCapFiat / 1e3).toFixed(1)}K` :
                             fNumber(marketCapFiat)}
                          </span>
                        </Td>
                        <Td darkMode={darkMode} align="center">
                          <RSIBadge {...rsiColors}>
                            {rsi ? rsi.toFixed(1) : '-'}
                          </RSIBadge>
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            </TableWrapper>

        {tokens.length > 0 && (
          <div style={{ marginTop: '20px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <Button
              darkMode={darkMode}
              onClick={() => updateParam('start', Math.max(0, params.start - params.limit))}
              disabled={params.start === 0}
            >
              Previous
            </Button>
            <span style={{ padding: '10px', color: darkMode ? '#fff' : '#333' }}>
              Page {Math.floor(params.start / params.limit) + 1}
            </span>
            <Button
              darkMode={darkMode}
              onClick={() => updateParam('start', params.start + params.limit)}
              disabled={tokens.length < params.limit}
            >
              Next
            </Button>
          </div>
        )}
      </Container>

      <ScrollToTop />
      <Footer />
    </Wrapper>
  );
}

export default RSIAnalysisPage;

export async function getStaticProps() {
  const BASE_URL = process.env.API_URL;

  try {
    const res = await axios.get(`${BASE_URL}/rsi`, {
      params: {
        sortBy: 'rsi24h',
        sortType: 'desc',
        limit: 50,
        timeframe: '24h'
      }
    });

    return {
      props: {
        data: {
          tokens: res.data?.tokens || []
        },
        ogp: {
          canonical: 'https://xrpl.to/rsi-analysis',
          title: 'RSI Analysis | XRPL Token Technical Indicators',
          url: 'https://xrpl.to/rsi-analysis',
          imgUrl: 'https://xrpl.to/static/ogp.webp',
          desc: 'Advanced RSI analysis for XRPL tokens with overbought/oversold detection',
          keywords: 'RSI analysis, XRPL tokens, technical indicators, crypto RSI'
        }
      },
      revalidate: 60
    };
  } catch (error) {
    console.error('Error fetching RSI data:', error);
    return {
      props: { data: { tokens: [] } },
      revalidate: 60
    };
  }
}