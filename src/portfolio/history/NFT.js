import axios from 'axios';
import { useState, useEffect, useContext } from 'react';
import { formatDistanceToNow } from 'date-fns';

// Material
import {
  useTheme,
  Avatar,
  Box,
  Container,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  alpha,
  useMediaQuery,
  IconButton,
  Select,
  MenuItem
} from '@mui/material';
import { tableCellClasses } from '@mui/material/TableCell';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { KeyboardArrowLeft, KeyboardArrowRight } from '@mui/icons-material';

// Utils
import { Activity } from 'src/utils/constants';
import { normalizeAmount } from 'src/utils/normalizers';

// Context
import { AppContext } from 'src/AppContext';

// Loader
import { PulseLoader } from 'react-spinners';

// Components
import FlagsContainer from 'src/components/Flags';

// ----------------------------------------------------------------------
export default function NFTHistory({ account }) {
  const theme = useTheme();
  const { darkMode } = useContext(AppContext);
  const BASE_URL = 'https://api.xrpnft.com/api';
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const [page, setPage] = useState(0);
  const [rows, setRows] = useState(10);
  const [total, setTotal] = useState(0);
  const [acts, setActs] = useState([]);
  const [nftDetails, setNftDetails] = useState({});

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getActivities = async () => {
      setLoading(true);
      try {
        const { status, data } = await axios.get(`${BASE_URL}/account/activity`, {
          params: { account, page, limit: rows }
        });
        if (status === 200 && data) {
          setTotal(data.total);
          setActs(data.acts);
        }
      } catch (err) {
        console.error('Error on getting activity list!!!', err);
      } finally {
        setLoading(false);
      }
    };
    getActivities();
  }, [account, page, rows]);

  const fetchNFTDetails = async (NFTokenID) => {
    try {
      const response = await axios.get(`${BASE_URL}/nft/${NFTokenID}`);
      console.log('Fetched NFT Details:', response.data.nft);
      if (response.data.nft && response.data.nft.NFTokenID === NFTokenID) {
        setNftDetails((prevDetails) => {
          const newDetails = {
            ...prevDetails,
            [NFTokenID]: response.data.nft
          };
          console.log('Updated NFT Details:', newDetails);
          return newDetails;
        });
      } else {
        console.error('Fetched NFT does not match requested NFTokenID');
      }
    } catch (error) {
      console.error('Error fetching NFT details:', error);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRows(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedActs = acts.slice(page * rows, page * rows + rows);

  const renderNFTPreview = (nft) => {
    if (!nft) return null;

    const getImageUrl = (nft) => {
      if (nft.files && nft.files.length > 0) {
        const fileWithThumbnail = nft.files.find((file) => file.thumbnail);
        if (fileWithThumbnail) {
          const thumbnailUrl = fileWithThumbnail.thumbnail.big || fileWithThumbnail.thumbnail.small;
          if (thumbnailUrl) {
            return `https://s2.xrpnft.com/d1/${thumbnailUrl}`;
          }
        }
      }

      if (nft.thumbnail && nft.thumbnail.image) {
        return `https://s2.xrpnft.com/d1/${nft.thumbnail.image}`;
      }

      if (nft.dfile && nft.dfile.image) {
        return `https://s2.xrpnft.com/d1/${nft.dfile.image}`;
      }

      return null;
    };

    const imageUrl = getImageUrl(nft);

    if (imageUrl) {
      return (
        <img
          src={imageUrl}
          alt={nft.name || 'NFT'}
          style={{
            width: '24px',
            height: '24px',
            objectFit: 'contain',
            borderRadius: '2px'
          }}
          onError={(e) => {
            console.error('Error loading NFT image:', e);
            e.target.src = '/path/to/fallback/image.png';
          }}
        />
      );
    }

    return (
      <Box
        sx={{
          width: '24px',
          height: '24px',
          backgroundColor: 'grey.300',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '2px'
        }}
      >
        <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
          N
        </Typography>
      </Box>
    );
  };

  const renderActivityDetails = (activity, data) => {
    switch (activity) {
      case Activity.CREATE_COLLECTION:
      case Activity.IMPORT_COLLECTION:
      case Activity.UPDATE_COLLECTION:
        return (
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minHeight: '24px' }}>
            <Avatar
              alt="C"
              src={`https://s1.xrpnft.com/collection/${data.logo}`}
              sx={{ width: 16, height: 16 }}
            />
            <Typography variant="s7" sx={{ fontSize: '0.75rem', lineHeight: 1 }}>
              {data.name}
            </Typography>
          </Stack>
        );
      case Activity.MINT_BULK:
        return (
          <Stack
            direction="row"
            spacing={0.5}
            justifyContent="space-between"
            alignItems="center"
            sx={{ minHeight: '24px' }}
          >
            <Stack direction="row" spacing={0.5}>
              <Avatar
                alt="C"
                src={`https://gateway.xrpnft.com/ipfs/${data.meta.image}`}
                sx={{ width: 16, height: 16 }}
              />
              <Typography variant="s7" sx={{ fontSize: '0.75rem', lineHeight: 1 }}>
                {data.cname || 'N/A'}
              </Typography>
            </Stack>
            <FlagsContainer Flags={data.flag} />
          </Stack>
        );
      case Activity.BUY_MINT:
        return (
          <Stack direction="row" spacing={0.5} justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={0.5}>
              <Avatar
                alt="C"
                src={`https://s1.xrpl.to/token/${data.cost?.md5}`}
                sx={{ width: 18, height: 18 }}
              />
              <Stack spacing={0}>
                <Typography variant="s7" sx={{ fontSize: '0.75rem' }}>
                  {data.cname}
                </Typography>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Typography variant="caption" color="#EB5757" sx={{ fontSize: '0.7rem' }}>
                    {data.cost?.amount}
                  </Typography>
                  <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                    {data.cost?.name}
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
              Qty: {data.quantity}
            </Typography>
          </Stack>
        );
      case Activity.CREATE_SELL_OFFER:
      case Activity.CREATE_BUY_OFFER:
      case Activity.CANCEL_SELL_OFFER:
      case Activity.CANCEL_BUY_OFFER:
      case Activity.ACCEPT_BUY_OFFER:
      case Activity.ACCEPT_SELL_OFFER:
      case Activity.OWNER_ACCPETED_YOUR_BUY_OFFER:
      case Activity.BUYER_ACCEPTED_YOUR_SELL_OFFER:
      case Activity.BROKER_ACCEPTED_YOUR_BUY_OFFER:
      case Activity.BROKER_ACCEPTED_YOUR_SELL_OFFER:
      case Activity.YOU_RECEIVED_A_NFT:
        if (!nftDetails[data.NFTokenID]) {
          fetchNFTDetails(data.NFTokenID);
        }
        const nft = nftDetails[data.NFTokenID];

        return (
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ minHeight: '24px' }}>
            {nft ? renderNFTPreview(nft) : <Box sx={{ width: 24, height: 24 }} />}
            <Stack spacing={0}>
              <Typography variant="s7" sx={{ fontSize: '0.75rem', lineHeight: 1 }}>
                {nft?.collection || 'N/A'}
              </Typography>
              <Typography variant="s7" sx={{ fontSize: '0.75rem', lineHeight: 1 }}>
                {nft?.name || 'N/A'}
              </Typography>
            </Stack>
          </Stack>
        );
      case Activity.MINT_NFT:
        return data.meta ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <Avatar
              alt="C"
              src={`https://gateway.xrpnft.com/ipfs/${data.meta.image}`}
              sx={{ width: 24, height: 24 }}
            />
            <Stack>
              <Typography variant="s7">{data.collection || 'N/A'}</Typography>
              <Typography variant="s7">{data.name || 'N/A'}</Typography>
            </Stack>
          </Stack>
        ) : (
          <Typography variant="s7">{data.NFTokenID}</Typography>
        );
      case Activity.BURN_NFT:
        return <Typography variant="s7">{data.NFTokenID}</Typography>;
      case Activity.SET_NFT_MINTER:
        return (
          <Stack direction="row" spacing={1}>
            <Typography variant="s7">Minter: </Typography>
            <Typography variant="s8">{data.NFTokenMinter}</Typography>
          </Stack>
        );
      case Activity.REFUND_BUYER:
        const amount = normalizeAmount(data.amount);
        return (
          <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
            <Stack direction="row" spacing={1}>
              <Avatar
                alt="C"
                src={`https://s1.xrpl.to/token/${data.cost?.md5}`}
                sx={{ width: 24, height: 24 }}
              />
              <Stack>
                <Stack direction="row" spacing={1}>
                  <Typography variant="s7">Collection: </Typography>
                  <Typography variant="s8">{data.cname}</Typography>
                </Stack>
                <Stack direction="row" spacing={0.8} alignItems="center">
                  <Typography variant="s7">Cost x Quantity: </Typography>
                  <Typography variant="s8">{data.cost?.amount}</Typography>
                  <Typography variant="s8">{data.cost?.name}</Typography>
                  <Typography variant="s8">x</Typography>
                  <Typography variant="s8">{data.quantity}</Typography>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Typography variant="s7">To: </Typography>
                  <Typography variant="s8">{data.dest}</Typography>
                </Stack>
              </Stack>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Stack direction="row" spacing={1}>
                <Typography variant="s7">Amount: </Typography>
                <Typography variant="s8">{amount.amount}</Typography>
                <Typography variant="s8">{data.cost?.name}</Typography>
              </Stack>
            </Stack>
          </Stack>
        );
      default:
        return null;
    }
  };

  const getActivityName = (activity) => {
    switch (activity) {
      case Activity.UPDATE_PROFILE:
        return 'Update Profile';
      case Activity.CREATE_COLLECTION:
        return 'Create a Collection';
      case Activity.IMPORT_COLLECTION:
        return 'Import a Collection';
      case Activity.UPDATE_COLLECTION:
        return 'Update Collection';
      case Activity.MINT_BULK:
        return 'Mint Bulk NFTs';
      case Activity.BUY_MINT:
        return 'Buy Mint';
      case Activity.BUY_RANDOM_NFT:
        return 'Buy Random NFT';
      case Activity.BUY_SEQUENCE_NFT:
        return 'Buy Sequence NFT';
      case Activity.BUY_BULK_NFT:
        return 'Buy Bulk NFT';
      case Activity.CREATE_SELL_OFFER:
        return 'Create Sell Offer';
      case Activity.CREATE_BUY_OFFER:
        return 'Create Buy Offer';
      case Activity.CANCEL_SELL_OFFER:
        return 'Cancel Sell Offer';
      case Activity.CANCEL_BUY_OFFER:
        return 'Cancel Buy Offer';
      case Activity.ACCEPT_BUY_OFFER:
        return 'Accept Buy Offer';
      case Activity.ACCEPT_SELL_OFFER:
        return 'Accept Sell Offer';
      case Activity.OWNER_ACCPETED_YOUR_BUY_OFFER:
        return 'NFT Owner accepted your Buy Offer';
      case Activity.BUYER_ACCEPTED_YOUR_SELL_OFFER:
        return 'Buyer accepted your Sell Offer';
      case Activity.YOU_RECEIVED_A_NFT:
        return 'You received a NFT';
      case Activity.MINT_NFT:
        return 'Minted a NFT';
      case Activity.BURN_NFT:
        return 'Burnt a NFT';
      case Activity.SET_NFT_MINTER:
        return 'Set NFT Minter';
      case Activity.REFUND_BUYER:
        return 'Refund Mint Amount to Buyer';
      case Activity.BROKER_ACCEPTED_YOUR_BUY_OFFER:
        return 'Broker accepted your Buy Offer';
      case Activity.BROKER_ACCEPTED_YOUR_SELL_OFFER:
        return 'Broker accepted your Sell Offer';
      default:
        return null;
    }
  };

  useEffect(() => {
    // This effect will trigger a re-render when nftDetails are updated
  }, [nftDetails]);

  return (
    <Box
      sx={{
        background: darkMode
          ? `linear-gradient(${alpha(theme.palette.primary.main, 0.05)}, ${alpha(
              theme.palette.primary.main,
              0.02
            )})`
          : `linear-gradient(${alpha(theme.palette.primary.main, 0.02)}, ${alpha(
              theme.palette.primary.main,
              0.01
            )})`,
        borderRadius: 2,
        p: isSmallScreen ? 0.5 : 1,
        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {loading ? (
        <Stack alignItems="center" sx={{ py: 1 }}>
          <PulseLoader color={theme.palette.primary.main} size={10} margin={3} />
        </Stack>
      ) : acts.length === 0 ? (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={1}
          sx={{
            py: 1,
            opacity: 0.8,
            background: alpha(theme.palette.primary.main, 0.03),
            borderRadius: 1
          }}
        >
          <ErrorOutlineIcon fontSize="small" color="primary" />
          <Typography variant="body2" color="primary.main">
            No History
          </Typography>
        </Stack>
      ) : (
        <>
          <Table
            size="small"
            sx={{
              '& .MuiTableCell-root': {
                py: 0.75,
                px: isSmallScreen ? 0.5 : 1,
                fontSize: '0.875rem',
                lineHeight: 1.2
              }
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 'bold',
                    borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    background: alpha(theme.palette.primary.main, 0.03),
                    '&:first-of-type': {
                      borderTopLeftRadius: 8
                    },
                    '&:last-child': {
                      borderTopRightRadius: 8
                    }
                  }}
                >
                  Activity
                </TableCell>
                <TableCell
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 'bold',
                    borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    background: alpha(theme.palette.primary.main, 0.03),
                    display: isSmallScreen ? 'none' : 'table-cell'
                  }}
                >
                  Date
                </TableCell>
                <TableCell
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 'bold',
                    borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    background: alpha(theme.palette.primary.main, 0.03)
                  }}
                >
                  Details
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedActs.map(({ account, activity, data, time }) => {
                const activityName = getActivityName(activity);
                const activityDetails = renderActivityDetails(activity, data);

                if (activityName === null) return null;

                const strDateTime = formatDistanceToNow(new Date(time), { addSuffix: true });
                return (
                  <TableRow
                    key={time}
                    hover
                    sx={{
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.04)
                      },
                      '& td': {
                        borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                      }
                    }}
                  >
                    <TableCell align="left" sx={{ py: 1, px: isSmallScreen ? 0.5 : 1 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 500,
                          fontSize: '0.875rem',
                          color: theme.palette.primary.main
                        }}
                      >
                        {activityName}
                      </Typography>
                    </TableCell>
                    <TableCell
                      sx={{
                        py: 1,
                        px: isSmallScreen ? 0.5 : 1,
                        display: isSmallScreen ? 'none' : 'table-cell'
                      }}
                    >
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontSize: '0.75rem' }}
                      >
                        {strDateTime}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1, px: isSmallScreen ? 0.5 : 1 }}>
                      <Stack spacing={0.5}>
                        <Box>{activityDetails}</Box>
                        {data.NFTokenID && (
                          <Link
                            color="primary"
                            target="_blank"
                            href={`/nft/${data.NFTokenID}`}
                            rel="noreferrer noopener nofollow"
                            sx={{
                              fontSize: '0.7rem',
                              fontWeight: 500,
                              textDecoration: 'none',
                              '&:hover': {
                                textDecoration: 'underline',
                                color: 'primary.dark'
                              },
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5
                            }}
                          >
                            <Typography
                              component="span"
                              sx={{
                                fontSize: '0.7rem',
                                color: 'text.secondary'
                              }}
                            >
                              ID:
                            </Typography>
                            <Typography
                              component="span"
                              sx={{
                                fontSize: '0.7rem',
                                fontFamily: 'monospace',
                                color: 'primary.main'
                              }}
                            >
                              {data.NFTokenID.slice(0, 16)}...
                            </Typography>
                          </Link>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          {total > 0 && (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                px: 2,
                minHeight: '52px',
                gap: 4,
                background: alpha(theme.palette.primary.main, 0.02)
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  background: alpha(theme.palette.background.paper, 0.8),
                  backdropFilter: 'blur(8px)',
                  borderRadius: 1.5,
                  px: 1.5,
                  py: 0.5,
                  minHeight: '40px',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  boxShadow: theme.shadows[1]
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 500
                  }}
                >
                  {`${page + 1} / ${Math.ceil(total / rows)} pages`}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    gap: 0.5,
                    borderLeft: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                    pl: 1
                  }}
                >
                  <IconButton
                    onClick={() => handleChangePage(null, page - 1)}
                    disabled={page === 0}
                    size="small"
                    sx={{
                      color: theme.palette.primary.main,
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      background: alpha(theme.palette.primary.main, 0.05),
                      '&:hover': {
                        background: alpha(theme.palette.primary.main, 0.15),
                        borderColor: theme.palette.primary.main
                      },
                      '&.Mui-disabled': {
                        color: alpha(theme.palette.primary.main, 0.3),
                        borderColor: alpha(theme.palette.primary.main, 0.1),
                        background: 'none'
                      },
                      '& .MuiSvgIcon-root': {
                        fontSize: '20px'
                      }
                    }}
                  >
                    <KeyboardArrowLeft />
                  </IconButton>
                  <IconButton
                    onClick={() => handleChangePage(null, page + 1)}
                    disabled={page >= Math.ceil(total / rows) - 1}
                    size="small"
                    sx={{
                      color: theme.palette.primary.main,
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                      background: alpha(theme.palette.primary.main, 0.05),
                      '&:hover': {
                        background: alpha(theme.palette.primary.main, 0.15),
                        borderColor: theme.palette.primary.main
                      },
                      '&.Mui-disabled': {
                        color: alpha(theme.palette.primary.main, 0.3),
                        borderColor: alpha(theme.palette.primary.main, 0.1),
                        background: 'none'
                      },
                      '& .MuiSvgIcon-root': {
                        fontSize: '20px'
                      }
                    }}
                  >
                    <KeyboardArrowRight />
                  </IconButton>
                </Box>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  background: alpha(theme.palette.background.paper, 0.8),
                  backdropFilter: 'blur(8px)',
                  borderRadius: 1.5,
                  px: 1.5,
                  py: 0.5,
                  minHeight: '40px',
                  boxShadow: theme.shadows[1],
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                }}
              >
                <Select
                  value={rows}
                  onChange={handleChangeRowsPerPage}
                  size="small"
                  sx={{
                    height: '32px',
                    width: '44px',
                    minWidth: '44px',
                    color: theme.palette.primary.main,
                    '.MuiSelect-select': {
                      py: 0,
                      px: 0,
                      fontWeight: 500,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      letterSpacing: '0.5px',
                      marginRight: '-8px',
                      paddingLeft: '4px'
                    },
                    '.MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(theme.palette.primary.main, 0.2),
                      borderWidth: '1px',
                      borderRadius: '6px'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(theme.palette.primary.main, 0.4)
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: alpha(theme.palette.primary.main, 0.4),
                      borderWidth: '1px'
                    },
                    background: alpha(theme.palette.primary.main, 0.05),
                    '&:hover': {
                      background: alpha(theme.palette.primary.main, 0.1)
                    }
                  }}
                  MenuProps={{
                    PaperProps: {
                      sx: {
                        mt: 1,
                        borderRadius: '6px',
                        boxShadow: theme.shadows[2],
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                        '.MuiMenuItem-root': {
                          color: theme.palette.primary.main,
                          justifyContent: 'center',
                          fontSize: '0.875rem',
                          letterSpacing: '0.5px',
                          py: 1,
                          '&:hover': {
                            background: alpha(theme.palette.primary.main, 0.1)
                          },
                          '&.Mui-selected': {
                            background: alpha(theme.palette.primary.main, 0.08),
                            '&:hover': {
                              background: alpha(theme.palette.primary.main, 0.12)
                            }
                          }
                        }
                      }
                    }
                  }}
                >
                  {[10, 25, 50].map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.primary.main,
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    whiteSpace: 'nowrap',
                    pr: 0.5
                  }}
                >
                  items / page
                </Typography>
              </Box>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
