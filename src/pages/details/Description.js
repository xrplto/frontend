//import { useState } from 'react';
import { withStyles } from '@mui/styles';
import { /*useTheme, styled,*/ alpha } from '@mui/material/styles';

import { fCurrency5, fPercent, fNumber } from '../../utils/formatNumber';

import {
    CardHeader,
    Link,
    Stack,
    Typography
} from '@mui/material';

import { useSelector/*, useDispatch*/ } from "react-redux";
import { selectStatus } from "../../redux/statusSlice";

const DescTypography = withStyles({
    root: {
        color: alpha('#DFE3E8', 0.7)
    }
})(Typography);

export default function Description({token}) {
    const status = useSelector(selectStatus);
    const {
        id,
        name,
        exch,
        pro24h,
        amt,
        /*acct,
        code,
        date,
        md5,
        pro7d,
        trline,
        holders,
        offers*/
    } = token;

    let user = token.user;
    if (!user) user = name;

    const price = fCurrency5(exch / status.USD);
    const marketcap = fNumber(amt * exch / status.USD);
    const supply = fNumber(amt);
    const volume24h = 0;

    //const vpro7d = fPercent(pro7d);
    const vpro24h = fPercent(pro24h);

    let strPro24h = 0;
    if (vpro24h < 0) {
        strPro24h = -vpro24h;
        strPro24h = 'down ' + strPro24h + '%';
    } else {
        strPro24h = 'up ' + vpro24h + '%';
    }

    return (
        <Stack>
            <CardHeader title={`${name} Price Live Data`}  subheader='' sx={{p:2}}/>
            <DescTypography sx={{pl:2, mt:2}}>
                The live {user} price today is ${price} USD with a 24-hour trading volume of ${volume24h} USD. We update our ${name} to USD price in real-time. ${user} is {strPro24h} in the last 24 hours. The current CoinMarketCap ranking is #{id}, with a live market cap of ${marketcap} USD. It has a circulating supply of {supply} {name} coins.
            </DescTypography>

            <DescTypography sx={{pl:2, mt:2}}>
                If you would like to know where to buy {user}, the top cryptocurrency exchanges for trading in {user} stock are currently 
                <Link color="#3366FF" underline="none" target="_blank" rel="noreferrer noopener"
                    href={`https://coinmarketcap.com/exchanges/cointiger/`}
                >{' CoinTiger'}</Link>,
                <Link color="#3366FF" underline="none" target="_blank" rel="noreferrer noopener"
                    href={`https://coinmarketcap.com/exchanges/digifinex/`}
                >{' DigiFinex'}</Link>,
                <Link color="#3366FF" underline="none" target="_blank" rel="noreferrer noopener"
                    href={`https://coinmarketcap.com/exchanges/hitbtc/`}
                >{' HitBTC'}</Link>,
                <Link color="#3366FF" underline="none" target="_blank" rel="noreferrer noopener"
                    href={`https://coinmarketcap.com/exchanges/gate-io/`}
                >{' Gate.io'}</Link>,
                 and 
                <Link color="#3366FF" underline="none" target="_blank" rel="noreferrer noopener"
                    href={`https://coinmarketcap.com/exchanges/mxc/`}
                >{' MEXC'}</Link>.
                You can find others listed on our crypto exchanges page.
            </DescTypography>
        </Stack>
    );
}
