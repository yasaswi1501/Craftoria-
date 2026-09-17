import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingBag, Trash, ArrowLeft, Check, Sparkles, Minus, Plus, Eye } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useRouter } from '../context/RouterContext';
import { getProductImage } from '../utils/getProductImage';

const Wishlist = () => {
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart, cart, updateQuantity } = useCart();
  const { navigate } = useRouter();
  const [cartStates, setCartStates] = useState({}); // { productId: boolean }

  const handleAddToCart = (item) => {
    addToCart(item);
    setCartStates(prev => ({ ...prev, [item.id]: true }));
    setTimeout(() => {
      setCartStates(prev => ({ ...prev, [item.id]: false }));
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#FDFBFD] pt-20 sm:pt-24 pb-12 sm:pb-16 px-3.5 sm:px-6 lg:px-8 text-brand-dark max-w-[1200px] mx-auto text-left">
      {/* Back Button to Home */}
      <div className="mb-4 sm:mb-6">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-plum hover:underline focus:outline-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Shop
        </a>
      </div>

      <div className="flex items-center justify-between border-b border-brand-purple/10 pb-3 sm:pb-4 mb-6 sm:mb-8">
        <div>
          <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-brand-plum">Your Favorites</span>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold mt-0.5 sm:mt-1">My Wishlist</h1>
        </div>
        {wishlist.length > 0 && (
          <span className="text-[11px] sm:text-xs font-semibold bg-brand-purple/15 text-brand-plum px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full uppercase tracking-wider">
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
            className="flex flex-col items-center justify-center text-center py-16 sm:py-20 bg-white/40 border border-brand-purple/10 rounded-[28px] sm:rounded-[32px] p-5 sm:p-6 max-w-lg mx-auto shadow-xs"
          >
            <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-full bg-brand-purple/10 flex items-center justify-center mb-4 sm:mb-5">
              <Heart className="w-6 sm:w-7 h-6 sm:h-7 text-brand-plum/70" />
            </div>
            <h2 className="font-serif text-lg sm:text-xl font-bold mb-1.5">Your Wishlist is empty</h2>
            <p className="text-xs text-brand-dark/70 leading-relaxed mb-6 sm:mb-8 max-w-xs">
              Save the handcrafted pieces you love and come back to them anytime.
            </p>
            <button
              onClick={() => navigate('/collections')}
              className="px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-brand-plum hover:bg-brand-violet text-white font-semibold text-xs uppercase tracking-widest hover:shadow-md transition-all duration-300 cursor-pointer"
            >
              Explore Collections
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-7"
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
                className="glass-card rounded-[20px] sm:rounded-[24px] overflow-hidden flex flex-col group border border-brand-purple/20 shadow-xs hover:shadow-md relative bg-white/50 cursor-pointer transition-all"
              >
                {/* Product Image */}
                <div className="h-[210px] sm:h-[220px] w-full border-b border-brand-purple/10 overflow-hidden relative bg-[#FDFBFD]">
                  <img
                    src={getProductImage(item)}
                    alt={item.name}
                    className="w-full h-full object-cover select-none pointer-events-none group-hover:scale-108 transition-transform duration-700 ease-out"
                  />

                  {/* Remove Button overlay */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromWishlist(item.id);
                    }}
                    className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-7 h-7 rounded-full bg-white/80 hover:bg-white border border-brand-purple/15 flex items-center justify-center shadow-xs cursor-pointer focus:outline-none"
                    aria-label="Remove from wishlist"
                  >
                    <Trash className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>

                {/* Details */}
                <div className="p-2.5 sm:p-5 flex flex-col flex-grow text-left">
                  <span className="text-[7.5px] sm:text-[10px] font-semibold text-brand-plum/80 uppercase tracking-wider mb-0.5 sm:mb-1 truncate font-mono">
                    {item.desc || 'ARTISAN PIECE'}
                  </span>
                  <h3 className="font-serif text-xs sm:text-lg font-bold text-brand-dark mb-1 line-clamp-1">
                    {item.name}
                  </h3>
                  {typeof item.price === 'number' && (
                    <span className="text-sm sm:text-base font-bold text-brand-plum mb-1.5 sm:mb-2">
                      ₹{item.price.toLocaleString('en-IN')}
                    </span>
                  )}

                  <div className="text-[9.5px] sm:text-xs font-semibold text-emerald-600 mb-2 sm:mb-3 flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-emerald-500 animate-pulse flex-shrink-0" /> <span className="truncate">In Stock</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1.5 sm:gap-2 mt-auto">
                    {cartQty > 0 ? (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="flex-grow inline-flex items-center justify-between rounded-full bg-brand-plum/90 text-white h-7.5 sm:h-8 px-2"
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.id, cartQty - 1);
                          }}
                          className="w-5 sm:w-6 h-5 sm:h-6 rounded-full flex items-center justify-center hover:bg-white/20 cursor-pointer focus:outline-none"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-2.5 sm:w-3 h-2.5 sm:h-3" />
                        </button>
                        <span className="text-[10px] sm:text-xs font-bold min-w-[1.2rem] text-center">{cartQty}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.id, cartQty + 1);
                          }}
                          className="w-5 sm:w-6 h-5 sm:h-6 rounded-full flex items-center justify-center hover:bg-white/20 cursor-pointer focus:outline-none"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-2.5 sm:w-3 h-2.5 sm:h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(item);
                        }}
                        className="flex-grow inline-flex items-center justify-center gap-1 py-1 rounded-full border border-brand-purple/25 bg-white hover:bg-brand-purple/10 text-brand-plum font-semibold text-[8.5px] sm:text-[10px] uppercase tracking-wider transition-colors cursor-pointer h-7.5 sm:h-8 shadow-2xs"
                      >
                        {cartStates[item.id] ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600">Added!</span>
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="w-2.5 sm:w-3 h-2.5 sm:h-3" />
                            <span className="truncate">Quick Add</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* View details button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/product/${item.id}`);
                      }}
                      className="p-1 rounded-full border border-brand-purple/20 text-brand-plum hover:bg-brand-purple/10 flex items-center justify-center h-7.5 w-7.5 sm:h-8 sm:w-8 cursor-pointer focus:outline-none flex-shrink-0"
                      title="View Product details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
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
