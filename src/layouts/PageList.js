import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet-async';
import { forwardRef } from 'react';
// material
import { Box } from '@mui/material';

// ----------------------------------------------------------------------
// title="XRPL Token Prices, Charts, Market Volume And Activity"

const PageList = forwardRef(({ children, title = '', ...other }, ref) => (
    <Box ref={ref} {...other}>
        <Helmet>
            {/* <title>{title}</title> */}
            {/* <!-- HTML Meta Tags --> */}
            <title>XRPL Token Prices, Charts, Market Volume And Activity</title>
            <meta name="description" content="Top XRPL DEX tokens prices and charts, listed by 24h volume. Access to current and historic data for XRP ecosystem. All XRPL tokens automatically listed."/>

            {/* <!-- Facebook Meta Tags --> */}
            <meta property="og:url" content="https://xrpl.to/"/>
            <meta property="og:type" content="website"/>
            <meta property="og:title" content="XRPL Token Prices, Charts, Market Volume And Activity | XRPL.TO"/>
            <meta property="og:description" content="Top XRPL DEX tokens prices and charts, listed by 24h volume. Access to current and historic data for XRP ecosystem. All XRPL tokens automatically listed."/>
            <meta property="og:image" content="%PUBLIC_URL%/static/ogp.png"/>

            {/* <!-- Twitter Meta Tags --> */}
            <meta name="twitter:card" content="summary_large_image"/>
            <meta property="twitter:domain" content="xrpl.to"/>
            <meta property="twitter:url" content="https://xrpl.to/"/>
            <meta name="twitter:title" content="XRPL Token Prices, Charts, Market Volume And Activity | XRPL.TO"/>
            <meta name="twitter:description" content="Top XRPL DEX tokens prices and charts, listed by 24h volume. Access to current and historic data for XRP ecosystem. All XRPL tokens automatically listed."/>
            {/* <!-- <meta name="twitter:image" content="%PUBLIC_URL%/static/ogp.png"/> --> */}
            <meta name="twitter:image" content="http://xrpl.to/static/ogp.png"/>
            <meta name="twitter:image:src" content="http://xrpl.to/static/ogp.png"/>

            {/* <!-- Meta Tags Generated via https://www.opengraph.xyz --> */}
        </Helmet>
        {children}
    </Box>
));

PageList.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string
};

export default PageList;
