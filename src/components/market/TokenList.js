import PropTypes from 'prop-types';
// material
import { Grid } from '@mui/material';
import MarketTokenCard from './TokenCard';

// ----------------------------------------------------------------------

TokenList.propTypes = {
  tokens: PropTypes.array.isRequired
};

export default function TokenList({ tokens, ...other }) {
  return (
    <Grid container spacing={3} {...other}>
      {tokens.map((token) => (
        <Grid key={token.id} item xs={12} sm={6} md={3}>
          <MarketTokenCard token={token} />
        </Grid>
      ))}
    </Grid>
  );
}
