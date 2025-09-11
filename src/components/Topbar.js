import React, { useState, useContext, useEffect, useMemo, useCallback, lazy, Suspense } from 'react';
import dynamic from 'next/dynamic';
import Decimal from 'decimal.js';
import 'src/utils/i18n';
import { useRouter } from 'next/router';
import { useDispatch, useSelector } from 'react-redux';
import { selectMetrics, update_metrics } from 'src/redux/statusSlice';
import { useTranslation } from 'react-i18next';
import { AppContext } from 'src/AppContext';
import { currencySymbols, getTokenImageUrl, decodeCurrency } from 'src/utils/constants';
import axios from 'axios';
import { throttle } from 'lodash';
import styled from '@emotion/styled';
import InfoIcon from '@mui/icons-material/Info';
import WavesIcon from '@mui/icons-material/Waves';
import SetMealIcon from '@mui/icons-material/SetMeal';
import PetsIcon from '@mui/icons-material/Pets';
import WaterIcon from '@mui/icons-material/Water';

// Lazy load switchers
const CurrencySwitcher = dynamic(() => import('./CurrencySwitcher'), { 
  loading: () => <SkeletonLoader style={{ width: '100px', height: '32px' }} />,
  ssr: false 
});
const ThemeSwitcher = dynamic(() => import('./ThemeSwitcher'), { 
  loading: () => <SkeletonLoader style={{ width: '32px', height: '32px', borderRadius: '50%' }} />,
  ssr: false 
});

// Helper function for responsive breakpoints
const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px'
};

const media = {
  up: (breakpoint) => `@media (min-width: ${breakpoints[breakpoint]})`,
  down: (breakpoint) => `@media (max-width: ${breakpoints[breakpoint]})`
};

// Skeleton loader component
const SkeletonLoader = styled.div`
  background: linear-gradient(90deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  border-radius: 4px;
  
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;

// Custom styled components
const TopWrapper = styled.header`
  width: 100%;
  display: flex;
  align-items: center;
  height: 36px;
  background: ${props => props.backgroundColor};
  border-top: 1px solid ${props => props.darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'};
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1099;
  box-shadow: 0 -1px 8px ${props => props.darkMode ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.08)'};
  backdrop-filter: blur(20px) saturate(120%);
  font-family: 'JetBrains Mono', monospace;
`;

const Container = styled.div`
  width: 100%;
  max-width: 100%;
  padding: 0 8px;
  margin: 0 auto;
  height: 100%;
  display: flex;
  align-items: center;
  
  ${media.down('md')} {
    padding: 0 2px;
  }
`;

const ContentWrapper = styled.nav`
  display: flex;
  gap: 4px;
  padding-top: 0;
  padding-bottom: 0;
  overflow: auto;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  
  &::-webkit-scrollbar {
    display: none;
  }
  scrollbar-width: none;
`;

const APILabel = styled.button`
  font-size: 10px;
  font-weight: 600;
  color: ${props => props.textColor};
  text-decoration: none;
  margin-left: 3px;
  background: ${props => props.primaryColor ? `${props.primaryColor}14` : 'rgba(0,128,255,0.08)'};
  padding: 4px 8px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 3px;
  min-height: 26px;
  border: 1px solid ${props => props.primaryColor ? `${props.primaryColor}26` : 'rgba(0,128,255,0.15)'};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.primaryColor ? `${props.primaryColor}1f` : 'rgba(0,128,255,0.12)'};
  }
  
  &:focus {
    outline: 2px solid ${props => props.primaryColor || '#0080ff'};
    outline-offset: 2px;
  }
  
  ${media.down('md')} {
    min-height: 44px;
    padding: 8px 12px;
    margin-left: 0;
  }
`;

const MobileContainer = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  height: 100%;
  gap: 0;
  background: transparent;
`;

const MobileMetricCard = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 0 2px;
  background: ${props => `${props.color}08`};
  border-left: ${props => props.isFirst ? 'none' : `1px solid ${props.borderColor}`};
`;

const MetricContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const MetricBadge = styled.span`
  font-size: 0.4rem;
  font-weight: 600;
  color: ${props => props.textColor};
  opacity: 0.8;
  text-transform: uppercase;
  letter-spacing: 0.1px;
  font-family: 'JetBrains Mono', monospace;
`;

const MetricNumber = styled.span`
  font-size: 0.6rem;
  font-weight: 700;
  color: ${props => props.color};
  font-family: 'JetBrains Mono', monospace;
  line-height: 0.8;
`;

const LiveButton = styled.button`
  display: flex;
  align-items: center;
  gap: 1px;
  padding: 2px 5px;
  background: ${props => props.primaryColor}20;
  border: none;
  border-radius: 10px;
  color: ${props => props.primaryColor};
  font-size: 0.5rem;
  font-weight: 800;
  cursor: pointer;
  margin-left: 2px;
  box-shadow: inset 0 1px 0 ${props => props.primaryColor}30;
  min-width: 36px;
  height: 18px;
  justify-content: center;
