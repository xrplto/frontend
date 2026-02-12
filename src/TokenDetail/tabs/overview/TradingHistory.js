import api, { apiFetch, submitTransaction, simulateTransaction } from 'src/utils/api';
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  memo,
  useMemo,
  useContext,
  Suspense
} from 'react';
import { createPortal } from 'react-dom';
import { MD5 } from 'crypto-js';
import { useSelector } from 'react-redux';
import { toast } from 'sonner';
import { configureMemos } from 'src/utils/parseUtils';
import TopTraders from 'src/TokenDetail/tabs/holders/TopTraders';
import RichList from 'src/TokenDetail/tabs/holders/RichList';
import { WalletContext, AppContext } from 'src/context/AppContext';
import { selectMetrics } from 'src/redux/statusSlice';
import {
  ExternalLink,
  X,
  Plus,
  Minus,
  Loader2,
  Activity,
  Droplets,
  Users,
  PieChart,
  Wallet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Filter,
  CheckCircle,
  AlertTriangle,
  Search
} from 'lucide-react';
import { cn } from 'src/utils/cn';

const SYMBOLS = { USD: '$', EUR: '€', JPY: '¥', CNH: '¥', XRP: '✕' };

const Spinner = ({ className, ...p }) => <Loader2 className={cn('animate-spin', className)} {...p} />;

const BearEmptyState = ({ isDark, title, subtitle }) => (
  <div className={cn('rounded-[12px]', isDark ? 'border-[1.5px] border-dashed border-white/10 bg-white/[0.02]' : 'border-[1.5px] border-dashed border-black/10 bg-black/[0.02]')}>
    <div className="flex flex-col items-center justify-center p-6">
      <div className="relative w-[48px] h-[48px] mb-3">
        <div className={cn('absolute -top-[3px] left-0 w-[16px] h-[16px] rounded-full', isDark ? 'bg-white/15' : 'bg-[#d1d5db]')}>
          <div className={cn('absolute top-[3px] left-[3px] w-[10px] h-[10px] rounded-full', isDark ? 'bg-white/10' : 'bg-[#e5e7eb]')} />
        </div>
        <div className={cn('absolute -top-[3px] right-0 w-[16px] h-[16px] rounded-full', isDark ? 'bg-white/15' : 'bg-[#d1d5db]')}>
          <div className={cn('absolute top-[3px] right-[3px] w-[10px] h-[10px] rounded-full', isDark ? 'bg-white/10' : 'bg-[#e5e7eb]')} />
        </div>
        <div className={cn('absolute top-[6px] left-1/2 -translate-x-1/2 w-[40px] h-[36px] rounded-full overflow-hidden', isDark ? 'bg-white/15' : 'bg-[#d1d5db]')}>
          {[0, 1, 2, 3, 4].map(i => (
            <div key={i} className={cn('h-[2px] w-full', isDark ? 'bg-white/15' : 'bg-[#e5e7eb]')} style={{ marginTop: i * 2.5 + 2 }} />
          ))}
          <div className="absolute top-[10px] left-[6px] w-[10px] h-[10px]">
            <div className={cn('absolute w-[8px] h-[2px] rotate-45 top-[4px]', isDark ? 'bg-white/40' : 'bg-[#6b7280]')} />
            <div className={cn('absolute w-[8px] h-[2px] -rotate-45 top-[4px]', isDark ? 'bg-white/40' : 'bg-[#6b7280]')} />
          </div>
          <div className="absolute top-[10px] right-[6px] w-[10px] h-[10px]">
            <div className={cn('absolute w-[8px] h-[2px] rotate-45 top-[4px]', isDark ? 'bg-white/40' : 'bg-[#6b7280]')} />
            <div className={cn('absolute w-[8px] h-[2px] -rotate-45 top-[4px]', isDark ? 'bg-white/40' : 'bg-[#6b7280]')} />
          </div>
          <div className={cn('absolute bottom-[5px] left-1/2 -translate-x-1/2 w-[18px] h-[12px] rounded-full', isDark ? 'bg-white/10' : 'bg-[#e5e7eb]')}>
            <div className={cn('absolute top-[2px] left-1/2 -translate-x-1/2 w-[8px] h-[6px] rounded-full', isDark ? 'bg-white/25' : 'bg-[#9ca3af]')} />
          </div>
        </div>
      </div>
      <span className={cn('text-[11px] font-medium tracking-[0.05em] uppercase mb-1', isDark ? 'text-white/50' : 'text-black/50')}>{title}</span>
      <span className={cn('text-[10px]', isDark ? 'text-white/30' : 'text-black/30')}>{subtitle}</span>
    </div>
  </div>
);

