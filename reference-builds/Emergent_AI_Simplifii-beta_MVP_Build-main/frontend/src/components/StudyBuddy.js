import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { MessageCircle, X, Send, Loader2, Sparkles, Trash2, Minimize2, Maximize2, Lock } from 'lucide-react';

const StudyBuddy = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimised, setIsMinimised] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `sb_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
  const hasPurchased = user?.has_purchased || user?.is_owner;

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: 'assistant',
        content: `Hey! I'm your Study Buddy. I can help you with:\n\n- Understanding your assessment briefs\n- Study tips and strategies\n- Breaking down complex tasks\n- Time management advice\n- Citation help\n- Anything uni-related!\n\nWhat are you working on today?`
      }]);
    }
  }, [isOpen, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const response = await axios.post(`${API}/study-buddy/chat`, {
        message: userMsg,
        session_id: sessionId
      }, { withCredentials: true });
      setMessages(prev => [...prev, { role: 'assistant', content: response.data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having a moment. Try again in a sec?" }]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [input, loading, API, sessionId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => {
    setMessages([{
      role: 'assistant',
      content: "Fresh start! What would you like help with?"
    }]);
  };

  if (!user) return null;

  return (
    <>
      {/* Chat bubble trigger */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          data-testid="study-buddy-trigger"
          className="fixed bottom-20 right-4 z-50 w-14 h-14 bg-violet-600 hover:bg-violet-500 rounded-full flex items-center justify-center shadow-lg shadow-violet-500/20 transition-all hover:scale-105 group"
        >
          {hasPurchased ? (
            <MessageCircle size={24} className="text-white" />
          ) : (
            <Lock size={20} className="text-white/70" />
          )}
          {hasPurchased && <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#09090B] animate-pulse" />}
        </button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div
          data-testid="study-buddy-window"
          className={`fixed z-50 bg-[#111113] border border-white/[0.08] shadow-2xl transition-all duration-200 ${
            isMinimised
              ? 'bottom-4 right-4 w-72 h-14 rounded-2xl'
              : 'bottom-4 right-4 w-96 h-[520px] rounded-2xl flex flex-col'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] flex-shrink-0 cursor-pointer" onClick={() => isMinimised && setIsMinimised(false)}>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center">
                <Sparkles size={16} className="text-violet-400" />
              </div>
              <div>
                <div className="text-sm font-semibold text-white" style={{ fontFamily: 'Outfit' }}>Study Buddy</div>
                {!isMinimised && <div className="text-[10px] text-zinc-500">AI study coach</div>}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!isMinimised && (
                <button onClick={clearChat} className="p-1.5 hover:bg-white/[0.04] rounded-lg text-zinc-600 hover:text-zinc-400 transition-colors" title="Clear chat">
                  <Trash2 size={14} />
                </button>
              )}
              <button onClick={() => setIsMinimised(!isMinimised)} className="p-1.5 hover:bg-white/[0.04] rounded-lg text-zinc-600 hover:text-zinc-400 transition-colors">
                {isMinimised ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
              </button>
              <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/[0.04] rounded-lg text-zinc-600 hover:text-zinc-400 transition-colors" data-testid="close-study-buddy">
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Messages */}
          {!isMinimised && (
            <>
              {!hasPurchased ? (
                <div className="flex-1 flex items-center justify-center px-6 py-8">
                  <div className="text-center">
                    <Lock size={32} className="text-zinc-600 mx-auto mb-3" />
                    <p className="text-sm text-zinc-400 mb-1 font-medium">Buy any ticket pack to unlock your Study Buddy.</p>
                    <a href="/credits" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">Grab tickets &rarr;</a>
                  </div>
                </div>
              ) : (
              <>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" data-testid="study-buddy-messages">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-violet-600 text-white rounded-br-md'
                        : 'bg-white/[0.04] text-zinc-300 rounded-bl-md border border-white/[0.06]'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white/[0.04] border border-white/[0.06] text-zinc-400 px-4 py-3 rounded-2xl rounded-bl-md text-sm">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-3 py-3 border-t border-white/[0.06] flex-shrink-0">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask me anything..."
                    className="flex-1 px-3.5 py-2.5 bg-[#09090B] border border-white/[0.08] rounded-xl text-white placeholder-zinc-600 text-sm focus:ring-1 focus:ring-violet-500/40 focus:border-violet-500/30"
                    data-testid="study-buddy-input"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim() || loading}
                    data-testid="study-buddy-send"
                    className="px-3 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  </button>
                </div>
                <p className="text-[9px] text-zinc-700 mt-2 text-center">AI-powered study coach. Always verify with your institution.</p>
              </div>
              </>
              )}
            </>
          )}
        </div>
      )}
    </>
  );
};

export default StudyBuddy;
