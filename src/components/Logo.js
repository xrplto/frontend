function Logo({ asLink = true, style }) {
  const w = parseInt(style?.width) || 100;
  const h = style?.height === 'auto' ? Math.round(w * 0.36) : parseInt(style?.height) || 36;

  const imgProps = {
    alt: 'XRPL.to',
    width: w,
    height: h,
    fetchPriority: 'high',
    decoding: 'async',
    style: { width: `${w}px`, height: `${h}px`, objectFit: 'contain' }
  };

  const imgElement = (
    <>
      <img src="/logo/xrpl-to-logo-black.svg" {...imgProps} className="dark:hidden" />
      <img src="/logo/xrpl-to-logo-white.svg" {...imgProps} className="hidden dark:block" />
    </>
  );

  if (!asLink) return imgElement;

  return (
    <a href="/" className="inline-flex cursor-pointer items-center">
      {imgElement}
    </a>
  );
}

export default Logo;
