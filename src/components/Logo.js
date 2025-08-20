import { useContext, useState, useMemo } from 'react';
import { Box, useTheme } from '@mui/material';
import Image from 'next/image';

import { AppContext } from 'src/AppContext';

function Logo({ style }) {
  const { darkMode } = useContext(AppContext);
  const theme = useTheme();
  const [imageError, setImageError] = useState(false);

  // Memoize logo paths with cache buster for long-term caching
  const { img_black, img_white } = useMemo(() => ({
    img_black: '/logo/xrpl-to-logo-black.svg?v=1',
    img_white: '/logo/xrpl-to-logo-white.svg?v=1'
  }), []);
  
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
    width: '100px',
    height: '37px',
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
            width: '100px',
            height: '37px',
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
          width={100}
          height={37}
          alt="XRPL.to Logo"
          priority={true}
          quality={100}
          unoptimized={false}
          onError={handleImageError}
          style={{
            objectFit: 'contain',
            width: '100%',
            height: 'auto'
          }}
        />
      )}
    </Box>
  );
}

export default Logo;
