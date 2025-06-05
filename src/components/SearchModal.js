import {
  Avatar,
  Box,
  Button,
  CardMedia,
  IconButton,
  InputBase,
  Link,
  MenuItem,
  MenuList,
  Paper,
  Stack,
  styled,
  ToggleButton,
  ToggleButtonGroup,
  toggleButtonGroupClasses,
  Typography,
  alpha,
  useTheme
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import CasinoIcon from '@mui/icons-material/Casino';
import AnimationIcon from '@mui/icons-material/Animation';
import VerifiedIcon from '@mui/icons-material/Verified';
import Tooltip from '@mui/material/Tooltip';

import { useContext, useEffect, useRef, useState } from 'react';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import axios from 'axios';
import { AppContext } from 'src/AppContext';
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';
import NumberTooltip from './NumberTooltip';
import { currencySymbols } from 'src/utils/constants';
import { fNumberWithCurreny } from 'src/utils/formatNumber';
import BearBullLabel from './BearBullLabel';
import useDebounce from 'src/hooks/useDebounce';

const BASE_URL = process.env.API_URL;
const NFT_BASE_URL = 'https://api.xrpnft.com/api';

const TokenImage = styled(LazyLoadImage)(({ theme }) => ({
  borderRadius: '12px',
  overflow: 'hidden',
  aspectRatio: '1',
  objectFit: 'cover'
}));

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  [`& .${toggleButtonGroupClasses.grouped}`]: {
    margin: theme.spacing(0.5),
    border: 0,
    borderRadius: theme.shape.borderRadius,
    padding: '10px',
    [`&.${toggleButtonGroupClasses.disabled}`]: {
      border: 0
    }
  },
  [`& .${toggleButtonGroupClasses.middleButton},& .${toggleButtonGroupClasses.lastButton}`]: {
    marginLeft: -1,
    borderLeft: '1px solid transparent'
  }
}));

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.substr(0, n - 1) + '... ' : str;
}

const NFTRender = ({
  option_type,
  logoImage,
  logo,
  name,
  verified,
  items,
  type,
  slug,
  darkMode,
  addRecentSearchItem
}) => {
  const [hLink, setHLink] = useState('');
  const [isVideo, setIsVideo] = useState(false);
  const [imgUrl, setImgUrl] = useState('');

  const initOption = () => {
    logoImage && setImgUrl(`https://s1.xrpnft.com/collection/${logoImage}`);
    setHLink(`/collection/${slug}`);
  };

  useEffect(() => {
    initOption();
  }, [slug]);

  return (
    <Link
      color="inherit"
      underline="none"
      href={hLink}
      onClick={() => addRecentSearchItem(name, '', imgUrl, hLink)}
    >
      <MenuItem sx={{ pt: 1, pb: 1, px: 1, height: '50px' }}>
        <Stack direction="row" spacing={1} alignItems="center">
          {
            <Avatar
              alt="X"
              variant={logo ? '' : 'circular'}
              sx={{
                backgroundColor: '#00000000',
                width: '24px',
                height: '24px'
              }}
            >
              <CardMedia component={isVideo ? 'video' : 'img'} src={imgUrl} alt="X" />
            </Avatar>
          }
          <Typography variant="token" color={darkMode ? '#fff' : '#222531'} noWrap>
            {truncate(name, 8)}
          </Typography>
          {option_type === 'COLLECTIONS' && (
            <>
              {verified === 'yes' && (
                <Tooltip title="Verified">
                  <VerifiedIcon fontSize="small" style={{ color: '#4589ff' }} />
                </Tooltip>
              )}
              {type === 'random' && (
                <Tooltip title="Random Collection">
                  <CasinoIcon color="info" fontSize="small" />
                </Tooltip>
              )}
              {type === 'sequence' && (
                <Tooltip title="Sequence Collection">
                  <AnimationIcon color="info" fontSize="small" />
                </Tooltip>
              )}
              <Typography variant="s7">{items} items</Typography>
            </>
          )}
        </Stack>
      </MenuItem>
    </Link>
  );
};

