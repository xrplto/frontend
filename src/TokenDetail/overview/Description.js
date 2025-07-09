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
  Box
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

  const ContentClosed = styled('div')(({ theme }) => ({
    WebkitBoxFlex: 1,
    flexGrow: 1,
    height: '10em',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    position: 'relative',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    
    '&::after': {
      content: '""',
      position: 'absolute',
      left: 0,
      bottom: 0,
      width: '100%',
      height: '5em',
      background: `linear-gradient(180deg, 
        transparent 0%, 
        ${alpha(theme.palette.background.paper, 0.7)} 60%,
        ${alpha(theme.palette.background.paper, 0.95)} 85%,
        ${theme.palette.background.paper} 100%)`,
      zIndex: 2,
      transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }));

  const ContentOpened = styled('div')(
    ({ theme }) => `
        height: unset;
        overflow: unset;
        text-overflow: unset;
        min-height: 10em;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    `
  );

  const ReadMoreButton = styled(Link)(({ theme }) => ({
    marginTop: '8px',
    padding: '6px 14px',
    borderRadius: '10px',
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: theme.palette.primary.main,
    background: `linear-gradient(145deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.main, 0.05)} 100%)`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    backdropFilter: 'blur(10px)',
    WebkitBackdropFilter: 'blur(10px)',
    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    zIndex: 3,
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    
    '&:hover': {
      background: `linear-gradient(145deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.main, 0.08)} 100%)`,
      border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
      transform: 'translateY(-2px)',
      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
    }
  }));

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
  borderRadius: { xs: '12px', sm: '16px' },
  background: `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.95)} 0%, ${alpha(
    theme.palette.background.paper,
    0.85
  )} 100%)`,
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
  boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.08)}, 0 1px 2px ${alpha(theme.palette.common.black, 0.02)}`,
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: { xs: 'none', sm: 'translateY(-2px)' },
    boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.12)}, 0 2px 4px ${alpha(theme.palette.common.black, 0.04)}`
  }
}));

const StyledCardHeader = styled(CardHeader)(({ theme }) => ({
  padding: { xs: '16px', sm: '20px 24px 16px' },
  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(
    theme.palette.primary.main,
    0.03
  )} 100%)`,
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,

  '& .MuiCardHeader-title': {
    fontSize: { xs: '1rem', sm: '1.2rem' },
    fontWeight: 800,
    background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 50%, ${theme.palette.info.main} 100%)`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    letterSpacing: '-0.02em'
  }
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  padding: '6px',
  width: 32,
  height: 32,
  background: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  borderRadius: '8px',
  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',

  '&:hover': {
    background: alpha(theme.palette.primary.main, 0.08),
    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
    transform: 'translateY(-1px)',
    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
  }
}));

