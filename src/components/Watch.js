import axios from 'axios';
import { useState, useEffect } from 'react';

// Material
import { useTheme, Chip, Tooltip, IconButton, Button, alpha } from '@mui/material';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import StarRateIcon from '@mui/icons-material/StarRate';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// ----------------------------------------------------------------------
export default function Watch({ collection }) {
  const BASE_URL = 'https://api.xrpl.to/api'; //process.env.API_URL;
  const theme = useTheme();
  const { accountProfile, openSnackbar, setLoading, darkMode } = useContext(AppContext);

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
    <Button
      variant="outlined"
      size="small"
      startIcon={watchList.includes(md5) ? <StarRateIcon sx={{ fontSize: '14px' }} /> : <StarOutlineIcon sx={{ fontSize: '14px' }} />}
      onClick={() => onChangeWatchList(md5)}
      sx={{
        textTransform: 'none',
        fontSize: '12px',
        py: 0.5,
        px: 1.2,
        borderRadius: '6px',
        borderColor: alpha(theme.palette.divider, 0.2),
        color: 'text.secondary',
        '&:hover': { borderColor: alpha(theme.palette.divider, 0.3), backgroundColor: 'transparent' }
      }}
    >
      {watchList.includes(md5) ? 'Following' : 'Follow'}
    </Button>
  );
}
