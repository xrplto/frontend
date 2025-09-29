import React from 'react';
import { Stack, Typography, Box, Container } from '@mui/material';
import CollectionList from './CollectionList';
// Constants
const CollectionListType = {
  ALL: 'ALL',
  FEATURED: 'FEATURED',
  TRENDING: 'TRENDING'
};
import { useTheme } from '@mui/material/styles';

// Removed unused ApexCharts-dependent components

function Collections() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        flex: 1,
        py: { xs: 2, sm: 3, md: 4 },
        backgroundColor: 'transparent',
        minHeight: '100vh',
        position: 'relative'
      }}
    >
      {/* Collections List Section */}
      <Container maxWidth="xl" sx={{ px: { xs: 2, sm: 3 } }}>
        <Box sx={{ mb: { xs: 2, sm: 3 } }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: theme.palette.text.primary,
              mb: 1,
              fontSize: { xs: '1.25rem', sm: '1.5rem' }
            }}
          >
            Top Collections by Volume
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: { xs: '0.75rem', sm: '0.875rem' }
            }}
          >
            Collections with highest trading volume in the last 30 days
          </Typography>
        </Box>
      </Container>

      <Stack
        sx={{
          minHeight: '50vh',
          px: { xs: 1, sm: 3, md: 4 },
          position: 'relative',
          zIndex: 1,
          animation: 'fadeInUp 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
          '@keyframes fadeInUp': {
            '0%': {
              opacity: 0,
              transform: 'translateY(30px)'
            },
            '100%': {
              opacity: 1,
              transform: 'translateY(0)'
            }
          }
        }}
      >
        <Box
          sx={{
            borderRadius: '24px',
            background: 'transparent',
            backdropFilter: 'none',
            border: 'none',
            boxShadow: 'none',
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <CollectionList type={CollectionListType.ALL} />
        </Box>
      </Stack>
    </Box>
  );
}

export default React.memo(Collections);
