import api from 'src/utils/api';
import { useState, useEffect, useContext } from 'react';
import { ThemeContext, WalletContext, AppContext } from 'src/context/AppContext';
import { cn } from 'src/utils/cn';
import { CheckCircle, X, Repeat, Clock, MessageCircle } from 'lucide-react';
import { FadeLoader, PuffLoader, PulseLoader } from '../components/Spinners';
import Decimal from 'decimal.js-light';

// Utils
import { checkExpiration, formatDateTime } from 'src/utils/formatters';
import { normalizeAmount } from 'src/utils/parseUtils';

// Components
import CountdownTimer from './CountDownTimer';

export default function OffersList({ nft, offers, handleAcceptOffer, handleCancelOffer, isSell }) {
  const { themeName } = useContext(ThemeContext);
  const { accountProfile } = useContext(WalletContext);
  const { openSnackbar, sync, setSync } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const accountLogin = accountProfile?.account;
  const accountToken = accountProfile?.token;

  const isOwner = accountLogin === nft.account;
  const [loading, setLoading] = useState(false);

  return (
    <div
      className={cn(
        'rounded-xl border-[1.5px] p-4',
        isDark ? 'border-white/10 bg-black' : 'border-gray-200 bg-white'
      )}
    >
      {offers && offers.length === 0 && (
        <div className={cn("my-4 text-center text-[13px] font-normal", isDark ? 'text-white/60' : 'text-gray-500')}>
          No offers available at the moment
        </div>
      )}

      <div className="flex flex-col gap-4">
        {offers.map((offer, idx) => {
          const price = normalizeAmount(offer.amount);
          let priceAmount = price.amount;
          if (priceAmount < 1) {
          } else {
            priceAmount = new Decimal(price.amount).toDP(2, Decimal.ROUND_DOWN).toNumber();
          }

          const expired = checkExpiration(offer.expiration);

          return (
            <div
              key={offer.nft_offer_index}
              className={cn(
                'rounded-lg border-[1.5px] p-3',
                isDark ? 'border-white/10' : 'border-gray-200'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full text-[15px] font-normal uppercase',
                      isDark ? 'bg-primary/10 text-primary' : 'bg-primary/20 text-primary'
                    )}
                  >
                    {offer.owner.charAt(0)}
                  </div>
                  <div>
                    <div className="text-[15px] font-normal text-primary">
                      {priceAmount} {price.name}
                    </div>
                    <div className="flex items-center gap-1">
                      <a
                        href={`https://xrpl.to/address/${offer.owner}`}
                        rel="noreferrer noopener nofollow"
                        className={cn(
                          'break-all text-[11px] font-normal hover:underline',
                          isDark ? 'text-white/60' : 'text-gray-600'
                        )}
                      >
                        {offer.owner.slice(0,6)}...{offer.owner.slice(-4)}
                      </a>
                      {offer.owner !== accountLogin && (
                        <button
                          onClick={() => window.dispatchEvent(new CustomEvent('openDm', { detail: { user: offer.owner } }))}
                          className={cn('p-0.5 rounded hover:bg-white/10', isDark ? 'text-white/60 hover:text-[#650CD4]' : 'text-gray-400 hover:text-[#650CD4]')}
                          title="Message"
                        >
                          <MessageCircle size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action buttons placeholder */}
                <div className="flex gap-2">
                  {/* Add action buttons here based on your logic */}
                </div>
              </div>

              {offer.destination && (
                <div className="mt-2 flex items-center gap-2">
                  <Repeat size={14} className={isDark ? 'text-white/60' : 'text-gray-400'} />
                  <div
                    className={cn(
                      'text-[11px] font-normal',
                      isDark ? 'text-white/60' : 'text-gray-600'
                    )}
                  >
                    {offer.destination}
                  </div>
                </div>
              )}

              {offer.expiration && (
                <div className="mt-2 flex items-center gap-2">
                  <Clock size={14} className={isDark ? 'text-white/60' : 'text-gray-400'} />
                  <div
                    className={cn(
                      'text-[11px] font-normal',
                      isDark ? 'text-white/60' : 'text-gray-600'
                    )}
                  >
                    {expired ? 'Expired' : 'Expires'} on {formatDateTime(offer.expiration * 1000)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
