import { m as motion } from "framer-motion";
import { Box, Button, TextField } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import React from 'react';

const mobileFooterHeight = 73;

export const MODAL_SWIPE_TO_CLOSE_VELOCITY = 300;

// Simple motion box component
export const MotionBox = ({ children, ...props }) => {
  const MotionDiv = motion.div;
  return <MotionDiv {...props}>{children}</MotionDiv>;
};

// Modal Container - simple component with sx prop
export const ModalContainer = ({ children, $minHeight, ...props }) => {
  return (
    <MotionBox
      {...props}
      sx={{
        overflow: 'hidden',
        background: (theme) => theme.palette.background.paper,
        boxShadow: '0px 20px 36px -8px rgba(14, 14, 44, 0.1), 0px 1px 1px rgba(0, 0, 0, 0.05)',
        border: (theme) => `1px solid ${theme.palette.divider}`,
        borderRadius: { xs: '12px 12px 0px 0px', md: '12px' },
        width: { xs: '100%', md: 'auto' },
        maxHeight: { xs: 'calc(var(--vh, 1vh) * 100)', md: '100vh' },
        zIndex: (theme) => theme.zIndex.modal,
        position: { xs: 'absolute', md: 'static' },
        bottom: { xs: 0, md: 'auto' },
        maxWidth: 'none !important',
        minHeight: $minHeight,
        ...props.sx,
      }}
    >
      {children}
    </MotionBox>
  );
};

// Modal Header - simple Box component
export const ModalHeader = ({ children, headerBorderColor, background, ...props }) => {
  return (
    <Box
      {...props}
      sx={{
        display: 'flex',
        alignItems: 'center',
        background: 'transparent',
        borderBottom: (theme) => `1px solid ${headerBorderColor || theme.palette.divider}`,
        padding: '12px 24px',
        [theme => theme.breakpoints.up('md')]: {
          background: background || 'transparent',
        },
        ...props.sx,
      }}
    >
      {children}
    </Box>
  );
};

// Modal Title - simple Box component
export const ModalTitle = ({ children, ...props }) => {
  return (
    <Box
      {...props}
      sx={{
        display: 'flex',
        alignItems: 'center',
        flex: 1,
        ...props.sx,
      }}
    >
      {children}
    </Box>
  );
};

// Modal Body - simple Box component
export const ModalBody = ({ children, ...props }) => {
  return (
    <Box
      {...props}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        overflowY: 'auto',
        overflowX: 'hidden',
        maxHeight: `calc(90vh - ${mobileFooterHeight}px)`,
        [theme => theme.breakpoints.up('md')]: {
          display: 'flex',
          maxHeight: '90vh',
        },
        ...props.sx,
      }}
    >
      {children}
    </Box>
  );
};

// Close Button - simple Button component
export const ModalCloseButton = ({ onDismiss, ...props }) => {
  return (
    <Button
      {...props}
      variant="text"
      onClick={(e) => {
        e.stopPropagation();
        onDismiss?.();
      }}
      aria-label="Close the dialog"
      sx={{
        padding: '2px',
        minWidth: 'auto',
        width: '48px',
        height: '48px',
        borderRadius: '16px',
        backgroundColor: 'transparent',
        '&:hover': {
          backgroundColor: (theme) => theme.palette.action.hover,
        },
        ...props.sx,
      }}
    >
      <CloseIcon color="primary" />
    </Button>
  );
};

// Back Button - simple Button component
export const ModalBackButton = ({ onBack, ...props }) => {
  return (
    <Button
      {...props}
      variant="text"
      onClick={onBack}
      aria-label="go back"
      sx={{
        padding: '2px',
        minWidth: 'auto',
        width: '48px',
        height: '48px',
        borderRadius: '16px',
        backgroundColor: 'transparent',
        mr: 1,
        '&:hover': {
          backgroundColor: (theme) => theme.palette.action.hover,
        },
        ...props.sx,
      }}
    >
      {/* Add back icon here if needed */}
    </Button>
  );
};

// Heading - simple Box component
export const Heading = ({ children, textTransform, ellipsis, small, ...props }) => {
  return (
    <Box
      {...props}
      component="span"
      sx={{
        color: (theme) => theme.palette.text.primary,
        fontWeight: 600,
        lineHeight: 1.5,
        fontSize: small ? '14px' : '20px',
        textTransform: textTransform || 'none',
        ...(ellipsis && {
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }),
        ...props.sx,
      }}
    >
      {children}
    </Box>
  );
};

// Input - simple input element with sx-like styling
export const Input = ({ isWarning, isSuccess, ...props }) => {
  const getFocusBoxShadow = () => {
    if (isWarning) {
      return "0px 1px 4px rgba(255, 163, 25, 0.25), 0px 3px 12px 2px rgba(255, 163, 25, 0.35)";
    }
    if (isSuccess) {
      return "0px 1px 4px rgba(68, 214, 0, 0.25), 0px 3px 12px 2px rgba(68, 214, 0, 0.35)";
    }
    return "0px 1px 4px rgba(20, 125, 254, 0.25), 0px 3px 12px 2px rgba(20, 125, 254, 0.35)";
  };

  return (
    <TextField
      {...props}
      variant="outlined"
      fullWidth
      sx={{
        '& .MuiOutlinedInput-root': {
          borderRadius: '16px',
          height: '48px',
          backgroundColor: (theme) => theme.palette.background.paper,
          '& fieldset': {
            borderColor: (theme) => theme.palette.divider,
          },
          '&:hover fieldset': {
            borderColor: (theme) => theme.palette.divider,
          },
          '&.Mui-focused fieldset': {
            boxShadow: getFocusBoxShadow(),
          },
          '&.Mui-disabled': {
            backgroundColor: (theme) => theme.palette.action.disabledBackground,
            color: (theme) => theme.palette.text.disabled,
          },
        },
        '& .MuiOutlinedInput-input': {
          padding: '0 16px',
          fontSize: '16px',
          '&::placeholder': {
            color: (theme) => theme.palette.text.secondary,
          },
        },
        ...props.sx,
      }}
    />
  );
};

// Export a simple Box component as well for flexibility
export const Flex = ({ children, ...props }) => {
  return (
    <Box
      {...props}
      sx={{
        display: 'flex',
        ...props.sx,
      }}
    >
      {children}
    </Box>
  );
};