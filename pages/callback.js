import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { CircularProgress, Box, Typography, Button, alpha } from '@mui/material';

const OAuthCallback = () => {
  const router = useRouter();
  const [errorState, setErrorState] = useState(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      // Prevent double-submission
      if (sessionStorage.getItem('callback_processing') === 'true') {
        console.log('Callback already processing, ignoring...');
        return;
      }
      sessionStorage.setItem('callback_processing', 'true');

      // Get params from URL
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      const provider = urlParams.get('provider');
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      const error = urlParams.get('error');

      if (error) {
        // Handle auth error
        console.error('OAuth authentication failed:', error);
        sessionStorage.removeItem('callback_processing');
        setErrorState({
          title: 'Authentication Cancelled',
          message: 'You cancelled the login process',
          provider: urlParams.get('provider') || 'unknown'
        });
        setIsProcessing(false);
        return;
      }

      // Handle Twitter OAuth 2.0 code exchange
      if (code && state) {
        try {
          // Check if code already used
          const usedCode = sessionStorage.getItem('code_used');
          if (usedCode === code) {
            throw new Error('Authorization code already used');
          }

          const savedState = sessionStorage.getItem('twitter_state');
          const codeVerifier = sessionStorage.getItem('twitter_verifier');
          const redirectUri = sessionStorage.getItem('twitter_redirect_uri');

          // Debug logging
          console.log('OAuth Exchange Debug:', {
            code: code ? `${code.substring(0, 10)}...` : 'missing',
            state: state ? 'exists' : 'missing',
            savedState: savedState ? 'exists' : 'missing',
            verifier: codeVerifier ? 'exists' : 'missing',
            redirectUri: redirectUri || 'missing',
            stateMatch: state === savedState
          });

          if (!codeVerifier) {
            throw new Error('Session expired - code verifier missing');
          }

          if (state !== savedState) {
            throw new Error('State mismatch - possible CSRF attack');
          }

          if (!redirectUri) {
            throw new Error('Redirect URI not found in session');
          }

          const response = await fetch('https://api.xrpl.to/api/oauth/twitter/exchange', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              code,
              state,
              codeVerifier,
              redirectUri: redirectUri
            })
          });

          const data = await response.json();

          // Check for token in response
          if (!response.ok || !data.token) {
            console.error('Twitter OAuth failed:', {
              status: response.status,
              statusText: response.statusText,
              data: data
            });
            throw new Error(data.message || data.error || `Twitter authentication failed (${response.status})`);
          }

          // Mark code as used
          sessionStorage.setItem('code_used', code);

          // Clean up stored values
          sessionStorage.removeItem('twitter_state');
          sessionStorage.removeItem('twitter_verifier');
          sessionStorage.removeItem('twitter_redirect_uri');
          sessionStorage.removeItem('callback_processing');

          // Process Twitter login with the JWT token
          await processOAuthLogin(data.token, 'twitter', data.user);
        } catch (error) {
          console.error('Twitter OAuth error:', error);

          // Clean up stored values even on error
          sessionStorage.removeItem('twitter_state');
          sessionStorage.removeItem('twitter_verifier');
          sessionStorage.removeItem('twitter_redirect_uri');
          sessionStorage.removeItem('callback_processing');

          setErrorState({
            title: 'X Authentication Failed',
            message: 'X (Twitter) authentication is currently unavailable. Please try Passkeys or Google instead.',
            provider: 'twitter'
          });
          setIsProcessing(false);
        }
        return;
      }

      // Handle Google OAuth (token directly in URL)
      if (token && provider) {
        await processOAuthLogin(token, provider);
      } else {
        // No token or code, redirect to login
        sessionStorage.removeItem('callback_processing');
        setErrorState({
          title: 'Authentication Failed',
          message: 'Missing authentication data',
          provider: 'unknown'
        });
        setIsProcessing(false);
      }
    };

    const processOAuthLogin = async (jwtToken, provider, userData = null) => {
      try {
        // Use provided user data or decode JWT
        let payload = userData;
        if (!userData && jwtToken && jwtToken.includes('.')) {
          try {
            payload = JSON.parse(atob(jwtToken.split('.')[1]));
          } catch {
            // Failed to decode JWT
            payload = { id: `${provider}_user`, provider };
          }
        }

        // Import unified wallet storage
        const { UnifiedWalletStorage } = await import('src/utils/encryptedWalletStorage');
        const walletStorage = new UnifiedWalletStorage();

        // Create backend object with proper API URL
        const backend = {
          get: (url) => fetch(`https://api.xrpl.to${url}`, {
            headers: { 'Authorization': `Bearer ${jwtToken}` }
          }).then(r => r.json()),
          post: (url, body) => fetch(`https://api.xrpl.to${url}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${jwtToken}`
            },
            body: JSON.stringify(body)
          }).then(r => r.json())
        };

        // Handle social login
        const result = await walletStorage.handleSocialLogin(
          {
            id: payload?.id || payload?.sub || 'unknown',
            provider: provider,
            email: payload?.account || payload?.email || payload?.username,
            username: payload?.username || payload?.name,
            ...payload
          },
          jwtToken,
          backend
        );

        if (result.requiresPassword) {
          // Store token temporarily for password setup
          sessionStorage.setItem('oauth_temp_token', jwtToken);
          sessionStorage.setItem('oauth_temp_provider', provider);
          sessionStorage.setItem('oauth_temp_user', JSON.stringify(payload || {}));
          sessionStorage.setItem('oauth_action', result.action);
          if (result.backendData) {
            sessionStorage.setItem('oauth_backend_data', JSON.stringify(result.backendData));
          }

          // Redirect to main page where Wallet component will show password setup
          const returnUrl = sessionStorage.getItem('auth_return_url') || '/';
          sessionStorage.removeItem('auth_return_url');
          router.push(returnUrl);
        } else {
          // Wallet already setup, store token and redirect
          localStorage.setItem('jwt', jwtToken);
          localStorage.setItem('authMethod', provider);
          localStorage.setItem('user', JSON.stringify(payload || {}));

          // Store wallet info
          if (result.wallet) {
            sessionStorage.setItem('wallet_address', result.wallet.address);
            sessionStorage.setItem('wallet_public_key', result.wallet.publicKey);
            sessionStorage.setItem('oauth_logged_in', 'true');
          }

          // Redirect to return URL or main page
          const returnUrl = sessionStorage.getItem('auth_return_url') || '/';
          sessionStorage.removeItem('auth_return_url');
          router.push(returnUrl);
        }
      } catch (error) {
        console.error('Error processing OAuth callback:', error);
        setErrorState({
          title: 'Processing Failed',
          message: error.message || 'Failed to process authentication',
          provider: provider
        });
        setIsProcessing(false);
      }
    };

    handleCallback();
  }, [router]);

  const handleRetry = () => {
    sessionStorage.setItem('wallet_modal_open', 'true');
    router.push('/');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  if (errorState) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
        sx={{ px: 2 }}
      >
        <Typography variant="h5" sx={{ fontWeight: 500, mb: 1 }}>
          {errorState.title}
        </Typography>
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, textAlign: 'center' }}>
          {errorState.message}
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5 }}>
          <Button
            variant="outlined"
            onClick={handleRetry}
            sx={{
              py: 1.5,
              px: 3,
              fontSize: '0.95rem',
              fontWeight: 400,
              textTransform: 'none',
              borderRadius: '12px',
              borderWidth: '1.5px',
              borderColor: (theme) => alpha(theme.palette.divider, 0.2),
              '&:hover': {
                borderWidth: '1.5px',
                borderColor: '#4285f4',
                backgroundColor: (theme) => alpha('#4285f4', 0.04)
              }
            }}
          >
            Try Again
          </Button>
          <Button
            variant="outlined"
            onClick={handleGoHome}
            sx={{
              py: 1.5,
              px: 3,
              fontSize: '0.95rem',
              fontWeight: 400,
              textTransform: 'none',
              borderRadius: '12px',
              borderWidth: '1.5px',
              borderColor: (theme) => alpha(theme.palette.divider, 0.2),
              '&:hover': {
                borderWidth: '1.5px',
                backgroundColor: (theme) => alpha(theme.palette.text.primary, 0.04)
              }
            }}
          >
            Go Home
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
    >
      <CircularProgress size={60} />
      <Typography variant="h6" sx={{ mt: 3, fontWeight: 500 }}>
        Authenticating...
      </Typography>
      <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
        Please wait while we complete your login
      </Typography>
    </Box>
  );
};

export default OAuthCallback;