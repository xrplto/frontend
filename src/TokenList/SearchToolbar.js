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
  flex-direction: column;
  gap: 8px;
  border-radius: 12px;
  border: 1px solid ${props => props.darkMode 
    ? 'rgba(255, 255, 255, 0.03)'
    : 'rgba(0, 0, 0, 0.03)'};
  background: ${props => props.darkMode 
    ? 'rgba(255, 255, 255, 0.01)'
    : 'rgba(0, 0, 0, 0.01)'};
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.04);
  padding: 8px;
  position: relative;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${props => props.darkMode 
      ? 'rgba(255, 255, 255, 0.02)'
      : 'rgba(0, 0, 0, 0.02)'};
    border-color: ${props => props.darkMode 
      ? 'rgba(255, 255, 255, 0.05)'
      : 'rgba(0, 0, 0, 0.05)'};
  }
  
  @media (max-width: 600px) {
    padding: 6px;
    gap: 6px;
  }
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: ${props => props.spaceBetween ? 'space-between' : 'flex-start'};
  gap: 10px;
  flex-wrap: wrap;
  flex-direction: row;
  overflow-x: hidden;
  overflow-y: visible;
  width: 100%;
  
  @media (max-width: 600px) {
    gap: 6px;
    overflow-x: auto;
    flex-wrap: nowrap;
    
    &::-webkit-scrollbar {
      height: 4px;
    }
    
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    
    &::-webkit-scrollbar-thumb {
      background: rgba(145, 158, 171, 0.2);
      border-radius: 2px;
    }
  }
`;

const RowContent = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  
  @media (max-width: 600px) {
    gap: 6px;
  }
`;

const RowsSelector = styled.select`
  padding: 4px 8px;
  border: 1px solid rgba(145, 158, 171, 0.15);
  border-radius: 8px;
  background: ${props => props.darkMode 
    ? 'rgba(17, 24, 39, 0.8)'
    : 'rgba(255, 255, 255, 0.95)'};
  color: ${props => props.darkMode ? '#fff' : '#333'};
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  height: 32px;
  min-width: 80px;
  transition: all 0.3s ease;
  margin-left: auto;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: ${props => `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${props.darkMode ? '%23fff' : '%23333'}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`};
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 16px;
  padding-right: 32px;
  
  &:hover {
    background-color: ${props => props.darkMode 
      ? 'rgba(17, 24, 39, 0.95)'
      : 'rgba(255, 255, 255, 1)'};
    border-color: rgba(33, 150, 243, 0.3);
  }
  
  &:focus {
    outline: none;
    border-color: rgba(33, 150, 243, 0.4);
    box-shadow: 0 0 0 2px ${props => props.darkMode 
      ? 'rgba(33, 150, 243, 0.1)'
      : 'rgba(33, 150, 243, 0.05)'};
  }
  
  option {
    background: ${props => props.darkMode 
      ? '#111827'
      : '#ffffff'};
    color: ${props => props.darkMode ? '#fff' : '#333'};
    padding: 8px;
  }
  
  @media (max-width: 600px) {
    font-size: 0.7rem;
    height: 28px;
    min-width: 70px;
    padding-right: 28px;
    background-size: 14px;
    background-position: right 6px center;
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
  gap: 4px;
  padding: 6px 12px;
  border: ${props => props.variant === 'outlined' ? '1px solid rgba(145, 158, 171, 0.15)' : 'none'};
  border-radius: 8px;
  background: ${props => {
    if (props.variant === 'contained') {
      return props.theme?.palette?.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(0, 0, 0, 0.06)';
    }
    if (props.selected) return 'rgba(33, 150, 243, 0.08)';
    return 'transparent';
  }};
  color: ${props => {
    if (props.variant === 'contained') return props.theme?.palette?.mode === 'dark' ? '#fff' : '#333';
    if (props.selected) return '#2196f3';
    return 'inherit';
  }};
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: ${props => props.variant === 'contained' ? 600 : 500};
  text-transform: none;
  font-family: inherit;
  height: 36px;
  min-width: ${props => props.minWidth || 'auto'};
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;
  
  &:hover {
    background: ${props => {
      if (props.variant === 'contained') {
        return props.theme?.palette?.mode === 'dark'
          ? 'rgba(255, 255, 255, 0.12)'
          : 'rgba(0, 0, 0, 0.08)';
      }
      return 'rgba(33, 150, 243, 0.06)';
    }};
    transform: translateY(-1px);
    box-shadow: ${props => props.variant === 'contained' ? '0 2px 6px rgba(0, 0, 0, 0.08)' : 'none'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  @media (max-width: 600px) {
    padding: 4px 8px;
    font-size: 0.75rem;
    height: 32px;
  }
`;

const IconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: ${props => props.selected ? '1px solid rgba(33, 150, 243, 0.3)' : '1px solid rgba(145, 158, 171, 0.08)'};
  border-radius: 8px;
  background: ${props => props.selected ? 'rgba(33, 150, 243, 0.08)' : 'rgba(0, 0, 0, 0.02)'};
  color: ${props => props.selected ? '#2196f3' : 'inherit'};
  cursor: pointer;
  transition: all 0.3s ease;
  flex-shrink: 0;
  
  &:hover {
    background: rgba(33, 150, 243, 0.06);
    border-color: rgba(33, 150, 243, 0.2);
    transform: translateY(-1px);
  }
  
  @media (max-width: 600px) {
    width: 32px;
    height: 32px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 2px;
  flex-shrink: 0;
  background: rgba(0, 0, 0, 0.02);
  padding: 2px;
  border-radius: 10px;
  
  & > button {
    border-radius: 8px;
    border: none;
    min-width: 36px;
    height: 32px;
    padding: 0 8px;
    font-size: 0.8rem;
    font-weight: 500;
    background: transparent;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(33, 150, 243, 0.08);
    }
  }
  
  & > button.selected {
    background: rgba(33, 150, 243, 0.15);
    color: #2196f3;
    font-weight: 600;
    
    &:hover {
      background: rgba(33, 150, 243, 0.2);
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
  height: 24px;
  background: rgba(145, 158, 171, 0.08);
  margin: 0 4px;
  flex-shrink: 0;
  
  @media (max-width: 600px) {
    display: ${props => props.hideOnMobile ? 'none' : 'block'};
    margin: 0 2px;
  }
`;

const Chip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border: ${props => props.border || 'none'};
  border-radius: 16px;
  background: ${props => props.background || 'rgba(145, 158, 171, 0.05)'};
  color: ${props => props.color || 'inherit'};
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  height: 32px;
  flex-shrink: 0;
  
  &:hover {
    background: ${props => props.hoverBackground || 'rgba(145, 158, 171, 0.15)'};
    transform: translateY(-1px);
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
  gap: 3px;
  padding: 2px 8px;
  border: 1px solid ${props => props.borderColor || 'rgba(145, 158, 171, 0.08)'};
  border-radius: 12px;
  background: ${props => props.background || 'rgba(0, 0, 0, 0.02)'};
  color: ${props => props.color || 'inherit'};
  font-size: 0.7rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  height: 24px;
  flex-shrink: 0;
  opacity: ${props => props.show ? 1 : 0};
  animation: ${props => props.show ? 'fadeIn 0.3s ease-out' : 'none'};
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateX(-10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  
  &:hover {
    background: ${props => props.hoverBackground || 'rgba(33, 150, 243, 0.06)'};
    transform: translateY(-1px);
  }
  
  @media (max-width: 600px) {
    font-size: 0.65rem;
    height: 20px;
    padding: 1px 6px;
    display: none;
  }
`;

const AllTagsButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border: 1px solid rgba(33, 150, 243, 0.15);
  border-radius: 12px;
  background: rgba(33, 150, 243, 0.06);
  color: inherit;
  font-size: 0.7rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;
  height: 24px;
  flex-shrink: 0;
  
  &:hover {
    background: rgba(33, 150, 243, 0.1);
    transform: translateY(-1px);
  }
  
  @media (max-width: 600px) {
    font-size: 0.65rem;
    height: 20px;
    padding: 1px 6px;
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
  
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const containerRef = useRef(null);
  const [visibleTagCount, setVisibleTagCount] = useState(0);
  const [measuredTags, setMeasuredTags] = useState(false);
  const tagWidthCache = useRef(new Map());

  // Calculate how many tags can fit dynamically
  useEffect(() => {
    const calculateVisibleTags = () => {
      if (!containerRef.current || !tags || tags.length === 0) return;
      
      const container = containerRef.current;
      const containerWidth = container.offsetWidth;
      const isMobile = window.innerWidth <= 600;
      
      // Since tags are in their own row, we don't need to account for fixed elements
      // Reserve space for "All Tags" button (approx 100px on desktop, 75px mobile)
      const allTagsWidth = isMobile ? 75 : 100;
      
      // Available width for tags - use most of the container width for tags
      const availableWidth = containerWidth - allTagsWidth - 30; // 30px buffer for All Tags button and spacing
      
      if (availableWidth <= 100) {
        setVisibleTagCount(isMobile ? 2 : 5);
        return;
      }
      
      // Measure actual tag widths
      let totalTagWidth = 0;
      let count = 0;
      
      // Create cache key based on viewport
      const cacheKey = isMobile ? 'mobile' : 'desktop';
      
      // Create temporary container only if we need to measure new tags
      let tempContainer = null;
      
      for (let i = 0; i < tags.length; i++) {
        const tag = tags[i];
        const tagCacheKey = `${cacheKey}-${tag}`;
        
        let tagWidth;
        
        // Check cache first
        if (tagWidthCache.current.has(tagCacheKey)) {
          tagWidth = tagWidthCache.current.get(tagCacheKey);
        } else {
          // Create temp container if not already created
          if (!tempContainer) {
            tempContainer = document.createElement('div');
            tempContainer.style.cssText = 'position:absolute;visibility:hidden;display:flex;gap:4px';
            document.body.appendChild(tempContainer);
          }
          
          // Measure the tag
          const tempTag = document.createElement('button');
          tempTag.className = 'measure-tag';
          tempTag.style.cssText = `
            padding: ${isMobile ? '1px 6px' : '2px 8px'};
            font-size: ${isMobile ? '0.65rem' : '0.7rem'};
            font-weight: 500;
            white-space: nowrap;
            border: 1px solid transparent;
          `;
          
          const emojis = ['🏷️', '📍', '⭐', '💫', '🎯', '🔖', '🎨', '🌟', '🏆', '💡'];
          tempTag.innerHTML = `<span>${emojis[i % emojis.length]}</span> <span>${tag}</span>`;
          tempContainer.appendChild(tempTag);
          
          tagWidth = tempTag.offsetWidth + (isMobile ? 6 : 10); // gap
          
          // Cache the width (limit cache size to 100 entries)
          if (tagWidthCache.current.size > 100) {
            const firstKey = tagWidthCache.current.keys().next().value;
            tagWidthCache.current.delete(firstKey);
          }
          tagWidthCache.current.set(tagCacheKey, tagWidth);
          
          // Clean up temp tag
          tempContainer.removeChild(tempTag);
        }
        
        if (totalTagWidth + tagWidth <= availableWidth) {
          totalTagWidth += tagWidth;
          count++;
        } else {
          break;
        }
      }
      
      // Clean up temp container if created
      if (tempContainer) {
        document.body.removeChild(tempContainer);
      }
      
      // Set the visible count - show more tags by default
      setVisibleTagCount(Math.max(isMobile ? 3 : 8, Math.min(count, tags.length)));
      setMeasuredTags(true);
    };
    
    // Initial calculation
    const timeoutId = setTimeout(calculateVisibleTags, 50);
    
    // Debounced resize handler
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(calculateVisibleTags, 150);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Also recalculate when container might change
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(resizeTimeout);
      window.removeEventListener('resize', handleResize);
      observer.disconnect();
    };
  }, [tags]);


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



  return (
    <Container darkMode={darkMode} ref={containerRef}>

      {/* Top Categories - first row */}
      {tags && tags.length > 0 && (
        <Row>
          {/* Display categories dynamically based on available space */}
          {tags.slice(0, visibleTagCount).map((tag, index) => {
            const normalizedTag = tag.split(' ').join('-').replace(/&/g, 'and').toLowerCase().replace(/[^a-zA-Z0-9-]/g, '');
            const colors = ['#e91e63', '#00bcd4', '#4caf50', '#673ab7', '#ff9800', '#795548', '#607d8b', '#3f51b5', '#009688', '#ff5722'];
            const emojis = ['🏷️', '📍', '⭐', '💫', '🎯', '🔖', '🎨', '🌟', '🏆', '💡'];
            const isSelected = tagName === tag;
            // Use modulo to cycle through colors and emojis if we have more than 10 tags
            const colorIndex = index % colors.length;
            const emojiIndex = index % emojis.length;
            
            return (
              <TagChip
                key={tag}
                data-tag="true"
                show={measuredTags}
                onClick={() => window.location.href = `/view/${normalizedTag}`}
                borderColor={`${colors[colorIndex]}4D`}
                background={isSelected ? `${colors[colorIndex]}33` : 'transparent'}
                color={darkMode ? '#fff' : '#333'}
                hoverBackground={`${colors[colorIndex]}4D`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <span>{emojis[emojiIndex]}</span>
                <span>{tag}</span>
              </TagChip>
            );
          })}
          
          {/* All Tags Button - show only if there are more tags than visible */}
          {tags.length > visibleTagCount && (
            <AllTagsButton onClick={() => setCategoriesOpen(true)}>
              <Icon icon="material-symbols:category" width="14" height="14" />
              <span>All Tags ({tags.length})</span>
            </AllTagsButton>
          )}
        </Row>
      )}

      {/* Navigation buttons and chips - second row */}
      <Row spaceBetween>
        <RowContent>
          <ButtonGroup>
            <button
              className={currentView === 'tokens' ? 'selected' : ''}
              onClick={() => window.location.href = '/'}
              style={{ minWidth: '70px' }}
            >
              <Icon icon="carbon:grid" width="14" height="14" style={{ marginRight: '4px' }} />
              Tokens
            </button>
            <button
              className={router.pathname === '/view/firstledger' ? 'selected' : ''}
              onClick={() => window.location.href = '/view/firstledger'}
              style={{ minWidth: '90px' }}
            >
              <span style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                gap: '4px',
                fontSize: '12px'
              }}>
                FirstLedger
                <Icon 
                  icon="material-symbols:open-in-new" 
                  width="12" 
                  height="12" 
                  style={{ opacity: 0.7 }}
                />
              </span>
            </button>
          </ButtonGroup>

          <Divider />

          {/* Period selector for gainers or price change sorting */}
          {(currentView === 'gainers' || ['pro5m', 'pro1h', 'pro24h', 'pro7d'].includes(currentOrderBy)) && (
            <>
              <ButtonGroup>
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
              <Divider />
            </>
          )}

          <Chip
            onClick={() => window.location.href = '/trending'}
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
            onClick={() => window.location.href = '/spotlight'}
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
            onClick={() => window.location.href = '/gainers/24h'}
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
            onClick={() => window.location.href = '/new'}
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
            onClick={() => window.location.href = '/most-viewed'}
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
        </RowContent>

        {/* Rows selector on the right */}
        <RowsSelector
          darkMode={darkMode}
          value={rows}
          onChange={(e) => setRows(e.target.value === 'all' ? 9999 : parseInt(e.target.value))}
        >
          <option value="20">20</option>
          <option value="50">50</option>
          <option value="100">100</option>
          <option value="300">300</option>
          <option value="all">All</option>
        </RowsSelector>
      </Row>

      {/* Categories Drawer */}
      {categoriesOpen && (
        <CategoriesDrawer
          isOpen={categoriesOpen}
          toggleDrawer={() => setCategoriesOpen(false)}
          tags={tags}
          md5="categories-drawer"
        />
      )}
      
    </Container>
  );
});

export default SearchToolbar;