import axios from 'axios';
import { useState, useEffect } from 'react';

// Material
import {
  alpha,
  styled,
  useTheme,
  Stack,
  Typography,
  Table,
  TableRow,
  TableBody,
  TableCell,
  Box,
  useMediaQuery
} from '@mui/material';
import { tableCellClasses } from '@mui/material/TableCell';

// Utils
import { fIntNumber, fCurrency3, fNumber } from 'src/utils/formatNumber';

// Enhanced styled components
const ModernTableCell = styled(TableCell)(({ theme }) => ({
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  padding: theme.spacing(1.5),
  '&:first-of-type': {
    paddingLeft: theme.spacing(1.5)
  },
  '&:last-of-type': {
    paddingRight: theme.spacing(1.5)
  },
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(1),
    '&:first-of-type': {
      paddingLeft: theme.spacing(1)
    },
    '&:last-of-type': {
      paddingRight: theme.spacing(1)
    }
  }
}));

const StyledTable = styled(Table)(({ theme }) => ({
  background: 'transparent',
  '& .MuiTableRow-root': {
    transition: 'all 0.2s ease',
    '&:hover': {
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.02)} 0%, ${alpha(
        theme.palette.primary.main,
        0.01
      )} 100%)`,
      backdropFilter: 'blur(5px)'
    }
  }
}));
// ----------------------------------------------------------------------

export default function RichStatistics({ token }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const BASE_URL = process.env.API_URL;

  const [richInfo, setRichInfo] = useState({
    time: Date.now(),
    length: 0,
    top10: 0,
    top20: 0,
    top50: 0,
    top100: 0,
    active24H: 0
  });

  useEffect(() => {
    function getRichInfo() {
      // https://api.xrpl.to/api/richinfo/0413ca7cfc258dfaf698c02fe304e607
      axios
        .get(`${BASE_URL}/richinfo/${token.md5}`)
        .then((res) => {
          let ret = res.status === 200 ? res.data : undefined;
          if (ret) {
            setRichInfo(ret.richInfo);
          }
        })
        .catch((err) => {
          console.log('Error on getting richInfo!', err);
        })
        .then(function () {
          // always executed
        });
    }
    getRichInfo();
  }, []);

  return (
    <Box
      sx={{
        borderRadius: '24px',
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.background.paper,
          0.7
        )} 0%, ${alpha(theme.palette.background.paper, 0.5)} 100%)`,
        backdropFilter: 'blur(25px)',
        border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
        boxShadow: `0 8px 32px 0 ${alpha(theme.palette.common.black, 0.1)}`,
        position: 'relative',
        overflow: 'hidden',
        mb: 2
      }}
    >
      {/* Enhanced Header */}
      <Box
        sx={{
          p: isMobile ? 1.5 : 2,
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.primary.main,
            0.05
          )} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
        }}
      >
        <Typography
          variant="h6"
          sx={{
            fontSize: isMobile ? '0.95rem' : '1.1rem',
            fontWeight: 700,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.main} 100%)`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-0.01em'
          }}
        >
          {token.name} Holders Statistics
        </Typography>
      </Box>

      <StyledTable size="small">
        <TableBody>
          <TableRow>
            <ModernTableCell align="left">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: alpha(theme.palette.text.primary, 0.9),
                  fontSize: isMobile ? '0.75rem' : '0.875rem'
                }}
                noWrap
              >
                Total Addresses
              </Typography>
            </ModernTableCell>
            <ModernTableCell align="left">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${alpha(
                    theme.palette.success.main,
                    0.8
                  )} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: '1rem'
                }}
              >
                {fIntNumber(richInfo.length)}
              </Typography>
            </ModernTableCell>
          </TableRow>
          <TableRow>
            <ModernTableCell align="left">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: alpha(theme.palette.text.primary, 0.9),
                  fontSize: isMobile ? '0.75rem' : '0.875rem'
                }}
                noWrap
              >
                Active Addresses
                <Box
                  component="span"
                  sx={{
                    display: 'inline-block',
                    ml: 0.5,
                    px: 0.5,
                    py: 0.25,
                    borderRadius: '4px',
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.background.paper,
                      0.8
                    )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                    backdropFilter: 'blur(8px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                    fontSize: '0.7rem',
                    fontWeight: 500,
                    color: alpha(theme.palette.text.secondary, 0.8)
                  }}
                >
                  24h
                </Box>
              </Typography>
            </ModernTableCell>
            <ModernTableCell align="left">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${theme.palette.error.main} 0%, ${alpha(
                    theme.palette.error.main,
                    0.8
                  )} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: '1rem'
                }}
              >
                {fIntNumber(richInfo.active24H)}
              </Typography>
            </ModernTableCell>
          </TableRow>
          <TableRow>
            <ModernTableCell align="left">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: alpha(theme.palette.text.primary, 0.9),
                  fontSize: isMobile ? '0.75rem' : '0.875rem'
                }}
                noWrap
              >
                Top 10 Holders
              </Typography>
            </ModernTableCell>
            <ModernTableCell align="left">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.warning.main,
                  fontSize: '1rem'
                }}
              >
                {richInfo.top10.toFixed(2)}%
              </Typography>
            </ModernTableCell>
          </TableRow>
          <TableRow>
            <ModernTableCell align="left">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: alpha(theme.palette.text.primary, 0.9),
                  fontSize: isMobile ? '0.75rem' : '0.875rem'
                }}
                noWrap
              >
                Top 20 Holders
              </Typography>
            </ModernTableCell>
            <ModernTableCell align="left">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.secondary.main,
                  fontSize: '1rem'
                }}
              >
                {richInfo.top20.toFixed(2)}%
              </Typography>
            </ModernTableCell>
          </TableRow>
          <TableRow>
            <ModernTableCell align="left">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: alpha(theme.palette.text.primary, 0.9),
                  fontSize: isMobile ? '0.75rem' : '0.875rem'
                }}
                noWrap
              >
                Top 50 Holders
              </Typography>
            </ModernTableCell>
            <ModernTableCell align="left">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${alpha(
                    theme.palette.info.main,
                    0.8
                  )} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: '1rem'
                }}
              >
                {richInfo.top50.toFixed(2)}%
              </Typography>
            </ModernTableCell>
          </TableRow>
          <TableRow>
            <ModernTableCell align="left">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: alpha(theme.palette.text.primary, 0.9),
                  fontSize: isMobile ? '0.75rem' : '0.875rem'
                }}
                noWrap
              >
                Top 100 Holders
              </Typography>
            </ModernTableCell>
            <ModernTableCell align="left">
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${alpha(
                    theme.palette.success.main,
                    0.8
                  )} 100%)`,
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  fontSize: '1rem'
                }}
              >
                {richInfo.top100.toFixed(2)}%
              </Typography>
            </ModernTableCell>
          </TableRow>
        </TableBody>
      </StyledTable>
    </Box>
  );
}
