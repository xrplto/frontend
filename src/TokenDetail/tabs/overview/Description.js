import React, { useState, useContext, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Edit, X, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { ThemeContext, WalletContext } from 'src/context/AppContext';
import { CompactSocialLinks, CompactTags } from './PriceStatistics';
import { cn } from 'src/utils/cn';

const MarkdownStyles = (isDark) => ({
  p: (props) => (
    <div
      style={{
        fontSize: '13px',
        fontWeight: 400,
        color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)',
        marginBottom: '12px',
        lineHeight: 1.6,
        letterSpacing: '0.01em'
      }}
      {...props}
    />
  ),
  h1: (props) => (
    <div
      style={{
        fontSize: '16px',
        fontWeight: 700,
        color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)',
        marginBottom: '10px',
        lineHeight: 1.6,
        letterSpacing: '0.01em'
      }}
      {...props}
    />
  ),
  h2: (props) => (
    <div
      style={{
        fontSize: '14px',
        fontWeight: 700,
        color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)',
        marginBottom: '10px',
        lineHeight: 1.6,
        letterSpacing: '0.01em'
      }}
      {...props}
    />
  ),
  h3: (props) => (
    <div
      style={{
        fontSize: '13px',
        fontWeight: 600,
        color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)',
        marginBottom: '10px',
        lineHeight: 1.6,
        letterSpacing: '0.01em'
      }}
      {...props}
    />
  ),
  ul: (props) => <ul className="pl-5 mb-3" {...props} />,
  ol: (props) => <ol className="pl-5 mb-3" {...props} />,
  li: (props) => (
    <li
      style={{
        fontSize: '13px',
        fontWeight: 400,
        color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)',
        marginBottom: '4px',
        lineHeight: 1.6,
        letterSpacing: '0.01em'
      }}
      {...props}
    />
  )
});

