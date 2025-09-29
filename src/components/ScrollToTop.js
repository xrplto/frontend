import Box from '@mui/material/Box';
import Zoom from '@mui/material/Zoom';
import useScrollTrigger from '@mui/material/useScrollTrigger';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';

ScrollToTop.propTypes = {
  window: PropTypes.func
};

export default function ScrollToTop(props) {
  const { window } = props;
  const theme = useTheme();
  const [scrollProgress, setScrollProgress] = useState(0);

  const trigger = useScrollTrigger({
    target: window ? window() : undefined,
    disableHysteresis: true,
    threshold: 100
  });

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      setScrollProgress(scrolled);
    };

    if (typeof globalThis.window !== 'undefined') {
      globalThis.window.addEventListener('scroll', handleScroll);
      return () => globalThis.window.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const handleClick = (event) => {
    const anchor = (event.target.ownerDocument || document).querySelector('#back-to-top-anchor');

    if (anchor) {
      anchor.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    } else {
      globalThis.window?.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  return (
    <Zoom in={trigger}>
      <Box
        onClick={handleClick}
        role="presentation"
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1200,
          width: 42,
          height: 42,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.palette.mode === 'dark'
            ? alpha('#ffffff', 0.08)
            : alpha('#000000', 0.04),
          border: `1.5px solid ${
            theme.palette.mode === 'dark'
              ? alpha('#ffffff', 0.1)
              : alpha('#000000', 0.06)
          }`,
          borderRadius: '12px',
          cursor: 'pointer',
          fontSize: '1rem',
          fontWeight: 400,
          color: theme.palette.mode === 'dark'
            ? alpha('#ffffff', 0.6)
            : alpha('#000000', 0.5),
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          overflow: 'hidden',
          '&:hover': {
            backgroundColor: alpha('#4285f4', 0.08),
            borderColor: alpha('#4285f4', 0.2),
            color: '#4285f4'
          },
          '&::before': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: `${scrollProgress}%`,
            backgroundColor: alpha('#4285f4', 0.1),
            pointerEvents: 'none'
          }
        }}
      >
        ↑
      </Box>
    </Zoom>
  );
}
