import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { supabase } from '@/lib/supabase';
import { generateTrackingNumber } from '@/lib/tracking';
import { ASSET_CATEGORIES, CURRENCIES, COUNTRIES, PACKAGING_TYPES, SHIPMENT_STATUSES } from '@/lib/constants';
import type { Shipment } from '@/lib/types';
import { Package, Save, Copy, Check, ArrowLeft, Upload, X, AlertCircle, Shield } from 'lucide-react';

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  'New York': { lat: 40.7128, lng: -74.0060 }, 'Los Angeles': { lat: 34.0522, lng: -118.2437 }, 'Miami': { lat: 25.7617, lng: -80.1918 },
  'London': { lat: 51.5074, lng: -0.1278 }, 'Frankfurt': { lat: 50.1109, lng: 8.6821 }, 'Paris': { lat: 48.8566, lng: 2.3522 },
  'Zurich': { lat: 47.3769, lng: 8.5417 }, 'Dubai': { lat: 25.2048, lng: 55.2708 }, 'Singapore': { lat: 1.3521, lng: 103.8198 },
  'Tokyo': { lat: 35.6762, lng: 139.6503 }, 'Warsaw': { lat: 52.2297, lng: 21.0122 }, 'Amsterdam': { lat: 52.3676, lng: 4.9041 },
  'Brussels': { lat: 50.8503, lng: 4.3517 }, 'Luxembourg': { lat: 49.6116, lng: 6.1319 }, 'Hong Kong': { lat: 22.3193, lng: 114.1694 },
  'Toronto': { lat: 43.6532, lng: -79.3832 }, 'Sydney': { lat: -33.8688, lng: 151.2093 }, 'Milan': { lat: 45.4642, lng: 9.1900 },
  'Madrid': { lat: 40.4168, lng: -3.7038 }, 'Vienna': { lat: 48.2082, lng: 16.3738 }, 'Stockholm': { lat: 59.3293, lng: 18.0686 }, 'Oslo': { lat: 59.9139, lng: 10.7522 },
};

const initialState = {
  sender_name: '', sender_email: '', sender_phone: '', recipient_name: '', recipient_email: '', recipient_phone: '',
  asset_category: ASSET_CATEGORIES[0] as string, asset_description: '', asset_image_path: '',
  packaging_type: PACKAGING_TYPES[0] as string, weight: '', declared_value: '', currency: 'USD', special_handling_notes: '',
  origin_country: COUNTRIES[0] as string, origin_city: '', origin_address: '',
  destination_country: COUNTRIES[0] as string, destination_city: '', destination_address: '',
  dispatch_date: '', estimated_delivery_date: '', current_status: SHIPMENT_STATUSES[0] as string,
};

function Field({ label, value, onChange, type = 'text', required, placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; placeholder?: string }) {
  return (<div><label className="block text-sm font-medium text-[#0c1a33] mb-1.5">{label}</label><input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input-field" /></div>);
}
function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (<div><label className="block text-sm font-medium text-[#0c1a33] mb-1.5">{label}</label><select value={value} onChange={(e) => onChange(e.target.value)} className="input-field">{options.map((o) => <option key={o} value={o}>{o}</option>)}</select></div>);
}

