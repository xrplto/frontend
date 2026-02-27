import React, { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import { cn } from 'src/utils/cn';
import { fVolume, fNumber, fIntNumber, fPercent } from 'src/utils/formatters';
import {
  BarChart3, Activity, Droplets, Rocket, Ruler,
  Hash, Trophy, Users, AlertTriangle, PlusCircle, TrendingUp,
  TrendingDown, ChevronLeft, ChevronRight, Clock, Loader2
} from 'lucide-react';

const BASE_URL = 'https://api.xrpl.to';

// Layout primitives
const PageWrapper = ({ children }) => <div className="min-h-screen flex flex-col">{children}</div>;
const Container = ({ className, children }) => <div className={cn('max-w-[1280px] mx-auto px-4 w-full flex-1 py-6', className)}>{children}</div>;

const Section = ({ title, icon: Icon, children, className }) => (
  <div className={cn('mb-6', className)}>
    <div className="flex items-center gap-2 mb-3">
      {Icon && <Icon size={16} className="text-[#137DFE]" />}
      <h2 className="text-sm font-medium text-black dark:text-white/90">{title}</h2>
    </div>
    {children}
  </div>
);

const Card = ({ className, children }) => (
  <div className={cn(
    'rounded-xl border-[1.5px] p-4',
    'border-black/[0.06] bg-white dark:border-white/[0.08] dark:bg-white/[0.02]',
    className
  )}>
    {children}
  </div>
);

const StatBox = ({ label, value, sub, trend }) => (
  <div className="text-center py-3 px-2">
    <div className="text-lg font-medium text-[#137DFE] mb-0.5">{value}</div>
    <div className="text-[10px] uppercase tracking-[0.06em] text-black/50 dark:text-white/50">{label}</div>
    {sub && <div className="text-[10px] text-black/40 dark:text-white/40 mt-0.5">{sub}</div>}
    {trend !== undefined && trend !== null && (
      <div className={cn('text-[10px] mt-0.5 flex items-center justify-center gap-0.5', trend >= 0 ? 'text-[#08AA09]' : 'text-red-500')}>
        {trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
        {fPercent(Math.abs(trend))}
      </div>
    )}
  </div>
);

const MiniTable = ({ headers, rows, className }) => (
  <div className={cn('overflow-x-auto', className)}>
    <table className="w-full text-[11px]">
      <thead>
        <tr className="border-b border-black/[0.06] dark:border-white/[0.08]">
          {headers.map((h, i) => (
            <th key={i} className={cn('py-1.5 px-2 font-medium text-black/50 dark:text-white/50 text-left', i > 0 && 'text-right')}>{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-black/[0.03] dark:border-white/[0.04]">
            {row.map((cell, j) => (
              <td key={j} className={cn('py-1.5 px-2 text-black/70 dark:text-white/70', j > 0 && 'text-right')}>{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

function getDelta(deltas, path) {
  if (!deltas?.available || !deltas?.deltas?.[path]) return undefined;
  return deltas.deltas[path].pctChange;
}

function ReportPage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dates, setDates] = useState([]);
  const [currentDate, setCurrentDate] = useState('');

  const fetchDates = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_URL}/api/platform-report/dates`);
      if (res.ok) {
        const data = await res.json();
        setDates(data);
        if (data.length > 0 && !currentDate) {
          setCurrentDate(data[0].date);
        }
      }
    } catch (err) {
      console.error('Failed to fetch dates:', err);
    }
  }, []);

  const fetchReport = useCallback(async (date) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE_URL}/api/platform-report?date=${date}`);
      if (!res.ok) {
        setError(res.status === 404 ? 'No report available for this date' : 'Failed to load report');
        setReport(null);
      } else {
        setReport(await res.json());
      }
    } catch (err) {
      setError('Failed to load report');
      setReport(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDates(); }, [fetchDates]);

  useEffect(() => {
    if (currentDate) fetchReport(currentDate);
  }, [currentDate, fetchReport]);

  const dateIdx = dates.findIndex(d => d.date === currentDate);
  const hasPrev = dateIdx < dates.length - 1;
  const hasNext = dateIdx > 0;

  const nav = (dir) => {
    const idx = dateIdx + (dir === 'prev' ? 1 : -1);
    if (idx >= 0 && idx < dates.length) setCurrentDate(dates[idx].date);
  };

  const r = report;
  const delta = r?.historicalDeltas;

  return (
    <PageWrapper>
      <Head>
        <title>Platform Report | XRPL.to</title>
      </Head>
      <Header />
      <Container>
        {/* Header bar */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-black dark:text-white">Platform Report</h1>
            <p className="text-[11px] text-black/40 dark:text-white/40 mt-0.5">Daily analytics snapshot</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => nav('prev')} disabled={!hasPrev} className="p-1.5 rounded-lg border border-black/[0.08] dark:border-white/[0.08] disabled:opacity-30">
              <ChevronLeft size={14} className="text-black/60 dark:text-white/60" />
            </button>
            <select
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg border border-black/[0.08] dark:border-white/[0.08] bg-transparent text-black dark:text-white"
            >
              {dates.map(d => <option key={d.date} value={d.date}>{d.date}</option>)}
            </select>
            <button onClick={() => nav('next')} disabled={!hasNext} className="p-1.5 rounded-lg border border-black/[0.08] dark:border-white/[0.08] disabled:opacity-30">
              <ChevronRight size={14} className="text-black/60 dark:text-white/60" />
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="text-[#137DFE] animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-20 text-black/40 dark:text-white/40 text-sm">{error}</div>
        )}

        {r && !loading && (
          <>
            {/* Generation info */}
            <div className="flex items-center gap-3 mb-4 text-[10px] text-black/40 dark:text-white/40">
              <span className="flex items-center gap-1"><Clock size={10} /> Generated {new Date(r.generatedAt).toUTCString()}</span>
              <span>Duration: {(r.totalDurationMs / 1000).toFixed(1)}s</span>
              {r.errors?.length > 0 && <span className="text-red-500">{r.errors.length} error(s)</span>}
            </div>

            {/* Market Overview */}
            {r.market && (
              <Section title="Market Overview" icon={Activity}>
                <Card>
                  <div className="grid grid-cols-4 gap-2 max-sm:grid-cols-2">
                    <StatBox label="Total Tokens" value={fIntNumber(r.market.totalTokens)} />
                    <StatBox label="Active (24h)" value={fIntNumber(r.market.activeTokens24h)} trend={getDelta(delta, 'market.activeTokens24h')} />
                    <StatBox label="Traded XRP (24h)" value={fVolume(r.market.tradedXRP24H)} trend={getDelta(delta, 'market.tradedXRP24H')} />
                    <StatBox label="Unique Traders (24h)" value={fIntNumber(r.market.uniqueTraders24H)} trend={getDelta(delta, 'market.uniqueTraders24H')} />
                    <StatBox label="Total Marketcap" value={'$' + fVolume(r.market.totalMarketcap)} trend={getDelta(delta, 'market.totalMarketcap')} />
                    <StatBox label="Total TVL" value={fVolume(r.market.totalTVL) + ' XRP'} trend={getDelta(delta, 'market.totalTVL')} />
                    <StatBox label="Transactions (24h)" value={fIntNumber(r.market.transactions24H)} />
                    <StatBox label="XRP/USD" value={'$' + fNumber(r.revenue?.xrpUsdRate)} />
                  </div>
                </Card>
              </Section>
            )}

            {/* MOVED: API Keys - was here, removed per user request */}


            {/* AMM Overview */}
            {r.ammOverview && (
              <Section title="AMM Pools" icon={Droplets}>
                <Card>
                  <div className="grid grid-cols-3 gap-2 mb-3 max-sm:grid-cols-1">
                    <StatBox label="Active Pools" value={fIntNumber(r.ammOverview.activePools)} />
                    <StatBox label="Total Liquidity" value={fVolume(r.ammOverview.totalLiquidityXRP) + ' XRP'} trend={getDelta(delta, 'ammOverview.totalLiquidityXRP')} />
                    <StatBox label="Avg Trading Fee" value={fPercent(r.ammOverview.avgTradingFee)} />
                  </div>
                  {r.ammOverview.topPoolsByApy7d?.length > 0 && (
                    <>
                      <div className="text-[10px] uppercase tracking-wider text-black/40 dark:text-white/40 mb-2">Top Pools by 7d APY</div>
                      <MiniTable
                        headers={['Pool', 'APY 7d', 'Liquidity XRP', 'Fee']}
                        rows={r.ammOverview.topPoolsByApy7d.map(p => [
                          p._id?.slice(0, 12) + '...',
                          fPercent(p.apy7d),
                          fVolume(p.liquidityXRP),
                          fPercent(p.tradingFee)
                        ])}
                      />
                    </>
                  )}
                </Card>
              </Section>
            )}

            {/* Launchpad Comparison */}
            {r.launchpads && r.launchpads.length > 0 && (
              <Section title="Launchpad Comparison" icon={Rocket}>
                <Card>
                  <MiniTable
                    headers={['Platform', 'Total', 'Active 24h', 'Holders>10', 'Avg Mcap', 'Vol 24h', 'Success']}
                    rows={r.launchpads.map(l => [
                      l.platform,
                      fIntNumber(l.total),
                      fIntNumber(l.active24h),
                      fIntNumber(l.holdersAbove10),
                      '$' + fVolume(l.avgMarketcap),
                      fVolume(l.totalVol24h) + ' XRP',
                      fPercent(l.successRate * 100)
                    ])}
                  />
                </Card>
              </Section>
            )}

            {/* Token Name Themes */}
            {r.tokenNameThemes && (
              <Section title="Token Name Themes" icon={Hash}>
                <Card>
                  <div className="text-[10px] text-black/40 dark:text-white/40 mb-2">{fIntNumber(r.tokenNameThemes.totalScanned)} tokens scanned</div>
                  <MiniTable
                    headers={['Theme', 'Count', 'Vol 24h XRP', 'Avg Mcap', 'Avg Holders']}
                    rows={(r.tokenNameThemes.rankings?.byVolume || []).map(key => {
                      const t = r.tokenNameThemes.themes[key];
                      return [
                        key.replace(/_/g, ' '),
                        fIntNumber(t.count),
                        fVolume(t.totalVol24hXRP),
                        '$' + fVolume(t.avgMarketcap),
                        fNumber(t.avgHolders)
                      ];
                    })}
                  />
                </Card>
              </Section>
            )}

            {/* Name Length Success Rate */}
            {r.nameLengthSuccess && r.nameLengthSuccess.length > 0 && (
              <Section title="Success Rate by Token Name Length" icon={Ruler}>
                <Card>
                  <MiniTable
                    headers={['Length', 'Tokens', 'Active 24h', 'Active %', 'Holders>10', 'Success %', 'Mcap>$5K', 'Mcap>$5K %', 'Avg Vol XRP', 'Avg Holders', 'Avg Mcap']}
                    rows={r.nameLengthSuccess.map(b => [
                      b.length + ' chars',
                      fIntNumber(b.count),
                      fIntNumber(b.active24h),
                      fPercent(b.activeRate * 100),
                      fIntNumber(b.holdersAbove10),
                      fPercent(b.successRate * 100),
                      fIntNumber(b.mcapAbove5k),
                      fPercent((b.mcapAbove5kRate || 0) * 100),
                      fVolume(b.avgVol24hXRP),
                      fNumber(b.avgHolders),
                      '$' + fVolume(b.avgMarketcap),
                    ])}
                  />
                </Card>
              </Section>
            )}

            {/* Top Performing Tokens */}
            {r.topTokens && (
              <Section title="Top Performing Tokens" icon={Trophy}>
                <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                  <Card>
                    <div className="text-[10px] uppercase tracking-wider text-black/40 dark:text-white/40 mb-2">By Volume 24h</div>
                    <MiniTable
                      headers={['Token', 'Vol 24h XRP']}
                      rows={(r.topTokens.byVolume || []).slice(0, 10).map(t => [t.name || t.currency, fVolume(t.vol24hxrp)])}
                    />
                  </Card>
                  <Card>
                    <div className="text-[10px] uppercase tracking-wider text-black/40 dark:text-white/40 mb-2">By Marketcap</div>
                    <MiniTable
                      headers={['Token', 'Marketcap']}
                      rows={(r.topTokens.byMarketcap || []).slice(0, 10).map(t => [t.name || t.currency, '$' + fVolume(t.marketcap)])}
                    />
                  </Card>
                  <Card>
                    <div className="text-[10px] uppercase tracking-wider text-black/40 dark:text-white/40 mb-2">By Holders</div>
                    <MiniTable
                      headers={['Token', 'Holders']}
                      rows={(r.topTokens.byHolders || []).slice(0, 10).map(t => [t.name || t.currency, fIntNumber(t.holders)])}
                    />
                  </Card>
                  <Card>
                    <div className="text-[10px] uppercase tracking-wider text-black/40 dark:text-white/40 mb-2">By Price Growth 24h</div>
                    <MiniTable
                      headers={['Token', 'Growth']}
                      rows={(r.topTokens.byPriceGrowth || []).slice(0, 10).map(t => [t.name || t.currency, fPercent(t.pro24h)])}
                    />
                  </Card>
                </div>
                {r.topTokens.newWithTraction?.length > 0 && (
                  <Card className="mt-4">
                    <div className="text-[10px] uppercase tracking-wider text-black/40 dark:text-white/40 mb-2">New Tokens with Traction (7d, 50+ holders)</div>
                    <MiniTable
                      headers={['Token', 'Origin', 'Holders', 'Vol 24h XRP']}
                      rows={r.topTokens.newWithTraction.slice(0, 10).map(t => [t.name || t.currency, t.origin || '-', fIntNumber(t.holders), fVolume(t.vol24hxrp)])}
                    />
                  </Card>
                )}
              </Section>
            )}

            {/* Creator Behavior */}
            {r.creatorBehavior && (
              <Section title="Creator Behavior" icon={Users}>
                <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                  <Card>
                    <div className="text-[10px] uppercase tracking-wider text-black/40 dark:text-white/40 mb-2">Last 24h Extractions</div>
                    {r.creatorBehavior.last24h?.length > 0 ? (
                      <MiniTable
                        headers={['Action', 'Count', 'XRP']}
                        rows={r.creatorBehavior.last24h.map(a => [a._id, fIntNumber(a.count), fVolume(a.totalXrp)])}
                      />
                    ) : (
                      <div className="text-[11px] text-black/30 dark:text-white/30 py-3">No creator extractions in 24h</div>
                    )}
                  </Card>
                  <Card>
                    <div className="text-[10px] uppercase tracking-wider text-black/40 dark:text-white/40 mb-2">Top Extractors (All-time)</div>
                    <MiniTable
                      headers={['Creator', 'Actions', 'XRP Extracted']}
                      rows={(r.creatorBehavior.topExtractorsAllTime || []).slice(0, 10).map(e => [
                        (e._id || '').slice(0, 12) + '...',
                        fIntNumber(e.actionCount),
                        fVolume(e.totalXrpExtracted)
                      ])}
                    />
                  </Card>
                </div>
              </Section>
            )}

            {/* Risk Metrics */}
            {r.riskMetrics && (
              <Section title="Risk Metrics" icon={AlertTriangle}>
                <Card>
                  <div className="grid grid-cols-4 gap-2 max-sm:grid-cols-2">
                    <StatBox label="Total Traders" value={fIntNumber(r.riskMetrics.totalTraders)} />
                    <StatBox label="Net P&L (All)" value={fVolume(r.riskMetrics.netProfitAllTraders) + ' XRP'} />
                    <StatBox label="DEX Volume" value={fVolume(r.riskMetrics.totalDexVolume) + ' XRP'} />
                    <StatBox label="AMM Volume" value={fVolume(r.riskMetrics.totalAmmVolume) + ' XRP'} />
                    <StatBox label="Winners" value={fIntNumber(r.riskMetrics.totalWinners)} />
                    <StatBox label="Losers" value={fIntNumber(r.riskMetrics.totalLosers)} />
                    <StatBox label="Scam Tokens" value={fIntNumber(r.riskMetrics.scamTokenCount)} />
                    <StatBox label="Defunct Tokens" value={fIntNumber(r.riskMetrics.defunctTokenCount)} />
                  </div>
                </Card>
              </Section>
            )}

            {/* Daily New Tokens */}
            {r.dailyNewTokens && (
              <Section title="Daily New Tokens" icon={PlusCircle}>
                <Card>
                  <div className="flex items-center gap-4 mb-3">
                    <StatBox label="Avg Daily Creation" value={fNumber(r.dailyNewTokens.avgDailyCreation)} />
                  </div>
                  {r.dailyNewTokens.last7Days?.length > 0 && (
                    <MiniTable
                      headers={['Date', 'Count', ...(r.dailyNewTokens.last7Days[0]?.platforms ? ['Top Platform'] : [])]}
                      rows={r.dailyNewTokens.last7Days.map(d => {
                        const row = [d.date || d._id, fIntNumber(d.count)];
                        if (d.platforms) row.push(Object.keys(d.platforms)[0] || '-');
                        return row;
                      })}
                    />
                  )}
                </Card>
              </Section>
            )}

            {/* Historical Deltas */}
            {delta && delta.available && (
              <Section title="Day-over-Day Changes" icon={BarChart3}>
                <Card>
                  <div className="text-[10px] text-black/40 dark:text-white/40 mb-2">Compared to {delta.yesterdayStr}</div>
                  <div className="grid grid-cols-4 gap-2 max-sm:grid-cols-2">
                    {Object.entries(delta.deltas || {}).map(([path, d]) => (
                      <div key={path} className="text-center py-2">
                        <div className={cn('text-sm font-medium', d.diff >= 0 ? 'text-[#08AA09]' : 'text-red-500')}>
                          {d.diff >= 0 ? '+' : ''}{fVolume(d.diff)}
                        </div>
                        <div className="text-[10px] text-black/40 dark:text-white/40">{path.split('.').pop()}</div>
                        {d.pctChange !== null && (
                          <div className={cn('text-[10px]', d.pctChange >= 0 ? 'text-[#08AA09]' : 'text-red-500')}>
                            {d.pctChange >= 0 ? '+' : ''}{fPercent(d.pctChange)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              </Section>
            )}
          </>
        )}
      </Container>
      <Footer />
    </PageWrapper>
  );
}

export default ReportPage;

export async function getStaticProps() {
  return {
    props: {
      ogp: {
        title: 'Platform Report | XRPL.to',
        url: 'https://xrpl.to/report',
        canonical: 'https://xrpl.to/report',
        desc: 'Daily platform analytics report for XRPL.to - revenue, market health, token themes, and risk metrics.'
      }
    },
    revalidate: 300
  };
}
