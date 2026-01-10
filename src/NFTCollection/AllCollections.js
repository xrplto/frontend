import React, { useState, useContext, useMemo, useEffect } from 'react';
import { useRouter } from 'next/router';
import styled from '@emotion/styled';
import CollectionList from './CollectionList';
import { fVolume, fIntNumber } from 'src/utils/formatters';
import { AppContext } from 'src/AppContext';
import { X, Search, Copy, Check, Code2 } from 'lucide-react';

const NFT_API_ENDPOINTS = [
  { label: 'Collections', url: 'https://api.xrpl.to/api/nft/collections', params: 'tag, start, limit, sortBy, sortType' },
  { label: 'Collection Detail', url: 'https://api.xrpl.to/api/nft/collection/{taxon}', params: 'issuer' },
  { label: 'NFT Detail', url: 'https://api.xrpl.to/api/nft/{nftokenid}' },
  { label: 'NFT Sales', url: 'https://api.xrpl.to/api/nft/sales/{nftokenid}', params: 'start, limit' },
  { label: 'Categories', url: 'https://api.xrpl.to/api/nft/tags' }
];
// Constants
const CollectionListType = {
  ALL: 'ALL',
  FEATURED: 'FEATURED',
  TRENDING: 'TRENDING'
};

// Styled Components - matching Summary.js
const Container = styled.div`
  position: relative;
  z-index: 2;
  margin-bottom: 16px;
  width: 100%;
  max-width: 100%;
  background: transparent;
  overflow: visible;

  @media (max-width: 600px) {
    margin: 4px 0;
    padding: 0 4px;
  }

  @media (max-width: 480px) {
    margin: 4px 0;
    padding: 0 4px;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
  width: 100%;

  @media (max-width: 1200px) {
    grid-template-columns: repeat(4, 1fr);
  }

  @media (max-width: 900px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 600px) {
    display: flex;
    overflow-x: auto;
    gap: 8px;
    padding-bottom: 8px;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
`;

const MetricBox = styled.div`
  padding: 14px 16px;
  height: 88px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: flex-start;
  border-radius: 12px;
  background: ${(props) => props.isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)'};
  border: 1px solid ${(props) => props.isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'};
  transition: all 0.2s ease;

  &:hover {
    border-color: ${(props) => props.isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'};
    background: ${(props) => props.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)'};
  }

  @media (max-width: 600px) {
    padding: 10px 12px;
    height: 72px;
    flex: 0 0 auto;
    min-width: 100px;
    border-radius: 12px;
  }
`;

const MetricTitle = styled.span`
  font-size: 0.65rem;
  font-weight: 500;
  color: ${(props) => props.isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(33, 43, 54, 0.55)'};
  letter-spacing: 0.04em;
  text-transform: uppercase;

  @media (max-width: 600px) {
    font-size: 0.55rem;
  }
`;

const MetricValue = styled.span`
  font-size: 1.4rem;
  font-weight: 600;
  color: ${(props) => props.isDark ? '#FFFFFF' : '#212B36'};
  line-height: 1;
  letter-spacing: -0.02em;
  white-space: nowrap;

  @media (max-width: 600px) {
    font-size: 0.95rem;
  }
`;

const PercentageChange = styled.span`
  font-size: 0.7rem;
  color: ${(props) => props.isPositive ? '#22a86b' : '#c75050'};
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-weight: 500;
  letter-spacing: -0.01em;

  @media (max-width: 600px) {
    font-size: 0.6rem;
  }
`;

const VolumePercentage = styled.span`
  font-size: 0.6rem;
  color: ${(props) => props.isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(33, 43, 54, 0.6)'};
  font-weight: 400;
  letter-spacing: 0.01em;

  @media (max-width: 600px) {
    font-size: 0.48rem;
    line-height: 1;
  }

  @media (max-width: 480px) {
    font-size: 0.48rem;
    line-height: 1;
  }
`;

