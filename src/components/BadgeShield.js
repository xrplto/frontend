import { useContext } from 'react';
import { AppContext } from 'src/context/AppContext';
import { Award } from 'lucide-react';
import { achievementBadges, defaultBadge } from './badgeConfig';

/**
 * BadgeShield — heraldic shield SVG for achievement badges.
 *
 * Props:
 *   badgeKey  — key from achievementBadges (e.g. 'first_recruit')
 *   earned    — true = full color, false = grayscale/dimmed
 *   size      — 'sm' (24px icon only), 'md' (32px), 'lg' (56px with label)
 */
export default function BadgeShield({ badgeKey, earned = true, size = 'md' }) {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const cfg = achievementBadges[badgeKey] || { ...defaultBadge, label: badgeKey?.replace(/_/g, ' ') || 'Badge' };
  const Icon = cfg.icon || Award;
  const stars = cfg.stars || 0;
  const color = earned ? cfg.color : (isDark ? '#555' : '#bbb');
  const colorFaint = earned ? `${cfg.color}30` : (isDark ? '#ffffff08' : '#00000008');

  const dims = size === 'sm' ? 20 : size === 'lg' ? 40 : 26;
  const iconSize = size === 'sm' ? 9 : size === 'lg' ? 16 : 11;

  return (
    <div className="inline-flex flex-col items-center gap-0.5" title={cfg.label}>
      <svg
        width={dims}
        height={dims}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ opacity: earned ? 1 : 0.4 }}
      >
        {/* Rounded square */}
        <rect
          x="2" y="2" width="36" height="36" rx="8"
          fill={colorFaint}
          stroke={color}
          strokeWidth="1.5"
        />
        {/* Inner border */}
        <rect
          x="5" y="5" width="30" height="30" rx="5.5"
          fill="none"
          stroke={color}
          strokeWidth="0.5"
          strokeOpacity="0.3"
        />

        {/* Star accents along top */}
        {stars >= 1 && (
          <circle cx="20" cy="8" r="1.5" fill={color} fillOpacity={earned ? 0.9 : 0.3} />
        )}
        {stars >= 2 && (
          <>
            <circle cx="14" cy="8" r="1.2" fill={color} fillOpacity={earned ? 0.7 : 0.2} />
            <circle cx="26" cy="8" r="1.2" fill={color} fillOpacity={earned ? 0.7 : 0.2} />
          </>
        )}
        {stars >= 3 && (
          <>
            <circle cx="9" cy="9.5" r="1" fill={color} fillOpacity={earned ? 0.5 : 0.15} />
            <circle cx="31" cy="9.5" r="1" fill={color} fillOpacity={earned ? 0.5 : 0.15} />
          </>
        )}

        {/* Icon via foreignObject */}
        <foreignObject x="10" y="12" width="20" height="20">
          <div
            xmlns="http://www.w3.org/1999/xhtml"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: '100%',
            }}
          >
            <Icon size={iconSize} color={color} strokeWidth={2} />
          </div>
        </foreignObject>
      </svg>

      {/* Label for lg size */}
      {size === 'lg' && (
        <span
          className="text-[9px] font-semibold text-center leading-tight max-w-[50px] truncate"
          style={{ color }}
        >
          {cfg.label}
        </span>
      )}
    </div>
  );
}
