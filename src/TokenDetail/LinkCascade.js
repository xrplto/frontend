// Material
import { Link, Stack, Typography } from '@mui/material';

// Material UI icons
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
// ---------------------------------------------------

export default function LinkCascade({ token, tabID, tabLabels }) {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{ mb: 2, mt: 0 }}
      alignItems="center"
      color={'text.secondary'}
    >
      <Link underline="none" color="inherit" href={`/`} rel="noreferrer noopener nofollow">
        <Typography variant="link_cascade" color="primary">
          Tokens
        </Typography>
      </Link>
      <ChevronRightIcon sx={{ fontSize: 12, mt: 0.4 }} />

      {tabID > 0 ? (
        <>
          <Link
            underline="none"
            color="inherit"
            href={`/token/${token.slug}`}
            rel="noreferrer noopener nofollow"
          >
            <Typography variant="link_cascade" color={'primary'}>
              {token.name}
            </Typography>
          </Link>
          <ChevronRightIcon sx={{ fontSize: 12, mt: 0.4 }} />
          <Typography variant="link_cascade">{tabLabels[tabID]}</Typography>
        </>
      ) : (
        <Typography variant="link_cascade">{token.name}</Typography>
      )}
    </Stack>
  );
}
