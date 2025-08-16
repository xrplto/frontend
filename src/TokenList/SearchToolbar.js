import React, { useState, useCallback, useMemo, memo, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import { Icon } from '@iconify/react';
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
import dynamic from 'next/dynamic';

const CategoriesDrawer = dynamic(() => import('src/components/CategoriesDrawer'));

// Helper function
function getTagValue(tags, tagName) {
  if (!tags || tags.length < 1 || !tagName) return 0;
  const idx = tags.indexOf(tagName);
  if (idx < 0) return 0;
  return idx + 1;
}

// Styled Components
const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 4px;
  gap: 8px;
  border-radius: 8px;
  border: 1px solid rgba(145, 158, 171, 0.1);
  background: ${props => props.darkMode 
    ? 'rgba(33, 43, 54, 0.15)'
    : 'rgba(255, 255, 255, 0.25)'};
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
  flex-wrap: nowrap;
  flex-direction: row;
  overflow-x: auto;
  
  &::-webkit-scrollbar {
    height: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(145, 158, 171, 0.3);
    border-radius: 2px;
  }
  
  @media (max-width: 600px) {
    padding: 4px;
    gap: 4px;
  }
`;

const Stack = styled.div`
  display: flex;
  flex-direction: row;
  gap: 4px;
  align-items: center;
  flex-shrink: 0;
  
  @media (max-width: 600px) {
    gap: 2px;
  }
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 4px 8px;
  border: ${props => props.variant === 'outlined' ? '1px solid rgba(145, 158, 171, 0.32)' : 'none'};
  border-radius: 6px;
  background: ${props => {
    if (props.variant === 'contained') {
      return props.theme?.palette?.mode === 'dark'
        ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
    if (props.selected) return 'rgba(33, 150, 243, 0.12)';
    return 'transparent';
  }};
  color: ${props => {
    if (props.variant === 'contained') return 'white';
    if (props.selected) return '#2196f3';
    return 'inherit';
  }};
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: ${props => props.variant === 'contained' ? 600 : 500};
  text-transform: none;
  font-family: inherit;
  height: 32px;
  min-width: ${props => props.minWidth || 'auto'};
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
  
  &:hover {
    background: ${props => {
      if (props.variant === 'contained') {
        return props.theme?.palette?.mode === 'dark'
          ? 'linear-gradient(135deg, #1a3568 0%, #26488e 100%)'
          : 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)';
      }
      return 'rgba(33, 150, 243, 0.08)';
    }};
    box-shadow: ${props => props.variant === 'contained' ? '0 4px 8px rgba(0, 0, 0, 0.2)' : 'none'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  @media (max-width: 600px) {
    padding: 2px 6px;
    font-size: 0.7rem;
    height: 28px;
  }
`;

const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: ${props => props.selected ? '1px solid #2196f3' : '1px solid rgba(145, 158, 171, 0.32)'};
  border-radius: 6px;
  background: ${props => props.selected ? 'rgba(33, 150, 243, 0.12)' : 'transparent'};
  color: ${props => props.selected ? '#2196f3' : 'inherit'};
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  
  &:hover {
    background: rgba(33, 150, 243, 0.08);
    border-color: #2196f3;
  }
  
  @media (max-width: 600px) {
    width: 28px;
    height: 28px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 0;
  flex-shrink: 0;
  
  & > button {
    border-radius: 0;
    border: 1px solid rgba(145, 158, 171, 0.2);
    min-width: 30px;
    height: 32px;
    padding: 0 6px;
    font-size: 0.75rem;
    font-weight: 500;
    background: transparent;
    cursor: pointer;
    transition: all 0.2s;
    
    &:first-of-type {
      border-top-left-radius: 6px;
      border-bottom-left-radius: 6px;
    }
    
    &:last-child {
      border-top-right-radius: 6px;
      border-bottom-right-radius: 6px;
      border-left: none;
    }
    
    &:not(:first-of-type):not(:last-child) {
      border-left: none;
    }
    
    &:hover {
      border-color: rgba(33, 150, 243, 0.3);
      background: rgba(33, 150, 243, 0.05);
    }
  }
  
  & > button.selected {
    background: #2196f3;
    color: #fff;
    font-weight: 600;
    
    &:hover {
      background: #1976d2;
    }
  }
  
  @media (max-width: 600px) {
    display: ${props => props.hideOnMobile ? 'none' : 'flex'};
    
    & > button {
      min-width: 28px;
      height: 28px;
      padding: 0 4px;
      font-size: 0.7rem;
    }
  }
`;

const Divider = styled.div`
  width: 1px;
  height: 20px;
  background: rgba(145, 158, 171, 0.24);
  margin: 0 2px;
  flex-shrink: 0;
  
  @media (max-width: 600px) {
    display: ${props => props.hideOnMobile ? 'none' : 'block'};
    margin: 0 2px;
  }
`;

const Chip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 8px;
  border: ${props => props.border || 'none'};
  border-radius: 14px;
  background: ${props => props.background || 'rgba(145, 158, 171, 0.1)'};
  color: ${props => props.color || 'inherit'};
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  height: 28px;
  flex-shrink: 0;
  
  &:hover {
    background: ${props => props.hoverBackground || 'rgba(145, 158, 171, 0.25)'};
    transform: scale(1.02);
  }
  
  @media (max-width: 600px) {
    padding: 2px 6px;
    font-size: 0.7rem;
    height: 26px;
    display: ${props => props.hideOnMobile ? 'none' : 'inline-flex'};
  }
`;

const TagChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 8px;
  border: 1px solid ${props => props.borderColor || 'rgba(145, 158, 171, 0.32)'};
  border-radius: 14px;
  background: ${props => props.background || 'transparent'};
  color: ${props => props.color || 'inherit'};
  font-size: 0.7rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  height: 26px;
  flex-shrink: 0;
  
  &:hover {
    background: ${props => props.hoverBackground || 'rgba(33, 150, 243, 0.08)'};
  }
  
  @media (max-width: 600px) {
    font-size: 0.65rem;
    height: 24px;
    padding: 2px 6px;
    display: none;
  }
`;

const AllTagsButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 8px;
  border: 1px solid rgba(33, 150, 243, 0.3);
  border-radius: 14px;
  background: rgba(33, 150, 243, 0.08);
  color: inherit;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  height: 26px;
  flex-shrink: 0;
  
  &:hover {
    background: rgba(33, 150, 243, 0.15);
    transform: scale(1.02);
  }
  
  @media (max-width: 600px) {
    font-size: 0.65rem;
    height: 24px;
    padding: 2px 6px;
  }
`;

const Dropdown = styled.div`
  position: relative;
`;

const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  ${props => props.align === 'right' ? 'right: 0;' : 'left: 0;'}
  margin-top: 4px;
  background: ${props => props.darkMode ? '#1a1a1a' : 'white'};
  border: 1px solid rgba(145, 158, 171, 0.12);
  border-radius: 8px;
  box-shadow: 0 8px 16px rgba(145, 158, 171, 0.24);
  min-width: 200px;
  z-index: 1000;
  overflow: hidden;
`;

const MenuItem = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: ${props => props.selected ? 'rgba(33, 150, 243, 0.08)' : 'transparent'};
  color: inherit;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s;
  
  &:hover {
    background: rgba(145, 158, 171, 0.08);
  }
`;

const MenuDivider = styled.div`
  height: 1px;
  background: rgba(145, 158, 171, 0.12);
  margin: 4px 0;
`;

const SearchToolbar = memo(function SearchToolbar({
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
  const { darkMode } = useContext(AppContext);
  
  const [mainMenuOpen, setMainMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const mainMenuRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mainMenuRef.current && !mainMenuRef.current.contains(event.target)) {
        setMainMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    if (router.pathname.includes('/gainers/')) {
      const period = router.pathname.split('/gainers/')[1];
      return period || '24h';
    }
    return '24h';
  }, [currentOrderBy, router.pathname]);

  const handleViewChange = useCallback((path) => {
    window.location.href = path;
    setMainMenuOpen(false);
  }, []);

  const getViewIcon = (view) => {
    switch(view) {
      case 'tokens': return 'material-symbols:apps';
      case 'nfts': return 'material-symbols:collections';
      case 'trending': return 'material-symbols:local-fire-department';
      case 'gainers': return 'material-symbols:trending-up';
      case 'new': return 'material-symbols:new-releases';
      case 'spotlight': return 'material-symbols:star';
      case 'most-viewed': return 'material-symbols:visibility';
      default: return 'material-symbols:apps';
    }
  };

  const getViewLabel = (view) => {
    switch(view) {
      case 'tokens': return 'Tokens';
      case 'nfts': return 'NFTs';
      case 'trending': return 'Trending';
      case 'gainers': return 'Gainers';
      case 'new': return 'New';
      case 'spotlight': return 'Spotlight';
      case 'most-viewed': return 'Most Viewed';
      default: return 'Tokens';
    }
  };

  return (
    <Container darkMode={darkMode}>
      {/* Left Section - View Selector */}
      <Stack direction="row" spacing="4px" alignItems="center" flexShrink={0} width="100%" xs={{ width: '100%' }}>
        <Dropdown ref={mainMenuRef}>
          <Button
            variant="contained"
            size="small"
            onClick={() => setMainMenuOpen(!mainMenuOpen)}
            minWidth="100"
            theme={{ palette: { mode: darkMode ? 'dark' : 'light' } }}
          >
            <Icon icon={getViewIcon(currentView)} width="18" height="18" />
            <span>{getViewLabel(currentView)}</span>
            <Icon icon="material-symbols:keyboard-arrow-down" width="20" height="20" />
          </Button>
          
          {mainMenuOpen && (
            <DropdownMenu darkMode={darkMode}>
              <MenuItem onClick={() => handleViewChange('/')} selected={currentView === 'tokens'}>
                <Icon icon="material-symbols:apps" width="20" height="20" />
                All Tokens
              </MenuItem>
              <MenuItem onClick={() => handleViewChange('/collections')} selected={currentView === 'nfts'}>
                <Icon icon="material-symbols:collections" width="20" height="20" />
                NFT Collections
              </MenuItem>
              <MenuDivider />
              <MenuItem onClick={() => handleViewChange('/watchlist')}>
                <Icon icon="material-symbols:star" width="20" height="20" style={{ color: '#ffc107' }} />
                My Watchlist
              </MenuItem>
              <MenuDivider />
              <MenuItem onClick={() => handleViewChange('/tokens-heatmap')}>
                <Icon icon="material-symbols:grid-view" width="20" height="20" style={{ color: '#ff5722' }} />
                Heatmap View
              </MenuItem>
              <MenuItem onClick={() => handleViewChange('/top-traders')}>
                <Icon icon="material-symbols:leaderboard" width="20" height="20" style={{ color: '#2196f3' }} />
                Top Traders
              </MenuItem>
            </DropdownMenu>
          )}
        </Dropdown>

        <Divider hideOnMobile />

        {/* View Type Toggle */}
        <ButtonGroup>
          <IconButton
            size="small"
            selected={viewType === 'row'}
            onClick={() => setViewType('row')}
            title="List View"
          >
            <Icon icon="material-symbols:table-rows" width="20" height="20" />
          </IconButton>
          <IconButton
            size="small"
            selected={viewType === 'heatmap'}
            onClick={() => window.location.href = '/tokens-heatmap'}
            title="Grid View"
          >
            <Icon icon="material-symbols:grid-view" width="20" height="20" />
          </IconButton>
        </ButtonGroup>
      </Stack>

      {/* Center Section - Quick Filters */}
      <Stack 
        direction="row" 
        spacing="4px" 
        flex={1}
        overflowX="auto"
        padding="0 8px"
        alignItems="center"
        width="100%"
        justifyContent="center"
        xs={{ width: '100%' }}
      >
        {/* Period selector for gainers or price change sorting */}
        {(currentView === 'gainers' || ['pro5m', 'pro1h', 'pro24h', 'pro7d'].includes(currentOrderBy)) && (
          <>
            <ButtonGroup buttonMinWidth="40px">
              <button
                className={currentPeriod === '5m' ? 'selected' : ''}
                onClick={() => {
                  if (currentView === 'gainers') {
                    window.location.href = '/gainers/5m';
                  } else {
                    setOrderBy('pro5m');
                    setSync(prev => prev + 1);
                  }
                }}
              >
                5m
              </button>
              <button
                className={currentPeriod === '1h' ? 'selected' : ''}
                onClick={() => {
                  if (currentView === 'gainers') {
                    window.location.href = '/gainers/1h';
                  } else {
                    setOrderBy('pro1h');
                    setSync(prev => prev + 1);
                  }
                }}
              >
                1h
              </button>
              <button
                className={currentPeriod === '24h' ? 'selected' : ''}
                onClick={() => {
                  if (currentView === 'gainers') {
                    window.location.href = '/gainers/24h';
                  } else {
                    setOrderBy('pro24h');
                    setSync(prev => prev + 1);
                  }
                }}
              >
                24h
              </button>
              <button
                className={currentPeriod === '7d' ? 'selected' : ''}
                onClick={() => {
                  if (currentView === 'gainers') {
                    window.location.href = '/gainers/7d';
                  } else {
                    setOrderBy('pro7d');
                    setSync(prev => prev + 1);
                  }
                }}
              >
                7d
              </button>
            </ButtonGroup>
            <Divider hideOnMobile />
          </>
        )}

        <Chip
          onClick={() => handleViewChange('/trending')}
          background={currentView === 'trending' 
            ? 'linear-gradient(135deg, #ff5722 0%, #ff7043 100%)'
            : 'rgba(255, 87, 34, 0.1)'}
          color={currentView === 'trending' ? '#fff' : '#ff5722'}
          hoverBackground={currentView === 'trending'
            ? 'linear-gradient(135deg, #ff5722 0%, #ff7043 100%)'
            : 'rgba(255, 87, 34, 0.25)'}
        >
          🔥 Hot
        </Chip>

        <Chip
          onClick={() => handleViewChange('/spotlight')}
          background={currentView === 'spotlight' 
            ? 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)'
            : 'rgba(33, 150, 243, 0.1)'}
          color={currentView === 'spotlight' ? '#fff' : '#2196f3'}
          hoverBackground={currentView === 'spotlight'
            ? 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)'
            : 'rgba(33, 150, 243, 0.25)'}
        >
          💎 Gems
        </Chip>

        <Chip
          onClick={() => handleViewChange('/gainers/24h')}
          background={currentView === 'gainers' 
            ? 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)'
            : 'rgba(76, 175, 80, 0.1)'}
          color={currentView === 'gainers' ? '#fff' : '#4caf50'}
          hoverBackground={currentView === 'gainers'
            ? 'linear-gradient(135deg, #4caf50 0%, #66bb6a 100%)'
            : 'rgba(76, 175, 80, 0.25)'}
          hideOnMobile
        >
          🚀 Gainers
        </Chip>

        <Chip
          onClick={() => handleViewChange('/new')}
          background={currentView === 'new' 
            ? 'linear-gradient(135deg, #ff9800 0%, #ffa726 100%)'
            : 'rgba(255, 152, 0, 0.1)'}
          color={currentView === 'new' ? '#fff' : '#ff9800'}
          hoverBackground={currentView === 'new'
            ? 'linear-gradient(135deg, #ff9800 0%, #ffa726 100%)'
            : 'rgba(255, 152, 0, 0.25)'}
        >
          ✨ New
        </Chip>

        <Chip
          onClick={() => handleViewChange('/most-viewed')}
          background={currentView === 'most-viewed' 
            ? 'linear-gradient(135deg, #9c27b0 0%, #ab47bc 100%)'
            : 'rgba(156, 39, 176, 0.1)'}
          color={currentView === 'most-viewed' ? '#fff' : '#9c27b0'}
          hoverBackground={currentView === 'most-viewed'
            ? 'linear-gradient(135deg, #9c27b0 0%, #ab47bc 100%)'
            : 'rgba(156, 39, 176, 0.25)'}
          hideOnMobile
        >
          👁️ Popular
        </Chip>

        {/* Top Categories */}
        {tags && tags.length > 0 && (
          <>
            <Divider hideOnMobile />
            
            {/* Display first 5 categories from tags array */}
            {tags.slice(0, 5).map((tag, index) => {
              const normalizedTag = tag.split(' ').join('-').replace(/&/g, 'and').toLowerCase().replace(/[^a-zA-Z0-9-]/g, '');
              const colors = ['#e91e63', '#00bcd4', '#4caf50', '#673ab7', '#ff9800'];
              const emojis = ['🏷️', '📍', '⭐', '💫', '🎯'];
              const isSelected = tagName === tag;
              
              return (
                <TagChip
                  key={tag}
                  onClick={() => handleViewChange(`/view/${normalizedTag}`)}
                  borderColor={`${colors[index]}4D`}
                  background={isSelected ? `${colors[index]}33` : 'transparent'}
                  color={darkMode ? '#fff' : '#333'}
                  hoverBackground={`${colors[index]}4D`}
                >
                  <span>{emojis[index]}</span>
                  <span>{tag}</span>
                </TagChip>
              );
            })}
            
            {/* All Tags Button */}
            <AllTagsButton onClick={() => setCategoriesOpen(true)}>
              <Icon icon="material-symbols:category" width="16" height="16" />
              <span>All Tags</span>
            </AllTagsButton>
          </>
        )}
      </Stack>

      {/* Categories Drawer */}
      {categoriesOpen && (
        <CategoriesDrawer
          open={categoriesOpen}
          onClose={() => setCategoriesOpen(false)}
          tags={tags}
          tagName={tagName}
        />
      )}
    </Container>
  );
});

export default SearchToolbar;