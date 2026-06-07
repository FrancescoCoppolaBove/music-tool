import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Props {
  context?: string; // e.g. "Scale Advisor — Cmaj7, Lydian scale"
}

const CSS = `
  .mb-btn {
    position: fixed; bottom: 24px; right: 24px; z-index: 9000;
    width: 52px; height: 52px; border-radius: 50%;
    background: linear-gradient(135deg, #7c3aed, #6d28d9);
    border: none; cursor: pointer; color: #fff;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 4px 20px rgba(124,58,237,0.45);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  .mb-btn:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(124,58,237,0.6); }

  .mb-panel {
    position: fixed; bottom: 88px; right: 20px; z-index: 9001;
    width: min(380px, calc(100vw - 32px));
    background: #161b22; border: 1px solid #30363d; border-radius: 16px;
    box-shadow: 0 24px 60px rgba(0,0,0,0.7);
    display: flex; flex-direction: column; overflow: hidden;
    animation: mb-slide 0.2s ease;
    max-height: calc(100vh - 120px);
  }
  @keyframes mb-slide { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

  .mb-head {
    padding: 14px 16px; border-bottom: 1px solid #21262d;
    display: flex; align-items: center; gap: 10; justify-content: space-between;
    background: #1c2128; flex-shrink: 0;
  }
  .mb-head-left { display: flex; align-items: center; gap: 10px; }
  .mb-head-title { font-size: 14px; font-weight: 700; color: #e6edf3; font-family: 'DM Sans', sans-serif; }
  .mb-head-ctx { font-size: 11px; color: #4b5563; margin-top: 2px; }
  .mb-close {
    background: none; border: none; cursor: pointer; color: #4b5563; padding: 4px;
    border-radius: 6px; transition: color 0.12s;
    display: flex; align-items: center;
  }
  .mb-close:hover { color: #e6edf3; }

  .mb-messages {
    flex: 1; overflow-y: auto; padding: 14px 14px 8px;
    display: flex; flex-direction: column; gap: 10;
    min-height: 120px;
    scrollbar-width: thin; scrollbar-color: #30363d transparent;
  }
  .mb-msg { max-width: 88%; }
  .mb-msg.user { align-self: flex-end; }
  .mb-msg.assistant { align-self: flex-start; }
  .mb-bubble {
    padding: 9px 13px; border-radius: 12px;
    font-size: 13px; line-height: 1.55; font-family: 'DM Sans', sans-serif;
  }
  .mb-msg.user .mb-bubble { background: #7c3aed22; border: 1px solid #7c3aed40; color: #e6edf3; }
  .mb-msg.assistant .mb-bubble { background: #21262d; color: #e6edf3; }
  .mb-thinking { display: flex; gap: 4px; align-items: center; padding: 8px 4px; }
  .mb-dot { width: 6px; height: 6px; border-radius: 50%; background: #4b5563; animation: mb-bounce 1.2s ease infinite; }
  .mb-dot:nth-child(2) { animation-delay: 0.2s; }
  .mb-dot:nth-child(3) { animation-delay: 0.4s; }
  @keyframes mb-bounce { 0%,80%,100% { transform: scale(0.8); opacity: 0.5; } 40% { transform: scale(1.2); opacity: 1; } }

  .mb-suggestions {
    padding: 0 14px 10px;
    display: flex; flex-wrap: wrap; gap: 6px;
    flex-shrink: 0;
  }
  .mb-suggestion {
    padding: 5px 10px; border-radius: 100px;
    border: 1px solid #30363d; background: none;
    color: #6b7280; font-size: 11px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer;
    transition: all 0.12s;
  }
  .mb-suggestion:hover { border-color: #7c3aed60; color: #c4b5fd; background: #7c3aed10; }

  .mb-input-row {
    padding: 10px 12px 12px;
    display: flex; gap: 8px; align-items: flex-end;
    border-top: 1px solid #21262d; flex-shrink: 0;
  }
  .mb-textarea {
    flex: 1; background: #1c2128; border: 1px solid #30363d; border-radius: 10px;
    color: #e6edf3; font-size: 13px; font-family: 'DM Sans', sans-serif;
    padding: 9px 12px; resize: none; outline: none;
    max-height: 120px; line-height: 1.5;
    transition: border-color 0.12s;
  }
  .mb-textarea:focus { border-color: #7c3aed60; }
  .mb-textarea::placeholder { color: #374151; }
  .mb-send {
    width: 36px; height: 36px; border-radius: 9px; flex-shrink: 0;
    background: linear-gradient(135deg, #7c3aed, #6d28d9); border: none;
    color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: opacity 0.12s;
  }
  .mb-send:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const SUGGESTIONS = [
  'Why does tritone substitution work?',
  'What scales work over a minor 7th?',
  'Explain the Coltrane changes',
  'What is a secondary dominant?',
];

export default function ModalBuddy({ context }: Props) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  async function send(text: string) {
    const msg = text.trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg: Message = { role: 'user', content: msg };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setLoading(true);

    try {
      const res = await fetch('/.netlify/functions/buddy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          context,
          history: messages.slice(-6), // send last 6 for multi-turn context
        }),
      });
      const data = await res.json() as { reply?: string; error?: string };
      const reply = data.reply ?? data.error ?? 'Something went wrong. Try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Network error. Check your connection.' }]);
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  // Auto-resize textarea
  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = `${ta.scrollHeight}px`; }
  }

  const showSuggestions = messages.length === 0 && !loading;

  return (
    <>
      <style>{CSS}</style>

      {/* Floating button */}
      <button
        className="mb-btn"
        onClick={() => setOpen(o => !o)}
        title="Modal Buddy — Ask anything about music theory"
      >
        {open ? <X size={20} /> : <MessageCircle size={20} />}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="mb-panel">
          {/* Header */}
          <div className="mb-head">
            <div className="mb-head-left">
              <span style={{ fontSize: 20 }}>🎵</span>
              <div>
                <div className="mb-head-title">Modal Buddy</div>
                {context && <div className="mb-head-ctx">{context}</div>}
              </div>
            </div>
            <button className="mb-close" onClick={() => setOpen(false)}>
              <X size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="mb-messages">
            {messages.length === 0 && (
              <div style={{ color: '#4b5563', fontSize: 13, lineHeight: 1.6, padding: '4px 2px' }}>
                Ciao! Sono Modal Buddy. Chiedimi qualsiasi cosa sulla teoria musicale — scale, accordi, armonia jazz, e molto altro.
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`mb-msg ${m.role}`}>
                <div className="mb-bubble">{m.content}</div>
              </div>
            ))}
            {loading && (
              <div className="mb-msg assistant">
                <div className="mb-bubble">
                  <div className="mb-thinking">
                    <div className="mb-dot" />
                    <div className="mb-dot" />
                    <div className="mb-dot" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick suggestions */}
          {showSuggestions && (
            <div className="mb-suggestions">
              {SUGGESTIONS.map(s => (
                <button key={s} className="mb-suggestion" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          )}

          {/* Input row */}
          <div className="mb-input-row">
            <textarea
              ref={textareaRef}
              className="mb-textarea"
              placeholder="Ask about music theory…"
              value={input}
              onChange={handleInput}
              onKeyDown={handleKey}
              rows={1}
            />
            <button className="mb-send" onClick={() => send(input)} disabled={!input.trim() || loading}>
              {loading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={15} />}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
