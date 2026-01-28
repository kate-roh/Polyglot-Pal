import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { DESTINATIONS } from '@/lib/constants';
import L from 'leaflet';
import { useLocation } from "wouter";
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Globe } from 'lucide-react';

// Fix for default Leaflet marker icons in React
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom pulsing icon for destinations
const pulsingIcon = L.divIcon({
  className: 'pulsing-marker',
  iconSize: [14, 14],
  iconAnchor: [7, 7] // Center of the marker
});

export default function WorldTour() {
  const [, setLocation] = useLocation();
  const [activeDestination, setActiveDestination] = useState<string | null>(null);

  const handleDestinationClick = (id: string) => {
    setActiveDestination(id);
  };

  const handleStartJourney = (id: string) => {
    // Navigate to a specific journey/scenario page for this destination
    // For now, maybe just dashboard or a specific scenario page if implemented
    // The user mentioned "World Tour & Media Studio", so maybe this links to scenarios
    console.log("Starting journey to", id);
    // setLocation(`/journey/${id}`); // If we had a journey page
    // For now, let's just log it or maybe open a modal (not implemented yet)
  };

  return (
    <div className="flex flex-col h-screen w-full relative">
       <div className="absolute top-0 left-0 w-full h-full z-0">
        <MapContainer 
          center={[20, 0]} 
          zoom={2} 
          style={{ height: '100%', width: '100%', background: '#0b0e14' }}
          zoomControl={false}
          minZoom={2}
          maxBounds={[[-90, -180], [90, 180]]}
        >
          {/* Dark map style using CartoDB Dark Matter */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          
          {DESTINATIONS.map((dest) => (
            <Marker 
              key={dest.id} 
              position={[dest.lat, dest.lng]}
              icon={pulsingIcon}
              eventHandlers={{
                click: () => handleDestinationClick(dest.id),
              }}
            >
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="z-10 absolute top-6 left-6 md:left-72 pointer-events-none">
        <h1 className="text-4xl font-display font-bold text-white drop-shadow-lg flex items-center gap-3">
          <Globe className="text-primary w-8 h-8" />
          World Tour
        </h1>
        <p className="text-white/80 text-lg drop-shadow-md mt-1 max-w-md">
          Select a destination to start your immersive language journey.
        </p>
      </div>

      {activeDestination && (
        <div className="z-10 absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 md:px-0">
          {DESTINATIONS.filter(d => d.id === activeDestination).map(dest => (
             <Card key={dest.id} className="bg-black/80 backdrop-blur-xl border-primary/30 p-0 overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
                <div className="relative h-32 w-full">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent z-10" />
                  <img src={dest.image} alt={dest.city} className="w-full h-full object-cover" />
                  <div className="absolute bottom-3 left-4 z-20">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{dest.flag}</span>
                      <h2 className="text-xl font-bold text-white">{dest.city}</h2>
                    </div>
                    <p className="text-sm text-gray-300">{dest.country}</p>
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                     <div className="text-sm text-gray-400">
                        Language: <span className="text-white font-medium">{dest.language.name}</span>
                     </div>
                  </div>
                  <Button 
                    className="w-full gap-2 group hover-elevate active-elevate-2" 
                    onClick={() => handleStartJourney(dest.id)}
                  >
                    Start Journey <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
             </Card>
          ))}
        </div>
      )}
    </div>
  );
}
