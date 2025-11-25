import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
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
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const { status, costs } = nft;

  return (
    <div className={cn(
      "grid gap-4 mb-0 max-w-[1300px] mx-auto items-start",
      "grid-cols-1 md:grid-cols-12"
    )}>
      <div className="md:col-span-4">
        <NFTDetails nft={nft} />
      </div>
      <div className="md:col-span-8">
        {status === NFToken.SELL_WITH_MINT_BULK ? (
          <NFTActionsBulk nft={nft} />
        ) : (
          <NFTActions nft={nft} />
        )}
      </div>
    </div>
  );
}
