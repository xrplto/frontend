import React, { useEffect } from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useRouter } from 'next/router';

function Error({ statusCode, hasGetInitialPropsRun, err }) {
  const router = useRouter();

  useEffect(() => {
    // Log Next.js errors to localStorage for ErrorDebugger
    if (err || statusCode) {
      const errorInfo = {
        type: 'nextjs-error',
        statusCode,
        message: err?.message || `An error ${statusCode} occurred on ${typeof window !== 'undefined' ? 'client' : 'server'}`,
        stack: err?.stack,
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : '',
        timestamp: new Date().toISOString()
      };

      if (typeof window !== 'undefined') {
        try {
          const errors = JSON.parse(localStorage.getItem('errorLogs') || '[]');
          errors.push(errorInfo);
          if (errors.length > 50) errors.shift();
          localStorage.setItem('errorLogs', JSON.stringify(errors));
        } catch (e) {
          console.error('Failed to log error:', e);
        }
      }
    }
  }, [statusCode, err]);

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          gap: 3
        }}
      >
        <ErrorOutlineIcon sx={{ fontSize: 80, color: 'error.main' }} />
        
        <Typography variant="h1" sx={{ fontSize: '3rem', fontWeight: 'bold' }}>
          {statusCode || 'Error'}
        </Typography>
        
        <Typography variant="h6" color="text.secondary">
          {statusCode
            ? `An error ${statusCode} occurred on ${hasGetInitialPropsRun ? 'server' : 'client'}`
            : 'An error occurred on client'}
        </Typography>
        
        {err?.message && (
          <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: 'background.paper', p: 2, borderRadius: 1 }}>
            {err.message}
          </Typography>
        )}
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="contained" onClick={() => router.push('/')}>
            Go Home
          </Button>
          <Button variant="outlined" onClick={() => router.reload()}>
            Reload Page
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

Error.getInitialProps = ({ res, err }) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode, hasGetInitialPropsRun: true, err };
};

export default Error;