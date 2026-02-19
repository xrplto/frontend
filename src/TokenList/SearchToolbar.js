import React, { useState, useMemo, memo, useRef, useEffect, Fragment } from 'react';
import { useRouter } from 'next/router';
import { useContext } from 'react';
import { ThemeContext } from 'src/context/AppContext';
import Link from 'next/link';
import { Search, X, Newspaper, Flame, TrendingUp, Sparkles } from 'lucide-react';
import { ApiButton } from 'src/components/ApiEndpointsModal';
import { normalizeTag } from 'src/utils/formatters';
import { cn } from 'src/utils/cn';

// Styled Components
const Container = ({ darkMode, className, children, ...p }) => (
  <div
    className={cn(
      'st-container flex flex-col gap-2 rounded-xl border-[1.5px] backdrop-blur-[12px] py-[10px] px-[14px] relative box-border overflow-hidden',
      '[&>*]:relative [&>*]:z-[1]',
      'max-sm:py-[6px] max-sm:px-2 max-sm:gap-[6px]',
      darkMode ? 'border-white/[0.08] bg-[rgba(10,10,10,0.5)]' : 'border-black/[0.06] bg-white/50',
      className
    )}
    {...p}
  >
    <style>{`
      @media (max-width: 1024px) {
        .st-container { padding: 7px 10px; gap: 5px; }
        .st-tags-row { gap: 4px; }
        .st-tags-scroll { gap: 4px; }
        .st-tag { font-size: 0.62rem; height: 22px; padding: 0 6px; gap: 2px; }
        .st-tag svg { width: 11px; height: 11px; }
        .st-row { gap: 4px; }
        .st-row-content { gap: 3px; flex-wrap: nowrap; overflow-x: auto; scrollbar-width: none; }
        .st-row-content::-webkit-scrollbar { display: none; }
        .st-lp-group { padding: 2px 4px 2px 6px; gap: 1px; margin-left: 4px; }
        .st-lp-label { font-size: 0.52rem; margin-right: 2px; }
        .st-lp-chip { font-size: 0.58rem; height: 18px; padding: 0 4px; }
        .st-select { height: 26px; font-size: 0.65rem; min-width: 58px; padding: 0 22px 0 8px !important; background-position: right 6px center !important; background-size: 10px !important; }
        .st-stack { gap: 4px; }
        .st-all-btn { font-size: 0.62rem; height: 22px; padding: 0 8px; }
      }
    `}</style>
    {children}
  </div>
);

const Row = ({ spaceBetween, noWrap, className, children, ...p }) => (
  <div
    className={cn(
      'st-row flex items-center gap-[6px] flex-row w-full relative overflow-y-visible',
      spaceBetween ? 'justify-between' : 'justify-start',
      noWrap ? 'flex-nowrap overflow-x-auto' : 'flex-wrap overflow-x-hidden',
      'max-sm:gap-[5px] max-sm:overflow-x-auto max-sm:flex-nowrap max-sm:pb-[2px] max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden',
      className
    )}
    {...p}
  >{children}</div>
);

const TagsRow = ({ className, children, ...p }) => (
  <div className={cn('st-tags-row flex items-center gap-[6px] w-full', className)} {...p}>{children}</div>
);

const TagsScrollArea = ({ className, children, ...p }) => (
  <div
    className={cn('st-tags-scroll flex items-center gap-[6px] overflow-x-auto flex-auto min-w-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', className)}
    style={{ WebkitOverflowScrolling: 'touch' }}
    {...p}
  >{children}</div>
);

const AllButtonWrapper = ({ className, children, ...p }) => (
  <div className={cn('shrink-0 ml-1', className)} {...p}>{children}</div>
);

const RowContent = ({ className, children, ...p }) => (
  <div
    className={cn(
      'st-row-content flex items-center gap-1 flex-wrap flex-auto',
      'max-sm:gap-1 max-sm:flex-nowrap max-sm:overflow-x-auto max-sm:mr-2 max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden',
      className
    )}
    style={{ WebkitOverflowScrolling: 'touch' }}
    {...p}
  >{children}</div>
);

