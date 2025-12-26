import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Decimal from 'decimal.js-light';
import PropTypes from 'prop-types';
import dynamic from 'next/dynamic';
// import { ColorExtractor } from 'react-color-extractor';
// Native window size hook
const useWindowSize = () => {
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateSize = () => {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  return size;
};

// Removed confetti animation for build simplicity

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Icons
import { Edit, CheckCircle2 } from 'lucide-react';

// Utils
import { cn } from 'src/utils/cn';
import { getNftCoverUrl } from 'src/utils/parseUtils';

// Components
import BuyMintDialog from './BuyMintDialog';
import { useRouter } from 'next/router';

// Linear Progress Component
function LinearProgressWithLabel({ value, progressColor, isDark }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2.5 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
        <div
          className="h-full rounded-lg transition-all duration-300"
          style={{
            width: `${value}%`,
            backgroundColor: progressColor
          }}
        />
      </div>
      <div className={cn('min-w-[35px] text-[13px] font-normal', isDark ? 'text-gray-400' : 'text-gray-600')}>
        {value}%
      </div>
    </div>
  );
}

LinearProgressWithLabel.propTypes = {
  value: PropTypes.number.isRequired,
  progressColor: PropTypes.string,
  isDark: PropTypes.bool
};

export default function SpinNFT({ collection, setView }) {
  const BASE_URL = 'https://api.xrpl.to/api';
  const { width, height } = useWindowSize();
  // Sound effects removed for build simplicity
  const play = () => {};

  const { themeName, accountProfile, openSnackbar, sync, setSync } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const account = accountProfile?.account;
  const accountToken = accountProfile?.token;

  const [congrats, setCongrats] = useState(false);

  const [openBuyMint, setOpenBuyMint] = useState(false);

  const [mints, setMints] = useState(0);

  const [xrpBalance, setXrpBalance] = useState(0);

  const [pendingNfts, setPendingNfts] = useState(0);

  const {
    uuid,
    name: rawName,
    slug,
    items,
    type,
    description: rawDescription,
    logoImage,
    // featuredImage,
    // bannerImage,
    spinnerImage,
    // created,
    costs,
    // minter,
    verified,
    extra
  } = collection;

  // Normalize name/description: API may return object {collection_name, collection_description} or string
  const name = typeof rawName === 'object' && rawName !== null
    ? rawName.collection_name || ''
    : rawName || '';
  const description = typeof rawDescription === 'object' && rawDescription !== null
    ? rawDescription.collection_description || ''
    : rawDescription || '';

  const [nft, setNft] = useState(extra?.sampleNft);

  const [spinning, setSpinning] = useState(false);

  const imgUrl = getNftCoverUrl(nft); // , 480

  const img_dark = '/static/default_mint_black.svg';
  const img_light = '/static/default_mint_white.svg';

  const defaultImage = isDark ? img_light : img_dark;

  let nftImgUrl = imgUrl || defaultImage; // '/static/empty.png';

  const isVideo = nft?.meta?.video;

  const spinImgUrl = spinnerImage
    ? `https://s1.xrpl.to/nft-collection/${spinnerImage}`
    : '/static/spin.gif';

  const pendingProgress =
    items > 0
      ? new Decimal(pendingNfts).mul(100).div(items).toDP(1, Decimal.ROUND_DOWN).toNumber()
      : 0;

  let progressColor = '#FF1943';
  if (pendingProgress > 50) {
    progressColor = '#33C2FF';
  } else if (pendingProgress > 25) {
    progressColor = '#FFA319';
  }

  // useEffect(() => {
  //     window.addEventListener("resize", () => {
  //         // setWindowSize({ width: window.innerWidth, height: window.innerHeight });

  //     });
  // }, []);

  useEffect(() => {
    function getMints() {
      if (!account || !accountToken) {
        openSnackbar('Please login', 'error');
        // setMints(0);
        // setXrpBalance(0);
        // return;
      }

      // https://api.xrpl.to/api/spin/count?account=rhhh
      axios
        .get(`${BASE_URL}/spin/count?account=${account}&cid=${uuid}`, {
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
        .catch((err) => {
        })
        .then(function () {
          // always executed
        });
    }
    getMints();
  }, [account, accountToken, sync]);

  useEffect(() => {
    if (congrats) {
      setTimeout(() => {
        setCongrats(false);
      }, 3000);
    }
  }, [congrats]);

  const getOneNFT = () => {
    if (spinning) return;

    if (!account || !accountToken) {
      openSnackbar('Please login', 'error');
      return;
    }

    if (mints < 1) {
      openSnackbar('You do not have enough Mints', 'error');
      return;
    }

    if (pendingNfts < 1) {
      openSnackbar('There are no NFTs left', 'error');
      return;
    }

    setSpinning(true);
    // setNft(null);

    const body = { account, cid: uuid };

    axios
      .post(`${BASE_URL}/spin/chooseone`, body, {
        headers: { 'x-access-token': accountToken }
      })
      .then((res) => {
        let ret = res.status === 200 ? res.data : undefined;
        if (ret) {
          const newNft = ret.nft;
          if (newNft) {
            setNft(newNft);
            setSync(sync + 1);
            setCongrats(true);
            play();
          } else {
            openSnackbar(ret.error, 'error');
          }
        }
      })
      .catch((err) => {
      })
      .then(function () {
        // always executed
        setSpinning(false);
      });
  };

  return (
    <>
      <BuyMintDialog
        open={openBuyMint}
        setOpen={setOpenBuyMint}
        type="random"
        cid={uuid}
        costs={costs}
        setMints={setMints}
        setXrpBalance={setXrpBalance}
      />

      {/* Confetti animation removed for build simplicity */}
      <div className="flex flex-col items-center mb-10">
        {/* Icon Cover */}
        <div
          className={cn(
            'w-[102px] h-[102px] -mt-14 mb-4 sm:w-[132px] sm:h-[132px] sm:-mt-[86px] md:w-48 md:h-48 md:-mt-[156px]',
            'border-[6px] rounded-xl shadow-md relative overflow-hidden',
            isDark ? 'border-black/50 bg-white/70' : 'border-gray-200 bg-white/70'
          )}
        >
          <div className="box-border inline-block relative w-[90px] h-[90px] sm:w-[120px] sm:h-[120px] md:w-[180px] md:h-[180px] group">
            <img
              src={`https://s1.xrpl.to/nft-collection/${logoImage}`}
              alt={name}
              className="absolute inset-0 m-auto block w-full h-full object-cover"
            />
            {account === collection.account && (
              <a href={`/collection/${slug}/edit`} className="block">
                <div className="absolute inset-0 flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  <Edit size={32} className="text-primary" />
                </div>
                <span className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
              </a>
            )}
          </div>
        </div>

        {/* Collection Name */}
        <div className="flex flex-row items-center gap-2">
          <h1 className={cn('text-[32px] font-semibold', isDark ? 'text-white' : 'text-gray-900')}>
            {name}
          </h1>
          {verified === 'yes' && (
            <div title="Verified">
              <CheckCircle2 size={24} className="text-[#4589ff]" />
            </div>
          )}
        </div>

        {/* Description */}
        {description && (
          <p
            className={cn(
              'text-[15px] font-normal max-w-[600px] mt-2 text-center',
              isDark ? 'text-gray-400' : 'text-gray-600'
            )}
          >
            {description}
          </p>
        )}

        {/* View Minted Items Link */}
        <button
          onClick={() => setView('')}
          className="text-primary hover:underline text-[13px] font-normal mt-2"
        >
          View Minted Items
        </button>
      </div>

      <div className="container mx-auto max-w-6xl px-0">
        <div className="flex flex-col md:flex-row gap-4 items-center mb-10">
          {/* NFT Card Section */}
          <div className="flex-1 flex justify-center items-center">
            <div className="max-w-[420px] w-full p-2.5 text-center object-cover">
              <img
                src={spinImgUrl}
                alt="NFT spinning animation"
                className="w-full object-cover rounded-xl"
                style={{ display: spinning ? 'block' : 'none' }}
              />
              {isVideo ? (
                <video
                  src={nftImgUrl}
                  title="NFT video"
                  controls
                  className="w-full object-cover rounded-xl"
                  style={{ display: spinning ? 'none' : 'block' }}
                />
              ) : (
                <img
                  src={nftImgUrl}
                  alt="NFT image"
                  className="w-full object-cover rounded-xl"
                  style={{ display: spinning ? 'none' : 'block' }}
                />
              )}

              <div className={cn('h-px mt-2 mb-4', isDark ? 'bg-white/10' : 'bg-gray-200')} />
              <div className="flex flex-col items-center">
                {/* Mint button removed */}
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="flex-1 flex justify-start items-start">
            <div className="flex flex-col gap-4 mt-6 mb-6">
              <p className={cn('text-[15px] font-normal', isDark ? 'text-white' : 'text-gray-900')}>
                Get a {type} NFT from the{' '}
                <span className="text-[15px] font-medium text-[#57CA22]">{name}</span>
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>
                  <p className={cn('text-[15px] font-normal', isDark ? 'text-white' : 'text-gray-900')}>
                    Buy Mints to participate
                  </p>
                </li>
                <li>
                  <p className={cn('text-[15px] font-normal', isDark ? 'text-white' : 'text-gray-900')}>
                    Your Mints:{' '}
                    <span className="text-[15px] font-medium text-[#33C2FF]">{mints}</span>
                  </p>
                </li>
                <li>
                  <p className={cn('text-[15px] font-normal', isDark ? 'text-white' : 'text-gray-900')}>
                    Available XRP:{' '}
                    <span className="text-[15px] font-medium text-[#33C2FF]">{xrpBalance}</span>
                  </p>
                </li>
                <li>
                  <p className={cn('text-[15px] font-normal', isDark ? 'text-white' : 'text-gray-900')}>
                    Remaining NFTs:{' '}
                    <span className="text-[15px] font-medium" style={{ color: progressColor }}>
                      {pendingNfts}
                    </span>{' '}
                    / <span className="text-[15px] font-normal text-[#33C2FF]">{items}</span>
                  </p>
                </li>
              </ul>

              <div className="w-full mt-2 mb-6">
                <LinearProgressWithLabel
                  value={pendingProgress}
                  progressColor={progressColor}
                  isDark={isDark}
                />
              </div>

              <div className="flex flex-row gap-4 justify-center">
                <button
                  onClick={() => setOpenBuyMint(true)}
                  className={cn(
                    'rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-normal',
                    isDark
                      ? 'border-primary bg-primary text-white hover:bg-primary/90'
                      : 'border-primary bg-primary text-white hover:bg-primary/90'
                  )}
                >
                  Buy Mints
                </button>

                <a
                  href="/buy-crypto"
                  target="_blank"
                  rel="noreferrer noopener nofollow"
                  className="no-underline"
                >
                  <button
                    className={cn(
                      'rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-normal',
                      isDark
                        ? 'border-white/15 hover:bg-primary/5 text-white'
                        : 'border-gray-300 hover:bg-gray-100 text-gray-900'
                    )}
                  >
                    Buy XRP
                  </button>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* <Stack sx={{mt:5, minHeight: '20vh'}}>
            </Stack> */}
    </>
  );
}
