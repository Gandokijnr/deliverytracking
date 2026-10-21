import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { SupportConversation, SupportMessage } from '@/lib/types';
import { MessageSquare, Send, CheckCheck, Clock, Package, User, Mail, ChevronLeft, Check, RotateCcw, Shield } from 'lucide-react';
import { formatDateTime, classNames } from '@/lib/tracking';

export default function AdminSupport() {
  const [conversations, setConversations] = useState<(SupportConversation & { unread_count: number; last_message: string; last_message_at: string })[]>([]);
  const [activeConv, setActiveConv] = useState<SupportConversation | null>(null);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    const { data: convs } = await supabase.from('support_conversations').select('*').order('updated_at', { ascending: false });
    if (!convs) { setLoading(false); return; }
    const convsWithMeta = await Promise.all((convs as SupportConversation[]).map(async (conv) => {
      const { count } = await supabase.from('support_messages').select('id', { count: 'exact', head: true }).eq('conversation_id', conv.id).eq('sender_type', 'customer').eq('is_read', false);
      const { data: lastMsg } = await supabase.from('support_messages').select('message, created_at').eq('conversation_id', conv.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      return { ...conv, unread_count: count || 0, last_message: lastMsg?.message || '', last_message_at: lastMsg?.created_at || conv.created_at };
    }));
    setConversations(convsWithMeta); setLoading(false);
  }, []);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  useEffect(() => {
    const channel = supabase.channel('admin-conversations').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages' }, () => fetchConversations()).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'support_conversations' }, () => fetchConversations()).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchConversations]);

  const loadMessages = useCallback(async (conv: SupportConversation) => {
    setActiveConv(conv);
    const { data: msgs } = await supabase.from('support_messages').select('*').eq('conversation_id', conv.id).order('created_at', { ascending: true });
    setMessages((msgs || []) as SupportMessage[]);
    await supabase.from('support_messages').update({ is_read: true }).eq('conversation_id', conv.id).eq('sender_type', 'customer').eq('is_read', false);
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (!activeConv) return;
    const channel = supabase.channel(`admin-conv-${activeConv.id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `conversation_id=eq.${activeConv.id}` }, (payload) => { const newMsg = payload.new as SupportMessage; setMessages((prev) => prev.some((m) => m.id === newMsg.id) ? prev : [...prev, newMsg]); if (newMsg.sender_type === 'customer') supabase.from('support_messages').update({ is_read: true }).eq('id', newMsg.id); }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [activeConv]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !activeConv) return;
    setSending(true); const msg = reply.trim(); setReply('');
    try { const { data } = await supabase.from('support_messages').insert({ conversation_id: activeConv.id, sender_type: 'admin', message: msg }).select().single(); if (data) setMessages((prev) => [...prev, data as SupportMessage]); } catch { /* ignore */ } finally { setSending(false); }
  };

  const handleStatusChange = async (status: 'open' | 'resolved') => { if (!activeConv) return; await supabase.from('support_conversations').update({ status }).eq('id', activeConv.id); setActiveConv({ ...activeConv, status }); fetchConversations(); };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-[3px] border-[#c9a227] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div><h2 className="text-2xl font-bold text-[#0c1a33]">Support Inbox</h2><p className="text-sm text-slate-500 mt-1">View and respond to customer support conversations</p></div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6 h-[calc(100vh-220px)]">
        <div className={classNames('card overflow-hidden flex flex-col', activeConv && 'hidden lg:flex')}>
          <div className="p-3 border-b border-slate-100"><h3 className="font-bold text-[#0c1a33] text-sm">Conversations ({conversations.length})</h3></div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {conversations.length === 0 ? <div className="text-center py-10"><MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="text-sm text-slate-500">No conversations yet.</p></div> : conversations.map((conv) => (
              <button key={conv.id} onClick={() => loadMessages(conv)} className={classNames('w-full p-3 border-b border-slate-50 text-left hover:bg-slate-50 transition-colors', activeConv?.id === conv.id && 'bg-amber-50')}>
                <div className="flex items-center justify-between mb-1"><span className="text-sm font-semibold text-[#0c1a33] truncate">{conv.customer_name}</span>{conv.unread_count > 0 && <span className="px-1.5 py-0.5 text-xs font-bold rounded-full bg-red-500 text-white">{conv.unread_count}</span>}</div>
                <p className="text-xs text-slate-500 truncate">{conv.last_message}</p>
                <div className="flex items-center justify-between mt-1"><span className={classNames('text-xs px-1.5 py-0.5 rounded-full font-medium', conv.status === 'open' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>{conv.status === 'open' ? 'Open' : 'Resolved'}</span><span className="text-xs text-slate-400">{formatDateTime(conv.last_message_at)}</span></div>
                {conv.tracking_number && <span className="inline-flex items-center gap-1 mt-1 text-xs text-[#c9a227] font-mono"><Package className="w-3 h-3" /> {conv.tracking_number}</span>}
              </button>
            ))}
          </div>
        </div>

        {activeConv ? (
          <div className="lg:col-span-2 card overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-100"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><button onClick={() => setActiveConv(null)} className="lg:hidden p-1 text-slate-500"><ChevronLeft className="w-5 h-5" /></button><div><h3 className="font-bold text-[#0c1a33]">{activeConv.customer_name}</h3><div className="flex flex-wrap gap-3 text-xs text-slate-500 mt-0.5"><span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {activeConv.customer_email}</span>{activeConv.tracking_number && <span className="flex items-center gap-1"><Package className="w-3 h-3 text-[#c9a227]" /> {activeConv.tracking_number}</span>}</div></div></div><div className="flex gap-2">{activeConv.status === 'open' ? <button onClick={() => handleStatusChange('resolved')} className="btn-ghost border border-slate-300 !py-1.5 !px-3 !text-xs"><Check className="w-3.5 h-3.5" /> Mark Resolved</button> : <button onClick={() => handleStatusChange('open')} className="btn-ghost border border-slate-300 !py-1.5 !px-3 !text-xs"><RotateCcw className="w-3.5 h-3.5" /> Reopen</button>}</div></div></div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {messages.map((msg) => (
                <div key={msg.id} className={classNames('flex', msg.sender_type === 'admin' ? 'justify-end' : 'justify-start')}>
                  <div className={classNames('max-w-[75%] rounded-2xl px-4 py-3', msg.sender_type === 'admin' ? 'bg-[#112342] text-white' : 'bg-slate-100 text-[#0c1a33]')}>
                    <div className="flex items-center gap-1.5 mb-1">{msg.sender_type === 'customer' ? <User className="w-3 h-3 text-slate-400" /> : <Shield className="w-3 h-3 text-[#c9a227]" />}<span className="text-xs font-semibold opacity-70">{msg.sender_type === 'admin' ? 'Support Agent' : 'Customer'}</span></div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                    <div className={classNames('flex items-center gap-1 mt-1 text-xs', 'text-slate-400')}><Clock className="w-3 h-3" /> {formatDateTime(msg.created_at)}{msg.sender_type === 'admin' && (msg.is_read ? <CheckCheck className="w-3 h-3 text-[#c9a227]" /> : <Check className="w-3 h-3" />)}</div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="border-t border-slate-100 p-3"><form onSubmit={handleReply} className="flex gap-2"><input type="text" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your reply..." className="input-field flex-1" /><button type="submit" disabled={!reply.trim() || sending} className="btn-navy !px-4"><Send className="w-5 h-5" /></button></form></div>
          </div>
        ) : (
          <div className="hidden lg:flex lg:col-span-2 card items-center justify-center"><div className="text-center text-slate-400"><MessageSquare className="w-12 h-12 mx-auto mb-3" /><p>Select a conversation to view messages</p></div></div>
        )}
      </div>
    </div>
  );
}
