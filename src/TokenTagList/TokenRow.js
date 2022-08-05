import { useState, useEffect } from 'react';
import React, { Suspense } from "react";
import { LazyLoadImage, LazyLoadComponent } from 'react-lazy-load-image-component';

// Iconify
import { Icon } from '@iconify/react';
import arrowsExchange from '@iconify/icons-gg/arrows-exchange';
import rippleSolid from '@iconify/icons-teenyicons/ripple-solid';

// Material
import { withStyles } from '@mui/styles';
import {
    styled,
    Avatar,
    Link,
    Stack,
    TableCell,
    TableRow,
    Typography
} from '@mui/material';

// Components
import TokenMoreMenu from './TokenMoreMenu';
import BearBullLabel from 'src/layouts/BearBullLabel';

// Utils
import { fNumber } from 'src/utils/formatNumber';

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

function truncate(str, n){
    if (!str) return '';
    //return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
    return (str.length > n) ? str.substr(0, n-1) + '... ' : str;
};

function areEqual(prevProps, nextProps) {
    /*
    return true if passing nextProps to render would return
    the same result as passing prevProps to render,
    otherwise return false
    */
    const token1 = prevProps.token;
    const token2 = nextProps.token;
    const equal = JSON.stringify(token1) === JSON.stringify(token2);
    return equal;
}

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

function fTokenRow({mUSD, time, token, admin, setEditToken, setTrustToken}) {
    const BASE_URL = 'https://api.xrpl.to/api';
    const [priceColor, setPriceColor] = useState('');
    const {
        id,
        // issuer,
        name,
        // currency,
        date,
        amount,
        trustlines,
        vol24hxrp, // XRP amount with pair token
        vol24hx, // Token amount with pair XRP
        //vol24h,
        vol24htx,
        //holders,
        //offers,
        kyc,
        md5,
        urlSlug,
        user,
        pro7d,
        pro24h,
        exch,
        imgExt
    } = token;

    useEffect(() => {
        setPriceColor(getPriceColor(token));
        setTimeout(() => {
            setPriceColor('');
        }, 3000);
    }, [time]);

    const imgUrl = `/static/tokens/${md5}.${imgExt}`;

    const price = fNumber(exch / mUSD);
    const marketcap = amount * exch / mUSD;

    return (
        <TableRow
            hover
            key={id}
        >
            <TableCell align="left">{id}</TableCell>
            <TableCell align="left" sx={{p:0}}>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{p:0}}>
                        {admin ? (
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

                        <LazyLoadComponent>
                            <Link
                                underline="none"
                                color="inherit"
                                href={`/token/${urlSlug}`}
                                rel="noreferrer noopener nofollow"
                            >
                                <Stack>
                                    <Typography variant="token" color={urlSlug === md5?'#B72136':''} noWrap>{truncate(name, 8)}</Typography>
                                    <Typography variant="caption" noWrap>
                                        {truncate(user, 8)}
                                        {kyc && (<Typography variant='kyc'>KYC</Typography>)}
                                    </Typography>
                                    <Typography variant="small">{date}</Typography>
                                </Stack>
                            </Link>
                        </LazyLoadComponent>
                    </Stack>
            </TableCell>
            <TableCell align="right"
                sx={{
                    color: priceColor,
                    pl:0,
                    pr:0
                }}
            >
                <LazyLoadComponent>
                    <TransitionTypo variant="h4" noWrap>$ {price}</TransitionTypo>
                    <TransitionTypo variant="h6" noWrap><Icon icon={rippleSolid} width={12} height={12}/> {fNumber(exch)}</TransitionTypo>
                </LazyLoadComponent>
            </TableCell>
            <TableCell align="right" sx={{pl:0, pr:0}}>
                <LazyLoadComponent>
                    <BearBullLabel value={pro24h} variant="h4" />
                </LazyLoadComponent>
            </TableCell>
            <TableCell align="right" sx={{pl:0, pr:0}}>
                <LazyLoadComponent>
                    <BearBullLabel value={pro7d} variant="h4" />
                </LazyLoadComponent>
            </TableCell>
            <TableCell align="right" sx={{pl:0, pr:0}}>
                <LazyLoadComponent>
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems='center'>
                        <Icon icon={rippleSolid} />
                        <Typography variant="h4" noWrap>{fNumber(vol24hxrp)}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems='center'>
                        {/* <Icon icon={outlineToken} color="#0C53B7"/> */}
                        <Icon icon={arrowsExchange} color="#0C53B7" width="16" height="16"/>
                        <Typography variant="h5" color="#0C53B7">{fNumber(vol24hx)}</Typography>
                    </Stack>
                </LazyLoadComponent>
            </TableCell>
            <TableCell align="right" sx={{pl:0, pr:0}}>
                <LazyLoadComponent>
                    {fNumber(vol24htx)}
                </LazyLoadComponent>
            </TableCell>
            <TableCell align="right" sx={{pl:0, pr:0}}>
                <LazyLoadComponent>
                    ${fNumber(marketcap)}
                </LazyLoadComponent>
            </TableCell>
            {/* <TableCell align="left">{holders}</TableCell>
            <TableCell align="left">{offers}</TableCell> */}
            <TableCell align="right" sx={{pl:0, pr:0}}>
                <LazyLoadComponent>
                    {trustlines}
                </LazyLoadComponent>
            </TableCell>
            <TableCell align="right" sx={{pl:0, pr:0}}>
                <LazyLoadComponent>
                    {fNumber(amount)} <Typography variant="small" noWrap>{name}</Typography>
                </LazyLoadComponent>
            </TableCell>
            <TableCell align="right">
                <LazyLoadImage
                    alt=''
                    src={`${BASE_URL}/sparkline/${md5}`}
                    width={135}
                    height={50}
                />
            </TableCell>

            <TableCell align="right">
                <TokenMoreMenu token={token} admin={admin} setEditToken={setEditToken} setTrustToken={setTrustToken}/>
            </TableCell>
        </TableRow>
    );
};