const RowsSelector = ({ darkMode, noMargin, className, children, ...p }) => {
  const bgImage = darkMode
    ? `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.6)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`
    : `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(0,0,0,0.5)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`;
  return (
    <select
      className={cn(
        'st-select rounded-lg border-[1.5px] text-xs font-medium cursor-pointer h-8 min-w-[70px] appearance-none transition-[background-color,border-color,opacity] duration-150',
        'hover:border-blue-500/50 focus:outline-none focus:border-blue-500',
        'max-sm:text-[0.62rem] max-sm:h-[26px] max-sm:min-w-[48px] max-sm:pl-[6px] max-sm:pr-5',
        darkMode ? 'border-white/10 bg-black/40 text-white/85 [&_option]:bg-[#0a0a0a] [&_option]:text-[#e5e5e5]' : 'border-black/[0.08] bg-white/90 text-black/70 [&_option]:bg-white [&_option]:text-[#1a1a1a]',
        darkMode ? 'hover:bg-blue-500/10' : 'hover:bg-blue-500/[0.05]',
        noMargin ? 'ml-0' : 'ml-auto',
        className
      )}
      style={{
        padding: '0 28px 0 12px',
        backgroundImage: bgImage,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 10px center',
        backgroundSize: '12px'
      }}
      {...p}
    >{children}</select>
  );
};

const Stack = ({ className, children, ...p }) => (
  <div className={cn('st-stack flex flex-row gap-[6px] items-center shrink-0 relative z-[1] max-sm:gap-[3px] max-sm:touch-manipulation', className)} {...p}>{children}</div>
);

const StyledIconButton = ({ darkMode, className, children, ...p }) => (
  <button
    className={cn(
      'inline-flex items-center justify-center w-[30px] h-[30px] p-0 border-none rounded-lg bg-transparent cursor-pointer transition-[background-color,border-color,opacity] duration-150 shrink-0',
      'hover:bg-blue-500/10 hover:text-blue-500',
      'max-sm:w-[26px] max-sm:h-[26px]',
      darkMode ? 'text-white/50' : 'text-black/40',
      className
    )}
    {...p}
  >{children}</button>
);

const ButtonGroup = ({ darkMode, hideOnMobile, className, children, ...p }) => (
  <div
    className={cn(
      'flex gap-[2px] shrink-0 p-[3px] rounded-lg border-none',
      darkMode ? 'bg-white/[0.04]' : 'bg-black/[0.03]',
      '[&>button]:rounded-[6px] [&>button]:border-none [&>button]:min-w-[36px] [&>button]:h-6 [&>button]:px-[10px] [&>button]:text-[0.72rem] [&>button]:font-normal [&>button]:bg-transparent [&>button]:cursor-pointer [&>button]:inline-flex [&>button]:items-center [&>button]:justify-center [&>button]:gap-1 [&>button]:touch-manipulation [&>button]:transition-[background-color,border-color,opacity] [&>button]:duration-150',
      darkMode ? '[&>button]:text-white/60 [&>button:hover]:text-white/90 [&>button:hover]:bg-white/[0.06]' : '[&>button]:text-black/50 [&>button:hover]:text-black/80 [&>button:hover]:bg-black/[0.04]',
      darkMode ? '[&>button.selected]:bg-white/95 [&>button.selected]:text-[#111] [&>button.selected]:font-medium [&>button.selected]:shadow-[0_1px_2px_rgba(0,0,0,0.08)] [&>button.selected:hover]:bg-white' : '[&>button.selected]:bg-white [&>button.selected]:text-[#333] [&>button.selected]:font-medium [&>button.selected]:shadow-[0_1px_2px_rgba(0,0,0,0.08)] [&>button.selected:hover]:bg-white',
      hideOnMobile && 'max-sm:hidden',
      !hideOnMobile && 'max-sm:p-[2px] max-sm:[&>button]:min-w-[28px] max-sm:[&>button]:h-[22px] max-sm:[&>button]:px-[7px] max-sm:[&>button]:text-[0.65rem] max-sm:[&>button]:gap-[2px]',
      className
    )}
    {...p}
  >{children}</div>
);

