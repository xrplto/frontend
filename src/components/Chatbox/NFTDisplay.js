import React, { useEffect, useState, useContext } from 'react';
import {
  Stack,
  styled,
  Paper,
  Typography,
  Tooltip,
  Box,
  Button,
  useTheme,
  tooltipClasses,
  Divider,
  Backdrop
} from '@mui/material';
import {
  Send as SendIcon,
  LocalOffer as LocalOfferIcon,
  ContentCopy as ContentCopyIcon
} from '@mui/icons-material';
import axios from 'axios';
import { AppContext } from 'src/AppContext';
import CreateOfferDialog from 'src/nft/CreateOfferDialog';
import { NFToken } from 'src/utils/constants';
import TransferDialog from 'src/nft/TransferDialog';
import BurnNFT from 'src/nft/BurnNFT';
import ConfirmAcceptOfferDialog from 'src/nft/ConfirmAcceptOfferDialog';
import SelectPriceDialog from 'src/nft/SelectPriceDialog';
import { useDispatch } from 'react-redux';
import { isInstalled, submitTransaction } from '@gemwallet/api';
import sdk from '@crossmarkio/sdk';
import { updateProcess, updateTxHash } from 'src/redux/transactionSlice';
import QRDialog from 'src/components/QRDialog';
import { normalizeAmount } from 'src/utils/normalizers';
import { ProgressBar } from 'react-loader-spinner';

const StyledTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.mode === 'dark' ? '#1A1A1A' : theme.palette.background.paper,
    color: theme.palette.text.primary,
    maxWidth: 420,
    fontSize: theme.typography.pxToRem(12),
    padding: 0,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    borderRadius: 8,
    border: `1px solid ${
      theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
    }`
  }
}));

function getCostFromOffers(nftOwner, offers, isSellOffer) {
  let xrpCost = null;
  let noXrpCost = null;
  for (const offer of offers) {
    const { amount, destination, flags, nft_offer_index, owner } = offer;

    let validOffer = true;

    if (destination) validOffer = false;

    if (isSellOffer && nftOwner !== owner) validOffer = false;

    if (!validOffer) continue;

    const cost = normalizeAmount(amount);

    cost.offer = offer;

    if (cost.currency === 'XRP') {
      if (xrpCost) {
        if (isSellOffer) {
          if (cost.amount < xrpCost.amount) xrpCost = cost;
        } else {
          if (cost.amount > xrpCost.amount) xrpCost = cost;
        }
      } else {
        xrpCost = cost;
      }
    } else {
      if (!noXrpCost) {
        noXrpCost = cost;
      }
    }
  }

  return xrpCost || noXrpCost;
}

