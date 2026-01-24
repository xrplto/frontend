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
import styled from '@emotion/styled';
import axios from 'axios';
import { useSelector } from 'react-redux';
import TopTraders from 'src/TokenDetail/tabs/holders/TopTraders';
import RichList from 'src/TokenDetail/tabs/holders/RichList';
import { AppContext } from 'src/context/AppContext';
import { selectMetrics } from 'src/redux/statusSlice';
import {
  ExternalLink,
  X,
  Plus,
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
  Filter
} from 'lucide-react';
import { cn } from 'src/utils/cn';

const SYMBOLS = { USD: '$', EUR: '€', JPY: '¥', CNH: '¥', XRP: '✕' };

const Spinner = styled(Loader2)`
  animation: spin 1s linear infinite;
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;

const BearEmptyState = ({ isDark, title, subtitle }) => (
  <div style={{ border: isDark ? '1.5px dashed rgba(255,255,255,0.1)' : '1.5px dashed rgba(0,0,0,0.1)', borderRadius: 12, background: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ position: 'relative', width: 48, height: 48, marginBottom: 12 }}>
      <div style={{ position: 'absolute', top: -3, left: 0, width: 16, height: 16, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.15)' : '#d1d5db' }}>
        <div style={{ position: 'absolute', top: 3, left: 3, width: 10, height: 10, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb' }} />
      </div>
      <div style={{ position: 'absolute', top: -3, right: 0, width: 16, height: 16, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.15)' : '#d1d5db' }}>
        <div style={{ position: 'absolute', top: 3, right: 3, width: 10, height: 10, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb' }} />
      </div>
      <div style={{ position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)', width: 40, height: 36, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.15)' : '#d1d5db', overflow: 'hidden' }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{ height: 2, width: '100%', background: isDark ? 'rgba(255,255,255,0.15)' : '#e5e7eb', marginTop: i * 2.5 + 2 }} />
        ))}
        <div style={{ position: 'absolute', top: 10, left: 6, width: 10, height: 10 }}>
          <div style={{ position: 'absolute', width: 8, height: 2, background: isDark ? 'rgba(255,255,255,0.4)' : '#6b7280', transform: 'rotate(45deg)', top: 4 }} />
          <div style={{ position: 'absolute', width: 8, height: 2, background: isDark ? 'rgba(255,255,255,0.4)' : '#6b7280', transform: 'rotate(-45deg)', top: 4 }} />
        </div>
        <div style={{ position: 'absolute', top: 10, right: 6, width: 10, height: 10 }}>
          <div style={{ position: 'absolute', width: 8, height: 2, background: isDark ? 'rgba(255,255,255,0.4)' : '#6b7280', transform: 'rotate(45deg)', top: 4 }} />
          <div style={{ position: 'absolute', width: 8, height: 2, background: isDark ? 'rgba(255,255,255,0.4)' : '#6b7280', transform: 'rotate(-45deg)', top: 4 }} />
        </div>
        <div style={{ position: 'absolute', bottom: 5, left: '50%', transform: 'translateX(-50%)', width: 18, height: 12, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb' }}>
          <div style={{ position: 'absolute', top: 2, left: '50%', transform: 'translateX(-50%)', width: 8, height: 6, borderRadius: '50%', background: isDark ? 'rgba(255,255,255,0.25)' : '#9ca3af' }} />
        </div>
      </div>
    </div>
      <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.05em', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', textTransform: 'uppercase', marginBottom: 4 }}>{title}</span>
      <span style={{ fontSize: 10, color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>{subtitle}</span>
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
      <svg width={width} height={height} style={{ display: 'block' }}>
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
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '28px',
        height: '18px',
        borderRadius: '4px',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
        background: isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.015)'
      }}
    >
      <IconComponent color={tier.color} />
    </span>
  );
};

// Tier tooltip component
const TierHelpIcon = ({ isDark }) => (
  <span
    style={{ position: 'relative', display: 'inline-flex', marginLeft: '4px', cursor: 'help' }}
    className="tier-help"
  >
    <span
      style={{
        fontSize: '9px',
        width: '12px',
        height: '12px',
        borderRadius: '50%',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
      }}
    >
      ?
    </span>
    <span
      className="tier-tooltip"
      style={{
        position: 'absolute',
        bottom: '18px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: isDark ? '#1a1a1a' : '#fff',
        border: `1px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}`,
        borderRadius: '6px',
        padding: '8px 10px',
        fontSize: '10px',
        whiteSpace: 'nowrap',
        opacity: 0,
        visibility: 'hidden',
        transition: 'opacity 0.15s, visibility 0.15s',
        zIndex: 100,
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        lineHeight: 1.5,
        color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)'
      }}
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
const LiveIndicator = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 6px;
  border-radius: 6px;
  background: ${(props) => (props.isDark ? 'rgba(34,197,94,0.1)' : 'rgba(34,197,94,0.08)')};
`;

const LiveCircle = styled.div`
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #22c55e;
  animation: pulse 2s infinite;
  @keyframes pulse {
    0%,
    100% {
      opacity: 0.6;
    }
    50% {
      opacity: 1;
    }
  }
`;

const Card = styled.div`
  background: transparent;
  border-bottom: 1px solid
    ${(props) => (props.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')};
  position: relative;
  animation: ${(props) => (props.isNew ? 'highlight 0.8s ease-out' : 'none')};
  transition: background 0.15s ease;
  &:hover {
    background: ${(props) => (props.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)')};
  }
  ${(props) => props.isNew && highlightAnimation(props.isDark)}
  @media (max-width: 640px) {
    padding: 0 4px;
  }
`;

const CardContent = styled.div`
  padding: 8px 0;
  @media (max-width: 640px) {
    padding: 12px 0;
  }
`;

const TradeTypeChip = styled.div`
  font-size: 11px;
  font-weight: 500;
  color: ${(props) => (props.tradetype === 'BUY' ? '#22c55e' : '#ef4444')};
  width: 36px;
  @media (max-width: 640px) {
    font-size: 12px;
    font-weight: 500;
    width: 40px;
  }
`;

const VolumeIndicator = styled.div`
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: ${(props) => props.volume}%;
  background: ${(props) => (props.isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)')};
  transition: width 0.2s;
`;

// Bar cell for showing colored bars behind values
const BarCell = styled.div`
  position: relative;
  display: flex;
  align-items: center;
  height: 26px;
  padding: 0 10px;
  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    height: 22px;
    width: ${(props) => Math.min(100, Math.max(8, props.barWidth || 0))}%;
    background: ${(props) =>
      props.isCreate
        ? props.isDark
          ? 'linear-gradient(90deg, rgba(20, 184, 166, 0.10) 0%, rgba(20, 184, 166, 0.18) 100%)'
          : 'linear-gradient(90deg, rgba(20, 184, 166, 0.06) 0%, rgba(20, 184, 166, 0.14) 100%)'
        : props.isLP
          ? props.isDark
            ? 'linear-gradient(90deg, rgba(139, 92, 246, 0.10) 0%, rgba(139, 92, 246, 0.18) 100%)'
            : 'linear-gradient(90deg, rgba(139, 92, 246, 0.06) 0%, rgba(139, 92, 246, 0.14) 100%)'
          : props.isBuy
            ? props.isDark
              ? 'linear-gradient(90deg, rgba(34, 197, 94, 0.12) 0%, rgba(34, 197, 94, 0.22) 100%)'
              : 'linear-gradient(90deg, rgba(34, 197, 94, 0.08) 0%, rgba(34, 197, 94, 0.18) 100%)'
            : props.isDark
              ? 'linear-gradient(90deg, rgba(239, 68, 68, 0.12) 0%, rgba(239, 68, 68, 0.22) 100%)'
              : 'linear-gradient(90deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.18) 100%)'};
    border-radius: 4px;
    border-left: 2px solid
      ${(props) =>
        props.isCreate
          ? 'rgba(20, 184, 166, 0.5)'
          : props.isLP
            ? 'rgba(139, 92, 246, 0.5)'
            : props.isBuy
              ? props.isDark
                ? 'rgba(34, 197, 94, 0.6)'
                : 'rgba(34, 197, 94, 0.5)'
              : props.isDark
                ? 'rgba(239, 68, 68, 0.6)'
                : 'rgba(239, 68, 68, 0.5)'};
    transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  & > span {
    position: relative;
    z-index: 1;
  }
`;

const RefreshIcon = styled.button`
  background: transparent;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: ${(props) => (props.isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)')};
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s;
  &:hover {
    color: #3b82f6;
  }
`;

const Pagination = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1px;
`;

const PaginationButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${(props) => (props.isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)')};
  background: transparent;
  border: none;
  padding: 4px 6px;
  cursor: pointer;
  transition: color 0.15s;
  &:hover:not(:disabled) {
    color: #3b82f6;
  }
  &:disabled {
    opacity: 0.2;
    cursor: default;
  }
`;

const PageInfo = styled.span`
  font-size: 11px;
  color: ${(props) => (props.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)')};
  padding: 0 6px;
  white-space: nowrap;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  color: ${(props) => (props.isDark ? '#FFFFFF' : '#212B36')};
`;

const TableHeader = styled.div`
  display: flex;
  padding: 8px 0;
  border-bottom: 1px solid
    ${(props) => (props.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')};
  & > div {
    font-size: 9px;
    font-weight: 400;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: ${(props) => (props.isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.4)')};
  }
`;

const TableHead = styled.thead``;
const TableBody = styled.tbody``;
const TableRow = styled.tr`
  &:hover {
    background-color: ${(props) => (props.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)')};
  }
  border-bottom: 1px solid
    ${(props) => (props.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)')};
`;

const TableCell = styled.td`
  padding: 12px;
  font-size: ${(props) => (props.size === 'small' ? '13px' : '14px')};
  text-align: ${(props) => props.align || 'left'};
  font-weight: ${(props) => props.fontWeight || 400};
  opacity: ${(props) => props.opacity || 1};
  text-transform: ${(props) => props.textTransform || 'none'};
`;

const TableContainer = styled.div`
  border-radius: 12px;
  border: 1.5px solid ${(props) => (props.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)')};
  overflow: auto;
  background: transparent;
`;

