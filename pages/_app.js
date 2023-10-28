import Head from 'next/head';
import ThemeProvider from 'src/theme/ThemeProvider';
import CssBaseline from '@mui/material/CssBaseline';
import { ContextProvider } from 'src/AppContext';
import XSnackbar from 'src/components/Snackbar';
import { useSnackbar } from 'src/components/useSnackbar';
import "./zMain.css";

function XRPLToApp({ Component, pageProps, router }) {
  const isUnderMaintenance = process.env.MAINTENANCE; // Set this variable to enable or disable maintenance mode

  // Check if we're under maintenance and not already on the maintenance page
  if (isUnderMaintenance && router.pathname !== '/status/maintenance') {
    if (typeof window !== 'undefined') {
      router.push('/status/maintenance');
    }
    return null;
  }

  const { isOpen, msg, variant, openSnackbar, closeSnackbar } = useSnackbar();
  const ogp = pageProps.ogp || {};
  const data = pageProps.data

    return (
        <>
            <Head>
                {/* <!-- HTML Meta Tags --> */}
                <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
                <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no"/>
                <meta name="robots" content="index, follow" />
                <meta name="language" content="en" />
                <meta content="xrpl.to" name="author" />
                <meta name="copyright" content="xrpl.to" />
                <meta name="coverage" content="Worldwide" />
                <meta name="distribution" content="Global" />
                <meta name="rating" content="General" />
                {/* <!-- May result lower load time fetching from server directly! --> */}
                <meta httpEquiv="Expires" content="0" />
                <meta httpEquiv="Pragma" content="no-cache" />
                <meta httpEquiv="Cache-Control" content="no-cache" />
                <meta name="google-site-verification" content="hh6F1f8GQ-_d3L7eGAcBc9G020PM2jSDzIjT12_I-Mc" />

                <link rel="apple-touch-icon" sizes="192x192" href="/icons/apple-icon.webp" />
                <link rel="icon" type="image/webp" sizes="16x16" href="/favicon-16x16.webp" />
                <link rel="icon" type="image/webp" sizes="32x32" href="/favicon-32x32.webp" />
                <link rel="icon" type="image/webp" sizes="32x32" href="/favicon-96x96.webp" />

                <link rel="manifest" href="/site.webmanifest" />
                {/* <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#121619" /> */}
                <meta name="msapplication-TileColor" content="#121619" />
                <meta name="theme-color" content="#ffffff"/>
                <link rel="shortcut icon" href="/favicon.ico" type="image/x-icon" />
                <link rel="canonical" href={ogp.canonical}/>
				{/*<link rel="alternate" hrefLang="ar" href="https://xrpl.to/ar/" />
				<link rel="alternate" hrefLang="bg" href="https://xrpl.to/bg/" />
				<link rel="alternate" hrefLang="cs" href="https://xrpl.to/cs/" />
				<link rel="alternate" hrefLang="da" href="https://xrpl.to/da/" />
				<link rel="alternate" hrefLang="de" href="https://xrpl.to/de/" />
				<link rel="alternate" hrefLang="el" href="https://xrpl.to/el/" />
				<link rel="alternate" hrefLang="en" href="https://xrpl.to/" />
				<link rel="alternate" hrefLang="es" href="https://xrpl.to/es/" />
				<link rel="alternate" hrefLang="fi" href="https://xrpl.to/fi/" />
				<link rel="alternate" hrefLang="fr" href="https://xrpl.to/fr/" />
				<link rel="alternate" hrefLang="hi" href="https://xrpl.to/hi/" />
				<link rel="alternate" hrefLang="hu" href="https://xrpl.to/hu/" />
				<link rel="alternate" hrefLang="id" href="https://xrpl.to/id/" />
				<link rel="alternate" hrefLang="it" href="https://xrpl.to/it/" />
				<link rel="alternate" hrefLang="ja" href="https://xrpl.to/ja/" />
				<link rel="alternate" hrefLang="ko" href="https://xrpl.to/ko/" />
				<link rel="alternate" hrefLang="nl" href="https://xrpl.to/nl/" />
				<link rel="alternate" hrefLang="no" href="https://xrpl.to/no/" />
				<link rel="alternate" hrefLang="pl" href="https://xrpl.to/pl/" />
				<link rel="alternate" hrefLang="pt-br" href="https://xrpl.to/pt-br/" />
				<link rel="alternate" hrefLang="ro" href="https://xrpl.to/ro/" />
				<link rel="alternate" hrefLang="ru" href="https://xrpl.to/ru/" />
				<link rel="alternate" hrefLang="sk" href="https://xrpl.to/sk/" />
				<link rel="alternate" hrefLang="sv" href="https://xrpl.to/sv/" />
				<link rel="alternate" hrefLang="th" href="https://xrpl.to/th/" />
				<link rel="alternate" hrefLang="tr" href="https://xrpl.to/tr/" />
				<link rel="alternate" hrefLang="uk" href="https://xrpl.to/uk/" />
				<link rel="alternate" hrefLang="ur" href="https://xrpl.to/ur/" />
				<link rel="alternate" hrefLang="vi" href="https://xrpl.to/vi/" />*/}

                <title>{ogp.title}</title>
                <meta name="description" content={ogp.desc}/>
                <meta property="og:site_name" content="xrpl.to" />
                {/* <!-- Facebook Meta Tags --> */}
                <meta property="og:url" content={ogp.url}/>
                <meta property="og:type" content="website"/>
                <meta property="og:title" content={`${ogp.title} | xrpl.to`}/>
                <meta property="og:description" content={ogp.desc}/>
                <meta property="og:image" content={ogp.imgUrl}/>
                <meta property="og:image:type" content="image/png" />
                <meta property="og:image:width" content="600" />
                <meta property="og:image:height" content="315" />
                {/* <!-- Twitter Meta Tags --> */}
                <meta name="twitter:card" content="summary_large_image"/>
                <meta property="twitter:domain" content="xrpl.to"/>
                <meta property="twitter:url" content={ogp.url}/>
                <meta name="twitter:title" content={`${ogp.title} | xrpl.to`}/>
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
