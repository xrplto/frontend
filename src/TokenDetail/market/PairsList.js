// Material
import {
  styled,
  Avatar,
  Box,
  IconButton,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  Tooltip,
  useMediaQuery,
  useTheme,
  alpha,
  Card,
  CardContent,
  keyframes,
  Pagination,
  Chip
} from '@mui/material';

// Iconify
import { Icon } from '@iconify/react';
import arrowsExchange from '@iconify/icons-gg/arrows-exchange';
import InfoIcon from '@mui/icons-material/Info';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

// Utils
import { fNumber } from 'src/utils/formatNumber';
import { useEffect, useRef, useState } from 'react';
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
import { useInView } from 'react-intersection-observer';

// ----------------------------------------------------------------------
import StackStyle from 'src/components/StackStyle'; //Maybe need to disable?
import LoadChart from 'src/components/LoadChart';

// ----------------------------------------------------------------------

// Define highlight animation with softer colors
const highlightAnimation = (theme) => keyframes`
  0% {
    background-color: ${theme.palette.primary.main}30;
    transform: translateY(-2px);
    box-shadow: 0 4px 8px ${theme.palette.primary.main}40;
  }
  50% {
    background-color: ${theme.palette.primary.main}15;
    transform: translateY(0);
    box-shadow: 0 2px 4px ${theme.palette.primary.main}20;
  }
  100% {
    background-color: transparent;
    transform: translateY(0);
    box-shadow: none;
  }
`;

// Styled components with improved design
const PairCard = styled(Card, {
  shouldForwardProp: (prop) => prop !== 'isNew'
})(({ theme, isNew }) => ({
  marginBottom: theme.spacing(0.5),
  borderRadius: '8px',
  backgroundColor: 'transparent',
  backdropFilter: 'none',
  WebkitBackdropFilter: 'none',
  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
  boxShadow: `
    0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
    0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
    inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`,
  transition: 'all 0.3s ease-in-out',
  position: 'relative',
  overflow: 'hidden',
  animation: isNew ? `${highlightAnimation(theme)} 1s ease-in-out` : 'none',
  '&:hover': {
    transform: 'translateY(-1px)',
    boxShadow: `
      0 12px 40px ${alpha(theme.palette.common.black, 0.15)}, 
      0 2px 4px ${alpha(theme.palette.common.black, 0.05)},
      inset 0 1px 1px ${alpha(theme.palette.common.white, 0.15)}`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`
  }
}));

const VolumeIndicator = styled('div')(({ theme, volume }) => ({
  position: 'absolute',
  left: 0,
  top: 0,
  height: '100%',
  width: `${volume}%`,
  background: `linear-gradient(90deg, 
    ${theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.08)' : 'rgba(33, 150, 243, 0.05)'} 0%, 
    ${
      theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.02)' : 'rgba(33, 150, 243, 0.01)'
    } 100%)`,
  transition: 'width 0.3s ease-in-out',
  borderRadius: '12px'
}));

const StyledPagination = styled(Pagination)(({ theme }) => ({
  '& .MuiPaginationItem-root': {
    color: theme.palette.text.primary,
    borderRadius: '8px',
    margin: '0 2px',
    fontWeight: '500',
    '&:hover': {
      backgroundColor:
        theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)'
    }
  },
  '& .Mui-selected': {
    backgroundColor: `${theme.palette.primary.main} !important`,
    color: '#fff !important',
    fontWeight: 'bold',
    borderRadius: '8px',
    '&:hover': {
      backgroundColor: `${theme.palette.primary.dark} !important`
    }
  }
}));

const PairChip = styled(Chip)(({ theme }) => ({
  fontSize: '0.7rem',
  height: '24px',
  fontWeight: 'bold',
  borderRadius: '12px',
  backgroundColor: 'transparent',
  color: theme.palette.primary.main,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.5)}`,
  boxShadow: `
    0 2px 8px ${alpha(theme.palette.primary.main, 0.15)},
    inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`
}));

