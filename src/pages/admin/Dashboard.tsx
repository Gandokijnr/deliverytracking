import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { supabase } from '@/lib/supabase';
import type { Shipment } from '@/lib/types';
import { Package, Truck, Clock, CheckCircle2, Archive, MessageSquare, ArrowRight, TrendingUp } from 'lucide-react';
import { formatDate, getStatusColor, classNames } from '@/lib/tracking';

interface Stats {
  total: number;
  active: number;
  pending: number;
  inTransit: number;
  delivered: number;
  archived: number;
  unread: number;
}

const PENDING_STATUSES = ['Shipment Registered', 'Awaiting Collection', 'Processing at Origin Facility', 'Documentation Required'];
const TRANSIT_STATUSES = ['Asset Collected', 'Dispatched', 'In Transit', 'Arrived at Transit Hub', 'Customs Processing', 'Customs Cleared', 'Arrived at Destination Facility', 'Out for Secure Delivery'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({ total: 0, active: 0, pending: 0, inTransit: 0, delivered: 0, archived: 0, unread: 0 });
  const [recentShipments, setRecentShipments] = useState<Shipment[]>([]);
  const [recentMessages, setRecentMessages] = useState<{ id: string; customer_name: string; message: string; created_at: string; tracking_number: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: shipments } = await supabase.from('shipments').select('*').order('created_at', { ascending: false });
      const all = (shipments || []) as Shipment[];
      const active = all.filter((s) => !s.archived_at);
      const archived = all.filter((s) => s.archived_at);

      const stat: Stats = {
        total: all.length,
        active: active.length,
        pending: active.filter((s) => PENDING_STATUSES.includes(s.current_status)).length,
        inTransit: active.filter((s) => TRANSIT_STATUSES.includes(s.current_status)).length,
        delivered: active.filter((s) => s.current_status === 'Delivered').length,
        archived: archived.length,
        unread: 0,
      };

      const { count } = await supabase.from('support_messages').select('id', { count: 'exact', head: true }).eq('sender_type', 'customer').eq('is_read', false);
      stat.unread = count || 0;
      setStats(stat);
      setRecentShipments(active.slice(0, 5));

      const { data: msgData } = await supabase
        .from('support_messages')
        .select('id, message, created_at, sender_type, is_read, conversation:conversation_id(customer_name, tracking_number)')
        .eq('sender_type', 'customer')
        .order('created_at', { ascending: false })
        .limit(5);

      const msgs = (msgData || []).map((m: Record<string, unknown>) => {
        const conv = m.conversation as { customer_name: string; tracking_number: string | null };
        return { id: m.id as string, customer_name: conv?.customer_name || 'Unknown', message: m.message as string, created_at: m.created_at as string, tracking_number: conv?.tracking_number || null };
      });
      setRecentMessages(msgs);
      setLoading(false);
    };
    fetchData();
  }, []);

  const statCards = [
    { label: 'Total Shipments', value: stats.total, icon: Package, color: 'bg-[#112342]' },
    { label: 'Active', value: stats.active, icon: Truck, color: 'bg-blue-500' },
    { label: 'Pending', value: stats.pending, icon: Clock, color: 'bg-amber-500' },
    { label: 'In Transit', value: stats.inTransit, icon: TrendingUp, color: 'bg-cyan-500' },
    { label: 'Delivered', value: stats.delivered, icon: CheckCircle2, color: 'bg-emerald-500' },
    { label: 'Archived', value: stats.archived, icon: Archive, color: 'bg-slate-400' },
    { label: 'Unread Messages', value: stats.unread, icon: MessageSquare, color: 'bg-red-500' },
  ];

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-[3px] border-[#c9a227] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#0c1a33]">Dashboard Overview</h2>
          <p className="text-sm text-slate-500 mt-1">Monitor your shipment operations and support activity</p>
        </div>
        <Link to="/admin/shipments/new" className="btn-navy !py-2.5"><Package className="w-4 h-4" /> Create Shipment</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        {statCards.map((card) => (
          <div key={card.label} className="card p-4">
            <div className={classNames('w-9 h-9 rounded-lg flex items-center justify-center mb-2', card.color)}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-2xl font-bold text-[#0c1a33]">{card.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#0c1a33]">Recent Shipments</h3>
            <Link to="/admin/shipments" className="text-sm text-[#c9a227] hover:underline flex items-center gap-1">View all <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          {recentShipments.length === 0 ? (
            <div className="text-center py-10"><Package className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="text-sm text-slate-500">No shipments yet. Create your first shipment to get started.</p></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100"><th className="pb-2 pr-4">Tracking #</th><th className="pb-2 pr-4">Asset</th><th className="pb-2 pr-4">Route</th><th className="pb-2 pr-4">Status</th><th className="pb-2">Created</th></tr></thead>
                <tbody>
                  {recentShipments.map((s) => (
                    <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="py-3 pr-4"><Link to="/admin/shipments/$id" params={{ id: s.id }} className="font-mono text-xs font-semibold text-[#1e3a6f] hover:text-[#c9a227]">{s.tracking_number}</Link></td>
                      <td className="py-3 pr-4 text-xs text-slate-600 max-w-[140px] truncate">{s.asset_category}</td>
                      <td className="py-3 pr-4 text-xs text-slate-600 max-w-[160px] truncate">{s.origin_city} → {s.destination_city}</td>
                      <td className="py-3 pr-4"><span className={classNames('px-2 py-0.5 rounded-full text-xs font-semibold border', getStatusColor(s.current_status))}>{s.current_status}</span></td>
                      <td className="py-3 text-xs text-slate-400">{formatDate(s.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#0c1a33]">Recent Support Messages</h3>
            <Link to="/admin/support" className="text-sm text-[#c9a227] hover:underline flex items-center gap-1">Inbox <ArrowRight className="w-3.5 h-3.5" /></Link>
          </div>
          {recentMessages.length === 0 ? (
            <div className="text-center py-10"><MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" /><p className="text-sm text-slate-500">No messages yet.</p></div>
          ) : (
            <div className="space-y-3">
              {recentMessages.map((msg) => (
                <Link key={msg.id} to="/admin/support" className="block p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                  <div className="flex items-center justify-between mb-1"><span className="text-sm font-semibold text-[#0c1a33]">{msg.customer_name}</span><span className="text-xs text-slate-400">{formatDate(msg.created_at)}</span></div>
                  <p className="text-xs text-slate-600 line-clamp-2">{msg.message}</p>
                  {msg.tracking_number && <span className="inline-flex items-center gap-1 mt-1.5 text-xs text-[#c9a227] font-mono"><Package className="w-3 h-3" /> {msg.tracking_number}</span>}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
