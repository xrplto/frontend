import { memo, useState, useContext, useEffect, useRef } from 'react';
import { Code2, Copy, Check, X } from 'lucide-react';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import axios from 'axios';

// Global store for tracked API calls - use window to persist across hot reloads
if (typeof window !== 'undefined') {
  window.__apiCallsStore = window.__apiCallsStore || new Set();
  window.__apiListeners = window.__apiListeners || [];

  // Install axios interceptor once
  if (!window.__apiInterceptorInstalled) {
    window.__apiInterceptorInstalled = true;

    axios.interceptors.request.use((config) => {
      const url = config.url || '';
      if (url.includes('api.xrpl.to/api/')) {
        const baseUrl = url.split('?')[0];
        window.__apiCallsStore.add(baseUrl);
        window.__apiListeners.forEach(l => l());
      }
      return config;
    });
  }
}

const getApiCalls = () => typeof window !== 'undefined' ? Array.from(window.__apiCallsStore || []) : [];
const subscribe = (listener) => {
  if (typeof window === 'undefined') return () => {};
  window.__apiListeners.push(listener);
  return () => { window.__apiListeners = window.__apiListeners.filter(l => l !== listener); };
};

// Extract endpoint label from URL path
const getEndpointLabel = (url) => {
  const path = url.replace('https://api.xrpl.to/api/', '').split('?')[0];
  const parts = path.split('/');
  // Capitalize first part, handle common patterns
  const base = parts[0];
  const labels = {
    tokens: 'Tokens', token: 'Token', search: 'Search', tags: 'Tags',
    orderbook: 'Orderbook', rates: 'Rates', history: 'History',
    sparkline: 'Sparkline', traders: 'Traders', trustlines: 'Trustlines',
    account: 'Account', nft: 'NFT', news: 'News', amm: 'AMM Pools',
    pairs: 'Trading Pairs', trending: 'Trending', new: 'New Tokens'
  };
  return labels[base] || base.charAt(0).toUpperCase() + base.slice(1);
};

const ApiEndpointsModal = memo(({ open, onClose }) => {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [copiedIdx, setCopiedIdx] = useState(null);
  const [endpoints, setEndpoints] = useState([]);

  useEffect(() => {
    if (!open) return;
    // Get current tracked calls
    setEndpoints(getApiCalls());
    // Subscribe to new calls while modal is open
    const unsub = subscribe(() => setEndpoints(getApiCalls()));
    return unsub;
  }, [open]);

  if (!open) return null;

  const handleCopy = (url, idx) => {
    navigator.clipboard.writeText(url);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className={cn("fixed inset-0", isDark ? "bg-black/60" : "bg-black/20")} />
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative p-4 rounded-xl border w-[340px] max-h-[80vh] overflow-hidden flex flex-col',
          isDark ? 'bg-black/95 backdrop-blur-xl border-[#3f96fe]/10 shadow-2xl' : 'bg-white border-gray-200 shadow-2xl'
        )}
      >
        <button
          onClick={onClose}
          className={cn("absolute top-3 right-3 p-1 rounded z-10", isDark ? "hover:bg-white/10" : "hover:bg-gray-100")}
        >
          <X size={14} className={isDark ? "text-white/40" : "text-gray-400"} />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <div className={cn("text-[13px] font-medium", isDark ? "text-white" : "text-gray-900")}>
            How this page works
          </div>
          <span className="px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wider rounded bg-amber-500/20 text-amber-400">
            For Developers
          </span>
        </div>
        <div className="text-[11px] mb-3" style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
          {endpoints.length} API endpoints detected on this page:
        </div>

        <div className="space-y-2 overflow-y-auto flex-1 pr-1">
          {endpoints.length === 0 ? (
            <div className={cn("text-[11px] text-center py-4", isDark ? "text-white/40" : "text-gray-400")}>
              No API calls detected yet. Interact with the page to see endpoints.
            </div>
          ) : (
            endpoints.map((url, idx) => (
              <div key={url} className={cn("p-2.5 rounded-lg", isDark ? "bg-white/5" : "bg-gray-50")}>
                <div className="flex justify-between items-center mb-1">
                  <span className={cn("text-[11px] font-medium", isDark ? "text-white" : "text-gray-900")}>
                    {getEndpointLabel(url)}
                  </span>
                  <button
                    onClick={() => handleCopy(url, idx)}
                    className={cn("p-1 -mr-1", copiedIdx === idx ? "text-emerald-500" : (isDark ? "text-white/40" : "text-gray-400"))}
                  >
                    {copiedIdx === idx ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
                <code className={cn("text-[10px] break-all block", isDark ? "text-[#3f96fe]" : "text-cyan-600")}>
                  {url}
                </code>
              </div>
            ))
          )}
        </div>

        <a
          href="https://xrpl.to/docs"
          target="_blank"
          rel="noopener noreferrer"
          className={cn("block text-center text-[11px] mt-3 py-2 rounded-lg border shrink-0", isDark ? "text-[#3f96fe] border-[#3f96fe]/20 hover:bg-[#3f96fe]/10" : "text-cyan-600 border-cyan-200 hover:bg-cyan-50")}
        >
          Full API Documentation →
        </a>
      </div>
    </div>
  );
});

// Standalone button + modal combo
export const ApiButton = memo(({ className = '' }) => {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-colors",
          isDark
            ? "text-[#3f96fe] border-[#3f96fe]/20 hover:bg-[#3f96fe]/10 bg-black/50"
            : "text-cyan-600 border-cyan-200 hover:bg-cyan-50 bg-white/80",
          className
        )}
      >
        <Code2 size={12} />
        API
      </button>
      <ApiEndpointsModal open={open} onClose={() => setOpen(false)} />
    </>
  );
});

// Clear tracked calls (useful on page navigation)
export const clearApiCalls = () => {
  if (typeof window !== 'undefined') {
    window.__apiCallsStore?.clear();
    window.__apiListeners?.forEach(l => l());
  }
};

ApiEndpointsModal.displayName = 'ApiEndpointsModal';
ApiButton.displayName = 'ApiButton';

export default ApiEndpointsModal;
export { getApiCalls, getEndpointLabel };
