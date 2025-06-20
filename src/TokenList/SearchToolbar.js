import axios from 'axios';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { update_filteredCount } from 'src/redux/statusSlice';

// Material
import {
  alpha,
  styled,
  useTheme,
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  Link,
  MenuItem,
  OutlinedInput,
  Select,
  Stack,
  Tab,
  Tabs,
  Tooltip,
  ToggleButton,
  ToggleButtonGroup,
  toggleButtonGroupClasses,
  Paper,
  Menu,
  SvgIcon
} from '@mui/material';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import StarRateIcon from '@mui/icons-material/StarRate';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import TroubleshootIcon from '@mui/icons-material/Troubleshoot';
import WhatshotIcon from '@mui/icons-material/Whatshot';

import FiberNewIcon from '@mui/icons-material/FiberNew';
import DoNotTouchIcon from '@mui/icons-material/DoNotTouch';
import UpdateDisabledIcon from '@mui/icons-material/UpdateDisabled';
import AppsIcon from '@mui/icons-material/Apps';
import CategoryIcon from '@mui/icons-material/Category';
import CollectionsIcon from '@mui/icons-material/Collections'; // Import the icon for "NFTs"
import DehazeIcon from '@mui/icons-material/Dehaze';
import WindowIcon from '@mui/icons-material/Window';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ElectricBoltIcon from '@mui/icons-material/ElectricBolt';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';

// Iconify
import { Icon } from '@iconify/react';
import searchFill from '@iconify/icons-eva/search-fill';
import chartLineUp from '@iconify/icons-ph/chart-line-up';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Component
import CategoriesDrawer from 'src/components/CategoriesDrawer';
import { borderRadius } from 'styled-system';
import { useRouter } from 'next/router';

// Add XPMarket icon component
const XPMarketIcon = (props) => {
  // Filter out non-DOM props that might cause warnings
  const { darkMode, ...otherProps } = props;

  return (
    <SvgIcon {...otherProps} viewBox="0 0 32 32">
      <path
        d="M17.7872 2.625H4.41504L7.67032 7.88327H14.5L17.9149 13.4089H24.4574L17.7872 2.625Z"
        fill="inherit"
      />
      <path
        d="M1 18.6667L7.67014 29.4506L10.9573 24.1627L7.54248 18.6667L10.9573 13.1708L7.67014 7.88281L1 18.6667Z"
        fill="inherit"
      />
      <path
        d="M24.3292 24.1931L30.9994 13.4092H24.4569L21.042 18.9051H14.2123L10.957 24.1931H24.3292Z"
        fill="inherit"
      />
    </SvgIcon>
  );
};

function normalizeTag(tag) {
  if (tag && tag.length > 0) {
    const tag1 = tag.split(' ').join('-'); // Replace space
    const tag2 = tag1.replace(/&/g, 'and'); // Replace &
    const tag3 = tag2.toLowerCase(); // Make lowercase
    const final = tag3.replace(/[^a-zA-Z0-9-]/g, '');
    return final;
  }
  return '';
}

