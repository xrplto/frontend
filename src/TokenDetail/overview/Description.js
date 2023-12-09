import React from 'react';
import Decimal from 'decimal.js';
import { useState, useEffect } from 'react';
// import MDEditor from 'react-markdown-editor-lite';

import dynamic from "next/dynamic";
import ReactMarkdown from "react-markdown";
import "react-markdown-editor-lite/lib/index.css"; // import style manually

// Material
import {
    styled,
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
import { selectActiveFiatCurrency, selectMetrics } from "src/redux/statusSlice";

// Utils
import { fPercent, fNumber, fNumberWithCurreny } from 'src/utils/formatNumber';

// Components
import Converter from './Converter';

import NumberTooltip from 'src/components/NumberTooltip';
import { currencySymbols } from 'src/utils/constants';

const ReadMore = ({ children }) => {
    const [showFullContent, setShowFullContent] = useState(false);
    const { darkMode } = useContext(AppContext);
    

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
                    color={ darkMode ? '#22B14C': '#3366FF' }
                    onClick={toggleReadMore}
                >
                    <Typography variant='s6' sx={{pt: 3, pb: 3}}>{showFullContent?'Read Less':'Read More'}</Typography>
                </Link>
            </Stack>
        </Stack>
    );
};

export default function Description({token, showEditor, setShowEditor, description, onApplyDescription}) {
    const { accountProfile, darkMode } = useContext(AppContext);
    const isAdmin = accountProfile && accountProfile.account && accountProfile.admin;

    const metrics = useSelector(selectMetrics);
    const activeFiatCurrency = useSelector(selectActiveFiatCurrency);
    const {
        id,
        name,
        pro24h,
        supply,
        issuer,
        vol24hx,
        slug,
        marketcap,
        exch
    } = token;

    let user = token.user;
    if (!user) user = name;

    const price = fNumberWithCurreny(exch || 0, metrics[activeFiatCurrency]);
    const convertedMarketCap = Decimal.div(marketcap, metrics[activeFiatCurrency]).toNumber(); // .toFixed(5, Decimal.ROUND_DOWN)

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
                Today's live {user} price is <NumberTooltip prepend={currencySymbols[activeFiatCurrency]} number={price} /> {activeFiatCurrency}, accompanied by a 24-hour trading volume of  {fNumber(vol24hx)} {name}. Our {name} to {activeFiatCurrency} price is updated in real-time. In the last 24 hours, {user} has experienced a {strPro24h} change. XRPL.to currently ranks it at  #{id}, with a live market cap of {currencySymbols[activeFiatCurrency]}{fNumber(convertedMarketCap)} {activeFiatCurrency} and a circulating supply of {fNumber(supply)} {name} tokens.
            </Typography>

            <Typography sx={{mt:2, mb: 3}}>
            If you're interested in purchasing {user}, the top XRPL DEX platform for trading {user} tokens is currently: 
                <Link color={ darkMode ? '#22B14C': '#3366FF' } underline="none"
                    href={`/token/${slug}/trade`}
                >{' xrpl.to DEX'}</Link> {/*and
                <Link color={ darkMode ? '#22B14C': '#3366FF' } underline="none"
                    href={`https://sologenic.org/trade?network=mainnet&market=${currency}%2B${issuer}%2FXRP`}
                >{' Sologenic DEX'}</Link>.
        */}
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
                        className={darkMode ? 'reactMarkDowndark' : 'reactMarkDownlight' }
                    >
                        {description}
                    </ReactMarkdown>
                </ReadMore>
            }
        </Stack>
    );
}