const Link = styled.a`
  text-decoration: none;
  color: ${(props) => (props.isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)')};
  font-size: 11px;
  &:hover {
    color: #3b82f6;
  }
`;

const Tooltip = ({ title, children, arrow }) => {
  const [show, setShow] = useState(false);
  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '4px 8px',
            background: 'rgba(0,0,0,0.9)',
            color: '#fff',
            borderRadius: '4px',
            fontSize: '12px',
            whiteSpace: 'pre-line',
            zIndex: 1000,
            marginBottom: '4px'
          }}
        >
          {title}
        </div>
      )}
    </div>
  );
};

const IconButton = styled.button`
  padding: 4px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: ${(props) => (props.isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)')};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s;
  &:hover {
    color: #3b82f6;
  }
`;

const FormControlLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 400;
  color: ${(props) => (props.isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)')};
  cursor: pointer;
`;

const Tabs = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  @media (max-width: 640px) {
    width: 100%;
    gap: 6px;
  }
`;

const Tab = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.05em;
  padding: 10px 16px;
  background: transparent;
  border: 1px solid
    ${(props) =>
      props.selected
        ? props.isDark
          ? 'rgba(255,255,255,0.2)'
          : 'rgba(0,0,0,0.2)'
        : props.isDark
          ? 'rgba(255,255,255,0.1)'
          : 'rgba(0,0,0,0.1)'};
  border-radius: 6px;
  color: ${(props) =>
    props.selected
      ? props.isDark
        ? 'rgba(255,255,255,0.9)'
        : 'rgba(0,0,0,0.8)'
      : props.isDark
        ? 'rgba(255,255,255,0.4)'
        : 'rgba(0,0,0,0.4)'};
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
  flex-shrink: 0;
  text-transform: uppercase;
  &:hover {
    border-color: ${(props) => (props.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)')};
    color: ${(props) => (props.isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)')};
  }
  @media (max-width: 640px) {
    flex: 1;
    padding: 10px 6px;
    font-size: 10px;
    gap: 4px;
    & svg {
      width: 18px;
      height: 18px;
    }
    & > span {
      display: ${(props) => (props.selected ? 'inline' : 'none')};
    }
  }
`;

const Button = styled.button`
  padding: ${(props) => (props.size === 'small' ? '4px 10px' : '6px 12px')};
  font-size: 11px;
  font-weight: 400;
  border-radius: 6px;
  border: 1px solid ${(props) => (props.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)')};
  background: transparent;
  color: ${(props) => (props.isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)')};
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  transition: all 0.15s ease;
  &:hover {
    border-color: ${(props) => (props.isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)')};
    color: ${(props) => (props.isDark ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.8)')};
  }
`;

const Dialog = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  display: ${(props) => (props.open ? 'flex' : 'none')};
  align-items: center;
  justify-content: center;
  z-index: 99999;
  padding: 16px;
  box-sizing: border-box;
`;

const DialogPaper = styled.div`
  background: ${(props) => (props.isDark ? '#0a0f16' : '#ffffff')};
  border: 1px solid ${(props) => (props.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')};
  border-radius: 12px;
  max-width: 420px;
  width: 100%;
  max-height: calc(100vh - 32px);
  overflow: auto;
`;

const DialogTitle = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  font-size: 15px;
  font-weight: 500;
  color: ${(props) => (props.isDark ? '#fff' : '#1a1a1a')};
`;

const DialogContent = styled.div`
  padding: 0 20px 20px;
  color: ${(props) => (props.isDark ? '#fff' : '#1a1a1a')};
`;

const TextField = styled.input`
  width: 100%;
  padding: 10px 12px;
  font-size: 13px;
  border: 1px solid ${(props) => (props.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')};
  border-radius: 8px;
  background: ${(props) => (props.isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.02)')};
  color: ${(props) => (props.isDark ? '#fff' : '#1a1a1a')};
  transition: border-color 0.15s ease;
  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.25);
  }
  &::placeholder {
    color: ${(props) => (props.isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.35)')};
  }
`;

const FormControl = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const RadioGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Radio = styled.input`
  width: 14px;
  height: 14px;
  cursor: pointer;
  accent-color: #3b82f6;
`;

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
        0.0<sub style={{ fontSize: '0.6em' }}>{f.zeros}</sub>
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
        0.0<sub style={{ fontSize: '0.6em' }}>{f.zeros}</sub>
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

// My Activity Tab Component - Shows user's trading history and open offers
const MyActivityTab = ({ token, isDark, isMobile, onTransactionClick }) => {
  const { accountProfile } = useContext(AppContext);
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
      const res = await axios.get(`https://api.xrpl.to/api/account/offers/${account}?${params}`);
      if (res.data?.result === 'success') {
        setOpenOffers(res.data.offers || []);
        setOffersTotal(res.data.total || 0);
      }
    } catch (err) {
      console.error('Failed to fetch offers:', err);
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
      const res = await axios.get(`https://api.xrpl.to/api/account/token-stats/${account}/${token.md5}`);
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
          totalBought: stats.totalBought || 0,
          totalSold: stats.totalSold || 0,
          tradeCount: stats.tradeCount || 0
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
      const res = await axios.get(url);
      const trades = res.data?.hists || res.data?.trades || [];
      const nextCursor = res.data?.nextCursor || null;

      if (loadMore) {
        setMyTrades(prev => [...prev, ...trades]);
      } else {
        setMyTrades(trades);
        setTradesInitialized(true);
      }
      setTradesCursor(nextCursor);
      setTradesHasMore(!!nextCursor && trades.length > 0);
    } catch (err) {
      console.error('Failed to fetch trades:', err);
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

  const handleCancelOffer = (offerId) => {
    // TODO: Implement offer cancellation
  };

  const SubTab = styled.button`
    font-size: 12px;
    font-weight: 500;
    padding: 10px 16px;
    background: ${(props) =>
      props.selected
        ? props.isDark
          ? 'rgba(255,255,255,0.05)'
          : 'rgba(0,0,0,0.04)'
        : 'transparent'};
    border: none;
    border-right: 1px solid
      ${(props) => (props.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)')};
    color: ${(props) =>
      props.selected
        ? props.isDark
          ? 'rgba(255,255,255,0.9)'
          : 'rgba(0,0,0,0.8)'
        : props.isDark
          ? 'rgba(255,255,255,0.5)'
          : 'rgba(0,0,0,0.5)'};
    cursor: pointer;
    transition: all 0.15s;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    &:last-child {
      border-right: none;
    }
    &:hover {
      background: ${(props) => (props.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)')};
      color: ${(props) => (props.isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)')};
    }
    @media (max-width: 640px) {
      padding: 8px 12px;
      font-size: 11px;
    }
  `;

  const OfferCard = styled.div`
    background: ${(props) => (props.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)')};
    border: 1.5px solid ${(props) => (props.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')};
    border-radius: 12px;
    padding: 14px;
    &:hover {
      border-color: ${(props) => (props.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)')};
    }
  `;

  const CancelButton = styled.button`
    font-size: 11px;
    font-weight: 500;
    padding: 6px 12px;
    background: transparent;
    border: 1.5px solid ${(props) => (props.isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.4)')};
    border-radius: 8px;
    color: #ef4444;
    cursor: pointer;
    transition: all 0.15s;
    &:hover {
      background: rgba(239, 68, 68, 0.1);
      border-color: #ef4444;
    }
  `;

  const tokenCurrency = token ? (token.currency ? decodeCurrency(token.currency) : token.name || 'MPT') : 'TOKEN';

  // Empty state when not connected
  const notConnectedState = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        backgroundColor: 'transparent',
        borderRadius: '12px',
        border: `1.5px dashed ${isDark ? 'rgba(59,130,246,0.18)' : 'rgba(0,0,0,0.15)'}`
      }}
    >
      <Wallet
        size={40}
        strokeWidth={1.5}
        style={{
          marginBottom: '12px',
          color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
        }}
      />
      <span style={{ color: 'inherit' }}>Connect Wallet to View Activity</span>
      <span style={{ color: 'inherit' }}>
        Your trading history and open offers will appear here
      </span>
    </div>
  );

  const isConnected = !!(accountProfile?.account || accountProfile?.address);

  if (!isConnected) {
    return notConnectedState;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Sub-tabs */}
      <div
        style={{
          display: 'inline-flex',
          gap: '0',
          padding: '0',
          background: 'transparent',
          border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
          borderRadius: '12px',
          marginBottom: '4px',
          overflow: 'hidden'
        }}
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
          My Trades
        </SubTab>
        <SubTab
          selected={activeSubTab === 'offers'}
          onClick={() => setActiveSubTab('offers')}
          isDark={isDark}
        >
          Open Offers ({offersTotal})
        </SubTab>
      </div>

      {/* Assets */}
      {activeSubTab === 'assets' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {assetsLoading ? (
            <div style={{ textAlign: 'center', padding: '24px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
              <Spinner size={20} style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '12px' }}>Loading assets...</div>
            </div>
          ) : !tokenAssets ? (
            <div style={{ textAlign: 'center', padding: '24px', border: `1.5px dashed ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`, borderRadius: '10px' }}>
              <span style={{ fontSize: '12px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>No position in this token</span>
            </div>
          ) : (
            <>
              {/* Balance Card */}
              <OfferCard isDark={isDark}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', display: 'block', marginBottom: '4px' }}>Balance</span>
                    <span style={{ fontSize: '22px', fontWeight: 600, color: isDark ? '#fff' : '#1a1a1a' }}>
                      {formatTradeDisplay(tokenAssets.balance)} <span style={{ fontSize: '14px', opacity: 0.5 }}>{tokenCurrency}</span>
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', display: 'block', marginBottom: '4px' }}>Value</span>
                    <span style={{ fontSize: '18px', fontWeight: 500, color: isDark ? '#fff' : '#1a1a1a' }}>
                      {(tokenAssets.totalValue || 0).toFixed(2)} <span style={{ fontSize: '12px', opacity: 0.5 }}>XRP</span>
                    </span>
                  </div>
                </div>
              </OfferCard>

              {/* P&L Card */}
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '12px' }}>
                <OfferCard isDark={isDark}>
                  <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', display: 'block', marginBottom: '6px' }}>Unrealized P&L</span>
                  {tokenAssets.pnl != null ? (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '18px', fontWeight: 600, color: tokenAssets.pnl >= 0 ? '#22c55e' : '#ef4444' }}>
                        {tokenAssets.pnl >= 0 ? '+' : ''}{tokenAssets.pnl.toFixed(2)} XRP
                      </span>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: tokenAssets.pnl >= 0 ? '#22c55e' : '#ef4444' }}>
                        ({tokenAssets.pnl >= 0 ? '+' : ''}{(tokenAssets.pnlPercent || 0).toFixed(2)}%)
                      </span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>No trade history</span>
                  )}
                </OfferCard>

                <OfferCard isDark={isDark}>
                  <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', display: 'block', marginBottom: '6px' }}>Avg Buy Price</span>
                  {tokenAssets.avgBuyPrice != null ? (
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 500, color: isDark ? '#fff' : '#1a1a1a', fontFamily: 'var(--font-mono)' }}>
                        {formatPrice(tokenAssets.avgBuyPrice)}
                      </span>
                      <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>XRP</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: '12px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>—</span>
                  )}
                </OfferCard>
              </div>

              {/* Trustline Info */}
              <OfferCard isDark={isDark}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: tokenAssets.trustlineSet ? '#22c55e' : '#ef4444' }} />
                    <span style={{ fontSize: '12px', color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)' }}>
                      Trustline {tokenAssets.trustlineSet ? 'Active' : 'Not Set'}
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                    Limit: {abbreviateNumber(tokenAssets.limitAmount || 0)}
                  </span>
                </div>
              </OfferCard>
            </>
          )}
        </div>
      )}

      {/* My Trading History */}
      {activeSubTab === 'history' && (
        <>
          {tradesLoading && myTrades.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
              <Spinner size={20} style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '12px' }}>Loading trades...</div>
            </div>
          ) : myTrades.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', border: `1.5px dashed ${isDark ? 'rgba(59,130,246,0.18)' : 'rgba(0,0,0,0.15)'}`, borderRadius: '10px' }}>
              <span style={{ fontSize: '12px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>No trades yet for this token</span>
            </div>
          ) : (
            <>
              {/* Header */}
              {!isMobile && (
                <TableHeader isDark={isDark}>
                  <div style={{ flex: '0.7' }}>Time</div>
                  <div style={{ flex: '0.5' }}>Type</div>
                  <div style={{ flex: '1' }}>Amount</div>
                  <div style={{ flex: '0.8' }}>Price</div>
                  <div style={{ flex: '0.8' }}>Total</div>
                  <div style={{ flex: '0.3' }}></div>
                </TableHeader>
              )}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {myTrades.map((trade, idx) => {
                  const isBuy = trade.paid?.currency === 'XRP';
                  const tokenAmount = isBuy ? trade.got : trade.paid;
                  const xrpAmount = isBuy ? trade.paid : trade.got;
                  const price = parseFloat(xrpAmount?.value) / parseFloat(tokenAmount?.value) || 0;

                  return (
                    <Card key={trade._id || trade.hash || idx} isDark={isDark}>
                      <CardContent style={{ padding: isMobile ? '10px 0' : '6px 0' }}>
                        {isMobile ? (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '11px', fontWeight: 500, color: isBuy ? '#22c55e' : '#ef4444' }}>{isBuy ? 'Buy' : 'Sell'}</span>
                              <span style={{ fontSize: '10px', color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)' }}>
                                {formatRelativeTime(trade.time)}
                              </span>
                            </div>
                            <span style={{ fontSize: '12px', color: isDark ? '#fff' : '#1a1a1a' }}>
                              {formatTradeDisplay(tokenAmount?.value)} {tokenCurrency}
                            </span>
                            <span style={{ fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
                              {formatTradeDisplay(xrpAmount?.value)} XRP
                            </span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ flex: '0.7', fontSize: '11px', color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }}>
                              {formatRelativeTime(trade.time)}
                            </span>
                            <span style={{ flex: '0.5', fontSize: '11px', fontWeight: 500, color: isBuy ? '#22c55e' : '#ef4444' }}>
                              {isBuy ? 'Buy' : 'Sell'}
                            </span>
                            <span style={{ flex: '1', fontSize: '12px', color: isDark ? '#fff' : '#1a1a1a' }}>
                              {formatTradeDisplay(tokenAmount?.value)} <span style={{ opacity: 0.5 }}>{tokenCurrency}</span>
                            </span>
                            <span style={{ flex: '0.8', fontSize: '12px', fontFamily: 'var(--font-mono)', color: isDark ? '#fff' : '#1a1a1a' }}>
                              {formatPrice(price)}
                            </span>
                            <span style={{ flex: '0.8', fontSize: '12px', color: isDark ? '#fff' : '#1a1a1a' }}>
                              {formatTradeDisplay(xrpAmount?.value)} <span style={{ opacity: 0.5 }}>XRP</span>
                            </span>
                            <div style={{ flex: '0.3' }}>
                              <IconButton onClick={() => onTransactionClick && onTransactionClick(trade.hash)} isDark={isDark}>
                                <ExternalLink size={12} />
                              </IconButton>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              {/* Load More */}
              {tradesHasMore && (
                <button
                  onClick={() => fetchMyTrades(true)}
                  disabled={tradesLoading}
                  style={{
                    marginTop: '12px',
                    padding: '10px 16px',
                    fontSize: '12px',
                    fontWeight: 500,
                    background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    borderRadius: '8px',
                    color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                    cursor: tradesLoading ? 'not-allowed' : 'pointer',
                    width: '100%'
                  }}
                >
                  {tradesLoading ? 'Loading...' : 'Load More'}
                </button>
              )}
            </>
          )}
        </>
      )}

      {/* Open Offers */}
      {activeSubTab === 'offers' && (
        <>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
              <Spinner size={24} />
            </div>
          ) : openOffers.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '24px',
                border: `1.5px dashed ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.15)'}`,
                borderRadius: '10px'
              }}
            >
              <span style={{ color: 'inherit' }}>No open offers for this token</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {openOffers.map((offer) => {
                const isBuy = offer.takerGets?.currency === 'XRP' || offer.takerGets?.value;
                const type = isBuy ? 'BUY' : 'SELL';
                const tokenAmount = isBuy
                  ? parseFloat(offer.takerPays?.value || offer.takerPays || 0)
                  : parseFloat(offer.takerGets?.value || offer.takerGets || 0);
                const xrpAmount = isBuy
                  ? parseFloat(offer.takerGets?.value || offer.takerGets || 0) / 1000000
                  : parseFloat(offer.takerPays?.value || offer.takerPays || 0) / 1000000;
                const price = tokenAmount > 0 ? xrpAmount / tokenAmount : 0;
                const total = xrpAmount;

                return (
                  <OfferCard key={offer.seq || offer._id} isDark={isDark}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}
                    >
                      {/* Left side - Offer details */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: 1 }}>
                        <TradeTypeChip
                          tradetype={type}
                          style={{ fontSize: '12px', fontWeight: 600 }}
                        >
                          {type}
                        </TradeTypeChip>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: 500,
                              color: isDark ? '#fff' : '#1a1a1a'
                            }}
                          >
                            {formatTradeDisplay(tokenAmount)}{' '}
                            <span style={{ opacity: 0.5 }}>{tokenCurrency}</span>
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
                            }}
                          >
                            @ {formatPrice(price)} XRP
                          </span>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px',
                            paddingLeft: '16px',
                            borderLeft: `1px solid ${isDark ? 'rgba(59,130,246,0.12)' : 'rgba(0,0,0,0.1)'}`
                          }}
                        >
                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: 500,
                              color: isDark ? '#fff' : '#1a1a1a'
                            }}
                          >
                            {formatXRPAmount(total)} <span style={{ opacity: 0.5 }}>XRP</span>
                          </span>
                          <span
                            style={{
                              fontSize: '11px',
                              color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
                            }}
                          >
                            Total value
                          </span>
                        </div>
                      </div>

                      {/* Right side - Sequence and actions */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                              display: 'block'
                            }}
                          >
                            Seq #{offer.seq}
                          </span>
                          {offer.expiration && (
                            <span style={{ fontSize: '10px', color: '#f59e0b' }}>
                              Expires {formatRelativeTime(offer.expiration * 1000)}
                            </span>
                          )}
                        </div>

                        <CancelButton onClick={() => handleCancelOffer(offer.seq)} isDark={isDark}>
                          Cancel
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
            <div className="flex items-center justify-center gap-1 pt-3">
              <button
                onClick={() => setOffersPage((p) => Math.max(0, p - 1))}
                disabled={offersPage === 0}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  offersPage === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10',
                  isDark ? 'text-white/50' : 'text-gray-500'
                )}
                title="Previous"
              >
                <ChevronLeft size={14} />
              </button>
              <span
                className={cn(
                  'text-[11px] px-2 tabular-nums',
                  isDark ? 'text-white/40' : 'text-gray-500'
                )}
              >
                {offersPage + 1}
                <span style={{ opacity: 0.5 }}>/</span>
                {Math.ceil(offersTotal / offersLimit)}
              </span>
              <button
                onClick={() => setOffersPage((p) => p + 1)}
                disabled={(offersPage + 1) * offersLimit >= offersTotal}
                className={cn(
                  'p-1.5 rounded-md transition-colors',
                  (offersPage + 1) * offersLimit >= offersTotal
                    ? 'opacity-30 cursor-not-allowed'
                    : 'hover:bg-white/10',
                  isDark ? 'text-white/50' : 'text-gray-500'
                )}
                title="Next"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}

        </>
      )}
    </div>
  );
};

