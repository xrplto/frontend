import dynamic from 'next/dynamic';

// Lightweight chart with SSR disabled
const PriceChartLightweight = dynamic(
  () => import('./PriceChartLightweight'),
  { 
    ssr: false,
    loading: () => null
  }
);

export default function PriceChartLightweightSSR({ token }) {
  return <PriceChartLightweight token={token} />;
}