const LaunchpadGroup = ({ darkMode, className, children, ...p }) => (
  <div
    className={cn('st-lp-group inline-flex items-center gap-[2px] py-[3px] pl-2 pr-[6px] rounded-[6px] border ml-2', darkMode ? 'bg-white/[0.06] border-white/[0.12]' : 'bg-black/[0.04] border-black/[0.1]', className)}
    {...p}
  >{children}</div>
);

const LaunchpadLabel = ({ darkMode, className, children, ...p }) => (
  <span
    className={cn('st-lp-label text-[0.6rem] font-semibold uppercase tracking-[0.05em] mr-1', darkMode ? 'text-white/60' : 'text-black/60', className)}
    {...p}
  >{children}</span>
);

const LaunchpadChip = ({ selected, darkMode, className, children, ...p }) => (
  <button
    className={cn(
      'st-lp-chip inline-flex items-center px-[6px] border-none rounded text-[0.65rem] cursor-pointer whitespace-nowrap h-5 shrink-0 transition-[background-color,border-color,opacity] duration-150',
      'hover:bg-blue-500/10 hover:text-blue-500',
      selected ? 'bg-blue-500/[0.15] text-blue-500 font-medium' : cn('bg-transparent', darkMode ? 'text-white/60 font-normal' : 'text-[#212B36]/60 font-normal'),
      className
    )}
    {...p}
  >{children}</button>
);

const TagChip = ({ selected, darkMode, className, children, ...p }) => (
  <button
    className={cn(
      'st-tag inline-flex items-center gap-[3px] px-2 rounded-[6px] border text-[0.68rem] cursor-pointer whitespace-nowrap h-6 shrink-0 transition-[background-color,border-color,opacity] duration-150',
      selected
        ? 'border-blue-500/30 bg-blue-500/10 text-blue-500 font-medium hover:bg-blue-500/[0.15]'
        : cn(
            darkMode ? 'border-white/[0.08] bg-white/[0.04] text-white/70 font-normal hover:bg-white/[0.08] hover:text-white/90' : 'border-black/[0.08] bg-black/[0.02] text-[#212B36]/70 font-normal hover:bg-black/[0.05] hover:text-[#212B36]/90'
          ),
      className
    )}
    {...p}
  >{children}</button>
);

const AllTagsButton = ({ darkMode, className, children, ...p }) => (
  <button
    className={cn(
      'st-all-btn inline-flex items-center gap-1 px-3 border-none rounded-2xl text-blue-500 text-[0.7rem] font-medium cursor-pointer whitespace-nowrap h-[26px] shrink-0 ml-auto transition-[background-color,border-color,opacity] duration-150 hover:bg-blue-500/20',
      'max-sm:text-[0.68rem] max-sm:h-6 max-sm:px-2 max-sm:gap-[3px]',
      darkMode ? 'bg-blue-500/[0.15]' : 'bg-blue-500/10',
      className
    )}
    {...p}
  >{children}</button>
);

const Drawer = ({ open, className, children, ...p }) => (
  <div className={cn('fixed inset-0 z-[1300]', open ? 'block' : 'hidden', className)} {...p}>{children}</div>
);

const DrawerBackdrop = ({ className, children, ...p }) => (
  <div className={cn('fixed inset-0 bg-black/60 backdrop-blur-[4px]', className)} {...p}>{children}</div>
);

const DrawerPaper = ({ isDark, className, children, ...p }) => (
  <div
    className={cn(
      'fixed bottom-0 left-0 right-0 max-h-[70dvh] pb-[env(safe-area-inset-bottom)] backdrop-blur-[24px] rounded-t-xl border-t overflow-hidden flex flex-col z-[1301]',
      isDark ? 'bg-black/85 border-blue-500/20 shadow-[0_-25px_50px_-12px_rgba(59,130,246,0.1)]' : 'bg-white/[0.98] border-blue-200 shadow-[0_-25px_50px_-12px_rgba(191,219,254,0.5)]',
      className
    )}
    {...p}
  >{children}</div>
);

