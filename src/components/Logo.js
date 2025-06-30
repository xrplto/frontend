import { useContext, useState } from 'react';
import { Box } from '@mui/material';
import Image from 'next/image';

import { AppContext } from 'src/AppContext';

function Logo({ style }) {
  const { darkMode } = useContext(AppContext);
  const [imageError, setImageError] = useState(false);

  const img_black = '/logo/xrpl-to-logo-black.svg';
  const img_white = '/logo/xrpl-to-logo-white.svg';
  const img = darkMode ? img_white : img_black;

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
    <a href="/" style={logoStyle}>
      {imageError ? (
        <Box
          sx={{
            width: '125px',
            height: '46px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: darkMode ? 'white' : 'black'
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
          priority
          onError={handleImageError}
          style={{
            objectFit: 'contain'
          }}
        />
      )}
    </a>
  );
}

export default Logo;
