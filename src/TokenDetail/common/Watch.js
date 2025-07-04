import axios from 'axios';
import { useState, useEffect } from 'react';

// Material
import { useTheme, Chip, Tooltip, IconButton, styled, alpha, useMediaQuery } from '@mui/material';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import StarRateIcon from '@mui/icons-material/StarRate';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

const WatchButton = styled(IconButton)(({ theme }) => {
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return {
    position: 'relative',
    borderRadius: '8px',
    border: `2px solid ${alpha(theme.palette.divider, 0.1)}`,
    background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(
      theme.palette.background.paper,
      0.7
    )} 100%)`,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
    boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}`,
    padding: isMobile ? '4px' : '6px',
    minWidth: isMobile ? '32px' : '36px',
    minHeight: isMobile ? '32px' : '36px',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `linear-gradient(135deg, ${alpha(theme.palette.warning.main, 0.08)} 0%, ${alpha(
        theme.palette.warning.light,
        0.05
      )} 100%)`,
      opacity: 0,
      transition: 'opacity 0.3s ease',
      zIndex: -1
    },
    '&:hover': {
      transform: 'translateY(-4px) scale(1.02)',
      border: `2px solid ${alpha(theme.palette.warning.main, 0.3)}`,
      boxShadow: `0 16px 48px ${alpha(theme.palette.common.black, 0.12)}, 0 4px 16px ${alpha(
        theme.palette.warning.main,
        0.1
      )}`,
      '&::before': {
        opacity: 1
      },
      '& .MuiSvgIcon-root': {
        color: theme.palette.warning.main
      }
    },
    '&:active': {
      transform: 'translateY(-2px) scale(0.98)'
    },
    '& .MuiSvgIcon-root': {
      fontSize: isMobile ? '16px' : '18px',
      color: alpha(theme.palette.text.primary, 0.8),
      transition: 'color 0.3s ease'
    }
  };
});

// ----------------------------------------------------------------------
export default function Watch({ token }) {
  const BASE_URL = process.env.API_URL;
  const theme = useTheme();
  const { accountProfile, openSnackbar, setLoading, darkMode } = useContext(AppContext);

  const [watchList, setWatchList] = useState([]);

  const { name, ext, md5, exch } = token;

  let user = token.user;
  if (!user) user = name;

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
          console.log('Error on getting watchlist!', err);
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
      console.log(err);
    }
    setLoading(false);
  };

  return (
    <>
      {watchList.includes(md5) ? (
        <Tooltip title="Remove from Watchlist">
          <WatchButton
            size="small"
            onClick={() => {
              onChangeWatchList(md5);
            }}
          >
            <StarRateIcon sx={{ color: '#F6B87E', fontSize: '18px' }} />
          </WatchButton>
        </Tooltip>
      ) : (
        <Tooltip title="Add to Watchlist and follow token">
          <WatchButton
            size="small"
            onClick={() => {
              onChangeWatchList(md5);
            }}
          >
            <StarOutlineIcon sx={{ fontSize: '18px' }} />
          </WatchButton>
        </Tooltip>
      )}
    </>
  );
}
