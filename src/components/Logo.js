//import { Fragment } from "react";
import PropTypes from 'prop-types';
// material
import { Box } from '@mui/material';

// ----------------------------------------------------------------------

Logo.propTypes = {
  sx: PropTypes.object
};

export default function Logo({ sx }) {
  return <Box component="img" src="/xrpl.to/XRPL_Logo2_Colored_(Black).png" sx={{ height: 46, ...sx }} />;
}

// export default function Logo({ sx }) {
//   return (
//     <Fragment>
//       <Box component="img" src="/static/logo.svg" sx={{ width: 50, height: 50, ...sx }} />
//       <Box component="img" src="/xrpl/xrp-text-mark-black.svg" sx={{ height: 50, ...sx }} />
//     </Fragment>
//   );
// }
