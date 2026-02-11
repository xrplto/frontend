import { Star, Sparkles, Check } from 'lucide-react';
import { cn } from 'src/utils/cn';

const tierConfig = {
  1: {
    bg: 'bg-gradient-to-br from-cyan-400 via-blue-500 to-indigo-600 shadow-[0_0_12px_rgba(59,130,246,0.6)]',
    title: 'Official',
    icon: (size) => <Star size={size} strokeWidth={2.5} className="text-white drop-shadow-md" fill="currentColor" />,
  },
  2: {
    bg: 'bg-gradient-to-br from-fuchsia-400 via-purple-500 to-violet-600 shadow-[0_0_10px_rgba(168,85,247,0.5)]',
    title: 'Premium Verified (1000 XRP)',
    icon: (size) => <Sparkles size={size} strokeWidth={2.5} className="text-white drop-shadow-md" />,
  },
  3: {
    bg: 'bg-gradient-to-br from-yellow-400 via-amber-500 to-orange-500 shadow-[0_0_8px_rgba(251,191,36,0.5)]',
    title: 'Standard Verified (500 XRP)',
    icon: (size) => <Check size={size} strokeWidth={3} className="text-white drop-shadow-sm" />,
  },
  4: {
    bg: 'bg-green-500 shadow-md shadow-green-500/30',
    title: 'Basic Verified (100 XRP)',
    icon: (size) => <Check size={size} strokeWidth={3} className="text-white" />,
  },
};

const sizeConfig = {
  sm: { padding: 'p-[2px]', iconSize: 8, ring: 'ring-[1.5px]' },
  md: { padding: 'p-[3px]', iconSize: 10, ring: 'ring-2' },
};

export default function VerificationBadge({ verified, size = 'md', isDark }) {
  const tier = tierConfig[verified];
  if (!tier) return null;

  const s = sizeConfig[size] || sizeConfig.md;

  return (
    <div
      className={cn(
        'absolute -bottom-1 -right-1 rounded-full animate-in fade-in duration-300',
        s.padding,
        s.ring,
        isDark ? 'ring-[#0a0a0a]' : 'ring-white',
        tier.bg
      )}
      title={tier.title}
    >
      {tier.icon(s.iconSize)}
    </div>
  );
}
