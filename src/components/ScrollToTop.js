import PropTypes from 'prop-types';
import { useEffect, useState, useContext } from 'react';
import { cn } from 'src/utils/cn';
import { AppContext } from 'src/AppContext';

ScrollToTop.propTypes = {
  window: PropTypes.func
};

export default function ScrollToTop(props) {
  const { window } = props;
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [scrollProgress, setScrollProgress] = useState(0);
  const [trigger, setTrigger] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
      setScrollProgress(scrolled);
      setTrigger(winScroll > 100);
    };

    if (typeof globalThis.window !== 'undefined') {
      globalThis.window.addEventListener('scroll', handleScroll);
      return () => globalThis.window.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const handleClick = (event) => {
    const anchor = (event.target.ownerDocument || document).querySelector('#back-to-top-anchor');

    if (anchor) {
      anchor.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    } else {
      globalThis.window?.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  if (!trigger) {
    return null;
  }

  return (
    <div
      onClick={handleClick}
      role="presentation"
      className={cn(
        'fixed bottom-5 right-5 z-[1200] w-[42px] h-[42px] flex items-center justify-center',
        'rounded-xl cursor-pointer text-base font-normal overflow-hidden border-[1.5px]',
        'backdrop-blur-md transition-all duration-300',
        isDark
          ? 'bg-white/[0.04] border-white/[0.08] text-white/40 hover:bg-white/[0.04] hover:border-white/[0.08] hover:text-white/60'
          : 'bg-black/[0.04] border-black/[0.08] text-black/40 hover:bg-black/[0.08] hover:border-black/[0.08] hover:text-black/60'
      )}
      style={{
        background: `linear-gradient(to top, ${
          isDark ? 'rgba(16, 185, 129, 0.08)' : 'rgba(66, 133, 244, 0.08)'
        } ${scrollProgress}%, transparent ${scrollProgress}%)`
      }}
    >
      ↑
    </div>
  );
}
