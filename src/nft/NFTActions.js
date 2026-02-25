import api, { apiFetch } from 'src/utils/api';
import { useRef, useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { FacebookShareButton, TwitterShareButton, FacebookIcon } from '../components/ShareButtons';

// Lucide Icons
import {
  ChevronDown,
  Share2,
  BarChart3,
  MessageSquare,
  Check,
  Copy,
  Info,
  X,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Hand,
  Tag,
  MessageCircle
} from 'lucide-react';
import { ApiButton } from 'src/components/ApiEndpointsModal';

// Utils & Context
import { cn } from 'src/utils/cn';
import { ThemeContext, WalletContext, AppContext } from 'src/context/AppContext';
import { normalizeAmount } from 'src/utils/parseUtils';
import { fNumber, fIntNumber, getHashIcon } from 'src/utils/formatters';

// Components
import { PuffLoader, PulseLoader } from '../components/Spinners';
import OffersList from './OffersList';
import SelectPriceDialog from './SelectPriceDialog';
import HistoryList from './HistoryList';
import { ConnectWallet } from 'src/components/Wallet';
import TxPreviewModal from 'src/components/TxPreviewModal';

// XRPL - lazy loaded to avoid bundling ~150KB synchronously
const getXrpl = () => import('xrpl');
import { toast } from 'sonner';
import { submitTransaction, previewTransaction } from 'src/utils/api';

const getAlgorithmFromSeed = (seed) => seed.startsWith('sEd') ? 'ed25519' : 'secp256k1';

// Constants
const NFToken = {
  SELL_WITH_MINT_BULK: 'SELL_WITH_MINT_BULK',
  BURNT: 'BURNT'
};

const getMinterName = (account) => {
  const minterMap = {
    rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH: 'XLS-20d',
    rNH4g2bh86BQBKrW8bEiN8xLwKvF9YB4U1: 'OnXRP',
    rUL2FGRkkPqR5yjPH8C7X8zE6djZcX9X6t: 'XRPunks'
  };
  return minterMap[account] || null;
};

const BROKER_ADDRESSES = {
  rnPNSonfEN1TWkPH4Kwvkk3693sCT4tsZv: { fee: 0.015, name: 'Art Dept Fun' },
  rpx9JThQ2y37FaGeeJP7PXDUVEXY3PHZSC: { fee: 0.01589, name: 'XRP Cafe' },
  rpZqTPC8GvrSvEfFsUuHkmPCg29GdQuXhC: { fee: 0.015, name: 'BIDDS' },
  rDeizxSRo6JHjKnih9ivpPkyD2EgXQvhSB: { fee: 0.015, name: 'XPMarket' },
  rJcCJyJkiTXGcxU4Lt4ZvKJz8YmorZXu8r: { fee: 0.01, name: 'OpulenceX' }
};

function getCostFromOffers(nftOwner, offers, isSellOffer) {
  let xrpCost = null;
  let noXrpCost = null;
  for (const offer of offers) {
    const { amount, destination, flags, nft_offer_index, owner } = offer;
    let validOffer = true;
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
      if (!noXrpCost) noXrpCost = cost;
    }
  }
  return xrpCost || noXrpCost;
}

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.substr(0, n - 1) + ' ...' : str;
}

const formatXRPAmount = (amount, includeSymbol = true, brokerAddress = null) => {
  const num = parseFloat(amount);
  const withTwoDecimals = num.toFixed(2);
  const formatted = withTwoDecimals.endsWith('0')
    ? withTwoDecimals.replace(/\.?0+$/, '')
    : withTwoDecimals;
  return includeSymbol ? `${formatted} XRP` : formatted;
};

// Price Warning Component
function PriceWarningIcon({ discrepancy, floorPrice }) {
  if (discrepancy <= 0.9) return null;
  return (
    <div className="relative group">
      <AlertTriangle size={20} className="text-yellow-500 cursor-help" />
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
        This offer is {Math.round(discrepancy * 100)}% below the floor price of{' '}
        {fNumber(floorPrice)} XRP.
      </div>
    </div>
  );
}

