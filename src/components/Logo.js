import { useContext } from 'react';
import { ThemeContext } from 'src/context/AppContext';

function Logo({ asLink = true, style }) {
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const img = isDark ? '/logo/xrpl-to-logo-white.svg' : '/logo/xrpl-to-logo-black.svg';

  // Compute explicit pixel dimensions to prevent CLS (never use height: auto)
  const w = parseInt(style?.width) || 100;
  const h = style?.height === 'auto' ? Math.round(w * 0.36) : parseInt(style?.height) || 36;

  const imgElement = (
    <img
      src={img}
      alt="XRPL.to"
      width={w}
      height={h}
      fetchPriority="high"
      decoding="async"
      style={{
        width: `${w}px`,
        height: `${h}px`,
        objectFit: 'contain'
      }}
    />
  );

  if (!asLink) {
    return imgElement;
  }

  return (
    <a href="/" className="inline-flex cursor-pointer items-center">
      {imgElement}
    </a>
  );
}

export default Logo;