`;

const H24Style = styled.div`
  cursor: pointer;
  padding: 2px 4px;
  background: ${props => props.primaryColor || '#0080ff'};
  border-radius: 4px;
  min-width: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 2px rgba(0,0,0,0.2);
  transition: background 0.2s;
  
  &:hover {
    filter: brightness(0.9);
  }
`;

const PulsatingCircle = styled.div`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: ${props => props.primaryColor || '#10b981'};
  position: relative;
  animation: pulse 2s infinite;
  
  @keyframes pulse {
    0% {
      box-shadow: 0 0 0 0 ${props => props.primaryColor ? `${props.primaryColor}b3` : 'rgba(16, 185, 129, 0.7)'};
    }
    70% {
      box-shadow: 0 0 0 8px ${props => props.primaryColor ? `${props.primaryColor}00` : 'rgba(16, 185, 129, 0)'};
    }
    100% {
      box-shadow: 0 0 0 0 ${props => props.primaryColor ? `${props.primaryColor}00` : 'rgba(16, 185, 129, 0)'};
    }
  }
`;

const MetricContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 2px 4px;
  border-radius: 4px;
  background: transparent;
  min-width: auto;
  position: relative;
  transition: background 0.2s;
  
  &:hover {
    background: rgba(0,0,0,0.04);
  }
`;

const MetricLabel = styled.span`
  color: ${props => props.textSecondary};
  font-weight: 600;
  font-size: 0.55rem;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  line-height: 1;
  font-family: inherit;
`;

const MetricValue = styled.span`
  font-weight: 600;
  font-size: 0.8rem;
  line-height: 1;
  font-family: inherit;
  letter-spacing: -0.01em;
  color: ${props => props.color || props.textPrimary};
`;

const Drawer = styled.div`
  position: fixed;
  bottom: 36px;
  right: ${props => props.open ? '0' : '-100%'};
  width: ${props => props.isMobile ? (props.isSmallMobile ? '100vw' : '90vw') : '400px'};
  height: calc(100vh - 36px);
  background: ${props => props.backgroundColor};
  box-shadow: -4px -4px 16px rgba(0,0,0,0.25);
  transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 1200;
  display: flex;
  flex-direction: column;
  max-width: ${props => props.isMobile ? '100vw' : '400px'};
  border-top-left-radius: 12px;
  
  ${media.down('sm')} {
    width: 100vw;
    max-width: 100vw;
    right: ${props => props.open ? '0' : '-100vw'};
  }
`;

const DrawerHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: ${props => props.paperBackground};
  border-bottom: 1px solid ${props => props.darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'};
  position: sticky;
  top: 0;
  z-index: 1;
  min-height: 64px;
  
  ${media.down('md')} {
    padding: 12px 16px;
    min-height: 60px;
  }
`;

const DrawerOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: ${props => props.open ? 'block' : 'none'};
  z-index: 1199;
`;

const IconButton = styled.button`
  background: transparent;
  border: none;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 6px;
  color: ${props => props.textSecondary};
  transition: all 0.2s;
  
  &:hover {
    background: ${props => props.darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
    color: ${props => props.textPrimary};
  }
  
  &:focus {
    outline: 2px solid ${props => props.primaryColor || '#0080ff'};
    outline-offset: 2px;
  }
  
  ${media.down('md')} {
    width: 44px;
    height: 44px;
  }
`;

const SelectButton = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  font-size: 0.75rem;
  border: 1px solid ${props => props.darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)'};
  border-radius: 6px;
  background: ${props => props.paperBackground};
  color: ${props => props.textPrimary};
  cursor: pointer;
  min-width: 120px;
  height: 32px;
  transition: all 0.2s;
  position: relative;
  
  &:hover {
    border-color: ${props => props.primaryColor || '#0080ff'};
  }
  
  &:focus {
    outline: 2px solid ${props => props.primaryColor || '#0080ff'};
    outline-offset: 2px;
    border-color: ${props => props.primaryColor || '#0080ff'};
  }
  
  ${media.down('md')} {
    min-height: 44px;
    height: 44px;
    padding: 8px 12px;
    min-width: 140px;
  }
`;

const SelectDropdown = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: ${props => props.paperBackground};
  border: 1px solid ${props => props.darkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.3)'};
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  z-index: 1000;
  overflow: hidden;
`;

const SelectOption = styled.button`
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 6px 8px;
  font-size: 0.75rem;
  background: transparent;
  color: ${props => props.textPrimary};
  border: none;
  cursor: pointer;
  transition: background 0.2s;
  text-align: left;
  
  &:hover {
    background: ${props => props.darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'};
  }
  
  &.selected {
    background: ${props => props.primaryColor ? `${props.primaryColor}1a` : 'rgba(0,128,255,0.1)'};
    color: ${props => props.primaryColor || '#0080ff'};
  }
`;

const TradeList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 0;
  background: ${props => props.backgroundColor};
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${props => props.darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${props => props.primaryColor ? `${props.primaryColor}40` : 'rgba(0,128,255,0.25)'};
    border-radius: 3px;
    
    &:hover {
      background: ${props => props.primaryColor ? `${props.primaryColor}60` : 'rgba(0,128,255,0.4)'};
    }
  }
`;

const TradeItem = styled.a`
  display: flex;
  align-items: center;
  padding: 12px;
  border-bottom: 1px solid ${props => props.darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'};
  text-decoration: none;
  color: inherit;
  background: ${props => props.isBuy 
    ? `rgba(16, 185, 129, ${props.opacity})` 
    : `rgba(239, 68, 68, ${props.opacity})`};
  transition: background 0.2s;
  min-height: 64px;
  
  &:hover {
    background: ${props => props.isBuy 
      ? `rgba(16, 185, 129, ${props.opacity * 1.5})` 
      : `rgba(239, 68, 68, ${props.opacity * 1.5})`};
  }
  
  &:active {
    background: ${props => props.isBuy 
      ? `rgba(16, 185, 129, ${props.opacity * 2})` 
      : `rgba(239, 68, 68, ${props.opacity * 2})`};
  }
  
  ${media.down('md')} {
    padding: 14px 16px;
    min-height: 72px;
  }
`;

const TokenImage = styled.img`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${props => props.darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)'};
  object-fit: cover;
  flex-shrink: 0;
  
  ${media.down('md')} {
    width: 24px;
    height: 24px;
  }
`;

const Typography = styled.span`
  font-family: inherit;
  font-size: ${props => props.variant === 'caption' ? '0.75rem' : '0.875rem'};
  font-weight: ${props => props.fontWeight || 400};
  color: ${props => props.color || 'inherit'};
`;

const Box = styled.div`
  display: ${props => props.display || 'block'};
  align-items: ${props => props.alignItems || 'stretch'};
  justify-content: ${props => props.justifyContent || 'flex-start'};
  gap: ${props => props.gap ? `${props.gap * 4}px` : '0'};
  padding: ${props => props.p ? `${props.p * 8}px` : '0'};
  margin: ${props => props.m ? `${props.m * 8}px` : '0'};
  text-align: ${props => props.textAlign || 'left'};
  flex: ${props => props.flex || 'initial'};
  width: ${props => props.width || 'auto'};
  min-width: ${props => props.minWidth || 'auto'};
`;

const Stack = styled.div`
  display: flex;
  flex-direction: ${props => props.direction === 'row' ? 'row' : 'column'};
  gap: ${props => props.spacing ? `${props.spacing * 4}px` : '0'};
  align-items: ${props => props.alignItems || 'stretch'};
  width: ${props => props.width || 'auto'};
  flex: ${props => props.flex || 'initial'};
`;

const CircularProgress = styled.div`
  width: ${props => props.size || 40}px;
  height: ${props => props.size || 40}px;
  border: 3px solid ${props => props.darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
  border-top-color: ${props => props.primaryColor || '#0080ff'};
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

// Icons as React components
const SwapHorizIcon = ({ style }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={style}>
    <path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z"/>
  </svg>
);

const CloseIcon = ({ style }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={style}>
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
  </svg>
);

const LinkIcon = ({ style }) => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={style}>
    <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/>
  </svg>
);

// Constants
const SWITCH_INTERVAL = 5000;
const FILTER_OPTIONS = [
  { value: 'All', label: 'All Trades', IconComponent: WavesIcon },
  { value: '500+', label: '500+ XRP', IconComponent: SetMealIcon },
  { value: '1000+', label: '1000+ XRP', IconComponent: PetsIcon },
  { value: '2500+', label: '2500+ XRP', IconComponent: WaterIcon },
  { value: '5000+', label: '5000+ XRP', IconComponent: InfoIcon },
  { value: '10000+', label: '10000+ XRP', IconComponent: InfoIcon }
];

// Helper functions
const formatRelativeTime = (timestamp) => {
  const now = Date.now();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}min ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d ago`;
  }
};

const getTradeSizeIconComponent = (value) => {
  const xrpValue = parseFloat(value);
  if (xrpValue < 500) return SetMealIcon;  // Small for smallest
  if (xrpValue < 1000) return PetsIcon;  // Regular
  if (xrpValue < 2500) return WaterIcon;  // Medium
  if (xrpValue < 5000) return InfoIcon;  // Large
  if (xrpValue < 10000) return WavesIcon;  // Larger
  return InfoIcon;  // Largest
};

const abbreviateNumber = (num) => {
  if (Math.abs(num) < 1000) return num.toFixed(1);
  const suffixes = ['', 'k', 'M', 'B', 'T'];
  const magnitude = Math.floor(Math.log10(Math.abs(num)) / 3);
  const scaled = num / Math.pow(10, magnitude * 3);
  return scaled.toFixed(2).replace(/\.?0+$/, '') + suffixes[magnitude];
};

const formatTradeValue = (value) => {
  const numValue = typeof value === 'string' ? Number(value) : value;
  if (Math.abs(numValue) < 0.0001) {
    return numValue.toFixed(8);
  }
  if (Math.abs(numValue) < 1) {
    return numValue.toFixed(4);
  }
  return abbreviateNumber(numValue);
};

const getXRPAmount = (trade) => {
  if (!trade || (!trade.paid && !trade.got)) {
    return 0;
  }
  let xrpValue = 0;
  try {
    if (trade.paid && trade.paid.currency === 'XRP') {
      xrpValue = parseValue(trade.paid.value);
    } else if (trade.got && trade.got.currency === 'XRP') {
      xrpValue = parseValue(trade.got.value);
    }
  } catch (error) {
    console.error('Error parsing XRP amount:', error);
    return 0;
  }
  return xrpValue;
};

const parseValue = (value) => {
  if (!value && value !== 0) {
    return 0;
  }
  try {
    if (typeof value === 'string' && value.includes('e')) {
      return parseFloat(Number(value).toFixed(8));
    }
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  } catch (error) {
    console.error('Error parsing value:', error);
    return 0;
  }
};

const getTradeApiUrl = (filter) => {
  const baseUrl = 'https://api.xrpl.to/api/history?md5=84e5efeb89c4eae8f68188982dc290d8&page=0&limit=200';
  if (filter === 'All') {
    return baseUrl;
  }
  const xrpAmount = filter.replace('+', '');
  return `${baseUrl}&xrpAmount=${xrpAmount}`;
};

// Custom hook for media queries
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query.replace('@media ', ''));
    setMatches(mediaQuery.matches);

    const handler = (e) => setMatches(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [query]);

  return matches;
};

const Topbar = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const metrics = useSelector(selectMetrics);
  const { darkMode, activeFiatCurrency, themeName } = useContext(AppContext);
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isSmallMobile = useMediaQuery('(max-width: 480px)');
  const isDesktop = useMediaQuery('(min-width: 1024px)');
  const iconColor = darkMode ? '#FFFFFF' : '#000000';
  const [fullSearch, setFullSearch] = useState(false);
  const [tradeDrawerOpen, setTradeDrawerOpen] = useState(false);
  const router = useRouter();

  const [trades, setTrades] = useState([]);
  const [wsError, setWsError] = useState(null);
  const [isWsLoading, setIsWsLoading] = useState(false);
  const [tradeFilter, setTradeFilter] = useState('All');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);

  // Get theme-specific colors
  const getThemeColors = () => {
    // Import theme context if available
    const themeContext = useContext(AppContext);
    const currentTheme = themeContext?.theme;
    
    // Check if we're using SyncWaveTheme or other dark themes
    const isSyncWave = currentTheme?.header?.background === 'rgba(13, 8, 24, 0.8)';
    const isCustomTheme = currentTheme?.header?.background && currentTheme.header.background !== '#000000' && currentTheme.header.background !== '#ffffff';
    
    let backgroundColor;
    if (isCustomTheme) {
      backgroundColor = currentTheme.header.background;
    } else {
      backgroundColor = currentTheme?.palette?.background?.default || (darkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)');
    }
    
    return {
      primaryColor: currentTheme?.palette?.primary?.main || (darkMode ? '#147DFE' : '#0080ff'),
      backgroundColor,
      paperBackground: currentTheme?.palette?.background?.paper || (darkMode ? '#0a0a0a' : '#f5f5f5'),
      textPrimary: currentTheme?.palette?.text?.primary || (darkMode ? '#ffffff' : '#000000'),
      textSecondary: currentTheme?.palette?.text?.secondary || (darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)')
    };
  };

  const themeColors = getThemeColors();
  const primaryColor = themeColors.primaryColor;

  // Check if metrics are properly loaded
  const metricsLoaded = useMemo(() => {
    return metrics?.global?.total !== undefined && 
           metrics?.global?.totalAddresses !== undefined &&
           metrics?.H24?.transactions24H !== undefined &&
           metrics?.global?.total > 0;
  }, [metrics?.global?.total, metrics?.global?.totalAddresses, metrics?.H24?.transactions24H]);

  // Fetch metrics if not loaded
  useEffect(() => {
    if (!metricsLoaded) {
      const controller = new AbortController();
      const fetchMetrics = async () => {
        try {
          const response = await axios.get('https://api.xrpl.to/api/tokens?start=0&limit=100&sortBy=vol24hxrp&sortType=desc&filter=', {
            signal: controller.signal
          });
          if (response.status === 200 && response.data) {
            dispatch(update_metrics(response.data));
          }
        } catch (error) {
          if (!axios.isCancel(error)) {
            console.error('Error fetching metrics:', error);
          }
        }
      };
      fetchMetrics();
      return () => controller.abort();
    }
  }, [metricsLoaded, dispatch]);



  const handleTradeDrawerOpen = () => {
    if (!tradeDrawerOpen) {
      setTradeDrawerOpen(true);
    }
  };

  const handleTradeDrawerClose = () => {
    if (tradeDrawerOpen) {
      setTradeDrawerOpen(false);
    }
  };

  const handleFilterChange = useCallback((event) => {
    setTrades([]);
    setIsWsLoading(true);
    setTradeFilter(event.target.value);
  }, []);

  // Throttled functions
  const throttledSetTrades = useMemo(
    () => throttle((newTrades) => {
      setTrades(newTrades);
    }, 200),
    []
  );

  const throttledAddTrade = useMemo(
    () => throttle((newTrade) => {
      setTrades((prevTrades) => [newTrade, ...prevTrades].slice(0, 200));
    }, 200),
    []
  );

  // WebSocket connection for live trades
  useEffect(() => {
    if (!tradeDrawerOpen) {
      return;
    }

    setIsWsLoading(true);
    setTrades([]);
    setWsError(null);

    // Load initial data
    const loadInitialData = async () => {
      try {
        const apiUrl = getTradeApiUrl(tradeFilter);
        const response = await axios.get(apiUrl);
        if (response.data && response.data.hists) {
          setTrades(response.data.hists.slice(0, 200));
        }
      } catch (error) {
        console.error('Failed to load initial trades:', error);
      }
    };

    loadInitialData();

    // Skip WebSocket connection in development to avoid errors
    if (process.env.RUN_ENV === 'development') {
      setIsWsLoading(false);
      return () => {
        throttledSetTrades.cancel();
        throttledAddTrade.cancel();
      };
    }
    
    const ws = new WebSocket('wss://api.xrpl.to/ws/sync');

    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsWsLoading(false);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (Array.isArray(data)) {
          throttledSetTrades(data.slice(0, 200));
        } else if (typeof data === 'object' && data !== null) {
          if (data.time) {
            throttledAddTrade(data);
          }
        }
      } catch (e) {
        console.error('Error parsing websocket message', e);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setWsError('WebSocket connection error.');
      setIsWsLoading(false);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      ws.close();
      throttledSetTrades.cancel();
      throttledAddTrade.cancel();
    };
  }, [tradeDrawerOpen, tradeFilter, throttledSetTrades, throttledAddTrade]);

  // Filter and sort trades
  const filteredTrades = useMemo(() => {
    if (!trades) return [];
    return [...trades].sort((a, b) => b.time - a.time);
  }, [trades]);

  return (
    <>
      <TopWrapper darkMode={darkMode} backgroundColor={themeColors.backgroundColor}>
        <Container>
          <ContentWrapper>
            {isMobile ? (
              <MobileContainer>
                {/* Show 3 key metrics simultaneously */}
                {[
                  { label: 'Tokens', value: metricsLoaded ? abbreviateNumber(metrics.global?.total || 0) : '...', color: '#FF6B6B' },
                  { label: 'Trades', value: metricsLoaded ? abbreviateNumber(metrics.H24?.transactions24H || 0) : '...', color: '#74CAFF' },
                  { label: 'Vol', value: metricsLoaded ? `${currencySymbols[activeFiatCurrency]}${abbreviateNumber(
                    metrics?.H24?.tradedXRP24H && metrics[activeFiatCurrency]
                      ? new Decimal(metrics.H24.tradedXRP24H || 0)
                          .div(new Decimal(metrics[activeFiatCurrency] || 1))
                          .toNumber()
                      : 0
                  )}` : '...', color: '#10b981' }
                ].map((metric, index) => (
                  <MobileMetricCard
                    key={metric.label}
                    color={metric.color}
                    isFirst={index === 0}
                    borderColor={darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                  >
                    <MetricContent>
                      <MetricBadge textColor={themeColors.textSecondary}>
                        {t(metric.label)}
                      </MetricBadge>
                      {metricsLoaded ? (
                        <MetricNumber color={metric.color} title={metric.value}>
                          {metric.value}
                        </MetricNumber>
                      ) : (
                        <SkeletonLoader style={{ width: '32px', height: '10px', borderRadius: '2px' }} />
                      )}
                    </MetricContent>
                  </MobileMetricCard>
                ))}
                
                <LiveButton
                  onClick={(e) => {
                    e.preventDefault();
                    handleTradeDrawerOpen();
                  }}
                  primaryColor={primaryColor}
                  aria-label="Open live trades"
                >
                  <PulsatingCircle primaryColor={primaryColor} />
                  LIVE
                </LiveButton>
              </MobileContainer>
            ) : (
              <Stack direction="row" spacing={0.5} alignItems="center" flex={1}>
                <MetricContainer>
                  <MetricLabel textSecondary={themeColors.textSecondary}>{t('Addresses')}</MetricLabel>
                  {metricsLoaded ? (
                    <MetricValue color="#54D62C">
                      {abbreviateNumber(metrics.global?.totalAddresses || 0)}
                    </MetricValue>
                  ) : (
                    <SkeletonLoader style={{ width: '60px', height: '20px' }} />
                  )}
                </MetricContainer>

                <MetricContainer>
                  <MetricLabel textSecondary={themeColors.textSecondary}>{t('Tokens')}</MetricLabel>
                  {metricsLoaded ? (
                    <MetricValue color="#FF6B6B">
                      {abbreviateNumber(metrics.global?.total || 0)}
                    </MetricValue>
                  ) : (
                    <SkeletonLoader style={{ width: '60px', height: '20px' }} />
                  )}
                </MetricContainer>

                <MetricContainer>
                  <MetricLabel textSecondary={themeColors.textSecondary}>{t('Offers')}</MetricLabel>
                  {metricsLoaded ? (
                    <MetricValue color="#FFC107">
                      {abbreviateNumber(metrics.global?.totalOffers || 0)}
                    </MetricValue>
                  ) : (
                    <SkeletonLoader style={{ width: '60px', height: '20px' }} />
                  )}
                </MetricContainer>

                <MetricContainer>
                  <MetricLabel textSecondary={themeColors.textSecondary}>{t('Trustlines')}</MetricLabel>
                  {metricsLoaded ? (
                    <MetricValue color="#FFA48D">
                      {abbreviateNumber(metrics.global?.totalTrustLines || 0)}
                    </MetricValue>
                  ) : (
                    <SkeletonLoader style={{ width: '60px', height: '20px' }} />
                  )}
                </MetricContainer>

                <H24Style primaryColor={primaryColor} title="Statistics from the past 24 hours">
                  <Typography
                    variant="body2"
                    color="#ffffff"
                    style={{
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      lineHeight: 1
                    }}
                  >
                    24h
                  </Typography>
                </H24Style>

                <MetricContainer>
                  <MetricLabel textSecondary={themeColors.textSecondary}>{t('Trades')}</MetricLabel>
                  {metricsLoaded ? (
                    <MetricValue color="#74CAFF">
                      {abbreviateNumber(metrics.H24?.transactions24H || 0)}
                    </MetricValue>
                  ) : (
                    <SkeletonLoader style={{ width: '60px', height: '20px' }} />
                  )}
                </MetricContainer>

                <MetricContainer>
                  <MetricLabel textSecondary={themeColors.textSecondary}>{t('Vol')}</MetricLabel>
                  {metricsLoaded ? (
                    <MetricValue color="#ef4444">
                      {currencySymbols[activeFiatCurrency]}
                      {abbreviateNumber(
                        metrics?.H24?.tradedXRP24H && metrics[activeFiatCurrency]
                          ? new Decimal(metrics.H24.tradedXRP24H || 0)
                              .div(new Decimal(metrics[activeFiatCurrency] || 1))
                              .toNumber()
                          : 0
                      )}
                    </MetricValue>
                  ) : (
                    <SkeletonLoader style={{ width: '80px', height: '20px' }} />
                  )}
                </MetricContainer>

                <MetricContainer>
                  <MetricLabel textSecondary={themeColors.textSecondary}>{t('Tokens Traded')}</MetricLabel>
                  {metricsLoaded ? (
                    <MetricValue color="#3366FF">
                      {abbreviateNumber(metrics.H24?.tradedTokens24H || 0)}
                    </MetricValue>
                  ) : (
                    <SkeletonLoader style={{ width: '60px', height: '20px' }} />
                  )}
                </MetricContainer>

                <MetricContainer>
                  <MetricLabel textSecondary={themeColors.textSecondary}>{t('Active Addresses')}</MetricLabel>
                  {metricsLoaded ? (
                    <MetricValue color="#54D62C">
                      {abbreviateNumber(metrics.H24?.activeAddresses24H || 0)}
                    </MetricValue>
                  ) : (
                    <SkeletonLoader style={{ width: '60px', height: '20px' }} />
                  )}
                </MetricContainer>

                <MetricContainer>
                  <MetricLabel textSecondary={themeColors.textSecondary}>{t('Unique Traders')}</MetricLabel>
                  {metricsLoaded ? (
                    <MetricValue color="#2196F3">
                      {abbreviateNumber(metrics?.H24?.uniqueTraders24H || 0)}
                    </MetricValue>
                  ) : (
                    <SkeletonLoader style={{ width: '60px', height: '20px' }} />
                  )}
                </MetricContainer>

                <MetricContainer>
                  <MetricLabel textSecondary={themeColors.textSecondary}>{t('Total TVL')}</MetricLabel>
                  {metricsLoaded ? (
                    <MetricValue color="#8E44AD">
                      {currencySymbols[activeFiatCurrency]}
                      {abbreviateNumber(
                        metrics?.H24?.totalTVL && metrics[activeFiatCurrency]
                          ? new Decimal(metrics.H24.totalTVL || 0)
                              .div(new Decimal(metrics[activeFiatCurrency] || 1))
                              .toNumber()
                          : 0
                      )}
                    </MetricValue>
                  ) : (
                    <SkeletonLoader style={{ width: '80px', height: '20px' }} />
                  )}
                </MetricContainer>
              </Stack>
            )}
            {!isMobile && (
              <Box display="flex" alignItems="center" gap={0.25} style={{ paddingLeft: '6px' }}>
                <CurrencySwitcher />
                <ThemeSwitcher />
                <APILabel
                  onClick={(e) => {
                    e.preventDefault();
                    handleTradeDrawerOpen();
                  }}
                  aria-label="Open live trades"
                  type="button"
                  textColor={themeColors.textPrimary}
                  primaryColor={primaryColor}
                >
                  <PulsatingCircle primaryColor={primaryColor} />
                  <Typography variant="caption" style={{ fontWeight: 600, fontSize: '0.65rem', fontFamily: 'Inter, sans-serif' }}>
                    Live Trades
                  </Typography>
                </APILabel>
                <APILabel
                  as="a"
                  href="/api-docs"
                  style={{ marginLeft: '2px' }}
                  aria-label="API documentation"
                  textColor={themeColors.textPrimary}
                  primaryColor={primaryColor}
                >
                  <Typography variant="caption" style={{ fontWeight: 600, fontSize: '0.65rem', fontFamily: 'Inter, sans-serif' }}>
                    API
                  </Typography>
                </APILabel>
              </Box>
            )}
          </ContentWrapper>
        </Container>
      </TopWrapper>

      <DrawerOverlay open={tradeDrawerOpen} onClick={handleTradeDrawerClose} />
      <Drawer 
        open={tradeDrawerOpen} 
        backgroundColor={themeColors.backgroundColor} 
        isMobile={isMobile}
        isSmallMobile={isSmallMobile}
      >
        <DrawerHeader darkMode={darkMode} paperBackground={themeColors.backgroundColor}>
          <Box display="flex" alignItems="center" gap={0.5}>
            <Typography variant="h6" style={{ fontWeight: 600, fontSize: '0.95rem' }}>
              Global Trades
            </Typography>
            <PulsatingCircle primaryColor={primaryColor} />
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Box style={{ position: 'relative' }}>
              <SelectButton
                onClick={() => setFilterDropdownOpen(!filterDropdownOpen)}
                darkMode={darkMode}
                primaryColor={primaryColor}
                paperBackground={themeColors.backgroundColor}
                textPrimary={themeColors.textPrimary}
                aria-label="Filter trades by size"
                aria-expanded={filterDropdownOpen}
                aria-haspopup="listbox"
              >
                {(() => {
                  const FilterIconComponent = FILTER_OPTIONS.find(opt => opt.value === tradeFilter)?.IconComponent || WaterIcon;
                  return <FilterIconComponent sx={{ width: 16, height: 16 }} />;
                })()}
                <span>{FILTER_OPTIONS.find(opt => opt.value === tradeFilter)?.label || 'All Trades'}</span>
              </SelectButton>
              {filterDropdownOpen && (
                <SelectDropdown
                  darkMode={darkMode}
                  paperBackground={themeColors.backgroundColor}
                >
                  {FILTER_OPTIONS.map((option) => (
                    <SelectOption
                      key={option.value}
                      className={option.value === tradeFilter ? 'selected' : ''}
                      onClick={() => {
                        handleFilterChange({ target: { value: option.value } });
                        setFilterDropdownOpen(false);
                      }}
                      darkMode={darkMode}
                      primaryColor={primaryColor}
                      textPrimary={themeColors.textPrimary}
                    >
                      <option.IconComponent sx={{ width: 16, height: 16 }} />
                      <span>{option.label}</span>
                    </SelectOption>
                  ))}
                </SelectDropdown>
              )}
            </Box>
            <IconButton 
              onClick={handleTradeDrawerClose} 
              darkMode={darkMode} 
              textSecondary={themeColors.textSecondary} 
              textPrimary={themeColors.textPrimary}
              aria-label="Close trade drawer"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DrawerHeader>

        {wsError ? (
          <Box p={3} textAlign="center">
            <Typography color="#ef4444" variant="h6" style={{ marginBottom: '8px', fontWeight: 600 }}>
              Failed to load trades
            </Typography>
            <Typography variant="body2" color={themeColors.textSecondary}>
              {wsError}
            </Typography>
          </Box>
        ) : isWsLoading ? (
          <Box p={3}>
            <Box display="flex" justifyContent="center" style={{ marginBottom: '16px' }}>
              <CircularProgress size={40} darkMode={darkMode} primaryColor={primaryColor} />
            </Box>
            <Typography variant="body2" color={themeColors.textSecondary} textAlign="center">
              Connecting to live trades...
            </Typography>
            <Box style={{ marginTop: '16px' }}>
              {[...Array(5)].map((_, i) => (
                <Box key={i} style={{ marginBottom: '8px' }}>
                  <SkeletonLoader style={{ height: '60px', borderRadius: '8px' }} />
                </Box>
              ))}
            </Box>
          </Box>
        ) : (
          <TradeList darkMode={darkMode} primaryColor={primaryColor} backgroundColor={themeColors.backgroundColor}>
            {filteredTrades.map((trade, index) => {
              const tokenCurrency = trade.paid?.currency === 'XRP' ? trade.got : trade.paid;
              const tokenPath = tokenCurrency?.issuer && tokenCurrency?.currency 
                ? `/token/${tokenCurrency.issuer}-${tokenCurrency.currency}` 
                : '#';
              const txPath = trade.hash ? `/tx/${trade.hash}` : '#';
              
              const xrpAmount = getXRPAmount(trade);
              const isBuy = trade.paid?.currency === 'XRP';
              
              let opacity = 0.05;
              if (xrpAmount > 0) {
                if (xrpAmount < 10) opacity = 0.05;
                else if (xrpAmount < 50) opacity = 0.07;
                else if (xrpAmount < 100) opacity = 0.09;
                else if (xrpAmount < 500) opacity = 0.11;
                else if (xrpAmount < 1000) opacity = 0.13;
                else if (xrpAmount < 5000) opacity = 0.15;
                else opacity = 0.18;
              }
              
              return (
                <TradeItem
                  key={`${trade.time}-${trade.maker}-${trade.taker}-${trade.paid?.value}-${trade.got?.value}-${index}`}
                  href={tokenPath}
                  darkMode={darkMode}
                  isBuy={isBuy}
                  opacity={opacity}
                >
                  <Box display="flex" alignItems="center" width="100%" gap={1}>
                    <Box minWidth={55} textAlign="left">
                      <Typography variant="caption" color={themeColors.textSecondary} style={{ fontSize: '0.65rem', opacity: 0.8 }}>
                        {formatRelativeTime(trade.time)}
                      </Typography>
                    </Box>

                    <Box minWidth={35} textAlign="center">
                      <Typography 
                        variant="caption" 
                        style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: 700,
                          color: isBuy ? '#10b981' : '#ef4444'
                        }}
                      >
                        {isBuy ? 'BUY' : 'SELL'}
                      </Typography>
                    </Box>

                    <Box flex={1} display="flex" alignItems="center" gap={0.75}>
                      <Box display="flex" alignItems="center" gap={0.5} flex={1}>
                        <TokenImage
                          src={getTokenImageUrl(trade.paid.issuer, trade.paid.currency)}
                          alt={decodeCurrency(trade.paid.currency)}
                          loading="lazy"
                          darkMode={darkMode}
                        />
                        <Box minWidth={0}>
                          <Typography variant="body2" style={{ fontWeight: 600, fontSize: '0.75rem', lineHeight: 1.1 }}>
                            {formatTradeValue(trade.paid.value)} {decodeCurrency(trade.paid.currency)}
                          </Typography>
                        </Box>
                      </Box>

                      <SwapHorizIcon style={{ color: themeColors.textSecondary, opacity: 0.4, fontSize: '0.8rem' }} />

                      <Box display="flex" alignItems="center" gap={0.5} flex={1}>
                        <Box minWidth={0}>
                          <Typography variant="body2" style={{ fontWeight: 600, fontSize: '0.75rem', lineHeight: 1.1 }}>
                            {formatTradeValue(trade.got.value)} {decodeCurrency(trade.got.currency)}
                          </Typography>
                        </Box>
                        <TokenImage
                          src={getTokenImageUrl(trade.got.issuer, trade.got.currency)}
                          alt={decodeCurrency(trade.got.currency)}
                          loading="lazy"
                          darkMode={darkMode}
                        />
                      </Box>
                    </Box>

                    <Box display="flex" alignItems="center" gap={0.25} minWidth={35}>
                      {(() => {
                        const TradeIconComponent = getTradeSizeIconComponent(getXRPAmount(trade));
                        return <TradeIconComponent sx={{ width: 16, height: 16, color: themeColors.textSecondary }} />;
                      })()}
                      {trade.hash && (
                        <a
                          href={txPath}
                          style={{
                            width: '14px',
                            height: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: themeColors.textSecondary
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <LinkIcon />
                        </a>
                      )}
                    </Box>
                  </Box>
                </TradeItem>
              );
            })}
          </TradeList>
        )}
      </Drawer>
    </>
  );
};

export default Topbar;