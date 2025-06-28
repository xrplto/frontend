import React from 'react';
import Decimal from 'decimal.js';
import { useState, useContext } from 'react';
import dynamic from 'next/dynamic';
import ReactMarkdown from 'react-markdown';
import { alpha } from '@mui/material/styles';

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
  CardHeader,
  Box,
  Chip
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
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    
        &::after {
            content: "";
            position: absolute;
            left: 0px;
            bottom: 0px;
            width: 100%;
            height: 5em;
            background: linear-gradient(180deg, 
              rgba(255,255,255,0) 0%, 
              ${theme.palette.background.default} 85%,
              ${theme.palette.background.default} 100%);
            z-index: 2;
            transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
    `
  );

  const ContentOpened = styled('div')(
    ({ theme }) => `
        height: unset;
        overflow: unset;
        text-overflow: unset;
        min-height: 10em;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    `
  );

  const ReadMoreButton = styled(Link)(
    ({ theme }) => `
        margin-top: 8px;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 0.8125rem;
        font-weight: 500;
        color: ${theme.palette.mode === 'dark' ? '#22B14C' : '#3366FF'};
        background: ${
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, rgba(34, 177, 76, 0.1) 0%, rgba(46, 204, 113, 0.05) 100%)'
            : 'linear-gradient(135deg, rgba(51, 102, 255, 0.1) 0%, rgba(77, 121, 255, 0.05) 100%)'
        };
        border: 1px solid ${
          theme.palette.mode === 'dark' ? 'rgba(34, 177, 76, 0.2)' : 'rgba(51, 102, 255, 0.2)'
        };
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        z-index: 3;
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 4px;
        
        &:hover {
            background: ${
              theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, rgba(34, 177, 76, 0.15) 0%, rgba(46, 204, 113, 0.08) 100%)'
                : 'linear-gradient(135deg, rgba(51, 102, 255, 0.15) 0%, rgba(77, 121, 255, 0.08) 100%)'
            };
            transform: translateY(-2px);
        }
    `
  );

  return (
    <Stack spacing={1}>
      <Fade in={true} timeout={400}>
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
            {showFullContent ? 'Show less' : 'Read more'}
          </Typography>
          {showFullContent ? (
            <KeyboardArrowUpIcon fontSize="small" />
          ) : (
            <KeyboardArrowDownIcon fontSize="small" />
          )}
        </ReadMoreButton>
      </Stack>
    </Stack>
  );
};

// Enhanced styled components
const StyledCard = styled(Paper)(({ theme }) => ({
  borderRadius: '24px',
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(
    theme.palette.background.paper,
    0.5
  )} 100%)`,
  backdropFilter: 'blur(25px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
  boxShadow: `0 8px 32px 0 ${alpha(theme.palette.common.black, 0.1)}`,
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
}));

