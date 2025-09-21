import { alpha } from '@mui/material/styles';
import { Box, Container, Typography } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { styled } from '@mui/material/styles';
import Logo from 'src/components/Logo';

const HeaderWrapper = styled(Box)(
  ({ theme }) => `
    width: 100%;
    display: flex;
    align-items: center;
    height: ${theme.spacing(6)};
    position: sticky;
    top: 0;
    left: 0;
    right: 0;
    z-index: 1100;
    background: ${theme.palette.background.paper};
    border-bottom: 1px solid ${
      theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.1)'
    };
    box-shadow: 0 1px 3px rgba(0,0,0,0.12);
    
    ${theme.breakpoints.down('sm')} {
      height: ${theme.spacing(5)};
    }
`
);

function ApiDocsHeader() {
  const theme = useTheme();

  return (
    <HeaderWrapper>
      <Container maxWidth={false} sx={{ px: { xs: 2, sm: 3 } }}>
        <Box display="flex" alignItems="center" sx={{ width: '100%' }}>
          <Logo alt="xrpl.to Logo" style={{ marginRight: '16px', width: 'auto', height: '32px' }} />
          <Typography
            variant="h6"
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 600
            }}
          >
            API Documentation
          </Typography>
          <Box sx={{ ml: 'auto' }}>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              v1.0.0
            </Typography>
          </Box>
        </Box>
      </Container>
    </HeaderWrapper>
  );
}

export default ApiDocsHeader;
