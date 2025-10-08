import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  useMemo,
  useRef,
  lazy,
  Suspense,
  createContext
} from 'react';
import axios from 'axios';
import dynamic from 'next/dynamic';
import Image from 'next/image';
// Native debounce implementation
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

// Lazy load heavy components
const InfiniteScroll = dynamic(() => import('react-infinite-scroll-component'), {
  ssr: false,
  loading: () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
      <CircularProgress size={30} />
    </Box>
  )
});
import {
  FacebookShareButton,
  TwitterShareButton,
  FacebookIcon,
  TwitterIcon
} from '../components/ShareButtons';

import {
  Box,
  IconButton,
  InputAdornment,
  TextField,
  Paper,
  Fade,
  Typography,
  Skeleton,
  Chip,
  Tooltip,
  Stack,
  useTheme,
  useMediaQuery,
  Link,
  Popover,
  Divider,
  styled,
  ToggleButtonGroup,
  ToggleButton,
  Button
} from '@mui/material';
import { alpha } from '@mui/material/styles';
// Removed import of TabComponents.js - components inlined below
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  FormGroup,
  LinearProgress,
  Radio,
  RadioGroup,
  FormControl,
  Card,
  CardMedia,
  CardContent,
  Grid
} from '@mui/material';
import PropTypes from 'prop-types';
import { useEffect as useEffectReact } from 'react';
import { isEqual } from 'src/utils/formatters';

// Icons
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import LeaderboardOutlinedIcon from '@mui/icons-material/LeaderboardOutlined';
import ShareIcon from '@mui/icons-material/Share';
import EditIcon from '@mui/icons-material/Edit';
import VerifiedIcon from '@mui/icons-material/Verified';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CategoryIcon from '@mui/icons-material/Category';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import BookmarkAddedIcon from '@mui/icons-material/BookmarkAdded';
import TuneIcon from '@mui/icons-material/Tune';
import SportsScoreIcon from '@mui/icons-material/SportsScore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import InfoIcon from '@mui/icons-material/Info';

import CircularProgress from '@mui/material/CircularProgress';

// Utils & Context
import { AppContext } from 'src/AppContext';
import AccountTransactions from 'src/components/CollectionActivity';
import Watch from 'src/components/Watch';

// Inline Tab Components (previously TabComponents.js)
const TabContextProvider = createContext();

const TabContext = ({ value, children }) => {
  return <TabContextProvider.Provider value={value}>{children}</TabContextProvider.Provider>;
};

const TabPanel = ({ value, children, sx = {}, ...props }) => {
  const currentValue = useContext(TabContextProvider);

  if (currentValue !== value) {
    return null;
  }

  return (
    <Box sx={sx} {...props}>
      {children}
    </Box>
  );
};
// Constants
const getMinterName = (account) => {
  // Function to get minter name for an account
  const minterMap = {
    'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH': 'XLS-20d',
    'rNH4g2bh86BQBKrW8bEiN8xLwKvF9YB4U1': 'OnXRP',
    'rUL2FGRkkPqR5yjPH8C7X8zE6djZcX9X6t': 'XRPunks'
  };
  return minterMap[account] || null;
};
import { fNumber, fIntNumber, fVolume } from 'src/utils/formatters';
import { formatMonthYear } from 'src/utils/formatters';
import { getNftCoverUrl } from 'src/utils/parseUtils';
import { normalizeCurrencyCode } from 'src/utils/parseUtils';

// Styled Components with optimized styles
const MainContainer = styled(Box)({
  width: '100%',
  position: 'relative',
  opacity: 0,
  animation: 'fadeInUp 0.3s ease-out forwards',
  '@keyframes fadeInUp': {
    to: { opacity: 1, transform: 'translateY(0)' }
  }
});

const CompactCard = styled(Box)(({ theme }) => ({
  background: 'transparent',
  border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
  borderRadius: '24px',
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  position: 'relative',
  overflow: 'hidden',
  transition: 'transform 0.2s ease, border-color 0.2s ease',
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    borderRadius: '16px'
  }
}));

const IconCover = styled(Box)(({ theme }) => ({
  width: '80px',
  height: '80px',
  border: `2px solid ${alpha(theme.palette.divider, 0.2)}`,
  borderRadius: '16px',
  background: 'transparent',
  position: 'relative',
  overflow: 'hidden',
  transition: 'transform 0.2s ease',
  willChange: 'transform',
  '&:hover': {
    transform: 'translateY(-2px)',
    borderColor: alpha(theme.palette.primary.main, 0.3)
  },
  [theme.breakpoints.up('sm')]: {
    width: '100px',
    height: '100px'
  }
}));

const CompactStatsCard = styled(Box)(({ theme }) => ({
  background: 'transparent',
  border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
  borderRadius: { xs: '12px', sm: '16px' },
  padding: { xs: theme.spacing(1.5), sm: theme.spacing(2) },
  textAlign: 'center',
  minWidth: { xs: 'unset', sm: '100px' },
  width: { xs: '100%', sm: 'auto' },
  aspectRatio: { xs: '1 / 1', sm: 'unset' },
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center'
}));

const ActionButton = styled(IconButton)(({ theme }) => ({
  background: 'transparent',
  border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
  borderRadius: '14px',
  padding: { xs: '8px', sm: '12px' },
  transition: 'border-color 0.15s ease',
  '&:hover': {
    background: alpha(theme.palette.primary.main, 0.08),
    borderColor: alpha(theme.palette.primary.main, 0.3)
  }
}));

// Label Component
const RootStyle = styled('span')(({ theme, ownerState }) => {
  const { color, variant } = ownerState;

  const styleFilled = (color) => ({
    color: theme.palette[color].contrastText,
    backgroundColor: theme.palette[color].main
  });

  const styleOutlined = (color) => ({
    color: theme.palette[color].main,
    backgroundColor: 'transparent',
    border: `1px solid ${theme.palette[color].main}`
  });

  const styleGhost = (color) => ({
    color: theme.palette[color].dark,
    backgroundColor: alpha(theme.palette[color].main, 0.16)
  });

  return {
    height: 22,
    minWidth: 22,
    lineHeight: 0,
    borderRadius: 8,
    cursor: 'default',
    alignItems: 'center',
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    justifyContent: 'center',
    padding: theme.spacing(0, 1),
    color: theme.palette.grey[800],
    fontSize: theme.typography.pxToRem(12),
    fontFamily: theme.typography.fontFamily,
    backgroundColor: 'transparent',
    fontWeight: theme.typography.fontWeightBold,

    ...(color !== 'default'
      ? {
          ...(variant === 'filled' && { ...styleFilled(color) }),
          ...(variant === 'outlined' && { ...styleOutlined(color) }),
          ...(variant === 'ghost' && { ...styleGhost(color) })
        }
      : {
          ...(variant === 'outlined' && {
            backgroundColor: 'transparent',
            color: theme.palette.text.primary,
            border: `1px solid ${theme.palette.grey[500_32]}`
          }),
          ...(variant === 'ghost' && {
            color: theme.palette.text.secondary,
            backgroundColor: alpha(theme.palette.grey[500], 0.16)
          })
        })
  };
});

function Label({ color = 'default', variant = 'ghost', children, ...other }) {
  return (
    <RootStyle ownerState={{ color, variant }} {...other}>
      {children}
    </RootStyle>
  );
}

Label.propTypes = {
  children: PropTypes.node,
  color: PropTypes.oneOf([
    'default',
    'primary',
    'secondary',
    'info',
    'success',
    'warning',
    'error'
  ]),
  variant: PropTypes.oneOf(['filled', 'outlined', 'ghost'])
};

// AttributeFilter Component
const StyledAccordion = styled(Accordion)(({ theme }) => ({
  background: 'transparent',
  backdropFilter: 'none',
  border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  borderRadius: '12px !important',
  marginBottom: '8px !important',
  overflow: 'hidden',
  position: 'relative',
  '&:before': {
    display: 'none'
  },
  '&.Mui-expanded': {
    margin: '0 0 8px 0 !important'
  }
}));

const StyledAccordionSummary = styled(AccordionSummary)(({ theme }) => ({
  background: 'transparent',
  backdropFilter: 'none',
  borderRadius: '12px 12px 0 0',
  padding: '8px 12px',
  minHeight: '48px !important',
  transition: 'transform 0.2s ease, border-color 0.2s ease',
  '& .MuiAccordionSummary-content': {
    margin: '0 !important',
    alignItems: 'center'
  },
  '& .MuiAccordionSummary-expandIconWrapper': {
    color: theme.palette.primary.main,
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&.Mui-expanded': {
      transform: 'rotate(180deg)'
    }
  }
}));

const StyledAccordionDetails = styled(AccordionDetails)(({ theme }) => ({
  padding: '12px',
  background: 'transparent',
  backdropFilter: 'none',
  borderTop: `1px solid ${alpha(theme.palette.divider, 0.06)}`
}));

