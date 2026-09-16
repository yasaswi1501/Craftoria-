import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Sparkles, Check, Heart, ShoppingBag, Palette, 
  Gift, MessageCircle, AlertCircle, HelpCircle, Package, Plus, Minus
} from 'lucide-react';
import { useCart } from '../context/CartContext';

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

export const COLOR_THEMES = [
  { id: 'lavender-lilac', name: 'Pastel Lavender & Lilac', colors: ['#76558F', '#D4B9E1', '#F5EEF8'] },
  { id: 'blush-pink', name: 'Blush Pink & Rose Gold', colors: ['#E88B9E', '#F7D1D8', '#FFF0F3'] },
  { id: 'sky-mint', name: 'Sky Blue & Mint', colors: ['#6EA8D9', '#A8E6CF', '#F0F9FF'] },
  { id: 'sage-cream', name: 'Sage Green & Cream', colors: ['#8FA88B', '#E5DFC5', '#F8F9F5'] },
  { id: 'sunset-peach', name: 'Warm Sunset & Peach', colors: ['#E28761', '#F7C59F', '#FFF6ED'] },
  { id: 'monochrome', name: 'Monochrome & Neutral', colors: ['#3A3A3C', '#9E9E9E', '#F5F5F7'] },
  { id: 'custom-palette', name: 'Custom Palette (Tell us in notes)', colors: ['#9C27B0', '#00BCD4', '#FF9800'] },
];

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

