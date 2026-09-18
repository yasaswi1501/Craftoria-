import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ShoppingBag, Plus, Minus, Trash2, ShieldCheck, MessageCircle, Sparkles } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useRouter } from '../context/RouterContext';
import { useSettings } from '../context/SettingsContext';
import { redirectToWhatsApp } from '../utils/whatsapp';
import { useScrollLock } from '../utils/scrollLock';
import { useEscapeKey } from '../utils/useEscapeKey';
import { getProductImage } from '../utils/getProductImage';
import { calculateOrderTotals, formatINR } from '../utils/pricing';

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
  const { whatsappNumber } = useSettings();

  const [showClearConfirm, setShowClearConfirm] = useState(false);
  // Distinguishes "bag is empty because an order was just sent" from a
  // genuinely empty bag, and surfaces a failed WhatsApp redirect without
  // touching the cart contents.
  const [orderJustPlaced, setOrderJustPlaced] = useState(false);
  const [orderError, setOrderError] = useState('');

  // Lock background body scroll cleanly when cart drawer is open
  useScrollLock(isCartOpen);
  useEscapeKey(isCartOpen, () => {
    setIsCartOpen(false);
    setShowClearConfirm(false);
  });

  if (!isCartOpen) return null;

  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const { subtotal: cartSubtotal, deliveryFee: deliveryFeeAmount, total: cartTotal } = calculateOrderTotals(cart, 'standard');

  const handleClose = () => {
    setIsCartOpen(false);
    setShowClearConfirm(false);
    setOrderJustPlaced(false);
    setOrderError('');
  };

  const handleContinueShopping = () => {
    setIsCartOpen(false);
    setShowClearConfirm(false);
    setOrderJustPlaced(false);
    setOrderError('');
    navigate('/collections');
  };

  const handleProceedToPayment = () => {
    setOrderError('');
    const dispatched = redirectToWhatsApp(cart, null, 'standard', whatsappNumber);
    if (dispatched) {
      // Cart is only cleared once the WhatsApp redirect has actually fired --
      // a blocked/failed redirect must leave the customer's items in place.
      setOrderJustPlaced(true);
      clearCart();
    } else {
      setOrderError('Could not open WhatsApp to send your order. Please try again.');
    }
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  if (!isCartOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex justify-end" role="dialog" aria-modal="true" aria-label="Shopping bag" data-lenis-prevent="true">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        onTouchMove={(e) => e.preventDefault()}
        className="fixed inset-0 bg-brand-plum/60 backdrop-blur-sm cursor-pointer touch-none"
      />

      {/* Drawer Body */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        onWheel={(e) => e.stopPropagation()}
        data-lenis-prevent="true"
        className="relative w-full max-w-md h-full bg-[#FCF8FC] border-l border-brand-purple/20 shadow-[0_0_50px_rgba(75,46,93,0.15)] flex flex-col z-10 text-brand-dark"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-brand-purple/10 flex items-center justify-between flex-shrink-0">
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
          <div className="px-6 py-3 bg-red-50/90 border-b border-red-100 flex items-center justify-between text-xs text-left animate-fadeIn flex-shrink-0">
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
        <div 
          className="flex-1 min-h-0 overflow-y-auto px-6 py-6 custom-scrollbar overscroll-contain"
          data-lenis-prevent="true"
          style={{ touchAction: 'pan-y' }}
        >
          {cart.length === 0 && saveForLaterList.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-20">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${orderJustPlaced ? 'bg-emerald-50' : 'bg-brand-purple/10'}`}>
                {orderJustPlaced ? (
                  <ShieldCheck className="w-8 h-8 text-emerald-600" />
                ) : (
                  <ShoppingBag className="w-8 h-8 text-brand-plum/50" />
                )}
              </div>
              <h3 className="font-serif text-lg font-bold text-brand-dark mb-1">
                {orderJustPlaced ? 'Order Sent!' : 'Your bag is empty'}
              </h3>
              <p className="text-xs text-brand-dark/65 max-w-xs mb-8 leading-relaxed">
                {orderJustPlaced
                  ? "Your order details have been sent via WhatsApp. We'll confirm final pricing and delivery with you shortly."
                  : 'Discover something handmade for you. Explore our artisan craft collections.'}
              </p>
              <button
                onClick={handleContinueShopping}
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
                    const imgUrl = getProductImage(item);
                    return (
                      <div
                        key={item.id}
                        className="glass-card p-3 rounded-2xl flex gap-3 border border-brand-purple/10 text-left relative bg-white/40"
                      >
                        {/* Product Thumbnail */}
                        <div className="w-16 h-16 rounded-xl bg-white border border-brand-purple/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {imgUrl ? (
                            <img src={imgUrl} alt={item.name} className="w-full h-full object-cover" />
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
                          <span className="text-xs font-bold text-brand-plum">
                            ₹{(item.price || 0).toLocaleString('en-IN')}
                            {item.quantity > 1 && (
                              <span className="text-[10px] font-medium text-brand-dark/50"> &times; {item.quantity} = ₹{((item.price || 0) * item.quantity).toLocaleString('en-IN')}</span>
                            )}
                          </span>

                          {/* Customization Details Badges */}
                          {(item.customText || item.customization) && (
                            <div className="bg-brand-purple/10 border border-brand-purple/15 rounded-xl p-2 my-1 text-[10px] space-y-1 text-left">
                              <div className="flex items-center gap-1 font-bold text-brand-plum">
                                <Sparkles className="w-3 h-3" />
                                <span>Personalized:</span>
                                <span className="font-semibold text-brand-dark italic">"{item.customText || item.customization?.text}"</span>
                              </div>
                              {item.customization?.occasion && (
                                <div className="text-brand-dark/75 text-[9px]">
                                  <span className="font-semibold">Occasion:</span> {item.customization.occasion}
                                </div>
                              )}
                              {item.customization?.giftNote && (
                                <div className="text-brand-dark/75 text-[9px] line-clamp-1">
                                  <span className="font-semibold">Gift Note:</span> "{item.customization.giftNote}"
                                </div>
                              )}
                            </div>
                          )}

                          {/* Save & Remove tiny controls */}
                          <div className="flex gap-3.5 mt-1.5 mb-2">
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
                              className="w-7 h-7 sm:w-6 sm:h-6 rounded-full border border-brand-purple/30 flex items-center justify-center hover:bg-white transition-colors duration-200 cursor-pointer"
                              aria-label="Decrease quantity"
                            >
                              <Minus className="w-3.5 h-3.5 text-brand-plum" />
                            </button>
                            <span className="text-xs font-bold w-6 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-7 h-7 sm:w-6 sm:h-6 rounded-full border border-brand-purple/30 flex items-center justify-center hover:bg-white transition-colors duration-200 cursor-pointer"
                              aria-label="Increase quantity"
                            >
                              <Plus className="w-3.5 h-3.5 text-brand-plum" />
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
                        <div className="w-14 h-14 rounded-xl bg-white border border-brand-purple/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {getProductImage(item) ? (
                            <img src={getProductImage(item)} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <ShoppingBag className="w-4 h-4 text-brand-plum/50" />
                          )}
                        </div>

                        {/* Details */}
                        <div className="flex-grow flex flex-col pr-6">
                          <h5 className="font-serif text-xs font-bold text-brand-dark leading-tight line-clamp-1">
                            {item.name}
                          </h5>
                          
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
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-t border-brand-purple/15 bg-white/60 backdrop-blur-md flex flex-col gap-3 text-left pb-safe flex-shrink-0">
            <div className="flex flex-col gap-1 pb-2 border-b border-brand-purple/10 text-xs font-semibold">
              <div className="flex items-center justify-between">
                <span className="text-brand-dark/75">Total Items:</span>
                <span className="font-bold text-brand-dark">{totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-brand-dark/75">Subtotal:</span>
                <span className="font-bold text-brand-dark">{formatINR(cartSubtotal)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-brand-dark/75">Delivery:</span>
                <span className="font-bold text-brand-dark">{deliveryFeeAmount > 0 ? formatINR(deliveryFeeAmount) : 'FREE'}</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className="text-brand-dark font-bold">Total:</span>
                <span className="text-base font-bold text-brand-plum">{formatINR(cartTotal)}</span>
              </div>
            </div>

            <button
              onClick={handleProceedToPayment}
              disabled={cart.length === 0}
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs uppercase tracking-widest transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed h-11"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Proceed to Payment</span>
            </button>
            {orderError && (
              <p className="text-[10px] font-semibold text-red-600 text-center -mt-1">{orderError}</p>
            )}

            <button
              onClick={handleProceedToCheckout}
              className="w-full inline-flex items-center justify-center gap-1.5 py-1 text-[11px] font-bold text-brand-plum hover:underline cursor-pointer focus:outline-none"
            >
              <span>Add Delivery Address First &rarr;</span>
            </button>
          </div>
        )}
      </motion.div>
    </div>,
    document.body
  );
};

export default CartDrawer;
