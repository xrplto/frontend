/**
 * Apply alpha transparency to a CSS color string.
 * Supports hex (#rrggbb), rgb(), and rgba() formats.
 */
export const alpha = (color, opacity) => {
  if (!color) return `rgba(0,0,0,${opacity})`;
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`);
  }
  if (color.startsWith('rgba(')) {
    return color.replace(/,\s*[\d.]+\)$/, `, ${opacity})`);
  }
  return color;
};
