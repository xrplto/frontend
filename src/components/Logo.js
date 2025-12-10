import { useContext } from 'react';
import { cn } from 'src/utils/cn';
import { AppContext } from 'src/AppContext';

function Logo() {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const img = isDark ? '/logo/xrpl-to-logo-white.svg' : '/logo/xrpl-to-logo-black.svg';

  return (
    <a
      href="/"
      className="inline-flex cursor-pointer items-center"
    >
      <img
        src={img}
        alt="XRPL.to"
        width={100}
        height={36}
        style={{ width: '100px', height: '36px', objectFit: 'contain' }}
      />
    </a>
  );
}

export default Logo;