// ----------------------------------------------------------------------
// Enhanced RootStyle with portfolio design
const RootStyle = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(
    theme.palette.background.paper,
    0.4
  )} 100%)`,
  backdropFilter: 'blur(20px)',
  padding: theme.spacing(1, 0),
  position: 'relative',
  // Mobile compact styling
  [theme.breakpoints.down('md')]: {
    padding: theme.spacing(0.5, 0)
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(0.25, 0)
  },
  '&::before': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '1px',
    background: theme.palette.mode === 'dark' ? alpha('#FFFFFF', 0.1) : alpha('#000000', 0.08),
    opacity: 0.6
  }
}));

const SearchBox = styled(OutlinedInput)(({ theme }) => ({
  width: 200,
  transition: theme.transitions.create(['width'], {
    easing: theme.transitions.easing.easeInOut,
    duration: theme.transitions.duration.shorter
  }),
  '&.Mui-focused': { width: 280 },
  '& fieldset': {
    borderWidth: `1px !important`,
    borderColor: `${theme.palette.grey[500_32]} !important`
  }
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

// Enhanced StyledToggleButtonGroup with portfolio styling
const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  [`& .${toggleButtonGroupClasses.grouped}`]: {
    margin: theme.spacing(0.3),
    border: 0,
    borderRadius: '8px',
    height: '28px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    // Mobile compact styling
    [theme.breakpoints.down('md')]: {
      margin: theme.spacing(0.2),
      height: '24px',
      borderRadius: '6px'
    },
    [theme.breakpoints.down('sm')]: {
      margin: theme.spacing(0.1),
      height: '22px',
      borderRadius: '4px'
    },
    [`&.${toggleButtonGroupClasses.disabled}`]: {
      border: 0
    },
    '&:hover': {
      transform: 'translateY(-1px)',
      boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`,
      // Reduce hover effects on mobile
      [theme.breakpoints.down('sm')]: {
        transform: 'none',
        boxShadow: `0 2px 6px ${alpha(theme.palette.common.black, 0.06)}`
      }
    },
    '&.Mui-selected': {
      background: 'transparent',
      color: theme.palette.primary.main,
      boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.06)}`,
      border: `1px solid ${alpha(theme.palette.divider, 0.15)} !important`,
      // Mobile selected state
      [theme.breakpoints.down('sm')]: {
        boxShadow: `0 1px 4px ${alpha(theme.palette.common.black, 0.04)}`
      }
    }
  },
  [`& .${toggleButtonGroupClasses.middleButton},& .${toggleButtonGroupClasses.lastButton}`]: {
    marginLeft: -1,
    borderLeft: '1px solid transparent'
  }
}));

function getTagValue(tags, tagName) {
  if (!tags || tags.length < 1 || !tagName) return 0;
  const idx = tags.indexOf(tagName);
  if (idx < 0) return 0;
  return idx + 1;
}

// Enhanced Chip styling function - moved outside component to prevent recreation
const getEnhancedChipStyles = (theme, isActive, color, isLoading) => ({
  borderRadius: '12px',
  height: '32px',
  fontWeight: 600,
  fontSize: '0.875rem',
  letterSpacing: '-0.01em',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  // Mobile compact styling
  [theme.breakpoints.down('md')]: {
    height: '28px',
    fontSize: '0.8125rem',
    borderRadius: '10px'
  },
  [theme.breakpoints.down('sm')]: {
    height: '26px',
    fontSize: '0.75rem',
    borderRadius: '8px'
  },
  background: isActive
    ? 'transparent'
    : `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(
        theme.palette.background.paper,
        0.4
      )} 100%)`,
  backdropFilter: 'blur(10px)',
  border: `1px solid ${
    isActive ? alpha(theme.palette.divider, 0.15) : alpha(theme.palette.divider, 0.08)
  }`,
  color: isActive ? color || theme.palette.primary.main : theme.palette.text.primary,
  boxShadow: isActive
    ? `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`
    : `0 2px 8px ${alpha(theme.palette.common.black, 0.04)}`,
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 24px ${alpha(theme.palette.common.black, 0.12)}`,
    background: 'transparent',
    border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
    // Reduce hover effects on mobile
    [theme.breakpoints.down('sm')]: {
      transform: 'translateY(-1px)',
      boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.08)}`
    }
  },
  '& .MuiChip-label': {
    px: 2,
    fontWeight: 600,
    // Mobile compact label
    [theme.breakpoints.down('sm')]: {
      px: 1.5,
      fontWeight: 500
    }
  },
  '& .MuiChip-icon': {
    fontSize: '18px',
    marginLeft: '8px',
    // Mobile compact icon
    [theme.breakpoints.down('sm')]: {
      fontSize: '16px',
      marginLeft: '6px'
    }
  },
  '@keyframes spin': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' }
  },
  opacity: isLoading ? 0.7 : 1
});

// Enhanced mobile chip styles - moved outside component
const getMobileChipStyles = (theme) => ({
  borderRadius: '12px',
  height: '36px',
  fontWeight: 600,
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)} 0%, ${alpha(
    theme.palette.background.paper,
    0.7
  )} 100%)`,
  backdropFilter: 'blur(20px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.08)}`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 24px ${alpha(theme.palette.primary.main, 0.15)}`
  }
});

// ShadowContent styled component - moved outside to prevent recreation
const ShadowContent = styled('div')(
  ({ theme }) => `
      -webkit-box-flex: 1;
      flex-grow: 1;
      height: 1em;
      overflow: hidden;
      text-overflow: ellipsis;
      position: relative;
  
      &::before {
          content: "";
          position: absolute;
          left: 0px;
          top: 0px;
          width: 8em;
          height: 100%;
          background: linear-gradient(270deg, ${theme.palette.background.default}, rgba(255,255,255,0));
          z-index: 1000;
      }
  `
);

