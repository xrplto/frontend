import dynamic from 'next/dynamic';

// Ultra-fast dynamic import
const PriceChartUltraMinimal = dynamic(
  () => import('./PriceChartUltraMinimal'),
  { 
    ssr: false,
    loading: () => (
      <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span>Chart loading...</span>
      </div>
    )
  }
);

export default function PriceChartUltraMinimalSSR({ token }) {
  return <PriceChartUltraMinimal token={token} />;
}