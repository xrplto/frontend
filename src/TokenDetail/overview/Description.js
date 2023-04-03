import React from 'react';
import Decimal from 'decimal.js';
import { useState, useEffect } from 'react';
// import MDEditor from 'react-markdown-editor-lite';

import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import "react-markdown-editor-lite/lib/index.css"; // import style manually

const MDEditor = dynamic(() => import("react-markdown-editor-lite"), {
  ssr: false
});

// Material
import {
    styled,
    Box,
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

// Components
import Converter from './Converter';

const ReadMore = ({ children }) => {
    const [showFullContent, setShowFullContent] = useState(false);

    const toggleReadMore = () => {
        setShowFullContent(!showFullContent);
    };

    const ContentClosed = styled('div')(
        ({ theme }) => `
        -webkit-box-flex: 1;
        flex-grow: 1;
        height: 30em;
        overflow: hidden;
        text-overflow: ellipsis;
        position: relative;
    
        &::after {
            content: "";
            position: absolute;
            left: 0px;
            bottom: 0px;
            width: 100%;
            height: 8em;
            background: linear-gradient(180deg, rgba(255,255,255,0), ${theme.palette.background.default});
            z-index: 1000;
        }
    `
    );
    
    const ContentOpened = styled('div')(
        ({ theme }) => `
        height: unset;
        overflow: unset;
        text-overflow: unset;
        min-height: 20em;
    `
    );

    return (
        <Stack>
            {showFullContent?
                <ContentOpened>
                    {children}
                </ContentOpened>
                :
                <ContentClosed>
                    {children}
                </ContentClosed>
            }

            <Stack direction="row">
                <Link
                    component="button"
                    underline="none"
                    variant="body2"
                    color="#3366FF"
                    onClick={toggleReadMore}
                >
                    <Typography variant='s6' sx={{pt: 3, pb: 3}}>{showFullContent?'Read Less':'Read More'}</Typography>
                </Link>
            </Stack>
        </Stack>
    );
};

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
        slug,
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
            {issuer !== 'XRPL' &&
                <Converter token={token} />
            }

            <Typography variant="h2" fontSize='1.1rem' sx={{ mt:4 }}>{`${name} Price Live Data`}</Typography>

            <Typography sx={{mt:3}}>
                The live {user} price today is ${price} USD with a 24-hour trading volume of {fNumber(vol24hx)} {name}. We update our {name} to USD price in real-time. {user} is {strPro24h} in the last 24 hours. The current XRPL.to ranking is #{id}, with a live market cap of ${fNumber(usdMarketCap)} USD. It has a circulating supply of {fNumber(supply)} {name} tokens.
            </Typography>

            <Typography sx={{mt:2, mb: 3}}>
                If you would like to know where to buy {user}, the top XRPL DEX for trading in {user} token are currently 
                <Link color="#3366FF" underline="none"
                    href={`/token/${slug}/trade`}
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

            {!showEditor && description &&
                <ReadMore >
                    <ReactMarkdown
                        className="reactMarkDown"
                    >
                        {description}
                    </ReactMarkdown>
                </ReadMore>
            }

        </Stack>
    );
}
