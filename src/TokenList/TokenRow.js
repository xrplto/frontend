import Decimal from 'decimal.js';
import { useState, useEffect } from 'react';
import React from "react";
import { LazyLoadImage, LazyLoadComponent } from 'react-lazy-load-image-component';

// Material
import { withStyles } from '@mui/styles';
import {
    styled, useMediaQuery, useTheme,
    Link,
    Stack,
    TableCell,
    TableRow,
    Tooltip,
    Typography
} from '@mui/material';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import StarRateIcon from '@mui/icons-material/StarRate';

// Iconify
import { Icon } from '@iconify/react';
import arrowsExchange from '@iconify/icons-gg/arrows-exchange';
import rippleSolid from '@iconify/icons-teenyicons/ripple-solid';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Components
import TokenMoreMenu from './TokenMoreMenu';
import BearBullLabel from 'src/components/BearBullLabel';

// Utils
import { fNumber, fIntNumber } from 'src/utils/formatNumber';

const StickyTableCell = withStyles((theme) => ({
    head: {
        position: "sticky",
        zIndex: 100,
        top: 0,
        left: 24
    },
    body: {
        position: "sticky",
        zIndex: 100,
        left: 24
    }
})) (TableCell);

const TransitionTypo = styled(Typography)(
    () => `
        -webkit-transition: background-color 300ms linear, color 1s linear;
        -moz-transition: background-color 300ms linear, color 1s linear;
        -o-transition: background-color 300ms linear, color 1s linear;
        -ms-transition: background-color 300ms linear, color 1s linear;
        transition: background-color 300ms linear, color 1s linear;
    `
);

const AdminImage = styled(LazyLoadImage)(({ theme }) => ({
    borderRadius: '50%',
    overflow: 'hidden',
    '&:hover': {
        cursor: 'pointer',
        opacity: 0.6
    },
}));

const TokenImage = styled(LazyLoadImage)(({ theme }) => ({
    borderRadius: '50%',
    overflow: 'hidden'
}));

const badge24hStyle = {
    display: 'inline-block',
    marginRight: '4px',
    color: '#C4CDD5',
    fontSize: '11px',
    fontWeight: '500',
    lineHeight: '18px',
    backgroundColor: '#323546',
    borderRadius: '4px',
    padding: '0.5px 4px'
};

function truncate(str, n){
    if (!str) return '';
    //return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
    return (str.length > n) ? str.substr(0, n-1) + '... ' : str;
};

function getPriceColor(token) {
    const bearbull = token.bearbull;
    let color = '';
    if (bearbull === -1)
        color = '#FF6C40';
    else if (bearbull === 1)
        color = '#54D62C';
    return color;
}

export const TokenRow = React.memo(fTokenRow);

