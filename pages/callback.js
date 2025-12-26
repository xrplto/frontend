import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Loader2 } from 'lucide-react';
import { cn } from 'src/utils/cn';
import { EncryptedWalletStorage } from 'src/utils/encryptedWalletStorage';

// Pre-instantiate to avoid dynamic import latency
const walletStorage = new EncryptedWalletStorage();

const OAuthCallback = () => {
  const router = useRouter();
  const [errorState, setErrorState] = useState(null);
  const [isProcessing, setIsProcessing] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      console.log('[Callback] === START handleCallback ===');
      console.log('[Callback] URL:', window.location.href);

      // Prevent double-submission (with 10s timeout to prevent permanent lockout)
      const processingStart = sessionStorage.getItem('callback_processing_start');
      const isProcessingFlag = sessionStorage.getItem('callback_processing');
      console.log('[Callback] Processing flag:', isProcessingFlag, 'Start time:', processingStart);

      if (isProcessingFlag === 'true') {
        const elapsed = processingStart ? Date.now() - parseInt(processingStart) : 0;
        console.log('[Callback] Already processing, elapsed:', elapsed, 'ms');
        // If stuck for more than 5 seconds, clear and retry
        if (processingStart && elapsed > 5000) {
          console.warn('[Callback] Processing stuck >10s - clearing flag and retrying');
          sessionStorage.removeItem('callback_processing');
          sessionStorage.removeItem('callback_processing_start');
        } else {
          console.log('[Callback] Exiting - already processing (wait or clear sessionStorage)');
          return;
        }
      }
      sessionStorage.setItem('callback_processing', 'true');
      sessionStorage.setItem('callback_processing_start', Date.now().toString());

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

      console.log('[Callback] URL Params:', {
        token: token ? `${token.substring(0, 20)}...` : null,
        provider,
        code: code ? `${code.substring(0, 20)}...` : null,
        state: state ? `${state.substring(0, 20)}...` : null,
        error,
        oauth_token: oauth_token ? `${oauth_token.substring(0, 20)}...` : null,
        oauth_verifier: oauth_verifier ? `${oauth_verifier.substring(0, 20)}...` : null
      });

      if (error) {
        // Handle auth error
        console.error('OAuth authentication failed:', error);
        sessionStorage.removeItem('callback_processing');
        sessionStorage.removeItem('callback_processing_start');
        setErrorState({
          title: 'Authentication Cancelled',
          message: 'You cancelled the login process',
          provider: urlParams.get('provider') || 'unknown'
        });
        setIsProcessing(false);
        return;
      }

      // Handle Discord OAuth callback
      console.log('[Callback] Checking Discord condition:', { code: !!code, oauth_token: !!oauth_token, token: !!token });
      if (code && !oauth_token && !token) {
        console.log('[Callback] → DISCORD flow');
        try {
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
        sessionStorage.removeItem('callback_processing_start');

          // Process login with the JWT token
          await processOAuthLogin(data.token, 'discord', data.user);
        } catch (error) {
          console.error('Discord OAuth error:', error);
          sessionStorage.removeItem('callback_processing');
        sessionStorage.removeItem('callback_processing_start');
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
      console.log('[Callback] Checking Twitter 1.0a condition:', { oauth_token: !!oauth_token, oauth_verifier: !!oauth_verifier });
      if (oauth_token && oauth_verifier) {
        console.log('[Callback] → TWITTER OAuth 1.0a flow');
        try {
          // Get stored OAuth token secret from session
          const storedToken = sessionStorage.getItem('oauth1_token');
          const storedTokenSecret = sessionStorage.getItem('oauth1_token_secret');
          console.log('[Callback] Session tokens:', {
            storedToken: storedToken ? `${storedToken.substring(0, 15)}...` : null,
            storedTokenSecret: storedTokenSecret ? 'EXISTS' : null,
            urlToken: oauth_token ? `${oauth_token.substring(0, 15)}...` : null,
            tokensMatch: oauth_token === storedToken
          });

          // Handle stale/mismatched session gracefully
          if (!storedToken || !storedTokenSecret || oauth_token !== storedToken) {
            console.log('[Callback] Session expired/mismatch - showing error');
            // Session expired or page was refreshed - clean up and show friendly error
            sessionStorage.removeItem('oauth1_token');
            sessionStorage.removeItem('oauth1_token_secret');
            sessionStorage.removeItem('oauth1_auth_start');
            sessionStorage.removeItem('callback_processing');
            sessionStorage.removeItem('callback_processing_start');

            setErrorState({
              title: 'Session Expired',
              message: 'Your login session expired. Please try again.',
              provider: 'twitter'
            });
            setIsProcessing(false);
            return;
          }

          // Step 2: Exchange for access token
          console.log('[Callback] Calling Twitter OAuth 1.0a access endpoint...');
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

          console.log('[Callback] Twitter API response status:', response.status);
          if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Exchange failed' }));
            console.error('[Callback] OAuth 1.0a token exchange failed:', error);
            throw new Error(error.message || error.error || 'Token exchange failed');
          }

          const data = await response.json();
          console.log('[Callback] Twitter API response:', { hasToken: !!data.token, hasUser: !!data.user });

          if (!data.token) {
            throw new Error('No JWT token received from server');
          }

          console.log('[Callback] Got JWT, cleaning up session and calling processOAuthLogin...');
          // Clean up stored OAuth 1.0a values
          sessionStorage.removeItem('oauth1_token');
          sessionStorage.removeItem('oauth1_token_secret');
          sessionStorage.removeItem('oauth1_auth_start');
          sessionStorage.removeItem('callback_processing');
        sessionStorage.removeItem('callback_processing_start');

          // Process login with the JWT token
          await processOAuthLogin(data.token, 'twitter', data.user);
        } catch (error) {
          console.error('Twitter OAuth 1.0a error:', error);

          // Clean up stored values even on error
          sessionStorage.removeItem('oauth1_token');
          sessionStorage.removeItem('oauth1_token_secret');
          sessionStorage.removeItem('oauth1_auth_start');
          sessionStorage.removeItem('callback_processing');
        sessionStorage.removeItem('callback_processing_start');

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
      console.log('[Callback] Checking Twitter 2.0 condition:', { code: !!code, state: !!state });
      if (code && state) {
        console.log('[Callback] → TWITTER OAuth 2.0 flow');
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
        sessionStorage.removeItem('callback_processing_start');

          // Process Twitter login with the JWT token
          await processOAuthLogin(data.token, 'twitter', data.user);
        } catch (error) {
          console.error('Twitter OAuth error:', error);

          // Clean up stored values even on error
          sessionStorage.removeItem('twitter_state');
          sessionStorage.removeItem('twitter_verifier');
          sessionStorage.removeItem('twitter_redirect_uri');
          sessionStorage.removeItem('callback_processing');
        sessionStorage.removeItem('callback_processing_start');

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
      console.log('[Callback] Checking Google condition:', { token: !!token, provider });
      if (token && provider) {
        console.log('[Callback] → GOOGLE flow');
        await processOAuthLogin(token, provider);
      } else {
        // No token or code, redirect to login
        console.log('[Callback] No OAuth params matched - showing error');
        sessionStorage.removeItem('callback_processing');
        sessionStorage.removeItem('callback_processing_start');
        setErrorState({
          title: 'Authentication Failed',
          message: 'Missing authentication data. Please try again.',
          provider: 'unknown'
        });
        setIsProcessing(false);
      }
    };

    const processOAuthLogin = async (jwtToken, provider, userData = null) => {
      console.log('[Callback] processOAuthLogin called:', { provider, hasToken: !!jwtToken, hasUserData: !!userData });
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

        console.log('[Callback] Using pre-instantiated walletStorage');

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
        console.log('[Callback] Calling walletStorage.handleSocialLogin...');
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
        console.log('[Callback] handleSocialLogin result:', {
          success: result.success,
          requiresPassword: result.requiresPassword,
          hasWallet: !!result.wallet,
          walletsCount: result.allWallets?.length || 0
        });

        if (result.requiresPassword) {
          console.log('[Callback] Password required - redirecting to /wallet-setup');
          // Store token temporarily for password setup
          sessionStorage.setItem('oauth_temp_token', jwtToken);
          sessionStorage.setItem('oauth_temp_provider', provider);
          sessionStorage.setItem('oauth_temp_user', JSON.stringify(payload || {}));
          sessionStorage.setItem('oauth_action', result.action);

          // Clear wallet modal flag to prevent it showing on setup page
          sessionStorage.removeItem('wallet_modal_open');
          sessionStorage.removeItem('auth_return_url');

          // Redirect to dedicated wallet-setup page (full reload to ensure fresh state)
          window.location.href = '/wallet-setup';
        } else {
          // Wallet already setup
          console.log('[Callback] Wallet already setup - storing credentials...');
          await walletStorage.setSecureItem('jwt', jwtToken);
          await walletStorage.setSecureItem('authMethod', provider);
          await walletStorage.setSecureItem('user', payload || {});

          // Store ALL wallets in profiles (NO seeds - seeds only in encrypted IndexedDB)
          if (result.allWallets && result.allWallets.length > 0) {
            console.log('[Callback] Storing', result.allWallets.length, 'wallets to profiles...');
            const allProfiles = result.allWallets.map((w, index) => ({
              account: w.address,
              address: w.address,
              publicKey: w.publicKey,
              wallet_type: 'oauth',
              provider: provider,
              provider_id: payload?.id || payload?.sub,
              accountIndex: w.accountIndex ?? index,
              createdAt: w.createdAt || Date.now(),
              tokenCreatedAt: Date.now()
            }));

            await walletStorage.setSecureItem('account_profile_2', allProfiles[0]);
            await walletStorage.setSecureItem('account_profiles_2', allProfiles);

            // Store in localStorage for AppContext to read on page load
            localStorage.setItem('account_profile_2', JSON.stringify(allProfiles[0]));
            localStorage.setItem('profiles', JSON.stringify(allProfiles));

            // Notify AppContext that profiles were updated
            window.dispatchEvent(new Event('storage-updated'));
          }

          // Redirect to return URL or main page
          const returnUrl = sessionStorage.getItem('auth_return_url') || '/';
          sessionStorage.removeItem('auth_return_url');
          console.log('[Callback] Login complete - redirecting to:', returnUrl);

          // Always use window.location.href to ensure a full page reload
          // This guarantees AppContext reads fresh state from localStorage
          // router.push() would cause a race condition where navigation
          // happens before React applies the async state update
          window.location.href = returnUrl;
        }
      } catch (error) {
        console.error('[Callback] Error processing OAuth callback:', error);
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
    window.location.href = '/';
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  if (errorState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-4">
        <h2 className="text-2xl font-normal mb-2">
          {errorState.title}
        </h2>
        <p className="text-center text-gray-600 mb-8">
          {errorState.message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={handleRetry}
            className={cn(
              "px-6 py-3 rounded-xl border-[1.5px] text-[15px] font-normal transition-all",
              "border-gray-200 text-primary hover:border-primary hover:bg-primary/5"
            )}
          >
            Try Again
          </button>
          <button
            onClick={handleGoHome}
            className={cn(
              "px-6 py-3 rounded-xl border-[1.5px] text-[15px] font-normal transition-all",
              "border-gray-200 hover:bg-gray-100"
            )}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 size={60} className="animate-spin text-primary" />
      <h2 className="mt-6 text-xl font-normal">
        Authenticating...
      </h2>
      <p className="mt-2 text-sm text-gray-600">
        Please wait while we complete your login
      </p>
    </div>
  );
};

export default OAuthCallback;