export default function AdminShipmentNew() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialState);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdTracking, setCreatedTracking] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const update = (field: string, value: string) => setForm({ ...form, [field]: value });
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); } };
  const clearImage = () => { setImageFile(null); setImagePreview(null); };
  const copyTracking = () => { if (createdTracking) { navigator.clipboard.writeText(createdTracking); setCopied(true); setTimeout(() => setCopied(false), 2000); } };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.sender_name || !form.recipient_name || !form.origin_city || !form.destination_city) { setError('Please fill in all required fields.'); return; }
    setSaving(true); setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const adminId = session?.user?.id;
      let trackingNumber = generateTrackingNumber();
      for (let i = 0; i < 5; i++) { const { data: existing } = await supabase.from('shipments').select('id').eq('tracking_number', trackingNumber).maybeSingle(); if (!existing) break; trackingNumber = generateTrackingNumber(); }

      let imagePath = '';
      if (imageFile) { const ext = imageFile.name.split('.').pop(); imagePath = `${trackingNumber}.${ext}`; const { error: uploadError } = await supabase.storage.from('asset-images').upload(imagePath, imageFile); if (uploadError) throw uploadError; }

      const originCoords = CITY_COORDS[form.origin_city] || null;
      const destCoords = CITY_COORDS[form.destination_city] || null;
      const shipmentData: Partial<Shipment> = {
        tracking_number: trackingNumber, sender_name: form.sender_name, sender_email: form.sender_email || null, sender_phone: form.sender_phone || null,
        recipient_name: form.recipient_name, recipient_email: form.recipient_email || null, recipient_phone: form.recipient_phone || null,
        asset_category: form.asset_category, asset_description: form.asset_description || null, asset_image_path: imagePath || null,
        packaging_type: form.packaging_type, weight: form.weight || null, declared_value: form.declared_value ? parseFloat(form.declared_value) : null,
        currency: form.currency, special_handling_notes: form.special_handling_notes || null,
        origin_country: form.origin_country, origin_city: form.origin_city, origin_address: form.origin_address || null, origin_lat: originCoords?.lat || null, origin_lng: originCoords?.lng || null,
        destination_country: form.destination_country, destination_city: form.destination_city, destination_address: form.destination_address || null, destination_lat: destCoords?.lat || null, destination_lng: destCoords?.lng || null,
        dispatch_date: form.dispatch_date || null, estimated_delivery_date: form.estimated_delivery_date || null, current_status: form.current_status, created_by: adminId,
      };

      const { data: shipment, error: insertError } = await supabase.from('shipments').insert(shipmentData).select().single();
      if (insertError) throw insertError;
      await supabase.from('shipment_checkpoints').insert({ shipment_id: shipment.id, status: form.current_status, location: `${form.origin_city}, ${form.origin_country}`, description: 'Shipment registered in the system.', checkpoint_date: new Date().toISOString(), created_by: adminId });
      await supabase.from('admin_audit_logs').insert({ admin_id: adminId, action: 'create_shipment', record_type: 'shipment', record_id: shipment.id, details: { tracking_number: trackingNumber } });
      setCreatedTracking(trackingNumber);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to create shipment. Please try again.'); } finally { setSaving(false); }
  };

  if (createdTracking) {
    return (<div className="max-w-lg mx-auto"><div className="card p-8 text-center"><div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4"><Check className="w-8 h-8 text-emerald-600" /></div><h3 className="text-xl font-bold text-[#0c1a33] mb-2">Shipment Created Successfully</h3><p className="text-sm text-slate-500 mb-6">The shipment has been registered. Share this tracking number with the customer.</p><div className="p-4 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 mb-6"><p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Tracking Number</p><p className="text-2xl font-bold font-mono text-[#0c1a33] tracking-wider">{createdTracking}</p></div><button onClick={copyTracking} className="btn-navy w-full mb-3">{copied ? <><Check className="w-5 h-5" /> Copied!</> : <><Copy className="w-5 h-5" /> Copy Tracking Number</>}</button><button onClick={() => navigate({ to: '/admin/shipments' })} className="btn-ghost w-full border border-slate-300">Back to Shipments</button></div></div>);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3"><button onClick={() => navigate({ to: '/admin/shipments' })} className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"><ArrowLeft className="w-5 h-5" /></button><div><h2 className="text-2xl font-bold text-[#0c1a33]">Create New Shipment</h2><p className="text-sm text-slate-500 mt-0.5">Register a new valuable asset shipment</p></div></div>
      {error && <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /> {error}</div>}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="card p-6"><h3 className="font-bold text-[#0c1a33] mb-4 flex items-center gap-2"><Shield className="w-5 h-5 text-[#c9a227]" /> Customer Information <span className="text-xs font-normal text-slate-400 ml-2">Private — admin only</span></h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><Field label="Sender's Full Name *" value={form.sender_name} onChange={(v) => update('sender_name', v)} required /><Field label="Sender's Email" type="email" value={form.sender_email} onChange={(v) => update('sender_email', v)} /><Field label="Sender's Phone" value={form.sender_phone} onChange={(v) => update('sender_phone', v)} /><Field label="Recipient's Full Name *" value={form.recipient_name} onChange={(v) => update('recipient_name', v)} required /><Field label="Recipient's Email" type="email" value={form.recipient_email} onChange={(v) => update('recipient_email', v)} /><Field label="Recipient's Phone" value={form.recipient_phone} onChange={(v) => update('recipient_phone', v)} /></div></div>
        <div className="card p-6"><h3 className="font-bold text-[#0c1a33] mb-4 flex items-center gap-2"><Package className="w-5 h-5 text-[#c9a227]" /> Valuable Asset Information</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><SelectField label="Asset Category *" value={form.asset_category} options={[...ASSET_CATEGORIES]} onChange={(v) => update('asset_category', v)} /><SelectField label="Packaging Type" value={form.packaging_type} options={[...PACKAGING_TYPES]} onChange={(v) => update('packaging_type', v)} /><div className="sm:col-span-2"><label className="block text-sm font-medium text-[#0c1a33] mb-1.5">Asset Description</label><textarea value={form.asset_description} onChange={(e) => update('asset_description', e.target.value)} className="input-field min-h-[80px] resize-y" placeholder="General description of the asset (public)" /></div><div className="sm:col-span-2"><label className="block text-sm font-medium text-[#0c1a33] mb-1.5">Asset Photograph</label>{imagePreview ? (<div className="relative inline-block"><img src={imagePreview} alt="Preview" className="w-32 h-32 object-cover rounded-lg" /><button type="button" onClick={clearImage} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center"><X className="w-4 h-4" /></button></div>) : (<label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-[#c9a227] transition-colors"><Upload className="w-6 h-6 text-slate-400 mb-1" /><span className="text-xs text-slate-500">Click to upload asset image</span><input type="file" accept="image/*" onChange={handleImageChange} className="hidden" /></label>)}</div><Field label="Approximate Weight" value={form.weight} onChange={(v) => update('weight', v)} placeholder="e.g. 2.5 kg" /><SelectField label="Currency" value={form.currency} options={[...CURRENCIES]} onChange={(v) => update('currency', v)} /><Field label="Declared Value (Private)" type="number" value={form.declared_value} onChange={(v) => update('declared_value', v)} placeholder="0.00" /><div className="sm:col-span-2"><label className="block text-sm font-medium text-[#0c1a33] mb-1.5">Special Handling Notes (Private)</label><textarea value={form.special_handling_notes} onChange={(e) => update('special_handling_notes', e.target.value)} className="input-field min-h-[60px] resize-y" placeholder="Internal handling notes — never shown publicly" /></div></div></div>
        <div className="card p-6"><h3 className="font-bold text-[#0c1a33] mb-4">Shipping Information</h3><div className="grid grid-cols-1 sm:grid-cols-2 gap-4"><SelectField label="Origin Country *" value={form.origin_country} options={[...COUNTRIES]} onChange={(v) => update('origin_country', v)} /><SelectField label="Destination Country *" value={form.destination_country} options={[...COUNTRIES]} onChange={(v) => update('destination_country', v)} /><Field label="Origin City *" value={form.origin_city} onChange={(v) => update('origin_city', v)} required placeholder="e.g. New York" /><Field label="Destination City *" value={form.destination_city} onChange={(v) => update('destination_city', v)} required placeholder="e.g. London" /><Field label="Collection Address" value={form.origin_address} onChange={(v) => update('origin_address', v)} /><Field label="Delivery Address" value={form.destination_address} onChange={(v) => update('destination_address', v)} /><Field label="Dispatch Date" type="date" value={form.dispatch_date} onChange={(v) => update('dispatch_date', v)} /><Field label="Estimated Delivery Date" type="date" value={form.estimated_delivery_date} onChange={(v) => update('estimated_delivery_date', v)} /><SelectField label="Initial Status" value={form.current_status} options={[...SHIPMENT_STATUSES]} onChange={(v) => update('current_status', v)} /></div></div>
        <div className="flex gap-3"><button type="button" onClick={() => navigate({ to: '/admin/shipments' })} className="btn-ghost border border-slate-300 flex-1">Cancel</button><button type="submit" disabled={saving} className="btn-navy flex-1">{saving ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</> : <><Save className="w-5 h-5" /> Create Shipment</>}</button></div>
      </form>
    </div>
  );
}
