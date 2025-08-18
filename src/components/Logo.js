import { useContext, useState } from 'react';
import { Box, useTheme } from '@mui/material';
import Image from 'next/image';

import { AppContext } from 'src/AppContext';

function Logo({ style }) {
  const { darkMode } = useContext(AppContext);
  const theme = useTheme();
  const [imageError, setImageError] = useState(false);

  const img_black = '/logo/xrpl-to-logo-black.svg';
  const img_white = '/logo/xrpl-to-logo-white.svg';
  // Use theme.palette.mode as primary check, fallback to darkMode
  const isDark = theme.palette.mode === 'dark' || darkMode;
  const img = isDark ? img_white : img_black;

  const logoStyle = {
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 3,
    display: 'inline-flex',
    transition: 'opacity 0.3s',
    cursor: 'pointer',
    position: 'relative',
    width: '125px',
    height: '46px',
    ...style
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Box style={logoStyle} onClick={() => window.location.href = '/'}>
      {imageError ? (
        <Box
          sx={{
            width: '125px',
            height: '46px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: isDark ? 'white' : 'black'
          }}
        >
          XRPL.to
        </Box>
      ) : (
        <Image
          src={img}
          width={125}
          height={46}
          alt="XRPL.to Logo"
          priority={true}
          onError={handleImageError}
          style={{
            objectFit: 'contain'
          }}
        />
      )}
    </Box>
  );
}

export default Logo;
