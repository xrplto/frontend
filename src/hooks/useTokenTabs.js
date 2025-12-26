import { useState, useEffect, useCallback } from 'react';

const MAX_TABS = 20;
const STORAGE_KEY = 'token_tabs_history';

// Custom event for cross-component sync
const TABS_UPDATED_EVENT = 'token_tabs_updated';

// Helper to normalize name (defined here for initial load)
const normalizeNameLocal = (n) => typeof n === 'object' && n !== null ? n.collection_name || n.name || '' : n || '';

export function useTokenTabs() {
  const [tabs, setTabs] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      let parsed = stored ? JSON.parse(stored) : [];
      // Normalize any object names from corrupted localStorage data
      return parsed.map(t => ({
        ...t,
        name: normalizeNameLocal(t.name),
        user: normalizeNameLocal(t.user),
        collectionName: normalizeNameLocal(t.collectionName)
      }));
    } catch {
      return [];
    }
  });

  // Listen for updates from addTokenToTabs
  useEffect(() => {
    const handleUpdate = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          // Normalize any object names
          setTabs(parsed.map(t => ({
            ...t,
            name: normalizeNameLocal(t.name),
            user: normalizeNameLocal(t.user),
            collectionName: normalizeNameLocal(t.collectionName)
          })));
        }
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

    // Helper to normalize name
    const normalize = (n) => typeof n === 'object' && n !== null ? n.collection_name || n.name || '' : n || '';

    setTabs((prev) => {
      const filtered = prev.filter((t) => t.md5 !== token.md5);
      const newTab = {
        md5: token.md5,
        slug: token.slug,
        name: normalize(token.name) || normalize(token.user) || 'Token',
        user: normalize(token.user) || normalize(token.name) || ''
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

// Helper to normalize name from API (may be string or object)
const normalizeName = (name) => {
  if (typeof name === 'object' && name !== null) {
    return name.collection_name || name.name || '';
  }
  return name || '';
};

// Standalone function to add tab from anywhere (TokenRow, Header)
export function addTokenToTabs(item) {
  if (typeof window === 'undefined') return;
  if (!item?.slug) return;

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    let tabs = stored ? JSON.parse(stored) : [];

    // Normalize existing tabs in case they have object names from previous sessions
    tabs = tabs.map(t => ({
      ...t,
      name: normalizeName(t.name),
      user: normalizeName(t.user),
      collectionName: normalizeName(t.collectionName)
    }));

    const id = item.md5 || item.slug;
    const filtered = tabs.filter((t) => (t.md5 || t.slug) !== id);
    const newTab = {
      md5: item.md5 || null,
      slug: item.slug,
      name: normalizeName(item.name) || normalizeName(item.user) || 'Item',
      user: normalizeName(item.user) || normalizeName(item.name) || '',
      type: item.type || 'token',
      logoImage: item.logoImage || null,
      thumbnail: item.thumbnail || null,
      collectionSlug: item.collectionSlug || null,
      collectionName: normalizeName(item.collectionName) || null
    };
    tabs = [newTab, ...filtered].slice(0, MAX_TABS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));

    // Dispatch event to sync with useTokenTabs hook
    window.dispatchEvent(new Event(TABS_UPDATED_EVENT));
  } catch {}
}
