// Customization vocabulary for the standalone /customize page.

// Craft/style choices offered on the standalone customization page, scoped
// per category so the dropdown only shows options that actually make sense
// for what's being commissioned.
export const CRAFT_STYLES_BY_CATEGORY = {
  'photo-frames': ['Classic Wooden Frame', 'Memory Canvas', 'Collage Multi-Photo Frame'],
  'embroidery': ['Small Hoop', 'Middle Hoop', 'Large Hoop', 'Embroidered Apparel'],
  'keychains': ['Flower Keychain', 'Heart Keychain', 'Bag Charm'],
  'polaroids': ['Single Prints', 'Photo Strip Pack', 'Music / Spotify Polaroid'],
  'craftoria-bloom-bouquets': ['1 Flower Bouquet', '3 Flower Bouquet', '5 Flower Bouquet'],
  'handmade-decor': ['Fridge Magnet Set', 'Flower Vase', 'Wall Decor Piece'],
  'accessories': ['Hair Clip Set', 'Scrunchie Set', 'Bag Charm Clip'],
};

export const DEFAULT_CRAFT_STYLES = ['Signature Style', 'Minimal Style', 'Statement Piece'];

export const MATERIALS = [
  'Premium Cotton Thread',
  'Chenille Wire',
  'Natural Wood',
  'Ceramic',
  'Card Stock & Ribbon',
  'Mixed Craft Materials',
];

export const COLOURS = [
  'Lavender',
  'Blush Pink',
  'Ivory & Cream',
  'Sage Green',
  'Sunset Peach',
  'Classic White',
  'Custom (describe in notes)',
];

// Size deltas applied on top of the category's base custom-piece price.
export const SIZES = [
  { id: 'small', label: 'Small', priceDelta: 0 },
  { id: 'medium', label: 'Medium', priceDelta: 50 },
  { id: 'large', label: 'Large', priceDelta: 100 },
];

export const MATERIAL_PRICE_DELTA = {
  'Premium Cotton Thread': 0,
  'Chenille Wire': 0,
  'Natural Wood': 25,
  'Ceramic': 40,
  'Card Stock & Ribbon': 0,
  'Mixed Craft Materials': 25,
};

export const getCraftStylesForCategory = (categoryId) =>
  CRAFT_STYLES_BY_CATEGORY[categoryId] || DEFAULT_CRAFT_STYLES;
