import React, { useState, useMemo, memo, useRef, useEffect, Fragment } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Search, X, Newspaper, Flame, TrendingUp, Sparkles, Coins } from 'lucide-react';
import { ApiButton } from 'src/components/ApiEndpointsModal';
import { normalizeTag } from 'src/utils/formatters';
import { cn } from 'src/utils/cn';

// Styled Components
const Container = ({ className, children, ...p }) => (
  <div
    className={cn(
      'st-container flex flex-col gap-2 rounded-xl border-[1.5px] backdrop-blur-[12px] py-[10px] px-[14px] relative box-border overflow-hidden',
      '[&>*]:relative [&>*]:z-[1]',
      'max-sm:py-[6px] max-sm:px-2 max-sm:gap-[6px]',
      'border-black/[0.06] bg-white dark:border-white/[0.08] dark:bg-[rgba(10,10,10,0.5)]',
      className
    )}
    {...p}
  >
    <style>{`
      .st-rows-selector {
        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(0,0,0,0.5)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
      }
      .dark .st-rows-selector {
        background-image: url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='rgba(255,255,255,0.6)' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e");
      }
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

const RowsSelector = ({ noMargin, className, children, ...p }) => (
  <select
    className={cn(
      'st-select rounded-lg border-[1.5px] text-xs font-medium cursor-pointer h-8 min-w-[70px] appearance-none transition-[background-color,border-color,opacity] duration-150',
      'hover:border-blue-500/50 focus:outline-none focus:border-blue-500',
      'max-sm:text-[0.6rem] max-sm:h-[22px] max-sm:min-w-[42px] max-sm:pl-[5px] max-sm:pr-4',
      'border-black/[0.08] bg-white/90 text-black/70 [&_option]:bg-white [&_option]:text-[#1a1a1a] dark:border-white/10 dark:bg-black/40 dark:text-white/85 dark:[&_option]:bg-[#0a0a0a] dark:[&_option]:text-[#e5e5e5]',
      'hover:bg-blue-500/[0.05] dark:hover:bg-blue-500/10',
      noMargin ? 'ml-0' : 'ml-auto',
      'st-rows-selector',
      className
    )}
    style={{
      padding: '0 28px 0 12px',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 10px center',
      backgroundSize: '12px'
    }}
    {...p}
  >{children}</select>
);

const Stack = ({ className, children, ...p }) => (
  <div className={cn('st-stack flex flex-row gap-[6px] items-center shrink-0 relative z-[1] max-sm:gap-[3px] max-sm:touch-manipulation', className)} {...p}>{children}</div>
);

const StyledIconButton = ({ className, children, ...p }) => (
  <button
    className={cn(
      'inline-flex items-center justify-center w-[30px] h-[30px] p-0 border-none rounded-lg bg-transparent cursor-pointer transition-[background-color,border-color,opacity] duration-150 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
      'hover:bg-blue-500/10 hover:text-blue-500',
      'max-sm:w-[26px] max-sm:h-[26px]',
      'text-black/40 dark:text-white/50',
      className
    )}
    {...p}
  >{children}</button>
);

const ButtonGroup = ({ hideOnMobile, className, children, ...p }) => (
  <div
    className={cn(
      'flex gap-[2px] shrink-0 p-[3px] rounded-lg border-none',
      'bg-black/[0.03] dark:bg-white/[0.04]',
      '[&>button]:rounded-[6px] [&>button]:border-none [&>button]:min-w-[36px] [&>button]:h-6 [&>button]:px-[10px] [&>button]:text-[0.72rem] [&>button]:font-normal [&>button]:bg-transparent [&>button]:cursor-pointer [&>button]:inline-flex [&>button]:items-center [&>button]:justify-center [&>button]:gap-1 [&>button]:touch-manipulation [&>button]:transition-[background-color,border-color,opacity] [&>button]:duration-150',
      '[&>button]:text-black/50 [&>button:hover]:text-black/80 [&>button:hover]:bg-black/[0.04] dark:[&>button]:text-white/60 dark:[&>button:hover]:text-white/90 dark:[&>button:hover]:bg-white/[0.06]',
      '[&>button.selected]:bg-white [&>button.selected]:text-[#333] [&>button.selected]:font-medium [&>button.selected]:shadow-[0_1px_2px_rgba(0,0,0,0.08)] [&>button.selected:hover]:bg-white dark:[&>button.selected]:bg-white/95 dark:[&>button.selected]:text-[#111] dark:[&>button.selected]:font-medium dark:[&>button.selected]:shadow-[0_1px_2px_rgba(0,0,0,0.08)] dark:[&>button.selected:hover]:bg-white',
      hideOnMobile && 'max-sm:hidden',
      !hideOnMobile && 'max-sm:p-[2px] max-sm:[&>button]:min-w-[28px] max-sm:[&>button]:h-[22px] max-sm:[&>button]:px-[7px] max-sm:[&>button]:text-[0.65rem] max-sm:[&>button]:gap-[2px]',
      className
    )}
    {...p}
  >{children}</div>
);

const LaunchpadGroup = ({ className, children, ...p }) => (
  <div
    className={cn('st-lp-group inline-flex items-center gap-[2px] py-[3px] pl-2 pr-[6px] rounded-[6px] border ml-2', 'bg-black/[0.04] border-black/[0.1] dark:bg-white/[0.06] dark:border-white/[0.12]', className)}
    {...p}
  >{children}</div>
);

const LaunchpadLabel = ({ className, children, ...p }) => (
  <span
    className={cn('st-lp-label text-[0.6rem] font-semibold uppercase tracking-[0.05em] mr-1', 'text-black/60 dark:text-white/60', className)}
    {...p}
  >{children}</span>
);

const LaunchpadChip = ({ selected, className, children, ...p }) => (
  <button
    className={cn(
      'st-lp-chip inline-flex items-center px-[6px] border-none rounded text-[0.65rem] cursor-pointer whitespace-nowrap h-5 shrink-0 transition-[background-color,border-color,opacity] duration-150',
      'hover:bg-blue-500/10 hover:text-blue-500',
      selected ? 'bg-blue-500/[0.15] text-blue-500 font-medium' : 'bg-transparent text-[#212B36]/60 font-normal dark:text-white/60',
      className
    )}
    {...p}
  >{children}</button>
);

const TagChip = ({ selected, className, children, ...p }) => (
  <button
    className={cn(
      'st-tag inline-flex items-center gap-[3px] px-2 rounded-[6px] border text-[0.68rem] cursor-pointer whitespace-nowrap h-6 shrink-0 transition-[background-color,border-color,opacity] duration-150 max-sm:text-[0.6rem] max-sm:h-[22px] max-sm:px-[6px] max-sm:gap-[2px]',
      selected
        ? 'border-blue-500/30 bg-blue-500/10 text-blue-500 font-medium hover:bg-blue-500/[0.15]'
        : 'border-black/[0.08] bg-black/[0.02] text-[#212B36]/70 font-normal hover:bg-black/[0.05] hover:text-[#212B36]/90 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white/70 dark:hover:bg-white/[0.08] dark:hover:text-white/90',
      className
    )}
    {...p}
  >{children}</button>
);

const AllTagsButton = ({ className, children, ...p }) => (
  <button
    className={cn(
      'st-all-btn inline-flex items-center gap-1 px-2 border-[1.5px] rounded-[6px] text-blue-500 text-[0.68rem] font-medium cursor-pointer whitespace-nowrap h-6 shrink-0 ml-auto transition-[background-color,border-color,opacity] duration-150 hover:bg-blue-500/[0.15]',
      'max-sm:text-[0.62rem] max-sm:h-[22px] max-sm:px-[6px] max-sm:gap-[2px]',
      'bg-blue-500/[0.05] border-blue-500/15 dark:bg-blue-500/[0.08] dark:border-blue-500/20',
      className
    )}
    {...p}
  >{children}</button>
);

const Drawer = ({ open, className, children, ...p }) => (
  <div className={cn('fixed inset-0 z-[1300]', open ? 'block' : 'hidden', className)} {...p}>{children}</div>
);

const DrawerBackdrop = ({ className, children, ...p }) => (
  <div className={cn('fixed inset-0 bg-black/60 backdrop-blur-[4px] animate-[fadeIn_0.2s_ease-out]', className)} {...p}>
    <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    {children}
  </div>
);

const DrawerPaper = ({ className, children, ...p }) => (
  <div
    className={cn(
      'fixed bottom-0 left-0 right-0 max-h-[70dvh] pb-[env(safe-area-inset-bottom)] backdrop-blur-[24px] rounded-t-xl border-t overflow-hidden flex flex-col z-[1301]',
      'bg-white/[0.98] border-blue-200 shadow-[0_-25px_50px_-12px_rgba(191,219,254,0.5)] dark:bg-black/85 dark:border-blue-500/20 dark:shadow-[0_-25px_50px_-12px_rgba(59,130,246,0.1)]',
      'animate-[slideUp_0.25s_ease-out]',
      className
    )}
    style={{ '--tw-enter-translate-y': '100%' }}
    {...p}
  >
    <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
    {children}
  </div>
);

const DrawerHeader = ({ className, children, ...p }) => (
  <div className={cn('flex items-center justify-between p-4', className)} {...p}>{children}</div>
);

const DrawerTitle = ({ className, children, ...p }) => (
  <h2 className={cn('font-medium text-[15px] m-0', 'text-[#212B36] dark:text-white', className)} {...p}>{children}</h2>
);

const DrawerClose = ({ className, children, ...p }) => (
  <button
    className={cn(
      'w-8 h-8 border-[1.5px] rounded-lg bg-transparent cursor-pointer flex items-center justify-center transition-[background-color,border-color,opacity] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
      'hover:border-blue-400/50 hover:text-[#4285f4]',
      'border-black/10 text-black/40 dark:border-white/10 dark:text-white/40',
      className
    )}
    {...p}
  >{children}</button>
);

const SearchBox = ({ className, children, ...p }) => (
  <div className={cn('py-3 px-4', className)} {...p}>{children}</div>
);

const SearchInputWrapper = ({ className, children, ...p }) => (
  <div
    className={cn(
      'flex items-center gap-3 h-10 px-4 rounded-xl border-[1.5px] transition-[border-color] duration-200',
      'border-black/[0.08] bg-white hover:border-blue-500/30 focus-within:border-blue-500/50 dark:border-blue-500/[0.08] dark:bg-white/[0.02] dark:hover:border-blue-500/20 dark:focus-within:border-blue-500/40',
      className
    )}
    {...p}
  >{children}</div>
);

const SearchIconWrapper = ({ className, children, ...p }) => (
  <div className={cn('flex items-center justify-center shrink-0', 'text-black/40 dark:text-white/40', className)} {...p}>{children}</div>
);

const SearchInput = React.forwardRef(({ className, ...p }, ref) => (
  <input
    ref={ref}
    className={cn(
      'flex-1 bg-transparent border-none outline-none text-sm max-sm:text-base font-[inherit] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#137DFE]',
      'text-[#212B36] placeholder:text-[#212B36]/40 dark:text-white dark:placeholder:text-white/50',
      className
    )}
    {...p}
  />
));

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

const TagButton = ({ className, children, ...p }) => (
  <button
    className={cn(
      'inline-flex items-center justify-center py-1 px-3 border rounded-lg bg-transparent text-xs font-normal cursor-pointer font-[inherit] whitespace-nowrap h-7 shrink-0 transition-[background-color,border-color,opacity] duration-200',
      'hover:bg-blue-500/[0.08] hover:border-blue-500/30 hover:text-blue-500',
      'max-sm:h-8 max-sm:py-1 max-sm:px-[14px] max-sm:text-[0.8rem]',
      'border-black/[0.08] text-[#212B36]/70 dark:border-white/[0.08] dark:text-white/70',
      className
    )}
    {...p}
  >{children}</button>
);

const EmptyState = ({ className, children, ...p }) => (
  <div
    className={cn('w-full text-center py-8 text-sm', 'text-[#212B36]/50 dark:text-white/50', className)}
    {...p}
  >{children}</div>
);

// Categories Drawer Content Component
const CategoriesDrawerContent = memo(function CategoriesDrawerContent({ tags, tagName }) {
  const [searchTerm, setSearchTerm] = useState('');
  const searchRef = useRef(null);

  const filteredTags = useMemo(() => {
    if (!tags) return [];
    if (!searchTerm.trim()) return tags;
    const term = searchTerm.toLowerCase();
    return tags.filter((tag) => tag.toLowerCase().includes(term));
  }, [tags, searchTerm]);

  useEffect(() => {
    // Auto-focus search on open
    const t = setTimeout(() => searchRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {tags && tags.length > 0 && (
        <SearchBox>
          <SearchInputWrapper>
            <SearchIconWrapper>
              <Search size={16} />
            </SearchIconWrapper>
            <SearchInput
              ref={searchRef}
              type="search"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoComplete="off"
            />
            {searchTerm && (
              <button
                onClick={() => { setSearchTerm(''); searchRef.current?.focus(); }}
                className="flex items-center justify-center w-6 h-6 rounded-md bg-transparent border-none cursor-pointer shrink-0 text-black/30 hover:text-black/60 dark:text-white/30 dark:hover:text-white/60 transition-colors"
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </SearchInputWrapper>
        </SearchBox>
      )}

      <TagsGrid>
        {filteredTags.length > 0 ? (
          filteredTags.map((tag) => {
            const isActive = tagName === tag;
            return (
              <Link key={tag} href={`/view/${normalizeTag(tag)}`} className="no-underline">
                <TagButton
                  className={isActive ? '!border-blue-500/30 !bg-blue-500/10 !text-blue-500 font-medium' : ''}
                  onClick={() => {}}
                >
                  {tag}
                </TagButton>
              </Link>
            );
          })
        ) : (
          <EmptyState>
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
  setCustomSettingsOpen,
  skipSortPersist
}) {
  const router = useRouter();

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
      <Container ref={containerRef}>
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
                  >
                    <span>{tag}</span>
                  </TagChip>
                );
              })}
            </TagsScrollArea>

            {/* All Tags Button - always visible, never hidden by scroll */}
            <AllButtonWrapper>
              <AllTagsButton onClick={() => setCategoriesOpen(true)}>
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
              className={currentView !== 'tokens' ? 'max-sm:[&>span]:hidden' : ''}
            >
              <Coins size={13} />
              <span>Tokens</span>
            </TagChip>

            {/* Discovery items */}
            <TagChip
              onClick={() => (window.location.href = '/new')}
              selected={currentView === 'new'}
              className={currentView !== 'new' ? 'max-sm:[&>span]:hidden' : ''}
            >
              <Newspaper size={13} />
              <span>New</span>
            </TagChip>
            <TagChip
              onClick={() => (window.location.href = '/trending')}
              selected={currentView === 'trending'}
              className={currentView !== 'trending' ? 'max-sm:[&>span]:hidden' : ''}
            >
              <Flame size={13} />
              <span>Trending</span>
            </TagChip>
            <TagChip
              onClick={() => (window.location.href = '/gainers/24h')}
              selected={currentView === 'gainers'}
              className={currentView !== 'gainers' ? 'max-sm:[&>span]:hidden' : ''}
            >
              <TrendingUp size={13} />
              <span>Gainers</span>
            </TagChip>
            <TagChip
              onClick={() => (window.location.href = '/spotlight')}
              selected={currentView === 'spotlight'}
              className={currentView !== 'spotlight' ? 'max-sm:[&>span]:hidden' : ''}
            >
              <Sparkles size={13} />
              <span>Spotlight</span>
            </TagChip>

            {/* Launchpads group */}
            <LaunchpadGroup>
              <LaunchpadLabel>Launchpads</LaunchpadLabel>
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
                >
                  {lp.name}
                </LaunchpadChip>
              ))}
            </LaunchpadGroup>

            {/* Period selector for gainers or price change sorting */}
            {(currentView === 'gainers' ||
              ['pro5m', 'pro1h', 'pro24h', 'pro7d'].includes(currentOrderBy)) && (
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
            )}
          </RowContent>

          {/* Sort and rows selectors on the right */}
          <Stack className="ml-auto gap-[6px] max-sm:gap-1">
            {/* Sort By Selector */}
            <RowsSelector
              value={currentOrderBy}
              onChange={(e) => {
                setOrderBy(e.target.value);
                if (!skipSortPersist) localStorage.setItem('tokenListSortBy', e.target.value);
                setSync((prev) => prev + 1);
              }}
              noMargin
              aria-label="Sort by"
            >
              <option value="vol24hxrp">{isMobile ? 'Vol 24h' : 'Volume 24h'}</option>
              <option value="marketcap">{isMobile ? 'MCap' : 'Market Cap'}</option>
              <option value="pro5m">{isMobile ? '5m' : 'Change 5m'}</option>
              <option value="pro1h">{isMobile ? '1h' : 'Change 1h'}</option>
              <option value="pro24h">{isMobile ? '24h' : 'Change 24h'}</option>
              <option value="pro7d">{isMobile ? '7d' : 'Change 7d'}</option>
              <option value="tvl">{isMobile ? 'Liq.' : 'Liquidity'}</option>
              <option value="holders">{isMobile ? 'Hold.' : 'Holders'}</option>
              <option value="vol24htx">Trades</option>
              <option value="dateon">{isMobile ? 'New' : 'Newest'}</option>
            </RowsSelector>

            {/* Rows selector */}
            <>
              <label htmlFor="rows-per-page-select" className="visually-hidden">
                Rows per page
              </label>
              <RowsSelector
                id="rows-per-page-select"
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
          <DrawerPaper>
            <DrawerHeader>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-blue-500 whitespace-nowrap">
                  Categories
                </span>
                {tags?.length > 0 && (
                  <span className="text-[10px] font-medium tabular-nums px-[6px] py-[1px] rounded-full bg-blue-500/10 text-blue-500/70 dark:bg-blue-500/15 dark:text-blue-400/80">
                    {tags.length}
                  </span>
                )}
                <div className="flex-1 h-px bg-black/[0.06] dark:bg-white/[0.08]" />
              </div>
              <DrawerClose
                onClick={() => setCategoriesOpen(false)}
                aria-label="Close"
              >
                <X size={18} />
              </DrawerClose>
            </DrawerHeader>
            <CategoriesDrawerContent tags={tags} tagName={tagName} />
          </DrawerPaper>
        </Drawer>
      )}
    </Fragment>
  );
});

export default SearchToolbar;