const SmallInfoIcon = ({ isMobile, ...props }) => (
  <InfoIcon
    {...props}
    sx={{
      fontSize: isMobile ? '12px' : '14px',
      ml: isMobile ? 0.25 : 0.5,
      opacity: 0.7,
      transition: 'opacity 0.2s ease',
      '&:hover': {
        opacity: 1
      }
    }}
  />
);

const badge24hStyle = {
  display: 'inline-block',
  marginLeft: '4px',
  marginRight: '4px',
  color: '#fff',
  fontSize: '9px',
  fontWeight: '600',
  lineHeight: '14px',
  backgroundColor: 'transparent',
  backdropFilter: 'none',
  WebkitBackdropFilter: 'none',
  borderRadius: '4px',
  padding: '1px 4px',
  border: '1px solid rgba(145, 158, 171, 0.2)'
};

const badgeDEXStyle = {
  display: 'inline-block',
  marginLeft: '4px',
  marginRight: '4px',
  color: '#fff',
  fontSize: '9px',
  fontWeight: '600',
  lineHeight: '14px',
  backgroundColor: 'transparent',
  backdropFilter: 'none',
  WebkitBackdropFilter: 'none',
  borderRadius: '4px',
  padding: '1px 4px',
  border: '1px solid rgba(183, 129, 3, 0.3)'
};

const StyledTableHead = styled(TableHead, {
  shouldForwardProp: (prop) => prop !== 'darkMode'
})(({ theme, darkMode }) => ({
  position: 'sticky',
  zIndex: 999,
  top: 0,
  background: 'transparent',
  backdropFilter: 'none',
  WebkitBackdropFilter: 'none',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: `linear-gradient(90deg, transparent, ${
      alpha(theme.palette.divider, 0.2)
    }, transparent)`
  }
}));

const StyledTableRow = styled(TableRow, {
  shouldForwardProp: (prop) => prop !== 'darkMode' && prop !== 'isMobile'
})(({ theme, darkMode, isMobile }) => ({
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  backgroundColor: 'transparent',
  '&:hover': {
    '& .MuiTableCell-root': {
      backgroundColor: alpha(theme.palette.primary.main, 0.04),
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none'
    },
    cursor: 'pointer',
    transform: 'translateY(-1px)',
    boxShadow: `
      0 8px 32px ${alpha(theme.palette.common.black, 0.08)}, 
      0 1px 2px ${alpha(theme.palette.common.black, 0.04)}`
  },
  '& .MuiTableCell-root': {
    padding: isMobile ? '8px 4px' : '16px 12px',
    whiteSpace: 'nowrap',
    borderBottom: 'none',
    fontSize: isMobile ? '11px' : '14px',
    fontWeight: '500',
    backgroundColor: 'transparent',
    '&:not(:first-of-type)': {
      paddingLeft: isMobile ? '2px' : '8px'
    }
  }
}));

const ChartBox = ({ darkMode, sparkline, id, isMobile }) => {
  const BASE_URL = process.env.API_URL;
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  return (
    <Box ref={ref}>
      {inView ? (
        sparkline ? (
          <Box
            sx={{
              width: isMobile ? '80px' : '180px',
              height: isMobile ? '30px' : '60px',
              borderRadius: '8px',
              overflow: 'hidden',
              border: `1px solid ${alpha(darkMode ? 'rgba(145, 158, 171, 0.12)' : 'rgba(145, 158, 171, 0.24)', 0.5)}`,
              backgroundColor: 'transparent',
              position: 'relative',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                transform: 'scale(1.02)',
                borderColor: darkMode ? 'rgba(145, 158, 171, 0.24)' : 'rgba(145, 158, 171, 0.48)'
              }
            }}
          >
            <LoadChart
              url={`${BASE_URL}/sparkline/${sparkline}?period=24h`}
              showGradient={true}
              lineWidth={2}
              style={{
                width: '100%',
                height: '100%'
              }}
              opts={{
                renderer: 'svg',
                width: isMobile ? 80 : 180,
                height: isMobile ? 30 : 60,
                animation: false,
                devicePixelRatio: window.devicePixelRatio || 1
              }}
            />
          </Box>
        ) : (
          <Box
            sx={{
              width: isMobile ? '80px' : '180px',
              height: isMobile ? '30px' : '60px',
              borderRadius: '8px',
              border: `1px solid ${alpha(darkMode ? 'rgba(145, 158, 171, 0.12)' : 'rgba(145, 158, 171, 0.24)', 0.5)}`,
              backgroundColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: 0.5
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: darkMode ? '#919EAB' : '#637381',
                fontSize: '11px',
                fontWeight: '500'
              }}
            >
              No Chart Data
            </Typography>
          </Box>
        )
      ) : (
        <Box
          sx={{
            width: isMobile ? '80px' : '180px',
            height: isMobile ? '30px' : '60px',
            borderRadius: '8px',
            backgroundColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      )}
    </Box>
  );
};

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.substr(0, n - 1) + '...' : str;
}

