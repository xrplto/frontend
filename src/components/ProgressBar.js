import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { styled } from '@mui/material/styles';

const ProgressBarContainer = styled('div')(({ theme, show }) => ({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: '3px',
  zIndex: 9999,
  opacity: show ? 1 : 0,
  transition: 'opacity 0.2s ease-in-out',
}));

const ProgressBarFill = styled('div')(({ theme, progress }) => ({
  height: '100%',
  backgroundColor: theme.palette.primary.main,
  width: `${progress}%`,
  transition: 'width 0.3s ease-out',
  boxShadow: `0 0 10px ${theme.palette.primary.main}`,
}));

const ProgressBar = () => {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [show, setShow] = useState(false);

  useEffect(() => {
    let timer;

    const handleStart = () => {
      setShow(true);
      setProgress(10);
    };

    const handleComplete = () => {
      setProgress(100);
      timer = setTimeout(() => {
        setShow(false);
        setProgress(0);
      }, 200);
    };

    const handleError = () => {
      setProgress(100);
      timer = setTimeout(() => {
        setShow(false);
        setProgress(0);
      }, 200);
    };

    router.events.on('routeChangeStart', handleStart);
    router.events.on('routeChangeComplete', handleComplete);
    router.events.on('routeChangeError', handleError);

    return () => {
      if (timer) clearTimeout(timer);
      router.events.off('routeChangeStart', handleStart);
      router.events.off('routeChangeComplete', handleComplete);
      router.events.off('routeChangeError', handleError);
    };
  }, [router.events]);

  // Simulate progress while loading
  useEffect(() => {
    let interval;
    if (show && progress > 0 && progress < 90) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) return prev;
          return prev + Math.random() * 10;
        });
      }, 500);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [show, progress]);

  return (
    <ProgressBarContainer show={show}>
      <ProgressBarFill progress={progress} />
    </ProgressBarContainer>
  );
};

export default ProgressBar;