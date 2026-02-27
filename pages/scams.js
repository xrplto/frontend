import React, { useContext, useEffect, useState } from 'react';
import { ThemeContext } from 'src/context/AppContext';
import { cn } from 'src/utils/cn';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';

const API = 'https://api.xrpl.to/v1';
const fmt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
const fmtXrp = (n) => `${fmt(n)} XRP`;

export default function Scams() {
  const { themeName } = useContext(ThemeContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [data, setData] = useState(null);
  const [memoSpam, setMemoSpam] = useState(null);

  useEffect(() => {
    fetch(`${API}/scams`).then(r => r.json()).then(setData).catch(() => {});
    fetch(`${API}/scams/memo-spam`).then(r => r.json()).then(setMemoSpam).catch(() => {});
  }, []);

  const t = 'text-black dark:text-white';
  const m = 'text-black/40 dark:text-white/40';
  const b = 'border-black/[0.08] dark:border-white/[0.06]';
  const card = 'bg-black/[0.015] dark:bg-white/[0.02]';
  const rh = 'hover:bg-black/[0.015] dark:hover:bg-white/[0.02]';

  const o = data?.overview;
  const nft = o?.nft_scams;
  const tok = o?.token_scams;
  const memo = o?.memo_spam;
  const lpt = o?.lp_theft;
  const dom = o?.domain_monitoring;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <div className="max-w-[1000px] mx-auto flex-1 py-8 px-4 w-full">
        <h1 className={cn('text-xl font-semibold mb-0.5', t)}>XRPL Scam Detection</h1>
        <p className={cn('text-xs mb-6', m)}>
          Real-time monitoring of scam activity on the XRP Ledger
          {o?.scan_window_days ? ` — ${o.scan_window_days} day scan window` : ''}
        </p>

        {/* ── Total XRP Stolen ── */}
        {o?.total_xrp_stolen > 0 && (
          <div className={cn('text-center py-5 rounded-lg border mb-8', card, b)}>
            <div className={cn('text-2xl font-bold', t)}>{fmtXrp(o.total_xrp_stolen)}</div>
            <div className={cn('text-[10px] uppercase tracking-wider mt-1', m)}>Total XRP Stolen</div>
          </div>
        )}

        {/* ── NFT Scams ── */}
        {nft && (
          <div className="mb-8">
            <h2 className={cn('text-sm font-medium mb-2', t)}>NFT Scams</h2>
            <div className="grid grid-cols-4 gap-2.5 mb-3 max-sm:grid-cols-2">
              {[
                ['XRP Stolen', fmtXrp(nft.xrp_stolen)],
                ['Scam Accounts', fmt(nft.scam_accounts)],
                ['Victims', fmt(nft.victims)],
                ['Scam Sales', fmt(nft.scam_sales)],
              ].map(([label, val]) => (
                <div key={label} className={cn('text-center py-3 rounded-lg border', card, b)}>
                  <div className={cn('text-lg font-semibold', t)}>{val}</div>
                  <div className={cn('text-[9px] uppercase tracking-wider mt-0.5', m)}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── LP Token Theft ── */}
        {lpt && (
          <div className="mb-8">
            <h2 className={cn('text-sm font-medium mb-0.5', t)}>LP Token Theft</h2>
            <p className={cn('text-[10px] mb-2', m)}>
              Accounts that withdraw from AMM pools without depositing — LP tokens acquired via NFT scam offers
            </p>
            <div className="grid grid-cols-3 gap-2.5 max-sm:grid-cols-2">
              {[
                ['XRP Stolen', fmtXrp(lpt.xrp_stolen)],
                ['Accounts Flagged', fmt(lpt.accounts_flagged)],
                ['Pools Drained', fmt(lpt.pools_drained)],
              ].map(([label, val]) => (
                <div key={label} className={cn('text-center py-3 rounded-lg border', card, b)}>
                  <div className={cn('text-lg font-semibold', t)}>{val}</div>
                  <div className={cn('text-[9px] uppercase tracking-wider mt-0.5', m)}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Token Scams ── */}
        {tok && (
          <div className="mb-8">
            <h2 className={cn('text-sm font-medium mb-0.5', t)}>Token Scams</h2>
            <p className={cn('text-[10px] mb-2', m)}>Fake tokens impersonating companies like BlackRock, Cboe XRP ETF</p>
            <div className="grid grid-cols-4 gap-2.5 max-sm:grid-cols-2">
              {[
                ['XRP Stolen', fmtXrp(tok.xrp_stolen)],
                ['Fake Tokens', fmt(tok.fake_tokens)],
                ['Scam Issuers', fmt(tok.scam_issuers)],
                ['Affected Holders', fmt(tok.affected_holders)],
              ].map(([label, val]) => (
                <div key={label} className={cn('text-center py-3 rounded-lg border', card, b)}>
                  <div className={cn('text-lg font-semibold', t)}>{val}</div>
                  <div className={cn('text-[9px] uppercase tracking-wider mt-0.5', m)}>{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Top Scammers ── */}
        {data?.top_scammers?.length > 0 && (
          <div className="mb-8">
            <h2 className={cn('text-sm font-medium mb-2', t)}>Top Scammers</h2>
            <div className={cn('rounded-lg border overflow-hidden', b)}>
              <table className="w-full text-xs">
                <thead>
                  <tr className={cn(card)}>
                    <th className={cn('text-left py-2 px-3 font-medium', m)}>Account</th>
                    <th className={cn('text-right py-2 px-3 font-medium', m)}>XRP Stolen</th>
                    <th className={cn('text-right py-2 px-3 font-medium hidden sm:table-cell', m)}>LP Theft</th>
                    <th className={cn('text-right py-2 px-3 font-medium', m)}>Sales</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_scammers.map((s, i) => (
                    <tr key={i} className={cn('border-t', b, rh)}>
                      <td className={cn('py-1.5 px-3 font-mono', t)}>{s.account}</td>
                      <td className="py-1.5 px-3 text-right text-red-400">{fmtXrp(s.xrp_stolen)}</td>
                      <td className={cn('py-1.5 px-3 text-right hidden sm:table-cell', s.lp_theft_xrp > 0 ? 'text-orange-400' : m)}>{s.lp_theft_xrp > 0 ? fmtXrp(s.lp_theft_xrp) : '-'}</td>
                      <td className={cn('py-1.5 px-3 text-right', m)}>{s.sales}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Top Victims ── */}
        {data?.top_victims?.length > 0 && (
          <div className="mb-8">
            <h2 className={cn('text-sm font-medium mb-2', t)}>Top Victims</h2>
            <div className={cn('rounded-lg border overflow-hidden', b)}>
              <table className="w-full text-xs">
                <thead>
                  <tr className={cn(card)}>
                    <th className={cn('text-left py-2 px-3 font-medium', m)}>Account</th>
                    <th className={cn('text-right py-2 px-3 font-medium', m)}>XRP Lost</th>
                    <th className={cn('text-right py-2 px-3 font-medium', m)}>Purchases</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_victims.map((v, i) => (
                    <tr key={i} className={cn('border-t', b, rh)}>
                      <td className={cn('py-1.5 px-3 font-mono', t)}>{v.account}</td>
                      <td className="py-1.5 px-3 text-right text-red-400">{fmtXrp(v.xrp_lost)}</td>
                      <td className={cn('py-1.5 px-3 text-right', m)}>{v.purchases}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Scam Domains ── */}
        {data?.domains?.length > 0 && (
          <div className="mb-8">
            <h2 className={cn('text-sm font-medium mb-0.5', t)}>Scam Domains</h2>
            <p className={cn('text-[10px] mb-2', m)}>
              {fmt(dom?.scam_domains)} tracked — {fmt(dom?.taken_down)} taken down — {fmt(dom?.reports_sent)} abuse reports sent
            </p>
            <div className="space-y-3">
              {data.domains.map((d, i) => (
                <div key={i} className={cn('rounded-lg border p-4', card, b)}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn('font-mono text-sm font-medium', t)}>{d.domain}</span>
                    {d.reported_by_us && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full text-green-400 bg-green-400/10 font-medium">reported</span>
                    )}
                    {d.status === 'taken_down' && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full text-emerald-400 bg-emerald-400/10 font-medium">taken down</span>
                    )}
                  </div>
                  {d.report_to?.map((r, j) => (
                    <div key={j} className={cn('text-[11px] py-1.5 flex flex-wrap gap-x-4 gap-y-0.5', j > 0 ? `border-t ${b} mt-1.5 pt-1.5` : '')}>
                      <span className={m}>{r.type === 'registrar' ? 'Registrar' : 'Host'}:</span>
                      <span className={t}>{r.name}</span>
                      <span className={m}>{r.abuse_email}</span>
                      {r.reported_at && <span className={m}>{new Date(r.reported_at).toLocaleDateString()}</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Domains Taken Down ── */}
        {data?.domains?.filter(d => d.status === 'taken_down').length > 0 && (
          <div className="mb-8">
            <h2 className={cn('text-sm font-medium mb-2', t)}>Domains Taken Down</h2>
            <div className={cn('rounded-lg border overflow-hidden', b)}>
              <table className="w-full text-xs">
                <thead>
                  <tr className={cn(card)}>
                    <th className={cn('text-left py-2 px-3 font-medium', m)}>Domain</th>
                    <th className={cn('text-left py-2 px-3 font-medium', m)}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.domains.filter(d => d.status === 'taken_down').map((d, i) => (
                    <tr key={i} className={cn('border-t', b, rh)}>
                      <td className={cn('py-1.5 px-3 font-mono', t)}>{d.domain}</td>
                      <td className={cn('py-1.5 px-3', m)}>{d.taken_down_at ? new Date(d.taken_down_at).toLocaleDateString() : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── Memo Spam ── */}
        {memo && memo.flagged_accounts > 0 && (
          <div className="mb-8">
            <h2 className={cn('text-sm font-medium mb-0.5', t)}>Memo Spam</h2>
            <p className={cn('text-[10px] mb-2', m)}>
              {fmt(memo.flagged_accounts)} flagged accounts — {fmt(memo.total_spam_txs)} spam txs to {fmt(memo.unique_destinations)} wallets
            </p>
            {memoSpam?.accounts?.length > 0 && (
              <div className={cn('rounded-lg border overflow-hidden', b)}>
                <table className="w-full text-xs">
                  <thead>
                    <tr className={cn(card)}>
                      <th className={cn('text-left py-2 px-3 font-medium', m)}>Account</th>
                      <th className={cn('text-right py-2 px-3 font-medium', m)}>Txs</th>
                      <th className={cn('text-right py-2 px-3 font-medium', m)}>Targets</th>
                      <th className={cn('text-left py-2 px-3 font-medium hidden sm:table-cell', m)}>Memo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memoSpam.accounts.map((a, i) => (
                      <tr key={i} className={cn('border-t', b, rh)}>
                        <td className={cn('py-1.5 px-3 font-mono', t)}>{a.account}</td>
                        <td className={cn('py-1.5 px-3 text-right', t)}>{fmt(a.tx_count)}</td>
                        <td className={cn('py-1.5 px-3 text-right', t)}>{fmt(a.unique_destinations)}</td>
                        <td className={cn('py-1.5 px-3 truncate max-w-[300px] hidden sm:table-cell', m)}>{a.memo_samples?.[0]}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── How to Report ── */}
        {data?.how_to_report && (
          <div className="mb-8">
            <h2 className={cn('text-sm font-medium mb-2', t)}>How to Report</h2>
            <div className={cn('rounded-lg border p-4', card, b)}>
              <p className={cn('text-xs mb-2', m)}>{data.how_to_report.description}</p>
              <ol className="space-y-1">
                {data.how_to_report.steps?.map((step, i) => (
                  <li key={i} className={cn('text-xs', t)}>{step}</li>
                ))}
              </ol>
            </div>
          </div>
        )}

        {/* ── Footer info ── */}
        {o?.last_scan && (
          <p className={cn('text-[10px] text-center', m)}>
            Last scan: {new Date(o.last_scan).toLocaleString()}
          </p>
        )}
      </div>
      <Footer />
    </div>
  );
}

export async function getStaticProps() {
  return {
    props: {
      ogp: {
        canonical: 'https://xrpl.to/scams',
        title: 'Scam Alerts | Report & Track XRPL Scams',
        url: 'https://xrpl.to/scams',
        imgUrl: 'https://xrpl.to/api/og/scams',
        imgType: 'image/png',
        desc: 'Report and track scams on the XRP Ledger. Protect yourself from fraudulent tokens and accounts.'
      }
    }
  };
}