const DrawerHeader = ({ className, children, ...p }) => (
  <div className={cn('flex items-center justify-between p-4', className)} {...p}>{children}</div>
);

const DrawerTitle = ({ isDark, className, children, ...p }) => (
  <h2 className={cn('font-medium text-[15px] m-0', isDark ? 'text-white' : 'text-[#212B36]', className)} {...p}>{children}</h2>
);

const DrawerClose = ({ isDark, className, children, ...p }) => (
  <button
    className={cn(
      'w-8 h-8 border-[1.5px] rounded-lg bg-transparent cursor-pointer flex items-center justify-center transition-[background-color,border-color,opacity] duration-150',
      'hover:border-blue-400/50 hover:text-[#4285f4]',
      isDark ? 'border-white/10 text-white/40' : 'border-black/10 text-black/40',
      className
    )}
    {...p}
  >{children}</button>
);

const SearchBox = ({ className, children, ...p }) => (
  <div className={cn('py-3 px-4', className)} {...p}>{children}</div>
);

const SearchInputWrapper = ({ isDark, className, children, ...p }) => (
  <div
    className={cn(
      'flex items-center gap-3 h-10 px-4 rounded-xl border-[1.5px] transition-[border-color] duration-200',
      isDark
        ? 'border-blue-500/[0.08] bg-white/[0.02] hover:border-blue-500/20 focus-within:border-blue-500/40'
        : 'border-black/[0.08] bg-white hover:border-blue-500/30 focus-within:border-blue-500/50',
      className
    )}
    {...p}
  >{children}</div>
);

const SearchIconWrapper = ({ isDark, className, children, ...p }) => (
  <div className={cn('flex items-center justify-center shrink-0', isDark ? 'text-white/40' : 'text-black/40', className)} {...p}>{children}</div>
);

const SearchInput = ({ isDark, className, ...p }) => (
  <input
    className={cn(
      'flex-1 bg-transparent border-none outline-none text-sm font-[inherit] focus:outline-none',
      isDark ? 'text-white placeholder:text-white/50' : 'text-[#212B36] placeholder:text-[#212B36]/40',
      className
    )}
    {...p}
  />
);

const TagsGrid = ({ className, children, ...p }) => (
  <div
    className={cn(
      'p-4 flex flex-wrap gap-[10px] flex-1 overflow-y-auto content-start',
      'max-sm:p-3 max-sm:gap-2',
      className
    )}
    style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(59,130,246,0.15) transparent' }}
    {...p}
  >{children}</div>
);

const TagButton = ({ isDark, className, children, ...p }) => (
  <button
    className={cn(
      'inline-flex items-center justify-center py-1 px-3 border rounded-lg bg-transparent text-xs font-normal cursor-pointer font-[inherit] whitespace-nowrap h-7 shrink-0 transition-[background-color,border-color,opacity] duration-200',
      'hover:bg-blue-500/[0.08] hover:border-blue-500/30 hover:text-blue-500',
      'max-sm:h-8 max-sm:py-1 max-sm:px-[14px] max-sm:text-[0.8rem]',
      isDark ? 'border-white/[0.08] text-white/70' : 'border-black/[0.08] text-[#212B36]/70',
      className
    )}
    {...p}
  >{children}</button>
);

