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
import { ContextProvider } from 'src/AppContext';
import AdapterDateFns from '@mui/lab/AdapterDateFns';
import LocalizationProvider from '@mui/lab/LocalizationProvider';

const clientSideEmotionCache = createEmotionCache();

function XRPLToApp(props) {
    const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;

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

    const ogp = pageProps.ogp||{};
    const data = pageProps.data;

    return (
        <CacheProvider value={emotionCache}>
            <Head>
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, shrink-to-fit=no"
                />
                <meta name="google-site-verification" content="hh6F1f8GQ-_d3L7eGAcBc9G020PM2jSDzIjT12_I-Mc" />

                <meta name="robots" content="nofollow"/>

                {/* <!-- HTML Meta Tags --> */}
                <title>{ogp.title}</title>
                <meta name="description" content={ogp.desc}/>

                {/* <!-- Facebook Meta Tags --> */}
                <meta property="og:url" content={ogp.url}/>
                <meta property="og:type" content="website"/>
                <meta property="og:title" content={ogp.ogTitle}/>
                <meta property="og:description" content={ogp.desc}/>
                <meta property="og:image" content={ogp.imgUrl}/>
                {/* <!-- Twitter Meta Tags --> */}
                <meta name="twitter:card" content="summary_large_image"/>
                <meta property="twitter:domain" content="xrpl.to"/>
                <meta property="twitter:url" content={ogp.url}/>
                <meta name="twitter:title" content={ogp.title}/>
                <meta name="twitter:description" content={ogp.desc}/>
                {/* <!-- <meta name="twitter:image" content="/static/ogp.png"/> --> */}
                <meta name="twitter:image" content={ogp.imgUrlTwitter}/>
                <meta name="twitter:image:src" content={ogp.imgUrlTwitter}/>
                {/* <!-- Meta Tags Generated via https://www.opengraph.xyz --> */}
            </Head>
            <ContextProvider data={data}>
                <ThemeProvider>
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                        <CssBaseline />
                        <Component {...pageProps} />
                    </LocalizationProvider>
                </ThemeProvider>
            </ContextProvider>
        </CacheProvider>
    );
}

export default XRPLToApp;
