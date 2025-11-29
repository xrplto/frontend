import axios from 'axios';
import { useRef, useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { FacebookShareButton, TwitterShareButton, FacebookIcon } from '../components/ShareButtons';

// Lucide Icons
import {
  ChevronDown,
  Share2,
  BadgeCheck,
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
  Loader2,
  Star
} from 'lucide-react';

// Utils & Context
import { cn } from 'src/utils/cn';
import { AppContext } from 'src/AppContext';
import { normalizeAmount } from 'src/utils/parseUtils';
import { fNumber, fIntNumber, getHashIcon } from 'src/utils/formatters';

// Components
import { PuffLoader, PulseLoader } from '../components/Spinners';
import CreateOfferDialog from './CreateOfferDialog';
import ConfirmAcceptOfferDialog from './ConfirmAcceptOfferDialog';
import OffersList from './OffersList';
import SelectPriceDialog from './SelectPriceDialog';
import BurnNFT from './BurnNFT';
import TransferDialog from './TransferDialog';
import HistoryList from './HistoryList';
import Wallet from 'src/components/Wallet';
import CreateOfferXRPCafe from './CreateOfferXRPCafe';

// XRPL
import { Client } from 'xrpl';
import { xrpToDrops, dropsToXrp } from 'xrpl';

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
        This offer is {Math.round(discrepancy * 100)}% below the floor price of {fNumber(floorPrice)} XRP.
      </div>
    </div>
  );
}

