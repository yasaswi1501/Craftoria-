import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, User, ShoppingBag, Heart, MapPin, LogOut, ChevronRight, 
  Trash, Edit2, Plus, Check, Save, AlertCircle, Phone, Mail, Home, Briefcase
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { supabase } from '../lib/supabase';

const AccountMenu = ({ isOpen, onClose }) => {
  const { user, logout, updateUserProfile } = useAuth();
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addToCart } = useCart();
  
  // Current tab: 'menu' | 'profile' | 'orders' | 'wishlist' | 'addresses'
  const [activeTab, setActiveTab] = useState('menu');
  const [orders, setOrders] = useState([]);

  // --- Profile Edit State ---
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profilePhone, setProfilePhone] = useState(user?.phone || '');
  const [profileSaveStatus, setProfileSaveStatus] = useState(null); // 'saving' | 'saved' | 'error'

  // --- Addresses State ---
  const getInitialAddresses = () => {
    try {
      const key = `craftoria_addresses_${user?.email || 'default'}`;
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 1,
        type: 'Home',
        recipientName: user?.name || 'Customer',
        phone: user?.phone || '+91 99088 60895',
        building: 'Flat 4B, Lavender Meadows',
        street: 'Artisan Blossom Road, Lily Valley',
        city: 'Hyderabad',
        state: 'Telangana',
        pinCode: '500081',
      }
    ];
  };

  const [addresses, setAddresses] = useState(getInitialAddresses);
  const [editingAddressId, setEditingAddressId] = useState(null); // null | address.id | 'new'
  const [addressForm, setAddressForm] = useState({
    type: 'Home',
    recipientName: '',
    phone: '',
    building: '',
    street: '',
    city: '',
    state: '',
    pinCode: '',
  });

  // Sync profile fields when user changes
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfilePhone(user.phone || '');
    }
  }, [user]);

  // Sync addresses to localStorage whenever addresses change
  const saveAddressesToStorage = (updated) => {
    setAddresses(updated);
    try {
      const key = `craftoria_addresses_${user?.email || 'default'}`;
      localStorage.setItem(key, JSON.stringify(updated));
    } catch (e) {
      console.error('Failed to save addresses:', e);
    }
  };

  // Load orders from Supabase if activeTab is 'orders'
  useEffect(() => {
    if (!isOpen || activeTab !== 'orders' || !user) return;
    let active = true;

    (async () => {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('order_number, status, payment_status, created_at, total_amount, shipping_address_snapshot, order_items(product_name, quantity)')
          .order('created_at', { ascending: false });

        if (!active) return;
        if (error) {
          setOrders([]);
          return;
        }

        setOrders((data || []).map((o) => ({
          orderId: o.order_number,
          date: new Date(o.created_at).toLocaleDateString(),
          total: o.total_amount,
          orderStatus: o.status?.replace(/_/g, ' ').toUpperCase(),
          paymentStatus: o.payment_status?.toUpperCase(),
          items: (o.order_items || []).map((it) => ({ name: it.product_name, quantity: it.quantity })),
          shippingAddress: o.shipping_address_snapshot,
        })));
      } catch (e) {
        if (active) setOrders([]);
      }
    })();

    return () => { active = false; };
  }, [isOpen, activeTab, user]);

  if (!isOpen) return null;

  const handleLogout = () => {
    logout();
    onClose();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsEditingProfile(false);
    setEditingAddressId(null);
    setProfileSaveStatus(null);
  };

  // --- Profile Edit Handlers ---
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaveStatus('saving');
    const res = await updateUserProfile({
      name: profileName.trim(),
      phone: profilePhone.trim(),
    });
    if (res.success) {
      setProfileSaveStatus('saved');
      setTimeout(() => {
        setIsEditingProfile(false);
        setProfileSaveStatus(null);
      }, 1000);
    } else {
      setProfileSaveStatus('error');
    }
  };

  // --- Address Edit Handlers ---
  const handleStartEditAddress = (adr) => {
    setEditingAddressId(adr.id);
    setAddressForm({
      type: adr.type || 'Home',
      recipientName: adr.recipientName || user?.name || '',
      phone: adr.phone || user?.phone || '',
      building: adr.building || '',
      street: adr.street || '',
      city: adr.city || '',
      state: adr.state || '',
      pinCode: adr.pinCode || '',
    });
  };

  const handleStartNewAddress = () => {
    setEditingAddressId('new');
    setAddressForm({
      type: 'Home',
      recipientName: user?.name || '',
      phone: user?.phone || '',
      building: '',
      street: '',
      city: '',
      state: '',
      pinCode: '',
    });
  };

  const handleSaveAddress = (e) => {
    e.preventDefault();
    if (!addressForm.building.trim() || !addressForm.city.trim() || !addressForm.pinCode.trim()) {
      return;
    }

    if (editingAddressId === 'new') {
      const newAddress = {
        id: Date.now(),
        ...addressForm,
      };
      saveAddressesToStorage([...addresses, newAddress]);
    } else {
      const updated = addresses.map((a) =>
        a.id === editingAddressId ? { ...a, ...addressForm } : a
      );
      saveAddressesToStorage(updated);
    }
    setEditingAddressId(null);
  };

  const handleDeleteAddress = (id) => {
    const updated = addresses.filter((a) => a.id !== id);
    saveAddressesToStorage(updated);
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
          {/* MENU TAB */}
          {activeTab === 'menu' && (
            <div className="flex flex-col h-full justify-between">
              <div className="flex flex-col gap-6">
                {/* User Greeting Card with Quick Edit */}
                <div className="glass-card p-5 rounded-[24px] border border-brand-purple/25 flex items-center justify-between gap-3 bg-white/40 shadow-xs">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full border border-brand-purple/10 overflow-hidden bg-brand-plum text-white flex items-center justify-center font-serif text-lg font-bold flex-shrink-0">
                      {user?.picture ? (
                        <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        user?.name ? user.name[0].toUpperCase() : '👤'
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-brand-dark/60 font-semibold uppercase tracking-wider font-mono">Welcome back,</span>
                      <h3 className="font-serif text-base font-bold text-brand-dark leading-tight">{user?.name || 'Customer'}</h3>
                      <span className="text-[11px] text-brand-dark/65 truncate max-w-[180px]">{user?.email}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setActiveTab('profile');
                      setIsEditingProfile(true);
                    }}
                    className="p-2 rounded-full hover:bg-brand-purple/10 text-brand-plum cursor-pointer transition-colors"
                    title="Edit Profile"
                    aria-label="Edit Profile"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Menu Navigation Items */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleTabChange('profile')}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/40 border border-brand-purple/10 hover:bg-brand-purple/10 transition-colors cursor-pointer text-sm font-semibold"
                  >
                    <div className="flex items-center gap-3">
                      <User className="w-4.5 h-4.5 text-brand-plum" />
                      <span>My Profile</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-brand-dark/40" />
                  </button>

                  <button
                    onClick={() => handleTabChange('orders')}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/40 border border-brand-purple/10 hover:bg-brand-purple/10 transition-colors cursor-pointer text-sm font-semibold"
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="w-4.5 h-4.5 text-brand-plum" />
                      <span>My Orders</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-brand-dark/40" />
                  </button>

                  <button
                    onClick={() => handleTabChange('wishlist')}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/40 border border-brand-purple/10 hover:bg-brand-purple/10 transition-colors cursor-pointer text-sm font-semibold"
                  >
                    <div className="flex items-center gap-3">
                      <Heart className="w-4.5 h-4.5 text-brand-plum" />
                      <span>My Wishlist</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-brand-dark/40" />
                  </button>

                  <button
                    onClick={() => handleTabChange('addresses')}
                    className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/40 border border-brand-purple/10 hover:bg-brand-purple/10 transition-colors cursor-pointer text-sm font-semibold"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4.5 h-4.5 text-brand-plum" />
                      <span>Saved Addresses</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-brand-dark/40" />
                  </button>
                </div>
              </div>

              {/* Logout button at bottom */}
              <button
                onClick={handleLogout}
                className="mt-8 w-full py-3.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          )}

          {/* MY PROFILE DETAILS & EDITING */}
          {activeTab === 'profile' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => handleTabChange('menu')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-plum hover:underline focus:outline-none cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Back to Account
                </button>

                {!isEditingProfile && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-brand-plum/10 text-brand-plum hover:bg-brand-plum hover:text-white text-xs font-bold transition-all cursor-pointer"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit Profile
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                /* Profile Edit Form */
                <form onSubmit={handleSaveProfile} className="space-y-4 bg-white/70 p-5 rounded-[24px] border border-brand-purple/20 shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-brand-purple/10">
                    <span className="font-serif text-sm font-bold text-brand-dark">Edit Profile Details</span>
                    <span className="text-[10px] text-brand-dark/50 font-mono">Personal Info</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-brand-dark/80 block">Full Name</label>
                    <input
                      type="text"
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      required
                      placeholder="Enter your full name"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-purple/20 bg-white focus:outline-none focus:border-brand-purple font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-brand-dark/80 block">Email Address (Read-only)</label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-purple/15 bg-gray-100/70 text-brand-dark/60 cursor-not-allowed font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-brand-dark/80 block">Mobile Number</label>
                    <input
                      type="tel"
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-purple/20 bg-white focus:outline-none focus:border-brand-purple font-medium"
                    />
                  </div>

                  {profileSaveStatus === 'saved' && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5">
                      <Check className="w-4 h-4" /> Profile updated successfully!
                    </div>
                  )}

                  {profileSaveStatus === 'error' && (
                    <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4" /> Failed to save profile changes.
                    </div>
                  )}

                  <div className="flex gap-2.5 pt-2">
                    <button
                      type="submit"
                      disabled={profileSaveStatus === 'saving'}
                      className="flex-1 py-2.5 px-4 rounded-full bg-brand-plum hover:bg-brand-violet text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {profileSaveStatus === 'saving' ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingProfile(false);
                        setProfileName(user?.name || '');
                        setProfilePhone(user?.phone || '');
                      }}
                      className="py-2.5 px-4 rounded-full border border-brand-purple/20 text-brand-dark/70 hover:bg-brand-purple/5 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                /* Profile View Details */
                <div className="flex flex-col gap-4 bg-white/70 p-5 rounded-[24px] border border-brand-purple/20 shadow-xs">
                  {user?.picture && (
                    <div className="flex flex-col items-center pb-4 border-b border-brand-purple/10">
                      <img 
                        src={user.picture} 
                        alt={user.name} 
                        className="w-20 h-20 rounded-full object-cover border-2 border-brand-purple/35 shadow-sm" 
                      />
                      <span className="text-[9px] bg-brand-purple/15 text-brand-plum font-bold px-2.5 py-0.5 rounded-full mt-2.5 uppercase tracking-wider inline-flex items-center gap-1">
                        Verified Member
                      </span>
                    </div>
                  )}
                  <div className="flex flex-col pb-3 border-b border-brand-purple/10">
                    <span className="text-[10px] font-bold text-brand-plum/80 uppercase tracking-widest font-mono">Full Name</span>
                    <span className="text-sm font-semibold mt-0.5 text-brand-dark">{user?.name || 'Customer'}</span>
                  </div>
                  <div className="flex flex-col pb-3 border-b border-brand-purple/10">
                    <span className="text-[10px] font-bold text-brand-plum/80 uppercase tracking-widest font-mono">Email Address</span>
                    <span className="text-sm font-semibold mt-0.5 text-brand-dark">{user?.email}</span>
                  </div>
                  <div className="flex flex-col pb-1">
                    <span className="text-[10px] font-bold text-brand-plum/80 uppercase tracking-widest font-mono">Mobile Number</span>
                    <span className="text-sm font-semibold mt-0.5 text-brand-dark">{user?.phone || 'Not provided'}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MY ORDERS */}
          {activeTab === 'orders' && (
            <div className="h-full flex flex-col">
              <button
                onClick={() => handleTabChange('menu')}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-plum hover:underline mb-6 focus:outline-none cursor-pointer"
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
                    <div key={ord.orderId} className="glass-card p-4 rounded-[22px] border border-brand-purple/15 text-xs bg-white/70">
                      <div className="flex items-center justify-between border-b border-brand-purple/10 pb-2 mb-2">
                        <span className="font-mono font-bold text-brand-plum">{ord.orderId}</span>
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">{ord.orderStatus || ord.paymentStatus || 'CONFIRMED'}</span>
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
                        <span>
                          {ord.shippingAddress
                            ? `${ord.shippingAddress.fullName}, ${ord.shippingAddress.building}, ${ord.shippingAddress.street}, ${ord.shippingAddress.city} - ${ord.shippingAddress.pinCode}`
                            : 'Address on file'}
                        </span>
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
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-plum hover:underline mb-6 focus:outline-none cursor-pointer"
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
                    className="text-[10px] font-bold text-brand-plum hover:underline mt-2 cursor-pointer"
                  >
                    Explore Collections
                  </a>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1">
                  {wishlist.map((item) => (
                    <div key={item.id} className="glass-card p-3.5 rounded-2xl border border-brand-purple/15 flex justify-between items-center text-xs text-left bg-white/70">
                      <div className="flex flex-col text-left pr-2">
                        <span className="font-serif font-bold text-brand-dark line-clamp-1">{item.name}</span>
                        {item.category && (
                          <span className="text-[9px] text-brand-dark/50 capitalize font-mono">{item.category.replace('-', ' ')}</span>
                        )}
                      </div>
                      <div className="flex gap-2 items-center flex-shrink-0">
                        <button
                          onClick={() => addToCart(item)}
                          className="px-3 py-1.5 rounded-full bg-brand-plum text-white text-[9px] font-bold uppercase tracking-wider hover:bg-brand-violet cursor-pointer transition-colors"
                        >
                          Add to Cart
                        </button>
                        <button
                          onClick={() => removeFromWishlist(item.id)}
                          className="p-1.5 rounded-full text-red-500 hover:bg-red-50 cursor-pointer transition-colors"
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
                    className="text-center text-[11px] font-bold text-brand-plum hover:underline mt-3 block"
                  >
                    View Full Wishlist Page ➔
                  </a>
                </div>
              )}
            </div>
          )}

          {/* SAVED ADDRESSES WITH FULL EDIT / ADD / DELETE */}
          {activeTab === 'addresses' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => handleTabChange('menu')}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-plum hover:underline focus:outline-none cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Back to Account
                </button>

                {editingAddressId === null && (
                  <button
                    onClick={handleStartNewAddress}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-brand-plum text-white hover:bg-brand-violet text-xs font-bold transition-all cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Address
                  </button>
                )}
              </div>

              {/* Add / Edit Address Form */}
              {editingAddressId !== null ? (
                <form onSubmit={handleSaveAddress} className="space-y-3.5 bg-white/70 p-5 rounded-[24px] border border-brand-purple/20 shadow-xs">
                  <div className="flex items-center justify-between pb-2.5 border-b border-brand-purple/10">
                    <span className="font-serif text-sm font-bold text-brand-dark">
                      {editingAddressId === 'new' ? 'Add Delivery Address' : 'Edit Delivery Address'}
                    </span>
                    <div className="flex gap-1">
                      {['Home', 'Work', 'Other'].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setAddressForm({ ...addressForm, type: t })}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                            addressForm.type === t ? 'bg-brand-plum text-white' : 'bg-brand-purple/10 text-brand-plum'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-brand-dark/80 block">Recipient Name</label>
                      <input
                        type="text"
                        value={addressForm.recipientName}
                        onChange={(e) => setAddressForm({ ...addressForm, recipientName: e.target.value })}
                        placeholder="Full Name"
                        required
                        className="w-full text-xs px-3 py-2 rounded-xl border border-brand-purple/20 bg-white focus:outline-none focus:border-brand-purple font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-brand-dark/80 block">Phone Number</label>
                      <input
                        type="tel"
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        required
                        className="w-full text-xs px-3 py-2 rounded-xl border border-brand-purple/20 bg-white focus:outline-none focus:border-brand-purple font-medium"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-dark/80 block">Flat / House No. / Building</label>
                    <input
                      type="text"
                      value={addressForm.building}
                      onChange={(e) => setAddressForm({ ...addressForm, building: e.target.value })}
                      placeholder="e.g. Flat 302, Lavender Residency"
                      required
                      className="w-full text-xs px-3 py-2 rounded-xl border border-brand-purple/20 bg-white focus:outline-none focus:border-brand-purple font-medium"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-dark/80 block">Street / Colony / Landmark</label>
                    <input
                      type="text"
                      value={addressForm.street}
                      onChange={(e) => setAddressForm({ ...addressForm, street: e.target.value })}
                      placeholder="e.g. Near Rose Garden, Main Road"
                      required
                      className="w-full text-xs px-3 py-2 rounded-xl border border-brand-purple/20 bg-white focus:outline-none focus:border-brand-purple font-medium"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-brand-dark/80 block">City</label>
                      <input
                        type="text"
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        placeholder="City"
                        required
                        className="w-full text-xs px-3 py-2 rounded-xl border border-brand-purple/20 bg-white focus:outline-none focus:border-brand-purple font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-brand-dark/80 block">State</label>
                      <input
                        type="text"
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        placeholder="State"
                        className="w-full text-xs px-3 py-2 rounded-xl border border-brand-purple/20 bg-white focus:outline-none focus:border-brand-purple font-medium"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-brand-dark/80 block">PIN Code</label>
                      <input
                        type="text"
                        value={addressForm.pinCode}
                        onChange={(e) => setAddressForm({ ...addressForm, pinCode: e.target.value })}
                        placeholder="500081"
                        required
                        className="w-full text-xs px-3 py-2 rounded-xl border border-brand-purple/20 bg-white focus:outline-none focus:border-brand-purple font-medium"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 px-4 rounded-full bg-brand-plum hover:bg-brand-violet text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Save className="w-3.5 h-3.5" /> Save Address
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingAddressId(null)}
                      className="py-2.5 px-4 rounded-full border border-brand-purple/20 text-brand-dark/70 hover:bg-brand-purple/5 text-xs font-bold transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                /* Address Cards List */
                <div className="flex flex-col gap-3.5">
                  {addresses.length === 0 ? (
                    <div className="text-center py-12 bg-white/40 rounded-2xl border border-brand-purple/15 p-6">
                      <MapPin className="w-8 h-8 text-brand-plum/40 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-brand-dark/70">No saved addresses yet.</p>
                      <button
                        onClick={handleStartNewAddress}
                        className="mt-3 inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-brand-plum text-white text-xs font-bold hover:bg-brand-violet cursor-pointer"
                      >
                        <Plus className="w-3 h-3" /> Add Address
                      </button>
                    </div>
                  ) : (
                    addresses.map((adr) => (
                      <div key={adr.id} className="glass-card p-4 rounded-2xl border border-brand-purple/15 flex flex-col gap-2.5 bg-white/70 shadow-xs">
                        <div className="flex items-center justify-between border-b border-brand-purple/10 pb-2">
                          <span className="font-bold text-xs text-brand-plum flex items-center gap-1.5">
                            {adr.type === 'Work' ? <Briefcase className="w-3.5 h-3.5" /> : <Home className="w-3.5 h-3.5" />}
                            {adr.type} Address
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleStartEditAddress(adr)}
                              className="p-1.5 rounded-full hover:bg-brand-purple/10 text-brand-plum cursor-pointer transition-colors"
                              title="Edit Address"
                              aria-label="Edit Address"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(adr.id)}
                              className="p-1.5 rounded-full hover:bg-red-50 text-red-500 cursor-pointer transition-colors"
                              title="Delete Address"
                              aria-label="Delete Address"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="text-xs leading-relaxed text-brand-dark/80 space-y-0.5">
                          {adr.recipientName && (
                            <p className="font-bold text-brand-dark">{adr.recipientName} {adr.phone && <span className="font-normal text-brand-dark/60">({adr.phone})</span>}</p>
                          )}
                          <p>{adr.building || adr.address}</p>
                          {adr.street && <p>{adr.street}</p>}
                          {(adr.city || adr.pinCode) && (
                            <p className="font-semibold text-brand-dark/70">
                              {[adr.city, adr.state, adr.pinCode].filter(Boolean).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default AccountMenu;
