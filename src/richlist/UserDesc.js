import { useState } from 'react';

// Material
import { withStyles } from '@mui/styles';
import {
    Avatar,
    Box,
    Button,
    Chip,
    Grid,
    IconButton,
    Link,
    Rating,
    Stack,
    Tooltip,
    Typography
} from '@mui/material';

import {
    Token as TokenIcon,
    SyncAlt as SyncAltIcon
} from '@mui/icons-material';

// Iconify
import { Icon } from '@iconify/react';
import link45deg from '@iconify/icons-bi/link-45deg';
import linkExternal from '@iconify/icons-charm/link-external';
import paperIcon from '@iconify/icons-akar-icons/paper';
import infoFilled from '@iconify/icons-ep/info-filled';

// Components
import Socials from './Socials';
import Explorers from './Explorers';
import Donut from './Donut';
import BearBullChip from './BearBullChip';
import LowHighBar24H from './LowHighBar24H';

// Redux
import { useSelector } from "react-redux";
import { selectMetrics } from "src/redux/statusSlice";

// Utils
import { fNumber } from 'src/utils/formatNumber';

const MarketTypography = withStyles({
    root: {
        color: "#2CD9C5"
    }
})(Typography);

const VolumeTypography = withStyles({
    root: {
        color: "#FF6C40"
    }
})(Typography);

const SupplyTypography = withStyles({
    root: {
        color: "#3366FF"
    }
})(Typography);

