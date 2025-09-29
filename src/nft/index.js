// Material
import { useMediaQuery, Grid, useTheme } from '@mui/material';

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
    <Grid container spacing={3} justifyContent="center">
      <Grid size={{ xs: 12, md: 5.16 }}>
        {/* trying to fit 480px image, was 5/7 */}
        <NFTDetails nft={nft} />
      </Grid>
      <Grid size={{ xs: 12, md: 6.84 }}>
        {status === NFToken.SELL_WITH_MINT_BULK ? (
          <NFTActionsBulk nft={nft} />
        ) : (
          <NFTActions nft={nft} />
        )}
      </Grid>
    </Grid>
  );
}
