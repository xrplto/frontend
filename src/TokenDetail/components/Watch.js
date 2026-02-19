import api from 'src/utils/api';
import { useState, useEffect, useContext } from 'react';
import { ThemeContext, WalletContext, AppContext } from 'src/context/AppContext';
import { Bookmark } from 'lucide-react';
import { cn } from 'src/utils/cn';

export default function Watch({ token, className }) {
  const BASE_URL = 'https://api.xrpl.to/v1';
  const { themeName } = useContext(ThemeContext);
  const { accountProfile, setOpenWalletModal } = useContext(WalletContext);
  const { openSnackbar, setLoading } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const [watchList, setWatchList] = useState([]);
  const { md5 } = token;
  const isActive = watchList.includes(md5);

  useEffect(() => {
    const account = accountProfile?.account;
    if (!account) {
      setWatchList([]);
      return;
    }
    api
      .get(`${BASE_URL}/watchlist?account=${account}`)
      .then((res) => {
        if (res.status === 200 && res.data.success) {
          setWatchList(res.data.watchlist || []);
        }
      })
      .catch(() => { });
  }, [accountProfile]);

  const onChangeWatchList = async () => {
    const account = accountProfile?.account;

    if (!account) {
      setOpenWalletModal(true);
      return;
    }

    setLoading(true);
    try {
      const action = isActive ? 'remove' : 'add';
      const res = await api.post(`${BASE_URL}/watchlist`, { md5, account, action });

      if (res.status === 200 && res.data.success) {
        setWatchList(res.data.watchlist || []);
        openSnackbar('Watchlist updated!', 'success');
      } else {
        openSnackbar('Failed to update', 'error');
      }
    } catch (err) { }
    setLoading(false);
  };

  return (
    <button
      onClick={onChangeWatchList}
      className={cn(
        'flex items-center justify-center gap-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-[opacity,transform,background-color,border-color] duration-200',
        isActive
          ? 'border-amber-500/30 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20'
          : isDark
            ? 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06] text-white/60 hover:text-white/80'
            : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700',
        className
      )}
    >
      <Bookmark
        size={12}
        className={cn(isActive && 'fill-current')}
      />
      {isActive ? 'Watching' : 'Watch'}
    </button>
  );
}
