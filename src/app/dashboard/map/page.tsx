'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useSupabaseData } from '@/lib/supabase-data';
import { Issue, IssueCategory } from '@/types';
import { getCategoryInfo, formatRelativeTime } from '@/lib/scoring';
import { Filter, Layers, X, MapPin, ThumbsUp, Clock, Building2 } from 'lucide-react';
import { useGeolocation } from '@/hooks/useGeolocation';
import { calculateDistance } from '@/lib/geo';

const IssueMap = dynamic(() => import('@/components/maps/issue-map'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-[#e5e7eb] rounded flex items-center justify-center font-mono text-xs font-bold text-[var(--foreground)]">
      Loading Live GIS Map Grid...
    </div>
  ),
});

export default function MapViewPage() {
  const { issues } = useSupabaseData();
  const router = useRouter();
  
  const { coordinates: liveLocation, getLocation, isLoading } = useGeolocation();

  const [selectedCategory, setSelectedCategory] = useState<IssueCategory | ''>('');
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [searchRadiusKm, setSearchRadiusKm] = useState(50);

  useEffect(() => {
    getLocation();
  }, [getLocation]);

  const filteredIssues = useMemo(() => {
    // Prevent filtering and framing issues until we have a GPS lock (or if it fails)
    if (isLoading && !liveLocation) return [];

    let filtered = issues.filter(i => i.status !== 'rejected' && i.latitude && i.longitude);
    
    if (selectedCategory) {
      filtered = filtered.filter(i => i.category === selectedCategory);
    }

    if (liveLocation) {
      filtered = filtered.filter(i => {
        const distMeters = calculateDistance(i.latitude, i.longitude, liveLocation.lat, liveLocation.lng);
        return distMeters / 1000 <= searchRadiusKm;
      });
    }

    return filtered;
  }, [issues, selectedCategory, liveLocation, searchRadiusKm, isLoading]);

  const handleMarkerClick = useCallback((issue: Issue) => {
    setSelectedIssue(issue);
    setShowPanel(true);
  }, []);

  const categories: { value: IssueCategory | ''; label: string }[] = [
    { value: '', label: 'All Categories' },
    { value: 'roads', label: 'Roads' },
    { value: 'sanitation', label: 'Sanitation' },
    { value: 'electricity', label: 'Electricity' },
    { value: 'water_sewage', label: 'Water & Sewage' },
  ];

  return (
    <div className="h-[calc(100vh-120px)] flex flex-col font-sans">
      
      {/* Category filter bar */}
      <div className="flex items-center gap-3 mb-3 px-1 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--foreground)] uppercase tracking-wider shrink-0">
          <Building2 size={14} /> MUNICIPAL GIS
        </div>
        
        <div className="flex gap-1.5 overflow-x-auto pb-1 flex-1">
          {categories.map(cat => {
            const isActive = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-3 py-1 text-xs font-bold rounded-[2px] border transition-colors ${
                  isActive
                    ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                    : 'bg-white text-[#374151] border-[var(--border)] hover:bg-[var(--background)]'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
          
          <select 
            value={searchRadiusKm} 
            onChange={e => setSearchRadiusKm(Number(e.target.value))}
            className="px-3 py-1 text-xs font-bold bg-white text-[var(--foreground)] border border-[var(--border)] rounded-[2px] outline-none"
          >
            <option value={10}>10 km Radius</option>
            <option value={25}>25 km Radius</option>
            <option value={50}>50 km Radius</option>
            <option value={100}>100 km Radius</option>
          </select>
        </div>
        
        <div className="ml-auto flex items-center gap-1.5 text-xs font-mono font-bold text-[var(--foreground)] shrink-0">
          <Layers size={14} />
          {filteredIssues.length} DOCKETS PINNED
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative border border-[var(--border)] rounded-[4px] overflow-hidden">
        {isLoading && !liveLocation ? (
          <div className="absolute inset-0 bg-white/70 z-50 flex flex-col items-center justify-center">
             <p className="text-xs font-mono font-bold text-[var(--foreground)]">Acquiring Live GPS Satellite Fix...</p>
          </div>
        ) : null}
        
        <IssueMap
          issues={filteredIssues}
          center={liveLocation ? [liveLocation.lat, liveLocation.lng] : [28.5244, 77.2066]}
          zoom={liveLocation ? 14 : 12}
          onMarkerClick={handleMarkerClick}
          height="100%"
          showUserLocation={true}
          userLocation={liveLocation ? [liveLocation.lat, liveLocation.lng] : null}
        />

        {/* Selected Issue Drawer */}
        {showPanel && selectedIssue && (
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-[1000] bg-white border border-[var(--border)] rounded-[4px] p-5 shadow-md">
            <button
              onClick={() => setShowPanel(false)}
              className="absolute top-3 right-3 p-1 hover:bg-[var(--background)] text-[var(--foreground)]"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-3">
              <span className="font-mono text-[10px] font-bold text-[var(--muted-foreground)] block">
                DOCKET: CP-2026-{selectedIssue.id.slice(0, 4).toUpperCase()}
              </span>

              <h3 className="text-sm font-bold text-[var(--foreground)] line-clamp-2 leading-tight">
                {selectedIssue.title}
              </h3>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase bg-[var(--primary)] text-white px-2 py-0.5">
                  {selectedIssue.priority}
                </span>
                <span className="text-[10px] font-bold uppercase bg-[var(--background)] text-[var(--foreground)] border border-[var(--border)] px-2 py-0.5">
                  {selectedIssue.status.replace('_', ' ')}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-[var(--muted-foreground)] font-mono">
                <span className="flex items-center gap-1">
                  <MapPin size={12} />
                  {selectedIssue.city}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  {formatRelativeTime(selectedIssue.created_at)}
                </span>
              </div>

              <button
                onClick={() => router.push(`/dashboard/issue/${selectedIssue.id}`)}
                className="gov-btn-primary w-full text-xs font-bold uppercase py-2"
              >
                Inspect Official Case File
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
