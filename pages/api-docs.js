import React, { useState, useContext } from 'react';
import Head from 'next/head';
import axios from 'axios';
import { Copy, Menu, X, CheckCircle, Code, Search, Loader2, ChevronRight, Zap, Clock, BookOpen, Server, Users, AlertTriangle, Bot, FileText } from 'lucide-react';
import { AppContext } from 'src/AppContext';
import { cn } from 'src/utils/cn';
import Header from 'src/components/Header';
import Footer from 'src/components/Footer';
import ScrollToTop from 'src/components/ScrollToTop';

const ApiDocsPage = () => {
  const { themeName } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [currentSection, setCurrentSection] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [apiResponse, setApiResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const [copiedBlock, setCopiedBlock] = useState(null);

  const sections = [
    { id: 'overview', title: 'Overview', icon: BookOpen },
    { id: 'llm', title: 'LLM Ready', icon: Bot },
    { id: 'tokens', title: 'Tokens', icon: Zap },
    { id: 'token-details', title: 'Token Details', icon: Server },
    { id: 'trading', title: 'Trading', icon: ChevronRight },
    { id: 'accounts', title: 'Accounts', icon: Users },
    { id: 'errors', title: 'Error Codes', icon: AlertTriangle }
  ];

  const copyToClipboard = (text, blockId) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedBlock(blockId);
      setTimeout(() => setCopiedBlock(null), 2000);
    });
  };

  const llmSnippets = {
    tokens: `## Get Tokens List
Base URL: https://api.xrpl.to

GET /api/tokens?limit={limit}&sortBy={sortBy}&sortType={sortType}&filter={filter}

Parameters:
- limit: number (1-100, default: 20)
- sortBy: vol24hxrp | marketcap | price | holders | trustlines
- sortType: asc | desc
- filter: search string

Example: GET https://api.xrpl.to/api/tokens?limit=10&sortBy=vol24hxrp&sortType=desc`,
    trending: `## Get Trending Tokens
Base URL: https://api.xrpl.to

GET /api/trending?limit={limit}

Parameters:
- limit: number (default: 10)

Example: GET https://api.xrpl.to/api/trending?limit=10`,
    tokenDetails: `## Get Token Details
Base URL: https://api.xrpl.to

GET /api/token/{slug}

Parameters:
- slug: token identifier (e.g., "solo", "csc", "xrp")

Example: GET https://api.xrpl.to/api/token/solo`,
    history: `## Get Trading History
Base URL: https://api.xrpl.to

GET /api/history?limit={limit}

Parameters:
- limit: number (default: 20)

Example: GET https://api.xrpl.to/api/history?limit=10`,
    account: `## Get Account Balance
Base URL: https://api.xrpl.to

GET /api/account/balance/{address}

Parameters:
- address: XRPL account address (starts with "r")

Example: GET https://api.xrpl.to/api/account/balance/rN7n3473SaZBCG4dFL83w7a1RXtXtbk2D9`,
    amm: `## Get AMM Pools
Base URL: https://api.xrpl.to

GET /api/amm-pools?sortBy={sortBy}&status={status}

Parameters:
- sortBy: fees | apy | liquidity | volume | created
- status: active | deleted | all (default: active)

Example: GET https://api.xrpl.to/api/amm-pools?sortBy=fees&status=active`
  };

  const CopyButton = ({ text, id, label = "Copy for LLM" }) => (
    <button
      onClick={() => copyToClipboard(text, id)}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1.5 rounded-md text-[11px] font-medium",
        copiedBlock === id
          ? "bg-emerald-500/10 text-emerald-500"
          : isDark ? "bg-white/5 hover:bg-white/10 text-white/60" : "bg-gray-100 hover:bg-gray-200 text-gray-600"
      )}
    >
      {copiedBlock === id ? <><CheckCircle size={12} /> Copied!</> : <><Copy size={12} /> {label}</>}
    </button>
  );

  const handleTryApi = async (apiPath) => {
    setIsLoading(true);
    setIsModalOpen(true);
    setApiResponse(null);

    try {
      const response = await axios.get(`https://api.xrpl.to${apiPath}`);
      setApiResponse(response.data);
    } catch (error) {
      setApiResponse({
        error: 'Failed to fetch data',
        message: error.message,
        status: error.response?.status || 'Network Error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyResponse = () => {
    navigator.clipboard
      .writeText(JSON.stringify(apiResponse, null, 2))
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch((err) => console.error('Failed to copy:', err));
  };

  const renderContent = () => {
    switch (currentSection) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-normal mb-2 text-primary">
                XRPL.to API Documentation
              </h2>
              <p className={cn("text-[14px]", isDark ? "text-white/60" : "text-gray-600")}>
                Access comprehensive XRP Ledger token data, market analytics, and trading information.
              </p>
            </div>

            <div className={cn(
              "rounded-xl border-[1.5px] p-5",
              isDark ? "border-primary/30 bg-primary/5" : "border-primary/20 bg-primary/5"
            )}>
              <div className="flex items-center gap-2 mb-3">
                <Server size={16} className="text-primary" />
                <h3 className="text-[15px] font-medium">Base URL</h3>
              </div>
              <div className={cn(
                "p-3 rounded-lg font-mono text-[13px]",
                isDark ? "bg-black/40" : "bg-white border border-gray-200"
              )}>
                https://api.xrpl.to
              </div>
            </div>

            <div className={cn(
              "rounded-xl border-[1.5px] p-5",
              isDark ? "border-white/10" : "border-gray-200"
            )}>
              <div className="flex items-center gap-2 mb-3">
                <Zap size={16} className="text-primary" />
                <h3 className="text-[15px] font-medium">Quick Start</h3>
              </div>
              <p className={cn("text-[13px] mb-3", isDark ? "text-white/60" : "text-gray-600")}>
                Get trending tokens:
              </p>
              <div className={cn(
                "p-3 rounded-lg font-mono text-[13px] overflow-x-auto",
                isDark ? "bg-black/40" : "bg-gray-50 border border-gray-200"
              )}>
                <span className="text-primary">curl</span> -X GET "https://api.xrpl.to/api/tokens?limit=10&sortBy=vol24hxrp&sortType=desc"
              </div>
            </div>

            <div className={cn(
              "rounded-xl border-[1.5px] p-5",
              isDark ? "border-white/10" : "border-gray-200"
            )}>
              <div className="flex items-center gap-2 mb-3">
                <Clock size={16} className="text-primary" />
                <h3 className="text-[15px] font-medium">Rate Limits</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[13px]">
                  <span className={isDark ? "text-white/60" : "text-gray-600"}>Free tier</span>
                  <span className="font-mono">1,000 req/hour</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className={isDark ? "text-white/60" : "text-gray-600"}>Authenticated</span>
                  <span className="font-mono">5,000 req/hour</span>
                </div>
              </div>
            </div>
          </div>
        );

      case 'llm':
        const allSnippets = Object.values(llmSnippets).join('\n\n');
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-normal mb-2 text-primary">LLM Ready</h2>
              <p className={cn("text-[14px]", isDark ? "text-white/60" : "text-gray-600")}>
                Copy endpoint instructions for ChatGPT, Claude, or other AI assistants.
              </p>
            </div>

            <div className={cn(
              "rounded-xl border-[1.5px] p-4",
              isDark ? "border-primary/30 bg-primary/5" : "border-primary/20 bg-primary/5"
            )}>
              <div className="flex items-start gap-3">
                <Bot size={18} className="text-primary mt-0.5" />
                <div className="flex-1">
                  <p className={cn("text-[13px] mb-3", isDark ? "text-white/70" : "text-gray-700")}>
                    Each endpoint has a <span className={cn("inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px]", isDark ? "bg-white/10" : "bg-gray-200")}><Copy size={10} /> Copy for LLM</span> button.
                    Click it to copy formatted instructions for that specific API.
                  </p>
                  <button
                    onClick={() => copyToClipboard(allSnippets, 'llm-all')}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium",
                      copiedBlock === 'llm-all'
                        ? "bg-emerald-500/20 text-emerald-500"
                        : isDark ? "bg-primary/20 text-primary hover:bg-primary/30" : "bg-primary text-white hover:bg-primary/90"
                    )}
                  >
                    {copiedBlock === 'llm-all' ? <><CheckCircle size={14} /> Copied All!</> : <><Copy size={14} /> Copy All Endpoints</>}
                  </button>
                </div>
              </div>
            </div>

            <div className={cn("text-[11px] font-medium uppercase tracking-wide", isDark ? "text-white/40" : "text-gray-500")}>
              Available Endpoints
            </div>

            <div className="grid gap-3">
              {[
                { name: 'Tokens List', snippet: llmSnippets.tokens, id: 'llm-tokens-card' },
                { name: 'Trending', snippet: llmSnippets.trending, id: 'llm-trending-card' },
                { name: 'Token Details', snippet: llmSnippets.tokenDetails, id: 'llm-details-card' },
                { name: 'Trading History', snippet: llmSnippets.history, id: 'llm-history-card' },
                { name: 'Account Balance', snippet: llmSnippets.account, id: 'llm-account-card' },
                { name: 'AMM Pools', snippet: llmSnippets.amm, id: 'llm-amm-card' }
              ].map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border-[1.5px]",
                    isDark ? "border-white/10 hover:border-white/20" : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <span className="text-[13px] font-medium">{item.name}</span>
                  <CopyButton text={item.snippet} id={item.id} label="Copy" />
                </div>
              ))}
            </div>
          </div>
        );

      case 'tokens':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-normal text-primary">Tokens</h2>

            <div className={cn(
              "rounded-xl border-[1.5px] p-5",
              isDark ? "border-white/10" : "border-gray-200"
            )}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-emerald-500/10 text-emerald-500 uppercase tracking-wide">GET</span>
                  <code className="text-[15px] font-mono">/api/tokens</code>
                </div>
                <CopyButton text={llmSnippets.tokens} id="llm-tokens" />
              </div>
              <p className={cn("text-[13px] mb-4", isDark ? "text-white/60" : "text-gray-600")}>
                Get paginated list of tokens with sorting and filtering
              </p>

              <div className={cn("text-[11px] font-medium uppercase tracking-wide mb-2", isDark ? "text-white/40" : "text-gray-500")}>
                Parameters
              </div>
              <div className={cn(
                "rounded-lg overflow-hidden border-[1.5px]",
                isDark ? "border-white/10" : "border-gray-200"
              )}>
                <table className="w-full text-[13px]">
                  <thead className={isDark ? "bg-white/5" : "bg-gray-50"}>
                    <tr>
                      <th className={cn("text-left px-4 py-2.5 font-medium", isDark ? "text-white/60" : "text-gray-600")}>Name</th>
                      <th className={cn("text-left px-4 py-2.5 font-medium", isDark ? "text-white/60" : "text-gray-600")}>Type</th>
                      <th className={cn("text-left px-4 py-2.5 font-medium", isDark ? "text-white/60" : "text-gray-600")}>Default</th>
                      <th className={cn("text-left px-4 py-2.5 font-medium", isDark ? "text-white/60" : "text-gray-600")}>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className={isDark ? "border-t border-white/10" : "border-t border-gray-200"}>
                      <td className="px-4 py-2.5"><code className="text-primary">limit</code></td>
                      <td className={cn("px-4 py-2.5", isDark ? "text-white/60" : "text-gray-600")}>number</td>
                      <td className="px-4 py-2.5 font-mono">20</td>
                      <td className={cn("px-4 py-2.5", isDark ? "text-white/60" : "text-gray-600")}>Results per page (1-100)</td>
                    </tr>
                    <tr className={isDark ? "border-t border-white/10" : "border-t border-gray-200"}>
                      <td className="px-4 py-2.5"><code className="text-primary">sortBy</code></td>
                      <td className={cn("px-4 py-2.5", isDark ? "text-white/60" : "text-gray-600")}>string</td>
                      <td className="px-4 py-2.5 font-mono">vol24hxrp</td>
                      <td className={cn("px-4 py-2.5", isDark ? "text-white/60" : "text-gray-600")}>Sort field</td>
                    </tr>
                    <tr className={isDark ? "border-t border-white/10" : "border-t border-gray-200"}>
                      <td className="px-4 py-2.5"><code className="text-primary">filter</code></td>
                      <td className={cn("px-4 py-2.5", isDark ? "text-white/60" : "text-gray-600")}>string</td>
                      <td className="px-4 py-2.5 font-mono">-</td>
                      <td className={cn("px-4 py-2.5", isDark ? "text-white/60" : "text-gray-600")}>Search filter</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className={cn("text-[11px] font-medium uppercase tracking-wide mb-2 mt-4", isDark ? "text-white/40" : "text-gray-500")}>
                Example
              </div>
              <div className={cn("relative group rounded-lg overflow-hidden", isDark ? "bg-black/40" : "bg-gray-50 border border-gray-200")}>
                <button
                  onClick={() => copyToClipboard('https://api.xrpl.to/api/tokens?limit=10&sortBy=vol24hxrp&sortType=desc', 'tokens-url')}
                  className={cn(
                    "absolute right-2 top-2 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity",
                    isDark ? "hover:bg-white/10" : "hover:bg-gray-200"
                  )}
                >
                  {copiedBlock === 'tokens-url' ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} className="opacity-60" />}
                </button>
                <pre className="p-3 font-mono text-[13px] overflow-x-auto m-0">
                  <span className="text-emerald-500">GET</span> https://api.xrpl.to/api/tokens?limit=10&sortBy=vol24hxrp&sortType=desc
                </pre>
              </div>

              <button
                onClick={() => handleTryApi('/api/tokens?limit=10')}
                className={cn(
                  "mt-4 flex items-center gap-2 rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-medium text-primary",
                  isDark ? "border-primary/30 bg-primary/5 hover:bg-primary/10" : "border-primary/30 bg-primary/5 hover:bg-primary/10"
                )}
              >
                <Code size={14} />
                Try It Now
              </button>
            </div>

            <div className={cn(
              "rounded-xl border-[1.5px] p-5",
              isDark ? "border-white/10" : "border-gray-200"
            )}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-emerald-500/10 text-emerald-500 uppercase tracking-wide">GET</span>
                  <code className="text-[15px] font-mono">/api/trending</code>
                </div>
                <CopyButton text={llmSnippets.trending} id="llm-trending" />
              </div>
              <p className={cn("text-[13px] mb-4", isDark ? "text-white/60" : "text-gray-600")}>
                Get trending tokens
              </p>
              <div className={cn("relative group rounded-lg overflow-hidden", isDark ? "bg-black/40" : "bg-gray-50 border border-gray-200")}>
                <button
                  onClick={() => copyToClipboard('https://api.xrpl.to/api/trending?limit=10', 'trending-url')}
                  className={cn(
                    "absolute right-2 top-2 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity",
                    isDark ? "hover:bg-white/10" : "hover:bg-gray-200"
                  )}
                >
                  {copiedBlock === 'trending-url' ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} className="opacity-60" />}
                </button>
                <pre className="p-3 font-mono text-[13px] overflow-x-auto m-0">
                  <span className="text-emerald-500">GET</span> https://api.xrpl.to/api/trending?limit=10
                </pre>
              </div>
              <button
                onClick={() => handleTryApi('/api/trending?limit=10')}
                className={cn(
                  "mt-4 flex items-center gap-2 rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-medium text-primary",
                  isDark ? "border-primary/30 bg-primary/5 hover:bg-primary/10" : "border-primary/30 bg-primary/5 hover:bg-primary/10"
                )}
              >
                <Code size={14} />
                Try It Now
              </button>
            </div>
          </div>
        );

      case 'token-details':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-normal text-primary">Token Details</h2>

            <div className={cn(
              "rounded-xl border-[1.5px] p-5",
              isDark ? "border-white/10" : "border-gray-200"
            )}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-emerald-500/10 text-emerald-500 uppercase tracking-wide">GET</span>
                  <code className="text-[15px] font-mono">/api/token/{`{identifier}`}</code>
                </div>
                <CopyButton text={llmSnippets.tokenDetails} id="llm-token-details" />
              </div>
              <p className={cn("text-[13px] mb-4", isDark ? "text-white/60" : "text-gray-600")}>
                Get detailed token information
              </p>
              <div className={cn("relative group rounded-lg overflow-hidden", isDark ? "bg-black/40" : "bg-gray-50 border border-gray-200")}>
                <button
                  onClick={() => copyToClipboard('https://api.xrpl.to/api/token/solo', 'token-url')}
                  className={cn(
                    "absolute right-2 top-2 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity",
                    isDark ? "hover:bg-white/10" : "hover:bg-gray-200"
                  )}
                >
                  {copiedBlock === 'token-url' ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} className="opacity-60" />}
                </button>
                <pre className="p-3 font-mono text-[13px] overflow-x-auto m-0">
                  <span className="text-emerald-500">GET</span> https://api.xrpl.to/api/token/solo
                </pre>
              </div>
              <button
                onClick={() => handleTryApi('/api/token/solo')}
                className={cn(
                  "mt-4 flex items-center gap-2 rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-medium text-primary",
                  isDark ? "border-primary/30 bg-primary/5 hover:bg-primary/10" : "border-primary/30 bg-primary/5 hover:bg-primary/10"
                )}
              >
                <Code size={14} />
                Try It Now
              </button>
            </div>
          </div>
        );

      case 'trading':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-normal text-primary">Trading</h2>

            <div className={cn(
              "rounded-xl border-[1.5px] p-5",
              isDark ? "border-white/10" : "border-gray-200"
            )}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-emerald-500/10 text-emerald-500 uppercase tracking-wide">GET</span>
                  <code className="text-[15px] font-mono">/api/history</code>
                </div>
                <CopyButton text={llmSnippets.history} id="llm-history" />
              </div>
              <p className={cn("text-[13px] mb-4", isDark ? "text-white/60" : "text-gray-600")}>
                Get trading history
              </p>
              <div className={cn("relative group rounded-lg overflow-hidden", isDark ? "bg-black/40" : "bg-gray-50 border border-gray-200")}>
                <button
                  onClick={() => copyToClipboard('https://api.xrpl.to/api/history?limit=10', 'history-url')}
                  className={cn(
                    "absolute right-2 top-2 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity",
                    isDark ? "hover:bg-white/10" : "hover:bg-gray-200"
                  )}
                >
                  {copiedBlock === 'history-url' ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} className="opacity-60" />}
                </button>
                <pre className="p-3 font-mono text-[13px] overflow-x-auto m-0">
                  <span className="text-emerald-500">GET</span> https://api.xrpl.to/api/history?limit=10
                </pre>
              </div>
              <button
                onClick={() => handleTryApi('/api/history?limit=10')}
                className={cn(
                  "mt-4 flex items-center gap-2 rounded-lg border-[1.5px] px-4 py-2 text-[13px] font-medium text-primary",
                  isDark ? "border-primary/30 bg-primary/5 hover:bg-primary/10" : "border-primary/30 bg-primary/5 hover:bg-primary/10"
                )}
              >
                <Code size={14} />
                Try It Now
              </button>
            </div>
          </div>
        );

      case 'accounts':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-normal text-primary">Accounts</h2>

            <div className={cn(
              "rounded-xl border-[1.5px] p-5",
              isDark ? "border-white/10" : "border-gray-200"
            )}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 text-[11px] font-medium rounded-md bg-emerald-500/10 text-emerald-500 uppercase tracking-wide">GET</span>
                  <code className="text-[15px] font-mono">/api/account/balance/{`{address}`}</code>
                </div>
                <CopyButton text={llmSnippets.account} id="llm-account" />
              </div>
              <p className={cn("text-[13px] mb-4", isDark ? "text-white/60" : "text-gray-600")}>
                Get account balances
              </p>
              <div className={cn("relative group rounded-lg overflow-hidden", isDark ? "bg-black/40" : "bg-gray-50 border border-gray-200")}>
                <button
                  onClick={() => copyToClipboard('https://api.xrpl.to/api/account/balance/{address}', 'account-url')}
                  className={cn(
                    "absolute right-2 top-2 p-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity",
                    isDark ? "hover:bg-white/10" : "hover:bg-gray-200"
                  )}
                >
                  {copiedBlock === 'account-url' ? <CheckCircle size={14} className="text-emerald-500" /> : <Copy size={14} className="opacity-60" />}
                </button>
                <pre className="p-3 font-mono text-[13px] overflow-x-auto m-0">
                  <span className="text-emerald-500">GET</span> https://api.xrpl.to/api/account/balance/{'{address}'}
                </pre>
              </div>
            </div>
          </div>
        );

      case 'errors':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-normal text-primary">Error Codes</h2>
            <div className={cn(
              "rounded-xl border-[1.5px] overflow-hidden",
              isDark ? "border-white/10" : "border-gray-200"
            )}>
              <table className="w-full text-[13px]">
                <thead className={isDark ? "bg-white/5" : "bg-gray-50"}>
                  <tr>
                    <th className={cn("text-left px-4 py-3 font-medium", isDark ? "text-white/60" : "text-gray-600")}>Code</th>
                    <th className={cn("text-left px-4 py-3 font-medium", isDark ? "text-white/60" : "text-gray-600")}>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { code: '200', desc: 'Success', color: 'text-emerald-500' },
                    { code: '400', desc: 'Bad Request', color: 'text-amber-500' },
                    { code: '404', desc: 'Not Found', color: 'text-amber-500' },
                    { code: '429', desc: 'Too Many Requests', color: 'text-amber-500' },
                    { code: '500', desc: 'Internal Server Error', color: 'text-red-500' }
                  ].map((err) => (
                    <tr key={err.code} className={isDark ? "border-t border-white/10" : "border-t border-gray-200"}>
                      <td className="px-4 py-3"><code className={cn("font-mono", err.color)}>{err.code}</code></td>
                      <td className={cn("px-4 py-3", isDark ? "text-white/60" : "text-gray-600")}>{err.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex-1">
      <Head>
        <title>XRPL.to API Documentation</title>
        <meta
          name="description"
          content="Complete API documentation for XRPL.to - XRP Ledger token data and analytics"
        />
      </Head>

      <Header />

      <div className={cn("min-h-screen flex flex-col", isDark ? "bg-black" : "bg-white")}>
        <div className="flex flex-1">
          {/* Mobile menu button */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={cn(
              "md:hidden fixed top-2 right-2 z-50 p-2 rounded-lg",
              isDark ? "bg-gray-900" : "bg-white border border-gray-200"
            )}
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Sidebar */}
          <div
            className={cn(
              "w-[220px] border-r overflow-y-auto transition-all duration-300 pt-14",
              "fixed md:sticky top-0 h-screen z-40",
              isDark ? "bg-black border-white/[0.08]" : "bg-gray-50/80 border-gray-200",
              isSidebarOpen ? "block" : "hidden md:block"
            )}
          >
            <div className="p-4">
              <div className={cn("text-[11px] font-medium uppercase tracking-wide mb-3", isDark ? "text-white/40" : "text-gray-500")}>
                Documentation
              </div>
              <div className="relative mb-4">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={cn(
                    "w-full pl-9 pr-3 py-2 rounded-lg border-[1.5px] text-[13px]",
                    isDark ? "bg-black border-white/10" : "bg-white border-gray-200"
                  )}
                />
              </div>
              <nav className="space-y-1">
                {sections
                  .filter((s) => s.title.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((section) => {
                    const Icon = section.icon;
                    return (
                      <button
                        key={section.id}
                        onClick={() => {
                          setCurrentSection(section.id);
                          setIsSidebarOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-3 py-2.5 rounded-lg text-[13px] flex items-center gap-2.5",
                          currentSection === section.id
                            ? "bg-primary/10 text-primary"
                            : isDark
                              ? "text-white/70 hover:bg-white/5 hover:text-white"
                              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        )}
                      >
                        <Icon size={14} className={currentSection === section.id ? "text-primary" : "opacity-50"} />
                        {section.title}
                      </button>
                    );
                  })}
              </nav>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-20 pb-8">
              {renderContent()}
            </div>
          </div>
        </div>

        {/* Modal */}
        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className={cn(
                "w-[90%] max-w-[800px] max-h-[80vh] overflow-hidden rounded-xl border-[1.5px]",
                isDark ? "bg-gray-900 border-white/10" : "bg-white border-gray-200"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={cn(
                "flex justify-between items-center px-4 py-3 border-b",
                isDark ? "border-white/10" : "border-gray-200"
              )}>
                <h3 className="text-[15px] font-medium">API Response</h3>
                <div className="flex items-center gap-1">
                  {copySuccess && (
                    <span className="flex items-center gap-1 text-emerald-500 text-[12px] mr-2">
                      <CheckCircle size={12} /> Copied
                    </span>
                  )}
                  <button
                    onClick={handleCopyResponse}
                    className={cn(
                      "p-2 rounded-lg",
                      isDark ? "hover:bg-white/10" : "hover:bg-gray-100"
                    )}
                  >
                    <Copy size={14} className="opacity-60" />
                  </button>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className={cn(
                      "p-2 rounded-lg",
                      isDark ? "hover:bg-white/10" : "hover:bg-gray-100"
                    )}
                  >
                    <X size={14} className="opacity-60" />
                  </button>
                </div>
              </div>

              <div className="overflow-auto max-h-[calc(80vh-56px)]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 size={20} className="animate-spin text-primary" />
                  </div>
                ) : apiResponse ? (
                  <pre
                    className={cn(
                      "text-[12px] font-mono p-4 m-0",
                      isDark ? "bg-black/40" : "bg-gray-50"
                    )}
                  >
                    {JSON.stringify(apiResponse, null, 2)}
                  </pre>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </div>

      <ScrollToTop />
      <Footer />
    </div>
  );
};

export default ApiDocsPage;
