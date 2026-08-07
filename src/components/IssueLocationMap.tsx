'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface IssueLocationMapProps {
  lat: number;
  lng: number;
  title?: string;
}

export default function IssueLocationMap({ lat, lng, title }: IssueLocationMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [lat, lng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap',
    }).addTo(map);

    const icon = L.divIcon({
      className: 'custom-loc-marker',
      html: `
        <div style="
          width: 20px;
          height: 20px;
          background: #06b6d4;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 12px #06b6d480;
        "></div>
      `,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });

    L.marker([lat, lng], { icon })
      .bindPopup(`<div style="background:#ffffff;color:#1a1a2e;padding:8px;border-radius:6px;font-size:12px;border:1px solid #e5e7eb;">${title || `${lat.toFixed(4)}, ${lng.toFixed(4)}`}</div>`, { className: 'dark-popup' })
      .addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [lat, lng, title]);

  return (
    <div className="relative rounded-xl overflow-hidden border border-white/10">
      <div ref={containerRef} className="w-full h-full min-h-[200px]" />
      <style jsx global>{`
        .custom-loc-marker { background: transparent !important; border: none !important; }
        .dark-popup .leaflet-popup-content-wrapper { background: transparent; box-shadow: none; padding: 0; }
        .dark-popup .leaflet-popup-content { margin: 0; }
        .dark-popup .leaflet-popup-tip { background: #ffffff; }
      `}</style>
    </div>
  );
}