const AttributeItem = styled(Box)(({ theme, checked }) => ({
  padding: '8px 12px',
  borderRadius: '8px',
  background: 'transparent',
  border: `1px solid ${
    checked ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.divider, 0.06)
  }`,
  transition: 'border-color 0.15s ease',
  marginBottom: '6px',
  cursor: 'pointer',
  '&:hover': {
    border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`
  }
}));

const StyledLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 4,
  borderRadius: 4,
  backgroundColor: alpha(theme.palette.divider, 0.08),
  marginTop: '4px',
  '& .MuiLinearProgress-bar': {
    borderRadius: 4,
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
    boxShadow: `0 1px 2px ${alpha(theme.palette.primary.main, 0.2)}`
  }
}));

const CountChip = styled(Box)(({ theme }) => ({
  padding: '2px 8px',
  borderRadius: '8px',
  background: 'transparent',
  border: `1px solid ${alpha(theme.palette.success.main, 0.15)}`,
  color: theme.palette.success.main,
  fontWeight: 600,
  fontSize: '0.65rem',
  minWidth: '24px',
  textAlign: 'center'
}));

function AttributeFilter({ attrs, setFilterAttrs }) {
  const [attrFilter, setAttrFilter] = useState([]);

  useEffect(() => {
    const tempAttrs = [];
    for (const attr of attrs) {
      tempAttrs.push({
        trait_type: attr.title,
        value: []
      });
    }
    setAttrFilter(tempAttrs);
  }, [attrs]);

  const handleAttrChange = (title, key) => {
    const tempAttrs = [...attrFilter];
    const found = tempAttrs.find((elem) => elem.trait_type === title);

    if (found) {
      if (found.value.includes(key)) {
        let values = [...found.value];
        values.splice(found.value.indexOf(key), 1);
        found.value = values;
      } else {
        found.value.push(key);
      }

      setAttrFilter(tempAttrs);
      setFilterAttrs(tempAttrs);
    }
  };

  // Calculate total selected filters
  const totalSelected = attrFilter.reduce((sum, attr) => sum + attr.value.length, 0);

  return (
    <Box>
      {/* Header with selection count */}
      {totalSelected > 0 && (
        <Box sx={{ mb: 2 }}>
          <Chip
            icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
            label={`${totalSelected} filter${totalSelected > 1 ? 's' : ''} selected`}
            size="small"
            sx={{
              background: 'transparent',
              color: (theme) => theme.palette.primary.main,
              fontWeight: 600,
              fontSize: '0.7rem',
              height: '24px',
              border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
              '&:hover': {
                transform: 'translateY(-0.5px)'
              }
            }}
          />
        </Box>
      )}

      <Stack spacing={1}>
        {attrs.map((attr, idx) => {
          const title = attr.title;
          const items = attr.items;
          const count = Object.keys(items).length;
          const selectedCount =
            attrFilter.find((elem) => elem.trait_type === title)?.value?.length || 0;
          const maxValue = Math.max(...Object.values(items).map((item) => item.count || item));

          return (
            <StyledAccordion key={title} defaultExpanded={idx === 0}>
              <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  width="100%"
                  pr={0.5}
                >
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Box
                      sx={{
                        p: 0.5,
                        borderRadius: '6px',
                        background: 'transparent',
                        border: (theme) => `1px solid ${alpha(theme.palette.info.main, 0.15)}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <CategoryIcon
                        sx={{
                          color: 'info.main',
                          fontSize: '0.9rem'
                        }}
                      />
                    </Box>
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          color: 'text.primary',
                          fontSize: '0.85rem',
                          lineHeight: 1.2
                        }}
                      >
                        {title}
                      </Typography>
                      {selectedCount > 0 && (
                        <Typography
                          variant="caption"
                          color="primary.main"
                          sx={{
                            fontWeight: 500,
                            fontSize: '0.65rem'
                          }}
                        >
                          {selectedCount} selected
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                  <Tooltip title={`${count} options available`} placement="top" arrow>
                    <Box
                      sx={{
                        px: 1.5,
                        py: 0.25,
                        borderRadius: '12px',
                        background: 'transparent',
                        border: (theme) => `1px solid ${alpha(theme.palette.warning.main, 0.15)}`,
                        color: 'warning.main',
                        fontWeight: 600,
                        fontSize: '0.65rem',
                        minWidth: '24px',
                        textAlign: 'center'
                      }}
                    >
                      {count}
                    </Box>
                  </Tooltip>
                </Stack>
              </StyledAccordionSummary>
              <StyledAccordionDetails>
                <Stack spacing={0.5}>
                  {Object.keys(items).map((key) => {
                    const data = items[key];
                    const itemCount = data.count || data;
                    const isChecked =
                      attrFilter.find((elem) => elem.trait_type === title)?.value?.includes(key) ===
                      true;
                    const percentage = (itemCount / maxValue) * 100;

                    return (
                      <AttributeItem
                        key={title + key}
                        checked={isChecked}
                        onClick={() => handleAttrChange(title, key)}
                      >
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Checkbox
                            checked={isChecked ?? false}
                            onChange={() => handleAttrChange(title, key)}
                            color="primary"
                            size="small"
                            sx={{
                              '& .MuiSvgIcon-root': {
                                fontSize: '1rem'
                              }
                            }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Stack
                              direction="row"
                              alignItems="center"
                              justifyContent="space-between"
                              sx={{ mb: 0.25 }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 500,
                                  color: 'text.primary',
                                  fontSize: '0.75rem'
                                }}
                              >
                                {key}
                              </Typography>
                              <CountChip>{fIntNumber(itemCount)}</CountChip>
                            </Stack>
                            <Box sx={{ position: 'relative' }}>
                              <StyledLinearProgress variant="determinate" value={percentage} />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  position: 'absolute',
                                  right: 0,
                                  top: -14,
                                  fontSize: '0.6rem',
                                  fontWeight: 400
                                }}
                              >
                                {percentage.toFixed(1)}%
                              </Typography>
                            </Box>
                          </Box>
                        </Stack>
                      </AttributeItem>
                    );
                  })}
                </Stack>
              </StyledAccordionDetails>
            </StyledAccordion>
          );
        })}
      </Stack>
    </Box>
  );
}

// NFT Card Component with optimized image loading
const NFTCard = React.memo(({ nft, collection, onRemove }) => {
  const theme = useTheme();
  const { accountProfile } = useContext(AppContext);
  const isAdmin = accountProfile?.admin;
  const [loadingImg, setLoadingImg] = useState(true);
  const [imageError, setImageError] = useState(false);

  const {
    uuid,
    account,
    cost,
    costb,
    meta,
    NFTokenID,
    destination,
    rarity_rank,
    updateEvent,
    amount,
    MasterSequence
  } = nft;

  const isSold = cost?.amount || costb?.amount || amount; // Show SALE badge only if there's a price
  const imgUrl = getNftCoverUrl(nft, 'small');
  const name = nft.meta?.name || meta?.Name || 'No Name';

  const handleImageLoad = () => setLoadingImg(false);
  const handleImageError = () => {
    setLoadingImg(false);
    setImageError(true);
  };

  const handleRemoveNft = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAdmin) return;
    if (!confirm(`Are you sure you want to remove "${name}"?`)) return;
    onRemove(NFTokenID);
  };

  return (
    <Link
      href={`/nft/${NFTokenID}`}
      underline="none"
      sx={{
        display: 'block',
        position: 'relative',
        '&:hover .nft-card': {
          transform: 'translateY(-4px)',
          borderColor: alpha(theme.palette.primary.main, 0.3),
          '& .card-media': {
            transform: 'scale(1.05)'
          }
        }
      }}
    >
      <Box
        className="nft-card"
        sx={{
          width: '100%',
          aspectRatio: '1 / 1.4',
          borderRadius: 2,
          background: 'transparent',
          border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          transition: 'transform 0.15s ease',
          cursor: 'pointer'
        }}
      >
        {/* Image Section with lazy loading */}
        <Box sx={{ position: 'relative', height: '65%', overflow: 'hidden' }}>
          {loadingImg && !imageError && (
            <Skeleton
              variant="rectangular"
              sx={{ width: '100%', height: '100%', position: 'absolute' }}
            />
          )}
          {!imageError ? (
            <Box
              component="img"
              src={imgUrl}
              alt={name}
              loading="lazy"
              decoding="async"
              className="card-media"
              onLoad={handleImageLoad}
              onError={handleImageError}
              sx={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center',
                transition: 'transform 0.3s ease',
                opacity: loadingImg ? 0 : 1,
                willChange: 'transform'
              }}
            />
          ) : (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'action.disabledBackground'
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Image unavailable
              </Typography>
            </Box>
          )}

          {/* Admin Close Button */}
          {isAdmin && (
            <IconButton
              size="small"
              aria-label="Remove NFT from collection"
              onClick={handleRemoveNft}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 10,
                backgroundColor: 'background.paper',
                border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                '&:hover': {
                  backgroundColor: alpha(theme.palette.error.main, 0.1),
                  borderColor: alpha(theme.palette.error.main, 0.3),
                  color: theme.palette.error.main,
                  transform: 'rotate(90deg)'
                }
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          )}

          {/* Sale Badge - top left */}
          {isSold && !isAdmin && (
            <Box
              sx={{
                position: 'absolute',
                top: 8,
                left: 8,
                zIndex: 9,
                px: 1,
                py: 0.5,
                borderRadius: 1,
                backgroundColor: theme.palette.error.main,
                color: 'white',
                fontSize: '0.65rem',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}
            >
              SALE
            </Box>
          )}

          {/* Bottom overlays */}
          <Stack
            direction="row"
            spacing={0.5}
            sx={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              right: 8,
              flexWrap: 'wrap',
              gap: 0.5
            }}
          >
            {/* Offer Badge */}
            {costb?.amount && (
              <Chip
                label={`Offer ✕ ${fNumber(costb.amount)}`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.6rem',
                  fontWeight: 600,
                  backgroundColor: alpha(theme.palette.success.main, 0.9),
                  color: 'white',
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            )}

            {/* Transfer Badge */}
            {destination && getMinterName(account) && (
              <Chip
                icon={<SendIcon sx={{ fontSize: '0.7rem !important', color: 'white' }} />}
                label="Transfer"
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.6rem',
                  fontWeight: 600,
                  backgroundColor: alpha(theme.palette.primary.main, 0.9),
                  color: 'white',
                  '& .MuiChip-label': { px: 0.5 }
                }}
              />
            )}
          </Stack>
        </Box>

        {/* Content Section */}
        <Box
          sx={{
            p: 1.5,
            height: '35%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}
        >
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                mb: 0.5
              }}
            >
              {name}
            </Typography>
            {(cost || amount) && (
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                {cost
                  ? cost.currency === 'XRP'
                    ? `✕ ${fNumber(cost.amount)}`
                    : `${fNumber(cost.amount)} ${normalizeCurrencyCode(cost.currency)}`
                  : `✕ ${fNumber(amount)}`}
              </Typography>
            )}
          </Box>

          {/* Ranks */}
          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
            {MasterSequence > 0 && (
              <Tooltip title="On-Chain Rank">
                <Chip
                  label={`# ${fIntNumber(MasterSequence)}`}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    backgroundColor: 'transparent',
                    border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                    color: theme.palette.info.main
                  }}
                />
              </Tooltip>
            )}
            {rarity_rank > 0 && (
              <Tooltip title="Rarity Rank">
                <Chip
                  icon={<LeaderboardOutlinedIcon sx={{ fontSize: 14 }} />}
                  label={fIntNumber(rarity_rank)}
                  size="small"
                  sx={{
                    height: 22,
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    backgroundColor: 'transparent',
                    border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                    color: theme.palette.info.main
                  }}
                />
              </Tooltip>
            )}
          </Stack>
        </Box>
      </Box>
    </Link>
  );
});