export default function NFTActions({ nft }) {
  const anchorRef = useRef(null);
  const shareDropdownRef = useRef(null);
  const BASE_URL = 'https://api.xrpl.to/api';
  const { themeName, accountProfile, openSnackbar, setOpenWalletModal } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const accountLogin = accountProfile?.account;
  const accountToken = accountProfile?.token;
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

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

  const collectionName = collection || '[No Collection]';
  const nftName = name || '[No Name]';
  const floorPrice = cfloor?.amount || 0;
  const accountLogo = getHashIcon(account);
  const shareUrl = `https://xrpnft.com/nft/${NFTokenID}`;
  const shareTitle = nftName;
  const shareDesc = meta?.description || '';
  const isOwner = accountLogin === account;
  const isBurnable = (flag & 0x00000001) > 0;

  const [openShare, setOpenShare] = useState(false);
  const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
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

  // Check if NFT is in watchlist
  useEffect(() => {
    if (!accountLogin || !NFTokenID) return;
    axios
      .get(`https://api.xrpl.to/api/watchlist/nft?account=${accountLogin}`)
      .then((res) => {
        if (res.data?.result === 'success' && res.data.watchlist) {
          const allItems = Object.values(res.data.watchlist).flatMap(col => col.items || []);
          setIsWatchlisted(allItems.some(item => item.nftokenId === NFTokenID));
        }
      })
      .catch(() => {});
  }, [accountLogin, NFTokenID]);

  const toggleWatchlist = async () => {
    if (!accountLogin) {
      // Don't open modal - inline Wallet component handles this
      return;
    }
    setWatchlistLoading(true);
    try {
      const action = isWatchlisted ? 'remove' : 'add';
      const res = await axios.post(`https://api.xrpl.to/api/watchlist/nft`, {
        account: accountLogin,
        nftokenId: NFTokenID,
        action
      });
      if (res.data?.result === 'success') {
        setIsWatchlisted(!isWatchlisted);
        openSnackbar(isWatchlisted ? 'Removed from watchlist' : 'Added to watchlist', 'success');
      } else {
        openSnackbar(res.data?.message || 'Failed to update watchlist', 'error');
      }
    } catch (err) {
      console.error('Watchlist error:', err);
      openSnackbar(err.response?.data?.message || 'Failed to update watchlist', 'error');
    }
    setWatchlistLoading(false);
  };

  const handleOfferCreated = () => {
    setSync((prev) => prev + 1);
  };

  useEffect(() => {
    function getOffers() {
      setLoading(true);
      axios
        .get(`${BASE_URL}/nft/${NFTokenID}/offers`)
        .then((res) => {
          let ret = res.status === 200 ? res.data : undefined;
          if (ret && ret.result === 'success') {
            const offers = ret.sellOffers;
            const nftOwner = nft.account;
            setCost(getCostFromOffers(nftOwner, offers, true));
            setSellOffers(getValidOffers(ret.sellOffers, true));
            setBuyOffers(getValidOffers(ret.buyOffers, false));
          }
        })
        .catch((err) => {})
        .finally(() => setLoading(false));
    }
    getOffers();
  }, [sync]);

  useEffect(() => {
    async function getLowestSellOffer() {
      if (!NFTokenID) return;
      let client = null;
      try {
        client = new Client('wss://s1.ripple.com');
        await client.connect();
        const request = { command: 'nft_sell_offers', nft_id: NFTokenID };
        const response = await client.request(request);

        let lowestOffer = null;
        if (response.result.offers && response.result.offers.length > 0) {
          lowestOffer = response.result.offers.reduce(
            (min, offer) => {
              if (typeof offer.amount !== 'string') return min;
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
          const baseAmount = parseFloat(parseFloat(dropsToXrp(lowestOffer.amount.toString())).toFixed(6));
          const brokerAddress = lowestOffer.offer.destination;
          const hasBroker = brokerAddress && BROKER_ADDRESSES[brokerAddress];
          const brokerInfo = hasBroker ? BROKER_ADDRESSES[brokerAddress] : null;
          const brokerFeePercentage = brokerInfo ? brokerInfo.fee : 0;
          const brokerFee = hasBroker ? parseFloat((baseAmount * brokerFeePercentage).toFixed(6)) : 0;
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
        const isNotFoundError =
          (error.name === 'RippledError' && error.data?.error === 'notFound') ||
          (error.message && error.message.includes('notFound')) ||
          error.toString().includes('notFound');
        if (!isNotFoundError) {
          console.error('Error with XRPL connection or fetching NFT sell offers:', error);
        }
        setLowestSellOffer(null);
      } finally {
        if (client && client.isConnected()) {
          try { await client.disconnect(); } catch (e) {}
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

      const res = await axios.post(`${BASE_URL}/offers/acceptcancel`, body, {
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

  const handleCreateSellOffer = () => { setIsSellOffer(true); setOpenCreateOffer(true); };
  const handleTransfer = () => { setOpenTransfer(true); };
  const handleCreateBuyOffer = () => { setIsSellOffer(false); setOpenCreateOffer(true); };
  const onHandleBurn = () => { setBurnt(true); };
  const handleCancelOffer = async (offer) => { doProcessOffer(offer, false); };
  const handleAcceptOffer = async (offer) => { setAcceptOffer(offer); setOpenConfirm(true); };
  const onContinueAccept = async () => { doProcessOffer(acceptOffer, true); };

  const handleBuyNow = async () => {
    if (!lowestSellOffer) {
      openSnackbar('No valid sell offer available', 'error');
      return;
    }
    if (lowestSellOffer.hasBroker) {
      setOpenCreateOfferXRPCafe(true);
    } else {
      handleAcceptOffer(lowestSellOffer.offer);
    }
  };

  const handleCloseCreateOffer = () => { setOpenCreateOffer(false); setIsSellOffer(false); };
  const handleCloseTransfer = () => { setOpenTransfer(false); };

  return (
    <>
      {/* Main Glass Panel */}
      <div className={cn(
        'rounded-2xl p-4 border backdrop-blur-lg',
        isDark
          ? 'bg-white/5 border-primary/20'
          : 'bg-white/70 border-primary/15 shadow-lg shadow-primary/5'
      )}>
        <div className="space-y-4">
          {/* Collection Header */}
          {self && (
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                {cslug ? (
                  <Link href={`/collection/${cslug}`} className="inline-flex items-center gap-2 group">
                    <span className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
                      {collectionName}
                    </span>
                    {cverified === 'yes' && (
                      <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <Check size={10} className="text-white" />
                      </span>
                    )}
                  </Link>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className={cn('text-sm', isDark ? 'text-gray-400' : 'text-gray-500')}>
                      {collectionName}
                    </span>
                    {cverified === 'yes' && (
                      <span className="w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                        <Check size={10} className="text-white" />
                      </span>
                    )}
                  </div>
                )}

                <h2 className={cn('text-xl font-medium', isDark ? 'text-white' : 'text-gray-900')}>
                  {nftName}
                </h2>

                {/* Floor Price */}
                <div className={cn(
                  'inline-flex items-center gap-3 px-3 py-1.5 rounded-xl border',
                  isDark ? 'bg-primary/5 border-primary/15' : 'bg-primary/5 border-primary/10'
                )}>
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-primary font-normal">Global Floor</span>
                    <Info size={14} className="text-primary/70 cursor-help" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Info size={16} className="text-primary" />
                    <span className="text-lg text-primary font-normal">
                      {floorPrice > 0 ? fNumber(floorPrice) : '- - -'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Watchlist & Share Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={toggleWatchlist}
                  disabled={watchlistLoading}
                  className={cn(
                    'p-3 rounded-xl border transition-colors',
                    isWatchlisted
                      ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
                      : isDark
                        ? 'border-white/20 text-gray-400 hover:border-yellow-500/30 hover:text-yellow-500'
                        : 'border-gray-200 text-gray-400 hover:border-yellow-500/30 hover:text-yellow-500'
                  )}
                  title={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
                >
                  {watchlistLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Star size={20} fill={isWatchlisted ? 'currentColor' : 'none'} />
                  )}
                </button>
                <div className="relative" ref={shareDropdownRef}>
                  <button
                    onClick={() => setOpenShare(!openShare)}
                    className={cn(
                      'p-3 rounded-xl border transition-colors',
                      isDark
                        ? 'bg-primary/10 border-white/20 text-primary hover:border-primary/30'
                        : 'bg-primary/10 border-gray-200 text-primary hover:border-primary/30'
                    )}
                  >
                    <Share2 size={20} />
                  </button>

                {openShare && (
                  <div className={cn(
                    'absolute top-full right-0 mt-2 p-2 w-52 rounded-xl border z-50',
                    isDark ? 'bg-black/90 border-white/20 backdrop-blur-lg' : 'bg-white border-gray-200 shadow-lg'
                  )}>
                    <div className="space-y-2">
                      <TwitterShareButton url={shareUrl} title={shareTitle} via="xrpnft" hashtags={['XRPL', 'NFT', 'XRP']}>
                        <button className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-normal border transition-colors',
                          isDark ? 'border-white/15 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'
                        )}>
                          <X size={18} className="p-0.5 rounded-full bg-black text-white" />
                          Share on X
                        </button>
                      </TwitterShareButton>

                      <FacebookShareButton url={shareUrl} quote={shareTitle}>
                        <button className={cn(
                          'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-normal border transition-colors',
                          isDark ? 'border-white/15 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'
                        )}>
                          <FacebookIcon size={24} round />
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
                          'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-normal border transition-colors',
                          isDark ? 'border-white/15 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'
                        )}
                      >
                        <Copy size={18} />
                        Copy Link
                      </button>
                    </div>
                  </div>
                )}
                </div>
              </div>
            </div>
          )}

          {/* Watchlist Button (always visible) */}
          {!self && (
            <div className="flex justify-end">
              <button
                onClick={toggleWatchlist}
                disabled={watchlistLoading}
                className={cn(
                  'p-2.5 rounded-xl border transition-colors',
                  isWatchlisted
                    ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500'
                    : isDark
                      ? 'border-white/20 text-gray-400 hover:border-yellow-500/30 hover:text-yellow-500'
                      : 'border-gray-200 text-gray-400 hover:border-yellow-500/30 hover:text-yellow-500'
                )}
                title={isWatchlisted ? 'Remove from watchlist' : 'Add to watchlist'}
              >
                {watchlistLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Star size={18} fill={isWatchlisted ? 'currentColor' : 'none'} />
                )}
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {burnt ? (
              <p className="text-lg text-red-500 font-medium">This NFT is burnt.</p>
            ) : isOwner ? (
              <div className="flex gap-3">
                <button
                  onClick={handleCreateSellOffer}
                  disabled={!accountLogin || burnt}
                  className={cn(
                    'flex-1 py-3 rounded-xl text-[15px] font-normal border-[1.5px] transition-colors',
                    'border-primary text-primary hover:bg-primary/5',
                    (!accountLogin || burnt) && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  Sell
                </button>
                <button
                  onClick={handleTransfer}
                  disabled={!accountLogin || burnt}
                  className={cn(
                    'flex-1 py-3 rounded-xl text-[15px] font-normal border-[1.5px] transition-colors',
                    isDark ? 'border-white/20 text-white hover:border-white/30' : 'border-gray-200 text-gray-900 hover:border-gray-300',
                    (!accountLogin || burnt) && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  Transfer
                </button>
                <BurnNFT nft={nft} onHandleBurn={onHandleBurn} />
              </div>
            ) : (
              <div className="space-y-3">
                {loading ? (
                  <div className="flex justify-center py-3">
                    <PulseLoader color="#4285f4" size={10} />
                  </div>
                ) : lowestSellOffer ? (
                  <div className={cn(
                    'p-3 rounded-xl border',
                    isDark ? 'border-white/10' : 'border-gray-200'
                  )}>
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className={cn('text-xs', isDark ? 'text-gray-500' : 'text-gray-400')}>Price</span>
                        <span className={cn('text-base font-mono font-normal', isDark ? 'text-white' : 'text-gray-900')}>
                          {formatXRPAmount(lowestSellOffer.totalAmount, false)} XRP
                        </span>
                      </div>
                      {lowestSellOffer.hasBroker && (
                        <>
                          {showPriceBreakdown && (
                            <>
                              <div className="flex justify-between">
                                <span className={cn('text-[11px]', isDark ? 'text-gray-500' : 'text-gray-400')}>Base</span>
                                <span className="text-xs font-mono">{lowestSellOffer.baseAmount} XRP</span>
                              </div>
                              <div className="flex justify-between">
                                <span className={cn('text-[11px]', isDark ? 'text-gray-500' : 'text-gray-400')}>{lowestSellOffer.brokerName} Fee</span>
                                <span className="text-xs font-mono">{lowestSellOffer.brokerFee} XRP</span>
                              </div>
                            </>
                          )}
                          <button
                            onClick={() => setShowPriceBreakdown(!showPriceBreakdown)}
                            className={cn('block w-full text-right text-[10px] mt-1', isDark ? 'text-gray-600' : 'text-gray-400')}
                          >
                            {showPriceBreakdown ? '−' : '+'} breakdown
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className={cn('text-center py-2 text-sm', isDark ? 'text-gray-600' : 'text-gray-400')}>Not listed</p>
                )}

                {accountLogin ? (
                  <>
                    {lowestSellOffer && !burnt && (
                      <button
                        onClick={handleBuyNow}
                        className="w-full py-3 rounded-xl text-[15px] font-normal border-[1.5px] border-primary text-primary hover:bg-primary/5 transition-colors"
                      >
                        Buy Now
                      </button>
                    )}
                    <button
                      disabled={burnt}
                      onClick={handleCreateBuyOffer}
                      className={cn(
                        'w-full py-3 rounded-xl text-[15px] font-normal border-[1.5px] transition-colors',
                        isDark ? 'border-white/20 text-white hover:border-white/30' : 'border-gray-200 text-gray-900 hover:border-gray-300',
                        burnt && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      Make Offer
                    </button>
                  </>
                ) : (
                  <Wallet />
                )}
              </div>
            )}
          </div>

          {/* Offers and History */}
          <div className="space-y-4">
            {/* Sell Offers (only for owner) */}
            {isOwner && (
              <div>
                <div className="flex items-center gap-2 mb-3 px-2">
                  <h3 className={cn('text-sm font-normal', isDark ? 'text-white' : 'text-gray-900')}>Sell Offers</h3>
                  {sellOffers.length > 0 && (
                    <span className={cn(
                      'px-1.5 py-0.5 rounded text-[11px] font-normal border',
                      isDark ? 'border-white/20 text-gray-500' : 'border-gray-200 text-gray-400'
                    )}>
                      {sellOffers.length}
                    </span>
                  )}
                </div>
                {loading ? (
                  <div className="flex justify-center py-6">
                    <PulseLoader color="#4285f4" size={10} />
                  </div>
                ) : sellOffers.length > 0 ? (
                  <div className={cn('rounded-lg border overflow-hidden', isDark ? 'border-white/10' : 'border-gray-200')}>
                    {sellOffers.map((offer, index) => {
                      const amount = normalizeAmount(offer.amount);
                      const isLast = index === sellOffers.length - 1;
                      return (
                        <div key={index} className={cn('p-2.5', !isLast && (isDark ? 'border-b border-white/5' : 'border-b border-gray-100'))}>
                          <div className="flex justify-between items-center gap-3">
                            <div className="flex-1 min-w-0">
                              <span className={cn('text-sm font-mono font-normal', isDark ? 'text-white' : 'text-gray-900')}>
                                {formatXRPAmount(amount.amount, false)} XRP
                              </span>
                              {offer.destination && (
                                <span className={cn('block text-[11px]', isDark ? 'text-gray-600' : 'text-gray-400')}>
                                  {BROKER_ADDRESSES[offer.destination]?.name || truncate(offer.destination, 10)}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleCancelOffer(offer)}
                              className="px-2 py-1 rounded-md text-[11px] font-normal border border-red-500/50 text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className={cn(
                    'py-8 text-center rounded-xl border border-dashed',
                    isDark ? 'border-white/20 bg-white/[0.02]' : 'border-gray-300 bg-gray-50/50'
                  )}>
                    <p className={cn('text-sm', isDark ? 'text-gray-500' : 'text-gray-400')}>No sell offers available</p>
                    <button
                      onClick={handleCreateSellOffer}
                      className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-normal border border-primary/30 text-primary hover:bg-primary/5 transition-colors"
                    >
                      <Tag size={14} />
                      Create Sell Offer
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Buy Offers */}
            <div>
              <div className="flex items-center gap-2 mb-3 px-2">
                <h3 className={cn('text-sm font-normal', isDark ? 'text-white' : 'text-gray-900')}>Buy Offers</h3>
                {buyOffers.length > 0 && (
                  <span className={cn(
                    'px-1.5 py-0.5 rounded text-[11px] font-normal border',
                    isDark ? 'border-white/20 text-gray-500' : 'border-gray-200 text-gray-400'
                  )}>
                    {buyOffers.length}
                  </span>
                )}
              </div>
              {loading ? (
                <div className="flex justify-center py-6">
                  <PulseLoader color="#4285f4" size={10} />
                </div>
              ) : buyOffers.length > 0 ? (
                <div className={cn('rounded-lg border overflow-hidden', isDark ? 'border-white/10' : 'border-gray-200')}>
                  {buyOffers.map((offer, index) => {
                    const amount = normalizeAmount(offer.amount);
                    const isLast = index === buyOffers.length - 1;
                    return (
                      <div key={index} className={cn('p-2.5', !isLast && (isDark ? 'border-b border-white/5' : 'border-b border-gray-100'))}>
                        <div className="flex justify-between items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <span className={cn('text-sm font-mono font-normal', isDark ? 'text-white' : 'text-gray-900')}>
                              {formatXRPAmount(amount.amount, false)} XRP
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Link href={`/profile/${offer.owner}`} className={cn('text-[11px] font-mono', isDark ? 'text-gray-500' : 'text-gray-400')}>
                                {truncate(offer.owner, 10)}
                              </Link>
                              {offer.destination && (
                                <>
                                  <span className={cn('text-[11px]', isDark ? 'text-gray-700' : 'text-gray-300')}>•</span>
                                  <span className={cn('text-[11px]', isDark ? 'text-gray-600' : 'text-gray-400')}>
                                    {BROKER_ADDRESSES[offer.destination]?.name || truncate(offer.destination, 10)}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          {isOwner ? (
                            <button
                              onClick={() => handleAcceptOffer(offer)}
                              className="px-2 py-1 rounded-md text-[11px] font-normal border border-primary text-primary hover:bg-primary/5 transition-colors"
                            >
                              Accept
                            </button>
                          ) : (
                            accountLogin === offer.owner && (
                              <button
                                onClick={() => handleCancelOffer(offer)}
                                className="px-2 py-1 rounded-md text-[11px] font-normal border border-red-500/50 text-red-500 hover:bg-red-500/10 transition-colors"
                              >
                                Cancel
                              </button>
                            )
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className={cn(
                  'py-8 text-center rounded-xl border border-dashed',
                  isDark ? 'border-white/20 bg-white/[0.02]' : 'border-gray-300 bg-gray-50/50'
                )}>
                  <p className={cn('text-sm', isDark ? 'text-gray-500' : 'text-gray-400')}>No buy offers available</p>
                  {!isOwner && (
                    <button
                      onClick={handleCreateBuyOffer}
                      className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-normal border border-primary/30 text-primary hover:bg-primary/5 transition-colors"
                    >
                      <Hand size={14} />
                      Make Offer
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* History */}
            <div>
              <h3 className={cn('text-sm font-normal mb-3 px-2', isDark ? 'text-white' : 'text-gray-900')}>History</h3>
              <HistoryList nft={nft} />
            </div>
          </div>
        </div>

        {/* Dialogs */}
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
      </div>
    </>
  );
}
