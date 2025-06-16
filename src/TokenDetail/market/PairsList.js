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
  useTheme
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
import { LazyLoadComponent } from 'react-lazy-load-image-component';

// ----------------------------------------------------------------------
import StackStyle from 'src/components/StackStyle'; //Maybe need to disable?
import LoadChart from 'src/components/LoadChart';

// ----------------------------------------------------------------------

const SmallInfoIcon = (props) => (
  <InfoIcon
    {...props}
    sx={{
      fontSize: '14px',
      ml: 0.5,
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
  fontSize: '10px',
  fontWeight: '600',
  lineHeight: '16px',
  backgroundColor: 'rgba(99, 115, 129, 0.12)',
  backdropFilter: 'blur(6px)',
  borderRadius: '6px',
  padding: '2px 6px',
  border: '1px solid rgba(145, 158, 171, 0.08)'
};

const badgeDEXStyle = {
  display: 'inline-block',
  marginLeft: '4px',
  marginRight: '4px',
  color: '#fff',
  fontSize: '10px',
  fontWeight: '600',
  lineHeight: '16px',
  backgroundColor: 'rgba(183, 129, 3, 0.12)',
  backdropFilter: 'blur(6px)',
  borderRadius: '6px',
  padding: '2px 6px',
  border: '1px solid rgba(183, 129, 3, 0.24)'
};

const StyledTableHead = styled(TableHead, {
  shouldForwardProp: (prop) => prop !== 'darkMode'
})(({ theme, darkMode }) => ({
  position: 'sticky',
  zIndex: 999,
  top: 0,
  background: darkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(20px)',
  borderBottom: `1px solid ${darkMode ? 'rgba(145, 158, 171, 0.12)' : 'rgba(145, 158, 171, 0.24)'}`,
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: `linear-gradient(90deg, transparent, ${
      darkMode ? 'rgba(145, 158, 171, 0.12)' : 'rgba(145, 158, 171, 0.24)'
    }, transparent)`
  }
}));

const StyledTableRow = styled(TableRow, {
  shouldForwardProp: (prop) => prop !== 'darkMode'
})(({ theme, darkMode }) => ({
  borderBottom: '1px solid rgba(145, 158, 171, 0.08)',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    '& .MuiTableCell-root': {
      backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(145, 158, 171, 0.04)',
      backdropFilter: 'blur(6px)'
    },
    cursor: 'pointer',
    transform: 'translateY(-1px)',
    boxShadow: darkMode ? '0 4px 16px rgba(0, 0, 0, 0.24)' : '0 4px 16px rgba(145, 158, 171, 0.16)'
  },
  '& .MuiTableCell-root': {
    padding: '16px 12px',
    whiteSpace: 'nowrap',
    borderBottom: 'none',
    fontSize: '14px',
    fontWeight: '500',
    '&:not(:first-of-type)': {
      paddingLeft: '8px'
    }
  }
}));

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
      background: darkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      width: '60px',
      minWidth: '60px',
      padding: '16px 12px'
    },
    second: {
      position: 'sticky',
      zIndex: 1002,
      left: '60px',
      background: darkMode ? 'rgba(0, 0, 0, 0.95)' : 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      padding: '16px 12px',
      '&:before': scrollLeft
        ? {
            content: "''",
            boxShadow: 'inset 10px 0 8px -8px rgba(145, 158, 171, 0.24)',
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
    fontSize: isMobile ? '12px' : '13px',
    fontWeight: '600',
    padding: isMobile ? '16px 8px' : '20px 12px',
    height: 'auto',
    whiteSpace: 'nowrap',
    color: darkMode ? '#919EAB' : '#637381',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
    borderBottom: 'none',
    '&:not(:first-of-type)': {
      paddingLeft: '8px'
    }
  };

  return (
    <Stack>
      <Box
        sx={{
          px: 2,
          py: 2,
          borderBottom: `1px solid ${
            darkMode ? 'rgba(145, 158, 171, 0.12)' : 'rgba(145, 158, 171, 0.24)'
          }`
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: '700',
            fontSize: isMobile ? '20px' : '24px',
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
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        fontSize: '12px',
                        fontWeight: '500'
                      }
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
                    <Typography variant="inherit" sx={{ fontWeight: '600' }}>
                      Pair
                    </Typography>
                    <SmallInfoIcon />
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
                    <SmallInfoIcon />
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
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        fontSize: '12px',
                        fontWeight: '500'
                      }
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
                    <Typography variant="inherit" sx={{ fontWeight: '600' }}>
                      Last 24h
                    </Typography>
                    <SmallInfoIcon />
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
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        fontSize: '12px',
                        fontWeight: '500'
                      }
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
                    <Typography variant="inherit" sx={{ fontWeight: '600' }}>
                      Volume
                    </Typography>
                    <span style={badge24hStyle}>24h</span>
                    <SmallInfoIcon />
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
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        fontSize: '12px',
                        fontWeight: '500'
                      }
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', cursor: 'help' }}>
                    <Typography variant="inherit" sx={{ fontWeight: '600' }}>
                      Trades
                    </Typography>
                    <span style={badge24hStyle}>24h</span>
                    <SmallInfoIcon />
                  </Box>
                </Tooltip>
              </TableCell>

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
                    <SmallInfoIcon />
                  </Box>
                </Tooltip>
              </TableCell>

              <TableCell align="left">
                <Tooltip
                  title="Available decentralized exchanges for trading"
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
                    <span style={badgeDEXStyle}>DEX</span>
                    <SmallInfoIcon />
                  </Box>
                </Tooltip>
              </TableCell>
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
              console.log(
                `Pair ${id}: curr1(${curr1.name})=${curr1.md5}, curr2(${curr2.name})=${curr2.md5}`
              );

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

              console.log(
                `Selected sparkline for pair ${id}: ${sparkline} (${sparklineToken?.name})`
              );

              return (
                <StyledTableRow key={pair} darkMode={darkMode}>
                  <TableCell align="left" sx={stickyCellStyles.first}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: '600',
                        fontSize: '16px',
                        color: darkMode ? '#fff' : '#212B36'
                      }}
                    >
                      {fNumber(id)}
                    </Typography>
                  </TableCell>

                  <TableCell align="left" sx={stickyCellStyles.second}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          color: '#B72136',
                          fontWeight: '600',
                          fontSize: '15px'
                        }}
                      >
                        {name1}
                      </Typography>
                      <Icon
                        icon={arrowsExchange}
                        width="18"
                        height="18"
                        style={{ color: darkMode ? '#919EAB' : '#637381' }}
                      />
                      <Typography
                        variant="subtitle1"
                        sx={{
                          color: darkMode ? '#00AB55' : '#5569ff',
                          fontWeight: '600',
                          fontSize: '15px'
                        }}
                      >
                        {name2}
                      </Typography>
                    </Stack>
                  </TableCell>

                  <TableCell align="left" sx={{ padding: '16px 12px' }}>
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

                  <TableCell
                    align="left"
                    sx={{
                      px: '12px',
                      width: '210px',
                      minWidth: '210px',
                      py: '12px'
                    }}
                  >
                    {sparkline ? (
                      <LazyLoadComponent
                        threshold={100}
                        placeholder={
                          <Box
                            sx={{
                              width: '180px',
                              height: '60px',
                              borderRadius: '8px',
                              backgroundColor: darkMode
                                ? 'rgba(255, 255, 255, 0.02)'
                                : 'rgba(145, 158, 171, 0.04)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          />
                        }
                      >
                        <Box
                          sx={{
                            width: '180px',
                            height: '60px',
                            borderRadius: '8px',
                            overflow: 'hidden',
                            border: `1px solid ${
                              darkMode ? 'rgba(145, 158, 171, 0.12)' : 'rgba(145, 158, 171, 0.24)'
                            }`,
                            backgroundColor: darkMode
                              ? 'rgba(255, 255, 255, 0.02)'
                              : 'rgba(255, 255, 255, 0.8)',
                            position: 'relative',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            '&:hover': {
                              transform: 'scale(1.02)',
                              borderColor: darkMode
                                ? 'rgba(145, 158, 171, 0.24)'
                                : 'rgba(145, 158, 171, 0.48)'
                            }
                          }}
                        >
                          <LoadChart
                            url={(() => {
                              const url = `${BASE_URL}/sparkline/${sparkline}?period=24h`;
                              console.log(`LoadChart URL for pair ${id}: ${url}`);
                              return url;
                            })()}
                            showGradient={true}
                            lineWidth={2}
                            style={{
                              width: '100%',
                              height: '100%'
                            }}
                            opts={{
                              renderer: 'svg',
                              width: 180,
                              height: 60,
                              animation: false, // Disable animation for better performance in table
                              devicePixelRatio: window.devicePixelRatio || 1
                            }}
                          />
                        </Box>
                      </LazyLoadComponent>
                    ) : (
                      <Box
                        sx={{
                          width: '180px',
                          height: '60px',
                          borderRadius: '8px',
                          border: `1px solid ${
                            darkMode ? 'rgba(145, 158, 171, 0.12)' : 'rgba(145, 158, 171, 0.24)'
                          }`,
                          backgroundColor: darkMode
                            ? 'rgba(255, 255, 255, 0.02)'
                            : 'rgba(255, 255, 255, 0.4)',
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
                          {curr1.currency === 'XRP' && curr2.currency === 'XRP'
                            ? 'XRP/XRP Pair'
                            : 'No Chart Data'}
                        </Typography>
                      </Box>
                    )}
                  </TableCell>

                  <TableCell align="left" sx={{ padding: '16px 12px' }}>
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography
                          variant="subtitle1"
                          sx={{
                            color: '#B72136',
                            fontWeight: '600',
                            fontSize: '15px'
                          }}
                        >
                          {fNumber(curr1.value)}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#B72136',
                            fontWeight: '500',
                            fontSize: '12px'
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
                            fontSize: '15px'
                          }}
                        >
                          {fNumber(curr2.value)}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: darkMode ? '#00AB55' : '#5569ff',
                            fontWeight: '500',
                            fontSize: '12px'
                          }}
                        >
                          {name2}
                        </Typography>
                      </Stack>
                    </Stack>
                  </TableCell>

                  <TableCell align="left" sx={{ padding: '16px 12px' }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: '600',
                        fontSize: '16px',
                        color: darkMode ? '#fff' : '#212B36'
                      }}
                    >
                      {fNumber(count)}
                    </Typography>
                  </TableCell>

                  <TableCell align="left" sx={{ padding: '16px 12px' }}>
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
                                fontSize: '13px',
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
                                fontSize: '13px',
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

                  <TableCell align="left" sx={{ padding: '16px 12px' }}>
                    <Stack direction="row" spacing={1} flexWrap="wrap" alignItems="center">
                      <Tooltip title="Trade on xrpl.to">
                        <Link
                          underline="none"
                          color="inherit"
                          href={xrpltoDexURL}
                          rel="noreferrer noopener nofollow"
                        >
                          <IconButton
                            edge="end"
                            aria-label="xrpl.to"
                            sx={{
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              '&:hover': {
                                transform: 'scale(1.1)',
                                backgroundColor: darkMode
                                  ? 'rgba(255, 255, 255, 0.08)'
                                  : 'rgba(145, 158, 171, 0.08)'
                              }
                            }}
                          >
                            <Avatar
                              alt="xrpl.to DEX"
                              src={
                                darkMode
                                  ? '/static/sponsor-dark-theme.svg'
                                  : '/static/sponsor-light-theme.svg'
                              }
                              sx={{ width: 28, height: 28 }}
                            />
                          </IconButton>
                        </Link>
                      </Tooltip>

                      <Tooltip title="Trade on Sologenic">
                        <Link
                          underline="none"
                          color="inherit"
                          target="_blank"
                          href={soloDexURL}
                          rel="noreferrer noopener nofollow"
                        >
                          <IconButton
                            edge="end"
                            aria-label="solo"
                            sx={{
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              '&:hover': {
                                transform: 'scale(1.1)',
                                backgroundColor: darkMode
                                  ? 'rgba(255, 255, 255, 0.08)'
                                  : 'rgba(145, 158, 171, 0.08)'
                              }
                            }}
                          >
                            <Avatar
                              alt="Sologenic DEX"
                              src="/static/solo.webp"
                              sx={{ width: 28, height: 28 }}
                            />
                          </IconButton>
                        </Link>
                      </Tooltip>

                      <Tooltip title="Trade on XUMM">
                        <Link
                          underline="none"
                          color="inherit"
                          target="_blank"
                          href={xummDexURL}
                          rel="noreferrer noopener nofollow"
                        >
                          <IconButton
                            edge="end"
                            aria-label="xumm"
                            sx={{
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              '&:hover': {
                                transform: 'scale(1.1)',
                                backgroundColor: darkMode
                                  ? 'rgba(255, 255, 255, 0.08)'
                                  : 'rgba(145, 158, 171, 0.08)'
                              }
                            }}
                          >
                            <Avatar
                              alt="XUMM DEX"
                              src="/static/xumm.webp"
                              sx={{ width: 28, height: 28 }}
                            />
                          </IconButton>
                        </Link>
                      </Tooltip>

                      <Tooltip title="Trade on GateHub">
                        <Link
                          underline="none"
                          color="inherit"
                          target="_blank"
                          href={gatehubDexURL}
                          rel="noreferrer noopener nofollow"
                        >
                          <IconButton
                            edge="end"
                            aria-label="gatehub"
                            sx={{
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              '&:hover': {
                                transform: 'scale(1.1)',
                                backgroundColor: darkMode
                                  ? 'rgba(255, 255, 255, 0.08)'
                                  : 'rgba(145, 158, 171, 0.08)'
                              }
                            }}
                          >
                            <Avatar
                              alt="Gatehub DEX"
                              src="/static/gatehub.webp"
                              sx={{ width: 28, height: 28 }}
                            />
                          </IconButton>
                        </Link>
                      </Tooltip>

                      <Tooltip title="Trade on XPMarket">
                        <Link
                          underline="none"
                          color="inherit"
                          target="_blank"
                          href={xpmarketDexURL}
                          rel="noreferrer noopener nofollow"
                        >
                          <IconButton
                            edge="end"
                            aria-label="xpmarket"
                            sx={{
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              '&:hover': {
                                transform: 'scale(1.1)',
                                backgroundColor: darkMode
                                  ? 'rgba(255, 255, 255, 0.08)'
                                  : 'rgba(145, 158, 171, 0.08)'
                              }
                            }}
                          >
                            <Avatar
                              alt="xpmarket DEX"
                              src="/static/xpmarket.webp"
                              sx={{ width: 28, height: 28 }}
                            />
                          </IconButton>
                        </Link>
                      </Tooltip>

                      <Tooltip title="Trade on Magnetic X">
                        <Link
                          underline="none"
                          color="inherit"
                          target="_blank"
                          href={magneticDexURL}
                          rel="noreferrer noopener nofollow"
                        >
                          <IconButton
                            edge="end"
                            aria-label="magnetic"
                            sx={{
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              '&:hover': {
                                transform: 'scale(1.1)',
                                backgroundColor: darkMode
                                  ? 'rgba(255, 255, 255, 0.08)'
                                  : 'rgba(145, 158, 171, 0.08)'
                              }
                            }}
                          >
                            <Avatar
                              alt="Magnetic DEX"
                              src="/static/magnetic.webp"
                              sx={{ width: 28, height: 28 }}
                            />
                          </IconButton>
                        </Link>
                      </Tooltip>

                      <Tooltip title="Trade on Unhosted">
                        <Link
                          underline="none"
                          color="inherit"
                          target="_blank"
                          href={unhostedDexURL}
                          rel="noreferrer noopener nofollow"
                        >
                          <IconButton
                            edge="end"
                            aria-label="unhosted"
                            sx={{
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                              '&:hover': {
                                transform: 'scale(1.1)',
                                backgroundColor: darkMode
                                  ? 'rgba(255, 255, 255, 0.08)'
                                  : 'rgba(145, 158, 171, 0.08)'
                              }
                            }}
                          >
                            <Avatar
                              alt="Unhosted DEX"
                              src="/static/unhosted-dex.webp"
                              sx={{ width: 28, height: 28 }}
                            />
                          </IconButton>
                        </Link>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </StyledTableRow>
              );
            })}
          </TableBody>
        </Table>
      </Box>
    </Stack>
  );
}