// Inline Expandable Trade Details Component
const TradeDetails = ({ trade, account, isDark, onClose }) => {
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
      const response = await fetch(`https://api.xrpl.to/v1/tx-explain/${trade.hash}`, {
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
      fetch(`https://api.xrpl.to/v1/tx/${trade.hash}`)
        .then((r) => r.json())
        .catch(() => null),
      account
        ? fetch(`https://api.xrpl.to/v1/account/info/${account}`)
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
      style={{
        padding: '12px 8px',
        background: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(128,128,128,0.1)',
        borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        animation: 'expandIn 0.15s ease-out'
      }}
    >
      <style>{`@keyframes expandIn { from { opacity: 0; max-height: 0; } to { opacity: 1; max-height: 400px; } }`}</style>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}>
          <Spinner size={18} />
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          {/* Trader Info */}
          {account && (
            <div style={{ minWidth: '120px', maxWidth: '180px', overflow: 'hidden' }}>
              <div
                style={{
                  fontSize: '9px',
                  color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
                }}
              >
                Trader
              </div>
              <a
                href={`/address/${account}`}
                style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: '#3b82f6',
                  textDecoration: 'none',
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
                title={account}
              >
                {account.slice(0, 6)}...{account.slice(-4)}
              </a>
              {(profileData?.balance ||
                profileData?.Balance ||
                profileData?.account_data?.Balance) && (
                <div
                  style={{
                    fontSize: '10px',
                    color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
                  }}
                >
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
              <div style={{ minWidth: '100px' }}>
                <div
                  style={{
                    fontSize: '9px',
                    color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
                  }}
                >
                  Status
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background:
                      txData.meta?.TransactionResult === 'tesSUCCESS'
                        ? 'rgba(34,197,94,0.15)'
                        : 'rgba(239,68,68,0.15)',
                    color: txData.meta?.TransactionResult === 'tesSUCCESS' ? '#22c55e' : '#ef4444'
                  }}
                >
                  {txData.meta?.TransactionResult === 'tesSUCCESS' ? 'Success' : 'Failed'}
                </span>
              </div>
              <div style={{ minWidth: '80px' }}>
                <div
                  style={{
                    fontSize: '9px',
                    color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
                  }}
                >
                  Fee
                </div>
                <div style={{ fontSize: '11px', color: isDark ? '#fff' : '#1a1a1a' }}>
                  {dropsToXrp(txData.Fee)} XRP
                </div>
              </div>
              <div style={{ minWidth: '80px' }}>
                <div
                  style={{
                    fontSize: '9px',
                    color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
                  }}
                >
                  Ledger
                </div>
                <div style={{ fontSize: '11px', color: isDark ? '#fff' : '#1a1a1a' }}>
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
                <div style={{ minWidth: '120px', maxWidth: '200px' }}>
                  <div
                    style={{
                      fontSize: '9px',
                      color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
                    }}
                  >
                    Memo
                  </div>
                  <div
                    style={{
                      fontSize: '10px',
                      color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {data}
                  </div>
                </div>
              ) : null;
            })()}
          {/* Action Buttons */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginLeft: 'auto' }}>
            <a
              href={`/tx/${trade.hash}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                fontSize: '11px',
                fontWeight: 500,
                color: '#fff',
                background: '#3b82f6',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 12px',
                textDecoration: 'none',
                cursor: 'pointer'
              }}
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
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: '4px',
                marginLeft: '4px'
              }}
            >
              <X
                size={14}
                style={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)' }}
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
              style={{
                marginTop: '8px',
                padding: '12px 16px',
                background: isDark ? 'rgba(167,139,250,0.08)' : 'rgba(167,139,250,0.05)',
                borderTop: `1px solid ${isDark ? 'rgba(139,92,246,0.15)' : 'rgba(139,92,246,0.1)'}`
              }}
            >
              <div style={{ fontSize: '13px', marginBottom: keyPoints.length ? '12px' : 0 }}>
                <span style={{ color: '#a78bfa', fontWeight: 500 }}>
                  {aiExplanation.extracted?.type || 'Trade'}:
                </span>{' '}
                <span style={{ color: isDark ? '#fff' : '#1a1a1a' }}>{summaryText}</span>
              </div>
              {keyPoints.length > 0 && (
                <div>
                  <div
                    style={{
                      fontSize: '10px',
                      fontWeight: 500,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                      marginBottom: '8px'
                    }}
                  >
                    Key Points
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      padding: 0,
                      listStyle: 'none',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}
                  >
                    {keyPoints.map((point, idx) => (
                      <li
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px',
                          fontSize: '12px',
                          fontFamily: 'var(--font-mono)',
                          color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)'
                        }}
                      >
                        <span style={{ color: '#8b5cf6' }}>•</span>
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
  const [addLiquidityDialog, setAddLiquidityDialog] = useState({ open: false, pool: null });
  const [depositAmount1, setDepositAmount1] = useState('');
  const [depositAmount2, setDepositAmount2] = useState('');
  const [depositMode, setDepositMode] = useState('double'); // 'double', 'single1', 'single2'

  // Pool UI enhancements
  const [expandedPoolId, setExpandedPoolId] = useState(null);
  const [poolChartData, setPoolChartData] = useState({}); // Cache: { ammAccount: chartData[] }
  const [poolChartLoading, setPoolChartLoading] = useState({});
  const [poolTypeFilter, setPoolTypeFilter] = useState('all'); // 'all', 'xrp', 'token'
  const [poolSortBy, setPoolSortBy] = useState('liquidity'); // 'liquidity', 'apy', 'volume', 'fees'
  const [poolSortDir, setPoolSortDir] = useState('desc'); // 'asc', 'desc'

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
        const res = await fetch(
          `https://api.xrpl.to/v1/amm?issuer=${token.issuer}&currency=${token.currency}&sortBy=fees`
        );
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
              let chartRes = await fetch(
                `https://api.xrpl.to/v1/amm/liquidity-chart?ammAccount=${poolAccount}&period=1m`
              );
              let chartData = await chartRes.json();

              // If no data for 1m, try 1w
              if (
                chartData.result === 'success' &&
                (!chartData.data || chartData.data.length < 2)
              ) {
                chartRes = await fetch(
                  `https://api.xrpl.to/v1/amm/liquidity-chart?ammAccount=${poolAccount}&period=1w`
                );
                chartData = await chartRes.json();
              }

              // If still no data, try all time
              if (
                chartData.result === 'success' &&
                (!chartData.data || chartData.data.length < 2)
              ) {
                chartRes = await fetch(
                  `https://api.xrpl.to/v1/amm/liquidity-chart?ammAccount=${poolAccount}&period=all`
                );
                chartData = await chartRes.json();
              }

              if (chartData.result === 'success' && chartData.data && chartData.data.length >= 2) {
                setPoolChartData((prev) => ({ ...prev, [poolAccount]: chartData.data }));
              }
            } catch (err) {
              console.error('Error fetching pool chart for', poolAccount, err);
            }
          }
        });
      } catch (error) {
        console.error('Error fetching AMM pools:', error);
      } finally {
        setAmmLoading(false);
      }
    }
  };

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

        const response = await fetch(`https://api.xrpl.to/v1/history?${params}`);
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

    // Connect immediately
    const wsParams = new URLSearchParams({ limit: String(limit) });
    if (pairType) wsParams.set('pairType', pairType);
    if (historyType !== 'all') wsParams.set('type', historyType);
    if (liquidityType) wsParams.set('liquidityType', liquidityType);

    const ws = new WebSocket(`wss://api.xrpl.to/ws/history/${tokenId}?${wsParams}`);
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

    ws.onerror = () => {
      // Silently handle - HTTP fallback already loads data
    };

    ws.onclose = () => {
      if (wsPingRef.current) {
        clearInterval(wsPingRef.current);
        wsPingRef.current = null;
      }
    };

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
    setAddLiquidityDialog({ open: true, pool });
    setDepositAmount1('');
    setDepositAmount2('');
    setDepositMode('double');
  };

  const handleCloseDialog = () => {
    setAddLiquidityDialog({ open: false, pool: null });
  };

  const handleAmount1Change = (value) => {
    setDepositAmount1(value);
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

  const handleSubmitDeposit = () => {
    // TODO: Implement AMM deposit using proper wallet integration
    handleCloseDialog();
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

      // Mobile card layout - compact single row
      if (isMobile) {
        return (
          <Card
            key={trade._id || trade.id || index}
            isNew={newTradeIds.has(trade._id || trade.id)}
            isDark={isDark}
          >
            <VolumeIndicator volume={volumePercentage} isDark={isDark} />
            <CardContent>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px'
                }}
              >
                {/* Left: Type + Time */}
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '75px' }}
                >
                  {isLiquidity ? (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 500,
                        color:
                          trade.type === 'withdraw'
                            ? '#f59e0b'
                            : trade.type === 'create'
                              ? '#14b8a6'
                              : '#8b5cf6'
                      }}
                    >
                      {getLiquidityLabel()}
                    </span>
                  ) : (
                    <TradeTypeChip tradetype={isBuy ? 'BUY' : 'SELL'}>
                      {isBuy ? 'BUY' : 'SELL'}
                    </TradeTypeChip>
                  )}
                  <span
                    style={{
                      fontSize: '11px',
                      color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
                    }}
                  >
                    {formatRelativeTime(trade.time)}
                  </span>
                </div>
                {/* Center: Amount → Total with fiat value */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    flex: 1,
                    justifyContent: 'flex-end'
                  }}
                >
                  <span
                    style={{
                      fontSize: '13px',
                      fontFamily: 'var(--font-mono)',
                      color: isDark ? '#fff' : '#1a1a1a'
                    }}
                  >
                    {formatTradeDisplay(amountData.value)}{' '}
                    <span style={{ opacity: 0.5, fontSize: '11px' }}>
                      {decodeCurrency(amountData.currency)}
                    </span>
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      color: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
                    }}
                  >
                    →
                  </span>
                  <span
                    style={{
                      fontSize: '13px',
                      fontFamily: 'var(--font-mono)',
                      color: isDark ? '#fff' : '#1a1a1a'
                    }}
                  >
                    {formatTradeDisplay(totalData.value)}{' '}
                    <span style={{ opacity: 0.5, fontSize: '11px' }}>
                      {decodeCurrency(totalData.currency)}
                    </span>
                    {activeFiatCurrency !== 'XRP' && (
                      <span
                        style={{
                          fontSize: '10px',
                          color: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)',
                          marginLeft: '4px'
                        }}
                      >
                        ({SYMBOLS[activeFiatCurrency]}
                        {formatTradeDisplay(
                          (xrpAmount > 0
                            ? xrpAmount
                            : parseFloat(amountData.value) * (token?.exch || 0)) / exchRate
                        )}
                        )
                      </span>
                    )}
                  </span>
                </div>
                {/* Right: Link */}
                <IconButton
                  onClick={() => handleTxClick(trade.hash, addressToShow)}
                  isDark={isDark}
                  style={{ padding: '4px' }}
                >
                  <ExternalLink size={16} />
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
          <CardContent style={{ padding: '4px 0' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: `70px 50px 90px 1fr 1fr ${activeFiatCurrency !== 'XRP' ? '70px ' : ''}95px 70px 40px`,
                gap: '8px',
                alignItems: 'center',
                cursor: 'pointer'
              }}
              onClick={() =>
                setExpandedTradeId(
                  expandedTradeId === (trade._id || trade.id) ? null : trade._id || trade.id
                )
              }
            >
              {/* Time */}
              <span
                style={{
                  fontSize: '12px',
                  color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
                }}
              >
                {formatRelativeTime(trade.time, true)}
              </span>

              {/* Type */}
              {isLiquidity ? (
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 500,
                    color:
                      trade.type === 'withdraw'
                        ? '#f59e0b'
                        : trade.type === 'create'
                          ? '#14b8a6'
                          : '#8b5cf6'
                  }}
                >
                  {getLiquidityLabel()}
                </span>
              ) : (
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 500,
                    color: isBuy ? '#22c55e' : '#ef4444'
                  }}
                >
                  {isBuy ? 'Buy' : 'Sell'}
                </span>
              )}

              {/* Price */}
              <span
                style={{
                  fontSize: '12px',
                  fontFamily: 'var(--font-mono)',
                  color: isDark ? '#fff' : '#1a1a1a'
                }}
              >
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
                <span style={{ fontSize: '12px', color: isDark ? '#fff' : '#1a1a1a' }}>
                  {formatTradeDisplay(amountData.value)}{' '}
                  <span style={{ opacity: 0.5, fontSize: '10px' }}>
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
                <span style={{ fontSize: '12px', color: isDark ? '#fff' : '#1a1a1a' }}>
                  {formatTradeDisplay(totalData.value)}{' '}
                  <span style={{ opacity: 0.5, fontSize: '10px' }}>
                    {decodeCurrency(totalData.currency)}
                  </span>
                </span>
              </BarCell>

              {/* Fiat Value */}
              {activeFiatCurrency !== 'XRP' && (
                <span
                  style={{
                    fontSize: '11px',
                    color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                    textAlign: 'right',
                    fontFamily: 'var(--font-mono)'
                  }}
                >
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
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
                  textDecoration: 'none',
                  padding: '3px 6px',
                  borderRadius: '4px',
                  background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '95px'
                }}
                title={addressToShow}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#3b82f6';
                  e.currentTarget.style.color = '#3b82f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = isDark
                    ? 'rgba(255,255,255,0.08)'
                    : 'rgba(0,0,0,0.06)';
                  e.currentTarget.style.color = isDark
                    ? 'rgba(255,255,255,0.7)'
                    : 'rgba(0,0,0,0.7)';
                }}
              >
                {dotColor && (
                  <span
                    style={{
                      width: '4px',
                      height: '4px',
                      borderRadius: '50%',
                      background: dotColor,
                      flexShrink: 0
                    }}
                  />
                )}
                {addressToShow ? `${addressToShow.slice(0, 4)}...${addressToShow.slice(-4)}` : '-'}
              </a>

              {/* Source */}
              <span
                style={{
                  fontSize: '10px',
                  color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {getSourceTagName(trade.sourceTag) || (isLiquidity ? 'AMM' : '')}
              </span>

              {/* Animal tier icon */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '32px' }}>
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
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        width: '100%',
        flex: 1,
        position: 'relative',
        zIndex: 0
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px'
        }}
      >
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <select
              value={pairType}
              onChange={(e) => setPairType(e.target.value)}
              style={{
                padding: '5px 8px',
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '6px',
                border: `1px solid ${pairType ? '#3b82f6' : isDark ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.12)'}`,
                background: isDark
                  ? pairType
                    ? 'rgba(59,130,246,0.15)'
                    : 'rgba(0,0,0,0.8)'
                  : pairType
                    ? 'rgba(59,130,246,0.1)'
                    : '#fff',
                color: pairType ? '#3b82f6' : isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                cursor: 'pointer',
                outline: 'none',
                colorScheme: isDark ? 'dark' : 'light',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none'
              }}
            >
              <option value="" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>
                All Pairs
              </option>
              <option value="xrp" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>
                XRP Pairs
              </option>
              <option value="token" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>
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
              style={{
                padding: '5px 8px',
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '6px',
                border: `1px solid ${historyType !== 'trades' ? '#3b82f6' : isDark ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.12)'}`,
                background: isDark
                  ? historyType !== 'trades'
                    ? 'rgba(59,130,246,0.15)'
                    : 'rgba(0,0,0,0.8)'
                  : historyType !== 'trades'
                    ? 'rgba(59,130,246,0.1)'
                    : '#fff',
                color:
                  historyType !== 'trades'
                    ? '#3b82f6'
                    : isDark
                      ? 'rgba(255,255,255,0.6)'
                      : 'rgba(0,0,0,0.6)',
                cursor: 'pointer',
                outline: 'none',
                colorScheme: isDark ? 'dark' : 'light',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none'
              }}
            >
              <option value="trades" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>
                Trades
              </option>
              <option value="liquidity" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>
                Liquidity
              </option>
              <option value="all" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>
                All
              </option>
            </select>
            {historyType === 'liquidity' && (
              <select
                value={liquidityType}
                onChange={(e) => setLiquidityType(e.target.value)}
                style={{
                  padding: '5px 8px',
                  fontSize: '11px',
                  fontWeight: 500,
                  borderRadius: '6px',
                  border: `1px solid ${liquidityType ? '#8b5cf6' : isDark ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.12)'}`,
                  background: isDark
                    ? liquidityType
                      ? 'rgba(139,92,246,0.15)'
                      : 'rgba(0,0,0,0.8)'
                    : liquidityType
                      ? 'rgba(139,92,246,0.1)'
                      : '#fff',
                  color: liquidityType
                    ? '#8b5cf6'
                    : isDark
                      ? 'rgba(255,255,255,0.6)'
                      : 'rgba(0,0,0,0.6)',
                  cursor: 'pointer',
                  outline: 'none',
                  colorScheme: isDark ? 'dark' : 'light',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  appearance: 'none'
                }}
              >
                <option value="" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>
                  All Events
                </option>
                <option value="deposit" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>
                  Deposits
                </option>
                <option value="withdraw" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>
                  Withdrawals
                </option>
                <option value="create" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>
                  Pool Creates
                </option>
              </select>
            )}
            <select
              value={xrpAmount}
              onChange={(e) => setXrpAmount(e.target.value)}
              style={{
                padding: '5px 8px',
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '6px',
                border: `1px solid ${xrpAmount ? '#3b82f6' : isDark ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.12)'}`,
                background: isDark
                  ? xrpAmount
                    ? 'rgba(59,130,246,0.15)'
                    : 'rgba(0,0,0,0.8)'
                  : xrpAmount
                    ? 'rgba(59,130,246,0.1)'
                    : '#fff',
                color: xrpAmount ? '#3b82f6' : isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                cursor: 'pointer',
                outline: 'none',
                colorScheme: isDark ? 'dark' : 'light',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                appearance: 'none'
              }}
            >
              <option value="" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>
                Min XRP
              </option>
              <option value="100" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>
                100+
              </option>
              <option value="500" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>
                500+
              </option>
              <option value="1000" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>
                1k+
              </option>
              <option value="2500" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>
                2.5k+
              </option>
              <option value="5000" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>
                5k+
              </option>
              <option value="10000" style={{ background: isDark ? '#1a1a1a' : '#fff' }}>
                10k+
              </option>
            </select>
            <input
              type="text"
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              placeholder="Filter account..."
              style={{
                padding: '5px 8px',
                fontSize: '11px',
                fontWeight: 500,
                borderRadius: '6px',
                border: `1px solid ${accountFilter ? '#3b82f6' : isDark ? 'rgba(59,130,246,0.15)' : 'rgba(0,0,0,0.12)'}`,
                background: isDark
                  ? accountFilter
                    ? 'rgba(59,130,246,0.15)'
                    : 'rgba(0,0,0,0.8)'
                  : accountFilter
                    ? 'rgba(59,130,246,0.1)'
                    : '#fff',
                color: isDark ? '#fff' : '#1a1a1a',
                outline: 'none',
                width: '120px'
              }}
            />
          </div>
        )}
      </div>

      {tabValue === 0 && (
        <>
          {/* Desktop header - hidden on mobile */}
          {!isMobile && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '70px 50px 90px 1fr 1fr 95px 70px 40px',
                gap: '8px',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: `1px solid ${isDark ? 'rgba(59,130,246,0.1)' : 'rgba(0,0,0,0.08)'}`
              }}
            >
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                Time
                <LiveIndicator isDark={isDark}>
                  <LiveCircle />
                </LiveIndicator>
              </div>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
                }}
              >
                Type
              </div>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
                }}
              >
                Price
              </div>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                  paddingLeft: '8px'
                }}
              >
                Amount
              </div>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                  paddingLeft: '8px'
                }}
              >
                Value
              </div>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
                }}
              >
                Trader
              </div>
              <div
                style={{
                  fontSize: '10px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
                }}
              >
                Source
              </div>
              <div></div>
            </div>
          )}

          {/* Mobile header with column labels */}
          {isMobile && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 0',
                marginBottom: '4px',
                borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '65px' }}>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
                  }}
                >
                  Type
                </span>
                <LiveIndicator isDark={isDark}>
                  <LiveCircle />
                </LiveIndicator>
              </div>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
                }}
              >
                Amount
              </span>
              <span style={{ width: '28px' }}></span>
            </div>
          )}

          {trades.length === 0 ? (
            emptyState
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'auto' }}>
              {renderedTrades}
            </div>
          )}

          {/* Cursor-based pagination */}
          {(totalRecords > limit || currentPage > 1) && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                marginTop: '10px'
              }}
            >
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
                  <span style={{ opacity: 0.5 }}>/</span>
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
        <div>
          {/* Pool Controls - Filter & Sort */}
          {!ammLoading && ammPools.length > 0 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                marginBottom: '12px',
                flexWrap: 'wrap'
              }}
            >
              {/* Pool Type Filter */}
              <div style={{ display: 'flex', gap: '4px' }}>
                {[
                  { value: 'all', label: 'All' },
                  { value: 'xrp', label: 'XRP Pools' },
                  { value: 'token', label: 'Token Pools' }
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => setPoolTypeFilter(value)}
                    style={{
                      padding: '5px 10px',
                      fontSize: '11px',
                      fontWeight: poolTypeFilter === value ? 500 : 400,
                      borderRadius: '6px',
                      border:
                        poolTypeFilter === value
                          ? '1px solid #3b82f6'
                          : isDark
                            ? '1px solid rgba(255,255,255,0.1)'
                            : '1px solid rgba(0,0,0,0.08)',
                      background:
                        poolTypeFilter === value
                          ? isDark
                            ? 'rgba(255,255,255,0.08)'
                            : 'rgba(0,0,0,0.06)'
                          : 'transparent',
                      color:
                        poolTypeFilter === value
                          ? '#3b82f6'
                          : isDark
                            ? 'rgba(255,255,255,0.6)'
                            : 'rgba(0,0,0,0.6)',
                      cursor: 'pointer'
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {/* Sort Control */}
              {!isMobile && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span
                    style={{
                      fontSize: '10px',
                      color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                      textTransform: 'uppercase'
                    }}
                  >
                    Sort:
                  </span>
                  <select
                    value={poolSortBy}
                    onChange={(e) => setPoolSortBy(e.target.value)}
                    style={{
                      padding: '4px 8px',
                      fontSize: '11px',
                      borderRadius: '5px',
                      border: isDark
                        ? '1px solid rgba(255,255,255,0.1)'
                        : '1px solid rgba(0,0,0,0.08)',
                      background: isDark ? 'rgba(0,0,0,0.4)' : '#fff',
                      color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)',
                      cursor: 'pointer',
                      outline: 'none'
                    }}
                  >
                    <option value="liquidity">TVL</option>
                    <option value="apy">APY</option>
                    <option value="volume">Volume</option>
                    <option value="fees">Fees</option>
                  </select>
                  <button
                    onClick={() => setPoolSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'))}
                    style={{
                      padding: '4px 6px',
                      fontSize: '11px',
                      borderRadius: '5px',
                      border: isDark
                        ? '1px solid rgba(255,255,255,0.1)'
                        : '1px solid rgba(0,0,0,0.08)',
                      background: 'transparent',
                      color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center'
                    }}
                    title={poolSortDir === 'desc' ? 'Highest first' : 'Lowest first'}
                  >
                    {poolSortDir === 'desc' ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                  </button>
                </div>
              )}
            </div>
          )}

          {ammLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
              <Spinner size={20} />
            </div>
          ) : ammPools.length === 0 ? (
            <BearEmptyState isDark={isDark} title="No pools found" subtitle="AMM pools will appear here when available" />
          ) : filteredAndSortedPools.length === 0 ? (
            <BearEmptyState isDark={isDark} title={`No ${poolTypeFilter === 'xrp' ? 'XRP' : 'token/token'} pools found`} subtitle="Try a different filter" />
          ) : isMobile ? (
            /* Mobile compact pool rows */
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {/* Mobile header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 60px 70px 32px',
                  gap: '6px',
                  alignItems: 'center',
                  padding: '6px 0',
                  marginBottom: '4px',
                  borderBottom: isDark
                    ? '1px solid rgba(255,255,255,0.08)'
                    : '1px solid rgba(0,0,0,0.08)'
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                    color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
                  }}
                >
                  Pool
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                    color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                    textAlign: 'center'
                  }}
                >
                  Trend
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                    color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
                    textAlign: 'right'
                  }}
                >
                  APY / TVL
                </span>
                <span></span>
              </div>
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
                return (
                  <div key={pool._id}>
                    <div
                      onClick={() => handlePoolExpand(pool._id, pool)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 60px 70px 32px',
                        gap: '6px',
                        alignItems: 'center',
                        padding: isMainPool ? '10px 8px' : '8px 0',
                        borderBottom: isExpanded
                          ? 'none'
                          : isDark
                            ? '1px solid rgba(255,255,255,0.04)'
                            : '1px solid rgba(0,0,0,0.04)',
                        background: isMainPool
                          ? isDark
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(0,0,0,0.04)'
                          : 'transparent',
                        borderLeft: isMainPool ? '3px solid #3b82f6' : 'none',
                        borderRadius: isMainPool ? '6px' : '0',
                        marginBottom: isMainPool && !isExpanded ? '4px' : '0',
                        cursor: 'pointer'
                      }}
                    >
                      {/* Pool pair */}
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}
                      >
                        <div style={{ display: 'flex', flexShrink: 0 }}>
                          <img
                            src={getTokenImageUrl(pool.asset1.issuer, pool.asset1.currency)}
                            alt=""
                            style={{ width: 18, height: 18, borderRadius: '50%' }}
                          />
                          <img
                            src={getTokenImageUrl(pool.asset2.issuer, pool.asset2.currency)}
                            alt=""
                            style={{ width: 18, height: 18, borderRadius: '50%', marginLeft: -6 }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 500,
                            color: isDark ? '#fff' : '#1a1a1a',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {asset1}/{asset2}
                        </span>
                        {isMainPool && (
                          <span
                            style={{
                              fontSize: '8px',
                              fontWeight: 600,
                              padding: '2px 4px',
                              borderRadius: '3px',
                              background: '#3b82f6',
                              color: '#fff',
                              flexShrink: 0
                            }}
                          >
                            MAIN
                          </span>
                        )}
                      </div>
                      {/* Mini Chart */}
                      <div
                        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}
                      >
                        {chartData && chartData.length >= 2 ? (
                          <MiniSparkline data={chartData} width={50} height={20} isDark={isDark} />
                        ) : isChartLoading ? (
                          <Spinner size={12} style={{ opacity: 0.5 }} />
                        ) : (
                          <span
                            style={{
                              fontSize: '9px',
                              color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                              fontWeight: 500
                            }}
                          >
                            NEW
                          </span>
                        )}
                      </div>
                      {/* APY & TVL */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'flex-end',
                          gap: '2px'
                        }}
                      >
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: hasApy ? 500 : 400,
                            color: hasApy
                              ? '#22c55e'
                              : isDark
                                ? 'rgba(255,255,255,0.3)'
                                : 'rgba(0,0,0,0.3)'
                          }}
                        >
                          {hasApy ? `${pool.apy7d.apy.toFixed(1)}%` : '-'}
                        </span>
                        <span
                          style={{
                            fontSize: '10px',
                            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
                          }}
                        >
                          {pool.apy7d?.liquidity > 0
                            ? `${abbreviateNumber(pool.apy7d.liquidity)}`
                            : '-'}
                        </span>
                      </div>
                      {/* Expand/Add */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddLiquidity(pool);
                        }}
                        style={{
                          padding: '4px 8px',
                          fontSize: '10px',
                          fontWeight: 500,
                          borderRadius: '5px',
                          border: 'none',
                          background: '#3b82f6',
                          color: '#fff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    {/* Expanded content */}
                    {isExpanded && (
                      <div
                        style={{
                          padding: '12px',
                          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                          borderRadius: '0 0 8px 8px',
                          marginBottom: '8px',
                          borderBottom: isDark
                            ? '1px solid rgba(255,255,255,0.06)'
                            : '1px solid rgba(0,0,0,0.06)'
                        }}
                      >
                        {/* Chart section - conditional */}
                        {isChartLoading ? (
                          <div
                            style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}
                          >
                            <Spinner size={16} />
                          </div>
                        ) : chartData && chartData.length > 0 ? (
                          <div style={{ marginBottom: '12px' }}>
                            <MiniSparkline
                              data={chartData}
                              width={280}
                              height={60}
                              isDark={isDark}
                            />
                          </div>
                        ) : null}
                        {/* Stats Grid - always show */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: '8px'
                          }}
                        >
                          <div
                            style={{
                              padding: '8px',
                              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                              borderRadius: '6px'
                            }}
                          >
                            <div
                              style={{
                                fontSize: '9px',
                                textTransform: 'uppercase',
                                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                                marginBottom: '2px'
                              }}
                            >
                              Fee
                            </div>
                            <div
                              style={{
                                fontSize: '12px',
                                fontWeight: 500,
                                color: isDark ? '#fff' : '#1a1a1a'
                              }}
                            >
                              {pool.tradingFee ? (pool.tradingFee / 100000).toFixed(3) : '-'}%
                            </div>
                          </div>
                          <div
                            style={{
                              padding: '8px',
                              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                              borderRadius: '6px'
                            }}
                          >
                            <div
                              style={{
                                fontSize: '9px',
                                textTransform: 'uppercase',
                                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                                marginBottom: '2px'
                              }}
                            >
                              Vol 7d
                            </div>
                            <div
                              style={{
                                fontSize: '12px',
                                fontWeight: 500,
                                color: isDark ? '#fff' : '#1a1a1a'
                              }}
                            >
                              {pool.apy7d?.volume > 0 ? abbreviateNumber(pool.apy7d.volume) : '-'}
                            </div>
                          </div>
                          <div
                            style={{
                              padding: '8px',
                              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                              borderRadius: '6px'
                            }}
                          >
                            <div
                              style={{
                                fontSize: '9px',
                                textTransform: 'uppercase',
                                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                                marginBottom: '2px'
                              }}
                            >
                              Fees 7d
                            </div>
                            <div
                              style={{
                                fontSize: '12px',
                                fontWeight: 500,
                                color: isDark ? '#fff' : '#1a1a1a'
                              }}
                            >
                              {pool.apy7d?.fees > 0 ? abbreviateNumber(pool.apy7d.fees) : '-'}
                            </div>
                          </div>
                          <div
                            style={{
                              padding: '8px',
                              background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                              borderRadius: '6px'
                            }}
                          >
                            <div
                              style={{
                                fontSize: '9px',
                                textTransform: 'uppercase',
                                color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                                marginBottom: '2px'
                              }}
                            >
                              Last Trade
                            </div>
                            <div
                              style={{
                                fontSize: '12px',
                                fontWeight: 500,
                                color: isDark ? '#fff' : '#1a1a1a'
                              }}
                            >
                              {pool.lastTraded ? formatRelativeTime(pool.lastTraded) : '-'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            /* Desktop grid layout with expandable rows */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
              {/* Header */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(140px, 1.5fr) 70px repeat(5, 1fr) 70px 28px',
                  gap: '12px',
                  padding: '8px 0',
                  borderBottom: isDark
                    ? '1px solid rgba(255,255,255,0.06)'
                    : '1px solid rgba(0,0,0,0.06)'
                }}
              >
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
                  }}
                >
                  Pool
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                    textAlign: 'center'
                  }}
                >
                  Trend
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                    textAlign: 'right'
                  }}
                >
                  Fee
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                    textAlign: 'right',
                    cursor: 'pointer'
                  }}
                  onClick={() => handlePoolSort('apy')}
                >
                  APY {poolSortBy === 'apy' && <span>{poolSortDir === 'desc' ? '↓' : '↑'}</span>}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                    textAlign: 'right',
                    cursor: 'pointer'
                  }}
                  onClick={() => handlePoolSort('volume')}
                >
                  Vol 7d{' '}
                  {poolSortBy === 'volume' && <span>{poolSortDir === 'desc' ? '↓' : '↑'}</span>}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                    textAlign: 'right',
                    cursor: 'pointer'
                  }}
                  onClick={() => handlePoolSort('liquidity')}
                >
                  TVL{' '}
                  {poolSortBy === 'liquidity' && <span>{poolSortDir === 'desc' ? '↓' : '↑'}</span>}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 500,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                    textAlign: 'right'
                  }}
                >
                  Last
                </span>
                <span></span>
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
                return (
                  <div key={pool._id}>
                    <div
                      onClick={() => handlePoolExpand(pool._id, pool)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(140px, 1.5fr) 70px repeat(5, 1fr) 70px 28px',
                        gap: '12px',
                        padding: isMainPool ? '12px 10px 12px 12px' : '10px 0',
                        borderBottom: isExpanded
                          ? 'none'
                          : isDark
                            ? '1px solid rgba(255,255,255,0.04)'
                            : '1px solid rgba(0,0,0,0.04)',
                        alignItems: 'center',
                        background: isMainPool
                          ? isDark
                            ? 'rgba(255,255,255,0.06)'
                            : 'rgba(0,0,0,0.04)'
                          : isExpanded
                            ? isDark
                              ? 'rgba(255,255,255,0.03)'
                              : 'rgba(0,0,0,0.02)'
                            : 'transparent',
                        borderRadius: isMainPool || isExpanded ? '8px 8px 0 0' : '0',
                        borderLeft: isMainPool ? '3px solid #3b82f6' : 'none',
                        marginLeft: isMainPool ? '-4px' : '0',
                        marginRight: isMainPool ? '-4px' : '0',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      {/* Pool pair */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ display: 'flex' }}>
                          <img
                            src={getTokenImageUrl(pool.asset1.issuer, pool.asset1.currency)}
                            alt=""
                            style={{ width: 20, height: 20, borderRadius: '50%' }}
                          />
                          <img
                            src={getTokenImageUrl(pool.asset2.issuer, pool.asset2.currency)}
                            alt=""
                            style={{ width: 20, height: 20, borderRadius: '50%', marginLeft: -7 }}
                          />
                        </div>
                        <span
                          style={{
                            fontSize: '12px',
                            fontWeight: 500,
                            color: isDark ? '#fff' : '#1a1a1a'
                          }}
                        >
                          {asset1}/{asset2}
                        </span>
                        {isMainPool && (
                          <span
                            style={{
                              fontSize: '9px',
                              fontWeight: 600,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                              color: '#fff',
                              letterSpacing: '0.5px',
                              boxShadow: '0 1px 3px rgba(59,130,246,0.3)'
                            }}
                          >
                            MAIN
                          </span>
                        )}
                      </div>
                      {/* Mini Chart */}
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        {chartData && chartData.length >= 2 ? (
                          <MiniSparkline data={chartData} width={60} height={24} isDark={isDark} />
                        ) : poolChartLoading[poolAccount] ? (
                          <Spinner size={12} style={{ opacity: 0.5 }} />
                        ) : (
                          <span
                            style={{
                              fontSize: '9px',
                              color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                              fontWeight: 500
                            }}
                          >
                            NEW
                          </span>
                        )}
                      </div>
                      {/* Fee */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'
                          }}
                        >
                          {feePercent}%
                        </span>
                      </div>
                      {/* APY */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: hasApy ? 500 : 400,
                            color: hasApy
                              ? '#22c55e'
                              : isDark
                                ? 'rgba(255,255,255,0.3)'
                                : 'rgba(0,0,0,0.3)'
                          }}
                        >
                          {hasApy ? `${pool.apy7d.apy.toFixed(1)}%` : '-'}
                        </span>
                      </div>
                      {/* Volume */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'
                          }}
                        >
                          {pool.apy7d?.volume > 0 ? abbreviateNumber(pool.apy7d.volume) : '-'}
                        </span>
                      </div>
                      {/* Liquidity/TVL */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        {pool.apy7d?.liquidity > 0 ? (
                          <span style={{ fontSize: '11px', color: isDark ? '#fff' : '#1a1a1a' }}>
                            {abbreviateNumber(pool.apy7d.liquidity)}{' '}
                            <span style={{ opacity: 0.5 }}>XRP</span>
                          </span>
                        ) : pool.currentLiquidity ? (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'flex-end',
                              lineHeight: 1.3
                            }}
                          >
                            <span
                              style={{
                                fontSize: '10px',
                                color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'
                              }}
                            >
                              {abbreviateNumber(pool.currentLiquidity.asset1Amount)} {asset1}
                            </span>
                            <span
                              style={{
                                fontSize: '10px',
                                color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'
                              }}
                            >
                              {abbreviateNumber(pool.currentLiquidity.asset2Amount)} {asset2}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', opacity: 0.3 }}>-</span>
                        )}
                      </div>
                      {/* Last Trade */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'
                          }}
                        >
                          {pool.lastTraded ? formatRelativeTime(pool.lastTraded) : '-'}
                        </span>
                      </div>
                      {/* Action */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddLiquidity(pool);
                          }}
                          style={{
                            padding: '4px 10px',
                            fontSize: '11px',
                            fontWeight: 500,
                            borderRadius: '6px',
                            border: 'none',
                            background: '#3b82f6',
                            color: '#fff',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Plus size={12} /> Add
                        </button>
                      </div>
                      {/* Expand indicator */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
                        }}
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </div>
                    </div>
                    {/* Expanded Details */}
                    {isExpanded && (
                      <div
                        style={{
                          padding: '16px',
                          background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                          borderRadius: '0 0 8px 8px',
                          marginBottom: '8px',
                          borderBottom: isDark
                            ? '1px solid rgba(255,255,255,0.06)'
                            : '1px solid rgba(0,0,0,0.06)',
                          marginLeft: isMainPool ? '-4px' : '0',
                          marginRight: isMainPool ? '-4px' : '0',
                          borderLeft: isMainPool ? '3px solid #3b82f6' : 'none'
                        }}
                      >
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns:
                              chartData && chartData.length > 0 ? '1fr 280px' : '1fr',
                            gap: '20px',
                            alignItems: 'start'
                          }}
                        >
                          {/* Stats - Always shown */}
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(3, 1fr)',
                              gap: '12px'
                            }}
                          >
                            <div
                              style={{
                                padding: '12px',
                                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                borderRadius: '8px'
                              }}
                            >
                              <div
                                style={{
                                  fontSize: '10px',
                                  textTransform: 'uppercase',
                                  color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                                  marginBottom: '4px'
                                }}
                              >
                                Fees Earned (7d)
                              </div>
                              <div
                                style={{
                                  fontSize: '14px',
                                  fontWeight: 500,
                                  color: isDark ? '#fff' : '#1a1a1a'
                                }}
                              >
                                {pool.apy7d?.fees > 0
                                  ? `${abbreviateNumber(pool.apy7d.fees)} XRP`
                                  : '-'}
                              </div>
                            </div>
                            <div
                              style={{
                                padding: '12px',
                                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                borderRadius: '8px'
                              }}
                            >
                              <div
                                style={{
                                  fontSize: '10px',
                                  textTransform: 'uppercase',
                                  color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                                  marginBottom: '4px'
                                }}
                              >
                                Volume (7d)
                              </div>
                              <div
                                style={{
                                  fontSize: '14px',
                                  fontWeight: 500,
                                  color: isDark ? '#fff' : '#1a1a1a'
                                }}
                              >
                                {pool.apy7d?.volume > 0
                                  ? `${abbreviateNumber(pool.apy7d.volume)} XRP`
                                  : '-'}
                              </div>
                            </div>
                            <div
                              style={{
                                padding: '12px',
                                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                borderRadius: '8px'
                              }}
                            >
                              <div
                                style={{
                                  fontSize: '10px',
                                  textTransform: 'uppercase',
                                  color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                                  marginBottom: '4px'
                                }}
                              >
                                Trading Fee
                              </div>
                              <div
                                style={{
                                  fontSize: '14px',
                                  fontWeight: 500,
                                  color: isDark ? '#fff' : '#1a1a1a'
                                }}
                              >
                                {feePercent}%
                              </div>
                            </div>
                            {/* Pool Composition */}
                            <div
                              style={{
                                padding: '12px',
                                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                borderRadius: '8px',
                                gridColumn: 'span 3'
                              }}
                            >
                              <div
                                style={{
                                  fontSize: '10px',
                                  textTransform: 'uppercase',
                                  color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                                  marginBottom: '6px'
                                }}
                              >
                                Pool Composition
                              </div>
                              <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <img
                                    src={getTokenImageUrl(pool.asset1.issuer, pool.asset1.currency)}
                                    alt=""
                                    style={{ width: 16, height: 16, borderRadius: '50%' }}
                                  />
                                  <span
                                    style={{
                                      fontSize: '12px',
                                      color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)'
                                    }}
                                  >
                                    {pool.currentLiquidity
                                      ? abbreviateNumber(pool.currentLiquidity.asset1Amount)
                                      : '-'}{' '}
                                    {asset1}
                                  </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <img
                                    src={getTokenImageUrl(pool.asset2.issuer, pool.asset2.currency)}
                                    alt=""
                                    style={{ width: 16, height: 16, borderRadius: '50%' }}
                                  />
                                  <span
                                    style={{
                                      fontSize: '12px',
                                      color: isDark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)'
                                    }}
                                  >
                                    {pool.currentLiquidity
                                      ? abbreviateNumber(pool.currentLiquidity.asset2Amount)
                                      : '-'}{' '}
                                    {asset2}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          {/* Large Chart - Only shown when chart data is available */}
                          {chartData && chartData.length > 0 ? (
                            <div
                              style={{
                                padding: '12px',
                                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                borderRadius: '8px'
                              }}
                            >
                              <div
                                style={{
                                  fontSize: '10px',
                                  textTransform: 'uppercase',
                                  color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                                  marginBottom: '8px'
                                }}
                              >
                                TVL (30 days)
                              </div>
                              <MiniSparkline
                                data={chartData}
                                width={256}
                                height={80}
                                isDark={isDark}
                              />
                            </div>
                          ) : poolChartLoading[poolAccount] ? (
                            <div
                              style={{
                                padding: '12px',
                                background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
                                borderRadius: '8px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                minHeight: '100px'
                              }}
                            >
                              <Spinner size={20} />
                            </div>
                          ) : null}
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

      {tabValue === 2 && token && <TopTraders token={token} />}

      {tabValue === 3 && token && (
        <Suspense fallback={<Spinner size={32} />}>
          <RichList token={token} amm={amm} />
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

      {/* Add Liquidity Dialog - Using Portal to escape stacking context */}
      {typeof document !== 'undefined' &&
        addLiquidityDialog.open &&
        createPortal(
          <Dialog
            open={addLiquidityDialog.open}
            isDark={isDark}
            onClick={(e) => e.target === e.currentTarget && handleCloseDialog()}
          >
            <DialogPaper isDark={isDark}>
              <DialogTitle isDark={isDark}>
                Add Liquidity
                <IconButton onClick={handleCloseDialog} isDark={isDark} style={{ padding: '6px' }}>
                  <X size={18} />
                </IconButton>
              </DialogTitle>
              <DialogContent isDark={isDark}>
                {addLiquidityDialog.pool && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Pool Info */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 14px',
                        background: isDark ? 'rgba(255,255,255,0.02)' : '#f9fafb',
                        borderRadius: '8px',
                        border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`
                      }}
                    >
                      <div style={{ display: 'flex' }}>
                        <img
                          src={getTokenImageUrl(
                            addLiquidityDialog.pool.asset1.issuer,
                            addLiquidityDialog.pool.asset1.currency
                          )}
                          alt=""
                          style={{ width: 24, height: 24, borderRadius: '50%' }}
                        />
                        <img
                          src={getTokenImageUrl(
                            addLiquidityDialog.pool.asset2.issuer,
                            addLiquidityDialog.pool.asset2.currency
                          )}
                          alt=""
                          style={{ width: 24, height: 24, borderRadius: '50%', marginLeft: -8 }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 500,
                          color: isDark ? '#fff' : '#1a1a1a'
                        }}
                      >
                        {decodeCurrency(addLiquidityDialog.pool.asset1.currency)}/
                        {decodeCurrency(addLiquidityDialog.pool.asset2.currency)}
                      </span>
                    </div>

                    {/* Deposit Mode */}
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '12px'
                        }}
                      >
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 500,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)'
                          }}
                        >
                          Deposit Mode
                        </span>
                        <div
                          style={{
                            flex: 1,
                            height: '1px',
                            backgroundImage: `radial-gradient(circle, ${isDark ? 'rgba(66,133,244,0.5)' : 'rgba(66,133,244,0.3)'} 1px, transparent 1px)`,
                            backgroundSize: '6px 1px'
                          }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            border: `1.5px solid ${depositMode === 'double' ? '#4285f4' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                            background:
                              depositMode === 'double'
                                ? isDark
                                  ? 'rgba(66,133,244,0.1)'
                                  : 'rgba(66,133,244,0.05)'
                                : 'transparent'
                          }}
                        >
                          <input
                            type="radio"
                            value="double"
                            checked={depositMode === 'double'}
                            onChange={(e) => setDepositMode(e.target.value)}
                            style={{ accentColor: '#4285f4' }}
                          />
                          <span style={{ fontSize: '13px', color: isDark ? '#fff' : '#1a1a1a' }}>
                            Double-asset (both tokens, no fee)
                          </span>
                        </label>
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            border: `1.5px solid ${depositMode === 'single1' ? '#4285f4' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                            background:
                              depositMode === 'single1'
                                ? isDark
                                  ? 'rgba(66,133,244,0.1)'
                                  : 'rgba(66,133,244,0.05)'
                                : 'transparent'
                          }}
                        >
                          <input
                            type="radio"
                            value="single1"
                            checked={depositMode === 'single1'}
                            onChange={(e) => setDepositMode(e.target.value)}
                            style={{ accentColor: '#4285f4' }}
                          />
                          <span style={{ fontSize: '13px', color: isDark ? '#fff' : '#1a1a1a' }}>
                            Single-asset ({decodeCurrency(addLiquidityDialog.pool.asset1.currency)}{' '}
                            only)
                          </span>
                        </label>
                        <label
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            border: `1.5px solid ${depositMode === 'single2' ? '#4285f4' : isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                            background:
                              depositMode === 'single2'
                                ? isDark
                                  ? 'rgba(66,133,244,0.1)'
                                  : 'rgba(66,133,244,0.05)'
                                : 'transparent'
                          }}
                        >
                          <input
                            type="radio"
                            value="single2"
                            checked={depositMode === 'single2'}
                            onChange={(e) => setDepositMode(e.target.value)}
                            style={{ accentColor: '#4285f4' }}
                          />
                          <span style={{ fontSize: '13px', color: isDark ? '#fff' : '#1a1a1a' }}>
                            Single-asset ({decodeCurrency(addLiquidityDialog.pool.asset2.currency)}{' '}
                            only)
                          </span>
                        </label>
                      </div>
                    </div>

                    {/* Asset 1 Input */}
                    {(depositMode === 'double' || depositMode === 'single1') && (
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '10px'
                          }}
                        >
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 500,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)'
                            }}
                          >
                            {decodeCurrency(addLiquidityDialog.pool.asset1.currency)}
                          </span>
                          <div
                            style={{
                              flex: 1,
                              height: '1px',
                              backgroundImage: `radial-gradient(circle, ${isDark ? 'rgba(66,133,244,0.5)' : 'rgba(66,133,244,0.3)'} 1px, transparent 1px)`,
                              backgroundSize: '6px 1px'
                            }}
                          />
                        </div>
                        <div style={{ position: 'relative' }}>
                          <TextField
                            value={depositAmount1}
                            onChange={(e) => handleAmount1Change(e.target.value)}
                            type="number"
                            placeholder="0.00"
                            isDark={isDark}
                            style={{ paddingRight: '70px' }}
                          />
                          <span
                            style={{
                              position: 'absolute',
                              right: '14px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              fontSize: '13px',
                              fontWeight: 500,
                              color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
                            }}
                          >
                            {decodeCurrency(addLiquidityDialog.pool.asset1.currency)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Asset 2 Input */}
                    {(depositMode === 'double' || depositMode === 'single2') && (
                      <div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            marginBottom: '10px'
                          }}
                        >
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 500,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)'
                            }}
                          >
                            {decodeCurrency(addLiquidityDialog.pool.asset2.currency)}
                          </span>
                          <div
                            style={{
                              flex: 1,
                              height: '1px',
                              backgroundImage: `radial-gradient(circle, ${isDark ? 'rgba(66,133,244,0.5)' : 'rgba(66,133,244,0.3)'} 1px, transparent 1px)`,
                              backgroundSize: '6px 1px'
                            }}
                          />
                        </div>
                        <div style={{ position: 'relative' }}>
                          <TextField
                            value={depositAmount2}
                            onChange={(e) => handleAmount2Change(e.target.value)}
                            type="number"
                            placeholder="0.00"
                            isDark={isDark}
                            style={{ paddingRight: '70px' }}
                          />
                          <span
                            style={{
                              position: 'absolute',
                              right: '14px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              fontSize: '13px',
                              fontWeight: 500,
                              color: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'
                            }}
                          >
                            {decodeCurrency(addLiquidityDialog.pool.asset2.currency)}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Submit Button */}
                    <button
                      onClick={handleSubmitDeposit}
                      style={{
                        padding: '12px 24px',
                        fontSize: '14px',
                        fontWeight: 500,
                        width: '100%',
                        background: '#4285f4',
                        color: '#fff',
                        border: '1.5px solid #4285f4',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        marginTop: '4px',
                        transition: 'background 0.15s, opacity 0.15s'
                      }}
                      onMouseOver={(e) => (e.target.style.opacity = '0.9')}
                      onMouseOut={(e) => (e.target.style.opacity = '1')}
                    >
                      Add Liquidity
                    </button>
                  </div>
                )}
              </DialogContent>
            </DialogPaper>
          </Dialog>,
          document.body
        )}
    </div>
  );
};

export default memo(TradingHistory);
