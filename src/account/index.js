import React from 'react';
import axios from 'axios';
import { useState, useEffect } from 'react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

// Material
import {
    alpha, styled,
    Avatar,
    Badge,
    Box,
    Divider,
    IconButton,
    Link,
    Menu,
    MenuItem,
    Stack,
    Tab,
    Tabs,
    Tooltip,
    Typography
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import ListIcon from '@mui/icons-material/List';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import NearbyErrorIcon from '@mui/icons-material/NearbyError';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Utils
import { getHashIcon } from 'src/utils/extra';

// Components
import SeeMoreTypography from 'src/components/SeeMoreTypography';
import TradeList from './TradeList';
import OfferList from './OfferList';
import TrustList from './TrustList';
import ActivityList from './ActivityList';

const IconImage = styled('img')(
    ({ theme }) => `
    position: absolute;
    inset: 0px;
    box-sizing: border-box;
    padding: 0px;
    border: none;
    margin: auto;
    display: block;
    width: 0px; height: 0px;
    min-width: 100%;
    max-width: 100%;
    min-height: 100%;
    max-height: 100%;
    object-fit: cover;
    border-radius: 0px;
  `
);

const ImageBackdrop = styled('span')(({ theme }) => ({
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: theme.palette.common.black,
    opacity: 0,
    transition: theme.transitions.create('opacity'),
}));

const CardOverlay = styled('div')(
    ({ theme }) => `
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    position: absolute;
    inset: 0;
`
);

function TabPanel(props) {
    const { children, value, id, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== id}
            id={`simple-tabpanel-${id}`}
            aria-labelledby={`simple-tab-${id}`}
            {...other}
        >
            {value === id && (
                <Box sx={{
                    // p: { xs: 0, md: 3 },
                    // pt: { xs: 3 },
                }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

const tabValues = ['', 'trustlines', 'activity'];
const tabLabels = ['Offers', 'TrustLines', 'Activity'];

function getTabID(tab) {
    if (!tab) return 0;

    const idx = tabValues.indexOf(tab);
    if (idx < 0)
        return 0;
    return idx;
}

export default function Account({ profile, setProfile, tab }) {
    const BASE_URL = process.env.API_URL;
    const { accountProfile, openSnackbar, sync } = useContext(AppContext);
    const accountLogin = accountProfile?.account;
    // const accountToken = accountProfile?.token;
    // const accountUuid = accountProfile?.xuuid;

    const [tabID, setTabID] = useState(getTabID(tab));
    const [isFirstLoad, setFirstLoad] = useState(true);

    const {
        account,
        name,
        logo,
        banner,
        description,
        minterWallet
    } = profile;

    const logoImage = logo ? `https://s1.xrpl.to/profile/${logo}` : getHashIcon(account);

    useEffect(() => {
        if (!isFirstLoad && accountProfile && accountProfile.account) {
            setProfile(accountProfile);
            const url = `/account/${accountProfile.account}/${tabValues[tabID]}`;
            window.history.pushState({}, null, url);
        }
        setFirstLoad(false);
    }, [accountProfile]);

    const gotoTabView = (event) => {
        const anchor = (event.target.ownerDocument || document).querySelector(
            '#back-to-top-tab-anchor',
        );

        if (anchor) {
            anchor.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
    };

    const handleChangeTab = (event, newID) => {
        let url = '';
        if (newID > 0)
            url = `/account/${account}/${tabValues[newID]}`;
        else
            url = `/account/${account}/`;
        window.history.pushState({}, null, url);
        setTabID(newID);
        gotoTabView(event);
    };

    return (
        <>
            <Box
                sx={{
                    display: 'flex',
                    gap: 3,
                    alignItems: 'center',
                    my: 2,
                    mt: { md: -5, xs: -4 },
                    // zIndex: 10000,
                }}
            >
                <Avatar
                    variant={logo?"":"square"}
                    sx={{
                        width: { md: 90, xs: 50 },
                        height: { md: 90, xs: 50 },
                        backgroundColor: '#00000000'
                    }}
                >
                    <IconImage src={logoImage} />
                    {accountLogin === account &&
                        <Link href={`/setting`} underline='none'>
                            <CardOverlay>
                                <EditIcon
                                    className="MuiIconEditButton-root"
                                    // color='primary'
                                    fontSize="large"
                                    sx={{ opacity: 0, zIndex: 1 }}
                                />
                            </CardOverlay>
                            <ImageBackdrop className="MuiImageBackdrop-root" />
                        </Link>
                    }
                </Avatar>
                <Box position={'relative'}>
                    <Typography variant='h3'>{name || account?.toString().slice(0, 5)}</Typography>
                    <Box display='flex' alignItems={'center'}>
                        <Typography style={{ wordWrap: "break-word" }} variant="d3">
                            {account.slice(0, 4) + '...' + account.slice(-4)}
                        </Typography>
                        <CopyToClipboard text={account} onCopy={() => { openSnackbar("Copied!", "success") }}>
                            <Tooltip title='Click to copy'>
                                <IconButton>
                                    <ContentCopyIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        </CopyToClipboard>
                        <Link
                            color="inherit"
                            target="_blank"
                            href={`https://bithomp.com/explorer/${account}`}
                            rel="noreferrer noopener nofollow"
                        >
                            <IconButton>
                                <OpenInNewIcon />
                            </IconButton>
                        </Link>
                    </Box>
                </Box>
            </Box>

            <SeeMoreTypography
                variant="d3"
                text={description}
            />

            <Box
                sx={{
                    mt: 2,
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
                <Tabs
                    value={tabID}
                    onChange={handleChangeTab}
                    // variant="scrollable"
                    // scrollButtons='auto'
                    aria-label="token-tabs"
                    sx={{"& .MuiTabs-scroller": {overflow: "visible !important"}}}
                >
                    <Tab value={0} label={tabLabels[0]} {...a11yProps(0)} />
                    <Tab value={1} label={tabLabels[1]} {...a11yProps(1)} />
                    <Tab value={2} label={tabLabels[2]} {...a11yProps(2)} />
                </Tabs>
            </Box>
            <Box sx={{ my: 1 }}>
                {/* <TabPanel value={tabID} id={0}>
                    <Stack sx={{ minHeight: '20vh' }}>
                        <TradeList account={account} />
                    </Stack>
                </TabPanel> */}
                <TabPanel value={tabID} id={0}>
                    <Stack sx={{ minHeight: '20vh' }}>
                        <OfferList account={account} />
                    </Stack>
                </TabPanel>
                <TabPanel value={tabID} id={1}>
                    <Stack sx={{ minHeight: '20vh' }}>
                        <TrustList account={account} />
                    </Stack>
                </TabPanel>
                <TabPanel value={tabID} id={2}>
                    <Stack sx={{ minHeight: '20vh' }}>
                        <ActivityList account={account} />
                    </Stack>
                </TabPanel>
            </Box>
        </>
    );
}