export default function NFTActions({ nft }) {
  const router = useRouter();
  const anchorRef = useRef(null);
  const shareDropdownRef = useRef(null);
  const BASE_URL = 'https://api.xrpl.to/v1';
  const { themeName } = useContext(ThemeContext);
  const { accountProfile, setOpenWalletModal } = useContext(WalletContext);
  const { openSnackbar } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const accountLogin = accountProfile?.account;
  const accountToken = accountProfile?.token;

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
    destination,
    NFTokenID,
    self,
    MasterSequence
  } = nft;

  // Handle collection being an object {name, family} or a string
  const collectionName =
    typeof collection === 'string' ? collection : collection?.name || '[No Collection]';
  // Safely extract name - handle cases where name might be an object
  const rawNftName = name || meta?.name;
  const nftName =
    typeof rawNftName === 'string'
      ? rawNftName
      : rawNftName?.name || rawNftName?.family || '[No Name]';
  const floorPrice = cfloor?.amount || 0;
  const accountLogo = getHashIcon(account);
  const shareUrl = `https://xrpl.to/nft/${NFTokenID}`;
  const shareTitle = nftName;
  const shareDesc = typeof meta?.description === 'string' ? meta.description : '';
  const isOwner = accountLogin === account;
  const isBurnable = (flag & 0x00000001) > 0;

  const [openShare, setOpenShare] = useState(false);
  const [activeAction, setActiveAction] = useState(null); // 'sell' | 'transfer' | 'burn' | null
  const [transferAddress, setTransferAddress] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [burning, setBurning] = useState(false);
  const [burnt, setBurnt] = useState(status === NFToken.BURNT || nft.is_burned === true);
  const [sellOffers, setSellOffers] = useState([]);
  const [buyOffers, setBuyOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [acceptOffer, setAcceptOffer] = useState(null);
  const [openSelectPrice, setOpenSelectPrice] = useState(false);
  const [qrType, setQrType] = useState('NFTokenAcceptOffer');
  const [cost, setCost] = useState(null);
  const [sync, setSync] = useState(0);
  const [lowestSellOffer, setLowestSellOffer] = useState(null);
  const [offerAmount, setOfferAmount] = useState('');
  const [cancellingOffer, setCancellingOffer] = useState(null);
  const [creatingOffer, setCreatingOffer] = useState(false);

  // Simulation preview state
  const [simulating, setSimulating] = useState(false);
  const [txPreview, setTxPreview] = useState(null); // { type, willSucceed, error, tx, onConfirm }

  // Close share dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (shareDropdownRef.current && !shareDropdownRef.current.contains(e.target)) {
        setOpenShare(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOfferCreated = () => {
    setSync((prev) => prev + 1);
  };

  // Helper to get wallet seed
  const getWalletSeed = async () => {
    if (!accountProfile) return null;
    let seed = null;
    const { EncryptedWalletStorage, deviceFingerprint } = await import('src/utils/encryptedWalletStorage');
    const walletStorage = new EncryptedWalletStorage();
    const deviceKeyId = await deviceFingerprint.getDeviceId();
    if (deviceKeyId) {
      const storedPassword = await walletStorage.getWalletCredential(deviceKeyId);
      if (storedPassword) {
        const walletData = await walletStorage.getWallet(accountProfile.account, storedPassword);
        seed = walletData?.seed;
      }
    }
    return seed;
  };

  // Simulate transaction and show preview
  const simulateAndPreview = async (type, tx, onConfirm, description) => {
    setSimulating(true);
    try {
      // For buy offers, validate available balance first
      const isBuyOffer = tx.TransactionType === 'NFTokenCreateOffer' && tx.Flags === 0;
      if (isBuyOffer && tx.Amount) {
        try {
          const res = await apiFetch(`${BASE_URL}/submit/account/${tx.Account}/sequence`).then(r => r.json());
          if (res.success && res.balance !== undefined) {
            const reserve = 1 + ((res.ownerCount || 0) * 0.2);
            const available = res.balance - reserve;
            const amountXrp = parseInt(tx.Amount) / 1000000;
            if (amountXrp > available) {
              setTxPreview({
                type, description, willSucceed: false,
                error: `Insufficient balance. Need ${amountXrp.toFixed(2)} XRP but only ${available.toFixed(2)} XRP available (${reserve.toFixed(1)} XRP in reserve)`,
                engineResult: 'tecUNFUNDED_OFFER', tx, onConfirm
              });
              return;
            }
          }
        } catch (e) { console.warn('Balance check failed:', e); }
      }

      const result = await previewTransaction(tx);
      const willSucceed = result.engine_result === 'tesSUCCESS';
      setTxPreview({
        type,
        description,
        willSucceed,
        error: !willSucceed ? (result.engine_result_message || result.engine_result) : null,
        engineResult: result.engine_result,
        tx,
        onConfirm
      });
    } catch (err) {
      console.error('[NFTActions] Simulation error:', err);
      setTxPreview({
        type,
        description,
        willSucceed: false,
        error: err.message,
        engineResult: 'ERROR',
        tx,
        onConfirm
      });
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    function getOffers() {
      setLoading(true);
      api
        .get(`${BASE_URL}/nft/${NFTokenID}/offers`)
        .then((res) => {
          const ret = res.status === 200 ? res.data : undefined;
          if (ret && (ret.sellOffers || ret.buyOffers)) {
            const sellOffersData = ret.sellOffers || [];
            const buyOffersData = ret.buyOffers || [];
            const nftOwner = nft.account;
            setCost(getCostFromOffers(nftOwner, sellOffersData, true));
            setSellOffers(getValidOffers(sellOffersData, true));
            setBuyOffers(getValidOffers(buyOffersData, false));
          }
        })
        .catch((err) => {
          console.error('[NFTActions] Failed to fetch offers:', err);
        })
        .finally(() => setLoading(false));
    }
    getOffers();
  }, [sync]);

  // Get listing price and broker info
  useEffect(() => {
    if (!nft) return;

    const cost = nft.cost;
    // If no cost in NFT data, not listed
    if (!cost || !cost.amount || cost.amount <= 0) {
      setLowestSellOffer(null);
      return;
    }

    // Fetch offers to get broker info
    async function getOfferDetails() {
      try {
        const { dropsToXrp } = await getXrpl();
        const response = await api.get(`https://api.xrpl.to/v1/nft/${NFTokenID}/offers`);
        const sellOffers = response.data?.sellOffers || [];

        // Find the owner's valid offer that the current user can accept
        // Offers with a destination can only be accepted by that specific address
        const ownerOffer = sellOffers.find(
          (offer) =>
            offer.amount &&
            Number(offer.amount) > 0 &&
            offer.owner === nft.account &&
            offer.orphaned !== 'yes' &&
            (!offer.destination || offer.destination === accountLogin)
        );

        if (ownerOffer) {
          const baseAmount = parseFloat(dropsToXrp(ownerOffer.amount));
          const brokerAddress = ownerOffer.destination;
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
            offerIndex: ownerOffer.index || ownerOffer.nft_offer_index,
            seller: ownerOffer.owner,
            destination: brokerAddress,
            offer: ownerOffer
          });
        } else {
          // Check if there's a brokered offer (has destination) that user can't accept directly
          const brokeredOffer = sellOffers.find(
            (offer) =>
              offer.amount &&
              Number(offer.amount) > 0 &&
              offer.owner === nft.account &&
              offer.orphaned !== 'yes' &&
              offer.destination &&
              offer.destination !== accountLogin
          );

          if (brokeredOffer) {
            // Brokered listing - calculate total with broker fee
            const baseAmount = parseFloat(dropsToXrp(brokeredOffer.amount));
            const brokerInfo = BROKER_ADDRESSES[brokeredOffer.destination];
            const brokerFeePercentage = brokerInfo?.fee || 0.01589; // Default to XRP Cafe fee
            const brokerFee = parseFloat((baseAmount * brokerFeePercentage).toFixed(6));
            const totalAmount = parseFloat((baseAmount + brokerFee).toFixed(6));
            setLowestSellOffer({
              baseAmount,
              totalAmount,
              brokerFee,
              brokerFeePercentage,
              hasBroker: true,
              brokerName: brokerInfo?.name || brokeredOffer.origin || 'Marketplace',
              brokerOnly: true, // Flag indicating must create buy offer for broker
              brokerOrigin: brokeredOffer.origin,
              offerIndex: brokeredOffer.index || brokeredOffer.nft_offer_index,
              seller: nft.account,
              destination: brokeredOffer.destination,
              offer: brokeredOffer // Keep offer for brokered buy flow
            });
          } else {
            // Fallback to nft.cost if no valid offer found in offers endpoint
            const baseAmount = parseFloat(cost.amount);
            setLowestSellOffer({
              baseAmount,
              totalAmount: baseAmount,
              brokerFee: 0,
              brokerFeePercentage: 0,
              hasBroker: false,
              brokerName: null,
              offerIndex: null,
              seller: nft.account,
              destination: null,
              offer: null
            });
          }
        }
      } catch (error) {
        // Fallback to nft.cost on error
        const baseAmount = parseFloat(cost.amount);
        setLowestSellOffer({
          baseAmount,
          totalAmount: baseAmount,
          brokerFee: 0,
          brokerFeePercentage: 0,
          hasBroker: false,
          brokerName: null,
          offerIndex: null,
          seller: nft.account,
          destination: null,
          offer: null
        });
      }
    }

    getOfferDetails();
  }, [nft, NFTokenID, accountLogin]);

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
      if (accountLogin === owner) {
        openSnackbar('You are the owner of this offer, you can not accept it.', 'error');
        return;
      }
    } else {
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

      const res = await api.post(`${BASE_URL}/offers/acceptcancel`, body, {
        headers: { 'x-access-token': accountToken }
      });

      if (res.status === 200) {
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

  const getValidOffers = (offers, isSell) => {
    const newOffers = [];
    for (const offer of offers) {
      if (isSell) {
        if (isOwner) {
          if (accountLogin === offer.owner) newOffers.push(offer);
        } else {
          if (nft.account === offer.owner) newOffers.push(offer);
        }
      } else {
        if (nft.account === offer.owner) continue;
        newOffers.push(offer);
      }
    }
    return newOffers;
  };

  const handleCreateSellOffer = () => {
    setOfferAmount('');
    setActiveAction('sell');
  };
  const handleTransfer = () => {
    setTransferAddress('');
    setActiveAction('transfer');
  };
  const handleBurnAction = () => {
    setActiveAction('burn');
  };
  const handleCreateBuyOffer = () => {
    setOfferAmount('');
    setActiveAction('buy');
  };
  const onHandleBurn = () => {
    setBurnt(true);
  };
  const handleSubmitTransfer = async () => {
    if (!transferAddress) {
      openSnackbar('Enter destination address', 'error');
      return;
    }
    if (!accountProfile) {
      openSnackbar('Please connect your wallet', 'error');
      return;
    }
    setSimulating(true);

    const tx = {
      TransactionType: 'NFTokenCreateOffer',
      Account: accountLogin,
      NFTokenID,
      Amount: '0',
      Destination: transferAddress,
      Flags: 1,
      SourceTag: 161803
    };

    await simulateAndPreview('transfer', tx, executeTransfer, `Transfer to ${truncate(transferAddress, 12)}`);
  };

  const executeTransfer = async (tx) => {
    setTransferring(true);
    setTxPreview(null);
    const toastId = toast.loading('Transferring NFT...', { description: 'Signing...' });

    try {
      const { Wallet: XRPLWallet } = await getXrpl();
      const seed = await getWalletSeed();
      if (!seed) {
        toast.error('Authentication failed', { id: toastId });
        setTransferring(false);
        return;
      }

      const wallet = XRPLWallet.fromSeed(seed, { algorithm: getAlgorithmFromSeed(seed) });
      const result = await submitTransaction(wallet, tx);
      if (result.success) {
        toast.success('Transfer offer created', { id: toastId, description: 'Recipient must accept', duration: 5000 });
        setActiveAction(null);
        setTransferAddress('');
      }
    } catch (err) {
      console.error('Transfer NFT error:', err);
      toast.error('Transfer failed', { id: toastId, description: err.message });
    } finally {
      setTransferring(false);
    }
  };
  const handleSubmitBurn = async () => {
    if (!accountProfile) {
      openSnackbar('Please connect your wallet', 'error');
      return;
    }
    setSimulating(true);

    const tx = {
      TransactionType: 'NFTokenBurn',
      Account: accountLogin,
      NFTokenID,
      SourceTag: 161803
    };

    await simulateAndPreview('burn', tx, executeBurn, `Burn ${truncate(nftName, 20)}`);
  };

  const executeBurn = async (tx) => {
    setBurning(true);
    setTxPreview(null);
    const toastId = toast.loading('Burning NFT...', { description: 'Signing...' });

    try {
      const { Wallet: XRPLWallet } = await getXrpl();
      const seed = await getWalletSeed();
      if (!seed) {
        toast.error('Authentication failed', { id: toastId });
        setBurning(false);
        return;
      }

      const wallet = XRPLWallet.fromSeed(seed, { algorithm: getAlgorithmFromSeed(seed) });
      const result = await submitTransaction(wallet, tx);
      if (result.success) {
        toast.success('NFT burned', { id: toastId, duration: 5000 });
        setActiveAction(null);
        setBurnt(true);
      }
    } catch (err) {
      console.error('Burn NFT error:', err);
      toast.error('Burn failed', { id: toastId, description: err.message });
    } finally {
      setBurning(false);
    }
  };
  const handleCancelOffer = async (offer) => {
    const offerId = offer.nft_offer_index || offer.index || offer.id || offer._id;
    if (!offerId) {
      console.error('Cancel offer - no valid ID found:', offer);
      openSnackbar('Invalid offer', 'error');
      return;
    }
    if (!accountProfile) {
      openSnackbar('Please connect your wallet', 'error');
      return;
    }
    setCancellingOffer(offerId);
    const toastId = toast.loading('Cancelling offer...', { description: 'Connecting...' });

    try {
      let seed = null;
      const { EncryptedWalletStorage, deviceFingerprint } = await import('src/utils/encryptedWalletStorage');
      const walletStorage = new EncryptedWalletStorage();
      const deviceKeyId = await deviceFingerprint.getDeviceId();
      if (deviceKeyId) {
        const storedPassword = await walletStorage.getWalletCredential(deviceKeyId);
        if (storedPassword) {
          const walletData = await walletStorage.getWallet(accountProfile.account, storedPassword);
          seed = walletData?.seed;
        }
      }

      if (!seed) {
        toast.error('Authentication failed', { id: toastId, description: 'Could not retrieve wallet credentials' });
        setCancellingOffer(null);
        return;
      }

      toast.loading('Cancelling offer...', { id: toastId, description: 'Signing transaction...' });
      const { Wallet: XRPLWallet } = await getXrpl();
      const wallet = XRPLWallet.fromSeed(seed, { algorithm: getAlgorithmFromSeed(seed) });
      const tx = {
        TransactionType: 'NFTokenCancelOffer',
        Account: accountLogin,
        NFTokenOffers: [offerId],
        SourceTag: 161803
      };

      const result = await submitTransaction(wallet, tx);
      if (result.success) {
        toast.success('Offer cancelled', { id: toastId, duration: 5000 });
        // Remove from both lists (we don't know which type it was)
        setSellOffers(prev => prev.filter(o => (o.nft_offer_index || o.index || o.id || o._id) !== offerId));
        setBuyOffers(prev => prev.filter(o => (o.nft_offer_index || o.index || o.id || o._id) !== offerId));
      }
    } catch (err) {
      console.error('Cancel NFT offer error:', err);
      toast.error('Failed to cancel', { id: toastId, description: err.message });
    } finally {
      setCancellingOffer(null);
    }
  };

  const handleSubmitOffer = async () => {
    if (!offerAmount || parseFloat(offerAmount) <= 0) {
      openSnackbar('Enter a valid amount', 'error');
      return;
    }
    if (!accountProfile) {
      openSnackbar('Please connect your wallet', 'error');
      return;
    }
    setSimulating(true);

    const { xrpToDrops } = await getXrpl();
    const priceInDrops = xrpToDrops(offerAmount);
    const isSell = activeAction === 'sell';
    const tx = {
      TransactionType: 'NFTokenCreateOffer',
      Account: accountLogin,
      NFTokenID,
      Amount: priceInDrops,
      Flags: isSell ? 1 : 0,
      SourceTag: 161803
    };

    // Buy offers require Owner field (who owns the NFT we want to buy)
    if (!isSell) {
      tx.Owner = account; // NFT owner from nft prop
    }

    const desc = isSell ? `List for ${offerAmount} XRP` : `Offer ${offerAmount} XRP`;
    await simulateAndPreview('offer', tx, executeOffer, desc);
  };

  const executeOffer = async (tx) => {
    setCreatingOffer(true);
    setTxPreview(null);
    const isSell = tx.Flags === 1;
    const toastId = toast.loading('Creating offer...', { description: 'Signing...' });

    try {
      const { Wallet: XRPLWallet } = await getXrpl();
      const seed = await getWalletSeed();
      if (!seed) {
        toast.error('Authentication failed', { id: toastId });
        setCreatingOffer(false);
        return;
      }

      const wallet = XRPLWallet.fromSeed(seed, { algorithm: getAlgorithmFromSeed(seed) });
      const result = await submitTransaction(wallet, tx);
      if (result.success) {
        toast.success('Offer created', { id: toastId, duration: 5000 });
        const newOffer = {
          nft_offer_index: result.hash,
          amount: parseInt(tx.Amount),
          owner: accountLogin,
          flags: isSell ? 1 : 0
        };
        if (isSell) {
          setSellOffers(prev => [...prev, newOffer]);
        } else {
          setBuyOffers(prev => [...prev, newOffer]);
        }
        setActiveAction(null);
        setOfferAmount('');
      }
    } catch (err) {
      console.error('Create NFT offer error:', err);
      toast.error('Failed to create offer', { id: toastId, description: err.message });
    } finally {
      setCreatingOffer(false);
    }
  };

  const handleBuyNow = () => {
    if (!lowestSellOffer?.offer) {
      openSnackbar('No valid sell offer available', 'error');
      return;
    }
    setAcceptOffer(lowestSellOffer.offer);
  };

  // Handle brokered buy - create buy offer with broker destination
  const handleBrokerBuy = async () => {
    if (!lowestSellOffer?.brokerOnly || !lowestSellOffer?.destination) {
      openSnackbar('Invalid broker offer', 'error');
      return;
    }
    if (!accountProfile) {
      openSnackbar('Please connect your wallet', 'error');
      return;
    }
    setSimulating(true);

    const { xrpToDrops } = await getXrpl();
    const totalAmountDrops = xrpToDrops(lowestSellOffer.totalAmount.toString());
    const tx = {
      TransactionType: 'NFTokenCreateOffer',
      Account: accountLogin,
      NFTokenID,
      Owner: account, // NFT owner
      Amount: totalAmountDrops,
      Destination: lowestSellOffer.destination, // Broker address
      Flags: 0, // Buy offer
      SourceTag: 161803
    };

    const desc = `Buy via ${lowestSellOffer.brokerName} for ${lowestSellOffer.totalAmount} XRP`;
    await simulateAndPreview('brokerBuy', tx, executeBrokerBuy, desc);
  };

  const executeBrokerBuy = async (tx) => {
    setCreatingOffer(true);
    setTxPreview(null);
    const toastId = toast.loading('Creating buy offer...', { description: 'Signing...' });

    try {
      const { Wallet: XRPLWallet } = await getXrpl();
      const seed = await getWalletSeed();
      if (!seed) {
        toast.error('Authentication failed', { id: toastId });
        setCreatingOffer(false);
        return;
      }

      const wallet = XRPLWallet.fromSeed(seed, { algorithm: getAlgorithmFromSeed(seed) });
      const result = await submitTransaction(wallet, tx);
      if (result.success) {
        toast.success('Buy offer created', {
          id: toastId,
          description: 'Waiting for trade to complete...',
          duration: 30000
        });
        setAcceptOffer(null);
        // Poll for ownership change
        const pollOwner = async (attempts = 0) => {
          if (attempts > 30) { router.reload(); return; } // Fallback after 60s
          try {
            const res = await apiFetch(`${BASE_URL}/nft/${NFTokenID}`).then(r => r.json());
            if (res.account === accountLogin) {
              toast.success('Purchase complete!', { id: toastId, duration: 3000 });
              router.reload();
            } else {
              setTimeout(() => pollOwner(attempts + 1), 2000);
            }
          } catch { setTimeout(() => pollOwner(attempts + 1), 2000); }
        };
        pollOwner();
      }
    } catch (err) {
      console.error('Broker buy error:', err);
      toast.error('Failed to create offer', { id: toastId, description: err.message });
    } finally {
      setCreatingOffer(false);
    }
  };

  return (
    <>
      <TxPreviewModal
        isDark={isDark}
        simulating={simulating}
        preview={txPreview ? {
          status: txPreview.willSucceed ? 'success' : 'error',
          title: txPreview.willSucceed ? 'Ready to Execute' : 'Transaction Will Fail',
          description: txPreview.description,
          error: txPreview.error,
          engineResult: txPreview.engineResult,
          warning: txPreview.type === 'burn' && txPreview.willSucceed ? 'This action is irreversible. The NFT will be permanently destroyed.' : null
        } : null}
        onClose={() => { setTxPreview(null); setSimulating(false); }}
        onConfirm={txPreview?.willSucceed ? () => txPreview.onConfirm(txPreview.tx) : null}
        confirmLabel={txPreview?.type === 'burn' ? 'Burn NFT' : 'Confirm'}
        confirmColor={txPreview?.type === 'burn' ? '#ef4444' : '#3b82f6'}
      />

      {/* Main Glass Panel */}
      <div
        className={cn(
          'rounded-2xl p-5 border',
          isDark ? 'border-gray-700/50 bg-black' : 'border-gray-200 bg-white backdrop-blur-xl'
        )}
      >
        <div className="space-y-5">
          {/* Collection Header - Futuristic */}
          {self && (
            <div className="flex justify-between items-start">
              <div className={cn('relative pl-4 space-y-1.5')}>
                {/* Accent line */}
                <div
                  className={cn(
                    'absolute top-0 left-0 w-1 h-full rounded-full',
                    isDark
                      ? 'bg-gradient-to-b from-primary via-primary/50 to-transparent'
                      : 'bg-gradient-to-b from-primary via-primary/30 to-transparent'
                  )}
                />

                {/* Collection name */}
                {cslug ? (
                  <Link href={`/nfts/${cslug}`} className="inline-flex items-center gap-2 group">
                    <span
                      className={cn(
                        'text-[13px] font-medium uppercase tracking-wider transition-colors',
                        isDark
                          ? 'text-primary/70 group-hover:text-primary'
                          : 'text-primary/80 group-hover:text-primary'
                      )}
                    >
                      {collectionName}
                    </span>
                    {cverified === 'yes' && (
                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wide',
                          isDark
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        )}
                      >
                        Verified
                      </span>
                    )}
                  </Link>
                ) : (
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-[13px] font-medium uppercase tracking-wider',
                        isDark ? 'text-primary/70' : 'text-primary/80'
                      )}
                    >
                      {collectionName}
                    </span>
                    {cverified === 'yes' && (
                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wide',
                          isDark
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                            : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        )}
                      >
                        Verified
                      </span>
                    )}
                  </div>
                )}

                {/* NFT Name */}
                <h2
                  className={cn(
                    'text-xl font-semibold tracking-tight',
                    isDark ? 'text-white' : 'text-gray-900'
                  )}
                >
                  {nftName}
                </h2>

                {/* Floor Price - Enhanced */}
                <div
                  className={cn(
                    'inline-flex items-center gap-3 px-3 py-1.5 rounded-xl border',
                    isDark
                      ? 'border-white/[0.08] bg-gradient-to-r from-white/[0.04] to-transparent'
                      : 'border-gray-200 bg-gradient-to-r from-gray-100 to-gray-50'
                  )}
                >
                  <div className="flex items-center gap-1">
                    <span
                      className={cn(
                        'text-[11px] font-medium uppercase tracking-wider',
                        isDark ? 'text-gray-500' : 'text-gray-400'
                      )}
                    >
                      Floor
                    </span>
                    <Info size={12} className="text-gray-500 cursor-help" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className={cn(
                        'text-lg font-medium tabular-nums',
                        isDark ? 'text-white' : 'text-gray-900'
                      )}
                    >
                      {floorPrice > 0 ? fNumber(floorPrice) : '---'}
                    </span>
                    <span className="text-[11px] uppercase tracking-wide text-gray-500">XRP</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <ApiButton />
                {/* Share Button */}
                <div className="relative" ref={shareDropdownRef}>
                  <button
                    onClick={() => setOpenShare(!openShare)}
                    className={cn(
                      'px-3 py-2 rounded-lg border text-[13px] font-normal transition-colors',
                      isDark
                        ? 'border-gray-700/50 text-gray-400 hover:border-gray-600 hover:text-gray-300'
                        : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-700'
                    )}
                  >
                    Share
                  </button>

                  {openShare && (
                    <div
                      className={cn(
                        'absolute top-full right-0 mt-2 p-2 w-52 rounded-xl border backdrop-blur-xl z-50',
                        isDark ? 'border-gray-700/50 bg-black/90' : 'border-gray-200 bg-white'
                      )}
                    >
                      <div className="space-y-1">
                        <TwitterShareButton
                          url={shareUrl}
                          title={shareTitle}
                          via="xrpnft"
                          hashtags={['XRPL', 'NFT', 'XRP']}
                        >
                          <button
                            className={cn(
                              'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-normal transition-colors',
                              isDark
                                ? 'text-gray-300 hover:bg-white/5'
                                : 'text-gray-700 hover:bg-gray-100'
                            )}
                          >
                            <X size={16} className="p-0.5 rounded bg-white text-black" />
                            Share on X
                          </button>
                        </TwitterShareButton>

                        <FacebookShareButton url={shareUrl} quote={shareTitle}>
                          <button
                            className={cn(
                              'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-normal transition-colors',
                              isDark
                                ? 'text-gray-300 hover:bg-white/5'
                                : 'text-gray-700 hover:bg-gray-100'
                            )}
                          >
                            <FacebookIcon size={20} round />
                            Share on Facebook
                          </button>
                        </FacebookShareButton>

                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(shareUrl);
                            openSnackbar('Link copied to clipboard!', 'success');
                            setOpenShare(false);
                          }}
                          className={cn(
                            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-normal transition-colors',
                            isDark
                              ? 'text-gray-300 hover:bg-white/5'
                              : 'text-gray-700 hover:bg-gray-100'
                          )}
                        >
                          <Copy size={16} />
                          Copy Link
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {burnt ? (
              <p className="text-lg text-red-400 font-normal">This NFT is burnt.</p>
            ) : isOwner ? (
              <div className="space-y-3">
                {activeAction === 'sell' ? (
                  <div className={cn('p-4 rounded-xl border', isDark ? 'border-gray-700/50 bg-white/5' : 'border-gray-200 bg-gray-50')}>
                    <p className={cn('text-[13px] font-medium mb-3', isDark ? 'text-white' : 'text-gray-900')}>Set your price</p>
                    <div className="flex items-center gap-2 mb-3">
                      <input
                        type="text"
                        placeholder="0.00"
                        value={offerAmount}
                        onChange={(e) => setOfferAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                        autoFocus
                        className={cn(
                          'flex-1 px-3 py-2 rounded-lg border text-[15px] outline-none transition-colors',
                          isDark
                            ? 'border-gray-700/50 bg-black/40 text-white placeholder:text-gray-600 focus:border-primary'
                            : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-primary'
                        )}
                      />
                      <span className={cn('text-[13px]', isDark ? 'text-gray-400' : 'text-gray-500')}>XRP</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setActiveAction(null); setOfferAmount(''); }}
                        className={cn('flex-1 py-2 rounded-lg text-[13px] border transition-colors', isDark ? 'border-gray-700/50 text-gray-400 hover:text-gray-300' : 'border-gray-300 text-gray-600 hover:text-gray-700')}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmitOffer}
                        disabled={!offerAmount || creatingOffer}
                        className={cn('flex-1 py-2 rounded-lg text-[13px] font-medium transition-colors', !offerAmount || creatingOffer ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/90')}
                      >
                        {creatingOffer ? 'Creating...' : 'List for Sale'}
                      </button>
                    </div>
                  </div>
                ) : activeAction === 'transfer' ? (
                  <div className={cn('p-4 rounded-xl border', isDark ? 'border-gray-700/50 bg-white/5' : 'border-gray-200 bg-gray-50')}>
                    <p className={cn('text-[13px] font-medium mb-3', isDark ? 'text-white' : 'text-gray-900')}>Transfer to</p>
                    <input
                      type="text"
                      placeholder="rAddress..."
                      value={transferAddress}
                      onChange={(e) => setTransferAddress(e.target.value)}
                      autoFocus
                      className={cn(
                        'w-full px-3 py-2 rounded-lg border text-[13px] font-mono outline-none transition-colors mb-3',
                        isDark
                          ? 'border-gray-700/50 bg-black/40 text-white placeholder:text-gray-600 focus:border-primary'
                          : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-primary'
                      )}
                    />
                    <p className={cn('text-[11px] mb-3', isDark ? 'text-yellow-500/80' : 'text-yellow-600')}>
                      This will transfer ownership. This action cannot be undone once user accepts.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setActiveAction(null); setTransferAddress(''); }}
                        className={cn('flex-1 py-2 rounded-lg text-[13px] border transition-colors', isDark ? 'border-gray-700/50 text-gray-400 hover:text-gray-300' : 'border-gray-300 text-gray-600 hover:text-gray-700')}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmitTransfer}
                        disabled={!transferAddress || transferring}
                        className={cn('flex-1 py-2 rounded-lg text-[13px] font-medium transition-colors', !transferAddress || transferring ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/90')}
                      >
                        {transferring ? 'Transferring...' : 'Transfer'}
                      </button>
                    </div>
                  </div>
                ) : activeAction === 'burn' ? (
                  <div className={cn('p-4 rounded-xl border', isDark ? 'border-red-500/20 bg-red-500/5' : 'border-red-200 bg-red-50')}>
                    <p className={cn('text-[13px] font-medium mb-2', isDark ? 'text-red-400' : 'text-red-600')}>Burn this NFT?</p>
                    <p className={cn('text-[11px] mb-3', isDark ? 'text-red-400/70' : 'text-red-500')}>
                      This action is permanent and cannot be undone. The NFT will be destroyed forever.
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveAction(null)}
                        className={cn('flex-1 py-2 rounded-lg text-[13px] border transition-colors', isDark ? 'border-gray-700/50 text-gray-400 hover:text-gray-300' : 'border-gray-300 text-gray-600 hover:text-gray-700')}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSubmitBurn}
                        disabled={burning}
                        className={cn('flex-1 py-2 rounded-lg text-[13px] font-medium transition-colors', burning ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-red-500 text-white hover:bg-red-600')}
                      >
                        {burning ? 'Burning...' : 'Confirm Burn'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={handleCreateSellOffer}
                      disabled={!accountLogin}
                      className={cn(
                        'flex-1 py-3 rounded-xl text-[15px] font-medium bg-primary text-white transition-all',
                        'hover:bg-primary/90 hover:shadow-[0_0_24px_rgba(66,133,244,0.4)]',
                        'active:scale-[0.98]',
                        !accountLogin && 'opacity-50 cursor-not-allowed hover:shadow-none'
                      )}
                    >
                      Sell
                    </button>
                    <button
                      onClick={handleTransfer}
                      disabled={!accountLogin}
                      className={cn(
                        'flex-1 py-3 rounded-xl text-[15px] font-normal border transition-colors',
                        isDark
                          ? 'border-gray-700/50 text-gray-300 hover:border-gray-600 hover:text-white'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400',
                        !accountLogin && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      Transfer
                    </button>
                    <button
                      onClick={handleBurnAction}
                      disabled={!accountLogin}
                      className={cn(
                        'flex-1 py-3 rounded-xl text-[15px] font-normal border transition-colors',
                        isDark
                          ? 'border-gray-700/50 text-gray-300 hover:border-gray-600 hover:text-white'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400',
                        !accountLogin && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      Burn
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {loading ? (
                  /* Skeleton loader for price */
                  <div
                    className={cn(
                      'p-4 rounded-xl border animate-pulse',
                      isDark ? 'border-white/[0.08] bg-white/[0.02]' : 'border-gray-200 bg-gray-50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={cn('h-3 w-12 rounded', isDark ? 'bg-white/10' : 'bg-gray-200')}
                      />
                      <div className="flex items-baseline gap-2">
                        <div
                          className={cn('h-8 w-24 rounded', isDark ? 'bg-white/10' : 'bg-gray-200')}
                        />
                        <div
                          className={cn('h-4 w-8 rounded', isDark ? 'bg-white/10' : 'bg-gray-200')}
                        />
                      </div>
                    </div>
                  </div>
                ) : lowestSellOffer ? (
                  <div
                    className={cn(
                      'p-4 rounded-xl border relative overflow-hidden',
                      isDark
                        ? 'border-primary/20 bg-gradient-to-br from-primary/[0.08] to-transparent'
                        : 'border-primary/20 bg-gradient-to-br from-primary/[0.05] to-gray-50'
                    )}
                  >
                    {/* Subtle glow */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative flex items-center justify-between">
                      <span
                        className={cn(
                          'text-[11px] uppercase tracking-wider font-medium',
                          isDark ? 'text-gray-500' : 'text-gray-400'
                        )}
                      >
                        Price
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span
                          className={cn(
                            'text-3xl font-semibold tabular-nums',
                            isDark
                              ? 'text-primary drop-shadow-[0_0_12px_rgba(66,133,244,0.4)]'
                              : 'text-primary'
                          )}
                        >
                          {formatXRPAmount(lowestSellOffer.totalAmount, false)}
                        </span>
                        <span
                          className={cn(
                            'text-sm uppercase tracking-wide',
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          )}
                        >
                          XRP
                        </span>
                      </div>
                    </div>
                    {lowestSellOffer.hasBroker && (
                      <div
                        className={cn(
                          'mt-3 pt-3 border-t',
                          isDark ? 'border-white/[0.08]' : 'border-gray-200'
                        )}
                      >
                        <div className="flex justify-between text-[11px] text-gray-500">
                          <span>Base: {lowestSellOffer.baseAmount} XRP</span>
                          <span>
                            {lowestSellOffer.brokerName}: +{lowestSellOffer.brokerFee.toFixed(2)}{' '}
                            XRP
                          </span>
                        </div>
                      </div>
                    )}
                    {lowestSellOffer.brokerOnly && (
                      <div
                        className={cn(
                          'mt-3 pt-3 border-t',
                          isDark ? 'border-white/[0.08]' : 'border-gray-200'
                        )}
                      >
                        <p className={cn('text-[11px]', isDark ? 'text-amber-400/80' : 'text-amber-600')}>
                          Listed exclusively on {lowestSellOffer.brokerName || lowestSellOffer.brokerOrigin || 'external marketplace'}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Not listed state - improved */
                  <div
                    className={cn(
                      'p-4 rounded-xl border-[1.5px] border-dashed text-center',
                      isDark ? 'border-white/[0.1] bg-white/[0.02]' : 'border-gray-300 bg-gray-50'
                    )}
                  >
                    <p
                      className={cn(
                        'text-sm font-medium mb-1',
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      )}
                    >
                      Not listed for sale
                    </p>
                    <p className={cn('text-[11px]', isDark ? 'text-gray-600' : 'text-gray-400')}>
                      Make an offer below
                    </p>
                  </div>
                )}

                {accountLogin ? (
                  <>
                    {/* Fraud Warning Banner */}
                    {lowestSellOffer?.offer?.fraud && (
                      <div
                        className={cn(
                          'p-3 rounded-xl border flex items-center gap-3',
                          'border-red-500/50 bg-red-500/10'
                        )}
                      >
                        <AlertTriangle className="text-red-500 shrink-0" size={20} />
                        <div>
                          <p className="text-red-400 text-sm font-medium">Scam Warning</p>
                          <p className="text-red-400/70 text-xs">
                            This is a destination-targeted scam. Accepting will TAKE your XRP, not give you rewards.
                          </p>
                        </div>
                      </div>
                    )}
                    {/* Broker-only listing - create buy offer via broker */}
                    {lowestSellOffer?.brokerOnly && !burnt && lowestSellOffer?.offer && (
                      acceptOffer?.nft_offer_index === lowestSellOffer.offer?.nft_offer_index ||
                      acceptOffer?.index === lowestSellOffer.offer?.index ? (
                        <div
                          className={cn(
                            'p-3 rounded-xl border',
                            isDark ? 'border-gray-700/50 bg-white/5' : 'border-gray-200 bg-gray-50'
                          )}
                        >
                          <p className={cn('text-[12px] mb-2', isDark ? 'text-gray-400' : 'text-gray-600')}>
                            Buy via {lowestSellOffer.brokerName} for{' '}
                            <span className={isDark ? 'text-white' : 'text-gray-900'}>
                              {formatXRPAmount(lowestSellOffer.totalAmount)}
                            </span>?
                          </p>
                          <p className={cn('text-[10px] mb-2', isDark ? 'text-gray-500' : 'text-gray-400')}>
                            Includes {lowestSellOffer.brokerFee.toFixed(2)} XRP broker fee
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setAcceptOffer(null)}
                              className={cn(
                                'flex-1 py-2 rounded-lg text-[13px] border transition-colors',
                                isDark ? 'border-gray-700/50 text-gray-400' : 'border-gray-300 text-gray-600'
                              )}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleBrokerBuy}
                              disabled={creatingOffer}
                              className="flex-1 py-2 rounded-lg text-[13px] font-normal bg-primary/90 text-white hover:bg-primary transition-colors"
                            >
                              {creatingOffer ? 'Creating...' : 'Confirm'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAcceptOffer(lowestSellOffer.offer)}
                          className={cn(
                            'w-full py-3.5 rounded-xl text-[15px] font-medium transition-all',
                            'bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_24px_rgba(66,133,244,0.4)] active:scale-[0.98]'
                          )}
                        >
                          Buy Now
                        </button>
                      )
                    )}
                    {/* Regular buy flow */}
                    {lowestSellOffer &&
                      !burnt &&
                      !lowestSellOffer?.offer?.fraud &&
                      !lowestSellOffer?.brokerOnly &&
                      (acceptOffer &&
                      acceptOffer?.nft_offer_index === lowestSellOffer.offer?.nft_offer_index ? (
                        <div
                          className={cn(
                            'p-3 rounded-xl border',
                            isDark ? 'border-gray-700/50 bg-white/5' : 'border-gray-200 bg-gray-50'
                          )}
                        >
                          <p
                            className={cn(
                              'text-[12px] mb-2',
                              isDark ? 'text-gray-400' : 'text-gray-600'
                            )}
                          >
                            Buy{' '}
                            <span className={isDark ? 'text-white' : 'text-gray-900'}>
                              {truncate(nftName, 20)}
                            </span>{' '}
                            for {formatXRPAmount(lowestSellOffer.totalAmount)}?
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setAcceptOffer(null)}
                              className={cn(
                                'flex-1 py-2 rounded-lg text-[13px] border transition-colors',
                                isDark
                                  ? 'border-gray-700/50 text-gray-400 hover:text-gray-300'
                                  : 'border-gray-300 text-gray-600 hover:text-gray-700'
                              )}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                doProcessOffer(lowestSellOffer.offer, true);
                                setAcceptOffer(null);
                              }}
                              className="flex-1 py-2 rounded-lg text-[13px] font-normal bg-primary/90 text-white hover:bg-primary transition-colors"
                            >
                              Confirm
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={handleBuyNow}
                          disabled={lowestSellOffer?.offer?.fraud}
                          className={cn(
                            'w-full py-3.5 rounded-xl text-[15px] font-medium transition-all',
                            lowestSellOffer?.offer?.fraud
                              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                              : 'bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_24px_rgba(66,133,244,0.4)] active:scale-[0.98]'
                          )}
                        >
                          {lowestSellOffer?.offer?.fraud ? 'Blocked - Scam Detected' : 'Buy Now'}
                        </button>
                      ))}
                    {!burnt &&
                      (activeAction === 'buy' ? (
                        <div
                          className={cn(
                            'p-3 rounded-xl border',
                            isDark ? 'border-gray-700/50 bg-white/5' : 'border-gray-200 bg-gray-50'
                          )}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="text"
                              placeholder="0.00"
                              value={offerAmount}
                              onChange={(e) =>
                                setOfferAmount(e.target.value.replace(/[^0-9.]/g, ''))
                              }
                              autoFocus
                              className={cn(
                                'flex-1 px-3 py-2 rounded-lg border text-[15px] outline-none transition-colors',
                                isDark
                                  ? 'border-gray-700/50 bg-black/40 text-white placeholder:text-gray-600 focus:border-gray-600'
                                  : 'border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-gray-400'
                              )}
                            />
                            <span className="text-[13px] text-gray-500">XRP</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setActiveAction(null);
                                setOfferAmount('');
                              }}
                              className={cn(
                                'flex-1 py-2 rounded-lg text-[13px] border transition-colors',
                                isDark
                                  ? 'border-gray-700/50 text-gray-400 hover:text-gray-300'
                                  : 'border-gray-300 text-gray-600 hover:text-gray-700'
                              )}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSubmitOffer}
                              disabled={!offerAmount || creatingOffer}
                              className={cn(
                                'flex-1 py-2 rounded-lg text-[13px] font-normal transition-colors',
                                !offerAmount || creatingOffer
                                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                  : 'bg-primary/90 text-white hover:bg-primary'
                              )}
                            >
                              {creatingOffer ? 'Creating...' : 'Submit'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={handleCreateBuyOffer}
                          className={cn(
                            'w-full py-3 rounded-xl text-[15px] font-normal border transition-colors',
                            isDark
                              ? 'border-gray-700/50 text-gray-300 hover:border-gray-600 hover:text-white'
                              : 'border-gray-300 text-gray-700 hover:border-gray-400'
                          )}
                        >
                          Make Offer
                        </button>
                      ))}
                  </>
                ) : (
                  <ConnectWallet />
                )}
              </div>
            )}
          </div>

          {/* Offers and History */}
          <div className="space-y-5">
            {/* Sell Offers (only for owner) */}
            {isOwner && (
              <div>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <p
                    className={cn(
                      'text-sm font-normal',
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    )}
                  >
                    Sell Offers
                  </p>
                  {sellOffers.length > 0 && (
                    <span
                      className={cn(
                        'min-w-[24px] h-6 flex items-center justify-center rounded text-[11px] font-normal border',
                        isDark
                          ? 'border-gray-700/50 text-white/60'
                          : 'border-gray-300 text-gray-500'
                      )}
                    >
                      {sellOffers.length}
                    </span>
                  )}
                </div>
                {loading ? (
                  /* Skeleton loader for sell offers */
                  <div
                    className={cn(
                      'rounded-xl border overflow-hidden',
                      isDark ? 'border-gray-700/50' : 'border-gray-200'
                    )}
                  >
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className={cn(
                          'px-4 py-3 animate-pulse',
                          i < 2 &&
                            (isDark ? 'border-b border-gray-700/30' : 'border-b border-gray-200')
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div
                            className={cn(
                              'h-5 w-20 rounded',
                              isDark ? 'bg-white/10' : 'bg-gray-200'
                            )}
                          />
                          <div
                            className={cn(
                              'h-6 w-16 rounded',
                              isDark ? 'bg-white/10' : 'bg-gray-200'
                            )}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : sellOffers.length > 0 ? (
                  <div
                    className={cn(
                      'rounded-xl border overflow-hidden',
                      isDark ? 'border-gray-700/50' : 'border-gray-200'
                    )}
                  >
                    {sellOffers.map((offer, index) => {
                      const amount = normalizeAmount(offer.amount);
                      const isLast = index === sellOffers.length - 1;
                      return (
                        <div
                          key={index}
                          className={cn(
                            'px-4 py-3',
                            !isLast &&
                              (isDark ? 'border-b border-gray-700/30' : 'border-b border-gray-200')
                          )}
                        >
                          <div className="flex justify-between items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <span
                                className={cn(
                                  'text-[15px] font-mono font-normal tabular-nums',
                                  isDark ? 'text-white' : 'text-gray-900'
                                )}
                              >
                                {formatXRPAmount(amount.amount, false)} XRP
                              </span>
                              {offer.destination && (
                                <span className={cn('block text-[11px] mt-0.5', isDark ? 'text-white/60' : 'text-gray-500')}>
                                  {BROKER_ADDRESSES[offer.destination]?.name ||
                                    truncate(offer.destination, 10)}
                                </span>
                              )}
                            </div>
                            {!burnt && (() => {
                              const oid = offer.nft_offer_index || offer.index || offer.id || offer._id;
                              return (
                                <button
                                  onClick={() => handleCancelOffer(offer)}
                                  disabled={cancellingOffer === oid}
                                  className={cn(
                                    "px-3 py-1.5 rounded-lg text-[11px] font-normal border border-red-500/40 text-red-400 transition-colors",
                                    cancellingOffer === oid ? "opacity-50 cursor-not-allowed" : "hover:bg-red-500/10"
                                  )}
                                >
                                  {cancellingOffer === oid ? 'Cancelling...' : 'Cancel'}
                                </button>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    className={cn(
                      'py-6 text-center rounded-xl border border-dashed',
                      isDark ? 'border-gray-700/50 bg-white/[0.02]' : 'border-gray-300 bg-gray-50'
                    )}
                  >
                    <p className={cn('text-sm', isDark ? 'text-white/60' : 'text-gray-500')}>
                      {burnt ? 'NFT has been burned' : 'No active listings'}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Buy Offers */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <p
                    className={cn(
                      'text-sm font-normal',
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    )}
                  >
                    Buy Offers
                  </p>
                  {buyOffers.length > 0 && (
                    <span
                      className={cn(
                        'min-w-[24px] h-6 flex items-center justify-center rounded text-[11px] font-normal border',
                        isDark
                          ? 'border-gray-700/50 text-white/60'
                          : 'border-gray-300 text-gray-500'
                      )}
                    >
                      {buyOffers.length}
                    </span>
                  )}
                </div>
                {lowestSellOffer && (
                  <span className={cn('text-[11px]', isDark ? 'text-white/60' : 'text-gray-500')}>
                    Ask: {fNumber(lowestSellOffer.baseAmount)} XRP
                  </span>
                )}
              </div>
              {loading ? (
                /* Skeleton loader for offers */
                <div
                  className={cn(
                    'rounded-xl border overflow-hidden',
                    isDark ? 'border-gray-700/50' : 'border-gray-200'
                  )}
                >
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={cn(
                        'px-4 py-3 animate-pulse',
                        i < 3 &&
                          (isDark ? 'border-b border-gray-700/30' : 'border-b border-gray-200')
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={cn('h-3 w-24 rounded', isDark ? 'bg-white/10' : 'bg-gray-200')}
                        />
                        <div className="flex items-center gap-2">
                          <div
                            className={cn(
                              'h-4 w-16 rounded',
                              isDark ? 'bg-white/10' : 'bg-gray-200'
                            )}
                          />
                          <div
                            className={cn(
                              'h-6 w-14 rounded',
                              isDark ? 'bg-white/10' : 'bg-gray-200'
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : buyOffers.length > 0 ? (
                <div
                  className={cn(
                    'rounded-xl border overflow-hidden max-h-[300px] overflow-y-auto',
                    isDark ? 'border-gray-700/50' : 'border-gray-200'
                  )}
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {buyOffers.map((offer, index) => {
                    const amount = normalizeAmount(offer.amount);
                    const isLast = index === buyOffers.length - 1;
                    const askingPrice = lowestSellOffer?.baseAmount || 0;
                    const offerPercentRaw =
                      askingPrice > 0 ? (amount.amount / askingPrice) * 100 : 0;
                    const offerPercent = Math.round(offerPercentRaw);
                    const isScamLevel = askingPrice > 0 && offerPercentRaw < 5; // Less than 5% of asking
                    const isLowBall =
                      askingPrice > 0 && offerPercentRaw >= 5 && offerPercentRaw < 50;
                    const isReasonable = offerPercentRaw >= 80;
                    const displayPercent =
                      offerPercentRaw > 0 && offerPercentRaw < 1 ? '<1' : offerPercent.toString();
                    const isFunded = offer.funded !== false; // true or undefined = funded
                    return (
                      <div
                        key={index}
                        className={cn(
                          'px-4 py-2.5',
                          !isLast &&
                            (isDark ? 'border-b border-gray-700/30' : 'border-b border-gray-200')
                        )}
                      >
                        <div className="flex items-center justify-between gap-3">
                          {/* Left: Address + Broker + Funded Status */}
                          <div className="flex items-center gap-2 min-w-0">
                            <Link
                              href={`/address/${offer.owner}`}
                              className={cn('text-[12px] font-mono transition-[background-color]', isDark ? 'text-white/60 hover:text-white' : 'text-gray-400 hover:text-gray-300')}
                            >
                              {truncate(offer.owner, 12)}
                            </Link>
                            <button
                              onClick={() => window.dispatchEvent(new CustomEvent('openDm', { detail: { user: offer.owner } }))}
                              className={cn('p-1 rounded hover:bg-white/10 transition-[background-color]', isDark ? 'text-white/60 hover:text-[#650CD4]' : 'text-gray-500 hover:text-[#650CD4]')}
                              title="Message buyer"
                            >
                              <MessageCircle size={12} />
                            </button>
                            {offer.destination && (
                              <>
                                <span className="text-gray-700">·</span>
                                <span className={cn('text-[11px]', isDark ? 'text-white/60' : 'text-gray-500')}>
                                  {BROKER_ADDRESSES[offer.destination]?.name || 'Broker'}
                                </span>
                              </>
                            )}
                            {!isFunded && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide bg-red-500/20 text-red-300">
                                Unfunded
                              </span>
                            )}
                          </div>
                          {/* Right: Amount + % + Action */}
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center gap-2">
                              <span
                                className={cn(
                                  'text-[14px] font-mono tabular-nums',
                                  isDark ? 'text-white' : 'text-gray-900'
                                )}
                              >
                                {formatXRPAmount(amount.amount, false)} XRP
                              </span>
                              {askingPrice > 0 && (
                                <div className="flex items-center gap-1.5">
                                  {isScamLevel && (
                                    <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-red-500/30 text-red-300 border border-red-500/40">
                                      <AlertTriangle size={10} />
                                      Suspicious
                                    </span>
                                  )}
                                  <span
                                    className={cn(
                                      'px-1.5 py-0.5 rounded text-[10px] tabular-nums',
                                      isScamLevel
                                        ? 'bg-red-500/30 text-red-300 border border-red-500/40'
                                        : isLowBall
                                          ? 'bg-red-500/20 text-red-300'
                                          : isReasonable
                                            ? 'bg-green-500/20 text-green-300'
                                            : 'bg-white/10 text-white/60'
                                    )}
                                  >
                                    {displayPercent}%
                                  </span>
                                </div>
                              )}
                            </div>
                            {!burnt &&
                              (isOwner ? (
                                acceptOffer &&
                                acceptOffer.nft_offer_index === offer.nft_offer_index ? (
                                  <div className="flex items-center gap-2">
                                    {isScamLevel && (
                                      <span className="text-[10px] text-red-400 max-w-[100px] leading-tight">
                                        Only {displayPercent}% of asking!
                                      </span>
                                    )}
                                    <div className="flex gap-1.5">
                                      <button
                                        onClick={() => setAcceptOffer(null)}
                                        className="px-2 py-1 rounded text-[11px] border border-gray-700/50 text-white/60"
                                      >
                                        No
                                      </button>
                                      <button
                                        onClick={() => {
                                          doProcessOffer(offer, true);
                                          setAcceptOffer(null);
                                        }}
                                        className={cn(
                                          'px-2 py-1 rounded text-[11px] text-white',
                                          isScamLevel ? 'bg-red-500/90' : 'bg-green-500/90'
                                        )}
                                      >
                                        Yes
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setAcceptOffer(offer)}
                                    className={cn(
                                      'px-2.5 py-1 rounded text-[11px] border transition-colors',
                                      isScamLevel
                                        ? 'border-red-500/50 text-red-400 hover:bg-red-500/10'
                                        : isReasonable
                                          ? 'border-green-500/50 text-green-400 hover:bg-green-500/10'
                                          : 'border-gray-700/50 text-gray-400 hover:text-gray-300'
                                    )}
                                  >
                                    {isScamLevel ? 'Review' : 'Accept'}
                                  </button>
                                )
                              ) : accountLogin === offer.owner ? (() => {
                                const oid = offer.nft_offer_index || offer.index || offer.id || offer._id;
                                return (
                                  <button
                                    onClick={() => handleCancelOffer(offer)}
                                    disabled={cancellingOffer === oid}
                                    className={cn(
                                      "px-2.5 py-1 rounded text-[11px] border border-red-500/40 text-red-400 transition-colors",
                                      cancellingOffer === oid ? "opacity-50 cursor-not-allowed" : "hover:bg-red-500/10"
                                    )}
                                  >
                                    {cancellingOffer === oid ? 'Cancelling...' : 'Cancel'}
                                  </button>
                                );
                              })() : null)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div
                  className={cn(
                    'py-6 text-center rounded-xl border border-dashed',
                    isDark ? 'border-gray-700/50' : 'border-gray-300 bg-gray-50'
                  )}
                >
                  <p className={cn('text-sm', isDark ? 'text-white/60' : 'text-gray-500')}>No buy offers yet</p>
                </div>
              )}
            </div>

            {/* History */}
            <div>
              <p
                className={cn(
                  'text-sm font-normal mb-3 px-1',
                  isDark ? 'text-gray-300' : 'text-gray-700'
                )}
              >
                History
              </p>
              <HistoryList nft={nft} />
            </div>

          </div>
        </div>

      </div>
    </>
  );
}
