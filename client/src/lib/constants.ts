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
    image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&q=80&w=800',
    mission: {
      scenario: 'Order cup ramen at a convenience store and ask how to cook it',
      characterName: 'Minjun',
      characterRole: 'Convenience Store Clerk',
      greeting: '안녕하세요! 어서오세요~ 무엇을 도와드릴까요?',
      objectives: ['Greet the clerk', 'Ask for cup ramen', 'Ask how to cook it', 'Say thank you']
    }
  },
  {
    id: 'uk',
    country: 'United Kingdom',
    city: 'London',
    lat: 51.5074,
    lng: -0.1278,
    language: { code: 'en', name: 'English', flag: '🇬🇧' },
    flag: '🇬🇧',
    image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=800',
    mission: {
      scenario: 'Ask for directions to Big Ben at a tube station',
      characterName: 'James',
      characterRole: 'Tube Station Staff',
      greeting: 'Hello there! Welcome to the Underground. How may I help you today?',
      objectives: ['Greet politely', 'Ask for directions to Big Ben', 'Confirm which line to take', 'Thank them']
    }
  },
  {
    id: 'jp',
    country: 'Japan',
    city: 'Tokyo',
    lat: 35.6762,
    lng: 139.6503,
    language: { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
    flag: '🇯🇵',
    image: 'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&q=80&w=800',
    mission: {
      scenario: 'Order ramen at a local restaurant and ask for the chef\'s recommendation',
      characterName: 'Yuki',
      characterRole: 'Ramen Shop Owner',
      greeting: 'いらっしゃいませ！何名様ですか？',
      objectives: ['Greet the owner', 'Ask for a menu recommendation', 'Order your ramen', 'Thank them politely']
    }
  },
  {
    id: 'de',
    country: 'Germany',
    city: 'Berlin',
    lat: 52.5200,
    lng: 13.4050,
    language: { code: 'de', name: 'German', flag: '🇩🇪' },
    flag: '🇩🇪',
    image: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&q=80&w=800',
    mission: {
      scenario: 'Buy a pretzel and beer at a traditional German bakery',
      characterName: 'Hans',
      characterRole: 'Bakery Owner',
      greeting: 'Guten Tag! Willkommen in meiner Bäckerei. Was darf es sein?',
      objectives: ['Greet in German', 'Order a pretzel', 'Order a beer', 'Pay and say goodbye']
    }
  },
  {
    id: 'it',
    country: 'Italy',
    city: 'Rome',
    lat: 41.9028,
    lng: 12.4964,
    language: { code: 'it', name: 'Italian', flag: '🇮🇹' },
    flag: '🇮🇹',
    image: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=800',
    mission: {
      scenario: 'Order a pizza and espresso at a local pizzeria',
      characterName: 'Marco',
      characterRole: 'Pizzeria Chef',
      greeting: 'Buongiorno! Benvenuto nella mia pizzeria! Cosa posso portarle?',
      objectives: ['Greet warmly', 'Ask about pizza options', 'Order pizza and espresso', 'Compliment the food']
    }
  },
  {
    id: 'fr',
    country: 'France',
    city: 'Paris',
    lat: 48.8566,
    lng: 2.3522,
    language: { code: 'fr', name: 'French', flag: '🇫🇷' },
    flag: '🇫🇷',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=800',
    mission: {
      scenario: 'Order 2 baguettes and an espresso at a local bakery, ask for recommendations',
      characterName: 'Pierre',
      characterRole: 'Boulangerie Owner',
      greeting: 'Bonjour! Bienvenue à ma boulangerie. Que désirez-vous?',
      objectives: ['Greet in French', 'Order 2 baguettes', 'Order an espresso', 'Ask for a pastry recommendation']
    }
  },
  {
    id: 'es',
    country: 'Spain',
    city: 'Madrid',
    lat: 40.4168,
    lng: -3.7038,
    language: { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    flag: '🇪🇸',
    image: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&q=80&w=800',
    mission: {
      scenario: 'Order tapas and sangria at a local bar',
      characterName: 'Carmen',
      characterRole: 'Bar Owner',
      greeting: '¡Hola! ¡Bienvenido a mi bar! ¿Qué le puedo ofrecer?',
      objectives: ['Greet in Spanish', 'Ask about tapas menu', 'Order tapas and sangria', 'Ask for the bill']
    }
  },
  {
    id: 'cn',
    country: 'China',
    city: 'Beijing',
    lat: 39.9042,
    lng: 116.4074,
    language: { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
    flag: '🇨🇳',
    image: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&q=80&w=800',
    mission: {
      scenario: 'Order dumplings at a local restaurant and ask about the filling',
      characterName: 'Li Wei',
      characterRole: 'Dumpling Restaurant Owner',
      greeting: '欢迎光临！请问几位？想吃点什么？',
      objectives: ['Greet the owner', 'Ask about dumpling fillings', 'Order dumplings', 'Thank them politely']
    }
  },
  {
    id: 'br',
    country: 'Brazil',
    city: 'São Paulo',
    lat: -23.5505,
    lng: -46.6333,
    language: { code: 'pt', name: 'Portuguese', flag: '🇧🇷' },
    flag: '🇧🇷',
    image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=800',
    mission: {
      scenario: 'Order a caipirinha and ask for food recommendations at a local bar',
      characterName: 'João',
      characterRole: 'Bar Owner',
      greeting: 'Olá! Bem-vindo ao meu bar! O que você gostaria?',
      objectives: ['Greet in Portuguese', 'Order a caipirinha', 'Ask for food recommendations', 'Thank the bartender']
    }
  }
];

export const SCENARIOS: Scenario[] = [
  { id: 'immigration', name: 'Immigration', icon: 'fa-passport', image: 'https://images.unsplash.com/photo-1544013585-446b17208b04?auto=format&fit=crop&q=80&w=800' },
  { id: 'cafe', name: 'Local Cafe', icon: 'fa-coffee', image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&q=80&w=800' },
  { id: 'hotel', name: 'Hotel Lobby', icon: 'fa-hotel', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800' },
  { id: 'departure', name: 'Departure Check', icon: 'fa-plane-departure', image: 'https://images.unsplash.com/photo-1436491865332-7a61a109c7d3?auto=format&fit=crop&q=80&w=800' }
];
