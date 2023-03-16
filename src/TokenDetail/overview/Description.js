import React from 'react';
import Decimal from 'decimal.js';

// import MDEditor from 'react-markdown-editor-lite';

import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import "react-markdown-editor-lite/lib/index.css"; // import style manually

const MDEditor = dynamic(() => import("react-markdown-editor-lite"), {
  ssr: false
});

// Material
import {
    CardHeader,
    IconButton,
    Link,
    Stack,
    Tooltip,
    Typography
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Redux
import { useSelector/*, useDispatch*/ } from "react-redux";
import { selectMetrics } from "src/redux/statusSlice";

// Utils
import { fPercent, fNumber } from 'src/utils/formatNumber';

export default function Description({token, showEditor, setShowEditor, description, onApplyDescription}) {
    const { accountProfile } = useContext(AppContext);
    const isAdmin = accountProfile && accountProfile.account && accountProfile.admin;

    const metrics = useSelector(selectMetrics);
    const {
        id,
        name,
        exch,
        usd,
        pro24h,
        amount,
        supply,
        issuer,
        currency,
        vol24h,
        vol24hxrp,
        vol24hx,
        urlSlug,
        marketcap,
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

    const price = fNumber(usd || 0);
    const usdMarketCap = Decimal.div(marketcap, metrics.USD).toNumber(); // .toFixed(5, Decimal.ROUND_DOWN)

    //const vpro7d = fPercent(pro7d);
    const vpro24h = fPercent(pro24h);

    let strPro24h = 0;
    if (vpro24h < 0) {
        strPro24h = -vpro24h;
        strPro24h = 'down ' + strPro24h + '%';
    } else {
        strPro24h = 'up ' + vpro24h + '%';
    }

    const handleClickEdit = () => {
        if (showEditor) {
            onApplyDescription();
        }
        setShowEditor(!showEditor);
    }

    return (
        <Stack>
            <Typography variant="h2" fontSize='1.1rem' sx={{mt:{xs: 4, md: 0} }}>{`${name} Price Live Data`}</Typography>

            <Typography sx={{mt:3}}>
                The live {user} price today is ${price} USD with a 24-hour trading volume of {fNumber(vol24hx)} {name}. We update our {name} to USD price in real-time. {user} is {strPro24h} in the last 24 hours. The current XRPL.to ranking is #{id}, with a live market cap of ${fNumber(usdMarketCap)} USD. It has a circulating supply of {fNumber(supply)} {name} tokens.
            </Typography>

            <Typography sx={{mt:2, mb: 3}}>
                If you would like to know where to buy {user}, the top XRPL DEX for trading in {user} token are currently 
                <Link color="#3366FF" underline="none"
                    href={`/token/${urlSlug}/trade`}
                >{' XRPL.to DEX'}</Link> and
                <Link color="#3366FF" underline="none"
                    href={`https://sologenic.org/trade?network=mainnet&market=${currency}%2B${issuer}%2FXRP`}
                >{' Sologenic DEX'}</Link>.
                
            </Typography>

            {isAdmin &&
                <Stack direction="row" sx={{mt: 0, mb: 0}} >
                    <Tooltip title={showEditor?"Apply changes":"Click to edit description"}>
                        <IconButton onClick={handleClickEdit} edge="end" aria-label="edit" size="small">
                            {showEditor?
                                <CloseIcon color="error" />
                                :
                                <EditIcon />
                            }
                        </IconButton>
                    </Tooltip>
                </Stack>
            }

            {!showEditor &&
                <ReactMarkdown
                    className="reactMarkDown"
                >
                    {description}
                </ReactMarkdown>
            }

        </Stack>
    );
}
