import { useState, useEffect } from 'react';
import React, { Suspense } from "react";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import VisibilitySensor from "react-visibility-sensor";

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

// Redux
import { useSelector } from "react-redux";
import { selectMetrics } from "src/redux/statusSlice";

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

const TransTypo = styled(Typography)(
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
    const equal1 = token1.bearbull === token2.bearbull;
    console.log(equal1);
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

function fTokenRow({time, token, admin, setEditToken, setTrustToken}) {
    const BASE_URL = 'https://api.xrpl.to/api';
    const metrics = {USD: 2}; // useSelector(selectMetrics);
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
        console.log(time);
        setPriceColor(getPriceColor(token));
        setTimeout(() => {
            setPriceColor('');
        }, 3000);
    }, [time]);

    const imgUrl = `/static/tokens/${md5}.${imgExt}`;

    const marketcap = amount * exch / metrics.USD;

    let date_fixed = '';
    try {
        if (date) {
            date_fixed = date.split('T')[0];
        }
    } catch (e) { }

    return (
        <TableRow
            hover
            key={id}
            tabIndex={-1}
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
                    
                    <Link
                        underline="none"
                        color="inherit"
                        href={`token/${urlSlug}`}
                        rel="noreferrer noopener nofollow"
                    >
                        <Stack>
                            {admin && urlSlug === md5 ? (
                                <Typography variant="token" color='#B72136' noWrap>{truncate(name, 8)}</Typography>
                            ):(
                                <Typography variant="token" noWrap>{truncate(name, 8)}</Typography>
                            )
                            }
                            <Typography variant="caption" noWrap>
                                {truncate(user, 8)}
                                {kyc && (<Typography variant='kyc'>KYC</Typography>)}
                            </Typography>
                            <Typography variant="small">
                                {date_fixed}
                            </Typography>
                        </Stack>
                    </Link>
                </Stack>
            </TableCell>
            <TableCell align="right"
                sx={{
                    color: priceColor,
                    pl:0,
                    pr:0
                }}
            >
                <TransTypo variant="h4" noWrap>
                    $ {fNumber(exch / metrics.USD)}
                </TransTypo>
                <TransTypo variant="h6" noWrap><Icon icon={rippleSolid} width={12} height={12}/> {fNumber(exch)}</TransTypo>
                {/* <Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems='center'>
                    <Icon icon={rippleSolid} width={12} height={12}/>
                    <TransTypo variant="h6" noWrap>{fNumber(exch)}</TransTypo>
                </Stack> */}
            </TableCell>
            <TableCell align="right" sx={{pl:0, pr:0}}>
                <BearBullLabel value={pro24h} variant="h4" />
            </TableCell>
            <TableCell align="right" sx={{pl:0, pr:0}}>
                <BearBullLabel value={pro7d} variant="h4" />
            </TableCell>
            <TableCell align="right" sx={{pl:0, pr:0}}>
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
            <TableCell align="right" sx={{pl:0, pr:0}}>{fNumber(vol24htx)}</TableCell>
            <TableCell align="right" sx={{pl:0, pr:0}}>${fNumber(marketcap)}</TableCell>
            {/* <TableCell align="left">{holders}</TableCell>
            <TableCell align="left">{offers}</TableCell> */}
            <TableCell align="right" sx={{pl:0, pr:0}}>{trustlines}</TableCell>
            <TableCell align="right" sx={{pl:0, pr:0}}>{fNumber(amount)} <Typography variant="small" noWrap>{name}</Typography></TableCell>
            <TableCell align="right">
                {/* {Str(issuer).limit(10, '...').get()} */}
                {/* <Box
                    component="img"
                    alt=""
                    sx={{ maxWidth: 'none' }}
                    src={`${BASE_URL}/sparkline/${md5}`}
                /> */}
                <LazyLoadImage
                    alt=''
                    src={`${BASE_URL}/sparkline/${md5}`}
                    width={135}
                    height={50}
                />
            </TableCell>
            {/*
            <a href={`https://bithomp.com/explorer/${issuer}`} target="_blank" rel="noreferrer noopener nofollow"> 
            </a>
            <TableCell align="left">{price}</TableCell>
            <TableCell align="left">{dailypercent}</TableCell>
            <TableCell align="left">{marketcap}</TableCell>
            <TableCell align="left">{holders}</TableCell>
            <TableCell align="left">{role}</TableCell>
            <TableCell align="left">{isVerified ? 'Yes' : 'No'}</TableCell>
            <TableCell align="left">
            <Label
                variant="ghost"
                color={(status === 'kyc' && 'error') || 'success'}
            >
                {sentenceCase(status)}
            </Label>
            </TableCell> */}

            <TableCell align="right">
                <TokenMoreMenu token={token} admin={admin} setEditToken={setEditToken} setTrustToken={setTrustToken}/>
            </TableCell>
        </TableRow>
    );
};