// Mini Sparkline SVG Component for TVL trends
const MiniSparkline = memo(
  ({ data, width = 60, height = 24, color = '#3b82f6', isDark = false }) => {
    if (!data || data.length < 2) return null;

    const values = data.map((d) => d.tvl || 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    // Calculate trend (compare first half avg to second half avg)
    const midpoint = Math.floor(values.length / 2);
    const firstHalfAvg = values.slice(0, midpoint).reduce((a, b) => a + b, 0) / midpoint;
    const secondHalfAvg =
      values.slice(midpoint).reduce((a, b) => a + b, 0) / (values.length - midpoint);
    const isUp = secondHalfAvg >= firstHalfAvg;
    const trendColor = isUp ? '#22c55e' : '#ef4444';

    // Generate path
    const points = values.map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    });

    const pathD = `M ${points.join(' L ')}`;
    const areaD = `${pathD} L ${width},${height} L 0,${height} Z`;

    return (
      <svg width={width} height={height} className="block">
        <defs>
          <linearGradient id={`sparkGrad-${isUp ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={trendColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={trendColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill={`url(#sparkGrad-${isUp ? 'up' : 'down'})`} />
        <path
          d={pathD}
          fill="none"
          stroke={trendColor}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
);

// Constants
const getTokenImageUrl = (issuer, currency) => {
  // XRP has a special MD5
  if (currency === 'XRP') {
    return 'https://s1.xrpl.to/token/84e5efeb89c4eae8f68188982dc290d8';
  }
  // Calculate MD5 for the token
  const tokenIdentifier = issuer + '_' + currency;
  const md5Hash = MD5(tokenIdentifier).toString();
  return `https://s1.xrpl.to/token/${md5Hash}`;
};
const SOURCE_TAGS = {
  111: 'Horizon',
  101102979: 'xrp.cafe',
  10011010: 'Magnetic',
  74920348: 'First Ledger',
  20221212: 'XPMarket',
  69420589: 'Bidds',
  110100111: 'Sologenic',
  80085: 'Zerpaay',
  11782013: 'ANODEX',
  13888813: 'Zerpmon',
  20102305: 'Opulence',
  42697468: 'Bithomp',
  89898989: 'Axelar Bridge',
  123321: 'BearBull',
  4152544945: 'ArtDept',
  100010010: 'StaticBit',
  80008000: 'Orchestra'
};

const getSourceTagName = (sourceTag) =>
  SOURCE_TAGS[sourceTag] || (sourceTag ? 'Source Unknown' : null);

const decodeCurrency = (currency) => {
  if (!currency || currency === 'XRP') return currency || 'XRP';
  // Only decode if it's a 40-character hex string (standard currency code format)
  if (currency.length === 40 && /^[0-9A-F]+$/i.test(currency)) {
    try {
      return Buffer.from(currency, 'hex').toString('utf8').replace(/\x00/g, '');
    } catch {
      return currency;
    }
  }
  // Already plain text (e.g., "DROP", "GDROP", "BTC")
  return currency;
};

// Sea creature SVG icons for wallet tiers (complete originals with preserveAspectRatio)
const ShrimpIcon = ({ color = '#f97316' }) => (
  <svg
    viewBox="0 0 824 796"
    width="24"
    height="14"
    preserveAspectRatio="xMidYMid meet"
    fill="none"
    stroke={color}
    strokeLinecap="round"
    strokeWidth="30"
  >
    <g transform="translate(-808 -85)">
      <line x2="247" y2="100" transform="translate(1011.5 104.5)" />
      <line x1="144" y2="34" transform="translate(867.5 104.5)" />
      <line y1="88" x2="13" transform="translate(854.5 138.5)" />
      <line x2="157" y2="125" transform="translate(854.5 226.5)" />
      <line x2="170" y2="106" transform="translate(829.5 279.5)" />
      <line y1="75" x2="96" transform="translate(829.5 204.5)" />
      <line x1="270" y1="19" transform="translate(925.5 204.5)" />
      <line x1="98" y1="11" transform="translate(1288.5 286.5)" />
      <line y1="55" x2="204" transform="translate(1084.5 286.5)" />
      <line x1="43" y2="38" transform="translate(1041.5 341.5)" />
      <line x1="48" y1="42" transform="translate(1041.5 379.5)" />
      <line y1="47" x2="236" transform="translate(1089.5 374.5)" />
      <line x2="72" y2="154" transform="translate(1288.5 292.5)" />
      <line x2="271" y2="25" transform="translate(1089.5 421.5)" />
      <line x1="30" y2="146" transform="translate(1360.5 300.5)" />
      <line x2="153" y2="90" transform="translate(1390.5 300.5)" />
      <line x1="69" y1="174" transform="translate(1543.5 390.5)" />
      <line x1="45" y2="164" transform="translate(1567.5 564.5)" />
      <line y1="76" x2="82" transform="translate(1485.5 728.5)" />
      <line x1="113" y2="55" transform="translate(1372.5 804.5)" />
      <line x2="76" y2="75" transform="translate(1296.5 784.5)" />
      <line x2="110" y2="13" transform="translate(1296.5 784.5)" />
      <line x1="37" y2="26" transform="translate(1406.5 771.5)" />
      <line y1="38" x2="35" transform="translate(1443.5 733.5)" />
      <line x1="24" y2="102" transform="translate(1478.5 631.5)" />
      <line x1="48" y1="130" transform="translate(1454.5 501.5)" />
      <line x2="99" y2="62" transform="translate(1355.5 439.5)" />
      <line y1="49" x2="178" transform="translate(1355.5 390.5)" />
      <line y1="114" x2="75" transform="translate(1458.5 390.5)" />
      <line x2="148" y2="60" transform="translate(1458.5 504.5)" />
      <line y1="65" x2="101" transform="translate(1505.5 564.5)" />
      <line x2="55" y2="88" transform="translate(1505.5 629.5)" />
      <line x2="79" y2="2" transform="translate(1481.5 728.5)" />
      <line x2="43" y2="16" transform="translate(1411.5 800.5)" />
      <line x1="14" y2="36" transform="translate(1411.5 693.5)" />
      <line y1="18" x2="27" transform="translate(1425.5 675.5)" />
      <line y1="3" x2="38" transform="translate(1409.5 616.5)" />
      <line y1="4" x2="53" transform="translate(1375.5 550.5)" />
      <line x2="46.5" transform="translate(1331.5 501.5)" />
      <line x1="27" y2="61" transform="translate(1304.5 501.5)" />
      <line x1="27" y2="58" transform="translate(1348.5 554.5)" />
      <line x1="36" y2="54" transform="translate(1373.5 619.5)" />
      <line x1="47" y2="55" transform="translate(1216.5 473.5)" />
      <line x2="158" y2="60" transform="translate(1058.5 468.5)" />
      <line x1="44" y2="71" transform="translate(1014.5 468.5)" />
    </g>
  </svg>
);

const FishIcon = ({ color = '#3b82f6' }) => (
  <svg
    viewBox="0 0 1000 735"
    width="24"
    height="14"
    preserveAspectRatio="xMidYMid meet"
    fill="none"
    stroke={color}
    strokeLinecap="round"
    strokeWidth="38"
  >
    <g transform="translate(-650 -155)">
      <line x2="189" y2="44" transform="translate(1073.5 227.5)" />
      <line x1="139" y1="42" transform="translate(1266.5 262.5)" />
      <line y1="123" x2="161" transform="translate(1405.5 181.5)" />
      <line x2="384" transform="translate(1182.5 181.5)" />
      <line x1="109" y2="46" transform="translate(1073.5 181.5)" />
      <line x1="306" y2="64" transform="translate(1221.5 195.5)" />
      <line y1="27" x2="190" transform="translate(883.5 227.5)" />
      <line x2="60" y2="216" transform="translate(883.5 259.5)" />
      <line x1="119" y2="74" transform="translate(764.5 254.5)" />
      <line y1="168" x2="89" transform="translate(675.5 328.5)" />
      <line x2="80" y2="166" transform="translate(675.5 496.5)" />
      <line x1="123" y1="68" transform="translate(755.5 662.5)" />
      <line x2="75" y2="93" transform="translate(856.5 722.5)" />
      <line x1="116" y1="48" transform="translate(931.5 815.5)" />
      <line x1="92" y1="118" transform="translate(955.5 745.5)" />
      <line x1="683" y1="71" transform="translate(883.5 733.5)" />
      <line y1="49" x2="54" transform="translate(1001.5 755.5)" />
      <line x1="144" y2="192" transform="translate(1105.5 563.5)" />
      <line x1="132" y2="8" transform="translate(1117.5 563.5)" />
      <line x2="3" y2="79" transform="translate(1114.5 492.5)" />
      <line x1="171" y1="13" transform="translate(943.5 479.5)" />
      <line y1="95" x2="40" transform="translate(898.5 479.5)" />
      <line x1="81" y2="45" transform="translate(817.5 574.5)" />
      <line y1="40" x2="28" transform="translate(782.5 622.5)" />
      <line x1="249" y2="39" transform="translate(689.5 463.5)" />
      <line x1="152" y2="42" transform="translate(931.5 385.5)" />
      <line y1="102" x2="149" transform="translate(1091.5 283.5)" />
      <line x1="178" y1="114" transform="translate(913.5 271.5)" />
      <line x2="170" y2="172" transform="translate(1079.5 385.5)" />
      <line y1="43" transform="translate(1117.5 571.5)" />
      <line x1="84" y2="65" transform="translate(1033.5 614.5)" />
      <line x2="131" y2="108" transform="translate(902.5 571.5)" />
      <line x2="179" y2="86" transform="translate(926.5 522.5)" />
      <line y1="67" x2="119" transform="translate(870.5 655.5)" />
      <line x2="156" y2="41" transform="translate(1249.5 567.5)" />
      <line y1="94" x2="123" transform="translate(1266.5 608.5)" />
      <line x1="111" y2="43" transform="translate(1155.5 702.5)" />
      <line x1="41" y2="32" transform="translate(1397.5 571.5)" />
      <line x1="49" y2="91" transform="translate(1389.5 571.5)" />
      <line x1="177" y1="142" transform="translate(1389.5 662.5)" />
      <line x1="251" y1="74" transform="translate(1275.5 706.5)" />
      <line x2="27" y2="123" transform="translate(1405.5 304.5)" />
      <line x1="193" y2="45" transform="translate(1432.5 382.5)" />
      <line x1="41" y2="137" transform="translate(1584.5 382.5)" />
      <line x1="33" y1="89" transform="translate(1584.5 519.5)" />
      <line x1="175" y1="37" transform="translate(1442.5 571.5)" />
      <line x2="28" y2="57" transform="translate(1410.5 514.5)" />
      <line x1="140" y2="43" transform="translate(1270.5 514.5)" />
      <line y1="87" x2="22" transform="translate(1410.5 427.5)" />
      <line x2="315" y2="41" transform="translate(1117.5 393.5)" />
      <line x2="176" y2="148" transform="translate(1257 272)" />
      <line x1="182" y2="96" transform="translate(1429.5 406.5)" />
      <line x1="149" y1="17" transform="translate(1429.5 502.5)" />
    </g>
  </svg>
);

const SwordfishIcon = ({ color = '#a855f7' }) => (
  <svg
    viewBox="0 0 1323 488"
    width="24"
    height="14"
    preserveAspectRatio="xMidYMid meet"
    fill="none"
    stroke={color}
    strokeLinecap="round"
    strokeWidth="34"
  >
    <g transform="translate(-269 -234)">
      <line x2="806" y2="98.204" transform="translate(652.5 417.296)" />
      <line x1="122" y2="74.204" transform="translate(530.5 417.296)" />
      <line y1="24" x2="243" transform="translate(287.5 491.5)" />
      <line x2="175" y2="49" transform="translate(403.5 504.5)" />
      <line y1="23" x2="69" transform="translate(437.5 540.5)" />
      <line x2="247" y2="63" transform="translate(437.5 563.5)" />
      <line x1="132" y1="8" transform="translate(684.5 626.5)" />
      <line y1="20" x2="239" transform="translate(816.5 614.5)" />
      <line x1="339" y2="86" transform="translate(1055.5 528.5)" />
      <line x1="126" y1="45" transform="translate(1055.5 614.5)" />
      <line x1="14" y1="29" transform="translate(1167.5 630.5)" />
      <line x1="48" y2="49" transform="translate(1167.5 581.5)" />
      <line x2="62" y2="10" transform="translate(1215.5 581.5)" />
      <line x1="68" y2="45" transform="translate(1277.5 546.5)" />
      <line y1="48" x2="141" transform="translate(1317.5 515.5)" />
      <line x1="104" y1="182" transform="translate(1463.5 515.5)" />
      <line x1="196" y1="151" transform="translate(1371.5 546.5)" />
      <line x1="104" y2="204" transform="translate(1463.5 311.5)" />
      <line x1="81" y2="45" transform="translate(1486.5 311.5)" />
      <line y1="133" x2="119" transform="translate(1367.5 356.5)" />
      <line y1="81" x2="140" transform="translate(1375.5 408.5)" />
      <line x1="73" y1="11" transform="translate(1302.5 466.5)" />
      <line x2="37" y2="26" transform="translate(1265.5 440.5)" />
      <line x1="50" y2="32" transform="translate(1215.5 440.5)" />
      <line x2="395" y2="76" transform="translate(840.5 380.5)" />
      <line x1="51" y1="48" transform="translate(789.5 332.5)" />
      <line x1="4" y2="75" transform="translate(789.5 257.5)" />
      <line x1="82" y2="58" transform="translate(711.5 257.5)" />
      <line y1="93" x2="54" transform="translate(657.5 315.5)" />
      <line y1="73" x2="117" transform="translate(669.5 335.5)" />
      <line y1="37" x2="144" transform="translate(716.5 386.5)" />
      <line x2="71" y2="106" transform="translate(657.5 423.5)" />
      <line x1="49" y2="9" transform="translate(728.5 520.5)" />
      <line y1="80" x2="14" transform="translate(777.5 440.5)" />
      <line x1="180" y1="106" transform="translate(791.5 440.5)" />
      <line y1="26" x2="378" transform="translate(971.5 520.5)" />
      <line y1="53" x2="204" transform="translate(956.5 480.5)" />
      <line x2="143" y2="67" transform="translate(912.5 539.5)" />
      <line x1="142" y1="19" transform="translate(770.5 520.5)" />
      <line x1="135" y2="45" transform="translate(777.5 546.5)" />
      <line x2="77" transform="translate(700.5 591.5)" />
      <line y1="83" x2="39" transform="translate(684.5 539.5)" />
    </g>
  </svg>
);

const SharkIcon = ({ color = '#64748b' }) => (
  <svg
    viewBox="0 0 1485 621"
    width="24"
    height="14"
    preserveAspectRatio="xMidYMid meet"
    fill="none"
    stroke={color}
    strokeLinecap="round"
    strokeWidth="36"
  >
    <g transform="translate(-180 -155)">
      <line x2="366" y2="69" transform="translate(902.5 329.5)" />
      <line x1="39" y1="37" transform="translate(886.5 292.5)" />
      <line x2="24" y2="113" transform="translate(862.5 179.5)" />
      <line x1="54" y2="35" transform="translate(808.5 179.5)" />
      <line y1="91" x2="72" transform="translate(736.5 214.5)" />
      <line x2="166" y2="24" transform="translate(736.5 305.5)" />
      <line x1="342" y2="42" transform="translate(394.5 305.5)" />
      <line y1="51" x2="189" transform="translate(205.5 347.5)" />
      <line x2="56" y2="72" transform="translate(205.5 398.5)" />
      <line x1="579" y1="85" transform="translate(261.5 470.5)" />
      <line y1="75" x2="600" transform="translate(840.5 480.5)" />
      <line x1="116" y2="66" transform="translate(1440.5 414.5)" />
      <line y1="217" x2="71" transform="translate(1556.5 197.5)" />
      <line y1="68" x2="105" transform="translate(1522.5 197.5)" />
      <line x1="114" y2="140" transform="translate(1408.5 265.5)" />
      <line x2="140" y2="7" transform="translate(1268.5 398.5)" />
      <line x1="153" y1="69" transform="translate(1408.5 405.5)" />
      <line x2="78" y2="113" transform="translate(1561.5 474.5)" />
      <line x2="136" y2="43" transform="translate(1503.5 544.5)" />
      <line x1="83" y1="59" transform="translate(1420.5 485.5)" />
      <line y1="111" x2="335" transform="translate(1085.5 485.5)" />
      <line x1="334" y2="20" transform="translate(751.5 596.5)" />
      <line x2="10" y2="185" transform="translate(746.5 551.5)" />
      <line x1="141" y1="61" transform="translate(649.5 690.5)" />
      <line x2="67" y2="161" transform="translate(582.5 529.5)" />
      <line x1="316" y1="93" transform="translate(300.5 523.5)" />
      <line x1="30" y2="33" transform="translate(300.5 490.5)" />
      <line y1="44" x2="164" transform="translate(330.5 446.5)" />
      <line x1="122" y2="18" transform="translate(494.5 428.5)" />
      <line x2="163" y2="6" transform="translate(616.5 428.5)" />
      <line x1="340" y1="73" transform="translate(779.5 434.5)" />
      <line y1="98" x2="149" transform="translate(1119.5 409.5)" />
      <line x2="64" y2="111" transform="translate(784.5 616.5)" />
      <line x2="92" y2="16" transform="translate(756.5 711.5)" />
      <line x1="83" y2="81" transform="translate(835.5 470.5)" />
      <line x1="12" y1="123" transform="translate(906.5 347.5)" />
      <line x1="201" y1="151" transform="translate(918.5 343.5)" />
      <line y1="115" x2="51" transform="translate(1095.5 375.5)" />
      <line y1="40" x2="354" transform="translate(1095.5 440.5)" />
      <line y2="169" transform="translate(1522.5 265.5)" />
      <line x2="5" y2="51" transform="translate(1556.5 419.5)" />
      <line x1="218" y2="172" transform="translate(673.5 343.5)" />
      <line x1="94" y2="76.5" transform="translate(533.5 428.5)" />
      <line x1="72" y1="99" transform="translate(555.5 329.5)" />
      <line x1="72" y1="99" transform="translate(700.5 326)" />
      <line x1="132" y1="143" transform="translate(401.5 347.5)" />
      <line x1="154" y1="78" transform="translate(240.5 393.5)" />
      <line x2="79" y2="32" transform="translate(1074.5 600.5)" />
      <line y2="53" transform="translate(1153.5 579.5)" />
      <line x2="22" y2="49" transform="translate(1131.5 583.5)" />
    </g>
  </svg>
);

const OrcaIcon = ({ color = '#06b6d4' }) => (
  <svg
    viewBox="0 0 1186 606"
    width="24"
    height="14"
    preserveAspectRatio="xMidYMid meet"
    fill="none"
    stroke={color}
    strokeLinecap="round"
    strokeWidth="34"
  >
    <g transform="translate(-432 -170)">
      <line y1="69" x2="301" transform="translate(498.5 400.5)" />
      <line x1="43" y2="51" transform="translate(455.5 469.5)" />
      <line x1="15" y1="39" transform="translate(455.5 520.5)" />
      <line x2="183" y2="72" transform="translate(470.5 559.5)" />
      <line x2="20" y2="88" transform="translate(646.5 577.5)" />
      <line x1="42" y1="41" transform="translate(604.5 536.5)" />
      <line y1="4" x2="134" transform="translate(470.5 536.5)" />
      <line x1="126" y2="53" transform="translate(604.5 483.5)" />
      <line y1="66" x2="22" transform="translate(730.5 417.5)" />
      <line x2="398" y2="37" transform="translate(739.5 469.5)" />
      <line x2="51" y2="86" transform="translate(730.5 480.5)" />
      <line y1="8" x2="125" transform="translate(656.5 566.5)" />
      <line x1="59" y1="44" transform="translate(781.5 566.5)" />
      <line x2="11" y2="101" transform="translate(840.5 610.5)" />
      <line y1="40" x2="35" transform="translate(816.5 711.5)" />
      <line x1="72" transform="translate(744.5 751.5)" />
      <line x2="74" y2="77" transform="translate(670.5 674.5)" />
      <line x1="139" y2="19" transform="translate(799.5 381.5)" />
      <line y1="95" x2="97" transform="translate(938.5 286.5)" />
      <line x2="8" y2="92" transform="translate(1027.5 194.5)" />
      <line x1="60" y2="57" transform="translate(967.5 194.5)" />
      <line y1="117" x2="40" transform="translate(927.5 251.5)" />
      <line x2="164" y2="16" transform="translate(914.5 384.5)" />
      <line x2="43" y2="117" transform="translate(1035.5 283.5)" />
      <line x1="237" y1="88" transform="translate(1078.5 400.5)" />
      <line x2="154" y2="87" transform="translate(1315.5 488.5)" />
      <line x1="59" y1="79" transform="translate(1469.5 575.5)" />
      <line x2="79" y2="5" transform="translate(1518.5 641.5)" />
      <line y1="106" x2="21" transform="translate(1576.5 646.5)" />
      <line x1="113" y1="68" transform="translate(1463.5 684.5)" />
      <line x1="51" y2="38" transform="translate(1463.5 646.5)" />
      <line x1="94" y1="7" transform="translate(1489.5 665.5)" />
      <line x1="365" y1="148" transform="translate(1140.5 506.5)" />
      <line y1="36" x2="55" transform="translate(1414.5 575.5)" />
      <line x2="14" y2="69" transform="translate(1406.5 611.5)" />
      <line x1="49" y1="4" transform="translate(1420.5 680.5)" />
      <line x2="17" y2="80" transform="translate(1306.5 488.5)" />
      <line y1="61" x2="59" transform="translate(1264.5 580.5)" />
      <line x1="62" y1="103" transform="translate(1078.5 400.5)" />
      <line x1="11" y2="62" transform="translate(1129.5 510.5)" />
      <line x1="40" y2="105" transform="translate(978.5 506.5)" />
      <line x1="207" y1="95" transform="translate(811.5 402.5)" />
      <line x1="119" y2="111" transform="translate(837.5 488.5)" />
      <line x2="233" y2="98" transform="translate(1131.5 572.5)" />
      <line x1="56" y1="10" transform="translate(1364.5 670.5)" />
      <line x1="285" y2="20" transform="translate(1011.5 646.5)" />
      <line x1="97" y1="24" transform="translate(1267.5 646.5)" />
      <line x2="160" y2="8" transform="translate(851.5 658.5)" />
      <line y1="3" x2="120" transform="translate(858.5 611.5)" />
      <line x1="157" y2="45" transform="translate(978.5 566.5)" />
    </g>
  </svg>
);

const WhaleIcon = ({ color = '#22c55e' }) => (
  <svg
    viewBox="0 0 1330 628"
    width="24"
    height="14"
    preserveAspectRatio="xMidYMid meet"
    fill="none"
    stroke={color}
    strokeLinecap="round"
    strokeWidth="32"
  >
    <g transform="translate(-313 -144)">
      <line x2="512" y2="100" transform="translate(570.5 371.5)" />
      <line x1="230" y2="44" transform="translate(1082.5 427.5)" />
      <line y1="93" x2="95" transform="translate(1303.5 328.5)" />
      <line x2="15" y2="67" transform="translate(1383.5 261.5)" />
      <line x1="86" y1="95" transform="translate(1297.5 166.5)" />
      <line x1="43" y1="205" transform="translate(1297.5 166.5)" />
      <line x1="101" y1="18" transform="translate(1398.5 328.5)" />
      <line x2="19" transform="translate(1499.5 346.5)" />
      <line x1="103" y1="44" transform="translate(1518.5 346.5)" />
      <line x1="240" y2="51" transform="translate(1381.5 390.5)" />
      <line x2="94" y2="5" transform="translate(1297.5 432.5)" />
      <line y1="74" x2="83" transform="translate(1312.5 441.5)" />
      <line x1="167" y1="46" transform="translate(1154.5 461.5)" />
      <line x1="389" y2="204" transform="translate(923.5 515.5)" />
      <line x1="428" y2="136" transform="translate(884.5 515.5)" />
      <line x1="17" y1="54" transform="translate(878.5 651.5)" />
      <line x2="62" y2="44" transform="translate(895.5 705.5)" />
      <line y1="3" x2="131" transform="translate(826.5 749.5)" />
      <line x2="128" transform="translate(694.5 745.5)" />
      <line x2="110" y2="108" transform="translate(712.5 637.5)" />
      <line x1="104" y1="137" transform="translate(608.5 500.5)" />
      <line x1="197" y2="61" transform="translate(895.5 628.5)" />
      <line y1="114" x2="15" transform="translate(1067.5 474.5)" />
      <line x1="248" y1="3" transform="translate(819.5 585.5)" />
      <line x1="54" y1="60" transform="translate(819.5 585.5)" />
      <line x2="207" y2="85" transform="translate(612.5 500.5)" />
      <line y1="61" x2="283" transform="translate(612.5 439.5)" />
      <line x1="115" y2="7" transform="translate(497.5 500.5)" />
      <line x2="163" y2="74" transform="translate(334.5 433.5)" />
      <line y1="56" x2="107" transform="translate(334.5 377.5)" />
      <line x1="129" y2="6" transform="translate(441.5 371.5)" />
      <line x2="21" y2="67" transform="translate(334.5 433.5)" />
      <line x1="147" y1="165" transform="translate(355.5 500.5)" />
      <line x2="192" y2="80" transform="translate(502.5 665.5)" />
      <line x2="192" y2="8" transform="translate(588.5 697.5)" />
      <line x1="206" y1="235" transform="translate(388.5 462.5)" />
      <line x1="130" y1="138" transform="translate(491.5 507.5)" />
      <line x2="102" y2="14" transform="translate(621.5 645.5)" />
      <line x2="53" y2="6" transform="translate(612.5 574.5)" />
      <line x1="50" y1="56" transform="translate(562.5 518.5)" />
      <line x1="43" y1="49" transform="translate(605.5 507.5)" />
    </g>
  </svg>
);

// Sea creature tier config
const TIER_CONFIG = [
  { max: 100, Icon: ShrimpIcon, color: '#f97316', name: 'Shrimp' },
  { max: 500, Icon: FishIcon, color: '#3b82f6', name: 'Fish' },
  { max: 2000, Icon: SwordfishIcon, color: '#a855f7', name: 'Swordfish' },
  { max: 5000, Icon: SharkIcon, color: '#64748b', name: 'Shark' },
  { max: 20000, Icon: OrcaIcon, color: '#06b6d4', name: 'Orca' },
  { max: Infinity, Icon: WhaleIcon, color: '#22c55e', name: 'Whale' }
];

const TierIcon = ({ xrpValue, isDark }) => {
  const tier = TIER_CONFIG.find((t) => xrpValue < t.max) || TIER_CONFIG[5];
  const IconComponent = tier.Icon;
  return (
    <span
      className={cn(
        'inline-flex items-center justify-center w-[28px] h-[18px] rounded-[4px] border',
        isDark ? 'border-white/[0.08] bg-white/[0.025]' : 'border-black/[0.06] bg-black/[0.015]'
      )}
    >
      <IconComponent color={tier.color} />
    </span>
  );
};

// Tier tooltip component
const TierHelpIcon = ({ isDark }) => (
  <span
    className={cn('relative inline-flex ml-1 cursor-help', 'tier-help')}
  >
    <span
      className={cn(
        'text-[9px] w-[12px] h-[12px] rounded-full border inline-flex items-center justify-center',
        isDark ? 'border-white/30 text-white/40' : 'border-black/30 text-black/40'
      )}
    >
      ?
    </span>
    <span
      className={cn(
        'tier-tooltip absolute bottom-[18px] left-1/2 -translate-x-1/2 rounded-[6px] py-2 px-[10px] text-[10px] whitespace-nowrap opacity-0 invisible transition-[opacity,visibility] duration-150 z-[100] shadow-[0_2px_8px_rgba(0,0,0,0.15)] leading-[1.5] border',
        isDark ? 'bg-[#1a1a1a] border-white/15 text-white/80' : 'bg-white border-black/10 text-black/80'
      )}
    >
      &lt;100 · 100-500 · 500-2K
      <br />
      2K-5K · 5K-20K · 20K+ XRP
    </span>
    <style>{`.tier-help:hover .tier-tooltip { opacity: 1 !important; visibility: visible !important; }`}</style>
  </span>
);

// Define the highlight animation with softer colors
const highlightAnimation = (isDark) => `
  @keyframes highlight {
    0% {
      background-color: ${isDark ? 'rgba(20, 125, 254, 0.08)' : 'rgba(20, 125, 254, 0.08)'};
    }
    50% {
      background-color: ${isDark ? 'rgba(20, 125, 254, 0.04)' : 'rgba(20, 125, 254, 0.04)'};
    }
    100% {
      background-color: transparent;
    }
  }
`;

// Styled components with improved design
const LiveIndicator = ({ isDark, className, children, ...p }) => (
  <div
    className={cn('inline-flex items-center gap-[5px] py-[3px] px-2 rounded-[20px] border', isDark ? 'bg-green-500/[0.08] border-green-500/[0.15]' : 'bg-green-500/[0.05] border-green-500/10', className)}
    {...p}
  >{children}</div>
);

const LiveCircle = ({ className, ...p }) => (
  <div
    className={cn('w-[6px] h-[6px] rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] animate-pulse', className)}
    {...p}
  />
);

const Card = ({ isDark, isNew, className, children, ...p }) => (
  <div
    className={cn(
      'bg-transparent border-b relative transition-all duration-200 last:border-b-0',
      'max-sm:px-3',
      isDark ? 'border-white/[0.05] hover:bg-white/[0.03]' : 'border-black/[0.04] hover:bg-black/[0.02]',
      className
    )}
    style={isNew ? { animation: 'highlight 0.8s ease-out' } : undefined}
    {...p}
  >
    {isNew && <style>{highlightAnimation(isDark)}</style>}
    {children}
  </div>
);

const CardContent = ({ className, children, ...p }) => (
  <div className={cn('py-2 max-sm:py-3', className)} {...p}>{children}</div>
);

const TradeTypeChip = ({ tradetype, className, children, ...p }) => (
  <div
    className={cn('text-[11px] font-medium w-9 max-sm:text-xs max-sm:w-10', tradetype === 'BUY' ? 'text-green-500' : 'text-red-500', className)}
    {...p}
  >{children}</div>
);

const VolumeIndicator = ({ volume, isDark, className, ...p }) => (
  <div
    className={cn('absolute left-0 top-0 h-full transition-[width] duration-200', isDark ? 'bg-white/[0.04]' : 'bg-black/[0.03]', className)}
    style={{ width: `${volume}%` }}
    {...p}
  />
);

// Bar cell for showing colored bars behind values
const BarCell = ({ barWidth, isCreate, isLP, isBuy, isDark, className, children, ...p }) => {
  const w = Math.min(100, Math.max(8, barWidth || 0));
  const bg = isCreate
    ? (isDark ? 'linear-gradient(90deg, rgba(20,184,166,0.15) 0%, rgba(20,184,166,0.05) 100%)' : 'linear-gradient(90deg, rgba(20,184,166,0.10) 0%, rgba(20,184,166,0.03) 100%)')
    : isLP
      ? (isDark ? 'linear-gradient(90deg, rgba(139,92,246,0.15) 0%, rgba(139,92,246,0.05) 100%)' : 'linear-gradient(90deg, rgba(139,92,246,0.10) 0%, rgba(139,92,246,0.03) 100%)')
      : isBuy
        ? (isDark ? 'linear-gradient(90deg, rgba(34,197,94,0.18) 0%, rgba(34,197,94,0.05) 100%)' : 'linear-gradient(90deg, rgba(34,197,94,0.12) 0%, rgba(34,197,94,0.03) 100%)')
        : (isDark ? 'linear-gradient(90deg, rgba(239,68,68,0.18) 0%, rgba(239,68,68,0.05) 100%)' : 'linear-gradient(90deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.03) 100%)');
  const borderLeftColor = isCreate ? 'rgba(20,184,166,0.6)' : isLP ? 'rgba(139,92,246,0.6)' : isBuy ? (isDark ? '#22c55e' : '#16a34a') : (isDark ? '#ef4444' : '#dc2626');
  return (
    <div className={cn('relative flex items-center h-7 px-[10px] rounded-[6px] overflow-hidden [&>span]:relative [&>span]:z-[1] [&>span]:font-medium', className)} {...p}>
      <div
        className="absolute left-0 top-1/2 -translate-y-1/2 h-[80%] rounded-sm"
        style={{ width: `${w}%`, background: bg, borderLeft: `3px solid ${borderLeftColor}`, transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)' }}
      />
      {children}
    </div>
  );
};

const RefreshIcon = ({ isDark, className, children, ...p }) => (
  <button
    className={cn('bg-transparent border-none p-1 cursor-pointer flex items-center justify-center transition-[color] duration-150 hover:text-blue-500', isDark ? 'text-white/40' : 'text-black/40', className)}
    {...p}
  >{children}</button>
);

const Pagination = ({ className, children, ...p }) => (
  <div className={cn('flex items-center justify-center gap-px', className)} {...p}>{children}</div>
);

const PaginationButton = ({ isDark, className, children, ...p }) => (
  <button
    className={cn(
      'flex items-center justify-center rounded-lg p-[6px] cursor-pointer border transition-all duration-200',
      'hover:enabled:text-blue-500 hover:enabled:border-blue-500/40',
      'disabled:opacity-25 disabled:cursor-default',
      isDark ? 'text-white/45 bg-white/[0.03] border-white/[0.08] hover:enabled:bg-white/[0.08]' : 'text-black/45 bg-black/[0.03] border-black/[0.08] hover:enabled:bg-black/[0.06]',
      className
    )}
    {...p}
  >{children}</button>
);

const PageInfo = ({ isDark, className, children, ...p }) => (
  <span className={cn('text-[11px] px-[6px] whitespace-nowrap', isDark ? 'text-white/50' : 'text-black/50', className)} {...p}>{children}</span>
);

const Table = ({ isDark, className, children, ...p }) => (
  <table className={cn('w-full border-collapse', isDark ? 'text-white' : 'text-[#212B36]', className)} {...p}>{children}</table>
);

const TableHeader = ({ isDark, className, children, ...p }) => (
  <div
    className={cn(
      'flex py-2 border-b',
      isDark ? 'border-white/[0.06] [&>div]:text-white/[0.35]' : 'border-black/[0.06] [&>div]:text-black/40',
      '[&>div]:text-[9px] [&>div]:font-normal [&>div]:uppercase [&>div]:tracking-[0.04em]',
      className
    )}
    {...p}
  >{children}</div>
);

const TableHead = ({ className, children, ...p }) => <thead className={className} {...p}>{children}</thead>;
const TableBody = ({ className, children, ...p }) => <tbody className={className} {...p}>{children}</tbody>;

const TableRow = ({ isDark, className, children, ...p }) => (
  <tr
    className={cn('border-b', isDark ? 'hover:bg-white/[0.02] border-white/[0.05]' : 'hover:bg-black/[0.015] border-black/[0.05]', className)}
    {...p}
  >{children}</tr>
);

const TableCell = ({ size, align, fontWeight, opacity, textTransform, className, children, ...p }) => (
  <td
    className={cn('p-3', className)}
    style={{ fontSize: size === 'small' ? '13px' : '14px', textAlign: align || 'left', fontWeight: fontWeight || 400, opacity: opacity || 1, textTransform: textTransform || 'none' }}
    {...p}
  >{children}</td>
);

const TableContainer = ({ isDark, className, children, ...p }) => (
  <div
    className={cn('rounded-xl border-[1.5px] overflow-auto bg-transparent', isDark ? 'border-white/10' : 'border-black/[0.06]', className)}
    {...p}
  >{children}</div>
);

const Link = ({ isDark, className, children, ...p }) => (
  <a className={cn('no-underline text-[11px] hover:text-blue-500', isDark ? 'text-white/50' : 'text-black/50', className)} {...p}>{children}</a>
);

const Tooltip = ({ title, children, arrow }) => {
  const [show, setShow] = useState(false);
  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 py-1 px-2 bg-black/90 text-white rounded-[4px] text-[12px] whitespace-pre-line z-[1000] mb-1"
        >
          {title}
        </div>
      )}
    </div>
  );
};

const IconButton = ({ isDark, className, children, ...p }) => (
  <button
    className={cn('p-1 bg-transparent border-none rounded-lg cursor-pointer inline-flex items-center justify-center transition-[color] duration-150 hover:text-blue-500', isDark ? 'text-white/40' : 'text-black/40', className)}
    {...p}
  >{children}</button>
);

const FormControlLabel = ({ isDark, className, children, ...p }) => (
  <label
    className={cn('flex items-center gap-2 text-[13px] font-normal cursor-pointer', isDark ? 'text-white/90' : 'text-black/90', className)}
    {...p}
  >{children}</label>
);

const Tabs = ({ className, children, ...p }) => (
  <div className={cn('flex gap-2 mb-3 max-sm:w-full max-sm:gap-[6px]', className)} {...p}>{children}</div>
);

const Tab = ({ selected, isDark, className, children, ...p }) => (
  <button
    className={cn(
      'inline-flex items-center justify-center gap-2 text-xs font-medium tracking-[0.05em] py-[10px] px-4 bg-transparent border rounded-[6px] cursor-pointer transition-all duration-150 whitespace-nowrap shrink-0 uppercase',
      'max-sm:flex-1 max-sm:py-2 max-sm:px-1 max-sm:text-[10px] max-sm:gap-[3px] max-sm:[&_svg]:w-[14px] max-sm:[&_svg]:h-[14px]',
      selected
        ? isDark ? 'border-white/20 text-white' : 'border-black/20 text-[#1a1a1a]'
        : isDark ? 'border-white/10 text-white/40' : 'border-black/10 text-black/40',
      !selected && (isDark ? 'hover:enabled:border-white/[0.15] hover:enabled:text-white/70' : 'hover:enabled:border-black/[0.15] hover:enabled:text-black/60'),
      !selected && 'max-sm:[&>span]:hidden',
      className
    )}
    {...p}
  >{children}</button>
);

const Button = ({ size, isDark, className, children, ...p }) => (
  <button
    className={cn(
      'text-[11px] font-normal rounded-[6px] border bg-transparent cursor-pointer inline-flex items-center gap-1 transition-all duration-150',
      isDark ? 'border-white/10 text-white/60 hover:border-white/25 hover:text-white/90' : 'border-black/[0.08] text-black/60 hover:border-black/25 hover:text-black/80',
      className
    )}
    style={{ padding: size === 'small' ? '4px 10px' : '6px 12px' }}
    {...p}
  >{children}</button>
);

const Dialog = ({ open, className, children, ...p }) => (
  <div
    className={cn('fixed inset-0 w-screen h-screen bg-black/40 backdrop-blur-[4px] items-center justify-center z-[99999] p-4 box-border', open ? 'flex' : 'hidden', className)}
    {...p}
  >{children}</div>
);

const DialogPaper = ({ isDark, className, children, ...p }) => (
  <div
    className={cn('border rounded-[14px] max-w-[420px] w-[90%] max-h-[calc(100vh-32px)] overflow-auto mx-auto', isDark ? 'bg-[#0a0a0a] border-white/10' : 'bg-white border-black/10', className)}
    {...p}
  >{children}</div>
);

const DialogTitle = ({ isDark, className, children, ...p }) => (
  <div
    className={cn('flex justify-between items-center py-4 px-5 text-[15px] font-semibold border-b', isDark ? 'text-white border-white/[0.06]' : 'text-[#1a1a1a] border-black/[0.06]', className)}
    {...p}
  >{children}</div>
);

const DialogContent = ({ isDark, className, children, ...p }) => (
  <div className={cn('pt-4 px-5 pb-5', isDark ? 'text-white' : 'text-[#1a1a1a]', className)} {...p}>{children}</div>
);

const TextField = ({ isDark, className, ...p }) => (
  <input
    className={cn(
      'w-full py-3 px-[14px] text-sm border-[1.5px] rounded-[10px] box-border transition-[border-color] duration-150 focus:outline-none focus:border-blue-500',
      isDark ? 'border-white/10 bg-white/[0.04] text-white placeholder:text-white/25' : 'border-black/10 bg-black/[0.02] text-[#1a1a1a] placeholder:text-black/[0.35]',
      className
    )}
    {...p}
  />
);

const FormControl = ({ className, children, ...p }) => (
  <div className={cn('flex flex-col gap-[6px]', className)} {...p}>{children}</div>
);

const RadioGroup = ({ className, children, ...p }) => (
  <div className={cn('flex flex-col gap-[6px]', className)} {...p}>{children}</div>
);

const Radio = ({ className, ...p }) => (
  <input className={cn('w-[14px] h-[14px] cursor-pointer accent-blue-500', className)} {...p} />
);

// Helper functions
const formatRelativeTime = (timestamp, includeAgo = false) => {
  const now = Date.now();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);
  const ago = includeAgo ? ' ago' : '';

  if (diffInSeconds < 0) {
    return 'now';
  } else if (diffInSeconds < 60) {
    return diffInSeconds === 0 ? 'now' : `${diffInSeconds}s${ago}`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}m${ago}`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h${ago}`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}d${ago}`;
  }
};

// Wallet tier indicator - returns XRP value for TierIcon
const getTradeSizeInfo = (value) => parseFloat(value) || 0;

const formatTradeValue = (value) => {
  const numValue = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(numValue) || numValue === 0) return '0';

  if (Math.abs(numValue) < 0.01) {
    const str = Math.abs(numValue).toFixed(15);
    const zeros = str.match(/0\.0*/)?.[0]?.length - 2 || 0;
    if (zeros >= 4) {
      const significant = str.replace(/^0\.0+/, '').replace(/0+$/, '');
      return { compact: true, zeros, significant: significant.slice(0, 4) };
    }
    return numValue.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
  }

  if (Math.abs(numValue) < 1) return numValue.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  return abbreviateNumber(numValue);
};

const formatXRPAmount = (value) => {
  const numValue = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(numValue)) return '-';
  if (Math.abs(numValue) < 0.01) return numValue.toFixed(4);
  if (Math.abs(numValue) < 1) return numValue.toFixed(4);
  if (Math.abs(numValue) < 100) return numValue.toFixed(2);
  return abbreviateNumber(numValue);
};

const formatPriceValue = (value) => {
  if (value == null || !Number.isFinite(value)) return '-';
  const numValue = typeof value === 'string' ? Number(value) : value;
  if (!Number.isFinite(numValue) || numValue === 0) return '0';

  if (Math.abs(numValue) < 0.01) {
    const str = Math.abs(numValue).toFixed(15);
    const zeros = str.match(/0\.0*/)?.[0]?.length - 2 || 0;
    if (zeros >= 4) {
      const significant = str.replace(/^0\.0+/, '').replace(/0+$/, '');
      return { compact: true, zeros, significant: significant.slice(0, 4) };
    }
    return numValue.toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
  }
  if (Math.abs(numValue) < 1) return numValue.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  if (Math.abs(numValue) < 100) return numValue.toFixed(2);
  if (numValue >= 1e6) return `${(numValue / 1e6).toFixed(1)}M`;
  if (numValue >= 1e3) return `${(numValue / 1e3).toFixed(1)}K`;
  return Math.round(numValue).toString();
};

// Render helpers for compact notation
const formatPrice = (value) => {
  const f = formatPriceValue(value);
  if (f?.compact)
    return (
      <>
        0.0<sub className="text-[0.6em]">{f.zeros}</sub>
        {f.significant}
      </>
    );
  return f;
};

const formatTradeDisplay = (value) => {
  const f = formatTradeValue(value);
  if (f?.compact)
    return (
      <>
        0.0<sub className="text-[0.6em]">{f.zeros}</sub>
        {f.significant}
      </>
    );
  return f;
};

const abbreviateNumber = (num) => {
  if (Math.abs(num) < 1000) return num.toFixed(1);
  const suffixes = ['', 'k', 'M', 'B', 'T'];
  const magnitude = Math.floor(Math.log10(Math.abs(num)) / 3);
  const scaled = num / Math.pow(10, magnitude * 3);
  return scaled.toFixed(2).replace(/\.?0+$/, '') + suffixes[magnitude];
};

const getXRPAmount = (trade) => {
  const xrpValue =
    trade.paid.currency === 'XRP'
      ? parseValue(trade.paid.value)
      : trade.got.currency === 'XRP'
        ? parseValue(trade.got.value)
        : 0;
  return xrpValue;
};

const parseValue = (value) => {
  if (typeof value === 'string' && value.includes('e')) {
    return parseFloat(Number(value).toFixed(8));
  }
  return parseFloat(value);
};

const SubTab = ({ selected, isDark, className, children, ...p }) => (
  <button
    className={cn(
      'text-[11px] font-semibold py-2 px-4 border-none cursor-pointer uppercase tracking-[0.05em] rounded-lg transition-all duration-200',
      'max-sm:py-[6px] max-sm:px-[10px] max-sm:text-[10px] max-sm:flex-1',
      selected
        ? isDark ? 'bg-white/[0.08] text-white' : 'bg-black/[0.05] text-[#1a1a1a]'
        : isDark ? 'bg-transparent text-white/40' : 'bg-transparent text-black/50',
      isDark ? 'hover:bg-white/[0.04] hover:text-white/80' : 'hover:bg-black/[0.03] hover:text-black/70',
      className
    )}
    {...p}
  >{children}</button>
);

const StatGrid = ({ isDark, className, children, ...p }) => (
  <div
    className={cn('grid grid-cols-2 gap-px border rounded-xl overflow-hidden', isDark ? 'bg-white/[0.06] border-white/[0.06]' : 'bg-black/[0.06] border-black/[0.06]', className)}
    {...p}
  >{children}</div>
);

const StatItem = ({ isDark, className, children, ...p }) => (
  <div className={cn('py-3 px-4 flex flex-col gap-1', isDark ? 'bg-[#0d0d0d]' : 'bg-white', className)} {...p}>{children}</div>
);

const Label = ({ isDark, className, children, ...p }) => (
  <span className={cn('text-[10px] font-medium uppercase tracking-[0.05em]', isDark ? 'text-white/40' : 'text-black/40', className)} {...p}>{children}</span>
);

const Value = ({ isDark, className, children, ...p }) => (
  <div className={cn('text-[15px] font-semibold flex items-baseline gap-1', isDark ? 'text-white' : 'text-[#1a1a1a]', className)} {...p}>{children}</div>
);

const OfferCard = ({ isDark, className, children, ...p }) => (
  <div
    className={cn('border rounded-xl p-3 transition-all duration-200', isDark ? 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.03]' : 'bg-black/[0.01] border-black/[0.06] hover:border-black/[0.12] hover:bg-black/[0.02]', className)}
    {...p}
  >{children}</div>
);

const CancelButton = ({ isDark, className, children, ...p }) => (
  <button
    className={cn('text-[10px] font-semibold py-[6px] px-3 bg-transparent border rounded-[6px] text-red-500 cursor-pointer uppercase tracking-[0.02em] transition-all duration-200 hover:bg-red-500/[0.08] hover:border-red-500', isDark ? 'border-red-500/20' : 'border-red-500/30', className)}
    {...p}
  >{children}</button>
);

// My Activity Tab Component - Shows user's trading history and open offers
const MyActivityTab = memo(({ token, isDark, isMobile, onTransactionClick }) => {
  const { accountProfile } = useContext(WalletContext);
  const [activeSubTab, setActiveSubTab] = useState('assets'); // 'assets', 'history', or 'offers'
  const [loading, setLoading] = useState(false);
  const [openOffers, setOpenOffers] = useState([]);
  const [offersTotal, setOffersTotal] = useState(0);
  const [offersPage, setOffersPage] = useState(0);
  const offersLimit = 10;

  // Real assets data from trustlines API
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [tokenAssets, setTokenAssets] = useState(null);

  // Real trading history from history API
  const [tradesLoading, setTradesLoading] = useState(false);
  const [myTrades, setMyTrades] = useState([]);
  const [tradesHasMore, setTradesHasMore] = useState(false);
  const [tradesCursor, setTradesCursor] = useState(null);
  const [tradesInitialized, setTradesInitialized] = useState(false);

  // Fetch open offers from API with md5 filter
  const fetchOpenOffers = useCallback(async () => {
    const account = accountProfile?.account || accountProfile?.address;
    if (!account || !token?.md5) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        md5: token.md5,
        page: offersPage.toString(),
        limit: offersLimit.toString()
      });
      const offersUrl = `https://api.xrpl.to/api/account/offers/${account}?${params}`;
      const res = await api.get(offersUrl);
      if (res.data?.success) {
        setOpenOffers(res.data.offers || []);
        setOffersTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error('[TradingHistory] Offers error:', err.message);
    } finally {
      setLoading(false);
    }
  }, [accountProfile, token?.md5, offersPage]);

  useEffect(() => {
    if (activeSubTab === 'offers') {
      fetchOpenOffers();
    }
  }, [activeSubTab, fetchOpenOffers]);

  // Fetch user's token stats from dedicated endpoint
  const fetchTokenAssets = useCallback(async () => {
    const account = accountProfile?.account || accountProfile?.address;
    if (!account || !token?.md5) return;

    setAssetsLoading(true);
    try {
      const statsUrl = `https://api.xrpl.to/api/account/token-stats/${account}/${token.md5}`;
      const res = await api.get(statsUrl);
      const stats = res.data;
      if (stats) {
        const balance = Math.abs(stats.balance) || 0;
        const currentPrice = token?.exch || 0;
        const totalValue = balance * currentPrice;
        const avgBuyPrice = stats.avgBuyPrice || null;
        const realizedPnl = stats.realizedPnl || 0;
        const unrealizedPnl = stats.unrealizedPnl || 0;
        const costBasis = avgBuyPrice ? balance * avgBuyPrice : 0;
        const currentValue = balance * currentPrice;
        const pnl = costBasis > 0 ? currentValue - costBasis : null;
        const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : null;
        setTokenAssets({
          balance,
          trustlineSet: balance > 0 || stats.tradeCount > 0,
          totalValue,
          currentPrice,
          avgBuyPrice,
          pnl,
          pnlPercent,
          realizedPnl,
          unrealizedPnl,
          totalPnl: stats.totalPnl || 0,
          totalRoi: stats.totalRoi || 0,
          totalBought: stats.totalBought || 0,
          totalSold: stats.totalSold || 0,
          totalSpentXRP: stats.totalSpentXRP || 0,
          totalReceivedXRP: stats.totalReceivedXRP || 0,
          tradeCount: stats.tradeCount || 0,
          firstTradeTime: stats.firstTradeTime || null
        });
      } else {
        setTokenAssets({ balance: 0, trustlineSet: false, totalValue: 0 });
      }
    } catch (err) {
      console.error('Failed to fetch token assets:', err);
      setTokenAssets({ balance: 0, trustlineSet: false, totalValue: 0 });
    } finally {
      setAssetsLoading(false);
    }
  }, [accountProfile, token?.md5, token?.exch]);

  // Fetch user's trading history for this token with md5 filter
  const fetchMyTrades = useCallback(async (loadMore = false) => {
    const account = accountProfile?.account || accountProfile?.address;
    if (!account || !token?.md5) return;
    if (loadMore && !tradesCursor) return;

    setTradesLoading(true);
    try {
      let url = `https://api.xrpl.to/api/history?account=${account}&md5=${token.md5}&limit=20`;
      if (loadMore && tradesCursor) url += `&cursor=${tradesCursor}`;
      const res = await api.get(url);
      const trades = res.data?.data || res.data?.hists || res.data?.trades || [];
      const nextCursor = res.data?.meta?.nextCursor || res.data?.nextCursor || null;

      if (loadMore) {
        setMyTrades(prev => [...prev, ...trades]);
      } else {
        setMyTrades(trades);
        setTradesInitialized(true);
      }
      setTradesCursor(nextCursor);
      setTradesHasMore(!!nextCursor && trades.length > 0);
    } catch (err) {
      console.error('[TradingHistory] My trades error:', err.message);
    } finally {
      setTradesLoading(false);
    }
  }, [accountProfile, token?.md5, tradesCursor]);

  useEffect(() => {
    if (activeSubTab === 'assets') {
      fetchTokenAssets();
    }
  }, [activeSubTab, fetchTokenAssets]);

  useEffect(() => {
    if (activeSubTab === 'history' && !tradesInitialized) {
      fetchMyTrades(false);
    }
  }, [activeSubTab, tradesInitialized]);

  const [cancellingOffer, setCancellingOffer] = useState(null);

  const handleCancelOffer = async (offerSequence) => {
    const account = accountProfile?.account || accountProfile?.address;
    if (!account) { toast.error('Wallet not connected'); return; }

    setCancellingOffer(offerSequence);
    const toastId = toast.loading('Cancelling offer...');

    try {
      const { Wallet: XRPLWallet } = await import('xrpl');
      const { EncryptedWalletStorage, deviceFingerprint } = await import('src/utils/encryptedWalletStorage');

      const walletStorage = new EncryptedWalletStorage();
      let seed = null;

      if (accountProfile.wallet_type === 'oauth' || accountProfile.wallet_type === 'social') {
        const walletId = `${accountProfile.provider}_${accountProfile.provider_id}`;
        const storedPassword = await walletStorage.getSecureItem(`wallet_pwd_${walletId}`);
        if (storedPassword) {
          const walletData = await walletStorage.getWallet(account, storedPassword);
          seed = walletData?.seed;
        }
      } else if (accountProfile.wallet_type === 'device') {
        const deviceKeyId = await deviceFingerprint.getDeviceId();
        if (deviceKeyId) {
          const storedPassword = await walletStorage.getWalletCredential(deviceKeyId);
          if (storedPassword) {
            const walletData = await walletStorage.getWallet(account, storedPassword);
            seed = walletData?.seed;
          }
        }
      }

      if (!seed) {
        toast.error('Could not retrieve wallet credentials', { id: toastId });
        setCancellingOffer(null);
        return;
      }

      const algorithm = seed.startsWith('sEd') ? 'ed25519' : 'secp256k1';
      const deviceWallet = XRPLWallet.fromSeed(seed, { algorithm });

      const tx = {
        TransactionType: 'OfferCancel',
        Account: account,
        OfferSequence: offerSequence,
        SourceTag: 161803
      };

      const result = await submitTransaction(deviceWallet, tx);
      if (!result.success) { toast.error('Failed to cancel offer', { id: toastId }); return; }

      toast.loading('Waiting for confirmation...', { id: toastId });
      let validated = false;
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 500));
        try {
          const txRes = await api.get(`https://api.xrpl.to/v1/tx/${result.hash}`);
          if (txRes.data?.validated) { validated = true; break; }
        } catch (e) { /* continue */ }
      }

      if (validated) {
        toast.success('Offer cancelled', { id: toastId, duration: 3000 });
      } else {
        toast.success('Offer submitted', { id: toastId, description: 'Validation pending...' });
      }
      setOpenOffers(prev => prev.filter(o => o.seq !== offerSequence));
      setOffersTotal(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('[TradingHistory] Cancel offer error:', err);
      toast.error(err.message || 'Failed to cancel offer', { id: toastId });
    } finally {
      setCancellingOffer(null);
    }
  };

  const tokenCurrency = token ? (token.currency ? decodeCurrency(token.currency) : token.name || 'MPT') : 'TOKEN';

  // Empty state when not connected
  const notConnectedState = (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-8 px-6 rounded-[12px] border border-dashed',
        isDark ? 'border-white/10 bg-white/[0.01]' : 'border-black/10 bg-black/[0.01]'
      )}
    >
      <div className={cn('p-[10px] rounded-full', isDark ? 'bg-white/[0.04]' : 'bg-black/[0.04]')}>
        <Wallet
          size={20}
          strokeWidth={1.5}
          className={cn(isDark ? 'text-white/40' : 'text-black/40')}
        />
      </div>
      <span
        className={cn('text-[13px] font-medium', isDark ? 'text-white/40' : 'text-black/50')}
      >
        Connect wallet to view activity
      </span>
    </div>
  );

  const isConnected = !!(accountProfile?.account || accountProfile?.address);

  if (!isConnected) {
    return notConnectedState;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Sub-tabs */}
      <div
        className={cn('flex gap-1 p-1 rounded-[12px] w-fit', isDark ? 'bg-white/[0.03]' : 'bg-black/[0.03]')}
      >
        <SubTab
          selected={activeSubTab === 'assets'}
          onClick={() => setActiveSubTab('assets')}
          isDark={isDark}
        >
          Assets
        </SubTab>
        <SubTab
          selected={activeSubTab === 'history'}
          onClick={() => setActiveSubTab('history')}
          isDark={isDark}
        >
          History
        </SubTab>
        <SubTab
          selected={activeSubTab === 'offers'}
          onClick={() => setActiveSubTab('offers')}
          isDark={isDark}
        >
          Offers {offersTotal > 0 && `(${offersTotal})`}
        </SubTab>
      </div>

      {/* Assets */}
      {activeSubTab === 'assets' && (
        <div className="flex flex-col gap-3">
          {assetsLoading ? (
            <div className={cn('text-center p-8', isDark ? 'text-white/50' : 'text-black/50')}>
              <Spinner size={24} className="mb-3 opacity-50" />
              <div className="text-[12px] font-medium tracking-[0.02em]">Fetching assets...</div>
            </div>
          ) : !tokenAssets ? (
            <div className={cn('text-center p-8 rounded-[12px] border border-dashed', isDark ? 'border-white/10 bg-white/[0.01]' : 'border-black/10 bg-black/[0.01]')}>
              <span className={cn('text-[13px] font-medium', isDark ? 'text-white/40' : 'text-black/40')}>No position in this token</span>
            </div>
          ) : (
            <>
              {/* Balance & Value */}
              <StatGrid isDark={isDark}>
                <StatItem isDark={isDark} className={cn('col-span-2', isDark ? '!bg-white/[0.02]' : '!bg-black/[0.01]')}>
                  <Label isDark={isDark}>Portfolio Balance</Label>
                  <div className="flex justify-between items-end">
                    <div className={cn('text-[24px] font-bold', isDark ? 'text-white' : 'text-[#1a1a1a]')}>
                      {formatTradeDisplay(tokenAssets.balance)} <span className="text-[14px] font-medium opacity-40">{tokenCurrency}</span>
                    </div>
                    <div className={cn('text-[16px] font-semibold mb-1', isDark ? 'text-white/70' : 'text-black/70')}>
                      ≈ {(tokenAssets.totalValue || 0).toFixed(2)} <span className="text-[11px] font-medium opacity-60">XRP</span>
                    </div>
                  </div>
                </StatItem>
                
                <StatItem isDark={isDark}>
                  <Label isDark={isDark}>Unrealized P&L</Label>
                  {tokenAssets.pnl != null ? (
                    <div className="flex flex-col">
                      <span className={cn('text-[16px] font-bold', tokenAssets.pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                        {tokenAssets.pnl >= 0 ? '+' : ''}{tokenAssets.pnl.toFixed(2)} <span className="text-[11px] font-semibold">XRP</span>
                      </span>
                      <span className={cn('text-[12px] font-semibold opacity-90', tokenAssets.pnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                        {tokenAssets.pnl >= 0 ? '+' : ''}{(tokenAssets.pnlPercent || 0).toFixed(2)}%
                      </span>
                    </div>
                  ) : (
                    <span className={cn('text-[14px] font-medium', isDark ? 'text-white/30' : 'text-black/30')}>—</span>
                  )}
                </StatItem>

                <StatItem isDark={isDark}>
                  <Label isDark={isDark}>Realized P&L</Label>
                  {tokenAssets.tradeCount > 0 ? (
                    <span className={cn('text-[16px] font-bold', tokenAssets.realizedPnl >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                      {tokenAssets.realizedPnl >= 0 ? '+' : ''}{tokenAssets.realizedPnl.toFixed(2)} <span className="text-[11px] font-semibold">XRP</span>
                    </span>
                  ) : (
                    <span className={cn('text-[14px] font-medium', isDark ? 'text-white/30' : 'text-black/30')}>—</span>
                  )}
                </StatItem>

                <StatItem isDark={isDark}>
                  <Label isDark={isDark}>Avg Buy Price</Label>
                  {tokenAssets.avgBuyPrice != null ? (
                    <Value isDark={isDark} className="font-mono !text-[14px]">
                      {formatPrice(tokenAssets.avgBuyPrice)} <span className="text-[10px] opacity-40">XRP</span>
                    </Value>
                  ) : (
                    <span className={cn('text-[14px] font-medium', isDark ? 'text-white/30' : 'text-black/30')}>—</span>
                  )}
                </StatItem>

                <StatItem isDark={isDark}>
                  <Label isDark={isDark}>Total ROI</Label>
                  {tokenAssets.tradeCount > 0 ? (
                    <span className={cn('text-[16px] font-bold', tokenAssets.totalRoi >= 0 ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                      {tokenAssets.totalRoi >= 0 ? '+' : ''}{tokenAssets.totalRoi.toFixed(2)}%
                    </span>
                  ) : (
                    <span className={cn('text-[14px] font-medium', isDark ? 'text-white/30' : 'text-black/30')}>—</span>
                  )}
                </StatItem>
              </StatGrid>

              {/* Trade Summary */}
              {tokenAssets.tradeCount > 0 && (
                <div className={cn('flex gap-2 p-3 rounded-[12px] border', isDark ? 'bg-white/[0.02] border-white/5' : 'bg-black/[0.02] border-black/5')}>
                  <div className="flex-1">
                    <Label isDark={isDark} className="text-[9px] mb-[2px] block">Trades</Label>
                    <span className="text-[13px] font-semibold">{tokenAssets.tradeCount}</span>
                  </div>
                  <div className="flex-[2]">
                    <Label isDark={isDark} className="text-[9px] mb-[2px] block text-[#22c55e]">Bought</Label>
                    <div className="text-[11px] font-medium">
                      {formatTradeDisplay(tokenAssets.totalBought)} {tokenCurrency}
                      <span className="opacity-40 ml-1">({formatTradeDisplay(tokenAssets.totalSpentXRP)} XRP)</span>
                    </div>
                  </div>
                  <div className="flex-[2]">
                    <Label isDark={isDark} className="text-[9px] mb-[2px] block text-[#ef4444]">Sold</Label>
                    <div className="text-[11px] font-medium">
                      {formatTradeDisplay(tokenAssets.totalSold)} {tokenCurrency}
                      <span className="opacity-40 ml-1">({formatTradeDisplay(tokenAssets.totalReceivedXRP)} XRP)</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Trustline Status */}
              <div className={cn('flex justify-between items-center py-[10px] px-4 rounded-[10px] border', isDark ? 'bg-white/[0.02] border-white/5' : 'bg-black/[0.01] border-black/5')}>
                <div className="flex items-center gap-2">
                  <div className={cn('w-[6px] h-[6px] rounded-full', tokenAssets.trustlineSet ? 'bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.4)]')} />
                  <span className={cn('text-[11px] font-semibold uppercase tracking-[0.02em]', isDark ? 'text-white/60' : 'text-black/60')}>
                    Trustline {tokenAssets.trustlineSet ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                {tokenAssets.limitAmount > 0 && (
                  <span className={cn('text-[10px] font-medium', isDark ? 'text-white/30' : 'text-black/40')}>
                    Limit: {abbreviateNumber(tokenAssets.limitAmount)}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* My Trading History */}
      {activeSubTab === 'history' && (
        <>
          {tradesLoading && myTrades.length === 0 ? (
            <div className={cn('text-center p-8', isDark ? 'text-white/50' : 'text-black/50')}>
              <Spinner size={24} className="opacity-50" />
            </div>
          ) : myTrades.length === 0 ? (
            <div className={cn('text-center p-8 rounded-[12px] border border-dashed', isDark ? 'border-white/10 bg-white/[0.01]' : 'border-black/10 bg-black/[0.01]')}>
              <span className={cn('text-[13px] font-medium', isDark ? 'text-white/40' : 'text-black/40')}>No trade history found</span>
            </div>
          ) : (
            <div className="flex flex-col">
              {!isMobile && (
                <div className={cn('flex px-3 pb-2 border-b text-[9px] font-semibold uppercase tracking-[0.05em]', isDark ? 'border-white/[0.06] text-white/30' : 'border-black/[0.06] text-black/40')}>
                  <div className="flex-[0.6]">Time</div>
                  <div className="flex-[0.4]">Action</div>
                  <div className="flex-[1.2]">Amount</div>
                  <div className="flex-1">Price</div>
                  <div className="flex-[0.8]">Total</div>
                  <div className="w-6"></div>
                </div>
              )}
              <div className="flex flex-col">
                {myTrades.map((trade, idx) => {
                  const isBuy = trade.paid?.currency === 'XRP';
                  const tokenAmount = isBuy ? trade.got : trade.paid;
                  const xrpAmount = isBuy ? trade.paid : trade.got;
                  const price = parseFloat(xrpAmount?.value) / parseFloat(tokenAmount?.value) || 0;

                  return (
                    <div 
                      key={trade._id || trade.hash || idx} 
                      className={cn('py-[10px] px-3 border-b flex items-center transition-colors duration-200 cursor-default', isDark ? 'border-white/[0.04] hover:bg-white/[0.02]' : 'border-black/[0.04] hover:bg-black/[0.01]')}
                    >
                      {isMobile ? (
                        <div className="flex w-full justify-between items-center">
                          <div className="flex flex-col gap-[2px]">
                            <div className="flex items-center gap-[6px]">
                              <span className={cn('text-[11px] font-bold', isBuy ? 'text-[#22c55e]' : 'text-[#ef4444]')}>{isBuy ? 'BUY' : 'SELL'}</span>
                              <span className={cn('text-[10px]', isDark ? 'text-white/30' : 'text-black/40')}>
                                {formatRelativeTime(trade.time)}
                              </span>
                            </div>
                            <span className={cn('text-[13px] font-semibold', isDark ? 'text-white' : 'text-[#1a1a1a]')}>
                              {formatTradeDisplay(tokenAmount?.value)} <span className="text-[10px] opacity-40">{tokenCurrency}</span>
                            </span>
                          </div>
                          <div className="flex flex-col items-end gap-[2px]">
                            <span className="text-[12px] font-medium font-mono">
                              {formatPrice(price)} <span className="text-[9px] opacity-40">XRP</span>
                            </span>
                            <span className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-black/50')}>
                              {formatTradeDisplay(xrpAmount?.value)} XRP
                            </span>
                          </div>
                        </div>
                      ) : (
                        <>
                          <span className={cn('flex-[0.6] text-[11px]', isDark ? 'text-white/40' : 'text-black/50')}>
                            {formatRelativeTime(trade.time)}
                          </span>
                          <span className={cn('flex-[0.4] text-[11px] font-bold', isBuy ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                            {isBuy ? 'BUY' : 'SELL'}
                          </span>
                          <span className="flex-[1.2] text-[13px] font-semibold">
                            {formatTradeDisplay(tokenAmount?.value)} <span className="text-[10px] opacity-40 font-medium">{tokenCurrency}</span>
                          </span>
                          <span className="flex-1 text-[12px] font-mono font-medium">
                            {formatPrice(price)}
                          </span>
                          <span className={cn('flex-[0.8] text-[12px] font-medium', isDark ? 'text-white/70' : 'text-black/70')}>
                            {formatTradeDisplay(xrpAmount?.value)} <span className="text-[10px] opacity-40">XRP</span>
                          </span>
                          <IconButton onClick={() => onTransactionClick && onTransactionClick(trade.hash)} isDark={isDark} className="w-6">
                            <ExternalLink size={12} strokeWidth={2} />
                          </IconButton>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
              {tradesHasMore && (
                <button
                  onClick={() => fetchMyTrades(true)}
                  disabled={tradesLoading}
                  className={cn(
                    'mt-3 p-[10px] text-[11px] font-semibold uppercase tracking-[0.05em] rounded-lg border w-full transition-all duration-200',
                    tradesLoading ? 'cursor-not-allowed' : 'cursor-pointer',
                    isDark ? 'bg-white/[0.04] border-white/[0.06] text-white/50 hover:enabled:bg-white/[0.08]' : 'bg-black/[0.03] border-black/[0.06] text-black/50 hover:enabled:bg-black/[0.05]'
                  )}
                >
                  {tradesLoading ? 'Loading...' : 'Load More'}
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* Open Offers */}
      {activeSubTab === 'offers' && (
        <>
          {loading ? (
            <div className="flex justify-center p-8">
              <Spinner size={24} className="opacity-50" />
            </div>
          ) : openOffers.length === 0 ? (
            <div
              className={cn('text-center p-8 rounded-[12px] border border-dashed', isDark ? 'border-white/10 bg-white/[0.01]' : 'border-black/10 bg-black/[0.01]')}
            >
              <span className={cn('text-[13px] font-medium', isDark ? 'text-white/40' : 'text-black/40')}>No open offers</span>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {openOffers.map((offer) => {
                const gets = offer.gets || offer.takerGets || {};
                const pays = offer.pays || offer.takerPays || {};
                const isBuy = gets.currency === 'XRP' || gets.name === 'XRP';
                const type = isBuy ? 'BUY' : 'SELL';
                const tokenAmount = isBuy
                  ? parseFloat(pays.value || 0)
                  : parseFloat(gets.value || 0);
                const xrpAmount = isBuy
                  ? parseFloat(gets.value || 0)
                  : parseFloat(pays.value || 0);
                const price = tokenAmount > 0 ? xrpAmount / tokenAmount : 0;
                const total = xrpAmount;

                // Expiration: stored as unix ms in offer.expire
                const expireMs = offer.expire;
                let expiryLabel = null;
                if (expireMs) {
                  const now = Date.now();
                  if (expireMs <= now) {
                    expiryLabel = 'Expired';
                  } else {
                    const diff = expireMs - now;
                    const hours = Math.floor(diff / 3600000);
                    const mins = Math.floor((diff % 3600000) / 60000);
                    if (hours >= 24) {
                      const days = Math.floor(hours / 24);
                      expiryLabel = `${days}d ${hours % 24}h`;
                    } else if (hours > 0) {
                      expiryLabel = `${hours}h ${mins}m`;
                    } else {
                      expiryLabel = `${mins}m`;
                    }
                  }
                }

                return (
                  <OfferCard key={offer.seq || offer._id} isDark={isDark}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={cn('text-[10px] font-extrabold py-1 px-2 rounded-[6px] tracking-[0.02em]', isBuy ? 'text-[#22c55e] bg-[rgba(34,197,94,0.1)]' : 'text-[#ef4444] bg-[rgba(239,68,68,0.1)]')}>
                          {type}
                        </div>

                        <div className="flex flex-col">
                          <span className="text-[14px] font-semibold">
                            {formatTradeDisplay(tokenAmount)}{' '}
                            <span className="text-[10px] opacity-40">{tokenCurrency}</span>
                          </span>
                          <span className={cn('text-[11px] font-mono', isDark ? 'text-white/40' : 'text-black/50')}>
                            @ {formatPrice(price)} XRP
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {expiryLabel && (
                          <div className={cn(
                            'text-[10px] font-medium py-[3px] px-[6px] rounded whitespace-nowrap',
                            expiryLabel === 'Expired' ? 'text-[#ef4444] bg-[rgba(239,68,68,0.08)]' : isDark ? 'text-white/45 bg-white/[0.04]' : 'text-black/45 bg-black/[0.04]'
                          )}>
                            {expiryLabel === 'Expired' ? 'Expired' : `Expires ${expiryLabel}`}
                          </div>
                        )}
                        <div className={cn('text-right', isMobile ? 'hidden' : 'block')}>
                          <span className="text-[13px] font-semibold">
                            {formatXRPAmount(total)} <span className="text-[10px] opacity-40">XRP</span>
                          </span>
                          <span className={cn('text-[9px] block uppercase', isDark ? 'text-white/30' : 'text-black/40')}>
                            Total Value
                          </span>
                        </div>
                        <CancelButton onClick={() => handleCancelOffer(offer.seq)} isDark={isDark} disabled={cancellingOffer === offer.seq}>
                          {cancellingOffer === offer.seq ? 'Cancelling...' : 'Cancel'}
                        </CancelButton>
                      </div>
                    </div>
                  </OfferCard>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {offersTotal > offersLimit && (
            <div className="flex items-center justify-center gap-2 pt-3">
              <button
                onClick={() => setOffersPage((p) => Math.max(0, p - 1))}
                disabled={offersPage === 0}
                className={cn('p-[6px] rounded-lg border-none disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer', isDark ? 'bg-white/[0.04] text-white' : 'bg-black/[0.03] text-[#1a1a1a]')}
              >
                <ChevronLeft size={14} />
              </button>
              <span className={cn('text-[11px] font-semibold', isDark ? 'text-white/40' : 'text-black/50')}>
                {offersPage + 1} <span className="opacity-50">/</span> {Math.ceil(offersTotal / offersLimit)}
              </span>
              <button
                onClick={() => setOffersPage((p) => p + 1)}
                disabled={(offersPage + 1) * offersLimit >= offersTotal}
                className={cn('p-[6px] rounded-lg border-none disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer', isDark ? 'bg-white/[0.04] text-white' : 'bg-black/[0.03] text-[#1a1a1a]')}
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
});

// Inline Expandable Trade Details Component
const TradeDetails = ({ trade, account, isDark, onClose, walletLabel }) => {
  const [txData, setTxData] = useState(null);
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const explainWithAI = async () => {
    if (aiLoading || aiExplanation || !trade?.hash) return;
    setAiLoading(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const response = await apiFetch(`https://api.xrpl.to/v1/tx-explain/${trade.hash}`, {
        signal: controller.signal
      });
      clearTimeout(timeout);
      if (!response.ok) throw new Error('API error');
      const data = await response.json();
      setAiExplanation(data);
    } catch (err) {
      setAiExplanation({
        summary: {
          summary:
            err.name === 'AbortError'
              ? 'Request timed out. Try viewing the full transaction page.'
              : 'AI unavailable. View full TX for details.'
        }
      });
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    if (!trade?.hash) return;
    setLoading(true);
    Promise.all([
      apiFetch(`https://api.xrpl.to/v1/tx/${trade.hash}`)
        .then((r) => r.json())
        .catch(() => null),
      account
        ? apiFetch(`https://api.xrpl.to/v1/account/info/${account}`)
          .then((r) => r.json())
          .catch(() => null)
        : Promise.resolve(null)
    ]).then(([tx, profile]) => {
      // Extract nested tx object from API response
      const txObj = tx?.tx_json || tx?.tx || tx;
      const meta = tx?.meta || txObj?.meta;
      setTxData(txObj ? { ...txObj, meta } : null);
      setProfileData(profile);
      setLoading(false);
    });
  }, [trade?.hash, account]);

  const dropsToXrp = (drops) =>
    (Number(drops) / 1000000).toLocaleString(undefined, { maximumFractionDigits: 6 });

  return (
    <div
      className={cn('py-3 px-2 border-b animate-[expandIn_0.15s_ease-out]', isDark ? 'bg-black/40 border-white/10' : 'bg-[rgba(128,128,128,0.1)] border-black/10')}
    >
      <style>{`@keyframes expandIn { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 400px; } }`}</style>
      {loading ? (
        <div className="flex justify-center p-3">
          <Spinner size={18} />
        </div>
      ) : (
        <div className="flex gap-4 flex-wrap">
          {/* Trader Info */}
          {account && (
            <div className="min-w-[120px] max-w-[180px] overflow-hidden">
              <div className={cn('text-[9px]', isDark ? 'text-white/40' : 'text-black/40')}>
                Trader
              </div>
              <a
                href={`/address/${account}`}
                className="text-[11px] font-mono text-[#3b82f6] no-underline block overflow-hidden text-ellipsis whitespace-nowrap"
                title={account}
              >
                {walletLabel || `${account.slice(0, 6)}...${account.slice(-4)}`}
              </a>
              {(profileData?.balance ||
                profileData?.Balance ||
                profileData?.account_data?.Balance) && (
                  <div className={cn('text-[10px]', isDark ? 'text-white/50' : 'text-black/50')}>
                    {dropsToXrp(
                      profileData?.balance ||
                      profileData?.Balance ||
                      profileData?.account_data?.Balance
                    )}{' '}
                    XRP
                  </div>
                )}
            </div>
          )}
          {/* TX Info */}
          {txData && (
            <>
              <div className="min-w-[100px]">
                <div className={cn('text-[9px]', isDark ? 'text-white/40' : 'text-black/40')}>
                  Status
                </div>
                <span
                  className={cn(
                    'text-[10px] py-[2px] px-[6px] rounded',
                    txData.meta?.TransactionResult === 'tesSUCCESS' ? 'bg-[rgba(34,197,94,0.15)] text-[#22c55e]' : 'bg-[rgba(239,68,68,0.15)] text-[#ef4444]'
                  )}
                >
                  {txData.meta?.TransactionResult === 'tesSUCCESS' ? 'Success' : 'Failed'}
                </span>
              </div>
              <div className="min-w-[80px]">
                <div className={cn('text-[9px]', isDark ? 'text-white/40' : 'text-black/40')}>
                  Fee
                </div>
                <div className={cn('text-[11px]', isDark ? 'text-white' : 'text-[#1a1a1a]')}>
                  {dropsToXrp(txData.Fee)} XRP
                </div>
              </div>
              <div className="min-w-[80px]">
                <div className={cn('text-[9px]', isDark ? 'text-white/40' : 'text-black/40')}>
                  Ledger
                </div>
                <div className={cn('text-[11px]', isDark ? 'text-white' : 'text-[#1a1a1a]')}>
                  #{txData.ledger_index}
                </div>
              </div>
            </>
          )}
          {/* Memo */}
          {txData?.Memos?.length > 0 &&
            (() => {
              const memo = txData.Memos[0]?.Memo;
              const decodeMemo = (hex) => {
                try {
                  let s = '';
                  for (let i = 0; i < hex.length; i += 2) {
                    const b = parseInt(hex.substr(i, 2), 16);
                    if (b === 0) break;
                    s += String.fromCharCode(b);
                  }
                  return s || null;
                } catch {
                  return null;
                }
              };
              const data = memo?.MemoData ? decodeMemo(memo.MemoData) : null;
              return data ? (
                <div className="min-w-[120px] max-w-[200px]">
                  <div className={cn('text-[9px]', isDark ? 'text-white/40' : 'text-black/40')}>
                    Memo
                  </div>
                  <div className={cn('text-[10px] overflow-hidden text-ellipsis whitespace-nowrap', isDark ? 'text-white/70' : 'text-black/70')}>
                    {data}
                  </div>
                </div>
              ) : null;
            })()}
          {/* Action Buttons */}
          <div className="flex gap-2 items-center ml-auto">
            <a
              href={`/tx/${trade.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-[5px] text-[11px] font-medium text-white bg-[#3b82f6] border-none rounded-[6px] py-[6px] px-3 no-underline cursor-pointer"
            >
              <ExternalLink size={12} />
              <span>View Details</span>
            </a>
            <button
              onClick={explainWithAI}
              disabled={aiLoading || aiExplanation}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-all duration-200',
                aiLoading || aiExplanation
                  ? isDark
                    ? 'border-white/10 bg-white/5 text-white/50 cursor-default'
                    : 'border-gray-200 bg-gray-100 text-gray-400 cursor-default'
                  : isDark
                    ? 'border-[#8b5cf6]/25 hover:border-[#8b5cf6]/40 bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/15 text-[#c4b5fd] hover:text-[#ddd6fe] cursor-pointer'
                    : 'border-[#8b5cf6]/30 hover:border-[#8b5cf6]/50 bg-[#8b5cf6]/10 hover:bg-[#8b5cf6]/20 text-[#7c3aed] hover:text-[#6d28d9] cursor-pointer'
              )}
            >
              {aiLoading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Sparkles size={12} />
              )}
              <span>{aiLoading ? 'Loading...' : 'Explain with AI'}</span>
            </button>
            <button
              onClick={onClose}
              className="bg-transparent border-none cursor-pointer p-1 ml-1"
            >
              <X
                size={14}
                className={cn(isDark ? 'text-white/50' : 'text-black/40')}
              />
            </button>
          </div>
        </div>
      )}
      {/* AI Explanation */}
      {aiExplanation &&
        !aiLoading &&
        (() => {
          let summaryText = 'AI analysis complete.';
          let keyPoints = [];
          const raw = aiExplanation.summary?.raw || aiExplanation.summary;
          if (typeof raw === 'string') {
            const summaryMatch = raw.match(/"summary"\s*:\s*"([^"]+)"/);
            if (summaryMatch) summaryText = summaryMatch[1];
            const keyPointsMatch = raw.match(/"keyPoints"\s*:\s*\[([^\]]*)/);
            if (keyPointsMatch) {
              const points = keyPointsMatch[1].match(/"([^"]+)"/g);
              if (points) keyPoints = points.map((p) => p.replace(/"/g, ''));
            }
          } else if (typeof raw === 'object' && raw?.summary) {
            summaryText = raw.summary;
            keyPoints = raw.keyPoints || [];
          }
          return (
            <div
              className={cn(
                'mt-3 p-4 rounded-[12px] border relative overflow-hidden',
                isDark ? 'border-[rgba(139,92,246,0.15)] shadow-[0_4px_20px_rgba(0,0,0,0.2)]' : 'border-[rgba(139,92,246,0.1)] shadow-[0_4px_20px_rgba(139,92,246,0.05)]'
              )}
              style={{ background: isDark ? 'linear-gradient(145deg, rgba(139, 92, 246, 0.08) 0%, rgba(139, 92, 246, 0.02) 100%)' : 'linear-gradient(145deg, rgba(139, 92, 246, 0.04) 0%, rgba(139, 92, 246, 0.01) 100%)' }}
            >
              <Sparkles
                size={40}
                className={cn('absolute -top-2 -right-2 text-[#8b5cf6] rotate-[15deg]', isDark ? 'opacity-5' : 'opacity-[0.03]')}
              />
              <div className="flex items-center gap-2 mb-3">
                <div className="text-[9px] font-bold uppercase py-[2px] px-[6px] rounded bg-[rgba(139,92,246,0.2)] text-[#a78bfa] tracking-[0.05em]">
                  {aiExplanation.extracted?.type || 'Analysis'}
                </div>
                <div className={cn('text-[11px] font-medium', isDark ? 'text-white/40' : 'text-black/40')}>
                  AI Insight
                </div>
              </div>

              <div
                className={cn('text-[13px] leading-[1.5]', isDark ? 'text-white/95' : 'text-[#1a1a1a]', keyPoints.length ? 'mb-4' : 'mb-0')}
              >
                {summaryText}
              </div>

              {keyPoints.length > 0 && (
                <div>
                  <div className={cn('text-[10px] font-semibold uppercase tracking-[0.05em] mb-[10px] flex items-center gap-[6px]', isDark ? 'text-white/40' : 'text-black/50')}>
                    <div className={cn('w-3 h-px', isDark ? 'bg-white/20' : 'bg-black/10')} />
                    Key Points
                  </div>
                  <ul className="m-0 p-0 list-none flex flex-col gap-2">
                    {keyPoints.map((point, idx) => (
                      <li
                        key={idx}
                        className={cn('flex items-start gap-[10px] text-[12px] leading-[1.4]', isDark ? 'text-white/80' : 'text-black/70')}
                      >
                        <div className="w-1 h-1 rounded-full bg-[#8b5cf6] mt-[6px] shrink-0" />
                        <span>{typeof point === 'string' ? point : JSON.stringify(point)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })()}
    </div>
  );
};

const TradingHistory = ({
  tokenId,
  amm,
  token,
  pairs,
  onTransactionClick,
  isDark = false,
  isMobile: isMobileProp = false
}) => {
  // Use internal mobile detection for reliability
  const [isMobileState, setIsMobileState] = useState(isMobileProp);
  useEffect(() => {
    const checkMobile = () => setIsMobileState(window.innerWidth < 960);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  const isMobile = isMobileState || isMobileProp;

  // Fiat currency conversion
  const { accountProfile } = useContext(WalletContext);
  const { activeFiatCurrency } = useContext(AppContext);
  const metrics = useSelector(selectMetrics);
  const exchRate =
    metrics[activeFiatCurrency] || (activeFiatCurrency === 'CNH' ? metrics.CNY : null) || 1;

  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTradeIds, setNewTradeIds] = useState(new Set());
  const [expandedTradeId, setExpandedTradeId] = useState(null);
  const [pairType, setPairType] = useState('xrp'); // xrp, token, or empty for all
  const [xrpAmount, setXrpAmount] = useState(''); // Filter by minimum XRP amount
  const [historyType, setHistoryType] = useState('all'); // trades, liquidity, all
  const [timeRange, setTimeRange] = useState(''); // 1h, 24h, 7d, 30d, or empty for all
  const [accountFilter, setAccountFilter] = useState('');
  const [liquidityType, setLiquidityType] = useState(''); // deposit, withdraw, create, or empty for all
  const [tabValue, setTabValue] = useState(0);
  const previousTradesRef = useRef(new Set());
  const wsRef = useRef(null);
  const wsPingRef = useRef(null);
  const limit = isMobile ? 10 : 30;

  // Cursor-based pagination state
  const [cursor, setCursor] = useState(null);
  const [nextCursor, setNextCursor] = useState(null);
  const [cursorHistory, setCursorHistory] = useState([]); // Stack of cursors for back navigation
  const [totalRecords, setTotalRecords] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [direction, setDirection] = useState('desc'); // 'desc' = newest first, 'asc' = oldest first
  const [isLastPage, setIsLastPage] = useState(false); // True when we've reached the end of records

  // AMM Pools state
  const [ammPools, setAmmPools] = useState([]);
  const [ammLoading, setAmmLoading] = useState(false);
  // Unified liquidity dialog state
  const [liquidityDialog, setLiquidityDialog] = useState({ open: false, pool: null, tab: 'add' }); // tab: 'add' | 'remove'
  const [depositAmount1, setDepositAmount1] = useState('');
  const [depositAmount2, setDepositAmount2] = useState('');
  const [depositMode, setDepositMode] = useState('double'); // 'double', 'single1', 'single2'
  const [depositLoading, setDepositLoading] = useState(false);
  const [withdrawAmount1, setWithdrawAmount1] = useState('');
  const [withdrawAmount2, setWithdrawAmount2] = useState('');
  const [withdrawMode, setWithdrawMode] = useState('double'); // 'double', 'single1', 'single2', 'all'
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [pendingDeposit, setPendingDeposit] = useState(null); // { tx, deviceWallet, simResult }
  const [pendingWithdraw, setPendingWithdraw] = useState(null); // { tx, deviceWallet, simResult }
  // Backwards-compat aliases for existing code
  const addLiquidityDialog = liquidityDialog;
  const withdrawDialog = liquidityDialog;

  // User wallet balances for pool assets (fetched when modal opens)
  const [userPoolBalances, setUserPoolBalances] = useState({ asset1: null, asset2: null });

  // Pool UI enhancements
  const [expandedPoolId, setExpandedPoolId] = useState(null);
  const [poolChartData, setPoolChartData] = useState({}); // Cache: { ammAccount: chartData[] }
  const [poolChartLoading, setPoolChartLoading] = useState({});
  const [poolTypeFilter, setPoolTypeFilter] = useState('all'); // 'all', 'xrp', 'token'
  const [poolSortBy, setPoolSortBy] = useState('liquidity'); // 'liquidity', 'apy', 'volume', 'fees'
  const [poolSortDir, setPoolSortDir] = useState('desc'); // 'asc', 'desc'

  // User LP token balances: { ammAccount: { balance, share, asset1Amount, asset2Amount } }
  const [userLpBalances, setUserLpBalances] = useState({});
  const [lpRefreshCounter, setLpRefreshCounter] = useState(0);
  // IL position data: { poolId: { ilPercent, holdValueXrp, poolValueXrp, ... } }
  const [ilPositions, setIlPositions] = useState({});

  // Create Pool state
  const [createPoolOpen, setCreatePoolOpen] = useState(false);
  const [createPoolSearch, setCreatePoolSearch] = useState('');
  const [createPoolSearchResults, setCreatePoolSearchResults] = useState([]);
  const [createPoolSearchLoading, setCreatePoolSearchLoading] = useState(false);
  const [createPoolAsset2, setCreatePoolAsset2] = useState(null); // { currency, issuer, name, image }
  const [createPoolAmount1, setCreatePoolAmount1] = useState('');
  const [createPoolAmount2, setCreatePoolAmount2] = useState('');
  const [createPoolFee, setCreatePoolFee] = useState(500); // 0-1000 => 0%-1%
  const [createPoolLoading, setCreatePoolLoading] = useState(false);
  const [pendingCreatePool, setPendingCreatePool] = useState(null); // { tx, deviceWallet, simResult } or { error }
  const [createPoolBalances, setCreatePoolBalances] = useState({ asset1: null, asset2: null });
  const formatShare = (share) => {
    const pct = share * 100;
    if (pct >= 1) return pct.toFixed(2) + '%';
    if (pct >= 0.01) return pct.toFixed(2) + '%';
    if (pct >= 0.0001) return pct.toFixed(4) + '%';
    if (pct > 0) return '<0.0001%';
    return '0%';
  };

  // Wallet labels from logged-in user
  const [walletLabels, setWalletLabels] = useState({});

  // Fetch wallet labels
  useEffect(() => {
    const userAddr = accountProfile?.account || accountProfile?.address;
    if (!userAddr) return;
    api.get(`https://api.xrpl.to/api/user/${userAddr}/labels`)
      .then(res => {
        if (res.data?.labels) {
          const map = {};
          res.data.labels.forEach(l => { map[l.wallet] = l.label; });
          setWalletLabels(map);
        }
      })
      .catch(() => { });
  }, [accountProfile?.account, accountProfile?.address]);

  const handleTxClick = (hash, tradeAccount) => {
    if (onTransactionClick) {
      onTransactionClick(hash, tradeAccount);
    }
  };

  const handleTabChange = async (event, newValue) => {
    setTabValue(newValue);
    if (newValue === 1 && token && token.currency && ammPools.length === 0) {
      setAmmLoading(true);
      try {
        const ammUrl = `https://api.xrpl.to/v1/amm?issuer=${token.issuer}&currency=${token.currency}&sortBy=fees`;
        const res = await apiFetch(ammUrl);
        const data = await res.json();
        // Sort to ensure main XRP pool appears first
        const pools = data.pools || [];
        pools.sort((a, b) => {
          const aIsMain =
            (a.asset1?.currency === 'XRP' &&
              a.asset2?.issuer === token?.issuer &&
              a.asset2?.currency === token?.currency) ||
            (a.asset2?.currency === 'XRP' &&
              a.asset1?.issuer === token?.issuer &&
              a.asset1?.currency === token?.currency);
          const bIsMain =
            (b.asset1?.currency === 'XRP' &&
              b.asset2?.issuer === token?.issuer &&
              b.asset2?.currency === token?.currency) ||
            (b.asset2?.currency === 'XRP' &&
              b.asset1?.issuer === token?.issuer &&
              b.asset1?.currency === token?.currency);
          if (aIsMain && !bIsMain) return -1;
          if (!aIsMain && bIsMain) return 1;
          return 0; // Keep API order (by fees) for non-main pools
        });
        setAmmPools(pools);

        // Fetch chart data for all pools (for sparklines)
        pools.forEach(async (pool) => {
          const poolAccount = pool.ammAccount || pool.account || pool._id;
          if (poolAccount) {
            try {
              // Try 1m first, fall back to 1w if no data
              const chartUrl = `https://api.xrpl.to/v1/amm/liquidity-chart?ammAccount=${poolAccount}&period=1m`;
              let chartRes = await apiFetch(chartUrl);
              let chartData = await chartRes.json();

              // If no data for 1m, try 1w
              if (
                chartData.success &&
                (!chartData.data || chartData.data.length < 2)
              ) {
                chartRes = await apiFetch(
                  `https://api.xrpl.to/v1/amm/liquidity-chart?ammAccount=${poolAccount}&period=1w`
                );
                chartData = await chartRes.json();
              }

              // If still no data, try all time
              if (
                chartData.success &&
                (!chartData.data || chartData.data.length < 2)
              ) {
                chartRes = await apiFetch(
                  `https://api.xrpl.to/v1/amm/liquidity-chart?ammAccount=${poolAccount}&period=all`
                );
                chartData = await chartRes.json();
              }

              if (chartData.success && chartData.data && chartData.data.length >= 2) {
                setPoolChartData((prev) => ({ ...prev, [poolAccount]: chartData.data }));
              }
            } catch (err) {
              console.error('[TradingHistory] Pool chart error:', poolAccount, err.message);
            }
          }
        });
      } catch (error) {
        console.error('[TradingHistory] AMM pools error:', error.message);
      } finally {
        setAmmLoading(false);
      }
    }
  };

  // Fetch user LP balances when pools are loaded and user is logged in
  useEffect(() => {
    const userAddr = accountProfile?.account || accountProfile?.address;
    if (!userAddr || ammPools.length === 0) return;

    const fetchLpBalances = async () => {
      const balances = {};
      await Promise.all(
        ammPools.map(async (pool) => {
          const ammAccount = pool.ammAccount || pool.account || pool._id;
          const lpCurrency = pool.lpTokenCurrency;
          if (!ammAccount || !lpCurrency) return;
          try {
            const resp = await apiFetch(
              `https://api.xrpl.to/api/account/trustline/${userAddr}/${ammAccount}/${lpCurrency}`
            );
            const data = await resp.json();
            if (data?.hasTrustline && data.balance > 0) {
              const userBal = data.balance;
              const totalLp = pool.currentLiquidity?.lpTokenBalance || 0;
              const share = totalLp > 0 ? userBal / totalLp : 0;
              balances[ammAccount] = {
                balance: userBal,
                totalLp,
                share,
                asset1Amount: share * (pool.currentLiquidity?.asset1Amount || 0),
                asset2Amount: share * (pool.currentLiquidity?.asset2Amount || 0)
              };
            }
          } catch (err) {
            // Silently ignore - user may not have LP tokens
          }
        })
      );
      setUserLpBalances(balances);
    };

    fetchLpBalances();
  }, [ammPools, accountProfile?.account, accountProfile?.address, lpRefreshCounter]);

  // Fetch IL position data from analytics
  useEffect(() => {
    const userAddr = accountProfile?.account || accountProfile?.address;
    if (!userAddr || ammPools.length === 0) return;

    const fetchIlData = async () => {
      try {
        const resp = await apiFetch(`https://api.xrpl.to/api/lp-positions/${userAddr}`);
        const data = await resp.json();
        if (data?.result === 'success' && data.positions) {
          setIlPositions(data.positions);
        }
      } catch (err) {
        // Silently ignore - IL data is supplementary
      }
    };

    fetchIlData();
  }, [ammPools, accountProfile?.account, accountProfile?.address, lpRefreshCounter]);

  const fetchTradingHistory = useCallback(
    async (useCursor = null, isRefresh = false, useDirection = 'desc') => {
      if (!tokenId) {
        setLoading(false);
        return;
      }

      try {
        // Build query params
        const params = new URLSearchParams({
          md5: tokenId,
          limit: String(limit),
          type: historyType,
          direction: useDirection
        });

        // Add liquidityType filter (API handles this server-side)
        if (liquidityType) {
          params.set('liquidityType', liquidityType);
        }

        // Add cursor for pagination (but not for refresh which should get latest)
        if (useCursor && !isRefresh) {
          params.set('cursor', String(useCursor));
        }

        // Add optional filters
        if (pairType) {
          params.set('pairType', pairType);
        }

        if (xrpAmount && pairType === 'xrp' && historyType === 'trades') {
          params.set('xrpAmount', xrpAmount);
        }

        if (accountFilter) {
          params.set('account', accountFilter);
        }

        // Add time range params
        if (timeRange) {
          const now = Date.now();
          const ranges = {
            '1h': 60 * 60 * 1000,
            '24h': 24 * 60 * 60 * 1000,
            '7d': 7 * 24 * 60 * 60 * 1000,
            '30d': 30 * 24 * 60 * 60 * 1000
          };
          if (ranges[timeRange]) {
            params.set('startTime', String(now - ranges[timeRange]));
            params.set('endTime', String(now));
          }
        }

        const historyUrl = `https://api.xrpl.to/v1/history?${params}`;
        const response = await fetch(historyUrl);
        const data = await response.json();

        if (data.success) {
          const hists = data.data || data.hists || [];
          const meta = data.meta || data;
          const currentTradeIds = previousTradesRef.current;
          const newTrades = hists.filter((trade) => !currentTradeIds.has(trade._id));

          if (newTrades.length > 0 && isRefresh) {
            setNewTradeIds(new Set(newTrades.map((trade) => trade._id)));
            previousTradesRef.current = new Set(hists.map((trade) => trade._id));
            setTimeout(() => {
              setNewTradeIds(new Set());
            }, 1000);
          }

          setTrades(hists.slice(0, 50));
          setNextCursor(meta.nextCursor || null);
          setTotalRecords(meta.totalRecords || 0);

          // Determine if we've reached the end of records in the current direction
          const recordsReturned = meta.recordsReturned || hists.length;

          if (useDirection === 'asc' && !useCursor) {
            // First page of asc = last page of records (oldest), this is the end
            setIsLastPage(true);
          } else {
            // Normal pagination - check if there are more records
            const hasMoreRecords = recordsReturned >= limit && meta.nextCursor;
            setIsLastPage(!hasMoreRecords);
          }
        }
      } catch (error) {
        console.error('Error fetching trading history:', error);
      } finally {
        setLoading(false);
      }
    },
    [tokenId, pairType, xrpAmount, historyType, timeRange, accountFilter, liquidityType]
  );

  // Reset pagination when filters change
  useEffect(() => {
    setCursor(null);
    setNextCursor(null);
    setCursorHistory([]);
    setCurrentPage(1);
    setDirection('desc');
    setIsLastPage(false);
    previousTradesRef.current = new Set();
    setLoading(true);
    fetchTradingHistory(null, false, 'desc');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenId, pairType, xrpAmount, historyType, timeRange, accountFilter, liquidityType]);

  // WebSocket for real-time trade updates (only for page 1 with desc direction, no account filter)
  useEffect(() => {
    let isMounted = true;

    if (!tokenId || currentPage !== 1 || direction !== 'desc' || accountFilter) {
      // Close existing WS if conditions not met
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

    // Close existing WS
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    if (wsPingRef.current) {
      clearInterval(wsPingRef.current);
      wsPingRef.current = null;
    }

    // Connect via session endpoint
    const wsParams = new URLSearchParams({ limit: String(limit) });
    if (pairType) wsParams.set('pairType', pairType);
    if (historyType !== 'all') wsParams.set('type', historyType);
    if (liquidityType) wsParams.set('liquidityType', liquidityType);

    (async () => {
      try {
        const res = await fetch(`/api/ws/session?type=history&id=${tokenId}&${wsParams}`);
        const { wsUrl } = await res.json();
        if (!isMounted) return;
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
      wsPingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    };

    ws.onmessage = (event) => {
      if (!isMounted) return;
      const msg = JSON.parse(event.data);

      // Helper to filter trades based on current filters
      const applyClientFilters = (trades) => {
        return trades.filter((t) => {
          // Filter by historyType (trades vs liquidity)
          if (historyType === 'trades' && t.isLiquidity) return false;
          if (historyType === 'liquidity' && !t.isLiquidity) return false;

          // Filter by liquidityType (deposit/withdraw/create)
          if (liquidityType && t.isLiquidity && t.type !== liquidityType) return false;

          // Filter by pairType (xrp vs token pairs)
          if (pairType) {
            const hasXrp = t.paid?.currency === 'XRP' || t.got?.currency === 'XRP';
            if (pairType === 'xrp' && !hasXrp) return false;
            if (pairType === 'token' && hasXrp) return false;
          }

          // Filter by minimum XRP amount
          if (xrpAmount) {
            const minXrp = parseFloat(xrpAmount);
            if (!isNaN(minXrp) && minXrp > 0) {
              const tradeXrp =
                t.paid?.currency === 'XRP'
                  ? parseFloat(t.paid?.value || 0)
                  : parseFloat(t.got?.value || 0);
              if (tradeXrp < minXrp) return false;
            }
          }

          return true;
        });
      };

      if (msg.type === 'initial' && msg.trades) {
        // WebSocket doesn't properly filter by type/pairType, so only use initial data when no filters active
        // Let HTTP fetch handle initial data when filters are set
        if (historyType !== 'liquidity' && !pairType) {
          const filteredTrades = applyClientFilters(msg.trades);
          setTrades(filteredTrades.slice(0, 50));
          setLoading(false);
          // Only track IDs when we actually use the WebSocket data
          previousTradesRef.current = new Set(msg.trades.map((t) => t._id || t.id));
        }
      } else if (msg.e === 'trades' && msg.trades?.length > 0) {
        const currentIds = previousTradesRef.current;
        const newTrades = msg.trades.filter((t) => !currentIds.has(t._id || t.id));
        const filteredNewTrades = applyClientFilters(newTrades);

        if (filteredNewTrades.length > 0) {
          setNewTradeIds(new Set(filteredNewTrades.map((t) => t._id || t.id)));
          setTrades((prev) => [...filteredNewTrades, ...prev].slice(0, 50));
          filteredNewTrades.forEach((t) => currentIds.add(t._id || t.id));
          setTimeout(() => setNewTradeIds(new Set()), 1000);
        }
        // Still track all trade IDs to prevent duplicates later
        newTrades.forEach((t) => currentIds.add(t._id || t.id));
      }
    };

    ws.onerror = (e) => {
      console.error('[History WS] Error:', e);
    };

    ws.onclose = (ev) => {
          if (wsPingRef.current) {
            clearInterval(wsPingRef.current);
            wsPingRef.current = null;
          }
        };
      } catch (e) {
        console.error('[History WS] Session error:', e);
      }
    })();

    return () => {
      isMounted = false;
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      if (wsPingRef.current) {
        clearInterval(wsPingRef.current);
        wsPingRef.current = null;
      }
    };
  }, [
    tokenId,
    currentPage,
    direction,
    accountFilter,
    pairType,
    historyType,
    liquidityType,
    xrpAmount,
    limit
  ]);

  // Cursor-based pagination handlers
  const handleNextPage = useCallback(() => {
    if (!nextCursor) return;

    // Save current cursor to history for back navigation
    setCursorHistory((prev) => [...prev, cursor]);
    setCursor(nextCursor);

    // Update page number based on direction
    if (direction === 'desc') {
      setCurrentPage((prev) => prev + 1);
    } else {
      setCurrentPage((prev) => prev - 1);
    }

    setLoading(true);
    fetchTradingHistory(nextCursor, false, direction);
  }, [nextCursor, cursor, direction, fetchTradingHistory]);

  const handlePrevPage = useCallback(() => {
    if (cursorHistory.length === 0) return;

    // Pop the last cursor from history
    const newHistory = [...cursorHistory];
    const prevCursor = newHistory.pop();

    setCursorHistory(newHistory);
    setCursor(prevCursor);

    // Update page number based on direction
    if (direction === 'desc') {
      setCurrentPage((prev) => prev - 1);
    } else {
      setCurrentPage((prev) => prev + 1);
    }

    setLoading(true);
    fetchTradingHistory(prevCursor, false, direction);
  }, [cursorHistory, direction, fetchTradingHistory]);

  const handleFirstPage = useCallback(() => {
    if (currentPage === 1 && direction === 'desc') return;

    setCursor(null);
    setNextCursor(null);
    setCursorHistory([]);
    setCurrentPage(1);
    setDirection('desc');
    setLoading(true);
    fetchTradingHistory(null, false, 'desc');
  }, [currentPage, direction, fetchTradingHistory]);

  // Jump back multiple pages at once
  const handleJumpBack = useCallback(
    (steps) => {
      if (steps <= 0 || steps > cursorHistory.length) return;

      const newHistory = [...cursorHistory];
      let targetCursor = null;

      // Pop 'steps' cursors from history
      for (let i = 0; i < steps; i++) {
        targetCursor = newHistory.pop();
      }

      setCursorHistory(newHistory);
      setCursor(targetCursor);

      if (direction === 'desc') {
        setCurrentPage((prev) => prev - steps);
      } else {
        setCurrentPage((prev) => prev + steps);
      }

      setLoading(true);
      fetchTradingHistory(targetCursor, false, direction);
    },
    [cursorHistory, direction, fetchTradingHistory]
  );

  // Jump to last page (oldest records)
  const handleLastPage = useCallback(() => {
    if (!tokenId || totalRecords <= limit) return;

    const totalPages = Math.ceil(totalRecords / limit);

    // Use direction=asc with no cursor to get oldest records
    // This IS the last page - there are no older records beyond this
    setCursor(null);
    setNextCursor(null);
    setCursorHistory([]);
    setCurrentPage(totalPages);
    setDirection('asc');
    setIsLastPage(true); // We're at the true last page (oldest records)
    setLoading(true);
    fetchTradingHistory(null, false, 'asc');
  }, [tokenId, totalRecords, limit, fetchTradingHistory]);

  const handleAddLiquidity = (pool) => {
    setLiquidityDialog({ open: true, pool, tab: 'add' });
    setDepositAmount1('');
    setDepositAmount2('');
    setDepositMode('double');
  };

  const handleCloseDialog = () => {
    setLiquidityDialog({ open: false, pool: null, tab: 'add' });
    setUserPoolBalances({ asset1: null, asset2: null });
    setPendingDeposit(null);
    setPendingWithdraw(null);
  };

  // Does an XRP pair exist for this token?
  // ammPools is already filtered for this token by the API query, so just check for XRP in any pool
  const hasXrpPool = useMemo(() => {
    return ammPools.some(pool =>
      pool.asset1?.currency === 'XRP' || pool.asset2?.currency === 'XRP'
    );
  }, [ammPools]);

  // === Create Pool handlers ===
  const handleOpenCreatePool = (presetAsset2) => {
    const account = accountProfile?.account || accountProfile?.address;
    if (!account) { toast.error('Connect wallet first'); return; }
    setCreatePoolOpen(true);
    setCreatePoolAmount1('');
    setCreatePoolAmount2('');
    setCreatePoolFee(500);
    setCreatePoolSearch('');
    setCreatePoolSearchResults([]);
    setPendingCreatePool(null);
    setCreatePoolBalances({ asset1: null, asset2: null });

    if (presetAsset2) {
      handleSelectAsset2(presetAsset2);
    } else {
      setCreatePoolAsset2(null);
    }
  };

  const handleCloseCreatePool = () => {
    setCreatePoolOpen(false);
    setCreatePoolAsset2(null);
    setPendingCreatePool(null);
    setCreatePoolBalances({ asset1: null, asset2: null });
  };

  // Search for tokens to pair with
  const createPoolSearchTimer = useRef(null);
  const handleCreatePoolSearch = (query) => {
    setCreatePoolSearch(query);
    if (createPoolSearchTimer.current) clearTimeout(createPoolSearchTimer.current);
    if (!query || query.length < 2) { setCreatePoolSearchResults([]); return; }
    createPoolSearchTimer.current = setTimeout(async () => {
      setCreatePoolSearchLoading(true);
      try {
        const res = await api.get(`https://api.xrpl.to/v1/tokens?filter=${encodeURIComponent(query)}&start=0&limit=20&sortBy=vol24hxrp&sortType=desc`);
        // Build set of currencies that already have a pool with this token
        const existingPoolCurrencies = new Set();
        const normalizeKey = (issuer, currency) =>
          currency === 'XRP' ? 'XRP' : `${issuer}_${currency}`;
        ammPools.forEach(pool => {
          const other = (pool.asset1?.issuer === token?.issuer && pool.asset1?.currency === token?.currency)
            ? pool.asset2 : pool.asset1;
          if (other) existingPoolCurrencies.add(normalizeKey(other.issuer, other.currency));
        });
        const tokens = (res.data?.tokens || []).filter(t => {
          if (t.issuer === token?.issuer && t.currency === token?.currency) return false;
          // Exclude tokens that already have a pool with this token
          if (existingPoolCurrencies.has(normalizeKey(t.issuer, t.currency))) return false;
          return true;
        });
        setCreatePoolSearchResults(tokens);
      } catch (err) {
        console.error('[CreatePool] Search error:', err);
        setCreatePoolSearchResults([]);
      }
      setCreatePoolSearchLoading(false);
    }, 300);
  };

  const handleSelectAsset2 = (selected) => {
    const isXrp = selected.currency === 'XRP' && !selected.issuer;
    setCreatePoolAsset2({
      currency: isXrp ? 'XRP' : selected.currency,
      issuer: isXrp ? undefined : selected.issuer,
      name: isXrp ? 'XRP' : (selected.name || decodeCurrency(selected.currency)),
      image: getTokenImageUrl(selected.issuer, selected.currency)
    });
    setCreatePoolSearch('');
    setCreatePoolSearchResults([]);
    setPendingCreatePool(null);
    setCreatePoolAmount1('');
    setCreatePoolAmount2('');

    // Fetch balances for both assets
    const account = accountProfile?.account || accountProfile?.address;
    if (!account) return;
    const fetchBal = async (asset) => {
      if (!asset.issuer || asset.currency === 'XRP') {
        try {
          const resp = await apiFetch(`https://api.xrpl.to/api/account/info/${account}`);
          const data = await resp.json();
          return data?.balance ?? 0;
        } catch { return 0; }
      }
      try {
        const resp = await apiFetch(`https://api.xrpl.to/api/account/trustline/${account}/${asset.issuer}/${encodeURIComponent(asset.currency)}`);
        const data = await resp.json();
        return data?.hasTrustline ? (data.balance ?? 0) : 0;
      } catch { return 0; }
    };
    const asset1 = { currency: token?.currency, issuer: token?.issuer };
    const asset2 = { currency: isXrp ? 'XRP' : selected.currency, issuer: isXrp ? undefined : selected.issuer };
    Promise.all([fetchBal(asset1), fetchBal(asset2)])
      .then(([b1, b2]) => setCreatePoolBalances({ asset1: b1, asset2: b2 }));
  };

  const handleSubmitCreatePool = async () => {
    const account = accountProfile?.account || accountProfile?.address;
    if (!account) { toast.error('Connect wallet first'); return; }
    if (!createPoolAsset2) { toast.error('Select a token to pair with'); return; }
    if (!createPoolAmount1 || !createPoolAmount2 || parseFloat(createPoolAmount1) <= 0 || parseFloat(createPoolAmount2) <= 0) {
      toast.error('Enter amounts for both assets'); return;
    }

    setCreatePoolLoading(true);
    const toastId = toast.loading('Simulating pool creation...');

    try {
      const { Wallet: XRPLWallet } = await import('xrpl');
      const { EncryptedWalletStorage, deviceFingerprint } = await import('src/utils/encryptedWalletStorage');

      const walletStorage = new EncryptedWalletStorage();
      const deviceKeyId = await deviceFingerprint.getDeviceId();
      const storedPassword = await walletStorage.getWalletCredential(deviceKeyId);
      if (!storedPassword) { toast.error('Wallet locked', { id: toastId }); setCreatePoolLoading(false); return; }

      const walletData = await walletStorage.getWallet(account, storedPassword);
      if (!walletData?.seed) { toast.error('Could not retrieve credentials', { id: toastId }); setCreatePoolLoading(false); return; }

      const algorithm = walletData.seed.startsWith('sEd') ? 'ed25519' : 'secp256k1';
      const deviceWallet = XRPLWallet.fromSeed(walletData.seed, { algorithm });

      // Build asset references
      const asset1Id = token?.currency === 'XRP'
        ? { currency: 'XRP' }
        : { currency: token.currency, issuer: token.issuer };
      const asset2Id = createPoolAsset2.currency === 'XRP'
        ? { currency: 'XRP' }
        : { currency: createPoolAsset2.currency, issuer: createPoolAsset2.issuer };

      const amount1 = token?.currency === 'XRP'
        ? String(Math.floor(parseFloat(createPoolAmount1) * 1_000_000))
        : { currency: token.currency, issuer: token.issuer, value: String(createPoolAmount1) };
      const amount2 = createPoolAsset2.currency === 'XRP'
        ? String(Math.floor(parseFloat(createPoolAmount2) * 1_000_000))
        : { currency: createPoolAsset2.currency, issuer: createPoolAsset2.issuer, value: String(createPoolAmount2) };

      const tx = {
        TransactionType: 'AMMCreate',
        Account: account,
        Amount: amount1,
        Amount2: amount2,
        TradingFee: createPoolFee,
        SourceTag: 161803,
        Memos: configureMemos('', '', 'AMM Create via https://xrpl.to')
      };

      const simResult = await simulateTransaction(tx);
      toast.dismiss(toastId);

      if (simResult.engine_result !== 'tesSUCCESS') {
        setPendingCreatePool({ tx: null, error: simResult.engine_result_message || simResult.engine_result });
        setCreatePoolLoading(false);
        return;
      }

      // Parse fee from simulation
      const fee = parseInt(simResult?.meta?.Fee || simResult?.fee || '12', 10) / 1_000_000;
      setPendingCreatePool({ tx, deviceWallet, simResult, fee });
    } catch (err) {
      console.error('[AMM Create] Simulation error:', err);
      setPendingCreatePool({ tx: null, error: err.message?.slice(0, 120) || 'Simulation failed' });
    }
    setCreatePoolLoading(false);
  };

  const handleConfirmCreatePool = async () => {
    if (!pendingCreatePool?.tx) return;
    const { tx, deviceWallet } = pendingCreatePool;
    setCreatePoolLoading(true);
    const toastId = toast.loading('Signing & submitting...');

    try {
      const result = await submitTransaction(deviceWallet, tx);
      const txHash = result.hash || result.tx_json?.hash;
      const engineResult = result.engine_result || result.result?.engine_result;

      if (engineResult !== 'tesSUCCESS') {
        toast.error('Pool creation failed', { id: toastId, description: result.engine_result_message || engineResult });
        setCreatePoolLoading(false);
        return;
      }

      toast.loading('Waiting for confirmation...', { id: toastId });
      let validated = false;
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 500));
        try {
          const txRes = await api.get(`https://api.xrpl.to/v1/tx/${txHash}`);
          if (txRes.data?.validated) { validated = true; break; }
        } catch { /* continue */ }
      }

      if (validated) {
        toast.success('Pool created!', { id: toastId, duration: 4000 });
      } else {
        toast.success('Pool submitted', { id: toastId, description: 'Validation pending...' });
      }

      handleCloseCreatePool();
      // Refresh pools list
      setAmmPools([]);
      handleTabChange(null, 1);
    } catch (err) {
      console.error('[AMM Create] Submit error:', err);
      toast.error(err.message || 'Failed to create pool', { id: toastId });
    }
    setCreatePoolLoading(false);
  };

  // Fetch user wallet balances for pool assets when modal opens
  useEffect(() => {
    const pool = liquidityDialog.pool;
    const userAddr = accountProfile?.account || accountProfile?.address;
    if (!liquidityDialog.open || !pool || !userAddr) return;

    const fetchBal = async (asset) => {
      if (asset.currency === 'XRP') {
        try {
          const resp = await apiFetch(`https://api.xrpl.to/api/account/info/${userAddr}`);
          const data = await resp.json();
          return data?.balance ?? 0;
        } catch { return 0; }
      }
      try {
        const resp = await apiFetch(`https://api.xrpl.to/api/account/trustline/${userAddr}/${asset.issuer}/${encodeURIComponent(asset.currency)}`);
        const data = await resp.json();
        return data?.hasTrustline ? (data.balance ?? 0) : 0;
      } catch { return 0; }
    };

    Promise.all([fetchBal(pool.asset1), fetchBal(pool.asset2)])
      .then(([b1, b2]) => setUserPoolBalances({ asset1: b1, asset2: b2 }));
  }, [liquidityDialog.open, liquidityDialog.pool, accountProfile?.account, accountProfile?.address, lpRefreshCounter]);

  const handleAmount1Change = (value) => {
    setDepositAmount1(value);
    setPendingDeposit(null);
    if (depositMode === 'double') {
      if (!value) {
        setDepositAmount2('');
      } else if (addLiquidityDialog.pool?.currentLiquidity) {
        const pool = addLiquidityDialog.pool;
        const ratio = pool.currentLiquidity.asset2Amount / pool.currentLiquidity.asset1Amount;
        setDepositAmount2((parseFloat(value) * ratio).toFixed(6));
      }
    }
  };

  const handleAmount2Change = (value) => {
    setDepositAmount2(value);
    setPendingDeposit(null);
    if (depositMode === 'double') {
      if (!value) {
        setDepositAmount1('');
      } else if (addLiquidityDialog.pool?.currentLiquidity) {
        const pool = addLiquidityDialog.pool;
        const ratio = pool.currentLiquidity.asset1Amount / pool.currentLiquidity.asset2Amount;
        setDepositAmount1((parseFloat(value) * ratio).toFixed(6));
      }
    }
  };

  // Withdraw amount handlers — linked in "double" mode
  const handleWithdrawAmount1Change = (value) => {
    setWithdrawAmount1(value);
    setPendingWithdraw(null);
    if (withdrawMode === 'double') {
      if (!value) {
        setWithdrawAmount2('');
      } else if (liquidityDialog.pool?.currentLiquidity) {
        const pool = liquidityDialog.pool;
        const ratio = pool.currentLiquidity.asset2Amount / pool.currentLiquidity.asset1Amount;
        setWithdrawAmount2((parseFloat(value) * ratio).toFixed(6));
      }
    }
  };

  const handleWithdrawAmount2Change = (value) => {
    setWithdrawAmount2(value);
    setPendingWithdraw(null);
    if (withdrawMode === 'double') {
      if (!value) {
        setWithdrawAmount1('');
      } else if (liquidityDialog.pool?.currentLiquidity) {
        const pool = liquidityDialog.pool;
        const ratio = pool.currentLiquidity.asset1Amount / pool.currentLiquidity.asset2Amount;
        setWithdrawAmount1((parseFloat(value) * ratio).toFixed(6));
      }
    }
  };

  // Calculate max withdrawable for single-asset mode (full LP position in one asset)
  const getWithdrawMax = (assetKey) => {
    const pool = liquidityDialog.pool;
    if (!pool?.currentLiquidity) return 0;
    const pa = pool.ammAccount || pool.account || pool._id;
    const lp = userLpBalances[pa];
    if (!lp || lp.balance <= 0) return 0;
    const a1 = lp.asset1Amount || 0;
    const a2 = lp.asset2Amount || 0;
    if (assetKey === 'asset1') {
      // All LP → asset1: pro-rata asset1 + asset2 converted at pool rate
      const rate = pool.currentLiquidity.asset1Amount / pool.currentLiquidity.asset2Amount;
      return a1 + a2 * rate;
    } else {
      // All LP → asset2: pro-rata asset2 + asset1 converted at pool rate
      const rate = pool.currentLiquidity.asset2Amount / pool.currentLiquidity.asset1Amount;
      return a2 + a1 * rate;
    }
  };

  // Parse simulation metadata to extract actual deposit/withdraw amounts and LP tokens
  const parseAmmSimulation = (simResult, pool, txType) => {
    const meta = simResult?.meta;
    if (!meta?.AffectedNodes) return null;

    const account = accountProfile?.account || accountProfile?.address;
    let lpTokenChange = 0;
    let asset1Change = 0;
    let asset2Change = 0;
    const fee = parseInt(simResult?.meta?.Fee || simResult?.fee || '12', 10) / 1_000_000;

    for (const node of meta.AffectedNodes) {
      const mod = node.ModifiedNode || node.CreatedNode || node.DeletedNode;
      if (!mod) continue;

      // LP token balance change (RippleState where issuer is the AMM account)
      if (mod.LedgerEntryType === 'RippleState') {
        const final = mod.FinalFields || mod.NewFields;
        const prev = mod.PreviousFields;
        if (!final) continue;

        const ammAccount = pool.ammAccount || pool.account || pool._id;
        const lowAccount = final.LowLimit?.issuer;
        const highAccount = final.HighLimit?.issuer;
        const isLpToken = lowAccount === ammAccount || highAccount === ammAccount;

        if (isLpToken) {
          const finalBal = parseFloat(final.Balance?.value || 0);
          const prevBal = prev?.Balance ? parseFloat(prev.Balance.value || 0) : 0;
          // LP balance is negative from AMM's perspective if user is low account
          const userIsLow = lowAccount === account;
          lpTokenChange = userIsLow ? -(finalBal - prevBal) : (finalBal - prevBal);
        } else {
          // Token balance change for user
          const isUserLine = lowAccount === account || highAccount === account;
          if (isUserLine) {
            const finalBal = parseFloat(final.Balance?.value || 0);
            const prevBal = prev?.Balance ? parseFloat(prev.Balance.value || 0) : 0;
            const diff = finalBal - prevBal;
            const userIsLow = lowAccount === account;
            const change = userIsLow ? -diff : diff;

            const currency = final.Balance?.currency || final.LowLimit?.currency || final.HighLimit?.currency;
            if (currency === pool.asset1.currency) asset1Change = change;
            else if (currency === pool.asset2.currency) asset2Change = change;
          }
        }
      }

      // XRP balance change (AccountRoot)
      if (mod.LedgerEntryType === 'AccountRoot') {
        const final = mod.FinalFields || mod.NewFields;
        const prev = mod.PreviousFields;
        if (final?.Account === account && prev?.Balance) {
          const finalBal = parseInt(final.Balance, 10) / 1_000_000;
          const prevBal = parseInt(prev.Balance, 10) / 1_000_000;
          const diff = finalBal - prevBal + fee; // Add back fee to get actual asset change
          if (pool.asset1.currency === 'XRP') asset1Change = diff;
          else if (pool.asset2.currency === 'XRP') asset2Change = diff;
        }
      }
    }

    return {
      asset1: { amount: Math.abs(asset1Change), currency: pool.asset1.currency, name: decodeCurrency(pool.asset1.currency) },
      asset2: { amount: Math.abs(asset2Change), currency: pool.asset2.currency, name: decodeCurrency(pool.asset2.currency) },
      lpTokens: Math.abs(lpTokenChange),
      fee,
      isDeposit: txType === 'deposit'
    };
  };

  const makeAssetId = (asset) =>
    asset.currency === 'XRP' ? { currency: 'XRP' } : { currency: asset.currency, issuer: asset.issuer };

  const makeAmount = (asset, value) =>
    asset.currency === 'XRP'
      ? String(Math.floor(parseFloat(value) * 1_000_000))
      : { currency: asset.currency, issuer: asset.issuer, value: String(value) };

  const handleSubmitDeposit = async () => {
    const pool = addLiquidityDialog.pool;
    if (!pool) return;

    const account = accountProfile?.account || accountProfile?.address;
    if (!account) { toast.error('Wallet not connected'); return; }

    const amt1 = parseFloat(depositAmount1);
    const amt2 = parseFloat(depositAmount2);
    if (depositMode === 'double' && (!amt1 || !amt2)) { toast.error('Enter both amounts'); return; }
    if (depositMode === 'single1' && !amt1) { toast.error('Enter amount'); return; }
    if (depositMode === 'single2' && !amt2) { toast.error('Enter amount'); return; }

    setDepositLoading(true);
    const toastId = toast.loading('Simulating deposit...');

    try {
      const { Wallet: XRPLWallet } = await import('xrpl');
      const { EncryptedWalletStorage, deviceFingerprint } = await import('src/utils/encryptedWalletStorage');

      const walletStorage = new EncryptedWalletStorage();
      const deviceKeyId = await deviceFingerprint.getDeviceId();
      const storedPassword = await walletStorage.getWalletCredential(deviceKeyId);
      if (!storedPassword) { toast.error('Wallet locked', { id: toastId }); setDepositLoading(false); return; }

      const walletData = await walletStorage.getWallet(account, storedPassword);
      if (!walletData?.seed) { toast.error('Could not retrieve credentials', { id: toastId }); setDepositLoading(false); return; }

      const algorithm = walletData.seed.startsWith('sEd') ? 'ed25519' : 'secp256k1';
      const deviceWallet = XRPLWallet.fromSeed(walletData.seed, { algorithm });

      const tx = {
        TransactionType: 'AMMDeposit',
        Account: account,
        Asset: makeAssetId(pool.asset1),
        Asset2: makeAssetId(pool.asset2),
        SourceTag: 161803,
        Memos: configureMemos('', '', 'AMM Deposit via https://xrpl.to')
      };

      if (depositMode === 'double') {
        tx.Amount = makeAmount(pool.asset1, depositAmount1);
        tx.Amount2 = makeAmount(pool.asset2, depositAmount2);
        tx.Flags = 1048576; // tfTwoAsset
      } else if (depositMode === 'single1') {
        tx.Amount = makeAmount(pool.asset1, depositAmount1);
        tx.Flags = 524288; // tfSingleAsset
      } else {
        tx.Amount = makeAmount(pool.asset2, depositAmount2);
        tx.Flags = 524288; // tfSingleAsset
      }

      // Simulate only — wait for user confirmation before submitting
      const simResult = await simulateTransaction(tx);
      toast.dismiss(toastId);

      if (simResult.engine_result !== 'tesSUCCESS') {
        setPendingDeposit({ tx: null, error: simResult.engine_result_message || simResult.engine_result });
        setDepositLoading(false);
        return;
      }

      const preview = parseAmmSimulation(simResult, pool, 'deposit');
      setPendingDeposit({ tx, deviceWallet, simResult, preview });
    } catch (err) {
      console.error('[AMM Deposit] Simulation error:', err);
      setPendingDeposit({ tx: null, error: err.message?.slice(0, 80) || 'Simulation failed' });
    }
    setDepositLoading(false);
  };

  const handleConfirmDeposit = async () => {
    if (!pendingDeposit) return;
    const { tx, deviceWallet } = pendingDeposit;
    setDepositLoading(true);
    const toastId = toast.loading('Signing & submitting...');

    try {
      const result = await submitTransaction(deviceWallet, tx);
      const txHash = result.hash || result.tx_json?.hash;
      const engineResult = result.engine_result || result.result?.engine_result;

      if (engineResult !== 'tesSUCCESS') {
        toast.error('Deposit failed', { id: toastId, description: result.engine_result_message || engineResult });
        setDepositLoading(false);
        return;
      }

      // Poll for on-chain confirmation
      toast.loading('Waiting for confirmation...', { id: toastId });
      let validated = false;
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 500));
        try {
          const txRes = await api.get(`https://api.xrpl.to/v1/tx/${txHash}`);
          if (txRes.data?.validated) {
            const txResult = txRes.data?.meta?.TransactionResult || txRes.data?.engine_result;
            if (txResult === 'tesSUCCESS') { validated = true; break; }
            else { toast.error('Deposit failed on-chain', { id: toastId, description: txResult }); setDepositLoading(false); return; }
          }
        } catch (e) { /* continue polling */ }
      }

      if (validated) {
        toast.success('Liquidity added!', { id: toastId, description: `TX: ${txHash?.slice(0, 8)}...` });
      } else {
        toast.success('Deposit submitted', { id: toastId, description: 'Confirmation pending...' });
      }
      setPendingDeposit(null);
      setDepositAmount1('');
      setDepositAmount2('');
      setLpRefreshCounter(c => c + 1);
    } catch (err) {
      console.error('[AMM Deposit]', err);
      toast.error('Deposit failed', { id: toastId, description: err.message?.slice(0, 60) });
      setPendingDeposit(null);
    }
    setDepositLoading(false);
  };

  const handleWithdrawLiquidity = (pool) => {
    setLiquidityDialog({ open: true, pool, tab: 'remove' });
    setWithdrawAmount1('');
    setWithdrawAmount2('');
    setWithdrawMode('double');
  };

  const handleCloseWithdrawDialog = () => {
    setLiquidityDialog({ open: false, pool: null, tab: 'add' });
  };

  const handleSubmitWithdraw = async () => {
    const pool = withdrawDialog.pool;
    if (!pool) return;

    const account = accountProfile?.account || accountProfile?.address;
    if (!account) { toast.error('Wallet not connected'); return; }

    if (withdrawMode === 'double' && !parseFloat(withdrawAmount1) && !parseFloat(withdrawAmount2)) { toast.error('Enter amounts'); return; }
    if (withdrawMode === 'single1' && !parseFloat(withdrawAmount1)) { toast.error('Enter amount'); return; }
    if (withdrawMode === 'single2' && !parseFloat(withdrawAmount2)) { toast.error('Enter amount'); return; }

    setWithdrawLoading(true);
    const toastId = toast.loading('Simulating withdrawal...');

    try {
      const { Wallet: XRPLWallet } = await import('xrpl');
      const { EncryptedWalletStorage, deviceFingerprint } = await import('src/utils/encryptedWalletStorage');

      const walletStorage = new EncryptedWalletStorage();
      const deviceKeyId = await deviceFingerprint.getDeviceId();
      const storedPassword = await walletStorage.getWalletCredential(deviceKeyId);
      if (!storedPassword) { toast.error('Wallet locked', { id: toastId }); setWithdrawLoading(false); return; }

      const walletData = await walletStorage.getWallet(account, storedPassword);
      if (!walletData?.seed) { toast.error('Could not retrieve credentials', { id: toastId }); setWithdrawLoading(false); return; }

      const algorithm = walletData.seed.startsWith('sEd') ? 'ed25519' : 'secp256k1';
      const deviceWallet = XRPLWallet.fromSeed(walletData.seed, { algorithm });

      const tx = {
        TransactionType: 'AMMWithdraw',
        Account: account,
        Asset: makeAssetId(pool.asset1),
        Asset2: makeAssetId(pool.asset2),
        SourceTag: 161803,
        Memos: configureMemos('', '', 'AMM Withdraw via https://xrpl.to')
      };

      if (withdrawMode === 'all') {
        tx.Flags = 131072; // tfWithdrawAll
      } else if (withdrawMode === 'double') {
        tx.Amount = makeAmount(pool.asset1, withdrawAmount1);
        tx.Amount2 = makeAmount(pool.asset2, withdrawAmount2);
        tx.Flags = 1048576; // tfTwoAsset
      } else if (withdrawMode === 'single1') {
        tx.Amount = makeAmount(pool.asset1, withdrawAmount1);
        tx.Flags = 524288; // tfSingleAsset
      } else {
        tx.Amount = makeAmount(pool.asset2, withdrawAmount2);
        tx.Flags = 524288; // tfSingleAsset
      }

      // Simulate only — wait for user confirmation before submitting
      const simResult = await simulateTransaction(tx);
      toast.dismiss(toastId);

      if (simResult.engine_result !== 'tesSUCCESS') {
        setPendingWithdraw({ tx: null, error: simResult.engine_result_message || simResult.engine_result });
        setWithdrawLoading(false);
        return;
      }

      const preview = parseAmmSimulation(simResult, pool, 'withdraw');
      setPendingWithdraw({ tx, deviceWallet, simResult, preview });
    } catch (err) {
      console.error('[AMM Withdraw] Simulation error:', err);
      setPendingWithdraw({ tx: null, error: err.message?.slice(0, 80) || 'Simulation failed' });
    }
    setWithdrawLoading(false);
  };

  const handleConfirmWithdraw = async () => {
    if (!pendingWithdraw) return;
    const { tx, deviceWallet } = pendingWithdraw;
    setWithdrawLoading(true);
    const toastId = toast.loading('Signing & submitting...');

    try {
      const result = await submitTransaction(deviceWallet, tx);
      const txHash = result.hash || result.tx_json?.hash;
      const engineResult = result.engine_result || result.result?.engine_result;

      if (engineResult !== 'tesSUCCESS') {
        toast.error('Withdraw failed', { id: toastId, description: result.engine_result_message || engineResult });
        setWithdrawLoading(false);
        return;
      }

      // Poll for on-chain confirmation
      toast.loading('Waiting for confirmation...', { id: toastId });
      let validated = false;
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 500));
        try {
          const txRes = await api.get(`https://api.xrpl.to/v1/tx/${txHash}`);
          if (txRes.data?.validated) {
            const txResult = txRes.data?.meta?.TransactionResult || txRes.data?.engine_result;
            if (txResult === 'tesSUCCESS') { validated = true; break; }
            else { toast.error('Withdraw failed on-chain', { id: toastId, description: txResult }); setWithdrawLoading(false); return; }
          }
        } catch (e) { /* continue polling */ }
      }

      if (validated) {
        toast.success('Liquidity removed!', { id: toastId, description: `TX: ${txHash?.slice(0, 8)}...` });
      } else {
        toast.success('Withdrawal submitted', { id: toastId, description: 'Confirmation pending...' });
      }
      setPendingWithdraw(null);
      setWithdrawAmount1('');
      setWithdrawAmount2('');
      setLpRefreshCounter(c => c + 1);
    } catch (err) {
      console.error('[AMM Withdraw]', err);
      toast.error('Withdraw failed', { id: toastId, description: err.message?.slice(0, 60) });
      setPendingWithdraw(null);
    }
    setWithdrawLoading(false);
  };

  // Fetch chart data for a specific pool
  const fetchPoolChartData = useCallback(
    async (poolAccount) => {
      if (!poolAccount || poolChartData[poolAccount] || poolChartLoading[poolAccount]) return;

      setPoolChartLoading((prev) => ({ ...prev, [poolAccount]: true }));
      try {
        // Try 1m first, fall back to 1w, then all
        let res = await fetch(
          `https://api.xrpl.to/v1/amm/liquidity-chart?ammAccount=${poolAccount}&period=1m`
        );
        let data = await res.json();

        if (data.success && (!data.data || data.data.length < 2)) {
          res = await fetch(
            `https://api.xrpl.to/v1/amm/liquidity-chart?ammAccount=${poolAccount}&period=1w`
          );
          data = await res.json();
        }

        if (data.success && (!data.data || data.data.length < 2)) {
          res = await fetch(
            `https://api.xrpl.to/v1/amm/liquidity-chart?ammAccount=${poolAccount}&period=all`
          );
          data = await res.json();
        }

        if (data.success && data.data && data.data.length >= 2) {
          setPoolChartData((prev) => ({ ...prev, [poolAccount]: data.data }));
        }
      } catch (error) {
        console.error('Error fetching pool chart:', error);
      } finally {
        setPoolChartLoading((prev) => ({ ...prev, [poolAccount]: false }));
      }
    },
    [poolChartData, poolChartLoading]
  );

  // Handle pool row expansion
  const handlePoolExpand = useCallback(
    (poolId, pool) => {
      if (expandedPoolId === poolId) {
        setExpandedPoolId(null);
      } else {
        setExpandedPoolId(poolId);
        const poolAccount = pool.ammAccount || pool.account || pool._id;
        fetchPoolChartData(poolAccount);
      }
    },
    [expandedPoolId, fetchPoolChartData]
  );

  // Handle pool sorting
  const handlePoolSort = useCallback(
    (column) => {
      if (poolSortBy === column) {
        setPoolSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'));
      } else {
        setPoolSortBy(column);
        setPoolSortDir('desc');
      }
    },
    [poolSortBy]
  );

  // Filter and sort pools
  const filteredAndSortedPools = useMemo(() => {
    let filtered = [...ammPools];

    // Apply type filter
    if (poolTypeFilter === 'xrp') {
      filtered = filtered.filter(
        (pool) => pool.asset1?.currency === 'XRP' || pool.asset2?.currency === 'XRP'
      );
    } else if (poolTypeFilter === 'token') {
      filtered = filtered.filter(
        (pool) => pool.asset1?.currency !== 'XRP' && pool.asset2?.currency !== 'XRP'
      );
    }

    // Sort - always keep main pool first
    filtered.sort((a, b) => {
      const aIsMain =
        (a.asset1?.currency === 'XRP' &&
          a.asset2?.issuer === token?.issuer &&
          a.asset2?.currency === token?.currency) ||
        (a.asset2?.currency === 'XRP' &&
          a.asset1?.issuer === token?.issuer &&
          a.asset1?.currency === token?.currency);
      const bIsMain =
        (b.asset1?.currency === 'XRP' &&
          b.asset2?.issuer === token?.issuer &&
          b.asset2?.currency === token?.currency) ||
        (b.asset2?.currency === 'XRP' &&
          b.asset1?.issuer === token?.issuer &&
          b.asset1?.currency === token?.currency);

      if (aIsMain && !bIsMain) return -1;
      if (!aIsMain && bIsMain) return 1;

      // Apply sorting
      let aVal = 0,
        bVal = 0;
      switch (poolSortBy) {
        case 'apy':
          aVal = a.apy7d?.apy || 0;
          bVal = b.apy7d?.apy || 0;
          break;
        case 'volume':
          aVal = a.apy7d?.volume || 0;
          bVal = b.apy7d?.volume || 0;
          break;
        case 'fees':
          aVal = a.apy7d?.fees || 0;
          bVal = b.apy7d?.fees || 0;
          break;
        case 'liquidity':
        default:
          aVal = a.apy7d?.liquidity || 0;
          bVal = b.apy7d?.liquidity || 0;
      }

      return poolSortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });

    return filtered;
  }, [ammPools, poolTypeFilter, poolSortBy, poolSortDir, token]);

  const calculatePrice = useCallback((trade) => {
    const xrpAmount = trade.got.currency === 'XRP' ? trade.got.value : trade.paid.value;
    const tokenAmount = trade.got.currency === 'XRP' ? trade.paid.value : trade.got.value;
    const parsedToken = parseFloat(tokenAmount);
    // Return null if token amount is zero or invalid to avoid Infinity
    if (!parsedToken || parsedToken === 0) {
      return null;
    }
    return parseFloat(xrpAmount) / parsedToken;
  }, []);

  // Memoized trade list rendering
  const renderedTrades = useMemo(() => {
    // Helper to get display address for a trade
    const getTradeAddress = (t) => {
      if (!t) return null;

      // For liquidity events, use account field
      if (t.isLiquidity) {
        return t.account || null;
      }

      // For regular trades, prefer taker unless it's the AMM
      let addr = t.taker;

      // If taker is the AMM or missing, use maker instead
      if (!addr || (amm && addr === amm)) {
        addr = t.maker;
      }

      // Final fallback: try account field if exists (some trade types may use it)
      if (!addr) {
        addr = t.account;
      }

      return addr || null;
    };

    // Pre-compute which addresses appear more than once and assign colors
    const addressCounts = {};
    trades.forEach((trade) => {
      const addr = getTradeAddress(trade);
      if (addr) addressCounts[addr] = (addressCounts[addr] || 0) + 1;
    });
    const dotColors = [
      '#3b82f6',
      '#22c55e',
      '#f59e0b',
      '#ef4444',
      '#8b5cf6',
      '#ec4899',
      '#14b8a6',
      '#f97316'
    ];
    const addressColorMap = {};
    let colorIndex = 0;
    Object.keys(addressCounts).forEach((addr) => {
      if (addressCounts[addr] > 1) {
        addressColorMap[addr] = dotColors[colorIndex % dotColors.length];
        colorIndex++;
      }
    });
    const getAddressDotColor = (trade) => {
      const addr = getTradeAddress(trade);
      return addr ? addressColorMap[addr] : null;
    };

    return trades.map((trade, index) => {
      const isLiquidity = trade.isLiquidity;
      const isBuy = trade.paid.currency === 'XRP';
      const xrpAmount = getXRPAmount(trade);
      const price = isLiquidity ? null : calculatePrice(trade);
      const volumePercentage = Math.min(100, Math.max(5, (xrpAmount / 50000) * 100));

      const amountData = isBuy ? trade.got : trade.paid;
      const totalData = isBuy ? trade.paid : trade.got;

      // For liquidity events, show the account; for trades show taker (or maker if taker is AMM)
      const addressToShow = getTradeAddress(trade);
      const dotColor = getAddressDotColor(trade);

      // Simple liquidity label
      const getLiquidityLabel = () => {
        if (trade.type === 'withdraw') return 'Remove';
        if (trade.type === 'create') return 'Create';
        return 'Add';
      };

      // Mobile card layout - grid similar to desktop
      if (isMobile) {
        const barWidth = Math.min(100, Math.max(15, Math.log10(xrpAmount + 1) * 25));
        return (
          <Card
            key={trade._id || trade.id || index}
            isNew={newTradeIds.has(trade._id || trade.id)}
            isDark={isDark}
          >
            <CardContent className="!py-[6px] !px-0">
              <div className="grid grid-cols-[52px_36px_1fr_1fr_24px] gap-2 items-center">
                {/* Time */}
                <span className={cn('text-[10px] font-semibold tabular-nums', isDark ? 'text-white/45' : 'text-black/45')}>
                  {formatRelativeTime(trade.time)}
                </span>

                {/* Type */}
                {isLiquidity ? (
                  <span className={cn('text-[9px] font-bold uppercase tracking-[0.04em]', trade.type === 'withdraw' ? 'text-[#f59e0b]' : trade.type === 'create' ? 'text-[#14b8a6]' : 'text-[#8b5cf6]')}>
                    {getLiquidityLabel()}
                  </span>
                ) : (
                  <span className={cn('text-[10px] font-extrabold uppercase tracking-[0.04em]', isBuy ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                    {isBuy ? 'Buy' : 'Sell'}
                  </span>
                )}

                {/* Token Amount with bar */}
                <BarCell
                  barWidth={barWidth}
                  isBuy={isBuy}
                  isLP={isLiquidity}
                  isCreate={trade.type === 'create'}
                  isDark={isDark}
                  className="h-[26px] !px-2"
                >
                  <span className={cn('text-[11px] font-semibold font-mono', isDark ? 'text-white' : 'text-[#1a1a1a]')}>
                    {formatTradeDisplay(amountData.value)}
                  </span>
                </BarCell>

                {/* XRP Amount with bar */}
                <BarCell
                  barWidth={barWidth}
                  isBuy={isBuy}
                  isLP={isLiquidity}
                  isCreate={trade.type === 'create'}
                  isDark={isDark}
                  className="h-[26px] !px-2"
                >
                  <span className={cn('text-[11px] font-semibold font-mono', isDark ? 'text-white' : 'text-[#1a1a1a]')}>
                    {formatTradeDisplay(totalData.value)}
                  </span>
                </BarCell>

                {/* Link */}
                <IconButton
                  onClick={() => handleTxClick(trade.hash, addressToShow)}
                  isDark={isDark}
                  className="p-1 bg-transparent"
                >
                  <ExternalLink size={12} strokeWidth={2.5} />
                </IconButton>
              </div>
            </CardContent>
          </Card>
        );
      }

      // Desktop grid layout - matching screenshot design with colored bars
      // Both bars scale based on XRP value for consistent sizing
      const barWidth = Math.min(100, Math.max(15, Math.log10(xrpAmount + 1) * 25));

      return (
        <Card
          key={trade._id || trade.id || index}
          isNew={newTradeIds.has(trade._id || trade.id)}
          isDark={isDark}
        >
          <CardContent className="!py-[6px] !px-0">
            <div
              className="grid gap-2 items-center cursor-pointer"
              style={{ gridTemplateColumns: `70px 50px 90px 1fr 1fr ${activeFiatCurrency !== 'XRP' ? '70px ' : ''}95px 70px 40px` }}
              onClick={() =>
                setExpandedTradeId(
                  expandedTradeId === (trade._id || trade.id) ? null : trade._id || trade.id
                )
              }
            >
              {/* Time */}
              <span className={cn('text-[11px] font-semibold tabular-nums', isDark ? 'text-white/45' : 'text-black/45')}>
                {formatRelativeTime(trade.time, true)}
              </span>

              {/* Type */}
              {isLiquidity ? (
                <span className={cn('text-[10px] font-bold uppercase tracking-[0.04em]', trade.type === 'withdraw' ? 'text-[#f59e0b]' : trade.type === 'create' ? 'text-[#14b8a6]' : 'text-[#8b5cf6]')}>
                  {getLiquidityLabel()}
                </span>
              ) : (
                <div className="flex items-center gap-1">
                  <span className={cn('text-[11px] font-extrabold uppercase tracking-[0.04em]', isBuy ? 'text-[#22c55e]' : 'text-[#ef4444]')}>
                    {isBuy ? 'Buy' : 'Sell'}
                  </span>
                </div>
              )}

              {/* Price */}
              <span className={cn('text-[12px] font-bold font-mono -tracking-[0.02em]', isDark ? 'text-white' : 'text-[#1a1a1a]')}>
                {isLiquidity ? '-' : formatPrice(price)}
              </span>

              {/* Amount with colored bar */}
              <BarCell
                barWidth={barWidth}
                isBuy={isBuy}
                isLP={isLiquidity}
                isCreate={trade.type === 'create'}
                isDark={isDark}
              >
                <span className={cn('text-[12px] font-mono', isDark ? 'text-white' : 'text-[#1a1a1a]')}>
                  {formatTradeDisplay(amountData.value)}{' '}
                  <span className="opacity-40 text-[10px] font-normal">
                    {decodeCurrency(amountData.currency)}
                  </span>
                </span>
              </BarCell>

              {/* Value with colored bar */}
              <BarCell
                barWidth={barWidth}
                isBuy={isBuy}
                isLP={isLiquidity}
                isCreate={trade.type === 'create'}
                isDark={isDark}
              >
                <span className={cn('text-[12px] font-mono', isDark ? 'text-white' : 'text-[#1a1a1a]')}>
                  {formatTradeDisplay(totalData.value)}{' '}
                  <span className="opacity-40 text-[10px] font-normal">
                    {decodeCurrency(totalData.currency)}
                  </span>
                </span>
              </BarCell>

              {/* Fiat Value */}
              {activeFiatCurrency !== 'XRP' && (
                <span className={cn('text-[11px] font-medium text-right font-mono', isDark ? 'text-white/60' : 'text-black/60')}>
                  {SYMBOLS[activeFiatCurrency]}
                  {formatTradeDisplay(
                    (xrpAmount > 0
                      ? xrpAmount
                      : parseFloat(amountData.value) * (token?.exch || 0)) / exchRate
                  )}
                </span>
              )}

              {/* Trader Address */}
              <a
                href={`/address/${addressToShow}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  'inline-flex items-center gap-2 px-2 py-1 rounded-md border transition-all duration-200 text-[11px] font-mono no-underline whitespace-nowrap overflow-hidden text-ellipsis max-w-[95px]',
                  isDark
                    ? 'bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12] text-white/50 hover:text-white/80'
                    : 'bg-black/[0.02] border-black/[0.04] hover:bg-black/[0.04] hover:border-black/[0.08] text-gray-500 hover:text-gray-900'
                )}
                title={addressToShow}
              >
                {dotColor && (
                  <span
                    className="w-[5px] h-[5px] rounded-full shrink-0"
                    style={{ background: dotColor, boxShadow: `0 0 6px ${dotColor}80` }}
                  />
                )}
                {walletLabels[addressToShow] ? (
                  <span className="font-semibold text-[#3b82f6]">{walletLabels[addressToShow]}</span>
                ) : addressToShow ? `${addressToShow.slice(0, 4)}...${addressToShow.slice(-4)}` : '-'}
              </a>

              {/* Source */}
              <span className={cn('text-[10px] font-medium overflow-hidden text-ellipsis whitespace-nowrap uppercase tracking-[0.02em]', isDark ? 'text-white/35' : 'text-black/40')}>
                {getSourceTagName(trade.sourceTag) || (isLiquidity ? 'AMM' : '')}
              </span>

              {/* Animal tier icon */}
              <div className="flex items-center justify-center opacity-80">
                <TierIcon xrpValue={xrpAmount} isDark={isDark} />
              </div>
            </div>
          </CardContent>
          {/* Inline expanded details */}
          {expandedTradeId === (trade._id || trade.id) && (
            <TradeDetails
              trade={trade}
              account={addressToShow}
              isDark={isDark}
              onClose={() => setExpandedTradeId(null)}
              walletLabel={walletLabels[addressToShow]}
            />
          )}
        </Card>
      );
    });
  }, [
    trades,
    newTradeIds,
    amm,
    calculatePrice,
    handleTxClick,
    isMobile,
    isDark,
    expandedTradeId,
    activeFiatCurrency,
    exchRate
  ]);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex justify-center p-8">
          <Spinner size={32} />
        </div>
      </div>
    );
  }

  const emptyState = (
    <BearEmptyState
      isDark={isDark}
      title={historyType === 'liquidity' ? 'No Liquidity Events' : historyType === 'all' ? 'No Activity' : 'No Recent Trades'}
      subtitle={historyType === 'liquidity' ? 'AMM liquidity events will appear here' : 'Trading activity will appear here when available'}
    />
  );

  return (
    <div className="flex flex-col gap-2 w-full flex-1 relative z-0">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Tabs isDark={isDark}>
          <Tab selected={tabValue === 0} onClick={(e) => handleTabChange(e, 0)} isDark={isDark}>
            <Activity size={14} />
            <span>Trades</span>
          </Tab>
          <Tab selected={tabValue === 1} onClick={(e) => handleTabChange(e, 1)} isDark={isDark}>
            <Droplets size={14} />
            <span>Pools</span>
          </Tab>
          <Tab selected={tabValue === 2} onClick={(e) => handleTabChange(e, 2)} isDark={isDark}>
            <Users size={14} />
            <span>Traders</span>
          </Tab>
          <Tab selected={tabValue === 3} onClick={(e) => handleTabChange(e, 3)} isDark={isDark}>
            <PieChart size={14} />
            <span>Holders</span>
          </Tab>
          <Tab selected={tabValue === 4} onClick={(e) => handleTabChange(e, 4)} isDark={isDark}>
            <Wallet size={14} />
            <span>My Activity</span>
          </Tab>
        </Tabs>
        {tabValue === 0 && !isMobile && (
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={pairType}
              onChange={(e) => setPairType(e.target.value)}
              className={cn(
                'py-[5px] px-2 text-[11px] font-medium rounded-[6px] border cursor-pointer outline-none appearance-none',
                isDark ? 'color-scheme-dark' : 'color-scheme-light',
                pairType
                  ? cn('border-[#3b82f6] text-[#3b82f6]', isDark ? 'bg-[rgba(59,130,246,0.15)]' : 'bg-[rgba(59,130,246,0.1)]')
                  : cn(isDark ? 'border-[rgba(59,130,246,0.15)] bg-black/80 text-white/60' : 'border-black/[0.12] bg-white text-black/60')
              )}
            >
              <option value="" className={isDark ? 'bg-[#1a1a1a]' : 'bg-white'}>
                All Pairs
              </option>
              <option value="xrp" className={isDark ? 'bg-[#1a1a1a]' : 'bg-white'}>
                XRP Pairs
              </option>
              <option value="token" className={isDark ? 'bg-[#1a1a1a]' : 'bg-white'}>
                Token Pairs
              </option>
            </select>
            <select
              value={historyType}
              onChange={(e) => {
                const newType = e.target.value;
                setHistoryType(newType);
                // Clear liquidityType filter when switching away from liquidity
                if (newType !== 'liquidity') {
                  setLiquidityType('');
                }
              }}
              className={cn(
                'py-[5px] px-2 text-[11px] font-medium rounded-[6px] border cursor-pointer outline-none appearance-none',
                isDark ? 'color-scheme-dark' : 'color-scheme-light',
                historyType !== 'trades'
                  ? cn('border-[#3b82f6] text-[#3b82f6]', isDark ? 'bg-[rgba(59,130,246,0.15)]' : 'bg-[rgba(59,130,246,0.1)]')
                  : cn(isDark ? 'border-[rgba(59,130,246,0.15)] bg-black/80 text-white/60' : 'border-black/[0.12] bg-white text-black/60')
              )}
            >
              <option value="trades" className={isDark ? 'bg-[#1a1a1a]' : 'bg-white'}>
                Trades
              </option>
              <option value="liquidity" className={isDark ? 'bg-[#1a1a1a]' : 'bg-white'}>
                Liquidity
              </option>
              <option value="all" className={isDark ? 'bg-[#1a1a1a]' : 'bg-white'}>
                All
              </option>
            </select>
            {historyType === 'liquidity' && (
              <select
                value={liquidityType}
                onChange={(e) => setLiquidityType(e.target.value)}
                className={cn(
                  'py-[5px] px-2 text-[11px] font-medium rounded-[6px] border cursor-pointer outline-none appearance-none',
                  isDark ? 'color-scheme-dark' : 'color-scheme-light',
                  liquidityType
                    ? cn('border-[#8b5cf6] text-[#8b5cf6]', isDark ? 'bg-[rgba(139,92,246,0.15)]' : 'bg-[rgba(139,92,246,0.1)]')
                    : cn(isDark ? 'border-[rgba(59,130,246,0.15)] bg-black/80 text-white/60' : 'border-black/[0.12] bg-white text-black/60')
                )}
              >
                <option value="" className={isDark ? 'bg-[#1a1a1a]' : 'bg-white'}>
                  All Events
                </option>
                <option value="deposit" className={isDark ? 'bg-[#1a1a1a]' : 'bg-white'}>
                  Deposits
                </option>
                <option value="withdraw" className={isDark ? 'bg-[#1a1a1a]' : 'bg-white'}>
                  Withdrawals
                </option>
                <option value="create" className={isDark ? 'bg-[#1a1a1a]' : 'bg-white'}>
                  Pool Creates
                </option>
              </select>
            )}
            <select
              value={xrpAmount}
              onChange={(e) => setXrpAmount(e.target.value)}
              className={cn(
                'py-[5px] px-2 text-[11px] font-medium rounded-[6px] border cursor-pointer outline-none appearance-none',
                isDark ? 'color-scheme-dark' : 'color-scheme-light',
                xrpAmount
                  ? cn('border-[#3b82f6] text-[#3b82f6]', isDark ? 'bg-[rgba(59,130,246,0.15)]' : 'bg-[rgba(59,130,246,0.1)]')
                  : cn(isDark ? 'border-[rgba(59,130,246,0.15)] bg-black/80 text-white/60' : 'border-black/[0.12] bg-white text-black/60')
              )}
            >
              <option value="" className={isDark ? 'bg-[#1a1a1a]' : 'bg-white'}>
                Min XRP
              </option>
              <option value="100" className={isDark ? 'bg-[#1a1a1a]' : 'bg-white'}>
                100+
              </option>
              <option value="500" className={isDark ? 'bg-[#1a1a1a]' : 'bg-white'}>
                500+
              </option>
              <option value="1000" className={isDark ? 'bg-[#1a1a1a]' : 'bg-white'}>
                1k+
              </option>
              <option value="2500" className={isDark ? 'bg-[#1a1a1a]' : 'bg-white'}>
                2.5k+
              </option>
              <option value="5000" className={isDark ? 'bg-[#1a1a1a]' : 'bg-white'}>
                5k+
              </option>
              <option value="10000" className={isDark ? 'bg-[#1a1a1a]' : 'bg-white'}>
                10k+
              </option>
            </select>
            <input
              type="text"
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              placeholder="Filter account..."
              className={cn(
                'py-[5px] px-2 text-[11px] font-medium rounded-[6px] border outline-none w-[120px]',
                isDark ? 'text-white' : 'text-[#1a1a1a]',
                accountFilter
                  ? cn('border-[#3b82f6]', isDark ? 'bg-[rgba(59,130,246,0.15)]' : 'bg-[rgba(59,130,246,0.1)]')
                  : cn(isDark ? 'border-[rgba(59,130,246,0.15)] bg-black/80' : 'border-black/[0.12] bg-white')
              )}
            />
          </div>
        )}
      </div>

      {tabValue === 0 && (
        <>
          {/* Desktop header - hidden on mobile */}
          {!isMobile && (
            <div
              className={cn('grid gap-2 py-3 sticky top-0 z-10 backdrop-blur-[8px] border-b', isDark ? 'bg-[rgba(10,10,10,0.8)] border-white/[0.08]' : 'bg-[rgba(255,255,255,0.8)] border-black/[0.08]')}
              style={{ gridTemplateColumns: `70px 50px 90px 1fr 1fr ${activeFiatCurrency !== 'XRP' ? '70px ' : ''}95px 70px 40px` }}
            >
              <div className={cn('text-[11px] font-semibold uppercase tracking-[0.08em] flex items-center gap-[6px]', isDark ? 'text-white/40' : 'text-black/40')}>
                Time
                <LiveIndicator isDark={isDark}>
                  <LiveCircle />
                </LiveIndicator>
              </div>
              <div className={cn('text-[11px] font-semibold uppercase tracking-[0.08em]', isDark ? 'text-white/40' : 'text-black/40')}>
                Type
              </div>
              <div className={cn('text-[11px] font-semibold uppercase tracking-[0.08em]', isDark ? 'text-white/40' : 'text-black/40')}>
                Price
              </div>
              <div className={cn('text-[11px] font-semibold uppercase tracking-[0.08em] pl-[10px]', isDark ? 'text-white/40' : 'text-black/40')}>
                Amount
              </div>
              <div className={cn('text-[11px] font-semibold uppercase tracking-[0.08em] pl-[10px]', isDark ? 'text-white/40' : 'text-black/40')}>
                Value
              </div>
              {activeFiatCurrency !== 'XRP' && (
                <div className={cn('text-[11px] font-semibold uppercase tracking-[0.08em] text-right', isDark ? 'text-white/40' : 'text-black/40')}>
                  {activeFiatCurrency}
                </div>
              )}
              <div className={cn('text-[11px] font-semibold uppercase tracking-[0.08em]', isDark ? 'text-white/40' : 'text-black/40')}>
                Trader
              </div>
              <div className={cn('text-[11px] font-semibold uppercase tracking-[0.08em]', isDark ? 'text-white/40' : 'text-black/40')}>
                Source
              </div>
              <div></div>
            </div>
          )}

          {/* Mobile header with column labels */}
          {isMobile && (
            <div className={cn('grid grid-cols-[52px_36px_1fr_1fr_24px] gap-[6px] items-center px-3 py-1 mb-1 border-b', isDark ? 'border-white/[0.06]' : 'border-black/[0.06]')}>
              <span className={cn('text-[9px] font-medium uppercase', isDark ? 'text-white/40' : 'text-black/40')}>Time</span>
              <span className={cn('text-[9px] font-medium uppercase', isDark ? 'text-white/40' : 'text-black/40')}>Type</span>
              <span className={cn('text-[9px] font-medium uppercase', isDark ? 'text-white/40' : 'text-black/40')}>Amount</span>
              <span className={cn('text-[9px] font-medium uppercase', isDark ? 'text-white/40' : 'text-black/40')}>Total</span>
              <span></span>
            </div>
          )}

          {trades.length === 0 ? (
            emptyState
          ) : (
            <div className="flex flex-col flex-1 overflow-auto">
              {renderedTrades}
            </div>
          )}

          {/* Cursor-based pagination */}
          {(totalRecords > limit || currentPage > 1) && (
            <div className="flex justify-center items-center mt-[10px]">
              <Pagination isDark={isDark}>
                <PaginationButton
                  onClick={handleFirstPage}
                  disabled={currentPage === 1}
                  isDark={isDark}
                  title="First"
                >
                  <ChevronsLeft size={14} />
                </PaginationButton>
                <PaginationButton
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  isDark={isDark}
                  title="Previous"
                >
                  <ChevronLeft size={14} />
                </PaginationButton>
                <PageInfo isDark={isDark}>
                  {currentPage.toLocaleString()}
                  <span className="opacity-50">/</span>
                  {Math.ceil(totalRecords / limit).toLocaleString()}
                </PageInfo>
                <PaginationButton
                  onClick={handleNextPage}
                  disabled={isLastPage}
                  isDark={isDark}
                  title="Next"
                >
                  <ChevronRight size={14} />
                </PaginationButton>
                <PaginationButton
                  onClick={handleLastPage}
                  disabled={isLastPage && direction === 'asc'}
                  isDark={isDark}
                  title="Last"
                >
                  <ChevronsRight size={14} />
                </PaginationButton>
              </Pagination>
            </div>
          )}
        </>
      )}

      {tabValue === 1 && (
        <div className="flex flex-col gap-4">
          {/* Pool Controls - Filter & Sort */}
          {!ammLoading && ammPools.length > 0 && (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              {/* Pool Type Filter */}
              <div className={cn('flex gap-1 p-1 rounded-[10px]', isDark ? 'bg-white/[0.03]' : 'bg-black/[0.03]')}>
                {[
                  { value: 'all', label: 'All' },
                  { value: 'xrp', label: 'XRP Pools' },
                  { value: 'token', label: 'Token Pools' }
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setPoolTypeFilter(value)}
                    className={cn(
                      'py-[6px] px-3 text-[11px] font-semibold rounded-lg border-none cursor-pointer transition-all duration-200 whitespace-nowrap',
                      poolTypeFilter === value
                        ? cn(isDark ? 'bg-white/[0.08] text-white' : 'bg-white text-[#1a1a1a] shadow-[0_1px_3px_rgba(0,0,0,0.1)]')
                        : cn('bg-transparent', isDark ? 'text-white/45' : 'text-black/50')
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Sort Control + Create Pool */}
              <div className="flex items-center gap-2">
                <div className={cn('flex items-center rounded-[10px] p-[2px]', isDark ? 'bg-white/[0.03]' : 'bg-black/[0.03]')}>
                  <div className="flex items-center gap-1 pl-[10px] pr-2">
                    <Filter
                      size={12}
                      className={cn(isDark ? 'text-white/30' : 'text-black/30')}
                    />
                    <select
                      value={poolSortBy}
                      onChange={(e) => setPoolSortBy(e.target.value)}
                      className={cn('py-[6px] px-1 text-[11px] font-semibold border-none bg-transparent cursor-pointer outline-none appearance-none', isDark ? 'text-white/80' : 'text-black/80')}
                    >
                      <option value="liquidity">TVL</option>
                      <option value="apy">APY</option>
                      <option value="volume">Volume</option>
                      <option value="fees">Fees</option>
                    </select>
                  </div>
                  <button
                    onClick={() => setPoolSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                    className={cn(
                      'w-7 h-7 rounded-lg border-none cursor-pointer flex items-center justify-center transition-all duration-200',
                      isDark ? 'bg-white/5 text-white' : 'bg-white text-[#1a1a1a] shadow-[0_1px_2px_rgba(0,0,0,0.05)]'
                    )}
                    title={poolSortDir === 'desc' ? 'Highest first' : 'Lowest first'}
                  >
                    {poolSortDir === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                  </button>
                </div>
                <button
                  onClick={() => handleOpenCreatePool()}
                  className="flex items-center gap-[5px] py-[7px] px-[14px] text-[11px] font-semibold rounded-[10px] border-none bg-[#137DFE] text-white cursor-pointer transition-all duration-150 whitespace-nowrap"
                >
                  <Plus size={13} />
                  Create Pool
                </button>
              </div>
            </div>
          )}

          {/* Missing XRP pool banner */}
          {!ammLoading && ammPools.length > 0 && !hasXrpPool && token?.currency !== 'XRP' && (
            <div className={cn('flex items-center justify-between gap-3 py-[10px] px-[14px] rounded-[10px] border-[1.5px]', isDark ? 'bg-[rgba(19,125,254,0.06)] border-[rgba(19,125,254,0.15)]' : 'bg-[rgba(19,125,254,0.04)] border-[rgba(19,125,254,0.12)]')}>
              <div className="flex items-center gap-2">
                <Droplets size={14} className="text-[#137DFE] shrink-0" />
                <span className={cn('text-[12px]', isDark ? 'text-white/70' : 'text-black/60')}>
                  No {decodeCurrency(token?.currency)} / XRP pool exists yet
                </span>
              </div>
              <button
                onClick={() => handleOpenCreatePool({ currency: 'XRP' })}
                className="flex items-center gap-1 py-[5px] px-3 text-[11px] font-semibold rounded-lg border-none bg-[#137DFE] text-white cursor-pointer whitespace-nowrap transition-all duration-150"
              >
                <Plus size={12} />
                Create XRP Pool
              </button>
            </div>
          )}

          {ammLoading ? (
            <div className="flex justify-center p-6">
              <Spinner size={20} />
            </div>
          ) : ammPools.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 px-4">
              <BearEmptyState isDark={isDark} title="No pools found" subtitle="Be the first to create a liquidity pool for this token" />
              <button
                onClick={() => handleOpenCreatePool({ currency: 'XRP' })}
                className="flex items-center gap-[6px] py-[10px] px-5 text-[13px] font-semibold rounded-[10px] border-none bg-[#137DFE] text-white cursor-pointer transition-all duration-150"
              >
                <Plus size={15} />
                Create {token?.currency === 'XRP' ? '' : decodeCurrency(token?.currency) + ' / '}XRP Pool
              </button>
            </div>
          ) : filteredAndSortedPools.length === 0 ? (
            <BearEmptyState isDark={isDark} title={`No ${poolTypeFilter === 'xrp' ? 'XRP' : 'token/token'} pools found`} subtitle="Try a different filter" />
          ) : isMobile ? (
            /* Mobile pool cards */
            <div className="flex flex-col gap-2">
              {filteredAndSortedPools.map((pool) => {
                const asset1 =
                  pool.asset1?.currency === 'XRP' ? 'XRP' : decodeCurrency(pool.asset1?.currency);
                const asset2 =
                  pool.asset2?.currency === 'XRP' ? 'XRP' : decodeCurrency(pool.asset2?.currency);
                const hasApy = pool.apy7d?.apy > 0;
                const isMainPool =
                  (pool.asset1?.currency === 'XRP' &&
                    pool.asset2?.issuer === token?.issuer &&
                    pool.asset2?.currency === token?.currency) ||
                  (pool.asset2?.currency === 'XRP' &&
                    pool.asset1?.issuer === token?.issuer &&
                    pool.asset1?.currency === token?.currency);
                const poolAccount = pool.ammAccount || pool.account || pool._id;
                const chartData = poolChartData[poolAccount];
                const isChartLoading = poolChartLoading[poolAccount];
                const isExpanded = expandedPoolId === pool._id;
                const userPosition = userLpBalances[poolAccount];

                return (
                  <div
                    key={pool._id}
                    className={cn(
                      'rounded-[14px] overflow-hidden transition-all duration-200 border',
                      isDark ? 'bg-white/[0.03]' : 'bg-black/[0.02]',
                      isMainPool ? 'border-[#3b82f6]' : isDark ? 'border-white/[0.06]' : 'border-black/[0.06]'
                    )}
                  >
                    <div
                      onClick={() => handlePoolExpand(pool._id, pool)}
                      className="p-3 cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-[10px]">
                        <div className="flex items-center gap-[10px]">
                          <div className="flex shrink-0">
                            <img
                              src={getTokenImageUrl(pool.asset1.issuer, pool.asset1.currency)}
                              alt=""
                              className={cn('w-6 h-6 rounded-full', isDark ? 'border-[1.5px] border-[#1a1a1a]' : 'border-[1.5px] border-white')}
                            />
                            <img
                              src={getTokenImageUrl(pool.asset2.issuer, pool.asset2.currency)}
                              alt=""
                              className={cn('w-6 h-6 rounded-full -ml-[10px]', isDark ? 'border-[1.5px] border-[#1a1a1a]' : 'border-[1.5px] border-white')}
                            />
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-[6px]">
                              <span className={cn('text-[13px] font-semibold', isDark ? 'text-white' : 'text-[#1a1a1a]')}>
                                {asset1}/{asset2}
                              </span>
                              {isMainPool && (
                                <span className="text-[9px] font-bold py-[2px] px-[6px] rounded-full bg-[rgba(59,130,246,0.15)] text-[#3b82f6] uppercase">
                                  Main
                                </span>
                              )}
                            </div>
                            <span className={cn('text-[10px] font-medium', isDark ? 'text-white/40' : 'text-black/50')}>
                              {(pool.tradingFee / 100000).toFixed(3)}% Fee
                            </span>
                          </div>
                        </div>

                        <div className="text-right">
                          <div className={cn('text-[14px] font-bold', hasApy ? 'text-[#22c55e]' : isDark ? 'text-white' : 'text-[#1a1a1a]')}>
                            {hasApy ? `${pool.apy7d.apy.toFixed(1)}%` : '-%'}
                          </div>
                          <div className={cn('text-[10px] font-semibold uppercase tracking-[0.02em]', isDark ? 'text-white/40' : 'text-black/50')}>
                            APY
                          </div>
                        </div>
                      </div>

                      <div className={cn('flex items-center justify-between gap-3 py-2 px-[10px] rounded-[10px]', isDark ? 'bg-black/20' : 'bg-white/50')}>
                        <div className="flex flex-col gap-[2px]">
                          <span className={cn('text-[10px] font-medium uppercase', isDark ? 'text-white/40' : 'text-black/50')}>
                            TVL
                          </span>
                          <span className={cn('text-[12px] font-semibold', isDark ? 'text-white/90' : 'text-black/90')}>
                            {pool.apy7d?.liquidity > 0
                              ? `${abbreviateNumber(pool.apy7d.liquidity)} XRP`
                              : '-'}
                          </span>
                        </div>

                        <div className="flex flex-col gap-[2px] items-center">
                          <span className={cn('text-[10px] font-medium uppercase', isDark ? 'text-white/40' : 'text-black/50')}>
                            Trend
                          </span>
                          {chartData && chartData.length >= 2 ? (
                            <MiniSparkline data={chartData} width={50} height={18} isDark={isDark} />
                          ) : (
                            <span className={cn('text-[10px] font-semibold', isDark ? 'text-white/20' : 'text-black/20')}>
                              NEW
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col gap-[2px] items-end">
                          <span className={cn('text-[10px] font-medium uppercase', isDark ? 'text-white/40' : 'text-black/50')}>
                            Volume 7d
                          </span>
                          <span className={cn('text-[12px] font-semibold', isDark ? 'text-white/90' : 'text-black/90')}>
                            {pool.apy7d?.volume > 0
                              ? `${abbreviateNumber(pool.apy7d.volume)} XRP`
                              : '-'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className={cn('px-3 pb-3 border-t', isDark ? 'border-white/[0.06]' : 'border-black/[0.06]')}>
                        {/* Action Buttons */}
                        <div className="grid grid-cols-2 gap-2 py-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddLiquidity(pool);
                            }}
                            className="p-[10px] text-[12px] font-bold rounded-[10px] border-none bg-[#3b82f6] text-white cursor-pointer flex items-center justify-center gap-[6px]"
                          >
                            <Plus size={16} /> Add Liquidity
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleWithdrawLiquidity(pool);
                            }}
                            className={cn('p-[10px] text-[12px] font-bold rounded-[10px] border cursor-pointer flex items-center justify-center gap-[6px]', isDark ? 'border-white/10 bg-white/5 text-white' : 'border-black/10 bg-white text-[#1a1a1a]')}
                          >
                            <Minus size={16} /> Withdraw
                          </button>
                        </div>

                        {/* User Position */}
                        {userPosition && userPosition.balance > 0 && (() => {
                          const ilData = ilPositions[pool._id];
                          const hasIl = ilData && typeof ilData.ilPercent === 'number';
                          const ilColor = hasIl
                            ? ilData.ilPercent >= 0 ? '#08AA09' : '#ef4444'
                            : null;
                          return (
                          <div className="p-3 bg-[rgba(59,130,246,0.1)] rounded-[12px] border border-[rgba(59,130,246,0.2)] mb-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[11px] font-bold text-[#3b82f6]">
                                YOUR POSITION
                              </span>
                              <span className="text-[11px] font-bold text-[#3b82f6]">
                                {formatShare(userPosition.share)} share
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <div className="flex flex-col">
                                <span className={cn('text-[13px] font-semibold', isDark ? 'text-white' : 'text-[#1a1a1a]')}>
                                  {abbreviateNumber(userPosition.asset1Amount)} {asset1}
                                </span>
                                <span className={cn('text-[13px] font-semibold', isDark ? 'text-white' : 'text-[#1a1a1a]')}>
                                  {abbreviateNumber(userPosition.asset2Amount)} {asset2}
                                </span>
                              </div>
                              <div className="text-right">
                                <span className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-black/50')}>
                                  LP Balance:
                                </span>
                                <div className={cn('text-[13px] font-semibold', isDark ? 'text-white' : 'text-[#1a1a1a]')}>
                                  {abbreviateNumber(userPosition.balance)}
                                </div>
                              </div>
                            </div>
                            {/* Impermanent Loss */}
                            {hasIl && (() => {
                              const diff = ilData.poolValueXrp - ilData.holdValueXrp;
                              return (
                              <div className={cn('mt-2 py-2 px-[10px] rounded-lg flex flex-col gap-[6px]', isDark ? 'bg-black/20' : 'bg-black/[0.03]')}>
                                <div className="flex justify-between items-center">
                                  <span className={cn('text-[10px] font-semibold', isDark ? 'text-white/40' : 'text-black/50')}>
                                    Worth if held (no pool)
                                  </span>
                                  <span className={cn('text-[12px] font-semibold', isDark ? 'text-white/90' : 'text-black/90')}>
                                    {abbreviateNumber(ilData.holdValueXrp)} XRP
                                  </span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className={cn('text-[10px] font-semibold', isDark ? 'text-white/40' : 'text-black/50')}>
                                    Worth in pool now
                                  </span>
                                  <span className={cn('text-[12px] font-semibold', isDark ? 'text-white/90' : 'text-black/90')}>
                                    {abbreviateNumber(ilData.poolValueXrp)} XRP
                                  </span>
                                </div>
                                <div className={cn('border-t pt-[5px] flex justify-between items-center', isDark ? 'border-white/[0.06]' : 'border-black/[0.06]')}>
                                  <span className={cn('text-[10px] font-semibold', isDark ? 'text-white/40' : 'text-black/50')}>
                                    Impermanent {ilData.ilPercent >= 0 ? 'gain' : 'loss'}
                                  </span>
                                  <span className="text-[12px] font-bold" style={{ color: ilColor }}>
                                    {diff >= 0 ? '+' : ''}{abbreviateNumber(diff)} XRP ({ilData.ilPercent >= 0 ? '+' : ''}{ilData.ilPercent.toFixed(2)}%)
                                  </span>
                                </div>
                              </div>
                              );
                            })()}
                          </div>
                          );
                        })()}

                        {/* Additional Stats */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className={cn('p-[10px] rounded-[10px]', isDark ? 'bg-black/20' : 'bg-black/[0.03]')}>
                            <span className={cn('text-[9px] uppercase block mb-[2px]', isDark ? 'text-white/40' : 'text-black/50')}>
                              Fees 7d
                            </span>
                            <span className={cn('text-[12px] font-semibold', isDark ? 'text-white' : 'text-[#1a1a1a]')}>
                              {pool.apy7d?.fees > 0
                                ? `${abbreviateNumber(pool.apy7d.fees)} XRP`
                                : '-'}
                            </span>
                          </div>
                          <div className={cn('p-[10px] rounded-[10px]', isDark ? 'bg-black/20' : 'bg-black/[0.03]')}>
                            <span className={cn('text-[9px] uppercase block mb-[2px]', isDark ? 'text-white/40' : 'text-black/50')}>
                              Last Trade
                            </span>
                            <span className={cn('text-[12px] font-semibold', isDark ? 'text-white' : 'text-[#1a1a1a]')}>
                              {pool.lastTraded ? formatRelativeTime(pool.lastTraded) : '-'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Desktop grid layout */
            <div className="flex flex-col gap-1">
              {/* Header */}
              <div className={cn('grid grid-cols-[minmax(160px,1.2fr)_70px_1fr_1fr_1fr_1.2fr_80px_140px_32px] gap-3 py-[10px] px-4 border-b items-center', isDark ? 'border-white/[0.06]' : 'border-black/[0.06]')}>
                <span className={cn('text-[10px] font-semibold uppercase tracking-[0.05em]', isDark ? 'text-white/35' : 'text-black/40')}>
                  Pool
                </span>
                <span className={cn('text-[10px] font-semibold uppercase tracking-[0.05em] text-center', isDark ? 'text-white/35' : 'text-black/40')}>
                  Trend
                </span>
                <span className={cn('text-[10px] font-semibold uppercase tracking-[0.05em] text-right', isDark ? 'text-white/35' : 'text-black/40')}>
                  Fee
                </span>
                <span
                  className={cn('text-[10px] font-semibold uppercase tracking-[0.05em] text-right cursor-pointer flex items-center justify-end gap-1', poolSortBy === 'apy' ? 'text-[#3b82f6]' : isDark ? 'text-white/35' : 'text-black/40')}
                  onClick={() => handlePoolSort('apy')}
                >
                  APY {poolSortBy === 'apy' && (poolSortDir === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />)}
                </span>
                <span
                  className={cn('text-[10px] font-semibold uppercase tracking-[0.05em] text-right cursor-pointer flex items-center justify-end gap-1', poolSortBy === 'volume' ? 'text-[#3b82f6]' : isDark ? 'text-white/35' : 'text-black/40')}
                  onClick={() => handlePoolSort('volume')}
                >
                  Volume {poolSortBy === 'volume' && (poolSortDir === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />)}
                </span>
                <span
                  className={cn('text-[10px] font-semibold uppercase tracking-[0.05em] text-right cursor-pointer flex items-center justify-end gap-1', poolSortBy === 'liquidity' ? 'text-[#3b82f6]' : isDark ? 'text-white/35' : 'text-black/40')}
                  onClick={() => handlePoolSort('liquidity')}
                >
                  TVL {poolSortBy === 'liquidity' && (poolSortDir === 'desc' ? <ChevronDown size={10} /> : <ChevronUp size={10} />)}
                </span>
                <span className={cn('text-[10px] font-semibold uppercase tracking-[0.05em] text-right', isDark ? 'text-white/35' : 'text-black/40')}>
                  Last Trade
                </span>
                <span className={cn('text-[10px] font-semibold uppercase tracking-[0.05em] text-center', isDark ? 'text-white/35' : 'text-black/40')}>
                  Actions
                </span>
                <span></span>
              </div>

              {/* Rows */}
              {filteredAndSortedPools.map((pool) => {
                const asset1 =
                  pool.asset1?.currency === 'XRP' ? 'XRP' : decodeCurrency(pool.asset1?.currency);
                const asset2 =
                  pool.asset2?.currency === 'XRP' ? 'XRP' : decodeCurrency(pool.asset2?.currency);
                const feePercent = pool.tradingFee ? (pool.tradingFee / 100000).toFixed(3) : '-';
                const hasApy = pool.apy7d?.apy > 0;
                const isMainPool =
                  (pool.asset1?.currency === 'XRP' &&
                    pool.asset2?.issuer === token?.issuer &&
                    pool.asset2?.currency === token?.currency) ||
                  (pool.asset2?.currency === 'XRP' &&
                    pool.asset1?.issuer === token?.issuer &&
                    pool.asset1?.currency === token?.currency);
                const poolAccount = pool.ammAccount || pool.account || pool._id;
                const chartData = poolChartData[poolAccount];
                const isExpanded = expandedPoolId === pool._id;
                const userPosition = userLpBalances[poolAccount];

                return (
                  <div key={pool._id}>
                    <div
                      onClick={() => handlePoolExpand(pool._id, pool)}
                      className={cn(
                        'grid grid-cols-[minmax(160px,1.2fr)_70px_1fr_1fr_1fr_1.2fr_80px_140px_32px] gap-3 py-3 px-4 items-center cursor-pointer transition-all duration-150',
                        isExpanded ? 'border-b-0' : isDark ? 'border-b border-white/[0.04]' : 'border-b border-black/[0.04]',
                        isMainPool
                          ? cn('rounded-t-[12px] shadow-[inset_4px_0_0_#3b82f6]', isDark ? 'bg-[rgba(59,130,246,0.06)]' : 'bg-[rgba(59,130,246,0.03)]')
                          : isExpanded
                            ? cn('rounded-t-[12px]', isDark ? 'bg-white/[0.03]' : 'bg-black/[0.02]')
                            : 'bg-transparent rounded-none'
                      )}
                    >
                      {/* Pool pair */}
                      <div className="flex items-center gap-[10px]">
                        <div className="flex shrink-0">
                          <img
                            src={getTokenImageUrl(pool.asset1.issuer, pool.asset1.currency)}
                            alt=""
                            className={cn('w-6 h-6 rounded-full', isDark ? 'border-[1.5px] border-[#1a1a1a]' : 'border-[1.5px] border-white')}
                          />
                          <img
                            src={getTokenImageUrl(pool.asset2.issuer, pool.asset2.currency)}
                            alt=""
                            className={cn('w-6 h-6 rounded-full -ml-[10px]', isDark ? 'border-[1.5px] border-[#1a1a1a]' : 'border-[1.5px] border-white')}
                          />
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-[6px]">
                            <span className={cn('text-[13px] font-semibold', isDark ? 'text-white' : 'text-[#1a1a1a]')}>
                              {asset1}/{asset2}
                            </span>
                            {isMainPool && (
                              <span className="text-[8px] font-extrabold py-px px-[5px] rounded bg-[#3b82f6] text-white uppercase">
                                Main
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Mini Chart */}
                      <div className="flex justify-center">
                        {chartData && chartData.length >= 2 ? (
                          <MiniSparkline data={chartData} width={50} height={18} isDark={isDark} />
                        ) : (
                          <span className={cn('text-[9px] font-bold uppercase', isDark ? 'text-white/20' : 'text-black/20')}>
                            New
                          </span>
                        )}
                      </div>

                      {/* Fee */}
                      <div className="text-right">
                        <span className={cn('text-[12px] font-medium', isDark ? 'text-white/60' : 'text-black/60')}>
                          {feePercent}%
                        </span>
                      </div>

                      {/* APY */}
                      <div className="text-right">
                        <span className={cn('text-[13px] font-bold', hasApy ? 'text-[#22c55e]' : isDark ? 'text-white/30' : 'text-black/30')}>
                          {hasApy ? `${pool.apy7d.apy.toFixed(1)}%` : '-%'}
                        </span>
                      </div>

                      {/* Volume */}
                      <div className="text-right">
                        <span className={cn('text-[12px] font-medium', isDark ? 'text-white/80' : 'text-black/80')}>
                          {pool.apy7d?.volume > 0 ? abbreviateNumber(pool.apy7d.volume) : '-'}
                        </span>
                      </div>

                      {/* Liquidity/TVL */}
                      <div className="text-right">
                        <span className={cn('text-[13px] font-semibold', isDark ? 'text-white' : 'text-[#1a1a1a]')}>
                          {pool.apy7d?.liquidity > 0
                            ? `${abbreviateNumber(pool.apy7d.liquidity)} XRP`
                            : '-'}
                        </span>
                      </div>

                      {/* Last Trade */}
                      <div className="text-right">
                        <span className={cn('text-[11px] font-medium', isDark ? 'text-white/40' : 'text-black/50')}>
                          {pool.lastTraded ? formatRelativeTime(pool.lastTraded) : '-'}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex justify-center gap-[6px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddLiquidity(pool);
                          }}
                          className="py-[6px] px-3 text-[11px] font-bold rounded-lg border-none bg-[#3b82f6] text-white cursor-pointer transition-all duration-200"
                        >
                          Add
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleWithdrawLiquidity(pool);
                          }}
                          className={cn('py-[6px] px-3 text-[11px] font-bold rounded-lg border cursor-pointer transition-all duration-200', isDark ? 'border-white/10 bg-white/5 text-white' : 'border-black/10 bg-white text-[#1a1a1a]')}
                        >
                          Withdraw
                        </button>
                      </div>

                      {/* Expand indicator */}
                      <div className={cn('flex justify-center', isDark ? 'text-white/20' : 'text-black/20')}>
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className={cn(
                        'py-5 px-6 rounded-b-[12px] mb-2 border-t',
                        isDark ? 'bg-white/[0.03] border-white/5' : 'bg-black/[0.015] border-black/5',
                        isMainPool && 'shadow-[inset_4px_0_0_#3b82f6]'
                      )}>
                        <div className="grid grid-cols-[1.5fr_1fr] gap-8 items-start">
                          {/* Stats Section */}
                          <div className="flex flex-col gap-5">
                            <div className="grid grid-cols-3 gap-3">
                              {[
                                { label: 'Fees Earned (7d)', value: pool.apy7d?.fees > 0 ? `${abbreviateNumber(pool.apy7d.fees)} XRP` : '-' },
                                { label: 'Volume (7d)', value: pool.apy7d?.volume > 0 ? `${abbreviateNumber(pool.apy7d.volume)} XRP` : '-' },
                                { label: 'Trading Fee', value: `${feePercent}%` }
                              ].map((stat, i) => (
                                <div
                                  key={i}
                                  className={cn('p-3 rounded-[10px] border', isDark ? 'bg-black/20 border-white/5' : 'bg-white border-black/5')}
                                >
                                  <div className={cn('text-[9px] font-bold uppercase mb-1', isDark ? 'text-white/35' : 'text-black/40')}>
                                    {stat.label}
                                  </div>
                                  <div className={cn('text-[15px] font-semibold', isDark ? 'text-white' : 'text-[#1a1a1a]')}>
                                    {stat.value}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Pool Composition */}
                            <div className={cn('p-4 rounded-[12px] border', isDark ? 'bg-black/20 border-white/5' : 'bg-white border-black/5')}>
                              <div className={cn('text-[10px] font-bold uppercase mb-3', isDark ? 'text-white/35' : 'text-black/40')}>
                                Pool Composition
                              </div>
                              <div className="flex gap-8">
                                <div className="flex items-center gap-[10px]">
                                  <img src={getTokenImageUrl(pool.asset1.issuer, pool.asset1.currency)} alt="" className="w-6 h-6 rounded-full" />
                                  <div className="flex flex-col">
                                    <span className="text-[14px] font-semibold">{pool.currentLiquidity ? abbreviateNumber(pool.currentLiquidity.asset1Amount) : '-'}</span>
                                    <span className={cn('text-[10px] font-semibold', isDark ? 'text-white/40' : 'text-black/50')}>{asset1}</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-[10px]">
                                  <img src={getTokenImageUrl(pool.asset2.issuer, pool.asset2.currency)} alt="" className="w-6 h-6 rounded-full" />
                                  <div className="flex flex-col">
                                    <span className="text-[14px] font-semibold">{pool.currentLiquidity ? abbreviateNumber(pool.currentLiquidity.asset2Amount) : '-'}</span>
                                    <span className={cn('text-[10px] font-semibold', isDark ? 'text-white/40' : 'text-black/50')}>{asset2}</span>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* User Position */}
                            {userPosition && userPosition.balance > 0 && (() => {
                              const ilData = ilPositions[pool._id];
                              const hasIl = ilData && typeof ilData.ilPercent === 'number';
                              const ilColor = hasIl
                                ? ilData.ilPercent >= 0 ? '#08AA09' : '#ef4444'
                                : null;
                              return (
                              <div className="p-4 bg-[rgba(59,130,246,0.1)] rounded-[12px] border border-[rgba(59,130,246,0.2)]">
                                <div className="flex justify-between items-center mb-3">
                                  <span className="text-[11px] font-extrabold text-[#3b82f6] uppercase">Your Position</span>
                                  <span className="text-[11px] font-extrabold text-[#3b82f6]">{formatShare(userPosition.share)} of pool</span>
                                </div>
                                <div className="flex gap-8">
                                  <div className="flex items-center gap-2">
                                    <img src={getTokenImageUrl(pool.asset1.issuer, pool.asset1.currency)} alt="" className="w-[18px] h-[18px] rounded-full" />
                                    <span className="text-[13px] font-semibold">{abbreviateNumber(userPosition.asset1Amount)} {asset1}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <img src={getTokenImageUrl(pool.asset2.issuer, pool.asset2.currency)} alt="" className="w-[18px] h-[18px] rounded-full" />
                                    <span className="text-[13px] font-semibold">{abbreviateNumber(userPosition.asset2Amount)} {asset2}</span>
                                  </div>
                                </div>
                                {/* Impermanent Loss */}
                                {hasIl && (() => {
                                  const diff = ilData.poolValueXrp - ilData.holdValueXrp;
                                  return (
                                  <div className={cn('flex gap-6 items-end mt-3 py-[10px] px-3 rounded-lg', isDark ? 'bg-black/20' : 'bg-black/[0.03]')}>
                                    <div className="flex flex-col gap-[2px]">
                                      <span className={cn('text-[9px] font-bold uppercase', isDark ? 'text-white/35' : 'text-black/40')}>Worth if held (no pool)</span>
                                      <span className={cn('text-[13px] font-semibold', isDark ? 'text-white/90' : 'text-black/90')}>
                                        {abbreviateNumber(ilData.holdValueXrp)} XRP
                                      </span>
                                    </div>
                                    <div className="flex flex-col gap-[2px]">
                                      <span className={cn('text-[9px] font-bold uppercase', isDark ? 'text-white/35' : 'text-black/40')}>Worth in pool now</span>
                                      <span className={cn('text-[13px] font-semibold', isDark ? 'text-white/90' : 'text-black/90')}>
                                        {abbreviateNumber(ilData.poolValueXrp)} XRP
                                      </span>
                                    </div>
                                    <div className="flex flex-col gap-[2px]">
                                      <span className={cn('text-[9px] font-bold uppercase', isDark ? 'text-white/35' : 'text-black/40')}>Impermanent {ilData.ilPercent >= 0 ? 'gain' : 'loss'}</span>
                                      <span className="text-[14px] font-bold" style={{ color: ilColor }}>
                                        {diff >= 0 ? '+' : ''}{abbreviateNumber(diff)} XRP ({ilData.ilPercent >= 0 ? '+' : ''}{ilData.ilPercent.toFixed(2)}%)
                                      </span>
                                    </div>
                                  </div>
                                  );
                                })()}
                              </div>
                              );
                            })()}
                          </div>

                          {/* Chart Section */}
                          <div className={cn('p-5 rounded-xl h-full border', isDark ? 'bg-black/20 border-white/[0.05]' : 'bg-white border-black/[0.05]')}>
                            <div className={cn('text-[10px] font-bold uppercase mb-4', isDark ? 'text-white/35' : 'text-black/40')}>
                              TVL History (30d)
                            </div>
                            {chartData && chartData.length > 0 ? (
                              <div className="flex justify-center">
                                <MiniSparkline data={chartData} width={280} height={120} isDark={isDark} />
                              </div>
                            ) : (
                              <div className={cn('h-[120px] flex items-center justify-center text-[11px] font-semibold', isDark ? 'text-white/20' : 'text-black/20')}>
                                {isChartLoading ? <Spinner size={24} /> : 'CHART DATA UNAVAILABLE'}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tabValue === 2 && token && <TopTraders token={token} walletLabels={walletLabels} onLabelsChange={setWalletLabels} />}

      {tabValue === 3 && token && (
        <Suspense fallback={<Spinner size={32} />}>
          <RichList token={token} amm={amm} walletLabels={walletLabels} onLabelsChange={setWalletLabels} />
        </Suspense>
      )}

      {tabValue === 4 && (
        <MyActivityTab
          token={token}
          isDark={isDark}
          isMobile={isMobile}
          onTransactionClick={onTransactionClick}
        />
      )}

      {/* Liquidity Dialog - Combined Add/Remove */}
      {typeof document !== 'undefined' &&
        liquidityDialog.open &&
        createPortal(
          <Dialog
            open={liquidityDialog.open}
            isDark={isDark}
            onClick={(e) => e.target === e.currentTarget && handleCloseDialog()}
          >
            <DialogPaper isDark={isDark}>
              <DialogTitle isDark={isDark}>
                Manage Liquidity
                <IconButton onClick={handleCloseDialog} isDark={isDark} className="p-[6px]">
                  <X size={18} />
                </IconButton>
              </DialogTitle>
              <DialogContent isDark={isDark}>
                {liquidityDialog.pool && (
                  <div className="flex flex-col gap-[14px]">
                    {/* Pool Info */}
                    <div className={cn('flex items-center gap-[10px] py-3 px-[14px] rounded-[10px] border-[1.5px]', isDark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-[#f9fafb] border-black/[0.08]')}>
                      <div className="flex">
                        <img src={getTokenImageUrl(liquidityDialog.pool.asset1.issuer, liquidityDialog.pool.asset1.currency)} alt="" className="w-7 h-7 rounded-full" />
                        <img src={getTokenImageUrl(liquidityDialog.pool.asset2.issuer, liquidityDialog.pool.asset2.currency)} alt="" className="w-7 h-7 rounded-full -ml-[10px]" />
                      </div>
                      <span className={cn('text-[15px] font-semibold', isDark ? 'text-white' : 'text-[#1a1a1a]')}>
                        {decodeCurrency(liquidityDialog.pool.asset1.currency)}/{decodeCurrency(liquidityDialog.pool.asset2.currency)}
                      </span>
                      {liquidityDialog.pool.tradingFee != null && (
                        <span className={cn('ml-auto text-[11px]', isDark ? 'text-white/40' : 'text-black/40')}>
                          Fee {(liquidityDialog.pool.tradingFee / 1000).toFixed(2)}%
                        </span>
                      )}
                    </div>

                    {/* Current Position */}
                    {(() => {
                      const pa = liquidityDialog.pool.ammAccount || liquidityDialog.pool.account || liquidityDialog.pool._id;
                      const lp = userLpBalances[pa];
                      if (!lp || lp.balance <= 0) return null;
                      const ilData = ilPositions[liquidityDialog.pool._id];
                      const hasIl = ilData && typeof ilData.ilPercent === 'number';
                      const ilColor = hasIl
                        ? ilData.ilPercent >= 0 ? '#08AA09' : '#ef4444'
                        : null;
                      return (
                        <div className={cn('py-3 px-[14px] rounded-[10px] border-[1.5px]', isDark ? 'bg-[rgba(59,130,246,0.06)] border-[rgba(59,130,246,0.15)]' : 'bg-[rgba(59,130,246,0.04)] border-[rgba(59,130,246,0.12)]')}>
                          <div className="flex justify-between items-center mb-[10px]">
                            <span className="text-[11px] uppercase tracking-[0.5px] text-[#3b82f6] font-semibold">Your Position</span>
                            <span className="text-[11px] font-semibold text-[#3b82f6]">{formatShare(lp.share)}</span>
                          </div>
                          <div className="flex gap-4">
                            <div className="flex items-center gap-[6px]">
                              <img src={getTokenImageUrl(liquidityDialog.pool.asset1.issuer, liquidityDialog.pool.asset1.currency)} alt="" className="w-4 h-4 rounded-full" />
                              <span className={cn('text-[13px] font-medium', isDark ? 'text-white/85' : 'text-black/85')}>{abbreviateNumber(lp.asset1Amount)}</span>
                              <span className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-black/40')}>{decodeCurrency(liquidityDialog.pool.asset1.currency)}</span>
                            </div>
                            <div className="flex items-center gap-[6px]">
                              <img src={getTokenImageUrl(liquidityDialog.pool.asset2.issuer, liquidityDialog.pool.asset2.currency)} alt="" className="w-4 h-4 rounded-full" />
                              <span className={cn('text-[13px] font-medium', isDark ? 'text-white/85' : 'text-black/85')}>{abbreviateNumber(lp.asset2Amount)}</span>
                              <span className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-black/40')}>{decodeCurrency(liquidityDialog.pool.asset2.currency)}</span>
                            </div>
                          </div>
                          {hasIl && (() => {
                            const diff = ilData.poolValueXrp - ilData.holdValueXrp;
                            return (
                            <div className={cn('mt-[10px] py-2 px-[10px] rounded-lg flex flex-col gap-[5px]', isDark ? 'bg-black/15' : 'bg-black/[0.03]')}>
                              <div className="flex justify-between items-center">
                                <span className={cn('text-[10px] font-semibold', isDark ? 'text-white/40' : 'text-black/50')}>Worth if held (no pool)</span>
                                <span className={cn('text-[12px] font-semibold', isDark ? 'text-white/85' : 'text-black/85')}>{abbreviateNumber(ilData.holdValueXrp)} XRP</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className={cn('text-[10px] font-semibold', isDark ? 'text-white/40' : 'text-black/50')}>Worth in pool now</span>
                                <span className={cn('text-[12px] font-semibold', isDark ? 'text-white/85' : 'text-black/85')}>{abbreviateNumber(ilData.poolValueXrp)} XRP</span>
                              </div>
                              <div className={cn('pt-1 flex justify-between items-center border-t', isDark ? 'border-white/[0.06]' : 'border-black/[0.06]')}>
                                <span className={cn('text-[10px] font-semibold', isDark ? 'text-white/40' : 'text-black/50')}>Impermanent {ilData.ilPercent >= 0 ? 'gain' : 'loss'}</span>
                                <span className="text-[12px] font-bold" style={{ color: ilColor }}>{diff >= 0 ? '+' : ''}{abbreviateNumber(diff)} XRP ({ilData.ilPercent >= 0 ? '+' : ''}{ilData.ilPercent.toFixed(2)}%)</span>
                              </div>
                            </div>
                            );
                          })()}
                        </div>
                      );
                    })()}

                    {/* Add / Remove Tab Toggle */}
                    <div className={cn('flex rounded-[10px] overflow-hidden p-[3px]', isDark ? 'bg-white/[0.04]' : 'bg-black/[0.04]')}>
                      {['add', 'remove'].map((t) => (
                        <button
                          key={t}
                          onClick={() => setLiquidityDialog((prev) => ({ ...prev, tab: t }))}
                          className={cn(
                            'flex-1 py-[9px] px-0 text-[13px] font-medium border-none rounded-lg cursor-pointer transition-all duration-150',
                            liquidityDialog.tab === t
                              ? cn('text-white', t === 'add' ? 'bg-[#3b82f6]' : isDark ? 'bg-white/[0.12]' : 'bg-[#1a1a1a]')
                              : cn('bg-transparent', isDark ? 'text-white/45' : 'text-black/45')
                          )}
                        >
                          {t === 'add' ? 'Add' : 'Remove'}
                        </button>
                      ))}
                    </div>

                    {/* ===== ADD TAB ===== */}
                    {liquidityDialog.tab === 'add' && (
                      <>
                        {/* Deposit Mode */}
                        <div className="flex flex-col gap-[6px]">
                          {[
                            { value: 'double', label: 'Both tokens', desc: 'No trading fee' },
                            { value: 'single1', label: `${decodeCurrency(liquidityDialog.pool.asset1.currency)} only`, desc: 'Trading fee applies' },
                            { value: 'single2', label: `${decodeCurrency(liquidityDialog.pool.asset2.currency)} only`, desc: 'Trading fee applies' }
                          ].map((opt) => (
                            <label key={opt.value} className={cn('flex items-center gap-[10px] py-[10px] px-[14px] rounded-[10px] cursor-pointer border-[1.5px] transition-all duration-150', depositMode === opt.value ? cn('border-[#3b82f6]', isDark ? 'bg-[rgba(59,130,246,0.08)]' : 'bg-[rgba(59,130,246,0.04)]') : cn('bg-transparent', isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'))}>
                              <input type="radio" value={opt.value} checked={depositMode === opt.value} onChange={(e) => setDepositMode(e.target.value)} className="accent-[#3b82f6]" />
                              <div className="flex flex-col gap-[2px]">
                                <span className={cn('text-[13px] font-medium', isDark ? 'text-white' : 'text-[#1a1a1a]')}>{opt.label}</span>
                                <span className={cn('text-[11px]', isDark ? 'text-white/35' : 'text-black/35')}>{opt.desc}</span>
                              </div>
                            </label>
                          ))}
                        </div>

                        {/* Asset 1 Input */}
                        {(depositMode === 'double' || depositMode === 'single1') && (
                          <div>
                            <div className="flex justify-between items-center mb-[6px]">
                              <span className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-black/40')}>
                                {decodeCurrency(liquidityDialog.pool.asset1.currency)}
                              </span>
                              {userPoolBalances.asset1 != null && (
                                <div className="flex items-center gap-[6px]">
                                  <span className={cn('text-[10px]', isDark ? 'text-white/45' : 'text-black/45')}>
                                    {Number(userPoolBalances.asset1).toFixed(4).replace(/\.?0+$/, '')} {decodeCurrency(liquidityDialog.pool.asset1.currency)}
                                  </span>
                                  {[0.5, 1].map((p) => (
                                    <button key={p} onClick={() => { const v = (Number(userPoolBalances.asset1) * p).toFixed(6); handleAmount1Change(v); }} disabled={!userPoolBalances.asset1} className={cn('py-[2px] px-[6px] text-[9px] font-semibold rounded border-none text-[#3b82f6]', userPoolBalances.asset1 ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-30', isDark ? 'bg-[rgba(59,130,246,0.15)]' : 'bg-[rgba(59,130,246,0.1)]')}>
                                      {p === 1 ? 'MAX' : '50%'}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="relative">
                              <TextField value={depositAmount1} onChange={(e) => handleAmount1Change(e.target.value)} type="number" placeholder="0.00" isDark={isDark} />
                            </div>
                          </div>
                        )}

                        {/* Asset 2 Input */}
                        {(depositMode === 'double' || depositMode === 'single2') && (
                          <div>
                            <div className="flex justify-between items-center mb-[6px]">
                              <span className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-black/40')}>
                                {decodeCurrency(liquidityDialog.pool.asset2.currency)}
                              </span>
                              {userPoolBalances.asset2 != null && (
                                <div className="flex items-center gap-[6px]">
                                  <span className={cn('text-[10px]', isDark ? 'text-white/45' : 'text-black/45')}>
                                    {Number(userPoolBalances.asset2).toFixed(4).replace(/\.?0+$/, '')} {decodeCurrency(liquidityDialog.pool.asset2.currency)}
                                  </span>
                                  {[0.5, 1].map((p) => (
                                    <button key={p} onClick={() => { const v = (Number(userPoolBalances.asset2) * p).toFixed(6); handleAmount2Change(v); }} disabled={!userPoolBalances.asset2} className={cn('py-[2px] px-[6px] text-[9px] font-semibold rounded border-none text-[#3b82f6]', userPoolBalances.asset2 ? 'cursor-pointer opacity-100' : 'cursor-not-allowed opacity-30', isDark ? 'bg-[rgba(59,130,246,0.15)]' : 'bg-[rgba(59,130,246,0.1)]')}>
                                      {p === 1 ? 'MAX' : '50%'}
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="relative">
                              <TextField value={depositAmount2} onChange={(e) => handleAmount2Change(e.target.value)} type="number" placeholder="0.00" isDark={isDark} />
                            </div>
                          </div>
                        )}

                        {/* Simulation result */}
                        {pendingDeposit && pendingDeposit.error && (
                          <div className={cn('py-[10px] px-[14px] rounded-[10px] border-[1.5px] border-[rgba(239,68,68,0.2)] flex flex-col gap-[6px] text-[12px]', isDark ? 'bg-[rgba(239,68,68,0.08)]' : 'bg-[rgba(239,68,68,0.05)]')}>
                            <div className="flex items-center gap-[6px] text-[#ef4444] font-semibold text-[11px] uppercase tracking-[0.05em]">
                              <AlertTriangle size={13} />
                              Simulation Failed
                            </div>
                            <span className={cn('leading-normal', isDark ? 'text-white/70' : 'text-black/60')}>{pendingDeposit.error}</span>
                          </div>
                        )}
                        {pendingDeposit && pendingDeposit.preview && (
                          <div className={cn('py-[10px] px-[14px] rounded-[10px] border-[1.5px] flex flex-col gap-2 text-[12px]', isDark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-black/[0.02] border-black/[0.08]')}>
                            <div className="flex items-center gap-[6px] text-[#08AA09] font-semibold text-[11px] uppercase tracking-[0.05em]">
                              <CheckCircle size={13} />
                              Transaction Preview
                            </div>
                            <div className={cn('flex flex-col gap-1', isDark ? 'text-white/70' : 'text-black/60')}>
                              {pendingDeposit.preview.asset1.amount > 0 && (
                                <div className="flex justify-between">
                                  <span>Deposit {pendingDeposit.preview.asset1.name}</span>
                                  <span className={cn('font-semibold', isDark ? 'text-white' : 'text-black')}>{pendingDeposit.preview.asset1.amount < 0.001 ? pendingDeposit.preview.asset1.amount.toFixed(6) : pendingDeposit.preview.asset1.amount.toFixed(4)}</span>
                                </div>
                              )}
                              {pendingDeposit.preview.asset2.amount > 0 && (
                                <div className="flex justify-between">
                                  <span>Deposit {pendingDeposit.preview.asset2.name}</span>
                                  <span className={cn('font-semibold', isDark ? 'text-white' : 'text-black')}>{pendingDeposit.preview.asset2.amount < 0.001 ? pendingDeposit.preview.asset2.amount.toFixed(6) : pendingDeposit.preview.asset2.amount.toFixed(4)}</span>
                                </div>
                              )}
                              {pendingDeposit.preview.lpTokens > 0 && (
                                <div className="flex justify-between">
                                  <span>LP tokens received</span>
                                  <span className="font-semibold text-[#3b82f6]">{pendingDeposit.preview.lpTokens < 0.001 ? pendingDeposit.preview.lpTokens.toFixed(6) : pendingDeposit.preview.lpTokens.toFixed(4)}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span>Network fee</span>
                                <span className={cn('font-semibold', isDark ? 'text-white' : 'text-black')}>{pendingDeposit.preview.fee} XRP</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Submit / Confirm */}
                        {pendingDeposit && pendingDeposit.error ? (
                          <button
                            onClick={() => setPendingDeposit(null)}
                            className={cn('p-[13px] text-[14px] font-semibold w-full border-none rounded-[10px] cursor-pointer', isDark ? 'bg-white/[0.06] text-white/70' : 'bg-black/[0.06] text-black/60')}
                          >
                            Dismiss
                          </button>
                        ) : pendingDeposit && pendingDeposit.tx ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setPendingDeposit(null)}
                              className={cn('flex-1 p-[13px] text-[14px] font-semibold border-none rounded-[10px] cursor-pointer', isDark ? 'bg-white/[0.06] text-white/70' : 'bg-black/[0.06] text-black/60')}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleConfirmDeposit}
                              disabled={depositLoading}
                              className={cn('flex-[2] p-[13px] text-[14px] font-semibold text-white border-none rounded-[10px] flex items-center justify-center gap-2', depositLoading ? cn('cursor-not-allowed', isDark ? 'bg-[#222]' : 'bg-[#ccc]') : 'cursor-pointer bg-[#08AA09]')}
                            >
                              {depositLoading && <Spinner size={16} />}
                              {depositLoading ? 'Depositing...' : 'Confirm Deposit'}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={handleSubmitDeposit}
                            disabled={depositLoading}
                            className={cn('p-[13px] text-[14px] font-semibold w-full text-white border-none rounded-[10px] flex items-center justify-center gap-2 transition-all duration-150', depositLoading ? cn('cursor-not-allowed', isDark ? 'bg-[#222]' : 'bg-[#ccc]') : 'cursor-pointer bg-[#3b82f6]')}
                          >
                            {depositLoading && <Spinner size={16} />}
                            {depositLoading ? 'Simulating...' : 'Add Liquidity'}
                          </button>
                        )}
                      </>
                    )}

                    {/* ===== REMOVE TAB ===== */}
                    {liquidityDialog.tab === 'remove' && (
                      <>
                        {/* Withdraw Mode */}
                        <div className="flex flex-col gap-[6px]">
                          {[
                            { value: 'all', label: 'Withdraw all', desc: 'No trading fee' },
                            { value: 'double', label: 'Both tokens', desc: 'Balanced at pool ratio' },
                            { value: 'single1', label: `${decodeCurrency(liquidityDialog.pool.asset1.currency)} only`, desc: 'Trading fee applies' },
                            { value: 'single2', label: `${decodeCurrency(liquidityDialog.pool.asset2.currency)} only`, desc: 'Trading fee applies' }
                          ].map((opt) => (
                            <label key={opt.value} className={cn('flex items-center gap-[10px] py-[10px] px-[14px] rounded-[10px] cursor-pointer border-[1.5px] transition-all duration-150', withdrawMode === opt.value ? cn('border-[#3b82f6]', isDark ? 'bg-[rgba(59,130,246,0.08)]' : 'bg-[rgba(59,130,246,0.04)]') : cn('bg-transparent', isDark ? 'border-white/[0.08]' : 'border-black/[0.08]'))}>
                              <input type="radio" value={opt.value} checked={withdrawMode === opt.value} onChange={(e) => { setWithdrawMode(e.target.value); setWithdrawAmount1(''); setWithdrawAmount2(''); setPendingWithdraw(null); }} className="accent-[#3b82f6]" />
                              <div className="flex flex-col gap-[2px]">
                                <span className={cn('text-[13px] font-medium', isDark ? 'text-white' : 'text-[#1a1a1a]')}>{opt.label}</span>
                                <span className={cn('text-[11px]', isDark ? 'text-white/35' : 'text-black/35')}>{opt.desc}</span>
                              </div>
                            </label>
                          ))}
                        </div>

                        {/* Asset 1 Input */}
                        {(withdrawMode === 'double' || withdrawMode === 'single1') && (
                          <div>
                            <div className="flex justify-between items-center mb-[6px]">
                              <span className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-black/40')}>
                                {decodeCurrency(liquidityDialog.pool.asset1.currency)}
                              </span>
                              {(() => {
                                const pa = liquidityDialog.pool.ammAccount || liquidityDialog.pool.account || liquidityDialog.pool._id;
                                const lp = userLpBalances[pa];
                                if (!lp || lp.balance <= 0) return null;
                                const maxVal = withdrawMode === 'single1' ? getWithdrawMax('asset1') : lp.asset1Amount;
                                return (
                                  <span
                                    onClick={() => handleWithdrawAmount1Change(maxVal.toFixed(6))}
                                    className="text-[10px] text-[#3b82f6] cursor-pointer font-medium"
                                  >
                                    Max: {Number(maxVal).toFixed(4).replace(/\.?0+$/, '')}
                                  </span>
                                );
                              })()}
                            </div>
                            <div className="relative">
                              <TextField value={withdrawAmount1} onChange={(e) => handleWithdrawAmount1Change(e.target.value)} type="number" placeholder="0.00" isDark={isDark} />
                            </div>
                            {/* Percentage buttons */}
                            {(() => {
                              const pa = liquidityDialog.pool.ammAccount || liquidityDialog.pool.account || liquidityDialog.pool._id;
                              const lp = userLpBalances[pa];
                              if (!lp || lp.balance <= 0) return null;
                              const maxVal = withdrawMode === 'single1' ? getWithdrawMax('asset1') : lp.asset1Amount;
                              return (
                                <div className="flex gap-1 mt-[6px]">
                                  {[0.25, 0.5, 0.75, 1].map((p) => (
                                    <button key={p} onClick={() => handleWithdrawAmount1Change((maxVal * p).toFixed(6))} className={cn('py-[2px] px-[6px] text-[9px] font-semibold rounded border-none cursor-pointer text-[#3b82f6]', isDark ? 'bg-[rgba(59,130,246,0.15)]' : 'bg-[rgba(59,130,246,0.1)]')}>
                                      {p * 100}%
                                    </button>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        {/* Asset 2 Input */}
                        {(withdrawMode === 'double' || withdrawMode === 'single2') && (
                          <div>
                            <div className="flex justify-between items-center mb-[6px]">
                              <span className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-black/40')}>
                                {decodeCurrency(liquidityDialog.pool.asset2.currency)}
                              </span>
                              {(() => {
                                const pa = liquidityDialog.pool.ammAccount || liquidityDialog.pool.account || liquidityDialog.pool._id;
                                const lp = userLpBalances[pa];
                                if (!lp || lp.balance <= 0) return null;
                                const maxVal = withdrawMode === 'single2' ? getWithdrawMax('asset2') : lp.asset2Amount;
                                return (
                                  <span
                                    onClick={() => handleWithdrawAmount2Change(maxVal.toFixed(6))}
                                    className="text-[10px] text-[#3b82f6] cursor-pointer font-medium"
                                  >
                                    Max: {Number(maxVal).toFixed(4).replace(/\.?0+$/, '')}
                                  </span>
                                );
                              })()}
                            </div>
                            <div className="relative">
                              <TextField value={withdrawAmount2} onChange={(e) => handleWithdrawAmount2Change(e.target.value)} type="number" placeholder="0.00" isDark={isDark} />
                            </div>
                            {/* Percentage buttons */}
                            {(() => {
                              const pa = liquidityDialog.pool.ammAccount || liquidityDialog.pool.account || liquidityDialog.pool._id;
                              const lp = userLpBalances[pa];
                              if (!lp || lp.balance <= 0) return null;
                              const maxVal = withdrawMode === 'single2' ? getWithdrawMax('asset2') : lp.asset2Amount;
                              return (
                                <div className="flex gap-1 mt-[6px]">
                                  {[0.25, 0.5, 0.75, 1].map((p) => (
                                    <button key={p} onClick={() => handleWithdrawAmount2Change((maxVal * p).toFixed(6))} className={cn('py-[2px] px-[6px] text-[9px] font-semibold rounded border-none cursor-pointer text-[#3b82f6]', isDark ? 'bg-[rgba(59,130,246,0.15)]' : 'bg-[rgba(59,130,246,0.1)]')}>
                                      {p * 100}%
                                    </button>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        {/* Withdraw All info */}
                        {withdrawMode === 'all' && (
                          <div className={cn('py-3 px-[14px] rounded-[10px] border-[1.5px] text-[12px] leading-relaxed', isDark ? 'bg-white/[0.03] border-white/[0.06] text-white/50' : 'bg-black/[0.02] border-black/[0.06] text-black/50')}>
                            Redeems all LP tokens for proportional amounts of both assets. No trading fee applies.
                          </div>
                        )}

                        {/* Simulation result */}
                        {pendingWithdraw && pendingWithdraw.error && (
                          <div className={cn('py-[10px] px-[14px] rounded-[10px] border-[1.5px] border-[rgba(239,68,68,0.2)] flex flex-col gap-[6px] text-[12px]', isDark ? 'bg-[rgba(239,68,68,0.08)]' : 'bg-[rgba(239,68,68,0.05)]')}>
                            <div className="flex items-center gap-[6px] text-[#ef4444] font-semibold text-[11px] uppercase tracking-[0.05em]">
                              <AlertTriangle size={13} />
                              Simulation Failed
                            </div>
                            <span className={cn('leading-normal', isDark ? 'text-white/70' : 'text-black/60')}>{pendingWithdraw.error}</span>
                          </div>
                        )}
                        {pendingWithdraw && pendingWithdraw.preview && (
                          <div className={cn('py-[10px] px-[14px] rounded-[10px] border-[1.5px] flex flex-col gap-2 text-[12px]', isDark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-black/[0.02] border-black/[0.08]')}>
                            <div className="flex items-center gap-[6px] text-[#08AA09] font-semibold text-[11px] uppercase tracking-[0.05em]">
                              <CheckCircle size={13} />
                              Transaction Preview
                            </div>
                            <div className={cn('flex flex-col gap-1', isDark ? 'text-white/70' : 'text-black/60')}>
                              {pendingWithdraw.preview.asset1.amount > 0 && (
                                <div className="flex justify-between">
                                  <span>Receive {pendingWithdraw.preview.asset1.name}</span>
                                  <span className={cn('font-semibold', isDark ? 'text-white' : 'text-black')}>{pendingWithdraw.preview.asset1.amount < 0.001 ? pendingWithdraw.preview.asset1.amount.toFixed(6) : pendingWithdraw.preview.asset1.amount.toFixed(4)}</span>
                                </div>
                              )}
                              {pendingWithdraw.preview.asset2.amount > 0 && (
                                <div className="flex justify-between">
                                  <span>Receive {pendingWithdraw.preview.asset2.name}</span>
                                  <span className={cn('font-semibold', isDark ? 'text-white' : 'text-black')}>{pendingWithdraw.preview.asset2.amount < 0.001 ? pendingWithdraw.preview.asset2.amount.toFixed(6) : pendingWithdraw.preview.asset2.amount.toFixed(4)}</span>
                                </div>
                              )}
                              {pendingWithdraw.preview.lpTokens > 0 && (
                                <div className="flex justify-between">
                                  <span>LP tokens burned</span>
                                  <span className="font-semibold text-[#ef4444]">{pendingWithdraw.preview.lpTokens < 0.001 ? pendingWithdraw.preview.lpTokens.toFixed(6) : pendingWithdraw.preview.lpTokens.toFixed(4)}</span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span>Network fee</span>
                                <span className={cn('font-semibold', isDark ? 'text-white' : 'text-black')}>{pendingWithdraw.preview.fee} XRP</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Submit / Confirm */}
                        {pendingWithdraw && pendingWithdraw.error ? (
                          <button
                            onClick={() => setPendingWithdraw(null)}
                            className={cn('p-[13px] text-[14px] font-semibold w-full border-none rounded-[10px] cursor-pointer', isDark ? 'bg-white/[0.06] text-white/70' : 'bg-black/[0.06] text-black/60')}
                          >
                            Dismiss
                          </button>
                        ) : pendingWithdraw && pendingWithdraw.tx ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => setPendingWithdraw(null)}
                              className={cn('flex-1 p-[13px] text-[14px] font-semibold border-none rounded-[10px] cursor-pointer', isDark ? 'bg-white/[0.06] text-white/70' : 'bg-black/[0.06] text-black/60')}
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleConfirmWithdraw}
                              disabled={withdrawLoading}
                              className={cn('flex-[2] p-[13px] text-[14px] font-semibold text-white border-none rounded-[10px] flex items-center justify-center gap-2', withdrawLoading ? cn('cursor-not-allowed', isDark ? 'bg-[#222]' : 'bg-[#ccc]') : 'cursor-pointer bg-[#08AA09]')}
                            >
                              {withdrawLoading && <Spinner size={16} />}
                              {withdrawLoading ? 'Withdrawing...' : 'Confirm Withdrawal'}
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={handleSubmitWithdraw}
                            disabled={withdrawLoading}
                            className={cn('p-[13px] text-[14px] font-semibold w-full text-white border-none rounded-[10px] flex items-center justify-center gap-2 transition-all duration-150', withdrawLoading ? cn('cursor-not-allowed', isDark ? 'bg-[#222]' : 'bg-[#ccc]') : cn('cursor-pointer', isDark ? 'bg-white/10' : 'bg-[#1a1a1a]'))}
                          >
                            {withdrawLoading && <Spinner size={16} />}
                            {withdrawLoading ? 'Simulating...' : withdrawMode === 'all' ? 'Withdraw All' : 'Remove Liquidity'}
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
              </DialogContent>
            </DialogPaper>
          </Dialog>,
          document.body
        )}

      {/* Create Pool Dialog */}
      {typeof document !== 'undefined' &&
        createPoolOpen &&
        createPortal(
          <Dialog
            open={createPoolOpen}
            isDark={isDark}
            onClick={(e) => e.target === e.currentTarget && handleCloseCreatePool()}
          >
            <DialogPaper isDark={isDark}>
              <DialogTitle isDark={isDark}>
                Create Pool
                <IconButton onClick={handleCloseCreatePool} isDark={isDark} className="p-[6px]">
                  <X size={18} />
                </IconButton>
              </DialogTitle>
              <DialogContent isDark={isDark}>
                <div className="flex flex-col gap-[14px]">
                  {/* Asset 1 - Current token (fixed) */}
                  <div className={cn('py-3 px-[14px] rounded-[10px] border-[1.5px]', isDark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-[#f9fafb] border-black/[0.08]')}>
                    <div className={cn('text-[10px] font-semibold uppercase tracking-[0.5px] mb-2', isDark ? 'text-white/35' : 'text-black/40')}>Asset 1</div>
                    <div className="flex items-center gap-[10px]">
                      <img src={getTokenImageUrl(token?.issuer, token?.currency)} alt="" className="w-7 h-7 rounded-full" />
                      <span className={cn('text-[15px] font-semibold', isDark ? 'text-white' : 'text-[#1a1a1a]')}>
                        {token?.currency === 'XRP' ? 'XRP' : decodeCurrency(token?.currency)}
                      </span>
                    </div>
                  </div>

                  {/* Asset 2 - Token search/select */}
                  <div className={cn('py-3 px-[14px] rounded-[10px] border-[1.5px]', isDark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-[#f9fafb] border-black/[0.08]')}>
                    <div className={cn('text-[10px] font-semibold uppercase tracking-[0.5px] mb-2', isDark ? 'text-white/35' : 'text-black/40')}>Asset 2</div>
                    {createPoolAsset2 ? (
                      <div className="flex items-center gap-[10px]">
                        <img src={createPoolAsset2.image} alt="" className="w-7 h-7 rounded-full" />
                        <span className={cn('text-[15px] font-semibold', isDark ? 'text-white' : 'text-[#1a1a1a]')}>
                          {createPoolAsset2.name}
                        </span>
                        <button
                          onClick={() => { setCreatePoolAsset2(null); setPendingCreatePool(null); setCreatePoolAmount1(''); setCreatePoolAmount2(''); }}
                          className={cn('ml-auto py-1 px-2 text-[10px] font-semibold rounded-md border-none cursor-pointer', isDark ? 'bg-white/[0.08] text-white/60' : 'bg-black/[0.06] text-black/50')}
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="relative">
                          <Search size={14} className={cn('absolute left-[10px] top-1/2 -translate-y-1/2', isDark ? 'text-white/30' : 'text-black/30')} />
                          <TextField
                            value={createPoolSearch}
                            onChange={(e) => handleCreatePoolSearch(e.target.value)}
                            placeholder="Search token to pair with..."
                            isDark={isDark}
                            className="!pl-8"
                          />
                        </div>
                        {(createPoolSearchResults.length > 0 || createPoolSearchLoading) && (
                          <div className={cn('mt-[6px] max-h-[180px] overflow-y-auto rounded-lg border-[1.5px]', isDark ? 'border-white/[0.08] bg-[#111]' : 'border-black/[0.08] bg-white')}>
                            {createPoolSearchLoading && (
                              <div className="flex justify-center p-3">
                                <Spinner size={16} />
                              </div>
                            )}
                            {createPoolSearchResults.map((t, i) => {
                              const isXrp = t.currency === 'XRP' && !t.issuer;
                              const name = isXrp ? 'XRP' : (t.name || decodeCurrency(t.currency));
                              return (
                                <button
                                  key={`${t.issuer || ''}_${t.currency}_${i}`}
                                  onClick={() => handleSelectAsset2(t)}
                                  className={cn('w-full flex items-center gap-[10px] py-[10px] px-3 border-none bg-transparent cursor-pointer text-left transition-[background] duration-100 border-b', isDark ? 'border-b-white/[0.04] text-white hover:bg-white/[0.04]' : 'border-b-black/[0.04] text-[#1a1a1a] hover:bg-black/[0.03]')}
                                >
                                  <img src={getTokenImageUrl(t.issuer, t.currency)} alt="" className="w-[22px] h-[22px] rounded-full" />
                                  <div className="flex flex-col gap-px">
                                    <span className="text-[13px] font-semibold">{name}</span>
                                    {!isXrp && t.issuer && (
                                      <span className={cn('text-[10px]', isDark ? 'text-white/30' : 'text-black/35')}>
                                        {t.issuer.slice(0, 8)}...{t.issuer.slice(-6)}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Amount inputs — only show after asset2 is selected */}
                  {createPoolAsset2 && (
                    <>
                      {/* Amount 1 */}
                      <div>
                        <div className="flex justify-between items-center mb-[6px]">
                          <span className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-black/40')}>
                            {token?.currency === 'XRP' ? 'XRP' : decodeCurrency(token?.currency)} amount
                          </span>
                          {createPoolBalances.asset1 != null && (
                            <div className="flex items-center gap-[6px]">
                              <span className={cn('text-[10px]', isDark ? 'text-white/45' : 'text-black/45')}>
                                {Number(createPoolBalances.asset1).toFixed(4).replace(/\.?0+$/, '')}
                              </span>
                              {[0.5, 1].map((p) => (
                                <button key={p} onClick={() => setCreatePoolAmount1((Number(createPoolBalances.asset1) * p).toFixed(6))} className={cn('py-[2px] px-[6px] text-[9px] font-semibold rounded border-none cursor-pointer text-[#3b82f6]', isDark ? 'bg-[rgba(59,130,246,0.15)]' : 'bg-[rgba(59,130,246,0.1)]')}>
                                  {p === 1 ? 'MAX' : '50%'}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <TextField value={createPoolAmount1} onChange={(e) => { setCreatePoolAmount1(e.target.value); setPendingCreatePool(null); }} type="number" placeholder="0.00" isDark={isDark} />
                      </div>

                      {/* Amount 2 */}
                      <div>
                        <div className="flex justify-between items-center mb-[6px]">
                          <span className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-black/40')}>
                            {createPoolAsset2.name} amount
                          </span>
                          {createPoolBalances.asset2 != null && (
                            <div className="flex items-center gap-[6px]">
                              <span className={cn('text-[10px]', isDark ? 'text-white/45' : 'text-black/45')}>
                                {Number(createPoolBalances.asset2).toFixed(4).replace(/\.?0+$/, '')}
                              </span>
                              {[0.5, 1].map((p) => (
                                <button key={p} onClick={() => setCreatePoolAmount2((Number(createPoolBalances.asset2) * p).toFixed(6))} className={cn('py-[2px] px-[6px] text-[9px] font-semibold rounded border-none cursor-pointer text-[#3b82f6]', isDark ? 'bg-[rgba(59,130,246,0.15)]' : 'bg-[rgba(59,130,246,0.1)]')}>
                                  {p === 1 ? 'MAX' : '50%'}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <TextField value={createPoolAmount2} onChange={(e) => { setCreatePoolAmount2(e.target.value); setPendingCreatePool(null); }} type="number" placeholder="0.00" isDark={isDark} />
                      </div>

                      {/* Trading Fee Slider */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className={cn('text-[11px]', isDark ? 'text-white/40' : 'text-black/40')}>Trading Fee</span>
                          <span className={cn('text-[13px] font-semibold', isDark ? 'text-white' : 'text-[#1a1a1a]')}>{(createPoolFee / 1000).toFixed(2)}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={1000}
                          step={1}
                          value={createPoolFee}
                          onChange={(e) => { setCreatePoolFee(Number(e.target.value)); setPendingCreatePool(null); }}
                          className="w-full accent-[#137DFE]"
                        />
                        <div className={cn('flex justify-between text-[9px] mt-[2px]', isDark ? 'text-white/25' : 'text-black/30')}>
                          <span>0%</span>
                          <span>0.5%</span>
                          <span>1%</span>
                        </div>
                      </div>

                      {/* Warning about equal value */}
                      <div className={cn('py-[10px] px-[14px] rounded-[10px] border-[1.5px] border-[rgba(246,175,1,0.15)] flex items-start gap-2 text-[11px] leading-normal', isDark ? 'bg-[rgba(246,175,1,0.06)] text-white/60' : 'bg-[rgba(246,175,1,0.05)] text-black/55')}>
                        <AlertTriangle size={14} className="text-[#F6AF01] shrink-0 mt-px" />
                        <span>Deposit roughly equal-value amounts of each asset. Imbalanced pools can be immediately arbitraged. Creation costs ~0.2 XRP (owner reserve).</span>
                      </div>

                      {/* Simulation result */}
                      {pendingCreatePool && pendingCreatePool.error && (
                        <div className={cn('py-[10px] px-[14px] rounded-[10px] border-[1.5px] border-[rgba(239,68,68,0.2)] flex flex-col gap-[6px] text-[12px]', isDark ? 'bg-[rgba(239,68,68,0.08)]' : 'bg-[rgba(239,68,68,0.05)]')}>
                          <div className="flex items-center gap-[6px] text-[#ef4444] font-semibold text-[11px] uppercase tracking-[0.05em]">
                            <AlertTriangle size={13} />
                            Simulation Failed
                          </div>
                          <span className={cn('leading-normal', isDark ? 'text-white/70' : 'text-black/60')}>{pendingCreatePool.error}</span>
                        </div>
                      )}
                      {pendingCreatePool && pendingCreatePool.tx && (
                        <div className={cn('py-[10px] px-[14px] rounded-[10px] border-[1.5px] flex flex-col gap-2 text-[12px]', isDark ? 'bg-white/[0.03] border-white/[0.08]' : 'bg-black/[0.02] border-black/[0.08]')}>
                          <div className="flex items-center gap-[6px] text-[#08AA09] font-semibold text-[11px] uppercase tracking-[0.05em]">
                            <CheckCircle size={13} />
                            Ready to Create
                          </div>
                          <div className={cn('flex flex-col gap-1', isDark ? 'text-white/70' : 'text-black/60')}>
                            <div className="flex justify-between">
                              <span>Deposit {token?.currency === 'XRP' ? 'XRP' : decodeCurrency(token?.currency)}</span>
                              <span className={cn('font-semibold', isDark ? 'text-white' : 'text-black')}>{Number(createPoolAmount1).toFixed(4)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Deposit {createPoolAsset2.name}</span>
                              <span className={cn('font-semibold', isDark ? 'text-white' : 'text-black')}>{Number(createPoolAmount2).toFixed(4)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Trading fee</span>
                              <span className={cn('font-semibold', isDark ? 'text-white' : 'text-black')}>{(createPoolFee / 1000).toFixed(2)}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Network fee</span>
                              <span className={cn('font-semibold', isDark ? 'text-white' : 'text-black')}>{pendingCreatePool.fee} XRP</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Submit / Confirm buttons */}
                      {pendingCreatePool && pendingCreatePool.error ? (
                        <button
                          onClick={() => setPendingCreatePool(null)}
                          className={cn('p-[13px] text-[14px] font-semibold w-full border-none rounded-[10px] cursor-pointer', isDark ? 'bg-white/[0.06] text-white/70' : 'bg-black/[0.06] text-black/60')}
                        >
                          Dismiss
                        </button>
                      ) : pendingCreatePool && pendingCreatePool.tx ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => setPendingCreatePool(null)}
                            className={cn('flex-1 p-[13px] text-[14px] font-semibold border-none rounded-[10px] cursor-pointer', isDark ? 'bg-white/[0.06] text-white/70' : 'bg-black/[0.06] text-black/60')}
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleConfirmCreatePool}
                            disabled={createPoolLoading}
                            className={cn('flex-[2] p-[13px] text-[14px] font-semibold text-white border-none rounded-[10px] flex items-center justify-center gap-2', createPoolLoading ? cn('cursor-not-allowed', isDark ? 'bg-[#222]' : 'bg-[#ccc]') : 'cursor-pointer bg-[#08AA09]')}
                          >
                            {createPoolLoading && <Spinner size={16} />}
                            {createPoolLoading ? 'Creating...' : 'Confirm & Create Pool'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleSubmitCreatePool}
                          disabled={createPoolLoading || !createPoolAmount1 || !createPoolAmount2}
                          className={cn('p-[13px] text-[14px] font-semibold w-full text-white border-none rounded-[10px] flex items-center justify-center gap-2 transition-all duration-150', (createPoolLoading || !createPoolAmount1 || !createPoolAmount2) ? cn('cursor-not-allowed', isDark ? 'bg-[#222]' : 'bg-[#ccc]') : 'cursor-pointer bg-[#137DFE]')}
                        >
                          {createPoolLoading && <Spinner size={16} />}
                          {createPoolLoading ? 'Simulating...' : 'Create Pool'}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </DialogContent>
            </DialogPaper>
          </Dialog>,
          document.body
        )}
    </div>
  );
};

export default memo(TradingHistory);
