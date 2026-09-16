import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Trash, ArrowLeft, Check, Sparkles, Minus, Plus } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useRouter } from '../context/RouterContext';
import CustomizationModal from './CustomizationModal';

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

const Wishlist = () => {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart, cart, updateQuantity } = useCart();
  const { navigate } = useRouter();
  const [cartStates, setCartStates] = useState({}); // { productId: boolean }
  const [customizingProduct, setCustomizingProduct] = useState(null);
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  const getProductImage = (id, savedImage) => {
    const rawId = (id || '').toLowerCase();
    const rawSaved = savedImage || '';

    if (rawSaved === 'bouquet-1-flower.jpg' || rawId === 'bloom-bouquet-1-flower') return bouquet1Flower;
    if (rawSaved === 'bouquet-3-flower.jpg' || rawId === 'bloom-bouquet-3-flower') return bouquet3Flower;
    if (rawSaved === 'bouquet-5-flower.jpg' || rawId === 'bloom-bouquet-5-flower') return bouquet5Flower;
    if (rawSaved === 'custom-home-decor.jpg' || rawId.includes('custom-home-decor')) return customHomeDecor;
    if (rawSaved === 'embroidery-shirt.jpg' || rawId.includes('shirt')) return embroideryShirt;
    if (rawSaved === 'fridge-magnets.jpg' || rawId.includes('magnet')) return fridgeMagnets;
    if (rawSaved === 'flower-vase.jpg' || rawId.includes('vase')) return flowerVase;
    if (rawSaved === 'gallery-2-blue-flower-keychain.jpg' || rawId.includes('blue-blossom')) return coverBlueFlowerKeychain;
    if (rawSaved === 'gallery-4-heart-keychain.jpg' || rawId.includes('heart-keychain') || rawId.includes('purple-heart')) return coverHeartKeychain;
    if (rawSaved === 'gallery-3-couple-embroidery.jpg' || rawId.includes('couple-embroidery') || rawId.includes('middle-frame')) return coverCoupleEmbroidery;
    if (rawSaved === 'gallery-5-child-frame.jpg' || rawId.includes('child-frame') || rawId.includes('wooden-frame')) return coverChildFrame;
    if (rawSaved === 'seller-bloom-bouquets.png' || rawId.includes('custom-bloom-bouquet')) return sellerBloomBouquets;
    if (rawSaved === 'bloom-bouquets-cover.jpg' || rawId.includes('craftoria-bloom') || rawId.includes('bloom-bouquets')) return coverBouquets;
    if (rawSaved === 'macrame-wall-hanging.jpg' || rawId.includes('macrame') || rawId.includes('decor')) return coverMacrame;
    if (rawSaved === 'clips-rubber-bands.jpg' || rawId.includes('clip') || rawId.includes('rubber-band') || rawId.includes('accessories')) return coverClips;
    if (rawSaved === 'polaroids-new.jpg' || rawSaved === 'gallery-1-polaroid.jpg' || rawId.includes('polaroid')) return coverPolaroids;
    if (rawSaved === 'seller-bloom-keychains.png' || rawId.includes('keychain')) return sellerBloomKeychains;
    if (rawSaved === 'seller-embroidery-hoop.png' || rawId.includes('embroidery') || rawId.includes('hoop')) return sellerEmbroideryHoop;
    if (rawSaved === 'seller-bloom-bouquets.png' || rawId.includes('bouquet') || rawId.includes('gift')) return sellerBloomBouquets;
    if (rawSaved === 'seller-memory-canvas.png' || rawId.includes('canvas') || rawId.includes('frame')) return sellerMemoryCanvas;
    return sellerMemoryCanvas;
  };

  const handleAddToCart = (item) => {
    addToCart(item);
    setCartStates(prev => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setCartStates(prev => ({ ...prev, [item.id]: false }));
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#FDFBFD] pt-24 pb-16 px-4 sm:px-6 lg:px-8 text-brand-dark max-w-[1200px] mx-auto text-left">
      {/* Back Button to Home */}
      <div className="mb-6">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-plum hover:underline focus:outline-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Shop
        </a>
      </div>

      <div className="flex items-center justify-between border-b border-brand-purple/10 pb-4 mb-8">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-brand-plum">Your Favorites</span>
          <h1 className="font-serif text-3xl font-bold mt-1">My Wishlist</h1>
        </div>
        {wishlist.length > 0 && (
          <span className="text-xs font-semibold bg-brand-purple/15 text-brand-plum px-3.5 py-1.5 rounded-full uppercase tracking-wider">
            {wishlist.length} {wishlist.length === 1 ? 'Item' : 'Items'}
          </span>
        )}
      </div>

      <AnimatePresence mode="wait">
        {wishlist.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="flex flex-col items-center justify-center text-center py-20 bg-white/40 border border-brand-purple/10 rounded-[32px] p-6 max-w-lg mx-auto"
          >
            <div className="w-16 h-16 rounded-full bg-brand-purple/10 flex items-center justify-center mb-5">
              <Heart className="w-7 h-7 text-brand-plum/70" />
            </div>
            <h2 className="font-serif text-xl font-bold mb-2">Your Wishlist is empty</h2>
            <p className="text-xs text-brand-dark/70 leading-relaxed mb-8 max-w-xs">
              Save the handcrafted pieces you love and come back to them anytime.
            </p>
            <a
              href="/#collections"
              className="px-8 py-3.5 rounded-full bg-brand-plum hover:bg-brand-violet text-white font-semibold text-xs uppercase tracking-widest hover:shadow-md transition-all duration-300"
            >
              Explore Collections
            </a>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-7"
          >
            {wishlist.map(item => {
              const cartQty = cart.find((c) => c.id === item.id)?.quantity || 0;
              return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                onClick={() => navigate(`/product/${item.id}`)}
                className="glass-card rounded-[24px] overflow-hidden flex flex-col group border border-brand-purple/20 shadow-sm relative bg-white/40 cursor-pointer"
              >
                {/* Product Image */}
                <div className="h-[145px] sm:h-[220px] w-full border-b border-brand-purple/10 overflow-hidden relative bg-gradient-to-tr from-[#FCF7FF] via-[#F3E7FA] to-[#E9D7F5] flex items-center justify-center p-4">
                  <img
                    src={getProductImage(item.id, item.image)}
                    alt={item.name}
                    style={{
                      objectFit: 'contain',
                      objectPosition: 'center',
                      width: '100%',
                      height: '100%',
                      maxWidth: (item.id === 'memory-canvas' || item.id.includes('canvas')) ? '96%' : (item.id === 'embroidery-hoop' || item.id.includes('hoop')) ? '90%' : '84%',
                      maxHeight: (item.id === 'memory-canvas' || item.id.includes('canvas')) ? '96%' : (item.id === 'embroidery-hoop' || item.id.includes('hoop')) ? '90%' : '84%'
                    }}
                    className="select-none pointer-events-none group-hover:scale-105 transition-transform duration-500"
                  />
                  
                  {/* Remove Button overlay */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromWishlist(item.id);
                    }}
                    className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/80 hover:bg-white border border-brand-purple/15 flex items-center justify-center shadow-xs cursor-pointer focus:outline-none"
                    aria-label="Remove from wishlist"
                  >
                    <Trash className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>

                {/* Details */}
                <div className="p-3 sm:p-5 flex flex-col flex-grow text-left">
                  <span className="text-[8px] sm:text-[10px] font-semibold text-brand-plum/80 uppercase tracking-wider mb-0.5 sm:mb-1">
                    {item.desc || 'HANDMADE ARTISAN PIECE'}
                  </span>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-brand-dark mb-1">
                    {item.name}
                  </h3>

                  <div className="text-xs font-semibold text-emerald-600 mb-3 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-500 animate-pulse" /> In Stock & Ready to Ship
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 mt-auto">
                    {/* Primary Customize Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCustomizingProduct({
                          id: item.id,
                          title: item.name,
                          name: item.name,
                          description: item.desc,
                          desc: item.desc,
                          thumbnail: item.image,
                          image: item.image,
                        });
                        setIsCustomizeOpen(true);
                      }}
                      className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full bg-gradient-to-r from-brand-plum to-brand-violet hover:from-brand-violet hover:to-brand-plum text-white text-[10px] font-bold uppercase tracking-wider h-8 shadow-xs cursor-pointer transition-all duration-300 hover:shadow-md"
                    >
                      <Sparkles className="w-3 h-3 text-amber-200" />
                      <span>Customize Product</span>
                    </button>

                    {cartQty > 0 ? (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="w-full inline-flex items-center justify-between rounded-full bg-brand-plum/90 text-white h-8 px-2"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.id, cartQty - 1);
                          }}
                          className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/20 cursor-pointer focus:outline-none"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold min-w-[1.5rem] text-center">{cartQty}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.id, cartQty + 1);
                          }}
                          className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/20 cursor-pointer focus:outline-none"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(item);
                        }}
                        className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 rounded-full border border-brand-purple/25 bg-white hover:bg-brand-purple/10 text-brand-plum font-semibold text-[10px] uppercase tracking-wider transition-colors cursor-pointer h-8 shadow-2xs"
                      >
                        {cartStates[item.id] ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">Added!</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-3 h-3" />
                            <span>Quick Add</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customization Modal */}
      <CustomizationModal
        isOpen={isCustomizeOpen}
        onClose={() => {
          setIsCustomizeOpen(false);
          setCustomizingProduct(null);
        }}
        product={customizingProduct}
      />
    </div>
  );
};

export default Wishlist;
