import * as React from 'react';
import Document, { Html, Head, Main, NextScript } from 'next/document';
import Script from 'next/script';

export default class MyDocument extends Document {
    render() {
        return (
            <Html lang="en" dir="ltr">
                <Head />
                <body>
                    <Main />
                    <NextScript />
                    <Script
                        src="https://www.googletagmanager.com/gtag/js?id=G-3V4R50SVNH"
                        strategy="afterInteractive"
                    />
                    <Script id="google-analytics" strategy="afterInteractive">
                        {`
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('js', new Date());
                            gtag('config', 'G-3V4R50SVNH');
                        `}
                    </Script>
                </body>
            </Html>
        );
    }
}
