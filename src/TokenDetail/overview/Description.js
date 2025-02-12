import React from 'react';
import Decimal from 'decimal.js';
import { useState, useContext } from 'react';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';

// Material
import {
  styled,
  IconButton,
  Link,
  Stack,
  Tooltip,
  Typography,
  Paper,
  Fade,
  CardHeader
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

// Context
import { AppContext } from 'src/AppContext';

// Redux
import { useSelector } from 'react-redux';
import { selectMetrics } from 'src/redux/statusSlice';

// Utils
import { fPercent, fNumber, fNumberWithCurreny } from 'src/utils/formatNumber';

// Components
import NumberTooltip from 'src/components/NumberTooltip';
import StackStyle from 'src/components/StackStyle';
import { currencySymbols } from 'src/utils/constants';

const ReadMore = ({ children }) => {
  const [showFullContent, setShowFullContent] = useState(false);
  const { darkMode } = useContext(AppContext);

  const toggleReadMore = () => {
    setShowFullContent(!showFullContent);
  };

  const ContentClosed = styled('div')(
    ({ theme }) => `
        -webkit-box-flex: 1;
        flex-grow: 1;
        height: 10em;
        overflow: hidden;
        text-overflow: ellipsis;
        position: relative;
        transition: all 0.3s ease-in-out;
    
        &::after {
            content: "";
            position: absolute;
            left: 0px;
            bottom: 0px;
            width: 100%;
            height: 4em;
            background: linear-gradient(180deg, 
              rgba(255,255,255,0) 0%, 
              ${theme.palette.background.default} 90%);
            z-index: 1;
            transition: opacity 0.3s ease-in-out;
        }
    `
  );

  const ContentOpened = styled('div')(
    ({ theme }) => `
        height: unset;
        overflow: unset;
        text-overflow: unset;
        min-height: 10em;
        transition: all 0.3s ease-in-out;
    `
  );

  const ReadMoreButton = styled(Link)(
    ({ theme }) => `
        margin-top: -8px;
        padding: 2px 8px;
        border-radius: 4px;
        font-size: 0.8125rem;
        color: ${theme.palette.mode === 'dark' ? '#22B14C' : '#3366FF'};
        transition: all 0.2s ease-in-out;
        z-index: 2;
        position: relative;
        
        &:hover {
            background: ${
              theme.palette.mode === 'dark' ? 'rgba(34, 177, 76, 0.08)' : 'rgba(51, 102, 255, 0.08)'
            };
        }
    `
  );

  return (
    <Stack spacing={0}>
      <Fade in={true} timeout={300}>
        {showFullContent ? (
          <ContentOpened>{children}</ContentOpened>
        ) : (
          <ContentClosed>{children}</ContentClosed>
        )}
      </Fade>

      <Stack direction="row" justifyContent="flex-start" sx={{ pl: 0.5 }}>
        <ReadMoreButton
          component="button"
          underline="none"
          variant="body2"
          onClick={toggleReadMore}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              color: 'inherit'
            }}
          >
            {showFullContent ? 'Read less' : 'Read more'}
          </Typography>
        </ReadMoreButton>
      </Stack>
    </Stack>
  );
};

