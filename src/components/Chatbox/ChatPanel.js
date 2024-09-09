import {
  Stack,
  Avatar,
  styled,
  Paper,
  Typography,
  Tooltip,
  Box,
  Button,
  Grid,
  useTheme,
  tooltipClasses,
  IconButton,
  Link,
  Divider,
  Backdrop
} from '@mui/material';
import { parseISO } from 'date-fns';
import {
  Send as SendIcon,
  SwapHoriz as TradeIcon,
  Message as MessageIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Remove as RemoveIcon,
  ChatBubbleOutline as ChatBubbleOutlineIcon,
  Reply as ReplyIcon,
  LocalOffer as LocalOfferIcon
} from '@mui/icons-material';
import { useEffect, useState, useContext, useRef } from 'react';
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
import UserSummary from './UserSummary';

const CustomWidthTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))({
  [`& .${tooltipClasses.tooltip}`]: {
    maxWidth: 500
  }
});

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'left',
  color: theme.palette.text.secondary,
  maxWidth: '100%',
  flexGrow: 1
}));

const rankColors = (theme) => ({
  Member: theme.palette.grey[500],
  VIP: theme.palette.mode === 'dark' ? '#FFD700' : '#DAA520',
  AQUA: theme.palette.mode === 'dark' ? '#00CED1' : '#20B2AA',
  NOVA: theme.palette.mode === 'dark' ? '#FF69B4' : '#DB7093',
  Moderator: theme.palette.mode === 'dark' ? '#9370DB' : '#8A2BE2',
  Admin: theme.palette.mode === 'dark' ? '#FF4500' : '#DC143C',
  Titan: 'linear-gradient(90deg, #4B0082 0%, #0000FF 50%, #800080 100%)',
  Legendary: 'linear-gradient(90deg, #FFD700 0%, #FFA500 50%, #FF4500 100%)',
  Developer: theme.palette.primary.dark,
  Bot: theme.palette.info.main
});

const rankGlowEffect = (theme) => ({
  Member: 'none',
  VIP: `0 0 5px ${theme.palette.mode === 'dark' ? '#FFD700' : '#DAA520'}`,
  AQUA: `0 0 5px ${theme.palette.mode === 'dark' ? '#00CED1' : '#20B2AA'}`,
  NOVA: `0 0 5px ${theme.palette.mode === 'dark' ? '#FF69B4' : '#DB7093'}`,
  Moderator: `0 0 5px ${theme.palette.mode === 'dark' ? '#9370DB' : '#8A2BE2'}`,
  Admin: `0 0 5px ${theme.palette.mode === 'dark' ? '#FF4500' : '#DC143C'}`,
  Titan: '0 0 8px #0000FF',
  Legendary: '0 0 8px #FFA500',
  Developer: `0 0 5px ${theme.palette.primary.dark}`,
  Bot: `0 0 5px ${theme.palette.info.main}`
});

const lightningEffect = `
  @keyframes lightning {
    0% { background-position: 0 0, 0 0, 0 0, 0 0; }
    50% { background-position: 100% 100%, 100% 100%, 100% 100%, 100% 100%; }
    100% { background-position: 0 0, 0 0, 0 0, 0 0; }
  }
`;

const formatTimeAgo = (date) => {
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 0) {
    return 'Just now';
  }

  if (diffInSeconds < 60) {
    return `${diffInSeconds}s`;
  } else if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}m`;
  } else if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}hr`;
  } else {
    return `${Math.floor(diffInSeconds / 86400)}d`;
  }
};

const StyledTooltip = styled(({ className, ...props }) => (
  <Tooltip {...props} classes={{ popper: className }} />
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.background.paper,
    color: theme.palette.text.primary,
    maxWidth: 350,
    fontSize: theme.typography.pxToRem(12),
    border: '1px solid #dadde9'
  }
}));

