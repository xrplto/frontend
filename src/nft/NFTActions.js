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
  Tag
} from 'lucide-react';

// Utils & Context
import { cn } from 'src/utils/cn';
import { AppContext } from 'src/AppContext';
import { normalizeAmount } from 'src/utils/parseUtils';
import { fNumber, fIntNumber, getHashIcon } from 'src/utils/formatters';

// Components
import { PuffLoader, PulseLoader } from '../components/Spinners';
import OffersList from './OffersList';
import SelectPriceDialog from './SelectPriceDialog';
import BurnNFT from './BurnNFT';
import TransferDialog from './TransferDialog';
import HistoryList from './HistoryList';
import { ConnectWallet } from 'src/components/Wallet';

// XRPL
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
  const [openCreateOffer, setOpenCreateOffer] = useState(false);
  const [openTransfer, setOpenTransfer] = useState(false);
  const [isSellOffer, setIsSellOffer] = useState(false);
  const [burnt, setBurnt] = useState(status === NFToken.BURNT);
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
  const [debugInfo, setDebugInfo] = useState(null);

  // Debug info for wallet
  useEffect(() => {
    const loadDebugInfo = async () => {
      if (!accountProfile) { setDebugInfo(null); return; }
      const walletKeyId = accountProfile.walletKeyId ||
        (accountProfile.wallet_type === 'device' ? accountProfile.deviceKeyId : null) ||
        (accountProfile.provider && accountProfile.provider_id ? `${accountProfile.provider}_${accountProfile.provider_id}` : null);
      let seed = accountProfile.seed || null;
      if (!seed && (accountProfile.wallet_type === 'oauth' || accountProfile.wallet_type === 'social')) {
        try {
          const { EncryptedWalletStorage } = await import('src/utils/encryptedWalletStorage');
          const walletStorage = new EncryptedWalletStorage();
          const walletId = `${accountProfile.provider}_${accountProfile.provider_id}`;
          const storedPassword = await walletStorage.getSecureItem(`wallet_pwd_${walletId}`);
          if (storedPassword) {
            const walletData = await walletStorage.getWallet(accountProfile.account, storedPassword);
            seed = walletData?.seed || 'encrypted';
          }
        } catch (e) { seed = 'error: ' + e.message; }
      }
      setDebugInfo({ wallet_type: accountProfile.wallet_type, account: accountProfile.account, walletKeyId, seed: seed || 'N/A' });
    };
    loadDebugInfo();
  }, [accountProfile]);

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
        const response = await axios.get(`https://api.xrpl.to/api/nft/${NFTokenID}/offers`);
        const sellOffers = response.data?.sellOffers || [];

        // Find the owner's valid offer
        const ownerOffer = sellOffers.find(
          (offer) => offer.amount && Number(offer.amount) > 0 && offer.owner === nft.account && offer.orphaned !== 'yes'
        );

        if (ownerOffer) {
          const baseAmount = parseFloat(dropsToXrp(ownerOffer.amount));
          const brokerAddress = ownerOffer.destination;
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
            offerIndex: ownerOffer.index || ownerOffer.nft_offer_index,
            seller: ownerOffer.owner,
            destination: brokerAddress,
            offer: ownerOffer
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
  }, [nft, NFTokenID]);

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

  const handleCreateSellOffer = () => {
    setIsSellOffer(true);
    setOfferAmount('');
    setOpenCreateOffer(true);
  };
  const handleTransfer = () => { setOpenTransfer(true); };
  const handleCreateBuyOffer = () => {
    setIsSellOffer(false);
    setOfferAmount('');
    setOpenCreateOffer(true);
  };
  const onHandleBurn = () => { setBurnt(true); };
  const handleCancelOffer = async (offer) => { doProcessOffer(offer, false); };

  const handleBuyNow = () => {
    if (!lowestSellOffer?.offer) {
      openSnackbar('No valid sell offer available', 'error');
      return;
    }
    setAcceptOffer(lowestSellOffer.offer);
  };

  const handleCloseCreateOffer = () => { setOpenCreateOffer(false); setIsSellOffer(false); };
  const handleCloseTransfer = () => { setOpenTransfer(false); };

  return (
    <>
      {/* Main Glass Panel */}
      <div className="rounded-2xl p-5 border border-gray-700/50 bg-black/60 backdrop-blur-xl">
        <div className="space-y-5">
          {/* Collection Header */}
          {self && (
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                {cslug ? (
                  <Link href={`/collection/${cslug}`} className="inline-flex items-center gap-2 group">
                    <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                      {collectionName}
                    </span>
                    {cverified === 'yes' && (
                      <span className="w-4 h-4 rounded-full bg-primary/80 flex items-center justify-center">
                        <Check size={10} className="text-white" />
                      </span>
                    )}
                  </Link>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-400">{collectionName}</span>
                    {cverified === 'yes' && (
                      <span className="w-4 h-4 rounded-full bg-primary/80 flex items-center justify-center">
                        <Check size={10} className="text-white" />
                      </span>
                    )}
                  </div>
                )}

                <h2 className="text-xl font-medium text-white">{nftName}</h2>

                {/* Floor Price */}
                <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-xl border border-gray-700/50 bg-white/5">
                  <div className="flex items-center gap-1">
                    <span className="text-sm text-gray-400 font-normal">Global Floor</span>
                    <Info size={14} className="text-gray-500 cursor-help" />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-lg text-white font-normal">
                      {floorPrice > 0 ? fNumber(floorPrice) : '- - -'}
                    </span>
                    <span className="text-sm text-gray-500">XRP</span>
                  </div>
                </div>
              </div>

              {/* Share Button */}
              <div className="flex gap-2">
                <div className="relative" ref={shareDropdownRef}>
                  <button
                    onClick={() => setOpenShare(!openShare)}
                    className="px-3 py-2 rounded-lg border border-gray-700/50 text-[13px] font-normal text-gray-400 hover:border-gray-600 hover:text-gray-300 transition-colors"
                  >
                    Share
                  </button>

                  {openShare && (
                    <div className="absolute top-full right-0 mt-2 p-2 w-52 rounded-xl border border-gray-700/50 bg-black/90 backdrop-blur-xl z-50">
                      <div className="space-y-1">
                        <TwitterShareButton url={shareUrl} title={shareTitle} via="xrpnft" hashtags={['XRPL', 'NFT', 'XRP']}>
                          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-normal text-gray-300 hover:bg-white/5 transition-colors">
                            <X size={16} className="p-0.5 rounded bg-white text-black" />
                            Share on X
                          </button>
                        </TwitterShareButton>

                        <FacebookShareButton url={shareUrl} quote={shareTitle}>
                          <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-normal text-gray-300 hover:bg-white/5 transition-colors">
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
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-normal text-gray-300 hover:bg-white/5 transition-colors"
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
              <div className="flex gap-3">
                <button
                  onClick={handleCreateSellOffer}
                  disabled={!accountLogin || burnt}
                  className={cn(
                    'flex-1 py-3 rounded-xl text-[15px] font-normal bg-primary/90 text-white hover:bg-primary transition-colors',
                    (!accountLogin || burnt) && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  Sell
                </button>
                <button
                  onClick={handleTransfer}
                  disabled={!accountLogin || burnt}
                  className={cn(
                    'flex-1 py-3 rounded-xl text-[15px] font-normal border border-gray-700/50 text-gray-300 hover:border-gray-600 hover:text-white transition-colors',
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
                    <PulseLoader color="#6b7280" size={10} />
                  </div>
                ) : lowestSellOffer ? (
                  <div className="p-4 rounded-xl border border-gray-700/50 bg-white/5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] uppercase tracking-wider font-normal text-gray-500">Price</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-normal tabular-nums text-primary">
                          {formatXRPAmount(lowestSellOffer.totalAmount, false)}
                        </span>
                        <span className="text-base text-gray-400">XRP</span>
                      </div>
                    </div>
                    {lowestSellOffer.hasBroker && (
                      <div className="mt-3 pt-3 border-t border-gray-700/30">
                        <div className="flex justify-between text-[11px] text-gray-500">
                          <span>Base: {lowestSellOffer.baseAmount} XRP</span>
                          <span>{lowestSellOffer.brokerName}: +{lowestSellOffer.brokerFee.toFixed(2)} XRP</span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-center py-2 text-gray-500">Not listed for sale</p>
                )}

                {accountLogin ? (
                  <>
                    {lowestSellOffer && !burnt && (
                      acceptOffer && acceptOffer?.nft_offer_index === lowestSellOffer.offer?.nft_offer_index ? (
                        <div className="p-3 rounded-xl border border-gray-700/50 bg-white/5">
                          <p className="text-[12px] mb-2 text-gray-400">
                            Buy <span className="text-white">{truncate(nftName, 20)}</span> for {formatXRPAmount(lowestSellOffer.totalAmount)}?
                          </p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setAcceptOffer(null)}
                              className="flex-1 py-2 rounded-lg text-[13px] border border-gray-700/50 text-gray-400 hover:text-gray-300 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => { doProcessOffer(lowestSellOffer.offer, true); setAcceptOffer(null); }}
                              className="flex-1 py-2 rounded-lg text-[13px] font-normal bg-primary/90 text-white hover:bg-primary transition-colors"
                            >
                              Confirm
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={handleBuyNow}
                          className="w-full py-3.5 rounded-xl text-[15px] font-normal bg-primary/90 text-white hover:bg-primary transition-colors"
                        >
                          Buy Now
                        </button>
                      )
                    )}
                    {!burnt && (
                      openCreateOffer ? (
                        <div className="p-3 rounded-xl border border-gray-700/50 bg-white/5">
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="text"
                              placeholder="0.00"
                              value={offerAmount}
                              onChange={(e) => setOfferAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                              autoFocus
                              className="flex-1 px-3 py-2 rounded-lg border border-gray-700/50 bg-black/40 text-[15px] text-white placeholder:text-gray-600 outline-none focus:border-gray-600 transition-colors"
                            />
                            <span className="text-[13px] text-gray-500">XRP</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => { setOpenCreateOffer(false); setOfferAmount(''); }}
                              className="flex-1 py-2 rounded-lg text-[13px] border border-gray-700/50 text-gray-400 hover:text-gray-300 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => { openSnackbar('NFT offers coming soon', 'info'); setOpenCreateOffer(false); setOfferAmount(''); }}
                              disabled={!offerAmount}
                              className={cn(
                                'flex-1 py-2 rounded-lg text-[13px] font-normal transition-colors',
                                !offerAmount ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-primary/90 text-white hover:bg-primary'
                              )}
                            >
                              Submit
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={handleCreateBuyOffer}
                          className="w-full py-3 rounded-xl text-[15px] font-normal border border-gray-700/50 text-gray-300 hover:border-gray-600 hover:text-white transition-colors"
                        >
                          Make Offer
                        </button>
                      )
                    )}
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
                  <h3 className="text-sm font-normal text-gray-300">Sell Offers</h3>
                  {sellOffers.length > 0 && (
                    <span className="min-w-[24px] h-6 flex items-center justify-center rounded text-[11px] font-normal border border-gray-700/50 text-gray-500">
                      {sellOffers.length}
                    </span>
                  )}
                </div>
                {loading ? (
                  <div className="flex justify-center py-6">
                    <PulseLoader color="#6b7280" size={10} />
                  </div>
                ) : sellOffers.length > 0 ? (
                  <div className="rounded-xl border border-gray-700/50 overflow-hidden">
                    {sellOffers.map((offer, index) => {
                      const amount = normalizeAmount(offer.amount);
                      const isLast = index === sellOffers.length - 1;
                      return (
                        <div key={index} className={cn('px-4 py-3', !isLast && 'border-b border-gray-700/30')}>
                          <div className="flex justify-between items-center gap-4">
                            <div className="flex-1 min-w-0">
                              <span className="text-[15px] font-mono font-normal text-white tabular-nums">
                                {formatXRPAmount(amount.amount, false)} XRP
                              </span>
                              {offer.destination && (
                                <span className="block text-[11px] text-gray-500 mt-0.5">
                                  {BROKER_ADDRESSES[offer.destination]?.name || truncate(offer.destination, 10)}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() => handleCancelOffer(offer)}
                              className="px-3 py-1.5 rounded-lg text-[11px] font-normal border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center rounded-xl border border-dashed border-gray-700/50 bg-white/[0.02]">
                    <p className="text-sm text-gray-500">No sell offers available</p>
                    <button
                      onClick={handleCreateSellOffer}
                      className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-normal border border-gray-700/50 text-gray-400 hover:border-gray-600 hover:text-gray-300 transition-colors"
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
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-normal text-gray-300">Buy Offers</h3>
                  {buyOffers.length > 0 && (
                    <span className="min-w-[24px] h-6 flex items-center justify-center rounded text-[11px] font-normal border border-gray-700/50 text-gray-500">
                      {buyOffers.length}
                    </span>
                  )}
                </div>
                {lowestSellOffer && (
                  <span className="text-[11px] text-gray-500">
                    Ask: {fNumber(lowestSellOffer.baseAmount)} XRP
                  </span>
                )}
              </div>
              {loading ? (
                <div className="flex justify-center py-8">
                  <PulseLoader color="#6b7280" size={10} />
                </div>
              ) : buyOffers.length > 0 ? (
                <div className="rounded-xl border border-gray-700/50 overflow-hidden max-h-[300px] overflow-y-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                  {buyOffers.map((offer, index) => {
                    const amount = normalizeAmount(offer.amount);
                    const isLast = index === buyOffers.length - 1;
                    const askingPrice = lowestSellOffer?.baseAmount || 0;
                    const offerPercent = askingPrice > 0 ? Math.round((amount.amount / askingPrice) * 100) : 0;
                    const isLowBall = offerPercent > 0 && offerPercent < 50;
                    const isReasonable = offerPercent >= 80;
                    const isFunded = offer.funded !== false; // true or undefined = funded
                    return (
                      <div key={index} className={cn('px-4 py-2.5', !isLast && 'border-b border-gray-700/30', !isFunded && 'opacity-60')}>
                        <div className="flex items-center justify-between gap-3">
                          {/* Left: Address + Broker + Funded Status */}
                          <div className="flex items-center gap-2 min-w-0">
                            <Link href={`/address/${offer.owner}`} className="text-[12px] font-mono text-gray-400 hover:text-gray-300 transition-colors">
                              {truncate(offer.owner, 12)}
                            </Link>
                            {offer.destination && (
                              <>
                                <span className="text-gray-700">·</span>
                                <span className="text-[11px] text-gray-500">{BROKER_ADDRESSES[offer.destination]?.name || 'Broker'}</span>
                              </>
                            )}
                            {!isFunded && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide bg-red-500/20 text-red-400">
                                Unfunded
                              </span>
                            )}
                          </div>
                          {/* Right: Amount + % + Action */}
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[14px] font-mono text-white tabular-nums">
                                {formatXRPAmount(amount.amount, false)} XRP
                              </span>
                              {askingPrice > 0 && (
                                <span className={cn(
                                  'px-1.5 py-0.5 rounded text-[10px] tabular-nums',
                                  isLowBall ? 'bg-red-500/20 text-red-400' :
                                  isReasonable ? 'bg-green-500/20 text-green-400' :
                                  'bg-white/10 text-gray-400'
                                )}>
                                  {offerPercent}%
                                </span>
                              )}
                            </div>
                            {isOwner ? (
                              acceptOffer && acceptOffer.nft_offer_index === offer.nft_offer_index ? (
                                <div className="flex gap-1.5">
                                  <button onClick={() => setAcceptOffer(null)} className="px-2 py-1 rounded text-[11px] border border-gray-700/50 text-gray-400">No</button>
                                  <button onClick={() => { doProcessOffer(offer, true); setAcceptOffer(null); }} className="px-2 py-1 rounded text-[11px] bg-green-500/90 text-white">Yes</button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setAcceptOffer(offer)}
                                  className={cn(
                                    "px-2.5 py-1 rounded text-[11px] border transition-colors",
                                    isReasonable ? "border-green-500/50 text-green-400 hover:bg-green-500/10" : "border-gray-700/50 text-gray-400 hover:text-gray-300"
                                  )}
                                >
                                  Accept
                                </button>
                              )
                            ) : accountLogin === offer.owner ? (
                              <button onClick={() => handleCancelOffer(offer)} className="px-2.5 py-1 rounded text-[11px] border border-red-500/40 text-red-400 hover:bg-red-500/10">Cancel</button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center rounded-xl border border-dashed border-gray-700/50">
                  <p className="text-sm text-gray-500">No buy offers yet</p>
                </div>
              )}
            </div>

            {/* History */}
            <div>
              <h3 className="text-sm font-normal mb-3 px-1 text-gray-300">History</h3>
              <HistoryList nft={nft} />
            </div>

            {/* Debug Info */}
            {debugInfo && (
              <div className="mt-4 p-3 rounded-lg border border-gray-700/50 bg-white/5 text-[11px] font-mono">
                <div className="text-gray-500 space-y-0.5">
                  <div>wallet_type: {debugInfo.wallet_type}</div>
                  <div>account: {debugInfo.account}</div>
                  <div>walletKeyId: {debugInfo.walletKeyId}</div>
                  <div>seed: {debugInfo.seed}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <TransferDialog
          open={openTransfer}
          setOpen={setOpenTransfer}
          nft={nft}
        />
      </div>
    </>
  );
}
