import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Sparkles, Check, Heart, ShoppingBag, 
  Gift, MessageCircle, AlertCircle, HelpCircle, Package, Plus, Minus
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { productsData } from '../data/products';

import sellerMemoryCanvas from '../assets/seller-memory-canvas.png';
import sellerEmbroideryHoop from '../assets/seller-embroidery-hoop.png';
import sellerBloomBouquets from '../assets/seller-bloom-bouquets.png';
import sellerBloomKeychains from '../assets/seller-bloom-keychains.png';
import coverPolaroids from '../assets/polaroids-new.jpg';
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

export const OCCASIONS = [
  '🎂 Birthday',
  '💍 Anniversary',
  '💒 Wedding / Engagement',
  '🎁 Gift for Bestie / Friend',
  '🏡 Home & Desk Decor',
  '❤️ Romantic / Valentine',
  '👶 Baby Shower & Kids',
  '✨ Special Milestone',
];

export const PACKAGING_OPTIONS = [
  { id: 'signature-box', label: 'Signature Lavender Gift Box & Satin Ribbon', note: 'Luxury unboxing experience' },
  { id: 'eco-kraft', label: 'Eco-Friendly Artisan Kraft Packaging', note: 'Rustic minimal craft wrapping' },
];

export const CATEGORY_TABS = [
  { id: 'all', label: 'All Crafts' },
  { id: 'craftoria-bloom-bouquets', label: '🌸 Bouquets' },
  { id: 'embroidery', label: '🧵 Embroidery' },
  { id: 'photo-frames', label: '🖼️ Frames' },
  { id: 'keychains', label: '🔑 Keychains' },
  { id: 'polaroids', label: '📸 Polaroids' },
  { id: 'handmade-decor', label: '🏡 Home Decor' },
  { id: 'accessories', label: '🎀 Accessories' },
];

