import axios from 'axios';
import Decimal from 'decimal.js';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import HighchartsTreemap from 'highcharts/modules/treemap';
import accessibility from 'highcharts/modules/accessibility';
import { useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { AppContext } from 'src/AppContext';
import { currencySymbols } from 'src/utils/constants';
import { fCurrency, fNumberWithCurreny } from 'src/utils/formatNumber';
import {
  FormControl,
  Select,
  MenuItem,
  Box,
  Typography,
  Stack,
  Chip,
  styled,
  alpha,
  useTheme
} from '@mui/material';

// Enhanced styled components
const SelectorWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: theme.spacing(3),
  flexWrap: 'wrap',
  gap: theme.spacing(2)
}));

const ModernSelect = styled(Select)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(
    theme.palette.background.paper,
    0.6
  )} 100%)`,
  backdropFilter: 'blur(10px)',
  borderRadius: '12px',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  minWidth: '180px',
  '& .MuiSelect-select': {
    padding: theme.spacing(1.5, 2),
    fontWeight: 600,
    fontSize: '0.9rem'
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none'
  },
  '&:hover': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(
      theme.palette.background.paper,
      0.7
    )} 100%)`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
  }
}));

const HeatmapTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.2rem',
  fontWeight: 700,
  color: theme.palette.text.primary,
  marginBottom: theme.spacing(1),
  letterSpacing: '-0.01em'
}));

const ChartContainer = styled(Box)(({ theme }) => ({
  borderRadius: '16px',
  overflow: 'hidden',
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.3)} 0%, ${alpha(
    theme.palette.background.paper,
    0.1
  )} 100%)`,
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  position: 'relative',

  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.3)}, ${alpha(
      theme.palette.success.main,
      0.3
    )}, ${alpha(theme.palette.error.main, 0.3)})`,
    zIndex: 1
  }
}));