export default function Description({
  token,
  showEditor,
  setShowEditor,
  description,
  onApplyDescription
}) {
  const { accountProfile, darkMode, activeFiatCurrency } = useContext(AppContext);
  const isAdmin = accountProfile && accountProfile.account && accountProfile.admin;
  const [showFullContent, setShowFullContent] = useState(false);

  const metrics = useSelector(selectMetrics);
  const {
    id,
    name,
    amount,
    maxMin24h,
    pro24h,
    pro7d,
    p24h,
    supply,
    issuer,
    vol24h,
    vol24hx,
    vol24hxrp,
    slug,
    marketcap,
    exch,
    dom,
    md5
  } = token;

  let user = token.user;
  if (!user) user = name;

  const price = fNumberWithCurreny(exch || 0, metrics[activeFiatCurrency]);
  const convertedMarketCap = Decimal.div(marketcap, metrics[activeFiatCurrency]).toNumber();

  const vpro24h = fPercent(pro24h);
  const vpro7d = fPercent(pro7d);

  let strPro24h = 0;
  if (vpro24h < 0) {
    strPro24h = -vpro24h;
    strPro24h = 'down ' + strPro24h + '%';
  } else {
    strPro24h = 'up ' + vpro24h + '%';
  }

  const handleClickEdit = () => {
    if (showEditor) {
      onApplyDescription();
    }
    setShowEditor(!showEditor);
  };

  const structuredData = {
    '@context': 'https://schema.org/',
    '@type': 'Cryptocurrency',
    name: `${user} ${name}`,
    description: description,
    tickerSymbol: name,
    currentExchangeRate: {
      '@type': 'MonetaryAmount',
      currency: activeFiatCurrency,
      value: price
    },
    marketCap: {
      '@type': 'MonetaryAmount',
      currency: activeFiatCurrency,
      value: convertedMarketCap
    },
    supply: fNumber(supply, true),
    priceChangePercentage24h: strPro24h,
    priceChangePercentage7d: vpro7d,
    fiatChange24h: p24h,
    maxPrice24h: maxMin24h.max,
    minPrice24h: maxMin24h.min,
    tradingVolume24h: {
      '@type': 'MonetaryAmount',
      currency: 'XRP',
      value: fNumber(vol24hxrp, true)
    },
    marketDominance: dom
  };

  const ContentClosed = styled('div')(
    ({ theme }) => `
        -webkit-box-flex: 1;
        flex-grow: 1;
        height: 10em;
        overflow: hidden;
        text-overflow: ellipsis;
        position: relative;
        transition: all 0.3s ease-in-out;
    
        &::after {
            content: "";
            position: absolute;
            left: 0px;
            bottom: 0px;
            width: 100%;
            height: 4em;
            background: linear-gradient(180deg, 
              rgba(255,255,255,0) 0%, 
              ${theme.palette.background.default} 90%);
            z-index: 1;
            transition: opacity 0.3s ease-in-out;
        }
    `
  );

  const ContentOpened = styled('div')(
    ({ theme }) => `
        height: unset;
        overflow: unset;
        text-overflow: unset;
        min-height: 10em;
        transition: all 0.3s ease-in-out;
    `
  );

  return (
    <StackStyle>
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>

      <CardHeader
        title={`About ${user}`}
        subheader=""
        sx={{
          p: 1.5,
          '& .MuiCardHeader-title': {
            fontSize: '1rem',
            fontWeight: 600,
            background: (theme) =>
              theme.palette.mode === 'dark'
                ? 'linear-gradient(45deg, #22B14C 30%, #2ecc71 90%)'
                : 'linear-gradient(45deg, #3366FF 30%, #4d79ff 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }
        }}
        action={
          <Stack direction="row" spacing={1}>
            <Tooltip title={showFullContent ? 'Show less' : 'Show more'}>
              <IconButton
                onClick={() => setShowFullContent(!showFullContent)}
                edge="end"
                size="small"
                sx={{
                  p: 0.5,
                  background: (theme) =>
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  border: (theme) =>
                    `1px solid ${
                      theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                    }`,
                  '&:hover': {
                    background: (theme) =>
                      theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    transform: 'translateY(-1px)'
                  }
                }}
              >
                {showFullContent ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
              </IconButton>
            </Tooltip>
            {isAdmin && (
              <Tooltip title={showEditor ? 'Apply changes' : 'Click to edit description'}>
                <IconButton
                  onClick={handleClickEdit}
                  edge="end"
                  aria-label="edit"
                  size="small"
                  sx={{
                    p: 0.5,
                    background: (theme) =>
                      theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: (theme) =>
                      `1px solid ${
                        theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                      }`,
                    '&:hover': {
                      background: (theme) =>
                        theme.palette.mode === 'dark'
                          ? 'rgba(255,255,255,0.1)'
                          : 'rgba(0,0,0,0.05)',
                      transform: 'translateY(-1px)'
                    }
                  }}
                >
                  {showEditor ? <CloseIcon color="error" /> : <EditIcon />}
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        }
      />

      {!showEditor && description && (
        <Stack sx={{ px: 1.5, pb: 1.5 }}>
          <Fade in={true} timeout={300}>
            {showFullContent ? (
              <ContentOpened>
                <ReactMarkdown
                  className={darkMode ? 'reactMarkDowndark' : 'reactMarkDownlight'}
                  components={{
                    p: ({ node, ...props }) => (
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 1.5,
                          lineHeight: 1.6,
                          color: (theme) => theme.palette.text.primary
                        }}
                        {...props}
                      />
                    ),
                    h1: ({ node, ...props }) => (
                      <Typography
                        variant="h5"
                        sx={{
                          mt: 2,
                          mb: 1.5,
                          fontWeight: 600,
                          color: (theme) => (theme.palette.mode === 'dark' ? '#22B14C' : '#3366FF')
                        }}
                        {...props}
                      />
                    ),
                    h2: ({ node, ...props }) => (
                      <Typography
                        variant="h6"
                        sx={{
                          mt: 2,
                          mb: 1.5,
                          fontWeight: 600,
                          color: (theme) => (theme.palette.mode === 'dark' ? '#22B14C' : '#3366FF')
                        }}
                        {...props}
                      />
                    ),
                    h3: ({ node, ...props }) => (
                      <Typography
                        variant="subtitle1"
                        sx={{
                          mt: 2,
                          mb: 1.5,
                          fontWeight: 600,
                          color: (theme) => (theme.palette.mode === 'dark' ? '#22B14C' : '#3366FF')
                        }}
                        {...props}
                      />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul
                        style={{
                          marginBottom: '0.75rem',
                          paddingLeft: '1.25rem'
                        }}
                        {...props}
                      />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol
                        style={{
                          marginBottom: '0.75rem',
                          paddingLeft: '1.25rem'
                        }}
                        {...props}
                      />
                    ),
                    li: ({ node, ...props }) => (
                      <li
                        style={{
                          marginBottom: '0.25rem',
                          color: darkMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)'
                        }}
                        {...props}
                      />
                    )
                  }}
                >
                  {description}
                </ReactMarkdown>
              </ContentOpened>
            ) : (
              <ContentClosed>
                <ReactMarkdown
                  className={darkMode ? 'reactMarkDowndark' : 'reactMarkDownlight'}
                  components={{
                    p: ({ node, ...props }) => (
                      <Typography
                        variant="body2"
                        sx={{
                          mb: 1.5,
                          lineHeight: 1.6,
                          color: (theme) => theme.palette.text.primary
                        }}
                        {...props}
                      />
                    ),
                    h1: ({ node, ...props }) => (
                      <Typography
                        variant="h5"
                        sx={{
                          mt: 2,
                          mb: 1.5,
                          fontWeight: 600,
                          color: (theme) => (theme.palette.mode === 'dark' ? '#22B14C' : '#3366FF')
                        }}
                        {...props}
                      />
                    ),
                    h2: ({ node, ...props }) => (
                      <Typography
                        variant="h6"
                        sx={{
                          mt: 2,
                          mb: 1.5,
                          fontWeight: 600,
                          color: (theme) => (theme.palette.mode === 'dark' ? '#22B14C' : '#3366FF')
                        }}
                        {...props}
                      />
                    ),
                    h3: ({ node, ...props }) => (
                      <Typography
                        variant="subtitle1"
                        sx={{
                          mt: 2,
                          mb: 1.5,
                          fontWeight: 600,
                          color: (theme) => (theme.palette.mode === 'dark' ? '#22B14C' : '#3366FF')
                        }}
                        {...props}
                      />
                    ),
                    ul: ({ node, ...props }) => (
                      <ul
                        style={{
                          marginBottom: '0.75rem',
                          paddingLeft: '1.25rem'
                        }}
                        {...props}
                      />
                    ),
                    ol: ({ node, ...props }) => (
                      <ol
                        style={{
                          marginBottom: '0.75rem',
                          paddingLeft: '1.25rem'
                        }}
                        {...props}
                      />
                    ),
                    li: ({ node, ...props }) => (
                      <li
                        style={{
                          marginBottom: '0.25rem',
                          color: darkMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)'
                        }}
                        {...props}
                      />
                    )
                  }}
                >
                  {description}
                </ReactMarkdown>
              </ContentClosed>
            )}
          </Fade>
        </Stack>
      )}
    </StackStyle>
  );
}