const EmptyState = ({ isDark, className, children, ...p }) => (
  <div
    className={cn('w-full text-center py-8 text-sm', isDark ? 'text-white/50' : 'text-[#212B36]/50', className)}
    {...p}
  >{children}</div>
);

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
            <Link key={tag} href={`/view/${normalizeTag(tag)}`} className="no-underline">
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
  const { darkMode } = useContext(ThemeContext);

  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const containerRef = useRef(null);
  const [visibleTagCount, setVisibleTagCount] = useState(0);
  const [measuredTags, setMeasuredTags] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile for abbreviated labels
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 600);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Calculate how many tags can fit using a width heuristic (no DOM measurement)
  useEffect(() => {
    if (!tags || tags.length === 0) return;

    const calculateVisibleTags = () => {
      const containerWidth = containerRef.current?.offsetWidth || window.innerWidth;
      const isMobile = window.innerWidth <= 600;

      // Reserve space for "All Tags" button + padding
      const allTagsWidth = isMobile ? 60 : 100;
      const availableWidth = containerWidth - allTagsWidth - 20;

      // Average tag width heuristic: ~90px desktop, ~60px mobile (includes gap)
      const avgTagWidth = isMobile ? 60 : 90;
      const count = Math.floor(Math.max(availableWidth, 0) / avgTagWidth);

      setVisibleTagCount(Math.max(isMobile ? 5 : 8, Math.min(count, tags.length)));
      setMeasuredTags(true);
    };

    calculateVisibleTags();

    let resizeTimer;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(calculateVisibleTags, 150);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
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
              Tokens
            </TagChip>

            {/* Discovery items */}
            <TagChip
              onClick={() => (window.location.href = '/new')}
              selected={currentView === 'new'}
              darkMode={darkMode}
            >
              <Newspaper size={13} />
              <span>New</span>
            </TagChip>
            <TagChip
              onClick={() => (window.location.href = '/trending')}
              selected={currentView === 'trending'}
              darkMode={darkMode}
            >
              <Flame size={13} />
              <span>Trending</span>
            </TagChip>
            <TagChip
              onClick={() => (window.location.href = '/gainers/24h')}
              selected={currentView === 'gainers'}
              darkMode={darkMode}
            >
              <TrendingUp size={13} />
              <span>Gainers</span>
            </TagChip>
            <TagChip
              onClick={() => (window.location.href = '/spotlight')}
              selected={currentView === 'spotlight'}
              darkMode={darkMode}
            >
              <Sparkles size={13} />
              <span>Spotlight</span>
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

          {/* Sort and rows selectors on the right */}
          <Stack className="ml-auto gap-[6px]">
            {/* Sort By Selector */}
            <RowsSelector
              darkMode={darkMode}
              value={currentOrderBy}
              onChange={(e) => {
                setOrderBy(e.target.value);
                localStorage.setItem('tokenListSortBy', e.target.value);
                setSync((prev) => prev + 1);
              }}
              noMargin
              aria-label="Sort by"
            >
              <option value="vol24hxrp">{isMobile ? 'Vol 24H' : 'Volume 24H'}</option>
              <option value="marketcap">{isMobile ? 'MCap' : 'Market Cap'}</option>
              <option value="pro5m">{isMobile ? 'Chg 5M' : 'Change 5M'}</option>
              <option value="pro1h">{isMobile ? 'Chg 1H' : 'Change 1H'}</option>
              <option value="pro24h">{isMobile ? 'Chg 24H' : 'Change 24H'}</option>
              <option value="pro7d">{isMobile ? 'Chg 7D' : 'Change 7D'}</option>
              <option value="tvl">{isMobile ? 'Liq.' : 'Liquidity'}</option>
              <option value="holders">Holders</option>
              <option value="vol24htx">Trades</option>
              <option value="dateon">Newest</option>
            </RowsSelector>

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

            {/* API Button */}
            <ApiButton />
          </Stack>
        </Row>
      </Container>

      {/* Categories Drawer - rendered outside Container to avoid position:relative issues */}
      {categoriesOpen && (
        <Drawer open={categoriesOpen}>
          <DrawerBackdrop onClick={() => setCategoriesOpen(false)} />
          <DrawerPaper isDark={darkMode}>
            <DrawerHeader isDark={darkMode}>
              <div className="flex items-center gap-4 flex-1">
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-blue-500 whitespace-nowrap">
                  Categories {tags?.length ? `(${tags.length})` : ''}
                </span>
                <div
                  className="flex-1 h-[14px] bg-[length:8px_5px]"
                  style={{
                    backgroundImage: darkMode
                      ? 'radial-gradient(circle, rgba(96,165,250,0.4) 1px, transparent 1px)'
                      : 'radial-gradient(circle, rgba(66,133,244,0.5) 1px, transparent 1px)'
                  }}
                />
              </div>
              <DrawerClose
                isDark={darkMode}
                onClick={() => setCategoriesOpen(false)}
                aria-label="Close"
              >
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