export default function Description({
  token,
  showEditor,
  setShowEditor,
  description,
  onApplyDescription,
  mdEditor,
  isDark = false
}) {
  const { themeName } = useContext(ThemeContext);
  const { accountProfile } = useContext(WalletContext);
  const effectiveIsDark = isDark || themeName === 'XrplToDarkTheme';
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsReadMore, setNeedsReadMore] = useState(false);
  const contentRef = useRef(null);

  const isAdmin = accountProfile?.admin;
  const displayName = token.user || token.name;

  const markdownComponents = React.useMemo(() => MarkdownStyles(effectiveIsDark), [effectiveIsDark]);

  useEffect(() => {
    if (contentRef.current && description) {
      setNeedsReadMore(contentRef.current.scrollHeight > 180);
    }
  }, [description]);

  const handleEditToggle = () => {
    if (showEditor) onApplyDescription();
    setShowEditor(!showEditor);
  };

  const hasSocial = token.domain || (token.social && Object.keys(token.social).some((k) => token.social[k]));
  const tags = token.tags || [];
  const hasTags = tags.length > 0;

  if (!description && !showEditor && !isAdmin && !hasSocial && !hasTags) return null;

  return (
    <div
      className={cn(
        'rounded-2xl w-full overflow-hidden transition-all duration-200 backdrop-blur-[8px]',
        effectiveIsDark ? 'bg-[rgba(10,10,10,0.5)] border border-white/[0.08]' : 'bg-[rgba(255,255,255,0.5)] border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.02)]'
      )}
    >
      {/* CardHeader */}
      <div
        className={cn(
          'flex justify-between items-center px-[14px] py-3 border-b',
          effectiveIsDark ? 'border-white/[0.06] bg-white/[0.02]' : 'border-black/[0.04] bg-black/[0.01]'
        )}
      >
        {/* Title */}
        <div
          className={cn(
            'text-[11px] font-bold uppercase tracking-[0.1em] flex items-center gap-2',
            effectiveIsDark ? 'text-white/60' : 'text-black/60'
          )}
        >
          <span className="w-[6px] h-[6px] rounded-full bg-blue-500 inline-block shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
          About {displayName}
        </div>
        {isAdmin && (
          <button
            title={showEditor ? 'Save & close' : 'Edit'}
            className={cn(
              'rounded-lg p-[5px] bg-transparent cursor-pointer flex items-center transition-all duration-150',
              'hover:bg-[rgba(59,130,246,0.08)] hover:text-[#3b82f6]',
              showEditor && 'hover:bg-[rgba(239,68,68,0.08)] hover:text-[#ef4444]'
            )}
            style={{
              color: showEditor ? '#ef4444' : effectiveIsDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
              border: `1.5px solid ${effectiveIsDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`
            }}
            onClick={handleEditToggle}
          >
            {showEditor ? <X size={16} /> : <Edit size={16} />}
          </button>
        )}
      </div>

      {showEditor && mdEditor ? (
        <div className="p-3">{mdEditor}</div>
      ) : description ? (
        <>
          {/* Content */}
          <div
            ref={contentRef}
            className="px-4 py-3 relative overflow-hidden transition-[max-height] duration-300 ease-in-out"
            style={{ maxHeight: isExpanded ? 'none' : '180px' }}
          >
            <ReactMarkdown components={markdownComponents}>{description}</ReactMarkdown>
            {/* GradientOverlay */}
            {needsReadMore && !isExpanded && (
              <div
                className="absolute bottom-0 left-0 right-0 h-[60px] pointer-events-none"
                style={{
                  background: `linear-gradient(transparent, ${effectiveIsDark ? 'rgba(10,10,10,0.9)' : 'rgba(255,255,255,0.9)'})`
                }}
              />
            )}
          </div>
          {needsReadMore && (
            <button
              className={cn(
                'bg-transparent border-none text-[#3b82f6] text-xs font-semibold cursor-pointer px-4 py-2 flex items-center gap-1 w-full justify-center transition-all duration-200 -mt-2',
                'hover:text-[#2563eb]'
              )}
              onClick={() => setIsExpanded(!isExpanded)}
              onMouseEnter={(e) => { e.currentTarget.style.background = effectiveIsDark ? 'rgba(59,130,246,0.05)' : 'rgba(59,130,246,0.03)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              {isExpanded ? (
                <>
                  Show Less <ChevronUp size={14} />
                </>
              ) : (
                <>
                  Read More <ChevronDown size={14} />
                </>
              )}
            </button>
          )}
        </>
      ) : (
        <div className="py-6 px-4 flex flex-col items-center gap-2">
          <div className={cn(
            "p-2 rounded-xl",
            effectiveIsDark ? "bg-white/[0.03] text-white/20" : "bg-black/[0.03] text-black/20"
          )}>
            <FileText size={24} strokeWidth={1.5} />
          </div>
          <div
            style={{
              fontSize: '12px',
              fontWeight: 400,
              color: effectiveIsDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
              fontStyle: 'italic',
              lineHeight: 1.6,
              letterSpacing: '0.01em'
            }}
          >
            No description available.
          </div>
        </div>
      )}

      {(hasSocial || hasTags) && (
        <div
          className={cn(
            'py-5 px-4 flex flex-col gap-5 border-t',
            effectiveIsDark ? 'border-white/[0.06] bg-white/[0.01]' : 'border-black/[0.04] bg-black/[0.005]'
          )}
        >
          {hasSocial && (
            <CompactSocialLinks
              social={{ ...token.social, website: token.domain }}
              isDark={effectiveIsDark}
              fullWidth
            />
          )}
          {hasSocial && hasTags && (
            <div className={cn('h-px', effectiveIsDark ? 'bg-white/[0.06]' : 'bg-black/[0.04]')} />
          )}
          {hasTags && <CompactTags enhancedTags={tags} maxTags={10} isDark={effectiveIsDark} />}
        </div>
      )}
    </div>
  );
}
