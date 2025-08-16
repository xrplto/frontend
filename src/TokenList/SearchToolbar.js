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
  justify-content: space-between;
  padding: ${props => props.xs ? '4px' : '4px'};
  gap: ${props => props.xs ? '4px' : '8px'};
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
  
  @media (max-width: 600px) {
    padding: 4px;
    gap: 4px;
  }
`;

const Stack = styled.div`
  display: flex;
  flex-direction: ${props => props.direction === 'row' ? 'row' : 'column'};
  gap: ${props => props.spacing || '8px'};
  align-items: ${props => props.alignItems || 'center'};
  flex-shrink: ${props => props.flexShrink || 'initial'};
  
  @media (max-width: 600px) {
    gap: 4px;
  }
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: ${props => props.size === 'small' ? '4px 12px' : '8px 16px'};
  border: ${props => props.variant === 'outlined' ? '1px solid rgba(145, 158, 171, 0.32)' : 'none'};
  border-radius: 6px;
  background: ${props => {
    if (props.variant === 'contained') {
      return props.theme?.palette?.mode === 'dark'
        ? 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)'
        : 'linear-gradient(135deg, #2196f3 0%, #42a5f5 100%)';
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
  font-size: ${props => props.size === 'small' ? '0.875rem' : '1rem'};
  font-weight: ${props => props.variant === 'contained' ? 600 : 500};
  text-transform: none;
  font-family: inherit;
  min-height: ${props => props.size === 'small' ? '36px' : '40px'};
  min-width: ${props => props.minWidth || 'auto'};
  transition: all 0.2s;
  
  &:hover {
    background: ${props => {
      if (props.variant === 'contained') {
        return props.theme?.palette?.mode === 'dark'
          ? 'linear-gradient(135deg, #1a3568 0%, #26488e 100%)'
          : 'linear-gradient(135deg, #1976d2 0%, #2196f3 100%)';
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
    min-height: 28px;
    min-width: ${props => props.minWidth ? '60px' : 'auto'};
  }
`;

const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: ${props => props.size === 'small' ? '32px' : '40px'};
  height: ${props => props.size === 'small' ? '32px' : '40px'};
  padding: 0;
  border: ${props => props.selected ? '1px solid #2196f3' : '1px solid rgba(145, 158, 171, 0.32)'};
  border-radius: 6px;
  background: ${props => props.selected ? 'rgba(33, 150, 243, 0.12)' : 'transparent'};
  color: ${props => props.selected ? '#2196f3' : 'inherit'};
  cursor: pointer;
  transition: all 0.2s;
  
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
  
  & > button {
    border-radius: 0;
    
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
  }
  
  @media (max-width: 600px) {
    display: ${props => props.hideOnMobile ? 'none' : 'flex'};
  }
`;

const Divider = styled.div`
  width: 1px;
  height: 24px;
  background: rgba(145, 158, 171, 0.24);
  margin: 0 2px;
  
  @media (max-width: 600px) {
    display: ${props => props.hideOnMobile ? 'none' : 'block'};
  }
`;

const SearchContainer = styled.div`
  flex: 1;
  max-width: 400px;
  display: flex;
  align-items: center;
  
  @media (max-width: 600px) {
    max-width: none;
    flex: 1;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 6px 12px 6px 36px;
  border: 1px solid rgba(145, 158, 171, 0.32);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  font-size: 14px;
  outline: none;
  transition: all 0.2s;
  
  &:focus {
    border-color: #2196f3;
    box-shadow: 0 0 0 2px rgba(33, 150, 243, 0.1);
  }
  
  @media (max-width: 600px) {
    padding: 4px 8px 4px 30px;
    font-size: 12px;
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 10px;
  color: rgba(145, 158, 171, 0.8);
  pointer-events: none;
  display: flex;
  align-items: center;
  
  @media (max-width: 600px) {
    left: 8px;
  }
`;

const Chip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: 1px solid rgba(145, 158, 171, 0.32);
  border-radius: 16px;
  background: ${props => props.selected ? 'rgba(33, 150, 243, 0.12)' : 'transparent'};
  color: ${props => props.selected ? '#2196f3' : 'inherit'};
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: rgba(33, 150, 243, 0.08);
    border-color: #2196f3;
  }
  
  @media (max-width: 600px) {
    padding: 2px 6px;
    font-size: 10px;
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
  background: white;
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
  const [gainerMenuOpen, setGainerMenuOpen] = useState(false);
  const mainMenuRef = useRef(null);
  const gainerMenuRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mainMenuRef.current && !mainMenuRef.current.contains(event.target)) {
        setMainMenuOpen(false);
      }
      if (gainerMenuRef.current && !gainerMenuRef.current.contains(event.target)) {
        setGainerMenuOpen(false);
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
      <Stack direction="row" spacing="8px" alignItems="center" flexShrink={0}>
        <Dropdown ref={mainMenuRef}>
          <Button
            variant="contained"
            size="small"
            onClick={() => setMainMenuOpen(!mainMenuOpen)}
            minWidth="100"
            theme={{ palette: { mode: darkMode ? 'dark' : 'light' } }}
          >
            <Icon icon={getViewIcon(currentView)} width="18" height="18" />
            <span style={{ display: 'inline' }}>{getViewLabel(currentView)}</span>
            <Icon icon="material-symbols:keyboard-arrow-down" width="20" height="20" />
          </Button>
          
          {mainMenuOpen && (
            <DropdownMenu>
              <MenuItem onClick={() => handleViewChange('/')} selected={currentView === 'tokens'}>
                <Icon icon="material-symbols:apps" width="18" height="18" />
                All Tokens
              </MenuItem>
              <MenuItem onClick={() => handleViewChange('/trending')} selected={currentView === 'trending'}>
                <Icon icon="material-symbols:local-fire-department" width="18" height="18" />
                Trending
              </MenuItem>
              <MenuItem onClick={() => handleViewChange('/new')} selected={currentView === 'new'}>
                <Icon icon="material-symbols:new-releases" width="18" height="18" />
                New Tokens
              </MenuItem>
              <MenuItem onClick={() => handleViewChange('/gainers/24h')} selected={currentView === 'gainers'}>
                <Icon icon="material-symbols:trending-up" width="18" height="18" />
                Top Gainers
              </MenuItem>
              <MenuItem onClick={() => handleViewChange('/most-viewed')} selected={currentView === 'most-viewed'}>
                <Icon icon="material-symbols:visibility" width="18" height="18" />
                Most Viewed
              </MenuItem>
              <MenuItem onClick={() => handleViewChange('/spotlight')} selected={currentView === 'spotlight'}>
                <Icon icon="material-symbols:star" width="18" height="18" />
                Spotlight
              </MenuItem>
              <MenuItem onClick={() => setCategoriesOpen(true)}>
                <Icon icon="material-symbols:category" width="18" height="18" />
                Categories
              </MenuItem>
              <MenuItem onClick={() => handleViewChange('/collections')} selected={currentView === 'nfts'}>
                <Icon icon="material-symbols:collections" width="18" height="18" />
                NFT Collections
              </MenuItem>
            </DropdownMenu>
          )}
        </Dropdown>

        <Divider hideOnMobile />

        {/* View Type Toggle */}
        <ButtonGroup hideOnMobile>
          <IconButton
            size="small"
            selected={viewType === 'list'}
            onClick={() => setViewType('list')}
            title="List View"
          >
            <Icon icon="material-symbols:view-list" width="18" height="18" />
          </IconButton>
          <IconButton
            size="small"
            selected={viewType === 'card'}
            onClick={() => setViewType('card')}
            title="Card View"
          >
            <Icon icon="material-symbols:grid-view" width="18" height="18" />
          </IconButton>
          <IconButton
            size="small"
            selected={viewType === 'table'}
            onClick={() => setViewType('table')}
            title="Table View"
          >
            <Icon icon="material-symbols:table-rows" width="18" height="18" />
          </IconButton>
        </ButtonGroup>

        {/* Gainers Period Selector */}
        {currentView === 'gainers' && (
          <>
            <Divider />
            <Dropdown ref={gainerMenuRef}>
              <Chip
                selected
                onClick={() => setGainerMenuOpen(!gainerMenuOpen)}
              >
                {currentPeriod}
                <Icon icon="material-symbols:keyboard-arrow-down" width="16" height="16" />
              </Chip>
              
              {gainerMenuOpen && (
                <DropdownMenu>
                  <MenuItem onClick={() => handleViewChange('/gainers/5m')} selected={currentPeriod === '5m'}>
                    5 Minutes
                  </MenuItem>
                  <MenuItem onClick={() => handleViewChange('/gainers/1h')} selected={currentPeriod === '1h'}>
                    1 Hour
                  </MenuItem>
                  <MenuItem onClick={() => handleViewChange('/gainers/24h')} selected={currentPeriod === '24h'}>
                    24 Hours
                  </MenuItem>
                  <MenuItem onClick={() => handleViewChange('/gainers/7d')} selected={currentPeriod === '7d'}>
                    7 Days
                  </MenuItem>
                </DropdownMenu>
              )}
            </Dropdown>
          </>
        )}
      </Stack>

      {/* Center Section - Search */}
      <SearchContainer>
        <div style={{ position: 'relative', width: '100%' }}>
          <SearchIcon>
            <Icon icon="material-symbols:search" width="20" height="20" />
          </SearchIcon>
          <SearchInput
            type="text"
            placeholder="Search tokens..."
            value={filterName}
            onChange={(e) => onFilterName(e.target.value)}
          />
        </div>
      </SearchContainer>

      {/* Right Section - Actions */}
      <Stack direction="row" spacing="4px" alignItems="center">
        <IconButton
          size="small"
          onClick={() => setSync(!sync)}
          title={sync ? "Disable auto-refresh" : "Enable auto-refresh"}
        >
          <Icon 
            icon={sync ? "material-symbols:sync" : "material-symbols:sync-disabled"} 
            width="18" 
            height="18"
            style={{ color: sync ? '#4caf50' : 'inherit' }}
          />
        </IconButton>
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