const CustomScrollBox = styled(Stack)(({ theme }) => ({
  '&::-webkit-scrollbar': {
    width: '8px'
  },
  '&::-webkit-scrollbar-track': {
    background: '#a9a9a94d',
    borderRadius: '10px'
  },
  '&::-webkit-scrollbar-thumb': {
    background: 'darkgrey',
    borderRadius: '10px'
  },
  '&::-webkit-scrollbar-thumb:hover': {
    background: '#a9a9a9d4',
    cursor: 'pointer'
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
      if (noXrpCost) {
        // Do nothing for now.
      } else {
        noXrpCost = cost;
      }
    }
  }

  return xrpCost || noXrpCost;
}

const NFTDisplay = ({ nftLink }) => {
  const BASE_URL = 'https://api.xrpnft.com/api';
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
  const [burnt, setBurnt] = useState(nft?.status === NFToken.BURNT);
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

  const match = nftLink.match(/\[NFT: (.*?) #(\d+) \((.*?)\)\]/);

  if (!match) return null;
  const isOwner = accountLogin === nft?.account;

  const [_, name, number, tokenId] = match;

  useEffect(() => {
    async function fetchNFT() {
      const res = await axios.get(`${BASE_URL}/nft/${tokenId}`);
      setNFT(res.data.nft);
    }
    if (tokenId) {
      fetchNFT();
    }
  }, [tokenId]);

  useEffect(() => {
    function getOffers() {
      axios
        .get(`${BASE_URL}/offers/${tokenId}`)
        .then((res) => {
          let ret = res.status === 200 ? res.data : undefined;
          if (ret) {
            const offers = ret.sellOffers;
            const nftOwner = nft.account;
            setCost(getCostFromOffers(nftOwner, offers, true));
            setSellOffers(getValidOffers(ret.sellOffers, true));
          }
        })
        .catch((err) => {
          console.log('Error on getting nft offers list!!!', err);
        })
        .then(function () {
          // always executed
        });
    }

    if (tokenId && nft) {
      getOffers();
    }
  }, [tokenId, nft]);

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
        if (isOwner) {
          // I am the Owner of NFT
        } else {
          // I am not the Owner of NFT
        }

        if (!offer.destination || accountLogin === offer.destination)
          // if ((!offer.destination || accountLogin === offer.destination) && offer.)
          newOffers.push(offer);
      }
    }

    return newOffers;
  };

  const getMediaPreview = () => {
    if (!nft) return null;
    if (nft.dfile.video) {
      return (
        <video
          width="100%"
          height="auto"
          controls
          loop
          muted
          style={{ maxWidth: '200px', maxHeight: '200px' }}
        >
          <source
            src={`https://gateway.xrpnft.com/ipfs/${nft.ufileIPFSPath.video}`}
            type="video/mp4"
          />
          Your browser does not support the video tag.
        </video>
      );
    } else if (nft.dfile.image) {
      return (
        <img
          src={`https://gateway.xrpnft.com/ipfs/${nft.ufileIPFSPath.image}`}
          alt={nft.name}
          style={{
            maxWidth: '200px',
            maxHeight: '200px',
            objectFit: 'contain',
            borderRadius: '10px'
          }}
        />
      );
    }
    return null;
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
        openSnackbar('You are the owner of this offer, you can not accept it.', 'error');
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
        Memos: isAcceptOrCancel
          ? configureMemos(
              isSell ? 'XRPNFT-nft-accept-sell-offer' : 'XRPNFT-nft-accept-buy-offer',
              '',
              `https://xrpnft.com/nft/${NFTokenID}`
            )
          : configureMemos(
              isSell ? 'XRPNFT-nft-cancel-sell-offer' : 'XRPNFT-nft-cancel-buy-offer',
              '',
              `https://xrpnft.com/nft/${NFTokenID}`
            ),
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
                if (type == 'response') {
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
      const res = await axios.delete(`${BASE_URL}/offers/acceptcancel/${xummUuid}`);
      // if (res.status === 200) {
      //     setXummUuid(null);
      // }
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

  return (
    <>
      <StyledTooltip
        title={
          <Paper elevation={0}>
            <Box sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {nft ? nft.name : `${name} #${number}`}
              </Typography>
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Collection:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {nft?.collection}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Rarity Rank:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {nft?.rarity_rank} / {nft?.total}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2">Royalty:</Typography>
                <Typography variant="body2" fontWeight="bold">
                  {nft ? `${(nft.royalty / 1000).toFixed(2)}%` : 'N/A'}
                </Typography>
              </Box>
              {nft?.props && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Properties:
                  </Typography>
                  {nft.props.map((prop, index) => (
                    <Box
                      key={index}
                      sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}
                    >
                      <Typography variant="body2">{prop.type}:</Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {prop.value}
                      </Typography>
                    </Box>
                  ))}
                </>
              )}
              {nft?.cfloor && (
                <>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">Floor Price:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {nft.cfloor.amount} {nft.cfloor.currency}
                    </Typography>
                  </Box>
                </>
              )}
              <Divider sx={{ my: 1 }} />
              <Typography variant="caption" color="textSecondary">
                Token ID: {tokenId}
              </Typography>
              <Divider sx={{ my: 1 }} />
              {isOwner ? (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-around',
                    gap: 1
                  }}
                >
                  <Button
                    fullWidth
                    // sx={{ minWidth: 150 }}
                    variant="outlined"
                    startIcon={<LocalOfferIcon />}
                    onClick={handleCreateSellOffer}
                    color="success"
                    disabled={!accountLogin || burnt}
                  >
                    Sell
                  </Button>
                  <Button
                    fullWidth
                    sx={{ padding: '8px 30px' }}
                    variant="outlined"
                    startIcon={<SendIcon />}
                    onClick={handleTransfer}
                    color="info"
                    disabled={!accountLogin || burnt}
                  >
                    Transfer
                  </Button>
                  <BurnNFT nft={nft} onHandleBurn={onHandleBurn} />
                </Box>
              ) : (
                <Stack spacing={{ xs: 1, sm: 2 }} direction="row">
                  <Button
                    fullWidth
                    disabled={!cost || burnt}
                    variant="contained"
                    onClick={handleBuyNow}
                  >
                    Buy Now
                  </Button>
                  <Button
                    fullWidth
                    disabled={!accountLogin || burnt}
                    variant="outlined"
                    onClick={handleCreateBuyOffer}
                  >
                    Make Offer
                  </Button>
                </Stack>
              )}
            </Box>
          </Paper>
        }
        arrow
        placement="right"
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginLeft: 1,
            gap: 1
          }}
        >
          {getMediaPreview()}
          <Typography
            variant="caption"
            sx={{ color: theme.palette.primary.main, fontWeight: 'bold' }}
          >
            {nft ? nft.name : `${name} #${number}`}
          </Typography>
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
      />

      <TransferDialog open={openTransfer} setOpen={setOpenTransfer} nft={nft} />

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

