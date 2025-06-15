import { useContext, useState, useRef, useEffect } from 'react';
import {
  ModalContainer,
  ModalHeader,
  ModalTitle,
  ModalBackButton,
  ModalCloseButton,
  ModalBody,
  Heading,
  Input
} from './styles/uikit';

import { styled } from 'styled-components';
import { ThemeProvider } from 'styled-components';
import { theme } from './styles/theme';
import { AppContext } from 'src/AppContext';
import { XRP_TOKEN, USD_TOKEN } from 'src/utils/constants';
import axios from 'axios';
import { Icon } from '@iconify/react';
import {
  Box,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  Paper,
  alpha,
  Chip,
  Tooltip,
  Divider
} from '@mui/material';

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import searchFill from '@iconify/icons-eva/search-fill';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HistoryIcon from '@mui/icons-material/History';

import { LazyLoadImage } from 'react-lazy-load-image-component';
import Backdrop from '@mui/material/Backdrop';

const CurrencyModalView = {
  search: 'search',
  manage: 'manage',
  importToken: 'importToken',
  importList: 'importList'
};

const StyledModalContainer = styled(ModalContainer)`
  font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
  width: 100%;
  min-width: 320px;
  max-width: 420px !important;
  height: 80vh;
  max-height: 600px;
  display: flex;
  flex-direction: column;
  background: ${(props) =>
    props.theme.colors.background === '#08060B'
      ? '#000'
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)'};
  border-radius: 28px;
  position: relative;
  overflow: hidden;
  padding-bottom: 8px;
  border: ${(props) =>
    props.theme.colors.background === '#08060B' ? 'none' : '1px solid rgba(226, 232, 240, 0.8)'};
  box-shadow: ${(props) =>
    props.theme.colors.background === '#08060B'
      ? 'none'
      : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'};

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 5px;
    border-top-left-radius: 28px;
    border-top-right-radius: 28px;
    background: linear-gradient(90deg, #1db954 0%, #00c6fb 100%);
    z-index: 10;
    pointer-events: none;
  }
`;

const StyledModalBody = styled(ModalBody)`
  padding: 28px 22px 22px 22px;
  flex: 1;
  overflow-y: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
  background: ${(props) =>
    props.theme.colors.background === '#08060B'
      ? '#000'
      : 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.98) 100%)'};
  border-radius: 0 0 28px 28px;
  border: ${(props) =>
    props.theme.colors.background === '#08060B'
      ? '1px solid #222'
      : '1px solid rgba(226, 232, 240, 0.6)'};
  box-shadow: ${(props) =>
    props.theme.colors.background === '#08060B'
      ? '0 2px 8px rgba(0, 0, 0, 0.12)'
      : '0 -1px 3px 0 rgba(0, 0, 0, 0.05), inset 0 1px 0 0 rgba(255, 255, 255, 0.7)'};
`;

const SearchTextField = styled(TextField)`
  & .MuiOutlinedInput-root {
    border-radius: 18px;
    background: ${(props) =>
      props.theme.colors.background === '#08060B'
        ? '#181818'
        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.9) 100%)'};
    border: ${(props) =>
      props.theme.colors.background === '#08060B'
        ? '1px solid #232'
        : '1px solid rgba(203, 213, 225, 0.8)'};
    box-shadow: ${(props) =>
      props.theme.colors.background === '#08060B'
        ? '0 1px 4px 0 rgba(0, 0, 0, 0.12) inset'
        : '0 1px 3px 0 rgba(0, 0, 0, 0.08), inset 0 1px 2px 0 rgba(255, 255, 255, 0.9)'};
    height: 52px;
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    &:hover,
    &.Mui-focused {
      border-color: #1db954;
      box-shadow: ${(props) =>
        props.theme.colors.background === '#08060B'
          ? '0 0 0 2px #1db95433'
          : '0 0 0 3px rgba(29, 185, 84, 0.12), 0 1px 3px 0 rgba(0, 0, 0, 0.08)'};
    }
    & fieldset {
      border: none;
    }
    & input {
      padding: 16px 20px;
      color: ${(props) => (props.theme.colors.background === '#08060B' ? '#fff' : '#1a202c')};
      font-weight: 500;
      font-size: 1.05rem;
      &::placeholder {
        color: ${(props) => (props.theme.colors.background === '#08060B' ? '#aaa' : '#64748b')};
        opacity: 1;
      }
    }
  }
`;

