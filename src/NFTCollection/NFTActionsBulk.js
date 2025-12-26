import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import { Tag, Store } from 'lucide-react';
import { PuffLoader, BarLoader } from '../components/Spinners';

// Constants
const NFToken = {
  SELL_WITH_MINT_BULK: 'SELL_WITH_MINT_BULK',
  BURNT: 'BURNT'
};

export default function NFTActionsBulk({ nft }) {
  const BASE_URL = 'https://api.xrpl.to/api';
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const { accountProfile, openSnackbar } = useContext(AppContext);
  const accountLogin = accountProfile?.account;
  const accountToken = accountProfile?.token;

  const [bought, setBought] = useState(false);
  const [loading, setLoading] = useState(false);

  const [openBuyMint, setOpenBuyMint] = useState(false);

  const [mints, setMints] = useState(0);

  const [xrpBalance, setXrpBalance] = useState(0);

  const [pendingNfts, setPendingNfts] = useState(0);

  const {
    uuid,
    NFTokenID,
    name: rawName,
    cid,
    collection,
    flag,
    status,
    destination,
    account,
    minter,
    issuer,
    date,
    meta,
    URI,
    royalty,
    taxon,
    costs
  } = nft;

  // Normalize name: API may return object {collection_name, collection_description} or string
  const name = typeof rawName === 'object' && rawName !== null
    ? rawName.collection_name || ''
    : rawName || '';

  useEffect(() => {
    function getMints() {
      if (!accountLogin || !accountToken) {
        openSnackbar('Please login', 'error');
        setMints(0);
        setXrpBalance(0);
        return;
      }

      axios
        .get(`${BASE_URL}/spin/count?account=${accountLogin}&cid=${cid}`, {
          headers: { 'x-access-token': accountToken }
        })
        .then((res) => {
          let ret = res.status === 200 ? res.data : undefined;
          if (ret) {
            setMints(ret.mints);
            setXrpBalance(ret.xrpBalance);
            setPendingNfts(ret.pendingNfts);
          }
        })
        .catch((err) => {})
        .then(function () {});
    }
    getMints();
  }, [accountLogin, accountToken]);

  const buyBulkNFT = () => {
    if (loading) return;

    if (!accountLogin || !accountToken) {
      openSnackbar('Please login', 'error');
      return;
    }

    setLoading(true);

    const body = { account: accountLogin, cid, NFTokenID };

    axios
      .post(`${BASE_URL}/spin/buybulknft`, body, { headers: { 'x-access-token': accountToken } })
      .then((res) => {
        let ret = res.status === 200 ? res.data : undefined;
        if (ret) {
          const status = ret.status;
          if (status) {
            openSnackbar('Buy NFT successful!', 'success');
            window.location.href = `/congrats/buyassets/${NFTokenID}`;
          } else {
            openSnackbar(ret.error, 'error');
          }
        }
      })
      .catch((err) => {})
      .then(function () {
        setLoading(false);
      });
  };

  return (
    <>
      {/* Backdrop with loading spinner */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="flex flex-col items-center gap-2">
            <PuffLoader color="white" />
            <BarLoader color="#51E5FF" width={80} />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2 mt-2">
        <h3
          className={cn(
            'text-[30px] font-semibold overflow-hidden',
            isDark ? 'text-white' : 'text-gray-900'
          )}
        >
          {name}
        </h3>
        <div
          className={cn(
            'rounded-xl border-[1.5px] p-2',
            isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-gray-50'
          )}
        >
          <div className="flex flex-col gap-2">
            <p className={cn('text-[15px] font-normal', isDark ? 'text-white' : 'text-gray-900')}>
              You can only buy this NFT with a Mint and there are currently {pendingNfts} NFTs that
              can be bought with Mints.
            </p>
            <p className={cn('text-[15px] font-normal', isDark ? 'text-white' : 'text-gray-900')}>
              You currently have{' '}
              <span className="text-[15px] font-medium text-[#33C2FF]">{mints} Mints</span>{' '}
              available and{' '}
              <span className="text-[15px] font-medium text-[#33C2FF]">{xrpBalance} XRP</span>{' '}
              tokens in your wallet.
            </p>
            <div className="flex flex-row gap-2">
              <button
                className={cn(
                  'flex items-center gap-2 rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-normal',
                  isDark
                    ? 'border-white/15 bg-primary text-white hover:bg-primary/90'
                    : 'border-primary bg-primary text-white hover:bg-primary/90',
                  (!accountLogin || status != NFToken.SELL_WITH_MINT_BULK) &&
                    'opacity-50 cursor-not-allowed'
                )}
                disabled={!accountLogin || status != NFToken.SELL_WITH_MINT_BULK}
                onClick={() => buyBulkNFT()}
              >
                <Tag size={16} />
                Buy Now
              </button>
              <button
                className={cn(
                  'flex items-center gap-2 rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-normal',
                  isDark
                    ? 'border-white/15 hover:bg-primary/5 text-white'
                    : 'border-gray-300 hover:bg-gray-100 text-gray-900'
                )}
                onClick={() => setOpenBuyMint(true)}
              >
                <Store size={16} />
                Buy Mints
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
