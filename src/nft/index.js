// Material
import { useMediaQuery, Grid, useTheme, Box } from '@mui/material';

// Constants
const NFToken = {
  SELL_WITH_MINT_BULK: 'SELL_WITH_MINT_BULK',
  BURNT: 'BURNT'
};

// Components
import NFTDetails from './NFTDetails';
import NFTActions from './NFTActions';
import NFTActionsBulk from '../NFTCollection/NFTActionsBulk';

export default function Detail({ nft }) {
  const theme = useTheme();

  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { status, costs } = nft;

  return (
    <Grid container columnSpacing={2} rowSpacing={2} sx={{ mb: 0, maxWidth: '1300px', mx: 'auto' }} alignItems="flex-start">
      <Grid size={{ xs: 12, md: 4 }}>
        <NFTDetails nft={nft} />
      </Grid>
      <Grid size={{ xs: 12, md: 8 }}>
        {status === NFToken.SELL_WITH_MINT_BULK ? (
          <NFTActionsBulk nft={nft} />
        ) : (
          <NFTActions nft={nft} />
        )}
      </Grid>
    </Grid>
  );
}
