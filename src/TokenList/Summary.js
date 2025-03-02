import Decimal from 'decimal.js';
import { useContext, useState, useEffect, useRef } from 'react';
// Material
import { withStyles } from '@mui/styles';
import { alpha, Link, Stack, Typography, Skeleton } from '@mui/material';

// import i18n (needs to be bundled ;))
import 'src/utils/i18n';
// Translations
import { useTranslation } from 'react-i18next';

// Redux
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';

// Utils
import { fNumber, fNumberWithSuffix } from 'src/utils/formatNumber';

// Components
import BearBull from 'src/components/BearBull';
import { currencySymbols } from 'src/utils/constants';
import { AppContext } from 'src/AppContext';

// CBCCD2
const ContentTypography = withStyles({
  root: {
    color: alpha('#919EAB', 0.99),
    display: 'inline', // Ensure it's displayed inline
    verticalAlign: 'middle', // Align vertically with surrounding text
    lineHeight: 1.6 // Improve readability with better line height
  }
})(Typography);

function Rate(num, exch) {
  if (num === 0 || exch === 0) return 0;
  return fNumber(num / exch);
}

export default function Summary() {
  const { t } = useTranslation(); // set translation const
  const metrics = useSelector(selectMetrics);
  const { activeFiatCurrency } = useContext(AppContext);
  const [showContent, setShowContent] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [contentHeight, setContentHeight] = useState('0px');
  const contentRef = useRef(null);

  // Simulate loading completion after data is available
  useEffect(() => {
    if (metrics.global && metrics[activeFiatCurrency]) {
      setIsLoading(false);
    }
  }, [metrics, activeFiatCurrency]);

  useEffect(() => {
    if (showContent && contentRef.current) {
      setContentHeight(`${contentRef.current.scrollHeight}px`);
    } else {
      setContentHeight('0px');
    }
  }, [showContent]);

  if (
    !metrics.global ||
    !metrics[activeFiatCurrency] ||
    !metrics.global.gMarketcap ||
    !metrics.global.gMarketcapPro ||
    !metrics.global.gDexVolume ||
    !metrics.global.gDexVolumePro
    //|| !metrics.global.gScamVolume || !metrics.global.gStableVolume || !metrics.global.gStableVolumePro
    //|| !metrics.global.gXRPdominance || !metrics.global.gXRPdominancePro
  ) {
    console.log(
      '----------->Empty metrics value detected (Summary block disabled): metrics.global',
      metrics.global,
      'metrics[activeFiatCurrency]',
      metrics[activeFiatCurrency]
    );
    //return null;
  }

  const gMarketcap = new Decimal(metrics.global.gMarketcap)
    .div(metrics[activeFiatCurrency])
    .toFixed(2, Decimal.ROUND_DOWN);
  const gMarketcapPro = new Decimal(metrics.global.gMarketcapPro || 0).toNumber(); // may be infinity? and trigger Error: [DecimalError] Invalid argument: null
  const gDexVolume = new Decimal(metrics.global.gDexVolume)
    .div(metrics[activeFiatCurrency])
    .toNumber();
  const gDexVolumePro = new Decimal(metrics.global.gDexVolumePro || 0).toNumber(); // may be infinity and trigger Error: [DecimalError] Invalid argument: null
  const gScamVolume = new Decimal(metrics.global.gScamVolume)
    .div(metrics[activeFiatCurrency])
    .toNumber();
  const gScamVolumePro = new Decimal(metrics.global.gScamVolumePro || 0).toFixed(
    2,
    Decimal.ROUND_DOWN
  );
  const gNFTIOUVolume = new Decimal(metrics.global.gNFTIOUVolume || 0)
    .div(metrics[activeFiatCurrency])
    .toNumber();
  const gNFTIOUVolumePro = new Decimal(metrics.global.gNFTIOUVolumePro || 0).toFixed(
    2,
    Decimal.ROUND_DOWN
  );
  const gStableVolume = new Decimal(metrics.global.gStableVolume)
    .div(metrics[activeFiatCurrency])
    .toNumber();
  const gStableVolumePro = new Decimal(metrics.global.gStableVolumePro || 0).toFixed(
    2,
    Decimal.ROUND_DOWN
  );
  const gXRPdominance = new Decimal(metrics.global.gXRPdominance).toNumber();
  const gXRPdominancePro = new Decimal(metrics.global.gXRPdominancePro || 0).toNumber();

  // Format number with commas
  function formatNumberWithCommas(number) {
    return number.toLocaleString('en-US', {
      maximumFractionDigits: 0 // Removes the decimal part
    });
  }

  // Format numbers as percentages with two decimal places
  const formatAsPercentage = (value) => {
    return (value * 100).toLocaleString('en-US', {
      style: 'percent',
      minimumFractionDigits: 2
    });
  };

  return (
    <Stack sx={{ mt: 2, mb: 3 }}>
      <Typography variant="h1" sx={{ mb: 1.5 }}>
        {t("Today's Top XRPL Token Prices by Volume")}
      </Typography>

      {isLoading ? (
        <>
          <Skeleton variant="text" width="100%" height={40} />
          <Skeleton variant="text" width="90%" height={40} />
        </>
      ) : (
        <>
          <ContentTypography variant="subtitle1" sx={{ mt: 2 }}>
            The global token market cap stands at{' '}
            <strong>
              {currencySymbols[activeFiatCurrency]}
              {fNumberWithSuffix(Number(gMarketcap))}
            </strong>{' '}
            marking a <BearBull value={gMarketcapPro} sx={{ pl: 1, pr: 1 }} />{' '}
            {gMarketcapPro < 0 ? 'decrease' : 'increase'} over the last 24 hours.
            <Link
              component="button"
              underline="always"
              variant="body2"
              color="primary"
              onClick={() => {
                setShowContent(!showContent);
              }}
              sx={{
                verticalAlign: 'baseline',
                ml: 1,
                fontWeight: 500,
                transition: 'all 0.2s'
              }}
            >
              {showContent ? 'Read Less' : 'Read More'}
            </Link>
          </ContentTypography>

          <div
            ref={contentRef}
            style={{
              height: showContent ? contentHeight : '0px',
              overflow: 'hidden',
              transition: 'height 0.3s ease-in-out',
              marginTop: showContent ? '16px' : 0,
              borderTop: showContent ? '1px solid rgba(145, 158, 171, 0.12)' : 'none',
              paddingTop: showContent ? '16px' : 0
            }}
          >
            <ContentTypography variant="subtitle1" sx={{ mt: 2, pb: 1 }} gutterBottom>
              The total XRPL DEX volume in the past 24 hours is{' '}
              <strong>
                {currencySymbols[activeFiatCurrency]}
                {fNumberWithSuffix(gDexVolume)}
              </strong>
              , marking a <BearBull value={gDexVolumePro} sx={{ pl: 1, pr: 1 }} />{' '}
              {gDexVolumePro < 0 ? 'decrease' : 'increase'}.
            </ContentTypography>

            <ContentTypography variant="subtitle1" sx={{ pb: 1 }} gutterBottom>
              Currently, the total volume in Collectibles & NFTs is{' '}
              <strong>
                {currencySymbols[activeFiatCurrency]}
                {fNumberWithSuffix(gNFTIOUVolume)}
              </strong>
              , accounting for <strong>{gNFTIOUVolumePro}%</strong> of the total XRPL token market's
              24-hour volume.
            </ContentTypography>

            <ContentTypography variant="subtitle1" sx={{ pb: 1 }} gutterBottom>
              The volume of all stablecoins currently stands at{' '}
              <strong>
                {currencySymbols[activeFiatCurrency]}
                {fNumberWithSuffix(gStableVolume)}
              </strong>
              , representing <strong>{gStableVolumePro}%</strong> of the total token market's
              24-hour volume.
            </ContentTypography>

            <ContentTypography variant="subtitle1" gutterBottom>
              The current XRP price is{' '}
              <strong>
                {currencySymbols[activeFiatCurrency]}
                {Rate(1, metrics[activeFiatCurrency])}
              </strong>
              .
            </ContentTypography>
            {/* <ContentTypography variant='subtitle1'>XRP dominance currently stands at ---%, experiencing a decrease of -% over the past 24 hours.</ContentTypography> */}
          </div>
        </>
      )}
    </Stack>
  );
}
