import { useContext } from 'react';
import { AppContext } from 'src/contexts/AppContext';
import {
  Typography,
  Box,
  Card,
  Container,
  Button,
  IconButton,
  styled,
  Stack
} from '@mui/material';
import BaseLayout from 'src/layouts/BaseLayout';

import Link from 'src/components/Link';
import Head from 'next/head';

import Logo from 'src/components/LogoSign';
import Account from 'src/components/Account';
import Hero from 'src/content/Overview/Hero';

import { Icon } from '@iconify/react'; 
import baselineBrightnessHigh from '@iconify/icons-ic/baseline-brightness-high';
import baselineBrightness4 from '@iconify/icons-ic/baseline-brightness-4';

const HeaderWrapper = styled(Card)(
  ({ theme }) => `
  width: 100%;
  display: flex;
  align-items: center;
  height: ${theme.spacing(10)};
  margin-bottom: ${theme.spacing(10)};
  border-radius: 0px;
`
);

const OverviewWrapper = styled(Box)(
  ({ theme }) => `
    overflow: auto;
    background: ${theme.palette.common.white};
    flex: 1;
    overflow-x: hidden;
`
);

function Overview() {
  const { toggleTheme, darkMode } = useContext(AppContext);
  return (
    <OverviewWrapper>
      <Head>
        <title>XRPL Token Prices, Charts, Market Volume And Activity</title>
      </Head>
      <HeaderWrapper>
        <Container maxWidth="xl">
          <Box display="flex" alignItems="center" sx={{pl:2, pr:2}}>
            <Logo />
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              flex={1}
            >
              <Box />
              <Box>
                <Stack direction="row" alignItems="center" spacing={{ xs: 0.5, sm: 1.5 }}>
                  <Account />
                  <IconButton onClick={() => { toggleTheme() }} >
                      {darkMode ? (
                          <Icon icon={baselineBrightnessHigh} />
                      ) : (
                          <Icon icon={baselineBrightness4} />
                      )}
                  </IconButton>
                </Stack>
              </Box>
            </Box>
          </Box>
        </Container>
      </HeaderWrapper>
      <Hero />
      <Container maxWidth="xl" sx={{ mt: 8 }}>
        <Typography textAlign="center" variant="subtitle1">
          Crafted by{' '}
          <Link
            href="https://xrpl.to"
            target="_blank"
            rel="noopener noreferrer"
          >
            XRPL.TO
          </Link>
        </Typography>
      </Container>
    </OverviewWrapper>
  );
}

export default Overview;

Overview.getLayout = function getLayout(page) {
  return <BaseLayout>{page}</BaseLayout>;
};
