// Lightweight MD5 replacement using Web Crypto API
export async function md5(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
}

// Synchronous fallback for immediate usage (less secure but compatible)
export function md5Sync(text) {
  // Simple hash function for non-cryptographic purposes
  let hash = 0;
  if (text.length === 0) return hash.toString(16).padStart(8, '0');
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).padStart(8, '0');
}