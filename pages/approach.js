import React from 'react';
import { Box, Container, Grid, Toolbar, Typography } from '@mui/material';
import Topbar from 'src/components/Topbar';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';

function ApproachPage() {
  return (
    <Box>
      <Toolbar id="back-to-top-anchor" />
      <Topbar />
      <Header />

      <Container maxWidth="xl">
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h1" sx={{ my: 4 }}>Approach</Typography>

            <Box sx={{ mb: 4 }}>
              <Typography variant="body1">
                xrpl.to aims to offer precise, timely, and impartial information regarding XRPL tokens. Our principle is to provide an abundance of data rather than censoring or controlling information, allowing our users to form their own judgments. We actively consider feedback and requests from our users to enhance the accuracy and reliability of the data presented on our website. All XRPL tokens are automatically listed by us without needing to wait.
              </Typography>
            </Box>

            <Box sx={{ mb: 4 }}>
              <Typography variant="h3" sx={{ mb: 2 }}>Resources:</Typography>
              <Typography variant="body1">
                - Criteria for Changing Information: [Link to Listings Criteria](insert_link_here)
              </Typography>
              <Typography variant="body1">
                - Approach (Market Data and Tokens Rank): [Link to Approach](insert_link_here)
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Container>

      <Footer />
    </Box>
  );
}

export default ApproachPage;
