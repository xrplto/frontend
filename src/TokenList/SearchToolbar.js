import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  Box,
  Button,
  ButtonGroup,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Chip,
  Stack,
  Typography,
  Tooltip,
  Paper,
  alpha,
  useTheme
} from '@mui/material';

// Icons
import AppsIcon from '@mui/icons-material/Apps';
import GridViewIcon from '@mui/icons-material/GridView';
import TableRowsIcon from '@mui/icons-material/TableRows';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import NewReleasesIcon from '@mui/icons-material/NewReleases';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import VisibilityIcon from '@mui/icons-material/Visibility';
import StarIcon from '@mui/icons-material/Star';
import CategoryIcon from '@mui/icons-material/Category';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import CollectionsIcon from '@mui/icons-material/Collections';
import ViewListIcon from '@mui/icons-material/ViewList';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';

import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
import CategoriesDrawer from 'src/components/CategoriesDrawer';

// Helper function
function getTagValue(tags, tagName) {
  if (!tags || tags.length < 1 || !tagName) return 0;
  const idx = tags.indexOf(tagName);
  if (idx < 0) return 0;
  return idx + 1;
}

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
  sync,
  currentOrderBy,
  setOrderBy
}) {
  const router = useRouter();
  const theme = useTheme();
  const { darkMode } = useContext(AppContext);
  
  const [mainMenuAnchor, setMainMenuAnchor] = useState(null);
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  // Determine current view
  const currentView = useMemo(() => {
    if (router.pathname === '/collections') return 'nfts';
    if (router.pathname === '/trending') return 'trending';
    if (router.pathname === '/spotlight') return 'spotlight';
    if (router.pathname === '/most-viewed') return 'most-viewed';
    if (router.pathname === '/new') return 'new';
    if (router.pathname.includes('/gainers')) return 'gainers';
    if (router.query.view) return router.query.view;
    return 'tokens';
  }, [router]);

  // Get current period for gainers
  const currentPeriod = useMemo(() => {
    if (currentOrderBy === 'pro5m') return '5m';
    if (currentOrderBy === 'pro1h') return '1h';
    if (currentOrderBy === 'pro24h') return '24h';
    if (currentOrderBy === 'pro7d') return '7d';
    // Check URL path for gainers
    if (router.pathname.includes('/gainers/')) {
      const period = router.pathname.split('/gainers/')[1];
      return period || '24h';
    }
    return '24h';
  }, [currentOrderBy, router.pathname]);

  const handleMainMenuClick = (event) => setMainMenuAnchor(event.currentTarget);
  const handleMainMenuClose = () => setMainMenuAnchor(null);

  const handleViewChange = useCallback((path) => {
    window.location.href = path;
    handleMainMenuClose();
  }, []);

  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        p: 0.5,
        gap: 1,
        borderRadius: 2,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: alpha(theme.palette.background.paper, 0.5),
        backdropFilter: 'blur(10px)',
        flexWrap: 'wrap'
      }}
    >
      {/* Left Section - View Selector */}
      <Stack direction="row" spacing={1} alignItems="center">
        <Button
          variant="contained"
          size="small"
          onClick={handleMainMenuClick}
          endIcon={<KeyboardArrowDownIcon />}
          sx={{
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: 'none',
            textTransform: 'none',
            fontWeight: 600,
            px: 2,
            '&:hover': {
              boxShadow: 2
            }
          }}
        >
          {currentView === 'tokens' && <><AppsIcon sx={{ fontSize: 18, mr: 0.5 }} /> Tokens</>}
          {currentView === 'nfts' && <><CollectionsIcon sx={{ fontSize: 18, mr: 0.5 }} /> NFTs</>}
          {currentView === 'trending' && <><LocalFireDepartmentIcon sx={{ fontSize: 18, mr: 0.5 }} /> Trending</>}
          {currentView === 'gainers' && <><TrendingUpIcon sx={{ fontSize: 18, mr: 0.5 }} /> Gainers</>}
          {currentView === 'new' && <><NewReleasesIcon sx={{ fontSize: 18, mr: 0.5 }} /> New</>}
        </Button>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

        {/* View Type Toggle */}
        <ButtonGroup size="small" variant="outlined">
          <Tooltip title="List View">
            <Button
              onClick={() => setViewType('row')}
              variant={viewType === 'row' ? 'contained' : 'outlined'}
              sx={{ minWidth: 36, px: 1 }}
            >
              <TableRowsIcon fontSize="small" />
            </Button>
          </Tooltip>
          <Tooltip title="Grid View">
            <Button
              onClick={() => window.location.href = '/tokens-heatmap'}
              variant={viewType === 'heatmap' ? 'contained' : 'outlined'}
              sx={{ minWidth: 36, px: 1 }}
            >
              <GridViewIcon fontSize="small" />
            </Button>
          </Tooltip>
        </ButtonGroup>
      </Stack>

      {/* Center Section - Quick Filters */}
      <Stack 
        direction="row" 
        spacing={0.5} 
        sx={{ 
          flex: 1,
          overflowX: 'auto',
          px: 1,
          alignItems: 'center',
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none'
        }}
      >
        {/* Period selector for gainers or price change sorting */}
        {(currentView === 'gainers' || ['pro5m', 'pro1h', 'pro24h', 'pro7d'].includes(currentOrderBy)) && (
          <>
            <ButtonGroup 
              size="small" 
              variant="outlined"
              sx={{
                '& .MuiButton-root': {
                  minWidth: 32,
                  px: 0.75,
                  py: 0.25,
                  fontSize: '0.7rem',
                  fontWeight: 500,
                  borderColor: alpha(theme.palette.divider, 0.2),
                  '&:hover': {
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                    background: alpha(theme.palette.primary.main, 0.05)
                  }
                },
                '& .MuiButton-contained': {
                  background: theme.palette.primary.main,
                  color: '#fff',
                  fontWeight: 600,
                  '&:hover': {
                    background: theme.palette.primary.dark
                  }
                }
              }}
            >
              <Button
                onClick={() => {
                  if (currentView === 'gainers') {
                    window.location.href = '/gainers/5m';
                  } else {
                    setOrderBy('pro5m');
                    setSync(prev => prev + 1);
                  }
                }}
                variant={currentPeriod === '5m' ? 'contained' : 'outlined'}
              >
                5m
              </Button>
              <Button
                onClick={() => {
                  if (currentView === 'gainers') {
                    window.location.href = '/gainers/1h';
                  } else {
                    setOrderBy('pro1h');
                    setSync(prev => prev + 1);
                  }
                }}
                variant={currentPeriod === '1h' ? 'contained' : 'outlined'}
              >
                1h
              </Button>
              <Button
                onClick={() => {
                  if (currentView === 'gainers') {
                    window.location.href = '/gainers/24h';
                  } else {
                    setOrderBy('pro24h');
                    setSync(prev => prev + 1);
                  }
                }}
                variant={currentPeriod === '24h' ? 'contained' : 'outlined'}
              >
                24h
              </Button>
              <Button
                onClick={() => {
                  if (currentView === 'gainers') {
                    window.location.href = '/gainers/7d';
                  } else {
                    setOrderBy('pro7d');
                    setSync(prev => prev + 1);
                  }
                }}
                variant={currentPeriod === '7d' ? 'contained' : 'outlined'}
              >
                7d
              </Button>
            </ButtonGroup>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          </>
        )}
        <Chip
          label="🔥 Hot"
          size="small"
          onClick={() => handleViewChange('/trending')}
          sx={{
            cursor: 'pointer',
            background: currentView === 'trending' ? alpha('#ff5722', 0.2) : 'transparent',
            border: `1px solid ${alpha('#ff5722', 0.3)}`,
            '&:hover': { background: alpha('#ff5722', 0.3) }
          }}
        />
        <Chip
          label="💎 Gems"
          size="small"
          onClick={() => handleViewChange('/spotlight')}
          sx={{
            cursor: 'pointer',
            background: currentView === 'spotlight' ? alpha('#2196f3', 0.2) : 'transparent',
            border: `1px solid ${alpha('#2196f3', 0.3)}`,
            '&:hover': { background: alpha('#2196f3', 0.3) }
          }}
        />
        <Chip
          label="🚀 Gainers"
          size="small"
          onClick={() => handleViewChange('/gainers/24h')}
          sx={{
            cursor: 'pointer',
            background: currentView === 'gainers' ? alpha('#4caf50', 0.2) : 'transparent',
            border: `1px solid ${alpha('#4caf50', 0.3)}`,
            '&:hover': { background: alpha('#4caf50', 0.3) }
          }}
        />
        <Chip
          label="✨ New"
          size="small"
          onClick={() => handleViewChange('/new')}
          sx={{
            cursor: 'pointer',
            background: currentView === 'new' ? alpha('#ff9800', 0.2) : 'transparent',
            border: `1px solid ${alpha('#ff9800', 0.3)}`,
            '&:hover': { background: alpha('#ff9800', 0.3) }
          }}
        />
        <Chip
          label="👁️ Popular"
          size="small"
          onClick={() => handleViewChange('/most-viewed')}
          sx={{
            cursor: 'pointer',
            background: currentView === 'most-viewed' ? alpha('#9c27b0', 0.2) : 'transparent',
            border: `1px solid ${alpha('#9c27b0', 0.3)}`,
            '&:hover': { background: alpha('#9c27b0', 0.3) }
          }}
        />
      </Stack>

      {/* Right Section - Categories & Rows */}
      <Stack direction="row" spacing={1} alignItems="center">
        <Tooltip title="Categories">
          <IconButton 
            size="small"
            onClick={() => setCategoriesOpen(true)}
            sx={{
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              borderRadius: 1
            }}
          >
            <CategoryIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title="Rows per page">
          <Stack 
            direction="row" 
            spacing={0.5} 
            alignItems="center"
            sx={{
              px: 1,
              py: 0.5,
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              borderRadius: 1,
              display: { xs: 'none', md: 'flex' }
            }}
          >
            <ViewListIcon fontSize="small" sx={{ color: 'text.secondary' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {rows}
            </Typography>
          </Stack>
        </Tooltip>
      </Stack>

      {/* Main Menu */}
      <Menu
        anchorEl={mainMenuAnchor}
        open={Boolean(mainMenuAnchor)}
        onClose={handleMainMenuClose}
        PaperProps={{
          sx: {
            minWidth: 200,
            borderRadius: 2,
            mt: 0.5
          }
        }}
      >
        <MenuItem onClick={() => handleViewChange('/')}>
          <AppsIcon sx={{ mr: 1.5, fontSize: 20 }} />
          All Tokens
        </MenuItem>
        <MenuItem onClick={() => handleViewChange('/collections')}>
          <CollectionsIcon sx={{ mr: 1.5, fontSize: 20 }} />
          NFT Collections
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={() => handleViewChange('/watchlist')}>
          <StarIcon sx={{ mr: 1.5, fontSize: 20, color: '#ffc107' }} />
          My Watchlist
        </MenuItem>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem onClick={() => handleViewChange('/tokens-heatmap')}>
          <GridViewIcon sx={{ mr: 1.5, fontSize: 20, color: '#ff5722' }} />
          Heatmap View
        </MenuItem>
        <MenuItem onClick={() => handleViewChange('/top-traders')}>
          <LeaderboardIcon sx={{ mr: 1.5, fontSize: 20, color: '#2196f3' }} />
          Top Traders
        </MenuItem>
      </Menu>


      <CategoriesDrawer
        isOpen={categoriesOpen}
        toggleDrawer={(open) => setCategoriesOpen(open)}
        tags={tags}
      />
    </Paper>
  );
}