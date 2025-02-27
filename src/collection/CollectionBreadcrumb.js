// Material
import { Link, Stack, Typography } from '@mui/material';

// Iconify icons
import { Icon } from '@iconify/react';
import twotoneGreaterThan from '@iconify/icons-ic/twotone-greater-than';

export default function CollectionBreadcrumb({ collection, nftName, nftId }) {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ mt: 2, mb: 2 }}
      alignItems="center"
      color={'text.secondary'}
    >
      <Link underline="none" color="inherit" href="/collections" rel="noreferrer noopener nofollow">
        <Typography variant="link_cascade" color="primary">
          NFTs
        </Typography>
      </Link>
      <Icon icon={twotoneGreaterThan} width="12" height="12" style={{ marginTop: '3' }} />
      <Link
        underline="none"
        color="inherit"
        href={`/collection/${collection.collection.slug || ''}`}
        rel="noreferrer noopener nofollow"
      >
        <Typography variant="link_cascade" color="primary">
          {collection.collection.name}
        </Typography>
      </Link>
      {nftName && (
        <>
          <Icon icon={twotoneGreaterThan} width="12" height="12" style={{ marginTop: '3' }} />
          <Typography variant="link_cascade">{nftName}</Typography>
        </>
      )}
    </Stack>
  );
}
