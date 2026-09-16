import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertCircle, ShoppingBag } from 'lucide-react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

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
  const { user, isLoggedIn } = useAuth();

  const variantMapRef = useRef(null);
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
  const [toast, setToast] = useState(null); // { id: number, title: string, message: string, type: string }

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
    try {
      const { data, error } = await supabase.from('product_variants').select('id, sku');
      if (error || !data) {
        return new Map();
      }
      variantMapRef.current = new Map(data.map((v) => [v.sku, v.id]));
      return variantMapRef.current;
    } catch (err) {
      return new Map();
    }
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
    try {
      const { data, error } = await supabase.rpc('get_cart_summary');
      if (error || !data) return null;
      if (data.items && data.items.length > 0) {
        const localShape = mapDbCartToLocalShape(data);
        saveCartToStorage(localShape);
        return localShape;
      }
      return null;
    } catch (err) {
      return null;
    }
  };

  // Core add-to-cart operation with multi-tier storage and guaranteed offline/local fallback
  const addItemQuantity = async (product, addQty) => {
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

    // 1. Update local cart state & storage immediately (Optimistic / Always-Available)
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
      try {
        localStorage.setItem('craftoria_cart', JSON.stringify(updated));
        if (user && user.email) {
          localStorage.setItem(`craftoria_cart_${user.email}`, JSON.stringify(updated));
        }
      } catch (e) {
        console.error('Failed to write cart to storage:', e);
      }
      return updated;
    });

    // 2. If logged in, attempt background sync with Supabase (graceful enhancement)
    if (isLoggedIn) {
      try {
        const variantMap = await getVariantMap();
        const variantId = variantMap.get(rawProductId);
        if (variantId) {
          await supabase.rpc('cart_add_item', {
            p_variant_id: variantId,
            p_quantity: addQty,
          });
        }
      } catch (e) {
        console.warn('Background Supabase cart sync notice:', e);
      }
    }

    return { success: true, isNewItem };
  };

  // Merge guest cart with user cart on login
  useEffect(() => {
    if (!user) {
      mergedUserIdRef.current = null;
      return;
    }
    if (mergedUserIdRef.current === user.id) return;
    mergedUserIdRef.current = user.id;

    (async () => {
      let guestItems = [];
      let userSavedCart = [];
      const userCartKey = `craftoria_cart_${user.email}`;

      try {
        const savedGuest = localStorage.getItem('craftoria_cart');
        guestItems = savedGuest ? JSON.parse(savedGuest) : [];
      } catch (e) {}

      try {
        const savedUser = localStorage.getItem(userCartKey);
        userSavedCart = savedUser ? JSON.parse(savedUser) : [];
      } catch (e) {}

      // Combine local carts
      const cartMap = new Map();
      userSavedCart.forEach((item) => {
        if (item && item.id) cartMap.set(item.id, { ...item });
      });
      guestItems.forEach((item) => {
        if (item && item.id) {
          const existing = cartMap.get(item.id);
          if (existing) {
            cartMap.set(item.id, { ...existing, quantity: existing.quantity + item.quantity });
          } else {
            cartMap.set(item.id, { ...item });
          }
        }
      });

      const mergedCart = Array.from(cartMap.values());
      if (mergedCart.length > 0) {
        saveCartToStorage(mergedCart);
      }

      // Background DB sync if available
      try {
        const variantMap = await getVariantMap();
        for (const item of mergedCart) {
          const variantId = variantMap.get(item.id);
          if (variantId) {
            await supabase.rpc('cart_add_item', {
              p_variant_id: variantId,
              p_quantity: item.quantity,
            });
          }
        }
        const dbItems = await fetchDbCart();
        if (dbItems && dbItems.length > 0) {
          saveCartToStorage(dbItems);
        }
      } catch (err) {
        console.warn('Supabase login cart merge notice:', err);
      }
    })();

    // Save for Later merge
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
      saveForLaterList.forEach((item) => {
        if (item && item.id) saveLaterMap.set(item.id, { ...item });
      });
      userSavedLater.forEach((savedItem) => {
        if (savedItem && savedItem.id) {
          saveLaterMap.set(savedItem.id, { ...savedItem });
        }
      });
      const mergedSaveLater = Array.from(saveLaterMap.values());
      setSaveForLaterList(mergedSaveLater);
      try {
        localStorage.setItem('craftoria_save_later', JSON.stringify(mergedSaveLater));
        localStorage.setItem(userSaveLaterKey, JSON.stringify(mergedSaveLater));
      } catch (e) {}
    }
  }, [user]);

  const addToCart = async (product, quantity = 1) => {
    if (!product || !product.id) return;

    const addQty = Math.max(1, parseInt(product.qty ?? quantity, 10) || 1);
    const result = await addItemQuantity(product, addQty);
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

  const removeFromCart = async (lineItemId) => {
    const targetItem = cart.find((item) => item.id === lineItemId);
    const updated = cart.filter((item) => item.id !== lineItemId);
    saveCartToStorage(updated);

    if (isLoggedIn) {
      try {
        const rawId = targetItem?.productId || lineItemId;
        const variantMap = await getVariantMap();
        const variantId = variantMap.get(rawId);
        if (variantId) {
          await supabase.rpc('cart_remove_item', { p_variant_id: variantId });
        }
      } catch (e) {
        console.warn('DB cart remove warning:', e);
      }
    }
  };

  const updateQuantity = async (lineItemId, newQuantity) => {
    const parsedQty = parseInt(newQuantity, 10);
    if (isNaN(parsedQty) || parsedQty <= 0) {
      removeFromCart(lineItemId);
      return;
    }

    const targetItem = cart.find((item) => item.id === lineItemId);
    const updated = cart.map((item) =>
      item.id === lineItemId ? { ...item, quantity: parsedQty } : item
    );
    saveCartToStorage(updated);

    if (isLoggedIn) {
      try {
        const rawId = targetItem?.productId || lineItemId;
        const variantMap = await getVariantMap();
        const variantId = variantMap.get(rawId);
        if (variantId) {
          await supabase.rpc('cart_set_item_quantity', {
            p_variant_id: variantId,
            p_quantity: parsedQty,
          });
        }
      } catch (e) {
        console.warn('DB cart update quantity warning:', e);
      }
    }
  };

  const clearCart = async () => {
    saveCartToStorage([]);
    if (isLoggedIn) {
      try {
        await supabase.rpc('cart_clear');
      } catch (e) {
        console.warn('DB cart clear warning:', e);
      }
    }
  };

  // Save for Later Actions
  const saveForLater = async (productId) => {
    const itemToSave = cart.find((item) => item.id === productId);
    if (!itemToSave) return;

    await removeFromCart(productId);

    const exists = saveForLaterList.some((item) => item.id === productId);
    if (!exists) {
      saveSaveLaterToStorage([...saveForLaterList, itemToSave]);
    }
  };

  const moveToCart = async (productId) => {
    const itemToMove = saveForLaterList.find((item) => item.id === productId);
    if (!itemToMove) return;

    saveSaveLaterToStorage(saveForLaterList.filter((item) => item.id !== productId));
    await addItemQuantity(itemToMove, itemToMove.quantity || 1);
  };

  const removeFromSaveForLater = (productId) => {
    const updatedList = saveForLaterList.filter((item) => item.id !== productId);
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