const TokenListItem = styled(Stack)`
  padding: 6px 8px;
  border-radius: 10px;
  background: ${(props) =>
    props.theme.colors.background === '#08060B'
      ? '#101010'
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 252, 0.8) 100%)'};
  margin-bottom: 4px;
  border: ${(props) =>
    props.theme.colors.background === '#08060B'
      ? '1px solid #232'
      : '1px solid rgba(226, 232, 240, 0.6)'};
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.18s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: ${(props) =>
    props.theme.colors.background === '#08060B'
      ? '0 1.5px 8px 0 rgba(29, 185, 84, 0.04)'
      : '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(255, 255, 255, 0.7) inset'};
  &:hover {
    background: ${(props) =>
      props.theme.colors.background === '#08060B'
        ? '#181818'
        : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(240, 249, 255, 0.9) 100%)'};
    border-color: #1db954;
    box-shadow: ${(props) =>
      props.theme.colors.background === '#08060B'
        ? '0 2px 16px 0 #1db95422'
        : '0 4px 12px 0 rgba(29, 185, 84, 0.15), 0 1px 3px 0 rgba(0, 0, 0, 0.08)'};
    transform: translateY(-2px) scale(1.03);
  }
  &:active {
    transform: translateY(-1px) scale(1.01);
  }
`;

const TokenImageWrapper = styled(Box)`
  position: relative;
  display: flex;
  align-items: center;
`;

const KYCBadge = styled('div')`
  position: absolute;
  top: -2px;
  right: -2px;
  z-index: 2;
  background: transparent;
  border-radius: 50%;
  padding: 0;
  border: none;
  box-shadow: none;
`;

const TokenImage = styled(LazyLoadImage)`
  border-radius: 50%;
  width: 26px;
  height: 26px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid
    ${(props) =>
      props.theme.colors.background === '#08060B'
        ? 'rgba(71, 85, 105, 0.4)'
        : 'rgba(226, 232, 240, 0.6)'};
  box-shadow: ${(props) =>
    props.theme.colors.background === '#08060B'
      ? '0 4px 12px rgba(0, 0, 0, 0.3)'
      : '0 4px 12px rgba(0, 0, 0, 0.1)'};

  ${TokenListItem}:hover & {
    transform: scale(1.1) rotate(5deg);
    border-color: ${(props) =>
      props.theme.colors.background === '#08060B'
        ? 'rgba(99, 102, 241, 0.6)'
        : 'rgba(99, 102, 241, 0.4)'};
    box-shadow: ${(props) =>
      props.theme.colors.background === '#08060B'
        ? '0 8px 20px rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(99, 102, 241, 0.3)'
        : '0 8px 20px rgba(0, 0, 0, 0.15), 0 0 0 2px rgba(99, 102, 241, 0.2)'};
  }
`;

const RecentSearchesSection = styled(Stack)`
  margin-top: 20px;
  margin-bottom: 16px;
`;

const RecentSearchesHeader = styled(Stack)`
  flex-direction: row;
  align-items: center;
  margin-bottom: 12px;
  padding: 10px 16px;
  background: ${(props) =>
    props.theme.colors.background === '#08060B'
      ? '#111'
      : 'linear-gradient(135deg, rgba(29, 185, 84, 0.08) 0%, rgba(0, 198, 251, 0.05) 100%)'};
  border-radius: 14px;
  border: ${(props) =>
    props.theme.colors.background === '#08060B'
      ? '1px solid #222'
      : '1px solid rgba(29, 185, 84, 0.2)'};
  color: #1db954;
`;

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.substr(0, n - 1) + '... ' : str;
}

