import axios from 'axios';
import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { cn } from 'src/utils/cn';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// ----------------------------------------------------------------------
export default function Watch({ collection }) {
  const BASE_URL = 'https://api.xrpl.to/api'; //process.env.API_URL;
  const { themeName, accountProfile, openSnackbar, setLoading, setOpenWalletModal } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const [watchList, setWatchList] = useState([]);

  const { _id: md5 } = collection;

  //let user = token.user;
  //if (!user) user = name;

  useEffect(() => {
    function getWatchList() {
      const account = accountProfile?.account;
      if (!account) {
        setWatchList([]);
        return;
      }
      axios
        .get(`${BASE_URL}/watchlist?account=${account}`)
        .then((res) => {
          if (res.status === 200 && res.data.result === 'success') {
            setWatchList(res.data.watchlist || []);
          }
        })
        .catch(() => {});
    }
    getWatchList();
  }, [accountProfile]);

  const onChangeWatchList = async (md5) => {
    const account = accountProfile?.account;

    if (!account) {
      setOpenWalletModal(true);
      return;
    }

    setLoading(true);
    try {
      const action = watchList.includes(md5) ? 'remove' : 'add';
      const res = await axios.post(`${BASE_URL}/watchlist`, { md5, account, action });

      if (res.status === 200 && res.data.result === 'success') {
        setWatchList(res.data.watchlist || []);
        openSnackbar('Watchlist updated!', 'success');
      } else {
        openSnackbar('Failed to update', 'error');
      }
    } catch (err) {}
    setLoading(false);
  };

  return (
    <button
      onClick={() => onChangeWatchList(md5)}
      className={cn(
        "flex items-center gap-1.5 rounded-lg border-[1.5px] px-3 py-1 text-[11px] font-normal transition-colors",
        isDark
          ? "border-white/10 text-white/60 hover:border-white/20 hover:text-white"
          : "border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-900"
      )}
    >
      <Star
        size={14}
        className={cn(
          watchList.includes(md5) && "fill-current"
        )}
      />
      {watchList.includes(md5) ? 'Following' : 'Follow'}
    </button>
  );
}
