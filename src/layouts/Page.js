import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet-async';
import { forwardRef } from 'react';
// Material
import { Box } from '@mui/material';

// ----------------------------------------------------------------------
// title="XRPL Token Prices, Charts, Market Volume And Activity"

const PageList = forwardRef(({ children, title = '', ...other }, ref) => (
    <Box ref={ref} {...other}>
        <Helmet>
            <title>{title}</title>
        </Helmet>
        {children}
    </Box>
));

PageList.propTypes = {
  children: PropTypes.node.isRequired,
  title: PropTypes.string
};

export default PageList;