function CryptoHeatmap({ exchRate }) {
  if (typeof Highcharts === 'object') {
    HighchartsTreemap(Highcharts);
    accessibility(Highcharts);
  }

  const theme = useTheme();
  const { activeFiatCurrency } = useContext(AppContext);
  const [markets, setMarkets] = useState([]);
  const [sortBy, setSortBy] = useState('vol24hxrp');

  useEffect(() => {
    const getTokenData = async () => {
      try {
        const BASE_URL = process.env.API_URL;
        const res = await axios.get(
          `${BASE_URL}/tokens?start=1&limit=100&sortBy=${sortBy}&sortType=desc&filter=&tags=yes&showNew=false&showSlug=false`
        );

        let data = res.data;
        if (data) {
          const tokens = data.tokens;
          const marketData = tokens.map((token) => ({
            name: token.name,
            original: token.user,
            value: sortBy === 'marketcap' ? token.marketcap : token.vol24hxrp,
            displayValue: token.exch,
            priceChange: token.pro24h,
            price: token.exch,
            slug: token.slug,
            md5: token.md5,
            color: token.pro24h >= 0 ? '#00D4AA' : '#FF4757',
            trustlines: token.trustlines,
            holders: token.holders,
            verified: token.verified,
            kyc: token.kyc
          }));

          setMarkets(marketData);
        }
      } catch (err) {
        console.log(err);
      }
    };

    getTokenData();
  }, [sortBy]);

  const handleSortChange = useCallback((event) => {
    setSortBy(event.target.value);
  }, []);

  const options = useMemo(() => ({
    chart: {
      backgroundColor: 'transparent',
      animation: {
        duration: 800,
        easing: 'easeOutCubic'
      }
    },
    series: [
      {
        type: 'treemap',
        cursor: 'pointer',
        layoutAlgorithm: 'squarified',
        data: markets,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.1)',
        dataLabels: {
          useHTML: true,
          layoutAlgorithm: 'squarified',
          style: {},
          formatter: function () {
            const priceChange = this.point.priceChange;
            const changeSymbol = priceChange >= 0 ? '+' : '';

            // Only show labels for boxes that are large enough
            if (this.point.shapeArgs.width < 80 || this.point.shapeArgs.height < 50) {
              return '';
            }

            return `<div style="color: #fff; font-weight: 600; text-shadow: 0 1px 3px rgba(0,0,0,0.5);"> 
              <div style="text-align: center; font-size: ${Math.min(
                this.point.shapeArgs.height / 8,
                18
              )}px; margin-bottom: 6px; letter-spacing: -0.01em;">
                ${this.key}
              </div>
              <div style="text-align: center; font-size: ${Math.min(
                this.point.shapeArgs.height / 12,
                14
              )}px; opacity: 0.95; background: rgba(0,0,0,0.2); padding: 2px 8px; border-radius: 4px; display: inline-block;">
                ${changeSymbol}${Math.abs(priceChange).toFixed(1)}%
              </div>
            </div>`;
          }
        },
        states: {
          hover: {
            brightness: 0.1,
            borderColor: 'rgba(255,255,255,0.3)'
          }
        },
        events: {
          click: function (event) {
            window.location.href = '/token/' + event.point.slug;
          }
        }
      }
    ],
    title: {
      text: null
    },
    colorAxis: {
      minColor: '#FFFFFF',
      maxColor: Highcharts.getOptions().colors[0]
    },
    tooltip: {
      backgroundColor: 'rgba(0,0,0,0.9)',
      shadow: {
        color: 'rgba(0,0,0,0.3)',
        offsetX: 0,
        offsetY: 4,
        opacity: 0.8,
        width: 8
      },
      borderWidth: 0,
      borderRadius: 12,
      useHTML: true,
      style: {
        zIndex: 100
      },
      formatter: function () {
        const verifiedBadge = this.point.verified ? '✅ ' : '';
        const nameDisplay = this.point.original
          ? `${this.point.name}: ${this.point.original}`
          : this.point.name;

        const price = this.point.price;
        const formattedPrice =
          price < 0.001
            ? price.toFixed(8)
            : price < 1
              ? price.toFixed(6)
              : fNumberWithCurreny(price, exchRate);

        const priceChange = this.point.priceChange;
        const changeColor = priceChange >= 0 ? '#00D4AA' : '#FF4757';
        const changeBg = priceChange >= 0 ? 'rgba(0, 212, 170, 0.1)' : 'rgba(255, 71, 87, 0.1)';
        const formattedChange = `<span style="color:${changeColor}; background: ${changeBg}; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${
          priceChange >= 0 ? '+' : ''
        }${Math.abs(priceChange).toFixed(1)}%</span>`;

        return `
          <div style="color:#fff;font-family:system-ui,-apple-system,sans-serif;font-size:12px;padding:16px;min-width:200px;">
            <div style="font-weight:700;margin-bottom:12px;font-size:14px;border-bottom:1px solid rgba(255,255,255,0.1);padding-bottom:8px;">
              ${verifiedBadge}${nameDisplay}
            </div>
            <div style="display:grid;gap:8px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="opacity:0.8;font-weight:500;">Price:</span>
                <span style="font-weight:600;">${
                  currencySymbols[activeFiatCurrency]
                } ${formattedPrice}</span>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="opacity:0.8;font-weight:500;">24h Change:</span>
                ${formattedChange}
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="opacity:0.8;font-weight:500;">Volume:</span>
                <span style="font-weight:600;">${fCurrency(this.point.value)}</span>
              </div>
            </div>
          </div>`;
      }
    }
  }), [markets, sortBy, activeFiatCurrency]);

  return (
    <Stack spacing={3}>
      <SelectorWrapper>
        <Box>
          <HeatmapTitle>Token Performance Heatmap</HeatmapTitle>
          <Typography variant="body2" sx={{ opacity: 0.8, fontSize: '0.85rem' }}>
            Interactive visualization of XRPL token performance
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          <Chip
            label={`${markets.length} Tokens`}
            size="small"
            sx={{
              backgroundColor: alpha(theme.palette.primary.main, 0.1),
              color: theme.palette.primary.main,
              fontWeight: 600
            }}
          />
          <FormControl>
            <ModernSelect value={sortBy} onChange={handleSortChange} displayEmpty size="small">
              <MenuItem value="vol24hxrp">📊 Sort by Volume</MenuItem>
              <MenuItem value="marketcap">💎 Sort by Market Cap</MenuItem>
            </ModernSelect>
          </FormControl>
        </Stack>
      </SelectorWrapper>

      <ChartContainer>
        <HighchartsReact
          highcharts={Highcharts}
          options={options}
          containerProps={{
            style: {
              height: 'calc(70vh - 100px)',
              minHeight: '500px'
            }
          }}
        />
      </ChartContainer>
    </Stack>
  );
}

export default CryptoHeatmap;
