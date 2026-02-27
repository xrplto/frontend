import { useContext } from 'react';
import { Star, Sparkles, Check } from 'lucide-react';
import { cn } from 'src/utils/cn';
import { ThemeContext } from 'src/context/AppContext';

// Single source of truth for verification tier styling
// Matches API verify.js: Tier 1=Official, 2=Premium($589), 3=Standard($250), 4=Basic($99)
export const TIER_CONFIG = {
  1: {
    label: 'Official',
    bg: 'bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 shadow-[0_0_12px_rgba(59,130,246,0.6)]',
    inlineDark: 'bg-blue-500/15 text-blue-400 border border-blue-500/20',
    inlineLight: 'bg-blue-50 text-blue-600 border border-blue-200',
    icon: (size) => <Star size={size} strokeWidth={2.5} className="text-white drop-shadow-md" fill="currentColor" />,
  },
  2: {
    label: 'Premium',
    bg: 'bg-gradient-to-br from-fuchsia-400 via-purple-500 to-violet-600 shadow-[0_0_10px_rgba(168,85,247,0.5)]',
    inlineDark: 'bg-purple-500/15 text-purple-400 border border-purple-500/20',
    inlineLight: 'bg-purple-50 text-purple-600 border border-purple-200',
    icon: (size) => <Sparkles size={size} strokeWidth={2.5} className="text-white drop-shadow-md" />,
  },
  3: {
    label: 'Standard',
    bg: 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 shadow-[0_0_8px_rgba(251,191,36,0.5)]',
    inlineDark: 'bg-amber-500/15 text-amber-400 border border-amber-500/20',
    inlineLight: 'bg-amber-50 text-amber-600 border border-amber-200',
    icon: (size) => <Check size={size} strokeWidth={3} className="text-white drop-shadow-sm" />,
  },
  4: {
    label: 'Verified',
    bg: 'bg-green-500 shadow-md shadow-green-500/30',
    inlineDark: 'bg-green-500/15 text-green-400 border border-green-500/20',
    inlineLight: 'bg-green-50 text-green-600 border border-green-200',
    icon: (size) => <Check size={size} strokeWidth={3} className="text-white" />,
  },
};

const sizeConfig = {
  sm: { padding: 'p-[2px]', iconSize: 8, ring: 'ring-[1.5px]' },
  md: { padding: 'p-[3px]', iconSize: 10, ring: 'ring-2' },
};

// Overlay badge (absolute positioned on images)
export default function VerificationBadge({ verified, size = 'md' }) {
  const tier = TIER_CONFIG[verified];
  if (!tier) return null;

  const s = sizeConfig[size] || sizeConfig.md;

  return (
    <div
      className={cn(
        'absolute -bottom-1 -right-1 rounded-full transition-opacity duration-300',
        s.padding,
        s.ring,
        'ring-white dark:ring-[#0a0a0a]',
        tier.bg
      )}
      title={tier.label}
    >
      {tier.icon(s.iconSize)}
    </div>
  );
}

// Inline text label (next to names)
export function VerificationLabel({ verified, className }) {
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const tier = TIER_CONFIG[verified];
  if (!tier) return null;

  return (
    <span
      className={cn(
        'px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide shrink-0',
        isDark ? tier.inlineDark : tier.inlineLight,
        className
      )}
    >
      {tier.label}
    </span>
  );
}
