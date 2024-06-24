import axios from 'axios';
import { useState, useEffect } from 'react';
// import ModalImage from "react-modal-image";
import { Lightbox } from "react-modal-image";
import {CopyToClipboard} from 'react-copy-to-clipboard';

// Material
import { withStyles } from '@mui/styles';
import {
    styled, useTheme,
    Avatar,
    Backdrop,
    Box,
    Button,
    CardMedia,
    Container,
    IconButton,
    Link,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    ToggleButton,
    ToggleButtonGroup,
    Tooltip,
    Typography,
    Divider
} from '@mui/material';
import { tableCellClasses } from "@mui/material/TableCell";
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import AssignmentReturnedIcon from '@mui/icons-material/AssignmentReturned';
import GridOnIcon from '@mui/icons-material/GridOn';
import Grid4x4Icon from '@mui/icons-material/Grid4x4';
import ApprovalIcon from '@mui/icons-material/Approval';
import TokenIcon from '@mui/icons-material/Token';
import CollectionsIcon from '@mui/icons-material/Collections';
import CasinoIcon from '@mui/icons-material/Casino';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import HighlightOffIcon from '@mui/icons-material/HighlightOff';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import FireplaceIcon from '@mui/icons-material/Fireplace';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AnimationIcon from '@mui/icons-material/Animation';
import PaymentIcon from '@mui/icons-material/Payment';
import TransferWithinAStationIcon from '@mui/icons-material/TransferWithinAStation';
import PagesIcon from '@mui/icons-material/Pages';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Utils
import { getNftCoverUrl } from 'src/utils/parse/utils';
import { formatDateTime } from 'src/utils/formatTime';
import { Activity } from 'src/utils/constants';
import { normalizeAmount, normalizeCurrencyCodeXummImpl } from 'src/utils/normalizers';

// Loader
import { PulseLoader, ClockLoader } from "react-spinners";
import { RotatingSquare, Vortex } from 'react-loader-spinner';

// Components
import ListToolbar from './ListToolbar';
import FlagsContainer from 'src/components/Flags';

