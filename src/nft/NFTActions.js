import axios from 'axios';
import { useRef, useState, useEffect } from 'react';
import { FacebookShareButton, TwitterShareButton, FacebookIcon } from '../components/ShareButtons';

// Material
import {
  useTheme,
  useMediaQuery,
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Avatar,
  Backdrop,
  Box,
  Button,
  Divider,
  Grid,
  IconButton,
  Link,
  Paper,
  Popover,
  Stack,
  Typography,
  Tooltip,
  Chip
} from '@mui/material';
import ListIcon from '@mui/icons-material/List';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import TimelineIcon from '@mui/icons-material/Timeline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PanToolIcon from '@mui/icons-material/PanTool';
import SendIcon from '@mui/icons-material/Send';
import HistoryIcon from '@mui/icons-material/History';
import ShareIcon from '@mui/icons-material/Share';
import VerifiedIcon from '@mui/icons-material/Verified';
import LeaderboardOutlinedIcon from '@mui/icons-material/LeaderboardOutlined';
import MessageIcon from '@mui/icons-material/Message';
import MessageOutlinedIcon from '@mui/icons-material/MessageOutlined';
import CheckIcon from '@mui/icons-material/Check';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

// Icons
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import WarningIcon from '@mui/icons-material/Warning';
import CurrencyExchangeIcon from '@mui/icons-material/CurrencyExchange';
import LaunchIcon from '@mui/icons-material/Launch';

// Loader
import { PuffLoader, PulseLoader } from '../components/Spinners';
// Removed unused react-loader-spinner import

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Constants
const NFToken = {
  SELL_WITH_MINT_BULK: 'SELL_WITH_MINT_BULK',
  BURNT: 'BURNT'
};
const getMinterName = (account) => {
  const minterMap = {
    'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH': 'XLS-20d',
    'rNH4g2bh86BQBKrW8bEiN8xLwKvF9YB4U1': 'OnXRP',
    'rUL2FGRkkPqR5yjPH8C7X8zE6djZcX9X6t': 'XRPunks'
  };
  return minterMap[account] || null;
};
import { normalizeAmount } from 'src/utils/parseUtils';
import { fNumber, fIntNumber } from 'src/utils/formatters';
import { getHashIcon } from 'src/utils/formatters';

// Components
import CreateOfferDialog from './CreateOfferDialog';

import ConfirmAcceptOfferDialog from './ConfirmAcceptOfferDialog';
// import TimePeriods from './TimePeriodsDropdown';
import OffersList from './OffersList';
import SelectPriceDialog from './SelectPriceDialog';

import BurnNFT from './BurnNFT';
import TransferDialog from './TransferDialog';
import HistoryList from './HistoryList';

// Add these imports
import { alpha, styled } from '@mui/material/styles';
import Glass from '@mui/material/Paper';

// Add this import at the top of the file
import Wallet from 'src/components/Wallet';

// Add these imports at the top of the file
import { Client } from 'xrpl';
import { xrpToDrops, dropsToXrp } from 'xrpl';

// Add this import at the top of the file
import CreateOfferXRPCafe from './CreateOfferXRPCafe';

// Add these constants at the top of the file
const BROKER_ADDRESSES = {
  rnPNSonfEN1TWkPH4Kwvkk3693sCT4tsZv: { fee: 0.015, name: 'Art Dept Fun' },
  rpx9JThQ2y37FaGeeJP7PXDUVEXY3PHZSC: { fee: 0.01589, name: 'XRP Cafe' },
  rpZqTPC8GvrSvEfFsUuHkmPCg29GdQuXhC: { fee: 0.015, name: 'BIDDS' },
  rDeizxSRo6JHjKnih9ivpPkyD2EgXQvhSB: { fee: 0.015, name: 'XPMarket' },
  rJcCJyJkiTXGcxU4Lt4ZvKJz8YmorZXu8r: { fee: 0.01, name: 'OpulenceX' }
};

// Create a styled component for the glass effect
const GlassPanel = styled(Glass)(({ theme }) => ({
  background: alpha(theme.palette.background.paper, 0.7),
  backdropFilter: 'blur(10px)',
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(3),
  boxShadow: `0 8px 32px 0 ${alpha(theme.palette.primary.main, 0.1)}`,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
  maxWidth: '95%',
  margin: '0 auto'
}));

// Add this new styled component for the verification badge
const VerificationBadge = styled('div')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 16,
  height: 16,
  borderRadius: '50%',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
  '& svg': {
    fontSize: 12
  }
}));

