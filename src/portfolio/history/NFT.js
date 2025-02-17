import axios from 'axios';
import { useState, useEffect } from 'react';
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
  TableRow,
  Typography
} from '@mui/material';
import { tableCellClasses } from '@mui/material/TableCell';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

// Utils
import { Activity } from 'src/utils/constants';
import { normalizeAmount } from 'src/utils/normalizers';

// Loader
import { PulseLoader } from 'react-spinners';

// Components
import FlagsContainer from 'src/components/Flags';
import ListToolbar from 'src/components/ListToolbar';

// ----------------------------------------------------------------------
export default function NFTHistory({ account }) {
  const theme = useTheme();
  const BASE_URL = 'https://api.xrpnft.com/api';

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
    <Container maxWidth="lg" sx={{ pl: 0, pr: 0 }}>
      {loading ? (
        <Stack alignItems="center" sx={{ mt: 1 }}>
          <PulseLoader color="#00AB55" size={8} />
        </Stack>
      ) : acts.length === 0 ? (
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="center"
          spacing={1}
          sx={{
            py: 4,
            opacity: 0.8
          }}
        >
          <ErrorOutlineIcon fontSize="small" />
          <Typography variant="body2" color="text.secondary">
            No History
          </Typography>
        </Stack>
      ) : (
        <Box sx={{ mt: 0.5, mb: 0.5 }}>
          <Table
            stickyHeader
            size="small"
            sx={{
              [`& .${tableCellClasses.root}`]: {
                borderBottom: '1px solid',
                borderColor: theme.palette.divider,
                padding: '4px 12px'
              }
            }}
          >
            <TableBody>
              {acts.map(({ account, activity, data, time }) => {
                const activityName = getActivityName(activity);
                const activityDetails = renderActivityDetails(activity, data);

                if (activityName === null) return null;

                const strDateTime = formatDistanceToNow(new Date(time), { addSuffix: true });
                return (
                  <TableRow
                    key={time}
                    hover
                    sx={{
                      '&:hover': { backgroundColor: 'action.hover' },
                      '& td': { borderBottom: 'none' }
                    }}
                  >
                    <TableCell align="left" sx={{ py: 0, px: '6px' }}>
                      <Stack spacing={0.1}>
                        <Stack
                          direction="row"
                          spacing={0.5}
                          justifyContent="space-between"
                          alignItems="center"
                          sx={{ minHeight: '20px' }}
                        >
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 500, fontSize: '0.75rem', lineHeight: 1 }}
                          >
                            {activityName}
                          </Typography>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ fontSize: '0.65rem', lineHeight: 1 }}
                          >
                            {strDateTime}
                          </Typography>
                        </Stack>
                        <Box>{activityDetails}</Box>
                        {data.NFTokenID && (
                          <Stack alignItems="flex-end" sx={{ mt: 0.1 }}>
                            <Link
                              color="inherit"
                              target="_blank"
                              href={`/nft/${data.NFTokenID}`}
                              rel="noreferrer noopener nofollow"
                              sx={{ fontSize: '0.65rem', color: 'text.secondary', lineHeight: 1 }}
                            >
                              ID: {data.NFTokenID.slice(0, 12)}...
                            </Link>
                          </Stack>
                        )}
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      )}
      {total > 0 && (
        <ListToolbar count={total} rows={rows} setRows={setRows} page={page} setPage={setPage} />
      )}
    </Container>
  );
}