// NFT Grid Component with optimized rendering
const NFTGrid = React.memo(({ collection }) => {
  const BASE_URL = 'https://api.xrpl.to/api';
  const theme = useTheme();
  const { setDeletingNfts } = useContext(AppContext);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [anchorEl, setAnchorEl] = useState(null);

  // Initialize with SSR data if available
  const initialNfts = collection?.initialNfts || [];
  const [nfts, setNfts] = useState(initialNfts);
  const [page, setPage] = useState(initialNfts.length > 0 ? 1 : 0);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState(0);
  const [subFilter, setSubFilter] = useState('default');
  const [filterAttrs, setFilterAttrs] = useState([]);
  const [isFirstLoad, setIsFirstLoad] = useState(initialNfts.length === 0);

  const sortOptions = useMemo(
    () => [
      { value: 'default', label: 'Default', icon: '📊', desc: 'Collection order' },
      { value: 'pricexrpasc', label: 'Price: Low to High', icon: '💰', desc: 'Cheapest first' },
      { value: 'pricexrpdesc', label: 'Price: High to Low', icon: '💎', desc: 'Most expensive' },
      { value: 'rarityasc', label: 'Rarity: Common First', icon: '🌟', desc: 'Common to rare' },
      { value: 'raritydesc', label: 'Rarity: Rare First', icon: '👑', desc: 'Rare to common' },
      { value: 'recent', label: 'Recently Listed', icon: '🆕', desc: 'Newest listings' }
    ],
    []
  );

  const currentSort = sortOptions.find((opt) => opt.value === subFilter) || sortOptions[0];

  // Fetch NFTs with optimized batch size
  const fetchNfts = useCallback(() => {
    setLoading(true);
    const limit = isMobile ? 16 : 24;
    const body = {
      page,
      limit,
      flag: 0,
      cid: collection?.uuid,
      search,
      filter,
      subFilter,
      filterAttrs
    };

    axios
      .post(`${BASE_URL}/nfts`, body)
      .then((res) => {
        const newNfts = res.data.nfts || [];
        setHasMore(newNfts.length === limit);
        setNfts((prev) => (page === 0 ? newNfts : [...prev, ...newNfts]));
        setDeletingNfts((prev) => (page === 0 ? newNfts : [...prev, ...newNfts]));
      })
      .catch((err) => console.error('Error fetching NFTs:', err))
      .finally(() => setLoading(false));
  }, [page, search, filter, subFilter, filterAttrs, collection?.uuid, setDeletingNfts]);

  // Reset on filter change
  useEffect(() => {
    setNfts([]);
    setPage(0);
    setHasMore(true);
  }, [search, filter, subFilter, filterAttrs]);

  // Fetch on page change
  useEffect(() => {
    // Always fetch when:
    // 1. Page is 0 and it's the first load with no initial data
    // 2. Page > 0 (loading more)
    // 3. Not first load (filters changed)
    if ((isFirstLoad && initialNfts.length === 0) || page > 0 || !isFirstLoad) {
      fetchNfts();
    }
    setIsFirstLoad(false);
  }, [fetchNfts, isFirstLoad, page, initialNfts.length]);

  const debouncedSearch = useMemo(() => debounce((value) => setSearch(value), 500), []);

  const handleRemove = useCallback(
    (NFTokenID) => {
      if (!collection) return;

      setLoading(true);
      axios
        .delete(`${BASE_URL}/nfts`, {
          data: {
            issuer: collection.account,
            taxon: collection.taxon,
            cid: collection.uuid,
            idsToDelete: NFTokenID
          }
        })
        .then(() => location.reload())
        .catch((err) => console.error('Error removing NFT:', err))
        .finally(() => setLoading(false));
    },
    [collection]
  );

  return (
    <Box sx={{ p: { xs: 0, sm: 0 }, backgroundColor: 'transparent' }}>
      {/* Search and Filter Header */}
      <Box sx={{ mb: 3 }}>
        {/* Search Bar */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            mb: 2,
            alignItems: 'stretch'
          }}
        >
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              px: 2.5,
              py: 1.5,
              borderRadius: '16px',
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              backgroundColor: 'transparent',
              transition: 'transform 0.2s ease, border-color 0.2s ease',
              '&:focus-within': {
                borderColor: theme.palette.primary.main,
                transform: 'translateY(-1px)',
                boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`
              }
            }}
          >
            <SearchIcon sx={{ color: 'text.secondary', mr: 1.5, fontSize: '1.3rem' }} />
            <TextField
              fullWidth
              variant="standard"
              placeholder={isMobile ? 'Search NFTs...' : 'Search by name, ID, or attribute...'}
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                debouncedSearch(e.target.value);
              }}
              InputProps={{
                disableUnderline: true,
                sx: { fontSize: '0.95rem' },
                endAdornment: (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    {search && (
                      <IconButton
                        size="small"
                        aria-label="Clear NFT search"
                        onClick={() => {
                          setSearch('');
                          debouncedSearch('');
                        }}
                        sx={{
                          p: 0.5,
                          '&:hover': {
                            backgroundColor: alpha(theme.palette.error.main, 0.08),
                            color: theme.palette.error.main
                          }
                        }}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    )}
                    {loading && <CircularProgress size={16} sx={{ color: 'primary.main' }} />}
                  </Stack>
                )
              }}
            />
          </Paper>

          <Stack direction="row" spacing={1}>
            {/* Sort Dropdown */}
            <Button
              variant="outlined"
              onClick={(e) => setAnchorEl(e.currentTarget)}
              endIcon={<ExpandMoreIcon />}
              sx={{
                px: 2,
                borderRadius: '16px',
                textTransform: 'none',
                fontWeight: 600,
                border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                color: theme.palette.text.primary,
                backgroundColor: 'transparent',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  borderColor: theme.palette.primary.main,
                  transform: 'translateY(-1px)'
                }
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography sx={{ fontSize: '1rem' }}>{currentSort.icon}</Typography>
                {!isMobile && (
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {currentSort.label}
                  </Typography>
                )}
              </Stack>
            </Button>

            <Button
              variant={showFilter ? 'contained' : 'outlined'}
              onClick={() => setShowFilter(!showFilter)}
              startIcon={<TuneIcon />}
              sx={{
                px: 3,
                borderRadius: '16px',
                textTransform: 'none',
                fontWeight: 600,
                minWidth: 'auto',
                backgroundColor: showFilter ? theme.palette.primary.main : 'transparent',
                border: `1px solid ${showFilter ? theme.palette.primary.main : alpha(theme.palette.divider, 0.3)}`,
                color: showFilter ? 'white' : theme.palette.text.primary,
                transition: 'transform 0.2s ease, border-color 0.2s ease',
                '&:hover': {
                  backgroundColor: showFilter
                    ? theme.palette.primary.dark
                    : alpha(theme.palette.primary.main, 0.08),
                  borderColor: theme.palette.primary.main,
                  transform: 'translateY(-1px)'
                }
              }}
            >
              {!isMobile && 'Filters'}
              {(filter > 0 || filterAttrs.length > 0) && (
                <Chip
                  size="small"
                  label={[
                    (filter & 1 ? 1 : 0) +
                      (filter & 2 ? 1 : 0) +
                      (filter & 4 ? 1 : 0) +
                      (filter & 16 ? 1 : 0) +
                      filterAttrs.length
                  ]}
                  sx={{
                    ml: 1,
                    height: 20,
                    backgroundColor: showFilter ? 'white' : alpha(theme.palette.primary.main, 0.2),
                    color: showFilter ? theme.palette.primary.main : 'white',
                    fontWeight: 700,
                    fontSize: '0.7rem'
                  }}
                />
              )}
            </Button>
          </Stack>
        </Box>

        {/* Quick Filter Pills */}
        {!showFilter && (filter > 0 || filterAttrs.length > 0) && (
          <Fade in>
            <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
              {(filter & 1) !== 0 && (
                <Chip
                  label="Buy with Mints"
                  size="small"
                  onDelete={() => setFilter(filter ^ 1)}
                  sx={{
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    '& .MuiChip-deleteIcon': {
                      color: theme.palette.primary.main,
                      '&:hover': {
                        color: theme.palette.primary.dark
                      }
                    }
                  }}
                />
              )}
              {(filter & 2) !== 0 && (
                <Chip
                  label="Recently Minted"
                  size="small"
                  onDelete={() => setFilter(filter ^ 2)}
                  sx={{
                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.success.main, 0.3)}`,
                    color: theme.palette.success.main,
                    fontWeight: 600,
                    '& .MuiChip-deleteIcon': {
                      color: theme.palette.success.main,
                      '&:hover': {
                        color: theme.palette.success.dark
                      }
                    }
                  }}
                />
              )}
              {(filter & 4) !== 0 && (
                <Chip
                  label="Buy Now"
                  size="small"
                  onDelete={() => setFilter(filter ^ 4)}
                  sx={{
                    backgroundColor: alpha(theme.palette.warning.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.warning.main, 0.3)}`,
                    color: theme.palette.warning.main,
                    fontWeight: 600,
                    '& .MuiChip-deleteIcon': {
                      color: theme.palette.warning.main,
                      '&:hover': {
                        color: theme.palette.warning.dark
                      }
                    }
                  }}
                />
              )}
              {(filter & 16) !== 0 && (
                <Chip
                  label="Rarity Sorting"
                  size="small"
                  onDelete={() => setFilter(filter ^ 16)}
                  sx={{
                    backgroundColor: alpha(theme.palette.info.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                    color: theme.palette.info.main,
                    fontWeight: 600,
                    '& .MuiChip-deleteIcon': {
                      color: theme.palette.info.main,
                      '&:hover': {
                        color: theme.palette.info.dark
                      }
                    }
                  }}
                />
              )}
              {filterAttrs.length > 0 && (
                <Chip
                  label={`${filterAttrs.reduce((sum, attr) => sum + attr.value.length, 0)} Attributes`}
                  size="small"
                  onDelete={() => setFilterAttrs([])}
                  sx={{
                    backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                    border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                    color: theme.palette.secondary.main,
                    fontWeight: 600,
                    '& .MuiChip-deleteIcon': {
                      color: theme.palette.secondary.main,
                      '&:hover': {
                        color: theme.palette.secondary.dark
                      }
                    }
                  }}
                />
              )}
              <Button
                size="small"
                onClick={() => {
                  setFilter(0);
                  setFilterAttrs([]);
                  setSubFilter(0);
                }}
                sx={{
                  textTransform: 'none',
                  fontWeight: 600,
                  color: theme.palette.error.main,
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.error.main, 0.08)
                  }
                }}
              >
                Clear All
              </Button>
            </Stack>
          </Fade>
        )}
      </Box>

      {/* Sort Menu Popover */}
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
        PaperProps={{
          sx: {
            mt: 1,
            borderRadius: '16px',
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            backgroundColor: 'transparent',
            backdropFilter: 'blur(20px)',
            minWidth: 280
          }
        }}
      >
        <Box sx={{ p: 1 }}>
          <Typography
            variant="caption"
            sx={{
              px: 2,
              py: 1,
              display: 'block',
              color: 'text.secondary',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}
          >
            Sort by
          </Typography>
          {sortOptions.map((option) => (
            <Box
              key={option.value}
              onClick={() => {
                setSubFilter(option.value);
                setAnchorEl(null);
                setPage(0);
              }}
              sx={{
                px: 2,
                py: 1.5,
                cursor: 'pointer',
                borderRadius: '12px',
                backgroundColor:
                  subFilter === option.value
                    ? alpha(theme.palette.primary.main, 0.08)
                    : 'transparent',
                transition: 'all 0.2s ease',
                '&:hover': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.05)
                }
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2}>
                <Typography sx={{ fontSize: '1.2rem' }}>{option.icon}</Typography>
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: subFilter === option.value ? 600 : 500,
                      color:
                        subFilter === option.value ? theme.palette.primary.main : 'text.primary'
                    }}
                  >
                    {option.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    {option.desc}
                  </Typography>
                </Box>
                {subFilter === option.value && (
                  <CheckCircleIcon
                    sx={{
                      fontSize: '1.2rem',
                      color: theme.palette.primary.main
                    }}
                  />
                )}
              </Stack>
            </Box>
          ))}
        </Box>
      </Popover>

      {/* Filter Section */}
      {showFilter && (
        <Fade in={showFilter}>
          <Box sx={{ mb: 3 }}>
            <FilterDetail
              collection={collection}
              filter={filter}
              setFilter={setFilter}
              subFilter={subFilter}
              setSubFilter={setSubFilter}
              filterAttrs={filterAttrs}
              setFilterAttrs={setFilterAttrs}
              setPage={setPage}
            />
          </Box>
        </Fade>
      )}

      {/* NFT Grid */}
      <InfiniteScroll
        dataLength={nfts.length}
        next={() => setPage((prev) => prev + 1)}
        hasMore={hasMore}
        loader={
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={30} sx={{ color: 'primary.main' }} />
          </Box>
        }
        endMessage={
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Image
              src="/static/empty-folder.png"
              alt="No more NFTs"
              width={120}
              height={120}
              style={{ opacity: 0.5 }}
            />
            <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
              That's all for now!
            </Typography>
          </Box>
        }
      >
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: 'repeat(2, 1fr)',
              sm: 'repeat(3, 1fr)',
              md: 'repeat(4, 1fr)',
              lg: 'repeat(6, 1fr)',
              xl: 'repeat(8, 1fr)'
            }
          }}
        >
          {nfts.map((nft) => (
            <NFTCard
              key={nft.NFTokenID}
              nft={nft}
              collection={collection}
              onRemove={handleRemove}
            />
          ))}
        </Box>
      </InfiniteScroll>
    </Box>
  );
});

// FilterAttribute Component
function FilterAttribute({ attrs, filterAttrs, setFilterAttrs }) {
  const [expanded, setExpanded] = useState(false);
  const [fAttrs, setFAttrs] = useState({});

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const handleAttrChange = (e) => {
    const value = e.target.value;
    if (fAttrs[value]) delete fAttrs[value];
    else fAttrs[value] = true;
    setFAttrs({ ...fAttrs });
  };

  const handleApplyAttrFilter = (e) => {
    setFilterAttrs({ ...fAttrs });
  };

  const handleClearAttrFilter = (e) => {
    setFAttrs({});
    setExpanded(false);
  };

  const activeFiltersCount = useMemo(() => Object.keys(fAttrs).length, [fAttrs]);

  return (
    <Box
      sx={{
        background: 'transparent',
        p: 3,
        borderRadius: 2,
        border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.1)}`
      }}
    >
      {/* Header Section */}
      <Box sx={{ mb: 4 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: '12px',
                background: 'transparent',
                border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <TuneIcon sx={{ color: 'primary.main', fontSize: '1.3rem' }} />
            </Box>
            <Box>
              <Typography
                variant="h6"
                sx={{ fontWeight: 700, color: 'text.primary', fontSize: '1.1rem' }}
              >
                Attribute Filters
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontWeight: 500, fontSize: '0.85rem' }}
              >
                Refine by specific traits
              </Typography>
            </Box>
          </Stack>
          <Chip
            label={`${activeFiltersCount} active`}
            variant={activeFiltersCount > 0 ? 'filled' : 'outlined'}
            size="small"
            sx={{
              backgroundColor:
                activeFiltersCount > 0 ? (theme) => theme.palette.primary.main : 'transparent',
              color: activeFiltersCount > 0 ? 'white' : (theme) => theme.palette.text.primary,
              border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
              fontWeight: 600
            }}
            icon={
              activeFiltersCount > 0 ? (
                <CheckCircleIcon sx={{ fontSize: '16px !important' }} />
              ) : undefined
            }
          />
        </Stack>

        {/* Action Buttons */}
        <Stack direction="row" spacing={2} justifyContent="flex-end">
          {activeFiltersCount > 0 && (
            <Button
              variant="outlined"
              onClick={handleClearAttrFilter}
              size="small"
              startIcon={<FilterListIcon sx={{ fontSize: '16px' }} />}
              sx={{
                backgroundColor: 'transparent',
                border: (theme) => `1px solid ${alpha(theme.palette.divider, 0.2)}`,
                '&:hover': {
                  backgroundColor: 'transparent',
                  borderColor: (theme) => theme.palette.primary.main
                }
              }}
            >
              Clear All
            </Button>
          )}
          {!isEqual(fAttrs, filterAttrs) && (
            <Button
              variant="contained"
              onClick={handleApplyAttrFilter}
              size="small"
              startIcon={<CheckCircleIcon sx={{ fontSize: '16px' }} />}
              sx={{
                backgroundColor: (theme) => theme.palette.primary.main,
                '&:hover': {
                  backgroundColor: (theme) => theme.palette.primary.dark
                }
              }}
            >
              Apply Filters
            </Button>
          )}
        </Stack>
      </Box>

      {/* Attributes List */}
      <Stack spacing={2}>
        {attrs.map((attr, idx) => {
          const itemCount = Object.keys(attr.items).length;
          const maxValue = Math.max(...Object.values(attr.items));
          return (
            <StyledAccordion
              key={attr.title}
              expanded={expanded === 'panel' + idx}
              onChange={handleAccordionChange('panel' + idx)}
            >
              <StyledAccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  width="100%"
                  pr={1}
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }}
                    />
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1rem' }}
                    >
                      {attr.title}
                    </Typography>
                  </Stack>
                  <Tooltip title={`${itemCount} options available`} placement="top" arrow>
                    <Box
                      sx={{
                        px: 2,
                        py: 0.5,
                        borderRadius: '16px',
                        background: 'transparent',
                        border: (theme) => `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
                        color: 'info.main',
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}
                    >
                      {itemCount}
                    </Box>
                  </Tooltip>
                </Stack>
              </StyledAccordionSummary>
              <StyledAccordionDetails>
                <Stack spacing={1}>
                  {Object.entries(attr.items).map(([key, value]) => {
                    const checkValue = `${attr.title}:${key}`;
                    const isChecked = fAttrs[checkValue] === true;
                    const percentage = (value / maxValue) * 100;
                    return (
                      <Box
                        key={checkValue}
                        sx={{
                          p: 2,
                          borderRadius: '12px',
                          background: 'transparent',
                          border: (theme) =>
                            `1px solid ${isChecked ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.divider, 0.08)}`,
                          transition: 'transform 0.2s ease, border-color 0.2s ease',
                          '&:hover': {
                            border: (theme) =>
                              `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                            transform: 'translateX(4px)'
                          }
                        }}
                      >
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Checkbox
                            checked={isChecked}
                            onChange={handleAttrChange}
                            value={checkValue}
                            color="primary"
                            sx={{ '& .MuiSvgIcon-root': { fontSize: '1.3rem' } }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Stack
                              direction="row"
                              alignItems="center"
                              justifyContent="space-between"
                              sx={{ mb: 1 }}
                            >
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.9rem' }}
                              >
                                {key}
                              </Typography>
                              <Box
                                sx={{
                                  px: 1.5,
                                  py: 0.3,
                                  borderRadius: '12px',
                                  background: 'transparent',
                                  border: (theme) =>
                                    `1px solid ${alpha(theme.palette.success.main, 0.2)}`,
                                  color: 'success.main',
                                  fontWeight: 700,
                                  fontSize: '0.7rem'
                                }}
                              >
                                {fIntNumber(value)}
                              </Box>
                            </Stack>
                            <Box sx={{ position: 'relative' }}>
                              <StyledLinearProgress variant="determinate" value={percentage} />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{
                                  position: 'absolute',
                                  right: 0,
                                  top: -20,
                                  fontSize: '0.7rem',
                                  fontWeight: 500
                                }}
                              >
                                {percentage.toFixed(1)}%
                              </Typography>
                            </Box>
                          </Box>
                        </Stack>
                      </Box>
                    );
                  })}
                </Stack>
              </StyledAccordionDetails>
            </StyledAccordion>
          );
        })}
      </Stack>
    </Box>
  );
}

