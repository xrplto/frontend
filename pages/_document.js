import * as React from 'react';
import Document, { Html, Head, Main, NextScript } from 'next/document';

export default class MyDocument extends Document {
    render() {
        return (
            <Html lang="en" dir="ltr">
                <Head>
                    <link rel="preconnect" href="https://fonts.googleapis.com" />
                    <link rel="preconnect" href="https://fonts.gstatic.com" />
                    <link
                        rel="stylesheet"
                        href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap"
                    />

                    <script async src="https://www.googletagmanager.com/gtag/js?id=G-PHYSGW6VJ9"/>

                    <script
                        dangerouslySetInnerHTML={{
                            __html: `
                            window.dataLayer = window.dataLayer || [];
                            function gtag(){dataLayer.push(arguments);}
                            gtag('js', new Date());
                            gtag('config', 'G-PHYSGW6VJ9', { page_path: window.location.pathname });
                            // gtag('config', 'G-PHYSGW6VJ9');
                            // gtag('config', 'G-PHYSGW6VJ9', { 'send_page_view': false });
                            `,
                        }}
                    />
                </Head>
                <body>
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}
