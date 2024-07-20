import {
    Avatar,
    Box,
    Button,
    CardMedia,
    IconButton,
    InputBase,
    Link,
    MenuItem,
    MenuList,
    Paper,
    Stack,
    styled,
    ToggleButton,
    ToggleButtonGroup,
    toggleButtonGroupClasses,
    Typography,
    Tooltip
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import CasinoIcon from '@mui/icons-material/Casino';
import AnimationIcon from '@mui/icons-material/Animation';
import VerifiedIcon from '@mui/icons-material/Verified';
import WhatshotIcon from '@mui/icons-material/Whatshot';

import { useContext, useEffect, useRef, useState } from "react";
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

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
    [`& .${toggleButtonGroupClasses.grouped}`]: {
        margin: theme.spacing(0.5),
        border: 0,
        borderRadius: theme.shape.borderRadius,
        padding: "10px",
        [`&.${toggleButtonGroupClasses.disabled}`]: {
            border: 0,
        },
    },
    [`& .${toggleButtonGroupClasses.middleButton},& .${toggleButtonGroupClasses.lastButton}`]: {
        marginLeft: -1,
        borderLeft: '1px solid transparent',
    },
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
    slug,
    darkMode
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
    }, [slug])


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
                    <Typography
                        variant="token"
                        color={darkMode ? '#fff' : '#222531'}
                        noWrap
                    >
                        {truncate(name, 8)}
                    </Typography>
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

    const [tokens, setTokens] = useState([]);
    const [collections, setCollections] = useState([]);
    const [search, setSearch] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [loading, setLoading] = useState(false);
    const debouncedSearch = useDebounce(search, 1000);

    const modalRef = useRef(null);

    const getData = (search) => {
        setLoading(true);
        const body = {
            search,
        };

        axios.post(`${BASE_URL}/search`, body)
            .then((res) => {
                try {
                    if (res.status === 200 && res.data) {
                        const ret = res.data;
                        const newOptions = ret.tokens.map((token) => ({
                            ...token,
                            option_type: 'TOKENS',
                        }));
                        setTokens(newOptions);
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
            type: "SEARCH_ITEM_COLLECTION_ACCOUNT",
        };

        axios.post(`${NFT_BASE_URL}/search`, body)
            .then((res) => {
                try {
                    if (res.status === 200 && res.data) {
                        const ret = res.data;
                        setCollections(ret.collections);
                    }
                } catch (error) {
                    console.log(error);
                }
            })
            .catch((err) => {
                console.log("err->>", err);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        getData(debouncedSearch);
        getNFTs(debouncedSearch);
    }, [debouncedSearch]);

    const handleClose = () => {
        setSearch("");
        onClose();
    }

    const handleTabChange = (event, newValue) => {
        if (newValue !== activeTab) {
            setActiveTab(newValue);
        }
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                handleClose();
            }
        };

        if (open) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [open]);

    const filteredTokens = activeTab === 'token' ? tokens.slice(0, 50) : tokens.slice(0, 4);
    const filteredCollections = activeTab === 'nft' ? collections.slice(0, 50) : collections.slice(0, 3);

    return (
        <Paper ref={modalRef} sx={{
            width: "100%",
            maxWidth: "600px",
            minHeight: "500px",
            position: "fixed",
            right: "10px",
            top: open ? "45px" : "-100%",
            p: 1.5,
            zIndex: 9999,
            opacity: open ? 1 : 0,
            transition: "opacity 0.2s",
        }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <SearchIcon />
                <InputBase placeholder="Search token, pair, or NFT" fullWidth sx={{ border: "none" }} value={search} onChange={(e) => setSearch(e.target.value)} />
                <IconButton onClick={handleClose}>
                    <CloseIcon />
                </IconButton>
            </Stack>

            {search.length > 0 && (
                <StyledToggleButtonGroup
                    color="primary"
                    value={activeTab}
                    exclusive
                    onChange={handleTabChange}
                    aria-label="text formatting"
                >
                    <ToggleButton value="all">All</ToggleButton>
                    <ToggleButton value="token">Tokens</ToggleButton>
                    <ToggleButton value="nft">NFTs</ToggleButton>
                </StyledToggleButtonGroup>
            )}

            {filteredTokens.length > 0 && (
                <Stack mt={1} sx={{ display: (activeTab === 'token' || activeTab === 'all') ? "flex" : "none" }}>
                    <Stack direction="row" alignItems="center" sx={{ px: 1 }} spacing={0.5}>
                        <Typography>{`${!search ? "Trending " : ""}Tokens`}</Typography>
                        <WhatshotIcon fontSize="small" style={{ marginRight: 4, color: 'orange' }} />
                    </Stack>
                    <MenuList sx={{ px: 0 }}>
                        {filteredTokens.map(({ md5, name, slug, isOMCF, user, kyc, pro24h, exch }, idx) => {
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
                            );
                        })}
                    </MenuList>
                </Stack>
            )}

            {filteredCollections.length > 0 && (
                <Stack mt={1} sx={{ display: (activeTab === 'nft' || activeTab === 'all') ? "flex" : "none" }}>
                    <Stack direction="row" alignItems="center" spacing={0.5} sx={{ px: 1 }}>
                        <Typography>{`${!search ? "Trending " : ""}NFTs`}</Typography>
                        <WhatshotIcon fontSize="small" style={{ marginRight: 4, color: 'orange' }} />
                    </Stack>
                    <MenuList sx={{ px: 0 }}>
                        {filteredCollections.map((nft, idx) => (
                            <NFTRender key={idx} {...nft} darkMode={darkMode} />
                        ))}
                    </MenuList>
                </Stack>
            )}
        </Paper>
    );
};
