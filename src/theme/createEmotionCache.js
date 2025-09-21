import createCache from '@emotion/cache';

// Creates a client-side Emotion cache with MUI key and prepend to reduce specificity
export default function createEmotionCache() {
  return createCache({ key: 'mui', prepend: true });
}