const ContentContainer = styled(Box)(({ theme }) => ({
  padding: { xs: '0 16px 16px', sm: '0 24px 24px' },
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

  const ContentClosed = styled('div')(({ theme }) => ({
    WebkitBoxFlex: 1,
    flexGrow: 1,
    height: '8em',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    position: 'relative',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    
    '&::after': {
      content: '""',
      position: 'absolute',
      left: 0,
      bottom: 0,
      width: '100%',
      height: '4em',
      background: `linear-gradient(180deg, 
        transparent 0%, 
        ${alpha(theme.palette.background.paper, 0.7)} 50%,
        ${alpha(theme.palette.background.paper, 0.95)} 80%,
        ${theme.palette.background.paper} 100%)`,
      zIndex: 2,
      transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
    }
  }));

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
    background: `linear-gradient(145deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(
      theme.palette.primary.main,
      0.05
    )} 100%)`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
    color: theme.palette.primary.main,

    '&:hover': {
      background: `linear-gradient(145deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(
        theme.palette.primary.main,
        0.08
      )} 100%)`,
      border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
      transform: 'translateY(-2px)',
      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`
    }
  }));

  const EditButton = styled(ActionButton, {
    shouldForwardProp: (prop) => prop !== 'isActive'
  })(({ theme, isActive }) => ({
    background: isActive
      ? alpha(theme.palette.error.main, 0.08)
      : alpha(theme.palette.background.paper, 0.8),
    border: `1px solid ${
      isActive ? alpha(theme.palette.error.main, 0.2) : alpha(theme.palette.divider, 0.1)
    }`,
    color: isActive ? theme.palette.error.main : 'inherit',

    '&:hover': {
      background: isActive
        ? alpha(theme.palette.error.main, 0.15)
        : alpha(theme.palette.primary.main, 0.08),
      border: `1px solid ${
        isActive ? alpha(theme.palette.error.main, 0.3) : alpha(theme.palette.primary.main, 0.3)
      }`,
      transform: 'translateY(-1px)',
      boxShadow: `0 4px 12px ${
        isActive ? alpha(theme.palette.error.main, 0.2) : alpha(theme.palette.primary.main, 0.2)
      }`
    }
  }));

  return (
    <StackStyle>
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>

      <StyledCard elevation={0}>
        <StyledCardHeader
          title={`About ${user}`}
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
                          sx={(theme) => ({
                            mb: 2,
                            lineHeight: 1.8,
                            color: alpha(theme.palette.text.primary, 0.9),
                            fontSize: { xs: '0.9rem', sm: '0.95rem' },
                            fontWeight: 400
                          })}
                          {...props}
                        />
                      ),
                      h1: ({ node, ...props }) => (
                        <Typography
                          variant="h5"
                          sx={(theme) => ({
                            mt: 3,
                            mb: 2,
                            fontWeight: 800,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 50%, ${theme.palette.info.main} 100%)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.02em'
                          })}
                          {...props}
                        />
                      ),
                      h2: ({ node, ...props }) => (
                        <Typography
                          variant="h6"
                          sx={(theme) => ({
                            mt: 2.5,
                            mb: 1.5,
                            fontWeight: 700,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.01em'
                          })}
                          {...props}
                        />
                      ),
                      h3: ({ node, ...props }) => (
                        <Typography
                          variant="subtitle1"
                          sx={(theme) => ({
                            mt: 2,
                            mb: 1.5,
                            fontWeight: 700,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.info.main} 100%)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                          })}
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
                              mb: 0.75,
                              color: (theme) => alpha(theme.palette.text.secondary, 0.85),
                              fontSize: { xs: '0.85rem', sm: '0.9rem' },
                              lineHeight: 1.7,
                              fontWeight: 400
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
                              mb: 0.75,
                              color: (theme) => alpha(theme.palette.text.secondary, 0.85),
                              fontSize: { xs: '0.85rem', sm: '0.9rem' },
                              lineHeight: 1.7,
                              fontWeight: 400
                            }
                          }}
                          {...props}
                        />
                      ),
                      li: ({ node, ...props }) => (
                        <li
                          style={{
                            marginBottom: '0.75rem',
                            color: darkMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)',
                            fontSize: '0.9rem',
                            lineHeight: 1.7,
                            fontWeight: 400
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
                          sx={(theme) => ({
                            mb: 2,
                            lineHeight: 1.8,
                            color: alpha(theme.palette.text.primary, 0.9),
                            fontSize: { xs: '0.9rem', sm: '0.95rem' },
                            fontWeight: 400
                          })}
                          {...props}
                        />
                      ),
                      h1: ({ node, ...props }) => (
                        <Typography
                          variant="h5"
                          sx={(theme) => ({
                            mt: 3,
                            mb: 2,
                            fontWeight: 800,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 50%, ${theme.palette.info.main} 100%)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.02em'
                          })}
                          {...props}
                        />
                      ),
                      h2: ({ node, ...props }) => (
                        <Typography
                          variant="h6"
                          sx={(theme) => ({
                            mt: 2.5,
                            mb: 1.5,
                            fontWeight: 700,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            letterSpacing: '-0.01em'
                          })}
                          {...props}
                        />
                      ),
                      h3: ({ node, ...props }) => (
                        <Typography
                          variant="subtitle1"
                          sx={(theme) => ({
                            mt: 2,
                            mb: 1.5,
                            fontWeight: 700,
                            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.info.main} 100%)`,
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent'
                          })}
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
                              mb: 0.75,
                              color: (theme) => alpha(theme.palette.text.secondary, 0.85),
                              fontSize: { xs: '0.85rem', sm: '0.9rem' },
                              lineHeight: 1.7,
                              fontWeight: 400
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
                              mb: 0.75,
                              color: (theme) => alpha(theme.palette.text.secondary, 0.85),
                              fontSize: { xs: '0.85rem', sm: '0.9rem' },
                              lineHeight: 1.7,
                              fontWeight: 400
                            }
                          }}
                          {...props}
                        />
                      ),
                      li: ({ node, ...props }) => (
                        <li
                          style={{
                            marginBottom: '0.75rem',
                            color: darkMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.8)',
                            fontSize: '0.9rem',
                            lineHeight: 1.7,
                            fontWeight: 400
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
