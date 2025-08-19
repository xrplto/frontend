
import { Box, styled, Grid, Toolbar, Container, CircularProgress } from "@mui/material";
import Topbar from 'src/components/Topbar';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';
import dynamic from 'next/dynamic';
import { isValidClassicAddress } from 'ripple-address-codec';
import useWebSocket from 'react-use-websocket';
import { useDispatch } from 'react-redux';
import { update_metrics } from 'src/redux/statusSlice';

const Portfolio = dynamic(() => import("src/portfolio"), {
  loading: () => (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
      <CircularProgress />
    </Box>
  ),
});

const OverviewWrapper = styled(Box)(
  ({ theme }) => `
    overflow: hidden;
    flex: 1;
`
);

const OverView = ({ account, limit, collection, type, tab }) => {
    const dispatch = useDispatch();
    
    // Add WebSocket connection for real-time updates
    const WSS_FEED_URL = 'wss://api.xrpl.to/ws/sync';
    useWebSocket(WSS_FEED_URL, {
        shouldReconnect: () => true,
        onMessage: (event) => {
            try {
                const json = JSON.parse(event.data);
                dispatch(update_metrics(json));
            } catch (err) {
                console.error('Error processing WebSocket message:', err);
            }
        }
    });

    return (
        <OverviewWrapper>
            <Toolbar id="back-to-top-anchor" />
            <Topbar />
            <Header />
            
            <Container maxWidth="xl">
                <Grid
                    container
                    direction="row"
                    justifyContent="center"
                    alignItems="stretch"
                    spacing={3}
                >
                    <Grid item xs={12}>
                        <Portfolio 
                            account={account} 
                            limit={limit} 
                            collection={collection} 
                            type={type}
                            tab={tab}
                        />
                    </Grid>
                </Grid>
            </Container>

            <ScrollToTop />
            <Footer />
        </OverviewWrapper>
    )
}

export default OverView;

export async function getServerSideProps(ctx) {
    try {
        const params = ctx.params.acct;
        const account = params[0];
        const tab = params[1] || 'overview';

        // Validate XRP address
        const isValid = isValidClassicAddress(account);
        if (!isValid) {
            return {
                redirect: {
                    destination: "/404",
                    permanent: false
                }
            }
        }

        // Build data object
        let data = {
            account,
            tab,
            limit: 32
        };

        // Handle collection-specific tabs
        if (tab?.includes('collection')) {
            data.collection = params[2];
            data.type = tab.replace('collection', '').toLowerCase();
        }

        // Add OGP metadata for better SEO and social sharing
        const ogp = {
            canonical: `https://xrpl.to/profile/${account}`,
            title: `Profile - ${account.substring(0, 8)}...${account.substring(account.length - 6)}`,
            url: `https://xrpl.to/profile/${account}`,
            imgUrl: 'https://xrpl.to/static/ogp.png',
            desc: `View portfolio, NFT collections, and trading activity for XRP Ledger account ${account.substring(0, 12)}...`
        };

        return {
            props: {
                ...data,
                ogp
            }
        }

    } catch (err) {
        console.error('Error in profile getServerSideProps:', err);
        return {
            redirect: {
                destination: "/404",
                permanent: false
            }
        }
    }
}