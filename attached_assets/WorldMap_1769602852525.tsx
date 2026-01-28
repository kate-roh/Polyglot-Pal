
import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { DESTINATIONS } from '../constants';
import { Destination, JourneyReport } from '../types';

interface WorldMapProps {
  onSelect: (dest: Destination) => void;
  history: JourneyReport[];
}

const WorldMap: React.FC<WorldMapProps> = ({ onSelect, history }) => {
  const mapRef = useRef<L.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: false,
      attributionControl: false
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(map);

    DESTINATIONS.forEach(dest => {
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div class="pulsing-marker"></div>`,
        iconSize: [20, 20]
      });

      const marker = L.marker([dest.lat, dest.lng], { icon }).addTo(map);
      marker.on('click', () => onSelect(dest));
    });

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [onSelect]);

  return (
    <div className="h-full w-full relative bg-[#0b0e14]">
      <div ref={containerRef} className="h-full w-full z-0" />
      
      <div className="absolute top-6 left-4 z-10 pointer-events-none">
        <div className="glass p-5 rounded-3xl border border-white/10 pointer-events-auto">
          <h2 className="text-2xl font-black italic tracking-tighter text-white uppercase">World Tour</h2>
          <p className="text-[9px] text-indigo-400 font-bold uppercase tracking-[0.2em] mt-1">Select a destination node</p>
        </div>
      </div>

      <div className="absolute bottom-28 left-4 right-4 z-10 flex gap-3 overflow-x-auto no-scrollbar pointer-events-auto pb-4">
        {DESTINATIONS.map(d => (
          <button 
            key={d.id}
            onClick={() => onSelect(d)}
            className="flex items-center gap-3 p-4 glass rounded-[24px] border border-white/10 text-left shrink-0 min-w-[160px] hover:neon-border transition-all"
          >
            <span className="text-2xl">{d.flag}</span>
            <div className="min-w-0">
              <p className="text-[9px] text-slate-500 font-bold uppercase truncate">{d.country}</p>
              <p className="text-xs font-bold text-white truncate">{d.city}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default WorldMap;
