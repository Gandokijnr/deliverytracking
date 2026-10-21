import { useState, useEffect, useCallback } from 'react';
import { useSearch, useNavigate, Link } from '@tanstack/react-router';
import { supabase, SUPABASE_URL } from '@/lib/supabase';
import type { PublicShipment, PublicCheckpoint } from '@/lib/types';
import {
  Search, Package, MapPin, Calendar, Clock, AlertCircle, ArrowRight,
  CheckCircle2, Truck, Building2, Plane, Shield, FileText, MessageSquare,
  ChevronRight, Info, Image as ImageIcon,
} from 'lucide-react';
import { formatDate, formatDateTime, getAssetImageUrl, classNames, getStatusColor } from '@/lib/tracking';
import { SHIPMENT_STATUSES, EXCEPTION_STATUSES } from '@/lib/constants';
import RouteMap from '@/components/RouteMap';

const ALL_STATUSES = [...SHIPMENT_STATUSES, ...EXCEPTION_STATUSES];

export default function Track() {
  const search = useSearch({ strict: false }) as { t?: string };
  const navigate = useNavigate();
  const [trackingNumber, setTrackingNumber] = useState(search.t || '');
  const [shipment, setShipment] = useState<PublicShipment | null>(null);
  const [checkpoints, setCheckpoints] = useState<PublicCheckpoint[]>([]);
  const [simulation, setSimulation] = useState<{ progress: number; is_playing: boolean } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const fetchShipment = useCallback(async (trackingNum: string) => {
    setLoading(true);
    setError(null);
    setShipment(null);
    setCheckpoints([]);
    setSimulation(null);
    try {
      // This endpoint is public (verify_jwt = false). A plain GET also avoids
      // a CORS preflight that can hide deployment errors from the browser.
      const response = await fetch(`${SUPABASE_URL}/functions/v1/public-portal?tracking=${encodeURIComponent(trackingNum.trim().toUpperCase())}`);
      const data = await response.json();
      if (!response.ok) {
        if (data?.code === 'NOT_FOUND') {
          setError('Public tracking is not configured yet. Please contact support so the tracking service can be deployed.');
        } else if (response.status === 404) {
          setError('No shipment found with that tracking number. Please check and try again.');
        } else {
          setError('Unable to retrieve shipment information. Please try again later.');
        }
        setSearched(true);
        return;
      }
      if (!data || !data.tracking_number) {
        setError('No shipment found with that tracking number.');
        setSearched(true);
        return;
      }
      setShipment(data as PublicShipment);
      setCheckpoints((data.checkpoints || []) as PublicCheckpoint[]);
      setSimulation(data.simulation || null);
      setSearched(true);
    } catch {
      setError('Network error. Please check your connection and try again.');
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (search.t) {
      setTrackingNumber(search.t);
      fetchShipment(search.t);
    }
  }, [search.t, fetchShipment]);

  const activeTracking = shipment?.tracking_number;
  useEffect(() => {
    if (!activeTracking) return;
    const controller = new AbortController();
    let pending = false;
    const refresh = async () => {
      if (pending || document.hidden) return;
      pending = true;
      try {
        const response = await fetch(`${SUPABASE_URL}/functions/v1/public-portal?tracking=${encodeURIComponent(activeTracking)}`, { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        if (controller.signal.aborted || data.tracking_number !== activeTracking) return;
        setShipment(data as PublicShipment);
        setCheckpoints(data.checkpoints || []);
        setSimulation(data.simulation || null);
      } catch {
        // Keep the last loaded position during a temporary connection failure.
      } finally { pending = false; }
    };
    const interval = window.setInterval(refresh, 15000);
    window.addEventListener('focus', refresh);
    return () => {
      controller.abort();
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
    };
  }, [activeTracking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (trackingNumber.trim()) {
      navigate({ to: '/track', search: { t: trackingNumber.trim().toUpperCase() } });
      fetchShipment(trackingNumber.trim().toUpperCase());
    }
  };

  const currentStatusIndex = shipment ? (ALL_STATUSES as readonly string[]).indexOf(shipment.current_status) : -1;
  const isDelivered = shipment?.current_status === 'Delivered';
  const isException = shipment && (EXCEPTION_STATUSES as readonly string[]).includes(shipment.current_status);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50">
      {/* Search Header */}
      <div className="bg-[#0c1a33] text-white py-8 lg:py-12">
        <div className="container-mx">
          <h1 className="text-2xl lg:text-3xl font-bold mb-2 flex items-center gap-2">
            <Package className="w-7 h-7 text-[#c9a227]" />
            Track Your Shipment
          </h1>
          <p className="text-slate-300 text-sm mb-6">Enter your 17-character tracking number to view your shipment status.</p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-2xl">
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
              placeholder="e.g. MVK7X2NP9QRST4YZK"
              maxLength={17}
              className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-400 font-mono text-lg tracking-wider uppercase focus:outline-none focus:border-[#c9a227] focus:ring-2 focus:ring-[#c9a227]/30"
            />
            <button type="submit" disabled={loading} className="btn-primary whitespace-nowrap">
              {loading ? (
                <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Searching...</>
              ) : (
                <><Search className="w-5 h-5" /> Track Shipment</>
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="container-mx py-8">
        {error && (
          <div className="max-w-4xl mx-auto card p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-[#0c1a33] mb-2">Unable to Display Tracking</h3>
            <p className="text-slate-600 mb-6">{error}</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/support" className="btn-ghost border border-slate-300">
                <MessageSquare className="w-4 h-4" />
                Contact Support
              </Link>
            </div>
          </div>
        )}

        {shipment && !error && (
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Shipment Overview */}
            <div className="card p-6 lg:p-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                <div>
                  <span className="text-xs font-semibold text-[#c9a227] uppercase tracking-widest">Tracking Number</span>
                  <h2 className="text-2xl lg:text-3xl font-bold text-[#0c1a33] font-mono tracking-wider mt-1">{shipment.tracking_number}</h2>
                </div>
                <div className={`px-4 py-2 rounded-lg border font-semibold text-sm ${getStatusColor(shipment.current_status)}`}>
                  {shipment.current_status}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                    <Package className="w-4 h-4 text-[#c9a227]" />
                    Asset Category
                  </div>
                  <p className="font-semibold text-[#0c1a33] text-sm">{shipment.asset_category}</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                    <MapPin className="w-4 h-4 text-[#c9a227]" />
                    Origin
                  </div>
                  <p className="font-semibold text-[#0c1a33] text-sm">{shipment.origin_city}, {shipment.origin_country}</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                    <MapPin className="w-4 h-4 text-[#c9a227]" />
                    Destination
                  </div>
                  <p className="font-semibold text-[#0c1a33] text-sm">{shipment.destination_city}, {shipment.destination_country}</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                    <Calendar className="w-4 h-4 text-[#c9a227]" />
                    Estimated Delivery
                  </div>
                  <p className="font-semibold text-[#0c1a33] text-sm">{formatDate(shipment.estimated_delivery_date)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="p-4 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                    <Calendar className="w-4 h-4 text-[#c9a227]" />
                    Dispatch Date
                  </div>
                  <p className="font-semibold text-[#0c1a33] text-sm">{formatDate(shipment.dispatch_date)}</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                    <Clock className="w-4 h-4 text-[#c9a227]" />
                    Last Updated
                  </div>
                  <p className="font-semibold text-[#0c1a33] text-sm">{formatDateTime(shipment.updated_at)}</p>
                </div>
                <div className="p-4 rounded-lg bg-slate-50">
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
                    <ChevronRight className="w-4 h-4 text-[#c9a227]" />
                    Last Checkpoint
                  </div>
                  <p className="font-semibold text-[#0c1a33] text-sm">{checkpoints.length > 0 ? checkpoints[0].location || checkpoints[0].status : 'No checkpoints yet'}</p>
                </div>
              </div>
            </div>

            {/* Asset Details */}
            <div className="card p-6 lg:p-8">
              <h3 className="text-lg font-bold text-[#0c1a33] mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#c9a227]" />
                Asset Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {shipment.asset_image_path ? (
                  <div className="md:col-span-1">
                    <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-square">
                      <img
                        src={getAssetImageUrl(shipment.asset_image_path) || ''}
                        alt="Approved asset photograph"
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    </div>
                    <p className="text-xs text-slate-400 mt-2 text-center">Approved Asset Photograph</p>
                  </div>
                ) : (
                  <div className="md:col-span-1">
                    <div className="rounded-xl bg-slate-100 aspect-square flex items-center justify-center">
                      <div className="text-center text-slate-400">
                        <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                        <p className="text-sm">No photograph available</p>
                      </div>
                    </div>
                  </div>
                )}
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Asset Category</span>
                    <p className="font-semibold text-[#0c1a33] mt-1">{shipment.asset_category}</p>
                  </div>
                  {shipment.asset_description && (
                    <div>
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">General Description</span>
                      <p className="text-slate-700 mt-1 text-sm leading-relaxed">{shipment.asset_description}</p>
                    </div>
                  )}
                  <div className="p-3 rounded-lg bg-amber-50 border border-amber-200">
                    <p className="text-xs text-amber-800 flex items-start gap-2">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      For security reasons, declared values, exact addresses, and confidential handling details are not displayed publicly.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipment Progress */}
            <div className="card p-6 lg:p-8">
              <h3 className="text-lg font-bold text-[#0c1a33] mb-6 flex items-center gap-2">
                <Truck className="w-5 h-5 text-[#c9a227]" />
                Shipment Progress
              </h3>

              <p className="text-xs text-amber-700 mb-4">Simulated map position set by the administrator. Updates automatically every 15 seconds. Not live GPS.</p>
              <div className="mb-6">                <RouteMap
                  originLat={shipment.origin_lat}
                  originLng={shipment.origin_lng}
                  destinationLat={shipment.destination_lat}
                  destinationLng={shipment.destination_lng}
                  progress={simulation?.progress || 0}
                  originLabel={`${shipment.origin_city}, ${shipment.origin_country}`}
                  destinationLabel={`${shipment.destination_city}, ${shipment.destination_country}`}
                  isPlaying={false}
                /></div>
              <h4 className="font-semibold text-[#0c1a33] mb-4">Verified shipment status</h4>
              {isException ? (
                <div className={`p-4 rounded-lg border ${getStatusColor(shipment.current_status)}`}>
                  <p className="font-semibold">{shipment.current_status}</p>
                  <p className="text-sm mt-1 opacity-80">This shipment has an exception status. Please contact support for more information.</p>
                </div>
              ) : (
                <div className="overflow-x-auto pb-2">
                  <div className="flex items-center min-w-max">
                    {SHIPMENT_STATUSES.map((status, idx) => {
                      const isCompleted = isDelivered || idx < currentStatusIndex;
                      const isCurrent = idx === currentStatusIndex && !isDelivered;
                      return (
                        <div key={status} className="flex items-center">
                          <div className="flex flex-col items-center w-28">
                            <div className={classNames(
                              'w-9 h-9 rounded-full flex items-center justify-center transition-all',
                              isCompleted ? 'bg-emerald-500 text-white' : '',
                              isCurrent ? 'bg-[#c9a227] text-white ring-4 ring-[#c9a227]/20' : '',
                              !isCompleted && !isCurrent ? 'bg-slate-200 text-slate-400' : '',
                            )}>
                              {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-xs font-bold">{idx + 1}</span>}
                            </div>
                            <span className={classNames(
                              'text-[10px] text-center mt-2 leading-tight',
                              isCompleted || isCurrent ? 'text-[#0c1a33] font-semibold' : 'text-slate-400',
                            )}>
                              {status}
                            </span>
                          </div>
                          {idx < SHIPMENT_STATUSES.length - 1 && (
                            <div className={classNames(
                              'h-1 w-8 transition-all',
                              isCompleted ? 'bg-emerald-500' : 'bg-slate-200',
                            )} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Checkpoint History */}
            <div className="card p-6 lg:p-8">
              <h3 className="text-lg font-bold text-[#0c1a33] mb-6 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#c9a227]" />
                Checkpoint History
              </h3>

              {checkpoints.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-8">No checkpoints have been recorded yet for this shipment.</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
                  <div className="space-y-6">
                    {checkpoints.map((cp, idx) => (
                      <div key={cp.id} className="relative pl-12">
                        <div className={classNames(
                          'absolute left-2.5 w-5 h-5 rounded-full border-2 flex items-center justify-center',
                          idx === 0 ? 'bg-[#c9a227] border-[#c9a227]' : 'bg-white border-slate-300',
                        )}>
                          {idx === 0 && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div className="card p-4 hover:shadow-md transition-shadow">
                          <div className="flex flex-wrap items-center gap-3 mb-2">
                            <span className={classNames('px-2.5 py-1 rounded-full text-xs font-semibold border', getStatusColor(cp.status))}>
                              {cp.status}
                            </span>
                            {cp.location && (
                              <span className="text-sm text-slate-600 flex items-center gap-1">
                                <MapPin className="w-3.5 h-3.5 text-[#c9a227]" />
                                {cp.location}
                              </span>
                            )}
                          </div>
                          {cp.description && <p className="text-sm text-slate-600 leading-relaxed mb-2">{cp.description}</p>}
                          <p className="text-xs text-slate-400 flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDateTime(cp.checkpoint_date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Contact Support CTA */}
            <div className="rounded-2xl bg-gradient-to-r from-[#112342] to-[#1e3a6f] p-6 lg:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold mb-1">Questions about this shipment?</h3>
                <p className="text-sm text-slate-300">Our support team can help with inquiries about your valuable asset shipment.</p>
              </div>
              <Link
                to="/support"
                search={{ t: shipment.tracking_number }}
                className="btn-primary whitespace-nowrap"
              >
                <MessageSquare className="w-5 h-5" />
                Contact Support About This Shipment
              </Link>
            </div>
          </div>
        )}

        {!shipment && !error && !loading && !searched && (
          <div className="max-w-2xl mx-auto text-center py-16">
            <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-6">
              <Search className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-[#0c1a33] mb-2">Enter Your Tracking Number</h3>
            <p className="text-slate-500">Your 17-character tracking number was provided when your shipment was arranged.</p>
          </div>
        )}
      </div>
    </div>
  );
}
