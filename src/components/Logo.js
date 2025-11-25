import { useContext, useState, useMemo } from 'react';
import Image from 'next/image';
import { cn } from 'src/utils/cn';
import { AppContext } from 'src/AppContext';

function Logo({ style }) {
  const { themeName } = useContext(AppContext);
  const [imageError, setImageError] = useState(false);

  // Memoize logo paths - removed query string to avoid Next.js localPatterns warning
  const { img_black, img_white } = useMemo(
    () => ({
      img_black: '/logo/xrpl-to-logo-black.svg',
      img_white: '/logo/xrpl-to-logo-white.svg'
    }),
    []
  );

  const isDark = themeName === 'XrplToDarkTheme';
  const img = isDark ? img_white : img_black;

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div
      className="inline-flex cursor-pointer relative w-[100px] h-9"
      style={style}
      onClick={() => (window.location.href = '/')}
    >
      {imageError ? (
        <div className={cn(
          "w-[100px] h-9 flex items-center justify-center",
          isDark ? "text-white" : "text-black"
        )}>
          XRPL.to
        </div>
      ) : (
        <Image
          src={img}
          width={100}
          height={37}
          alt="XRPL.to Logo"
          onError={handleImageError}
          style={{
            objectFit: 'contain',
            width: '100%',
            height: 'auto'
          }}
          priority
        />
      )}
    </div>
  );
}

export default Logo;
