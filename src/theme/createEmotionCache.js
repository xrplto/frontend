import createCache from '@emotion/cache';

// Creates a client-side Emotion cache with prepend to reduce specificity
export default function createEmotionCache() {
  return createCache({ key: 'css', prepend: true });
}
