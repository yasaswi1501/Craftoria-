import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Trash, ArrowLeft, Check, Sparkles, Minus, Plus } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useRouter } from '../context/RouterContext';

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

const Wishlist = () => {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart, cart, updateQuantity } = useCart();
  const { navigate } = useRouter();
  const [cartStates, setCartStates] = useState({}); // { productId: boolean }

  const getProductImage = (id, savedImage) => {
    const rawId = (id || '').toLowerCase();
    const rawSaved = savedImage || '';

    if (rawSaved === 'gallery-2-blue-flower-keychain.jpg' || rawId.includes('blue-blossom')) return coverBlueFlowerKeychain;
    if (rawSaved === 'gallery-4-heart-keychain.jpg' || rawId.includes('heart-keychain') || rawId.includes('purple-heart')) return coverHeartKeychain;
    if (rawSaved === 'gallery-3-couple-embroidery.jpg' || rawId.includes('couple-embroidery')) return coverCoupleEmbroidery;
    if (rawSaved === 'gallery-5-child-frame.jpg' || rawId.includes('child-frame') || rawId.includes('wooden-frame')) return coverChildFrame;
    if (rawSaved === 'bloom-bouquets-cover.jpg' || rawId.includes('craftoria-bloom') || rawId.includes('bloom-bouquets')) return coverBouquets;
    if (rawSaved === 'macrame-wall-hanging.jpg' || rawId.includes('macrame') || rawId.includes('decor')) return coverMacrame;
    if (rawSaved === 'clips-rubber-bands.jpg' || rawId.includes('clip') || rawId.includes('rubber-band')) return coverClips;
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
                  {cartQty > 0 ? (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="w-full mt-auto inline-flex items-center justify-between rounded-full bg-brand-plum text-white h-10 px-2"
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQuantity(item.id, cartQty - 1);
                        }}
                        className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/20 cursor-pointer focus:outline-none"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold min-w-[1.5rem] text-center">{cartQty}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updateQuantity(item.id, cartQty + 1);
                        }}
                        className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-white/20 cursor-pointer focus:outline-none"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(item);
                      }}
                      className="w-full mt-auto inline-flex items-center justify-center gap-2 py-2.5 rounded-full bg-brand-plum hover:bg-brand-violet text-white font-semibold text-[10px] sm:text-xs uppercase tracking-widest hover:shadow-md transition-all duration-300 cursor-pointer h-10"
                    >
                      {cartStates[item.id] ? (
                        <>
                          <Check className="w-3.5 h-3.5 animate-pulse" />
                          <span>Added!</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add to Cart</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Wishlist;