const StyledCardHeader = styled(CardHeader)(({ theme }) => ({
  padding: '20px 24px 16px',
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(
    theme.palette.primary.main,
    0.02
  )} 100%)`,
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,

  '& .MuiCardHeader-title': {
    fontSize: '1.125rem',
    fontWeight: 700,
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.main} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    letterSpacing: '-0.01em'
  }
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  padding: '8px',
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(
    theme.palette.background.paper,
    0.4
  )} 100%)`,
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: '12px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',

  '&:hover': {
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(
      theme.palette.primary.main,
      0.04
    )} 100%)`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    transform: 'translateY(-1px)'
  }
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  padding: '0 24px 24px',
  position: 'relative'
}));

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
  const convertedMarketCap =
    marketcap && metrics[activeFiatCurrency]
      ? Decimal.div(marketcap || 0, metrics[activeFiatCurrency] || 1).toNumber()
      : 0;

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
    maxPrice24h: maxMin24h?.max || 0,
    minPrice24h: maxMin24h?.min || 0,
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
        height: 8em;
        overflow: hidden;
        text-overflow: ellipsis;
        position: relative;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    
        &::after {
            content: "";
            position: absolute;
            left: 0px;
            bottom: 0px;
            width: 100%;
            height: 4em;
            background: linear-gradient(180deg, 
              rgba(255,255,255,0) 0%, 
              ${theme.palette.background.default} 70%,
              ${theme.palette.background.default} 100%);
            z-index: 2;
            transition: opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
    `
  );

  const ContentOpened = styled('div')(
    ({ theme }) => `
        height: unset;
        overflow: unset;
        text-overflow: unset;
        min-height: 8em;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    `
  );

  const ExpandButton = styled(ActionButton)(({ theme }) => ({
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(
      theme.palette.primary.main,
      0.04
    )} 100%)`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
    color: theme.palette.primary.main,

    '&:hover': {
      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)} 0%, ${alpha(
        theme.palette.primary.main,
        0.06
      )} 100%)`,
      border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
      transform: 'translateY(-1px)'
    }
  }));

  const EditButton = styled(ActionButton)(({ theme, isActive }) => ({
    background: isActive
      ? `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.15)} 0%, ${alpha(
          theme.palette.error.main,
          0.08
        )} 100%)`
      : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(
          theme.palette.background.paper,
          0.4
        )} 100%)`,
    border: `1px solid ${
      isActive ? alpha(theme.palette.error.main, 0.3) : alpha(theme.palette.divider, 0.1)
    }`,
    color: isActive ? theme.palette.error.main : 'inherit',

    '&:hover': {
      background: isActive
        ? `linear-gradient(135deg, ${alpha(theme.palette.error.main, 0.2)} 0%, ${alpha(
            theme.palette.error.main,
            0.1
          )} 100%)`
        : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(
            theme.palette.primary.main,
            0.04
          )} 100%)`,
      border: `1px solid ${
        isActive ? alpha(theme.palette.error.main, 0.4) : alpha(theme.palette.primary.main, 0.2)
      }`,
      transform: 'translateY(-1px)'
    }
  }));

  return (
    <StackStyle>
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>

      <StyledCard elevation={0}>
        <StyledCardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {`About ${user}`}
              <Chip
                label="Info"
                size="small"
                sx={{
                  height: '20px',
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  background: (theme) =>
                    theme.palette.mode === 'dark'
                      ? 'rgba(34, 177, 76, 0.1)'
                      : 'rgba(51, 102, 255, 0.1)',
                  color: (theme) => (theme.palette.mode === 'dark' ? '#22B14C' : '#3366FF'),
                  border: (theme) =>
                    `1px solid ${
                      theme.palette.mode === 'dark'
                        ? 'rgba(34, 177, 76, 0.2)'
                        : 'rgba(51, 102, 255, 0.2)'
                    }`
                }}
              />
            </Box>
          }
          subheader=""
          action={
            <Stack direction="row" spacing={1.5}>
              <Tooltip
                title={showFullContent ? 'Show less content' : 'Show more content'}
                arrow
                placement="top"
              >
                <ExpandButton
                  onClick={() => setShowFullContent(!showFullContent)}
                  edge="end"
                  size="small"
                >
                  {showFullContent ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                </ExpandButton>
              </Tooltip>
              {isAdmin && (
                <Tooltip
                  title={showEditor ? 'Apply changes and close editor' : 'Edit description'}
                  arrow
                  placement="top"
                >
                  <EditButton
                    onClick={handleClickEdit}
                    edge="end"
                    aria-label="edit"
                    size="small"
                    isActive={showEditor}
                  >
                    {showEditor ? <CloseIcon /> : <EditIcon />}
                  </EditButton>
                </Tooltip>
              )}
            </Stack>
          }
        />

        {!showEditor && description && (
          <ContentContainer>
            <Fade in={true} timeout={500}>
              {showFullContent ? (
                <ContentOpened>
                  <ReactMarkdown
                    className={darkMode ? 'reactMarkDowndark' : 'reactMarkDownlight'}
                    components={{
                      p: ({ node, ...props }) => (
                        <Typography
                          variant="body2"
                          sx={{
                            mb: 2,
                            lineHeight: 1.7,
                            color: (theme) => theme.palette.text.primary,
                            fontSize: '0.95rem'
                          }}
                          {...props}
                        />
                      ),
                      h1: ({ node, ...props }) => (
                        <Typography
                          variant="h5"
                          sx={{
                            mt: 3,
                            mb: 2,
                            fontWeight: 700,
                            background: (theme) =>
                              theme.palette.mode === 'dark'
                                ? 'linear-gradient(135deg, #22B14C 0%, #2ecc71 100%)'
                                : 'linear-gradient(135deg, #3366FF 0%, #4d79ff 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                          }}
                          {...props}
                        />
                      ),
                      h2: ({ node, ...props }) => (
                        <Typography
                          variant="h6"
                          sx={{
                            mt: 2.5,
                            mb: 1.5,
                            fontWeight: 600,
                            background: (theme) =>
                              theme.palette.mode === 'dark'
                                ? 'linear-gradient(135deg, #22B14C 0%, #2ecc71 100%)'
                                : 'linear-gradient(135deg, #3366FF 0%, #4d79ff 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
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
                            background: (theme) =>
                              theme.palette.mode === 'dark'
                                ? 'linear-gradient(135deg, #22B14C 0%, #2ecc71 100%)'
                                : 'linear-gradient(135deg, #3366FF 0%, #4d79ff 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                          }}
                          {...props}
                        />
                      ),
                      ul: ({ node, ...props }) => (
                        <Box
                          component="ul"
                          sx={{
                            mb: 2,
                            pl: 2,
                            '& li': {
                              mb: 0.5,
                              color: (theme) => theme.palette.text.secondary,
                              fontSize: '0.9rem',
                              lineHeight: 1.6
                            }
                          }}
                          {...props}
                        />
                      ),
                      ol: ({ node, ...props }) => (
                        <Box
                          component="ol"
                          sx={{
                            mb: 2,
                            pl: 2,
                            '& li': {
                              mb: 0.5,
                              color: (theme) => theme.palette.text.secondary,
                              fontSize: '0.9rem',
                              lineHeight: 1.6
                            }
                          }}
                          {...props}
                        />
                      ),
                      li: ({ node, ...props }) => (
                        <li
                          style={{
                            marginBottom: '0.5rem',
                            color: darkMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)',
                            fontSize: '0.9rem',
                            lineHeight: 1.6
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
                            mb: 2,
                            lineHeight: 1.7,
                            color: (theme) => theme.palette.text.primary,
                            fontSize: '0.95rem'
                          }}
                          {...props}
                        />
                      ),
                      h1: ({ node, ...props }) => (
                        <Typography
                          variant="h5"
                          sx={{
                            mt: 3,
                            mb: 2,
                            fontWeight: 700,
                            background: (theme) =>
                              theme.palette.mode === 'dark'
                                ? 'linear-gradient(135deg, #22B14C 0%, #2ecc71 100%)'
                                : 'linear-gradient(135deg, #3366FF 0%, #4d79ff 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                          }}
                          {...props}
                        />
                      ),
                      h2: ({ node, ...props }) => (
                        <Typography
                          variant="h6"
                          sx={{
                            mt: 2.5,
                            mb: 1.5,
                            fontWeight: 600,
                            background: (theme) =>
                              theme.palette.mode === 'dark'
                                ? 'linear-gradient(135deg, #22B14C 0%, #2ecc71 100%)'
                                : 'linear-gradient(135deg, #3366FF 0%, #4d79ff 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
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
                            background: (theme) =>
                              theme.palette.mode === 'dark'
                                ? 'linear-gradient(135deg, #22B14C 0%, #2ecc71 100%)'
                                : 'linear-gradient(135deg, #3366FF 0%, #4d79ff 100%)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                          }}
                          {...props}
                        />
                      ),
                      ul: ({ node, ...props }) => (
                        <Box
                          component="ul"
                          sx={{
                            mb: 2,
                            pl: 2,
                            '& li': {
                              mb: 0.5,
                              color: (theme) => theme.palette.text.secondary,
                              fontSize: '0.9rem',
                              lineHeight: 1.6
                            }
                          }}
                          {...props}
                        />
                      ),
                      ol: ({ node, ...props }) => (
                        <Box
                          component="ol"
                          sx={{
                            mb: 2,
                            pl: 2,
                            '& li': {
                              mb: 0.5,
                              color: (theme) => theme.palette.text.secondary,
                              fontSize: '0.9rem',
                              lineHeight: 1.6
                            }
                          }}
                          {...props}
                        />
                      ),
                      li: ({ node, ...props }) => (
                        <li
                          style={{
                            marginBottom: '0.5rem',
                            color: darkMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)',
                            fontSize: '0.9rem',
                            lineHeight: 1.6
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
          </ContentContainer>
        )}
      </StyledCard>
    </StackStyle>
  );
}
