import { useContext } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { Box } from '@mui/material';
import NextLink from 'next/link';
import { useRouter } from 'next/router';

import { AppContext } from 'src/AppContext';

function Logo({ style }) {
  const { darkMode } = useContext(AppContext);
  const router = useRouter();

  const img_black = '/logo/xrpl-to-logo-black.svg';
  const img_white = '/logo/xrpl-to-logo-white.svg';
  const img = darkMode ? img_white : img_black;

  const logoStyle = {
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 3,
    display: 'inline-flex',
    transition: 'opacity 0.3s', // Add a transition for smooth theme change
    cursor: 'pointer',
    ...style
  };

  const handleClick = (e) => {
    if (router.pathname === '/') {
      e.preventDefault();
      return;
    }
  };

  return (
    <NextLink href="/" style={logoStyle} onClick={handleClick} passHref>
      <LazyLoadImage src={img} width={125} height={46} alt="Logo" />
    </NextLink>
  );
}

export default Logo;
