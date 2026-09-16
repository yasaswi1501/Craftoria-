import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Plus, Minus, Trash2, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useRouter } from '../context/RouterContext';

import sellerMemoryCanvas from '../assets/seller-memory-canvas.png';
import sellerEmbroideryHoop from '../assets/seller-embroidery-hoop.png';
import sellerBloomBouquets from '../assets/seller-bloom-bouquets.png';
import sellerBloomKeychains from '../assets/seller-bloom-keychains.png';
import coverPolaroids from '../assets/gallery-1-polaroid.jpg';
import coverClips from '../assets/gallery-7-two-flower-keychain.jpg';

const CartDrawer = () => {
  const { 
    cart, 
    saveForLaterList, 
    isCartOpen, 
    setIsCartOpen, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    saveForLater,
    moveToCart,
    removeFromSaveForLater
  } = useCart();
  const { navigate } = useRouter();

  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const getProductImage = (id) => {
    if (id.includes('canvas') || id === 'memory-canvas') return sellerMemoryCanvas;
    if (id.includes('hoop') || id === 'embroidery-hoop') return sellerEmbroideryHoop;
    if (id.includes('bouquet') || id === 'bloom-bouquets') return sellerBloomBouquets;
    if (id.includes('keychain') || id === 'bloom-keychains') return sellerBloomKeychains;
    if (id.includes('polaroid') || id === 'polaroids') return coverPolaroids;
    if (id.includes('clip') || id === 'clips-rubber-bands') return coverClips;
    return sellerMemoryCanvas;
  };

  if (!isCartOpen) return null;

  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + (item.price || 249) * item.quantity, 0);

  const handleClose = () => {
    setIsCartOpen(false);
    setShowClearConfirm(false);
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="absolute inset-0 bg-brand-plum/40 backdrop-blur-xs cursor-pointer"
      />

      {/* Drawer Body */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="relative w-full max-w-md h-full bg-[#FCF8FC] border-l border-brand-purple/20 shadow-[0_0_50px_rgba(75,46,93,0.15)] flex flex-col z-10 text-brand-dark"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-brand-purple/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-left">
            <ShoppingBag className="w-5 h-5 text-brand-plum" />
            <h2 className="font-serif text-lg font-bold">
              Shopping Bag ({totalItemsCount})
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            {cart.length > 0 && !showClearConfirm && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="text-[10px] font-bold text-brand-dark/50 hover:text-red-500 cursor-pointer focus:outline-none"
              >
                Clear Cart
              </button>
            )}

            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-brand-purple/10 flex items-center justify-center text-brand-plum hover:bg-brand-purple/25 transition-colors cursor-pointer"
              aria-label="Close cart"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Clear Cart Confirmation Overlay */}
        {showClearConfirm && (
          <div className="px-6 py-3 bg-red-50/90 border-b border-red-100 flex items-center justify-between text-xs text-left animate-fadeIn">
            <span className="font-semibold text-red-700">Remove all items from your cart?</span>
            <div className="flex gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-3 py-1.5 rounded-md border border-gray-300 bg-white font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearCart();
                  setShowClearConfirm(false);
                }}
                className="px-3 py-1.5 rounded-md bg-red-500 text-white font-semibold cursor-pointer"
              >
                Clear Cart
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Cart Items */}
        <div className="flex-grow overflow-y-auto px-6 py-6 custom-scrollbar">
          {cart.length === 0 && saveForLaterList.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-20">
              <div className="w-16 h-16 rounded-full bg-brand-purple/10 flex items-center justify-center mb-4">
                <ShoppingBag className="w-8 h-8 text-brand-plum/50" />
              </div>
              <h3 className="font-serif text-lg font-bold text-brand-dark mb-1">Your bag is empty</h3>
              <p className="text-xs text-brand-dark/65 max-w-xs mb-8 leading-relaxed">
                Discover something handmade for you. Explore our artisan craft collections.
              </p>
              <button
                onClick={handleClose}
                className="px-8 py-3.5 rounded-full bg-brand-plum hover:bg-brand-violet text-white font-semibold text-xs uppercase tracking-widest transition-all cursor-pointer"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active Cart Items */}
              {cart.length > 0 && (
                <div className="flex flex-col gap-3.5">
                  {cart.map((item) => {
                    const imgUrl = getProductImage(item.id);
                    return (
                      <div
                        key={item.id}
                        className="glass-card p-3 rounded-2xl flex gap-3 border border-brand-purple/10 text-left relative bg-white/40"
                      >
                        {/* Product Thumbnail */}
                        <div className="w-16 h-16 rounded-xl bg-white border border-brand-purple/5 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                          {imgUrl ? (
                            <img src={imgUrl} alt={item.name} className="w-full h-full object-contain" />
                          ) : (
                            <ShoppingBag className="w-5 h-5 text-brand-plum/50" />
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-grow flex flex-col pr-6">
                          <span className="text-[8px] font-semibold text-brand-plum/75 uppercase tracking-wider">
                            {item.desc || 'ARTISAN PIECE'}
                          </span>
                          <h4 className="font-serif text-xs font-bold text-brand-dark leading-tight mt-0.5 mb-1 line-clamp-1">
                            {item.name}
                          </h4>
                          <span className="text-xs font-bold text-brand-plum/90">₹{item.price}</span>
                          
                          {/* Save & Remove tiny controls */}
                          <div className="flex gap-3.5 mt-2 mb-3">
                            <button
                              onClick={() => saveForLater(item.id)}
                              className="text-[9px] font-bold text-brand-plum hover:underline cursor-pointer focus:outline-none"
                              aria-label={`Save ${item.name} for later`}
                            >
                              Save for Later
                            </button>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-[9px] font-bold text-red-500 hover:underline cursor-pointer focus:outline-none"
                              aria-label={`Remove ${item.name} from cart`}
                            >
                              Remove
                            </button>
                          </div>
                          
                          {/* Quantity controls */}
                          <div className="flex items-center gap-2 mt-auto">
                            <button
                              onClick={() => {
                                if (item.quantity === 1) {
                                  removeFromCart(item.id);
                                } else {
                                  updateQuantity(item.id, item.quantity - 1);
                                }
                              }}
                              className="w-5.5 h-5.5 rounded-full border border-brand-purple/30 flex items-center justify-center hover:bg-white transition-colors duration-200 cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3 h-3 text-brand-plum" />
                            </button>
                            <span className="text-xs font-bold w-5 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-5.5 h-5.5 rounded-full border border-brand-purple/30 flex items-center justify-center hover:bg-white transition-colors duration-200 cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3 h-3 text-brand-plum" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Saved for Later Section */}
              {saveForLaterList.length > 0 && (
                <div className="mt-8 pt-6 border-t border-brand-purple/20 text-left">
                  <h4 className="font-serif text-sm font-bold text-brand-dark mb-4 flex items-center gap-1.5">
                    <span>Saved for Later</span>
                    <span className="text-[9px] bg-brand-purple/15 text-brand-plum px-2.5 py-0.5 rounded-full font-semibold">
                      {saveForLaterList.length}
                    </span>
                  </h4>
                  <div className="flex flex-col gap-3">
                    {saveForLaterList.map((item) => (
                      <div
                        key={item.id}
                        className="glass-card p-3 rounded-2xl flex gap-3 border border-brand-purple/5 bg-brand-purple/5 relative text-left"
                      >
                        {/* Thumbnail */}
                        <div className="w-14 h-14 rounded-xl bg-white border border-brand-purple/5 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                          {getProductImage(item.id) ? (
                            <img src={getProductImage(item.id)} alt={item.name} className="w-full h-full object-contain" />
                          ) : (
                            <ShoppingBag className="w-4 h-4 text-brand-plum/50" />
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-grow flex flex-col pr-6">
                          <h5 className="font-serif text-xs font-bold text-brand-dark leading-tight line-clamp-1">
                            {item.name}
                          </h5>
                          <span className="text-xs font-bold text-brand-plum mt-0.5">₹{item.price || 249}</span>
                          
                          <div className="flex gap-3.5 mt-2.5">
                            <button
                              onClick={() => moveToCart(item.id)}
                              className="text-[9px] font-bold text-brand-plum hover:underline cursor-pointer focus:outline-none"
                              aria-label={`Move ${item.name} to cart`}
                            >
                              Move to Cart
                            </button>
                            <button
                              onClick={() => removeFromSaveForLater(item.id)}
                              className="text-[9px] font-bold text-red-500 hover:underline cursor-pointer focus:outline-none"
                              aria-label={`Remove ${item.name} from saved items`}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="px-6 py-5 border-t border-brand-purple/15 bg-white/40 backdrop-blur-md flex flex-col gap-4 text-left">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-brand-dark/75">Subtotal:</span>
              <span className="text-sm font-bold text-brand-plum">₹{cartSubtotal}</span>
            </div>
            
            <button
              onClick={handleProceedToCheckout}
              disabled={cart.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-brand-plum text-white font-semibold text-xs uppercase tracking-widest hover:bg-brand-violet transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Proceed to Checkout</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default CartDrawer;
