import { useContext, useState } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { Box, Skeleton } from '@mui/material';
import NextLink from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import React from 'react';
import Link from 'next/link';

import { AppContext } from 'src/AppContext';

function Logo({ style }) {
  const { darkMode } = useContext(AppContext);
  const router = useRouter();
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

  const handleClick = (e) => {
    if (router.pathname === '/') {
      e.preventDefault();
      return;
    }
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <Link href="/" passHref legacyBehavior>
      <a>
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
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain'
            }}
            onError={handleImageError}
          />
        )}
      </a>
    </Link>
  );
}

export default Logo;
