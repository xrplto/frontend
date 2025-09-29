// Material
import { Link, Stack, Typography } from '@mui/material';

// Iconify icons
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

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
      <ChevronRightIcon sx={{ width: '12px', height: '12px', mt: 0.4 }} />
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
          <ChevronRightIcon sx={{ width: '12px', height: '12px', mt: 0.4 }} />
          <Typography variant="link_cascade">{nftName}</Typography>
        </>
      )}
    </Stack>
  );
}
