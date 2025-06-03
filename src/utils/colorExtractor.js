// Configuration constants
const COLOR_EXTRACTION_CONFIG = {
  // Pixel sampling rate (higher = more performance, lower = more accuracy)
  PIXEL_SAMPLE_RATE: 16,
  // Alpha threshold for transparent pixels
  ALPHA_THRESHOLD: 128,
  // RGB threshold for very light colors (likely background)
  LIGHT_COLOR_THRESHOLD: 240,
  // Color grouping precision (higher = more precise, lower = more grouping)
  COLOR_PRECISION: 10,
  // Default fallback color
  DEFAULT_FALLBACK_COLOR: '#007B55'
};

const TOKEN_IMAGE_CONFIG = {
  BASE_URL: 'https://s1.xrpl.to/token/',
  CROSS_ORIGIN: 'anonymous'
};

// Utility function to extract dominant color from an image
export const extractDominantColor = (imageUrl, config = {}) => {
  const settings = { ...COLOR_EXTRACTION_CONFIG, ...config };

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = TOKEN_IMAGE_CONFIG.CROSS_ORIGIN;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = img.width;
        canvas.height = img.height;

        ctx.drawImage(img, 0, 0);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Color frequency map
        const colorMap = {};

        // Sample pixels for performance
        for (let i = 0; i < data.length; i += settings.PIXEL_SAMPLE_RATE) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          // Skip transparent pixels
          if (a < settings.ALPHA_THRESHOLD) continue;

          // Skip very light colors (likely background)
          if (
            r > settings.LIGHT_COLOR_THRESHOLD &&
            g > settings.LIGHT_COLOR_THRESHOLD &&
            b > settings.LIGHT_COLOR_THRESHOLD
          )
            continue;

          // Group similar colors by reducing precision
          const key = `${Math.floor(r / settings.COLOR_PRECISION) * settings.COLOR_PRECISION},${
            Math.floor(g / settings.COLOR_PRECISION) * settings.COLOR_PRECISION
          },${Math.floor(b / settings.COLOR_PRECISION) * settings.COLOR_PRECISION}`;
          colorMap[key] = (colorMap[key] || 0) + 1;
        }

        // Find the most frequent color
        let maxCount = 0;
        let dominantColor = settings.DEFAULT_FALLBACK_COLOR;

        for (const [color, count] of Object.entries(colorMap)) {
          if (count > maxCount) {
            maxCount = count;
            const [r, g, b] = color.split(',').map(Number);
            dominantColor = `rgb(${r}, ${g}, ${b})`;
          }
        }

        resolve(dominantColor);
      } catch (error) {
        console.warn('Error extracting color from image:', error);
        resolve(settings.DEFAULT_FALLBACK_COLOR);
      }
    };

    img.onerror = () => {
      console.warn('Failed to load image for color extraction:', imageUrl);
      resolve(settings.DEFAULT_FALLBACK_COLOR);
    };

    img.src = imageUrl;
  });
};

// Convert RGB to hex
export const rgbToHex = (rgb) => {
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return rgb;

  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
};

// Get token image URL from md5 hash
export const getTokenImageUrl = (md5, baseUrl = TOKEN_IMAGE_CONFIG.BASE_URL) => {
  if (!md5) return null;
  return `${baseUrl}${md5}`;
};

// Generate a color based on string hash (deterministic color generation)
export const generateColorFromString = (str, saturation = 70, lightness = 50) => {
  if (!str) return COLOR_EXTRACTION_CONFIG.DEFAULT_FALLBACK_COLOR;

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

// Get fallback color for tokens
export const getTokenFallbackColor = (currency, index = 0, options = {}) => {
  const {
    customColors = {},
    fallbackPalette = [],
    useGeneratedColors = false,
    generationOptions = { saturation: 70, lightness: 50 }
  } = options;

  // Check custom colors first
  if (customColors[currency]) {
    return customColors[currency];
  }

  // Use generated colors if enabled
  if (useGeneratedColors) {
    return generateColorFromString(
      currency,
      generationOptions.saturation,
      generationOptions.lightness
    );
  }

  // Use provided fallback palette
  if (fallbackPalette.length > 0) {
    return fallbackPalette[index % fallbackPalette.length];
  }

  // Final fallback to generated color
  return generateColorFromString(currency + index.toString());
};

// Utility to create a color palette
export const createColorPalette = (count, options = {}) => {
  const { saturation = 70, lightness = 50, hueStart = 0, hueStep = null } = options;

  const step = hueStep || Math.floor(360 / count);
  const palette = [];

  for (let i = 0; i < count; i++) {
    const hue = (hueStart + i * step) % 360;
    palette.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }

  return palette;
};

// Export configuration for external customization
export const getColorExtractionConfig = () => ({ ...COLOR_EXTRACTION_CONFIG });
export const getTokenImageConfig = () => ({ ...TOKEN_IMAGE_CONFIG });
