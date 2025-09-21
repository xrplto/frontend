import React from 'react';
import { Button, CircularProgress } from '@mui/material';

const LoadingButton = ({
  loading = false,
  loadingPosition = 'center',
  children,
  disabled,
  startIcon,
  endIcon,
  ...props
}) => {
  const isDisabled = disabled || loading;

  const getStartIcon = () => {
    if (loading && loadingPosition === 'start') {
      return <CircularProgress size={20} color="inherit" />;
    }
    return startIcon;
  };

  const getEndIcon = () => {
    if (loading && loadingPosition === 'end') {
      return <CircularProgress size={20} color="inherit" />;
    }
    return endIcon;
  };

  const getChildren = () => {
    if (loading && loadingPosition === 'center' && !startIcon && !endIcon) {
      return <CircularProgress size={20} color="inherit" />;
    }
    return children;
  };

  return (
    <Button {...props} disabled={isDisabled} startIcon={getStartIcon()} endIcon={getEndIcon()}>
      {getChildren()}
    </Button>
  );
};

export default LoadingButton;
