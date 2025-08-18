import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Button, 
  Typography, 
  Box, 
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Stack,
  Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import BugReportIcon from '@mui/icons-material/BugReport';
import RefreshIcon from '@mui/icons-material/Refresh';

const ErrorDebugger = () => {
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState([]);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  // Load errors from localStorage
  const loadErrors = () => {
    try {
      const storedErrors = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      setErrors(storedErrors);
    } catch (err) {
      console.error('Failed to load error logs:', err);
    }
  };

  useEffect(() => {
    loadErrors();
    
    // Add keyboard shortcut to open debugger (Ctrl/Cmd + Shift + D)
    const handleKeyPress = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setOpen(true);
        loadErrors();
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  // Show debug floating button only if there are errors
  // On mobile, auto-open dialog if there are recent errors (within last 30 seconds)
  useEffect(() => {
    setShowDebugInfo(errors.length > 0);
    
    // Auto-open on mobile for recent errors to replace generic Next.js message
    if (errors.length > 0) {
      const isMobile = /Mobi|Android/i.test(navigator.userAgent);
      const recentErrors = errors.filter(error => {
        if (!error.timestamp) return false;
        const errorTime = new Date(error.timestamp);
        const now = new Date();
        return (now - errorTime) < 30000; // Within last 30 seconds
      });
      
      if (isMobile && recentErrors.length > 0) {
        // Small delay to ensure error logging is complete
        setTimeout(() => {
          setOpen(true);
        }, 1000);
      }
    }
  }, [errors.length]);

  const clearErrors = () => {
    localStorage.removeItem('errorLogs');
    setErrors([]);
  };

  const copyToClipboard = async (text) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers or insecure contexts
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  const getDeviceInfo = () => {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screen: `${screen.width}x${screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      pixelRatio: window.devicePixelRatio,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      url: window.location.href,
      timestamp: new Date().toISOString()
    };
  };

  const generateReport = () => {
    const report = {
      deviceInfo: getDeviceInfo(),
      errors: errors,
      errorCount: errors.length
    };
    return JSON.stringify(report, null, 2);
  };

  const formatError = (error, index) => {
    const timeAgo = error.timestamp ? 
      new Date(Date.now() - new Date(error.timestamp).getTime()).toISOString().substr(11, 8) : 
      'Unknown';
    
    return (
      <Accordion key={index}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
            <Chip 
              size="small" 
              label={error.type || 'Error'} 
              color={error.type === 'unhandledrejection' ? 'warning' : 'error'}
            />
            <Typography variant="body2" sx={{ flex: 1 }}>
              {error.message || error.reason || 'Unknown Error'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {timeAgo} ago
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Stack spacing={2}>
            <Box>
              <Typography variant="subtitle2">Message:</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                {error.message || error.reason || 'N/A'}
              </Typography>
            </Box>
            
            {error.filename && (
              <Box>
                <Typography variant="subtitle2">File:</Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                  {error.filename}:{error.lineno}:{error.colno}
                </Typography>
              </Box>
            )}
            
            {(error.error || error.stack) && (
              <Box>
                <Typography variant="subtitle2">Stack Trace:</Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    fontFamily: 'monospace', 
                    fontSize: '0.7rem', 
                    whiteSpace: 'pre-wrap',
                    maxHeight: 200,
                    overflow: 'auto',
                    bgcolor: 'background.paper',
                    p: 1,
                    borderRadius: 1
                  }}
                >
                  {error.error || error.stack}
                </Typography>
              </Box>
            )}
            
            <Box>
              <Typography variant="subtitle2">User Agent:</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                {error.userAgent}
              </Typography>
            </Box>
            
            <Button 
              size="small" 
              onClick={() => copyToClipboard(JSON.stringify(error, null, 2))}
              variant="outlined"
            >
              Copy Error Details
            </Button>
          </Stack>
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <>
      {/* Floating Debug Button - Only show if there are errors */}
      {showDebugInfo && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 9999,
            bgcolor: 'error.main',
            borderRadius: '50%',
            width: 56,
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: 3,
            '&:hover': {
              bgcolor: 'error.dark',
            }
          }}
          onClick={() => {
            setOpen(true);
            loadErrors();
          }}
        >
          <BugReportIcon sx={{ color: 'white' }} />
          <Box
            sx={{
              position: 'absolute',
              top: -8,
              right: -8,
              bgcolor: 'warning.main',
              color: 'white',
              borderRadius: '50%',
              width: 24,
              height: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              fontWeight: 'bold'
            }}
          >
            {errors.length}
          </Box>
        </Box>
      )}

      {/* Debug Dialog */}
      <Dialog 
        open={open} 
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <BugReportIcon />
            Error Debugger ({errors.length} errors)
          </Box>
          <IconButton onClick={loadErrors}>
            <RefreshIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent>
          {errors.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography variant="h6" color="success.main">
                No Errors Found!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your app is running smoothly.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Recent Errors:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Tip: Press Ctrl/Cmd + Shift + D to open this debugger anytime
                </Typography>
                
                {/* Show latest error message prominently on mobile */}
                {/Mobi|Android/i.test(navigator.userAgent) && errors.length > 0 && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'error.light', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom color="error.dark">
                      Latest Error:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {errors[errors.length - 1].message || errors[errors.length - 1].reason || 'Unknown error occurred'}
                    </Typography>
                  </Box>
                )}
              </Box>
              
              {errors.slice().reverse().map((error, index) => formatError(error, index))}
            </Stack>
          )}
        </DialogContent>
        
        <DialogActions>
          <Button onClick={() => copyToClipboard(generateReport())}>
            Copy Full Report
          </Button>
          <Button onClick={clearErrors} color="warning">
            Clear All Errors
          </Button>
          <Button onClick={() => setOpen(false)} variant="contained">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ErrorDebugger;