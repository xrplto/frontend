import * as React from 'react';
import Document, { Html, Head, Main, NextScript } from 'next/document';

export default class MyDocument extends Document {
    // Added a method to insert Google Tag Manager script for cleaner code
    setGoogleTags() {
        return {
            __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'G-PHYSGW6VJ9', { page_path: window.location.pathname });
            `,
        };
    }

    render() {
        return (
            <Html lang="en" dir="ltr">
                <Head>
                    {/* Using preconnect to improve loading performance for Google Fonts */}
                    <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                    <link
                        rel="stylesheet"
                        href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap"
                    />

                    {/* Async loading of Google Tag Manager */}
                    <script async src="https://www.googletagmanager.com/gtag/js?id=G-PHYSGW6VJ9"/>

                    {/* Using method to set Google Tag Manager script */}
                    <script dangerouslySetInnerHTML={this.setGoogleTags()} />
                </Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}