const NFTDisplay = ({ nftLink }) => {
  const BASE_URL = 'https://api.xrpnft.com/api';
  const IMAGE_BASE_URL = 'https://s2.xrpnft.com/d1/'; // Base URL for images
  const theme = useTheme();
  const dispatch = useDispatch();
  const { accountProfile, openSnackbar } = useContext(AppContext);
  const accountLogin = accountProfile?.account;
  const accountToken = accountProfile?.token;

  const [pageLoading, setPageLoading] = useState(false);
  const [nft, setNFT] = useState(null);
  const [openCreateOffer, setOpenCreateOffer] = useState(false);
  const [isSellOffer, setIsSellOffer] = useState(false);
  const [openTransfer, setOpenTransfer] = useState(false);
  const [burnt, setBurnt] = useState(false);
  const [cost, setCost] = useState(null);
  const [sellOffers, setSellOffers] = useState([]);
  const [openSelectPrice, setOpenSelectPrice] = useState(false);
  const [acceptOffer, setAcceptOffer] = useState(null);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [openScanQR, setOpenScanQR] = useState(false);
  const [xummUuid, setXummUuid] = useState(null);
  const [qrUrl, setQrUrl] = useState(null);
  const [nextUrl, setNextUrl] = useState(null);
  const [qrType, setQrType] = useState('NFTokenAcceptOffer');

  // Adjusted regex to match the nftLink format
  const match = nftLink.match(/\[NFT: (.*?) \((.*?)\)\]/);
  const [_, name, tokenId] = match || [null, null, null];

  useEffect(() => {
    if (tokenId) {
      async function fetchNFT() {
        try {
          const res = await axios.get(`${BASE_URL}/nft/${tokenId}`);
          setNFT(res.data.nft);
          setBurnt(res.data.nft.status === NFToken.BURNT);
        } catch (error) {
          console.error('Error fetching NFT:', error);
        }
      }
      fetchNFT();
    }
  }, [tokenId]);

  useEffect(() => {
    async function getOffers() {
      try {
        const res = await axios.get(`${BASE_URL}/offers/${tokenId}`);
        if (res.status === 200) {
          const ret = res.data;
          const offers = ret.sellOffers;
          const nftOwner = nft.account;
          setCost(getCostFromOffers(nftOwner, offers, true));
          setSellOffers(getValidOffers(ret.sellOffers, true));
        }
      } catch (err) {
        console.log('Error on getting NFT offers list:', err);
      }
    }

    if (tokenId && nft) {
      getOffers();
    }
  }, [tokenId, nft]);

  const isOwner = accountLogin === nft?.account;

  const getValidOffers = (offers, isSell) => {
    const newOffers = [];
    for (const offer of offers) {
      if (isSell) {
        // Sell Offers
        if (isOwner) {
          // I am the Owner of NFT
          if (accountLogin === offer.owner) {
            newOffers.push(offer);
          }
        } else {
          // I am not the Owner of NFT
          if (accountLogin === offer.owner) {
            newOffers.push(offer);
          } else {
            if (
              nft.account === offer.owner &&
              (!offer.destination || accountLogin === offer.destination)
            ) {
              newOffers.push(offer);
            }
          }
        }
      } else {
        // Buy Offers
        if (!offer.destination || accountLogin === offer.destination) {
          newOffers.push(offer);
        }
      }
    }

    return newOffers;
  };

  /**
   * Updated getMediaPreview to utilize the files array for image display.
   * Prioritizes displaying the small thumbnail if available.
   * Uses the https://s2.xrpnft.com/d1/ base URL for all image sources.
   * Removes IPFS-related logic.
   * Updates video type check to use file.type === 'video'.
   * Incorporates logic from ChatNFTCard to ensure consistent media handling.
   */
  const getMediaPreview = () => {
    if (!nft || !nft.files || nft.files.length === 0) return null;

    // Use the first file in the files array (similar to ChatNFTCard)
    const file = nft.files[0];

    if (!file) return null;

    // Determine the image URL based on priority
    let mediaUrl = null;

    if (file.thumbnail?.small) {
      mediaUrl = `${IMAGE_BASE_URL}${file.thumbnail.small}`;
    } else if (file.thumbnail?.big) {
      mediaUrl = `${IMAGE_BASE_URL}${file.thumbnail.big}`;
    } else if (file.convertedFile) {
      mediaUrl = `${IMAGE_BASE_URL}${file.convertedFile}`;
    } else if (file.dfile) {
      mediaUrl = `${IMAGE_BASE_URL}${file.dfile}`;
    }

    if (!mediaUrl) return null;

    // Check if the file is a video
    if (file.type === 'video') {
      return (
        <video
          width="auto"
          height="30px"
          muted
          loop
          autoPlay
          playsInline
          style={{ borderRadius: '3px' }}
        >
          <source src={mediaUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      );
    }

    // Otherwise, render an image
    return (
      <img
        src={mediaUrl}
        alt={nft.name || 'Unnamed NFT'}
        style={{
          width: 'auto',
          height: '32px',
          objectFit: 'contain',
          borderRadius: '6px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
        }}
      />
    );
  };

  /**
   * New function to get the full-size image for the tooltip.
   * This ensures that the tooltip displays a larger version of the NFT image.
   */
  const getFullSizeMedia = () => {
    if (!nft || !nft.files || nft.files.length === 0) return null;

    // Use the first file in the files array (similar to ChatNFTCard)
    const file = nft.files[0];

    if (!file) return null;

    // Determine the image URL based on priority
    let mediaUrl = null;

    if (file.thumbnail?.small) {
      mediaUrl = `${IMAGE_BASE_URL}${file.thumbnail.small}`;
    } else if (file.thumbnail?.big) {
      mediaUrl = `${IMAGE_BASE_URL}${file.thumbnail.big}`;
    } else if (file.convertedFile) {
      mediaUrl = `${IMAGE_BASE_URL}${file.convertedFile}`;
    } else if (file.dfile) {
      mediaUrl = `${IMAGE_BASE_URL}${file.dfile}`;
    }

    if (!mediaUrl) return null;

    // Check if the file is a video
    if (file.type === 'video') {
      return (
        <video
          width="100%"
          height="auto"
          muted
          loop
          controls
          style={{ borderRadius: '3px', marginBottom: theme.spacing(1) }}
        >
          <source src={mediaUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      );
    }

    // Otherwise, render an image
    return (
      <img
        src={mediaUrl}
        alt={nft.name || 'Unnamed NFT'}
        style={{
          width: '100%',
          height: 'auto',
          objectFit: 'contain',
          borderRadius: '3px',
          marginBottom: theme.spacing(1)
        }}
      />
    );
  };

  const handleCreateSellOffer = () => {
    setIsSellOffer(true);
    setOpenCreateOffer(true);
  };

  const handleTransfer = () => {
    setOpenTransfer(true);
  };

  const handleCreateBuyOffer = () => {
    setIsSellOffer(false);
    setOpenCreateOffer(true);
  };

  const onHandleBurn = () => {
    setBurnt(true);
  };

  const handleAcceptOffer = async (offer) => {
    setAcceptOffer(offer);
    setOpenConfirm(true);
  };

  const handleBuyNow = async () => {
    if (sellOffers.length > 1) {
      setOpenSelectPrice(true);
    } else {
      handleAcceptOffer(cost.offer);
    }
  };

  const doProcessOffer = async (offer, isAcceptOrCancel) => {
    if (!accountLogin || !accountToken) {
      openSnackbar('Please login', 'error');
      return;
    }

    const index = offer.nft_offer_index;
    const owner = offer.owner;
    const destination = offer.destination;
    const isSell = offer.flags === 1;

    if (isAcceptOrCancel) {
      // Accept mode
      if (accountLogin === owner) {
        openSnackbar('You are the owner of this offer, you cannot accept it.', 'error');
        return;
      }
    } else {
      // Cancel mode
      if (accountLogin !== owner) {
        openSnackbar('You are not the owner of this offer', 'error');
        return;
      }
    }

    setPageLoading(true);
    try {
      const { uuid, NFTokenID } = nft;

      const user_token = accountProfile.user_token;
      const wallet_type = accountProfile.wallet_type;

      let offerTxData = {
        TransactionType: isAcceptOrCancel ? 'NFTokenAcceptOffer' : 'NFTokenCancelOffer',
        Memos: [],
        NFTokenOffers: !isAcceptOrCancel ? [index] : undefined,
        Account: accountLogin
      };

      if (isAcceptOrCancel) {
        if (isSell) {
          offerTxData['NFTokenSellOffer'] = index;
        } else {
          offerTxData['NFTokenBuyOffer'] = index;
        }
      }

      switch (wallet_type) {
        case 'xaman':
          const body = {
            account: accountLogin,
            uuid,
            NFTokenID,
            index,
            destination,
            accept: isAcceptOrCancel ? 'yes' : 'no',
            sell: isSell ? 'yes' : 'no',
            user_token
          };

          const res = await axios.post(`${BASE_URL}/offers/acceptcancel`, body, {
            headers: { 'x-access-token': accountToken }
          });

          if (res.status === 200) {
            const newUuid = res.data.data.uuid;
            const qrlink = res.data.data.qrUrl;
            const nextlink = res.data.data.next;

            let newQrType = isAcceptOrCancel ? 'NFTokenAcceptOffer' : 'NFTokenCancelOffer';
            if (isSell) newQrType += ' [Sell Offer]';
            else newQrType += ' [Buy Offer]';

            setQrType(newQrType);
            setXummUuid(newUuid);
            setQrUrl(qrlink);
            setNextUrl(nextlink);
            setOpenScanQR(true);
          }
          break;
        case 'gem':
          isInstalled().then(async (response) => {
            if (response.result.isInstalled) {
              dispatch(updateProcess(1));
              await submitTransaction({
                transaction: offerTxData
              }).then(({ type, result }) => {
                if (type === 'response') {
                  dispatch(updateProcess(2));
                  dispatch(updateTxHash(result?.hash));
                } else {
                  dispatch(updateProcess(3));
                }
              });
            }
          });
          break;
        case 'crossmark':
          dispatch(updateProcess(1));
          await sdk.methods.signAndSubmitAndWait(offerTxData).then(({ response }) => {
            if (response.data.meta.isSuccess) {
              dispatch(updateProcess(2));
              dispatch(updateTxHash(response.data.resp.result?.hash));
            } else {
              dispatch(updateProcess(3));
            }
          });
          break;
        default:
          openSnackbar('Unsupported wallet type', 'error');
          break;
      }
    } catch (err) {
      console.error(err);
      dispatch(updateProcess(0));
    }
    setPageLoading(false);
  };

  const onDisconnectXumm = async () => {
    setPageLoading(true);
    try {
      await axios.delete(`${BASE_URL}/offers/acceptcancel/${xummUuid}`);
    } catch (err) {
      console.error(err);
    }
    setXummUuid(null);
    setPageLoading(false);
  };

  const handleScanQRClose = () => {
    setOpenScanQR(false);
    onDisconnectXumm();
  };

  const onContinueAccept = async () => {
    doProcessOffer(acceptOffer, true);
  };

  // Find the getMediaPreview function and add a new function to get the best image URL
  const getBestImageUrl = () => {
    if (!nft || !nft.files || nft.files.length === 0) return null;

    const file = nft.files[0];
    if (!file) return null;

    // Return the best available image URL in order of preference
    if (file.thumbnail?.big) {
      return `${IMAGE_BASE_URL}${file.thumbnail.big}`;
    } else if (file.thumbnail?.small) {
      return `${IMAGE_BASE_URL}${file.thumbnail.small}`;
    } else if (file.convertedFile) {
      return `${IMAGE_BASE_URL}${file.convertedFile}`;
    } else if (file.dfile) {
      return `${IMAGE_BASE_URL}${file.dfile}`;
    }

    return null;
  };

  if (!match) return null;

  return (
    <>
      <StyledTooltip
        title={
          <Paper elevation={0}>
            <Box
              sx={{
                p: 1.5,
                maxHeight: '80vh',
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  width: '4px'
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '2px'
                }
              }}
            >
              {/* Media display */}
              <Box
                sx={{
                  mb: 1.5,
                  borderRadius: 1.5,
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                  position: 'relative',
                  '&:hover': {
                    '& .media-overlay': {
                      opacity: 1
                    }
                  }
                }}
              >
                {getFullSizeMedia()}
                <Box
                  className="media-overlay"
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.4) 100%)',
                    opacity: 0,
                    transition: 'opacity 0.2s ease',
                    display: 'flex',
                    alignItems: 'flex-end',
                    padding: 1.5
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#fff',
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                      fontSize: '0.7rem'
                    }}
                  >
                    Click to view full size
                  </Typography>
                </Box>
              </Box>

              {/* NFT Title and Info */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mb: 1
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    color: theme.palette.primary.main,
                    letterSpacing: '-0.02em'
                  }}
                >
                  {nft ? nft.name : name}
                </Typography>
                {nft?.rarity_rank && (
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 'bold',
                      bgcolor:
                        theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.1)'
                          : 'rgba(0,0,0,0.05)',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1
                    }}
                  >
                    Rank: {nft.rarity_rank} / {nft.total}
                  </Typography>
                )}
              </Box>

              {/* Collection and other details */}
              <Box sx={{ mb: 1 }}>
                {nft?.collection && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      Collection:
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {nft.collection}
                    </Typography>
                  </Box>
                )}
                {nft?.royalty && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      Royalty:
                    </Typography>
                    <Typography variant="body2" fontWeight="medium">
                      {(nft.royalty / 1000).toFixed(2)}%
                    </Typography>
                  </Box>
                )}
                {nft?.cfloor && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      Floor Price:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary.main">
                      {nft.cfloor.amount} {nft.cfloor.currency}
                    </Typography>
                  </Box>
                )}
              </Box>

              <Divider sx={{ my: 1 }} />

              {/* Properties */}
              {nft?.props && nft.props.length > 0 && (
                <>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      mb: 0.75,
                      fontWeight: 600,
                      color: theme.palette.text.secondary,
                      fontSize: '0.75rem'
                    }}
                  >
                    Properties
                  </Typography>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: 0.75,
                      mb: 1
                    }}
                  >
                    {nft.props.map((prop, index) => (
                      <Box
                        key={index}
                        sx={{
                          p: 0.75,
                          borderRadius: 1,
                          backgroundColor:
                            theme.palette.mode === 'dark'
                              ? 'rgba(255,255,255,0.05)'
                              : 'rgba(0,0,0,0.02)',
                          border: `1px solid ${
                            theme.palette.mode === 'dark'
                              ? 'rgba(255,255,255,0.1)'
                              : 'rgba(0,0,0,0.05)'
                          }`,
                          transition: 'transform 0.2s ease',
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                          }
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: theme.palette.text.secondary,
                            display: 'block',
                            mb: 0.25,
                            fontSize: '0.65rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {prop.type}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.7rem',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {prop.value}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                </>
              )}

              {/* Replace Token ID with Copy Button */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 0.5 }}>
                <Tooltip title="Copy Token ID">
                  <Button
                    size="small"
                    startIcon={<ContentCopyIcon fontSize="small" />}
                    onClick={() => {
                      navigator.clipboard.writeText(tokenId);
                      openSnackbar('Token ID copied to clipboard', 'success');
                    }}
                    sx={{
                      fontSize: '0.65rem',
                      py: 0.25,
                      px: 1,
                      minHeight: 0,
                      textTransform: 'none'
                    }}
                  >
                    Copy ID
                  </Button>
                </Tooltip>
              </Box>

              <Divider sx={{ my: 0.75 }} />

              {/* Action Buttons */}
              {isOwner ? (
                <Box
                  sx={{
                    display: 'flex',
                    gap: 1,
                    mt: 1
                  }}
                >
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<LocalOfferIcon sx={{ fontSize: 16 }} />}
                    onClick={handleCreateSellOffer}
                    color="primary"
                    disabled={!accountLogin || burnt}
                    sx={{
                      borderRadius: 1,
                      py: 0.5,
                      px: 1.5,
                      minHeight: 0,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                      }
                    }}
                  >
                    Sell
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<SendIcon sx={{ fontSize: 16 }} />}
                    onClick={handleTransfer}
                    color="primary"
                    disabled={!accountLogin || burnt}
                    sx={{
                      borderRadius: 1,
                      py: 0.5,
                      px: 1.5,
                      minHeight: 0,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      borderWidth: 1
                    }}
                  >
                    Send
                  </Button>
                  <BurnNFT
                    nft={nft}
                    onHandleBurn={onHandleBurn}
                    sx={{
                      minWidth: 'auto',
                      borderRadius: 1,
                      py: 0.5,
                      px: 1.5,
                      minHeight: 0,
                      fontSize: '0.75rem',
                      borderWidth: 1
                    }}
                  />
                </Box>
              ) : (
                <Stack spacing={1} direction="row" sx={{ mt: 1 }}>
                  <Button
                    fullWidth
                    disabled={!cost || burnt}
                    variant="contained"
                    onClick={handleBuyNow}
                    sx={{
                      borderRadius: 1,
                      py: 0.5,
                      px: 1.5,
                      minHeight: 0,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                      }
                    }}
                  >
                    Buy Now
                  </Button>
                  <Button
                    fullWidth
                    disabled={!accountLogin || burnt}
                    variant="outlined"
                    onClick={handleCreateBuyOffer}
                    sx={{
                      borderRadius: 1,
                      py: 0.5,
                      px: 1.5,
                      minHeight: 0,
                      textTransform: 'none',
                      fontWeight: 600,
                      fontSize: '0.75rem',
                      borderWidth: 1
                    }}
                  >
                    Offer
                  </Button>
                </Stack>
              )}
            </Box>
          </Paper>
        }
        arrow
        placement="right"
        enterDelay={200}
        leaveDelay={200}
      >
        {/* Main compact display */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            padding: '3px 6px',
            borderRadius: 1,
            '&:hover': {
              backgroundColor: theme.palette.action.hover
            },
            transition: 'background-color 0.2s',
            cursor: 'pointer'
          }}
        >
          {getMediaPreview()}
          <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.primary.main,
                fontWeight: 600,
                fontSize: '0.75rem',
                lineHeight: 1.2
              }}
            >
              {nft ? nft.name : name}
            </Typography>
            {cost && (
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.success.main,
                  fontSize: '0.65rem',
                  fontWeight: 500,
                  lineHeight: 1.2
                }}
              >
                {cost.amount} {cost.currency}
              </Typography>
            )}
          </Box>
        </Box>
      </StyledTooltip>
      <Backdrop
        sx={{ color: '#000', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={pageLoading}
      >
        <ProgressBar
          height="80"
          width="80"
          ariaLabel="progress-bar-loading"
          wrapperStyle={{}}
          wrapperClass="progress-bar-wrapper"
          borderColor="#F4442E"
          barColor="#51E5FF"
        />
      </Backdrop>
      <ConfirmAcceptOfferDialog
        open={openConfirm}
        setOpen={setOpenConfirm}
        offer={acceptOffer}
        onContinue={onContinueAccept}
      />

      <CreateOfferDialog
        open={openCreateOffer}
        setOpen={setOpenCreateOffer}
        nft={nft}
        isSellOffer={isSellOffer}
        nftImageUrl={getBestImageUrl()}
      />

      <TransferDialog
        open={openTransfer}
        setOpen={setOpenTransfer}
        nft={nft}
        nftImageUrl={getBestImageUrl()}
      />

      <SelectPriceDialog
        open={openSelectPrice}
        setOpen={setOpenSelectPrice}
        offers={sellOffers}
        handleAccept={handleAcceptOffer}
      />

      <QRDialog
        open={openScanQR}
        type={qrType}
        onClose={handleScanQRClose}
        qrUrl={qrUrl}
        nextUrl={nextUrl}
      />
    </>
  );
};

