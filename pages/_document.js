import React from 'react';
import Document, { Html, Head, Main, NextScript } from 'next/document';
export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en" suppressHydrationWarning>
        <Head>
          <meta charSet="utf-8" />

          {/* Critical font sizes to prevent FOUC - must match globals.css @theme */}
          <style dangerouslySetInnerHTML={{ __html: `html{font-size:14px;line-height:1.5}body{font-family:var(--font-inter),-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}` }} />

          {/* Theme detection + LCP logo preload + body styling — single script to avoid duplicated logic */}
          <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('appThemeName');if(!t){var d=localStorage.getItem('appTheme');t=d==='false'?'XrplToLightTheme':'XrplToDarkTheme'}var dk=t==='XrplToDarkTheme';var l=document.createElement('link');l.rel='preload';l.as='image';l.type='image/svg+xml';l.href=dk?'/logo/xrpl-to-logo-white.svg':'/logo/xrpl-to-logo-black.svg';l.fetchPriority='high';document.head.appendChild(l);window.__XRPL_THEME__=t}catch(e){}})();` }} />

        </Head>
        <body suppressHydrationWarning>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=window.__XRPL_THEME__||'XrplToDarkTheme';if(t==='XrplToDarkTheme'){document.documentElement.classList.add('dark');document.body.style.backgroundColor='#000000';document.body.style.color='#F5F5F5'}else{document.documentElement.classList.add('light');document.body.style.backgroundColor='#F8FAFD';document.body.style.color='#0F172A'}}catch(e){}})();`
            }}
          />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

