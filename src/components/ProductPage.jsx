import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Heart, ShoppingBag, Star, Check, Sparkles, ChevronDown, 
  ChevronUp, Truck, ShieldCheck, RefreshCw, AlertCircle, Palette, Gift, Package, HelpCircle, MessageCircle 
} from 'lucide-react';
import { useRouter } from '../context/RouterContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { productsData, collectionsData } from '../data/products';
import { COLOR_THEMES, OCCASIONS, PACKAGING_OPTIONS } from './CustomizationModal';

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

const ProductPage = ({ productSlug }) => {
  const { navigate } = useRouter();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  // Find product by slug
  const product = useMemo(() => {
    return productsData.find(p => p.slug === productSlug) || productsData[0];
  }, [productSlug]);

  // Load collection metadata
  const collection = useMemo(() => {
    return collectionsData.find(c => c.id === product.category) || {
      id: product.category,
      name: 'Artisan Collection',
    };
  }, [product.category]);

  // Map image string to Vite imports
  const getGalleryImageSrc = (imgName) => {
    if (imgName === 'seller-memory-canvas.png') return sellerMemoryCanvas;
    if (imgName === 'seller-embroidery-hoop.png') return sellerEmbroideryHoop;
    if (imgName === 'seller-bloom-keychains.png') return sellerBloomKeychains;
    if (imgName === 'seller-bloom-bouquets.png') return sellerBloomBouquets;
    if (imgName === 'gallery-1-polaroid.jpg') return coverPolaroids;
    if (imgName === 'gallery-7-two-flower-keychain.jpg' || imgName === 'clips-rubber-bands.jpg') return coverClips;
    if (imgName === 'macrame-wall-hanging.jpg') return coverMacrame;
    if (imgName === 'bloom-bouquets-cover.jpg') return coverBouquets;
    if (imgName === 'gallery-5-child-frame.jpg') return coverChildFrame;
    if (imgName === 'gallery-3-couple-embroidery.jpg') return coverCoupleEmbroidery;
    if (imgName === 'gallery-2-blue-flower-keychain.jpg') return coverBlueFlowerKeychain;
    return sellerMemoryCanvas;
  };

  // State Management
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [customizationText, setCustomizationText] = useState('');
  const [selectedTheme, setSelectedTheme] = useState(COLOR_THEMES[0].name);
  const [selectedOccasion, setSelectedOccasion] = useState(OCCASIONS[0]);
  const [giftNote, setGiftNote] = useState('');
  const [packaging, setPackaging] = useState(PACKAGING_OPTIONS[0].label);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [customizationError, setCustomizationError] = useState('');
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState('shipping'); // 'shipping' | 'warranty' | 'returns'

  // Reset states on product changes
  useEffect(() => {
    setActiveImage(0);
    setQuantity(1);
    setCustomizationText('');
    setSelectedTheme(COLOR_THEMES[0].name);
    setSelectedOccasion(OCCASIONS[0]);
    setGiftNote('');
    setPackaging(PACKAGING_OPTIONS[0].label);
    setSpecialInstructions('');
    setCustomizationError('');
    setIsAddedToCart(false);
    // Scroll view to top
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [productSlug]);

  // Filter out related products (in same category, excluding current product)
  const relatedProducts = useMemo(() => {
    return productsData
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, 4);
  }, [product.category, product.id]);

  const handleQtyChange = (val) => {
    const nextVal = quantity + val;
    if (nextVal >= 1 && nextVal <= 10) {
      setQuantity(nextVal);
    }
  };

  const handleAddToCart = () => {
    if (!customizationText.trim()) {
      setCustomizationError('Please enter your personalized name, initials, or custom text before adding to cart.');
      return;
    }
    setCustomizationError('');

    const customizationData = {
      text: customizationText.trim(),
      colorTheme: selectedTheme,
      occasion: selectedOccasion,
      giftNote: giftNote.trim() || undefined,
      packaging: packaging,
      specialNotes: specialInstructions.trim() || undefined,
    };

    const cartItem = {
      id: product.id,
      name: product.title,
      price: product.price,
      desc: product.description,
      image: product.thumbnail,
      customText: customizationText.trim(),
      customization: customizationData,
      qty: quantity
    };

    // Call global Context addToCart helper
    addToCart(cartItem, quantity);
    setIsAddedToCart(true);
    setTimeout(() => setIsAddedToCart(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FDFBFD] pt-24 pb-16 px-4 sm:px-6 lg:px-8 text-brand-dark max-w-[1250px] mx-auto text-left">
      
      {/* Breadcrumb Path */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-brand-plum">
        <button
          onClick={() => navigate(`/collections/${product.category}`)}
          className="inline-flex items-center gap-1.5 hover:underline focus:outline-none cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to {collection.name}
        </button>
        <div className="text-brand-dark/50 select-none">
          Home <span className="mx-1">/</span> Collections <span className="mx-1">/</span> 
          <a href={`/collections/${product.category}`} className="hover:underline font-bold">{collection.name}</a> 
          <span className="mx-1">/</span> <span className="text-brand-plum font-bold">{product.title}</span>
        </div>
      </div>

      {/* Main Showcase Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mb-16 bg-white/40 border border-brand-purple/15 rounded-[32px] p-5 sm:p-8">
        
        {/* Left Column: Image Showcases (col-span-6) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="h-[280px] sm:h-[400px] w-full rounded-[24px] overflow-hidden bg-gradient-to-tr from-[#FCF7FF] via-[#F3E7FA] to-[#E9D7F5] flex items-center justify-center p-6 border border-brand-purple/15 relative group">
            <motion.img
              key={activeImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={getGalleryImageSrc(product.galleryImages[activeImage] || product.thumbnail)}
              alt={product.title}
              decoding="async"
              style={{
                objectFit: 'contain',
                objectPosition: 'center',
                width: '100%',
                height: '100%',
                maxWidth: '92%',
                maxHeight: '92%'
              }}
              className="select-none pointer-events-none transition-transform duration-500 group-hover:scale-105"
            />
            {product.discount > 0 && (
              <span className="absolute top-4 left-4 bg-emerald-500 text-white font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md font-mono shadow-xs">
                Offer Active
              </span>
            )}
          </div>

          {/* Gallery Thumbnails List */}
          {product.galleryImages && product.galleryImages.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1 max-w-full">
              {product.galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 flex items-center justify-center p-2 bg-white/60 cursor-pointer overflow-hidden flex-shrink-0 transition-all ${activeImage === idx ? 'border-brand-plum shadow-sm' : 'border-brand-purple/10 hover:border-brand-purple/40'}`}
                >
                  <img
                    src={getGalleryImageSrc(img)}
                    alt={`${product.title} view ${idx + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-contain pointer-events-none"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Details & Purchasing (col-span-6) */}
        <div className="lg:col-span-6 space-y-6">
          <div>
            <span className="text-[10px] font-bold text-brand-plum uppercase tracking-widest font-mono bg-brand-purple/10 px-2.5 py-1 rounded-md">
              {collection.name}
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-brand-dark mt-3.5 leading-tight">
              {product.title}
            </h1>
            
            {/* Reviews Rating summary */}
            <div className="flex items-center gap-1.5 mt-2.5">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${i < Math.floor(product.rating) ? 'fill-amber-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <span className="text-xs font-bold text-brand-dark/70 font-mono">
                {product.rating} ({product.reviewCount} customer reviews)
              </span>
            </div>
          </div>

          {/* Basic description */}
          <p className="text-xs sm:text-sm text-brand-dark/75 font-medium leading-relaxed pt-2 border-t border-brand-purple/10">
            {product.details || product.description}
          </p>

          {/* Interactive Customization Studio Section */}
          <div className="space-y-4 pt-3 border-t border-brand-purple/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-brand-dark flex items-center gap-1.5 font-serif">
                <Sparkles className="w-4 h-4 text-brand-plum" />
                <span>Customization Options</span>
              </span>
              <span className="text-[10px] text-brand-plum font-mono uppercase tracking-wider font-bold bg-brand-purple/10 px-2 py-0.5 rounded-full">
                Handcrafted for You
              </span>
            </div>

            {/* 1. Personalized Text Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-dark/85 flex items-center justify-between">
                <span>1. Personalization Text / Monogram <span className="text-rose-500 font-normal">*Required</span></span>
              </label>
              <textarea
                value={customizationText}
                onChange={(e) => {
                  setCustomizationText(e.target.value);
                  if (e.target.value.trim()) setCustomizationError('');
                }}
                placeholder="e.g. Names ('Aarav & Priya'), Monogram Initials ('S & R'), Special Date ('14.02.2026'), or Custom Quote..."
                rows={2}
                className={`w-full text-xs p-3 rounded-2xl border bg-white/70 focus:outline-none focus:ring-2 focus:ring-brand-plum/30 resize-none leading-relaxed transition-all ${
                  customizationError ? 'border-rose-400 bg-rose-50/40' : 'border-brand-purple/20 focus:border-brand-purple'
                }`}
              />
              {customizationError && (
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{customizationError}</span>
                </div>
              )}
            </div>

            {/* 2. Color Palette Theme */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-dark/85 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-brand-plum" />
                <span>2. Color Palette & Theme</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {COLOR_THEMES.map((theme) => {
                  const isSelected = selectedTheme === theme.name;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setSelectedTheme(theme.name)}
                      className={`flex items-center justify-between p-2 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-brand-purple/15 border-brand-plum ring-1 ring-brand-plum/40 shadow-xs'
                          : 'bg-white/60 border-brand-purple/15 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 pr-1">
                        <div className="flex -space-x-1 flex-shrink-0">
                          {theme.colors.map((c, i) => (
                            <div
                              key={i}
                              className="w-3 h-3 rounded-full border border-white"
                              style={{ backgroundColor: c }}
                            />
                          ))}
                        </div>
                        <span className="text-[10px] font-semibold text-brand-dark truncate">
                          {theme.name}
                        </span>
                      </div>
                      {isSelected && <Check className="w-3 h-3 text-brand-plum flex-shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Occasion Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-dark/85 flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-brand-plum" />
                <span>3. Occasion / Purpose</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {OCCASIONS.map((occ) => {
                  const isSelected = selectedOccasion === occ;
                  return (
                    <button
                      key={occ}
                      type="button"
                      onClick={() => setSelectedOccasion(occ)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-brand-plum text-white shadow-xs'
                          : 'bg-white/70 border border-brand-purple/15 text-brand-dark/80 hover:bg-white hover:text-brand-plum'
                      }`}
                    >
                      {occ}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Gift Note & Packaging */}
            <div className="space-y-2 pt-1 border-t border-brand-purple/10">
              <label className="text-xs font-bold text-brand-dark/85 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-brand-plum" />
                  <span>4. Handwritten Gift Note & Packaging</span>
                </span>
                <span className="text-[10px] font-normal text-brand-dark/50">(Optional)</span>
              </label>
              <textarea
                value={giftNote}
                onChange={(e) => setGiftNote(e.target.value)}
                placeholder="Include a heartfelt handwritten gift note to your loved one..."
                rows={2}
                className="w-full text-xs p-2.5 rounded-xl border border-brand-purple/20 bg-white/70 focus:outline-none focus:border-brand-purple resize-none leading-relaxed"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PACKAGING_OPTIONS.map((pkg) => {
                  const isSelected = packaging === pkg.label;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setPackaging(pkg.label)}
                      className={`p-2 rounded-xl border text-left cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-brand-purple/15 border-brand-plum ring-1 ring-brand-plum/40'
                          : 'bg-white/60 border-brand-purple/15 hover:bg-white'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-brand-dark block">{pkg.label}</span>
                      <span className="text-[9px] text-brand-dark/60 block">{pkg.note}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Special Instructions */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-brand-dark/85 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-brand-plum" />
                  <span>5. Special Artisan Instructions</span>
                </span>
                <span className="text-[10px] font-normal text-brand-dark/50">(Optional)</span>
              </label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Any special placement, charm colors, or design requests..."
                rows={1}
                className="w-full text-xs p-2.5 rounded-xl border border-brand-purple/20 bg-white/70 focus:outline-none focus:border-brand-purple resize-none leading-relaxed"
              />
            </div>

            {/* 6. Photo Reference Tip via WhatsApp */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2.5 text-left">
              <MessageCircle className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
              <div className="text-[10px] leading-relaxed text-emerald-900">
                <strong>Have photo references?</strong> Share your portraits/photos directly with our artists on WhatsApp (+91 99088 60895) after placing the order!
              </div>
            </div>
          </div>

          {/* Interactive Row: Quantity & Status */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-brand-purple/10">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-brand-dark/75 font-mono">QTY:</span>
              <div className="flex items-center border border-brand-purple/20 rounded-full bg-white h-9 px-1">
                <button
                  onClick={() => handleQtyChange(-1)}
                  disabled={quantity <= 1}
                  className="w-7 h-7 flex items-center justify-center text-xs font-bold text-brand-plum hover:bg-brand-purple/10 rounded-full disabled:opacity-40 cursor-pointer focus:outline-none"
                >
                  -
                </button>
                <span className="w-8 text-center text-xs font-bold text-brand-dark">{quantity}</span>
                <button
                  onClick={() => handleQtyChange(1)}
                  disabled={quantity >= 10}
                  className="w-7 h-7 flex items-center justify-center text-xs font-bold text-brand-plum hover:bg-brand-purple/10 rounded-full disabled:opacity-40 cursor-pointer focus:outline-none"
                >
                  +
                </button>
              </div>
            </div>

            {/* Stock Availability */}
            <div className="flex items-center gap-1.5 text-xs font-bold font-mono">
              <div className={`w-2 h-2 rounded-full ${product.stock > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              <span className={product.stock > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                {product.stock > 0 ? `${product.stock} Items In Stock` : 'Out of Stock (Stitched to Order)'}
              </span>
            </div>
          </div>

          {/* Action Purchase Buttons - ONLY Add to Cart & Wishlist */}
          <div className="flex gap-3 pt-3">
            <button
              onClick={handleAddToCart}
              className="flex-grow inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-brand-plum hover:bg-brand-violet text-white font-semibold text-xs uppercase tracking-widest hover:shadow-md cursor-pointer transition-all h-11"
            >
              {isAddedToCart ? (
                <>
                  <Check className="w-4 h-4" /> Added to Cart
                </>
              ) : (
                <>
                  <ShoppingBag className="w-4 h-4" /> Add to Cart
                </>
              )}
            </button>

            <button
              onClick={() => toggleWishlist({
                id: product.id,
                name: product.title,
                price: product.price,
                desc: product.description,
                image: product.thumbnail
              })}
              className="p-3 rounded-full border border-brand-purple/20 text-brand-plum hover:bg-brand-purple/10 flex items-center justify-center cursor-pointer h-11 w-11 focus:outline-none flex-shrink-0"
              aria-label="Wishlist Toggle"
            >
              <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : 'text-brand-dark/50'}`} />
            </button>
          </div>

          {/* Information Accordions / Tabs */}
          <div className="border border-brand-purple/15 rounded-2xl bg-white/30 overflow-hidden text-xs text-brand-dark/80">
            {/* Tabs Selector headers */}
            <div className="flex border-b border-brand-purple/10 font-bold bg-white/50 text-[10px] uppercase tracking-wider font-mono">
              <button
                onClick={() => setActiveAccordion('shipping')}
                className={`flex-grow py-2.5 px-3 border-r border-brand-purple/10 flex items-center justify-center gap-1 ${activeAccordion === 'shipping' ? 'bg-white text-brand-plum' : 'hover:bg-brand-purple/5'}`}
              >
                <Truck className="w-3.5 h-3.5" /> Shipping Details
              </button>
              <button
                onClick={() => setActiveAccordion('returns')}
                className={`flex-grow py-2.5 px-3 border-r border-brand-purple/10 flex items-center justify-center gap-1 ${activeAccordion === 'returns' ? 'bg-white text-brand-plum' : 'hover:bg-brand-purple/5'}`}
              >
                <RefreshCw className="w-3.5 h-3.5" /> Returns Policy
              </button>
              <button
                onClick={() => setActiveAccordion('warranty')}
                className={`flex-grow py-2.5 px-3 flex items-center justify-center gap-1 ${activeAccordion === 'warranty' ? 'bg-white text-brand-plum' : 'hover:bg-brand-purple/5'}`}
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Craft Guarantee
              </button>
            </div>

            {/* Tabs content block */}
            <div className="p-4 leading-relaxed font-medium">
              {activeAccordion === 'shipping' && (
                <div className="space-y-1.5">
                  <p>{product.shippingDetails || 'Bespoke wrapped packaging in reinforced boxes to prevent physical damage.'}</p>
                  <p className="font-bold text-brand-plum font-mono flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Estimated Delivery: {product.estimatedDelivery || '3-5 Business Days'}
                  </p>
                </div>
              )}
              {activeAccordion === 'returns' && (
                <p>{product.returnPolicy || 'Unused standard crafts can be returned within 14 days. Monogrammed or personalized items are custom crafted to order and are returnable only in cases of shipping damage.'}</p>
              )}
              {activeAccordion === 'warranty' && (
                <p>Every Craftoria piece is hand-sewn, wrapped, or framed with love. We use museum-grade linen threads, reinforced wood backing molds, and premium acrylic elements that remain vibrant forever.</p>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Related Products Grid */}
      {relatedProducts.length > 0 && (
        <div className="space-y-6">
          <div className="border-b border-brand-purple/10 pb-4 text-left">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-brand-dark">Related Crafts</h2>
            <p className="text-xs text-brand-dark/65 mt-1 font-medium">Explore alternative designs from our {collection.name} collection.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/product/${p.slug}`)}
                className="glass-card rounded-[22px] overflow-hidden flex flex-col group border border-brand-purple/20 shadow-xs relative bg-white/40 cursor-pointer min-h-[305px] text-left p-3"
              >
                <div className="h-40 w-full rounded-xl overflow-hidden bg-gradient-to-tr from-[#FCF7FF] via-[#F3E7FA] to-[#E9D7F5] flex items-center justify-center p-3 relative">
                  <img
                    src={getGalleryImageSrc(p.thumbnail)}
                    alt={p.title}
                    className="h-full object-contain pointer-events-none transition-transform duration-500 group-hover:scale-105"
                    style={{ maxWidth: '88%', maxHeight: '88%' }}
                  />
                </div>
                <div className="pt-3 flex flex-col flex-grow">
                  <h4 className="font-serif text-xs sm:text-sm font-bold text-brand-dark leading-tight line-clamp-1 mb-1 group-hover:text-brand-plum transition-colors">
                    {p.title}
                  </h4>
                  <div className="text-[11px] font-semibold text-brand-plum mt-auto group-hover:underline">View Craft &rarr;</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default ProductPage;
