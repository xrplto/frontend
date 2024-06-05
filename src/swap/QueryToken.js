import React, { useContext } from 'react';
import axios from 'axios';
import { useState, useEffect, useRef } from 'react';
import { ClipLoader } from 'react-spinners';
import {
  LazyLoadImage,
  LazyLoadComponent
} from 'react-lazy-load-image-component';

// Material
import {
  styled,
  Avatar,
  IconButton,
  InputAdornment,
  Link,
  MenuItem,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';

// Iconify
import { Icon } from '@iconify/react';
import rippleSolid from '@iconify/icons-teenyicons/ripple-solid';

// Utils
import { fNumber } from 'src/utils/formatNumber';
import { XRP_TOKEN, USD_TOKEN } from 'src/utils/constants';
import { AppContext } from 'src/AppContext';
import CurrencySearchModal from 'src/components/CurrencySearchModal';

const TokenImage = styled(LazyLoadImage)(({ theme }) => ({
  borderRadius: '50%',
  overflow: 'hidden'
}));

const CustomSelect = styled(Select)(({ theme }) => ({
  '& .MuiOutlinedInput-notchedOutline': {
    border: 'none'
  },
  '& .MuiOutlinedInput-input': {
    paddingLeft: 0,
    paddingTop: 10,
    paddingBottom: 3
  }
}));

function truncate(str, n) {
  if (!str) return '';
  //return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
  return str.length > n ? str.substr(0, n - 1) + '... ' : str;
}

export default function QueryToken({ token, onChangeToken }) {
  const BASE_URL = process.env.API_URL;
  const { darkMode } = useContext(AppContext);

  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const [tokens, setTokens] = useState([XRP_TOKEN, USD_TOKEN]);
  const [filter, setFilter] = useState('');

  const onDismiss = () => {
    setOpen(false);
  }

  const loadTokens = () => {
    setLoading(true);
    // https://api.xrpl.to/api/xrpnft/tokens?filter=
    axios
      .get(`${BASE_URL}/xrpnft/tokens?filter=${filter}`)
      .then((res) => {
        try {
          if (res.status === 200 && res.data) {
            const ret = res.data;

            const exist = (ret.tokens || []).find((t) => t.md5 === token.md5);

            if (exist) {
              setTokens(ret.tokens);
            } else {
              const newTokens = [token].concat(ret.tokens);
              setTokens(newTokens);
            }
            // if (ret.tokens.length > 0)
            //     setTokens(ret.tokens);
          }
        } catch (error) {
          console.log(error);
        }
      })
      .catch((err) => {
        console.log('err->>', err);
      })
      .then(function () {
        // Always executed
        setLoading(false);
      });
  };

  useEffect(() => {
    loadTokens();
  }, [filter]);

  const handleChangeToken = (e) => {
    const value = e.target.value;

    const newToken = tokens.find((t) => t.md5 === value);
    if (newToken) {
      onChangeToken(newToken);
    }
  };

  const handleChangeFilter = (e) => {
    setFilter(e.target.value);
  };

  const { md5, name, user, kyc, isOMCF } = token;
  const imgUrl = `https://s1.xrpl.to/token/${md5}`;

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1}
        sx={{ p: 0, cursor: "pointer", '&:hover': { opacity: 0.8} }}
        onClick={() => setOpen(true)}
      >
        <TokenImage
          src={imgUrl} // use normal <img> attributes as props
          width={48}
          height={48}
          onError={(event) => (event.target.src = '/static/alt.webp')}
        />
        <Stack>
          <Typography
            variant="token"
            color={
              // isOMCF !== 'yes' ? (darkMode ? '#fff' : '#222531') : ''
              isOMCF !== 'yes'
                ? darkMode
                  ? '#fff'
                  : '#222531'
                : darkMode
                  ? '#007B55'
                  : '#4E8DF4'
            }
            noWrap
          >
            {truncate(name, 8)}
          </Typography>
          <Typography
            variant="caption"
            color={
              isOMCF !== 'yes' ? (darkMode ? '#fff' : '#222531') : ''
            }
            noWrap
          >
            {truncate(user, 13)}
            {kyc && (
              <Typography variant="kyc" sx={{ ml: 0.2 }}>
                KYC
              </Typography>
            )}
          </Typography>
          {/* <Typography variant="small" color={isOMCF!=='yes'?'#222531':''}>{date}</Typography> */}
        </Stack>
      </Stack>

      <CurrencySearchModal token={token} open={open} onDismiss={onDismiss} onChangeToken={onChangeToken} />
    </>
  );
}
