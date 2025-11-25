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
  const { themeName, accountProfile, openSnackbar, setLoading } = useContext(AppContext);
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
      // https://api.xrpl.to/api/watchlist/get_list?account=r22G1hNbxBVapj2zSmvjdXyKcedpSDKsm
      axios
        .get(`${BASE_URL}/watchlist/get_list?account=${account}`)
        .then((res) => {
          let ret = res.status === 200 ? res.data : undefined;
          if (ret) {
            setWatchList(ret.watchlist);
          }
        })
        .catch((err) => {
        })
        .then(function () {
          // always executed
        });
    }
    getWatchList();
  }, [accountProfile]);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const onChangeWatchList = async (md5) => {
    const account = accountProfile?.account;
    const accountToken = accountProfile?.token;

    if (!account || !accountToken) {
      openSnackbar('Please login!', 'error');
      return;
    }

    setLoading(true);
    try {
      let res;

      let action = 'add';

      if (watchList.includes(md5)) {
        action = 'remove';
      }

      const body = { md5, account, action };

      res = await axios.post(`${BASE_URL}/watchlist/update_watchlist`, body, {
        headers: { 'x-access-token': accountToken }
      });

      if (res.status === 200) {
        const ret = res.data;
        if (ret.status) {
          setWatchList(ret.watchlist);
          openSnackbar('Successful!', 'success');
        } else {
          const err = ret.err;
          openSnackbar(err, 'error');
        }
      }
    } catch (err) {
    }
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
