// Material
import { Link, Stack, Typography } from '@mui/material';

// Material UI icons
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
// ---------------------------------------------------

export default function LinkCascade({ token, tabID, tabLabels }) {
  return (
    <Stack
      direction="row"
      spacing={0.75}
      sx={{
        mb: 1,
        mt: 0,
        px: 0,
        py: 0.25,
        backgroundColor: 'transparent',
        borderRadius: '12px'
      }}
      alignItems="center"
      color={'text.secondary'}
    >
      <Link underline="none" color="inherit" href={`/`} rel="noreferrer noopener nofollow">
        <Typography
          sx={{
            fontSize: '13px',
            fontWeight: 400,
            color: 'primary.main',
            opacity: 0.8,
            '&:hover': { opacity: 1 }
          }}
        >
          Tokens
        </Typography>
      </Link>
      <ChevronRightIcon sx={{ fontSize: 16, opacity: 0.4 }} />

      {tabID > 0 ? (
        <>
          <Link
            underline="none"
            color="inherit"
            href={`/token/${token.slug}`}
            rel="noreferrer noopener nofollow"
          >
            <Typography
              sx={{
                fontSize: '13px',
                fontWeight: 400,
                color: 'primary.main',
                opacity: 0.8,
                '&:hover': { opacity: 1 }
              }}
            >
              {token.name}
            </Typography>
          </Link>
          <ChevronRightIcon sx={{ fontSize: 16, opacity: 0.4 }} />
          <Typography
            sx={{
              fontSize: '13px',
              fontWeight: 400,
              opacity: 0.7
            }}
          >
            {tabLabels[tabID]}
          </Typography>
        </>
      ) : (
        <Typography
          sx={{
            fontSize: '13px',
            fontWeight: 400,
            opacity: 0.9
          }}
        >
          {token.name}
        </Typography>
      )}
    </Stack>
  );
}