// ----------------------------------------------------------------------
export default function CollectionActivity({collection}) {
    const theme = useTheme();
    const BASE_URL = 'https://api.xrpnft.com/api';

    const { openSnackbar } = useContext(AppContext);

    const [page, setPage] = useState(0);
    const [rows, setRows] = useState(10);
    const [total, setTotal] = useState(0);
    const [hists, setHists] = useState([]);

    const [loading, setLoading] = useState(true);

    const [open, setOpen] = useState(false);

    const [lightBoxImgUrl, setLightBoxImgUrl] = useState('');

    const closeLightbox = () => {
        setOpen(false);
    }

    useEffect(() => {
        function getActivities() {
            setLoading(true);

            axios.get(`${BASE_URL}/collectionhistory/?cid=${collection.uuid}&page=${page}&limit=${rows}`)
                .then(res => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        setTotal(ret.total);
                        setHists(ret.hists);
                    }
                }).catch(err => {
                    console.log("Error on getting collection history list!!!", err);
                }).then(function () {
                    // always executed
                    setLoading(false);
                });
        }
        getActivities();
    }, [page, rows]);

    return (
        <Container maxWidth="lg" sx={{pl: 0, pr: 0}}>
            {loading ? (
                <Stack alignItems="center">
                    <PulseLoader color='#00AB55' size={10} />
                </Stack>
            ):(
                hists && hists.length === 0 &&
                    <Stack alignItems="center" sx={{mt: 5}}>
                        <Typography variant="s7">No Activities</Typography>
                    </Stack>
            )
            }
            <Box
                sx={{
                    display: "flex",
                    gap: 1,
                    py: 1,
                    overflow: "auto",
                    width: "100%",
                    "& > *": {
                        scrollSnapAlign: "center",
                    },
                    "::-webkit-scrollbar": { display: "none" },
                }}
            >
                <Table stickyHeader sx={{
                    [`& .${tableCellClasses.root}`]: {
                        borderBottom: "0px solid",
                        borderColor: theme.palette.divider
                    }
                }}>
                    <TableBody>
                    {
                        hists && hists.map((row, idx) => {
                            const {
                                type,
                                uuid,
                                NFTokenID,
                                account,
                                cid,
                                name,
                                meta,
                                dfile,
                                files,
                                cost,
                                quantity,
                                time
                            } = row;

                            // type: BUY_MINT, MINTED, BURN, CREATE_SELL_OFFER, CREATE_BUY_OFFER, CANCEL_SELL_OFFER, CANCEL_BUY_OFFER, TRANSFER, SALE

                            const isVideo = meta?.video?true:false;

                            const imgUrl = getNftCoverUrl({files}, 'small');

                            const strDateTime = formatDateTime(time);

                            const amount = normalizeAmount(row.amount);

                            let strActivity = '';
                            let componentIcon = (<TaskAltIcon />);
                            switch (type) {
                                case 'BUY_MINT':
                                    strActivity = 'Buy Mint';
                                    componentIcon = (<ShoppingBagIcon />);
                                    break;

                                case 'MINTED':
                                    strActivity = 'Mint a NFT';
                                    componentIcon = (<PagesIcon />);
                                    break;

                                case 'BURN':
                                    componentIcon = (<FireplaceIcon />);
                                    strActivity = 'Burnt a NFT';
                                    break;

                                case 'CREATE_SELL_OFFER':
                                    componentIcon = (<LocalOfferIcon />);
                                    strActivity = 'Create Sell Offer';
                                    break;

                                case 'CREATE_BUY_OFFER':
                                    componentIcon = (<LocalOfferIcon />);
                                    strActivity = 'Create Buy Offer';
                                    break;

                                case 'CANCEL_SELL_OFFER':
                                    componentIcon = (<HighlightOffIcon />);
                                    strActivity = 'Cancel Sell Offer';
                                    break;

                                case 'CANCEL_BUY_OFFER':
                                    componentIcon = (<HighlightOffIcon />);
                                    strActivity = 'Cancel Buy Offer';
                                    break;

                                case 'TRANSFER':
                                    strActivity = 'Transfer';
                                    componentIcon = (<TransferWithinAStationIcon />);
                                    break;

                                case 'SALE':
                                    strActivity = 'Sale';
                                    componentIcon = (<PaymentIcon />);
                                    break;

                                default:
                                    strActivity = `Unhandled Activity: ${type}`;
                                    componentIcon = (<HelpOutlineIcon />);
                                    break;
                            }

                            return (
                                <TableRow
                                    // hover
                                    key={time + "" + idx}
                                    sx={{
                                        [`& .${tableCellClasses.root}`]: {
                                            // color: (error ? '#B72136' : '#B72136')
                                        }
                                    }}
                                >
                                    {/* <TableCell align="left"><Typography variant="subtitle2">{id}</Typography></TableCell> */}
                                    <TableCell align="left" width='5%' sx={{pt:1, pb:1}}>
                                        {componentIcon}
                                    </TableCell>

                                    <TableCell align="left" sx={{pt:1, pb:1}}>
                                        <Typography variant='s11' noWrap>{strActivity}</Typography>
                                    </TableCell>

                                    <TableCell align="left" sx={{pt:1, pb:1}}>
                                        {type === 'BUY_MINT' ?
                                            <Stack direction="row" spacing={1} alignItems="center">
                                                <Avatar alt="C" src={`https://s1.xrpl.to/token/${cost?.md5}`} />

                                                <Stack>
                                                    <Stack direction='row' spacing={0.8} alignItems="center">
                                                        <Typography variant="s7">Price: </Typography>
                                                        <Typography variant='s11'>{cost?.amount} {cost?.name}</Typography>
                                                    </Stack>
                                                    <Stack direction="row" spacing={1}>
                                                        <Typography variant="s7">Quantity: </Typography>
                                                        <Typography variant="s11">{quantity}</Typography>
                                                    </Stack>
                                                </Stack>
                                            </Stack>
                                            :
                                            <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                                                <Stack direction="row" spacing={1} alignItems="center">
                                                    <Link
                                                        component="button"
                                                        underline="none"
                                                        onClick={() => {
                                                            if (!isVideo) {
                                                                setLightBoxImgUrl(imgUrl);
                                                                setOpen(true)
                                                            }
                                                        }}
                                                    >
                                                        <CardMedia
                                                            component={isVideo?'video':'img'}
                                                            image={imgUrl}
                                                            alt={'NFT'}
                                                            // controls={isVideo}
                                                            autoPlay={isVideo}
                                                            loop={isVideo}
                                                            muted
                                                            style={{
                                                                width:'48px'
                                                            }}
                                                        />
                                                    </Link>
                                                    <Link
                                                        // color="inherit"
                                                        // target="_blank"
                                                        href={`/nft/${NFTokenID}`}
                                                        rel="noreferrer noopener nofollow"
                                                    >
                                                        <Typography variant="s6" noWrap>{name}</Typography>
                                                    </Link>
                                                </Stack>
                                                {/* <Stack direction="row" spacing={1} alignItems="center">
                                                    <FlagsContainer Flags={flag}/>
                                                </Stack> */}
                                            </Stack>
                                        }
                                    </TableCell>

                                    <TableCell align="left" width='15%' sx={{pt:0.5, pb:0.5}}>
                                        {type === 'SALE' ?
                                            <Typography variant='s11' noWrap>{cost.amount} {normalizeCurrencyCodeXummImpl(cost.currency)}</Typography>
                                            :
                                            <>
                                                {type === 'CREATE_SELL_OFFER' || type === 'CREATE_BUY_OFFER' || type === 'CANCEL_SELL_OFFER' || type === 'CANCEL_SELL_OFFER' ?
                                                    <Typography variant='s11' noWrap>{amount.amount} {normalizeCurrencyCodeXummImpl(amount.currency)}</Typography>
                                                    :
                                                    <Typography variant='s11' noWrap>- - -</Typography>
                                                }
                                            </>
                                        }

                                    </TableCell>

                                    <TableCell align="left" width='15%' sx={{pt:1, pb:1}}>
                                        <Stack direction="row" spacing={0.2} alignItems="center">
                                            <Link
                                                // color="inherit"
                                                // target="_blank"
                                                href={`/account/${account}`}
                                                // rel="noreferrer noopener nofollow"
                                            >
                                                <Typography variant='s11' noWrap> {account}</Typography>
                                            </Link>
                                            <CopyToClipboard text={account} onCopy={()=>openSnackbar('Copied!', 'success')}>
                                                <Tooltip title='Click to copy'>
                                                    <IconButton size="small">
                                                        <ContentCopyIcon fontSize="small" sx={{ width: 16, height: 16 }}/>
                                                    </IconButton>
                                                </Tooltip>
                                            </CopyToClipboard>
                                        </Stack>
                                    </TableCell>

                                    <TableCell align="left" sx={{pt:1, pb:1}}>
                                        <Typography variant='s7' noWrap>{strDateTime}</Typography>
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    }
                    </TableBody>
                </Table>
            </Box>
            { total > 0 &&
                <ListToolbar
                    count={total}
                    rows={rows}
                    setRows={setRows}
                    page={page}
                    setPage={setPage}
                />
            }

            {open &&
                <Lightbox
                    small={lightBoxImgUrl}
                    large={lightBoxImgUrl}
                    hideDownload
                    hideZoom
                    onClose={closeLightbox}
                />
            }
        </Container>
    );
}
