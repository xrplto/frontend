import Head from 'next/head';
import ThemeProvider from 'src/theme/ThemeProvider';
import CssBaseline from '@mui/material/CssBaseline';

import { ContextProvider } from 'src/AppContext';

import XSnackbar from 'src/components/Snackbar';
import { useSnackbar } from 'src/components/useSnackbar';

import "./zMain.css";

function XRPLToApp(props) {
    const { isOpen, msg, variant, openSnackbar, closeSnackbar } = useSnackbar();

    const { Component, pageProps } = props;

    const ogp = pageProps.ogp || {};
    const data = pageProps.data;

    return (
        <>
            <Head>
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, shrink-to-fit=no"
                />
                <meta name="google-site-verification" content="hh6F1f8GQ-_d3L7eGAcBc9G020PM2jSDzIjT12_I-Mc" />

                <link rel="apple-touch-icon" sizes="192x192" href="/icons/apple-icon.webp" />
                <link rel="icon" type="image/webp" sizes="16x16" href="/favicon-16x16.webp" />
                <link rel="icon" type="image/webp" sizes="32x32" href="/favicon-32x32.webp" />
                <link rel="icon" type="image/webp" sizes="32x32" href="/favicon-96x96.webp" />

                <link rel="manifest" href="/site.webmanifest" />
                {/* <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#121619" /> */}
                <meta name="msapplication-TileColor" content="#121619" />
                <meta name="theme-color" content="#ffffff"/>

                {/* <meta name="robots" content="nofollow"/> */}

                <link rel="canonical" href={ogp.canonical}/>

                {/* <!-- HTML Meta Tags --> */}
                <title>{ogp.title}</title>
                <meta name="description" content={ogp.desc}/>

                {/* <!-- Facebook Meta Tags --> */}
                <meta property="og:url" content={ogp.url}/>
                <meta property="og:type" content="website"/>
                <meta property="og:title" content={`${ogp.title} | XRPL.to`}/>
                <meta property="og:description" content={ogp.desc}/>
                <meta property="og:image" content={ogp.imgUrl}/>
                {/* <!-- Twitter Meta Tags --> */}
                <meta name="twitter:card" content="summary_large_image"/>
                <meta property="twitter:domain" content="xrpl.to"/>
                <meta property="twitter:url" content={ogp.url}/>
                <meta name="twitter:title" content={`${ogp.title} | XRPL.to`}/>
                <meta name="twitter:description" content={ogp.desc}/>
                {/* <!-- <meta name="twitter:image" content="/static/ogp.webp"/> --> */}
                <meta name="twitter:image" content={ogp.imgUrl}/>
                <meta name="twitter:image:src" content={ogp.imgUrl}/>
                {/* <!-- Meta Tags Generated via https://www.opengraph.xyz --> */}
            </Head>
            <noscript>{/* <!-- webxtor SEO fix --> */}
            <ContextProvider data={data} openSnackbar={openSnackbar}>
                {/* <!-- <ThemeProvider> --> */}
                    {/* <!-- <CssBaseline /> --> */}
                    <Component {...pageProps} />
                    <XSnackbar isOpen={isOpen} message={msg} variant={variant} close={closeSnackbar} />
                {/* <!-- </ThemeProvider> --> */}
            </ContextProvider>
            </noscript>
            <ContextProvider data={data} openSnackbar={openSnackbar}>
                <ThemeProvider>
                    <CssBaseline />
                    <Component {...pageProps} />
                    <XSnackbar isOpen={isOpen} message={msg} variant={variant} close={closeSnackbar} />
                </ThemeProvider>
            </ContextProvider>
        </>
    );
}

export default XRPLToApp;