export default function SearchModal({ onClose, open }) {
  const { darkMode, activeFiatCurrency } = useContext(AppContext);
  const theme = useTheme();
  const metrics = useSelector(selectMetrics);
  const exchRate = metrics[activeFiatCurrency];

  const [tokens, setTokens] = useState([]);
  const [collections, setCollections] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(false);
  const debouncedSearch = useDebounce(search, 1000);

  const inputRef = useRef(null);
  const modalRef = useRef(null);

  const getData = (search) => {
    setLoading(true);
    const body = {
      search
    };

    axios
      .post(`${BASE_URL}/search`, body)
      .then((res) => {
        try {
          if (res.status === 200 && res.data) {
            const ret = res.data;
            const newOptions = ret.tokens.map((token) => ({
              ...token,
              option_type: 'TOKENS'
            }));
            setTokens(newOptions);
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
  };

  const getNFTs = (search) => {
    const body = {
      search,
      type: 'SEARCH_ITEM_COLLECTION_ACCOUNT'
    };

    axios
      .post(`${NFT_BASE_URL}/search`, body)
      .then((res) => {
        try {
          if (res.status === 200 && res.data) {
            const ret = res.data;
            setCollections(ret.collections);
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
    getNFTs(debouncedSearch);
  }, [debouncedSearch]);

  useEffect(() => {
    if (!search.length) setActiveTab('all');
  }, [search]);

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        handleClose();
      }
    };

    if (open) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [handleClose, open]);

  useEffect(() => {
    if (window !== undefined) {
      let recentSearches = JSON.parse(window.localStorage.getItem('recent-search'));
      if (recentSearches) {
        setSearchHistory(recentSearches.reverse());
      }
    }
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const addRecentSearchItem = (name, user, img, link) => {
    let recentSearches = JSON.parse(window.localStorage.getItem('recent-search'));
    if (recentSearches) {
      recentSearches.push({
        name,
        user,
        img,
        link
      });

      window.localStorage.setItem('recent-search', JSON.stringify(recentSearches));
    } else {
      const newSearch = [
        {
          name,
          user,
          img,
          link
        }
      ];

      window.localStorage.setItem('recent-search', JSON.stringify(newSearch));
    }
  };

  if (!open) return null;

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.common.black,
            0.6
          )} 0%, ${alpha(theme.palette.common.black, 0.4)} 100%)`,
          backdropFilter: 'blur(8px)',
          zIndex: 12000,
          opacity: open ? 1 : 0,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
        onClick={handleClose}
      />
      <Paper
        elevation={6}
        sx={{
          width: '100%',
          maxWidth: '800px',
          position: 'fixed',
          left: '50%',
          top: open ? '20%' : '10%',
          transform: 'translateX(-50%)',
          p: 4,
          zIndex: 12001,
          opacity: open ? 1 : 0,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          borderRadius: '24px',
          background: `linear-gradient(135deg, ${alpha(
            theme.palette.background.paper,
            0.95
          )} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
          backdropFilter: 'blur(20px)',
          border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
          boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}, 0 2px 8px ${alpha(
            theme.palette.primary.main,
            0.04
          )}`,
          maxHeight: '70vh',
          overflowY: 'auto',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '2px',
            background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main}, ${theme.palette.info.main})`,
            opacity: 0.8
          },
          '@media (max-width: 600px)': {
            width: '95vw',
            maxWidth: '95vw',
            left: '50%',
            top: open ? '15%' : '5%',
            transform: 'translateX(-50%)',
            p: 3
          }
        }}
        ref={modalRef}
      >
        <Paper
          component="form"
          sx={{
            p: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.background.paper,
              0.8
            )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
            backdropFilter: 'blur(10px)',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
            borderRadius: '16px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: '-100%',
              width: '100%',
              height: '100%',
              background: `linear-gradient(90deg, transparent, ${alpha(
                theme.palette.primary.main,
                0.1
              )}, transparent)`,
              transition: 'left 0.5s ease'
            },
            '&:hover': {
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.08)}`,
              '&::before': {
                left: '100%'
              }
            },
            '&:focus-within': {
              border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
              boxShadow: `0 4px 20px ${alpha(theme.palette.primary.main, 0.12)}`
            }
          }}
        >
          <SearchIcon
            sx={{
              color: theme.palette.primary.main,
              fontSize: '1.3rem',
              transition: 'color 0.2s ease'
            }}
          />
          <InputBase
            placeholder="Search token, nft, issuer address"
            fullWidth
            sx={{
              ml: 1.5,
              flex: 1,
              '& input': {
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 500,
                color: theme.palette.text.primary,
                '&::placeholder': {
                  color: theme.palette.text.secondary,
                  opacity: 0.8
                }
              }
            }}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            inputRef={inputRef}
            autoFocus
          />
          <IconButton
            size="small"
            onClick={handleClose}
            sx={{
              color: theme.palette.text.secondary,
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.background.paper,
                0.6
              )} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`,
              backdropFilter: 'blur(10px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              borderRadius: '10px',
              p: 1,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                background: `linear-gradient(135deg, ${alpha(
                  theme.palette.error.main,
                  0.08
                )} 0%, ${alpha(theme.palette.error.main, 0.03)} 100%)`,
                border: `1px solid ${alpha(theme.palette.error.main, 0.15)}`,
                color: theme.palette.error.main,
                transform: 'scale(1.05)'
              }
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Paper>

        {search.length > 0 && (
          <StyledToggleButtonGroup
            color="primary"
            value={activeTab}
            exclusive
            onChange={(_, newValue) => {
              if (newValue !== null) {
                setActiveTab(newValue);
              }
            }}
            aria-label="search filters"
            sx={{
              mt: 3,
              mb: 2,
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.background.paper,
                0.6
              )} 0%, ${alpha(theme.palette.background.paper, 0.3)} 100%)`,
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '4px',
              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              boxShadow: `inset 0 2px 4px ${alpha(theme.palette.common.black, 0.06)}`,
              '& .MuiToggleButton-root': {
                border: 'none',
                borderRadius: '12px !important',
                px: 3,
                py: 1,
                typography: 'body2',
                fontWeight: 500,
                color: alpha(theme.palette.text.secondary, 0.8),
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                '&.Mui-selected': {
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.primary.main,
                    0.15
                  )} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                  boxShadow: `0 4px 12px ${alpha(
                    theme.palette.primary.main,
                    0.15
                  )}, 0 2px 4px ${alpha(theme.palette.common.black, 0.1)}`,
                  transform: 'translateY(-1px)',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '2px',
                    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`,
                    borderRadius: '12px 12px 0 0'
                  }
                },
                '&:hover': {
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.primary.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
                  color: theme.palette.primary.main,
                  transform: 'translateY(-1px)'
                }
              }
            }}
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="token">Cryptoassets</ToggleButton>
            <ToggleButton value="nft">NFTs</ToggleButton>
          </StyledToggleButtonGroup>
        )}

        {tokens.length > 0 && (
          <Stack
            mt={2}
            spacing={1}
            sx={{ display: activeTab === 'token' || activeTab === 'all' ? 'flex' : 'none' }}
          >
            <Stack direction="row" alignItems="center" sx={{ px: 1 }} spacing={1}>
              <Typography variant="subtitle2" fontWeight={600}>
                {`${!search ? 'Trending ' : ''}Tokens`}
              </Typography>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                height="16px"
                width="16px"
                viewBox="0 0 24 24"
                color="#FF775F"
              >
                <path d="M17.0881 9.42254C16.4368 8.90717 15.8155 8.35512 15.3012 7.71336C12.3755 4.06357 13.8912 1 13.8912 1C8.46026 3.18334 7.22337 6.64895 7.16462 9.22981L7.1675 9.2572C7.1675 9.2572 7.21498 10.7365 7.90791 12.3625C8.12481 12.8713 7.88299 13.4666 7.33195 13.6199C6.87638 13.7465 6.40822 13.5317 6.21571 13.1314C5.90413 12.4831 5.49262 11.4521 5.6109 10.7249C4.75064 11.817 4.1815 13.1452 4.03542 14.6184C3.65092 18.4924 6.43759 22.0879 10.4208 22.8488C14.9906 23.7217 19.3121 20.7182 19.9269 16.3623C20.3117 13.6367 19.1498 11.0538 17.0881 9.42254ZM14.3578 17.7393C14.3289 17.776 13.5893 18.6597 12.3501 18.7517C12.2829 18.7547 12.2124 18.7577 12.1452 18.7577C11.2902 18.7577 10.4226 18.3682 9.56103 17.5951L9.37219 17.4262L9.61243 17.3372C9.62843 17.3312 11.2742 16.7236 11.6778 15.4077C11.8155 14.9629 11.7707 14.4566 11.553 13.9842C11.2905 13.4075 10.7845 11.9564 11.7453 10.9041L11.9309 10.7015L12.0206 10.9561C12.0238 10.9714 12.6034 12.5911 13.9741 13.4379C14.3871 13.6957 14.6977 14.0086 14.8931 14.3644C15.2959 15.1132 15.533 16.3065 14.3578 17.7393Z" />
              </svg>
            </Stack>
            <MenuList
              sx={{
                p: 1.5,
                maxHeight: search.length > 0 ? '465px' : 'auto',
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px',
                '&::-webkit-scrollbar': {
                  width: '8px',
                  borderRadius: '4px'
                },
                '&::-webkit-scrollbar-thumb': {
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.success.main,
                    0.3
                  )} 0%, ${alpha(theme.palette.success.main, 0.1)} 100%)`,
                  borderRadius: '4px',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                },
                '&::-webkit-scrollbar-track': {
                  background: alpha(theme.palette.background.paper, 0.3),
                  borderRadius: '4px'
                }
              }}
            >
              {tokens
                .slice(0, activeTab == 'token' ? tokens.length : 8)
                .map(({ md5, name, slug, isOMCF, user, kyc, pro24h, exch }, idx) => {
                  const imgUrl = `https://s1.xrpl.to/token/${md5}`;
                  const link = `/token/${slug}?fromSearch=1`;

                  return (
                    <Link
                      key={idx}
                      href={link}
                      underline="none"
                      color="inherit"
                      onClick={() => addRecentSearchItem(name, user, imgUrl, link)}
                    >
                      <MenuItem
                        sx={{
                          py: 2,
                          px: 2.5,
                          height: '72px',
                          borderRadius: '16px',
                          background: `linear-gradient(135deg, ${alpha(
                            theme.palette.background.paper,
                            0.8
                          )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                          backdropFilter: 'blur(10px)',
                          border: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative',
                          overflow: 'hidden',
                          '&::before': {
                            content: '""',
                            position: 'absolute',
                            top: 0,
                            left: '-100%',
                            width: '100%',
                            height: '100%',
                            background: `linear-gradient(90deg, transparent, ${alpha(
                              theme.palette.success.main,
                              0.08
                            )}, transparent)`,
                            transition: 'left 0.4s ease'
                          },
                          '&:hover': {
                            background: `linear-gradient(135deg, ${alpha(
                              theme.palette.success.main,
                              0.08
                            )} 0%, ${alpha(theme.palette.success.main, 0.03)} 100%)`,
                            border: `1px solid ${alpha(theme.palette.success.main, 0.12)}`,
                            transform: 'translateY(-2px)',
                            boxShadow: `0 4px 16px ${alpha(theme.palette.success.main, 0.12)}`,
                            '&::before': {
                              left: '100%'
                            }
                          }
                        }}
                      >
                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent="space-between"
                          flex={2}
                          sx={{ pl: 0, pr: 0 }}
                        >
                          <Stack direction="row" spacing={2} alignItems="center">
                            <TokenImage
                              src={imgUrl}
                              width={40}
                              height={40}
                              style={{
                                minWidth: '40px'
                              }}
                            />
                            <Stack spacing={0.5}>
                              <Typography
                                variant="token"
                                fontSize="1rem"
                                color={
                                  isOMCF !== 'yes'
                                    ? darkMode
                                      ? '#fff'
                                      : '#222531'
                                    : darkMode
                                    ? '#007B55'
                                    : '#5569ff'
                                }
                                noWrap
                              >
                                {truncate(user, 8)}
                              </Typography>
                              <Typography
                                variant="caption"
                                fontSize="0.85rem"
                                color={isOMCF !== 'yes' ? (darkMode ? '#fff' : '#222531') : ''}
                                noWrap
                              >
                                {truncate(name, 13)}
                                {kyc && (
                                  <Typography variant="kyc" sx={{ ml: 0.5 }}>
                                    KYC
                                  </Typography>
                                )}
                              </Typography>
                            </Stack>
                          </Stack>

                          <Stack direction="row" gap={2}>
                            <NumberTooltip
                              prepend={currencySymbols[activeFiatCurrency]}
                              number={fNumberWithCurreny(exch, exchRate)}
                            />
                            <BearBullLabel value={pro24h} variant="h4" />
                          </Stack>
                        </Box>
                      </MenuItem>
                    </Link>
                  );
                })}
            </MenuList>
            {search && activeTab !== 'token' && tokens.length > 8 && (
              <Button
                onClick={() => setActiveTab('token')}
                variant="text"
                sx={{
                  mt: 2,
                  py: 1.5,
                  px: 3,
                  borderRadius: '12px',
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.primary.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.primary.main,
                      0.12
                    )} 0%, ${alpha(theme.palette.primary.main, 0.06)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 16px ${alpha(theme.palette.primary.main, 0.15)}`
                  }
                }}
              >
                See all results ({tokens.length})
              </Button>
            )}
          </Stack>
        )}

        {collections.length > 0 && (
          <Stack
            mt={3}
            spacing={2}
            sx={{ display: activeTab === 'nft' || activeTab === 'all' ? 'flex' : 'none' }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ px: 1 }}>
              <Typography variant="subtitle2" fontWeight={600} fontSize="1.1rem">
                {`${!search ? 'Trending ' : ''}NFTs`}
              </Typography>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="currentColor"
                height="20px"
                width="20px"
                viewBox="0 0 24 24"
                color="#FF775F"
              >
                <path d="M17.0881 9.42254C16.4368 8.90717 15.8155 8.35512 15.3012 7.71336C12.3755 4.06357 13.8912 1 13.8912 1C8.46026 3.18334 7.22337 6.64895 7.16462 9.22981L7.1675 9.2572C7.1675 9.2572 7.21498 10.7365 7.90791 12.3625C8.12481 12.8713 7.88299 13.4666 7.33195 13.6199C6.87638 13.7465 6.40822 13.5317 6.21571 13.1314C5.90413 12.4831 5.49262 11.4521 5.6109 10.7249C4.75064 11.817 4.1815 13.1452 4.03542 14.6184C3.65092 18.4924 6.43759 22.0879 10.4208 22.8488C14.9906 23.7217 19.3121 20.7182 19.9269 16.3623C20.3117 13.6367 19.1498 11.0538 17.0881 9.42254ZM14.3578 17.7393C14.3289 17.776 13.5893 18.6597 12.3501 18.7517C12.2829 18.7547 12.2124 18.7577 12.1452 18.7577C11.2902 18.7577 10.4226 18.3682 9.56103 17.5951L9.37219 17.4262L9.61243 17.3372C9.62843 17.3312 11.2742 16.7236 11.6778 15.4077C11.8155 14.9629 11.7707 14.4566 11.553 13.9842C11.2905 13.4075 10.7845 11.9564 11.7453 10.9041L11.9309 10.7015L12.0206 10.9561C12.0238 10.9714 12.6034 12.5911 13.9741 13.4379C14.3871 13.6957 14.6977 14.0086 14.8931 14.3644C15.2959 15.1132 15.533 16.3065 14.3578 17.7393Z" />
              </svg>
            </Stack>

            <MenuList
              sx={{
                p: 1.5,
                maxHeight: search.length > 0 ? '465px' : 'auto',
                overflowY: 'auto',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px',
                '&::-webkit-scrollbar': {
                  width: '8px',
                  borderRadius: '4px'
                },
                '&::-webkit-scrollbar-thumb': {
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.success.main,
                    0.3
                  )} 0%, ${alpha(theme.palette.success.main, 0.1)} 100%)`,
                  borderRadius: '4px',
                  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
                },
                '&::-webkit-scrollbar-track': {
                  background: alpha(theme.palette.background.paper, 0.3),
                  borderRadius: '4px'
                }
              }}
            >
              {collections.slice(0, activeTab == 'nft' ? collections.length : 3).map((nft, idx) => (
                <Link
                  key={idx}
                  href={`/collection/${nft.slug}`}
                  underline="none"
                  color="inherit"
                  onClick={() =>
                    addRecentSearchItem(
                      nft.name,
                      '',
                      `https://s1.xrpnft.com/collection/${nft.logoImage}`,
                      `/collection/${nft.slug}`
                    )
                  }
                >
                  <MenuItem
                    sx={{
                      py: 2,
                      px: 2.5,
                      height: '88px',
                      borderRadius: '16px',
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.background.paper,
                        0.8
                      )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                      backdropFilter: 'blur(10px)',
                      border: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      overflow: 'hidden',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: '-100%',
                        width: '100%',
                        height: '100%',
                        background: `linear-gradient(90deg, transparent, ${alpha(
                          theme.palette.success.main,
                          0.08
                        )}, transparent)`,
                        transition: 'left 0.4s ease'
                      },
                      '&:hover': {
                        background: `linear-gradient(135deg, ${alpha(
                          theme.palette.success.main,
                          0.08
                        )} 0%, ${alpha(theme.palette.success.main, 0.03)} 100%)`,
                        border: `1px solid ${alpha(theme.palette.success.main, 0.12)}`,
                        transform: 'translateY(-2px)',
                        boxShadow: `0 4px 16px ${alpha(theme.palette.success.main, 0.12)}`,
                        '&::before': {
                          left: '100%'
                        }
                      }
                    }}
                  >
                    <Box
                      display="flex"
                      alignItems="center"
                      justifyContent="space-between"
                      width="100%"
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar
                          alt={nft.name}
                          src={`https://s1.xrpnft.com/collection/${nft.logoImage}`}
                          sx={{
                            width: 48,
                            height: 48,
                            backgroundColor: 'transparent',
                            borderRadius: '12px',
                            '& .MuiCardMedia-root': {
                              borderRadius: '12px',
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover'
                            }
                          }}
                        >
                          <CardMedia
                            component="img"
                            src={`https://s1.xrpnft.com/collection/${nft.logoImage}`}
                            alt={nft.name}
                          />
                        </Avatar>
                        <Stack spacing={0.5}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="subtitle1" fontSize="1rem" fontWeight={600} noWrap>
                              {truncate(nft.name, 20)}
                            </Typography>
                            {nft.verified === 'yes' && (
                              <Tooltip title="Verified">
                                <VerifiedIcon fontSize="small" sx={{ color: '#4589ff' }} />
                              </Tooltip>
                            )}
                            {nft.type === 'random' && (
                              <Tooltip title="Random Collection">
                                <CasinoIcon color="info" fontSize="small" />
                              </Tooltip>
                            )}
                            {nft.type === 'sequence' && (
                              <Tooltip title="Sequence Collection">
                                <AnimationIcon color="info" fontSize="small" />
                              </Tooltip>
                            )}
                          </Stack>
                          <Stack direction="row" spacing={2}>
                            <Typography variant="caption" fontSize="0.85rem" color="text.secondary">
                              Floor: {nft.floor?.amount} {nft.floor?.currency}
                            </Typography>
                            <Typography variant="caption" fontSize="0.85rem" color="text.secondary">
                              Volume: {nft.totalVolume?.toLocaleString() || 0} XRP
                            </Typography>
                          </Stack>
                        </Stack>
                      </Stack>
                    </Box>
                  </MenuItem>
                </Link>
              ))}
            </MenuList>
            {search && activeTab !== 'nft' && collections.length > 3 && (
              <Button
                onClick={() => setActiveTab('nft')}
                variant="text"
                sx={{
                  mt: 2,
                  py: 1.5,
                  px: 3,
                  borderRadius: '12px',
                  background: `linear-gradient(135deg, ${alpha(
                    theme.palette.success.main,
                    0.08
                  )} 0%, ${alpha(theme.palette.success.main, 0.03)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.success.main, 0.12)}`,
                  color: theme.palette.success.main,
                  fontWeight: 600,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.success.main,
                      0.12
                    )} 0%, ${alpha(theme.palette.success.main, 0.06)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                    transform: 'translateY(-2px)',
                    boxShadow: `0 4px 16px ${alpha(theme.palette.success.main, 0.15)}`
                  }
                }}
              >
                See all results ({collections.length})
              </Button>
            )}
          </Stack>
        )}

        <Stack
          mt={2}
          spacing={1}
          sx={{
            display: (!search || activeTab === 'all') && searchHistory.length > 0 ? 'flex' : 'none'
          }}
        >
          <Stack direction="row" alignItems="center" spacing={0.5} sx={{ px: 1 }}>
            <Typography variant="subtitle2" fontSize="0.85rem" fontWeight={600}>
              Recent searches
            </Typography>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            sx={{
              px: 1,
              pb: 0.5,
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, 80px)',
              gap: '8px',
              justifyContent: 'start'
            }}
          >
            {searchHistory.slice(0, 5).map(({ name, user, img, link }, idx) => (
              <Link href={link} key={idx} underline="none" color="inherit">
                <Paper
                  elevation={0}
                  sx={{
                    width: '80px',
                    height: '80px',
                    padding: '8px',
                    borderRadius: '16px',
                    background: `linear-gradient(135deg, ${alpha(
                      theme.palette.background.paper,
                      0.8
                    )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
                    backdropFilter: 'blur(10px)',
                    border: `1px solid ${alpha(theme.palette.divider, 0.06)}`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: '-100%',
                      width: '100%',
                      height: '100%',
                      background: `linear-gradient(90deg, transparent, ${alpha(
                        theme.palette.info.main,
                        0.08
                      )}, transparent)`,
                      transition: 'left 0.4s ease'
                    },
                    '&:hover': {
                      background: `linear-gradient(135deg, ${alpha(
                        theme.palette.info.main,
                        0.08
                      )} 0%, ${alpha(theme.palette.info.main, 0.03)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.info.main, 0.12)}`,
                      transform: 'translateY(-4px)',
                      boxShadow: `0 6px 20px ${alpha(theme.palette.info.main, 0.15)}`,
                      '&::before': {
                        left: '100%'
                      }
                    }
                  }}
                >
                  <Stack direction="row" justifyContent="center">
                    <Box
                      sx={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        overflow: 'hidden'
                      }}
                    >
                      <TokenImage
                        src={img}
                        width={32}
                        height={32}
                        style={{
                          minWidth: '32px'
                        }}
                      />
                    </Box>
                  </Stack>
                  <Stack alignItems="center" sx={{ marginTop: '4px' }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.75rem', lineHeight: 1.2 }}>
                      {truncate(name, 8)}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ fontSize: '0.7rem', lineHeight: 1.2, opacity: 0.7 }}
                    >
                      {truncate(user, 8)}
                    </Typography>
                  </Stack>
                </Paper>
              </Link>
            ))}
          </Stack>
        </Stack>
      </Paper>
    </>
  );
}
