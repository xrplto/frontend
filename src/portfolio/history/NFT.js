import axios from 'axios';
import { useState, useEffect } from 'react';

// Material
import {
    useTheme,
    Avatar,
    Box,
    Container,
    Link,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableRow,
    Typography
} from '@mui/material';
import { tableCellClasses } from '@mui/material/TableCell';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
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
import AnimationIcon from '@mui/icons-material/Animation';
import PaymentIcon from '@mui/icons-material/Payment';
import ImportExportIcon from '@mui/icons-material/ImportExport';

// Utils
import { formatDateTime } from 'src/utils/formatTime';
import { Activity } from 'src/utils/constants';
import { normalizeAmount } from 'src/utils/normalizers';

// Loader
import { PulseLoader } from 'react-spinners';

// Components
import FlagsContainer from 'src/components/Flags';
import ListToolbar from 'src/components/ListToolbar';
// ----------------------------------------------------------------------
export default function NFTHistory({ account }) {
    const theme = useTheme();
    const BASE_URL = 'https://api.xrpnft.com/api';

    const [page, setPage] = useState(0);
    const [rows, setRows] = useState(10);
    const [total, setTotal] = useState(0);
    const [acts, setActs] = useState([]);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        function getActivities() {
            setLoading(true);
            axios
                .get(
                    `${BASE_URL}/account/activity?account=${account}&page=${page}&limit=${rows}`
                )
                .then((res) => {
                    let ret = res.status === 200 ? res.data : undefined;
                    if (ret) {
                        setTotal(ret.total);
                        setActs(ret.acts);
                    }
                })
                .catch((err) => {
                    console.log('Error on getting activity list!!!', err);
                })
                .then(function () {
                    // always executed
                    setLoading(false);
                });
        }
        getActivities();
    }, [account, page, rows]);

    return (
        <Container maxWidth="md" sx={{ pl: 0, pr: 0 }}>
            {loading ? (
                <Stack alignItems="center">
                    <PulseLoader color="#00AB55" size={10} />
                </Stack>
            ) : (
                acts &&
                acts.length === 0 && (
                    <Stack alignItems="center" sx={{ mt: 5 }}>
                        <Typography variant="s7">No Items</Typography>
                    </Stack>
                )
            )}
            <Box
                sx={{
                    display: 'flex',
                    gap: 1,
                    py: 1,
                    overflow: 'auto',
                    width: '100%',
                    '& > *': {
                        scrollSnapAlign: 'center'
                    },
                    '::-webkit-scrollbar': { display: 'none' }
                }}
            >
                <Table
                    stickyHeader
                    sx={{
                        [`& .${tableCellClasses.root}`]: {
                            borderBottom: '1px solid',
                            borderColor: theme.palette.divider
                        }
                    }}
                >
                    <TableBody>
                        {
                            // {
                            //     "_id": "632683afa45d7f463e8ef870",
                            //     "account": "rHAfrQNDBohGbWuWTWzpJe1LQWyYVnbG2n",
                            //     "name": "TestCollection-1",
                            //     "slug": "test1",
                            //     "type": "bulk",
                            //     "bulkUrl": "https://drive.google.com/file/d/1xjA-1bodiMrvSCtdTEMim5x1Cam74bXU/view",
                            //     "status": 7,
                            //     "description": "This is the description of test1 collection",
                            //     "logoImage": "1663468463243_3d1cc658af10407fabf2c5e96bde2ab4.png",
                            //     "featuredImage": "1663468463243_220f174cbce64122b203c6bccafab57c.jpg",
                            //     "bannerImage": "1663468463245_dcb8db64b5b84da49fd2839508cc0618.jpg",
                            //     "created": 1663468463251,
                            //     "modified": 1663468463251,
                            //     "uuid": "92d8b1d1ac3d48369e98463e6ec29678",
                            //     "creator": "xrpnft.com",
                            //     "infoDOWNLOAD": {
                            //         "size": "2.47 GB"
                            //     }
                            // }
                            // exchs.slice(page * rows, page * rows + rows)
                            acts &&
                                acts.map((row) => {
                                    const { account, activity, data, time } =
                                        row;

                                    const strDateTime = formatDateTime(time);

                                    let strActivity = '';
                                    let componentActivity = <></>;
                                    let componentIcon = <TaskAltIcon />;
                                    switch (activity) {
                                        case Activity.LOGIN:
                                            strActivity = 'Login';
                                            componentIcon = <LoginIcon />;
                                            componentActivity = <></>;
                                            break;
                                        case Activity.LOGOUT:
                                            strActivity = 'Logout';
                                            componentIcon = <LogoutIcon />;
                                            componentActivity = <></>;
                                            break;
                                        case Activity.UPDATE_PROFILE:
                                            strActivity = 'Update Profile';
                                            componentIcon = (
                                                <ManageAccountsIcon />
                                            );
                                            componentActivity = <></>;
                                            break;
                                        case Activity.CREATE_COLLECTION:
                                            strActivity = 'Create a Collection';
                                            componentIcon = <GridOnIcon />;
                                            // {name, type, slug, logo: data.logoImage}
                                            componentActivity = (
                                                <>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                        alignItems="center"
                                                    >
                                                        <Avatar
                                                            alt="C"
                                                            src={`https://s1.xrpnft.com/collection/${data.logo}`}
                                                        />
                                                        <Stack>
                                                            <Stack
                                                                direction="row"
                                                                spacing={1}
                                                            >
                                                                <Typography variant="s7">
                                                                    Name:{' '}
                                                                </Typography>
                                                                <Typography variant="s8">
                                                                    {data.name}
                                                                </Typography>
                                                            </Stack>
                                                            <Stack
                                                                direction="row"
                                                                spacing={1}
                                                            >
                                                                <Typography variant="s7">
                                                                    Type:{' '}
                                                                </Typography>
                                                                <Typography variant="s8">
                                                                    {data.type}
                                                                </Typography>
                                                            </Stack>
                                                        </Stack>
                                                    </Stack>
                                                </>
                                            );
                                            break;
                                        case Activity.IMPORT_COLLECTION:
                                            strActivity = 'Import a Collection';
                                            componentIcon = (
                                                <ImportExportIcon />
                                            );
                                            // {name, type, slug, logo: data.logoImage}
                                            componentActivity = (
                                                <>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                        alignItems="center"
                                                    >
                                                        <Avatar
                                                            alt="C"
                                                            src={`https://s1.xrpnft.com/collection/${data.logo}`}
                                                        />
                                                        <Link
                                                            href={`/collection/${data.slug}`}
                                                            underline="none"
                                                        >
                                                            <Typography variant="s8">
                                                                {data.name}
                                                            </Typography>
                                                        </Link>
                                                    </Stack>
                                                </>
                                            );
                                            break;
                                        case Activity.UPDATE_COLLECTION:
                                            strActivity = 'Update Collection';
                                            componentIcon = <Grid4x4Icon />;
                                            componentActivity = (
                                                <>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                        alignItems="center"
                                                    >
                                                        <Avatar
                                                            alt="C"
                                                            src={`https://s1.xrpnft.com/collection/${data.logo}`}
                                                        />
                                                        <Stack>
                                                            <Stack
                                                                direction="row"
                                                                spacing={1}
                                                            >
                                                                <Typography variant="s7">
                                                                    Name:{' '}
                                                                </Typography>
                                                                <Typography variant="s8">
                                                                    {data.name}
                                                                </Typography>
                                                            </Stack>
                                                            <Stack
                                                                direction="row"
                                                                spacing={1}
                                                            >
                                                                <Typography variant="s7">
                                                                    Type:{' '}
                                                                </Typography>
                                                                <Typography variant="s8">
                                                                    {data.type}
                                                                </Typography>
                                                            </Stack>
                                                        </Stack>
                                                    </Stack>
                                                </>
                                            );
                                            break;
                                        case Activity.MINT_BULK:
                                            strActivity = 'Mint Bulk NFTs';
                                            componentIcon = <CollectionsIcon />;
                                            // {flag, minter, issuer, count: metadata.length, meta: metadata[0]}
                                            componentActivity = (
                                                <>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                        justifyContent="space-between"
                                                        alignItems="center"
                                                    >
                                                        <Stack
                                                            direction="row"
                                                            spacing={1}
                                                        >
                                                            <Avatar
                                                                alt="C"
                                                                src={`https://gateway.xrpnft.com/ipfs/${data.meta.image}`}
                                                            />
                                                            <Stack>
                                                                <Stack
                                                                    direction="row"
                                                                    spacing={1}
                                                                >
                                                                    <Typography variant="s7">
                                                                        Minter:{' '}
                                                                    </Typography>
                                                                    <Typography variant="s8">
                                                                        {
                                                                            data.minter
                                                                        }
                                                                    </Typography>
                                                                </Stack>
                                                                <Stack
                                                                    direction="row"
                                                                    spacing={1}
                                                                >
                                                                    <Typography variant="s7">
                                                                        Issuer:{' '}
                                                                    </Typography>
                                                                    <Typography variant="s8">
                                                                        {
                                                                            data.issuer
                                                                        }
                                                                    </Typography>
                                                                </Stack>
                                                                <Stack
                                                                    direction="row"
                                                                    spacing={1}
                                                                >
                                                                    <Typography variant="s7">
                                                                        Total:{' '}
                                                                    </Typography>
                                                                    <Typography variant="s8">
                                                                        {
                                                                            data.count
                                                                        }
                                                                    </Typography>
                                                                </Stack>
                                                            </Stack>
                                                        </Stack>
                                                        <Stack
                                                            direction="row"
                                                            spacing={1}
                                                            alignItems="center"
                                                        >
                                                            <FlagsContainer
                                                                Flags={
                                                                    data.flag
                                                                }
                                                            />
                                                        </Stack>
                                                    </Stack>
                                                </>
                                            );
                                            break;
                                        case Activity.BUY_MINT:
                                            strActivity = 'Buy Mint';
                                            componentIcon = <ShoppingBagIcon />;
                                            // {cid, cname, cslug, amount, quantity}
                                            componentActivity = (
                                                <>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                        justifyContent="space-between"
                                                        alignItems="center"
                                                    >
                                                        <Stack
                                                            direction="row"
                                                            spacing={1}
                                                        >
                                                            <Avatar
                                                                alt="C"
                                                                src={`https://s1.xrpl.to/token/${data.cost?.md5}`}
                                                            />
                                                            <Stack>
                                                                <Stack
                                                                    direction="row"
                                                                    spacing={1}
                                                                >
                                                                    <Typography variant="s7">
                                                                        Collection:{' '}
                                                                    </Typography>
                                                                    <Typography variant="s8">
                                                                        {
                                                                            data.cname
                                                                        }
                                                                    </Typography>
                                                                </Stack>
                                                                <Stack
                                                                    direction="row"
                                                                    spacing={
                                                                        0.8
                                                                    }
                                                                    alignItems="center"
                                                                >
                                                                    <Typography
                                                                        variant="p4"
                                                                        color="#EB5757"
                                                                    >
                                                                        {
                                                                            data
                                                                                .cost
                                                                                ?.amount
                                                                        }
                                                                    </Typography>
                                                                    <Typography variant="s2">
                                                                        {
                                                                            data
                                                                                .cost
                                                                                ?.name
                                                                        }
                                                                    </Typography>
                                                                </Stack>
                                                            </Stack>
                                                        </Stack>
                                                        <Stack
                                                            direction="row"
                                                            spacing={1}
                                                            alignItems="center"
                                                        >
                                                            <Stack
                                                                direction="row"
                                                                spacing={1}
                                                            >
                                                                <Typography variant="s7">
                                                                    Quantity:{' '}
                                                                </Typography>
                                                                <Typography variant="s8">
                                                                    {
                                                                        data.quantity
                                                                    }
                                                                </Typography>
                                                            </Stack>
                                                        </Stack>
                                                    </Stack>
                                                </>
                                            );
                                            break;
                                        case Activity.BUY_RANDOM_NFT:
                                            strActivity = 'Buy Random NFT';
                                            componentIcon = <CasinoIcon />;
                                            componentActivity = (
                                                <>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                        justifyContent="space-between"
                                                        alignItems="center"
                                                    >
                                                        <Stack
                                                            direction="row"
                                                            spacing={1}
                                                        >
                                                            <Avatar
                                                                alt="C"
                                                                src={`https://gateway.xrpnft.com/ipfs/${data.meta.image}`}
                                                            />
                                                            <Stack>
                                                                <Stack
                                                                    direction="row"
                                                                    spacing={1}
                                                                >
                                                                    <Typography variant="s7">
                                                                        Name:{' '}
                                                                    </Typography>
                                                                    <Typography variant="s8">
                                                                        {
                                                                            data.name
                                                                        }
                                                                    </Typography>
                                                                </Stack>
                                                                <Stack
                                                                    direction="row"
                                                                    spacing={1}
                                                                >
                                                                    <Typography variant="s7">
                                                                        Type:{' '}
                                                                    </Typography>
                                                                    <Typography variant="s8">
                                                                        {
                                                                            data.type
                                                                        }
                                                                    </Typography>
                                                                </Stack>
                                                                <Stack
                                                                    direction="row"
                                                                    spacing={1}
                                                                >
                                                                    <Typography variant="s7">
                                                                        uuid:{' '}
                                                                    </Typography>
                                                                    <Typography variant="s8">
                                                                        {
                                                                            data.uuid
                                                                        }
                                                                    </Typography>
                                                                </Stack>
                                                            </Stack>
                                                        </Stack>
                                                        <Stack
                                                            direction="row"
                                                            spacing={1}
                                                            alignItems="center"
                                                        >
                                                            <FlagsContainer
                                                                Flags={
                                                                    data.flag
                                                                }
                                                            />
                                                        </Stack>
                                                    </Stack>
                                                </>
                                            );
                                            break;
                                        case Activity.BUY_SEQUENCE_NFT:
                                            strActivity = 'Buy Sequence NFT';
                                            componentIcon = <AnimationIcon />;
                                            componentActivity = (
                                                <>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                        justifyContent="space-between"
                                                        alignItems="center"
                                                    >
                                                        <Stack
                                                            direction="row"
                                                            spacing={1}
                                                        >
                                                            <Avatar
                                                                alt="C"
                                                                src={`https://gateway.xrpnft.com/ipfs/${data.meta.image}`}
                                                            />
                                                            <Stack>
                                                                <Stack
                                                                    direction="row"
                                                                    spacing={1}
                                                                >
                                                                    <Typography variant="s7">
                                                                        Name:{' '}
                                                                    </Typography>
                                                                    <Typography variant="s8">
                                                                        {
                                                                            data.name
                                                                        }
                                                                    </Typography>
                                                                </Stack>
                                                                <Stack
                                                                    direction="row"
                                                                    spacing={1}
                                                                >
                                                                    <Typography variant="s7">
                                                                        Type:{' '}
                                                                    </Typography>
                                                                    <Typography variant="s8">
                                                                        {
                                                                            data.type
                                                                        }
                                                                    </Typography>
                                                                </Stack>
                                                                <Stack
                                                                    direction="row"
                                                                    spacing={1}
                                                                >
                                                                    <Typography variant="s7">
                                                                        uuid:{' '}
                                                                    </Typography>
                                                                    <Typography variant="s8">
                                                                        {
                                                                            data.uuid
                                                                        }
                                                                    </Typography>
                                                                </Stack>
                                                            </Stack>
                                                        </Stack>
                                                        <Stack
                                                            direction="row"
                                                            spacing={1}
                                                            alignItems="center"
                                                        >
                                                            <FlagsContainer
                                                                Flags={
                                                                    data.flag
                                                                }
                                                            />
                                                        </Stack>
                                                    </Stack>
                                                </>
                                            );
                                            break;
                                        case Activity.BUY_BULK_NFT:
                                            strActivity = 'Buy Bulk NFT';
                                            componentIcon = <TaskAltIcon />;
                                            componentActivity = (
                                                <>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                        justifyContent="space-between"
                                                        alignItems="center"
                                                    >
                                                        <Stack
                                                            direction="row"
                                                            spacing={1}
                                                        >
                                                            <Avatar
                                                                alt="C"
                                                                src={`https://gateway.xrpnft.com/ipfs/${data.meta.image}`}
                                                            />
                                                            <Stack>
                                                                <Stack
                                                                    direction="row"
                                                                    spacing={1}
                                                                >
                                                                    <Typography variant="s7">
                                                                        Name:{' '}
                                                                    </Typography>
                                                                    <Typography variant="s8">
                                                                        {
                                                                            data.name
                                                                        }
                                                                    </Typography>
                                                                </Stack>
                                                                <Stack
                                                                    direction="row"
                                                                    spacing={1}
                                                                >
                                                                    <Typography variant="s7">
                                                                        Type:{' '}
                                                                    </Typography>
                                                                    <Typography variant="s8">
                                                                        {
                                                                            data.type
                                                                        }
                                                                    </Typography>
                                                                </Stack>
                                                                <Stack
                                                                    direction="row"
                                                                    spacing={1}
                                                                >
                                                                    <Typography variant="s7">
                                                                        uuid:{' '}
                                                                    </Typography>
                                                                    <Typography variant="s8">
                                                                        {
                                                                            data.uuid
                                                                        }
                                                                    </Typography>
                                                                </Stack>
                                                            </Stack>
                                                        </Stack>
                                                        <Stack
                                                            direction="row"
                                                            spacing={1}
                                                            alignItems="center"
                                                        >
                                                            <FlagsContainer
                                                                Flags={
                                                                    data.flag
                                                                }
                                                            />
                                                        </Stack>
                                                    </Stack>
                                                </>
                                            );
                                            break;
                                        case Activity.CREATE_SELL_OFFER:
                                            componentIcon = <LocalOfferIcon />;
                                            strActivity = 'Create Sell Offer';
                                            // NFTokenID
                                            componentActivity = (
                                                <>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                    >
                                                        <Typography variant="s7">
                                                            NFTokenID:{' '}
                                                        </Typography>
                                                        <Link
                                                            color="inherit"
                                                            target="_blank"
                                                            href={`/nft/${data.NFTokenID}`}
                                                            rel="noreferrer noopener nofollow"
                                                        >
                                                            <Typography variant="s8">
                                                                {data.NFTokenID}
                                                            </Typography>
                                                        </Link>
                                                    </Stack>
                                                </>
                                            );
                                            break;
                                        case Activity.CREATE_BUY_OFFER:
                                            componentIcon = <LocalOfferIcon />;
                                            strActivity = 'Create Buy Offer';
                                            // NFTokenID
                                            componentActivity = (
                                                <>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                    >
                                                        <Typography variant="s7">
                                                            NFTokenID:{' '}
                                                        </Typography>
                                                        <Link
                                                            color="inherit"
                                                            target="_blank"
                                                            href={`/nft/${data.NFTokenID}`}
                                                            rel="noreferrer noopener nofollow"
                                                        >
                                                            <Typography variant="s8">
                                                                {data.NFTokenID}
                                                            </Typography>
                                                        </Link>
                                                    </Stack>
                                                </>
                                            );
                                            break;

                                        case Activity.CANCEL_SELL_OFFER:
                                            componentIcon = (
                                                <HighlightOffIcon />
                                            );
                                            strActivity = 'Cancel Sell Offer';
                                            // NFTokenID
                                            componentActivity = (
                                                <>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                    >
                                                        <Typography variant="s7">
                                                            NFTokenID:{' '}
                                                        </Typography>
                                                        <Link
                                                            color="inherit"
                                                            target="_blank"
                                                            href={`https://bithomp.com/explorer/${data.NFTokenID}`}
                                                            rel="noreferrer noopener nofollow"
                                                        >
                                                            <Typography variant="s8">
                                                                {data.NFTokenID}
                                                            </Typography>
                                                        </Link>
                                                    </Stack>
                                                </>
                                            );
                                            break;
                                        case Activity.CANCEL_BUY_OFFER:
                                            componentIcon = (
                                                <HighlightOffIcon />
                                            );
                                            strActivity = 'Cancel Buy Offer';
                                            // NFTokenID
                                            componentActivity = (
                                                <>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                    >
                                                        <Typography variant="s7">
                                                            NFTokenID:{' '}
                                                        </Typography>
                                                        <Link
                                                            color="inherit"
                                                            target="_blank"
                                                            href={`https://bithomp.com/explorer/${data.NFTokenID}`}
                                                            rel="noreferrer noopener nofollow"
                                                        >
                                                            <Typography variant="s8">
                                                                {data.NFTokenID}
                                                            </Typography>
                                                        </Link>
                                                    </Stack>
                                                </>
                                            );
                                            break;

                                        case Activity.ACCEPT_BUY_OFFER:
                                            componentIcon = (
                                                <CheckCircleOutlineIcon />
                                            );
                                            strActivity = 'Accept Buy Offer';
                                            // NFTokenID
                                            componentActivity = (
                                                <>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                    >
                                                        <Typography variant="s7">
                                                            NFTokenID:{' '}
                                                        </Typography>
                                                        <Link
                                                            color="inherit"
                                                            target="_blank"
                                                            href={`https://bithomp.com/explorer/${data.NFTokenID}`}
                                                            rel="noreferrer noopener nofollow"
                                                        >
                                                            <Typography variant="s8">
                                                                {data.NFTokenID}
                                                            </Typography>
                                                        </Link>
                                                    </Stack>
                                                </>
                                            );
                                            break;
                                        case Activity.ACCEPT_SELL_OFFER:
                                            componentIcon = (
                                                <CheckCircleOutlineIcon />
                                            );
                                            strActivity = 'Accept Sell Offer';
                                            // NFTokenID
                                            componentActivity = (
                                                <>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                    >
                                                        <Typography variant="s7">
                                                            NFTokenID:{' '}
                                                        </Typography>
                                                        <Link
                                                            color="inherit"
                                                            target="_blank"
                                                            href={`https://bithomp.com/explorer/${data.NFTokenID}`}
                                                            rel="noreferrer noopener nofollow"
                                                        >
                                                            <Typography variant="s8">
                                                                {data.NFTokenID}
                                                            </Typography>
                                                        </Link>
                                                    </Stack>
                                                </>
                                            );
                                            break;

                                        case Activity.OWNER_ACCPETED_YOUR_BUY_OFFER:
                                            componentIcon = <HowToRegIcon />;
                                            strActivity =
                                                'NFT Owner accepted your Buy Offer';
                                            // NFTokenID
                                            componentActivity = (
                                                <>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                    >
                                                        <Typography variant="s7">
                                                            NFTokenID:{' '}
                                                        </Typography>
                                                        <Link
                                                            color="inherit"
                                                            target="_blank"
                                                            href={`https://bithomp.com/explorer/${data.NFTokenID}`}
                                                            rel="noreferrer noopener nofollow"
                                                        >
                                                            <Typography variant="s8">
                                                                {data.NFTokenID}
                                                            </Typography>
                                                        </Link>
                                                    </Stack>
                                                </>
                                            );
                                            break;
                                        case Activity.BUYER_ACCEPTED_YOUR_SELL_OFFER:
                                            componentIcon = <HowToRegIcon />;
                                            strActivity =
                                                'Buyer accepted your Sell Offer';
                                            // NFTokenID
                                            componentActivity = (
                                                <>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                    >
                                                        <Typography variant="s7">
                                                            NFTokenID:{' '}
                                                        </Typography>
                                                        <Link
                                                            color="inherit"
                                                            target="_blank"
                                                            href={`https://bithomp.com/explorer/${data.NFTokenID}`}
                                                            rel="noreferrer noopener nofollow"
                                                        >
                                                            <Typography variant="s8">
                                                                {data.NFTokenID}
                                                            </Typography>
                                                        </Link>
                                                    </Stack>
                                                </>
                                            );
                                            break;

                                        case Activity.YOU_RECEIVED_A_NFT:
                                            componentIcon = <SportsScoreIcon />;
                                            strActivity = 'You received a NFT';
                                            // NFTokenID
                                            componentActivity = (
                                                <>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                    >
                                                        <Typography variant="s7">
                                                            NFTokenID:{' '}
                                                        </Typography>
                                                        <Link
                                                            color="inherit"
                                                            target="_blank"
                                                            href={`https://bithomp.com/explorer/${data.NFTokenID}`}
                                                            rel="noreferrer noopener nofollow"
                                                        >
                                                            <Typography variant="s8">
                                                                {data.NFTokenID}
                                                            </Typography>
                                                        </Link>
                                                    </Stack>
                                                </>
                                            );
                                            break;

                                        case Activity.MINT_NFT:
                                            strActivity = 'Minted a NFT';
                                            componentIcon = <TokenIcon />;
                                            componentActivity = (
                                                <>
                                                    {data.meta ? (
                                                        <Stack
                                                            direction="row"
                                                            spacing={1}
                                                            justifyContent="space-between"
                                                            alignItems="center"
                                                        >
                                                            <Stack
                                                                direction="row"
                                                                spacing={1}
                                                            >
                                                                <Avatar
                                                                    alt="C"
                                                                    src={`https://gateway.xrpnft.com/ipfs/${data.meta.image}`}
                                                                />
                                                                <Stack>
                                                                    <Stack
                                                                        direction="row"
                                                                        spacing={
                                                                            1
                                                                        }
                                                                    >
                                                                        <Typography variant="s7">
                                                                            Name:{' '}
                                                                        </Typography>
                                                                        <Typography variant="s8">
                                                                            {
                                                                                data.name
                                                                            }
                                                                        </Typography>
                                                                    </Stack>
                                                                    <Stack
                                                                        direction="row"
                                                                        spacing={
                                                                            1
                                                                        }
                                                                    >
                                                                        <Typography variant="s7">
                                                                            Type:{' '}
                                                                        </Typography>
                                                                        <Typography variant="s8">
                                                                            {
                                                                                data.type
                                                                            }
                                                                        </Typography>
                                                                    </Stack>
                                                                </Stack>
                                                            </Stack>
                                                            <Stack
                                                                direction="row"
                                                                spacing={1}
                                                                alignItems="center"
                                                            >
                                                                <FlagsContainer
                                                                    Flags={
                                                                        data.flag
                                                                    }
                                                                />
                                                            </Stack>
                                                        </Stack>
                                                    ) : (
                                                        <Stack>
                                                            <Stack
                                                                direction="row"
                                                                spacing={1}
                                                            >
                                                                <Typography variant="s7">
                                                                    NFTokenID:{' '}
                                                                </Typography>
                                                                <Link
                                                                    color="inherit"
                                                                    target="_blank"
                                                                    href={`https://bithomp.com/explorer/${data.NFTokenID}`}
                                                                    rel="noreferrer noopener nofollow"
                                                                >
                                                                    <Typography variant="s8">
                                                                        {
                                                                            data.NFTokenID
                                                                        }
                                                                    </Typography>
                                                                </Link>
                                                            </Stack>
                                                            {/* <Typography variant="s8">{data.URI}</Typography> */}
                                                        </Stack>
                                                    )}
                                                </>
                                            );
                                            break;

                                        case Activity.BURN_NFT:
                                            componentIcon = <FireplaceIcon />;
                                            strActivity = 'Burnt a NFT';
                                            // NFTokenID
                                            componentActivity = (
                                                <>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                    >
                                                        <Typography variant="s7">
                                                            NFTokenID:{' '}
                                                        </Typography>
                                                        <Link
                                                            color="inherit"
                                                            target="_blank"
                                                            href={`https://bithomp.com/explorer/${data.NFTokenID}`}
                                                            rel="noreferrer noopener nofollow"
                                                        >
                                                            <Typography variant="s8">
                                                                {data.NFTokenID}
                                                            </Typography>
                                                        </Link>
                                                    </Stack>
                                                </>
                                            );
                                            break;

                                        case Activity.SET_NFT_MINTER:
                                            strActivity = 'Set NFT Minter';
                                            componentIcon = <ApprovalIcon />;
                                            componentActivity = (
                                                <>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                    >
                                                        <Typography variant="s7">
                                                            Minter:{' '}
                                                        </Typography>
                                                        <Typography variant="s8">
                                                            {data.NFTokenMinter}
                                                        </Typography>
                                                    </Stack>
                                                </>
                                            );
                                            break;
                                        case Activity.REFUND_BUYER:
                                            strActivity =
                                                'Refund Mint Amount to Buyer';
                                            componentIcon = <PaymentIcon />;
                                            const amount = normalizeAmount(
                                                data.amount
                                            );
                                            componentActivity = (
                                                <>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                        justifyContent="space-between"
                                                        alignItems="center"
                                                    >
                                                        <Stack
                                                            direction="row"
                                                            spacing={1}
                                                        >
                                                            <Avatar
                                                                alt="C"
                                                                src={`https://s1.xrpl.to/token/${data.cost?.md5}`}
                                                            />
                                                            <Stack>
                                                                <Stack
                                                                    direction="row"
                                                                    spacing={1}
                                                                >
                                                                    <Typography variant="s7">
                                                                        Collection:{' '}
                                                                    </Typography>
                                                                    <Typography variant="s8">
                                                                        {
                                                                            data.cname
                                                                        }
                                                                    </Typography>
                                                                </Stack>
                                                                <Stack
                                                                    direction="row"
                                                                    spacing={
                                                                        0.8
                                                                    }
                                                                    alignItems="center"
                                                                >
                                                                    <Typography variant="s7">
                                                                        Cost x
                                                                        Quantity:{' '}
                                                                    </Typography>
                                                                    <Typography variant="s8">
                                                                        {
                                                                            data
                                                                                .cost
                                                                                ?.amount
                                                                        }
                                                                    </Typography>
                                                                    <Typography variant="s8">
                                                                        {
                                                                            data
                                                                                .cost
                                                                                ?.name
                                                                        }
                                                                    </Typography>
                                                                    <Typography variant="s8">
                                                                        x
                                                                    </Typography>
                                                                    <Typography variant="s8">
                                                                        {
                                                                            data.quantity
                                                                        }
                                                                    </Typography>
                                                                </Stack>
                                                                <Stack
                                                                    direction="row"
                                                                    spacing={1}
                                                                >
                                                                    <Typography variant="s7">
                                                                        To:{' '}
                                                                    </Typography>
                                                                    <Typography variant="s8">
                                                                        {
                                                                            data.dest
                                                                        }
                                                                    </Typography>
                                                                </Stack>
                                                            </Stack>
                                                        </Stack>
                                                        <Stack
                                                            direction="row"
                                                            spacing={1}
                                                            alignItems="center"
                                                        >
                                                            <Stack
                                                                direction="row"
                                                                spacing={1}
                                                            >
                                                                <Typography variant="s7">
                                                                    Amount:{' '}
                                                                </Typography>
                                                                <Typography variant="s8">
                                                                    {
                                                                        amount.amount
                                                                    }
                                                                </Typography>
                                                                <Typography variant="s8">
                                                                    {
                                                                        data
                                                                            .cost
                                                                            ?.name
                                                                    }
                                                                </Typography>
                                                            </Stack>
                                                        </Stack>
                                                    </Stack>
                                                </>
                                            );
                                            break;
                                        case Activity.BROKER_ACCEPTED_YOUR_BUY_OFFER:
                                            componentIcon = <HowToRegIcon />;
                                            strActivity =
                                                'Broker accepted your Buy Offer';
                                            // NFTokenID
                                            componentActivity = (
                                                <>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                    >
                                                        <Typography variant="s7">
                                                            NFTokenID:{' '}
                                                        </Typography>
                                                        <Link
                                                            color="inherit"
                                                            target="_blank"
                                                            href={`https://bithomp.com/explorer/${data.NFTokenID}`}
                                                            rel="noreferrer noopener nofollow"
                                                        >
                                                            <Typography variant="s8">
                                                                {data.NFTokenID}
                                                            </Typography>
                                                        </Link>
                                                    </Stack>
                                                </>
                                            );
                                            break;
                                        case Activity.BROKER_ACCEPTED_YOUR_SELL_OFFER:
                                            componentIcon = <HowToRegIcon />;
                                            strActivity =
                                                'Broker accepted your Sell Offer';
                                            // NFTokenID
                                            componentActivity = (
                                                <>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                    >
                                                        <Typography variant="s7">
                                                            NFTokenID:{' '}
                                                        </Typography>
                                                        <Link
                                                            color="inherit"
                                                            target="_blank"
                                                            href={`https://bithomp.com/explorer/${data.NFTokenID}`}
                                                            rel="noreferrer noopener nofollow"
                                                        >
                                                            <Typography variant="s8">
                                                                {data.NFTokenID}
                                                            </Typography>
                                                        </Link>
                                                    </Stack>
                                                </>
                                            );
                                            break;
                                        default:
                                            strActivity = `Unknown Activity: ${activity}`;
                                            componentIcon = <HelpOutlineIcon />;
                                            componentActivity = (
                                                <>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                    ></Stack>
                                                </>
                                            );
                                            break;
                                    }

                                    return (
                                        <TableRow
                                            // hover
                                            key={time}
                                            sx={{
                                                [`& .${tableCellClasses.root}`]:
                                                    {
                                                        // color: (error ? '#B72136' : '#B72136')
                                                    }
                                            }}
                                        >
                                            {/* <TableCell align="left"><Typography variant="subtitle2">{id}</Typography></TableCell> */}
                                            <TableCell align="left">
                                                {componentIcon}
                                            </TableCell>

                                            <TableCell align="left">
                                                <Stack spacing={0.5}>
                                                    <Stack
                                                        direction="row"
                                                        spacing={1}
                                                        justifyContent="space-between"
                                                        alignItems="center"
                                                    >
                                                        <Typography variant="s8">
                                                            {strActivity}
                                                        </Typography>
                                                        <Typography variant="s7">
                                                            {strDateTime}
                                                        </Typography>
                                                    </Stack>
                                                    {componentActivity}
                                                    {/* <Link
                                                color="inherit"
                                                target="_blank"
                                                href={`https://bithomp.com/explorer/${account}`}
                                                rel="noreferrer noopener nofollow"
                                            >
                                                <Typography variant="s4" color="#33C2FF">{account}</Typography>
                                            </Link> */}
                                                </Stack>
                                            </TableCell>

                                            <TableCell align="left"></TableCell>
                                        </TableRow>
                                    );
                                })
                        }
                    </TableBody>
                </Table>
            </Box>
            {total > 0 && (
                <ListToolbar
                    count={total}
                    rows={rows}
                    setRows={setRows}
                    page={page}
                    setPage={setPage}
                />
            )}
        </Container>
    );
}
