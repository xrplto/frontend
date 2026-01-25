import React, { useState, useEffect, useRef, useCallback, useContext, useMemo } from 'react';
import { MessageCircle, X, Send, Inbox } from 'lucide-react';
import { AppContext } from 'src/context/AppContext';

const timeAgo = (ts) => {
  if (!ts) return '';
  const sec = Math.floor((Date.now() - ts) / 1000);
  if (sec < 60) return 'now';
  if (sec < 3600) return Math.floor(sec / 60) + 'm ago';
  if (sec < 86400) return Math.floor(sec / 3600) + 'h ago';
  if (sec < 2592000) return Math.floor(sec / 86400) + 'd ago';
  if (sec < 31536000) return Math.floor(sec / 2592000) + 'mo ago';
  return Math.floor(sec / 31536000) + 'y ago';
};

const TokenPreview = ({ match }) => {
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`https://api.xrpl.to/v1/token/${match}`)
      .then(r => r.json())
      .then(d => { if (d.token) setToken(d.token); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [match]);

  const formatPrice = (n) => {
    if (!n) return '-';
    const num = Number(n);
    if (num >= 1) return num.toFixed(2);
    if (num >= 0.001) return num.toFixed(4);
    const str = num.toFixed(10);
    const match = str.match(/^0\.(0+)([1-9]\d*)/);
    if (match) return `0.0(${match[1].length})${match[2].slice(0, 4)}`;
    return num.toFixed(6);
  };

  const formatCompact = (n) => {
    if (!n) return '-';
    const num = Number(n);
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    return num.toFixed(0);
  };

  if (loading) return <span className="text-[#137DFE]">loading...</span>;
  if (!token) return <a href={`/token/${match}`} className="text-[#137DFE] hover:underline">{match.slice(0, 12)}...</a>;

  const change = token.pro24h || 0;
  const isUp = change >= 0;

  return (
    <a href={`/token/${match}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2 py-1 my-1 rounded-lg bg-white/5 border border-white/10 hover:border-[#137DFE]/50 text-sm">
      {token.icon && <img src={token.icon} alt="" className="w-5 h-5 rounded-full" />}
      <span className="font-semibold text-[#137DFE]">{token.name || token.currency?.slice(0, 6)}</span>
      <span className="font-mono">${formatPrice(token.exch)}</span>
      <span className={`font-medium ${isUp ? 'text-[#08AA09]' : 'text-red-500'}`}>{isUp ? '+' : ''}{change.toFixed(2)}%</span>
      <span className="opacity-40">·</span>
      <span className="opacity-50">${formatCompact(token.marketcap)}</span>
      <span className="opacity-40">·</span>
      <span className="opacity-50">{timeAgo(token.dateon)}</span>
    </a>
  );
};

const renderMessage = (text) => {
  if (!text || typeof text !== 'string') return text;
  const tokenRegex = /(?:https?:\/\/xrpl\.to)?\/token\/([a-zA-Z0-9]+-[A-Fa-f0-9]+)|https?:\/\/firstledger\.net\/token(?:-v2)?\/([a-zA-Z0-9]+)\/([A-Fa-f0-9]+)|https?:\/\/xpmarket\.com\/token\/([a-zA-Z0-9]+)-([a-zA-Z0-9]+)/g;
  const matches = [...text.matchAll(tokenRegex)];
  if (matches.length === 0) return text;

  const parts = [];
  let last = 0;
  for (const m of matches) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const tokenId = m[1] || (m[2] && m[3] ? `${m[2]}-${m[3]}` : `${m[5]}-${m[4]}`);
    parts.push(<TokenPreview key={m.index} match={tokenId} />);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
};

const Chat = ({ wsUrl = '/ws/chat.js' }) => {
  const { themeName, accountProfile } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [isOpen, setIsOpen] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [messages, setMessages] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [input, setInput] = useState('');
  const [privateTo, setPrivateTo] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [dmTabs, setDmTabs] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('chat_dm_tabs') || '[]');
    } catch { return []; }
  });
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const [showInbox, setShowInbox] = useState(false);

  const conversations = useMemo(() => {
    const convos = {};
    messages.filter(m => m.isPrivate || m.type === 'private').forEach(m => {
      const other = m.username === accountProfile?.account ? m.recipient : m.username;
      if (other && (!convos[other] || m.timestamp > convos[other].timestamp)) {
        convos[other] = { ...m, unread: !convos[other]?.read && m.username !== accountProfile?.account };
      }
    });
    return Object.entries(convos).sort((a, b) => b[1].timestamp - a[1].timestamp);
  }, [messages, accountProfile?.account]);

  const connect = useCallback(() => {
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (accountProfile?.account) {
        ws.send(JSON.stringify({ type: 'register', username: accountProfile.account }));
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.users !== undefined) setOnlineCount(data.users);
      switch (data.type) {
        case 'init':
          setMessages(data.messages || []);
          if (data.online !== undefined) setOnlineCount(data.online);
          // Auto-register after init
          if (accountProfile?.account) {
            ws.send(JSON.stringify({ type: 'register', username: accountProfile.account }));
          }
          break;
        case 'online':
          setOnlineCount(data.count);
          break;
        case 'registered':
          setRegistered(true);
          if (data.users !== undefined) setOnlineCount(data.users);
          // Fetch inbox conversations
          ws.send(JSON.stringify({ type: 'inbox' }));
          // Fetch history for saved DM tabs
          dmTabs.forEach(user => {
            ws.send(JSON.stringify({ type: 'history', with: user }));
          });
          break;
        case 'inbox':
          if (data.conversations?.length) {
            // Add users to DM tabs
            const newUsers = data.conversations.map(c => c.user).filter(u => !dmTabs.includes(u));
            if (newUsers.length) {
              const newTabs = [...dmTabs, ...newUsers];
              setDmTabs(newTabs);
              localStorage.setItem('chat_dm_tabs', JSON.stringify(newTabs));
            }
            // Add last messages to state
            setMessages(prev => {
              const ids = new Set(prev.map(m => m._id));
              const newMsgs = data.conversations
                .filter(c => c.lastMessage && !ids.has(c.lastMessage._id))
                .map(c => c.lastMessage);
              return [...prev, ...newMsgs].sort((a, b) => a.timestamp - b.timestamp);
            });
          }
          break;
        case 'message':
          setMessages((prev) => {
            if (data._id && prev.some((m) => m._id === data._id)) return prev;
            return [...prev, data];
          });
          break;
        case 'private':
          setMessages((prev) => {
            if (data._id && prev.some((m) => m._id === data._id)) return prev;
            return [...prev, data];
          });
          // Auto-open tab for incoming DM
          const dmUser = data.username === accountProfile?.account ? data.recipient : data.username;
          if (dmUser && !dmTabs.includes(dmUser)) {
            const newTabs = [...dmTabs, dmUser];
            setDmTabs(newTabs);
            localStorage.setItem('chat_dm_tabs', JSON.stringify(newTabs));
          }
          break;
        case 'history':
          setMessages((prev) => {
            const ids = new Set(prev.map(m => m._id));
            const newMsgs = (data.messages || []).filter(m => !ids.has(m._id));
            return [...newMsgs, ...prev].sort((a, b) => a.timestamp - b.timestamp);
          });
          break;
        case 'error':
          console.error('Chat error:', data.message);
          break;
        default:
          break;
      }
    };

    ws.onclose = () => {
      setRegistered(false);
      setTimeout(connect, 3000);
    };

    return ws;
  }, [wsUrl, accountProfile?.account]);

  useEffect(() => {
    const ws = connect();
    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      ws.close();
    };
  }, [connect]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!showInbox) return;
    const close = (e) => { if (!e.target.closest('.inbox-dropdown')) setShowInbox(false); };
    document.addEventListener('click', close);
    return () => document.removeEventListener('click', close);
  }, [showInbox]);

  const openDmTab = (user) => {
    if (user && user !== accountProfile?.account && !dmTabs.includes(user)) {
      const newTabs = [...dmTabs, user];
      setDmTabs(newTabs);
      localStorage.setItem('chat_dm_tabs', JSON.stringify(newTabs));
    }
    setActiveTab(user);
    setPrivateTo(user);
    inputRef.current?.focus();
    // Request DM history
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'history', with: user }));
    }
  };

  const closeDmTab = (user, e) => {
    e.stopPropagation();
    const newTabs = dmTabs.filter(t => t !== user);
    setDmTabs(newTabs);
    localStorage.setItem('chat_dm_tabs', JSON.stringify(newTabs));
    if (activeTab === user) {
      setActiveTab('general');
      setPrivateTo('');
    }
  };

  // Auto-register when connected and logged in
  useEffect(() => {
    if (accountProfile?.account && wsRef.current?.readyState === WebSocket.OPEN && !registered) {
      wsRef.current.send(JSON.stringify({ type: 'register', username: accountProfile.account }));
    }
  }, [accountProfile?.account, registered]);

  const sendMessage = () => {
    if (!input || wsRef.current?.readyState !== WebSocket.OPEN) return;

    if (privateTo) {
      wsRef.current.send(JSON.stringify({ type: 'private', to: privateTo, message: input }));
    } else {
      wsRef.current.send(JSON.stringify({ type: 'message', message: input }));
    }
    setInput('');
  };

  const baseClasses = isDark ? 'bg-black text-white border-white/10' : 'bg-white text-black border-black/10';

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="relative flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[#1a1a1a] border-[1.5px] border-white/10 hover:border-white/20"
        >
          <span className="text-white font-medium">Shoutbox</span>
          <span className="text-[#08AA09] text-sm">{onlineCount >= 1000 ? `${(onlineCount / 1000).toFixed(1)}K` : onlineCount}</span>
          {conversations.length > 0 && (
            <span className="flex items-center gap-1 text-[#650CD4] text-sm">
              <Inbox size={14} />
              {conversations.length}
            </span>
          )}
          <span className="px-3 py-1 rounded-lg border-[1.5px] border-white/20 text-white text-sm">Send</span>
        </button>
      ) : (
        <div className={`w-[560px] rounded-xl border-[1.5px] ${baseClasses} overflow-hidden shadow-2xl`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-inherit">
            <div className="flex items-center gap-3">
              <span className="font-semibold">Shoutbox</span>
              {onlineCount > 0 && (
                <span className="flex items-center gap-1.5 text-xs">
                  <span className="w-2 h-2 rounded-full bg-[#08AA09] animate-pulse" />
                  <span className="text-[#08AA09]">{onlineCount}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <div className="relative inbox-dropdown">
                <button onClick={() => setShowInbox(!showInbox)} className={`p-1.5 rounded-lg transition-colors ${showInbox ? 'bg-[#650CD4] text-white' : 'hover:bg-white/10'}`}>
                  <Inbox size={18} />
                  {conversations.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#650CD4] text-white text-[10px] flex items-center justify-center">{conversations.length}</span>
                  )}
                </button>
                {showInbox && (
                  <div className={`absolute right-0 top-10 w-72 rounded-xl border-[1.5px] ${baseClasses} shadow-2xl z-50 overflow-hidden`}>
                    <div className="px-3 py-2 border-b border-inherit text-xs font-medium opacity-50">Messages</div>
                    {conversations.length === 0 ? (
                      <div className="px-3 py-6 text-center text-sm opacity-40">No messages yet</div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto">
                        {conversations.map(([user, msg]) => (
                          <button
                            key={user}
                            onClick={() => { openDmTab(user); setShowInbox(false); }}
                            className="w-full text-left px-3 py-2.5 hover:bg-white/5 border-b border-inherit last:border-b-0 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-sm text-[#650CD4]">{user.slice(0,6)}...{user.slice(-4)}</span>
                              <span className="text-[10px] opacity-40">{timeAgo(msg.timestamp)}</span>
                            </div>
                            <div className="text-xs opacity-50 truncate mt-0.5">{msg.message}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>

          {!accountProfile?.account ? (
            <div className="h-[330px] flex items-center justify-center">
              <div className="text-center opacity-50">
                <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                <p>Connect wallet to chat</p>
              </div>
            </div>
          ) : !registered ? (
            <div className="h-[330px] flex items-center justify-center">
              <div className="text-center opacity-50">
                <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p>Connecting...</p>
              </div>
            </div>
          ) : (
            <>
              {(() => {
                const filtered = activeTab === 'general'
                  ? messages.filter(m => !m.isPrivate && m.type !== 'private')
                  : messages.filter(m => (m.isPrivate || m.type === 'private') &&
                      (m.username === activeTab || m.recipient === activeTab));

                return (
                  <>
                    <div className="flex gap-1 px-3 py-2 border-b border-inherit overflow-x-auto">
                      <button
                        onClick={() => { setActiveTab('general'); setPrivateTo(''); }}
                        className={`px-3 py-1 text-xs rounded-lg shrink-0 ${activeTab === 'general' ? 'bg-[#137DFE] text-white' : 'opacity-60 hover:opacity-100'}`}
                      >
                        General
                      </button>
                      {dmTabs.map(user => (
                        <button
                          key={user}
                          onClick={() => openDmTab(user)}
                          className={`px-3 py-1 text-xs rounded-lg shrink-0 flex items-center gap-1 ${activeTab === user ? 'bg-[#650CD4] text-white' : 'opacity-60 hover:opacity-100'}`}
                        >
                          {user.slice(0, 6)}...{user.slice(-4)}
                          <span onClick={(e) => closeDmTab(user, e)} className="hover:text-red-400 ml-1">×</span>
                        </button>
                      ))}
                    </div>
                    <div className="h-[330px] overflow-y-auto px-3 py-2 space-y-1 scroll-smooth">
                      {filtered.map((msg, i) => {
                        const isOwn = msg.username === accountProfile?.account;
                        const shortName = msg.username?.length > 12
                          ? `${msg.username.slice(0, 6)}...${msg.username.slice(-4)}`
                          : msg.username;

                        return (
                          <div key={msg._id || i} className="flex items-start py-0.5">
                            <span className="text-[9px] opacity-40 w-12 shrink-0 font-mono">
                              {timeAgo(msg.timestamp)}
                            </span>
                            <div className="min-w-0">
                              <span className="inline">
                                <button
                                  onClick={() => { if (!isOwn) openDmTab(msg.username); }}
                                  className={`text-sm font-medium hover:underline ${isOwn ? 'text-[#137DFE]' : activeTab !== 'general' ? 'text-[#650CD4]' : 'text-[#08AA09]'}`}
                                  title={isOwn ? 'You' : `DM ${msg.username}`}
                                >
                                  {isOwn ? 'You' : shortName}
                                </button>
                                <span className="opacity-50">: </span>
                                <span className="break-words">{renderMessage(msg.message)}</span>
                              </span>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </>
                );
              })()}
              <div className="p-3 border-t border-inherit">
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value.slice(0, 256))}
                      placeholder={activeTab === 'general' ? 'Message everyone...' : `DM ${activeTab.slice(0, 6)}...`}
                      onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                      className={`w-full px-4 py-2.5 pr-12 rounded-xl border-[1.5px] ${baseClasses} outline-none focus:border-[#137DFE] transition-colors`}
                    />
                    {input.length > 200 && (
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${input.length >= 256 ? 'text-red-500' : 'opacity-50'}`}>
                        {256 - input.length}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className="px-4 py-2.5 bg-[#137DFE] text-white rounded-xl hover:bg-[#137DFE]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Chat;
