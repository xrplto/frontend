import React, { useState, useMemo, memo, useRef, useEffect, Fragment } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
import Link from 'next/link';
import { Search, X } from 'lucide-react';

// Styled Components
const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  border-radius: 12px;
  border: 1px solid ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)')};
  background: ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.015)')};
  padding: 10px 14px;
  position: relative;

  @media (max-width: 600px) {
    padding: 8px 10px;
    gap: 8px;
  }
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  justify-content: ${(props) => (props.spaceBetween ? 'space-between' : 'flex-start')};
  gap: 6px;
  flex-wrap: ${(props) => (props.noWrap ? 'nowrap' : 'wrap')};
  flex-direction: row;
  overflow-x: ${(props) => (props.noWrap ? 'auto' : 'hidden')};
  overflow-y: visible;
  width: 100%;
  position: relative;

  @media (max-width: 600px) {
    gap: 8px;
    overflow-x: auto;
    flex-wrap: nowrap;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    -ms-overflow-style: none;
    padding-bottom: 2px;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const TagsRow = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;

  @media (max-width: 600px) {
    gap: 6px;
  }
`;

const TagsScrollArea = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  flex: 1 1 auto;
  min-width: 0;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 600px) {
    gap: 6px;
  }
`;

const AllButtonWrapper = styled.div`
  flex-shrink: 0;
  margin-left: 4px;
`;

const RowContent = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  flex-wrap: wrap;
  flex: 1 1 auto;

  @media (max-width: 600px) {
    gap: 4px;
    flex-wrap: nowrap;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const RowsSelector = styled.select`
  padding: 0 24px 0 10px;
  border: none;
  border-radius: 6px;
  background: ${(props) =>
    props.darkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'};
  color: ${(props) => (props.darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)')};
  font-size: 0.72rem;
  font-weight: 400;
  cursor: pointer;
  height: 30px;
  min-width: 60px;
  margin-left: ${(props) => (props.noMargin ? '0' : 'auto')};
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: ${(props) =>
    props.darkMode
      ? `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.5)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`
      : `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(0,0,0,0.4)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`};
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 12px;
  transition: all 0.15s ease;

  &:hover {
    background-color: ${(props) => props.darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)'};
  }

  &:focus {
    outline: none;
  }

  option {
    background: ${(props) => (props.darkMode ? '#1a1a1a' : '#ffffff')};
    color: ${(props) => (props.darkMode ? '#fff' : '#333')};
    padding: 8px;
  }

  @media (max-width: 600px) {
    font-size: 0.68rem;
    height: 28px;
    min-width: 50px;
    padding: 0 20px 0 8px;
    background-size: 10px;
    background-position: right 6px center;
  }
`;

const Stack = styled.div`
  display: flex;
  flex-direction: row;
  gap: 6px;
  align-items: center;
  flex-shrink: 0;
  position: relative;
  z-index: 1;

  @media (max-width: 600px) {
    gap: 4px;
    touch-action: manipulation;
  }
`;

const StyledIconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: ${(props) => props.darkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.4)'};
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;

  &:hover {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }

  @media (max-width: 600px) {
    width: 28px;
    height: 28px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 2px;
  flex-shrink: 0;
  background: ${(props) => props.darkMode ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)'};
  padding: 3px;
  border-radius: 8px;
  border: none;

  & > button {
    border-radius: 6px;
    border: none;
    min-width: 36px;
    height: 24px;
    padding: 0 10px;
    font-size: 0.72rem;
    font-weight: 400;
    background: transparent;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    color: ${(props) => props.darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.5)'};
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition: all 0.15s ease;

    &:hover {
      color: ${(props) => props.darkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.8)'};
      background: ${(props) => props.darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'};
    }
  }

  & > button.selected {
    background: ${(props) => props.darkMode ? 'rgba(255, 255, 255, 0.95)' : '#fff'};
    color: ${(props) => props.darkMode ? '#111' : '#333'};
    font-weight: 500;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);

    &:hover {
      background: ${(props) => props.darkMode ? '#fff' : '#fff'};
    }
  }

  @media (max-width: 600px) {
    display: ${(props) => (props.hideOnMobile ? 'none' : 'flex')};
    padding: 3px;

    & > button {
      min-width: 32px;
      height: 24px;
      padding: 0 8px;
      font-size: 0.68rem;
      gap: 3px;
    }
  }
`;

const LaunchpadGroup = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 3px 6px 3px 8px;
  border-radius: 6px;
  background: ${(props) => props.darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)'};
  border: 1px solid ${(props) => props.darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'};
  margin-left: 8px;
`;

const LaunchpadLabel = styled.span`
  font-size: 0.6rem;
  font-weight: 600;
  color: ${(props) => props.darkMode ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.35)'};
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-right: 4px;
`;

const LaunchpadChip = styled.button`
  display: inline-flex;
  align-items: center;
  padding: 0 6px;
  border: none;
  border-radius: 4px;
  background: ${(props) => props.selected ? 'rgba(59, 130, 246, 0.15)' : 'transparent'};
  color: ${(props) => props.selected ? '#3b82f6' : (props.darkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(33, 43, 54, 0.6)')};
  font-size: 0.65rem;
  font-weight: ${(props) => props.selected ? 500 : 400};
  cursor: pointer;
  white-space: nowrap;
  height: 20px;
  flex-shrink: 0;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }
`;

const TagChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 10px;
  border: 1px solid ${(props) => props.selected ? 'rgba(59, 130, 246, 0.3)' : (props.darkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)')};
  border-radius: 6px;
  background: ${(props) => props.selected
    ? 'rgba(59, 130, 246, 0.1)'
    : (props.darkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)')};
  color: ${(props) => props.selected ? '#3b82f6' : (props.darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(33, 43, 54, 0.7)')};
  font-size: 0.7rem;
  font-weight: ${(props) => props.selected ? 500 : 400};
  cursor: pointer;
  white-space: nowrap;
  height: 26px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  z-index: 1;
  transition: color 0.3s ease, border-color 0.3s ease;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, #3b82f6 0%, #60a5fa 50%, #3b82f6 100%);
    transform: translateX(-100%);
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    z-index: -1;
    border-radius: 6px;
  }

  &:hover {
    color: #fff;
    border-color: #3b82f6;
  }

  &:hover::before {
    transform: translateX(0);
  }

  @media (max-width: 600px) {
    font-size: 0.68rem;
    height: 26px;
    padding: 0 10px;
    gap: 3px;
  }
`;

const AllTagsButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
  border: none;
  border-radius: 16px;
  background: ${(props) => props.darkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)'};
  color: #3b82f6;
  font-size: 0.7rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  height: 26px;
  flex-shrink: 0;
  margin-left: auto;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(59, 130, 246, 0.2);
  }

  @media (max-width: 600px) {
    font-size: 0.68rem;
    height: 26px;
    padding: 0 10px;
    gap: 3px;
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
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
`;

const DrawerPaper = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  max-height: 70vh;
  background: ${props => props.isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.98)'};
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  border-top: 1px solid ${props => props.isDark ? 'rgba(59,130,246,0.2)' : 'rgba(191,219,254,1)'};
  box-shadow: ${props => props.isDark ? '0 -25px 50px -12px rgba(59,130,246,0.1)' : '0 -25px 50px -12px rgba(191,219,254,0.5)'};
  overflow: hidden;
  display: flex;
  flex-direction: column;
  z-index: 1301;
`;

const DrawerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
`;

const DrawerTitle = styled.h2`
  font-weight: 500;
  font-size: 15px;
  margin: 0;
  color: ${props => props.isDark ? '#fff' : '#212B36'};
`;

const DrawerClose = styled.button`
  width: 32px;
  height: 32px;
  border: 1.5px solid ${props => props.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'};
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'};
  transition: border-color 0.15s, color 0.15s;

  &:hover {
    border-color: ${props => props.isDark ? 'rgba(66,133,244,0.5)' : 'rgba(66,133,244,0.5)'};
    color: #4285f4;
  }
`;

const SearchBox = styled.div`
  padding: 12px 16px;
`;

const SearchInputWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  height: 40px;
  padding: 0 16px;
  border-radius: 12px;
  border: 1.5px solid ${props => props.isDark ? 'rgba(59,130,246,0.08)' : 'rgba(0,0,0,0.08)'};
  background: ${props => props.isDark ? 'rgba(255,255,255,0.02)' : '#fff'};
  transition: border-color 0.2s ease;

  &:hover {
    border-color: ${props => props.isDark ? 'rgba(59,130,246,0.2)' : 'rgba(59,130,246,0.3)'};
  }

  &:focus-within {
    border-color: ${props => props.isDark ? 'rgba(59,130,246,0.4)' : 'rgba(59,130,246,0.5)'};
  }
`;

const SearchIconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'};
  flex-shrink: 0;
`;

const SearchInput = styled.input`
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  font-size: 14px;
  color: ${props => props.isDark ? '#fff' : '#212B36'};
  font-family: inherit;

  &:focus {
    outline: none;
  }

  &::placeholder {
    color: ${props => props.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(33, 43, 54, 0.4)'};
  }
`;

const TagsGrid = styled.div`
  padding: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  flex: 1;
  overflow-y: auto;
  align-content: flex-start;

  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: transparent;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(59, 130, 246, 0.15);
    border-radius: 8px;
  }

  @media (max-width: 600px) {
    padding: 12px;
    gap: 8px;
  }
`;

const TagButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px 12px;
  border: 1px solid ${props => props.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'};
  border-radius: 8px;
  background: transparent;
  color: ${props => props.isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(33, 43, 54, 0.7)'};
  font-size: 0.75rem;
  font-weight: 400;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  height: 28px;
  flex-shrink: 0;
  transition: border-color 0.2s ease, background 0.2s ease;

  &:hover {
    background: rgba(59, 130, 246, 0.08);
    border-color: rgba(59, 130, 246, 0.3);
    color: #3b82f6;
  }

  @media (max-width: 600px) {
    height: 32px;
    padding: 4px 14px;
    font-size: 0.8rem;
  }
`;

const EmptyState = styled.div`
  width: 100%;
  text-align: center;
  padding: 32px 0;
  color: ${props => props.isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(33, 43, 54, 0.5)'};
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
          <SearchInputWrapper isDark={darkMode}>
            <SearchIconWrapper isDark={darkMode}>
              <Search size={16} />
            </SearchIconWrapper>
            <SearchInput
              type="search"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
              isDark={darkMode}
            />
          </SearchInputWrapper>
        </SearchBox>
      )}

      <TagsGrid isDark={darkMode}>
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
    <Fragment>
      <Container darkMode={darkMode} ref={containerRef}>
      {/* Top Categories - first row */}
      {tags && tags.length > 0 && (
        <TagsRow>
          <TagsScrollArea>
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
                  onClick={() => (window.location.href = `/view/${normalizedTag}`)}
                  selected={isSelected}
                  darkMode={darkMode}
                >
                  <span>{tag}</span>
                </TagChip>
              );
            })}
          </TagsScrollArea>

          {/* All Tags Button - always visible, never hidden by scroll */}
          <AllButtonWrapper>
            <AllTagsButton onClick={() => setCategoriesOpen(true)} darkMode={darkMode}>
              <span>All {tags.length > visibleTagCount ? `(${tags.length})` : ''}</span>
            </AllTagsButton>
          </AllButtonWrapper>
        </TagsRow>
      )}

      {/* View controls - second row */}
      <Row spaceBetween>
        <RowContent>
          {/* All Tokens */}
          <TagChip
            onClick={() => (window.location.href = '/')}
            selected={currentView === 'tokens'}
            darkMode={darkMode}
          >
            All Tokens
          </TagChip>

          {/* Launchpads group */}
          <LaunchpadGroup darkMode={darkMode}>
            <LaunchpadLabel darkMode={darkMode}>Launchpads</LaunchpadLabel>
            {[
              { slug: 'firstledger', name: 'FirstLedger' },
              { slug: 'magnetic-x', name: 'Magnetic X' },
              { slug: 'xpmarket', name: 'XPmarket' },
              { slug: 'aigentrun', name: 'aigent.run' },
              { slug: 'ledgermeme', name: 'LedgerMeme' },
              { slug: 'horizon', name: 'Horizon' },
              { slug: 'moonvalve', name: 'Moonvalve' }
            ].map((lp) => (
              <LaunchpadChip
                key={lp.slug}
                onClick={() => (window.location.href = `/view/${lp.slug}`)}
                selected={router.query.tag === lp.slug}
                darkMode={darkMode}
              >
                {lp.name}
              </LaunchpadChip>
            ))}
          </LaunchpadGroup>

          {/* Period selector for gainers or price change sorting */}
          {(currentView === 'gainers' ||
            ['pro5m', 'pro1h', 'pro24h', 'pro7d'].includes(currentOrderBy)) && (
            <ButtonGroup darkMode={darkMode}>
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
          )}
        </RowContent>

        {/* View mode and rows selectors on the right */}
        <Stack style={{ marginLeft: 'auto', gap: '6px' }}>
          {/* View Mode Selector */}
          {setViewMode && (
            <ButtonGroup darkMode={darkMode}>
              <button
                className={viewMode === 'classic' ? 'selected' : ''}
                onClick={() => setViewMode('classic')}
                title="Classic View"
              >
                Classic
              </button>
              <button
                className={viewMode === 'priceChange' ? 'selected' : ''}
                onClick={() => setViewMode('priceChange')}
                title="Price Change View"
              >
                Price
              </button>
              <button
                className={viewMode === 'marketData' ? 'selected' : ''}
                onClick={() => setViewMode('marketData')}
                title="Market Data View"
              >
                Market
              </button>
              <button
                className={viewMode === 'topGainers' ? 'selected' : ''}
                onClick={() => setViewMode('topGainers')}
                title="Top Gainers View"
              >
                Gainers
              </button>
              <button
                className={viewMode === 'trader' ? 'selected' : ''}
                onClick={() => setViewMode('trader')}
                title="Trader View"
              >
                Trader
              </button>
              <button
                className={viewMode === 'custom' ? 'selected' : ''}
                onClick={() => setViewMode('custom')}
                title="Custom View"
              >
                Custom
              </button>
            </ButtonGroup>
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

    </Container>

    {/* Categories Drawer - rendered outside Container to avoid position:relative issues */}
    {categoriesOpen && (
      <Drawer open={categoriesOpen}>
        <DrawerBackdrop onClick={() => setCategoriesOpen(false)} />
        <DrawerPaper isDark={darkMode}>
          <DrawerHeader isDark={darkMode}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
              <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#3b82f6', whiteSpace: 'nowrap' }}>
                Categories {tags?.length ? `(${tags.length})` : ''}
              </span>
              <div
                style={{
                  flex: 1,
                  height: '14px',
                  backgroundImage: darkMode
                    ? 'radial-gradient(circle, rgba(96,165,250,0.4) 1px, transparent 1px)'
                    : 'radial-gradient(circle, rgba(66,133,244,0.5) 1px, transparent 1px)',
                  backgroundSize: '8px 5px',
                  WebkitMaskImage: 'linear-gradient(90deg, black 0%, transparent 100%)',
                  maskImage: 'linear-gradient(90deg, black 0%, transparent 100%)'
                }}
              />
            </div>
            <DrawerClose isDark={darkMode} onClick={() => setCategoriesOpen(false)} aria-label="Close">
              <X size={18} />
            </DrawerClose>
          </DrawerHeader>
          <CategoriesDrawerContent tags={tags} darkMode={darkMode} />
        </DrawerPaper>
      </Drawer>
    )}
    </Fragment>
  );
});

export default SearchToolbar;
