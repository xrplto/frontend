import Decimal from 'decimal.js';
import { useState, useEffect } from 'react';
// Material
import { withStyles } from '@mui/styles';
import { alpha, styled, useTheme } from '@mui/material/styles';
import {
    Link,
    Stack,
    Typography
} from '@mui/material';

// Redux
import { useSelector } from "react-redux";
import { selectMetrics } from "src/redux/statusSlice";

// Utils
import { fNumber } from 'src/utils/formatNumber';

// Components
import BearBullLabel from 'src/layouts/BearBullLabel';

// CBCCD2
const ContentTypography = withStyles({
    root: {
        color: alpha('#919EAB', 0.99)
    }
})(Typography);

function Rate(num, exch) {
    if (num === 0 || exch === 0)
        return 0;
    return fNumber(num / exch);
}

export default function Summary() {
    const metrics = useSelector(selectMetrics);
    const [showContent, setShowContent] = useState(false);

    const gMarketcap = new Decimal(metrics.global[0]).div(1000000000).toFixed(2, Decimal.ROUND_DOWN);
    const gMarketcapPro = new Decimal(metrics.global[1]).toNumber();
    const gDexVolume = new Decimal(metrics.global[2]).toNumber();
    const gDexVolumePro = new Decimal(metrics.global[3]).toNumber();
    const gScamVolume = new Decimal(metrics.global[4]).toNumber();
    const gScamVolumePro = new Decimal(metrics.global[5]).toNumber();
    const gStableVolume = new Decimal(metrics.global[6]).toNumber();
    const gStableVolumePro = new Decimal(metrics.global[7]).toNumber();
    const gXRPdominance = new Decimal(metrics.global[8]).toNumber();
    const gXRPdominancePro = new Decimal(metrics.global[9]).toNumber();

    return (
        <Stack sx={{pt:2, pl:2.5}}>
            <Typography variant='h1'>Today's XRPL Token Prices by Volume</Typography>
            <Stack direction="row" sx={{mt:2}}>
                <ContentTypography variant='subtitle1'>The global token market cap is ${gMarketcap}B, a <BearBullLabel value={gMarketcapPro} variant="subtitle1" sx={{pl:1, pr:1}}/> {gMarketcapPro < 0 ? 'decrease':'increase'} over the last day.</ContentTypography>
                <Link
                    component="button"
                    underline="always"
                    variant="body2"
                    color="#637381"
                    onClick={() => {
                        setShowContent(!showContent);
                    }}
                >
                    <ContentTypography variant='subtitle1' sx={{ml:1}}>{showContent?'Read Less':'Read More'}</ContentTypography>
                </Link>
            </Stack>

            <div
                style={{
                    display: showContent?"flex":"none",
                    flexDirection: "column",
                }}
            >
                <ContentTypography variant='subtitle1'>The total XRPL Dex volume over the last 24 hours is ${Rate(metrics.tradedXRP24H, metrics.USD)}, which makes a -% decrease. The total volume in Scams is currently $-, -% of the total crypto market 24-hour volume. The volume of all stable coins is now $-, which is -% of the total token market 24-hour volume.</ContentTypography>
                <ContentTypography variant='subtitle1'>XRP price is currently ${Rate(1, metrics.USD)}.</ContentTypography>
                <ContentTypography variant='subtitle1'>XRP dominance is currently ---%, a decrease of -% over the day.</ContentTypography>
            </div>
            
            {/* Today's XRPL Token Prices by Volume
            The global token market cap is $890.88B, a 1.08% decrease over the last day.Read Less
            The total XRPL  Dex volume over the last 24 hours is $72.75B, which makes a 29.79% decrease.
            
            The total volume in Scams is currently $6.13B, 7.69% of the total crypto market 24-hour volume.
            
            The volume of all stable coins is now $64.66B, which is 88.87% of the total token market 24-hour volume.
            

            XRP price is currently .30c
            XRP dominance is currently 99.01%, a decrease of 0.42% over the day.

            we won't be able to do some of these metrics

            Might be able to do "The volume of all stable coins is now $64.66B, which is 88.87% of the total token market 24-hour volume."

            by using the tag that I place on stablecoin tokens

            which is named "Stablecoin"

            eventually we're moving the search bar 

            to the NAV bar like CMC also. */}
        </Stack>
    )
}