const CustomizationModal = ({ isOpen, onClose, product }) => {
  const { addToCart } = useCart();

  const [customText, setCustomText] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(COLOR_THEMES[0].name);
  const [selectedOccasion, setSelectedOccasion] = useState(OCCASIONS[0]);
  const [giftNote, setGiftNote] = useState('');
  const [packaging, setPackaging] = useState(PACKAGING_OPTIONS[0].label);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset form whenever a new product is selected
  useEffect(() => {
    if (product) {
      setCustomText('');
      setSelectedTheme(COLOR_THEMES[0].name);
      setSelectedOccasion(OCCASIONS[0]);
      setGiftNote('');
      setPackaging(PACKAGING_OPTIONS[0].label);
      setSpecialInstructions('');
      setQuantity(1);
      setErrorMessage('');
      setIsSuccess(false);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const getProductImage = (prod) => {
    const id = (prod?.id || '').toLowerCase();
    const cat = (prod?.category || '').toLowerCase();
    const imgName = prod?.thumbnail || prod?.image || '';

    if (imgName === 'gallery-2-blue-flower-keychain.jpg' || id.includes('blue-blossom')) return coverBlueFlowerKeychain;
    if (imgName === 'gallery-4-heart-keychain.jpg' || id.includes('heart-keychain') || id.includes('purple-heart')) return coverHeartKeychain;
    if (imgName === 'gallery-3-couple-embroidery.jpg' || id.includes('couple-embroidery')) return coverCoupleEmbroidery;
    if (imgName === 'gallery-5-child-frame.jpg' || id.includes('child-frame') || id.includes('wooden-frame')) return coverChildFrame;
    if (imgName === 'bloom-bouquets-cover.jpg' || id.includes('bloom-bouquets') || cat === 'craftoria-bloom-bouquets') return coverBouquets;
    if (imgName === 'macrame-wall-hanging.jpg' || cat === 'handmade-decor') return coverMacrame;
    if (imgName === 'clips-rubber-bands.jpg' || cat === 'clips-rubber-bands') return coverClips;
    if (imgName === 'polaroids-new.jpg' || cat === 'polaroids') return coverPolaroids;
    if (imgName === 'seller-bloom-keychains.png' || cat === 'keychains') return sellerBloomKeychains;
    if (imgName === 'seller-embroidery-hoop.png' || cat === 'embroidery') return sellerEmbroideryHoop;
    if (imgName === 'seller-bloom-bouquets.png') return sellerBloomBouquets;
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
      colorTheme: selectedTheme,
      occasion: selectedOccasion,
      giftNote: giftNote.trim() || undefined,
      packaging: packaging,
      specialNotes: specialInstructions.trim() || undefined,
    };

    const cartPayload = {
      id: product.id,
      name: product.title || product.name,
      price: product.price,
      desc: product.description || product.desc,
      image: product.thumbnail || product.image,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-brand-plum/45 backdrop-blur-sm cursor-pointer"
      />

      {/* Modal Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-2xl max-h-[92vh] bg-[#FCF8FC] border border-brand-purple/20 rounded-[28px] shadow-[0_20px_60px_rgba(75,46,93,0.22)] overflow-hidden flex flex-col z-10 text-brand-dark text-left my-auto"
      >
        {/* Header */}
        <div className="px-5 sm:px-7 py-4 border-b border-brand-purple/10 bg-white/70 backdrop-blur-md flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-purple/15 flex items-center justify-center text-brand-plum">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-brand-plum font-mono">
                Artisan Customization Studio
              </span>
              <h3 className="font-serif text-base sm:text-lg font-bold text-brand-dark leading-tight">
                Customize Your Handcrafted Piece
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-brand-purple/10 hover:bg-brand-purple/25 flex items-center justify-center text-brand-plum transition-colors cursor-pointer focus:outline-none"
            aria-label="Close customization modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="flex-grow overflow-y-auto p-5 sm:p-7 space-y-6 custom-scrollbar">
          
          {/* Selected Product Summary Card */}
          <div className="glass-card p-3.5 sm:p-4 rounded-2xl border border-brand-purple/15 bg-white/60 flex items-center gap-3.5">
            <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-xl bg-gradient-to-tr from-[#FCF7FF] via-[#F3E7FA] to-[#E9D7F5] border border-brand-purple/10 overflow-hidden flex-shrink-0 flex items-center justify-center p-1.5">
              <img
                src={getProductImage(product)}
                alt={product.title || product.name}
                className="w-full h-full object-contain pointer-events-none"
              />
            </div>
            <div className="flex-grow min-w-0">
              <span className="text-[8px] font-bold text-brand-plum/80 uppercase tracking-widest font-mono">
                {product.category ? product.category.replace('-', ' ') : 'Handcrafted'}
              </span>
              <h4 className="font-serif text-sm sm:text-base font-bold text-brand-dark truncate mt-0.5">
                {product.title || product.name}
              </h4>
              <p className="text-[11px] text-brand-dark/70 line-clamp-1 mt-0.5">
                {product.description || product.desc}
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

          {/* 2. Color Palette & Theme Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-brand-dark flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-brand-plum" />
              <span>2. Choose Color Palette & Theme</span>
            </label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {COLOR_THEMES.map((theme) => {
                const isSelected = selectedTheme === theme.name;
                return (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setSelectedTheme(theme.name)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-brand-purple/15 border-brand-plum shadow-xs ring-1 ring-brand-plum/40'
                        : 'bg-white/80 border-brand-purple/15 hover:bg-white hover:border-brand-purple/30'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div className="flex -space-x-1 flex-shrink-0">
                        {theme.colors.map((c, i) => (
                          <div
                            key={i}
                            className="w-3.5 h-3.5 rounded-full border border-white shadow-2xs"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-semibold text-brand-dark truncate">
                        {theme.name}
                      </span>
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-brand-plum text-white flex items-center justify-center flex-shrink-0">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Occasion / Purpose */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-brand-dark flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-brand-plum" />
              <span>3. Occasion / Purpose</span>
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

          {/* 4. Gift Message & Packaging */}
          <div className="space-y-3 pt-2 border-t border-brand-purple/10">
            <div>
              <label className="text-xs font-bold text-brand-dark flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-brand-plum" />
                  <span>4. Gift Note & Packaging Style</span>
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
                <span>5. Special Artisan Instructions / Charm Requests</span>
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
        <div className="px-5 sm:px-7 py-4 border-t border-brand-purple/15 bg-white/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-4 sticky bottom-0 z-20">
          
          {/* Quantity Stepper */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-brand-dark/75 font-mono">QTY:</span>
            <div className="flex items-center border border-brand-purple/20 rounded-full bg-white h-9 px-1">
              <button
                type="button"
                onClick={() => setQuantity(q => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="w-7 h-7 flex items-center justify-center text-xs font-bold text-brand-plum hover:bg-brand-purple/10 rounded-full disabled:opacity-40 cursor-pointer focus:outline-none"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-7 text-center text-xs font-bold text-brand-dark">{quantity}</span>
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
          <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
            <button
              type="button"
              onClick={handleSaveAndAddToCart}
              className={`flex-grow sm:flex-initial inline-flex items-center justify-center gap-2 py-2.5 px-6 rounded-full font-semibold text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg h-10 ${
                isSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-brand-plum hover:bg-brand-violet text-white'
              }`}
            >
              {isSuccess ? (
                <>
                  <Check className="w-4 h-4 animate-bounce" />
                  <span>Customization Saved & Added!</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Save Customization & Add to Cart</span>
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
