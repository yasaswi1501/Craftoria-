import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ShoppingBag } from 'lucide-react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

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
  const { user, isLoggedIn } = useAuth();

  // sku -> DB variant UUID, fetched once and cached for the session. Only
  // resolved when actually needed (logged-in cart operations) -- guests
  // never touch the network for cart actions, unchanged from before.
  const variantMapRef = useRef(null);
  // Guards the guest->server cart merge from re-running on every render;
  // keyed by user id so a logout+different-login re-merges correctly.
  const mergedUserIdRef = useRef(null);

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

  const getVariantMap = async () => {
    if (variantMapRef.current) return variantMapRef.current;
    const { data, error } = await supabase.from('product_variants').select('id, sku');
    if (error) {
      console.error('Failed to load product catalog for cart:', error);
      return new Map();
    }
    variantMapRef.current = new Map(data.map((v) => [v.sku, v.id]));
    return variantMapRef.current;
  };

  const mapDbCartToLocalShape = (summary) =>
    (summary?.items || []).map((line) => ({
      id: line.sku,
      name: line.product_name,
      price: Number(line.unit_price),
      desc: line.product_description || '',
      quantity: line.quantity,
      image: '',
      isAvailable: line.is_available,
      availableQuantity: line.available_quantity,
    }));

  const fetchDbCart = async () => {
    const { data, error } = await supabase.rpc('get_cart_summary');
    if (error) {
      console.error('Failed to load cart:', error);
      return;
    }
    setCart(mapDbCartToLocalShape(data));
  };

  // Core add-to-cart operation shared by addToCart (user-facing, shows a
  // toast) and moveToCart (silent, matching its pre-existing behavior) --
  // one place that knows how to talk to either storage backend.
  const addItemQuantity = async (product, addQty) => {
    if (!isLoggedIn) {
      const productPrice = product.price || 249;
      const existingIndex = cart.findIndex((item) => item.id === product.id);
      const isNewItem = existingIndex === -1;
      if (!isNewItem) {
        saveCartToStorage(cart.map((item, idx) =>
          idx === existingIndex ? { ...item, quantity: item.quantity + addQty } : item
        ));
      } else {
        saveCartToStorage([...cart, {
          id: product.id,
          name: product.name,
          price: productPrice,
          desc: product.desc || '',
          quantity: addQty,
          image: product.image || ''
        }]);
      }
      return { success: true, isNewItem };
    }

    const variantMap = await getVariantMap();
    const variantId = variantMap.get(product.id);
    if (!variantId) {
      return { success: false, message: `${product.name} could not be added right now.` };
    }

    const isNewItem = !cart.some((item) => item.id === product.id);
    const { error } = await supabase.rpc('cart_add_item', { p_variant_id: variantId, p_quantity: addQty });
    if (error) {
      return { success: false, message: error.message || 'Please try again.' };
    }
    await fetchDbCart();
    return { success: true, isNewItem };
  };

  // Merge any guest-session cart into the account's server cart once per
  // login (ref-guarded so it doesn't re-run on every render, and re-runs
  // correctly if the user logs out and into a different account), then
  // switch this context into DB-backed mode. Save-for-later stays
  // localStorage-only -- it isn't part of the backend schema.
  useEffect(() => {
    if (!user) {
      // Logout: the DB cart stays safely on the server, it must not keep
      // showing in local state, and it must never leak into the next
      // guest's (or a different account's) localStorage cart.
      if (mergedUserIdRef.current !== null) {
        setCart([]);
      }
      mergedUserIdRef.current = null;
      return;
    }
    if (mergedUserIdRef.current === user.id) return;
    mergedUserIdRef.current = user.id;

    (async () => {
      let guestItems = [];
      try {
        const saved = localStorage.getItem('craftoria_cart');
        guestItems = saved ? JSON.parse(saved) : [];
      } catch (e) {
        guestItems = [];
      }

      if (guestItems.length > 0) {
        const variantMap = await getVariantMap();
        for (const item of guestItems) {
          const variantId = variantMap.get(item.id);
          if (!variantId) {
            console.warn(`Skipping unmapped cart item during login merge: ${item.id}`);
            continue;
          }
          const { error } = await supabase.rpc('cart_add_item', {
            p_variant_id: variantId,
            p_quantity: item.quantity,
          });
          if (error) console.error(`Failed to merge cart item ${item.id}:`, error);
        }
      }

      try {
        localStorage.removeItem('craftoria_cart');
        localStorage.removeItem(`craftoria_cart_${user.email}`);
      } catch (e) {}

      await fetchDbCart();
    })();

    if (user.email) {
      const userSaveLaterKey = `craftoria_save_later_${user.email}`;
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

  const addToCart = async (product, quantity = 1) => {
    if (!product || !product.id) return;

    // Honor an explicit quantity passed either as a second arg or on the product (product.qty)
    const addQty = Math.max(1, parseInt(product.qty ?? quantity, 10) || 1);
    const result = await addItemQuantity(product, addQty);

    if (!result.success) {
      setToast({ id: Date.now(), title: '⚠ Could Not Add Item', message: result.message });
      return;
    }

    // Trigger premium Toast notification instead of opening the drawer automatically
    setToast({
      id: Date.now(),
      title: result.isNewItem ? '✓ Added to Cart' : '✓ Quantity Updated',
      message: `${product.name} has been added to your cart.`
    });
  };

  const removeFromCart = async (productId) => {
    if (!isLoggedIn) {
      saveCartToStorage(cart.filter((item) => item.id !== productId));
      return;
    }
    const variantMap = await getVariantMap();
    const variantId = variantMap.get(productId);
    if (!variantId) return;
    const { error } = await supabase.rpc('cart_remove_item', { p_variant_id: variantId });
    if (error) {
      console.error('Failed to remove cart item:', error);
      return;
    }
    await fetchDbCart();
  };

  const updateQuantity = async (productId, newQuantity) => {
    const parsedQty = parseInt(newQuantity, 10);

    if (!isLoggedIn) {
      if (isNaN(parsedQty) || parsedQty <= 0) {
        saveCartToStorage(cart.filter((item) => item.id !== productId));
        return;
      }
      saveCartToStorage(cart.map((item) =>
        item.id === productId ? { ...item, quantity: parsedQty } : item
      ));
      return;
    }

    const variantMap = await getVariantMap();
    const variantId = variantMap.get(productId);
    if (!variantId) return;
    const { error } = await supabase.rpc('cart_set_item_quantity', {
      p_variant_id: variantId,
      p_quantity: isNaN(parsedQty) ? 0 : parsedQty,
    });
    if (error) {
      console.error('Failed to update cart item quantity:', error);
      return;
    }
    await fetchDbCart();
  };

  const clearCart = async () => {
    if (!isLoggedIn) {
      saveCartToStorage([]);
      return;
    }
    const { error } = await supabase.rpc('cart_clear');
    if (error) {
      console.error('Failed to clear cart:', error);
      return;
    }
    setCart([]);
  };

  // Save for Later Actions
  const saveForLater = async (productId) => {
    const itemToSave = cart.find(item => item.id === productId);
    if (!itemToSave) return;

    await removeFromCart(productId);

    const exists = saveForLaterList.some(item => item.id === productId);
    if (!exists) {
      saveSaveLaterToStorage([...saveForLaterList, itemToSave]);
    }
  };

  const moveToCart = async (productId) => {
    const itemToMove = saveForLaterList.find(item => item.id === productId);
    if (!itemToMove) return;

    saveSaveLaterToStorage(saveForLaterList.filter(item => item.id !== productId));
    await addItemQuantity(itemToMove, itemToMove.quantity);
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
