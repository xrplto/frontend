import { Avatar, Box, CardMedia, IconButton, InputBase, Link, MenuItem, MenuList, Paper, Stack, styled, Typography } from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import CasinoIcon from '@mui/icons-material/Casino';
import AnimationIcon from '@mui/icons-material/Animation';
import VerifiedIcon from '@mui/icons-material/Verified';

import { useContext, useEffect, useState } from "react";
import { LazyLoadImage } from 'react-lazy-load-image-component';
import axios from "axios";
import { AppContext } from "src/AppContext";
import { useSelector } from "react-redux";
import { selectMetrics } from "src/redux/statusSlice";
import NumberTooltip from "./NumberTooltip";
import { currencySymbols } from "src/utils/constants";
import { fNumberWithCurreny } from "src/utils/formatNumber";
import BearBullLabel from "./BearBullLabel";
import useDebounce from "src/hooks/useDebounce";

const BASE_URL = process.env.API_URL;
const NFT_BASE_URL = 'https://api.xrpnft.com/api';

const TokenImage = styled(LazyLoadImage)(({ theme }) => ({
    borderRadius: '50%',
    overflow: 'hidden',
}));

function truncate(str, n) {
    if (!str) return '';
    return str.length > n ? str.substr(0, n - 1) + '... ' : str;
}

const NFTRender = ({
    option_type,
    logoImage,
    logo,
    name,
    verified,
    items,
    type,
    slug
}) => {

    const [hLink, setHLink] = useState('')
    const [isVideo, setIsVideo] = useState(false)
    const [imgUrl, setImgUrl] = useState('')

    const initOption = () => {
        logoImage &&
            setImgUrl(`https://s1.xrpnft.com/collection/${logoImage}`)
        setHLink(`/collection/${slug}`)
    }

    useEffect(() => {
        initOption()
    }, [])


    return (
        <Link
            color="inherit"
            underline='none'
            href={hLink}
        >
            <MenuItem sx={{ pt: 1, pb: 1, px: 1, height: "50px" }}>
                <Stack direction="row" spacing={1} alignItems="center">
                    {
                        <Avatar
                            alt="X"
                            variant={logo ? "" : "circular"}
                            sx={{
                                backgroundColor: '#00000000',
                                width: "24px",
                                height: "24px"
                            }}
                        >
                            <CardMedia
                                component={isVideo ? "video" : 'img'}
                                src={imgUrl}
                                alt='X'
                            />
                        </Avatar>
                    }
                    <Typography variant="s5">{name ?? ''}</Typography>
                    {
                        option_type === 'COLLECTIONS' && <>
                            {verified === 'yes' &&
                                <Tooltip title='Verified'>
                                    <VerifiedIcon fontSize="small" style={{ color: "#4589ff" }} />
                                </Tooltip>
                            }
                            {type === "random" &&
                                <Tooltip title="Random Collection">
                                    <CasinoIcon color='info' fontSize="small" />
                                </Tooltip>
                            }
                            {type === "sequence" &&
                                <Tooltip title="Sequence Collection">
                                    <AnimationIcon color='info' fontSize="small" />
                                </Tooltip>
                            }
                            <Typography variant="s7">{items} items</Typography>
                        </>
                    }
                </Stack>
            </MenuItem>
        </Link>
    )
}

