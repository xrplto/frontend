import React, { useState, useContext, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import CollectionList from './CollectionList';
import { fVolume, fIntNumber } from 'src/utils/formatters';
import { AppContext } from 'src/AppContext';
import { X, Search, Copy, Check, Code2 } from 'lucide-react';

const NFT_API_ENDPOINTS = [
  { label: 'Collections', url: 'https://api.xrpl.to/api/nft/collections', params: 'tag, start, limit, sortBy, sortType' },
  { label: 'Collection Detail', url: 'https://api.xrpl.to/api/nft/collection/{taxon}', params: 'issuer' },
  { label: 'NFT Detail', url: 'https://api.xrpl.to/api/nft/{nftokenid}' },
  { label: 'NFT Sales', url: 'https://api.xrpl.to/api/nft/sales/{nftokenid}', params: 'start, limit' },
  { label: 'Categories', url: 'https://api.xrpl.to/api/nft/tags' }
];
// Constants
const CollectionListType = {
  ALL: 'ALL',
  FEATURED: 'FEATURED',
  TRENDING: 'TRENDING'
};

// Styled Components - matching Summary.js
const Container = styled.div`
  position: relative;
  z-index: 2;
  margin-bottom: 12px;
  width: 100%;
  max-width: 100%;
  background: transparent;
  overflow: visible;

  @media (max-width: 600px) {
    margin: 8px 0;
    padding: 0;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr) 1.5fr;
  gap: 10px;
  width: 100%;

  @media (max-width: 1400px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 900px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 600px) {
    display: flex;
    overflow-x: auto;
    gap: 8px;
    padding-bottom: 4px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const MetricBox = styled.div`
  padding: 12px 14px;
  height: 82px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  border-radius: 12px;
  background: transparent;
  border: 1.5px solid ${(props) => props.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'};
  transition: all 0.15s ease;

  &:hover {
    border-color: ${(props) => props.isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'};
    background: ${(props) => props.isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)'};
  }

  @media (max-width: 600px) {
    padding: 10px 12px;
    height: 68px;
    flex: 0 0 auto;
    min-width: 95px;
    border-radius: 12px;
  }
`;

const MetricTitle = styled.span`
  font-size: 0.68rem;
  font-weight: 400;
  color: ${(props) => props.isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(33, 43, 54, 0.5)'};
  letter-spacing: 0.02em;

  @media (max-width: 600px) {
    font-size: 0.58rem;
  }
`;

const MetricValue = styled.span`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${(props) => props.isDark ? '#FFFFFF' : '#212B36'};
  line-height: 1;
  letter-spacing: -0.02em;
  white-space: nowrap;

  @media (max-width: 600px) {
    font-size: 0.92rem;
  }
`;

const PercentageChange = styled.span`
  font-size: 0.68rem;
  color: ${(props) => props.isPositive ? '#10b981' : '#ef4444'};
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-weight: 500;
  letter-spacing: -0.01em;
  padding: 1px 4px;
  border-radius: 4px;
  background: ${(props) => props.isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'};

  @media (max-width: 600px) {
    font-size: 0.58rem;
    padding: 1px 3px;
  }
`;

const VolumePercentage = styled.span`
  font-size: 0.58rem;
  color: ${(props) => props.isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(33, 43, 54, 0.45)'};
  font-weight: 400;

  @media (max-width: 600px) {
    font-size: 0.5rem;
  }
`;

const ChartMetricBox = styled(MetricBox)`
  grid-column: span 1;
  overflow: visible;

  @media (max-width: 1400px) {
    grid-column: span 3;
  }

  @media (max-width: 900px) {
    grid-column: span 3;
  }

  @media (max-width: 600px) {
    display: none;
  }
`;

const MobileChartBox = styled(MetricBox)`
  display: none;

  @media (max-width: 600px) {
    display: flex;
    margin-top: 4px;
  }
`;

// Volume Chart Component
const VolumeChart = ({ data, isDark }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, data: null });

  const handleMouseMove = (event) => {
    if (!data || data.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;

    const chartData = data.slice(-30);
    if (chartData.length === 0) return;

    const width = rect.width;
    const pointWidth = width / Math.max(chartData.length - 1, 1);

    const closestIndex = Math.max(0, Math.min(Math.round(mouseX / pointWidth), chartData.length - 1));
    const dataPoint = chartData[closestIndex];

    setTooltip({ show: true, x: event.clientX, y: event.clientY, data: dataPoint });
  };

  const handleMouseLeave = () => {
    setTooltip({ show: false, x: 0, y: 0, data: null });
  };

  useEffect(() => {
    if (!data || data.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;

    const draw = () => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const chartData = data.slice(-30);
      const chartValues = chartData.map((d) => d.volume || 0);
      if (chartValues.length === 0) return;

      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      const width = rect.width;
      const height = rect.height;
      const padding = 4;

      ctx.clearRect(0, 0, width, height);

      if (chartValues.length === 1) {
        chartValues.push(chartValues[0]);
        chartData.push(chartData[0]);
      }

      if (chartValues.length < 2) return;

      const minValue = Math.min(...chartValues);
      const maxValue = Math.max(...chartValues);
      const range = maxValue - minValue;

      const points = chartValues.map((value, index) => {
        const x = padding + (index / (chartValues.length - 1)) * (width - padding * 2);
        const y = range === 0 ? height / 2 : padding + (height - padding * 2) - ((value - minValue) / range) * (height - padding * 2);
        return { x, y };
      });

      // Draw gradient area and line
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0)');

      ctx.beginPath();
      ctx.moveTo(points[0].x, height);
      points.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.lineTo(points[points.length - 1].x, height);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.forEach((p) => ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    };

    const rafId = requestAnimationFrame(draw);
    window.addEventListener('resize', draw);

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => requestAnimationFrame(draw));
      resizeObserver.observe(canvas);
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', draw);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [data]);

  const TooltipPortal = () => {
    if (!tooltip.show || !tooltip.data) return null;

    return createPortal(
      <div
        style={{
          position: 'fixed',
          left: tooltip.x + 15,
          top: tooltip.y - 80,
          background: isDark ? 'rgba(18, 18, 18, 0.98)' : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(16px)',
          color: isDark ? '#fff' : '#000',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: '10px',
          padding: '10px 12px',
          boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 8px 32px rgba(0, 0, 0, 0.12)',
          minWidth: '160px',
          zIndex: 999999,
          pointerEvents: 'none',
          fontSize: '11px'
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '8px', paddingBottom: '6px', borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)' }}>
          {format(new Date(tooltip.data.date), 'MMM dd, yyyy')}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
          <span style={{ opacity: 0.6 }}>Volume</span>
          <span style={{ fontWeight: 500 }}>✕{formatNumberWithDecimals(tooltip.data.volume || 0)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
          <span style={{ opacity: 0.6 }}>Sales</span>
          <span style={{ fontWeight: 500 }}>{tooltip.data.sales || 0}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
          <span style={{ opacity: 0.6 }}>Avg Price</span>
          <span style={{ fontWeight: 500 }}>✕{(tooltip.data.avgPrice || 0).toFixed(2)}</span>
        </div>
        {tooltip.data.uniqueBuyers && (
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
            <span style={{ opacity: 0.6 }}>Traders</span>
            <span style={{ fontWeight: 500 }}>{tooltip.data.uniqueBuyers} / {tooltip.data.uniqueSellers}</span>
          </div>
        )}
      </div>,
      document.body
    );
  };

  return (
    <>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '42px', marginTop: '-2px', position: 'relative' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block', cursor: 'pointer' }}
        />
      </div>
      <TooltipPortal />
    </>
  );
};

// Collection Creation Chart Component (similar to TokenChart in Summary.js)
const CollectionCreationChart = ({ data, isDark }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, data: null });

  const handleMouseMove = (event) => {
    if (!data || data.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;

    const chartData = data.slice(-30);
    if (chartData.length === 0) return;

    const width = rect.width;
    const pointWidth = width / Math.max(chartData.length - 1, 1);

    const closestIndex = Math.max(0, Math.min(Math.round(mouseX / pointWidth), chartData.length - 1));
    const dataPoint = chartData[closestIndex];

    setTooltip({ show: true, x: event.clientX, y: event.clientY, data: dataPoint });
  };

  const handleMouseLeave = () => {
    setTooltip({ show: false, x: 0, y: 0, data: null });
  };

  useEffect(() => {
    if (!data || data.length === 0 || !canvasRef.current) return;

    const canvas = canvasRef.current;

    const draw = () => {
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const chartData = data.slice(-30);
      // Support both collectionCreation (totalCollections) and daily (mints) formats
      const chartValues = chartData.map((d) => d.totalCollections ?? d.mints ?? 0);
      if (chartValues.length === 0) return;

      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

      const width = rect.width;
      const height = rect.height;
      const padding = 4;

      ctx.clearRect(0, 0, width, height);

      if (chartValues.length === 1) {
        chartValues.push(chartValues[0]);
        chartData.push(chartData[0]);
      }

      if (chartValues.length < 2) return;

      const minValue = Math.min(...chartValues);
      const maxValue = Math.max(...chartValues);
      const range = maxValue - minValue;

      const points = chartValues.map((value, index) => {
        const x = padding + (index / (chartValues.length - 1)) * (width - padding * 2);
        const y = range === 0 ? height / 2 : padding + (height - padding * 2) - ((value - minValue) / range) * (height - padding * 2);
        return { x, y };
      });

      // Calculate median volume for threshold coloring
      const volumes = chartData.map(d => d.volume || 0);
      const sortedVol = [...volumes].sort((a, b) => a - b);
      const medianVol = sortedVol[Math.floor(sortedVol.length / 2)] || 1000;

      // Draw segments - green for high activity days, blue for normal
      for (let i = 0; i < points.length - 1; i++) {
        const dayVolume = volumes[i];
        const isHighActivity = dayVolume > medianVol * 1.5;
        const segmentColor = isHighActivity ? '#10b981' : '#3b82f6';

        const gradient = ctx.createLinearGradient(0, points[i].y, 0, height);
        gradient.addColorStop(0, segmentColor + '40');
        gradient.addColorStop(1, segmentColor + '00');

        ctx.beginPath();
        ctx.moveTo(points[i].x, height);
        ctx.lineTo(points[i].x, points[i].y);
        ctx.lineTo(points[i + 1].x, points[i + 1].y);
        ctx.lineTo(points[i + 1].x, height);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(points[i].x, points[i].y);
        ctx.lineTo(points[i + 1].x, points[i + 1].y);
        ctx.strokeStyle = segmentColor;
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
      }
    };

    const rafId = requestAnimationFrame(draw);
    window.addEventListener('resize', draw);

    let resizeObserver;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => requestAnimationFrame(draw));
      resizeObserver.observe(canvas);
    }

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', draw);
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [data]);

  const TooltipPortal = () => {
    if (!tooltip.show || !tooltip.data) return null;

    const d = tooltip.data;
    // Support both collectionCreation and daily formats
    const collections = d.collectionsInvolved || d.topCollections || [];
    const mintCount = d.totalCollections ?? d.mints ?? 0;
    const itemCount = d.totalItems ?? d.sales ?? 0;

    return createPortal(
      <div
        style={{
          position: 'fixed',
          left: tooltip.x + 15,
          top: tooltip.y - 100,
          background: isDark ? 'rgba(18, 18, 18, 0.98)' : 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(16px)',
          color: isDark ? '#fff' : '#000',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: '10px',
          padding: '10px 12px',
          boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 8px 32px rgba(0, 0, 0, 0.12)',
          minWidth: '180px',
          zIndex: 999999,
          pointerEvents: 'none',
          fontSize: '11px'
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 500, marginBottom: '8px', paddingBottom: '6px', borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)' }}>
          {format(new Date(d.date), 'MMM dd, yyyy')}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
          <span style={{ opacity: 0.6 }}>New Collections</span>
          <span style={{ fontWeight: 500 }}>{formatNumberWithDecimals(mintCount)}</span>
        </div>
        {d.volume !== undefined && (
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
            <span style={{ opacity: 0.6 }}>Volume</span>
            <span style={{ fontWeight: 500 }}>✕{formatNumberWithDecimals(d.volume || 0)}</span>
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
          <span style={{ opacity: 0.6 }}>{d.totalItems !== undefined ? 'Items' : 'Sales'}</span>
          <span style={{ fontWeight: 500 }}>{itemCount}</span>
        </div>
        {d.uniqueCollections !== undefined && (
          <div style={{ display: 'flex', justifyContent: 'space-between', margin: '3px 0' }}>
            <span style={{ opacity: 0.6 }}>Collections</span>
            <span style={{ fontWeight: 500 }}>{d.uniqueCollections}</span>
          </div>
        )}
        {collections.length > 0 && (
          <>
            <div style={{ borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.06)', margin: '6px 0 4px', paddingTop: '6px' }}>
              <span style={{ fontSize: '10px', fontWeight: 500, opacity: 0.5, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{d.collectionsInvolved ? 'New Collections' : 'Top Collections'}</span>
            </div>
            {collections.slice(0, 3).map((col, i) => (
              <div key={`tooltip-col-${i}-${col.cid || col.slug}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '3px 0', fontSize: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <div style={{ width: '14px', height: '14px', minWidth: '14px', minHeight: '14px', borderRadius: '3px', overflow: 'hidden', background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)' }}>
                    <img
                      src={`https://s1.xrpl.to/collection/${col.logo || col.logoImage}`}
                      alt={col.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.parentElement.style.display = 'none'; }}
                    />
                  </div>
                  <span style={{ opacity: 0.8, maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{col.name}</span>
                </div>
                <span style={{ fontWeight: 500 }}>{col.volume ? `✕${formatNumberWithDecimals(col.volume)}` : `${col.items || 0} items`}</span>
              </div>
            ))}
          </>
        )}
      </div>,
      document.body
    );
  };

  return (
    <>
      <div
        ref={containerRef}
        style={{ width: '100%', height: '42px', marginTop: '-2px', position: 'relative' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%', display: 'block', cursor: 'pointer' }}
        />
      </div>
      <TooltipPortal />
    </>
  );
};

// Tags Bar Components
const TagsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-radius: 12px;
  border: 1.5px solid ${(props) => (props.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)')};
  background: transparent;
  padding: 10px 14px;
  position: relative;

  @media (max-width: 600px) {
    padding: 8px 10px;
    gap: 8px;
  }
`;

const TagsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;

  @media (max-width: 600px) {
    gap: 6px;
  }
`;

const TagsScrollArea = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  flex: 1;
  min-width: 0;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding-right: 4px;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 600px) {
    gap: 6px;
  }
`;

const AllButtonWrapper = styled.div`
  flex-shrink: 0;
  margin-left: 4px;
`;

const TagChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 10px;
  border: 1px solid ${(props) => props.selected ? 'rgba(59, 130, 246, 0.3)' : (props.isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)')};
  border-radius: 6px;
  background: ${(props) => props.selected
    ? 'rgba(59, 130, 246, 0.1)'
    : (props.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)')};
  color: ${(props) => props.selected ? '#3b82f6' : (props.isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(33, 43, 54, 0.7)')};
  font-size: 0.7rem;
  font-weight: ${(props) => props.selected ? 500 : 400};
  cursor: pointer;
  white-space: nowrap;
  height: 26px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  z-index: 1;
  transition: color 0.3s ease, border-color 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 50%, #3b82f6 100%);
    transform: translateX(-100%);
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: -1;
    border-radius: 6px;
  }

  &:hover {
    color: #fff;
    border-color: #3b82f6;
  }

  &:hover::before {
    transform: translateX(0);
  }

  @media (max-width: 600px) {
    font-size: 0.68rem;
    height: 26px;
    padding: 0 10px;
    gap: 3px;
  }
`;

const AllTagsButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
  border: none;
  border-radius: 16px;
  background: ${(props) => props.isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'};
  color: #3b82f6;
  font-size: 0.7rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  height: 26px;
  flex-shrink: 0;
  margin-left: auto;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(59, 130, 246, 0.2);
  }

  @media (max-width: 600px) {
    font-size: 0.68rem;
    height: 26px;
    padding: 0 10px;
    gap: 3px;
  }
`;

const Drawer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1300;
  display: ${props => props.open ? 'block' : 'none'};
`;

const DrawerBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
`;

const DrawerPaper = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 70vh;
  background: ${props => props.isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.98)'};
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  border-top: 1px solid ${props => props.isDark ? 'rgba(59,130,246,0.2)' : 'rgba(191,219,254,1)'};
  box-shadow: ${props => props.isDark ? '0 -25px 50px -12px rgba(59,130,246,0.1)' : '0 -25px 50px -12px rgba(191,219,254,0.5)'};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 1301;
`;

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
`;

const DrawerTitle = styled.h2`
  font-weight: 500;
  font-size: 15px;
  margin: 0;
  color: ${props => props.isDark ? '#fff' : '#212B36'};
`;

const DrawerClose = styled.button`
  width: 32px;
  height: 32px;
  border: 1.5px solid ${props => props.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'};
  transition: border-color 0.15s, color 0.15s;

  &:hover {
    border-color: ${props => props.isDark ? 'rgba(66,133,244,0.5)' : 'rgba(66,133,244,0.5)'};
    color: #4285f4;
  }
`;

const SearchBox = styled.div`
  padding: 12px 16px;
`;

const SearchInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  height: 40px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1.5px solid ${props => props.isDark ? 'rgba(59,130,246,0.08)' : 'rgba(0,0,0,0.08)'};
  background: ${props => props.isDark ? 'rgba(255,255,255,0.02)' : '#fff'};
  transition: border-color 0.2s ease;

  &:hover {
    border-color: ${props => props.isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.3)'};
  }

  &:focus-within {
    border-color: ${props => props.isDark ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.5)'};
  }
`;

const SearchIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'};
  flex-shrink: 0;
`;

const SearchInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 14px;
  color: ${props => props.isDark ? '#fff' : '#212B36'};
  font-family: inherit;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: ${props => props.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(33, 43, 54, 0.4)'};
  }
`;

const TagsGrid = styled.div`
  padding: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  flex: 1;
  overflow-y: auto;
  align-content: flex-start;
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(128, 128, 128, 0.2); border-radius: 3px; }
`;

const TagButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  border: 1px solid ${props => props.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};
  border-radius: 8px;
  background: transparent;
  color: ${props => props.isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(33, 43, 54, 0.7)'};
  font-size: 0.75rem;
  font-weight: 400;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  height: 28px;
  flex-shrink: 0;
  transition: border-color 0.2s ease, background 0.2s ease;

  &:hover {
    background: rgba(59, 130, 246, 0.08);
    border-color: rgba(59, 130, 246, 0.3);
    color: #3b82f6;
  }

  @media (max-width: 600px) {
    height: 32px;
    padding: 4px 14px;
    font-size: 0.8rem;
  }
`;

const EmptyState = styled.div`
  width: 100%;
  text-align: center;
  padding: 32px 0;
  color: ${props => props.isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(33, 43, 54, 0.5)'};
  font-size: 14px;
`;

// API Modal Component
const NftApiModal = ({ open, onClose, isDark }) => {
  const [copiedIdx, setCopiedIdx] = useState(null);
  if (!open) return null;
  const handleCopy = (url, idx) => {
    navigator.clipboard.writeText(url);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };
  return (
    <Drawer open={open}>
      <DrawerBackdrop onClick={onClose} />
      <DrawerPaper isDark={isDark} style={{ maxHeight: '60vh' }}>
        <DrawerHeader>
          <div className="flex items-center gap-4 flex-1">
            <span style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', whiteSpace: 'nowrap' }}>
              NFT API Endpoints
            </span>
            <div className="flex-1 h-[14px]" style={{ backgroundImage: isDark ? 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)' : 'radial-gradient(circle, rgba(0,0,0,0.15) 1px, transparent 1px)', backgroundSize: '8px 5px' }} />
          </div>
          <DrawerClose isDark={isDark} onClick={onClose}><X size={18} /></DrawerClose>
        </DrawerHeader>
        <div style={{ padding: '0 16px 16px', overflowY: 'auto' }}>
          {NFT_API_ENDPOINTS.map((ep, idx) => (
            <div key={ep.label} style={{ marginBottom: '12px', padding: '10px 12px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: '8px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: 500, fontSize: '13px', color: isDark ? '#fff' : '#000' }}>{ep.label}</span>
                <button onClick={() => handleCopy(ep.url, idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: copiedIdx === idx ? '#10b981' : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)') }}>
                  {copiedIdx === idx ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <code style={{ fontSize: '11px', color: isDark ? '#3f96fe' : '#0891b2', wordBreak: 'break-all' }}>{ep.url}</code>
              {ep.params && <div style={{ marginTop: '4px', fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>Params: {ep.params}</div>}
            </div>
          ))}
          <a href="https://xrpl.to/docs" target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', marginTop: '8px', fontSize: '12px', color: isDark ? '#3f96fe' : '#0891b2' }}>
            Full API Documentation →
          </a>
        </div>
      </DrawerPaper>
    </Drawer>
  );
};

const normalizeTag = (tag) => {
  if (!tag) return '';
  return tag.split(' ').join('-').replace(/&/g, 'and').toLowerCase().replace(/[^a-zA-Z0-9-]/g, '');
};

const formatNumberWithDecimals = (num) => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(0)}K`;
  return Math.round(num).toLocaleString();
};

function Collections({ initialCollections, initialTotal, initialGlobalMetrics, collectionCreation, tags }) {
  const router = useRouter();
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [globalMetrics, setGlobalMetrics] = useState(initialGlobalMetrics);
  const [tagsDrawerOpen, setTagsDrawerOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState(router.query.tag || null);
  const [copied, setCopied] = useState(false);
  const [apiModalOpen, setApiModalOpen] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600;

  // Sync selectedTag with URL query
  useEffect(() => {
    const urlTag = router.query.tag || null;
    if (urlTag !== selectedTag) {
      setSelectedTag(urlTag);
    }
  }, [router.query.tag]);

  const visibleTagCount = isMobile ? 5 : 10;

  // Helper to get tag name from tag object or string
  const getTagName = (t) => (typeof t === 'object' ? t.tag : t);

  const copyTags = () => {
    if (!tags) return;
    const text = tags.map(t => `${getTagName(t)}: ${t.count || 0}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTagClick = (tag) => {
    const newTag = selectedTag === tag ? null : tag;
    setSelectedTag(newTag);
    setTagsDrawerOpen(false);
    // Update URL without full page reload
    router.push(newTag ? `/nfts?tag=${encodeURIComponent(newTag)}` : '/nfts', undefined, { shallow: true });
  };

  const filteredTags = useMemo(() => {
    if (!tags) return [];
    if (!tagSearch.trim()) return tags;
    const term = tagSearch.toLowerCase();
    return tags.filter((t) => (t.tag || t).toLowerCase().includes(term));
  }, [tags, tagSearch]);

  return (
    <div
      style={{
        flex: 1,
        paddingTop: isMobile ? '8px' : '16px',
        paddingBottom: isMobile ? '16px' : '32px',
        backgroundColor: 'transparent',
        minHeight: '100vh',
        position: 'relative'
      }}
    >
      {/* API Modal */}
      <NftApiModal open={apiModalOpen} onClose={() => setApiModalOpen(false)} isDark={isDark} />

      {/* Tags Drawer */}
      {tagsDrawerOpen && (
        <Drawer open={tagsDrawerOpen}>
          <DrawerBackdrop onClick={() => setTagsDrawerOpen(false)} />
          <DrawerPaper isDark={isDark}>
            <DrawerHeader>
              <div className="flex items-center gap-4 flex-1">
                <span style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', whiteSpace: 'nowrap' }}>
                  Categories {tags?.length ? `(${tags.length})` : ''}
                </span>
                <div
                  className="flex-1 h-[14px]"
                  style={{
                    backgroundImage: isDark ? 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)' : 'radial-gradient(circle, rgba(0,0,0,0.15) 1px, transparent 1px)',
                    backgroundSize: '8px 5px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <DrawerClose isDark={isDark} onClick={copyTags} title="Copy all tags">
                  {copied ? <Check size={18} color="#10b981" /> : <Copy size={18} />}
                </DrawerClose>
                <DrawerClose isDark={isDark} onClick={() => setTagsDrawerOpen(false)}>
                  <X size={18} />
                </DrawerClose>
              </div>
            </DrawerHeader>
            <SearchBox isDark={isDark}>
              <SearchInputWrapper>
                <SearchIconWrapper isDark={isDark}><Search size={18} /></SearchIconWrapper>
                <SearchInput
                  type="search"
                  placeholder="Search categories..."
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  isDark={isDark}
                />
              </SearchInputWrapper>
            </SearchBox>
            <TagsGrid>
              {filteredTags.length > 0 ? (
                filteredTags.map((t) => {
                  const tagName = getTagName(t);
                  const count = typeof t === 'object' ? t.count : null;
                  return (
                    <TagButton
                      key={tagName}
                      isDark={isDark}
                      onClick={() => handleTagClick(tagName)}
                      style={selectedTag === tagName ? { borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', color: isDark ? '#fff' : '#000', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' } : {}}
                    >
                      {tagName}{count ? ` (${count})` : ''}
                    </TagButton>
                  );
                })
              ) : (
                <EmptyState isDark={isDark}>
                  {tagSearch ? 'No matching categories' : 'No categories available'}
                </EmptyState>
              )}
            </TagsGrid>
          </DrawerPaper>
        </Drawer>
      )}

      {/* Global Metrics Section */}
      <Container>
        {globalMetrics && (
          <div style={{ width: '100%' }}>
            <Grid>
              <MetricBox isDark={isDark}>
                <MetricTitle isDark={isDark}>24h Volume</MetricTitle>
                <MetricValue isDark={isDark}>
                  ✕{fVolume(globalMetrics.total24hVolume || 0)}
                </MetricValue>
                <PercentageChange isPositive={(globalMetrics.volumePct || 0) >= 0}>
                  {(globalMetrics.volumePct || 0) >= 0 ? '↑' : '↓'}
                  {Math.abs(globalMetrics.volumePct || 0).toFixed(1)}%
                </PercentageChange>
              </MetricBox>

              <MetricBox isDark={isDark}>
                <MetricTitle isDark={isDark}>24h Sales</MetricTitle>
                <MetricValue isDark={isDark}>
                  {formatNumberWithDecimals(globalMetrics.total24hSales || 0)}
                </MetricValue>
                <PercentageChange isPositive={(globalMetrics.salesPct || 0) >= 0}>
                  {(globalMetrics.salesPct || 0) >= 0 ? '↑' : '↓'}
                  {Math.abs(globalMetrics.salesPct || 0).toFixed(1)}%
                </PercentageChange>
              </MetricBox>

              <MetricBox isDark={isDark}>
                <MetricTitle isDark={isDark}>Collections</MetricTitle>
                <MetricValue isDark={isDark}>
                  {formatNumberWithDecimals(globalMetrics.totalCollections || 0)}
                </MetricValue>
                <VolumePercentage isDark={isDark}>
                  {formatNumberWithDecimals(globalMetrics.activeCollections24h || 0)} active | {formatNumberWithDecimals(globalMetrics.total24hMints || 0)} mints
                </VolumePercentage>
              </MetricBox>

              <MetricBox isDark={isDark}>
                <MetricTitle isDark={isDark}>24h Fees</MetricTitle>
                <MetricValue isDark={isDark}>
                  ✕{formatNumberWithDecimals((globalMetrics.total24hBrokerFees || 0) + (globalMetrics.total24hRoyalties || 0))}
                </MetricValue>
                <VolumePercentage isDark={isDark}>
                  ✕{formatNumberWithDecimals(globalMetrics.total24hRoyalties || 0)} royalties | ✕{formatNumberWithDecimals(globalMetrics.total24hBrokerFees || 0)} broker
                </VolumePercentage>
              </MetricBox>

              <MetricBox isDark={isDark} style={{ minWidth: isMobile ? '130px' : '160px' }}>
                <MetricTitle isDark={isDark}>Market</MetricTitle>
                {(() => {
                  const sentiment = globalMetrics.sentimentScore || 50;
                  const rsi = globalMetrics.marketRSI || 50;

                  const getSentimentColor = (v) => v >= 55 ? '#10b981' : v >= 45 ? '#fbbf24' : '#ef4444';
                  const getRsiColor = (v) => v >= 70 ? '#ef4444' : v <= 30 ? '#8b5cf6' : v >= 50 ? '#10b981' : '#fbbf24';

                  const sentColor = getSentimentColor(sentiment);
                  const rsiColor = getRsiColor(rsi);

                  return (
                    <div style={{ display: 'flex', gap: isMobile ? '16px' : '24px', alignItems: 'flex-end' }}>
                      {/* Sentiment gauge */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{ position: 'relative', width: '36px', height: '20px' }}>
                          <div style={{
                            position: 'absolute',
                            width: '36px',
                            height: '18px',
                            borderRadius: '18px 18px 0 0',
                            background: 'conic-gradient(from 180deg, #ef4444 0deg, #fbbf24 90deg, #10b981 180deg)',
                            opacity: 0.2
                          }} />
                          <div style={{
                            position: 'absolute',
                            bottom: '0',
                            left: '50%',
                            width: '2px',
                            height: '14px',
                            background: sentColor,
                            transformOrigin: 'bottom center',
                            transform: `translateX(-50%) rotate(${(sentiment - 50) * 1.8}deg)`,
                            borderRadius: '1px'
                          }} />
                          <div style={{
                            position: 'absolute',
                            bottom: '-2px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: sentColor
                          }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                          <span style={{ fontSize: '1rem', fontWeight: 600, color: sentColor, lineHeight: 1 }}>
                            {sentiment}
                          </span>
                          <span style={{ fontSize: '0.5rem', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                            Sentiment
                          </span>
                        </div>
                      </div>

                      {/* RSI gauge */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                        <div style={{ position: 'relative', width: '36px', height: '20px' }}>
                          <div style={{
                            position: 'absolute',
                            width: '36px',
                            height: '18px',
                            borderRadius: '18px 18px 0 0',
                            background: 'conic-gradient(from 180deg, #8b5cf6 0deg, #10b981 90deg, #ef4444 180deg)',
                            opacity: 0.2
                          }} />
                          <div style={{
                            position: 'absolute',
                            bottom: '0',
                            left: '50%',
                            width: '2px',
                            height: '14px',
                            background: rsiColor,
                            transformOrigin: 'bottom center',
                            transform: `translateX(-50%) rotate(${(rsi - 50) * 1.8}deg)`,
                            borderRadius: '1px'
                          }} />
                          <div style={{
                            position: 'absolute',
                            bottom: '-2px',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: rsiColor
                          }} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                          <span style={{ fontSize: '1rem', fontWeight: 600, color: rsiColor, lineHeight: 1 }}>
                            {rsi}
                          </span>
                          <span style={{ fontSize: '0.5rem', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                            RSI
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </MetricBox>

              <ChartMetricBox isDark={isDark}>
                {(() => {
                  // Use collectionCreation prop, fallback to daily data
                  const creationData = collectionCreation?.length ? collectionCreation : (globalMetrics.daily || []);
                  const chartData = creationData.slice(-30);
                  const todayData = chartData[chartData.length - 1] || {};
                  const yesterdayData = chartData[chartData.length - 2] || {};
                  // collectionCreation uses totalCollections, daily uses mints
                  const today = todayData.totalCollections ?? todayData.mints ?? 0;
                  const yesterday = yesterdayData.totalCollections ?? yesterdayData.mints ?? 0;
                  const isUp = today >= yesterday;
                  // collectionCreation uses collectionsInvolved, daily uses topCollections
                  const latestCollection = (todayData.collectionsInvolved || todayData.topCollections || [])[0];
                  return (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2px' }}>
                        <MetricTitle isDark={isDark}>New Collections</MetricTitle>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: isDark ? '#fff' : '#212B36' }}>
                            {formatNumberWithDecimals(today)}
                          </span>
                          <span style={{ fontSize: '0.5rem', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                            today
                          </span>
                          <span style={{ fontSize: '0.65rem', color: isUp ? '#10b981' : '#ef4444' }}>
                            {isUp ? '↑' : '↓'}
                          </span>
                          {latestCollection && (
                            <a href={`/nft/collection/${latestCollection.slug}`} style={{ fontSize: '0.55rem', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', borderLeft: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, paddingLeft: '6px' }}>
                              <span style={{ maxWidth: '55px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{latestCollection.name}</span>
                              <span style={{ color: '#10b981', fontWeight: 500 }}>✕{formatNumberWithDecimals(latestCollection.volume || latestCollection.items || 0)}</span>
                            </a>
                          )}
                        </div>
                      </div>
                      <CollectionCreationChart data={chartData} isDark={isDark} />
                    </>
                  );
                })()}
              </ChartMetricBox>
            </Grid>

            <MobileChartBox isDark={isDark}>
              {(() => {
                const creationData = collectionCreation?.length ? collectionCreation : (globalMetrics.daily || []);
                const chartData = creationData.slice(-30);
                const todayData = chartData[chartData.length - 1] || {};
                const yesterdayData = chartData[chartData.length - 2] || {};
                const today = todayData.totalCollections ?? todayData.mints ?? 0;
                const yesterday = yesterdayData.totalCollections ?? yesterdayData.mints ?? 0;
                const isUp = today >= yesterday;
                const latestCollection = (todayData.collectionsInvolved || todayData.topCollections || [])[0];
                return (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <MetricTitle isDark={isDark}>New Collections</MetricTitle>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: isDark ? '#fff' : '#212B36' }}>
                          {formatNumberWithDecimals(today)}
                        </span>
                        <span style={{ fontSize: '0.45rem', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>today</span>
                        <span style={{ fontSize: '0.6rem', color: isUp ? '#10b981' : '#ef4444' }}>{isUp ? '↑' : '↓'}</span>
                        {latestCollection && (
                          <a href={`/nft/collection/${latestCollection.slug}`} style={{ fontSize: '0.45rem', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px', borderLeft: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, paddingLeft: '4px' }}>
                            <span style={{ maxWidth: '40px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{latestCollection.name}</span>
                            <span style={{ color: '#10b981', fontWeight: 500 }}>✕{formatNumberWithDecimals(latestCollection.volume || latestCollection.items || 0)}</span>
                          </a>
                        )}
                      </div>
                    </div>
                    <CollectionCreationChart data={chartData} isDark={isDark} />
                  </>
                );
              })()}
            </MobileChartBox>
          </div>
        )}
      </Container>

      {/* Tags Bar */}
      {tags && tags.length > 0 && (
        <Container>
          <TagsContainer isDark={isDark}>
            <TagsRow>
              <TagsScrollArea>
                {/* All NFTs button - always visible */}
                <TagChip
                  isDark={isDark}
                  selected={!selectedTag}
                  onClick={() => setSelectedTag(null)}
                >
                  All NFTs
                </TagChip>
                {selectedTag && (
                  <TagChip
                    isDark={isDark}
                    selected
                    onClick={() => setSelectedTag(null)}
                  >
                    <span>{selectedTag}</span> <X size={12} />
                  </TagChip>
                )}
                {tags.slice(0, selectedTag ? visibleTagCount - 2 : visibleTagCount - 1).filter(t => getTagName(t) !== selectedTag).map((t) => {
                  const tagName = getTagName(t);
                  return (
                    <TagChip
                      key={tagName}
                      isDark={isDark}
                      onClick={() => handleTagClick(tagName)}
                    >
                      <span>{tagName}</span>
                    </TagChip>
                  );
                })}
              </TagsScrollArea>
              <AllButtonWrapper>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setApiModalOpen(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      border: `1px solid ${isDark ? 'rgba(63, 150, 254, 0.2)' : 'rgba(8, 145, 178, 0.2)'}`,
                      borderRadius: '6px',
                      background: 'transparent',
                      color: isDark ? '#3f96fe' : '#0891b2',
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      height: '26px'
                    }}
                  >
                    <Code2 size={13} />
                    API
                  </button>
                  <AllTagsButton isDark={isDark} onClick={() => setTagsDrawerOpen(true)}>
                    <span>All {tags.length > visibleTagCount ? `(${tags.length})` : ''}</span>
                  </AllTagsButton>
                </div>
              </AllButtonWrapper>
            </TagsRow>
          </TagsContainer>
        </Container>
      )}

      {/* Table Section - aligned with metric boxes */}
      <Container>
        <div
          style={{
            minHeight: '50vh',
            position: 'relative',
            zIndex: 1
          }}
        >
          <CollectionList
            type={CollectionListType.ALL}
            tag={selectedTag}
            onGlobalMetrics={setGlobalMetrics}
            initialCollections={initialCollections}
            initialTotal={initialTotal}
          />
        </div>
      </Container>
    </div>
  );
}

export default React.memo(Collections);
