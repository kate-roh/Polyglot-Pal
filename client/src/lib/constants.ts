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
    weather: { temp: 12, condition: '☁️', description: '흐림' },
    phases: [
      {
        phase: 'immigration',
        location: 'airport',
        npc: {
          name: '김태호',
          role: '입국심사관',
          avatar: '👨‍✈️',
          personality: '엄격하지만 공정한',
          mood: 'neutral',
          friendliness: 3
        },
        scenario: '인천공항에서 입국심사를 통과하세요',
        greeting: '안녕하세요. 여권과 입국신고서를 보여주세요.',
        objectives: ['여권 제출하기', '방문 목적 설명하기', '체류 기간 말하기']
      },
      {
        phase: 'tourism',
        location: 'cafe',
        npc: {
          name: '박서연',
          role: '카페 바리스타',
          avatar: '👩‍🍳',
          personality: '친절하고 활발한',
          mood: 'happy',
          friendliness: 5
        },
        scenario: '홍대 카페에서 커피와 디저트를 주문하세요',
        greeting: '어서오세요! 뭘 드릴까요? 오늘 딸기 케이크 추천이에요~',
        objectives: ['메뉴 물어보기', '음료 주문하기', '디저트 추천 받기', '결제하기']
      },
      {
        phase: 'departure',
        location: 'airport',
        npc: {
          name: '이준혁',
          role: '출국심사관',
          avatar: '👮',
          personality: '빠르고 효율적인',
          mood: 'busy',
          friendliness: 3
        },
        scenario: '인천공항에서 출국심사를 통과하세요',
        greeting: '다음 분, 여권 주세요.',
        objectives: ['여권 제출하기', '출국 확인하기']
      }
    ],
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
    weather: { temp: 8, condition: '🌧️', description: 'Rainy' },
    phases: [
      {
        phase: 'immigration',
        location: 'airport',
        npc: {
          name: 'Officer Smith',
          role: 'Border Force Officer',
          avatar: '👨‍✈️',
          personality: 'Professional and thorough',
          mood: 'neutral',
          friendliness: 3
        },
        scenario: 'Pass through immigration at Heathrow Airport',
        greeting: 'Good afternoon. Passport please.',
        objectives: ['Present passport', 'State purpose of visit', 'Confirm length of stay']
      },
      {
        phase: 'tourism',
        location: 'cafe',
        npc: {
          name: 'Emma',
          role: 'Café Barista',
          avatar: '👩‍🍳',
          personality: 'Warm and chatty',
          mood: 'happy',
          friendliness: 5
        },
        scenario: 'Order tea and scones at a traditional English café',
        greeting: 'Hello love! What can I get you today?',
        objectives: ['Order afternoon tea', 'Ask about scone flavors', 'Pay for order']
      },
      {
        phase: 'departure',
        location: 'airport',
        npc: {
          name: 'Officer Johnson',
          role: 'Security Officer',
          avatar: '👮',
          personality: 'Efficient and brief',
          mood: 'busy',
          friendliness: 3
        },
        scenario: 'Pass through departure security',
        greeting: 'Next please. Boarding pass and passport.',
        objectives: ['Show documents', 'Complete check']
      }
    ],
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
    weather: { temp: 18, condition: '☀️', description: '晴れ' },
    phases: [
      {
        phase: 'immigration',
        location: 'airport',
        npc: { name: '田中さん', role: '入国審査官', avatar: '👨‍✈️', personality: '丁寧で礼儀正しい', mood: 'neutral', friendliness: 4 },
        scenario: '成田空港で入国審査を受けてください',
        greeting: 'こんにちは。パスポートをお願いします。',
        objectives: ['パスポートを提出する', '訪問目的を説明する', '滞在期間を伝える']
      },
      {
        phase: 'tourism',
        location: 'restaurant',
        npc: { name: '佐藤さん', role: 'ラーメン店主', avatar: '👨‍🍳', personality: '明るくて親切', mood: 'happy', friendliness: 5 },
        scenario: '新宿のラーメン屋で注文してください',
        greeting: 'いらっしゃいませ！何にしますか？',
        objectives: ['メニューを聞く', 'ラーメンを注文する', '食券機の使い方を聞く']
      },
      {
        phase: 'departure',
        location: 'airport',
        npc: { name: '山本さん', role: '出国審査官', avatar: '👮', personality: '効率的で素早い', mood: 'busy', friendliness: 3 },
        scenario: '成田空港で出国審査を受けてください',
        greeting: '次の方、パスポートをどうぞ。',
        objectives: ['パスポートを提出する', '出国確認を受ける']
      }
    ],
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
    weather: { temp: 5, condition: '❄️', description: 'Kalt' },
    phases: [
      { phase: 'immigration', location: 'airport', npc: { name: 'Herr Müller', role: 'Grenzbeamter', avatar: '👨‍✈️', personality: 'Streng aber fair', mood: 'neutral', friendliness: 3 }, scenario: 'Einreisekontrolle am Flughafen Berlin', greeting: 'Guten Tag. Reisepass bitte.', objectives: ['Pass vorzeigen', 'Reisezweck erklären'] },
      { phase: 'tourism', location: 'cafe', npc: { name: 'Frau Schmidt', role: 'Café-Inhaberin', avatar: '👩‍🍳', personality: 'Herzlich und gesprächig', mood: 'happy', friendliness: 5 }, scenario: 'Bestellen Sie Kaffee und Kuchen in einem Berliner Café', greeting: 'Guten Tag! Was darf es sein?', objectives: ['Kaffee bestellen', 'Kuchen auswählen', 'Bezahlen'] },
      { phase: 'departure', location: 'airport', npc: { name: 'Herr Weber', role: 'Sicherheitsbeamter', avatar: '👮', personality: 'Effizient', mood: 'busy', friendliness: 3 }, scenario: 'Ausreisekontrolle', greeting: 'Nächster bitte. Bordkarte und Ausweis.', objectives: ['Dokumente vorzeigen'] }
    ],
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
    weather: { temp: 22, condition: '☀️', description: 'Soleggiato' },
    phases: [
      { phase: 'immigration', location: 'airport', npc: { name: 'Sig. Rossi', role: 'Agente di frontiera', avatar: '👨‍✈️', personality: 'Rilassato ma professionale', mood: 'neutral', friendliness: 4 }, scenario: 'Controllo passaporti a Fiumicino', greeting: 'Buongiorno. Passaporto, per favore.', objectives: ['Mostrare passaporto', 'Spiegare motivo visita'] },
      { phase: 'tourism', location: 'restaurant', npc: { name: 'Marco', role: 'Pizzaiolo', avatar: '👨‍🍳', personality: 'Appassionato e accogliente', mood: 'happy', friendliness: 5 }, scenario: 'Ordinare pizza in una pizzeria romana', greeting: 'Buongiorno! Benvenuto! Cosa desidera?', objectives: ['Ordinare pizza', 'Chiedere consiglio', 'Pagare'] },
      { phase: 'departure', location: 'airport', npc: { name: 'Sig.ra Bianchi', role: 'Agente sicurezza', avatar: '👮', personality: 'Veloce ed efficiente', mood: 'busy', friendliness: 3 }, scenario: 'Controllo sicurezza', greeting: 'Prossimo. Carta d\'imbarco.', objectives: ['Mostrare documenti'] }
    ],
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
    weather: { temp: 14, condition: '🌤️', description: 'Partiellement nuageux' },
    phases: [
      { phase: 'immigration', location: 'airport', npc: { name: 'Agent Dupont', role: 'Agent de contrôle', avatar: '👨‍✈️', personality: 'Formel et précis', mood: 'neutral', friendliness: 3 }, scenario: 'Contrôle des passeports à CDG', greeting: 'Bonjour. Passeport, s\'il vous plaît.', objectives: ['Montrer passeport', 'Expliquer but du voyage'] },
      { phase: 'tourism', location: 'cafe', npc: { name: 'Marie', role: 'Serveuse', avatar: '👩‍🍳', personality: 'Élégante et serviable', mood: 'happy', friendliness: 4 }, scenario: 'Commander café et croissant dans un café parisien', greeting: 'Bonjour! Qu\'est-ce que vous désirez?', objectives: ['Commander café', 'Commander croissant', 'Payer'] },
      { phase: 'departure', location: 'airport', npc: { name: 'Agent Martin', role: 'Agent de sécurité', avatar: '👮', personality: 'Efficace', mood: 'busy', friendliness: 3 }, scenario: 'Contrôle de sécurité', greeting: 'Suivant. Carte d\'embarquement.', objectives: ['Montrer documents'] }
    ],
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
    weather: { temp: 28, condition: '☀️', description: 'Soleado' },
    phases: [
      { phase: 'immigration', location: 'airport', npc: { name: 'Sr. García', role: 'Agente de frontera', avatar: '👨‍✈️', personality: 'Relajado pero profesional', mood: 'neutral', friendliness: 4 }, scenario: 'Control de pasaportes en Barajas', greeting: '¡Buenos días! Pasaporte, por favor.', objectives: ['Mostrar pasaporte', 'Explicar motivo de visita'] },
      { phase: 'tourism', location: 'restaurant', npc: { name: 'Carmen', role: 'Camarera', avatar: '👩‍🍳', personality: 'Alegre y amable', mood: 'happy', friendliness: 5 }, scenario: 'Pedir tapas en un bar madrileño', greeting: '¡Hola! ¿Qué le pongo?', objectives: ['Pedir tapas', 'Pedir bebida', 'Pagar'] },
      { phase: 'departure', location: 'airport', npc: { name: 'Sra. López', role: 'Agente seguridad', avatar: '👮', personality: 'Eficiente', mood: 'busy', friendliness: 3 }, scenario: 'Control de seguridad', greeting: 'Siguiente. Tarjeta de embarque.', objectives: ['Mostrar documentos'] }
    ],
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
    weather: { temp: 15, condition: '🌫️', description: '多云' },
    phases: [
      { phase: 'immigration', location: 'airport', npc: { name: '王警官', role: '入境检查员', avatar: '👨‍✈️', personality: '严肃认真', mood: 'neutral', friendliness: 3 }, scenario: '在首都机场办理入境', greeting: '您好。护照请出示一下。', objectives: ['出示护照', '说明访问目的'] },
      { phase: 'tourism', location: 'restaurant', npc: { name: '李师傅', role: '饺子店老板', avatar: '👨‍🍳', personality: '热情好客', mood: 'happy', friendliness: 5 }, scenario: '在北京老字号饺子馆点餐', greeting: '欢迎光临！想吃点什么？', objectives: ['点饺子', '问馅料', '结账'] },
      { phase: 'departure', location: 'airport', npc: { name: '张警官', role: '出境检查员', avatar: '👮', personality: '高效', mood: 'busy', friendliness: 3 }, scenario: '办理出境手续', greeting: '下一位。护照。', objectives: ['出示护照'] }
    ],
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
    weather: { temp: 30, condition: '⛈️', description: 'Tempestade' },
    phases: [
      { phase: 'immigration', location: 'airport', npc: { name: 'Sr. Silva', role: 'Agente federal', avatar: '👨‍✈️', personality: 'Amigável mas profissional', mood: 'neutral', friendliness: 4 }, scenario: 'Controle de passaportes em Guarulhos', greeting: 'Boa tarde! Passaporte, por favor.', objectives: ['Mostrar passaporte', 'Explicar motivo da viagem'] },
      { phase: 'tourism', location: 'restaurant', npc: { name: 'João', role: 'Barman', avatar: '👨‍🍳', personality: 'Animado e prestativo', mood: 'happy', friendliness: 5 }, scenario: 'Pedir caipirinha num bar paulistano', greeting: 'E aí! O que vai ser?', objectives: ['Pedir caipirinha', 'Pedir petisco', 'Pagar'] },
      { phase: 'departure', location: 'airport', npc: { name: 'Sra. Costa', role: 'Agente segurança', avatar: '👮', personality: 'Eficiente', mood: 'busy', friendliness: 3 }, scenario: 'Controle de segurança', greeting: 'Próximo. Cartão de embarque.', objectives: ['Mostrar documentos'] }
    ],
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
