
import PropTypes from 'prop-types';
import { useRouter } from 'next/router'
import { useState, useEffect } from 'react';


// Material
import { styled } from '@mui/material/styles';
import {
    Box,
    Container,
    Divider,
    Grid,
    Link,
    Tab,
    Tabs,
    Typography
} from '@mui/material';

// Components
import ScrollToTop from 'src/layouts/ScrollToTop';
import {UserDesc, PriceDesc, ExtraDesc} from "./common"

import Overview from './overview';
import Market from './market';
import Trade from './trade';
import History from './history';
import RichList from './richlist';

// ---------------------------------------------------

function TabPanel(props) {
    const { children, value, index, ...other } = props;
 
    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
            <Box sx={{ p: 3 }}>
                {children}
            </Box>
            )}
        </div>
    );
}
  
TabPanel.propTypes = {
    children: PropTypes.node,
    index: PropTypes.number.isRequired,
    value: PropTypes.number.isRequired,
};

function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

function getTabId(tab) {
    if (tab === 'markets')
        return 1;
    else if (tab === 'trade')
        return 2;
    else if (tab === 'historical-data')
        return 3;
    else if (tab === 'trustlines')
        return 4;
    return 0;
}

export default function TokenDetail({data}) {
    const router = useRouter();
    const { slug } = router.query;

    const token = data.token;

    const [tabValue, setTabValue] = useState(getTabId(data.tab));

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

    const handleChangeTab = (event, newValue) => {
        setTabValue(newValue);
        gotoTabView(event);
    };

    return (
        <>
            <Container maxWidth="xl">
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
                <Tabs value={tabValue} onChange={handleChangeTab} aria-label="token-tabs">
                    <Link
                        underline="none"
                        color="inherit"
                        href={`/token/${token.urlSlug}/overview`}
                        rel="noreferrer noopener nofollow"
                    >
                        <Tab label="Overview" {...a11yProps(0)} />
                    </Link>
                    <Tab label="Markets" {...a11yProps(1)} />
                    <Tab label="Trade" {...a11yProps(2)} />
                    <Tab label="Historical Data" {...a11yProps(3)} />
                    <Tab label="Trustlines" {...a11yProps(4)} />
                </Tabs>
                <TabPanel value={tabValue} index={0}>
                    <Overview token={token} />
                </TabPanel>
                <TabPanel value={tabValue} index={1}>
                    <Market token={token}/>
                </TabPanel>
                <TabPanel value={tabValue} index={2}>
                    <Trade token={token} />
                </TabPanel>
                <TabPanel value={tabValue} index={3}>
                    <History token={token} />
                </TabPanel>
                <TabPanel value={tabValue} index={4}>
                    <RichList data={data}/>
                </TabPanel>
            </Container>
            
            <ScrollToTop />
        </>
    );
}