const CustomizationModal = ({ isOpen, onClose, product }) => {
  const { addToCart } = useCart();

  const [selectedProduct, setSelectedProduct] = useState(product || productsData[0]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [customText, setCustomText] = useState('');
  const [selectedOccasion, setSelectedOccasion] = useState(OCCASIONS[0]);
  const [giftNote, setGiftNote] = useState('');
  const [packaging, setPackaging] = useState(PACKAGING_OPTIONS[0].label);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset or initialize product selection whenever modal opens or product changes
  useEffect(() => {
    if (product) {
      const match = productsData.find(p => p.id === product.id || p.slug === product.slug);
      const chosen = match || product || productsData[0];
      setSelectedProduct(chosen);
      if (chosen?.category && chosen.category !== 'custom-orders') {
        const catKey = chosen.category === 'clips-rubber-bands' ? 'accessories' : chosen.category;
        setSelectedCategoryFilter(catKey);
      } else {
        setSelectedCategoryFilter('all');
      }
      setCustomText('');
      setSelectedOccasion(OCCASIONS[0]);
      setGiftNote('');
      setPackaging(PACKAGING_OPTIONS[0].label);
      setSpecialInstructions('');
      setQuantity(1);
      setErrorMessage('');
      setIsSuccess(false);
    }
  }, [product, isOpen]);

  const filteredProducts = useMemo(() => {
    if (selectedCategoryFilter === 'all') return productsData;
    return productsData.filter(p => {
      if (selectedCategoryFilter === 'accessories') {
        return p.category === 'accessories' || p.category === 'clips-rubber-bands';
      }
      return p.category === selectedCategoryFilter;
    });
  }, [selectedCategoryFilter]);

  // Lock background body scroll when modal is open to ensure pure, uninterrupted modal scrolling
  useEffect(() => {
    if (isOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const getProductImage = (prod) => {
    const id = (prod?.id || '').toLowerCase();
    const cat = (prod?.category || '').toLowerCase();
    const imgName = prod?.thumbnail || prod?.image || '';

    if (imgName === 'hair-clips.jpg' || id === 'accessories-clips') return hairClips;
    if (imgName === 'custom-hair-accessories.jpg' || id.includes('custom-accessories')) return customHairAccessories;
    if (imgName === 'bouquet-1-flower.jpg' || id === 'bloom-bouquet-1-flower') return bouquet1Flower;
    if (imgName === 'bouquet-3-flower.jpg' || id === 'bloom-bouquet-3-flower') return bouquet3Flower;
    if (imgName === 'bouquet-5-flower.jpg' || id === 'bloom-bouquet-5-flower') return bouquet5Flower;
    if (imgName === 'custom-home-decor.jpg' || id.includes('custom-home-decor')) return customHomeDecor;
    if (imgName === 'embroidery-shirt.jpg' || id.includes('shirt')) return embroideryShirt;
    if (imgName === 'fridge-magnets.jpg' || id.includes('magnet')) return fridgeMagnets;
    if (imgName === 'flower-vase.jpg' || id.includes('vase')) return flowerVase;
    if (imgName === 'gallery-2-blue-flower-keychain.jpg' || id.includes('blue-blossom')) return coverBlueFlowerKeychain;
    if (imgName === 'gallery-4-heart-keychain.jpg' || id.includes('heart-keychain') || id.includes('purple-heart')) return coverHeartKeychain;
    if (imgName === 'gallery-3-couple-embroidery.jpg' || id.includes('couple-embroidery') || id.includes('middle-frame')) return coverCoupleEmbroidery;
    if (imgName === 'gallery-5-child-frame.jpg' || id.includes('child-frame') || id.includes('wooden-frame')) return coverChildFrame;
    if (imgName === 'seller-bloom-bouquets.png' || id.includes('custom-bloom-bouquet')) return sellerBloomBouquets;
    if (imgName === 'bloom-bouquets-cover.jpg' || cat === 'craftoria-bloom-bouquets') return coverBouquets;
    if (imgName === 'macrame-wall-hanging.jpg' || cat === 'handmade-decor') return coverMacrame;
    if (imgName === 'clips-rubber-bands.jpg' || cat === 'clips-rubber-bands' || cat === 'accessories') return coverClips;
    if (imgName === 'polaroids-new.jpg' || cat === 'polaroids') return coverPolaroids;
    if (imgName === 'seller-bloom-keychains.png' || cat === 'keychains') return sellerBloomKeychains;
    if (imgName === 'seller-embroidery-hoop.png' || cat === 'embroidery') return sellerEmbroideryHoop;
    if (imgName === 'seller-memory-canvas.png' || cat === 'photo-frames') return sellerMemoryCanvas;
    return sellerMemoryCanvas;
  };

  const handleSaveAndAddToCart = () => {
    if (!customText.trim()) {
      setErrorMessage('Please enter the personalized name, initials, or custom text.');
      return;
    }

    setErrorMessage('');

    const customizationData = {
      text: customText.trim(),
      occasion: selectedOccasion,
      giftNote: giftNote.trim() || undefined,
      packaging: packaging,
      specialNotes: specialInstructions.trim() || undefined,
    };

    const targetProduct = selectedProduct || product;

    const cartPayload = {
      id: targetProduct.id,
      name: targetProduct.title || targetProduct.name,
      price: targetProduct.price,
      desc: targetProduct.description || targetProduct.desc,
      image: targetProduct.thumbnail || targetProduct.image,
      customText: customText.trim(),
      customization: customizationData,
      qty: quantity,
    };

    addToCart(cartPayload, quantity);
    setIsSuccess(true);

    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-6"
      data-lenis-prevent="true"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-brand-plum/50 backdrop-blur-sm cursor-pointer"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        onWheel={(e) => e.stopPropagation()}
        data-lenis-prevent="true"
        className="relative w-full max-w-2xl max-h-[92vh] sm:max-h-[85vh] h-auto bg-[#FCF8FC] border border-brand-purple/20 rounded-[24px] sm:rounded-[28px] shadow-[0_20px_60px_rgba(75,46,93,0.25)] overflow-hidden flex flex-col z-10 text-brand-dark text-left my-auto"
      >
        {/* Header (Sticky / Fixed at top of modal) */}
        <div className="px-4 sm:px-7 py-3.5 sm:py-4 border-b border-brand-purple/10 bg-white/85 backdrop-blur-md flex items-center justify-between flex-shrink-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-purple/15 flex items-center justify-center text-brand-plum flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[8.5px] sm:text-[9px] font-bold uppercase tracking-widest text-brand-plum font-mono">
                Artisan Customization Studio
              </span>
              <h3 className="font-serif text-sm sm:text-lg font-bold text-brand-dark leading-tight">
                Customize Your Handcrafted Piece
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-brand-purple/10 hover:bg-brand-purple/25 flex items-center justify-center text-brand-plum transition-colors cursor-pointer focus:outline-none flex-shrink-0"
            aria-label="Close customization modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div 
          className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-7 space-y-5 sm:space-y-6 custom-scrollbar overscroll-contain"
          data-lenis-prevent="true"
          style={{ touchAction: 'pan-y' }}
        >
          
          {/* 1. Select Product / Craft Piece */}
          <div className="space-y-2.5 bg-white/70 border border-brand-purple/20 p-3 sm:p-4 rounded-2xl shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-brand-dark flex items-center gap-1.5">
                <Package className="w-3.5 h-3.5 text-brand-plum" />
                <span>Select Craft / Product to Customize</span>
              </label>
              <span className="text-[9.5px] sm:text-[10px] font-bold text-brand-plum font-mono uppercase tracking-wider">
                {productsData.length} items
              </span>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 -mx-0.5 px-0.5">
              {CATEGORY_TABS.map((tab) => {
                const isActive = selectedCategoryFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryFilter(tab.id);
                      if (tab.id !== 'all') {
                        const firstInCat = productsData.find(p => p.category === tab.id);
                        if (firstInCat) setSelectedProduct(firstInCat);
                      }
                    }}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      isActive
                        ? 'bg-brand-plum text-white shadow-xs'
                        : 'bg-white/80 border border-brand-purple/15 text-brand-dark/75 hover:bg-white hover:text-brand-plum'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Product Dropdown Selector */}
            <div className="relative">
              <select
                value={selectedProduct?.id || ''}
                onChange={(e) => {
                  const match = productsData.find(p => p.id === e.target.value);
                  if (match) setSelectedProduct(match);
                }}
                className="w-full text-xs font-semibold p-2.5 sm:p-3 pr-10 rounded-xl border border-brand-purple/25 bg-white focus:outline-none focus:ring-2 focus:ring-brand-plum/30 focus:border-brand-purple transition-all cursor-pointer appearance-none shadow-xs text-brand-dark"
              >
                {filteredProducts.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.title} ({prod.category ? prod.category.replace('-', ' ') : 'Handcrafted'})
                  </option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-brand-plum text-[10px]">
                ▼
              </div>
            </div>
          </div>

          {/* Selected Product Summary Card */}
          <div className="glass-card p-3.5 sm:p-4 rounded-2xl border border-brand-purple/15 bg-white/60 flex items-center gap-3.5">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-gradient-to-tr from-[#FCF7FF] via-[#F3E7FA] to-[#E9D7F5] border border-brand-purple/10 overflow-hidden flex-shrink-0 flex items-center justify-center p-1.5">
              <img
                src={getProductImage(selectedProduct)}
                alt={selectedProduct?.title || selectedProduct?.name}
                className="w-full h-full object-contain pointer-events-none transition-all duration-300"
              />
            </div>
            <div className="flex-grow min-w-0">
              <span className="text-[8px] font-bold text-brand-plum/80 uppercase tracking-widest font-mono">
                {selectedProduct?.category ? selectedProduct.category.replace('-', ' ') : 'Handcrafted'}
              </span>
              <h4 className="font-serif text-sm sm:text-base font-bold text-brand-dark truncate mt-0.5">
                {selectedProduct?.title || selectedProduct?.name}
              </h4>
              <p className="text-[11px] text-brand-dark/70 line-clamp-1 mt-0.5">
                {selectedProduct?.description || selectedProduct?.desc}
              </p>
            </div>
          </div>

          {/* 1. Personalized Text / Monogram (Required) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-brand-dark flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-brand-plum" />
                <span>1. Personalization Text / Monogram</span>
                <span className="text-rose-500 font-normal text-[11px]">*Required</span>
              </label>
            </div>
            <textarea
              value={customText}
              onChange={(e) => {
                setCustomText(e.target.value);
                if (e.target.value.trim()) setErrorMessage('');
              }}
              placeholder="e.g. Names ('Aarav & Priya'), Monogram Initials ('S & R'), Special Date ('14.02.2026'), or Custom Quote / Message..."
              rows={2}
              className={`w-full text-xs p-3 rounded-2xl border bg-white/90 focus:outline-none focus:ring-2 focus:ring-brand-plum/30 transition-all resize-none leading-relaxed ${
                errorMessage ? 'border-rose-400 bg-rose-50/30' : 'border-brand-purple/20 focus:border-brand-purple'
              }`}
            />
            {errorMessage && (
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600 animate-fadeIn">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}
            <p className="text-[10px] text-brand-dark/60 italic">
              ✨ Our artisans hand-letter or stitch this directly onto your finished craft.
            </p>
          </div>

          {/* 2. Occasion / Purpose */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-dark flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-brand-plum" />
              <span>2. Occasion / Purpose</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {OCCASIONS.map((occ) => {
                const isSelected = selectedOccasion === occ;
                return (
                  <button
                    key={occ}
                    type="button"
                    onClick={() => setSelectedOccasion(occ)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-brand-plum text-white shadow-xs'
                        : 'bg-white/80 border border-brand-purple/15 text-brand-dark/80 hover:bg-white hover:text-brand-plum'
                    }`}
                  >
                    {occ}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Gift Message & Packaging */}
          <div className="space-y-3 pt-2 border-t border-brand-purple/10">
            <div>
              <label className="text-xs font-bold text-brand-dark flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-brand-plum" />
                  <span>3. Gift Note & Packaging Style</span>
                </span>
                <span className="text-[10px] font-normal text-brand-dark/50">(Optional)</span>
              </label>
              
              <textarea
                value={giftNote}
                onChange={(e) => setGiftNote(e.target.value)}
                placeholder="Include a heartfelt handwritten gift note to your loved one (e.g. 'Happy Birthday Yash! Love, Maya')..."
                rows={2}
                className="w-full text-xs p-3 rounded-2xl border border-brand-purple/20 bg-white/90 focus:outline-none focus:border-brand-purple resize-none leading-relaxed"
              />
            </div>

            {/* Packaging Style Choice */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PACKAGING_OPTIONS.map((pkg) => {
                const isSelected = packaging === pkg.label;
                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => setPackaging(pkg.label)}
                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-brand-purple/15 border-brand-plum ring-1 ring-brand-plum/40'
                        : 'bg-white/70 border-brand-purple/15 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-brand-dark">{pkg.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-brand-plum" />}
                    </div>
                    <span className="text-[10px] text-brand-dark/65 block mt-0.5">{pkg.note}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. Special Instructions */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-dark flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-brand-plum" />
                <span>4. Special Artisan Instructions / Charm Requests</span>
              </span>
              <span className="text-[10px] font-normal text-brand-dark/50">(Optional)</span>
            </label>
            <textarea
              value={specialInstructions}
              onChange={(e) => setSpecialInstructions(e.target.value)}
              placeholder="Any specific requests? (e.g., 'Please place initials on the bottom right corner', 'Use golden brass clasp for the keychain')..."
              rows={2}
              className="w-full text-xs p-3 rounded-2xl border border-brand-purple/20 bg-white/90 focus:outline-none focus:border-brand-purple resize-none leading-relaxed"
            />
          </div>

          {/* 6. Photo Reference Tip via WhatsApp */}
          <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-500/25 flex items-start gap-3 text-left">
            <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
              <MessageCircle className="w-4 h-4" />
            </div>
            <div className="text-[11px] leading-relaxed text-emerald-900">
              <strong className="font-bold">Have photos or custom reference images?</strong>
              <p className="text-emerald-800/85 mt-0.5">
                You can directly share portraits, polaroid photos, or design inspirations with us on WhatsApp (<strong>+91 99088 60895</strong>) after placing your order!
              </p>
            </div>
          </div>

        </div>

        {/* Footer: Quantity Stepper & Save & Add to Cart Button */}
        <div className="px-4 sm:px-7 py-3 sm:py-4 border-t border-brand-purple/15 bg-white/90 backdrop-blur-md flex flex-row items-center justify-between gap-3 flex-shrink-0 z-20 pb-safe">
          
          {/* Quantity Stepper */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            <span className="text-[11px] sm:text-xs font-bold text-brand-dark/75 font-mono">QTY:</span>
            <div className="flex items-center border border-brand-purple/20 rounded-full bg-white h-9 px-1">
              <button
                type="button"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-7 h-7 flex items-center justify-center text-xs font-bold text-brand-plum hover:bg-brand-purple/10 rounded-full disabled:opacity-40 cursor-pointer focus:outline-none"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-6 sm:w-7 text-center text-xs font-bold text-brand-dark">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity(q => Math.min(10, q + 1))}
                disabled={quantity >= 10}
                className="w-7 h-7 flex items-center justify-center text-xs font-bold text-brand-plum hover:bg-brand-purple/10 rounded-full disabled:opacity-40 cursor-pointer focus:outline-none"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-2 flex-1 sm:flex-initial">
            <button
              type="button"
              onClick={handleSaveAndAddToCart}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-2.5 px-4 sm:px-6 rounded-full font-semibold text-[11px] sm:text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg h-10 ${
                isSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-brand-plum hover:bg-brand-violet text-white'
              }`}
            >
              {isSuccess ? (
                <>
                  <Check className="w-4 h-4 animate-bounce" />
                  <span className="truncate">Saved & Added!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">Save & Add to Cart</span>
                </>
              )}
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default CustomizationModal;

