
import PropTypes from 'prop-types';
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react';


// Material
import {
    Box,
    Container,
    Divider,
    Grid,
    Link,
    Stack,
    Tab,
    Tabs,
    Typography
} from '@mui/material';

// Iconify icons
import { Icon } from '@iconify/react';
import twotoneGreaterThan from '@iconify/icons-ic/twotone-greater-than';

// Components
import ScrollToTop from 'src/layouts/ScrollToTop';
import {UserDesc, PriceDesc, ExtraDesc} from "./common"
import Overview from './overview';
import Market from './market';
import Trade from './trade';
import History from './history';
import RichList from './richlist';
import Wallet from './wallet';

// ---------------------------------------------------

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
            <Box sx={{ p: 3 }}>
                {children}
            </Box>
            )}
        </div>
    );
}
  
TabPanel.propTypes = {
    children: PropTypes.node,
    id: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
};

function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

const tabValues = ['', 'markets', 'trade', 'historical-data', 'trustlines', 'wallets'];
const tabLabels = ['Overview', 'Markets', 'Trade', 'Historical Data', 'Trustlines', 'Wallets'];

function getTabID(tab) {
    if (!tab) return 0;
    const idx = tabValues.indexOf(tab);
    if (idx < 0)
        return 0;
    return idx;
}

export default function TokenDetail({data}) {
    const router = useRouter();
    const { slug } = router.query;

    const token = data.token;

    const [tabID, setTabID] = useState(getTabID(data.tab));

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
            url = `/token/${token.urlSlug}/${tabValues[newID]}`;
        else
            url = `/token/${token.urlSlug}/`;
        window.history.pushState({}, null, url);
        setTabID(newID);
        gotoTabView(event);
    };

    return (
        <>
            <Container maxWidth="xl">
                <Stack direction='row' spacing={1} sx={{mt:2}} alignItems='center' color={'text.secondary'}>
                    <Link
                        underline="none"
                        color="inherit"
                        href={`/`}
                        rel="noreferrer noopener nofollow"
                    >
                        <Typography variant='link_cascade' color='primary'>Tokens</Typography>
                    </Link>
                    <Icon icon={twotoneGreaterThan} width='12' height='12' style={{marginTop:'3'}}/>
                    <Link
                        underline="none"
                        color="inherit"
                        href={`/token/${token.urlSlug}`}
                        rel="noreferrer noopener nofollow"
                    >
                        <Typography variant='link_cascade' color={tabID > 0?'primary':''}>{token.name}</Typography>
                    </Link>
                    {tabID > 0 && (
                        <>
                            <Icon icon={twotoneGreaterThan} width='12' height='12' style={{marginTop:'3'}}/>
                            <Typography variant='link_cascade'>{tabLabels[tabID]}</Typography>
                        </>
                    )}
                </Stack>
                <Grid container direction="row" justify="center" alignItems="stretch">
                    <Grid item xs={12} md={6} lg={5} sx={{ mt: 3 }}>
                        <UserDesc token={token} />
                    </Grid>
                    
                    <Grid item xs={12} md={6} lg={7} sx={{ mt: 3 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <PriceDesc token={token} />
                            </Grid>
                            <Grid item xs={12}>
                                <ExtraDesc token={token} />
                            </Grid>
                        </Grid>
                    </Grid>
                </Grid>

                <Divider orientation="horizontal" sx={{mt:2,mb:2}} variant="middle" flexItem />
                <div id="back-to-top-tab-anchor" />
                <Tabs value={tabID} onChange={handleChangeTab} aria-label="token-tabs">
                    <Tab value={0} label={tabLabels[0]} {...a11yProps(0)} />
                    <Tab value={1} label={tabLabels[1]} {...a11yProps(1)} />
                    <Tab value={2} label={tabLabels[2]} {...a11yProps(2)} />
                    <Tab value={3} label={tabLabels[3]} {...a11yProps(3)} />
                    <Tab value={4} label={tabLabels[4]} {...a11yProps(4)} />
                    <Tab value={5} label={tabLabels[5]} {...a11yProps(5)} />
                </Tabs>
                <TabPanel value={tabID} id={0}>
                    <Overview token={token} />
                </TabPanel>
                <TabPanel value={tabID} id={1}>
                    <Market token={token}/>
                </TabPanel>
                <TabPanel value={tabID} id={2}>
                    <Trade token={token} />
                </TabPanel>
                <TabPanel value={tabID} id={3}>
                    <History token={token} />
                </TabPanel>
                <TabPanel value={tabID} id={4}>
                    <RichList data={data}/>
                </TabPanel>
                <TabPanel value={tabID} id={5}>
                    <Wallet data={data}/>
                </TabPanel>
            </Container>
            
            <ScrollToTop />
        </>
    );
}