// ----------------------------------------------------------------------
export default function UserDesc({data}) {
    const BASE_URL = 'https://api.xrpl.to/api';
    const [rating, setRating] = useState(2);

    const metrics = useSelector(selectMetrics);

    const token = data.token;

    const {
        id,
        issuer,
        name,
        exch,
        pro7d,
        pro24h,
        domain,
        whitepaper,
        kyc,
        holders,
        offers,
        trustlines,
        imgExt,
        md5,
        tags,
        social,
        urlSlug,
        amount,
        vol24h
    } = token;

    let user = token.user;
    if (!user) user = name;

    const marketcap = fNumber(amount * exch / metrics.USD);
    const supply = fNumber(amount);
    const volume = fNumber(vol24h);

    const imgUrl = `/static/tokens/${md5}.${imgExt}`;

    return (
        <Stack>
            <Stack direction="row" spacing={1} alignItems='center'>
                <Avatar
                    alt={user}
                    src={imgUrl}
                    sx={{ width: 56, height: 56 }}
                />
                <Stack spacing={0.2}>
                    <Typography variant="h2" color='#22B14C' fontSize='1.1rem'>{user}</Typography>
                    <Stack direction='row' alignItems='center' spacing={1}>
                        <Rating
                            name="simple-controlled"
                            value={rating}
                            onChange={(event, newValue) => {
                                setRating(newValue);
                            }}
                        />
                        <Stack>
                            {kyc && (<Typography variant='kyc2'>KYC</Typography>)}
                        </Stack>
                    </Stack>
                </Stack>
                <Chip variant={"outlined"} icon={<TokenIcon />} label={name} />
                <Link
                    underline="none"
                    color="inherit"
                    target="_blank"
                    href={`https://bithomp.com/explorer/${issuer}`}
                    rel="noreferrer noopener nofollow"
                >
                    <IconButton>
                        <Avatar alt="bithomp" src="/static/bithomp.ico" sx={{ width: 20, height: 20 }} />
                    </IconButton>
                </Link>
                {domain && (
                    <Link
                        underline="none"
                        color="inherit"
                        target="_blank"
                        href={`https://${domain}`}
                        rel="noreferrer noopener nofollow"
                    >
                        <IconButton>
                            <Icon icon={link45deg} width="16" height="16" />
                        </IconButton>
                    </Link>
                )}
                {whitepaper && (
                    <Link
                        underline="none"
                        color="inherit"
                        target="_blank"
                        href={`${whitepaper}`}
                        rel="noreferrer noopener nofollow"
                    >
                        <IconButton>
                            <Icon icon={paperIcon} width="16" height="16" />
                        </IconButton>
                    </Link>
                )}
            </Stack>

            <Stack direction="row" spacing={0.2} sx={{mt:2}}>
                <Socials social={social}/>
            </Stack>

            <Stack direction="row" spacing={1} sx={{mt:2}}>
                <Chip label={holders + " Holders"} color="error" variant="outlined" size="small"/>
                <Chip label={offers + " Offers"} color="warning" variant="outlined" size="small"/>
                <Chip label={trustlines + " TrustLines"} color="info" variant="outlined" size="small"/>
                <Chip label='Sponsored' icon={<Avatar sx={{ width: 24, height: 24 }} alt="xumm" src="/static/sponsor.png"/>} variant={"outlined"} size="small"/>
            </Stack>

            <Stack direction="row" spacing={2} sx={{mt:2, ml:1}} alignItems='center'>
                <Stack direction="row" spacing={1} alignItems='center'>
                    <Typography variant="h2" noWrap>
                        $ {fNumber(exch / metrics.USD)}
                    </Typography>
                    <Typography variant="subtitle1" style={{marginTop:8}}>
                        {fNumber(exch)} XRP
                    </Typography>
                </Stack>
                <BearBullChip value={pro24h} tooltip='24h(%)'/>
                <BearBullChip value={pro7d} tooltip={
                    <Stack alignItems='center'>
                        7d (%)
                        <Box
                            component="img"
                            alt=""
                            sx={{ width: 135, height: 50, mt: 2 }}
                            src={`${BASE_URL}/sparkline/${md5}`}
                        />
                    </Stack>
                }/>
            </Stack>

            <Stack sx={{mt:2, ml:1}}>
                <LowHighBar24H token={token}/>
            </Stack>

            {/* <Stack direction="row" spacing={0.2} sx={{mt:2}}>
                <Explorers account={issuer}/>
            </Stack> */}

            <Stack direction='row' justifyContent="space-between" spacing={0.2} sx={{mt:2, mr:6}}>
                <Stack direction="row" alignItems="center" gap={1} sx={{pl:1}}>
                    <Typography variant="body1">Market Cap</Typography>
                    <Tooltip title={<Typography style={{display: 'inline-block'}} variant="body2">The total market value of a cryptocurrency's circulating supply.<br/>It is analogous to the free-float capitalization in the stock market.<br/>Market Cap = Current Price x Circulating Supply.</Typography>}>
                        <Icon icon={infoFilled} />
                    </Tooltip>
                </Stack>
                <MarketTypography variant="subtitle2" sx={{ml:5}}>$ {marketcap}</MarketTypography>
            </Stack>

            <Stack direction='row' justifyContent="space-between" spacing={0.2} sx={{mt:1, mr:6}}>
                <Stack direction="row" alignItems="center" gap={1} sx={{pl:1}}>
                    <Typography variant="body1">Volume (24h)</Typography>
                    <Tooltip title={<Typography variant="body2">A measure of how much of a token was traded in the last 24 hours.</Typography>}>
                        <Icon icon={infoFilled} />
                    </Tooltip>
                </Stack>
                <VolumeTypography variant="subtitle2">{volume} {name}</VolumeTypography>
            </Stack>

            <Stack direction='row' justifyContent="space-between" spacing={0.2} sx={{mt:1, mr:6}}>
                <Stack direction="row" alignItems="center" gap={1} sx={{pl:1}}>
                    <Typography variant="body1">Circulating Supply</Typography>
                    <Tooltip title={<Typography variant="body2">The amount of coins that are circulating in the market and are in public hands. It is analogous to the flowing shares in the stock market.</Typography>}>
                        <Icon icon={infoFilled} />
                    </Tooltip>
                </Stack>
                <SupplyTypography variant="subtitle2" sx={{ml:2}}>{supply} {name}</SupplyTypography>
            </Stack>

            <Grid container spacing={1} alignItems='center' sx={{mt:2}}>
                {tags && tags.map((tag, idx) => {
                    return (
                        <Grid item key={md5 + idx + tag}>
                            <Chip
                                size="small"
                                label={tag}
                            />
                        </Grid>
                    );
                })}
            </Grid>

            <Stack spacing={1} sx={{mt:2}} alignItems='center'>
                <Donut richList={data.richList}/>
            </Stack>
        </Stack>
    );
}
