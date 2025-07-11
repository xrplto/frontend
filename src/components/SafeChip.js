import React from 'react';
import { Chip } from '@mui/material';

// Safe wrapper for MUI Chip that handles undefined colors gracefully
const SafeChip = ({ color, sx, ...props }) => {
  // List of valid MUI Chip colors
  const validColors = ['default', 'primary', 'secondary', 'error', 'info', 'success', 'warning'];
  
  // Ensure color is valid, fallback to 'default' if not
  const safeColor = validColors.includes(color) ? color : 'default';
  
  // Handle sx prop to ensure backgroundColor is always defined
  const safeSx = sx ? {
    ...sx,
    backgroundColor: sx.backgroundColor || undefined
  } : undefined;
  
  return <Chip color={safeColor} sx={safeSx} {...props} />;
};

export default SafeChip;