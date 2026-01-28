import { Destination, Scenario } from './types';

export const DESTINATIONS: Destination[] = [
  {
    id: 'kr',
    country: 'South Korea',
    city: 'Seoul',
    lat: 37.5665,
    lng: 126.9780,
    language: { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    flag: '🇰🇷',
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'uk',
    country: 'United Kingdom',
    city: 'London',
    lat: 51.5074,
    lng: -0.1278,
    language: { code: 'en', name: 'English', flag: '🇬🇧' },
    flag: '🇬🇧',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'jp',
    country: 'Japan',
    city: 'Tokyo',
    lat: 35.6762,
    lng: 139.6503,
    language: { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    flag: '🇯🇵',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'de',
    country: 'Germany',
    city: 'Berlin',
    lat: 52.5200,
    lng: 13.4050,
    language: { code: 'de', name: 'German', flag: '🇩🇪' },
    flag: '🇩🇪',
    image: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'it',
    country: 'Italy',
    city: 'Rome',
    lat: 41.9028,
    lng: 12.4964,
    language: { code: 'it', name: 'Italian', flag: '🇮🇹' },
    flag: '🇮🇹',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'fr',
    country: 'France',
    city: 'Paris',
    lat: 48.8566,
    lng: 2.3522,
    language: { code: 'fr', name: 'French', flag: '🇫🇷' },
    flag: '🇫🇷',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'es',
    country: 'Spain',
    city: 'Madrid',
    lat: 40.4168,
    lng: -3.7038,
    language: { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    flag: '🇪🇸',
    image: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'cn',
    country: 'China',
    city: 'Beijing',
    lat: 39.9042,
    lng: 116.4074,
    language: { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    flag: '🇨🇳',
    image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&q=80&w=800'
  },
  {
    id: 'br',
    country: 'Brazil',
    city: 'São Paulo',
    lat: -23.5505,
    lng: -46.6333,
    language: { code: 'pt', name: 'Portuguese', flag: '🇧🇷' },
    flag: '🇧🇷',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=800'
  }
];

export const SCENARIOS: Scenario[] = [
  { id: 'immigration', name: 'Immigration', icon: 'fa-passport', image: 'https://images.unsplash.com/photo-1544013585-446b17208b04?auto=format&fit=crop&q=80&w=800' },
  { id: 'cafe', name: 'Local Cafe', icon: 'fa-coffee', image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=800' },
  { id: 'hotel', name: 'Hotel Lobby', icon: 'fa-hotel', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800' },
  { id: 'departure', name: 'Departure Check', icon: 'fa-plane-departure', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109c7d3?auto=format&fit=crop&q=80&w=800' }
];
