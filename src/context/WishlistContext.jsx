import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const mergedUserIdRef = useRef(null);

  // Initialize state directly from localStorage on first render to prevent race conditions
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('craftoria_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Sync wishlist to storage whenever it changes
  const persistWishlist = (updatedWishlist) => {
    try {
      localStorage.setItem('craftoria_wishlist', JSON.stringify(updatedWishlist));
      if (user && user.email) {
        localStorage.setItem(`craftoria_wishlist_${user.email}`, JSON.stringify(updatedWishlist));
      }
    } catch (e) {
      console.error('Failed to save wishlist to localStorage:', e);
    }
  };

  // Merge guest wishlist with user wishlist on login. Guarded by
  // mergedUserIdRef (same pattern as CartContext) so this only runs once per
  // signed-in user -- not on every onAuthStateChange event (token refresh,
  // tab refocus), which would otherwise re-run and rewrite localStorage on
  // every silent refresh since AuthContext produces a new `user` object
  // reference each time regardless of whether the underlying user changed.
  useEffect(() => {
    if (!user) {
      mergedUserIdRef.current = null;
      return;
    }
    if (mergedUserIdRef.current === user.id) return;
    mergedUserIdRef.current = user.id;

    if (user.email) {
      const userWishlistKey = `craftoria_wishlist_${user.email}`;
      let userSavedWishlist = [];
      try {
        const saved = localStorage.getItem(userWishlistKey);
        userSavedWishlist = saved ? JSON.parse(saved) : [];
      } catch (e) {
        userSavedWishlist = [];
      }

      setWishlist((currentWishlist) => {
        // Merge current local wishlist with user's saved wishlist
        const mergedMap = new Map();
        currentWishlist.forEach(item => {
          if (item && item.id) {
            mergedMap.set(item.id, { ...item });
          }
        });
        userSavedWishlist.forEach(savedItem => {
          if (savedItem && savedItem.id) {
            mergedMap.set(savedItem.id, { ...savedItem });
          }
        });

        const mergedWishlist = Array.from(mergedMap.values());
        persistWishlist(mergedWishlist);
        return mergedWishlist;
      });
    }
  }, [user]);

  const addToWishlist = (product) => {
    setWishlist((prevWishlist) => {
      if (prevWishlist.some(item => item.id === product.id)) return prevWishlist;
      const updated = [...prevWishlist, product];
      persistWishlist(updated);
      return updated;
    });
  };

  const removeFromWishlist = (productId) => {
    setWishlist((prevWishlist) => {
      const updated = prevWishlist.filter(item => item.id !== productId);
      persistWishlist(updated);
      return updated;
    });
  };

  const toggleWishlist = (product) => {
    setWishlist((prevWishlist) => {
      const exists = prevWishlist.some(item => item.id === product.id);
      const updated = exists
        ? prevWishlist.filter(item => item.id !== product.id)
        : [...prevWishlist, product];
      persistWishlist(updated);
      return updated;
    });
  };

  const isInWishlist = (productId) => {
    return wishlist.some(item => item.id === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        addToWishlist,
        removeFromWishlist,
        toggleWishlist,
        isInWishlist
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
