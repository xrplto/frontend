import { useState, useContext } from 'react';
import { AppContext } from 'src/AppContext';
import Header from 'src/components/Header';
import { cn } from 'src/utils/cn';

export default function ChartEmbedTest() {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';

  const [params, setParams] = useState({
    md5: '0dd550278b74cb6690fdae351e8e0df3',
    theme: 'dark',
    interval: '15m',
    range: '1D',
    height: '400',
    showVolume: 'true',
    showLogo: 'true',
    logoUrl: ''
  });

  const buildUrl = () => {
    const base = `https://api.xrpl.to/v1/embed/${params.md5}`;
    const query = new URLSearchParams();
    if (params.theme) query.set('theme', params.theme);
    if (params.interval) query.set('interval', params.interval);
    if (params.range) query.set('range', params.range);
    if (params.height) query.set('height', params.height);
    if (params.showVolume) query.set('showVolume', params.showVolume);
    if (params.showLogo) query.set('showLogo', params.showLogo);
    if (params.logoUrl) query.set('logoUrl', params.logoUrl);
    return `${base}?${query.toString()}`;
  };

  const iframeCode = `<iframe
  src="${buildUrl()}"
  width="100%"
  height="${params.height}"
  frameborder="0">
</iframe>`;

  return (
    <>
      <Header />
      <div
        className={cn(
          'min-h-screen p-6',
          isDark ? 'bg-black text-white' : 'bg-gray-50 text-gray-900'
        )}
      >
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-6 text-xl font-medium">Chart Embed Tester</h1>

          {/* Controls */}
          <div
            className={cn(
              'mb-6 grid grid-cols-2 gap-4 rounded-xl border-[1.5px] p-4 md:grid-cols-4',
              isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-white'
            )}
          >
            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide opacity-60">
                Token MD5
              </label>
              <input
                type="text"
                value={params.md5}
                onChange={(e) => setParams({ ...params, md5: e.target.value })}
                className={cn(
                  'w-full rounded-lg border-[1.5px] px-3 py-2 text-[13px]',
                  isDark ? 'border-white/15 bg-white/5' : 'border-gray-300 bg-gray-50'
                )}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide opacity-60">
                Theme
              </label>
              <select
                value={params.theme}
                onChange={(e) => setParams({ ...params, theme: e.target.value })}
                className={cn(
                  'w-full rounded-lg border-[1.5px] px-3 py-2 text-[13px]',
                  isDark ? 'border-white/15 bg-white/5' : 'border-gray-300 bg-gray-50'
                )}
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide opacity-60">
                Interval
              </label>
              <select
                value={params.interval}
                onChange={(e) => setParams({ ...params, interval: e.target.value })}
                className={cn(
                  'w-full rounded-lg border-[1.5px] px-3 py-2 text-[13px]',
                  isDark ? 'border-white/15 bg-white/5' : 'border-gray-300 bg-gray-50'
                )}
              >
                <option value="1m">1m</option>
                <option value="5m">5m</option>
                <option value="15m">15m</option>
                <option value="1h">1h</option>
                <option value="4h">4h</option>
                <option value="1d">1d</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide opacity-60">
                Range
              </label>
              <select
                value={params.range}
                onChange={(e) => setParams({ ...params, range: e.target.value })}
                className={cn(
                  'w-full rounded-lg border-[1.5px] px-3 py-2 text-[13px]',
                  isDark ? 'border-white/15 bg-white/5' : 'border-gray-300 bg-gray-50'
                )}
              >
                <option value="1D">1D</option>
                <option value="7D">7D</option>
                <option value="1M">1M</option>
                <option value="3M">3M</option>
                <option value="1Y">1Y</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide opacity-60">
                Height
              </label>
              <input
                type="number"
                value={params.height}
                onChange={(e) => setParams({ ...params, height: e.target.value })}
                className={cn(
                  'w-full rounded-lg border-[1.5px] px-3 py-2 text-[13px]',
                  isDark ? 'border-white/15 bg-white/5' : 'border-gray-300 bg-gray-50'
                )}
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide opacity-60">
                Show Volume
              </label>
              <select
                value={params.showVolume}
                onChange={(e) => setParams({ ...params, showVolume: e.target.value })}
                className={cn(
                  'w-full rounded-lg border-[1.5px] px-3 py-2 text-[13px]',
                  isDark ? 'border-white/15 bg-white/5' : 'border-gray-300 bg-gray-50'
                )}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide opacity-60">
                Show Logo
              </label>
              <select
                value={params.showLogo}
                onChange={(e) => setParams({ ...params, showLogo: e.target.value })}
                className={cn(
                  'w-full rounded-lg border-[1.5px] px-3 py-2 text-[13px]',
                  isDark ? 'border-white/15 bg-white/5' : 'border-gray-300 bg-gray-50'
                )}
              >
                <option value="true">Yes</option>
                <option value="false">No</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium uppercase tracking-wide opacity-60">
                Custom Logo URL
              </label>
              <input
                type="text"
                value={params.logoUrl}
                onChange={(e) => setParams({ ...params, logoUrl: e.target.value })}
                placeholder="Optional"
                className={cn(
                  'w-full rounded-lg border-[1.5px] px-3 py-2 text-[13px]',
                  isDark ? 'border-white/15 bg-white/5' : 'border-gray-300 bg-gray-50'
                )}
              />
            </div>
          </div>

          {/* Preview */}
          <div
            className={cn(
              'mb-6 overflow-hidden rounded-xl border-[1.5px]',
              isDark ? 'border-white/10' : 'border-gray-200'
            )}
          >
            <div
              className={cn(
                'border-b-[1.5px] px-4 py-2 text-[11px] font-medium uppercase tracking-wide',
                isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-gray-100'
              )}
            >
              Preview
            </div>
            <iframe
              key={buildUrl()}
              src={buildUrl()}
              width="100%"
              height={params.height}
              frameBorder="0"
              style={{ display: 'block' }}
            />
          </div>

          {/* Embed Code */}
          <div
            className={cn(
              'rounded-xl border-[1.5px]',
              isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-white'
            )}
          >
            <div
              className={cn(
                'flex items-center justify-between border-b-[1.5px] px-4 py-2',
                isDark ? 'border-white/10' : 'border-gray-200'
              )}
            >
              <span className="text-[11px] font-medium uppercase tracking-wide opacity-60">
                Embed Code
              </span>
              <button
                onClick={() => navigator.clipboard.writeText(iframeCode)}
                className={cn(
                  'rounded-lg border-[1.5px] px-3 py-1 text-[12px]',
                  isDark ? 'border-white/15 hover:bg-white/5' : 'border-gray-300 hover:bg-gray-100'
                )}
              >
                Copy
              </button>
            </div>
            <pre
              className={cn(
                'overflow-x-auto p-4 text-[13px]',
                isDark ? 'bg-white/[0.02] text-green-400' : 'bg-gray-50 text-green-700'
              )}
            >
              {iframeCode}
            </pre>
          </div>
        </div>
      </div>
    </>
  );
}
