import { createContext, useContext, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ShoppingBag } from 'lucide-react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

// Apple / E-commerce style premium success notification
const ToastNotification = ({ title, message, onClose, onViewCart }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2800);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className="fixed z-50 p-4 w-[90%] max-w-sm rounded-[22px] bg-white/95 backdrop-blur-md border border-brand-purple/20 shadow-[0_12px_36px_rgba(75,46,93,0.12)] text-left flex gap-3 
        bottom-5 left-[5%] md:bottom-auto md:left-auto md:top-24 md:right-8"
    >
      <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Check className="w-4.5 h-4.5" />
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

  // Initialize cart state directly from storage on first render to prevent asynchronous stale resets
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
  const [toast, setToast] = useState(null); // { id: number, title: string, message: string }

  // Sync cart to localStorage
  const saveCartToStorage = (updatedCart) => {
    setCart(updatedCart);
    try {
      localStorage.setItem('craftoria_cart', JSON.stringify(updatedCart));
      if (user && user.email) {
        localStorage.setItem(`craftoria_cart_${user.email}`, JSON.stringify(updatedCart));
      }
    } catch (e) {
      console.error('Failed to write cart to localStorage:', e);
    }
  };

  // Sync saved for later to localStorage
  const saveSaveLaterToStorage = (updatedList) => {
    setSaveForLaterList(updatedList);
    try {
      localStorage.setItem('craftoria_save_later', JSON.stringify(updatedList));
      if (user && user.email) {
        localStorage.setItem(`craftoria_save_later_${user.email}`, JSON.stringify(updatedList));
      }
    } catch (e) {
      console.error('Failed to write save_later to localStorage:', e);
    }
  };

  // Merge guest cart & save later with user details upon login
  useEffect(() => {
    if (user && user.email) {
      const userCartKey = `craftoria_cart_${user.email}`;
      const userSaveLaterKey = `craftoria_save_later_${user.email}`;

      // 1. Merge Cart
      let userSavedCart = [];
      try {
        const saved = localStorage.getItem(userCartKey);
        userSavedCart = saved ? JSON.parse(saved) : [];
      } catch (e) {
        userSavedCart = [];
      }

      const cartMap = new Map();
      cart.forEach(item => {
        if (item && item.id) cartMap.set(item.id, { ...item });
      });
      userSavedCart.forEach(savedItem => {
        if (savedItem && savedItem.id) {
          if (cartMap.has(savedItem.id)) {
            const existing = cartMap.get(savedItem.id);
            existing.quantity = Math.max(existing.quantity, savedItem.quantity);
          } else {
            cartMap.set(savedItem.id, { ...savedItem });
          }
        }
      });
      const mergedCart = Array.from(cartMap.values());
      setCart(mergedCart);
      localStorage.setItem('craftoria_cart', JSON.stringify(mergedCart));
      localStorage.setItem(userCartKey, JSON.stringify(mergedCart));

      // 2. Merge Save for Later
      let userSavedLater = [];
      try {
        const saved = localStorage.getItem(userSaveLaterKey);
        userSavedLater = saved ? JSON.parse(saved) : [];
      } catch (e) {
        userSavedLater = [];
      }

      const saveLaterMap = new Map();
      saveForLaterList.forEach(item => {
        if (item && item.id) saveLaterMap.set(item.id, { ...item });
      });
      userSavedLater.forEach(savedItem => {
        if (savedItem && savedItem.id) {
          saveLaterMap.set(savedItem.id, { ...savedItem });
        }
      });
      const mergedSaveLater = Array.from(saveLaterMap.values());
      setSaveForLaterList(mergedSaveLater);
      localStorage.setItem('craftoria_save_later', JSON.stringify(mergedSaveLater));
      localStorage.setItem(userSaveLaterKey, JSON.stringify(mergedSaveLater));
    }
  }, [user]);

  const addToCart = (product) => {
    if (!product || !product.id) return;
    
    const productPrice = product.price || 249;
    const existingIndex = cart.findIndex((item) => item.id === product.id);
    let isNewItem = true;

    if (existingIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      saveCartToStorage(updatedCart);
      isNewItem = false;
    } else {
      const cartItem = {
        id: product.id,
        name: product.name,
        price: productPrice,
        desc: product.desc || '',
        quantity: 1,
        image: product.image || ''
      };
      const updatedCart = [...cart, cartItem];
      saveCartToStorage(updatedCart);
    }

    // Trigger premium Toast notification instead of opening the drawer automatically
    setToast({
      id: Date.now(),
      title: isNewItem ? '✓ Added to Cart' : '✓ Quantity Updated',
      message: `${product.name} has been added to your cart.`
    });
  };

  const removeFromCart = (productId) => {
    const updatedCart = cart.filter((item) => item.id !== productId);
    saveCartToStorage(updatedCart);
  };

  const updateQuantity = (productId, newQuantity) => {
    const parsedQty = parseInt(newQuantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      removeFromCart(productId);
      return;
    }
    const updatedCart = cart.map((item) =>
      item.id === productId ? { ...item, quantity: parsedQty } : item
    );
    saveCartToStorage(updatedCart);
  };

  const clearCart = () => {
    saveCartToStorage([]);
  };

  // Save for Later Actions
  const saveForLater = (productId) => {
    const itemToSave = cart.find(item => item.id === productId);
    if (!itemToSave) return;

    // Remove from active cart
    const updatedCart = cart.filter(item => item.id !== productId);
    saveCartToStorage(updatedCart);

    // Add to save later list
    const exists = saveForLaterList.some(item => item.id === productId);
    if (!exists) {
      const updatedList = [...saveForLaterList, itemToSave];
      saveSaveLaterToStorage(updatedList);
    }
  };

  const moveToCart = (productId) => {
    const itemToMove = saveForLaterList.find(item => item.id === productId);
    if (!itemToMove) return;

    // Remove from Save for Later
    const updatedList = saveForLaterList.filter(item => item.id !== productId);
    saveSaveLaterToStorage(updatedList);

    // Add back to active cart
    const existingIndex = cart.findIndex(item => item.id === productId);
    if (existingIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += itemToMove.quantity;
      saveCartToStorage(updatedCart);
    } else {
      const updatedCart = [...cart, itemToMove];
      saveCartToStorage(updatedCart);
    }
  };

  const removeFromSaveForLater = (productId) => {
    const updatedList = saveForLaterList.filter(item => item.id !== productId);
    saveSaveLaterToStorage(updatedList);
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
        removeFromSaveForLater
      }}
    >
      {children}
      
      {/* Global Toast Success Feedback Overlay */}
      <AnimatePresence>
        {toast && (
          <ToastNotification
            key={toast.id}
            title={toast.title}
            message={toast.message}
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
