// JuiceBox Flavor Data - extracted from Wall of Fame

export const fruits = [
  { id: 'apfel', name: 'Apfel', emoji: '🍎' },
  { id: 'birne', name: 'Birne', emoji: '🍐' },
  { id: 'orange', name: 'Orange', emoji: '🍊' },
  { id: 'zitrone', name: 'Zitrone', emoji: '🍋' },
  { id: 'grapefruit', name: 'Grapefruit', emoji: '🍊' },
  { id: 'erdbeere', name: 'Erdbeere', emoji: '🍓' },
  { id: 'himbeere', name: 'Himbeere', emoji: '🫐' },
  { id: 'blaubeere', name: 'Blaubeere', emoji: '🫐' },
  { id: 'kirsche', name: 'Kirsche', emoji: '🍒' },
  { id: 'banane', name: 'Banane', emoji: '🍌' },
  { id: 'mango', name: 'Mango', emoji: '🥭' },
  { id: 'maracuja', name: 'Maracuja', emoji: '🟠' },
  { id: 'ananas', name: 'Ananas', emoji: '🍍' },
  { id: 'wassermelone', name: 'Wassermelone', emoji: '🍉' },
  { id: 'melone', name: 'Melone', emoji: '🍈' },
  { id: 'traube', name: 'Traube', emoji: '🍇' },
  { id: 'holunder', name: 'Holunder', emoji: '🌸' },
  { id: 'rhabarber', name: 'Rhabarber', emoji: '🥬' },
  { id: 'pfirsich', name: 'Pfirsich', emoji: '🍑' },
];

export const extras = [
  { id: 'kokos', name: 'Kokos', emoji: '🥥' },
  { id: 'minze', name: 'Minze', emoji: '🌿' },
  { id: 'vanille', name: 'Vanille', emoji: '🍦' },
  { id: 'rose', name: 'Rose', emoji: '🌹' },
];

// Combined for backwards compatibility
export const primaryFlavors = [...fruits, ...extras];

export const accents = [
  { id: 'none', name: 'Ohne', emoji: '🚫' },
  { id: 'cola', name: 'Cola Bomb', emoji: '🥤' },
  { id: 'energy', name: 'Energy', emoji: '⚡' },
  { id: 'eistee', name: 'Eistee', emoji: '🧊' },
];

export const variants = [
  { id: 'original', name: '🍬 Original', description: 'Voll süß, voll lecker!' },
  { id: 'light', name: '💪 Light', description: 'Zero Sugar, voller Geschmack!' },
];

// Standard JuiceBox Sortiment - ALLE passenden Sorten pro Zutat
// Jeder Builder-Flavor kann mehrere Standardprodukte matchen

const flavorMapping = {
  // Zitrus
  orange: ['Sunset Orange'],
  grapefruit: ['Sunset Orange'],
  zitrone: ['Sweet Lemon', 'Skiwasser'],
  
  // Beeren
  erdbeere: ['Berry Bomb'],
  himbeere: ['Berry Bomb', 'Fruchtige Himbeere', 'Skiwasser'],
  blaubeere: ['Berry Bomb'],
  kirsche: ['Very Cherry', 'Berry Bomb'],
  
  // Tropisch
  ananas: ['Pineapple Dream'],
  mango: ['Mango-Maracuja'],
  maracuja: ['Mango-Maracuja'],
  banane: ['Mango-Maracuja'],
  kokos: ['Pineapple Dream'],
  
  // Kernobst & Melonen
  apfel: ['Apfel-Holunder', 'BIO Apfel'],
  birne: ['Birne-Melone'],
  melone: ['Birne-Melone'],
  wassermelone: ['Wassermelone', 'Birne-Melone'],
  
  // Sonstige Früchte
  pfirsich: ['Eistee Pfirsich'],
  traube: ['Berry Bomb', 'Summerdream'],
  rhabarber: ['Rhabarber'],
  
  // Blumig & Kräuter
  holunder: ['Holunder-Blüte', 'Apfel-Holunder'],
  rose: ['Holunder-Blüte'],
  minze: ['Skiwasser', 'Waldmeister'],
  vanille: ['Eistee Pfirsich'],
};

// Akzent-Overrides (fügt zusätzliche Matches hinzu)
const accentMatches = {
  eistee: ['Eistee Pfirsich'],
  cola: ['Berry Bomb'],
  energy: ['Sunset Orange'],
};

// Find ALL matching standard flavors for a creation
export function findBestMatch(primaryFlavorIds, accent) {
  const allMatches = new Set();
  
  // 1. Sammle alle Matches aus den Zutaten
  for (const flavorId of primaryFlavorIds) {
    const matches = flavorMapping[flavorId];
    if (matches) {
      matches.forEach(m => allMatches.add(m));
    }
  }
  
  // 2. Akzent-Matches hinzufügen
  if (accent && accentMatches[accent]) {
    accentMatches[accent].forEach(m => allMatches.add(m));
  }
  
  // 3. Als Array zurückgeben, sortiert nach Relevanz
  const matchArray = Array.from(allMatches);
  
  // 4. Fallback: Bestseller
  if (matchArray.length === 0) {
    return 'Berry Bomb';
  }
  
  // Formatiere als Liste: "Sorte A, Sorte B und Sorte C"
  if (matchArray.length === 1) {
    return matchArray[0];
  } else if (matchArray.length === 2) {
    return `${matchArray[0]} und ${matchArray[1]}`;
  } else {
    const last = matchArray.pop();
    return `${matchArray.join(', ')} und ${last}`;
  }
}
