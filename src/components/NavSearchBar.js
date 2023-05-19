import axios from 'axios';
import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  LazyLoadImage,
  LazyLoadComponent
} from 'react-lazy-load-image-component';

// Material
import {
  alpha,
  styled,
  useTheme,
  Avatar,
  Autocomplete,
  Box,
  CardMedia,
  IconButton,
  InputAdornment,
  Link,
  MenuItem,
  OutlinedInput,
  Stack,
  TextField,
  Tooltip,
  Typography
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CasinoIcon from '@mui/icons-material/Casino';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AnimationIcon from '@mui/icons-material/Animation';
import VerifiedIcon from '@mui/icons-material/Verified';

// Iconify
import { Icon } from '@iconify/react';
import searchFill from '@iconify/icons-eva/search-fill';

// Loader
import useDebounce from 'src/hooks/useDebounce';
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

const TokenImage = styled(LazyLoadImage)(({ theme }) => ({
  borderRadius: '50%',
  overflow: 'hidden'
}));

const HeaderWrapper = styled(Box)(
  ({ theme }) => `
    width: 100%;
    display: flex;
    align-items: center;
    height: ${theme.spacing(10)};
    margin-bottom: ${theme.spacing(0)};
    border-radius: 0px;
    border-bottom: 1px solid ${alpha('#CBCCD2', 0.2)};
`
);

function truncate(str, n) {
  if (!str) return '';
  //return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
  return str.length > n ? str.substr(0, n - 1) + '... ' : str;
}

const RenderOption = ({
  id,
  // issuer,
  name,
  // currency,
  date,
  amount,
  trustlines,
  vol24hxrp, // XRP amount with pair token
  vol24hx, // Token amount with pair XRP
  //vol24h,
  vol24htx,
  //holders,
  //offers,
  kyc,
  md5,
  slug,
  user,
  pro7d,
  pro24h,
  exch,
  ext,
  option_type,
  isOMCF
}) => {
  const BASE_URL = 'https://api.xrpl.to/api';

  // const imgUrl = `/static/tokens/${md5}.${ext}`;
  const imgUrl = `https://s1.xrpl.to/token/${md5}`;
  const link = `/token/${slug}`;

  const { darkMode } = useContext(AppContext);

  return (
    <Link
      underline="none"
      color="inherit"
      href={link}
      rel="noreferrer noopener nofollow"
      key={md5}
    >
      <MenuItem sx={{ pt: 1, pb: 1 }}>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          flex={2}
          sx={{ pl: 0, pr: 0 }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <TokenImage
              src={imgUrl} // use normal <img> attributes as props
              width={32}
              height={32}
              onError={(event) => (event.target.src = '/static/alt.webp')}
            />
            <Stack>
              <Typography
                variant="token"
                color={isOMCF !== 'yes' ? (darkMode ? '#fff' : '#222531') : ''}
                noWrap
              >
                {truncate(name, 8)}
              </Typography>
              <Typography
                variant="caption"
                color={isOMCF !== 'yes' ? (darkMode ? '#fff' : '#222531') : ''}
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

          <LazyLoadImage
            alt=""
            src={`${BASE_URL}/sparkline/${md5}?pro7d=${pro7d}`}
            width={108}
            height={36}
          />
        </Box>
      </MenuItem>
    </Link>
  );
};

const getOptionLabel = (option) => {
  if (option) {
    return option.name ?? '';
  }
  return '';
};

export default function NavSearchBar({
  id,
  placeholder,
  fullSearch,
  setFullSearch
}) {
  const theme = useTheme();
  const BASE_URL = 'https://api.xrpl.to/api';

  const [open, setOpen] = useState(fullSearch);
  const [options, setOptions] = useState([]);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 1000);

  const [loading, setLoading] = useState(false);

  const getData = (search) => {
    setLoading(true);
    const body = {
      search
    };
    // https://api.xrpl.to/api/search
    axios
      .post(`${BASE_URL}/search`, body)
      .then((res) => {
        try {
          if (res.status === 200 && res.data) {
            const ret = res.data;
            const newOptions = [];
            for (const token of ret.tokens) {
              token.option_type = 'TOKENS';
              newOptions.push(token);
            }
            setOptions(newOptions);

            // console.log(ret.tokens);
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
    getData(debouncedSearch);
  }, [debouncedSearch]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
  };

  const handleClear = (e) => {
    setSearch('');
  };

  const handleBack = (e) => {
    setFullSearch(false);
    setSearch('');
  };

  return (
    <Autocomplete
      freeSolo
      disableClearable
      selectOnFocus
      disablePortal
      // size="small"
      // clearOnBlur
      // handleHomeEndKeys
      id={id}
      sx={{
        // width: '100%',
        // zIndex: 10001,
        width: { xs: '100%', md: 340 },
        // width: fullSearch?'100%':340,
        // transition: theme.transitions.create(['width'], {
        //     easing: theme.transitions.easing.easeInOut,
        //     duration: theme.transitions.duration.shorter
        // }),
        // '&.Mui-focused': { width: fullSearch?'100%':340 },
        '&.MuiAutocomplete-root .MuiOutlinedInput-root': {
          paddingTop: 0.1,
          paddingBottom: 0.1
        },
        '&.MuiTextField-root': {
          marginTop: 1
        }
      }}
      open={open}
      onOpen={() => {
        setOpen(true);
      }}
      onClose={() => {
        setOpen(false);
      }}
      // isOptionEqualToValue={(option, value) => option.title === value.title}
      // groupBy={(option) => option.option_type}
      getOptionLabel={(option) => getOptionLabel(option)}
      options={options}
      renderOption={(props, option) => <RenderOption {...option} />}
      // renderGroup={(props, option) => <RenderGroup {...option} />}
      loading={loading}
      renderInput={(params) => {
        return (
          <TextField
            {...params}
            placeholder={placeholder}
            autoComplete="new-password"
            // margin='dense'
            value={search}
            onChange={handleSearch}
            InputProps={{
              ...params.InputProps,
              autoComplete: 'off',
              type: 'search',
              startAdornment: (
                <InputAdornment position="start" sx={{ mr: 0.7 }}>
                  {fullSearch ? (
                    <IconButton aria-label="back" onClick={handleBack}>
                      <ArrowBackIcon />
                    </IconButton>
                  ) : (
                    <Box
                      component={Icon}
                      icon={searchFill}
                      sx={{ color: 'text.disabled' }}
                    />
                  )}
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment
                  position="end"
                  // onClick={handleClear}
                >
                  {params.InputProps.endAdornment}
                  {/* {loading &&
                                        <ClipLoader color='#ff0000' size={15} />
                                    } */}
                </InputAdornment>
              )
            }}
          />
        );
      }}
    />
  );
}