/**
 * Helper function to render the full-size media for the tooltip.
 * This ensures that the tooltip displays a larger version of the NFT image or video.
 */
const getFullSizeMedia = (nft, IMAGE_BASE_URL, theme) => {
  if (!nft || !nft.files || nft.files.length === 0) return null;

  // Use the first file in the files array
  const file = nft.files[0];

  if (!file) return null;

  // Determine the image URL based on priority
  let mediaUrl = null;

  if (file.thumbnail?.small) {
    mediaUrl = `${IMAGE_BASE_URL}${file.thumbnail.small}`;
  } else if (file.thumbnail?.big) {
    mediaUrl = `${IMAGE_BASE_URL}${file.thumbnail.big}`;
  } else if (file.convertedFile) {
    mediaUrl = `${IMAGE_BASE_URL}${file.convertedFile}`;
  } else if (file.dfile) {
    mediaUrl = `${IMAGE_BASE_URL}${file.dfile}`;
  }

  if (!mediaUrl) return null;

  // Check if the file is a video
  if (file.type === 'video') {
    return (
      <video
        width="100%"
        height="auto"
        muted
        loop
        controls
        style={{ borderRadius: '3px', marginBottom: theme.spacing(1) }}
      >
        <source src={mediaUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    );
  }

  // Otherwise, render an image
  return (
    <img
      src={mediaUrl}
      alt={nft.name || 'Unnamed NFT'}
      style={{
        width: '100%',
        height: 'auto',
        objectFit: 'contain',
        borderRadius: '3px',
        marginBottom: theme.spacing(1)
      }}
    />
  );
};

export default NFTDisplay;
