import { memo } from 'react';

const Common = memo(({ token }) => {
  // This component is now empty since ExtraDesc and ExtraButtons have been removed
  // The functionality has been moved to the TokenSummary component
  return null;
});

Common.displayName = 'Common';

export default Common;
