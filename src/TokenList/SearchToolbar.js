import React, { useState, useCallback, useMemo, memo, useRef, useEffect, Fragment } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import { useContext } from 'react';
import { AppContext } from 'src/AppContext';
import Link from 'next/link';
import { Flame, Gem, TrendingUp, Sparkles, Eye, Search, X } from 'lucide-react';

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
  gap: 6px;
  border-radius: 0;
  border: 1px solid ${(props) => (props.darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.15)')};
  background: ${(props) => (props.darkMode ? 'rgba(59, 130, 246, 0.02)' : 'rgba(59, 130, 246, 0.02)')};
  padding: 8px 12px;
  position: relative;
  transition: border-color 0.2s ease, background 0.2s ease;

  @media (max-width: 600px) {
    padding: 6px 8px;
    gap: 6px;
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
  flex: 1;
  min-width: 0;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding-right: 4px;

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
  gap: 6px;
  flex-wrap: wrap;

  @media (max-width: 600px) {
    gap: 6px;
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
  padding: 3px 6px;
  border: 1px solid ${(props) => props.darkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.2)'};
  border-radius: 6px;
  background: ${(props) =>
    props.darkMode ? 'rgba(59, 130, 246, 0.04)' : 'rgba(59, 130, 246, 0.03)'};
  color: ${(props) => (props.darkMode ? '#fff' : '#1a1a1a')};
  font-size: 0.68rem;
  font-weight: 400;
  cursor: pointer;
  height: 26px;
  min-width: 70px;
  margin-left: ${(props) => (props.noMargin ? '0' : 'auto')};
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  background-image: ${(props) =>
    `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%233b82f6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`};
  background-repeat: no-repeat;
  background-position: right 6px center;
  background-size: 12px;
  padding-right: 24px;
  transition: border-color 0.2s ease, background 0.2s ease;

  &:hover {
    border-color: ${(props) => props.darkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.35)'};
    background: ${(props) => props.darkMode ? 'rgba(59, 130, 246, 0.06)' : 'rgba(59, 130, 246, 0.05)'};
  }

  &:focus {
    outline: none;
    border-color: #3b82f6;
  }

  option {
    background: ${(props) => (props.darkMode ? '#111827' : '#ffffff')};
    color: ${(props) => (props.darkMode ? '#fff' : '#333')};
    padding: 6px;
  }

  @media (max-width: 600px) {
    font-size: 0.7rem;
    height: 28px;
    min-width: 55px;
    padding-right: 20px;
    background-size: 10px;
    background-position: right 4px center;
  }
`;

const Stack = styled.div`
  display: flex;
  flex-direction: row;
  gap: 4px;
  align-items: center;
  flex-shrink: 0;
  position: relative;
  z-index: 1;

  @media (max-width: 600px) {
    gap: 4px;
    touch-action: manipulation;
  }
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 12px;
  border: ${(props) =>
    props.variant === 'outlined' ? '1px solid rgba(59, 130, 246, 0.15)' : 'none'};
  border-radius: 6px;
  background: ${(props) => {
    if (props.variant === 'contained') {
      return props.isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.06)';
    }
    if (props.selected) return 'rgba(59, 130, 246, 0.08)';
    return 'transparent';
  }};
  color: ${(props) => {
    if (props.variant === 'contained') return props.isDark ? '#fff' : '#333';
    if (props.selected) return '#3b82f6';
    return 'inherit';
  }};
  cursor: pointer;
  font-size: 0.85rem;
  font-weight: ${(props) => (props.variant === 'contained' ? 500 : 400)};
  text-transform: none;
  font-family: inherit;
  height: 36px;
  min-width: ${(props) => props.minWidth || 'auto'};
  transition: border-color 0.2s ease, background 0.2s ease;
  white-space: nowrap;
  flex-shrink: 0;

  &:hover {
    background: ${(props) => props.isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)'};
    border-color: ${(props) => props.isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.35)'};
    color: #3b82f6;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 600px) {
    padding: 4px 8px;
    font-size: 0.75rem;
    height: 30px;
    gap: 3px;
  }
`;

const StyledIconButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid ${(props) =>
    props.selected ? 'rgba(59, 130, 246, 0.3)' : (props.darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.15)')};
  border-radius: 6px;
  background: ${(props) => (props.selected ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.02)')};
  color: ${(props) => (props.selected ? '#3b82f6' : 'inherit')};
  cursor: pointer;
  transition: border-color 0.2s ease, background 0.2s ease;
  flex-shrink: 0;

  &:hover {
    background: ${(props) => props.darkMode ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.06)'};
    border-color: ${(props) => props.darkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.35)'};
    color: #3b82f6;
  }

  @media (max-width: 600px) {
    width: 32px;
    height: 32px;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1px;
  flex-shrink: 0;
  background: ${(props) => props.darkMode ? 'rgba(59, 130, 246, 0.04)' : 'rgba(59, 130, 246, 0.03)'};
  padding: 2px;
  border-radius: 6px;
  border: 1px solid ${(props) => props.darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.12)'};

  & > button {
    border-radius: 5px;
    border: none;
    min-width: 32px;
    height: 26px;
    padding: 0 8px;
    font-size: 0.7rem;
    font-weight: 400;
    background: transparent;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 3px;
    color: inherit;
    touch-action: manipulation;
    -webkit-tap-highlight-color: transparent;
    transition: background 0.2s ease;

    &:hover {
      background: ${(props) => props.darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)'};
      color: #3b82f6;
    }
  }

  & > button.selected {
    background: ${(props) => props.darkMode ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.1)'};
    color: #3b82f6;
    font-weight: 500;

    &:hover {
      background: ${(props) => props.darkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.12)'};
    }
  }

  @media (max-width: 600px) {
    display: ${(props) => (props.hideOnMobile ? 'none' : 'flex')};
    padding: 2px;

    & > button {
      min-width: 32px;
      height: 26px;
      padding: 0 6px;
      font-size: 0.7rem;
      gap: 2px;
    }
  }
`;

const Divider = styled.div`
  width: 1px;
  height: 18px;
  background: ${(props) => props.darkMode ? 'rgba(59, 130, 246, 0.12)' : 'rgba(59, 130, 246, 0.15)'};
  margin: 0 6px;
  flex-shrink: 0;

  @media (max-width: 600px) {
    display: ${(props) => (props.hideOnMobile ? 'none' : 'block')};
    margin: 0 4px;
    height: 16px;
  }
`;

const Chip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 10px;
  border: 1px solid;
  border-color: ${(props) => props.selected ? 'rgba(59, 130, 246, 0.3)' : (props.darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.15)')};
  border-radius: 6px;
  background: ${(props) => props.selected ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.02)'};
  color: ${(props) => props.selected ? '#3b82f6' : (props.darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(33, 43, 54, 0.7)')};
  font-size: 0.7rem;
  font-weight: ${(props) => props.selected ? 500 : 400};
  cursor: pointer;
  white-space: nowrap;
  height: 26px;
  flex-shrink: 0;
  transition: border-color 0.2s ease, background 0.2s ease;

  &:hover {
    background: ${(props) => props.darkMode ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.06)'};
    border-color: ${(props) => props.darkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.35)'};
    color: #3b82f6;
  }

  @media (max-width: 600px) {
    padding: 4px 8px;
    font-size: 0.7rem;
    height: 28px;
    gap: 3px;
    display: ${(props) => (props.hideOnMobile ? 'none' : 'inline-flex')};
  }
`;

const TagChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 10px;
  border: 1px solid ${(props) => props.selected ? 'rgba(59, 130, 246, 0.3)' : (props.darkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.15)')};
  border-radius: 6px;
  background: ${(props) => props.selected ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.02)'};
  color: ${(props) => props.selected ? '#3b82f6' : (props.darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(33, 43, 54, 0.7)')};
  font-size: 0.68rem;
  font-weight: ${(props) => props.selected ? 500 : 400};
  cursor: pointer;
  white-space: nowrap;
  height: 24px;
  flex-shrink: 0;
  transition: border-color 0.2s ease, background 0.2s ease;

  &:hover {
    background: ${(props) => props.darkMode ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.06)'};
    border-color: ${(props) => props.darkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.35)'};
    color: #3b82f6;
  }

  @media (max-width: 600px) {
    font-size: 0.7rem;
    height: 28px;
    padding: 4px 10px;
    gap: 4px;
    min-width: fit-content;
  }
`;

const AllTagsButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border: 1px solid rgba(59, 130, 246, 0.3);
  border-radius: 6px;
  background: rgba(59, 130, 246, 0.08);
  color: #3b82f6;
  font-size: 0.7rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  height: 26px;
  flex-shrink: 0;
  margin-left: auto;
  transition: border-color 0.2s ease, background 0.2s ease;

  &:hover {
    background: rgba(59, 130, 246, 0.12);
    border-color: rgba(59, 130, 246, 0.4);
  }

  @media (max-width: 600px) {
    font-size: 0.72rem;
    height: 28px;
    padding: 4px 12px;
    gap: 4px;
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
  background: ${props => props.isDark ? 'rgba(10,15,26,0.95)' : '#fff'};
  backdrop-filter: ${props => props.isDark ? 'blur(20px)' : 'none'};
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  border-top: 1.5px solid ${props => props.isDark ? 'rgba(66,133,244,0.2)' : 'rgba(0,0,0,0.1)'};
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

const Menu = styled.div`
  position: fixed;
  z-index: 1300;
  display: ${props => props.open ? 'block' : 'none'};
  top: ${props => props.top}px;
  left: ${props => props.left}px;
`;

const MenuPaper = styled.div`
  min-width: 130px;
  border-radius: 12px;
  border: 1.5px solid ${props => props.isDark ? 'rgba(66,133,244,0.2)' : 'rgba(0,0,0,0.1)'};
  background: ${props => props.isDark ? 'rgba(10,15,26,0.95)' : '#ffffff'};
  overflow: hidden;
  backdrop-filter: ${props => props.isDark ? 'blur(20px)' : 'none'};
  padding: 4px;
`;

const MenuItem = styled.button`
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  color: ${props => props.isDark ? 'rgba(255, 255, 255, 0.85)' : '#333'};
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.2s ease;

  &:hover {
    background: ${props => props.isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)'};
    color: #3b82f6;
  }
`;

const SearchBox = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid ${props => props.isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.12)'};
`;

const SearchInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

const SearchIconWrapper = styled.div`
  position: absolute;
  left: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #3b82f6;
  pointer-events: none;
  opacity: 0.5;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid ${props => props.isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.2)'};
  border-radius: 8px;
  font-size: 15px;
  outline: none;
  background: ${props => props.isDark ? 'rgba(59, 130, 246, 0.04)' : 'rgba(59, 130, 246, 0.03)'};
  color: ${props => props.isDark ? '#fff' : '#212B36'};
  font-family: inherit;
  transition: border-color 0.2s ease, background 0.2s ease;

  &:focus {
    border-color: ${props => props.isDark ? 'rgba(59, 130, 246, 0.4)' : 'rgba(59, 130, 246, 0.5)'};
    background: ${props => props.isDark ? 'rgba(59, 130, 246, 0.06)' : 'rgba(59, 130, 246, 0.05)'};
  }

  &::placeholder {
    color: ${props => props.isDark ? 'rgba(255,255,255,0.35)' : 'rgba(33, 43, 54, 0.35)'};
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
    border-radius: 3px;
  }

  @media (max-width: 600px) {
    padding: 12px;
    gap: 8px;
  }
`;

const TagButton = styled.button`
  min-width: 80px;
  max-width: 200px;
  height: 40px;
  padding: 0 14px;
  border: 1px solid ${props => props.isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.15)'};
  border-radius: 8px;
  background: ${props => props.isDark ? 'rgba(59, 130, 246, 0.02)' : 'rgba(59, 130, 246, 0.02)'};
  color: ${props => props.isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(33, 43, 54, 0.7)'};
  font-size: 13px;
  font-weight: 400;
  cursor: pointer;
  font-family: inherit;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: border-color 0.2s ease, background 0.2s ease;

  &:hover {
    border-color: ${props => props.isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.35)'};
    background: ${props => props.isDark ? 'rgba(59, 130, 246, 0.08)' : 'rgba(59, 130, 246, 0.06)'};
    color: #3b82f6;
  }

  &:active {
    transform: scale(0.98);
  }

  @media (max-width: 600px) {
    height: 42px;
    padding: 0 16px;
    font-size: 14px;
    min-width: 90px;
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
          <SearchInputWrapper>
            <SearchIconWrapper isDark={darkMode}>
              <Search size={18} />
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

          <Divider darkMode={darkMode} />

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
              <Divider darkMode={darkMode} />
            </>
          )}

          <Chip
            onClick={() => (window.location.href = '/trending')}
            selected={currentView === 'trending'}
            darkMode={darkMode}
          >
            <Flame size={12} /> Hot
          </Chip>

          <Chip
            onClick={() => (window.location.href = '/spotlight')}
            selected={currentView === 'spotlight'}
            darkMode={darkMode}
          >
            <Gem size={12} /> Gems
          </Chip>

          <Chip
            onClick={(e) => setGainersMenuAnchor(e.currentTarget)}
            selected={currentView === 'gainers'}
            darkMode={darkMode}
          >
            <TrendingUp size={12} /> Gainers
          </Chip>

          <Chip
            onClick={() => (window.location.href = '/new')}
            selected={currentView === 'new'}
            darkMode={darkMode}
          >
            <Sparkles size={12} /> New
          </Chip>

          <Chip
            onClick={() => (window.location.href = '/most-viewed')}
            selected={currentView === 'most-viewed'}
            darkMode={darkMode}
          >
            <Eye size={12} /> Popular
          </Chip>
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
              zIndex: 1299,
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(4px)'
            }}
            onClick={() => setGainersMenuAnchor(null)}
          />
          <Menu
            open={Boolean(gainersMenuAnchor)}
            top={gainersMenuAnchor?.getBoundingClientRect().bottom + 4}
            left={gainersMenuAnchor?.getBoundingClientRect().left}
          >
            <MenuPaper isDark={darkMode}>
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
                  backgroundImage: 'radial-gradient(circle, rgba(66,133,244,0.5) 1px, transparent 1px)',
                  backgroundSize: '8px 5px'
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
