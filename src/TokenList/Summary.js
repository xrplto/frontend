import Decimal from 'decimal.js';
import { useState } from 'react';
// Material
import { withStyles } from '@mui/styles';
import {
    alpha,
    Link,
    Stack,
    Typography
} from '@mui/material';


// import i18n (needs to be bundled ;))
import 'src/utils/i18n';
// Translations
import { useTranslation } from 'react-i18next';

// Redux
import { useSelector } from "react-redux";
import { selectActiveFiatCurrency, selectMetrics } from "src/redux/statusSlice";

// Utils
import { fNumber, fNumberWithSuffix } from 'src/utils/formatNumber';

// Components
import BearBull from 'src/components/BearBull';
import { currencySymbols } from 'src/utils/constants';

// CBCCD2
const ContentTypography = withStyles({
    root: {
        color: alpha('#919EAB', 0.99),
        display: 'inline', // Ensure it's displayed inline
        verticalAlign: 'middle', // Align vertically with surrounding text
    }
})(Typography);

function Rate(num, exch) {
    if (num === 0 || exch === 0)
        return 0;
    return fNumber(num / exch);
}

export default function Summary() {
    const { t } = useTranslation();    // set translation const
    const metrics = useSelector(selectMetrics);
    const activeFiatCurrency = useSelector(selectActiveFiatCurrency);
    const [showContent, setShowContent] = useState(false);

    const gMarketcap = new Decimal(metrics.global.gMarketcap).div(metrics[activeFiatCurrency]).toFixed(2, Decimal.ROUND_DOWN);
    const gMarketcapPro = new Decimal(metrics.global.gMarketcapPro).toNumber();
    const gDexVolume = new Decimal(metrics.global.gDexVolume).div(metrics.USD).toNumber();
    const gDexVolumePro = new Decimal(metrics.global.gDexVolumePro).toNumber();
    const gScamVolume = new Decimal(metrics.global.gScamVolume).div(metrics.USD).toNumber();
    const gScamVolumePro = new Decimal(metrics.global.gScamVolumePro).toFixed(2, Decimal.ROUND_DOWN);
    const gNFTIOUVolume = new Decimal(metrics.global.gNFTIOUVolume || 0).div(metrics.USD).toNumber();
    const gNFTIOUVolumePro = new Decimal(metrics.global.gNFTIOUVolumePro || 0).toFixed(2, Decimal.ROUND_DOWN);
    const gStableVolume = new Decimal(metrics.global.gStableVolume).div(metrics.USD).toNumber();
    const gStableVolumePro = new Decimal(metrics.global.gStableVolumePro).toFixed(2, Decimal.ROUND_DOWN);
    const gXRPdominance = new Decimal(metrics.global.gXRPdominance).toNumber();
    const gXRPdominancePro = new Decimal(metrics.global.gXRPdominancePro).toNumber();

    // Format number with commas
    function formatNumberWithCommas(number) {
        return number.toLocaleString('en-US', {
          maximumFractionDigits: 0, // Removes the decimal part
        });
      }

      // Format numbers as percentages with two decimal places
const formatAsPercentage = (value) => {
    return (value * 100).toLocaleString('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
    });
  };
      
  return (
    <Stack sx={{ mt: 2 }}>
      <Typography variant='h1'>{t("Today's Top XRPL Token Prices by Volume")}</Typography>
  
      <ContentTypography variant='subtitle1' sx={{ mt: 2 }}>
        The global token market cap stands at <strong>{currencySymbols[activeFiatCurrency]}{formatNumberWithCommas(Number(gMarketcap))}</strong> marking a <BearBull value={gMarketcapPro} sx={{ pl: 1, pr: 1 }} /> {gMarketcapPro < 0 ? 'decrease' : 'increase'} over the last 24 hours.
        <Link
          component="button"
          underline="always"
          variant="body2"
          color="#637381"
          onClick={() => {
            setShowContent(!showContent);
          }}
          sx={{ verticalAlign: 'baseline', ml: 1 }} // Adjust marginLeft here to create space
        >
          {showContent ? 'Read Less' : 'Read More'}
        </Link>
      </ContentTypography>
  
      <div
        style={{
          display: showContent ? "flex" : "none",
          flexDirection: "column",
        }}
      >
        <ContentTypography variant='subtitle1' sx={{ mt: 2 }} gutterBottom>The total XRPL DEX volume in the past 24 hours is <strong>${fNumberWithSuffix(gDexVolume)}</strong>, marking a <BearBull value={gDexVolumePro} sx={{ pl: 1, pr: 1 }} /> {gDexVolumePro < 0 ? 'decrease' : 'increase'}. Currently, the total volume in Collectibles & NFTs is <strong>${fNumberWithSuffix(gNFTIOUVolume)}</strong>, accounting for <strong>{formatAsPercentage(gNFTIOUVolumePro)}</strong> of the total XRPL token market's 24-hour volume. The volume of all stablecoins currently stands at <strong>${fNumberWithSuffix(gStableVolume)}</strong>, representing <strong>{formatAsPercentage(gStableVolumePro)}</strong> of the total token market's 24-hour volume.</ContentTypography>
        <ContentTypography variant='subtitle1' gutterBottom>The current XRP price is <strong>${Rate(1, metrics.USD)}</strong>.</ContentTypography>
        {/* <ContentTypography variant='subtitle1'>XRP dominance currently stands at ---%, experiencing a decrease of -% over the past 24 hours.</ContentTypography> */}
      </div>
    </Stack>
  )
}
