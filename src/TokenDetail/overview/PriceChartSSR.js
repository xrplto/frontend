import dynamic from 'next/dynamic';
import { useState, useEffect, useContext, useCallback } from 'react';
import {
  Box,
  Skeleton,
  useTheme,
  useMediaQuery,
  alpha
} from '@mui/material';
import { AppContext } from 'src/AppContext';
import axios from 'axios';

// Dynamically import the chart component with SSR disabled
const PriceChartClient = dynamic(
  () => import('./PriceChart'),
  {
    ssr: false,
    loading: () => null // We'll handle loading state ourselves
  }
);

// Loading skeleton that matches the chart dimensions
function ChartSkeleton() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  return (
    <Box
      sx={{
        width: '100%',
        height: isMobile ? '400px' : '550px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        p: 2,
        backgroundColor: alpha(theme.palette.background.paper, 0.8),
        borderRadius: 2
      }}
    >
      {/* Header skeleton */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Skeleton variant="text" width={200} height={32} />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Skeleton variant="rounded" width={80} height={28} />
          <Skeleton variant="rounded" width={80} height={28} />
        </Box>
      </Box>
      
      {/* Chart area skeleton */}
      <Skeleton 
        variant="rounded" 
        sx={{ 
          flex: 1,
          width: '100%',
          animation: 'pulse 1.5s ease-in-out infinite'
        }} 
      />
      
      {/* Bottom controls skeleton */}
      <Box sx={{ display: 'flex', gap: 1 }}>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} variant="rounded" width={40} height={24} />
        ))}
      </Box>
    </Box>
  );
}

// SSR-compatible wrapper component - simplified for fast loading
export default function PriceChartSSR({ token }) {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // During SSR, return null for fastest initial render
  if (!mounted) {
    return null;
  }
  
  // Once mounted on client, render the chart immediately
  return <PriceChartClient token={token} />;
}