// ----------------------------------------------------------------------
export default function SearchToolbar({
  tags,
  tagName,
  filterName,
  onFilterName,
  rows,
  viewType,
  setRows,
  showNew,
  setShowNew,
  showSlug,
  setShowSlug,
  showDate,
  setShowDate,
  setViewType,
  setTokens,
  setPage,
  setSync,
  sync
}) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { accountProfile, openSnackbar, darkMode } = useContext(AppContext);
  const isAdmin = accountProfile && accountProfile.account && accountProfile.admin;
  const theme = useTheme();

  const [tagValue, setTagValue] = useState(0);
  const [openCategoriesDrawer, setOpenCategoriesDrawer] = useState(false);
  const [gainersAnchorEl, setGainersAnchorEl] = useState(null);
  const [tokensAnchorEl, setTokensAnchorEl] = useState(null);
  const [trendingCategoriesAnchorEl, setTrendingCategoriesAnchorEl] = useState(null);
  const [isLoading, setIsLoading] = useState({
    new: false,
    gainers: false,
    mostViewed: false,
    spotlight: false,
    trending: false,
    trendingCategories: false
  });

  // Add ref for tabs to control scroll position
  const tabsRef = useRef(null);

  // Update tagValue only when tags or tagName changes to prevent unnecessary re-renders
  useEffect(() => {
    setTagValue(getTagValue(tags, tagName));
  }, [tags, tagName]);

  // Ensure tabs scroll to beginning to show Tokens tab on mount and when tagValue is 0
  useEffect(() => {
    if (tabsRef.current && (tagValue === 0 || !tagName)) {
      // Small delay to ensure tabs are rendered
      setTimeout(() => {
        // Try multiple approaches to ensure the first tab is visible
        const tabsContainer = tabsRef.current.querySelector('.MuiTabs-scroller');
        const firstTab = tabsRef.current.querySelector('.MuiTab-root');

        if (tabsContainer) {
          tabsContainer.scrollLeft = 0;
          tabsContainer.scrollTo({ left: 0, behavior: 'smooth' });
        }

        // Also try using the first tab's scrollIntoView
        if (firstTab) {
          firstTab.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'start'
          });
        }
      }, 100);
    }
  }, [tagValue, tagName]);

  // Also ensure scroll to beginning on initial mount
  useEffect(() => {
    if (tabsRef.current) {
      setTimeout(() => {
        const tabsContainer = tabsRef.current.querySelector('.MuiTabs-scroller');
        const firstTab = tabsRef.current.querySelector('.MuiTab-root');

        if (tabsContainer) {
          tabsContainer.scrollLeft = 0;
        }

        if (firstTab) {
          firstTab.scrollIntoView({
            behavior: 'auto',
            block: 'nearest',
            inline: 'start'
          });
        }
      }, 200);
    }
  }, []);

  // Get current sorting period from URL
  const currentPeriod = router.query.sort;
  const periodLabels = {
    pro5m: '5m',
    pro1h: '1h',
    pro24h: '24h',
    pro7d: '7d'
  };

  const handleChangeRows = useCallback(
    (e) => {
      setRows(parseInt(e.target.value, 10));
    },
    [setRows]
  );

  const handleDelete = useCallback(() => {}, []);

  const handleGainersClick = useCallback((event) => {
    setGainersAnchorEl(event.currentTarget);
  }, []);

  const handleGainersClose = useCallback(() => {
    setGainersAnchorEl(null);
  }, []);

  const handleGainersPeriodSelect = useCallback(
    async (period) => {
      setIsLoading((prev) => ({ ...prev, gainers: true }));
      try {
        window.location.href = `/?sort=${period}&order=desc`;
      } finally {
        setIsLoading((prev) => ({ ...prev, gainers: false }));
        handleGainersClose();
      }
    },
    [handleGainersClose]
  );

  const handleTokensClick = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setTokensAnchorEl(event.currentTarget);
  }, []);

  const handleTokensClose = useCallback(() => {
    setTokensAnchorEl(null);
  }, []);

  const handleTokenOptionSelect = useCallback(
    async (path) => {
      try {
        window.location.href = path;
      } finally {
        handleTokensClose();
      }
    },
    [handleTokensClose]
  );

  // Memoize the handlers to prevent recreating on each render
  const handleNewClick = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading((prev) => ({ ...prev, new: true }));
    try {
      window.location.href = '/?sort=dateon&order=desc';
    } finally {
      setIsLoading((prev) => ({ ...prev, new: false }));
    }
  }, []);

  const handleMostViewedClick = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading((prev) => ({ ...prev, mostViewed: true }));
    try {
      window.location.href = '/?sort=views&order=desc';
    } finally {
      setIsLoading((prev) => ({ ...prev, mostViewed: false }));
    }
  }, []);

  const handleSpotlightClick = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading((prev) => ({ ...prev, spotlight: true }));
    try {
      window.location.href = '/?sort=assessmentScore&order=desc';
    } finally {
      setIsLoading((prev) => ({ ...prev, spotlight: false }));
    }
  }, []);

  const handleTrendingClick = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsLoading((prev) => ({ ...prev, trending: true }));
    try {
      window.location.href = '/?sort=trendingScore&order=desc';
    } finally {
      setIsLoading((prev) => ({ ...prev, trending: false }));
    }
  }, []);

  const handleTrendingCategoriesClick = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    setTrendingCategoriesAnchorEl(event.currentTarget);
  }, []);

  const handleTrendingCategoriesClose = useCallback(() => {
    setTrendingCategoriesAnchorEl(null);
  }, []);

  const handleCategorySelect = useCallback(
    async (category) => {
      setIsLoading((prev) => ({ ...prev, trendingCategories: true }));
      try {
        // Use the view path format with lowercase category
        window.location.href = `/view/${category.toLowerCase()}`;
      } finally {
        setIsLoading((prev) => ({ ...prev, trendingCategories: false }));
        handleTrendingCategoriesClose();
      }
    },
    [handleTrendingCategoriesClose]
  );

  const toggleCategoriesDrawer = useCallback((isOpen = true) => {
    setOpenCategoriesDrawer(isOpen);
  }, []);

  // Memoize trending categories to prevent recalculation on every render
  const trendingCategories = useMemo(() => {
    if (!tags || tags.length === 0) return [];

    // Map colors to categories
    const categoryColors = {
      defi: '#FF5630',
      meme: '#FFAB00',
      ai: '#36B37E',
      gaming: '#9155FD',
      nft: '#2499EF',
      metaverse: '#7635DC',
      exchange: '#00AB55',
      privacy: '#B71D18'
    };

    // Select 4 popular categories from tags
    // In a real app, these would be determined by analytics
    const popularCategories = ['defi', 'meme', 'ai', 'gaming'].filter((cat) => tags.includes(cat));

    // If we don't have enough categories from our predefined list, add more from tags
    let result = [...popularCategories];
    let i = 0;
    while (result.length < 4 && i < tags.length) {
      const tag = tags[i];
      if (!result.includes(tag)) {
        result.push(tag);
      }
      i++;
    }

    // Map to the format we need
    return result.slice(0, 4).map((cat) => ({
      name: cat.charAt(0).toUpperCase() + cat.slice(1), // Capitalize first letter
      tag: cat,
      color: categoryColors[cat] || '#637381' // Use predefined color or default
    }));
  }, [tags]);

  // Memoize style objects to prevent recreation
  const mobileChipStyles = useMemo(() => getMobileChipStyles(theme), [theme]);

  // Memoize chip styles to prevent recalculation
  const tokensChipStyles = useMemo(
    () =>
      getEnhancedChipStyles(
        theme,
        tagValue === 0 && !currentPeriod,
        theme.palette.primary.main,
        false
      ),
    [theme, tagValue, currentPeriod]
  );

  const nftsChipStyles = useMemo(
    () => getEnhancedChipStyles(theme, tagValue === 1, theme.palette.success.main, false),
    [theme, tagValue]
  );

  const trendingChipStyles = useMemo(
    () =>
      getEnhancedChipStyles(
        theme,
        currentPeriod === 'trendingScore',
        '#FF5630',
        isLoading.trending
      ),
    [theme, currentPeriod, isLoading.trending]
  );

  const spotlightChipStyles = useMemo(
    () =>
      getEnhancedChipStyles(
        theme,
        currentPeriod === 'assessmentScore',
        '#2499EF',
        isLoading.spotlight
      ),
    [theme, currentPeriod, isLoading.spotlight]
  );

  const mostViewedChipStyles = useMemo(
    () => getEnhancedChipStyles(theme, currentPeriod === 'views', '#9155FD', isLoading.mostViewed),
    [theme, currentPeriod, isLoading.mostViewed]
  );

  const gainersChipStyles = useMemo(
    () =>
      getEnhancedChipStyles(
        theme,
        currentPeriod && ['pro5m', 'pro1h', 'pro24h', 'pro7d'].includes(currentPeriod),
        '#00AB55',
        isLoading.gainers
      ),
    [theme, currentPeriod, isLoading.gainers]
  );

  const newChipStyles = useMemo(
    () => getEnhancedChipStyles(theme, currentPeriod === 'dateon', '#FFAB00', isLoading.new),
    [theme, currentPeriod, isLoading.new]
  );

  const categoriesChipStyles = useMemo(
    () => getEnhancedChipStyles(theme, false, '#5569ff', false),
    [theme]
  );

  // Memoize trending category chip styles
  const getTrendingCategoryChipStyles = useCallback(
    (category) => getEnhancedChipStyles(theme, false, category.color, false),
    [theme]
  );

  // Memoize the category click handler
  const handleCategoryClick = useCallback(
    (categoryTag) => {
      handleCategorySelect(categoryTag);
    },
    [handleCategorySelect]
  );

  // Memoize the categories drawer handler
  const handleCategoriesDrawerOpen = useCallback(() => {
    setOpenCategoriesDrawer(true);
  }, []);

  return (
    <>
      <RootStyle>
        {/* Enhanced Toggle Button Group */}
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            flexWrap: 'wrap',
            borderRadius: '16px',
            padding: '4px',
            // Mobile compact styling
            [theme.breakpoints.down('md')]: {
              borderRadius: '12px',
              padding: '3px'
            },
            [theme.breakpoints.down('sm')]: {
              borderRadius: '8px',
              padding: '2px'
            },
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.background.paper,
              0.9
            )} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
            backdropFilter: 'blur(20px)',
            boxShadow: `0 4px 16px ${alpha(theme.palette.common.black, 0.06)}`
          }}
        >
          <StyledToggleButtonGroup
            size="small"
            exclusive
            value={viewType}
            onChange={(_, newType) => setViewType(newType)}
          >
            <ToggleButton size="small" value="row">
              <DehazeIcon fontSize="18px" />
            </ToggleButton>
            <ToggleButton
              size="small"
              value="heatmap"
              onClick={() => router.push('/tokens-heatmap')}
            >
              <WindowIcon fontSize="18px" />
            </ToggleButton>
          </StyledToggleButtonGroup>
        </Paper>

        {/* Enhanced Tabs */}
        <Tabs
          value={tagValue}
          variant="scrollable"
          scrollButtons="auto"
          aria-label="tag-tabs"
          sx={{
            '& .MuiTabs-indicator': {
              display: 'none'
            },
            '& .MuiTabs-flexContainer': {
              justifyContent: 'flex-start',
              gap: '8px',
              // Mobile compact gap
              [theme.breakpoints.down('md')]: {
                gap: '6px'
              },
              [theme.breakpoints.down('sm')]: {
                gap: '4px'
              }
            },
            '& .MuiTab-root': {
              minHeight: '36px',
              padding: '0 6px',
              minWidth: 'unset',
              // Mobile compact tab
              [theme.breakpoints.down('md')]: {
                minHeight: '32px',
                padding: '0 4px'
              },
              [theme.breakpoints.down('sm')]: {
                minHeight: '28px',
                padding: '0 3px'
              }
            },
            '& .MuiTabs-scrollButtons': {
              '&.Mui-disabled': {
                opacity: 0.3
              }
            }
          }}
          ref={tabsRef}
        >
          {/* Tokens Tab */}
          <Tab
            disableRipple
            label={
              <Chip
                size="small"
                icon={<AppsIcon sx={{ fontSize: '18px' }} />}
                label={'Tokens'}
                onClick={handleTokensClick}
                sx={tokensChipStyles}
              />
            }
            style={{
              paddingLeft: 0,
              paddingRight: 0
            }}
          />

          {/* NFTs Tab */}
          <Tab
            disableRipple
            label={
              <Link
                href={`/collections`}
                sx={{ pl: 0, pr: 0, display: 'inline-flex' }}
                underline="none"
                rel="noreferrer noopener nofollow"
              >
                <Chip
                  size="small"
                  icon={<CollectionsIcon sx={{ fontSize: '18px' }} />}
                  label={'NFTs'}
                  onClick={handleDelete}
                  sx={nftsChipStyles}
                />
              </Link>
            }
            style={{
              paddingLeft: 0,
              paddingRight: 0
            }}
          />

          {/* Trending Tab */}
          <Tab
            disableRipple
            label={
              <Chip
                size="small"
                icon={
                  <LocalFireDepartmentIcon
                    sx={{
                      fontSize: '18px',
                      animation: isLoading.trending ? 'spin 1s linear infinite' : 'none'
                    }}
                  />
                }
                label={'Trending'}
                onClick={handleTrendingClick}
                disabled={isLoading.trending}
                sx={trendingChipStyles}
              />
            }
            style={{
              paddingLeft: 0,
              paddingRight: 0
            }}
          />

          {/* Spotlight Tab */}
          <Tab
            disableRipple
            label={
              <Chip
                size="small"
                icon={
                  <SearchIcon
                    sx={{
                      fontSize: '18px',
                      animation: isLoading.spotlight ? 'spin 1s linear infinite' : 'none'
                    }}
                  />
                }
                label={'Spotlight'}
                onClick={handleSpotlightClick}
                disabled={isLoading.spotlight}
                sx={spotlightChipStyles}
              />
            }
            style={{
              paddingLeft: 0,
              paddingRight: 0
            }}
          />

          {/* Most Viewed Tab */}
          <Tab
            disableRipple
            label={
              <Chip
                size="small"
                icon={
                  <VisibilityIcon
                    sx={{
                      fontSize: '18px',
                      animation: isLoading.mostViewed ? 'spin 1s linear infinite' : 'none'
                    }}
                  />
                }
                label={'Most Viewed'}
                onClick={handleMostViewedClick}
                disabled={isLoading.mostViewed}
                sx={mostViewedChipStyles}
              />
            }
            style={{
              paddingLeft: 0,
              paddingRight: 0
            }}
          />

          {/* Gainers Tab */}
          <Tab
            disableRipple
            label={
              <Chip
                size="small"
                icon={
                  <TrendingUpIcon
                    sx={{
                      fontSize: '18px',
                      animation: isLoading.gainers ? 'spin 1s linear infinite' : 'none'
                    }}
                  />
                }
                label={
                  currentPeriod && periodLabels[currentPeriod]
                    ? `Gainers ${periodLabels[currentPeriod]}`
                    : 'Gainers'
                }
                onClick={handleGainersClick}
                disabled={isLoading.gainers}
                sx={gainersChipStyles}
              />
            }
            style={{
              paddingLeft: 0,
              paddingRight: 0
            }}
          />

          {/* New Tokens Tab */}
          <Tab
            disableRipple
            label={
              <Chip
                size="small"
                icon={
                  <FiberNewIcon
                    sx={{
                      fontSize: '18px',
                      animation: isLoading.new ? 'spin 1s linear infinite' : 'none'
                    }}
                  />
                }
                label={'New'}
                onClick={handleNewClick}
                disabled={isLoading.new}
                sx={newChipStyles}
              />
            }
            style={{
              paddingLeft: 0,
              paddingRight: 0
            }}
          />

          {/* Trending Categories */}
          {trendingCategories.map((category) => (
            <Tab
              key={category.tag}
              disableRipple
              label={
                <Chip
                  size="small"
                  icon={<WhatshotIcon sx={{ fontSize: '18px' }} />}
                  label={category.name}
                  onClick={() => handleCategoryClick(category.tag)}
                  sx={getTrendingCategoryChipStyles(category)}
                />
              }
              style={{
                paddingLeft: 0,
                paddingRight: 0
              }}
            />
          ))}

          {/* Categories Tab */}
          <Tab
            key={0}
            value={0}
            disableRipple
            label={
              <Chip
                size="small"
                icon={<CategoryIcon sx={{ fontSize: '18px' }} />}
                label={'Categories'}
                onClick={handleCategoriesDrawerOpen}
                sx={categoriesChipStyles}
              />
            }
            style={{
              paddingLeft: 0,
              paddingRight: 0
            }}
          />
        </Tabs>

        {/* Enhanced Rows Selector */}
        <Stack
          direction="row"
          alignItems="center"
          sx={{
            display: { xs: 'none', md: 'flex' },
            ml: 'auto',
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.background.paper,
              0.8
            )} 0%, ${alpha(theme.palette.background.paper, 0.4)} 100%)`,
            backdropFilter: 'blur(10px)',
            borderRadius: '12px',
            padding: '8px 12px',
            // Compact styling for medium screens
            [theme.breakpoints.down('lg')]: {
              borderRadius: '10px',
              padding: '6px 10px'
            },
            border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
            boxShadow: `0 4px 12px ${alpha(theme.palette.common.black, 0.06)}`
          }}
        >
          Rows
          <Select
            value={rows}
            onChange={handleChangeRows}
            sx={{
              mt: 0.4,
              ml: 1,
              '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
              '& .MuiSelect-select': {
                fontWeight: 600,
                color: theme.palette.primary.main
              }
            }}
          >
            <MenuItem value={100}>100</MenuItem>
            <MenuItem value={50}>50</MenuItem>
            <MenuItem value={20}>20</MenuItem>
          </Select>
        </Stack>

        <CategoriesDrawer
          isOpen={openCategoriesDrawer}
          toggleDrawer={toggleCategoriesDrawer}
          tags={tags}
        />

        {/* Enhanced Menu */}
        <Menu
          anchorEl={gainersAnchorEl}
          open={Boolean(gainersAnchorEl)}
          onClose={handleGainersClose}
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
              minWidth: '160px',
              borderRadius: '16px',
              // Mobile compact menu
              [theme.breakpoints.down('md')]: {
                borderRadius: '12px',
                minWidth: '140px'
              },
              [theme.breakpoints.down('sm')]: {
                borderRadius: '8px',
                minWidth: '120px'
              },
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.background.paper,
                0.95
              )} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
              '& .MuiMenuItem-root': {
                fontSize: '0.875rem',
                minHeight: '40px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderRadius: '8px',
                margin: '4px 8px',
                transition: 'all 0.2s ease',
                // Mobile compact menu items
                [theme.breakpoints.down('md')]: {
                  fontSize: '0.8125rem',
                  minHeight: '36px',
                  margin: '3px 6px',
                  borderRadius: '6px'
                },
                [theme.breakpoints.down('sm')]: {
                  fontSize: '0.75rem',
                  minHeight: '32px',
                  margin: '2px 4px',
                  borderRadius: '4px'
                },
                '&:hover': {
                  background: 'transparent',
                  transform: 'translateX(4px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                  // Reduce hover effects on mobile
                  [theme.breakpoints.down('sm')]: {
                    transform: 'translateX(2px)'
                  }
                }
              }
            }
          }}
        >
          {Object.entries(periodLabels).map(([period, label]) => (
            <MenuItem
              key={period}
              onClick={() => handleGainersPeriodSelect(period)}
              sx={{
                backgroundColor: currentPeriod === period ? 'transparent' : 'transparent',
                color: currentPeriod === period ? '#00AB55' : 'inherit',
                fontWeight: currentPeriod === period ? 600 : 400,
                border:
                  currentPeriod === period
                    ? `1px solid ${alpha(theme.palette.divider, 0.15)}`
                    : 'none'
              }}
            >
              {`${label} Gainers`}
              {currentPeriod === period && <TrendingUpIcon sx={{ fontSize: '16px', ml: 1 }} />}
            </MenuItem>
          ))}
        </Menu>

        {/* Enhanced Tokens Menu */}
        <Menu
          anchorEl={tokensAnchorEl}
          open={Boolean(tokensAnchorEl)}
          onClose={handleTokensClose}
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
              minWidth: '180px',
              borderRadius: '16px',
              // Mobile compact menu
              [theme.breakpoints.down('md')]: {
                borderRadius: '12px',
                minWidth: '160px'
              },
              [theme.breakpoints.down('sm')]: {
                borderRadius: '8px',
                minWidth: '140px'
              },
              background: `linear-gradient(135deg, ${alpha(
                theme.palette.background.paper,
                0.95
              )} 0%, ${alpha(theme.palette.background.paper, 0.8)} 100%)`,
              backdropFilter: 'blur(20px)',
              border: `1px solid ${alpha(theme.palette.divider, 0.08)}`,
              boxShadow: `0 8px 32px ${alpha(theme.palette.common.black, 0.12)}`,
              '& .MuiMenuItem-root': {
                fontSize: '0.875rem',
                minHeight: '40px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 1,
                borderRadius: '8px',
                margin: '4px 8px',
                transition: 'all 0.2s ease',
                // Mobile compact menu items
                [theme.breakpoints.down('md')]: {
                  fontSize: '0.8125rem',
                  minHeight: '36px',
                  margin: '3px 6px',
                  borderRadius: '6px'
                },
                [theme.breakpoints.down('sm')]: {
                  fontSize: '0.75rem',
                  minHeight: '32px',
                  margin: '2px 4px',
                  borderRadius: '4px'
                },
                '&:hover': {
                  background: 'transparent',
                  transform: 'translateX(4px)',
                  border: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
                  // Reduce hover effects on mobile
                  [theme.breakpoints.down('sm')]: {
                    transform: 'translateX(2px)'
                  }
                }
              }
            }
          }}
        >
          <MenuItem
            onClick={() => handleTokenOptionSelect('/')}
            sx={{
              backgroundColor: !router.query.view ? 'transparent' : 'transparent',
              color: !router.query.view ? '#00AB55' : 'inherit',
              fontWeight: !router.query.view ? 600 : 400,
              border: !router.query.view
                ? `1px solid ${alpha(theme.palette.divider, 0.15)}`
                : 'none'
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <AutoAwesomeIcon sx={{ fontSize: '16px', color: '#637381' }} />
              <span>All</span>
            </Stack>
          </MenuItem>
          <MenuItem
            onClick={() => handleTokenOptionSelect('/view/firstledger')}
            sx={{
              backgroundColor: router.query.view === 'firstledger' ? 'transparent' : 'transparent',
              color: router.query.view === 'firstledger' ? '#00AB55' : 'inherit',
              fontWeight: router.query.view === 'firstledger' ? 600 : 400,
              border:
                router.query.view === 'firstledger'
                  ? `1px solid ${alpha(theme.palette.divider, 0.15)}`
                  : 'none'
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <OpenInNewIcon sx={{ fontSize: '16px', color: '#0C53B7' }} />
              <span>FirstLedger</span>
            </Stack>
          </MenuItem>
          <MenuItem
            onClick={() => handleTokenOptionSelect('/view/magnetic-x')}
            sx={{
              backgroundColor: router.query.view === 'magnetic-x' ? 'transparent' : 'transparent',
              color: router.query.view === 'magnetic-x' ? '#00AB55' : 'inherit',
              fontWeight: router.query.view === 'magnetic-x' ? 600 : 400,
              border:
                router.query.view === 'magnetic-x'
                  ? `1px solid ${alpha(theme.palette.divider, 0.15)}`
                  : 'none'
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Box
                component="img"
                src="/magneticx-logo.webp"
                alt="Magnetic X"
                sx={{
                  width: '16px',
                  height: '16px',
                  objectFit: 'contain'
                }}
              />
              <span>Magnetic X</span>
            </Stack>
          </MenuItem>
          <MenuItem
            onClick={() => handleTokenOptionSelect('/view/xpmarket')}
            sx={{
              backgroundColor: router.query.view === 'xpmarket' ? 'transparent' : 'transparent',
              color: router.query.view === 'xpmarket' ? '#00AB55' : 'inherit',
              fontWeight: router.query.view === 'xpmarket' ? 600 : 400,
              border:
                router.query.view === 'xpmarket'
                  ? `1px solid ${alpha(theme.palette.divider, 0.15)}`
                  : 'none'
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <XPMarketIcon sx={{ fontSize: '16px', color: '#6D1FEE' }} />
              <span>XPmarket</span>
            </Stack>
          </MenuItem>
          <MenuItem
            onClick={() => handleTokenOptionSelect('/view/xrpfun')}
            sx={{
              backgroundColor: router.query.view === 'xrpfun' ? 'transparent' : 'transparent',
              color: router.query.view === 'xrpfun' ? '#00AB55' : 'inherit',
              fontWeight: router.query.view === 'xrpfun' ? 600 : 400,
              border:
                router.query.view === 'xrpfun'
                  ? `1px solid ${alpha(theme.palette.divider, 0.15)}`
                  : 'none'
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Icon
                icon={chartLineUp}
                style={{
                  fontSize: '16px',
                  color: '#B72136',
                  backgroundColor: '#fff',
                  borderRadius: '2px'
                }}
              />
              <span>xrp.fun</span>
            </Stack>
          </MenuItem>
        </Menu>
      </RootStyle>
    </>
  );
}
