import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertCircle } from 'lucide-react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

// Apple / E-commerce style premium toast notification
const ToastNotification = ({ title, message, type = 'success', onClose, onViewCart }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2800);
    return () => clearTimeout(timer);
  }, [onClose]);

  const isError = type === 'error' || title?.includes('⚠') || title?.toLowerCase().includes('error') || title?.toLowerCase().includes('could not');

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className="fixed z-50 p-4 w-[90%] max-w-sm rounded-[22px] bg-white/95 backdrop-blur-md border border-brand-purple/20 shadow-[0_12px_36px_rgba(75,46,93,0.12)] text-left flex gap-3 
        bottom-5 left-[5%] md:bottom-auto md:left-auto md:top-24 md:right-8"
    >
      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
        isError ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600'
      }`}>
        {isError ? <AlertCircle className="w-4.5 h-4.5" /> : <Check className="w-4.5 h-4.5" />}
      </div>

      <div className="flex-grow pr-2">
        <h4 className="font-serif text-xs font-bold text-brand-dark">
          {title}
        </h4>
        <p className="text-[10px] text-brand-dark/70 mt-1 font-semibold leading-normal">
          {message}
        </p>
        <button
          onClick={onViewCart}
          className="mt-2 text-[10px] font-bold text-brand-plum hover:underline cursor-pointer focus:outline-none"
        >
          View Cart
        </button>
      </div>

      <button
        onClick={onClose}
        className="text-brand-dark/40 hover:text-brand-dark w-5 h-5 flex items-center justify-center rounded-full hover:bg-brand-purple/10 cursor-pointer focus:outline-none flex-shrink-0"
        aria-label="Close notification"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  );
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const mergedUserIdRef = useRef(null);

  // Initialize cart state directly from localStorage
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('craftoria_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Initialize saved for later state directly from storage
  const [saveForLaterList, setSaveForLaterList] = useState(() => {
    try {
      const saved = localStorage.getItem('craftoria_save_later');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [toast, setToast] = useState(null);

  // Persist a cart array to localStorage (state update is the caller's job,
  // via the functional setCart form, so a stale closure can never overwrite
  // a more recent in-flight update).
  const persistCart = (updatedCart) => {
    try {
      localStorage.setItem('craftoria_cart', JSON.stringify(updatedCart));
      if (user && user.email) {
        localStorage.setItem(`craftoria_cart_${user.email}`, JSON.stringify(updatedCart));
      }
    } catch (e) {
      console.error('Failed to write cart to localStorage:', e);
    }
  };

  const persistSaveLater = (updatedList) => {
    try {
      localStorage.setItem('craftoria_save_later', JSON.stringify(updatedList));
      if (user && user.email) {
        localStorage.setItem(`craftoria_save_later_${user.email}`, JSON.stringify(updatedList));
      }
    } catch (e) {
      console.error('Failed to write save_later to localStorage:', e);
    }
  };

  // Handle user authentication transition without duplicating/multiplying quantities
  useEffect(() => {
    if (!user) {
      mergedUserIdRef.current = null;
      return;
    }
    if (mergedUserIdRef.current === user.id) return;
    mergedUserIdRef.current = user.id;

    try {
      const userCartKey = `craftoria_cart_${user.email}`;
      const savedUserRaw = localStorage.getItem(userCartKey);
      const userSavedCart = savedUserRaw ? JSON.parse(savedUserRaw) : [];

      const currentActiveRaw = localStorage.getItem('craftoria_cart');
      const currentActiveCart = currentActiveRaw ? JSON.parse(currentActiveRaw) : [];

      if (currentActiveCart.length === 0 && userSavedCart.length > 0) {
        // Restore user's previous saved cart
        setCart(userSavedCart);
        persistCart(userSavedCart);
      } else if (currentActiveCart.length > 0 && userSavedCart.length > 0) {
        // Merge without summing quantities if same items exist
        const cartMap = new Map();
        userSavedCart.forEach((item) => {
          if (item && item.id) cartMap.set(item.id, { ...item });
        });
        currentActiveCart.forEach((item) => {
          if (item && item.id) {
            // Overwrite or preserve active cart item instead of doubling
            cartMap.set(item.id, { ...item });
          }
        });
        const merged = Array.from(cartMap.values());
        setCart(merged);
        persistCart(merged);
      } else if (currentActiveCart.length > 0) {
        // Save current active cart to user key
        localStorage.setItem(userCartKey, JSON.stringify(currentActiveCart));
      }
    } catch (err) {
      console.warn('Error synchronizing user cart storage:', err);
    }

    // Save for Later merge
    if (user.email) {
      try {
        const userSaveLaterKey = `craftoria_save_later_${user.email}`;
        const savedLaterRaw = localStorage.getItem(userSaveLaterKey);
        const userSavedLater = savedLaterRaw ? JSON.parse(savedLaterRaw) : [];

        setSaveForLaterList((currentSaveForLaterList) => {
          const saveLaterMap = new Map();
          currentSaveForLaterList.forEach((item) => {
            if (item && item.id) saveLaterMap.set(item.id, { ...item });
          });
          userSavedLater.forEach((savedItem) => {
            if (savedItem && savedItem.id) {
              saveLaterMap.set(savedItem.id, { ...savedItem });
            }
          });
          const mergedSaveLater = Array.from(saveLaterMap.values());
          persistSaveLater(mergedSaveLater);
          return mergedSaveLater;
        });
      } catch (e) {}
    }
  }, [user]);

  // Core add-to-cart operation
  const addItemQuantity = (product, addQty) => {
    const productPrice = product.price || 249;
    const productName = product.name || product.title || 'Product';
    const productDesc = product.desc || product.description || '';
    const productImage = product.image || product.thumbnail || '';
    const rawProductId = product.productId || product.id;
    const customText = product.customText || product.customization?.text;
    const customization = product.customization;

    // Helper to check if item matches existing line item
    const isMatchingItem = (item) => {
      const itemProdId = item.productId || item.id;
      if (itemProdId !== rawProductId) return false;
      if (!customization && !item.customization && !customText && !item.customText) return true;
      const textMatch = (item.customText || item.customization?.text || '') === (customText || '');
      const occMatch = (item.customization?.occasion || '') === (customization?.occasion || '');
      const noteMatch = (item.customization?.giftNote || '') === (customization?.giftNote || '');
      const packMatch = (item.customization?.packaging || '') === (customization?.packaging || '');
      const specMatch = (item.customization?.specialNotes || '') === (customization?.specialNotes || '');
      return textMatch && occMatch && noteMatch && packMatch && specMatch;
    };

    let isNewItem = false;
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(isMatchingItem);
      isNewItem = existingIndex === -1;
      let updated;
      if (!isNewItem) {
        updated = prevCart.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: item.quantity + addQty } : item
        );
      } else {
        const lineItemId = (customization || customText)
          ? `${rawProductId}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 5)}`
          : rawProductId;

        updated = [
          ...prevCart,
          {
            id: lineItemId,
            productId: rawProductId,
            name: productName,
            price: productPrice,
            desc: productDesc,
            quantity: addQty,
            image: productImage,
            customText: customText,
            customization: customization,
          },
        ];
      }
      persistCart(updated);
      return updated;
    });

    return { success: true, isNewItem };
  };

  const addToCart = (product, quantity = 1) => {
    if (!product || (!product.id && !product.productId)) return;

    const addQty = Math.max(1, parseInt(product.qty ?? quantity, 10) || 1);
    const result = addItemQuantity(product, addQty);
    const productName = product.name || product.title || 'Item';

    if (!result.success) {
      setToast({
        id: Date.now(),
        type: 'error',
        title: '⚠ Could Not Add Item',
        message: result.message || 'Unable to add item. Please try again.',
      });
      return;
    }

    setToast({
      id: Date.now(),
      type: 'success',
      title: result.isNewItem ? '✓ Added to Cart' : '✓ Quantity Updated',
      message: `${productName} has been added to your cart.`,
    });
  };

  const removeFromCart = (lineItemId) => {
    setCart((prevCart) => {
      const updated = prevCart.filter((item) => item.id !== lineItemId);
      persistCart(updated);
      return updated;
    });
  };

  const updateQuantity = (lineItemId, newQuantity) => {
    const parsedQty = parseInt(newQuantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      removeFromCart(lineItemId);
      return;
    }

    setCart((prevCart) => {
      const updated = prevCart.map((item) =>
        item.id === lineItemId ? { ...item, quantity: parsedQty } : item
      );
      persistCart(updated);
      return updated;
    });
  };

  const clearCart = () => {
    setCart([]);
    persistCart([]);
  };

  // Save for Later Actions
  const saveForLater = (productId) => {
    setCart((prevCart) => {
      const itemToSave = prevCart.find((item) => item.id === productId);
      if (!itemToSave) return prevCart;

      const updatedCart = prevCart.filter((item) => item.id !== productId);
      persistCart(updatedCart);

      setSaveForLaterList((prevSaveForLater) => {
        if (prevSaveForLater.some((item) => item.id === productId)) return prevSaveForLater;
        const updatedSaveForLater = [...prevSaveForLater, itemToSave];
        persistSaveLater(updatedSaveForLater);
        return updatedSaveForLater;
      });

      return updatedCart;
    });
  };

  const moveToCart = (productId) => {
    setSaveForLaterList((prevSaveForLater) => {
      const itemToMove = prevSaveForLater.find((item) => item.id === productId);
      if (!itemToMove) return prevSaveForLater;

      const updated = prevSaveForLater.filter((item) => item.id !== productId);
      persistSaveLater(updated);
      addItemQuantity(itemToMove, itemToMove.quantity || 1);
      return updated;
    });
  };

  const removeFromSaveForLater = (productId) => {
    setSaveForLaterList((prevSaveForLater) => {
      const updated = prevSaveForLater.filter((item) => item.id !== productId);
      persistSaveLater(updated);
      return updated;
    });
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        saveForLaterList,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        saveForLater,
        moveToCart,
        removeFromSaveForLater,
      }}
    >
      {children}

      {/* Global Toast Feedback Overlay */}
      <AnimatePresence>
        {toast && (
          <ToastNotification
            key={toast.id}
            title={toast.title}
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
            onViewCart={() => {
              setIsCartOpen(true);
              setToast(null);
            }}
          />
        )}
      </AnimatePresence>
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
