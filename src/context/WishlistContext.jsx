import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  
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
  const saveWishlistToStorage = (updatedWishlist) => {
    setWishlist(updatedWishlist);
    try {
      localStorage.setItem('craftoria_wishlist', JSON.stringify(updatedWishlist));
      if (user && user.email) {
        localStorage.setItem(`craftoria_wishlist_${user.email}`, JSON.stringify(updatedWishlist));
      }
    } catch (e) {
      console.error('Failed to save wishlist to localStorage:', e);
    }
  };

  // Merge guest wishlist with user wishlist on login
  useEffect(() => {
    if (user && user.email) {
      const userWishlistKey = `craftoria_wishlist_${user.email}`;
      let userSavedWishlist = [];
      try {
        const saved = localStorage.getItem(userWishlistKey);
        userSavedWishlist = saved ? JSON.parse(saved) : [];
      } catch (e) {
        userSavedWishlist = [];
      }

      // Merge current local wishlist with user's saved wishlist
      const mergedMap = new Map();
      wishlist.forEach(item => {
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
      setWishlist(mergedWishlist);
      try {
        localStorage.setItem('craftoria_wishlist', JSON.stringify(mergedWishlist));
        localStorage.setItem(userWishlistKey, JSON.stringify(mergedWishlist));
      } catch (e) {
        console.error('Failed to save merged wishlist:', e);
      }
    }
  }, [user]);

  const addToWishlist = (product) => {
    if (wishlist.some(item => item.id === product.id)) return;
    const updated = [...wishlist, product];
    saveWishlistToStorage(updated);
  };

  const removeFromWishlist = (productId) => {
    const updated = wishlist.filter(item => item.id !== productId);
    saveWishlistToStorage(updated);
  };

  const toggleWishlist = (product) => {
    if (wishlist.some(item => item.id === product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
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
