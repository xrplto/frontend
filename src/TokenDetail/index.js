
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
    id: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
};

function a11yProps(index) {
    return {
        id: `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

const tabValues = ['overview', 'markets', 'trade', 'historical-data', 'trustlines'];

function getTabValue(tab) {
    if (!tab) return tabValues[0];
    if (tabValues.includes(tab)) return tab;
    return tabValues[0];
}

export default function TokenDetail({data}) {
    const router = useRouter();
    const { slug } = router.query;

    const token = data.token;

    const [tabValue, setTabValue] = useState(getTabValue(data.tab));

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
        window.history.pushState({}, null, `/token/${token.urlSlug}/${newValue}`);
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
                    <Tab value={tabValues[0]} label="Overview" {...a11yProps(0)} />
                    <Tab value={tabValues[1]} label="Markets" {...a11yProps(1)} />
                    <Tab value={tabValues[2]} label="Trade" {...a11yProps(2)} />
                    <Tab value={tabValues[3]} label="Historical Data" {...a11yProps(3)} />
                    <Tab value={tabValues[4]} label="Trustlines" {...a11yProps(4)} />
                </Tabs>
                <TabPanel value={tabValue} id={tabValues[0]}>
                    <Overview token={token} />
                </TabPanel>
                <TabPanel value={tabValue} id={tabValues[1]}>
                    <Market token={token}/>
                </TabPanel>
                <TabPanel value={tabValue} id={tabValues[2]}>
                    <Trade token={token} />
                </TabPanel>
                <TabPanel value={tabValue} id={tabValues[3]}>
                    <History token={token} />
                </TabPanel>
                <TabPanel value={tabValue} id={tabValues[4]}>
                    <RichList data={data}/>
                </TabPanel>
            </Container>
            
            <ScrollToTop />
        </>
    );
}

