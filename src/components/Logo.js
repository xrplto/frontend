import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

function Logo({ asLink = true, style }) {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const img = isDark ? '/logo/xrpl-to-logo-white.svg' : '/logo/xrpl-to-logo-black.svg';

  const imgElement = (
    <img
      src={img}
      alt="XRPL.to"
      width={100}
      height={36}
      style={{
        width: style?.width || '100px',
        height: style?.height || '36px',
        objectFit: 'contain',
        ...style
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
