import { LazyLoadImage } from 'react-lazy-load-image-component';

// Iconify
import { Icon } from '@iconify/react';
import arrowsExchange from '@iconify/icons-gg/arrows-exchange';
import rippleSolid from '@iconify/icons-teenyicons/ripple-solid';

// Material
import { styled } from '@mui/material/styles';
import {
    Avatar,
    Link,
    Stack,
    TableCell,
    TableRow,
    Typography
} from '@mui/material';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Redux
import { useSelector } from "react-redux";
import { selectMetrics } from "src/redux/statusSlice";

// Components
import TokenMoreMenu from './TokenMoreMenu';
import BearBullLabel from 'src/layouts/BearBullLabel';

// Utils
import { fNumber } from 'src/utils/formatNumber';

const TokenImage = styled(LazyLoadImage)(({ theme }) => ({
    '&:hover': {
        cursor: 'pointer',
        opacity: 0.6
    },
}));

export default function TokenRow({token, setEditToken, setTrustToken}) {
    const BASE_URL = 'https://api.xrpl.to/api';
    const metrics = useSelector(selectMetrics);
    const { accountProfile } = useContext(AppContext);
    const isAdmin = accountProfile && accountProfile.account && accountProfile.admin;

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
            role="checkbox"
        >
            <TableCell align="left">{id}</TableCell>
            <TableCell component="th" scope="row" padding="none">
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ width: 56, height: 56 }}>
                    {isAdmin ? (
                        <TokenImage
                            src={imgUrl} // use normal <img> attributes as props
                            width={56}
                            height={56}
                            onClick={() => setEditToken(token)}
                            onError={(event) => event.target.src = '/static/alt.png'}
                        />
                    ):(
                        <LazyLoadImage
                            src={imgUrl} // use normal <img> attributes as props
                            width={56}
                            height={56}
                            onError={(event) => event.target.src = '/static/alt.png'}
                        />                                                
                    )}
                    </Avatar>
                    
                    <Link
                        underline="none"
                        color="inherit"
                        href={`token/${urlSlug}`}
                        rel="noreferrer noopener nofollow"
                    >
                    <Stack>
                        {isAdmin && urlSlug === md5 ? (
                            <Typography variant="token" color='#B72136' noWrap>{name}</Typography>
                        ):(
                            <Typography variant="token" noWrap>{name}</Typography>
                        )
                        }
                        <Stack direction="row" alignItems="center" spacing={0.1}>
                            <Typography variant="caption">
                                {user}
                                {kyc && (<Typography variant='kyc'>KYC</Typography>)}
                            </Typography>
                        </Stack>
                        <Typography variant="small">
                            {date_fixed}
                        </Typography>
                    </Stack>
                    </Link>
                </Stack>
            </TableCell>
            <TableCell align="left">
                <Stack>
                    <Typography variant="h4" noWrap>
                        $ {fNumber(exch / metrics.USD)}
                    </Typography>
                    <Stack direction="row" spacing={0.5} alignItems='center'>
                        <Icon icon={rippleSolid} width={12} height={12}/>
                        <Typography variant="h6" noWrap>{fNumber(exch)}</Typography>
                    </Stack>
                </Stack>
            </TableCell>
            <TableCell align="left">
                <BearBullLabel value={pro24h} variant="h4" />
            </TableCell>
            <TableCell align="left">
                <BearBullLabel value={pro7d} variant="h4" />
            </TableCell>
            <TableCell align="left">
                <Stack>
                    <Stack direction="row" spacing={0.5} alignItems='center'>
                        <Icon icon={rippleSolid} />
                        <Typography variant="h4" noWrap>{fNumber(vol24hxrp)}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems='center'>
                        {/* <Icon icon={outlineToken} color="#0C53B7"/> */}
                        <Icon icon={arrowsExchange} color="#0C53B7" width="16" height="16"/>
                        <Typography variant="h5" color="#0C53B7">{fNumber(vol24hx)}</Typography>
                    </Stack>
                    
                    {/* <Typography variant="caption">
                        <Stack direction="row" alignItems='center'>
                            {name}
                            <Icon icon={arrowsExchange} width="16" height="16"/>
                            XRP
                        </Stack>
                    </Typography> */}
                    {/* <Typography variant="caption">
                        {fNumber(vol24htx)} tx
                    </Typography> */}
                </Stack>
            </TableCell>
            <TableCell align="left">{fNumber(vol24htx)}</TableCell>
            <TableCell align="left">$ {fNumber(marketcap)}</TableCell>
            {/* <TableCell align="left">{holders}</TableCell>
            <TableCell align="left">{offers}</TableCell> */}
            <TableCell align="left">{trustlines}</TableCell>
            <TableCell align="left">{fNumber(amount)} <Typography variant="small" noWrap>{name}</Typography></TableCell>
            <TableCell align="left">
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
                <TokenMoreMenu token={token} setEditToken={setEditToken} setTrustToken={setTrustToken}/>
            </TableCell>
        </TableRow>
    );
}