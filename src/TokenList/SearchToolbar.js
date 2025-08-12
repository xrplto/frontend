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
        p: { xs: 0.25, sm: 0.5 },
        gap: { xs: 0.25, sm: 1 },
        borderRadius: 1,
        border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
        background: darkMode 
          ? alpha(theme.palette.background.paper, 0.15)
          : alpha(theme.palette.background.paper, 0.25),
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: `0 8px 32px 0 ${alpha(theme.palette.common.black, 0.1)}`,
        flexWrap: 'wrap',
        flexDirection: { xs: 'column', sm: 'row' }
      }}
    >
      {/* Left Section - View Selector */}
      <Stack 
        direction="row" 
        spacing={{ xs: 0.25, sm: 1 }} 
        alignItems="center"
        sx={{ width: { xs: '100%', sm: 'auto' } }}
      >
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
            px: { xs: 1, sm: 1.5 },
            py: { xs: 0.5, sm: 0.5 },
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            minHeight: { xs: 32, sm: 36 },
            height: { xs: 32, sm: 36 },
            minWidth: { xs: 80, sm: 100 },
            '&:hover': {
              boxShadow: 2
            }
          }}
        >
          {currentView === 'tokens' && <><AppsIcon sx={{ fontSize: { xs: 16, sm: 18 }, mr: { xs: 0.25, sm: 0.5 } }} /> Tokens</>}
          {currentView === 'nfts' && <><CollectionsIcon sx={{ fontSize: { xs: 16, sm: 18 }, mr: { xs: 0.25, sm: 0.5 } }} /> NFTs</>}
          {currentView === 'trending' && <><LocalFireDepartmentIcon sx={{ fontSize: { xs: 16, sm: 18 }, mr: { xs: 0.25, sm: 0.5 } }} /> Trending</>}
          {currentView === 'gainers' && <><TrendingUpIcon sx={{ fontSize: { xs: 16, sm: 18 }, mr: { xs: 0.25, sm: 0.5 } }} /> Gainers</>}
          {currentView === 'new' && <><NewReleasesIcon sx={{ fontSize: { xs: 16, sm: 18 }, mr: { xs: 0.25, sm: 0.5 } }} /> New</>}
        </Button>

        <Divider orientation="vertical" flexItem sx={{ mx: 0.25, display: { xs: 'none', sm: 'block' } }} />

        {/* View Type Toggle */}
        <ButtonGroup 
          size="small" 
          variant="outlined"
          sx={{ ml: { xs: 'auto', sm: 0 } }}
        >
          <Tooltip title="List View">
            <Button
              onClick={() => setViewType('row')}
              variant={viewType === 'row' ? 'contained' : 'outlined'}
              sx={{ minWidth: { xs: 36, sm: 40 }, height: { xs: 32, sm: 36 }, px: { xs: 0.5, sm: 1 }, py: { xs: 0.5, sm: 0.5 } }}
            >
              <TableRowsIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
            </Button>
          </Tooltip>
          <Tooltip title="Grid View">
            <Button
              onClick={() => window.location.href = '/tokens-heatmap'}
              variant={viewType === 'heatmap' ? 'contained' : 'outlined'}
              sx={{ minWidth: { xs: 36, sm: 40 }, height: { xs: 32, sm: 36 }, px: { xs: 0.5, sm: 1 }, py: { xs: 0.5, sm: 0.5 } }}
            >
              <GridViewIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
            </Button>
          </Tooltip>
        </ButtonGroup>
      </Stack>

      {/* Center Section - Quick Filters */}
      <Stack 
        direction="row" 
        spacing={{ xs: 0.25, sm: 0.5 }} 
        sx={{ 
          flex: 1,
          overflowX: 'auto',
          px: { xs: 0.25, sm: 1 },
          py: { xs: 0.25, sm: 0 },
          alignItems: 'center',
          width: { xs: '100%', sm: 'auto' },
          justifyContent: { xs: 'flex-start', sm: 'center' },
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
                  minWidth: { xs: 36, sm: 40 },
                  height: { xs: 32, sm: 36 },
                  px: { xs: 0.5, sm: 0.75 },
                  py: { xs: 0.5, sm: 0.5 },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
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
            <Divider orientation="vertical" flexItem sx={{ mx: { xs: 0.25, sm: 0.5 }, display: { xs: 'none', sm: 'block' } }} />
          </>
        )}
        <Chip
          label="🔥 Hot"
          size="small"
          onClick={() => handleViewChange('/trending')}
          sx={{
            cursor: 'pointer',
            background: currentView === 'trending' 
              ? 'linear-gradient(135deg, #ff5722 0%, #ff7043 100%)'
              : alpha('#ff5722', 0.1),
            border: 'none',
            color: currentView === 'trending' ? '#fff' : '#ff5722',
            fontWeight: 600,
            '&:hover': { 
              background: currentView === 'trending'
                ? 'linear-gradient(135deg, #ff5722 0%, #ff7043 100%)'
                : alpha('#ff5722', 0.25),
              transform: 'scale(1.05)'
            },
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            height: { xs: 32, sm: 36 },
            px: { xs: 1, sm: 1.5 },
            transition: 'all 0.2s ease'
          }}
        />
        <Chip
          label="💎 Gems"
          size="small"
          onClick={() => handleViewChange('/spotlight')}
          sx={{
            cursor: 'pointer',
            background: currentView === 'spotlight' 
              ? 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)'
              : alpha('#2196f3', 0.1),
            border: 'none',
            color: currentView === 'spotlight' ? '#fff' : '#2196f3',
            fontWeight: 600,
            '&:hover': { 
              background: currentView === 'spotlight'
                ? 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)'
                : alpha('#2196f3', 0.25),
              transform: 'scale(1.05)'
            },
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            height: { xs: 32, sm: 36 },
            px: { xs: 1, sm: 1.5 },
            transition: 'all 0.2s ease'
          }}
        />
        <Chip
          label="🚀 Gainers"
          size="small"
          onClick={() => handleViewChange('/gainers/24h')}
          sx={{
            cursor: 'pointer',
            background: currentView === 'gainers' 
              ? 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)'
              : alpha('#4caf50', 0.1),
            border: 'none',
            color: currentView === 'gainers' ? '#fff' : '#4caf50',
            fontWeight: 600,
            '&:hover': { 
              background: currentView === 'gainers'
                ? 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)'
                : alpha('#4caf50', 0.25),
              transform: 'scale(1.05)'
            },
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            height: { xs: 32, sm: 36 },
            px: { xs: 1, sm: 1.5 },
            display: { xs: 'none', sm: 'flex' },
            transition: 'all 0.2s ease'
          }}
        />
        <Chip
          label="✨ New"
          size="small"
          onClick={() => handleViewChange('/new')}
          sx={{
            cursor: 'pointer',
            background: currentView === 'new' 
              ? 'linear-gradient(135deg, #ff9800 0%, #ffa726 100%)'
              : alpha('#ff9800', 0.1),
            border: 'none',
            color: currentView === 'new' ? '#fff' : '#ff9800',
            fontWeight: 600,
            '&:hover': { 
              background: currentView === 'new'
                ? 'linear-gradient(135deg, #ff9800 0%, #ffa726 100%)'
                : alpha('#ff9800', 0.25),
              transform: 'scale(1.05)'
            },
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            height: { xs: 32, sm: 36 },
            px: { xs: 1, sm: 1.5 },
            transition: 'all 0.2s ease'
          }}
        />
        <Chip
          label="👁️ Popular"
          size="small"
          onClick={() => handleViewChange('/most-viewed')}
          sx={{
            cursor: 'pointer',
            background: currentView === 'most-viewed' 
              ? 'linear-gradient(135deg, #9c27b0 0%, #ab47bc 100%)'
              : alpha('#9c27b0', 0.1),
            border: 'none',
            color: currentView === 'most-viewed' ? '#fff' : '#9c27b0',
            fontWeight: 600,
            '&:hover': { 
              background: currentView === 'most-viewed'
                ? 'linear-gradient(135deg, #9c27b0 0%, #ab47bc 100%)'
                : alpha('#9c27b0', 0.25),
              transform: 'scale(1.05)'
            },
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            height: { xs: 32, sm: 36 },
            px: { xs: 1, sm: 1.5 },
            display: { xs: 'none', sm: 'flex' },
            transition: 'all 0.2s ease'
          }}
        />
        
        {/* Top Categories */}
        {tags && tags.length > 0 && (
          <>
            <Divider orientation="vertical" flexItem sx={{ mx: { xs: 0.25, sm: 0.5 }, height: 28, display: { xs: 'none', sm: 'block' } }} />
            
            {/* Display first 5 categories from tags array */}
            {tags.slice(0, 10).map((tag, index) => {
              const normalizedTag = tag.split(' ').join('-').replace(/&/g, 'and').toLowerCase().replace(/[^a-zA-Z0-9-]/g, '');
              const colors = ['#e91e63', '#00bcd4', '#4caf50', '#673ab7', '#ff9800', '#795548', '#607d8b', '#ff5722', '#3f51b5', '#009688'];
              const emojis = ['🏷️', '📍', '⭐', '💫', '🎯', '🔖', '🎨', '🌟', '🏆', '💡'];
              
              return (
                <Chip
                  key={tag}
                  label={`${emojis[index]} ${tag}`}
                  size="small"
                  onClick={() => handleViewChange(`/view/${normalizedTag}`)}
                  sx={{
                    cursor: 'pointer',
                    background: tagName === tag ? alpha(colors[index], 0.2) : 'transparent',
                    border: `1px solid ${alpha(colors[index], 0.3)}`,
                    '&:hover': { background: alpha(colors[index], 0.3) },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    height: { xs: 32, sm: 36 },
                    px: { xs: 1, sm: 1.5 },
                    display: { xs: index < 2 ? 'flex' : 'none', sm: index < 6 ? 'flex' : 'none', md: 'flex' }
                  }}
                />
              );
            })}
            
            {/* Categories Button */}
            <Tooltip title="More Categories">
              <IconButton 
                size="small"
                onClick={() => setCategoriesOpen(true)}
                sx={{
                  ml: 0.5,
                  width: { xs: 32, sm: 36 },
                  height: { xs: 32, sm: 36 },
                  border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                  borderRadius: 0.5,
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.15),
                    transform: 'scale(1.05)'
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                <CategoryIcon sx={{ fontSize: { xs: 16, sm: 18 } }} />
              </IconButton>
            </Tooltip>
          </>
        )}
      </Stack>


      {/* Main Menu */}
      <Menu
        anchorEl={mainMenuAnchor}
        open={Boolean(mainMenuAnchor)}
        onClose={handleMainMenuClose}
        PaperProps={{
          sx: {
            minWidth: 200,
            borderRadius: 1,
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