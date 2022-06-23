import Head from 'next/head';
import Router from 'next/router';
import nProgress from 'nprogress';
import 'nprogress/nprogress.css';
import ThemeProvider from 'src/theme/ThemeProvider';
import CssBaseline from '@mui/material/CssBaseline';
import { CacheProvider } from '@emotion/react';
import createEmotionCache from 'src/createEmotionCache';
import { ContextProvider } from 'src/contexts/AppContext';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import LocalizationProvider from '@mui/lab/LocalizationProvider';

const clientSideEmotionCache = createEmotionCache();

function XRPLToApp(props) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  const getLayout = Component.getLayout ?? ((page) => page);

  Router.events.on('routeChangeStart', nProgress.start);
  Router.events.on('routeChangeError', nProgress.done);
  Router.events.on('routeChangeComplete', nProgress.done);

  return (
    <CacheProvider value={emotionCache}>
      <Head>
        <title>XRPL Token Prices, Charts, Market Volume And Activity</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, shrink-to-fit=no"
        />
      </Head>
      <ContextProvider>
        <ThemeProvider>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <CssBaseline />
            {getLayout(<Component {...pageProps} />)}
          </LocalizationProvider>
        </ThemeProvider>
      </ContextProvider>
    </CacheProvider>
  );
}

export default XRPLToApp;
