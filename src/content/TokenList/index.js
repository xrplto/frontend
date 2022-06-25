import Head from 'next/head';
import SidebarLayout from 'src/layouts/SidebarLayout';
import PageHeader from 'src/content/Management/Transactions/PageHeader';
import PageTitleWrapper from 'src/components/PageTitleWrapper';

// Mui
import {
    Container,
    Grid
} from '@mui/material';

// Components
import TokenTable from './TokenTable';
import ScrollToTop from 'src/layouts/ScrollToTop';
import Summary from 'src/content/TokenList/tokens/Summary';

function TokenList({data}) {
    return (
        <>
            <Container maxWidth="xl">
                <Grid
                    container
                    direction="row"
                    justifyContent="left"
                    alignItems="stretch"
                    spacing={3}
                >
                    <Grid item xs={12} md={12} lg={8} >
                        <Summary />
                    </Grid>
                </Grid>
                <TokenTable data={data}/>
            </Container>
            <ScrollToTop />
            {/* <Footer /> */}
        </>
    );
}

TokenList.getLayout = (page) => (
    <SidebarLayout>{page}</SidebarLayout>
);

export default TokenList;
