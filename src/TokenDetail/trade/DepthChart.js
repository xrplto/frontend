import React, { memo, useEffect, useMemo, useRef, useState } from 'react';

// Material
import { Box, Typography, styled, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';

// Lightweight Charts
import { createChart, AreaSeries } from 'lightweight-charts';

const ChartContainer = styled(Box)(({ theme }) => ({
  background: 'transparent',
  borderRadius: '8px',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  overflow: 'hidden',
  position: 'relative',
  width: '100%'
}));

function prepareDepth(offers, isBid) {
  if (!offers || offers.length === 0) return [];
  const sorted = [...offers].sort((a, b) => (isBid ? b.price - a.price : a.price - b.price));
  // Return all available levels; do not cap
  return sorted.map((o, i) => ({
    idx: i,
    price: Number(o.price) || 0,
    value: Number(o.sumAmount) || 0
  }));
}

const DepthChart = memo(function DepthChart({ asks = [], bids = [], height = 220 }) {
  const theme = useTheme();
  const containerRef = useRef(null);
  const chartRef = useRef(null);
  const bidSeriesRef = useRef(null);
  const askSeriesRef = useRef(null);
  const priceIndexMapRef = useRef(new Map());
  const [hoverInfo, setHoverInfo] = useState(null);

  const { bidData, askData, scaleNote, totalBid, totalAsk } = useMemo(() => {
    const bidsDepth = prepareDepth(bids, true);
    const asksDepth = prepareDepth(asks, false);

    const maxY = Math.max(
      bidsDepth.length ? bidsDepth[bidsDepth.length - 1].value : 0,
      asksDepth.length ? asksDepth[asksDepth.length - 1].value : 0
    );
    const scaleDown = maxY > 1000000000 ? 1000000 : 1; // scale to millions if extremely large
    const scale = (v) => (scaleDown > 1 ? v / scaleDown : v);

    const out = {
      bidData: [],
      askData: [],
      scaleNote: scaleDown > 1 ? 'values scaled (x1e6)' : '',
      totalBid: 0,
      totalAsk: 0
    };

    priceIndexMapRef.current = new Map();
    let t = 1;
    // Flip buy (bid) section horizontally so it mirrors toward the center
    // Bids are sorted high->low; reverse to plot low->high from left to center
    for (const p of [...bidsDepth].reverse()) {
      out.bidData.push({ time: t, value: scale(p.value) });
      priceIndexMapRef.current.set(t, { price: p.price, side: 'bid', rawValue: p.value });
      t += 1;
    }
    // total bid depth is last cumulative value on bids side; fall back to sum if missing
    const bidCum =
      bids && bids.length
        ? typeof bids[bids.length - 1].sumAmount === 'number'
          ? bids[bids.length - 1].sumAmount
          : bids.reduce((s, o) => s + (Number(o.amount) || 0), 0)
        : 0;
    out.totalBid = scale(bidCum);
    t += 1; // small gap between sides on x axis
    for (const p of asksDepth) {
      out.askData.push({ time: t, value: scale(p.value) });
      priceIndexMapRef.current.set(t, { price: p.price, side: 'ask', rawValue: p.value });
      t += 1;
    }
    // total ask depth is last cumulative value on asks side; fall back to sum if missing
    const askCum =
      asks && asks.length
        ? typeof asks[asks.length - 1].sumAmount === 'number'
          ? asks[asks.length - 1].sumAmount
          : asks.reduce((s, o) => s + (Number(o.amount) || 0), 0)
        : 0;
    out.totalAsk = scale(askCum);

    return out;
  }, [asks, bids]);

  useEffect(() => {
    if (!containerRef.current) return;

    // cleanup existing chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      bidSeriesRef.current = null;
      askSeriesRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height,
      layout: {
        background: { type: 'solid', color: theme.chart?.background || 'transparent' },
        textColor: theme.palette.text.secondary,
        fontSize: 11
      },
      grid: {
        vertLines: { color: alpha(theme.palette.divider, 0.08), visible: true },
        horzLines: { color: alpha(theme.palette.divider, 0.08), visible: true }
      },
      rightPriceScale: {
        borderColor: alpha(theme.palette.divider, 0.1),
        visible: true,
        scaleMargins: { top: 0.1, bottom: 0.1 }
      },
      timeScale: {
        borderColor: alpha(theme.palette.divider, 0.1),
        timeVisible: false,
        secondsVisible: false,
        fixLeftEdge: true,
        lockVisibleTimeRangeOnResize: true,
        rightBarStaysOnScroll: true,
        visible: false
      },
      handleScroll: { mouseWheel: false, pressedMouseMove: false },
      handleScale: { axisPressedMouseMove: false, mouseWheel: false, pinch: false }
    });

    chartRef.current = chart;

    const bidSeries = chart.addSeries(AreaSeries, {
      lineColor: theme.palette.success.main,
      topColor: alpha(theme.palette.success.main, 0.2),
      bottomColor: alpha(theme.palette.success.main, 0.05),
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false
    });
    const askSeries = chart.addSeries(AreaSeries, {
      lineColor: theme.palette.error.main,
      topColor: alpha(theme.palette.error.main, 0.2),
      bottomColor: alpha(theme.palette.error.main, 0.05),
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: false
    });

    bidSeriesRef.current = bidSeries;
    askSeriesRef.current = askSeries;

    const handleResize = () => {
      if (chartRef.current && containerRef.current) {
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    chart.subscribeCrosshairMove((param) => {
      if (!param || !param.time) {
        setHoverInfo(null);
        return;
      }
      const idx = param.time;
      const mapped = priceIndexMapRef.current.get(idx);
      if (!mapped) {
        setHoverInfo(null);
        return;
      }
      const seriesData = {};
      const b = param.seriesData.get(bidSeriesRef.current);
      const a = param.seriesData.get(askSeriesRef.current);
      if (b) seriesData.bid = b.value;
      if (a) seriesData.ask = a.value;
      setHoverInfo({ price: mapped.price, side: mapped.side, value: seriesData[mapped.side] });
    });

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, [theme, height]);

  useEffect(() => {
    if (!chartRef.current || !bidSeriesRef.current || !askSeriesRef.current) return;
    bidSeriesRef.current.setData(bidData);
    askSeriesRef.current.setData(askData);
    try {
      chartRef.current.timeScale().fitContent();
    } catch (e) {}
  }, [bidData, askData]);

  return (
    <ChartContainer>
      {bids.length === 0 && asks.length === 0 ? (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 50,
            fontSize: '0.65rem',
            color: '#999'
          }}
        >
          No orders available
        </Typography>
      ) : (
        <Box sx={{ position: 'relative' }}>
          <Box
            sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1 }}
          >
            <Typography variant="caption" color="text.secondary">
              Depth Chart {scaleNote ? `• ${scaleNote}` : ''}
            </Typography>
            <Box sx={{ textAlign: 'right' }}>
              {hoverInfo && (
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    color:
                      hoverInfo.side === 'bid'
                        ? theme.palette.success.main
                        : theme.palette.error.main
                  }}
                >
                  Px {hoverInfo.price?.toLocaleString(undefined, { maximumFractionDigits: 8 })} |
                  Sum {hoverInfo.value?.toLocaleString()}
                </Typography>
              )}
              {(totalBid || totalAsk) && (
                <Typography variant="caption" sx={{ display: 'block' }}>
                  <Box
                    component="span"
                    sx={{ color: alpha(theme.palette.success.main, 0.9), mr: 0.5 }}
                  >
                    Σ Bid {Number(totalBid).toLocaleString()}
                  </Box>
                  ·
                  <Box
                    component="span"
                    sx={{ color: alpha(theme.palette.error.main, 0.9), ml: 0.5 }}
                  >
                    Σ Ask {Number(totalAsk).toLocaleString()}
                  </Box>
                </Typography>
              )}
            </Box>
          </Box>
          <div ref={containerRef} style={{ width: '100%', height }} />
        </Box>
      )}
    </ChartContainer>
  );
});

export default DepthChart;
