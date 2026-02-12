import { useContext } from 'react';
import { ThemeContext } from 'src/context/AppContext';
import { cn } from 'src/utils/cn';

// Constants
const NFToken = {
  SELL_WITH_MINT_BULK: 'SELL_WITH_MINT_BULK',
  BURNT: 'BURNT'
};

// Components
import NFTDetails from './NFTDetails';
import NFTActions from './NFTActions';
import NFTActionsBulk from '../NFTCollection/NFTActionsBulk';

export default function Detail({ nft }) {
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const { status, costs } = nft;

  return (
    <div
      className={cn(
        'grid gap-6 mb-0 max-w-[1400px] mx-auto items-start',
        'grid-cols-1 lg:grid-cols-12'
      )}
    >
      <div className="lg:col-span-5">
        <NFTDetails nft={nft} />
      </div>
      <div className="lg:col-span-7">
        {status === NFToken.SELL_WITH_MINT_BULK ? (
          <NFTActionsBulk nft={nft} />
        ) : (
          <NFTActions nft={nft} />
        )}
      </div>
    </div>
  );
}