export default function PairsList({ token, pairs }) {
  const BASE_URL = process.env.API_URL;
  const { darkMode } = useContext(AppContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { name, exch, pro7d, pro24h, md5, slug } = token;
  let user = token.user;
  if (!user) user = name;

  const tableRef = useRef(null);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollLeft(tableRef?.current?.scrollLeft > 0);
    };

    tableRef?.current?.addEventListener('scroll', handleScroll);

    return () => {
      tableRef?.current?.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const stickyCellStyles = {
    first: {
      position: 'sticky',
      zIndex: 1001,
      left: 0,
      background: 'transparent',
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
      width: isMobile ? '40px' : '60px',
      minWidth: isMobile ? '40px' : '60px',
      padding: isMobile ? '8px 4px' : '16px 12px'
    },
    second: {
      position: 'sticky',
      zIndex: 1002,
      left: isMobile ? '40px' : '60px',
      background: 'transparent',
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none',
      padding: isMobile ? '8px 4px' : '16px 12px',
      '&:before': scrollLeft
        ? {
            content: "''",
            boxShadow: `inset 10px 0 8px -8px ${alpha(theme.palette.divider, 0.24)}`,
            position: 'absolute',
            top: '0',
            right: '0',
            bottom: '-1px',
            width: '30px',
            transform: 'translate(100%)',
            transition: 'box-shadow .3s',
            pointerEvents: 'none'
          }
        : {}
    }
  };

  const headerCellStyles = {
    fontSize: isMobile ? '11px' : '13px',
    fontWeight: '600',
    padding: isMobile ? '8px 4px' : '20px 12px',
    height: 'auto',
    whiteSpace: 'nowrap',
    color: darkMode ? '#919EAB' : '#637381',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
    borderBottom: 'none',
    '&:not(:first-of-type)': {
      paddingLeft: isMobile ? '4px' : '8px'
    }
  };

  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(pairs.length / itemsPerPage);
  const paginatedPairs = pairs.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <Stack spacing={1}>
      {/* Table Headers with integrated title */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: '1fr 1fr',
            md: '0.5fr 2fr 1.5fr 1.5fr 1fr 1.5fr 1.5fr 0.5fr'
          },
          gap: 2,
          p: 2,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          backgroundColor: 'transparent',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          borderRadius: '8px 8px 0 0',
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          boxShadow: `
            0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
            0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
            inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`,
          '& > *': {
            fontWeight: 'bold',
            color: theme.palette.text.secondary,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }
        }}
      >
        <Typography sx={{ display: { xs: 'none', md: 'block' } }}>#</Typography>
        <Typography sx={{ display: { xs: 'none', md: 'block' } }}>Pair</Typography>
        <Typography sx={{ display: { xs: 'none', md: 'block' } }}>24h Chart</Typography>
        <Typography sx={{ display: { xs: 'none', md: 'block' } }}>Volume (24h)</Typography>
        <Typography sx={{ display: { xs: 'none', md: 'block' } }}>Trades</Typography>
        <Typography sx={{ display: { xs: 'none', md: 'block' } }}>Issuer</Typography>
        <Typography sx={{ display: { xs: 'none', md: 'block' } }}>Domain</Typography>
        <Typography sx={{ display: { xs: 'none', md: 'block' } }}></Typography>
      </Box>

      <Stack spacing={0.5}>
        {paginatedPairs.map((row) => {
          const { id, pair, curr1, curr2, count } = row;
          const name1 = curr1.name;
          const name2 = curr2.name;

          let user1 = curr1.user;
          let user2 = curr2.user;

          if (!user1) user1 = curr1.issuer;
          if (!user2) user2 = curr2.issuer;

          user1 = truncate(user1, 12);
          user2 = truncate(user2, 12);

          // DEX URLs
          let xrpltoDexURL = `/token/${slug}/trade`;

          // Use the MD5 values provided by the API
          let sparkline = '';
          let sparklineToken = null;

          if (id === 1) {
            // For primary pair, show first token's chart
            sparkline = curr1.md5;
            sparklineToken = curr1;
          } else {
            // For all other pairs, show the second token's chart
            if (curr2.currency !== 'XRP' && curr2.md5) {
              sparkline = curr2.md5;
              sparklineToken = curr2;
            } else if (curr1.currency !== 'XRP' && curr1.md5) {
              // Fallback to curr1 if curr2 is XRP
              sparkline = curr1.md5;
              sparklineToken = curr1;
            }
          }

          const volumePercentage = Math.min(100, Math.max(5, (Math.log10(count + 1) / 5) * 100));

          return (
            <PairCard key={pair}>
              <VolumeIndicator volume={volumePercentage} />
              <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: '1fr 1fr',
                      md: '0.5fr 2fr 1.5fr 1.5fr 1fr 1.5fr 1.5fr 0.5fr'
                    },
                    gap: 1.5,
                    alignItems: 'center'
                  }}
                >
                  {/* Rank */}
                  <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                    <Typography
                      variant="body2"
                      fontWeight="600"
                      color="text.primary"
                      sx={{ fontSize: '0.85rem' }}
                    >
                      {id}
                    </Typography>
                  </Box>

                  {/* Pair */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Avatar
                      src={curr1.md5 ? `https://s1.xrpl.to/token/${curr1.md5}` : curr1.currency === 'XRP' ? `https://s1.xrpl.to/token/84e5efeb89c4eae8f68188982dc290d8` : undefined}
                      sx={{ width: 20, height: 20 }}
                    />
                    <Typography
                      variant="body2"
                      fontWeight="600"
                      color="primary.main"
                      sx={{ fontSize: '0.85rem' }}
                    >
                      {name1}
                    </Typography>
                    <Icon
                      icon={arrowsExchange}
                      width="16"
                      height="16"
                      style={{ color: theme.palette.text.secondary }}
                    />
                    <Avatar
                      src={curr2.md5 ? `https://s1.xrpl.to/token/${curr2.md5}` : curr2.currency === 'XRP' ? `https://s1.xrpl.to/token/84e5efeb89c4eae8f68188982dc290d8` : undefined}
                      sx={{ width: 20, height: 20 }}
                    />
                    <Typography
                      variant="body2"
                      fontWeight="600"
                      color="primary.main"
                      sx={{ fontSize: '0.85rem' }}
                    >
                      {name2}
                    </Typography>
                  </Box>

                  {/* Chart */}
                  <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                    <ChartBox darkMode={darkMode} sparkline={sparkline} id={id} isMobile={isMobile} />
                  </Box>

                  {/* Volume */}
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: '0.7rem', display: { xs: 'block', md: 'none' } }}
                    >
                      Volume (24h)
                    </Typography>
                    <Stack spacing={0.5}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography
                          variant="body2"
                          fontWeight="600"
                          color="primary.main"
                          sx={{ fontSize: '0.85rem' }}
                        >
                          {fNumber(curr1.value)}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="primary.main"
                          sx={{ fontSize: '0.75rem' }}
                        >
                          {name1}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography
                          variant="body2"
                          fontWeight="600"
                          color="primary.main"
                          sx={{ fontSize: '0.85rem' }}
                        >
                          {fNumber(curr2.value)}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="primary.main"
                          sx={{ fontSize: '0.75rem' }}
                        >
                          {name2}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>

                  {/* Trades */}
                  <Box>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: '0.7rem', display: { xs: 'block', md: 'none' } }}
                    >
                      Trades (24h)
                    </Typography>
                    <Typography
                      variant="body2"
                      fontWeight="600"
                      color="text.primary"
                      sx={{ fontSize: '0.85rem' }}
                    >
                      {fNumber(count)}
                    </Typography>
                  </Box>

                  {/* Issuer */}
                  <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                    <Stack spacing={0.5}>
                      {id === 1 && (
                        <Link
                          href={`https://bithomp.com/explorer/${curr1.issuer}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            textDecoration: 'none',
                            color: 'primary.main',
                            fontWeight: '500',
                            fontSize: '0.8rem',
                            '&:hover': {
                              textDecoration: 'underline',
                              color: 'primary.dark'
                            }
                          }}
                        >
                          {user1}
                        </Link>
                      )}
                      {curr2.issuer && curr2.issuer !== 'XRPL' && (
                        <Link
                          href={`https://bithomp.com/explorer/${curr2.issuer}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            textDecoration: 'none',
                            color: 'primary.main',
                            fontWeight: '500',
                            fontSize: '0.8rem',
                            '&:hover': {
                              textDecoration: 'underline',
                              color: 'primary.dark'
                            }
                          }}
                        >
                          {user2}
                        </Link>
                      )}
                    </Stack>
                  </Box>

                  {/* Domain */}
                  <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                    <Stack spacing={0.5}>
                      {id === 1 && curr1.domain && (
                        <Link
                          href={`https://${curr1.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            textDecoration: 'none',
                            color: 'text.secondary',
                            fontWeight: '500',
                            fontSize: '0.8rem',
                            '&:hover': {
                              textDecoration: 'underline',
                              color: 'text.primary'
                            }
                          }}
                        >
                          {curr1.domain}
                        </Link>
                      )}
                      {curr2.domain && (
                        <Link
                          href={`https://${curr2.domain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{
                            textDecoration: 'none',
                            color: 'text.secondary',
                            fontWeight: '500',
                            fontSize: '0.8rem',
                            '&:hover': {
                              textDecoration: 'underline',
                              color: 'text.primary'
                            }
                          }}
                        >
                          {curr2.domain}
                        </Link>
                      )}
                    </Stack>
                  </Box>

                  {/* Actions */}
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Tooltip title="Trade this pair" arrow>
                      <IconButton
                        size="small"
                        component={Link}
                        href={xrpltoDexURL}
                        sx={{
                          color: `${theme.palette.primary.main} !important`,
                          padding: '4px',
                          '&:hover': {
                            color: `${theme.palette.primary.dark} !important`,
                            backgroundColor:
                              theme.palette.mode === 'dark'
                                ? 'rgba(255, 255, 255, 0.08)'
                                : 'rgba(0, 0, 0, 0.04)',
                            transform: 'scale(1.1)'
                          },
                          '& .MuiSvgIcon-root': {
                            color: `${theme.palette.primary.main} !important`
                          },
                          '&:hover .MuiSvgIcon-root': {
                            color: `${theme.palette.primary.dark} !important`
                          }
                        }}
                      >
                        <OpenInNewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>
              </CardContent>
            </PairCard>
          );
        })}
      </Stack>

      {totalPages > 1 && (
        <Stack direction="row" justifyContent="center" sx={{ mt: 4 }}>
          <StyledPagination
            count={totalPages}
            page={page}
            onChange={(e, newPage) => setPage(newPage)}
            size="large"
            showFirstButton
            showLastButton
          />
        </Stack>
      )}
    </Stack>
  );
}
