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

      // OAuth 1.0a parameters
      const oauth_token = urlParams.get('oauth_token');
      const oauth_verifier = urlParams.get('oauth_verifier');

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

      // Handle Discord OAuth callback
      if (code && !oauth_token && !token) {
        try {
          console.log('Processing Discord OAuth callback');

          const response = await fetch('https://api.xrpl.to/api/oauth/discord/exchange', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              code: code,
              redirectUri: window.location.origin + '/callback'
            })
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Exchange failed' }));
            throw new Error(error.message || error.error || 'Token exchange failed');
          }

          const data = await response.json();

          if (!data.token) {
            throw new Error('No JWT token received from server');
          }

          sessionStorage.removeItem('callback_processing');

          // Process login with the JWT token
          await processOAuthLogin(data.token, 'discord', data.user);
        } catch (error) {
          console.error('Discord OAuth error:', error);
          sessionStorage.removeItem('callback_processing');
          setErrorState({
            title: 'Discord Authentication Failed',
            message: error.message || 'Unable to complete Discord login',
            provider: 'discord'
          });
          setIsProcessing(false);
        }
        return;
      }

      // Handle Twitter OAuth 1.0a callback
      if (oauth_token && oauth_verifier) {
        try {
          // Get stored OAuth token secret from session
          const storedToken = sessionStorage.getItem('oauth1_token');
          const storedTokenSecret = sessionStorage.getItem('oauth1_token_secret');

          if (oauth_token !== storedToken) {
            throw new Error('OAuth token mismatch - possible security issue');
          }

          if (!storedTokenSecret) {
            throw new Error('OAuth token secret not found in session');
          }

          console.log('Exchanging OAuth 1.0a tokens for access token');

          // Step 2: Exchange for access token
          const response = await fetch('https://api.xrpl.to/api/oauth/twitter/oauth1/access', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              oauth_token: oauth_token,
              oauth_verifier: oauth_verifier,
              oauth_token_secret: storedTokenSecret
            })
          });

          if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Exchange failed' }));
            console.error('OAuth 1.0a token exchange failed:', error);
            throw new Error(error.message || error.error || 'Token exchange failed');
          }

          const data = await response.json();

          if (!data.token) {
            throw new Error('No JWT token received from server');
          }

          // Clean up stored OAuth 1.0a values
          sessionStorage.removeItem('oauth1_token');
          sessionStorage.removeItem('oauth1_token_secret');
          sessionStorage.removeItem('oauth1_auth_start');
          sessionStorage.removeItem('callback_processing');

          // Process login with the JWT token
          await processOAuthLogin(data.token, 'twitter', data.user);
        } catch (error) {
          console.error('Twitter OAuth 1.0a error:', error);

          // Clean up stored values even on error
          sessionStorage.removeItem('oauth1_token');
          sessionStorage.removeItem('oauth1_token_secret');
          sessionStorage.removeItem('oauth1_auth_start');
          sessionStorage.removeItem('callback_processing');

          setErrorState({
            title: 'X Authentication Failed',
            message: error.message || 'X (Twitter) authentication failed. Please try again.',
            provider: 'twitter'
          });
          setIsProcessing(false);
        }
        return;
      }

      // Handle Twitter OAuth 2.0 code exchange (fallback for old flow)
      if (code && state) {
        try {
          // Check if code already used
          const usedCode = sessionStorage.getItem('code_used');
          if (usedCode === code) {
            throw new Error('Authorization code already used');
          }

          // Check if auth flow took too long (codes expire in 30 seconds)
          const authStartTime = sessionStorage.getItem('twitter_auth_start');
          if (authStartTime) {
            const elapsed = Date.now() - parseInt(authStartTime);
            if (elapsed > 25000) { // 25 seconds to be safe
              console.warn(`Auth flow took ${elapsed}ms - code may have expired`);
            }
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

          // Validate redirect URI format
          const expectedRedirectUri = window.location.origin + '/callback';
          if (redirectUri !== expectedRedirectUri) {
            console.warn('Redirect URI mismatch:', {
              stored: redirectUri,
              expected: expectedRedirectUri,
              currentOrigin: window.location.origin
            });
          }

          console.log('Sending to backend:', {
            code: code ? `${code.substring(0, 10)}...` : 'missing',
            state: state ? `${state.substring(0, 10)}...` : 'missing',
            codeVerifier: codeVerifier ? `${codeVerifier.substring(0, 10)}...` : 'missing',
            redirectUri,
            expectedRedirectUri
          });

          // Add timeout to the request
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

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
            }),
            signal: controller.signal
          }).finally(() => clearTimeout(timeoutId));

          let data;
          try {
            // Clone the response to avoid reading the body twice
            const responseClone = response.clone();
            data = await response.json();
          } catch (jsonError) {
            console.error('Failed to parse response as JSON:', jsonError);
            // Use the cloned response to read as text
            try {
              const text = await response.clone().text();
              console.error('Response text:', text);
              throw new Error(`Server response was not valid JSON: ${text.substring(0, 200)}`);
            } catch (textError) {
              console.error('Could not read response text:', textError);
              throw new Error(`Server error: ${response.status} ${response.statusText}`);
            }
          }

          // Check for token in response
          if (!response.ok || !data.token) {
            console.error('=== TWITTER OAUTH FAILURE DETAILS ===');
            console.error('Response Status:', response.status, response.statusText);
            console.error('Response Headers:', {
              contentType: response.headers.get('content-type'),
              date: response.headers.get('date')
            });
            console.error('Response Data:', JSON.stringify(data, null, 2));
            console.error('Request Details:', {
              endpoint: 'https://api.xrpl.to/api/oauth/twitter/exchange',
              code: code ? `${code.substring(0, 20)}...` : 'missing',
              state: state ? `${state.substring(0, 20)}...` : 'missing',
              codeVerifier: codeVerifier ? `${codeVerifier.substring(0, 20)}...` : 'missing',
              redirectUri: redirectUri
            });

            // Log specific error details
            if (data?.error === 'invalid_grant') {
              console.error('INVALID GRANT ERROR - Possible causes:');
              console.error('1. Authorization code already used');
              console.error('2. Code expired (must be used within 30 seconds)');
              console.error('3. Redirect URI mismatch');
              console.error('4. PKCE verifier mismatch');
            } else if (data?.error === 'invalid_request') {
              console.error('INVALID REQUEST ERROR - Missing or malformed parameters');
            } else if (data?.error === 'unauthorized_client') {
              console.error('UNAUTHORIZED CLIENT ERROR - App not authorized');
            }

            // Check if this is a backend API error
            if (response.status >= 500) {
              console.error('SERVER ERROR - Backend API issue');
            } else if (response.status === 400) {
              console.error('BAD REQUEST - Check request parameters');
            } else if (response.status === 401) {
              console.error('UNAUTHORIZED - Authentication credentials invalid');
            }

            console.error('=== END TWITTER OAUTH FAILURE DETAILS ===');

            throw new Error(data?.message || data?.error || `Twitter authentication failed (${response.status})`);
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

          let errorMessage = 'X (Twitter) authentication is currently unavailable. Please try Passkeys or Google instead.';
          let errorTitle = 'X Authentication Failed';

          // Provide more specific error messages
          if (error.name === 'AbortError') {
            errorMessage = 'Request timed out. Please try again.';
            errorTitle = 'Connection Timeout';
          } else if (error.message?.includes('invalid_grant')) {
            errorMessage = 'Authentication code expired or invalid. Please try again.';
            errorTitle = 'Authentication Expired';
          } else if (error.message?.includes('CSRF')) {
            errorMessage = 'Security validation failed. Please try again.';
            errorTitle = 'Security Error';
          } else if (error.message?.includes('network')) {
            errorMessage = 'Network error. Please check your connection and try again.';
            errorTitle = 'Connection Error';
          }

          setErrorState({
            title: errorTitle,
            message: errorMessage,
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
        const { EncryptedWalletStorage } = await import('src/utils/encryptedWalletStorage');
        const walletStorage = new EncryptedWalletStorage();

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
        console.log('Calling handleSocialLogin from callback.js');
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

        console.log('handleSocialLogin result in callback:', result);

        if (result.requiresPassword) {
          console.log('Password required - storing session data');
          // Store token temporarily for password setup
          sessionStorage.setItem('oauth_temp_token', jwtToken);
          sessionStorage.setItem('oauth_temp_provider', provider);
          sessionStorage.setItem('oauth_temp_user', JSON.stringify(payload || {}));
          sessionStorage.setItem('oauth_action', result.action);

          // Redirect to main page where Wallet component will show password setup
          const returnUrl = sessionStorage.getItem('auth_return_url') || '/';
          sessionStorage.removeItem('auth_return_url');
          router.push(returnUrl);
        } else {
          // Wallet already setup
          await walletStorage.setSecureItem('jwt', jwtToken);
          await walletStorage.setSecureItem('authMethod', provider);
          await walletStorage.setSecureItem('user', payload || {});

          // Store ALL wallets in profiles
          if (result.allWallets && result.allWallets.length > 0) {
            console.log('📦 Storing', result.allWallets.length, 'wallets to profiles');

            const allProfiles = result.allWallets.map(w => ({
              account: w.address,
              address: w.address,
              publicKey: w.publicKey,
              seed: w.seed,
              wallet_type: 'oauth',
              provider: provider,
              provider_id: payload?.id || payload?.sub,
              createdAt: w.createdAt || Date.now(),
              tokenCreatedAt: Date.now()
            }));

            await walletStorage.setSecureItem('account_profile_2', allProfiles[0]);
            await walletStorage.setSecureItem('account_profiles_2', allProfiles);

            // Store password for provider (enables auto-loading)
            const walletId = `${provider}_${payload?.id || payload?.sub}`;
            const existingPassword = await walletStorage.getSecureItem(`wallet_pwd_${walletId}`);
            if (existingPassword) {
              console.log('✅ Password already exists for provider:', walletId);
            }

            // Notify AppContext that profiles were updated
            window.dispatchEvent(new Event('storage-updated'));
          }

          // Redirect to return URL or main page
          const returnUrl = sessionStorage.getItem('auth_return_url') || '/';
          sessionStorage.removeItem('auth_return_url');

          // For Twitter/X, force a page reload to ensure wallets are loaded
          if (provider === 'twitter') {
            window.location.href = returnUrl;
          } else {
            router.push(returnUrl);
          }
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