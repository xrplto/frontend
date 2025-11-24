import React, { useState, useCallback, useMemo, memo, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
import Link from 'next/link';

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
  border: 1.5px solid
    ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)')};
  background: ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.01)' : 'rgba(0, 0, 0, 0.01)')};
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.04);
  padding: 8px;
  position: relative;
  transition: all 0.3s ease;

  &:hover {
    background: ${(props) =>
      props.darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'};
    border-color: ${(props) =>
      props.darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
  }

  @media (max-width: 600px) {
    padding: 4px;
    gap: 4px;
  }
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: ${(props) => (props.spaceBetween ? 'space-between' : 'flex-start')};
  gap: 10px;
  flex-wrap: wrap;
  flex-direction: row;
  overflow-x: hidden;
  overflow-y: visible;
  width: 100%;

  @media (max-width: 600px) {
    gap: 2px;
    overflow-x: auto;
    flex-wrap: nowrap;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const RowContent = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;

  @media (max-width: 600px) {
    gap: 4px;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: thin;

    &::-webkit-scrollbar {
      height: 3px;
    }

    &::-webkit-scrollbar-track {
      background: transparent;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(145, 158, 171, 0.15);
      border-radius: 2px;
    }
  }
`;

const RowsSelector = styled.select`
  padding: 4px 8px;
  border: 1.5px solid rgba(145, 158, 171, 0.24);
  border-radius: 8px;
  background: ${(props) =>
    props.darkMode ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 1)'};
  color: ${(props) => (props.darkMode ? '#fff' : '#1a1a1a')};
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  height: 32px;
  min-width: 80px;
  transition: all 0.3s ease;
  margin-left: ${(props) => (props.noMargin ? '0' : 'auto')};
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: ${(props) =>
    `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='${props.darkMode ? '%23fff' : '%23333'}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`};
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 16px;
  padding-right: 32px;

  &:hover {
    background-color: ${(props) =>
      props.darkMode ? 'rgba(17, 24, 39, 0.95)' : 'rgba(255, 255, 255, 1)'};
    border-color: rgba(33, 150, 243, 0.3);
  }

  &:focus {
    outline: none;
    border-color: rgba(33, 150, 243, 0.4);
    box-shadow: 0 0 0 2px
      ${(props) => (props.darkMode ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.05)')};
  }

  option {
    background: ${(props) => (props.darkMode ? '#111827' : '#ffffff')};
    color: ${(props) => (props.darkMode ? '#fff' : '#333')};
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
  border: ${(props) =>
    props.variant === 'outlined' ? '1px solid rgba(145, 158, 171, 0.15)' : 'none'};
  border-radius: 8px;
  background: ${(props) => {
    if (props.variant === 'contained') {
      return props.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)';
    }
    if (props.selected) return 'rgba(33, 150, 243, 0.08)';
    return 'transparent';
  }};
  color: ${(props) => {
    if (props.variant === 'contained') return props.isDark ? '#fff' : '#333';
    if (props.selected) return '#2196f3';
    return 'inherit';
  }};
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: ${(props) => (props.variant === 'contained' ? 600 : 500)};
  text-transform: none;
  font-family: inherit;
  height: 36px;
  min-width: ${(props) => props.minWidth || 'auto'};
  transition: all 0.3s ease;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    background: ${(props) => {
      if (props.variant === 'contained') {
        return props.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';
      }
      return 'rgba(33, 150, 243, 0.06)';
    }};
    transform: translateY(-1px);
    box-shadow: ${(props) =>
      props.variant === 'contained' ? '0 2px 6px rgba(0, 0, 0, 0.08)' : 'none'};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 600px) {
    padding: 3px 6px;
    font-size: 0.7rem;
    height: 28px;
    gap: 2px;
  }
`;

const StyledIconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: ${(props) =>
    props.selected ? '1px solid rgba(33, 150, 243, 0.3)' : '1px solid rgba(145, 158, 171, 0.08)'};
  border-radius: 8px;
  background: ${(props) => (props.selected ? 'rgba(33, 150, 243, 0.08)' : 'rgba(0, 0, 0, 0.02)')};
  color: ${(props) => (props.selected ? '#2196f3' : 'inherit')};
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
  border-radius: 6px;

  & > button {
    border-radius: 4px;
    border: none;
    min-width: 36px;
    height: 32px;
    padding: 0 10px;
    font-size: 0.8rem;
    font-weight: 400;
    background: transparent;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;

    &:hover {
      background: rgba(33, 150, 243, 0.08);
    }
  }

  & > button.selected {
    background: rgba(33, 150, 243, 0.12);
    color: #2196f3;
    font-weight: 500;

    &:hover {
      background: rgba(33, 150, 243, 0.15);
    }
  }

  @media (max-width: 600px) {
    display: ${(props) => (props.hideOnMobile ? 'none' : 'flex')};

    & > button {
      min-width: 28px;
      height: 28px;
      padding: 0 6px;
      font-size: 0.7rem;
      gap: 2px;
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
    display: ${(props) => (props.hideOnMobile ? 'none' : 'block')};
    margin: 0 2px;
  }
`;

const Chip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border: ${(props) => props.border || '1.5px solid'};
  border-color: ${(props) => props.borderColor || 'rgba(145, 158, 171, 0.2)'};
  border-radius: 6px;
  background: ${(props) => props.background || 'transparent'};
  color: ${(props) => props.color || 'inherit'};
  font-size: 0.8rem;
  font-weight: 400;
  cursor: pointer;
  white-space: nowrap;
  height: 32px;
  flex-shrink: 0;

  &:hover {
    background: ${(props) => props.hoverBackground || 'rgba(145, 158, 171, 0.08)'};
    border-color: ${(props) => props.hoverBorderColor || props.borderColor || 'rgba(145, 158, 171, 0.3)'};
  }

  @media (max-width: 600px) {
    padding: 2px 8px;
    font-size: 0.7rem;
    height: 28px;
    gap: 2px;
    display: ${(props) => (props.hideOnMobile ? 'none' : 'inline-flex')};
  }
`;

const TagChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1.5px solid ${(props) => props.borderColor || 'rgba(145, 158, 171, 0.15)'};
  border-radius: 6px;
  background: transparent;
  color: ${(props) => props.color || 'inherit'};
  font-size: 0.75rem;
  font-weight: 400;
  cursor: pointer;
  white-space: nowrap;
  height: 28px;
  flex-shrink: 0;
  opacity: ${(props) => (props.show ? 1 : 0)};

  &:hover {
    background: ${(props) => props.hoverBackground || 'rgba(66, 133, 244, 0.04)'};
    border-color: #4285f4;
  }

  @media (max-width: 600px) {
    font-size: 0.65rem;
    height: 24px;
    padding: 2px 6px;
    gap: 2px;
  }
`;

const AllTagsButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1.5px solid #4285f4;
  border-radius: 6px;
  background: transparent;
  color: #4285f4;
  font-size: 0.75rem;
  font-weight: 400;
  cursor: pointer;
  white-space: nowrap;
  height: 28px;
  flex-shrink: 0;

  &:hover {
    background: rgba(66, 133, 244, 0.04);
    border-color: #4285f4;
  }

  @media (max-width: 600px) {
    font-size: 0.65rem;
    height: 24px;
    padding: 2px 6px;
    gap: 2px;
  }
`;

const Drawer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1300;
  display: ${props => props.open ? 'block' : 'none'};
`;

const DrawerBackdrop = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
`;

const DrawerPaper = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 80vh;
  background: ${props => props.isDark ? '#000' : '#fff'};
  border-top-left-radius: 20px;
  border-top-right-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
`;

const DrawerTitle = styled.h2`
  font-weight: 400;
  font-size: 16px;
  margin: 0;
  color: ${props => props.isDark ? '#fff' : '#000'};
`;

const DrawerClose = styled.button`
  width: 32px;
  height: 32px;
  border: 1.5px solid ${props => props.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
  border-radius: 12px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.isDark ? '#fff' : '#000'};
  font-size: 20px;

  &:hover {
    background: rgba(0,0,0,0.04);
  }
`;

const Menu = styled.div`
  position: fixed;
  z-index: 1300;
  display: ${props => props.open ? 'block' : 'none'};
`;

const MenuPaper = styled.div`
  min-width: 120px;
  border-radius: 12px;
  border: 1px solid ${props => props.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};
  background: ${props => props.isDark ? '#1a1a1a' : '#ffffff'};
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  margin-top: 4px;
  overflow: hidden;
`;

const MenuItem = styled.button`
  width: 100%;
  padding: 8px 16px;
  border: none;
  background: transparent;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
  color: ${props => props.isDark ? '#fff' : '#000'};

  &:hover {
    background: rgba(76, 175, 80, 0.08);
  }
`;

const SearchBox = styled.div`
  padding: 16px;
  border-bottom: 1px solid ${props => props.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 10px 12px;
  border: 1.5px solid ${props => props.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'};
  border-radius: 12px;
  font-size: 14px;
  outline: none;
  background: ${props => props.isDark ? '#1a1a1a' : '#fff'};
  color: ${props => props.isDark ? '#fff' : '#000'};
  font-family: inherit;
`;

const TagsGrid = styled.div`
  padding: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 60vh;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.2);
    border-radius: 4px;
  }
`;

const TagButton = styled.button`
  min-width: 80px;
  max-width: 200px;
  height: 36px;
  padding: 0 12px;
  border: 1.5px solid rgba(145, 158, 171, 0.2);
  border-radius: 6px;
  background: transparent;
  color: ${props => props.isDark ? '#fff' : '#000'};
  font-size: 13px;
  font-weight: 400;
  cursor: pointer;
  font-family: inherit;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  &:hover {
    border-color: #4285f4;
    background: rgba(66, 133, 244, 0.04);
  }
`;

const EmptyState = styled.div`
  width: 100%;
  text-align: center;
  padding: 32px 0;
  color: ${props => props.isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'};
  font-size: 14px;
`;

// Normalize tag function (shared)
const normalizeTag = (tag) => {
  if (!tag) return '';
  return tag.split(' ').join('-').replace(/&/g, 'and').toLowerCase().replace(/[^a-zA-Z0-9-]/g, '');
};

// Categories Drawer Content Component
const CategoriesDrawerContent = memo(function CategoriesDrawerContent({ tags, darkMode }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredTags = useMemo(() => {
    if (!tags) return [];
    if (!searchTerm.trim()) return tags;
    const term = searchTerm.toLowerCase();
    return tags.filter((tag) => tag.toLowerCase().includes(term));
  }, [tags, searchTerm]);

  return (
    <>
      {tags && tags.length > 0 && (
        <SearchBox isDark={darkMode}>
          <SearchInput
            type="search"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
            isDark={darkMode}
          />
        </SearchBox>
      )}

      <TagsGrid>
        {filteredTags.length > 0 ? (
          filteredTags.map((tag) => (
            <Link key={tag} href={`/view/${normalizeTag(tag)}`} style={{ textDecoration: 'none' }}>
              <TagButton isDark={darkMode} onClick={() => {}}>
                {tag}
              </TagButton>
            </Link>
          ))
        ) : (
          <EmptyState isDark={darkMode}>
            {searchTerm ? 'No matching categories' : 'No categories available'}
          </EmptyState>
        )}
      </TagsGrid>
    </>
  );
});

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
  setOrderBy,
  viewMode,
  setViewMode,
  customColumns,
  setCustomColumns,
  setCustomSettingsOpen
}) {
  const router = useRouter();
  const { darkMode } = useContext(AppContext);

  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [gainersMenuAnchor, setGainersMenuAnchor] = useState(null);
  const containerRef = useRef(null);
  const [visibleTagCount, setVisibleTagCount] = useState(0);
  const [measuredTags, setMeasuredTags] = useState(false);
  const tagWidthCache = useRef(new Map());

  // Calculate how many tags can fit dynamically
  useEffect(() => {
    const calculateVisibleTags = () => {
      if (!containerRef.current || !tags || tags.length === 0) return;

      // Read all DOM properties at once before any DOM modifications
      const container = containerRef.current;
      const containerWidth = container.offsetWidth;
      const isMobile = window.innerWidth <= 600;

      // Since tags are in their own row, we don't need to account for fixed elements
      // Reserve space for "All Tags" button (approx 100px on desktop, 60px mobile)
      const allTagsWidth = isMobile ? 60 : 100;

      // Available width for tags - use most of the container width for tags
      const availableWidth = containerWidth - allTagsWidth - 20; // 20px buffer for All Tags button and spacing

      if (availableWidth <= 100) {
        setVisibleTagCount(isMobile ? 3 : 5);
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
            tempContainer.style.cssText =
              'position:absolute;visibility:hidden;display:flex;gap:4px';
            document.body.appendChild(tempContainer);
          }

          // Measure the tag
          const tempTag = document.createElement('button');
          tempTag.className = 'measure-tag';
          tempTag.style.cssText = `
            padding: ${isMobile ? '0px 4px' : '2px 8px'};
            font-size: ${isMobile ? '0.55rem' : '0.7rem'};
            font-weight: 400;
            white-space: nowrap;
            border: 1.5px solid transparent;
          `;

          // Just measure text width without icons since icons have consistent width
          tempTag.innerHTML = `<span style="width:12px;height:12px;display:inline-block"></span> <span>${tag}</span>`;
          tempContainer.appendChild(tempTag);
        }
      }

      // Batch all DOM reads after all modifications are done
      if (tempContainer) {
        const tempTags = tempContainer.querySelectorAll('.measure-tag');
        let tempIndex = 0;

        for (let i = 0; i < tags.length; i++) {
          const tag = tags[i];
          const tagCacheKey = `${cacheKey}-${tag}`;

          let tagWidth;

          if (tagWidthCache.current.has(tagCacheKey)) {
            tagWidth = tagWidthCache.current.get(tagCacheKey);
          } else {
            // Read the width from the temp element
            tagWidth = tempTags[tempIndex].offsetWidth + (isMobile ? 3 : 10); // gap
            tempIndex++;

            // Cache the width (limit cache size to 100 entries)
            if (tagWidthCache.current.size > 100) {
              const firstKey = tagWidthCache.current.keys().next().value;
              tagWidthCache.current.delete(firstKey);
            }
            tagWidthCache.current.set(tagCacheKey, tagWidth);
          }

          if (totalTagWidth + tagWidth <= availableWidth) {
            totalTagWidth += tagWidth;
            count++;
          } else {
            break;
          }
        }
      } else {
        // Original loop for when no measuring is needed
        for (let i = 0; i < tags.length; i++) {
          const tag = tags[i];
          const tagCacheKey = `${cacheKey}-${tag}`;

          if (tagWidthCache.current.has(tagCacheKey)) {
            const tagWidth = tagWidthCache.current.get(tagCacheKey);
            if (totalTagWidth + tagWidth <= availableWidth) {
              totalTagWidth += tagWidth;
              count++;
            } else {
              break;
            }
          }
        }
      }

      // Clean up temp container if created
      if (tempContainer) {
        document.body.removeChild(tempContainer);
      }

      // Set the visible count - show more tags by default
      setVisibleTagCount(Math.max(isMobile ? 5 : 8, Math.min(count, tags.length)));
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
        <Row style={{ paddingBottom: '2px' }}>
          {/* Display categories dynamically based on available space */}
          {tags.slice(0, visibleTagCount).map((tag, index) => {
            const normalizedTag = tag
              .split(' ')
              .join('-')
              .replace(/&/g, 'and')
              .toLowerCase()
              .replace(/[^a-zA-Z0-9-]/g, '');
            const isSelected = tagName === tag;

            return (
              <TagChip
                key={tag}
                data-tag="true"
                show={measuredTags}
                onClick={() => (window.location.href = `/view/${normalizedTag}`)}
                borderColor={isSelected ? '#4285f4' : 'rgba(145, 158, 171, 0.2)'}
                color={isSelected ? '#4285f4' : darkMode ? '#fff' : '#333'}
                hoverBackground="rgba(66, 133, 244, 0.04)"
              >
                <span>{tag}</span>
              </TagChip>
            );
          })}

          {/* All Tags Button - show only if there are more tags than visible */}
          {tags.length > visibleTagCount && (
            <AllTagsButton onClick={() => setCategoriesOpen(true)}>
              <span>All ({tags.length})</span>
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
              onClick={() => (window.location.href = '/')}
            >
              Tokens
            </button>
            <button
              className={router.pathname === '/view/firstledger' ? 'selected' : ''}
              onClick={() => (window.location.href = '/view/firstledger')}
            >
              FirstLedger
            </button>
          </ButtonGroup>

          <Divider />

          {/* Period selector for gainers or price change sorting */}
          {(currentView === 'gainers' ||
            ['pro5m', 'pro1h', 'pro24h', 'pro7d'].includes(currentOrderBy)) && (
            <>
              <ButtonGroup>
                <button
                  className={currentPeriod === '5m' ? 'selected' : ''}
                  onClick={() => {
                    if (currentView === 'gainers') {
                      window.location.href = '/gainers/5m';
                    } else {
                      setOrderBy('pro5m');
                      setSync((prev) => prev + 1);
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
                      setSync((prev) => prev + 1);
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
                      setSync((prev) => prev + 1);
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
                      setSync((prev) => prev + 1);
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
            onClick={() => (window.location.href = '/trending')}
            background={currentView === 'trending' ? 'rgba(255, 87, 34, 0.12)' : 'transparent'}
            borderColor={currentView === 'trending' ? '#ff5722' : 'rgba(255, 87, 34, 0.3)'}
            color="#ff5722"
            hoverBackground="rgba(255, 87, 34, 0.08)"
            hoverBorderColor="#ff5722"
          >
            🔥 Hot
          </Chip>

          <Chip
            onClick={() => (window.location.href = '/spotlight')}
            background={currentView === 'spotlight' ? 'rgba(33, 150, 243, 0.12)' : 'transparent'}
            borderColor={currentView === 'spotlight' ? '#2196f3' : 'rgba(33, 150, 243, 0.3)'}
            color="#2196f3"
            hoverBackground="rgba(33, 150, 243, 0.08)"
            hoverBorderColor="#2196f3"
          >
            💎 Gems
          </Chip>

          <Chip
            onClick={(e) => setGainersMenuAnchor(e.currentTarget)}
            background={currentView === 'gainers' ? 'rgba(76, 175, 80, 0.12)' : 'transparent'}
            borderColor={currentView === 'gainers' ? '#4caf50' : 'rgba(76, 175, 80, 0.3)'}
            color="#4caf50"
            hoverBackground="rgba(76, 175, 80, 0.08)"
            hoverBorderColor="#4caf50"
          >
            📈 Gainers
          </Chip>

          <Chip
            onClick={() => (window.location.href = '/new')}
            background={currentView === 'new' ? 'rgba(255, 152, 0, 0.12)' : 'transparent'}
            borderColor={currentView === 'new' ? '#ff9800' : 'rgba(255, 152, 0, 0.3)'}
            color="#ff9800"
            hoverBackground="rgba(255, 152, 0, 0.08)"
            hoverBorderColor="#ff9800"
          >
            ✨ New
          </Chip>

          <Chip
            onClick={() => (window.location.href = '/most-viewed')}
            background={currentView === 'most-viewed' ? 'rgba(156, 39, 176, 0.12)' : 'transparent'}
            borderColor={currentView === 'most-viewed' ? '#9c27b0' : 'rgba(156, 39, 176, 0.3)'}
            color="#9c27b0"
            hoverBackground="rgba(156, 39, 176, 0.08)"
            hoverBorderColor="#9c27b0"
          >
            👁 Popular
          </Chip>
        </RowContent>

        {/* View mode and rows selectors on the right */}
        <Stack style={{ marginLeft: 'auto', gap: '8px' }}>
          {/* View Mode Selector */}
          {setViewMode && (
            <>
              <label htmlFor="view-mode-select" className="visually-hidden">
                View Mode
              </label>
              <RowsSelector
                id="view-mode-select"
                darkMode={darkMode}
                value={viewMode || 'classic'}
                onChange={(e) => setViewMode(e.target.value)}
                noMargin
                style={{ minWidth: '110px' }}
                aria-label="Select view mode"
              >
                <option value="classic">Classic</option>
                <option value="priceChange">Price Change</option>
                <option value="marketData">Market Data</option>
                <option value="topGainers">Top Gainers</option>
                <option value="trader">Trader View</option>
                <option value="custom">Custom</option>
              </RowsSelector>
            </>
          )}

          {/* Custom columns settings button */}
          {viewMode === 'custom' && (
            <StyledIconButton
              onClick={() => setCustomSettingsOpen(true)}
              darkMode={darkMode}
              title="Configure columns"
              aria-label="Configure custom columns"
            >
              ⚙️
            </StyledIconButton>
          )}

          {/* Rows selector */}
          <>
            <label htmlFor="rows-per-page-select" className="visually-hidden">
              Rows per page
            </label>
            <RowsSelector
              id="rows-per-page-select"
              darkMode={darkMode}
              value={rows}
              onChange={(e) => setRows(parseInt(e.target.value))}
              noMargin
              aria-label="Select number of rows to display"
            >
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </RowsSelector>
          </>
        </Stack>
      </Row>

      {/* Gainers Period Menu */}
      {Boolean(gainersMenuAnchor) && (
        <>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1299
            }}
            onClick={() => setGainersMenuAnchor(null)}
          />
          <Menu open={Boolean(gainersMenuAnchor)}>
            <MenuPaper
              isDark={darkMode}
              style={{
                position: 'absolute',
                top: gainersMenuAnchor?.getBoundingClientRect().bottom + 4,
                left: gainersMenuAnchor?.getBoundingClientRect().left
              }}
            >
              <MenuItem
                isDark={darkMode}
                onClick={() => {
                  window.location.href = '/gainers/5m';
                  setGainersMenuAnchor(null);
                }}
              >
                5 Minutes
              </MenuItem>
              <MenuItem
                isDark={darkMode}
                onClick={() => {
                  window.location.href = '/gainers/1h';
                  setGainersMenuAnchor(null);
                }}
              >
                1 Hour
              </MenuItem>
              <MenuItem
                isDark={darkMode}
                onClick={() => {
                  window.location.href = '/gainers/24h';
                  setGainersMenuAnchor(null);
                }}
              >
                24 Hours
              </MenuItem>
              <MenuItem
                isDark={darkMode}
                onClick={() => {
                  window.location.href = '/gainers/7d';
                  setGainersMenuAnchor(null);
                }}
              >
                7 Days
              </MenuItem>
            </MenuPaper>
          </Menu>
        </>
      )}

      {/* Categories Drawer */}
      <Drawer open={categoriesOpen}>
        <DrawerBackdrop onClick={() => setCategoriesOpen(false)} />
        <DrawerPaper isDark={darkMode}>
          <DrawerHeader isDark={darkMode}>
            <DrawerTitle isDark={darkMode}>
              Categories {tags?.length ? `(${tags.length})` : ''}
            </DrawerTitle>
            <DrawerClose isDark={darkMode} onClick={() => setCategoriesOpen(false)} aria-label="Close">
              ×
            </DrawerClose>
          </DrawerHeader>
          <CategoriesDrawerContent tags={tags} darkMode={darkMode} />
        </DrawerPaper>
      </Drawer>
    </Container>
  );
});

export default SearchToolbar;
