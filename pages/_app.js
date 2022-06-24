import { useRouter } from 'next/router';
import { useEffect } from "react";

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

import GoogleAnalytics from 'src/GoogleAnalytics';

const clientSideEmotionCache = createEmotionCache();

function XRPLToApp(props) {
    const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
    const getLayout = Component.getLayout ?? ((page) => page);

    Router.events.on('routeChangeStart', nProgress.start);
    Router.events.on('routeChangeError', nProgress.done);
    Router.events.on('routeChangeComplete', nProgress.done);

    const router = useRouter();

    const handleRouteChange = (url) => {
        window.gtag('config', 'G-PHYSGW6VJ9', {page_path: url});
    };
  
    useEffect(() => {
        router.events.on('routeChangeComplete', handleRouteChange);
        return () => {
            router.events.off('routeChangeComplete', handleRouteChange);
        };
    }, [router.events]);

    return (
        <CacheProvider value={emotionCache}>
            <Head>
                <title>XRPL Token Prices, Charts, Market Volume And Activity</title>
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, shrink-to-fit=no"
                />
                <meta name="description" content="Top XRPL DEX tokens prices and charts, listed by 24h volume. Access to current and historic data for XRP ecosystem. All XRPL tokens automatically listed."/>
                {/* <!-- Facebook Meta Tags --> */}
                <meta property="og:url" content="https://xrpl.to/"/>
                <meta property="og:type" content="website"/>
                <meta property="og:title" content="XRPL Token Prices, Charts, Market Volume And Activity | XRPL.TO"/>
                <meta property="og:description" content="Top XRPL DEX tokens prices and charts, listed by 24h volume. Access to current and historic data for XRP ecosystem. All XRPL tokens automatically listed."/>
                <meta property="og:image" content="/static/ogp.png"/>
                {/* <!-- Twitter Meta Tags --> */}
                <meta name="twitter:card" content="summary_large_image"/>
                <meta property="twitter:domain" content="xrpl.to"/>
                <meta property="twitter:url" content="https://xrpl.to/"/>
                <meta name="twitter:title" content="XRPL Token Prices, Charts, Market Volume And Activity | XRPL.TO"/>
                <meta name="twitter:description" content="Top XRPL DEX tokens prices and charts, listed by 24h volume. Access to current and historic data for XRP ecosystem. All XRPL tokens automatically listed."/>
                {/* <!-- <meta name="twitter:image" content="/static/ogp.png"/> --> */}
                <meta name="twitter:image" content="http://xrpl.to/static/ogp.png"/>
                <meta name="twitter:image:src" content="http://xrpl.to/static/ogp.png"/>
                {/* <!-- Meta Tags Generated via https://www.opengraph.xyz --> */}

                <meta name="google-site-verification" content="hh6F1f8GQ-_d3L7eGAcBc9G020PM2jSDzIjT12_I-Mc" />

                {/* <!-- Global site tag (gtag.js) - Google Analytics --> */}
                {/* <script async src="https://www.googletagmanager.com/gtag/js?id=G-PHYSGW6VJ9"/>
                <script>
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){window.dataLayer.push(arguments)}
                    gtag('js', new Date());
                    gtag('config', 'G-PHYSGW6VJ9');
                </script> */}
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
