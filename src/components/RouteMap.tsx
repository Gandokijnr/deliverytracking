import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Info } from 'lucide-react';

interface RouteMapProps {
  originLat: number;
  originLng: number;
  destinationLat: number;
  destinationLng: number;
  progress: number;
  originLabel: string;
  destinationLabel: string;
  isPlaying?: boolean;
}

function interpolateLatlng(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
  t: number
): { lat: number; lng: number } {
  return {
    lat: lat1 + (lat2 - lat1) * t,
    lng: lng1 + (lng2 - lng1) * t,
  };
}

export default function RouteMap({
  originLat, originLng, destinationLat, destinationLng,
  progress, originLabel, destinationLabel, isPlaying,
}: RouteMapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width: 800, height: 400 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setSize({ width: rect.width, height: Math.max(300, Math.min(450, rect.width * 0.5)) });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.width * dpr;
    canvas.height = size.height * dpr;
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    ctx.scale(dpr, dpr);

    const w = size.width;
    const h = size.height;

    ctx.clearRect(0, 0, w, h);

    // Background gradient (ocean-like)
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#0c1a33');
    bgGrad.addColorStop(1, '#112342');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Draw subtle grid
    ctx.strokeStyle = 'rgba(201, 162, 39, 0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Calculate positions with padding
    const pad = 60;
    const allLats = [originLat, destinationLat];
    const allLngs = [originLng, destinationLng];
    const minLat = Math.min(...allLats) - 5;
    const maxLat = Math.max(...allLats) + 5;
    const minLng = Math.min(...allLngs) - 10;
    const maxLng = Math.max(...allLngs) + 10;

    const project = (lat: number, lng: number) => {
      const x = pad + ((lng - minLng) / (maxLng - minLng)) * (w - 2 * pad);
      const y = pad + ((maxLat - lat) / (maxLat - minLat)) * (h - 2 * pad);
      return { x, y };
    };

    const origin = project(originLat, originLng);
    const dest = project(destinationLat, destinationLng);

    // Draw route arc
    const midX = (origin.x + dest.x) / 2;
    const midY = (origin.y + dest.y) / 2 - Math.abs(dest.x - origin.x) * 0.2;

    // Full route (dashed)
    ctx.beginPath();
    ctx.moveTo(origin.x, origin.y);
    ctx.quadraticCurveTo(midX, midY, dest.x, dest.y);
    ctx.strokeStyle = 'rgba(201, 162, 39, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Progress portion
    const t = Math.max(0, Math.min(1, progress / 100));
    if (t > 0) {
      const steps = 50;
      ctx.beginPath();
      ctx.moveTo(origin.x, origin.y);
      for (let i = 1; i <= steps * t; i++) {
        const s = i / steps;
        const x = (1 - s) * (1 - s) * origin.x + 2 * (1 - s) * s * midX + s * s * dest.x;
        const y = (1 - s) * (1 - s) * origin.y + 2 * (1 - s) * s * midY + s * s * dest.y;
        ctx.lineTo(x, y);
      }
      ctx.strokeStyle = '#c9a227';
      ctx.lineWidth = 3;
      ctx.stroke();
    }

    // Current position marker
    const currentPos = interpolateLatlng(originLat, originLng, destinationLat, destinationLng, t);
    const currentProjected = project(currentPos.lat, currentPos.lng);

    if (t > 0 && t < 1) {
      // Pulse effect
      const pulseRadius = 16 + Math.sin(Date.now() / 500) * 4;
      ctx.beginPath();
      ctx.arc(currentProjected.x, currentProjected.y, pulseRadius, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(201, 162, 39, 0.15)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(currentProjected.x, currentProjected.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = '#c9a227';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Label
      ctx.fillStyle = '#ffffff';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Current Position', currentProjected.x, currentProjected.y - 20);
    }

    // Origin marker
    ctx.beginPath();
    ctx.arc(origin.x, origin.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#112342';
    ctx.fill();
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#c9a227';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('ORIGIN', origin.x, origin.y - 18);
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(originLabel, origin.x, origin.y + 25);

    // Destination marker
    ctx.beginPath();
    ctx.arc(dest.x, dest.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#0c1a33';
    ctx.fill();
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(dest.x - 4, dest.y);
    ctx.lineTo(dest.x + 4, dest.y);
    ctx.lineTo(dest.x, dest.y - 6);
    ctx.closePath();
    ctx.fillStyle = '#c9a227';
    ctx.fill();

    ctx.fillStyle = '#c9a227';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DESTINATION', dest.x, dest.y - 18);
    ctx.fillStyle = '#ffffff';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(destinationLabel, dest.x, dest.y + 25);
  }, [originLat, originLng, destinationLat, destinationLng, progress, originLabel, destinationLabel, size]);

  // Animation loop for pulse
  useEffect(() => {
    if (!isPlaying) return;
    let raf: number;
    const tick = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const event = new Event('resize');
        window.dispatchEvent(event);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isPlaying]);

  return (
    <div ref={containerRef} className="relative w-full rounded-xl overflow-hidden bg-[#0c1a33] border border-slate-200">
      <canvas ref={canvasRef} className="block w-full" />
      <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-[#0c1a33]/80 backdrop-blur text-xs text-amber-300 flex items-center gap-1.5 border border-amber-500/20">
        <Info className="w-3.5 h-3.5" />
        Illustrative Route Progress — Not Live GPS
      </div>
      <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-[#0c1a33]/80 backdrop-blur text-xs text-slate-300 flex items-center gap-1.5">
        <Navigation className="w-3.5 h-3.5 text-[#c9a227]" />
        Progress: {Math.round(progress)}%
      </div>
    </div>
  );
}
