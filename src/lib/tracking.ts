import { supabase } from './supabase';

export function generateTrackingNumber(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(17);
  crypto.getRandomValues(bytes);
  let result = '';
  for (let i = 0; i < 17; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function getAssetImageUrl(path: string | null): string | null {
  if (!path) return null;
  const { data } = supabase.storage.from('asset-images').getPublicUrl(path);
  return data.publicUrl;
}

export function classNames(...classes: (string | false | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function getStatusColor(status: string): string {
  const delivered = ['Delivered'];
  const inTransit = ['Dispatched', 'In Transit', 'Arrived at Transit Hub', 'Arrived at Destination Facility', 'Out for Secure Delivery'];
  const customs = ['Customs Processing', 'Customs Cleared'];
  const exception = ['Shipment On Hold', 'Documentation Required', 'Delivery Rescheduled', 'Shipment Cancelled'];
  const initial = ['Shipment Registered', 'Awaiting Collection', 'Asset Collected', 'Processing at Origin Facility'];

  if (delivered.includes(status)) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
  if (inTransit.includes(status)) return 'text-blue-700 bg-blue-50 border-blue-200';
  if (customs.includes(status)) return 'text-amber-700 bg-amber-50 border-amber-200';
  if (exception.includes(status)) return 'text-red-700 bg-red-50 border-red-200';
  if (initial.includes(status)) return 'text-slate-700 bg-slate-100 border-slate-200';
  return 'text-slate-700 bg-slate-100 border-slate-200';
}
