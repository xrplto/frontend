import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { CircularProgress, Box, Typography } from '@mui/material';

const OAuthCallback = () => {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
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
        router.push('/login?error=auth_failed');
        return;
      }

      // Handle Twitter OAuth 2.0 code exchange
      if (code && state) {
        try {
          const savedState = sessionStorage.getItem('twitter_state');
          const codeVerifier = sessionStorage.getItem('twitter_verifier');

          if (state !== savedState) {
            throw new Error('State mismatch - possible CSRF attack');
          }

          // Exchange code for token with Twitter
          const redirectUri = sessionStorage.getItem('twitter_redirect_uri') || 'http://localhost:3002/callback';

          const response = await fetch('https://api.xrpl.to/api/auth/twitter/exchange', {
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
          if (!data.token) {
            throw new Error(data.message || 'Failed to exchange code for token');
          }

          // Clean up stored values
          sessionStorage.removeItem('twitter_state');
          sessionStorage.removeItem('twitter_verifier');
          sessionStorage.removeItem('twitter_redirect_uri');

          // Process Twitter login with the JWT token
          await processOAuthLogin(data.token, 'twitter', data.user);
        } catch (error) {
          console.error('Twitter OAuth error:', error);
          router.push('/login?error=twitter_auth_failed');
        }
        return;
      }

      // Handle Google OAuth (token directly in URL)
      if (token && provider) {
        await processOAuthLogin(token, provider);
      } else {
        // No token or code, redirect to login
        router.push('/login?error=no_auth_data');
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
        router.push('/login?error=processing_failed');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="100vh"
    >
      <CircularProgress size={60} />
      <Typography variant="h6" sx={{ mt: 3 }}>
        Authenticating...
      </Typography>
      <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
        Please wait while we complete your login
      </Typography>
    </Box>
  );
};

export default OAuthCallback;