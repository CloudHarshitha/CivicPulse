'use client';

import { useEffect, useRef, useState } from 'react';
import { Issue } from '@/types';
import { getCategoryInfo } from '@/lib/scoring';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface IssueMapProps {
  issues: Issue[];
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (issue: Issue) => void;
  height?: string;
  showUserLocation?: boolean;
  userLocation?: [number, number] | null;
}

// Custom marker icons
function getCategoryColor(category: string): string {
  switch (category) {
    case 'roads': return '#f97316';
    case 'sanitation': return '#22c55e';
    case 'electricity': return '#eab308';
    case 'water_sewage': return '#3b82f6';
    default: return '#6b7280';
  }
}

function getPrioritySize(priority: string): number {
  switch (priority) {
    case 'critical': return 14;
    case 'medium': return 11;
    case 'low': return 9;
    default: return 10;
  }
}

function createCustomIcon(category: string, priority: string): L.DivIcon {
  const color = getCategoryColor(category);
  const size = getPrioritySize(priority);
  const pulseClass = priority === 'critical' ? 'animate-pulse' : '';

  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${size * 2}px;
        height: ${size * 2}px;
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        box-shadow: 0 0 ${priority === 'critical' ? '12' : '6'}px ${color}80;
        position: relative;
      " class="${pulseClass}">
        <div style="
          position: absolute;
          bottom: -8px;
          left: 50%;
          transform: translateX(-50%);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 8px solid ${color};
        "></div>
      </div>
    `,
    iconSize: [size * 2, size * 2 + 8],
    iconAnchor: [size, size * 2 + 8],
    popupAnchor: [0, -(size * 2 + 8)],
  });
}

export default function IssueMap({
  issues,
  center = [28.5244, 77.2066],
  zoom = 13,
  onMarkerClick,
  height = '500px',
  showUserLocation = true,
  userLocation = null,
}: IssueMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: center,
      zoom: zoom,
      zoomControl: false,
      attributionControl: false,
    });

    // Light tile layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Add zoom control to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Add attribution
    L.control.attribution({ position: 'bottomleft', prefix: false })
      .addAttribution('&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>')
      .addTo(map);

    mapRef.current = map;
    markersRef.current = L.layerGroup().addTo(map);
    setIsMapReady(true);

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
    };
  }, []);

  // Update markers when issues change
  useEffect(() => {
    if (!isMapReady || !markersRef.current || !mapRef.current) return;

    markersRef.current.clearLayers();

    issues.forEach(issue => {
      if (!issue.latitude || !issue.longitude) return;

      const icon = createCustomIcon(issue.category, issue.priority);
      const info = getCategoryInfo(issue.category);
      const statusColor = issue.status === 'resolved' ? '#22c55e' : issue.status === 'in_progress' ? '#f59e0b' : '#3b82f6';

      const marker = L.marker([issue.latitude, issue.longitude], { icon })
        .bindPopup(`
          <div style="
            background: #ffffff;
            color: #1a1a2e;
            padding: 12px;
            border-radius: 8px;
            min-width: 200px;
            font-family: 'Inter', sans-serif;
            border: 1px solid #e5e7eb;
          ">
            <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 6px 0; line-height: 1.3; color: #1a1a2e;">
              ${issue.title}
            </h3>
            <div style="display: flex; gap: 6px; margin-bottom: 8px; flex-wrap: wrap;">
              <span style="
                background: ${getCategoryColor(issue.category)}30;
                color: ${getCategoryColor(issue.category)};
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 500;
              ">${info.label}</span>
              <span style="
                background: ${statusColor}30;
                color: ${statusColor};
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: 500;
                text-transform: capitalize;
              ">${issue.status.replace('_', ' ')}</span>
            </div>
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
              👍 ${issue.upvote_count} upvotes · APS: ${issue.action_priority_score.toFixed(1)}
            </div>
            <div style="font-size: 11px; color: #9ca3af;">
              ${issue.address || `${issue.latitude.toFixed(4)}, ${issue.longitude.toFixed(4)}`}
            </div>
          </div>
        `, {
          className: 'dark-popup',
          closeButton: true,
          maxWidth: 280,
        });

      if (onMarkerClick) {
        marker.on('click', () => onMarkerClick(issue));
      }

      markersRef.current?.addLayer(marker);
    });

    // Add user location marker
    if (showUserLocation && userLocation) {
      const userIcon = L.divIcon({
        className: 'user-marker',
        html: `
          <div style="
            width: 16px;
            height: 16px;
            background: #06b6d4;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 0 16px #06b6d480;
          ">
            <div style="
              position: absolute;
              top: -3px;
              left: -3px;
              width: 22px;
              height: 22px;
              background: #06b6d420;
              border-radius: 50%;
              animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
            "></div>
          </div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      L.marker(userLocation, { icon: userIcon })
        .bindPopup('<div style="background:#ffffff;color:#1a1a2e;padding:8px;border-radius:6px;font-size:12px;border:1px solid #e5e7eb;">📍 Your Location</div>', { className: 'dark-popup' })
        .addTo(markersRef.current);
    }

    // Fit bounds if we have issues
    if (issues.length > 0) {
      const bounds = L.latLngBounds(
        issues
          .filter(i => i.latitude && i.longitude)
          .map(i => [i.latitude, i.longitude] as [number, number])
      );
      
      // Always ensure the user's location is visible in the bounds!
      if (showUserLocation && userLocation) {
        bounds.extend(userLocation);
      }

      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
      }
    } else if (showUserLocation && userLocation) {
      // If there are no issues, just center directly on the user
      mapRef.current.setView(userLocation, 14);
    }
  }, [issues, isMapReady, onMarkerClick, showUserLocation, userLocation]);

  return (
    <div className="relative rounded overflow-hidden border border-[#d1d5db]" style={{ height }}>
      <div ref={mapContainerRef} className="w-full h-full" />
      {/* Map legend */}
      <div className="absolute top-3 left-3 z-[1000] bg-white rounded-lg p-3 border border-[#d1d5db] shadow-sm">
        <div className="text-xs font-semibold text-[#1a1a2e] mb-2">Categories</div>
        {['roads', 'sanitation', 'electricity', 'water_sewage'].map(cat => {
          const info = getCategoryInfo(cat);
          return (
            <div key={cat} className="flex items-center gap-2 text-xs text-[#374151] mb-1">
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: getCategoryColor(cat) }}
              />
              {info.label}
            </div>
          );
        })}
      </div>
      <style jsx global>{`
        .dark-popup .leaflet-popup-content-wrapper {
          background: transparent;
          box-shadow: none;
          padding: 0;
        }
        .dark-popup .leaflet-popup-content {
          margin: 0;
        }
        .dark-popup .leaflet-popup-tip {
          background: #ffffff;
        }
        .custom-marker {
          background: transparent !important;
          border: none !important;
        }
        .user-marker {
          background: transparent !important;
          border: none !important;
        }
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
