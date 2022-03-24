import { useContext } from 'react'
import PropTypes from 'prop-types';
// material
import { Box } from '@mui/material';
// Context
import Context from '../Context'
//import {styled, alpha, useTheme } from '@mui/material/styles';

// ----------------------------------------------------------------------

Logo.propTypes = {
    sx: PropTypes.object
};

export default function Logo({ sx }) {
    const { isDarkMode } = useContext(Context);
    const img_black = "/xrpl.to/XRPL_Logo2_Colored_(Black).png";
    const img_white = "/xrpl.to/XRPL_Logo2_Colored_(White).png";
    const img = isDarkMode?img_white:img_black;

  return <Box component="img" src={img} sx={{ height: 46, ...sx }} />;
}

// export default function Logo({ sx }) {
//   return (
//     <Fragment>
//       <Box component="img" src="/static/logo.svg" sx={{ width: 50, height: 50, ...sx }} />
//       <Box component="img" src="/xrpl/xrp-text-mark-black.svg" sx={{ height: 50, ...sx }} />
//     </Fragment>
//   );
// }
