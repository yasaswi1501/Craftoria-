import sellerMemoryCanvas from '../assets/seller-memory-canvas.png';
import sellerEmbroideryHoop from '../assets/seller-embroidery-hoop.png';
import sellerBloomBouquets from '../assets/seller-bloom-bouquets.png';
import sellerBloomKeychains from '../assets/seller-bloom-keychains.png';
import coverPolaroids from '../assets/polaroids-new.jpg';
import polaroidsMusic from '../assets/polaroids-music.jpg';
import polaroids1x2 from '../assets/polaroids-1x2.jpg';
import polaroids1x3 from '../assets/polaroids-1x3.jpg';
import polaroidsPack from '../assets/polaroids-pack.jpg';
import coverClips from '../assets/clips-rubber-bands.jpg';
import coverMacrame from '../assets/macrame-wall-hanging.jpg';
import coverBouquets from '../assets/bloom-bouquets-cover.jpg';
import coverChildFrame from '../assets/gallery-5-child-frame.jpg';
import coverCoupleEmbroidery from '../assets/gallery-3-couple-embroidery.jpg';
import coverBlueFlowerKeychain from '../assets/gallery-2-blue-flower-keychain.jpg';
import coverHeartKeychain from '../assets/gallery-4-heart-keychain.jpg';
import embroideryShirt from '../assets/embroidery-shirt.jpg';
import fridgeMagnets from '../assets/fridge-magnets.jpg';
import flowerVase from '../assets/flower-vase.jpg';
import bouquet1Flower from '../assets/bouquet-1-flower.jpg';
import bouquet3Flower from '../assets/bouquet-3-flower.jpg';
import bouquet5Flower from '../assets/bouquet-5-flower.jpg';
import customHomeDecor from '../assets/custom-home-decor.jpg';
import hairClips from '../assets/hair-clips.jpg';
import customHairAccessories from '../assets/custom-hair-accessories.jpg';

// Resolves a raw image filename (as stored in products.js / cart / wishlist
// payloads) to its Vite-bundled asset module. Single source of truth so the
// mapping only needs to change in one place.
export const getImageByFilename = (imgName) => {
  switch (imgName) {
    case 'hair-clips.jpg': return hairClips;
    case 'custom-hair-accessories.jpg': return customHairAccessories;
    case 'bouquet-1-flower.jpg': return bouquet1Flower;
    case 'bouquet-3-flower.jpg': return bouquet3Flower;
    case 'bouquet-5-flower.jpg': return bouquet5Flower;
    case 'custom-home-decor.jpg': return customHomeDecor;
    case 'embroidery-shirt.jpg': return embroideryShirt;
    case 'fridge-magnets.jpg': return fridgeMagnets;
    case 'flower-vase.jpg': return flowerVase;
    case 'seller-memory-canvas.png': return sellerMemoryCanvas;
    case 'seller-embroidery-hoop.png': return sellerEmbroideryHoop;
    case 'seller-bloom-keychains.png': return sellerBloomKeychains;
    case 'seller-bloom-bouquets.png': return sellerBloomBouquets;
    case 'polaroids-music.jpg': return polaroidsMusic;
    case 'polaroids-1x2.jpg': return polaroids1x2;
    case 'polaroids-1x3.jpg': return polaroids1x3;
    case 'polaroids-pack.jpg': return polaroidsPack;
    case 'polaroids-new.jpg':
    case 'gallery-1-polaroid.jpg': return coverPolaroids;
    case 'gallery-7-two-flower-keychain.jpg':
    case 'clips-rubber-bands.jpg': return coverClips;
    case 'macrame-wall-hanging.jpg': return coverMacrame;
    case 'bloom-bouquets-cover.jpg': return coverBouquets;
    case 'gallery-5-child-frame.jpg': return coverChildFrame;
    case 'gallery-3-couple-embroidery.jpg': return coverCoupleEmbroidery;
    case 'gallery-2-blue-flower-keychain.jpg': return coverBlueFlowerKeychain;
    case 'gallery-4-heart-keychain.jpg': return coverHeartKeychain;
    default: return null;
  }
};

// Resolves a product / cart-item / wishlist-item object to its representative
// thumbnail image, using its stated image/thumbnail filename first and
// falling back to id/category keyword matching for legacy cart payloads that
// only ever stored an id.
export const getProductImage = (item) => {
  const id = (typeof item === 'string' ? item : item?.id || '').toLowerCase();
  const cat = (typeof item === 'object' ? item?.category || '' : '').toLowerCase();
  const imgName = typeof item === 'object' ? item?.image || item?.thumbnail || '' : '';

  const byFilename = getImageByFilename(imgName);
  if (byFilename) return byFilename;

  if (id === 'accessories-clips') return hairClips;
  if (id.includes('custom-accessories')) return customHairAccessories;
  if (id === 'bloom-bouquet-1-flower') return bouquet1Flower;
  if (id === 'bloom-bouquet-3-flower') return bouquet3Flower;
  if (id === 'bloom-bouquet-5-flower') return bouquet5Flower;
  if (id.includes('custom-home-decor')) return customHomeDecor;
  if (id.includes('shirt')) return embroideryShirt;
  if (id.includes('magnet')) return fridgeMagnets;
  if (id.includes('vase')) return flowerVase;
  if (id.includes('blue-blossom')) return coverBlueFlowerKeychain;
  if (id.includes('heart-keychain') || id.includes('purple-heart')) return coverHeartKeychain;
  if (id.includes('couple-embroidery') || id.includes('middle-frame')) return coverCoupleEmbroidery;
  if (id.includes('child-frame') || id.includes('wooden-frame')) return coverChildFrame;
  if (id.includes('custom-bloom-bouquet')) return sellerBloomBouquets;
  if (id.includes('craftoria-bloom') || id.includes('bloom-bouquets') || cat === 'craftoria-bloom-bouquets') return coverBouquets;
  if (id.includes('macrame') || id.includes('decor') || cat === 'handmade-decor') return coverMacrame;
  if (id.includes('clip') || id.includes('rubber-band') || id.includes('accessories') || cat === 'clips-rubber-bands' || cat === 'accessories') return coverClips;
  if (id.includes('music') || id.includes('spotify')) return polaroidsMusic;
  if (id.includes('1x2')) return polaroids1x2;
  if (id.includes('1x3')) return polaroids1x3;
  if (id.includes('pack9') || id.includes('pack15') || id.includes('single-pack')) return polaroidsPack;
  if (id.includes('polaroid') || cat === 'polaroids') return polaroidsPack;
  if (id.includes('keychain') || cat === 'keychains') return sellerBloomKeychains;
  if (id.includes('embroidery') || id.includes('hoop') || cat === 'embroidery') return sellerEmbroideryHoop;
  if (id.includes('bouquet') || id.includes('gift')) return sellerBloomBouquets;
  if (id.includes('canvas') || id.includes('frame') || cat === 'photo-frames') return sellerMemoryCanvas;
  return sellerMemoryCanvas;
};