// Tags Bar Components
const TagsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  border-radius: 12px;
  border: 1px solid ${(props) => (props.isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)')};
  background: ${(props) => (props.isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)')};
  padding: 8px 12px;
  position: relative;
  transition: border-color 0.2s ease, background 0.2s ease;

  @media (max-width: 600px) {
    padding: 6px 8px;
    gap: 6px;
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

const TagChip = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 10px;
  border: 1px solid ${(props) => props.selected ? (props.isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)') : (props.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)')};
  border-radius: 6px;
  background: ${(props) => props.selected ? (props.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)') : 'transparent'};
  color: ${(props) => props.selected ? (props.isDark ? '#fff' : '#000') : (props.isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)')};
  font-size: 0.68rem;
  font-weight: ${(props) => props.selected ? 500 : 400};
  cursor: pointer;
  white-space: nowrap;
  height: 24px;
  flex-shrink: 0;
  transition: border-color 0.2s ease, background 0.2s ease;

  &:hover {
    background: ${(props) => props.isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)'};
    border-color: ${(props) => props.isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
    color: ${(props) => props.isDark ? '#fff' : '#000'};
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
  border: 1px solid ${(props) => props.isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'};
  border-radius: 6px;
  background: ${(props) => props.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'};
  color: ${(props) => props.isDark ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'};
  font-size: 0.7rem;
  font-weight: 500;
  cursor: pointer;
  white-space: nowrap;
  height: 26px;
  flex-shrink: 0;
  margin-left: auto;
  transition: border-color 0.2s ease, background 0.2s ease;

  &:hover {
    background: ${(props) => props.isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'};
    border-color: ${(props) => props.isDark ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.25)'};
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
  background: ${props => props.isDark ? '#0a0a0a' : '#ffffff'};
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  border-top: 1px solid ${props => props.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
  box-shadow: 0 -8px 32px rgba(0, 0, 0, 0.2);
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
  border: 1px solid ${props => props.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${props => props.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'};
  &:hover {
    border-color: ${props => props.isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
    background: ${props => props.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'};
    color: ${props => props.isDark ? '#fff' : '#000'};
  }
`;

const SearchBox = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid ${props => props.isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'};
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
  color: ${props => props.isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'};
  pointer-events: none;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid ${props => props.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
  border-radius: 8px;
  font-size: 15px;
  outline: none;
  background: ${props => props.isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)'};
  color: ${props => props.isDark ? '#fff' : '#000'};
  font-family: inherit;
  &:focus {
    border-color: ${props => props.isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
  }
  &::placeholder {
    color: ${props => props.isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0, 0, 0, 0.35)'};
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
  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(128, 128, 128, 0.2); border-radius: 3px; }
`;

const TagButton = styled.button`
  min-width: 80px;
  max-width: 200px;
  height: 40px;
  padding: 0 14px;
  border: 1px solid ${props => props.isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
  border-radius: 8px;
  background: transparent;
  color: ${props => props.isDark ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'};
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
    border-color: ${props => props.isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)'};
    background: ${props => props.isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'};
    color: ${props => props.isDark ? '#fff' : '#000'};
  }
`;

const EmptyState = styled.div`
  width: 100%;
  text-align: center;
  padding: 32px 0;
  color: ${props => props.isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(33, 43, 54, 0.5)'};
  font-size: 14px;
`;

// API Modal Component
const NftApiModal = ({ open, onClose, isDark }) => {
  const [copiedIdx, setCopiedIdx] = useState(null);
  if (!open) return null;
  const handleCopy = (url, idx) => {
    navigator.clipboard.writeText(url);
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  };
  return (
    <Drawer open={open}>
      <DrawerBackdrop onClick={onClose} />
      <DrawerPaper isDark={isDark} style={{ maxHeight: '60vh' }}>
        <DrawerHeader>
          <div className="flex items-center gap-4 flex-1">
            <span style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', whiteSpace: 'nowrap' }}>
              NFT API Endpoints
            </span>
            <div className="flex-1 h-[14px]" style={{ backgroundImage: isDark ? 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)' : 'radial-gradient(circle, rgba(0,0,0,0.15) 1px, transparent 1px)', backgroundSize: '8px 5px' }} />
          </div>
          <DrawerClose isDark={isDark} onClick={onClose}><X size={18} /></DrawerClose>
        </DrawerHeader>
        <div style={{ padding: '0 16px 16px', overflowY: 'auto' }}>
          {NFT_API_ENDPOINTS.map((ep, idx) => (
            <div key={ep.label} style={{ marginBottom: '12px', padding: '10px 12px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)', borderRadius: '8px', border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontWeight: 500, fontSize: '13px', color: isDark ? '#fff' : '#000' }}>{ep.label}</span>
                <button onClick={() => handleCopy(ep.url, idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: copiedIdx === idx ? '#10b981' : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)') }}>
                  {copiedIdx === idx ? <Check size={14} /> : <Copy size={14} />}
                </button>
              </div>
              <code style={{ fontSize: '11px', color: isDark ? '#3f96fe' : '#0891b2', wordBreak: 'break-all' }}>{ep.url}</code>
              {ep.params && <div style={{ marginTop: '4px', fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>Params: {ep.params}</div>}
            </div>
          ))}
          <a href="https://docs.xrpl.to" target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', marginTop: '8px', fontSize: '12px', color: isDark ? '#3f96fe' : '#0891b2' }}>
            Full API Documentation →
          </a>
        </div>
      </DrawerPaper>
    </Drawer>
  );
};

const normalizeTag = (tag) => {
  if (!tag) return '';
  return tag.split(' ').join('-').replace(/&/g, 'and').toLowerCase().replace(/[^a-zA-Z0-9-]/g, '');
};

const formatNumberWithDecimals = (num) => {
  if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `${(num / 1e3).toFixed(0)}K`;
  return Math.round(num).toLocaleString();
};

function Collections({ initialCollections, initialTotal, initialGlobalMetrics, tags }) {
  const router = useRouter();
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [globalMetrics, setGlobalMetrics] = useState(initialGlobalMetrics);
  const [tagsDrawerOpen, setTagsDrawerOpen] = useState(false);
  const [tagSearch, setTagSearch] = useState('');
  const [selectedTag, setSelectedTag] = useState(router.query.tag || null);
  const [copied, setCopied] = useState(false);
  const [apiModalOpen, setApiModalOpen] = useState(false);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600;

  // Sync selectedTag with URL query
  useEffect(() => {
    const urlTag = router.query.tag || null;
    if (urlTag !== selectedTag) {
      setSelectedTag(urlTag);
    }
  }, [router.query.tag]);

  const visibleTagCount = isMobile ? 5 : 10;

  // Helper to get tag name from tag object or string
  const getTagName = (t) => (typeof t === 'object' ? t.tag : t);

  const copyTags = () => {
    if (!tags) return;
    const text = tags.map(t => `${getTagName(t)}: ${t.count || 0}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTagClick = (tag) => {
    const newTag = selectedTag === tag ? null : tag;
    setSelectedTag(newTag);
    setTagsDrawerOpen(false);
    // Update URL without full page reload
    router.push(newTag ? `/nfts?tag=${encodeURIComponent(newTag)}` : '/nfts', undefined, { shallow: true });
  };

  const filteredTags = useMemo(() => {
    if (!tags) return [];
    if (!tagSearch.trim()) return tags;
    const term = tagSearch.toLowerCase();
    return tags.filter((t) => (t.tag || t).toLowerCase().includes(term));
  }, [tags, tagSearch]);

  return (
    <div
      style={{
        flex: 1,
        paddingTop: isMobile ? '8px' : '16px',
        paddingBottom: isMobile ? '16px' : '32px',
        backgroundColor: 'transparent',
        minHeight: '100vh',
        position: 'relative'
      }}
    >
      {/* API Modal */}
      <NftApiModal open={apiModalOpen} onClose={() => setApiModalOpen(false)} isDark={isDark} />

      {/* Tags Drawer */}
      {tagsDrawerOpen && (
        <Drawer open={tagsDrawerOpen}>
          <DrawerBackdrop onClick={() => setTagsDrawerOpen(false)} />
          <DrawerPaper isDark={isDark}>
            <DrawerHeader>
              <div className="flex items-center gap-4 flex-1">
                <span style={{ fontSize: '11px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)', whiteSpace: 'nowrap' }}>
                  Categories {tags?.length ? `(${tags.length})` : ''}
                </span>
                <div
                  className="flex-1 h-[14px]"
                  style={{
                    backgroundImage: isDark ? 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)' : 'radial-gradient(circle, rgba(0,0,0,0.15) 1px, transparent 1px)',
                    backgroundSize: '8px 5px'
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <DrawerClose isDark={isDark} onClick={copyTags} title="Copy all tags">
                  {copied ? <Check size={18} color="#10b981" /> : <Copy size={18} />}
                </DrawerClose>
                <DrawerClose isDark={isDark} onClick={() => setTagsDrawerOpen(false)}>
                  <X size={18} />
                </DrawerClose>
              </div>
            </DrawerHeader>
            <SearchBox isDark={isDark}>
              <SearchInputWrapper>
                <SearchIconWrapper isDark={isDark}><Search size={18} /></SearchIconWrapper>
                <SearchInput
                  type="search"
                  placeholder="Search categories..."
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                  isDark={isDark}
                />
              </SearchInputWrapper>
            </SearchBox>
            <TagsGrid>
              {filteredTags.length > 0 ? (
                filteredTags.map((t) => {
                  const tagName = getTagName(t);
                  const count = typeof t === 'object' ? t.count : null;
                  return (
                    <TagButton
                      key={tagName}
                      isDark={isDark}
                      onClick={() => handleTagClick(tagName)}
                      style={selectedTag === tagName ? { borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)', color: isDark ? '#fff' : '#000', background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)' } : {}}
                    >
                      {tagName}{count ? ` (${count})` : ''}
                    </TagButton>
                  );
                })
              ) : (
                <EmptyState isDark={isDark}>
                  {tagSearch ? 'No matching categories' : 'No categories available'}
                </EmptyState>
              )}
            </TagsGrid>
          </DrawerPaper>
        </Drawer>
      )}

      {/* Global Metrics Section */}
      <Container>
        {globalMetrics && (
          <div style={{ width: '100%' }}>
            <Grid>
              <MetricBox isDark={isDark}>
                <MetricTitle isDark={isDark}>24h Volume</MetricTitle>
                <MetricValue isDark={isDark}>
                  ✕{fVolume(globalMetrics.total24hVolume || 0)}
                </MetricValue>
                <PercentageChange isPositive={(globalMetrics.volumePct || 0) >= 0}>
                  {(globalMetrics.volumePct || 0) >= 0 ? '↑' : '↓'}
                  {Math.abs(globalMetrics.volumePct || 0).toFixed(1)}%
                </PercentageChange>
              </MetricBox>

              <MetricBox isDark={isDark}>
                <MetricTitle isDark={isDark}>24h Sales</MetricTitle>
                <MetricValue isDark={isDark}>
                  {formatNumberWithDecimals(globalMetrics.total24hSales || 0)}
                </MetricValue>
                <PercentageChange isPositive={(globalMetrics.salesPct || 0) >= 0}>
                  {(globalMetrics.salesPct || 0) >= 0 ? '↑' : '↓'}
                  {Math.abs(globalMetrics.salesPct || 0).toFixed(1)}%
                </PercentageChange>
              </MetricBox>

              <MetricBox isDark={isDark}>
                <MetricTitle isDark={isDark}>24h Traders</MetricTitle>
                <MetricValue isDark={isDark}>
                  {formatNumberWithDecimals(globalMetrics.activeTraders24h || 0)}
                </MetricValue>
                <PercentageChange isPositive={(globalMetrics.activeTradersPct || 0) >= 0}>
                  {(globalMetrics.activeTradersPct || 0) >= 0 ? '↑' : '↓'}
                  {Math.abs(globalMetrics.activeTradersPct || 0).toFixed(1)}%
                </PercentageChange>
              </MetricBox>

              <MetricBox isDark={isDark}>
                <MetricTitle isDark={isDark}>Collections</MetricTitle>
                <MetricValue isDark={isDark}>
                  {formatNumberWithDecimals(globalMetrics.totalCollections || 0)}
                </MetricValue>
                <VolumePercentage isDark={isDark}>
                  {formatNumberWithDecimals(globalMetrics.activeCollections24h || 0)} active
                </VolumePercentage>
              </MetricBox>

              <MetricBox isDark={isDark}>
                <MetricTitle isDark={isDark}>24h Mints</MetricTitle>
                <MetricValue isDark={isDark}>
                  {formatNumberWithDecimals(globalMetrics.total24hMints || 0)}
                </MetricValue>
                <VolumePercentage isDark={isDark}>
                  {formatNumberWithDecimals(globalMetrics.total24hBurns || 0)} burned
                </VolumePercentage>
              </MetricBox>

              <MetricBox isDark={isDark}>
                <MetricTitle isDark={isDark}>24h Fees</MetricTitle>
                <MetricValue isDark={isDark}>
                  ✕{formatNumberWithDecimals((globalMetrics.total24hBrokerFees || 0) + (globalMetrics.total24hRoyalties || 0))}
                </MetricValue>
                <VolumePercentage isDark={isDark}>
                  ✕{formatNumberWithDecimals(globalMetrics.total24hBrokerFees || 0)} broker | ✕{formatNumberWithDecimals(globalMetrics.total24hRoyalties || 0)} creator
                </VolumePercentage>
              </MetricBox>
            </Grid>
          </div>
        )}
      </Container>

      {/* Tags Bar */}
      {tags && tags.length > 0 && (
        <Container>
          <TagsContainer isDark={isDark}>
            <TagsRow>
              <TagsScrollArea>
                {/* All NFTs button - always visible */}
                <TagChip
                  isDark={isDark}
                  selected={!selectedTag}
                  onClick={() => setSelectedTag(null)}
                >
                  All NFTs
                </TagChip>
                {selectedTag && (
                  <TagChip
                    isDark={isDark}
                    selected
                    onClick={() => setSelectedTag(null)}
                  >
                    <span>{selectedTag}</span> <X size={12} />
                  </TagChip>
                )}
                {tags.slice(0, selectedTag ? visibleTagCount - 2 : visibleTagCount - 1).filter(t => getTagName(t) !== selectedTag).map((t) => {
                  const tagName = getTagName(t);
                  return (
                    <TagChip
                      key={tagName}
                      isDark={isDark}
                      onClick={() => handleTagClick(tagName)}
                    >
                      <span>{tagName}</span>
                    </TagChip>
                  );
                })}
              </TagsScrollArea>
              <AllButtonWrapper>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => setApiModalOpen(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      border: `1px solid ${isDark ? 'rgba(63, 150, 254, 0.2)' : 'rgba(8, 145, 178, 0.2)'}`,
                      borderRadius: '6px',
                      background: 'transparent',
                      color: isDark ? '#3f96fe' : '#0891b2',
                      fontSize: '0.7rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      height: '26px'
                    }}
                  >
                    <Code2 size={13} />
                    API
                  </button>
                  <AllTagsButton isDark={isDark} onClick={() => setTagsDrawerOpen(true)}>
                    <span>All {tags.length > visibleTagCount ? `(${tags.length})` : ''}</span>
                  </AllTagsButton>
                </div>
              </AllButtonWrapper>
            </TagsRow>
          </TagsContainer>
        </Container>
      )}

      {/* Table Section - aligned with metric boxes */}
      <Container>
        <div
          style={{
            minHeight: '50vh',
            position: 'relative',
            zIndex: 1,
            background: isDark ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
            border: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
            borderRadius: '12px',
            overflow: 'hidden'
          }}
        >
          <CollectionList
            type={CollectionListType.ALL}
            tag={selectedTag}
            onGlobalMetrics={setGlobalMetrics}
            initialCollections={initialCollections}
            initialTotal={initialTotal}
          />
        </div>
      </Container>
    </div>
  );
}

export default React.memo(Collections);
