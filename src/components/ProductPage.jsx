import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Heart, ShoppingBag, Star, Check, Sparkles,
  Truck, ShieldCheck, RefreshCw
} from 'lucide-react';
import { useRouter } from '../context/RouterContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { productsData, collectionsData } from '../data/products';
import { getProductImage } from '../utils/getProductImage';

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
    const catId = product.category === 'clips-rubber-bands' ? 'accessories' : product.category;
    return collectionsData.find(c => c.id === catId || c.id === product.category) || {
      id: product.category,
      name: 'Artisan Collection',
    };
  }, [product.category]);

  // Map an image filename (from product.galleryImages / product.thumbnail)
  // to its Vite-bundled asset module.
  const getGalleryImageSrc = (imgName) => getProductImage({ thumbnail: imgName });

  // State Management
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAddedToCart, setIsAddedToCart] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState('shipping'); // 'shipping' | 'warranty' | 'returns'
  // Optional "with frame" add-on selection -- only meaningful for products
  // that declare a frameAddOn (the embroidery hoop frames).
  const [withFrame, setWithFrame] = useState(false);

  // Reset states on product changes
  useEffect(() => {
    setActiveImage(0);
    setQuantity(1);
    setIsAddedToCart(false);
    setWithFrame(false);
    // Scroll view to top
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [productSlug]);

  const unitPrice = product.price + (withFrame && product.frameAddOn ? product.frameAddOn.price : 0);

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
    const hasFrame = withFrame && !!product.frameAddOn;
    const cartItem = {
      // Distinct id so "with frame" and "without frame" versions of the same
      // product are kept as separate cart line items instead of merging
      // (CartContext.addItemQuantity matches line items by this id).
      id: hasFrame ? `${product.id}-with-frame` : product.id,
      name: hasFrame ? `${product.title} (${product.frameAddOn.label})` : product.title,
      price: unitPrice,
      desc: product.description,
      image: product.thumbnail,
      qty: quantity
    };

    addToCart(cartItem, quantity);
    setIsAddedToCart(true);
    setTimeout(() => setIsAddedToCart(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FDFBFD] pt-20 sm:pt-24 pb-12 sm:pb-16 px-3.5 sm:px-6 lg:px-8 text-brand-dark max-w-[1250px] mx-auto text-left">
      
      {/* Breadcrumb Path */}
      <div className="mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-xs font-semibold text-brand-plum">
        <button
          onClick={() => navigate(`/collections/${product.category}`)}
          className="inline-flex items-center gap-1.5 hover:underline focus:outline-none cursor-pointer text-[11px] sm:text-xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to {collection.name}
        </button>
        <div className="text-brand-dark/50 select-none text-[10px] sm:text-xs">
          Home <span className="mx-1">/</span> Collections <span className="mx-1">/</span> 
          <a href={`/collections/${product.category}`} className="hover:underline font-bold">{collection.name}</a> 
          <span className="mx-1">/</span> <span className="text-brand-plum font-bold">{product.title}</span>
        </div>
      </div>

      {/* Main Showcase Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-start mb-12 sm:mb-16 bg-white/40 border border-brand-purple/15 rounded-[24px] sm:rounded-[32px] p-3.5 sm:p-8 shadow-xs">
        
        {/* Left Column: Image Showcases (col-span-6) */}
        <div className="lg:col-span-6 space-y-3 sm:space-y-4">
          <div className="h-[280px] sm:h-[420px] w-full rounded-[20px] sm:rounded-[24px] overflow-hidden border border-brand-purple/15 relative group bg-[#FDFBFD]">
            <motion.img
              key={activeImage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              src={getGalleryImageSrc(product.galleryImages[activeImage] || product.thumbnail)}
              alt={product.title}
              decoding="async"
              className="w-full h-full object-cover select-none pointer-events-none transition-transform duration-500 group-hover:scale-105"
            />
            {product.discount > 0 && (
              <span className="absolute top-3 left-3 sm:top-4 sm:left-4 bg-emerald-500 text-white font-bold text-[8px] sm:text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md font-mono shadow-xs">
                Offer Active
              </span>
            )}
          </div>

          {/* Gallery Thumbnails List */}
          {product.galleryImages && product.galleryImages.length > 1 && (
            <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1 max-w-full no-scrollbar">
              {product.galleryImages.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImage(idx)}
                  className={`w-14 h-14 sm:w-20 sm:h-20 rounded-xl border-2 overflow-hidden bg-white/60 cursor-pointer flex-shrink-0 transition-all ${activeImage === idx ? 'border-brand-plum shadow-xs' : 'border-brand-purple/10 hover:border-brand-purple/40'}`}
                >
                  <img
                    src={getGalleryImageSrc(img)}
                    alt={`${product.title} view ${idx + 1}`}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover pointer-events-none"
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

          {/* Price block -- only shown for products that need a visible price
              here: an optional paid add-on (frame) to select, a "starting
              from" price, or a pack-size note. All other products keep the
              price display purely on the collection cards, as before. */}
          {(product.frameAddOn || product.pricePrefix || product.packLabel) && (
            <div className="pt-3 border-t border-brand-purple/10 space-y-2.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold text-brand-dark/75 font-mono">PRICE:</span>
                <span className="font-serif text-lg sm:text-xl font-bold text-brand-plum text-right">
                  {product.pricePrefix && (
                    <span className="text-[10px] font-semibold text-brand-dark/60 mr-1.5 align-middle uppercase tracking-wide">
                      {product.pricePrefix}
                    </span>
                  )}
                  ₹{unitPrice.toLocaleString('en-IN')}
                </span>
              </div>

              {product.frameAddOn && (
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-brand-dark/80">
                  <input
                    type="checkbox"
                    checked={withFrame}
                    onChange={(e) => setWithFrame(e.target.checked)}
                    className="accent-brand-plum w-4 h-4 rounded cursor-pointer"
                  />
                  <span>{product.frameAddOn.label} (+₹{product.frameAddOn.price.toLocaleString('en-IN')})</span>
                </label>
              )}

              {product.packLabel && (
                <span className="inline-block text-[10px] font-bold text-brand-plum bg-brand-purple/10 px-2.5 py-1 rounded-full">
                  {product.packLabel}
                </span>
              )}

              {product.priceNote && (
                <p className="text-[10px] text-brand-dark/60 font-medium">{product.priceNote}</p>
              )}
            </div>
          )}

          {/* Interactive Row: Quantity & Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 pt-3 border-t border-brand-purple/10">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <span className="text-xs font-bold text-brand-dark/75 font-mono">QTY:</span>
              <div className="flex items-center border border-brand-purple/20 rounded-full bg-white h-9 px-1">
                <button
                  onClick={() => handleQtyChange(-1)}
                  disabled={quantity <= 1}
                  className="w-7 h-7 flex items-center justify-center text-xs font-bold text-brand-plum hover:bg-brand-purple/10 rounded-full disabled:opacity-40 cursor-pointer focus:outline-none"
                >
                  -
                </button>
                <span className="w-7 sm:w-8 text-center text-xs font-bold text-brand-dark">{quantity}</span>
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
                {product.stock > 0 ? `${product.stock} In Stock` : 'Out of Stock (Stitched to Order)'}
              </span>
            </div>
          </div>

          {/* Action Purchase Buttons - ONLY Add to Cart & Wishlist */}
          <div className="flex gap-2.5 sm:gap-3 pt-2 sm:pt-3">
            <button
              onClick={handleAddToCart}
              className="flex-grow inline-flex items-center justify-center gap-2 py-3 px-5 sm:px-6 rounded-full bg-brand-plum hover:bg-brand-violet text-white font-semibold text-xs uppercase tracking-widest hover:shadow-md cursor-pointer transition-all h-11"
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
            <div className="flex border-b border-brand-purple/10 font-bold bg-white/50 text-[9px] sm:text-[10px] uppercase tracking-wider font-mono">
              <button
                onClick={() => setActiveAccordion('shipping')}
                className={`flex-1 py-2 sm:py-2.5 px-1 sm:px-3 border-r border-brand-purple/10 flex items-center justify-center gap-1 text-center truncate ${activeAccordion === 'shipping' ? 'bg-white text-brand-plum font-bold' : 'hover:bg-brand-purple/5'}`}
              >
                <Truck className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" /> <span className="truncate">Shipping</span>
              </button>
              <button
                onClick={() => setActiveAccordion('returns')}
                className={`flex-1 py-2 sm:py-2.5 px-1 sm:px-3 border-r border-brand-purple/10 flex items-center justify-center gap-1 text-center truncate ${activeAccordion === 'returns' ? 'bg-white text-brand-plum font-bold' : 'hover:bg-brand-purple/5'}`}
              >
                <RefreshCw className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" /> <span className="truncate">Returns</span>
              </button>
              <button
                onClick={() => setActiveAccordion('warranty')}
                className={`flex-1 py-2 sm:py-2.5 px-1 sm:px-3 flex items-center justify-center gap-1 text-center truncate ${activeAccordion === 'warranty' ? 'bg-white text-brand-plum font-bold' : 'hover:bg-brand-purple/5'}`}
              >
                <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" /> <span className="truncate">Guarantee</span>
              </button>
            </div>

            {/* Tabs content block */}
            <div className="p-3.5 sm:p-4 leading-relaxed font-medium text-xs">
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
        <div className="space-y-4 sm:space-y-6">
          <div className="border-b border-brand-purple/10 pb-3 sm:pb-4 text-left">
            <h2 className="font-serif text-lg sm:text-xl font-bold text-brand-dark">Related Crafts</h2>
            <p className="text-xs text-brand-dark/65 mt-0.5 font-medium">Explore alternative designs from our {collection.name} collection.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {relatedProducts.map((p) => (
              <div
                key={p.id}
                onClick={() => navigate(`/product/${p.slug}`)}
                className="glass-card rounded-[20px] sm:rounded-[24px] overflow-hidden flex flex-col group border border-brand-purple/20 shadow-xs relative bg-white/60 cursor-pointer text-left p-2.5 sm:p-3.5 pb-3.5 sm:pb-4.5 hover:border-brand-purple/40 hover:shadow-md transition-all"
              >
                <div className="h-32 sm:h-44 w-full rounded-xl sm:rounded-2xl overflow-hidden relative bg-[#FDFBFD]">
                  <img
                    src={getGalleryImageSrc(p.thumbnail)}
                    alt={p.title}
                    className="w-full h-full object-cover pointer-events-none transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="pt-2.5 sm:pt-3.5 px-0.5 flex flex-col gap-1 sm:gap-2">
                  <h4 className="font-serif text-xs sm:text-sm font-bold text-brand-dark leading-snug line-clamp-1 group-hover:text-brand-plum transition-colors">
                    {p.title}
                  </h4>
                  <span className="text-xs sm:text-sm font-bold text-brand-plum">
                    ₹{(p.price - (p.discount || 0)).toLocaleString('en-IN')}
                  </span>
                  <div className="text-[10px] sm:text-xs font-semibold text-brand-plum flex items-center gap-1 group-hover:underline group-hover:translate-x-0.5 transition-transform">
                    View Craft &rarr;
                  </div>
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

