import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, ShoppingBag, Heart, MapPin, LogOut, ChevronRight, Settings, Trash } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';

const AccountMenu = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  
  // Current tab: 'menu' | 'profile' | 'orders' | 'wishlist' | 'addresses'
  const [activeTab, setActiveTab] = useState('menu');
  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([
    { id: 1, type: 'Home', address: '123 Lavender Lane, Lily Valley, 10001' }
  ]);

  useEffect(() => {
    // Load orders
    const savedOrders = localStorage.getItem('craftoria_orders');
    if (savedOrders) {
      try {
        setOrders(JSON.parse(savedOrders));
      } catch (e) {
        setOrders([]);
      }
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  const handleLogout = () => {
    logout();
    onClose();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-brand-plum/40 backdrop-blur-xs cursor-pointer"
      />

      {/* Account Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className="relative w-full max-w-md h-full bg-[#FCF8FC] border-l border-brand-purple/20 shadow-[0_0_50px_rgba(75,46,93,0.15)] flex flex-col z-10 text-brand-dark"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-brand-purple/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5 text-brand-plum" />
            <h2 className="font-serif text-lg font-bold">
              {activeTab === 'menu' && 'My Account'}
              {activeTab === 'profile' && 'My Profile'}
              {activeTab === 'orders' && 'My Orders'}
              {activeTab === 'wishlist' && 'My Wishlist'}
              {activeTab === 'addresses' && 'Saved Addresses'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-brand-lavender/35 hover:bg-brand-lavender flex items-center justify-center cursor-pointer transition-colors duration-200"
            aria-label="Close account menu"
          >
            <X className="w-5 h-5 text-brand-plum" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto px-6 py-6 text-left">
          {activeTab === 'menu' && (
            <div className="flex flex-col h-full justify-between">
              <div className="flex flex-col gap-6">
                {/* User Greeting Card */}
                <div className="glass-card p-5 rounded-[24px] border border-brand-purple/25 flex items-center gap-4 bg-white/20">
                  <div className="w-12 h-12 rounded-full border border-brand-purple/10 overflow-hidden bg-brand-plum text-white flex items-center justify-center font-serif text-lg font-bold flex-shrink-0">
                    {user?.picture ? (
                      <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user?.name ? user.name[0].toUpperCase() : '👤'
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-brand-dark/60 font-semibold uppercase tracking-wider">Welcome back,</span>
                    <h3 className="font-serif text-base font-bold text-brand-dark leading-tight">{user?.name || 'Customer'}</h3>
                  </div>
                </div>

                {/* Menu items */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleTabChange('profile')}
                    className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-brand-purple/10 transition-colors cursor-pointer text-sm font-semibold"
                  >
                    <div className="flex items-center gap-3">
                      <User className="w-4.5 h-4.5 text-brand-plum" />
                      <span>My Profile</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-brand-dark/40" />
                  </button>

                  <button
                    onClick={() => handleTabChange('orders')}
                    className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-brand-purple/10 transition-colors cursor-pointer text-sm font-semibold"
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="w-4.5 h-4.5 text-brand-plum" />
                      <span>My Orders</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-brand-dark/40" />
                  </button>

                  <button
                    onClick={() => handleTabChange('wishlist')}
                    className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-brand-purple/10 transition-colors cursor-pointer text-sm font-semibold"
                  >
                    <div className="flex items-center gap-3">
                      <Heart className="w-4.5 h-4.5 text-brand-plum" />
                      <span>My Wishlist</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-brand-dark/40" />
                  </button>

                  <button
                    onClick={() => handleTabChange('addresses')}
                    className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-brand-purple/10 transition-colors cursor-pointer text-sm font-semibold"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4.5 h-4.5 text-brand-plum" />
                      <span>Saved Addresses</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-brand-dark/40" />
                  </button>
                </div>
              </div>

              {/* Logout at bottom */}
              <button
                onClick={handleLogout}
                className="mt-8 w-full py-3.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}

          {/* MY PROFILE DETAILS */}
          {activeTab === 'profile' && (
            <div>
              <button
                onClick={() => handleTabChange('menu')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-plum/80 hover:text-brand-purple mb-6 focus:outline-none"
              >
                <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Back to Account
              </button>

              <div className="flex flex-col gap-5">
                {user?.picture && (
                  <div className="flex flex-col items-center pb-4 border-b border-brand-purple/10">
                    <img 
                      src={user.picture} 
                      alt={user.name} 
                      className="w-20 h-20 rounded-full object-cover border-2 border-brand-purple/35 shadow-sm" 
                    />
                    <span className="text-[9px] bg-brand-purple/15 text-brand-plum font-bold px-2.5 py-0.5 rounded-full mt-2.5 uppercase tracking-wider inline-flex items-center gap-1">
                      <svg className="w-3 h-3 text-brand-plum" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                      </svg>
                      Google Verified
                    </span>
                  </div>
                )}
                <div className="flex flex-col pb-4 border-b border-brand-purple/10">
                  <span className="text-[10px] font-bold text-brand-plum/80 uppercase tracking-widest">Full Name</span>
                  <span className="text-sm font-semibold mt-1">{user?.name}</span>
                </div>
                <div className="flex flex-col pb-4 border-b border-brand-purple/10">
                  <span className="text-[10px] font-bold text-brand-plum/80 uppercase tracking-widest">Email Address</span>
                  <span className="text-sm font-semibold mt-1">{user?.email}</span>
                </div>
                <div className="flex flex-col pb-4 border-b border-brand-purple/10">
                  <span className="text-[10px] font-bold text-brand-plum/80 uppercase tracking-widest">Mobile Number</span>
                  <span className="text-sm font-semibold mt-1">{user?.phone || 'Not provided'}</span>
                </div>
              </div>
            </div>
          )}

          {/* MY ORDERS */}
          {activeTab === 'orders' && (
            <div className="h-full flex flex-col">
              <button
                onClick={() => handleTabChange('menu')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-plum/80 hover:text-brand-purple mb-6 focus:outline-none"
              >
                <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Back to Account
              </button>

              {orders.length === 0 ? (
                <div className="flex-grow flex flex-col items-center justify-center text-center py-20">
                  <ShoppingBag className="w-10 h-10 text-brand-plum/45 mb-3" />
                  <span className="text-xs font-semibold text-brand-dark/70">No orders placed yet.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {orders.map((ord) => (
                    <div key={ord.orderId} className="glass-card p-4 rounded-[22px] border border-brand-purple/15 text-xs">
                      <div className="flex items-center justify-between border-b border-brand-purple/10 pb-2 mb-2">
                        <span className="font-mono font-bold text-brand-plum">{ord.orderId}</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{ord.status}</span>
                      </div>
                      <div className="flex flex-col gap-1 text-[11px] mb-2.5">
                        <span className="text-brand-dark/65 font-medium">Placed on: {ord.date}</span>
                        <div className="mt-1 font-semibold text-brand-dark">
                          Items ordered:
                          <ul className="list-disc pl-4 mt-0.5 font-medium text-brand-dark/80">
                            {ord.items.map((it, idx) => (
                              <li key={idx}>{it.name} (x{it.quantity})</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-brand-purple/10 text-[10px] text-brand-dark/70">
                        <span className="font-semibold block mb-0.5">Shipping to:</span>
                        <span>{ord.shipping.name}, {ord.shipping.address}, {ord.shipping.city}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* MY WISHLIST */}
          {activeTab === 'wishlist' && (
            <div>
              <button
                onClick={() => handleTabChange('menu')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-plum/80 hover:text-brand-purple mb-6 focus:outline-none"
              >
                <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Back to Account
              </button>

              {wishlist.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16">
                  <Heart className="w-10 h-10 text-brand-plum/45 mb-3" />
                  <span className="text-xs font-semibold text-brand-dark/70">Your Wishlist is empty.</span>
                  <a
                    href="/#collections"
                    onClick={onClose}
                    className="text-[10px] font-bold text-brand-plum hover:underline mt-2"
                  >
                    Explore Collections
                  </a>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                  {wishlist.map((item) => (
                    <div key={item.id} className="glass-card p-3 rounded-xl border border-brand-purple/15 flex justify-between items-center text-xs text-left">
                      <div className="flex flex-col text-left">
                        <span className="font-serif font-bold text-brand-dark">{item.name}</span>
                        <span className="text-[10px] text-brand-plum/80 font-semibold mt-0.5">₹{item.price || 249}</span>
                      </div>
                      <div className="flex gap-2.5 items-center">
                        <button
                          onClick={() => {
                            addToCart(item);
                          }}
                          className="px-2.5 py-1.5 rounded-full bg-brand-plum text-white text-[9px] font-bold uppercase tracking-wider hover:bg-brand-violet cursor-pointer"
                        >
                          Add
                        </button>
                        <button
                          onClick={() => removeFromWishlist(item.id)}
                          className="p-1.5 rounded-full text-red-500 hover:bg-red-50 cursor-pointer"
                          aria-label="Remove from wishlist"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <a
                    href="/wishlist"
                    onClick={onClose}
                    className="text-center text-[10px] font-bold text-brand-plum hover:underline mt-2 block"
                  >
                    View Full Wishlist Page ➔
                  </a>
                </div>
              )}
            </div>
          )}

          {/* SAVED ADDRESSES */}
          {activeTab === 'addresses' && (
            <div>
              <button
                onClick={() => handleTabChange('menu')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-plum/80 hover:text-brand-purple mb-6 focus:outline-none"
              >
                <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Back to Account
              </button>

              <div className="flex flex-col gap-3">
                {addresses.map((adr) => (
                  <div key={adr.id} className="glass-card p-4 rounded-2xl border border-brand-purple/15 flex gap-3 text-xs">
                    <MapPin className="w-5 h-5 text-brand-plum flex-shrink-0" />
                    <div className="flex flex-col">
                      <span className="font-bold text-brand-plum">{adr.type} Address</span>
                      <span className="text-brand-dark/75 mt-1 leading-relaxed">{adr.address}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AccountMenu;
