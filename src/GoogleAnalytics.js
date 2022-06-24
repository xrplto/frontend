import Script from 'next/script'

function GoogleAnalytics() {
  return (
    <div className="container">
      {/* <!-- Global site tag (gtag.js) - Google Analytics --> */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments)}
            gtag('js', new Date());
            // gtag('config', 'G-PHYSGW6VJ9');
            gtag('config', 'G-PHYSGW6VJ9', { 'send_page_view': false });
        `}
      </Script>
    </div>
  )
}

export default GoogleAnalytics