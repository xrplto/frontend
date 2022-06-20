import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet-async';
import { forwardRef } from 'react';
// material
import { Box } from '@mui/material';

// ----------------------------------------------------------------------
// title="XRPL Token Prices, Charts, Market Volume And Activity"

const PageDetail = forwardRef(({ children, title, url, image, desc, ...other }, ref) => (
    <Box ref={ref} {...other}>
        <Helmet>
            {/* <!-- HTML Meta Tags --> */}
            <title>{title}</title>
            <meta name="description" content={desc}/>

            {/* <!-- Facebook Meta Tags --> */}
            <meta property="og:url" content={url}/>
            <meta property="og:type" content="website"/>
            <meta property="og:title" content={title}/>
            <meta property="og:description" content={desc}/>
            <meta property="og:image" content={image}/>

            {/* <!-- Twitter Meta Tags --> */}
            <meta name="twitter:card" content="summary_large_image"/>
            <meta property="twitter:domain" content="xrpl.to"/>
            <meta property="twitter:url" content={url}/>
            <meta name="twitter:title" content={title}/>
            <meta name="twitter:description" content={desc}/>
            {/* <!-- <meta name="twitter:image" content={image}/> --> */}
            <meta name="twitter:image" content={`http://xrpl.to${image}`}/>
            <meta name="twitter:image:src" content={`http://xrpl.to${image}`}/>

            {/* <!-- Meta Tags Generated via https://www.opengraph.xyz --> */}
        </Helmet>
        {children}
    </Box>
));

PageDetail.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string,
  token: PropTypes.object
};

export default PageDetail;
