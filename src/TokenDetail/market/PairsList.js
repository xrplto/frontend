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
  alpha
} from '@mui/material';

// Iconify
import { Icon } from '@iconify/react';
import arrowsExchange from '@iconify/icons-gg/arrows-exchange';
import InfoIcon from '@mui/icons-material/Info';

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

const ChartCell = ({ darkMode, sparkline, id, isMobile }) => {
  const BASE_URL = process.env.API_URL;
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  return (
    <TableCell
      align="left"
      ref={ref}
      sx={{
        px: isMobile ? '4px' : '12px',
        width: isMobile ? '100px' : '210px',
        minWidth: isMobile ? '100px' : '210px',
        py: isMobile ? '4px' : '12px'
      }}
    >
      {inView ? (
        sparkline ? (
          <Box
            sx={{
              width: isMobile ? '80px' : '180px',
              height: isMobile ? '30px' : '60px',
              borderRadius: '8px',
              overflow: 'hidden',
              border: `1px solid ${
                darkMode ? 'rgba(145, 158, 171, 0.12)' : 'rgba(145, 158, 171, 0.24)'
              }`,
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
                animation: false, // Disable animation for better performance in table
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
              border: `1px solid ${
                darkMode ? 'rgba(145, 158, 171, 0.12)' : 'rgba(145, 158, 171, 0.24)'
              }`,
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
            width: '180px',
            height: '60px',
            borderRadius: '8px',
            backgroundColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        />
      )}
    </TableCell>
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

  return (
    <Stack>
      <Box
        sx={{
          px: isMobile ? 1 : 2,
          py: isMobile ? 1 : 2,
          backgroundColor: 'transparent',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: '700',
            fontSize: isMobile ? '18px' : '24px',
            letterSpacing: '-0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          Trading Pairs
          <span style={badge24hStyle}>24h</span>
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          gap: 1,
          py: 1,
          overflow: 'auto',
          width: '100%',
          backgroundColor: 'transparent',
          backdropFilter: 'none',
          WebkitBackdropFilter: 'none',
          border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
          borderRadius: '12px',
          boxShadow: `
            0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
            0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
            inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`,
          '& > *': {
            scrollSnapAlign: 'center'
          },
          '::-webkit-scrollbar': { display: 'none' }
        }}
        ref={tableRef}
      >
        <Table
          stickyHeader
          sx={{
            '& .MuiTableCell-root': {
              borderBottom: 'none'
            }
          }}
        >
          <StyledTableHead darkMode={darkMode}>
            <TableRow
              sx={{
                '& .MuiTableCell-root': headerCellStyles,
                '& .MuiTableCell-root:nth-of-type(1)': {
                  ...stickyCellStyles.first,
                  ...headerCellStyles
                },
                '& .MuiTableCell-root:nth-of-type(2)': {
                  ...stickyCellStyles.second,
                  ...headerCellStyles
                }
              }}
            >
              <TableCell align="left">
                <Typography variant="inherit" sx={{ fontWeight: '600' }}>
                  Rank
                </Typography>
              </TableCell>

              <TableCell align="left">
                <Tooltip
                  title="Trading pair with exchange icons"
                  placement="top"
                  componentsProps={{
                    tooltip: {
                      sx: {
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? alpha(theme.palette.background.paper, 0.95)
                          : alpha(theme.palette.background.paper, 0.98),
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        fontSize: '12px',
                        fontWeight: '500',
                        boxShadow: `
                          0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
                          0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
                          inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`
                      }
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
                    <Typography variant="inherit" sx={{ fontWeight: '600' }}>
                      Pair
                    </Typography>
                    <SmallInfoIcon isMobile={isMobile} />
                  </Box>
                </Tooltip>
              </TableCell>

              <TableCell align="left">
                <Tooltip
                  title="Price chart for the last 24 hours"
                  placement="top"
                  componentsProps={{
                    tooltip: {
                      sx: {
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? alpha(theme.palette.background.paper, 0.95)
                          : alpha(theme.palette.background.paper, 0.98),
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        fontSize: '12px',
                        fontWeight: '500',
                        boxShadow: `
                          0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
                          0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
                          inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`
                      }
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
                    <Typography variant="inherit" sx={{ fontWeight: '600' }}>
                      Last 24h
                    </Typography>
                    <SmallInfoIcon isMobile={isMobile} />
                  </Box>
                </Tooltip>
              </TableCell>

              <TableCell align="left">
                <Tooltip
                  title="Trading volume in the last 24 hours"
                  placement="top"
                  componentsProps={{
                    tooltip: {
                      sx: {
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? alpha(theme.palette.background.paper, 0.95)
                          : alpha(theme.palette.background.paper, 0.98),
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        fontSize: '12px',
                        fontWeight: '500',
                        boxShadow: `
                          0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
                          0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
                          inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`
                      }
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
                    <Typography variant="inherit" sx={{ fontWeight: '600' }}>
                      Volume
                    </Typography>
                    <span style={badge24hStyle}>24h</span>
                    <SmallInfoIcon isMobile={isMobile} />
                  </Box>
                </Tooltip>
              </TableCell>

              <TableCell align="left">
                <Tooltip
                  title="Number of trades in the last 24 hours"
                  placement="top"
                  componentsProps={{
                    tooltip: {
                      sx: {
                        backgroundColor: theme.palette.mode === 'dark' 
                          ? alpha(theme.palette.background.paper, 0.95)
                          : alpha(theme.palette.background.paper, 0.98),
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                        fontSize: '12px',
                        fontWeight: '500',
                        boxShadow: `
                          0 8px 32px ${alpha(theme.palette.common.black, 0.12)}, 
                          0 1px 2px ${alpha(theme.palette.common.black, 0.04)},
                          inset 0 1px 1px ${alpha(theme.palette.common.white, 0.1)}`
                      }
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
                    <Typography variant="inherit" sx={{ fontWeight: '600' }}>
                      Trades
                    </Typography>
                    <span style={badge24hStyle}>24h</span>
                    <SmallInfoIcon isMobile={isMobile} />
                  </Box>
                </Tooltip>
              </TableCell>

              {!isMobile && (
                <>
                  <TableCell align="left">
                    <Tooltip
                      title="Token issuer addresses"
                      placement="top"
                      componentsProps={{
                        tooltip: {
                          sx: {
                            backgroundColor: 'rgba(0, 0, 0, 0.9)',
                            fontSize: '12px',
                            fontWeight: '500'
                          }
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
                        <Typography variant="inherit" sx={{ fontWeight: '600' }}>
                          Issuer
                        </Typography>
                        <SmallInfoIcon isMobile={isMobile} />
                      </Box>
                    </Tooltip>
                  </TableCell>

                  <TableCell align="left">
                    <Tooltip
                      title="Token issuer domain"
                      placement="top"
                      componentsProps={{
                        tooltip: {
                          sx: {
                            backgroundColor: 'rgba(0, 0, 0, 0.9)',
                            fontSize: '12px',
                            fontWeight: '500'
                          }
                        }
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
                        <Typography variant="inherit" sx={{ fontWeight: '600' }}>
                          Domain
                        </Typography>
                        <SmallInfoIcon isMobile={isMobile} />
                      </Box>
                    </Tooltip>
                  </TableCell>
                </>
              )}

            </TableRow>
          </StyledTableHead>

          <TableBody>
            {pairs.map((row) => {
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
              let soloDexURL = `https://sologenic.org/trade?network=mainnet&market=${curr1.currency}%2B${curr1.issuer}%2F${curr2.currency}`;
              if (curr2.currency !== 'XRP') soloDexURL += `%2B${curr2.issuer}`;

              let gatehubDexURL = `https://gatehub.net/markets/${curr1.currency}+${curr1.issuer}/${curr2.currency}`;
              if (curr2.currency !== 'XRP') gatehubDexURL += `+${curr2.issuer}`;

              let xpmarketDexURL = `https://xpmarket.com/dex/${curr1.name}+${curr1.issuer}/${curr2.currency}`;
              if (curr2.currency !== 'XRP') xpmarketDexURL += `+${curr2.issuer}`;

              let magneticDexURL = `https://xmagnetic.org/dex/${curr1.name}+${curr1.issuer}_${curr2.currency}+${curr2.currency}`;
              if (curr2.currency !== 'XRP') magneticDexURL += `+${curr2.issuer}`;

              let xummDexURL = `https://xumm.app/detect/xapp:xumm.dex?issuer=${curr1.issuer}&currency=${curr1.currency}`;

              let unhostedDexURL = `https://unhosted.exchange/?base=${curr1.currency}_${curr1.issuer}&quote=XRP`;

              let xrpltoDexURL = `/token/${slug}/trade`;

              // Use the MD5 values provided by the API - they're already correct!
              let sparkline = '';
              let sparklineToken = null;

              // Debug: Log the available MD5 values
              /* console.log(
                `Pair ${id}: curr1(${curr1.name})=${curr1.md5}, curr2(${curr2.name})=${curr2.md5}`
              ); */

              if (id === 1) {
                // For primary pair (SOLO/XRP), show SOLO's chart
                sparkline = curr1.md5;
                sparklineToken = curr1;
              } else {
                // For all other pairs, show the second token's chart (not SOLO)
                if (curr2.currency !== 'XRP' && curr2.md5) {
                  sparkline = curr2.md5;
                  sparklineToken = curr2;
                } else if (curr1.currency !== 'XRP' && curr1.md5) {
                  // Fallback to curr1 if curr2 is XRP
                  sparkline = curr1.md5;
                  sparklineToken = curr1;
                }
              }

              /* console.log(
                `Selected sparkline for pair ${id}: ${sparkline} (${sparklineToken?.name})`
              ); */

              return (
                <StyledTableRow key={pair} darkMode={darkMode} isMobile={isMobile}>
                  <TableCell align="left" sx={stickyCellStyles.first}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: '600',
                        fontSize: isMobile ? '13px' : '16px',
                        color: darkMode ? '#fff' : '#212B36'
                      }}
                    >
                      {fNumber(id)}
                    </Typography>
                  </TableCell>

                  <TableCell align="left" sx={stickyCellStyles.second}>
                    <Stack direction="row" alignItems="center" spacing={isMobile ? 0.25 : 1}>
                      <Avatar
                        src={curr1.md5 ? `https://s1.xrpl.to/token/${curr1.md5}` : curr1.currency === 'XRP' ? `https://s1.xrpl.to/token/84e5efeb89c4eae8f68188982dc290d8` : undefined}
                        sx={{ 
                          width: isMobile ? 14 : 20, 
                          height: isMobile ? 14 : 20,
                          mr: isMobile ? 0.25 : 0.5
                        }}
                      />
                      <Typography
                        variant="subtitle1"
                        sx={{
                          color: '#B72136',
                          fontWeight: '600',
                          fontSize: isMobile ? '11px' : '15px'
                        }}
                      >
                        {name1}
                      </Typography>
                      <Icon
                        icon={arrowsExchange}
                        width={isMobile ? "12" : "18"}
                        height={isMobile ? "12" : "18"}
                        style={{ color: darkMode ? '#919EAB' : '#637381' }}
                      />
                      <Avatar
                        src={curr2.md5 ? `https://s1.xrpl.to/token/${curr2.md5}` : curr2.currency === 'XRP' ? `https://s1.xrpl.to/token/84e5efeb89c4eae8f68188982dc290d8` : undefined}
                        sx={{ 
                          width: isMobile ? 14 : 20, 
                          height: isMobile ? 14 : 20,
                          mr: isMobile ? 0.25 : 0.5
                        }}
                      />
                      <Typography
                        variant="subtitle1"
                        sx={{
                          color: darkMode ? '#00AB55' : '#5569ff',
                          fontWeight: '600',
                          fontSize: isMobile ? '11px' : '15px'
                        }}
                      >
                        {name2}
                      </Typography>
                    </Stack>
                  </TableCell>

                  <ChartCell darkMode={darkMode} sparkline={sparkline} id={id} isMobile={isMobile} />

                  <TableCell align="left" sx={{ padding: isMobile ? '8px 4px' : '16px 12px' }}>
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography
                          variant="subtitle1"
                          sx={{
                            color: '#B72136',
                            fontWeight: '600',
                            fontSize: isMobile ? '12px' : '15px'
                          }}
                        >
                          {fNumber(curr1.value)}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#B72136',
                            fontWeight: '500',
                            fontSize: isMobile ? '10px' : '12px'
                          }}
                        >
                          {name1}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography
                          variant="subtitle1"
                          sx={{
                            color: darkMode ? '#00AB55' : '#5569ff',
                            fontWeight: '600',
                            fontSize: isMobile ? '12px' : '15px'
                          }}
                        >
                          {fNumber(curr2.value)}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: darkMode ? '#00AB55' : '#5569ff',
                            fontWeight: '500',
                            fontSize: isMobile ? '10px' : '12px'
                          }}
                        >
                          {name2}
                        </Typography>
                      </Stack>
                    </Stack>
                  </TableCell>

                  <TableCell align="left" sx={{ padding: isMobile ? '8px 4px' : '16px 12px' }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: '600',
                        fontSize: isMobile ? '13px' : '16px',
                        color: darkMode ? '#fff' : '#212B36'
                      }}
                    >
                      {fNumber(count)}
                    </Typography>
                  </TableCell>

                  {!isMobile && (
                    <>
                      <TableCell align="left" sx={{ padding: isMobile ? '8px 4px' : '16px 12px' }}>
                        <Stack spacing={0.5}>
                          {id === 1 && (
                            <Stack direction="row" alignItems="center">
                              <Link
                                underline="none"
                                color="inherit"
                                target="_blank"
                                href={`https://bithomp.com/explorer/${curr1.issuer}`}
                                rel="noreferrer noopener nofollow"
                                sx={{
                                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                  '&:hover': {
                                    transform: 'translateX(2px)'
                                  }
                                }}
                              >
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    color: '#B72136',
                                    fontWeight: '500',
                                    fontSize: isMobile ? '11px' : '13px',
                                    fontFamily: 'monospace',
                                    '&:hover': {
                                      color: '#8B1730'
                                    }
                                  }}
                                >
                                  {user1}
                                </Typography>
                              </Link>
                            </Stack>
                          )}
                          {curr2.issuer && curr2.issuer !== 'XRPL' && (
                            <Stack direction="row" alignItems="center">
                              <Link
                                underline="none"
                                color="inherit"
                                target="_blank"
                                href={`https://bithomp.com/explorer/${curr2.issuer}`}
                                rel="noreferrer noopener nofollow"
                                sx={{
                                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                  '&:hover': {
                                    transform: 'translateX(2px)'
                                  }
                                }}
                              >
                                <Typography
                                  variant="subtitle2"
                                  sx={{
                                    color: darkMode ? '#00AB55' : '#5569ff',
                                    fontWeight: '500',
                                    fontSize: isMobile ? '11px' : '13px',
                                    fontFamily: 'monospace',
                                    '&:hover': {
                                      color: darkMode ? '#007B3C' : '#3A4FCC'
                                    }
                                  }}
                                >
                                  {user2}
                                </Typography>
                              </Link>
                            </Stack>
                          )}
                        </Stack>
                      </TableCell>

                      <TableCell align="left" sx={{ padding: isMobile ? '8px 4px' : '16px 12px' }}>
                        <Stack spacing={0.5}>
                          {id === 1 && curr1.domain && (
                            <Link
                              underline="none"
                              color="inherit"
                              target="_blank"
                              href={`https://${curr1.domain}`}
                              rel="noreferrer noopener nofollow"
                              sx={{
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                  transform: 'translateX(2px)'
                                }
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  color: '#B72136',
                                  fontWeight: '500',
                                  fontSize: isMobile ? '11px' : '14px',
                                  '&:hover': {
                                    color: '#8B1730'
                                  }
                                }}
                              >
                                {curr1.domain}
                              </Typography>
                            </Link>
                          )}
                          {curr2.domain && (
                            <Link
                              underline="none"
                              color="inherit"
                              target="_blank"
                              href={`https://${curr2.domain}`}
                              rel="noreferrer noopener nofollow"
                              sx={{
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                '&:hover': {
                                  transform: 'translateX(2px)'
                                }
                              }}
                            >
                              <Typography
                                variant="subtitle2"
                                sx={{
                                  color: darkMode ? '#00AB55' : '#5569ff',
                                  fontWeight: '500',
                                  fontSize: isMobile ? '11px' : '14px',
                                  '&:hover': {
                                    color: darkMode ? '#007B3C' : '#3A4FCC'
                                  }
                                }}
                              >
                                {curr2.domain}
                              </Typography>
                            </Link>
                          )}
                        </Stack>
                      </TableCell>
                    </>
                  )}

                </StyledTableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
    </Stack>
  );
}
