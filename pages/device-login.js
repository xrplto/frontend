import { useState, useContext, useEffect, useRef } from 'react';
import { Loader2, AlertTriangle, ExternalLink, Info } from 'lucide-react';
import { AppContext } from 'src/AppContext';
import { useRouter } from 'next/router';
import { cn } from 'src/utils/cn';

// Lazy load heavy dependencies
let startRegistration, startAuthentication, Wallet, CryptoJS;

// Base64url encoding helper
const base64urlEncode = (buffer) => {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

const DeviceLoginPage = () => {
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [walletInfo, setWalletInfo] = useState(null);
  const [isLoadingDeps, setIsLoadingDeps] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pinMode, setPinMode] = useState('create'); // 'create' or 'verify'
  const [pendingPasskeyId, setPendingPasskeyId] = useState(null);
  const [pins, setPins] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  const { doLogIn, themeName } = useContext(AppContext);
  const router = useRouter();
  const isDark = themeName === 'XrplToDarkTheme';

  // Lazy load heavy dependencies
  const loadDependencies = async () => {
    if (!startRegistration || !startAuthentication || !Wallet || !CryptoJS) {
      setIsLoadingDeps(true);
      const [webauthnModule, xrplModule, cryptoModule] = await Promise.all([
        import('@simplewebauthn/browser'),
        import('xrpl'),
        import('crypto-js')
      ]);

      startRegistration = webauthnModule.startRegistration;
      startAuthentication = webauthnModule.startAuthentication;
      Wallet = xrplModule.Wallet;
      CryptoJS = cryptoModule.default;
      setIsLoadingDeps(false);
    }
  };

  // PIN Input handlers
  const handlePinChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newPins = [...pins];
    newPins[index] = value.slice(-1);
    setPins(newPins);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePinKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !pins[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'Enter' && pins.every(p => p)) {
      handlePinSubmit();
    }
  };

  const handlePinSubmit = async () => {
    const pin = pins.join('');
    if (pin.length !== 6) {
      setError('Please enter all 6 digits');
      return;
    }

    setShowPinDialog(false);
    setPins(['', '', '', '', '', '']);

    if (pinMode === 'create' && pendingPasskeyId) {
      await completeRegistration(pendingPasskeyId, pin);
    } else if (pinMode === 'verify' && pendingPasskeyId) {
      await completeAuthentication(pendingPasskeyId, pin);
    }
  };

  const completeRegistration = async (passkeyId, userSecret) => {
    try {
      const wallet = generateWallet(passkeyId, userSecret);

      // Store wallet with passkey mapping
      const storage = new (await import('src/utils/encryptedWalletStorage')).UnifiedWalletStorage();

      await storage.storePasskeyWallet(passkeyId, {
        address: wallet.address,
        publicKey: wallet.publicKey,
        seed: wallet.seed,
        wallet_type: 'device',
        createdAt: Date.now()
      }, userSecret);

      // Cache credential for this session
      await storage.storeWalletCredential(passkeyId, userSecret);

      setWalletInfo({
        address: wallet.address,
        publicKey: wallet.publicKey
      });

      const profile = {
        account: wallet.address,
        address: wallet.address,
        publicKey: wallet.publicKey,
        wallet_type: 'device',
        xrp: '0'
      };

      doLogIn(profile);
      setStatus('success');

      // Notify parent window
      if (window.opener) {
        window.opener.postMessage({ type: 'DEVICE_LOGIN_SUCCESS', profile }, '*');
      }

      setTimeout(() => {
        window.close();
      }, 10000);
    } catch (err) {
      setError('Failed to create wallet: ' + err.message);
      setStatus('idle');
    }
  };

  const completeAuthentication = async (passkeyId, userSecret) => {
    try {
      setStatus('discovering');

      // Cache credential for this session
      const storage = new (await import('src/utils/encryptedWalletStorage')).UnifiedWalletStorage();
      await storage.storeWalletCredential(passkeyId, userSecret);

      // Discover all accounts with balances
      let allAccounts;
      try {
        allAccounts = await discoverAllAccounts(passkeyId, userSecret);
      } catch (discoveryError) {
        const wallet = generateWallet(passkeyId, userSecret, 0);
        allAccounts = [{
          account: wallet.address,
          address: wallet.address,
          publicKey: wallet.publicKey,
          wallet_type: 'device',
          xrp: '0'
        }];
      }

      if (allAccounts.length === 0) {
        const wallet = generateWallet(passkeyId, userSecret, 0);
        allAccounts.push({
          account: wallet.address,
          address: wallet.address,
          publicKey: wallet.publicKey,
          wallet_type: 'device',
          xrp: '0'
        });
      }

      doLogIn(allAccounts[0]);

      // Notify parent to restore all device accounts
      if (window.opener) {
        window.opener.postMessage({
          type: 'DEVICE_LOGIN_SUCCESS',
          profile: allAccounts[0],
          allDeviceAccounts: allAccounts
        }, '*');
      }

      setStatus('success');
      setTimeout(() => {
        window.close();
      }, 2000);
    } catch (err) {
      setError('Authentication failed: ' + err.message);
      setStatus('idle');
    }
  };

  const generateWallet = (passkeyId, userSecret, accountIndex = 0) => {
    if (!userSecret || userSecret.length < 6) {
      throw new Error('PIN must be at least 6 characters');
    }

    const seed = CryptoJS.PBKDF2(
      `xrpl-passkey-${passkeyId}-${userSecret}-${accountIndex}`,
      `salt-${passkeyId}`,
      {
        keySize: 256/32,
        iterations: 10000,
        hasher: CryptoJS.algo.SHA512
      }
    );

    const seedHex = seed.toString();
    const entropy = [];
    for (let i = 0; i < 32; i++) {
      entropy.push(parseInt(seedHex.substr(i * 2, 2), 16));
    }

    const wallet = Wallet.fromEntropy(entropy);
    wallet.seed = seedHex;
    return wallet;
  };

  const discoverAllAccounts = async (passkeyId, userSecret) => {
    const accounts = [];
    const wallet = generateWallet(passkeyId, userSecret, 0);
    accounts.push({
      account: wallet.address,
      address: wallet.address,
      publicKey: wallet.publicKey,
      wallet_type: 'device',
      xrp: '0'
    });

    return accounts;
  };

  const handleRegister = async () => {
    try {
      setStatus('registering');
      setError('');

      await loadDependencies();

      if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn not supported in this browser');
      }

      const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      if (!available) {
        setError('setup_required');
        setStatus('idle');
        return;
      }

      const userIdBuffer = crypto.getRandomValues(new Uint8Array(32));
      const challengeBuffer = crypto.getRandomValues(new Uint8Array(32));
      const userId = base64urlEncode(userIdBuffer);
      const challenge = base64urlEncode(challengeBuffer);

      let registrationResponse;
      try {
        registrationResponse = await startRegistration({
          rp: {
            name: 'XRPL.to',
            id: window.location.hostname,
          },
          user: {
            id: userId,
            name: `xrplto-${Date.now()}@xrpl.to`,
            displayName: 'XRPL.to User',
          },
          challenge: challenge,
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          timeout: 60000,
          attestation: 'none',
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
        });
      } catch (innerErr) {
        if (innerErr.message?.includes('NotSupportedError') || innerErr.message?.includes('not supported')) {
          setError('Passkeys not supported on this device or browser.');
        } else if (innerErr.message?.includes('InvalidStateError') || innerErr.message?.includes('saving')) {
          setError('setup_required');
        } else if (innerErr.message?.includes('NotAllowedError') || innerErr.message?.includes('denied')) {
          setError('Cancelled. Please try again and allow the security prompt.');
        } else {
          setError('setup_required');
        }
        setStatus('idle');
        return;
      }

      if (registrationResponse.id) {
        setPendingPasskeyId(registrationResponse.id);
        setPinMode('create');
        setShowPinDialog(true);
        setStatus('idle');
      }
    } catch (err) {
      console.error('Registration error:', err);

      const errorName = err.name || err.cause?.name;
      const errorMessage = err.message || err.cause?.message || '';

      if (errorName === 'NotAllowedError' || errorMessage.includes('not allowed') || errorMessage.includes('denied permission')) {
        setError('Cancelled. Please try again and allow the security prompt.');
      } else if (errorName === 'AbortError') {
        setError('Timed out. Please try again.');
      } else {
        setError('Failed: ' + errorMessage);
      }
      setStatus('idle');
    }
  };

  const handleAuthenticate = async () => {
    try {
      setStatus('authenticating');
      setError('');

      await loadDependencies();

      if (!window.PublicKeyCredential) {
        throw new Error('WebAuthn not supported in this browser');
      }

      const challengeBuffer = crypto.getRandomValues(new Uint8Array(32));
      const challenge = base64urlEncode(challengeBuffer);

      let authResponse;
      try {
        authResponse = await startAuthentication({
          challenge: challenge,
          timeout: 60000,
          userVerification: 'required'
        });
      } catch (innerErr) {
        if (innerErr.message?.includes('NotSupportedError') || innerErr.message?.includes('not supported')) {
          setError('Passkeys not supported on this device or browser.');
        } else if (innerErr.message?.includes('InvalidStateError')) {
          setError('Windows Hello not set up. Please enable Windows Hello, Touch ID, or Face ID in your device settings first.');
        } else if (innerErr.message?.includes('NotAllowedError') || innerErr.message?.includes('denied')) {
          setError('Cancelled. Please try again and allow the security prompt.');
        } else {
          setError('Authentication failed. Please ensure Windows Hello, Touch ID, or Face ID is enabled on your device.');
        }
        setStatus('idle');
        return;
      }

      if (authResponse.id) {
        const storage = new (await import('src/utils/encryptedWalletStorage')).UnifiedWalletStorage();
        let userSecret = await storage.getWalletCredential(authResponse.id);

        if (!userSecret) {
          setPendingPasskeyId(authResponse.id);
          setPinMode('verify');
          setShowPinDialog(true);
          setStatus('idle');
          return;
        }

        await completeAuthentication(authResponse.id, userSecret);
      }
    } catch (err) {
      console.error('Authentication error:', err);

      const errorName = err.name || err.cause?.name;
      const errorMessage = err.message || err.cause?.message || '';

      if (errorName === 'NotAllowedError' || errorMessage.includes('not allowed') || errorMessage.includes('denied permission')) {
        setError('Cancelled. Please try again and allow the security prompt.');
      } else if (errorName === 'AbortError') {
        setError('Timed out. Please try again.');
      } else {
        setError('Failed: ' + errorMessage);
      }
      setStatus('idle');
    }
  };

  useEffect(() => {
    loadDependencies();
  }, []);

  return (
    <>
      <div className="mx-auto max-w-2xl px-4 py-8">
        <div className={cn(
          "rounded-2xl border-[1.5px] text-center",
          isDark ? "bg-gray-900/50 border-white/10" : "bg-white border-gray-200"
        )}>
          <div className="p-8">
            <h1 className="text-3xl font-normal mb-3">Passkeys Login</h1>
            <p className={cn("text-base mb-4", isDark ? "text-white/70" : "text-gray-600")}>
              Use your device's biometric authentication to securely access your XRPL wallet
            </p>

            <div className={cn(
              "flex items-start gap-2 p-4 rounded-xl border-[1.5px] mb-6 text-left",
              "bg-blue-500/5 border-blue-500/20"
            )}>
              <Info size={20} className="text-blue-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-normal mb-1">Important: One Passkey = One Set of Wallets</p>
                <p className="text-xs opacity-90">
                  Each passkey creates different XRPL accounts. Use the same passkey across devices to access the same wallets.
                </p>
              </div>
            </div>

            {error && (
              <div className={cn(
                "p-4 rounded-xl border-[1.5px] mb-4 text-left",
                error === 'setup_required'
                  ? "bg-blue-500/5 border-blue-500/20"
                  : "bg-red-500/5 border-red-500/20"
              )}>
                {error === 'setup_required' ? (
                  <div>
                    <p className="text-sm font-semibold mb-2">Windows Hello Setup Required</p>
                    <p className="text-sm mb-2">
                      Please enable Windows Hello, Touch ID, or Face ID to use passkeys login:
                    </p>
                    <p className="text-sm mb-1">1. Go to <strong>Settings → Accounts → Sign-in options</strong></p>
                    <p className="text-sm mb-3">2. Set up PIN, Fingerprint, or Face recognition</p>
                    <a
                      href="https://www.microsoft.com/en-us/windows/tips/windows-hello"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                    >
                      Learn how to set up Windows Hello
                      <ExternalLink size={14} />
                    </a>
                  </div>
                ) : (
                  <p className="text-sm text-red-500">{error}</p>
                )}
              </div>
            )}

            {status === 'success' && walletInfo && (
              <div className={cn(
                "p-4 rounded-xl border-[1.5px] mb-4 text-left",
                "bg-green-500/5 border-green-500/20"
              )}>
                <p className="text-sm font-semibold mb-2">Wallet Created Successfully!</p>
                <p className="text-sm break-all mb-1"><strong>Address:</strong> {walletInfo.address}</p>
                <p className={cn("text-xs", isDark ? "text-white/60" : "text-gray-600")}>
                  Your wallet is secured with your PIN. Window closes in 10 seconds.
                </p>
              </div>
            )}

            {isLoadingDeps && (
              <div className={cn(
                "flex items-center gap-2 p-3 rounded-xl border-[1.5px] mb-4",
                "bg-blue-500/5 border-blue-500/20"
              )}>
                <Loader2 size={16} className="animate-spin text-primary" />
                <p className="text-sm">Loading security modules...</p>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={handleAuthenticate}
                disabled={status !== 'idle' || isLoadingDeps}
                className={cn(
                  "flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-base font-normal transition-all",
                  "bg-primary text-white hover:opacity-90",
                  (status !== 'idle' || isLoadingDeps) && "opacity-50 cursor-not-allowed"
                )}
              >
                {(status === 'authenticating' || status === 'discovering') && <Loader2 size={20} className="animate-spin" />}
                {status === 'authenticating' ? 'Authenticating...' : status === 'discovering' ? 'Discovering accounts...' : 'Sign In with Existing Passkey'}
              </button>

              <button
                onClick={handleRegister}
                disabled={status !== 'idle' || isLoadingDeps}
                className={cn(
                  "flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-[1.5px] text-base font-normal transition-all",
                  "border-yellow-500 text-yellow-500 hover:bg-yellow-500/10",
                  (status !== 'idle' || isLoadingDeps) && "opacity-50 cursor-not-allowed"
                )}
              >
                {status === 'registering' && <Loader2 size={20} className="animate-spin" />}
                {status === 'registering' ? 'Creating passkey...' : 'Create New Passkey'}
              </button>

              <p className={cn("text-xs text-center mt-2", isDark ? "text-white/60" : "text-gray-600")}>
                First time? Use "Create New Passkey" • Returning? Use "Sign In with Existing Passkey"
              </p>
            </div>

            <p className={cn("text-xs mt-4", isDark ? "text-white/60" : "text-gray-600")}>
              Your private keys are generated locally and never leave your device
            </p>
          </div>
        </div>
      </div>

      {/* PIN Input Dialog */}
      {showPinDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowPinDialog(false)}>
          <div
            className={cn(
              "max-w-md w-full mx-4 rounded-2xl border-[1.5px] p-6",
              isDark ? "bg-gray-900 border-white/10" : "bg-white border-gray-200"
            )}
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold text-center mb-2">
              {pinMode === 'create' ? 'Create Your PIN' : 'Enter Your PIN'}
            </h2>
            <p className={cn("text-sm text-center mb-6", isDark ? "text-white/60" : "text-gray-600")}>
              {pinMode === 'create'
                ? 'Create a 6-digit PIN to secure your wallet'
                : 'Enter your 6-digit PIN to access your wallet'}
            </p>

            <div className="flex gap-2 justify-center mb-6">
              {pins.map((pin, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  value={pin}
                  onChange={(e) => handlePinChange(index, e.target.value)}
                  onKeyDown={(e) => handlePinKeyDown(index, e)}
                  type="text"
                  maxLength={1}
                  autoComplete="off"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  autoFocus={index === 0}
                  className={cn(
                    "w-12 h-12 text-center text-2xl font-medium rounded-lg border-[1.5px]",
                    isDark
                      ? "bg-gray-800 border-white/15 text-white"
                      : "bg-white border-gray-300 text-gray-900"
                  )}
                />
              ))}
            </div>

            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowPinDialog(false)}
                className={cn(
                  "px-6 py-2 rounded-lg border-[1.5px] text-sm font-normal transition-all",
                  isDark
                    ? "border-white/15 hover:bg-white/5"
                    : "border-gray-300 hover:bg-gray-100"
                )}
              >
                Cancel
              </button>
              <button
                onClick={handlePinSubmit}
                disabled={pins.some(p => !p)}
                className={cn(
                  "px-6 py-2 rounded-lg text-sm font-normal transition-all",
                  "bg-primary text-white hover:opacity-90",
                  pins.some(p => !p) && "opacity-50 cursor-not-allowed"
                )}
              >
                {pinMode === 'create' ? 'Create PIN' : 'Unlock'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeviceLoginPage;
