import axios from 'axios';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';

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
        const getActivities = async () => {
            setLoading(true);
            try {
                const { status, data } = await axios.get(
                    `${BASE_URL}/account/activity`,
                    {
                        params: { account, page, limit: rows }
                    }
                );
                if (status === 200 && data) {
                    setTotal(data.total);
                    setActs(data.acts);
                }
            } catch (err) {
                console.error('Error on getting activity list!!!', err);
            } finally {
                setLoading(false);
            }
        };
        getActivities();
    }, [account, page, rows]);

    const renderActivityIcon = (activity) => {
        switch (activity) {
            case Activity.LOGIN:
                return <LoginIcon />;
            case Activity.LOGOUT:
                return <LogoutIcon />;
            case Activity.UPDATE_PROFILE:
                return <ManageAccountsIcon />;
            case Activity.CREATE_COLLECTION:
                return <GridOnIcon />;
            case Activity.IMPORT_COLLECTION:
                return <ImportExportIcon />;
            case Activity.UPDATE_COLLECTION:
                return <Grid4x4Icon />;
            case Activity.MINT_BULK:
                return <CollectionsIcon />;
            case Activity.BUY_MINT:
                return <ShoppingBagIcon />;
            case Activity.BUY_RANDOM_NFT:
                return <CasinoIcon />;
            case Activity.BUY_SEQUENCE_NFT:
                return <AnimationIcon />;
            case Activity.BUY_BULK_NFT:
                return <TaskAltIcon />;
            case Activity.CREATE_SELL_OFFER:
            case Activity.CREATE_BUY_OFFER:
                return <LocalOfferIcon />;
            case Activity.CANCEL_SELL_OFFER:
            case Activity.CANCEL_BUY_OFFER:
                return <HighlightOffIcon />;
            case Activity.ACCEPT_BUY_OFFER:
            case Activity.ACCEPT_SELL_OFFER:
                return <CheckCircleOutlineIcon />;
            case Activity.OWNER_ACCPETED_YOUR_BUY_OFFER:
            case Activity.BUYER_ACCEPTED_YOUR_SELL_OFFER:
            case Activity.BROKER_ACCEPTED_YOUR_BUY_OFFER:
            case Activity.BROKER_ACCEPTED_YOUR_SELL_OFFER:
                return <HowToRegIcon />;
            case Activity.YOU_RECEIVED_A_NFT:
                return <SportsScoreIcon />;
            case Activity.MINT_NFT:
                return <TokenIcon />;
            case Activity.BURN_NFT:
                return <FireplaceIcon />;
            case Activity.SET_NFT_MINTER:
                return <ApprovalIcon />;
            case Activity.REFUND_BUYER:
                return <PaymentIcon />;
            default:
                return <HelpOutlineIcon />;
        }
    };

    const renderActivityDetails = (activity, data) => {
        switch (activity) {
            case Activity.CREATE_COLLECTION:
            case Activity.IMPORT_COLLECTION:
            case Activity.UPDATE_COLLECTION:
                return (
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Avatar alt="C" src={`https://s1.xrpnft.com/collection/${data.logo}`} />
                        <Stack>
                            <Stack direction="row" spacing={1}>
                                <Typography variant="s7">Name: </Typography>
                                <Typography variant="s8">{data.name}</Typography>
                            </Stack>
                            <Stack direction="row" spacing={1}>
                                <Typography variant="s7">Type: </Typography>
                                <Typography variant="s8">{data.type}</Typography>
                            </Stack>
                        </Stack>
                    </Stack>
                );
            case Activity.MINT_BULK:
                return (
                    <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1}>
                            <Avatar alt="C" src={`https://gateway.xrpnft.com/ipfs/${data.meta.image}`} />
                            <Stack>
                                <Stack direction="row" spacing={1}>
                                    <Typography variant="s7">Minter: </Typography>
                                    <Typography variant="s8">{data.minter}</Typography>
                                </Stack>
                                <Stack direction="row" spacing={1}>
                                    <Typography variant="s7">Issuer: </Typography>
                                    <Typography variant="s8">{data.issuer}</Typography>
                                </Stack>
                                <Stack direction="row" spacing={1}>
                                    <Typography variant="s7">Total: </Typography>
                                    <Typography variant="s8">{data.count}</Typography>
                                </Stack>
                            </Stack>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <FlagsContainer Flags={data.flag} />
                        </Stack>
                    </Stack>
                );
            case Activity.BUY_MINT:
                return (
                    <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1}>
                            <Avatar alt="C" src={`https://s1.xrpl.to/token/${data.cost?.md5}`} />
                            <Stack>
                                <Stack direction="row" spacing={1}>
                                    <Typography variant="s7">Collection: </Typography>
                                    <Typography variant="s8">{data.cname}</Typography>
                                </Stack>
                                <Stack direction="row" spacing={0.8} alignItems="center">
                                    <Typography variant="p4" color="#EB5757">{data.cost?.amount}</Typography>
                                    <Typography variant="s2">{data.cost?.name}</Typography>
                                </Stack>
                            </Stack>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Stack direction="row" spacing={1}>
                                <Typography variant="s7">Quantity: </Typography>
                                <Typography variant="s8">{data.quantity}</Typography>
                            </Stack>
                        </Stack>
                    </Stack>
                );
            case Activity.CREATE_SELL_OFFER:
            case Activity.CREATE_BUY_OFFER:
            case Activity.CANCEL_SELL_OFFER:
            case Activity.CANCEL_BUY_OFFER:
            case Activity.ACCEPT_BUY_OFFER:
            case Activity.ACCEPT_SELL_OFFER:
            case Activity.OWNER_ACCPETED_YOUR_BUY_OFFER:
            case Activity.BUYER_ACCEPTED_YOUR_SELL_OFFER:
            case Activity.BROKER_ACCEPTED_YOUR_BUY_OFFER:
            case Activity.BROKER_ACCEPTED_YOUR_SELL_OFFER:
            case Activity.YOU_RECEIVED_A_NFT:
                return (
                    <Stack direction="row" spacing={1}>
                        <Typography variant="s7">NFTokenID: </Typography>
                        <Link
                            color="inherit"
                            target="_blank"
                            href={`https://bithomp.com/explorer/${data.NFTokenID}`}
                            rel="noreferrer noopener nofollow"
                        >
                            <Typography variant="s8">{data.NFTokenID}</Typography>
                        </Link>
                    </Stack>
                );
            case Activity.MINT_NFT:
                return data.meta ? (
                    <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1}>
                            <Avatar alt="C" src={`https://gateway.xrpnft.com/ipfs/${data.meta.image}`} />
                            <Stack>
                                <Stack direction="row" spacing={1}>
                                    <Typography variant="s7">Name: </Typography>
                                    <Typography variant="s8">{data.name}</Typography>
                                </Stack>
                                <Stack direction="row" spacing={1}>
                                    <Typography variant="s7">Type: </Typography>
                                    <Typography variant="s8">{data.type}</Typography>
                                </Stack>
                            </Stack>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <FlagsContainer Flags={data.flag} />
                        </Stack>
                    </Stack>
                ) : (
                    <Stack direction="row" spacing={1}>
                        <Typography variant="s7">NFTokenID: </Typography>
                        <Link
                            color="inherit"
                            target="_blank"
                            href={`https://bithomp.com/explorer/${data.NFTokenID}`}
                            rel="noreferrer noopener nofollow"
                        >
                            <Typography variant="s8">{data.NFTokenID}</Typography>
                        </Link>
                    </Stack>
                );
            case Activity.BURN_NFT:
                return (
                    <Stack direction="row" spacing={1}>
                        <Typography variant="s7">NFTokenID: </Typography>
                        <Link
                            color="inherit"
                            target="_blank"
                            href={`https://bithomp.com/explorer/${data.NFTokenID}`}
                            rel="noreferrer noopener nofollow"
                        >
                            <Typography variant="s8">{data.NFTokenID}</Typography>
                        </Link>
                    </Stack>
                );
            case Activity.SET_NFT_MINTER:
                return (
                    <Stack direction="row" spacing={1}>
                        <Typography variant="s7">Minter: </Typography>
                        <Typography variant="s8">{data.NFTokenMinter}</Typography>
                    </Stack>
                );
            case Activity.REFUND_BUYER:
                const amount = normalizeAmount(data.amount);
                return (
                    <Stack direction="row" spacing={1} justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={1}>
                            <Avatar alt="C" src={`https://s1.xrpl.to/token/${data.cost?.md5}`} />
                            <Stack>
                                <Stack direction="row" spacing={1}>
                                    <Typography variant="s7">Collection: </Typography>
                                    <Typography variant="s8">{data.cname}</Typography>
                                </Stack>
                                <Stack direction="row" spacing={0.8} alignItems="center">
                                    <Typography variant="s7">Cost x Quantity: </Typography>
                                    <Typography variant="s8">{data.cost?.amount}</Typography>
                                    <Typography variant="s8">{data.cost?.name}</Typography>
                                    <Typography variant="s8">x</Typography>
                                    <Typography variant="s8">{data.quantity}</Typography>
                                </Stack>
                                <Stack direction="row" spacing={1}>
                                    <Typography variant="s7">To: </Typography>
                                    <Typography variant="s8">{data.dest}</Typography>
                                </Stack>
                            </Stack>
                        </Stack>
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Stack direction="row" spacing={1}>
                                <Typography variant="s7">Amount: </Typography>
                                <Typography variant="s8">{amount.amount}</Typography>
                                <Typography variant="s8">{data.cost?.name}</Typography>
                            </Stack>
                        </Stack>
                    </Stack>
                );
            default:
                return (
                    <Stack direction="row" spacing={1}>
                        <Typography variant="s7">Unknown Activity</Typography>
                    </Stack>
                );
        }
    };

    const getActivityName = (activity) => {
        switch (activity) {
            case Activity.LOGIN:
                return 'Login';
            case Activity.LOGOUT:
                return 'Logout';
            case Activity.UPDATE_PROFILE:
                return 'Update Profile';
            case Activity.CREATE_COLLECTION:
                return 'Create a Collection';
            case Activity.IMPORT_COLLECTION:
                return 'Import a Collection';
            case Activity.UPDATE_COLLECTION:
                return 'Update Collection';
            case Activity.MINT_BULK:
                return 'Mint Bulk NFTs';
            case Activity.BUY_MINT:
                return 'Buy Mint';
            case Activity.BUY_RANDOM_NFT:
                return 'Buy Random NFT';
            case Activity.BUY_SEQUENCE_NFT:
                return 'Buy Sequence NFT';
            case Activity.BUY_BULK_NFT:
                return 'Buy Bulk NFT';
            case Activity.CREATE_SELL_OFFER:
                return 'Create Sell Offer';
            case Activity.CREATE_BUY_OFFER:
                return 'Create Buy Offer';
            case Activity.CANCEL_SELL_OFFER:
                return 'Cancel Sell Offer';
            case Activity.CANCEL_BUY_OFFER:
                return 'Cancel Buy Offer';
            case Activity.ACCEPT_BUY_OFFER:
                return 'Accept Buy Offer';
            case Activity.ACCEPT_SELL_OFFER:
                return 'Accept Sell Offer';
            case Activity.OWNER_ACCPETED_YOUR_BUY_OFFER:
                return 'NFT Owner accepted your Buy Offer';
            case Activity.BUYER_ACCEPTED_YOUR_SELL_OFFER:
                return 'Buyer accepted your Sell Offer';
            case Activity.YOU_RECEIVED_A_NFT:
                return 'You received a NFT';
            case Activity.MINT_NFT:
                return 'Minted a NFT';
            case Activity.BURN_NFT:
                return 'Burnt a NFT';
            case Activity.SET_NFT_MINTER:
                return 'Set NFT Minter';
            case Activity.REFUND_BUYER:
                return 'Refund Mint Amount to Buyer';
            case Activity.BROKER_ACCEPTED_YOUR_BUY_OFFER:
                return 'Broker accepted your Buy Offer';
            case Activity.BROKER_ACCEPTED_YOUR_SELL_OFFER:
                return 'Broker accepted your Sell Offer';
            default:
                return `Unknown Activity: ${activity}`;
        }
    };

    return (
        <Container maxWidth="lg" sx={{ pl: 0, pr: 0 }}>
            {loading ? (
                <Stack alignItems="center">
                    <PulseLoader color="#00AB55" size={10} />
                </Stack>
            ) : acts.length === 0 ? (
                <Stack alignItems="center" sx={{ mt: 5 }}>
                    <Typography variant="s7">No Items</Typography>
                </Stack>
            ) : (
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
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
                            {acts.map(({ account, activity, data, time }) => {
                                const strDateTime = formatDistanceToNow(new Date(time), { addSuffix: true });
                                return (
                                    <TableRow key={time}>
                                        <TableCell align="left">
                                            {renderActivityIcon(activity)}
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
                                                        {getActivityName(activity)}
                                                    </Typography>
                                                    <Typography variant="s7">
                                                        {strDateTime}
                                                    </Typography>
                                                </Stack>
                                                {renderActivityDetails(activity, data)}
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </Box>
            )}
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