// const NFT_FLAGS = {
//     0x00000001: 'lsfBurnable',
//     0x00000002: 'lsfOnlyXRP',
//     0x00000004: 'lsfTrustLine',
//     0x00000008: 'lsfTransferable',
// }

function getCostFromOffers(nftOwner, offers, isSellOffer) {
  let xrpCost = null;
  let noXrpCost = null;
  for (const offer of offers) {
    const { amount, destination, flags, nft_offer_index, owner } = offer;

    let validOffer = true;

    // Remove destination check to allow offers without brokers
    // if (destination) validOffer = false;

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

function truncate(str, n) {
  if (!str) return '';
  //return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
  return str.length > n ? str.substr(0, n - 1) + ' ...' : str;
}

// Add this styled component near the top with other styled components
const StyledAccordion = styled(Accordion)(({ theme }) => ({
  backgroundColor: 'transparent',
  boxShadow: 'none',
  '&:before': {
    display: 'none' // Removes the default divider
  },
  '& .MuiAccordionSummary-root': {
    padding: theme.spacing(0, 1),
    minHeight: { xs: 48, sm: 56 },
    '&.Mui-expanded': {
      minHeight: { xs: 48, sm: 56 }
    },
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(0, 0.5)
    }
  },
  '& .MuiAccordionSummary-content': {
    margin: { xs: '8px 0', sm: '12px 0' },
    '&.Mui-expanded': {
      margin: { xs: '8px 0', sm: '12px 0' }
    }
  },
  '& .MuiAccordionDetails-root': {
    padding: { xs: theme.spacing(0.5), sm: theme.spacing(1) },
    [theme.breakpoints.down('sm')]: {
      padding: 0
    }
  }
}));

// Add this styled component for the badge
const OffersBadge = styled('span')(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.main,
  borderRadius: theme.shape.borderRadius,
  padding: '2px 8px',
  fontSize: '0.75rem',
  fontWeight: 'bold',
  marginLeft: theme.spacing(1)
}));

// Add this styled component for the offer count badge
const OfferCountBadge = styled('span')(({ theme }) => ({
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  color: theme.palette.primary.main,
  borderRadius: theme.shape.borderRadius,
  padding: '2px 8px',
  fontSize: '0.75rem',
  fontWeight: 'bold',
  marginLeft: theme.spacing(1)
}));

// Add this new component to display the price warning
function PriceWarningIcon({ discrepancy, floorPrice }) {
  if (discrepancy <= 0.9) {
    return null;
  }

  return (
    <Tooltip
      title={`This offer is ${Math.round(
        discrepancy * 100
      )}% below the floor price of ${fNumber(floorPrice)} XRP.`}
    >
      <WarningIcon sx={{ color: 'orange', width: 24, height: 24 }} />
    </Tooltip>
  );
}

// Update helper function to handle different decimal places based on broker
const formatXRPAmount = (amount, includeSymbol = true, brokerAddress = null) => {
  // Always use 2 decimal places for both buy and sell offers
  const num = parseFloat(amount);
  const withTwoDecimals = num.toFixed(2);
  // Remove trailing zero if it exists
  const formatted = withTwoDecimals.endsWith('0')
    ? withTwoDecimals.replace(/\.?0+$/, '')
    : withTwoDecimals;
  return includeSymbol ? `${formatted} XRP` : formatted;
};

// Add this new styled component near the top with other styled components
const RankingBadge = styled(Paper)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: theme.spacing(0.75, 1.5),
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: alpha(theme.palette.primary.main, 0.1),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  gap: theme.spacing(1),
  flex: 1
}));

// Add this new styled component near the top with other styled components
const MasterSequenceBadge = styled(Paper)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: theme.spacing(0.75, 1.5),
  borderRadius: theme.shape.borderRadius * 2,
  backgroundColor: alpha(theme.palette.secondary.main, 0.1),
  border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
  gap: theme.spacing(1),
  flex: 1
}));

// Add this styled component near the top with other styled components
const SquareAvatar = styled(Avatar)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  width: 56,
  height: 56,
  boxShadow: `0 4px 15px ${alpha(theme.palette.common.black, 0.1)}`,
  border: `2px solid ${alpha(theme.palette.background.paper, 0.9)}`,
  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'scale(1.05)'
  }
}));

// Add this new styled component near the top with other styled components
const OwnerCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: alpha(theme.palette.background.default, 0.6),
  borderRadius: theme.shape.borderRadius * 2,
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
}));

const OwnerInfo = styled('div')(({ theme }) => ({
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5)
}));