const ChatPanel = ({ chats, onStartPrivateMessage }) => {
  const theme = useTheme();
  const { accountProfile } = useContext(AppContext);
  const chatContainerRef = useRef(null);
  const [userImages, setUserImages] = useState({});

  // Inject lightningEffect into the document's head
  const styleElement = document.createElement('style');
  styleElement.textContent = lightningEffect;
  document.head.appendChild(styleElement);

  const truncateString = (str) => str.slice(0, 12) + (str.length > 12 ? '...' : '');

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chats]);

  // Add this console.log to check if chats are being received
  console.log('Chats received in ChatPanel:', chats);

  useEffect(() => {
    const fetchUserImages = async () => {
      const uniqueUsers = [...new Set(chats.map((chat) => chat.username))];
      const imagePromises = uniqueUsers.map(async (account) => {
        try {
          const response = await axios.get(
            `http://localhost:5000/api/set-user-image?account=${account}`
          );
          if (response.data.user) {
            const user = response.data.user;
            return {
              [account]: user.imageUrl
                ? `https://s2.xrpnft.com/d1/${user.imageUrl}`
                : user.nftTokenId
                ? `https://s2.xrpnft.com/d1/${user.nftTokenId}`
                : null
            };
          } else {
            console.log(`No user data found for ${account}`);
            return { [account]: null };
          }
        } catch (error) {
          console.error(`Error fetching image for ${account}:`, error.message);
          return { [account]: null };
        }
      });

      const images = await Promise.all(imagePromises);
      setUserImages(Object.assign({}, ...images));
    };

    if (chats.length > 0) {
      fetchUserImages();
    }
  }, [chats]);

  return (
    <CustomScrollBox
      ref={chatContainerRef}
      gap={1}
      sx={{
        height: '100%',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column-reverse'
      }}
    >
      {Array.isArray(chats) && chats.length > 0 ? (
        chats
          .filter(
            (chat) =>
              !chat.isPrivate ||
              chat.username === accountProfile?.account ||
              chat.recipient === accountProfile?.account
          )
          .reverse()
          .map((chat, index) => {
            const parsedTime = parseISO(chat.timestamp);
            const timeAgo = formatTimeAgo(parsedTime);

            const privateMessageRecipient = chat.isPrivate
              ? chat.username === accountProfile?.account
                ? chat.recipient
                : chat.username
              : chat.username;

            const displayUsername = truncateString(chat.username);
            const displayRecipient = truncateString(privateMessageRecipient);

            const isCurrentUser = chat.username === accountProfile?.account;

            // Parse NewsBot message
            let newsData = null;
            if (chat.username === 'NewsBot') {
              try {
                newsData = JSON.parse(chat.message);
              } catch (error) {
                console.error('Error parsing NewsBot message:', error);
              }
            }

            return (
              <Stack
                key={index}
                direction="row"
                spacing={1}
                alignItems="flex-start"
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  borderRadius: 1,
                  p: 1,
                  '&:hover': {
                    backgroundColor: theme.palette.action.hover
                  }
                }}
              >
                <Avatar
                  alt={chat.username}
                  src={userImages[chat.username] || '/static/crossmark.webp'}
                  sx={{ width: 32, height: 32, marginTop: 0.5 }}
                />
                <Box sx={{ flexGrow: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <CustomWidthTooltip title={<UserSummary user={chat} />} arrow placement="right">
                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 'bold',
                          color: rankColors(theme)[chat.rank] || theme.palette.text.primary,
                          textShadow: rankGlowEffect(theme)[chat.rank] || 'none',
                          cursor: 'pointer'
                        }}
                      >
                        {displayUsername}
                        {chat.isPrivate && (
                          <>
                            {' → '}
                            <span style={{ color: theme.palette.text.secondary }}>
                              {displayRecipient}
                            </span>
                          </>
                        )}
                      </Typography>
                    </CustomWidthTooltip>
                    {chat.username !== accountProfile?.account && (
                      <Tooltip title="Send private message" arrow>
                        <IconButton
                          size="small"
                          onClick={() => onStartPrivateMessage(privateMessageRecipient)}
                          sx={{
                            padding: 0,
                            color: theme.palette.text.secondary,
                            '&:hover': {
                              color: theme.palette.primary.main
                            }
                          }}
                        >
                          <ChatBubbleOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>
                  {newsData ? (
                    <Box sx={{ mt: 0.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {newsData.title}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {newsData.summary !== 'No summary available'
                          ? newsData.summary
                          : 'No summary available.'}
                      </Typography>
                      <Link href={newsData.sourceUrl} target="_blank" rel="noopener noreferrer">
                        <Typography variant="caption" sx={{ color: theme.palette.primary.main }}>
                          Read more at {newsData.sourceName}
                        </Typography>
                      </Link>
                      {newsData.sentiment !== 'Unknown' && (
                        <Typography
                          variant="caption"
                          sx={{
                            ml: 1,
                            color:
                              newsData.sentiment === 'Bullish'
                                ? 'green'
                                : newsData.sentiment === 'Bearish'
                                ? 'red'
                                : 'inherit'
                          }}
                        >
                          • {newsData.sentiment}
                        </Typography>
                      )}
                    </Box>
                  ) : (
                    <Typography
                      variant="body2"
                      sx={{
                        mt: 0.5,
                        color: chat.isPrivate
                          ? theme.palette.secondary.main
                          : theme.palette.text.primary
                      }}
                    >
                      {chat.message.split(/(\[NFT:.*?\])/).map((part, i) => {
                        if (part.startsWith('[NFT:')) {
                          return <NFTDisplay key={i} nftLink={part} />;
                        }
                        return part;
                      })}
                    </Typography>
                  )}
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: theme.palette.text.secondary,
                    mt: 0.5,
                    opacity: 0.8
                  }}
                >
                  {timeAgo}
                </Typography>
              </Stack>
            );
          })
      ) : (
        <Typography variant="body2" sx={{ textAlign: 'center', py: 2 }}>
          No messages to display.
        </Typography>
      )}
    </CustomScrollBox>
  );
};

export default ChatPanel;
