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
  { id: 'johannisbeere', name: 'Johannisbeere', emoji: '🫐' },
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
