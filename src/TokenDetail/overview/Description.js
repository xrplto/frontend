// Material
import {
    CardHeader,
    Link,
    Stack,
    Typography
} from '@mui/material';

// Redux
import { useSelector/*, useDispatch*/ } from "react-redux";
import { selectMetrics } from "src/redux/statusSlice";

// Utils
import { fPercent, fNumber } from 'src/utils/formatNumber';

export default function Description({token}) {
    const metrics = useSelector(selectMetrics);
    const {
        id,
        name,
        exch,
        pro24h,
        amount,
        issuer,
        currency,
        vol24h,
        vol24hxrp,
        vol24hx,
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

    const price = fNumber(exch / metrics.USD);
    const marketcap = fNumber(amount * exch / metrics.USD);
    const supply = fNumber(amount);
    const volume24h = fNumber(vol24hxrp / metrics.USD);

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
            <Typography variant="h2" fontSize='1.1rem' sx={{ml:2, mt:0}}>{`${name} Price Live Data`}</Typography>

            <Typography sx={{ml:2, mt:3}}>
                The live {user} price today is ${price} USD with a 24-hour trading volume of ${volume24h} {name}. We update our {name} to USD price in real-time. {user} is {strPro24h} in the last 24 hours. The current XRPL.TO ranking is #{id}, with a live market cap of ${marketcap} USD. It has a circulating supply of {supply} {name} tokens.
            </Typography>

            <Typography sx={{ml:2, mt:2}}>
                If you would like to know where to buy {user}, the top XRPL DEX for trading in {user} token are currently 
                <Link color="#3366FF" underline="none" target="_blank" rel="noreferrer noopener nofollow"
                    href={`https://xumm.app/detect/xapp:xumm.dex?issuer=${issuer}&currency=${currency}`}
                >{' Xumm DEX'}</Link> and
                <Link color="#3366FF" underline="none" target="_blank" rel="noreferrer noopener nofollow"
                    href={`https://sologenic.org/trade?network=mainnet&market=${currency}%2B${issuer}%2FXRP`}
                >{' Sologenic DEX'}</Link>.
                
            </Typography>
        </Stack>
    );
}
