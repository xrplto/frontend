import axios from 'axios';
import { useState, useEffect, useRef } from 'react';

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
  Menu
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

// Iconify
import { Icon } from '@iconify/react';
import searchFill from '@iconify/icons-eva/search-fill';

// Context
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';

// Component
import CategoriesDrawer from 'src/components/CategoriesDrawer';
import { borderRadius } from 'styled-system';
import { useRouter } from 'next/router';

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
const RootStyle = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  borderBottom: `1px solid ${alpha('#CBCCD2', 0.1)}`
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

const StyledToggleButtonGroup = styled(ToggleButtonGroup)(({ theme }) => ({
  [`& .${toggleButtonGroupClasses.grouped}`]: {
    margin: theme.spacing(0.3),
    border: 0,
    borderRadius: '4px',
    height: '24px',
    [`&.${toggleButtonGroupClasses.disabled}`]: {
      border: 0
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
  setViewType
}) {
  const router = useRouter();
  const { accountProfile, openSnackbar, darkMode } = useContext(AppContext);
  const isAdmin = accountProfile && accountProfile.account && accountProfile.admin;
  const theme = useTheme();

  const [tagValue, setTagValue] = useState(getTagValue(tags, tagName));
  const [openCategoriesDrawer, setOpenCategoriesDrawer] = useState(false);
  const [gainersAnchorEl, setGainersAnchorEl] = useState(null);

  // Get current sorting period from URL
  const currentPeriod = router.query.sort;
  const periodLabels = {
    pro5m: '5m',
    pro1h: '1h',
    pro24h: '24h',
    pro7d: '7d'
  };

  const handleChangeRows = (e) => {
    setRows(parseInt(e.target.value, 10));
  };

  const handleDelete = () => {};

  const toggleCategoriesDrawer = (isOpen = true) => {
    setOpenCategoriesDrawer(isOpen);
  };

  const handleGainersClick = (event) => {
    setGainersAnchorEl(event.currentTarget);
  };

  const handleGainersClose = () => {
    setGainersAnchorEl(null);
  };

  const handleGainersPeriodSelect = (period) => {
    onFilterName({ target: { value: '' } });
    router.push({
      pathname: '/',
      query: { sortBy: period, sortType: 'desc' }
    });
    handleGainersClose();
  };

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

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.5}
        sx={{ display: { xs: 'block', md: 'none' }, mb: 2 }}
      >
        <Link
          underline="none"
          color="inherit"
          // target="_blank"
          href={`/watchlist`}
          rel="noreferrer noopener nofollow"
        >
          {/* <Button variant="outlined" startIcon={<StarRateIcon />} size="small" color="disabled">
                        Watchlist
                    </Button> */}
          <Chip
            variant={'outlined'}
            icon={<StarOutlineIcon fontSize="small" />}
            label={'Watchlist'}
            onClick={() => {}}
            sx={{
              borderRadius: '8px'
            }}
          />
        </Link>

        <Chip
          variant={'outlined'}
          icon={<TroubleshootIcon fontSize="small" />}
          label={'Portfolio'}
          onClick={() => {
            openSnackbar('Coming soon!', 'success');
          }}
          sx={{
            borderRadius: '8px'
          }}
        />
      </Stack>

      <RootStyle>
        {/* <SearchBox
                    value={filterName}
                    onChange={onFilterName}
                    placeholder="Search ..."
                    size="small"
                    startAdornment={
                        <InputAdornment position="start">
                            <Box component={Icon} icon={searchFill} sx={{ color: 'text.disabled' }} />
                        </InputAdornment>
                    }
                    sx={{pb:0.3}}
                /> */}
        <Paper
          elevation={0}
          sx={{
            display: 'flex',
            border: (theme) => `1px solid ${theme.palette.divider}`,
            flexWrap: 'wrap',
            borderRadius: '6px',
            padding: '1px 4px'
          }}
        >
          <StyledToggleButtonGroup
            size="small"
            exclusive
            value={viewType}
            onChange={(_, newType) => setViewType(newType)}
          >
            <ToggleButton size="small" value="row">
              <DehazeIcon fontSize="16px" />
            </ToggleButton>
            <ToggleButton
              size="small"
              value="heatmap"
              onClick={() => router.push('/tokens-heatmap')}
            >
              <WindowIcon fontSize="16px" />
            </ToggleButton>
          </StyledToggleButtonGroup>
        </Paper>

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
              gap: '4px'
            },
            '& .MuiTab-root': {
              minHeight: '32px',
              padding: '0 4px',
              minWidth: 'unset'
            }
          }}
        >
          {/* Tokens Tab */}
          <Tab
            disableRipple
            label={
              <Link
                href={`/`}
                sx={{ pl: 0, pr: 0, display: 'inline-flex' }}
                underline="none"
                rel="noreferrer noopener nofollow"
              >
                <Chip
                  size="small"
                  icon={<AppsIcon sx={{ fontSize: '16px' }} />}
                  label={'Tokens'}
                  onClick={handleDelete}
                  color={tagValue === 0 && !currentPeriod ? 'primary' : undefined}
                  sx={{
                    borderRadius: '4px',
                    height: '24px',
                    '& .MuiChip-label': {
                      px: 1
                    }
                  }}
                />
              </Link>
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
                  icon={<CollectionsIcon sx={{ fontSize: '16px' }} />}
                  label={'NFTs'}
                  onClick={handleDelete}
                  color={tagValue === 1 ? 'primary' : undefined}
                  sx={{
                    borderRadius: '4px',
                    height: '24px',
                    '& .MuiChip-label': {
                      px: 1
                    }
                  }}
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
                icon={<LocalFireDepartmentIcon sx={{ fontSize: '16px' }} />}
                label={'Trending'}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onFilterName({ target: { value: '' } });
                  router.push({
                    pathname: '/',
                    query: { sortBy: 'trendingScore', sortType: 'desc' }
                  });
                }}
                sx={{
                  borderRadius: '4px',
                  height: '24px',
                  backgroundColor:
                    currentPeriod === 'trendingScore'
                      ? darkMode
                        ? 'rgba(255, 86, 48, 0.16)'
                        : 'rgba(255, 86, 48, 0.08)'
                      : 'transparent',
                  color:
                    currentPeriod === 'trendingScore'
                      ? darkMode
                        ? '#FF5630'
                        : '#B71D18'
                      : 'inherit',
                  '&:hover': {
                    backgroundColor:
                      currentPeriod === 'trendingScore'
                        ? darkMode
                          ? 'rgba(255, 86, 48, 0.24)'
                          : 'rgba(255, 86, 48, 0.16)'
                        : ''
                  },
                  '& .MuiChip-label': {
                    px: 1
                  }
                }}
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
                icon={<SearchIcon sx={{ fontSize: '16px' }} />}
                label={'Spotlight'}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onFilterName({ target: { value: '' } });
                  router.push({
                    pathname: '/',
                    query: { sort: 'assessmentScore', order: 'desc' }
                  });
                }}
                sx={{
                  borderRadius: '4px',
                  height: '24px',
                  backgroundColor:
                    currentPeriod === 'assessmentScore'
                      ? darkMode
                        ? 'rgba(36, 153, 239, 0.16)'
                        : 'rgba(36, 153, 239, 0.08)'
                      : 'transparent',
                  color:
                    currentPeriod === 'assessmentScore'
                      ? darkMode
                        ? '#2499EF'
                        : '#0C53B7'
                      : 'inherit',
                  '&:hover': {
                    backgroundColor:
                      currentPeriod === 'assessmentScore'
                        ? darkMode
                          ? 'rgba(36, 153, 239, 0.24)'
                          : 'rgba(36, 153, 239, 0.16)'
                        : ''
                  },
                  '& .MuiChip-label': {
                    px: 1
                  }
                }}
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
                icon={<VisibilityIcon sx={{ fontSize: '16px' }} />}
                label={'Most Viewed'}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onFilterName({ target: { value: '' } });
                  router.push({
                    pathname: '/',
                    query: { sort: 'views', order: 'desc' }
                  });
                }}
                sx={{
                  borderRadius: '4px',
                  height: '24px',
                  backgroundColor:
                    currentPeriod === 'views'
                      ? darkMode
                        ? 'rgba(145, 85, 253, 0.16)'
                        : 'rgba(145, 85, 253, 0.08)'
                      : 'transparent',
                  color: currentPeriod === 'views' ? (darkMode ? '#9155FD' : '#7635DC') : 'inherit',
                  '&:hover': {
                    backgroundColor:
                      currentPeriod === 'views'
                        ? darkMode
                          ? 'rgba(145, 85, 253, 0.24)'
                          : 'rgba(145, 85, 253, 0.16)'
                        : ''
                  },
                  '& .MuiChip-label': {
                    px: 1
                  }
                }}
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
                icon={<TrendingUpIcon sx={{ fontSize: '16px' }} />}
                label={
                  currentPeriod && periodLabels[currentPeriod]
                    ? `Gainers ${periodLabels[currentPeriod]}`
                    : 'Gainers'
                }
                onClick={handleGainersClick}
                sx={{
                  borderRadius: '4px',
                  height: '24px',
                  backgroundColor:
                    currentPeriod && ['pro5m', 'pro1h', 'pro24h', 'pro7d'].includes(currentPeriod)
                      ? darkMode
                        ? 'rgba(0, 171, 85, 0.16)'
                        : 'rgba(0, 123, 85, 0.08)'
                      : 'transparent',
                  color:
                    currentPeriod && ['pro5m', 'pro1h', 'pro24h', 'pro7d'].includes(currentPeriod)
                      ? darkMode
                        ? '#00AB55'
                        : '#007B55'
                      : 'inherit',
                  '&:hover': {
                    backgroundColor:
                      currentPeriod && ['pro5m', 'pro1h', 'pro24h', 'pro7d'].includes(currentPeriod)
                        ? darkMode
                          ? 'rgba(0, 171, 85, 0.24)'
                          : 'rgba(0, 123, 85, 0.16)'
                        : ''
                  },
                  '& .MuiChip-label': {
                    px: 1
                  }
                }}
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
                icon={<FiberNewIcon sx={{ fontSize: '16px' }} />}
                label={'New Tokens'}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onFilterName({ target: { value: '' } });
                  router.push({
                    pathname: '/',
                    query: { sortBy: 'dateon', sortType: 'desc' }
                  });
                }}
                sx={{
                  borderRadius: '4px',
                  height: '24px',
                  '& .MuiChip-label': {
                    px: 1
                  }
                }}
              />
            }
            style={{
              paddingLeft: 0,
              paddingRight: 0
            }}
          />

          {/* Categories Tab */}
          <Tab
            key={0}
            value={0}
            disableRipple
            label={
              <Chip
                size="small"
                icon={<CategoryIcon sx={{ fontSize: '16px' }} />}
                label={'Categories'}
                onClick={() => setOpenCategoriesDrawer(true)}
                sx={{
                  color: darkMode ? '#007B55 !important' : '#5569ff !important',
                  borderRadius: '4px',
                  height: '24px',
                  '& .MuiChip-label': {
                    px: 1
                  }
                }}
              />
            }
            style={{
              paddingLeft: 0,
              paddingRight: 0
            }}
          />
        </Tabs>

        <Stack
          direction="row"
          alignItems="center"
          sx={{ display: { xs: 'none', md: 'flex' }, ml: 'auto' }}
        >
          {isAdmin && (
            <Stack direction="row" alignItems="center" sx={{ mr: 2, mt: 0.5 }}>
              <IconButton
                onClick={() => {
                  setShowNew(!showNew);
                }}
              >
                <FiberNewIcon color={showNew ? 'error' : 'inherit'} />
              </IconButton>

              <IconButton
                onClick={() => {
                  setShowSlug(!showSlug);
                }}
              >
                <DoNotTouchIcon color={showSlug ? 'error' : 'inherit'} />
              </IconButton>

              <IconButton
                onClick={() => {
                  setShowDate(!showDate);
                }}
              >
                <UpdateDisabledIcon color={showDate ? 'error' : 'inherit'} />
              </IconButton>
            </Stack>
          )}
          Rows
          <Select
            value={rows}
            onChange={handleChangeRows}
            sx={{
              mt: 0.4,
              '& .MuiOutlinedInput-notchedOutline': { border: 'none' }
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
          normalizeTag={normalizeTag}
        />

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
              '& .MuiMenuItem-root': {
                fontSize: '0.875rem',
                minHeight: '32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }
            }
          }}
        >
          {Object.entries(periodLabels).map(([period, label]) => (
            <MenuItem
              key={period}
              onClick={() => handleGainersPeriodSelect(period)}
              sx={{
                backgroundColor:
                  currentPeriod === period
                    ? darkMode
                      ? 'rgba(0, 171, 85, 0.16)'
                      : 'rgba(0, 123, 85, 0.08)'
                    : 'transparent',
                color: currentPeriod === period ? (darkMode ? '#00AB55' : '#007B55') : 'inherit',
                '&:hover': {
                  backgroundColor:
                    currentPeriod === period
                      ? darkMode
                        ? 'rgba(0, 171, 85, 0.24)'
                        : 'rgba(0, 123, 85, 0.16)'
                      : ''
                }
              }}
            >
              {`${label} Gainers`}
              {currentPeriod === period && <TrendingUpIcon sx={{ fontSize: '16px', ml: 1 }} />}
            </MenuItem>
          ))}
        </Menu>
      </RootStyle>
    </>
  );
}
