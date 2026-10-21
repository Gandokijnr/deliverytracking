import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from '@tanstack/react-router';
import { supabase } from '@/lib/supabase';
import type { Shipment, ShipmentCheckpoint, ShipmentSimulation } from '@/lib/types';
import { SHIPMENT_STATUSES, EXCEPTION_STATUSES, ASSET_CATEGORIES, CURRENCIES, COUNTRIES, PACKAGING_TYPES } from '@/lib/constants';
import { formatDate, formatDateTime, getAssetImageUrl, classNames, getStatusColor } from '@/lib/tracking';
import RouteMap from '@/components/RouteMap';
import { ArrowLeft, Save, Plus, MapPin, Clock, FileText, Truck, Play, Pause, RotateCcw, Shield, Package, AlertCircle, Edit3, Archive } from 'lucide-react';

const ALL_STATUSES = [...SHIPMENT_STATUSES, ...EXCEPTION_STATUSES];

export default function AdminShipmentDetail() {
  const { id } = useParams({ strict: false }) as { id: string };
  const navigate = useNavigate();
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [checkpoints, setCheckpoints] = useState<ShipmentCheckpoint[]>([]);
  const [simulation, setSimulation] = useState<ShipmentSimulation | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Shipment>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cpForm, setCpForm] = useState({ status: '', location: '', description: '', internal_note: '', update_shipment_status: true });
  const [addingCp, setAddingCp] = useState(false);
  const [simProgress, setSimProgress] = useState(0);
  const [simPlaying, setSimPlaying] = useState(false);
  const [simSaving, setSimSaving] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const { data: s } = await supabase.from('shipments').select('*').eq('id', id).maybeSingle();
    if (!s) { setError('Shipment not found.'); setLoading(false); return; }
    setShipment(s as Shipment); setEditForm(s as Shipment);
    const { data: cps } = await supabase.from('shipment_checkpoints').select('*').eq('shipment_id', id).order('checkpoint_date', { ascending: false });
    setCheckpoints((cps || []) as ShipmentCheckpoint[]);
    const { data: sim } = await supabase.from('shipment_simulations').select('*').eq('shipment_id', id).maybeSingle();
    if (sim) { setSimulation(sim as ShipmentSimulation); setSimProgress((sim as ShipmentSimulation).progress); setSimPlaying((sim as ShipmentSimulation).is_playing); }
    setLoading(false);
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const channel = supabase.channel(`admin-checkpoints-${id}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'shipment_checkpoints', filter: `shipment_id=eq.${id}` }, (payload) => { setCheckpoints((prev) => [payload.new as ShipmentCheckpoint, ...prev]); }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [id]);

  useEffect(() => {
    if (!simPlaying) return;
    const interval = setInterval(() => { setSimProgress((prev) => { if (prev >= 100) { setSimPlaying(false); return 100; } return Math.min(100, prev + 0.5); }); }, 200);
    return () => clearInterval(interval);
  }, [simPlaying]);

  const handleSaveEdit = async () => { setSaving(true); setError(null); try { const { error: updateError } = await supabase.from('shipments').update(editForm).eq('id', id); if (updateError) throw updateError; setShipment(editForm as Shipment); setEditing(false); } catch { setError('Failed to save changes.'); } finally { setSaving(false); } };

  const handleAddCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpForm.status) return;
    setAddingCp(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await supabase.from('shipment_checkpoints').insert({ shipment_id: id, status: cpForm.status, location: cpForm.location || null, description: cpForm.description || null, internal_note: cpForm.internal_note || null, checkpoint_date: new Date().toISOString(), created_by: session?.user?.id });
      if (cpForm.update_shipment_status) { await supabase.from('shipments').update({ current_status: cpForm.status }).eq('id', id); setShipment((prev) => prev ? { ...prev, current_status: cpForm.status } : prev); }
      await supabase.from('admin_audit_logs').insert({ admin_id: session?.user?.id, action: 'add_checkpoint', record_type: 'shipment', record_id: id, details: { status: cpForm.status, location: cpForm.location } });
      setCpForm({ status: '', location: '', description: '', internal_note: '', update_shipment_status: true }); fetchData();
    } catch { setError('Failed to add checkpoint.'); } finally { setAddingCp(false); }
  };

  const handleSaveSimulation = async () => {
    setSimSaving(true);
    try {
      if (simulation) { await supabase.from('shipment_simulations').update({ progress: simProgress, is_playing: simPlaying, simulated_time: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', simulation.id); }
      else { await supabase.from('shipment_simulations').insert({ shipment_id: id, progress: simProgress, is_playing: simPlaying, simulated_time: new Date().toISOString() }); }
    } catch { setError('Failed to save simulation.'); } finally { setSimSaving(false); }
  };

  const handleArchive = async () => { await supabase.from('shipments').update({ archived_at: new Date().toISOString() }).eq('id', id); navigate({ to: '/admin/shipments' }); };
  const handleRestore = async () => { await supabase.from('shipments').update({ archived_at: null }).eq('id', id); fetchData(); };

  if (loading) return <div className="flex items-center justify-center py-20"><div className="w-10 h-10 border-[3px] border-[#c9a227] border-t-transparent rounded-full animate-spin" /></div>;
  if (!shipment) return <div className="text-center py-20"><AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-2" /><p className="text-slate-500">{error}</p></div>;

  const canShowMap = shipment.origin_lat && shipment.origin_lng && shipment.destination_lat && shipment.destination_lng;
  const currentStatusIndex = ALL_STATUSES.indexOf(shipment.current_status);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3"><button onClick={() => navigate({ to: '/admin/shipments' })} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"><ArrowLeft className="w-5 h-5" /></button><div><h2 className="text-2xl font-bold text-[#0c1a33] font-mono">{shipment.tracking_number}</h2><p className="text-sm text-slate-500 mt-0.5">{shipment.asset_category}</p></div></div>
        <div className="flex items-center gap-2"><span className={classNames('px-3 py-1.5 rounded-lg text-sm font-semibold border', getStatusColor(shipment.current_status))}>{shipment.current_status}</span>{!shipment.archived_at ? <button onClick={handleArchive} className="btn-ghost border border-slate-300 !py-2"><Archive className="w-4 h-4" /> Archive</button> : <button onClick={handleRestore} className="btn-ghost border border-emerald-300 text-emerald-700 !py-2"><RotateCcw className="w-4 h-4" /> Restore</button>}<button onClick={() => setEditing(!editing)} className="btn-navy !py-2"><Edit3 className="w-4 h-4" /> {editing ? 'Cancel' : 'Edit'}</button></div>
      </div>

      {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}</div>}

      {editing ? (
        <div className="card p-6 space-y-4">
          <h3 className="font-bold text-[#0c1a33]">Edit Shipment Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-[#0c1a33] mb-1.5">Sender Name</label><input className="input-field" value={editForm.sender_name || ''} onChange={(e) => setEditForm({ ...editForm, sender_name: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-[#0c1a33] mb-1.5">Sender Email</label><input className="input-field" value={editForm.sender_email || ''} onChange={(e) => setEditForm({ ...editForm, sender_email: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-[#0c1a33] mb-1.5">Sender Phone</label><input className="input-field" value={editForm.sender_phone || ''} onChange={(e) => setEditForm({ ...editForm, sender_phone: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-[#0c1a33] mb-1.5">Recipient Name</label><input className="input-field" value={editForm.recipient_name || ''} onChange={(e) => setEditForm({ ...editForm, recipient_name: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-[#0c1a33] mb-1.5">Recipient Email</label><input className="input-field" value={editForm.recipient_email || ''} onChange={(e) => setEditForm({ ...editForm, recipient_email: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-[#0c1a33] mb-1.5">Recipient Phone</label><input className="input-field" value={editForm.recipient_phone || ''} onChange={(e) => setEditForm({ ...editForm, recipient_phone: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-[#0c1a33] mb-1.5">Asset Category</label><select className="input-field" value={editForm.asset_category || ''} onChange={(e) => setEditForm({ ...editForm, asset_category: e.target.value })}>{ASSET_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-[#0c1a33] mb-1.5">Packaging Type</label><select className="input-field" value={editForm.packaging_type || ''} onChange={(e) => setEditForm({ ...editForm, packaging_type: e.target.value })}>{PACKAGING_TYPES.map((p) => <option key={p} value={p}>{p}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-[#0c1a33] mb-1.5">Weight</label><input className="input-field" value={editForm.weight || ''} onChange={(e) => setEditForm({ ...editForm, weight: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-[#0c1a33] mb-1.5">Declared Value</label><input type="number" className="input-field" value={editForm.declared_value ?? ''} onChange={(e) => setEditForm({ ...editForm, declared_value: parseFloat(e.target.value) || null })} /></div>
            <div><label className="block text-sm font-medium text-[#0c1a33] mb-1.5">Currency</label><select className="input-field" value={editForm.currency || ''} onChange={(e) => setEditForm({ ...editForm, currency: e.target.value })}>{CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-[#0c1a33] mb-1.5">Origin Country</label><select className="input-field" value={editForm.origin_country || ''} onChange={(e) => setEditForm({ ...editForm, origin_country: e.target.value })}>{COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-[#0c1a33] mb-1.5">Origin City</label><input className="input-field" value={editForm.origin_city || ''} onChange={(e) => setEditForm({ ...editForm, origin_city: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-[#0c1a33] mb-1.5">Destination Country</label><select className="input-field" value={editForm.destination_country || ''} onChange={(e) => setEditForm({ ...editForm, destination_country: e.target.value })}>{COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-[#0c1a33] mb-1.5">Destination City</label><input className="input-field" value={editForm.destination_city || ''} onChange={(e) => setEditForm({ ...editForm, destination_city: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-[#0c1a33] mb-1.5">Dispatch Date</label><input type="date" className="input-field" value={editForm.dispatch_date || ''} onChange={(e) => setEditForm({ ...editForm, dispatch_date: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-[#0c1a33] mb-1.5">Est. Delivery Date</label><input type="date" className="input-field" value={editForm.estimated_delivery_date || ''} onChange={(e) => setEditForm({ ...editForm, estimated_delivery_date: e.target.value })} /></div>
            <div><label className="block text-sm font-medium text-[#0c1a33] mb-1.5">Current Status</label><select className="input-field" value={editForm.current_status || ''} onChange={(e) => setEditForm({ ...editForm, current_status: e.target.value })}>{ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
          </div>
          <div><label className="block text-sm font-medium text-[#0c1a33] mb-1.5">Asset Description (Public)</label><textarea className="input-field min-h-[60px] resize-y" value={editForm.asset_description || ''} onChange={(e) => setEditForm({ ...editForm, asset_description: e.target.value })} /></div>
          <div><label className="block text-sm font-medium text-[#0c1a33] mb-1.5">Special Handling Notes (Private)</label><textarea className="input-field min-h-[60px] resize-y" value={editForm.special_handling_notes || ''} onChange={(e) => setEditForm({ ...editForm, special_handling_notes: e.target.value })} /></div>
          <div className="flex gap-3"><button onClick={() => setEditing(false)} className="btn-ghost border border-slate-300 flex-1">Cancel</button><button onClick={handleSaveEdit} disabled={saving} className="btn-navy flex-1">{saving ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : <><Save className="w-5 h-5" /> Save Changes</>}</button></div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="card p-5"><h3 className="font-bold text-[#0c1a33] mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-[#c9a227]" /> Customer Info</h3><div className="space-y-2 text-sm"><InfoRow label="Sender" value={shipment.sender_name} /><InfoRow label="Sender Email" value={shipment.sender_email} /><InfoRow label="Sender Phone" value={shipment.sender_phone} /><InfoRow label="Recipient" value={shipment.recipient_name} /><InfoRow label="Recipient Email" value={shipment.recipient_email} /><InfoRow label="Recipient Phone" value={shipment.recipient_phone} /></div></div>
            <div className="card p-5"><h3 className="font-bold text-[#0c1a33] mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-[#c9a227]" /> Asset Info</h3>{shipment.asset_image_path && <img src={getAssetImageUrl(shipment.asset_image_path) || ''} alt="Asset" className="w-full h-32 object-cover rounded-lg mb-3" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />}<div className="space-y-2 text-sm"><InfoRow label="Category" value={shipment.asset_category} /><InfoRow label="Packaging" value={shipment.packaging_type} /><InfoRow label="Weight" value={shipment.weight} /><InfoRow label="Declared Value" value={shipment.declared_value ? `${shipment.currency} ${shipment.declared_value.toLocaleString()}` : null} /><InfoRow label="Description" value={shipment.asset_description} /></div></div>
            <div className="card p-5"><h3 className="font-bold text-[#0c1a33] mb-4 flex items-center gap-2"><Truck className="w-5 h-5 text-[#c9a227]" /> Shipping Info</h3><div className="space-y-2 text-sm"><InfoRow label="Origin" value={`${shipment.origin_city}, ${shipment.origin_country}`} /><InfoRow label="Collection Address" value={shipment.origin_address} /><InfoRow label="Destination" value={`${shipment.destination_city}, ${shipment.destination_country}`} /><InfoRow label="Delivery Address" value={shipment.destination_address} /><InfoRow label="Dispatch Date" value={formatDate(shipment.dispatch_date)} /><InfoRow label="Est. Delivery" value={formatDate(shipment.estimated_delivery_date)} /></div></div>
          </div>

          {canShowMap && (
            <div className="card p-6"><h3 className="font-bold text-[#0c1a33] mb-1 flex items-center gap-2"><MapPin className="w-5 h-5 text-[#c9a227]" /> Route Simulation Controls</h3><p className="text-xs text-amber-700 mb-4">Illustrative only — does not create checkpoints or change shipment status.</p><RouteMap originLat={shipment.origin_lat!} originLng={shipment.origin_lng!} destinationLat={shipment.destination_lat!} destinationLng={shipment.destination_lng!} progress={simProgress} originLabel={`${shipment.origin_city}, ${shipment.origin_country}`} destinationLabel={`${shipment.destination_city}, ${shipment.destination_country}`} isPlaying={simPlaying} /><div className="mt-4 space-y-3"><div><label className="block text-sm font-medium text-[#0c1a33] mb-2">Position: {Math.round(simProgress)}%</label><input type="range" min={0} max={100} step={1} value={simProgress} onChange={(e) => setSimProgress(parseFloat(e.target.value))} className="w-full accent-[#c9a227]" /></div><div className="flex flex-wrap gap-2"><button onClick={() => setSimPlaying(!simPlaying)} className={simPlaying ? 'btn-ghost border border-slate-300' : 'btn-navy !py-2'}>{simPlaying ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Play</>}</button><button onClick={() => { setSimProgress(0); setSimPlaying(false); }} className="btn-ghost border border-slate-300 !py-2"><RotateCcw className="w-4 h-4" /> Reset</button><button onClick={handleSaveSimulation} disabled={simSaving} className="btn-primary !py-2">{simSaving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : <><Save className="w-4 h-4" /> Save Position</>}</button></div></div></div>
          )}

          <div className="card p-6"><h3 className="font-bold text-[#0c1a33] mb-4 flex items-center gap-2"><Plus className="w-5 h-5 text-[#c9a227]" /> Add Shipment Update</h3><form onSubmit={handleAddCheckpoint} className="space-y-4"><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><div><label className="block text-sm font-medium text-[#0c1a33] mb-1.5">Status *</label><select required value={cpForm.status} onChange={(e) => setCpForm({ ...cpForm, status: e.target.value })} className="input-field"><option value="">Select status...</option>{ALL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</select></div><div><label className="block text-sm font-medium text-[#0c1a33] mb-1.5">Checkpoint Location</label><input value={cpForm.location} onChange={(e) => setCpForm({ ...cpForm, location: e.target.value })} className="input-field" placeholder="e.g. Frankfurt, Germany" /></div></div><div><label className="block text-sm font-medium text-[#0c1a33] mb-1.5">Description (Public)</label><textarea value={cpForm.description} onChange={(e) => setCpForm({ ...cpForm, description: e.target.value })} className="input-field min-h-[60px] resize-y" placeholder="Description shown on the public tracking timeline" /></div><div><label className="block text-sm font-medium text-[#0c1a33] mb-1.5">Internal Note (Private)</label><textarea value={cpForm.internal_note} onChange={(e) => setCpForm({ ...cpForm, internal_note: e.target.value })} className="input-field min-h-[40px] resize-y" placeholder="Internal note — never shown publicly" /></div><label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" checked={cpForm.update_shipment_status} onChange={(e) => setCpForm({ ...cpForm, update_shipment_status: e.target.checked })} className="w-4 h-4 accent-[#c9a227]" /> Update shipment's current status to match this checkpoint</label><button type="submit" disabled={addingCp} className="btn-navy">{addingCp ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Adding...</> : <><Plus className="w-5 h-5" /> Add Checkpoint</>}</button></form></div>

          <div className="card p-6"><h3 className="font-bold text-[#0c1a33] mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-[#c9a227]" /> Checkpoint History ({checkpoints.length})</h3>{checkpoints.length === 0 ? <p className="text-sm text-slate-500 text-center py-6">No checkpoints recorded yet.</p> : <div className="relative"><div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" /><div className="space-y-4">{checkpoints.map((cp, idx) => (<div key={cp.id} className="relative pl-12"><div className={classNames('absolute left-2.5 w-5 h-5 rounded-full border-2', idx === 0 ? 'bg-[#c9a227] border-[#c9a227]' : 'bg-white border-slate-300')} /><div className="p-4 rounded-lg bg-slate-50"><div className="flex flex-wrap items-center gap-2 mb-1"><span className={classNames('px-2 py-0.5 rounded-full text-xs font-semibold border', getStatusColor(cp.status))}>{cp.status}</span>{cp.location && <span className="text-sm text-slate-600 flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-[#c9a227]" />{cp.location}</span>}</div>{cp.description && <p className="text-sm text-slate-600 mb-1">{cp.description}</p>}{cp.internal_note && <p className="text-xs text-amber-700 bg-amber-50 rounded p-2 mt-2"><strong>Internal:</strong> {cp.internal_note}</p>}<p className="text-xs text-slate-400 flex items-center gap-1 mt-1"><Clock className="w-3.5 h-3.5" />{formatDateTime(cp.checkpoint_date)}</p></div></div>))}</div></div>}</div>
        </>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return <div className="flex justify-between gap-2"><span className="text-slate-500 text-xs">{label}</span><span className="text-[#0c1a33] font-medium text-right text-xs">{value || '—'}</span></div>;
}