function fTokenRow({mUSD, time, token, setEditToken, setTrustToken, watchList, onChangeWatchList}) {
    const theme = useTheme();
    const BASE_URL = 'https://api.xrpl.to/api';
    const { accountProfile } = useContext(AppContext);
    const isAdmin = accountProfile && accountProfile.account && accountProfile.admin;
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));

    const [priceColor, setPriceColor] = useState('');
    const {
        id,
        // issuer,
        name,
        // currency,
        date,
        amount, // Total Supply
        supply, // Circulating Supply
        trustlines,
        vol24hxrp, // XRP amount with pair token
        vol24hx, // Token amount with pair XRP
        //vol24h,
        vol24htx,
        //holders,
        //offers,
        kyc,
        md5,
        slug,
        user,
        pro7d,
        pro24h,
        exch,
        usd,
        ext,
        marketcap,
        isOMCF
    } = token;

    useEffect(() => {
        setPriceColor(getPriceColor(token));
        setTimeout(() => {
            setPriceColor('');
        }, 3000);
    }, [time]);

    const imgUrl = `https://s1.xrpl.to/token/${md5}`;
    // const imgUrl = `/static/tokens/${md5}.${ext}`;

    const usdMarketCap = Decimal.div(marketcap, mUSD).toNumber(); // .toFixed(5, Decimal.ROUND_DOWN)

    return (
        <TableRow
            hover
            key={id}
        >
            <TableCell align="left">
                {watchList.includes(md5) ?
                    <Tooltip title="Remove from Watchlist">
                        <StarRateIcon
                            onClick={() => {onChangeWatchList(md5)}}
                            fontSize="small"
                            sx={{
                                cursor: 'pointer',
                                color: '#F6B87E'
                            }}
                        />
                    </Tooltip>
                    :
                    <Tooltip title="Add to Watchlist and follow token">
                        <StarOutlineIcon
                            onClick={() => {onChangeWatchList(md5)}}
                            fontSize="small"
                            sx={{
                                cursor: 'pointer',
                                '&:hover': {
                                    color: '#F6B87E'
                                },
                            }}
                        />
                    </Tooltip>
                }
            </TableCell>
            <LazyLoadComponent>
                {!isMobile &&
                    <TableCell align="left">{id}</TableCell>
                }
                <TableCell align="left" sx={{p:0}}>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{p:0}}>
                        {isAdmin ? (
                            <AdminImage
                                src={imgUrl} // use normal <img> attributes as props
                                width={56}
                                height={56}
                                onClick={() => setEditToken(token)}
                                onError={(event) => event.target.src = '/static/alt.png'}
                            />
                        ):(
                            <TokenImage
                                src={imgUrl} // use normal <img> attributes as props
                                width={56}
                                height={56}
                                onError={(event) => event.target.src = '/static/alt.png'}
                            />
                        )}

                        <Link
                            underline="none"
                            color="inherit"
                            href={`/token/${slug}`}
                            rel="noreferrer noopener nofollow"
                        >
                            <Stack>
                                <Typography variant="token" color={isOMCF!=='yes'?'#222531':slug === md5?'#B72136':''} noWrap>{truncate(name, 8)}</Typography>
                                <Typography variant="caption" color={isOMCF!=='yes'?'#222531':''} noWrap>
                                    {isMobile &&
                                        <span style={badge24hStyle}>{id}</span>
                                    }
                                    {truncate(user, 13)}
                                    {kyc && (<Typography variant='kyc' sx={{ml: 0.2}}>KYC</Typography>)}
                                </Typography>
                            </Stack>
                        </Link>
                    </Stack>
                </TableCell>
                <TableCell align="right"
                    sx={{
                        color: priceColor,
                    }}
                >
                    <TransitionTypo variant="h4" noWrap>$ {fNumber(usd)}</TransitionTypo>
                    <TransitionTypo variant="h6" noWrap><Icon icon={rippleSolid} width={12} height={12}/> {fNumber(exch)}</TransitionTypo>
                </TableCell>
                <TableCell align="right">
                    <BearBullLabel value={pro24h} variant="h4" />
                </TableCell>
                <TableCell align="right">
                    <BearBullLabel value={pro7d} variant="h4" />
                </TableCell>
                <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems='center'>
                        <Icon icon={rippleSolid} />
                        <Typography variant="h4" noWrap>{fNumber(vol24hxrp)}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems='center'>
                        {/* <Icon icon={outlineToken} color="#0C53B7"/> */}
                        <Icon icon={arrowsExchange} color="#0C53B7" width="16" height="16"/>
                        <Typography variant="h5" color="#0C53B7">{fNumber(vol24hx)}</Typography>
                    </Stack>
                </TableCell>
                <TableCell align="right">
                    {fNumber(vol24htx)}
                </TableCell>
                <TableCell align="right">
                    ${fNumber(usdMarketCap)}
                </TableCell>
                {/* <TableCell align="left">{holders}</TableCell>
                <TableCell align="left">{offers}</TableCell> */}
                <TableCell align="right">
                    {fIntNumber(trustlines)}
                </TableCell>
                
                <TableCell align="right">
                    {fNumber(supply)} <Typography variant="small" noWrap>{name}</Typography>
                </TableCell>
                <TableCell align="right">
                    <LazyLoadImage
                        alt=''
                        src={`${BASE_URL}/sparkline/${md5}?pro7d=${pro7d}`}
                        width={135}
                        height={50}
                    />
                </TableCell>

                <TableCell align="right">
                    <TokenMoreMenu token={token} admin={isAdmin} setEditToken={setEditToken} setTrustToken={setTrustToken}/>
                </TableCell>
            </LazyLoadComponent>
        </TableRow>
    );
};
