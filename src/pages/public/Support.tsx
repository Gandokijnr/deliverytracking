import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearch } from '@tanstack/react-router';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Send, ArrowLeft, CheckCheck, Mail, User, Package, Clock } from 'lucide-react';
import { formatDateTime } from '@/lib/tracking';

interface Conversation {
  conversation_id: string;
  customer_name: string;
  customer_email: string;
  tracking_number: string | null;
  status: string;
  created_at: string;
}

interface Message {
  message_id: string;
  sender_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const STORAGE_KEY = 'meridianvault_conversations';

export default function Support() {
  const search = useSearch({ strict: false }) as { t?: string };
  const [view, setView] = useState<'form' | 'chat'>('form');
  const [conversations, setConversations] = useState<{ id: string; token: string; name: string }[]>([]);
  const [activeToken, setActiveToken] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', email: '', tracking: search.t || '', message: '' });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setConversations(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveConversations = useCallback((convs: { id: string; token: string; name: string }[]) => {
    setConversations(convs);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(convs));
    } catch {
      // ignore
    }
  }, []);

  const loadConversation = useCallback(async (token: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data: convData, error: convError } = await supabase.rpc('get_customer_conversation', { p_access_token: token });
      if (convError) throw convError;
      if (!convData || convData.length === 0) {
        setError('Conversation not found.');
        return;
      }
      setConversation(convData[0] as Conversation);

      const { data: msgData, error: msgError } = await supabase.rpc('get_customer_messages', { p_access_token: token });
      if (msgError) throw msgError;
      setMessages((msgData || []) as Message[]);

      await supabase.rpc('mark_customer_messages_read', { p_access_token: token });
      setActiveToken(token);
      setView('chat');
    } catch {
      setError('Failed to load conversation. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (view === 'chat' && activeToken) {
      const channel = supabase
        .channel(`support-messages-${activeToken}`)
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, async (payload) => {
          const newMsg = payload.new as { id: string; sender_type: string; message: string; is_read: boolean; created_at: string };
          setMessages((prev) => {
            if (prev.some((m) => m.message_id === newMsg.id)) return prev;
            return [...prev, {
              message_id: newMsg.id,
              sender_type: newMsg.sender_type,
              message: newMsg.message,
              is_read: newMsg.is_read,
              created_at: newMsg.created_at,
            }];
          });
          if (newMsg.sender_type === 'admin') {
            await supabase.rpc('mark_customer_messages_read', { p_access_token: activeToken });
          }
        })
        .subscribe();

      return () => { supabase.removeChannel(channel); };
    }
  }, [view, activeToken]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('create_support_conversation', {
        p_customer_name: form.name.trim(),
        p_customer_email: form.email.trim(),
        p_tracking_number: form.tracking.trim() || null,
        p_message: form.message.trim(),
      });
      if (rpcError) throw rpcError;
      if (!data || data.length === 0) throw new Error('Failed to create conversation.');

      const result = data[0] as { conversation_id: string; access_token: string };
      const newConv = { id: result.conversation_id, token: result.access_token, name: form.name.trim() };
      const updated = [newConv, ...conversations.filter((c) => c.token !== result.access_token)];
      saveConversations(updated);

      await loadConversation(result.access_token);
      setForm({ name: '', email: '', tracking: '', message: '' });
    } catch {
      setError('Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeToken) return;
    const msg = newMessage.trim();
    setNewMessage('');
    setMessages((prev) => [...prev, {
      message_id: `temp-${Date.now()}`,
      sender_type: 'customer',
      message: msg,
      is_read: false,
      created_at: new Date().toISOString(),
    }]);
    try {
      await supabase.rpc('send_customer_message', { p_access_token: activeToken, p_message: msg });
    } catch {
      setError('Failed to send message.');
    }
  };

  if (view === 'chat' && activeToken && conversation) {
    return (
      <div className="min-h-[calc(100vh-200px)] flex flex-col bg-slate-50">
        <div className="bg-[#0c1a33] text-white py-6">
          <div className="container-mx">
            <button
              onClick={() => { setView('form'); setActiveToken(null); setConversation(null); setMessages([]); }}
              className="flex items-center gap-2 text-sm text-slate-300 hover:text-white transition-colors mb-3"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Support
            </button>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-[#c9a227]" />
              Support Conversation
            </h1>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-300">
              <span className="flex items-center gap-1.5"><User className="w-4 h-4 text-[#c9a227]" /> {conversation.customer_name}</span>
              <span className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-[#c9a227]" /> {conversation.customer_email}</span>
              {conversation.tracking_number && (
                <span className="flex items-center gap-1.5"><Package className="w-4 h-4 text-[#c9a227]" /> {conversation.tracking_number}</span>
              )}
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${conversation.status === 'open' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/20 text-slate-300'}`}>
                {conversation.status === 'open' ? 'Open' : 'Resolved'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 container-mx py-6 flex flex-col">
          <div className="flex-1 card overflow-hidden flex flex-col" style={{ minHeight: '400px', maxHeight: '600px' }}>
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 scrollbar-thin">
              {messages.map((msg) => (
                <div key={msg.message_id} className={`flex ${msg.sender_type === 'customer' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.sender_type === 'customer' ? 'bg-[#112342] text-white' : 'bg-slate-100 text-[#0c1a33]'}`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    <div className={`flex items-center gap-1 mt-1 text-xs ${msg.sender_type === 'customer' ? 'text-slate-400' : 'text-slate-400'}`}>
                      <Clock className="w-3 h-3" />
                      {formatDateTime(msg.created_at)}
                      {msg.sender_type === 'admin' && msg.is_read && (
                        <CheckCheck className="w-3 h-3 text-[#c9a227] ml-1" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-slate-200 p-4">
              <form onSubmit={handleSendReply} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="input-field flex-1"
                />
                <button type="submit" disabled={!newMessage.trim()} className="btn-navy !px-4">
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-200px)] bg-slate-50">
      <section className="bg-[#0c1a33] text-white py-12 lg:py-16">
        <div className="container-mx text-center">
          <div className="gold-divider mx-auto mb-4" />
          <h1 className="text-3xl lg:text-4xl font-bold mb-3">Contact Support</h1>
          <p className="text-slate-300 max-w-xl mx-auto">
            Send us a message about your shipment or any inquiry. No registration required — we'll provide a secure link to your conversation.
          </p>
        </div>
      </section>

      <section className="section-padding !py-12">
        <div className="container-mx max-w-2xl">
          {conversations.length > 0 && (
            <div className="card p-5 mb-6">
              <h3 className="font-bold text-[#0c1a33] mb-3 text-sm uppercase tracking-wider">Your Previous Conversations</h3>
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <button
                    key={conv.token}
                    onClick={() => loadConversation(conv.token)}
                    className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-[#c9a227]" />
                      <div>
                        <p className="text-sm font-medium text-[#0c1a33]">{conv.name}</p>
                        <p className="text-xs text-slate-400">Click to continue conversation</p>
                      </div>
                    </div>
                    <ArrowLeft className="w-4 h-4 text-slate-400 rotate-180" />
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="card p-6 lg:p-8 shadow-lg">
            <h2 className="text-xl font-bold text-[#0c1a33] mb-6">Send a Message</h2>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#0c1a33] mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="input-field"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0c1a33] mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input-field"
                    placeholder="you@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0c1a33] mb-1.5">Tracking Number (Optional)</label>
                <input
                  type="text"
                  value={form.tracking}
                  onChange={(e) => setForm({ ...form, tracking: e.target.value.toUpperCase() })}
                  className="input-field font-mono uppercase tracking-wider"
                  placeholder="17-character tracking number"
                  maxLength={17}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0c1a33] mb-1.5">Message *</label>
                <textarea
                  required
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className="input-field min-h-[120px] resize-y"
                  placeholder="Describe your inquiry or concern..."
                />
              </div>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</>
                ) : (
                  <><Send className="w-5 h-5" /> Send Message</>
                )}
              </button>
            </form>

            <p className="mt-4 text-xs text-slate-400 flex items-start gap-1.5">
              <Mail className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              A secure conversation link will be saved in your browser so you can return to this conversation later. Save the link if you change browsers or clear your data.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
