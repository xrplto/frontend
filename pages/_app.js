import Head from 'next/head';
import ThemeProvider from 'src/theme/ThemeProvider';
import CssBaseline from '@mui/material/CssBaseline';
import { ContextProvider } from 'src/AppContext';

function XRPLToApp(props) {
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

                {/* <meta name="robots" content="nofollow"/> */}

                <link rel="canonical" href={ogp.canonical}/>

                {/* <!-- HTML Meta Tags --> */}
                <title>{ogp.title}</title>
                <meta name="description" content={ogp.desc}/>

                {/* <!-- Facebook Meta Tags --> */}
                <meta property="og:url" content={ogp.url}/>
                <meta property="og:type" content="website"/>
                <meta property="og:title" content={`${ogp.title} | XRPL.TO`}/>
                <meta property="og:description" content={ogp.desc}/>
                <meta property="og:image" content={ogp.imgUrl}/>
                {/* <!-- Twitter Meta Tags --> */}
                <meta name="twitter:card" content="summary_large_image"/>
                <meta property="twitter:domain" content="xrpl.to"/>
                <meta property="twitter:url" content={ogp.url}/>
                <meta name="twitter:title" content={`${ogp.title} | XRPL.TO`}/>
                <meta name="twitter:description" content={ogp.desc}/>
                {/* <!-- <meta name="twitter:image" content="/static/ogp.png"/> --> */}
                <meta name="twitter:image" content={ogp.imgUrl}/>
                <meta name="twitter:image:src" content={ogp.imgUrl}/>
                {/* <!-- Meta Tags Generated via https://www.opengraph.xyz --> */}
            </Head>
            <ContextProvider data={data}>
                <ThemeProvider>
                    <CssBaseline />
                    <Component {...pageProps} />
                </ThemeProvider>
            </ContextProvider>
        </>
    );
}

export default XRPLToApp;