const OwnerAddress = styled(Link)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  color: theme.palette.text.primary,
  textDecoration: 'none',
  '&:hover': {
    color: theme.palette.primary.main
  }
}));

// Update the FloorPriceCard styling for a more prominent look
const FloorPriceCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1.5, 2),
  backgroundColor: alpha(theme.palette.primary.main, 0.04),
  borderRadius: theme.shape.borderRadius * 2,
  border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
  width: 'fit-content',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: alpha(theme.palette.primary.main, 0.08),
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
  }
}));

// Update the FloorPriceValue styling for better alignment
const FloorPriceValue = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  '& .icon': {
    color: theme.palette.primary.main,
    width: 20,
    height: 20
  },
  '& .amount': {
    fontWeight: 700,
    fontSize: '1.1rem',
    color: theme.palette.primary.main,
    letterSpacing: '0.02em'
  }
}));

// Add this new styled component near the top with other styled components
const CollectionHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: theme.spacing(2)
}));

const CollectionInfo = styled('div')(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5)
}));

const NFTTitle = styled(Typography)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginTop: theme.spacing(0.5),
  color: theme.palette.text.primary,
  fontWeight: 'bold'
}));

export default function NFTActions({ nft }) {
  const theme = useTheme();
  const anchorRef = useRef(null);
  const BASE_URL = 'https://api.xrpl.to/api';
  const { accountProfile, openSnackbar } = useContext(AppContext);
  const accountLogin = accountProfile?.account;
  const accountToken = accountProfile?.token;

  // const theme = useTheme();
  // const largescreen = useMediaQuery(theme => theme.breakpoints.up('md'));

  const {
    name,
    collection,
    cslug,
    cverified,
    cfloor,
    citems,
    rarity_rank,
    flag,
    type,
    account,
    minter,
    issuer,
    date,
    meta,
    URI,
    status,
    // cost,
    destination,
    NFTokenID,
    self,
    MasterSequence
  } = nft;

  const collectionName = collection || /*meta?.collection?.name ||*/ '[No Collection]';

  const nftName = name || /*meta?.name || meta?.Name ||*/ '[No Name]';

  const floorPrice = cfloor?.amount || 0;

  const accountLogo = getHashIcon(account);

  const shareUrl = `https://xrpnft.com/nft/${NFTokenID}`;
  const shareTitle = nftName;
  const shareDesc = meta?.description || '';

  const isOwner = accountLogin === account;
  const isBurnable = (flag & 0x00000001) > 0;

  const [openShare, setOpenShare] = useState(false);

  const [openCreateOffer, setOpenCreateOffer] = useState(false);
  const [openTransfer, setOpenTransfer] = useState(false);
  const [isSellOffer, setIsSellOffer] = useState(false);

  const [burnt, setBurnt] = useState(status === NFToken.BURNT);

  const [sellOffers, setSellOffers] = useState([]);
  const [buyOffers, setBuyOffers] = useState([]);

  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);

  const [acceptOffer, setAcceptOffer] = useState(null);
  const [openConfirm, setOpenConfirm] = useState(false);
  const [openSelectPrice, setOpenSelectPrice] = useState(false);

  const [qrType, setQrType] = useState('NFTokenAcceptOffer');

  const [cost, setCost] = useState(null);

  const [sync, setSync] = useState(0);

  const [lowestSellOffer, setLowestSellOffer] = useState(null);

  const [openCreateOfferXRPCafe, setOpenCreateOfferXRPCafe] = useState(false);

  const [anchorEl, setAnchorEl] = useState(null);

  // Add this callback function to handle successful offer creation
  const handleOfferCreated = () => {
    // Increment sync to trigger useEffect and refresh offers
    setSync((prev) => prev + 1);
  };

  useEffect(() => {
    function getOffers() {
      setLoading(true);
      axios
        .get(`${BASE_URL}/offers/${NFTokenID}`)
        .then((res) => {
          let ret = res.status === 200 ? res.data : undefined;
          if (ret) {
            const offers = ret.sellOffers;
            const nftOwner = nft.account;
            setCost(getCostFromOffers(nftOwner, offers, true));

            setSellOffers(getValidOffers(ret.sellOffers, true));
            setBuyOffers(getValidOffers(ret.buyOffers, false));
          }
        })
        .catch((err) => {
        })
        .then(function () {
          // always executed
          setLoading(false);
        });
    }
    getOffers();
  }, [sync]);

  useEffect(() => {
    var timer = null;
    var isRunning = false;
    var counter = 150;
    var dispatchTimer = null;

    async function getDispatchResult() {
      try {
        const res = ret.data.data.response;
        // const account = res.account;
        const dispatched_result = res.dispatched_result;

        return dispatched_result;
      } catch (err) {}
    }

    const startInterval = () => {
      let times = 0;

      dispatchTimer = setInterval(async () => {
        const dispatched_result = await getDispatchResult();

        if (dispatched_result && dispatched_result === 'tesSUCCESS') {
          setSync(sync + 1);
          openSnackbar('Successful!', 'success');
          stopInterval();
          return;
        }

        times++;

        if (times >= 15) {
          openSnackbar('Rejected!', 'error');
          stopInterval();
          return;
        }
      }, 1200);
    };

    // Stop the interval
    const stopInterval = () => {
      clearInterval(dispatchTimer);
      handleScanQRClose();
    };

    async function getPayload() {
      if (isRunning) return;
      isRunning = true;
      try {
        const resolved_at = ret.data?.resolved_at;
        // const dispatched_result = ret.data?.dispatched_result;
        if (resolved_at) {
          startInterval();
          return;
        }
      } catch (err) {}
      isRunning = false;
      counter--;
      if (counter <= 0) {
        openSnackbar('Timeout!', 'error');
        handleScanQRClose();
      }
    }
      // timer = setInterval(getPayload, 2000); // TODO: Fix missing condition
    // }
    return () => {
      // if (timer) {
      //   clearInterval(timer);
      // }
    };
  }, []); // Added missing useEffect closing

  useEffect(() => {
    async function getLowestSellOffer() {
      if (!NFTokenID) return;

      let client = null;
      try {
        client = new Client('wss://s1.ripple.com');
        await client.connect();

        const request = {
          command: 'nft_sell_offers',
          nft_id: NFTokenID
        };

        const response = await client.request(request);

        // Find the lowest valid sell offer
        let lowestOffer = null;
        if (response.result.offers && response.result.offers.length > 0) {
          lowestOffer = response.result.offers.reduce(
            (min, offer) => {
              const amount = BigInt(offer.amount);
              const isValidAmount = amount > BigInt(0);
              const isValidOwner = offer.owner === nft.account;

              if (isValidAmount && isValidOwner && (!min.amount || amount < BigInt(min.amount))) {
                return { amount, offer };
              }
              return min;
            },
            { amount: null, offer: null }
          );
        }

        if (lowestOffer && lowestOffer.offer) {
          const baseAmount = parseFloat(
            parseFloat(dropsToXrp(lowestOffer.amount.toString())).toFixed(6)
          );
          const brokerAddress = lowestOffer.offer.destination;
          const hasBroker = brokerAddress && BROKER_ADDRESSES[brokerAddress];
          const brokerInfo = hasBroker ? BROKER_ADDRESSES[brokerAddress] : null;
          const brokerFeePercentage = brokerInfo ? brokerInfo.fee : 0;

          const brokerFee = hasBroker
            ? parseFloat((baseAmount * brokerFeePercentage).toFixed(6))
            : 0;
          const totalAmount = parseFloat((baseAmount + brokerFee).toFixed(6));

          setLowestSellOffer({
            baseAmount,
            totalAmount: hasBroker ? totalAmount : baseAmount,
            brokerFee,
            brokerFeePercentage,
            hasBroker,
            brokerName: brokerInfo ? brokerInfo.name : null,
            offerIndex: lowestOffer.offer.nft_offer_index,
            seller: lowestOffer.offer.owner,
            destination: brokerAddress,
            offer: lowestOffer.offer
          });
        } else {
          setLowestSellOffer(null);
        }
      } catch (error) {
        // Check for the "notFound" error which is normal when NFT has no sell offers
        const isNotFoundError =
          (error.name === 'RippledError' && error.data?.error === 'notFound') ||
          (error.message && error.message.includes('notFound')) ||
          error.toString().includes('notFound');

        if (isNotFoundError) {
          // This is normal - NFT has no sell offers
          setLowestSellOffer(null);
        } else {
          console.error('Error with XRPL connection or fetching NFT sell offers:', error);
        }
      } finally {
        if (client && client.isConnected()) {
          try {
            await client.disconnect();
          } catch (disconnectError) {
          }
        }
      }
    }

    getLowestSellOffer();
  }, [NFTokenID, nft.account]);

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

      const user_token = accountProfile.user_token;

      const body = {
        account: accountLogin,
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
        const nextlink = res.data.data.next;

        let newQrType = isAcceptOrCancel ? 'NFTokenAcceptOffer' : 'NFTokenCancelOffer';
        if (isSell) newQrType += ' [Sell Offer]';
        else newQrType += ' [Buy Offer]';

        setQrType(newQrType);
      }
    } catch (err) {
      console.error(err);
    }
    setPageLoading(false);
  };

  const handleScanQRClose = () => {
  };

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
          // Remove the owner check to display all valid sell offers
          if (nft.account === offer.owner) {
            newOffers.push(offer);
          }
        }
      } else {
        // Buy Offers
        if (nft.account === offer.owner) continue; // orphaned

        // Buy Offers - keep existing logic
        newOffers.push(offer);
      }
    }

    return newOffers;
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

  const handleCancelOffer = async (offer) => {
    // Sell Offer
    /*
        {
            "amount": {
                "currency": "534F4C4F00000000000000000000000000000000",
                "issuer": "rsoLo2S1kiGeCcn6hCUXVrCpGMWLrRrLZz",
                "value": "10"
            },
            "flags": 1,
            "nft_offer_index": "2212BFA0AAF995E9F9E9B6553DC97A1C37FB97334BBE8C5856CF7C7B1016D20E",
            "owner": "rHAfrQNDBohGbWuWTWzpJe1LQWyYVnbG2n"
        },
        {
            "amount": "10000000",
            "flags": 1,
            "nft_offer_index": "DF13A4FE5F44FF804015ED5C827F753BB7A1379651D88473CB50454EB0B89F17",
            "owner": "rHAfrQNDBohGbWuWTWzpJe1LQWyYVnbG2n"
        }
        */

    doProcessOffer(offer, false);
  };

  const handleAcceptOffer = async (offer) => {
    setAcceptOffer(offer);
    setOpenConfirm(true);
  };

  const onContinueAccept = async () => {
    doProcessOffer(acceptOffer, true);
  };

  const handleBuyNow = async () => {
    if (!lowestSellOffer) {
      openSnackbar('No valid sell offer available', 'error');
      return;
    }

    if (lowestSellOffer.hasBroker) {
      // Handle broker-mediated offers through XRP Cafe
      setOpenCreateOfferXRPCafe(true);
    } else {
      // Handle direct offers through normal accept offer flow
      handleAcceptOffer(lowestSellOffer.offer);
    }
  };

  const handleOpenShare = () => {
    setAnchorEl(anchorRef.current);
    setOpenShare(true);
  };

  const handleCloseShare = () => {
    setAnchorEl(null);
    setOpenShare(false);
  };

  const handleCloseCreateOffer = () => {
    setOpenCreateOffer(false);
    setIsSellOffer(false);
  };

  const handleCloseTransfer = () => {
    setOpenTransfer(false);
  };

  const handleShareClick = (event) => {
    setAnchorEl(event.currentTarget);
    setOpenShare(true);
  };

  const handleShareClose = () => {
    setAnchorEl(null);
    setOpenShare(false);
  };

  const parsedFloorPrice = cfloor?.amount ? parseFloat(cfloor.amount) : 0;

  return (
    <>
      <GlassPanel
        elevation={0}
        sx={{
          animation: 'fadeInScale 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
          '@keyframes fadeInScale': {
            '0%': {
              opacity: 0,
              transform: 'scale(0.95) translateY(20px)'
            },
            '100%': {
              opacity: 1,
              transform: 'scale(1) translateY(0)'
            }
          }
        }}
      >
        <Stack spacing={3}>
          {self && (
            <CollectionHeader>
              <CollectionInfo>
                {cslug ? (
                  <Link href={`/collection/${cslug}`} underline="none">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'text.secondary'
                        }}
                      >
                        {collectionName}
                      </Typography>
                      {cverified === 'yes' && (
                        <Tooltip title="Verified">
                          <VerificationBadge>
                            <CheckIcon />
                          </VerificationBadge>
                        </Tooltip>
                      )}
                    </Stack>
                  </Link>
                ) : (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary'
                      }}
                    >
                      {collectionName}
                    </Typography>
                    {cverified === 'yes' && (
                      <Tooltip title="Verified">
                        <VerificationBadge>
                          <CheckIcon />
                        </VerificationBadge>
                      </Tooltip>
                    )}
                  </Stack>
                )}

                <NFTTitle variant="h5">{nftName}</NFTTitle>

                <FloorPriceCard elevation={0}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography
                        variant="body2"
                        sx={{
                          color: 'primary.main',
                          fontWeight: 500,
                          letterSpacing: '0.02em'
                        }}
                      >
                        Global Floor
                      </Typography>
                      <Tooltip title="Collection-wide floor price">
                        <InfoIcon
                          sx={{
                            width: 16,
                            height: 16,
                            color: theme.palette.primary.main,
                            opacity: 0.7,
                            cursor: 'help'
                          }}
                        />
                      </Tooltip>
                    </Stack>
                    <FloorPriceValue>
                      <InfoIcon className="icon" />
                      <Typography className="amount">
                        {floorPrice > 0 ? fNumber(floorPrice) : '- - -'}
                      </Typography>
                    </FloorPriceValue>
                  </Stack>
                </FloorPriceCard>
              </CollectionInfo>

              <IconButton
                size="large"
                sx={{
                  background: (theme) =>
                    `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
                  boxShadow: (theme) => `0 4px 15px ${alpha(theme.palette.primary.main, 0.2)}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    background: (theme) =>
                      `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.25)} 0%, ${alpha(theme.palette.primary.main, 0.15)} 100%)`,
                    transform: 'translateY(-2px) rotate(15deg)',
                    boxShadow: (theme) => `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}`
                  },
                  color: 'primary.main'
                }}
                onClick={handleShareClick}
                ref={anchorRef}
              >
                <ShareIcon />
              </IconButton>
            </CollectionHeader>
          )}



          {/* Action buttons */}
          <Stack spacing={2}>
            {burnt ? (
              <Typography variant="h6" color="error">
                This NFT is burnt.
              </Typography>
            ) : isOwner ? (
              <Stack direction="row" spacing={2}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<LocalOfferIcon />}
                  onClick={handleCreateSellOffer}
                  disabled={!accountLogin || burnt}
                >
                  Sell
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<SendIcon />}
                  onClick={handleTransfer}
                  disabled={!accountLogin || burnt}
                >
                  Transfer
                </Button>
                <BurnNFT nft={nft} onHandleBurn={onHandleBurn} />
              </Stack>
            ) : (
              <Stack spacing={1.5}>
                {loading ? (
                  <PulseLoader color={theme.palette.primary.main} size={10} />
                ) : lowestSellOffer ? (
                  <Box sx={{ p: 1.5, backgroundColor: alpha(theme.palette.background.default, 0.4), borderRadius: '8px' }}>
                    <Stack spacing={0.8}>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption" sx={{ fontSize: '0.7rem', color: 'text.secondary' }}>Price</Typography>
                        <Typography variant="h6" sx={{ fontSize: '1.1rem', fontWeight: 600 }}>
                          ✕{formatXRPAmount(lowestSellOffer.totalAmount, false)}
                        </Typography>
                      </Stack>
                      {lowestSellOffer.hasBroker && (
                        <>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.disabled' }}>Base</Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>✕{lowestSellOffer.baseAmount}</Typography>
                          </Stack>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.disabled' }}>{lowestSellOffer.brokerName} Fee ({(lowestSellOffer.brokerFeePercentage * 100).toFixed(2)}%)</Typography>
                            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>✕{lowestSellOffer.brokerFee}</Typography>
                          </Stack>
                        </>
                      )}
                    </Stack>
                  </Box>
                ) : (
                  <Typography variant="caption" sx={{ color: 'text.disabled', textAlign: 'center', py: 1 }}>Not listed</Typography>
                )}
                {accountLogin ? (
                  <>
                    {lowestSellOffer && !burnt && (
                      <Button fullWidth variant="contained" onClick={handleBuyNow}>Buy Now</Button>
                    )}
                    <Button fullWidth disabled={burnt} variant="outlined" onClick={handleCreateBuyOffer}>Make Offer</Button>
                  </>
                ) : (
                  <Wallet />
                )}
              </Stack>
            )}
          </Stack>


          {/* Offers and History sections */}
          <Stack spacing={2}>
            {isOwner && (
              <StyledAccordion defaultExpanded>
                <AccordionSummary expandIcon={<ExpandMoreIcon color="primary" />}>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <LocalOfferIcon color="primary" />
                      <Typography variant="h6" color="primary.main">
                        Sell Offers
                      </Typography>
                    </Stack>
                    {sellOffers.length > 0 && (
                      <OffersBadge>
                        {sellOffers.length} {sellOffers.length === 1 ? 'Offer' : 'Offers'}
                      </OffersBadge>
                    )}
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  {loading ? (
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        py: 3
                      }}
                    >
                      <PulseLoader color={theme.palette.primary.main} size={10} />
                    </Box>
                  ) : sellOffers.length > 0 ? (
                    <Stack spacing={2}>
                      {sellOffers.map((offer, index) => {
                        const amount = normalizeAmount(offer.amount);
                        return (
                          <Paper
                            key={index}
                            sx={{
                              p: 2,
                              backgroundColor: (theme) =>
                                alpha(theme.palette.background.default, 0.6)
                            }}
                          >
                            <Stack spacing={2}>
                              <Stack
                                direction="row"
                                justifyContent="space-between"
                                alignItems="center"
                              >
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <InfoIcon sx={{ width: 20, height: 20 }} />
                                  <Typography variant="h6" fontWeight="bold">
                                    {formatXRPAmount(amount.amount, true, 'sell_offer')}
                                  </Typography>
                                </Stack>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  color="error"
                                  onClick={() => handleCancelOffer(offer)}
                                  startIcon={<InfoIcon />}
                                >
                                  Cancel
                                </Button>
                              </Stack>
                              {offer.destination && (
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography variant="body2" color="text.secondary">
                                    Broker:
                                  </Typography>
                                  <Typography variant="body2">
                                    {BROKER_ADDRESSES[offer.destination]?.name ||
                                      truncate(offer.destination, 16)}
                                  </Typography>
                                </Stack>
                              )}
                            </Stack>
                          </Paper>
                        );
                      })}
                    </Stack>
                  ) : (
                    <Box
                      sx={{
                        py: 4,
                        textAlign: 'center',
                        background: (theme) =>
                          `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.4)} 0%, ${alpha(theme.palette.background.default, 0.3)} 100%)`,
                        borderRadius: 2,
                        border: (theme) => `1px dashed ${alpha(theme.palette.divider, 0.3)}`
                      }}
                    >
                      <Typography color="text.secondary">No sell offers available</Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<LocalOfferIcon />}
                        onClick={handleCreateSellOffer}
                        sx={{ mt: 2 }}
                      >
                        Create Sell Offer
                      </Button>
                    </Box>
                  )}
                </AccordionDetails>
              </StyledAccordion>
            )}

            <StyledAccordion defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon color="primary" />}>
                <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <PanToolIcon color="primary" />
                    <Typography variant="h6" color="primary.main">
                      Buy Offers
                    </Typography>
                  </Stack>
                  {buyOffers.length > 0 && (
                    <OfferCountBadge>
                      {buyOffers.length} {buyOffers.length === 1 ? 'Offer' : 'Offers'}
                    </OfferCountBadge>
                  )}
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                {loading ? (
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      py: 3
                    }}
                  >
                    <PulseLoader color={theme.palette.primary.main} size={10} />
                  </Box>
                ) : buyOffers.length > 0 ? (
                  <Stack spacing={2}>
                    {buyOffers.map((offer, index) => {
                      const amount = normalizeAmount(offer.amount);
                      const offerPrice = parseFloat(amount.amount);
                      const discrepancy =
                        parsedFloorPrice > 0
                          ? (parsedFloorPrice - offerPrice) / parsedFloorPrice
                          : 0;

                      return (
                        <Paper
                          key={index}
                          sx={{
                            p: 2,
                            backgroundColor: (theme) => alpha(theme.palette.background.default, 0.6)
                          }}
                        >
                          <Stack spacing={2}>
                            <Stack
                              direction="row"
                              justifyContent="space-between"
                              alignItems="center"
                            >
                              <Stack direction="row" spacing={1} alignItems="center">
                                <InfoIcon sx={{ width: 20, height: 20 }} />
                                <Typography variant="h6" fontWeight="bold">
                                  {formatXRPAmount(amount.amount, true, offer.destination)}
                                </Typography>
                                <PriceWarningIcon
                                  discrepancy={discrepancy}
                                  floorPrice={parsedFloorPrice}
                                />
                              </Stack>
                              <Stack direction="row" spacing={1}>
                                {isOwner ? (
                                  <Button
                                    variant="contained"
                                    size="small"
                                    color="primary"
                                    onClick={() => handleAcceptOffer(offer)}
                                    startIcon={<CheckIcon />}
                                  >
                                    Accept
                                  </Button>
                                ) : (
                                  accountLogin === offer.owner && (
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      color="error"
                                      onClick={() => handleCancelOffer(offer)}
                                      startIcon={<InfoIcon />}
                                    >
                                      Cancel
                                    </Button>
                                  )
                                )}
                              </Stack>
                            </Stack>
                            <Stack spacing={1}>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography variant="body2" color="text.secondary">
                                  From:
                                </Typography>
                                <Link href={`/profile/${offer.owner}`} underline="hover">
                                  <Typography variant="body2">
                                    {truncate(offer.owner, 16)}
                                  </Typography>
                                </Link>
                              </Stack>
                              {offer.destination && (
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography variant="body2" color="text.secondary">
                                    Broker:
                                  </Typography>
                                  <Typography variant="body2">
                                    {BROKER_ADDRESSES[offer.destination]?.name ||
                                      truncate(offer.destination, 16)}
                                  </Typography>
                                </Stack>
                              )}
                            </Stack>
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                ) : (
                  <Box
                    sx={{
                      py: 4,
                      textAlign: 'center',
                      background: (theme) =>
                        `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.4)} 0%, ${alpha(theme.palette.background.default, 0.3)} 100%)`,
                      borderRadius: 2,
                      border: (theme) => `1px dashed ${alpha(theme.palette.divider, 0.3)}`
                    }}
                  >
                    <Typography color="text.secondary">No buy offers available</Typography>
                    {!isOwner && (
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<PanToolIcon />}
                        onClick={handleCreateBuyOffer}
                        sx={{ mt: 2 }}
                      >
                        Make Offer
                      </Button>
                    )}
                  </Box>
                )}
              </AccordionDetails>
            </StyledAccordion>

            <StyledAccordion defaultExpanded>
              <AccordionSummary
                expandIcon={
                  <ExpandMoreIcon color="primary" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                }
                sx={{
                  '& .MuiAccordionSummary-expandIconWrapper': {
                    marginRight: { xs: 0, sm: 1 }
                  }
                }}
              >
                <Stack direction="row" spacing={{ xs: 1, sm: 2 }} alignItems="center">
                  <HistoryIcon color="primary" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                  <Typography
                    variant={{ xs: 'body1', sm: 'h6' }}
                    color="primary.main"
                    sx={{ fontWeight: { xs: 600, sm: 500 } }}
                  >
                    History
                  </Typography>
                </Stack>
              </AccordionSummary>
              <AccordionDetails>
                <HistoryList nft={nft} />
              </AccordionDetails>
            </StyledAccordion>
          </Stack>
        </Stack>
        <CreateOfferDialog
          open={openCreateOffer}
          setOpen={setOpenCreateOffer}
          onClose={handleCloseCreateOffer}
          nft={nft}
          isSellOffer={isSellOffer}
          onOfferCreated={handleOfferCreated}
        />
        <TransferDialog
          open={openTransfer}
          setOpen={setOpenTransfer}
          onClose={handleCloseTransfer}
          nft={nft}
        />
        <CreateOfferXRPCafe
          open={openCreateOfferXRPCafe}
          setOpen={setOpenCreateOfferXRPCafe}
          nft={nft}
          isSellOffer={false}
          initialAmount={lowestSellOffer ? lowestSellOffer.totalAmount : 0}
          brokerFeePercentage={lowestSellOffer ? lowestSellOffer.brokerFeePercentage : 0}
          onOfferCreated={handleOfferCreated}
        />
        <ConfirmAcceptOfferDialog
          open={openConfirm}
          setOpen={setOpenConfirm}
          offer={acceptOffer}
          onContinue={onContinueAccept}
        />
      </GlassPanel>

      <Popover
        open={openShare}
        anchorEl={anchorEl}
        onClose={handleShareClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right'
        }}
        PaperProps={{
          sx: {
            p: 1,
            width: 200,
            '& .MuiMenuItem-root': {
              px: 1,
              typography: 'body2',
              borderRadius: 0.75
            }
          }
        }}
      >
        <Stack spacing={2} sx={{ p: 1 }}>
          <TwitterShareButton
            url={shareUrl}
            title={shareTitle}
            via="xrpnft"
            hashtags={['XRPL', 'NFT', 'XRP']}
          >
            <Button
              fullWidth
              variant="outlined"
              startIcon={
                <CloseIcon
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    padding: 0.5,
                    backgroundColor: 'black',
                    color: 'white'
                  }}
                />
              }
              sx={{ justifyContent: 'flex-start' }}
            >
              Share on X
            </Button>
          </TwitterShareButton>

          <FacebookShareButton url={shareUrl} quote={shareTitle}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FacebookIcon size={32} round />}
              sx={{ justifyContent: 'flex-start' }}
            >
              Share on Facebook
            </Button>
          </FacebookShareButton>

          <Button
            fullWidth
            variant="outlined"
            startIcon={<ContentCopyIcon />}
            onClick={() => {
              navigator.clipboard.writeText(shareUrl);
              openSnackbar('Link copied to clipboard!', 'success');
              handleShareClose();
            }}
            sx={{ justifyContent: 'flex-start' }}
          >
            Copy Link
          </Button>
        </Stack>
      </Popover>
    </>
  );
}