// FilterDetail Component
function FilterDetail({
  collection,
  filter,
  setFilter,
  subFilter,
  setSubFilter,
  filterAttrs,
  setFilterAttrs,
  setPage
}) {
  const theme = useTheme();
  const type = collection?.type;
  const extra = collection?.extra;
  const attrs = collection?.attrs || [];
  const [expandedPanels, setExpandedPanels] = useState(['status', 'sort']);

  const handlePanelChange = (panel) => (event, isExpanded) => {
    setExpandedPanels((prev) => (isExpanded ? [...prev, panel] : prev.filter((p) => p !== panel)));
  };

  const handleFlagChange = (e) => {
    const value = e.target.value;
    let newFilter = filter ^ value;
    if (value === '4') {
      newFilter &= 0x07;
    } else if (value === '8') {
      newFilter &= 0x0b;
    } else if (value === '16') {
      newFilter &= 0x13;
    }
    setFilter(newFilter);
    setPage(0);
  };

  const handleOnSaleFlagChange = (event) => {
    const value = event.target.value;
    setSubFilter(value);
    setPage(0);
  };

  const activeFiltersCount =
    (filter & 1 ? 1 : 0) +
    (filter & 2 ? 1 : 0) +
    (filter & 4 ? 1 : 0) +
    (filter & 8 ? 1 : 0) +
    (filter & 16 ? 1 : 0) +
    (filterAttrs?.length || 0);

  return (
    <Box
      sx={{
        background: 'transparent',
        p: 2,
        borderRadius: '20px',
        border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
        position: 'sticky',
        top: 20,
        maxHeight: 'calc(100vh - 40px)',
        overflowY: 'auto',
        '&::-webkit-scrollbar': {
          width: '6px'
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent'
        },
        '&::-webkit-scrollbar-thumb': {
          background: alpha(theme.palette.primary.main, 0.2),
          borderRadius: '3px',
          '&:hover': {
            background: alpha(theme.palette.primary.main, 0.3)
          }
        }
      }}
    >
      <Box sx={{ mb: 3, p: 1 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography
            variant="h6"
            sx={{ color: 'text.primary', fontWeight: 700, fontSize: '1.1rem' }}
          >
            Filters
          </Typography>
          {activeFiltersCount > 0 && (
            <Chip
              label={`${activeFiltersCount} active`}
              size="small"
              sx={{
                height: '22px',
                fontSize: '0.7rem',
                fontWeight: 600,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: theme.palette.primary.main,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`
              }}
            />
          )}
        </Stack>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ fontWeight: 500, fontSize: '0.8rem' }}
        >
          Refine your search results
        </Typography>
      </Box>

      <Stack spacing={1.5}>
        <StyledAccordion
          expanded={expandedPanels.includes('status')}
          onChange={handlePanelChange('status')}
          sx={{
            background: 'transparent',
            border: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
            borderRadius: '12px !important',
            overflow: 'hidden',
            '&::before': { display: 'none' },
            '&.Mui-expanded': {
              margin: 0,
              borderColor: alpha(theme.palette.primary.main, 0.15)
            }
          }}
        >
          <StyledAccordionSummary
            expandIcon={
              <ExpandMoreIcon
                sx={{
                  fontSize: '1.2rem',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                  color: theme.palette.primary.main
                }}
              />
            }
            sx={{
              minHeight: '56px',
              padding: '8px 16px',
              '&.Mui-expanded': {
                minHeight: '56px'
              },
              '& .MuiAccordionSummary-content': {
                margin: '8px 0',
                '&.Mui-expanded': {
                  margin: '8px 0'
                }
              }
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
              <Box
                sx={{
                  p: 0.75,
                  borderRadius: '10px',
                  background: alpha(theme.palette.primary.main, 0.08),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <FactCheckIcon sx={{ color: 'primary.main', fontSize: '1.1rem' }} />
              </Box>
              <Typography
                variant="subtitle1"
                sx={{ color: 'text.primary', fontWeight: 600, fontSize: '0.95rem', flex: 1 }}
              >
                Status
              </Typography>
              {(filter & 1 || filter & 2 || filter & 4 || filter & 16) && (
                <Chip
                  label={
                    [
                      filter & 1 && 'Buy with Mints',
                      filter & 2 && 'Recently Minted',
                      filter & 4 && 'Buy Now',
                      filter & 16 && 'Rarity'
                    ].filter(Boolean).length
                  }
                  size="small"
                  sx={{
                    height: '20px',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    minWidth: '24px'
                  }}
                />
              )}
            </Stack>
          </StyledAccordionSummary>
          <StyledAccordionDetails>
            <Stack spacing={3}>
              {type === 'bulk' && (
                <Box
                  sx={{
                    p: 2.5,
                    borderRadius: '12px',
                    background:
                      filter & 1 ? alpha(theme.palette.primary.main, 0.04) : 'transparent',
                    border: `1px solid ${filter & 1 ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.divider, 0.08)}`,
                    transition: 'transform 0.2s ease, border-color 0.2s ease',
                    cursor: 'pointer',
                    '&:hover': {
                      transform: 'translateY(-1px)',
                      boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
                      borderColor: alpha(theme.palette.primary.main, 0.3)
                    }
                  }}
                  onClick={() => handleFlagChange({ target: { value: 1 } })}
                >
                  <Stack direction="row" alignItems="center" spacing={3}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        background: filter & 1 ? theme.palette.primary.main : 'transparent',
                        border: `1px solid ${filter & 1 ? theme.palette.primary.main : alpha(theme.palette.primary.main, 0.2)}`,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <Checkbox
                        checked={(filter & 1) !== 0}
                        onChange={handleFlagChange}
                        value={1}
                        color="primary"
                        sx={{
                          padding: 0,
                          '& .MuiSvgIcon-root': {
                            fontSize: '1.2rem',
                            color: filter & 1 ? 'white' : theme.palette.primary.main
                          }
                        }}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                        <Typography
                          variant="subtitle1"
                          sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.95rem' }}
                        >
                          Buy with Mints
                        </Typography>
                        <Chip
                          label={extra?.buyWithMints || 0}
                          size="small"
                          sx={{
                            height: '24px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            backgroundColor:
                              filter & 1
                                ? theme.palette.primary.main
                                : alpha(theme.palette.primary.main, 0.1),
                            color: filter & 1 ? 'white' : theme.palette.primary.main,
                            border: 'none'
                          }}
                        />
                      </Stack>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontWeight: 500, fontSize: '0.8rem' }}
                        >
                          Available for bulk minting purchases
                        </Typography>
                        <Tooltip
                          title="Disabled on Spinning collections, only enabled on Bulk collections."
                          placement="top"
                          arrow
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              background: alpha(theme.palette.info.main, 0.1),
                              color: 'info.main',
                              cursor: 'help',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                background: alpha(theme.palette.info.main, 0.2),
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            <MoreVertIcon sx={{ fontSize: '10px' }} />
                          </Box>
                        </Tooltip>
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
              )}

              {type !== 'normal' && (
                <Box
                  sx={{
                    p: 3,
                    borderRadius: '16px',
                    background: 'transparent',
                    border: (theme) => `1px solid ${alpha(theme.palette.success.main, 0.12)}`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      border: (theme) => `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                    }
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={3}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 48,
                        height: 48,
                        borderRadius: '12px',
                        background: 'transparent',
                        border: (theme) => `1px solid ${alpha(theme.palette.success.main, 0.2)}`
                      }}
                    >
                      <Checkbox
                        checked={(filter & 2) !== 0}
                        onChange={handleFlagChange}
                        value={2}
                        color="success"
                        sx={{ '& .MuiSvgIcon-root': { fontSize: '1.5rem' } }}
                      />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1.1rem' }}
                        >
                          Recently Minted
                        </Typography>
                        <Box
                          sx={{
                            px: 2,
                            py: 0.5,
                            borderRadius: '20px',
                            background: (theme) => theme.palette.success.main,
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.75rem'
                          }}
                        >
                          {extra?.boughtWithMints || 0}
                        </Box>
                      </Stack>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                          Fresh NFTs pending transfer or acceptance
                        </Typography>
                        <Tooltip
                          title="Display recently Minted NFTs and being transferred to users. Or NFTs that pending to be accepted by users."
                          placement="top"
                          arrow
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: (theme) => alpha(theme.palette.info.main, 0.1),
                              color: 'info.main',
                              cursor: 'help',
                              transition: 'all 0.2s ease',
                              '&:hover': {
                                background: (theme) => alpha(theme.palette.info.main, 0.2),
                                transform: 'scale(1.1)'
                              }
                            }}
                          >
                            <MoreVertIcon sx={{ fontSize: '12px' }} />
                          </Box>
                        </Tooltip>
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
              )}

              <Box
                sx={{
                  p: 2.5,
                  borderRadius: '12px',
                  background: filter & 4 ? alpha(theme.palette.warning.main, 0.04) : 'transparent',
                  border: `1px solid ${filter & 4 ? alpha(theme.palette.warning.main, 0.2) : alpha(theme.palette.divider, 0.08)}`,
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.warning.main, 0.08)}`,
                    borderColor: alpha(theme.palette.warning.main, 0.3)
                  }
                }}
                onClick={() => handleFlagChange({ target: { value: 4 } })}
              >
                <Stack direction="row" alignItems="center" spacing={2.5}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: '10px',
                      background: filter & 4 ? theme.palette.warning.main : 'transparent',
                      border: `1px solid ${filter & 4 ? theme.palette.warning.main : alpha(theme.palette.warning.main, 0.2)}`,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <Checkbox
                      checked={(filter & 4) !== 0}
                      onChange={handleFlagChange}
                      value={4}
                      sx={{
                        padding: 0,
                        color: filter & 4 ? 'white' : theme.palette.warning.main,
                        '&.Mui-checked': {
                          color: 'white'
                        },
                        '& .MuiSvgIcon-root': {
                          fontSize: '1.2rem'
                        }
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: 600, color: 'text.primary', fontSize: '0.95rem' }}
                      >
                        Buy Now
                      </Typography>
                      <Chip
                        label={extra?.onSaleCount || 0}
                        size="small"
                        sx={{
                          height: '24px',
                          fontSize: '0.7rem',
                          fontWeight: 700,
                          backgroundColor:
                            filter & 4
                              ? theme.palette.warning.main
                              : alpha(theme.palette.warning.main, 0.1),
                          color: filter & 4 ? 'white' : theme.palette.warning.main,
                          border: 'none'
                        }}
                      />
                    </Stack>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontWeight: 500, fontSize: '0.8rem' }}
                    >
                      NFTs available for immediate purchase
                    </Typography>
                  </Box>
                </Stack>

                {(filter & 0x04) !== 0 && (
                  <Fade in={true}>
                    <Box
                      sx={{
                        mt: 2,
                        p: 2,
                        background: alpha(theme.palette.warning.main, 0.02),
                        border: `1px solid ${alpha(theme.palette.warning.main, 0.1)}`,
                        borderRadius: '10px'
                      }}
                    >
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          color: 'text.primary',
                          mb: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          fontSize: '0.85rem'
                        }}
                      >
                        <TuneIcon sx={{ fontSize: '1rem', color: theme.palette.warning.main }} />
                        Sort by Price
                      </Typography>
                      <RadioGroup value={subFilter} onChange={handleOnSaleFlagChange}>
                        <Stack spacing={0.5}>
                          {[
                            {
                              value: 'pricenoxrp',
                              label: 'No XRP',
                              desc: 'Exclude XRP',
                              icon: '🚫'
                            },
                            {
                              value: 'pricexrpasc',
                              label: 'Low to High',
                              desc: 'Cheapest first',
                              icon: '📈'
                            },
                            {
                              value: 'pricexrpdesc',
                              label: 'High to Low',
                              desc: 'Most expensive',
                              icon: '📉'
                            }
                          ].map((option) => (
                            <Box
                              key={option.value}
                              sx={{
                                p: 1.5,
                                borderRadius: '8px',
                                background:
                                  subFilter === option.value
                                    ? alpha(theme.palette.warning.main, 0.08)
                                    : 'transparent',
                                border: `1px solid ${subFilter === option.value ? alpha(theme.palette.warning.main, 0.2) : 'transparent'}`,
                                transition: 'all 0.2s ease',
                                cursor: 'pointer',
                                '&:hover': {
                                  background: alpha(theme.palette.warning.main, 0.05),
                                  borderColor: alpha(theme.palette.warning.main, 0.15)
                                }
                              }}
                              onClick={() =>
                                handleOnSaleFlagChange({ target: { value: option.value } })
                              }
                            >
                              <FormControlLabel
                                value={option.value}
                                control={
                                  <Radio
                                    size="small"
                                    sx={{
                                      p: 0.5,
                                      color: theme.palette.warning.main,
                                      '&.Mui-checked': {
                                        color: theme.palette.warning.main
                                      }
                                    }}
                                  />
                                }
                                label={
                                  <Stack
                                    direction="row"
                                    alignItems="center"
                                    spacing={1}
                                    sx={{ ml: 0.5 }}
                                  >
                                    <Typography sx={{ fontSize: '1rem' }}>{option.icon}</Typography>
                                    <Box>
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          fontWeight: 600,
                                          color: 'text.primary',
                                          fontSize: '0.85rem'
                                        }}
                                      >
                                        {option.label}
                                      </Typography>
                                      <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ fontSize: '0.7rem' }}
                                      >
                                        {option.desc}
                                      </Typography>
                                    </Box>
                                  </Stack>
                                }
                                sx={{
                                  margin: 0,
                                  width: '100%',
                                  '& .MuiFormControlLabel-label': { width: '100%' }
                                }}
                              />
                            </Box>
                          ))}
                        </Stack>
                      </RadioGroup>
                    </Box>
                  </Fade>
                )}
              </Box>

              <Box
                sx={{
                  p: 3,
                  borderRadius: '16px',
                  background: 'transparent',
                  border: (theme) => `1px solid ${alpha(theme.palette.info.main, 0.12)}`,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    border: (theme) => `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                  }
                }}
              >
                <Stack direction="row" alignItems="center" spacing={3}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 48,
                      height: 48,
                      borderRadius: '12px',
                      background: 'transparent',
                      border: (theme) => `1px solid ${alpha(theme.palette.info.main, 0.2)}`
                    }}
                  >
                    <Checkbox
                      checked={(filter & 16) !== 0}
                      onChange={handleFlagChange}
                      value={16}
                      color="info"
                      sx={{ '& .MuiSvgIcon-root': { fontSize: '1.5rem' } }}
                    />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 600, color: 'text.primary', fontSize: '1.1rem' }}
                      >
                        Rarity Sorting
                      </Typography>
                    </Stack>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                        Sort NFTs by their rarity ranking
                      </Typography>
                      <Tooltip title="Sort NFTs with rarity" placement="top" arrow>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            background: (theme) => alpha(theme.palette.info.main, 0.1),
                            color: 'info.main',
                            cursor: 'help',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              background: (theme) => alpha(theme.palette.info.main, 0.2),
                              transform: 'scale(1.1)'
                            }
                          }}
                        >
                          <MoreVertIcon sx={{ fontSize: '12px' }} />
                        </Box>
                      </Tooltip>
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            </Stack>
          </StyledAccordionDetails>
        </StyledAccordion>

        <StyledAccordion
          expanded={expandedPanels.includes('attributes')}
          onChange={handlePanelChange('attributes')}
          sx={{
            background: 'transparent',
            border: `1px solid ${alpha(theme.palette.divider, 0.05)}`,
            borderRadius: '12px !important',
            overflow: 'hidden',
            '&::before': { display: 'none' },
            '&.Mui-expanded': {
              margin: 0,
              borderColor: alpha(theme.palette.success.main, 0.15)
            }
          }}
        >
          <StyledAccordionSummary
            expandIcon={
              <ExpandMoreIcon
                sx={{
                  fontSize: '1.2rem',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                  color: theme.palette.success.main
                }}
              />
            }
            sx={{
              minHeight: '56px',
              padding: '8px 16px',
              '&.Mui-expanded': {
                minHeight: '56px'
              },
              '& .MuiAccordionSummary-content': {
                margin: '8px 0',
                '&.Mui-expanded': {
                  margin: '8px 0'
                }
              }
            }}
          >
            <Stack direction="row" alignItems="center" spacing={2} sx={{ width: '100%' }}>
              <Box
                sx={{
                  p: 0.75,
                  borderRadius: '10px',
                  background: alpha(theme.palette.success.main, 0.08),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <CategoryIcon sx={{ color: 'success.main', fontSize: '1.1rem' }} />
              </Box>
              <Typography
                variant="subtitle1"
                sx={{ color: 'text.primary', fontWeight: 600, fontSize: '0.95rem', flex: 1 }}
              >
                Attributes
              </Typography>
              {filterAttrs?.length > 0 && (
                <Chip
                  label={filterAttrs.length}
                  size="small"
                  sx={{
                    height: '20px',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    backgroundColor: alpha(theme.palette.success.main, 0.1),
                    color: theme.palette.success.main,
                    minWidth: '24px'
                  }}
                />
              )}
            </Stack>
          </StyledAccordionSummary>
          <StyledAccordionDetails>
            {!attrs || attrs.length === 0 ? (
              <Box
                sx={{
                  textAlign: 'center',
                  p: 4,
                  borderRadius: '12px',
                  background: 'transparent',
                  border: (theme) => `1px dashed ${alpha(theme.palette.divider, 0.3)}`
                }}
              >
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  No Attributes Available
                </Typography>
              </Box>
            ) : (
              <AttributeFilter setFilterAttrs={setFilterAttrs} attrs={attrs} />
            )}
          </StyledAccordionDetails>
        </StyledAccordion>
      </Stack>
    </Box>
  );
}

