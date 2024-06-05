import { useContext, useState, useRef, useEffect } from 'react'
import {
  ModalContainer,
  ModalHeader,
  ModalTitle,
  ModalBackButton,
  ModalCloseButton,
  ModalBody,
  Heading,
  MODAL_SWIPE_TO_CLOSE_VELOCITY,
  Input,
} from './styles/uikit'

import { styled } from 'styled-components'
import { ThemeProvider } from "styled-components";
import { theme } from './styles/theme';
import { AppContext } from 'src/AppContext';
import { XRP_TOKEN, USD_TOKEN } from 'src/utils/constants';
import axios from 'axios';
import { Stack, Typography, MenuItem } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import Backdrop from '@mui/material/Backdrop';

const CurrencyModalView = {
  search: "search",
  manage: "manage",
  importToken: "importToken",
  importList: "importList",
}

const StyledModalContainer = styled(ModalContainer)`
  width: 100%;
  min-width: 320px;
  max-width: 420px !important;
  min-height: calc(var(--vh, 1vh) * 90);
  ${({ theme }) => theme.mediaQueries.md} {
    min-height: auto;
  }
`

const StyledModalBody = styled(ModalBody)`
  padding: 24px;
  overflow-y: auto;
  -ms-overflow-style: none;
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
`

const TokenImage = styled(LazyLoadImage)(({ theme }) => ({
  borderRadius: '50%',
  overflow: 'hidden'
}));

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
  const [modalView, setModalView] = useState(CurrencyModalView.search)

  //   const handleCurrencySelect = useCallback(
  //     (currency) => {
  //       onDismiss?.()
  //       onCurrencySelect(currency)
  //     },
  //     [onDismiss, onCurrencySelect],
  //   )

  // for token import view
  const prevView = undefined;

  // used for import token flow
  const [importToken, setImportToken] = useState()

  // used for import list
  const [importList, setImportList] = useState()
  const [listURL, setListUrl] = useState()

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
        console.log(res.data);
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

  const config = {
    [CurrencyModalView.search]: { title: 'Select a Token', onBack: undefined },
    [CurrencyModalView.manage]: { title: 'Manage', onBack: () => setModalView(CurrencyModalView.search) },
    [CurrencyModalView.importToken]: {
      title: 'Import Tokens',
      onBack: () =>
        setModalView(prevView && prevView !== CurrencyModalView.importToken ? prevView : CurrencyModalView.search),
    },
    [CurrencyModalView.importList]: { title: 'Import List', onBack: () => setModalView(CurrencyModalView.search) },
  }
  const isMobile = true;
  const wrapperRef = useRef(null)
  const [height, setHeight] = useState(undefined)
  useEffect(() => {
    if (!wrapperRef.current) return
    setHeight(wrapperRef.current.offsetHeight - 330)
  }, [])

  //   const [, dispatch] = useListState()
  //   const lists = useAllLists()
  const adding = Boolean(listURL && lists[listURL]?.loadingRequestId)

  //   const fetchList = useFetchListCallback(dispatch)

  const [addError, setAddError] = useState(null)

  //   const handleAddList = useCallback(() => {
  //     if (adding) return
  //     setAddError(null)
  //     if (listURL) {
  //       fetchList(listURL)
  //         .then(() => {
  //           dispatch(enableList(listURL))
  //           setModalView(CurrencyModalView.manage)
  //         })
  //         .catch((error) => {
  //           setAddError(error.message)
  //           dispatch(removeList(listURL))
  //         })
  //     }
  //   }, [adding, dispatch, fetchList, listURL])

  return (
    <ThemeProvider theme={theme}>
      <Backdrop
        sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={open}
        onClick={onDismiss}
      >
        <StyledModalContainer
          ref={wrapperRef}
        >
          <ModalHeader>
            <ModalTitle>
              {config[modalView].onBack && <ModalBackButton onBack={config[modalView].onBack} />}
              <Heading>{config[modalView].title}</Heading>
            </ModalTitle>
            <ModalCloseButton onDismiss={onDismiss} />
          </ModalHeader>
          <StyledModalBody>
            <Input
              id="token-search-input"
              placeholder={'Search name or paste address'}
              scale="lg"
              autoComplete="off"
            />

            <Stack sx={{ mt: 4 }} spacing={0.5}>
              {tokens.map((row) => {
                const { md5, name, user, kyc, isOMCF } = row;

                const imgUrl = `https://s1.xrpl.to/token/${md5}`;
                // const imgUrl = `/static/tokens/${md5}.${ext}`;

                return (
                    <Stack
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      sx={{
                        p: 1,
                        '&:hover': {
                          backgroundColor: "#edeced",
                          cursor: "pointer"
                        }
                      }}
                      key={md5 + '_token1'}
                      value={md5}
                    >
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                      >
                        <TokenImage
                          src={imgUrl} // use normal <img> attributes as props
                          width={32}
                          height={32}
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
                            color="#222531"
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
                      <ArrowForwardIcon color="primary"/>
                    </Stack>
                );
              })}
            </Stack>
          </StyledModalBody>
        </StyledModalContainer>
      </Backdrop>
    </ThemeProvider>
  )
}
