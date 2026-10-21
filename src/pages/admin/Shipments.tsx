import { useEffect, useState } from 'react';
import { Link } from '@tanstack/react-router';
import { supabase } from '@/lib/supabase';
import type { Shipment } from '@/lib/types';
import { Package, Plus, Search, Archive, RotateCcw, Trash2, Eye } from 'lucide-react';
import { formatDate, getStatusColor, classNames } from '@/lib/tracking';

export default function AdminShipments() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('all');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetchShipments = async () => {
    setLoading(true);
    let query = supabase.from('shipments').select('*').order('created_at', { ascending: false });
    if (filter === 'active') query = query.is('archived_at', null);
    else if (filter === 'archived') query = query.not('archived_at', 'is', null);
    const { data } = await query;
    setShipments((data || []) as Shipment[]);
    setLoading(false);
  };

  useEffect(() => { fetchShipments(); }, [filter]);

  const filtered = shipments.filter((s) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.tracking_number.toLowerCase().includes(q) || s.asset_category.toLowerCase().includes(q) || s.origin_city.toLowerCase().includes(q) || s.destination_city.toLowerCase().includes(q) || s.sender_name.toLowerCase().includes(q) || s.recipient_name.toLowerCase().includes(q);
  });

  const handleArchive = async (id: string) => { await supabase.from('shipments').update({ archived_at: new Date().toISOString() }).eq('id', id); fetchShipments(); };
  const handleRestore = async (id: string) => { await supabase.from('shipments').update({ archived_at: null }).eq('id', id); fetchShipments(); };
  const handleDelete = async (id: string) => { await supabase.from('shipments').delete().eq('id', id); setConfirmDelete(null); fetchShipments(); };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div><h2 className="text-2xl font-bold text-[#0c1a33]">Shipment Management</h2><p className="text-sm text-slate-500 mt-1">Create, edit, and manage all valuable asset shipments</p></div>
        <Link to="/admin/shipments/new" className="btn-navy !py-2.5"><Plus className="w-4 h-4" /> Create New Shipment</Link>
      </div>

      <div className="card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by tracking number, name, city, or asset..." className="input-field pl-11" /></div>
        <div className="flex gap-2">{(['all', 'active', 'archived'] as const).map((f) => (<button key={f} onClick={() => setFilter(f)} className={classNames('px-4 py-2.5 rounded-lg text-sm font-medium transition-all capitalize', filter === f ? 'bg-[#112342] text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}>{f}</button>))}</div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (<div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-[3px] border-[#c9a227] border-t-transparent rounded-full animate-spin" /></div>) : filtered.length === 0 ? (
          <div className="text-center py-16"><Package className="w-12 h-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500 mb-4">No shipments found.</p><Link to="/admin/shipments/new" className="btn-navy !py-2"><Plus className="w-4 h-4" /> Create Your First Shipment</Link></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50"><tr className="text-left text-xs text-slate-500 uppercase tracking-wider"><th className="px-4 py-3">Tracking #</th><th className="px-4 py-3">Asset Category</th><th className="px-4 py-3">Route</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Est. Delivery</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className={classNames('border-t border-slate-100 hover:bg-slate-50 transition-colors', s.archived_at && 'opacity-60')}>
                    <td className="px-4 py-3"><Link to="/admin/shipments/$id" params={{ id: s.id }} className="font-mono text-xs font-semibold text-[#1e3a6f] hover:text-[#c9a227]">{s.tracking_number}</Link>{s.archived_at && <span className="block text-xs text-slate-400 mt-0.5">Archived</span>}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-[140px] truncate">{s.asset_category}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 max-w-[160px] truncate">{s.origin_city} → {s.destination_city}</td>
                    <td className="px-4 py-3"><span className={classNames('px-2 py-0.5 rounded-full text-xs font-semibold border', getStatusColor(s.current_status))}>{s.current_status}</span></td>
                    <td className="px-4 py-3 text-xs text-slate-500">{formatDate(s.estimated_delivery_date)}</td>
                    <td className="px-4 py-3"><div className="flex items-center justify-end gap-1">
                      <Link to="/admin/shipments/$id" params={{ id: s.id }} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600" title="View / Edit"><Eye className="w-4 h-4" /></Link>
                      {!s.archived_at ? (<button onClick={() => handleArchive(s.id)} className="p-2 rounded-lg hover:bg-amber-50 text-amber-600" title="Archive"><Archive className="w-4 h-4" /></button>) : (<><button onClick={() => handleRestore(s.id)} className="p-2 rounded-lg hover:bg-emerald-50 text-emerald-600" title="Restore"><RotateCcw className="w-4 h-4" /></button><button onClick={() => setConfirmDelete(s.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-600" title="Delete permanently"><Trash2 className="w-4 h-4" /></button></>)}
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4"><Trash2 className="w-6 h-6 text-red-600" /></div>
            <h3 className="text-lg font-bold text-[#0c1a33] mb-2">Delete Shipment Permanently?</h3>
            <p className="text-sm text-slate-600 mb-6">This action cannot be undone. The shipment and all its checkpoints and simulation data will be permanently removed. Ensure this complies with your data retention requirements.</p>
            <div className="flex gap-3"><button onClick={() => setConfirmDelete(null)} className="btn-ghost flex-1 border border-slate-300">Cancel</button><button onClick={() => handleDelete(confirmDelete)} className="flex-1 px-4 py-2.5 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors">Delete Permanently</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
