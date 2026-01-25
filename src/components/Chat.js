import React, { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { AppContext } from 'src/context/AppContext';

const Chat = ({ wsUrl = '/ws/chat.js' }) => {
  const { themeName, accountProfile } = useContext(AppContext);
  const isDark = themeName === 'XrplToDarkTheme';
  const [isOpen, setIsOpen] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [messages, setMessages] = useState([]);
  const [onlineCount, setOnlineCount] = useState(0);
  const [input, setInput] = useState('');
  const [privateTo, setPrivateTo] = useState('');
  const wsRef = useRef(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

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
          break;
        case 'message':
        case 'private':
          setMessages((prev) => [...prev, data]);
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
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-[#1a1a1a] border-[1.5px] border-white/10 hover:border-white/20"
        >
          <span className="text-white font-medium">Shoutbox</span>
          <span className="text-[#08AA09] text-sm">{onlineCount >= 1000 ? `${(onlineCount / 1000).toFixed(1)}K` : onlineCount}</span>
          <span className="px-3 py-1 rounded-lg border-[1.5px] border-white/20 text-white text-sm">Send</span>
        </button>
      ) : (
        <div className={`w-[540px] rounded-xl border-[1.5px] ${baseClasses} overflow-hidden shadow-2xl`}>
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
            <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
              <X size={18} />
            </button>
          </div>

          {!accountProfile?.account ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-center opacity-50">
                <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                <p>Connect wallet to chat</p>
              </div>
            </div>
          ) : !registered ? (
            <div className="h-[400px] flex items-center justify-center">
              <div className="text-center opacity-50">
                <div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p>Connecting...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="h-[400px] overflow-y-auto px-3 py-2 space-y-1 scroll-smooth">
                {messages.map((msg, i) => {
                  const isOwn = msg.username === accountProfile?.account;
                  const isDM = msg.isPrivate || msg.type === 'private';
                  const shortName = msg.username?.length > 12
                    ? `${msg.username.slice(0, 6)}...${msg.username.slice(-4)}`
                    : msg.username;
                  const shortRecipient = msg.recipient?.length > 12
                    ? `${msg.recipient.slice(0, 6)}...${msg.recipient.slice(-4)}`
                    : msg.recipient;

                  return (
                    <div key={msg._id || i} className="flex items-start gap-2 py-0.5">
                      <span className="text-[10px] opacity-40 pt-0.5 shrink-0">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className="min-w-0">
                        <span className="inline">
                          {isDM && <span className="text-[#650CD4] text-xs mr-1">[DM]</span>}
                          <button
                            onClick={() => { if (!isOwn) { setPrivateTo(msg.username); inputRef.current?.focus(); }}}
                            className={`text-sm font-medium hover:underline ${isOwn ? 'text-[#137DFE]' : isDM ? 'text-[#650CD4]' : 'text-[#08AA09]'}`}
                            title={isOwn ? 'You' : `DM ${msg.username}`}
                          >
                            {isOwn ? 'You' : shortName}
                          </button>
                          {isDM && isOwn && <span className="text-[#650CD4] text-sm"> → {shortRecipient}</span>}
                          {isDM && !isOwn && <span className="text-[#650CD4] text-sm"> → you</span>}
                          <span className="opacity-50">: </span>
                          <span className="break-words">{msg.message}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 border-t border-inherit">
                {privateTo && (
                  <div className="text-xs mb-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-[#650CD4]/10 border border-[#650CD4]/20">
                    <span className="text-[#650CD4]">DM →</span>
                    <span className="opacity-70">{privateTo.slice(0, 8)}...{privateTo.slice(-4)}</span>
                    <button onClick={() => setPrivateTo('')} className="ml-auto hover:opacity-70">
                      <X size={14} />
                    </button>
                  </div>
                )}
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type a message..."
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                    className={`flex-1 px-4 py-2.5 rounded-xl border-[1.5px] ${baseClasses} outline-none focus:border-[#137DFE] transition-colors`}
                  />
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
