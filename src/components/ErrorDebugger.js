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
import TwitterIcon from '@mui/icons-material/Twitter';
import EmailIcon from '@mui/icons-material/Email';

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

  const generateErrorSummary = () => {
    if (errors.length === 0) return 'No errors found';
    
    const latestError = errors[errors.length - 1];
    const errorMsg = latestError.message || latestError.reason || 'Unknown error';
    const deviceInfo = `${getDeviceInfo().platform} ${getDeviceInfo().userAgent.split(' ')[0]}`;
    
    return `Error on xrpl.to: ${errorMsg.substring(0, 100)}${errorMsg.length > 100 ? '...' : ''} (${deviceInfo})`;
  };

  const reportToTwitter = () => {
    const summary = generateErrorSummary();
    const tweetText = `@xrplto Hey we found an error: ${summary}`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, '_blank');
  };

  const reportToEmail = () => {
    const summary = generateErrorSummary();
    const fullReport = generateReport();
    const subject = 'Error Report from xrpl.to';
    const body = `Hi XRPL.to team,

We found an error on your site:

${summary}

Full Error Report:
${fullReport}

Please let us know if you need any additional information.

Thanks!`;
    
    const mailtoUrl = `mailto:hello@xrpl.to?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
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
                  {typeof error.error === 'object' ? JSON.stringify(error.error, null, 2) : (error.error || error.stack)}
                </Typography>
              </Box>
            )}
            
            <Box>
              <Typography variant="subtitle2">User Agent:</Typography>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
                {error.userAgent}
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Button 
                size="small" 
                onClick={() => copyToClipboard(JSON.stringify(error, null, 2))}
                variant="outlined"
              >
                Copy Details
              </Button>
              <Button 
                size="small"
                startIcon={<TwitterIcon />}
                onClick={() => {
                  const errorMsg = error.message || error.reason || 'Unknown error';
                  const tweetText = `@xrplto Hey we found an error: ${errorMsg.substring(0, 100)}${errorMsg.length > 100 ? '...' : ''}`;
                  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
                  window.open(twitterUrl, '_blank');
                }}
                variant="outlined"
                sx={{ color: '#1DA1F2', borderColor: '#1DA1F2' }}
              >
                Tweet
              </Button>
              <Button 
                size="small"
                startIcon={<EmailIcon />}
                onClick={() => {
                  const errorMsg = error.message || error.reason || 'Unknown error';
                  const subject = 'Error Report from xrpl.to';
                  const body = `Hi XRPL.to team,

We found this error on your site:

Error: ${errorMsg}
File: ${error.filename || 'Unknown'}:${error.lineno || 0}:${error.colno || 0}
User Agent: ${error.userAgent || navigator.userAgent}
Timestamp: ${error.timestamp || new Date().toISOString()}

Stack Trace:
${error.error || error.stack || 'No stack trace available'}

Thanks!`;
                  
                  const mailtoUrl = `mailto:hello@xrpl.to?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                  window.location.href = mailtoUrl;
                }}
                variant="outlined"
              >
                Email
              </Button>
            </Stack>
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
          <Stack direction="row" spacing={1} sx={{ width: '100%', justifyContent: 'space-between' }}>
            <Stack direction="row" spacing={1}>
              {errors.length > 0 && (
                <>
                  <Button 
                    startIcon={<TwitterIcon />}
                    onClick={reportToTwitter}
                    size="small"
                    variant="outlined"
                    sx={{ color: '#1DA1F2', borderColor: '#1DA1F2' }}
                  >
                    Tweet Error
                  </Button>
                  <Button 
                    startIcon={<EmailIcon />}
                    onClick={reportToEmail}
                    size="small"
                    variant="outlined"
                  >
                    Email Error
                  </Button>
                </>
              )}
              <Button onClick={() => copyToClipboard(generateReport())} size="small">
                Copy Report
              </Button>
            </Stack>
            
            <Stack direction="row" spacing={1}>
              <Button onClick={clearErrors} color="warning" size="small">
                Clear All
              </Button>
              <Button onClick={() => setOpen(false)} variant="contained" size="small">
                Close
              </Button>
            </Stack>
          </Stack>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ErrorDebugger;