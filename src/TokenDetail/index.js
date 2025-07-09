import dynamic from 'next/dynamic';
import { useContext } from 'react';

// Material
import { Box, Divider, useTheme, useMediaQuery } from '@mui/material';

// Components
import LinkCascade from './LinkCascade';
import TokenSummary from './common/TokenSummary';
import { AppContext } from 'src/AppContext';

// Lazy load components
const Overview = dynamic(() => import('./overview'));

export default function TokenDetail({ token }) {
  const { darkMode } = useContext(AppContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ position: 'relative' }}>
      {!isMobile && <LinkCascade token={token} />}
      
      <TokenSummary token={token} />

      {!isMobile && (
        <Divider orientation="horizontal" sx={{ mt: 2, mb: 2 }} variant="middle" flexItem />
      )}

      <div id="back-to-top-tab-anchor" />

      <Overview token={token} />
    </Box>
  );
}