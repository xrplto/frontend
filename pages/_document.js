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
          <meta httpEquiv="X-UA-Compatible" content="IE=edge" />

          {/* Critical font sizes to prevent FOUC - must match globals.css @theme */}
          <style dangerouslySetInnerHTML={{ __html: `html{font-size:14px;line-height:1.5}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}` }} />

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
