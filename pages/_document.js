import React from 'react';
import Document, { Html, Head, Main, NextScript } from 'next/document';
import createEmotionServer from '@emotion/server/create-instance';
import createEmotionCache from 'src/theme/createEmotionCache';
export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <meta charSet="utf-8" />

          {/* Critical font sizes to prevent FOUC - must match globals.css @theme */}
          <style dangerouslySetInnerHTML={{ __html: `html{font-size:14px;line-height:1.5}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}` }} />

          {/* Preload LCP logo — inline script picks the right variant based on saved theme */}
          <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('appThemeName');if(!t){var d=localStorage.getItem('appTheme');t=d==='true'?'XrplToDarkTheme':'XrplToLightTheme'}var h=t==='XrplToDarkTheme'?'/logo/xrpl-to-logo-white.svg':'/logo/xrpl-to-logo-black.svg';var l=document.createElement('link');l.rel='preload';l.as='image';l.type='image/svg+xml';l.href=h;l.fetchPriority='high';document.head.appendChild(l)}catch(e){}})();` }} />

          {/* Preconnect to external domains */}
          <link rel="preconnect" href="https://api.xrpl.to" />
          <link rel="preconnect" href="https://s1.xrpl.to" />
        </Head>
        <body>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('appThemeName');if(!t){var d=localStorage.getItem('appTheme');t=d==='true'?'XrplToDarkTheme':'XrplToLightTheme'}if(t==='XrplToDarkTheme'){document.documentElement.classList.add('dark');document.body.style.backgroundColor='#000000';document.body.style.color='#F5F5F5'}else{document.body.style.backgroundColor='#F8FAFD';document.body.style.color='#0F172A'}}catch(e){}})();`
            }}
          />
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

MyDocument.getInitialProps = async (ctx) => {
  const originalRenderPage = ctx.renderPage;

  const cache = createEmotionCache();
  const { extractCriticalToChunks } = createEmotionServer(cache);

  ctx.renderPage = () =>
    originalRenderPage({
      enhanceApp: (App) => (props) => <App emotionCache={cache} {...props} />
    });

  const initialProps = await Document.getInitialProps(ctx);
  const emotionChunks = extractCriticalToChunks(initialProps.html);
  const emotionStyleTags = emotionChunks.styles.map((style) => (
    <style
      data-emotion={`${style.key} ${style.ids.join(' ')}`}
      key={style.key}
      dangerouslySetInnerHTML={{ __html: style.css }}
    />
  ));

  return {
    ...initialProps,
    styles: [...React.Children.toArray(initialProps.styles), ...emotionStyleTags]
  };
};
