import { fPercent, fNumber } from '../../../utils/formatNumber';

import {
    CardHeader,
    Link,
    Stack,
    Typography
} from '@mui/material';

import { useSelector/*, useDispatch*/ } from "react-redux";
import { selectStatus } from "../../../redux/statusSlice";

export default function Description({token}) {
    const status = useSelector(selectStatus);
    const {
        id,
        name,
        exch,
        pro24h,
        amount,
        issuer,
        currency,
        vol24h,
        /*
        date,
        md5,
        pro7d,
        trustlines,
        holders,
        offers*/
    } = token;

    let user = token.user;
    if (!user) user = name;

    const price = fNumber(exch / status.USD);
    const marketcap = fNumber(amount * exch / status.USD);
    const supply = fNumber(amount);
    const volume24h = fNumber(vol24h);

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
            <Typography sx={{pl:2, mt:2}}>
                The live {user} price today is ${price} USD with a 24-hour trading volume of ${volume24h} USD. We update our {name} to USD price in real-time. {user} is {strPro24h} in the last 24 hours. The current XRPL.TO ranking is #{id}, with a live market cap of ${marketcap} USD. It has a circulating supply of {supply} {name} coins.
            </Typography>

            <Typography sx={{pl:2, mt:2}}>
                If you would like to know where to buy {user}, the top XRPL DEX for trading in {user} token are currently 
                <Link color="#3366FF" underline="none" target="_blank" rel="noreferrer noopener"
                    href={`https://xumm.app/detect/xapp:xumm.dex?issuer=${issuer}&currency=${currency}`}
                >{' Xumm DEX'}</Link> and
                <Link color="#3366FF" underline="none" target="_blank" rel="noreferrer noopener"
                    href={`https://sologenic.org/trade?network=mainnet&market=${currency}%2B${issuer}%2FXRP`}
                >{' Sologenic DEX'}</Link>.
                
            </Typography>
        </Stack>
    );
}
