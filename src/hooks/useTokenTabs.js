import { useState, useEffect, useCallback } from 'react';

const MAX_TABS = 10;
const STORAGE_KEY = 'token_tabs_history';

// Custom event for cross-component sync
const TABS_UPDATED_EVENT = 'token_tabs_updated';

export function useTokenTabs() {
  const [tabs, setTabs] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Listen for updates from addTokenToTabs
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) setTabs(JSON.parse(stored));
      } catch {}
    };

    window.addEventListener(TABS_UPDATED_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(TABS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const addTab = useCallback((token) => {
    if (!token?.slug || !token?.md5) return;

    setTabs((prev) => {
      const filtered = prev.filter((t) => t.md5 !== token.md5);
      const newTab = {
        md5: token.md5,
        slug: token.slug,
        name: token.name || token.user || 'Token',
        user: token.user || token.name || ''
      };
      const updated = [newTab, ...filtered].slice(0, MAX_TABS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removeTab = useCallback((id) => {
    setTabs((prev) => {
      const updated = prev.filter((t) => (t.md5 || t.slug) !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearTabs = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    setTabs([]);
  }, []);

  return { tabs, addTab, removeTab, clearTabs };
}

// Standalone function to add tab from anywhere (TokenRow, Header)
export function addTokenToTabs(item) {
  if (typeof window === 'undefined') return;
  if (!item?.slug) return;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let tabs = stored ? JSON.parse(stored) : [];

    const id = item.md5 || item.slug;
    const filtered = tabs.filter((t) => (t.md5 || t.slug) !== id);
    const newTab = {
      md5: item.md5 || null,
      slug: item.slug,
      name: item.name || item.user || 'Item',
      user: item.user || item.name || '',
      type: item.type || 'token',
      logoImage: item.logoImage || null
    };
    tabs = [newTab, ...filtered].slice(0, MAX_TABS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));

    // Dispatch event to sync with useTokenTabs hook
    window.dispatchEvent(new Event(TABS_UPDATED_EVENT));
  } catch {}
}