export default function SearchModal({ onClose, open }) {

    const { darkMode, activeFiatCurrency } = useContext(AppContext);
    const metrics = useSelector(selectMetrics);
    const exchRate = metrics[activeFiatCurrency];

    const [options, setOptions] = useState([]);
    const [collections, setCollections] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const debouncedSearch = useDebounce(search, 1000)

    const getData = (search) => {
        setLoading(true);
        const body = {
            search,
        };

        axios
            .post(`${BASE_URL}/search`, body)
            .then((res) => {
                try {
                    if (res.status === 200 && res.data) {
                        const ret = res.data;
                        const newOptions = ret.tokens.map((token) => ({
                            ...token,
                            option_type: 'TOKENS',
                        }));
                        setOptions(newOptions.slice(0, 3));
                    }
                } catch (error) {
                    console.log(error);
                }
            })
            .catch((err) => {
                console.log('err->>', err);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const getNFTs = (search) => {
        const body = {
            search,
            type: "SEARCH_ITEM_COLLECTION_ACCOUNT"
        };

        axios.post(`${NFT_BASE_URL}/search`, body).then(res => {
            try {
                if (res.status === 200 && res.data) {
                    const ret = res.data;
                    setCollections(ret.collections.slice(0, 3));
                }
            } catch (error) {
                console.log(error);
            }
        }).catch(err => {
            console.log("err->>", err);
        }).then(function () {
            // Always executed
            setLoading(false);
        });
    }

    useEffect(() => {
        getData(debouncedSearch);
        getNFTs(debouncedSearch);
    }, [debouncedSearch]);

    const handleClose = () => {
        setSearch("");
        onClose();
    }

    return (
        <Paper sx={{ width: "100%", maxWidth: "600px", position: "fixed", right: "10px", top: open ? "45px" : "-100%", p: 1.5, zIndex: 9999, opacity: open ? 1 : 0, transition: "opacity 0.2s",}}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <SearchIcon />
                <InputBase placeholder="Search coin, NFT" fullWidth sx={{ border: "none" }} value={search} onChange={(e) => setSearch(e.target.value)} />
                <IconButton onClick={handleClose}>
                    <CloseIcon />
                </IconButton>
            </Stack>

            <Stack mt={1}>
                <Stack direction="row" alignItems="center" sx={{ px: 1 }} spacing={0.5}>
                    <Typography>Trending Cryptoassets</Typography>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        height="16px"
                        width="16px"
                        viewBox="0 0 24 24"
                        color="#FF775F"
                    >
                        <path d="M17.0881 9.42254C16.4368 8.90717 15.8155 8.35512 15.3012 7.71336C12.3755 4.06357 13.8912 1 13.8912 1C8.46026 3.18334 7.22337 6.64895 7.16462 9.22981L7.1675 9.2572C7.1675 9.2572 7.21498 10.7365 7.90791 12.3625C8.12481 12.8713 7.88299 13.4666 7.33195 13.6199C6.87638 13.7465 6.40822 13.5317 6.21571 13.1314C5.90413 12.4831 5.49262 11.4521 5.6109 10.7249C4.75064 11.817 4.1815 13.1452 4.03542 14.6184C3.65092 18.4924 6.43759 22.0879 10.4208 22.8488C14.9906 23.7217 19.3121 20.7182 19.9269 16.3623C20.3117 13.6367 19.1498 11.0538 17.0881 9.42254ZM14.3578 17.7393C14.3289 17.776 13.5893 18.6597 12.3501 18.7517C12.2829 18.7547 12.2124 18.7577 12.1452 18.7577C11.2902 18.7577 10.4226 18.3682 9.56103 17.5951L9.37219 17.4262L9.61243 17.3372C9.62843 17.3312 11.2742 16.7236 11.6778 15.4077C11.8155 14.9629 11.7707 14.4566 11.553 13.9842C11.2905 13.4075 10.7845 11.9564 11.7453 10.9041L11.9309 10.7015L12.0206 10.9561C12.0238 10.9714 12.6034 12.5911 13.9741 13.4379C14.3871 13.6957 14.6977 14.0086 14.8931 14.3644C15.2959 15.1132 15.533 16.3065 14.3578 17.7393Z" />
                    </svg>

                </Stack>
                <MenuList sx={{ px: 0 }}>
                    {options.map(({ md5, name, slug, isOMCF, user, kyc, pro24h, exch }, idx) => {
                        const imgUrl = `https://s1.xrpl.to/token/${md5}`;
                        const link = `/token/${slug}?fromSearch=1`;

                        return (
                            <MenuItem sx={{ py: "2px", px: 1, height: "50px" }} key={idx}>
                                <Box
                                    display="flex"
                                    alignItems="center"
                                    justifyContent="space-between"
                                    flex={2}
                                    sx={{ pl: 0, pr: 0 }}
                                >
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        <TokenImage
                                            src={imgUrl}
                                            width={24}
                                            height={24}
                                        // onError={(event) => (event.target.src = '/static/alt.webp')}
                                        />
                                        <Stack>
                                            <Typography
                                                variant="token"
                                                color={isOMCF !== 'yes'
                                                    ? darkMode
                                                        ? '#fff'
                                                        : '#222531'
                                                    : darkMode
                                                        ? '#007B55'
                                                        : '#5569ff'}
                                                noWrap
                                            >
                                                {truncate(user, 8)}
                                            </Typography>
                                            <Typography
                                                variant="caption"
                                                color={isOMCF !== 'yes' ? (darkMode ? '#fff' : '#222531') : ''}
                                                noWrap
                                            >
                                                {truncate(name, 13)}
                                                {kyc && (
                                                    <Typography variant="kyc" sx={{ ml: 0.2 }}>
                                                        KYC
                                                    </Typography>
                                                )}
                                            </Typography>
                                        </Stack>
                                    </Stack>

                                    <Stack direction="row" gap={1}>
                                        <NumberTooltip
                                            prepend={currencySymbols[activeFiatCurrency]}
                                            number={fNumberWithCurreny(exch, exchRate)}
                                        />
                                        <BearBullLabel value={pro24h} variant="h4" />
                                    </Stack>
                                </Box>
                            </MenuItem>
                        )
                    })}
                </MenuList>
            </Stack>

            <Stack mt={1}>
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ px: 1}}>
                    <Typography>Trending NFTs</Typography>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="currentColor"
                        height="16px"
                        width="16px"
                        viewBox="0 0 24 24"
                        color="#FF775F"
                    >
                        <path d="M17.0881 9.42254C16.4368 8.90717 15.8155 8.35512 15.3012 7.71336C12.3755 4.06357 13.8912 1 13.8912 1C8.46026 3.18334 7.22337 6.64895 7.16462 9.22981L7.1675 9.2572C7.1675 9.2572 7.21498 10.7365 7.90791 12.3625C8.12481 12.8713 7.88299 13.4666 7.33195 13.6199C6.87638 13.7465 6.40822 13.5317 6.21571 13.1314C5.90413 12.4831 5.49262 11.4521 5.6109 10.7249C4.75064 11.817 4.1815 13.1452 4.03542 14.6184C3.65092 18.4924 6.43759 22.0879 10.4208 22.8488C14.9906 23.7217 19.3121 20.7182 19.9269 16.3623C20.3117 13.6367 19.1498 11.0538 17.0881 9.42254ZM14.3578 17.7393C14.3289 17.776 13.5893 18.6597 12.3501 18.7517C12.2829 18.7547 12.2124 18.7577 12.1452 18.7577C11.2902 18.7577 10.4226 18.3682 9.56103 17.5951L9.37219 17.4262L9.61243 17.3372C9.62843 17.3312 11.2742 16.7236 11.6778 15.4077C11.8155 14.9629 11.7707 14.4566 11.553 13.9842C11.2905 13.4075 10.7845 11.9564 11.7453 10.9041L11.9309 10.7015L12.0206 10.9561C12.0238 10.9714 12.6034 12.5911 13.9741 13.4379C14.3871 13.6957 14.6977 14.0086 14.8931 14.3644C15.2959 15.1132 15.533 16.3065 14.3578 17.7393Z" />
                    </svg>

                </Stack>
                <MenuList sx={{ px: 0 }}>
                    {
                        collections.map((nft, idx) => (
                            <NFTRender key={idx} {...nft} />
                        ))
                    }
                </MenuList>
            </Stack>
        </Paper>
    )
};