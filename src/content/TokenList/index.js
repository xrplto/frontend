import Head from 'next/head';
import SidebarLayout from 'src/layouts/SidebarLayout';
import PageHeader from 'src/content/Management/Transactions/PageHeader';
import PageTitleWrapper from 'src/components/PageTitleWrapper';
import { Grid, Container } from '@mui/material';
import Footer from 'src/components/Footer';

import RecentOrders from 'src/content/Management/Transactions/RecentOrders';

import Tokens from './TokenList';

function TokenList() {
  return (
    <>
      <Head>
        <title>XRPL Token Prices, Charts, Market Volume And Activity</title>
      </Head>
      <Container maxWidth="xl">
        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="stretch"
          spacing={3}
        >
          <Grid item xs={12}>
            <Tokens />
          </Grid>
        </Grid>
      </Container>
      {/* <Footer /> */}
    </>
  );
}

TokenList.getLayout = (page) => (
  <SidebarLayout>{page}</SidebarLayout>
);

export default TokenList;
