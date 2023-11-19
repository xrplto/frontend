import axios from 'axios';
import * as React from 'react';
import { useState, useEffect, useContext, useCallback } from 'react';
import { Link, MenuItem, Stack, Typography } from '@mui/material';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import { Icon } from '@iconify/react';
import searchFill from '@iconify/icons-eva/search-fill';
import {
  alpha,
  styled,
  useTheme,
  Avatar,
  Autocomplete,
  Box,
  IconButton,
  InputAdornment,
  TextField,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import useDebounce from 'src/hooks/useDebounce';
import { AppContext } from 'src/AppContext';

const BASE_URL = process.env.API_URL;

const TokenImage = styled(LazyLoadImage)(({ theme }) => ({
  borderRadius: '50%',
  overflow: 'hidden',
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
  return str.length > n ? str.substr(0, n - 1) + '... ' : str;
}

const RenderOption = React.memo(
  ({
    id,
    name,
    date,
    amount,
    trustlines,
    vol24hxrp,
    vol24hx,
    kyc,
    md5,
    slug,
    user,
    pro7d,
    pro24h,
    exch,
    ext,
    option_type,
    isOMCF,
  }) => {
    const imgUrl = `https://s1.xrpl.to/token/${md5}`;
    const link = `/token/${slug}?fromSearch=1`;
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
                src={imgUrl}
                width={32}
                height={32}
                onError={(event) => (event.target.src = '/static/alt.webp')}
              />
              <Stack>
                <Typography
                  variant="token"
                  color={isOMCF !== 'yes'
                  ? darkMode
                    ? '#fff'
                    : '#222531'
                  : darkMode
                    ? '#007B55'
                    : '#5569ff'}
                  noWrap
                >
                  {truncate(user, 8)}
                </Typography>
                <Typography
                  variant="caption"
                  color={isOMCF !== 'yes' ? (darkMode ? '#fff' : '#222531') : ''}
                  noWrap
                >
                  {truncate(name, 13)}
                  {kyc && (
                    <Typography variant="kyc" sx={{ ml: 0.2 }}>
                      KYC
                    </Typography>
                  )}
                </Typography>
              </Stack>
            </Stack>

            <LazyLoadImage
              alt={`${user} ${name} 7D Price Graph`}
              src={`${BASE_URL}/sparkline/${md5}?pro7d=${pro7d}`}
              width={108}
              height={36}
            />
          </Box>
        </MenuItem>
      </Link>
    );
  }
);

const getOptionLabel = (option) => {
  if (option) {
    return option.name ?? '';
  }
  return '';
};

const NavSearchBar = React.memo(
  ({ id, placeholder, fullSearch, setFullSearch }) => {
    const theme = useTheme();
    const [open, setOpen] = useState(fullSearch);
    const [options, setOptions] = useState([]);
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 1000);
    const [loading, setLoading] = useState(false);

    const getData = useCallback((search) => {
      setLoading(true);
      const body = {
        search,
      };

      axios
        .post(`${BASE_URL}/search`, body)
        .then((res) => {
          try {
            if (res.status === 200 && res.data) {
              const ret = res.data;
              const newOptions = ret.tokens.map((token) => ({
                ...token,
                option_type: 'TOKENS',
              }));
              setOptions(newOptions);
            }
          } catch (error) {
            console.log(error);
          }
        })
        .catch((err) => {
          console.log('err->>', err);
        })
        .finally(() => {
          setLoading(false);
        });
    }, []);

    useEffect(() => {
      getData(debouncedSearch);
    }, [debouncedSearch, getData]);

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
        id={id}
        sx={{
          width: { xs: '100%', md: 340 },
          '&.MuiAutocomplete-root .MuiOutlinedInput-root': {
            paddingTop: 0.1,
            paddingBottom: 0.1,
          },
          '&.MuiTextField-root': {
            marginTop: 1,
          },
        }}
        open={open}
        onOpen={() => {
          setOpen(true);
        }}
        onClose={() => {
          setOpen(false);
        }}
        getOptionLabel={(option) => getOptionLabel(option)}
        options={options}
        filterOptions={(options) => options}
        renderOption={(props, option) => <RenderOption {...option} />}
        loading={loading}
        renderInput={(params) => {
          return (
            <TextField
              {...params}
              placeholder={placeholder}
              autoComplete="new-password"
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
                endAdornment: <InputAdornment position="end" />,
              }}
            />
          );
        }}
      />
    );
  }
);

export default NavSearchBar;
