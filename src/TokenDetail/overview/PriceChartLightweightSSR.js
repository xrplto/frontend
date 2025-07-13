import dynamic from 'next/dynamic';
import { Paper, Box, useTheme, Typography } from '@mui/material';

// Lightweight chart with SSR disabled
const PriceChartLightweight = dynamic(
  () => import('./PriceChartLightweight'),
  { 
    ssr: false,
    loading: () => {
      const theme = useTheme();
      return (
        <Paper elevation={0} sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Box sx={{ width: 120, height: 24, bgcolor: 'action.hover', borderRadius: 1 }} />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Box sx={{ width: 180, height: 32, bgcolor: 'action.hover', borderRadius: 1 }} />
              <Box sx={{ width: 144, height: 32, bgcolor: 'action.hover', borderRadius: 1 }} />
            </Box>
          </Box>
          <Box sx={{ position: 'relative', height: 300, bgcolor: 'action.hover', borderRadius: 1 }}>
            <Box sx={{ 
              position: 'absolute', 
              inset: 0, 
              display: 'flex', 
              flexDirection: 'column',
              alignItems: 'center', 
              justifyContent: 'center',
              gap: 2
            }}>
              {/* Animated chart bars */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'flex-end', 
                gap: 0.5,
                height: 40
              }}>
                {[0.3, 0.6, 0.4, 0.8, 0.5, 0.9, 0.7, 0.4, 0.6, 0.5].map((height, i) => (
                  <Box
                    key={i}
                    sx={{
                      width: 6,
                      height: `${height * 100}%`,
                      bgcolor: theme.palette.primary.main,
                      opacity: 0.7,
                      borderRadius: 1,
                      animation: 'pulse 1.5s ease-in-out infinite',
                      animationDelay: `${i * 0.1}s`,
                      '@keyframes pulse': {
                        '0%, 100%': {
                          transform: 'scaleY(0.5)',
                          opacity: 0.5,
                        },
                        '50%': {
                          transform: 'scaleY(1)',
                          opacity: 0.8,
                        },
                      },
                    }}
                  />
                ))}
              </Box>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'text.secondary',
                  fontWeight: 500,
                  letterSpacing: 0.5
                }}
              >
                Loading chart data
              </Typography>
            </Box>
          </Box>
        </Paper>
      );
    }
  }
);

export default function PriceChartLightweightSSR({ token }) {
  return <PriceChartLightweight token={token} />;
}