// Collection Card Component
const CardWrapper = styled(Card)(({ theme }) => ({
  borderRadius: '10px',
  background: 'transparent',
  border: `1px solid ${alpha(theme.palette.divider, 0.15)}`,
  padding: 0,
  cursor: 'pointer',
  transition: 'transform 0.2s ease',
  overflow: 'hidden',
  paddingBottom: '5px',
  willChange: 'transform',
  '&:hover': {
    transform: 'translateY(-2px)',
    borderColor: alpha(theme.palette.primary.main, 0.3)
  }
}));

// Skeleton component for loading state
const LoadingSkeleton = () => (
  <Skeleton variant="rectangular" sx={{ width: '100%', height: '75%' }} />
);

function CollectionCard({ collectionData, type, account, handleRemove }) {
  const collection = collectionData.collection;
  const theme = useTheme();
  const { accountProfile } = useContext(AppContext);
  const isAdmin = accountProfile?.admin;
  const [loadingImg, setLoadingImg] = useState(true);

  const { NFTokenID } = collection;
  const imgUrl = `https://s1.xrpl.to/collection/${collection.logoImage}`;
  const name = collection.name || 'No Name';
  const collectionType = type.charAt(0).toUpperCase() + type.slice(1);

  const onImageLoaded = () => setLoadingImg(false);

  const handleRemoveNft = (e) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!confirm(`Are you sure you want to remove "${name}"?`)) return;
    handleRemove(NFTokenID);
  };

  return (
    <Link
      href={`/account/${account}/collection${collectionType}/${collectionData.collection.id}`}
      underline="none"
      sx={{ position: 'relative' }}
    >
      <CardWrapper
        sx={{
          marginLeft: 'auto',
          marginRight: 'auto',
          width: '100%',
          maxWidth: 280,
          aspectRatio: '9 / 15'
        }}
      >
        {isAdmin && (
          <CloseIcon
            sx={{ position: 'absolute', top: 0, right: 0, zIndex: 1500 }}
            onClick={handleRemoveNft}
          />
        )}
        <CardMedia
          component={loadingImg ? LoadingSkeleton : 'img'}
          image={imgUrl}
          loading={loadingImg.toString()}
          alt={'NFT' + collection.uuid}
          sx={{ width: '100%', height: '75%', maxWidth: 280, marginTop: 0, objectFit: 'cover' }}
        />
        <img src={imgUrl} style={{ display: 'none' }} onLoad={onImageLoaded} alt="" />
        <CardContent sx={{ padding: 0 }}>
          <Box display={'flex'} flexDirection="column" justifyContent={'space-evenly'} px={1}>
            <Typography
              variant="subtitle2"
              sx={{
                mt: 0.5,
                mb: 0.4,
                fontWeight: 600,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {name}
            </Typography>
            <Grid container alignItems="center" spacing={0.1}>
              <Grid size={{ xs: 12 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mt: 0, pl: 0, pr: 0 }}
                >
                  <Typography variant="caption" color="text.secondary">
                    {collectionData.nftCount} item(s)
                  </Typography>
                  {collection.rarity_rank > 0 && (
                    <Chip
                      variant="outlined"
                      icon={<LeaderboardOutlinedIcon sx={{ width: '11px' }} />}
                      label={
                        <Typography variant="caption">
                          {fIntNumber(collection.rarity_rank)}
                        </Typography>
                      }
                      sx={{
                        height: '18px',
                        pt: 0,
                        backgroundColor: 'transparent',
                        border: (theme) => `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                        color: (theme) => theme.palette.info.main
                      }}
                    />
                  )}
                </Stack>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" color="text.secondary">
                  {collectionData.nftsForSale} listed
                </Typography>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </CardWrapper>
    </Link>
  );
}

// Export components for external use
export { AttributeFilter, FilterDetail, FilterAttribute, CollectionCard, NFTCard };

// Main Collection View Component
export default function CollectionView({ collection }) {
  const anchorRef = useRef(null);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
  const { accountProfile, deletingNfts } = useContext(AppContext);
  const accountLogin = accountProfile?.account;
  const isAdmin = accountProfile?.admin;

  const [openShare, setOpenShare] = useState(false);
  const [value, setValue] = useState('tab-nfts');

  const BASE_URL = 'https://api.xrpl.to/api';

  // Handle undefined collection
  if (!collection) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  const {
    account,
    accountName,
    name,
    slug,
    items,
    description,
    logoImage,
    verified,
    created,
    volume,
    totalVolume,
    floor,
    totalVol24h,
    extra
  } = collection;

  const floorPrice = floor?.amount || 0;
  const volume1 = fVolume(volume || 0);
  const volume2 = fVolume(totalVolume || 0);

  const shareUrl = `https://xrpl.to/collection/${slug}`;
  const shareTitle = name;

  const statsData = [
    {
      label: 'Floor',
      value: fNumber(floorPrice),
      icon: '✕',
      color: 'primary'
    },
    {
      label: '24h Vol',
      value: fNumber(totalVol24h),
      icon: '✕',
      color: 'success'
    },
    {
      label: 'Total Vol',
      value: volume2,
      icon: '✕',
      tooltip: true,
      color: 'info'
    },
    {
      label: 'Supply',
      value: items,
      color: 'warning'
    },
    {
      label: 'Owners',
      value: extra?.owners || 0,
      color: 'secondary'
    }
  ];

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const handleRemoveAll = () => {
    if (deletingNfts.length === 0 || !isAdmin) return;

    const nftNames = deletingNfts
      ?.map((nft) => `"${nft.meta?.name}"` || `"${nft.meta?.Name}"` || `"No Name"`)
      ?.join(', ');
    const idsToDelete = deletingNfts?.map((nft) => nft._id);

    if (!confirm(`You're about to delete the following NFTs ${nftNames}?`)) return;

    axios
      .delete(`${BASE_URL}/nfts`, {
        data: {
          issuer: collection?.account,
          taxon: collection?.taxon,
          cid: collection?.uuid,
          idsToDelete
        }
      })
      .then((res) => {
        location.reload();
      })
      .catch((err) => {
      });
  };

  const truncate = (str, n) => {
    if (!str) return '';
    return str.length > n ? str.substr(0, n - 1) + ' ...' : str;
  };

  return (
    <MainContainer>
      {/* Share Popover */}
      <Popover
        open={openShare}
        onClose={() => setOpenShare(false)}
        anchorEl={anchorRef.current}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        PaperProps={{
          sx: {
            background: 'transparent',
            border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
            borderRadius: '16px',
            p: 2
          }
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2, textAlign: 'center' }}>
            Share Collection
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <>
              <FacebookShareButton url={shareUrl} quote={shareTitle}>
                <FacebookIcon size={40} round />
              </FacebookShareButton>
              <TwitterShareButton
                title={`Check out ${shareTitle} on XRPNFT`}
                url={shareUrl}
              >
                <TwitterIcon size={40} round />
              </TwitterShareButton>
            </>
            <IconButton
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                setOpenShare(false);
              }}
              sx={{
                width: 40,
                height: 40,
                border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                color: theme.palette.info.main
              }}
            >
              <MoreVertIcon />
            </IconButton>
          </Stack>
        </Box>
      </Popover>

      {/* Collection Header */}
      <CompactCard>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 2, sm: 3 }}
          alignItems={{ xs: 'stretch', sm: 'center' }}
        >
          {/* Logo Section */}
          <Box
            sx={{ flexShrink: 0, display: { xs: 'flex', sm: 'block' }, justifyContent: 'center' }}
          >
            <IconCover>
              <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                <Image
                  src={`https://s1.xrpl.to/collection/${logoImage}`}
                  alt={`${name} collection logo`}
                  fill
                  priority
                  sizes="(max-width: 600px) 90px, 100px"
                  style={{ objectFit: 'cover', borderRadius: '12px' }}
                />
              </Box>
            </IconCover>
          </Box>

          {/* Main Content Section */}
          <Stack spacing={1.5} flex={1} sx={{ minWidth: 0 }}>
            {/* Title and Actions Row */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 1, sm: 2 }}
              justifyContent="space-between"
              alignItems={{ xs: 'center', sm: 'flex-start' }}
            >
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
                <Typography
                  variant="h5"
                  fontWeight="bold"
                  sx={{ fontSize: { xs: '1.1rem', sm: '1.4rem' } }}
                >
                  {name}
                </Typography>
                {verified === 'yes' && (
                  <Tooltip title="Verified Collection">
                    <Chip
                      icon={<VerifiedIcon sx={{ fontSize: '14px !important' }} />}
                      label="Verified"
                      size="small"
                      sx={{
                        backgroundColor: 'transparent',
                        border: `1px solid ${alpha(theme.palette.info.main, 0.3)}`,
                        color: theme.palette.info.main,
                        fontWeight: 600,
                        height: '24px',
                        fontSize: '0.7rem'
                      }}
                    />
                  </Tooltip>
                )}
              </Stack>

              <Stack direction="row" alignItems="center" spacing={{ xs: 1, sm: 1.5 }}>
                {accountLogin === collection.account && (
                  <Link href={`/collection/${slug}/edit`} underline="none">
                    <Tooltip title="Edit Collection">
                      <ActionButton size="small">
                        <EditIcon sx={{ fontSize: { xs: '0.9rem', sm: '1.1rem' } }} />
                      </ActionButton>
                    </Tooltip>
                  </Link>
                )}
                <Watch collection={collection} />
                <Tooltip title="Share Collection">
                  <ActionButton size="small" ref={anchorRef} onClick={() => setOpenShare(true)}>
                    <ShareIcon sx={{ fontSize: { xs: '0.9rem', sm: '1.1rem' } }} />
                  </ActionButton>
                </Tooltip>
              </Stack>
            </Stack>

            {/* Creator and Description Row */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 1.5, sm: 3 }}
              alignItems="center"
            >
              <Box
                sx={{
                  px: 2.5,
                  py: 1.2,
                  borderRadius: '12px',
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.03)} 0%, ${alpha(theme.palette.primary.light, 0.01)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  '&:hover': {
                    transform: 'translateY(-1px)',
                    boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.08)}`,
                    borderColor: alpha(theme.palette.primary.main, 0.25),
                    '& .date-badge': {
                      transform: 'scale(1.05)',
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.15)} 0%, ${alpha(theme.palette.primary.light, 0.1)} 100%)`
                    }
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: `linear-gradient(90deg, transparent, ${alpha(theme.palette.primary.main, 0.05)}, transparent)`,
                    animation: 'shimmer 3s infinite'
                  },
                  '@keyframes shimmer': {
                    '100%': { left: '100%' }
                  }
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      p: 0.5,
                      borderRadius: '6px',
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <PeopleIcon sx={{ fontSize: '0.9rem', color: theme.palette.primary.main }} />
                  </Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.75rem',
                      fontWeight: 500,
                      color: alpha(theme.palette.text.secondary, 0.7),
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}
                  >
                    Created by
                  </Typography>
                  <Link color="inherit" href={`/profile/${account}`} underline="none">
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'translateY(-1px)',
                          filter: 'brightness(1.2)'
                        }
                      }}
                    >
                      {accountName || account.slice(0, 4) + '...' + account.slice(-4)}
                    </Typography>
                  </Link>
                  <Box
                    className="date-badge"
                    sx={{
                      ml: 'auto',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: '20px',
                      background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.primary.light, 0.04)} 100%)`,
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      transition: 'all 0.2s ease',
                      position: 'relative',
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: theme.palette.success.main,
                        boxShadow: `0 0 8px ${alpha(theme.palette.success.main, 0.6)}`,
                        animation: 'pulse 2s infinite'
                      },
                      '@keyframes pulse': {
                        '0%, 100%': { opacity: 1, transform: 'translate(-50%, -50%) scale(1)' },
                        '50%': { opacity: 0.6, transform: 'translate(-50%, -50%) scale(1.5)' }
                      }
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        color: theme.palette.primary.main,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        pl: 1.5
                      }}
                    >
                      {formatMonthYear(created)}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              {description && (
                <Typography
                  variant="body2"
                  sx={{
                    color: 'text.secondary',
                    fontSize: { xs: '0.75rem', sm: '0.85rem' },
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                    minWidth: 0,
                    lineHeight: 1.3,
                    fontStyle: 'italic'
                  }}
                >
                  "{truncate(description, fullScreen ? 60 : 100)}"
                </Typography>
              )}
            </Stack>
          </Stack>

          {/* Stats Section */}
          <Box
            sx={{
              display: { xs: 'grid', sm: 'flex' },
              gridTemplateColumns: { xs: 'repeat(2, 1fr)' },
              gap: { xs: 0.5, sm: 1.5 },
              flexDirection: 'row',
              flexShrink: 0,
              width: { xs: '100%', sm: 'auto' },
              mt: { xs: 2, sm: 0 }
            }}
          >
            {statsData
              .filter((item, index) => index < 4)
              .map((item) => (
                <CompactStatsCard key={item.label}>
                  <Box sx={{ width: '100%' }}>
                    <Typography
                      variant="subtitle2"
                      fontWeight="bold"
                      sx={{ fontSize: { xs: '1rem', sm: '1.1rem' }, mb: 0.5 }}
                    >
                      {item.icon && <span style={{ marginRight: '3px' }}>{item.icon}</span>}
                      {item.value}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontSize: { xs: '0.7rem', sm: '0.75rem' },
                        fontWeight: 500,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.5
                      }}
                    >
                      {item.label}
                      {item.tooltip && (
                        <Tooltip title={`Volume on XRPNFT: ${volume1}`}>
                          <MoreVertIcon
                            icon={<InfoIcon />}
                            style={{
                              fontSize: '10px',
                              color: theme.palette.text.secondary,
                              cursor: 'help'
                            }}
                          />
                        </Tooltip>
                      )}
                    </Typography>
                  </Box>
                </CompactStatsCard>
              ))}
          </Box>
        </Stack>
      </CompactCard>

      {/* NFTs and Activity Tabs */}
      <CompactCard>
        <TabContext value={value}>
          <Box
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              display: 'flex',
              justifyContent: 'space-between',
              mb: 3
            }}
          >
            <ToggleButtonGroup
              value={value}
              exclusive
              onChange={(e, newValue) => newValue && handleChange(e, newValue)}
              size="medium"
              sx={{
                bgcolor: 'transparent',
                borderRadius: '16px',
                padding: '4px',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                '& .MuiToggleButton-root': {
                  border: 'none',
                  borderRadius: '12px !important',
                  color: alpha(theme.palette.text.secondary, 0.8),
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  textTransform: 'none',
                  px: 3,
                  py: 1.5,
                  minWidth: '100px',
                  transition: 'transform 0.2s ease, border-color 0.2s ease',
                  '&.Mui-selected': {
                    bgcolor: 'transparent',
                    color: theme.palette.primary.main,
                    fontWeight: 600,
                    borderColor: theme.palette.primary.main,
                    border: `1px solid ${theme.palette.primary.main}`
                  },
                  '&:hover': {
                    bgcolor: 'transparent',
                    color: theme.palette.primary.main
                  }
                }
              }}
            >
              <ToggleButton value="tab-nfts">NFTs</ToggleButton>
              <ToggleButton value="tab-creator-transactions">Activity</ToggleButton>
            </ToggleButtonGroup>

            {isAdmin && value === 'tab-nfts' && (
              <Button
                variant="outlined"
                color="error"
                sx={{ py: 0.5 }}
                onClick={handleRemoveAll}
                disabled={deletingNfts.length === 0}
              >
                Delete All
              </Button>
            )}
          </Box>

          <TabPanel value="tab-nfts" sx={{ p: 0 }}>
            <NFTGrid collection={collection} />
          </TabPanel>
          <TabPanel value="tab-creator-transactions" sx={{ p: 0 }}>
            <AccountTransactions creatorAccount={collection?.account} />
          </TabPanel>
        </TabContext>
      </CompactCard>
    </MainContainer>
  );
}