const MAX_RECENT_SEARCHES = 4;

// Accent line under header
const ModalAccentLine = styled('div')`
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, #1db954 0%, #00c6fb 100%);
  opacity: ${(props) => (props.theme.colors.background === '#08060B' ? '0.7' : '0.4')};
  margin-bottom: 8px;
`;

const ModalHeaderStyled = styled(ModalHeader)`
  position: relative;
  z-index: 3;
  background: ${(props) =>
    props.theme.colors.background === '#08060B'
      ? 'transparent'
      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.95) 100%)'};
  border-top-left-radius: 28px;
  border-top-right-radius: 28px;
  padding-top: 18px;
  padding-bottom: 10px;
  padding-left: 28px;
  padding-right: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalCloseButtonStyled = styled(ModalCloseButton)`
  transition: transform 0.15s, box-shadow 0.15s;
  &:hover {
    transform: scale(1.15);
    box-shadow: 0 0 0 2px #1db95444;
    color: #1db954;
  }
`;

export default function CurrencySearchModal({
  onDismiss = () => null,
  token,
  onChangeToken,
  open
  //   onCurrencySelect,
  //   selectedCurrency,
  //   otherSelectedCurrency,
  //   showCommonBases = false,
  //   commonBasesType,
}) {
  const [modalView, setModalView] = useState(CurrencyModalView.search);
  // for token import view
  const prevView = undefined;

  const BASE_URL = process.env.API_URL;
  const { darkMode } = useContext(AppContext);

  const [loading, setLoading] = useState(false);

  const [tokens, setTokens] = useState([XRP_TOKEN, USD_TOKEN]);
  const [filter, setFilter] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);

  useEffect(() => {
    // Load recent searches from localStorage
    const savedSearches = localStorage.getItem('recentTokenSearches');
    if (savedSearches) {
      setRecentSearches(JSON.parse(savedSearches));
    }
  }, []);

  const addToRecentSearches = (token) => {
    const updatedSearches = [token, ...recentSearches.filter((t) => t.md5 !== token.md5)].slice(
      0,
      MAX_RECENT_SEARCHES
    );
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentTokenSearches', JSON.stringify(updatedSearches));
  };

  const renderTokenItem = (row) => {
    const { md5, name, user, kyc, isOMCF } = row;
    const imgUrl = `https://s1.xrpl.to/token/${md5}`;

    return (
      <TokenListItem
        key={md5 + '_token1'}
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        onClick={() => handleChangetoken(row)}
      >
        <Stack direction="row" spacing={0.8} alignItems="center">
          <TokenImageWrapper>
            <TokenImage
              src={imgUrl}
              alt={name}
              effect="opacity"
              onError={(event) => (event.target.src = '/static/alt.webp')}
            />
            {kyc && (
              <KYCBadge>
                <Tooltip title="KYC Verified">
                  <CheckCircleIcon sx={{ color: '#00AB55', fontSize: 11 }} />
                </Tooltip>
              </KYCBadge>
            )}
          </TokenImageWrapper>
          <Stack spacing={0}>
            <Typography
              variant="subtitle2"
              color={isOMCF !== 'yes' ? (darkMode ? '#fff' : '#1a202c') : '#1db954'}
              sx={{ fontWeight: 700, fontSize: '0.85rem', lineHeight: 1.05 }}
              noWrap
            >
              {truncate(name, 12)}
            </Typography>
            <Typography
              variant="caption"
              color={darkMode ? '#aaa' : '#64748b'}
              sx={{ fontSize: '0.62rem', lineHeight: 1 }}
              noWrap
            >
              {truncate(user, 16)}
            </Typography>
          </Stack>
        </Stack>
        <ArrowForwardIcon sx={{ color: 'primary.main', opacity: 0.7, fontSize: 16 }} />
      </TokenListItem>
    );
  };

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

  const handleChangeFilter = (e) => {
    setFilter(e.target.value);
  };

  const handleChangetoken = (_token) => {
    addToRecentSearches(_token);
    onChangeToken(_token);
    onDismiss();
  };

  const config = {
    [CurrencyModalView.search]: { title: 'Select a Token', onBack: undefined },
    [CurrencyModalView.manage]: {
      title: 'Manage',
      onBack: () => setModalView(CurrencyModalView.search)
    },
    [CurrencyModalView.importToken]: {
      title: 'Import Tokens',
      onBack: () =>
        setModalView(
          prevView && prevView !== CurrencyModalView.importToken
            ? prevView
            : CurrencyModalView.search
        )
    },
    [CurrencyModalView.importList]: {
      title: 'Import List',
      onBack: () => setModalView(CurrencyModalView.search)
    }
  };
  const wrapperRef = useRef(null);

  return (
    <ThemeProvider theme={() => theme(darkMode)}>
      <Backdrop
        sx={(theme) => ({
          color: theme.colors.text,
          zIndex: theme.zIndex.drawer + 1,
          backdropFilter: 'blur(8px)',
          backgroundColor:
            theme.colors.background === '#08060B' ? 'rgba(0, 0, 0, 0.8)' : 'rgba(0, 0, 0, 0.4)',
          background:
            theme.colors.background === '#08060B'
              ? 'radial-gradient(circle at center, rgba(16, 16, 24, 0.9) 0%, rgba(0, 0, 0, 0.95) 100%)'
              : 'radial-gradient(circle at center, rgba(248, 250, 252, 0.3) 0%, rgba(0, 0, 0, 0.5) 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        })}
        open={open}
        onClick={onDismiss}
      >
        <StyledModalContainer ref={wrapperRef} onClick={(event) => event.stopPropagation()}>
          <ModalHeaderStyled>
            <ModalTitle>
              {config[modalView].onBack && <ModalBackButton onBack={config[modalView].onBack} />}
              <Heading
                style={{
                  color:
                    theme(darkMode).colors.background === '#08060B'
                      ? theme(darkMode).colors.text
                      : '#1a202c',
                  fontWeight: 700,
                  fontSize: '1.45rem',
                  letterSpacing: '-0.5px'
                }}
              >
                {config[modalView].title}
              </Heading>
            </ModalTitle>
            <ModalCloseButtonStyled onDismiss={onDismiss} />
          </ModalHeaderStyled>
          <ModalAccentLine />
          <StyledModalBody>
            <SearchTextField
              fullWidth
              placeholder="Search name or paste address"
              autoComplete="off"
              value={filter}
              onChange={handleChangeFilter}
              size="medium"
              InputProps={{
                autoComplete: 'off',
                type: 'search',
                startAdornment: (
                  <InputAdornment position="start" sx={{ ml: 1 }}>
                    <Box
                      component={Icon}
                      icon={searchFill}
                      sx={{
                        color: darkMode ? 'text.disabled' : '#64748b',
                        fontSize: 20
                      }}
                    />
                  </InputAdornment>
                )
              }}
            />

            {!filter && recentSearches.length > 0 && (
              <RecentSearchesSection>
                <RecentSearchesHeader>
                  <HistoryIcon
                    sx={{
                      color: darkMode ? 'text.secondary' : '#1db954',
                      fontSize: 20,
                      mr: 1
                    }}
                  />
                  <Typography variant="subtitle2" color={darkMode ? 'text.secondary' : '#1db954'}>
                    Recent Searches
                  </Typography>
                </RecentSearchesHeader>
                <Stack spacing={1}>{recentSearches.map((row) => renderTokenItem(row))}</Stack>
                <Divider sx={{ my: 2 }} />
              </RecentSearchesSection>
            )}

            <Stack spacing={0.5}>{tokens.map((row) => renderTokenItem(row))}</Stack>
          </StyledModalBody>
        </StyledModalContainer>
      </Backdrop>
    </ThemeProvider>
  );
}
