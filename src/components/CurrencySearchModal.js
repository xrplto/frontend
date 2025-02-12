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
  Tooltip
} from '@mui/material';

import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import searchFill from '@iconify/icons-eva/search-fill';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import { LazyLoadImage } from 'react-lazy-load-image-component';
import Backdrop from '@mui/material/Backdrop';

const CurrencyModalView = {
  search: 'search',
  manage: 'manage',
  importToken: 'importToken',
  importList: 'importList'
};

const StyledModalContainer = styled(ModalContainer)`
  width: 100%;
  min-width: 320px;
  max-width: 420px !important;
  min-height: calc(var(--vh, 1vh) * 90);
  ${({ theme }) => theme.mediaQueries.md} {
    min-height: auto;
  }
  background: #000000;
  border-radius: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
`;

const StyledModalBody = styled(ModalBody)`
  padding: 24px;
  overflow-y: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`;

const SearchTextField = styled(TextField)`
  & .MuiOutlinedInput-root {
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.05);
    transition: all 0.2s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    & fieldset {
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    &.Mui-focused fieldset {
      border-color: ${(props) => props.theme.colors.primary};
    }

    & input {
      color: rgba(255, 255, 255, 0.9);
      &::placeholder {
        color: rgba(255, 255, 255, 0.5);
      }
    }
  }
`;

const TokenListItem = styled(Stack)`
  padding: 12px;
  border-radius: 16px;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.03);

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
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
  background: ${(props) => props.theme.colors.backgroundAlt};
  border-radius: 50%;
`;

const TokenImage = styled(LazyLoadImage)`
  border-radius: 50%;
  overflow: hidden;
  transition: transform 0.2s ease;
  ${TokenListItem}:hover & {
    transform: scale(1.05);
  }
`;

function truncate(str, n) {
  if (!str) return '';
  //return (str.length > n) ? str.substr(0, n-1) + '&hellip;' : str;
  return str.length > n ? str.substr(0, n - 1) + '... ' : str;
}

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
        sx={{
          color: '#fff',
          zIndex: (theme) => theme.zIndex.drawer + 1,
          backdropFilter: 'blur(3px)',
          backgroundColor: 'rgba(0, 0, 0, 0.8)'
        }}
        open={open}
        onClick={onDismiss}
      >
        <StyledModalContainer ref={wrapperRef} onClick={(event) => event.stopPropagation()}>
          <ModalHeader>
            <ModalTitle>
              {config[modalView].onBack && <ModalBackButton onBack={config[modalView].onBack} />}
              <Heading style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                {config[modalView].title}
              </Heading>
            </ModalTitle>
            <ModalCloseButton onDismiss={onDismiss} />
          </ModalHeader>
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
                      sx={{ color: 'text.disabled', fontSize: 20 }}
                    />
                  </InputAdornment>
                )
              }}
            />

            <Stack sx={{ mt: 3 }} spacing={1}>
              {tokens.map((row) => {
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
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <TokenImageWrapper>
                        <TokenImage
                          src={imgUrl}
                          width={36}
                          height={36}
                          onError={(event) => (event.target.src = '/static/alt.webp')}
                        />
                        {kyc && (
                          <KYCBadge>
                            <Tooltip title="KYC Verified">
                              <CheckCircleIcon sx={{ color: '#00AB55', fontSize: 20 }} />
                            </Tooltip>
                          </KYCBadge>
                        )}
                      </TokenImageWrapper>
                      <Stack spacing={0.2}>
                        <Typography
                          variant="subtitle2"
                          color={isOMCF !== 'yes' ? 'text.primary' : 'primary'}
                          sx={{ fontWeight: 600 }}
                          noWrap
                        >
                          {truncate(name, 12)}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontSize: '0.75rem' }}
                          noWrap
                        >
                          {truncate(user, 16)}
                        </Typography>
                      </Stack>
                    </Stack>
                    <ArrowForwardIcon sx={{ color: 'primary.main', opacity: 0.7 }} />
                  </TokenListItem>
                );
              })}
            </Stack>
          </StyledModalBody>
        </StyledModalContainer>
      </Backdrop>
    </ThemeProvider>
  );
}
