import dynamic from 'next/dynamic';

// Dynamic import with SSR disabled
const PriceChartMinimal = dynamic(
  () => import('./PriceChartMinimal'),
  { 
    ssr: false,
    loading: () => null // No loading state for fastest render
  }
);

export default function PriceChartMinimalSSR({ token }) {
  return <PriceChartMinimal token={token} />;
}