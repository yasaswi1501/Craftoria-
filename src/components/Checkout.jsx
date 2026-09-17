import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin, Plus, Trash, ArrowLeft, ShoppingBag, MessageCircle, Sparkles, Check, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart as useCartContext } from '../context/CartContext';
import { redirectToWhatsApp } from '../utils/whatsapp';
import { getProductImage } from '../utils/getProductImage';
import { calculateOrderTotals, formatINR } from '../utils/pricing';
import ConfirmDialog from './ConfirmDialog';

const Checkout = () => {
  const { user } = useAuth();
  const { cart, clearCart } = useCartContext();

  // Set true only after the WhatsApp redirect has actually been dispatched
  // (the cart is cleared at that same moment) -- distinguishes "cart is
  // empty because the order just went through" from "cart is empty because
  // the customer never added anything."
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderError, setOrderError] = useState('');

  // Address list states
  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // New address form visibility & fields
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [building, setBuilding] = useState('');
  const [street, setStreet] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [saveAddressForFuture, setSaveAddressForFuture] = useState(true);
  const [addressErrors, setAddressErrors] = useState({});

  // Delivery options: 'standard' | 'express'
  const [deliveryOption, setDeliveryOption] = useState('standard');

  // Delete-address confirmation dialog state
  const [addressPendingDelete, setAddressPendingDelete] = useState(null);
  const [isDeletingAddress, setIsDeletingAddress] = useState(false);
  const [deleteAddressError, setDeleteAddressError] = useState('');

  // Fetch / Initialize addresses
  useEffect(() => {
    let loadedAddresses = [];
    try {
      if (user?.email) {
        const userSaved = localStorage.getItem(`craftoria_addresses_${user.email}`);
        if (userSaved) loadedAddresses = JSON.parse(userSaved);
      }
      if (loadedAddresses.length === 0) {
        const saved = localStorage.getItem('craftoria_saved_addresses');
        if (saved) loadedAddresses = JSON.parse(saved);
      }
    } catch (e) {
      loadedAddresses = [];
    }

    // Normalize address structure
    const normalized = (loadedAddresses || []).map(a => ({
      ...a,
      fullName: a.fullName || a.recipientName || user?.name || '',
      phone: a.phone || user?.phone || '',
      stateName: a.stateName || a.state || '',
      building: a.building || a.address || '',
      street: a.street || '',
      landmark: a.landmark || '',
      city: a.city || '',
      pinCode: a.pinCode || '',
    }));

    setAddresses(normalized);
    if (normalized.length > 0) {
      setSelectedAddressId(normalized[0].id);
      setShowNewAddressForm(false);
    } else {
      setSelectedAddressId(null);
      setShowNewAddressForm(true);
      if (user?.name) setFullName(user.name);
      if (user?.phone) setPhone(user.phone);
    }
  }, [user]);

  // Pricing & Cart calculations
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const { subtotal: cartSubtotal, deliveryFee: deliveryCharge, total: grandTotal } = calculateOrderTotals(cart, deliveryOption);

  const persistAddresses = (updated) => {
    if (user?.email) {
      localStorage.setItem(`craftoria_addresses_${user.email}`, JSON.stringify(updated));
    }
    localStorage.setItem('craftoria_saved_addresses', JSON.stringify(updated));
  };

  // Address validation & actions
  const handleAddNewAddressSubmit = (e) => {
    e.preventDefault();
    setAddressErrors({});

    const errs = {};
    if (!fullName.trim()) errs.fullName = 'Full Name is required.';
    if (!phone) {
      errs.phone = 'Mobile Number is required.';
    } else if (!/^[6-9]\d{9}$/.test(phone)) {
      errs.phone = 'Enter a valid 10-digit Indian mobile number.';
    }
    if (!pinCode) {
      errs.pinCode = 'PIN Code is required.';
    } else if (!/^\d{6}$/.test(pinCode)) {
      errs.pinCode = 'Enter a valid 6-digit PIN code.';
    }
    if (!building.trim()) errs.building = 'Building/Flat details are required.';
    if (!street.trim()) errs.street = 'Street details are required.';
    if (!city.trim()) errs.city = 'City is required.';
    if (!stateName.trim()) errs.stateName = 'State is required.';

    if (Object.keys(errs).length > 0) {
      setAddressErrors(errs);
      return;
    }

    const newAddr = {
      id: 'addr_' + Date.now(),
      fullName: fullName.trim(),
      phone: phone.trim(),
      pinCode: pinCode.trim(),
      building: building.trim(),
      street: street.trim(),
      landmark: landmark.trim(),
      city: city.trim(),
      stateName: stateName.trim(),
      saveAddressForFuture
    };

    const updated = [...addresses, newAddr];
    setAddresses(updated);
    setSelectedAddressId(newAddr.id);

    if (saveAddressForFuture) {
      persistAddresses(updated);
    }

    // Reset Form
    setFullName('');
    setPhone('');
    setPinCode('');
    setBuilding('');
    setStreet('');
    setLandmark('');
    setCity('');
    setStateName('');
    setShowNewAddressForm(false);
  };

  const handleRequestDeleteAddress = (addr, e) => {
    e.stopPropagation();
    setDeleteAddressError('');
    setAddressPendingDelete(addr);
  };

  const handleCancelDeleteAddress = () => {
    if (isDeletingAddress) return;
    setAddressPendingDelete(null);
    setDeleteAddressError('');
  };

  const handleConfirmDeleteAddress = async () => {
    if (!addressPendingDelete) return;
    setIsDeletingAddress(true);
    setDeleteAddressError('');
    try {
      const filtered = addresses.filter(a => a.id !== addressPendingDelete.id);
      setAddresses(filtered);
      persistAddresses(filtered);
      if (selectedAddressId === addressPendingDelete.id) {
        setSelectedAddressId(filtered[0]?.id || null);
      }
      if (filtered.length === 0) {
        setShowNewAddressForm(true);
      }
      setAddressPendingDelete(null);
    } catch (err) {
      setDeleteAddressError('Could not delete this address. Please try again.');
    } finally {
      setIsDeletingAddress(false);
    }
  };

  const handleEditAddress = (addr, e) => {
    e.stopPropagation();
    setFullName(addr.fullName);
    setPhone(addr.phone);
    setPinCode(addr.pinCode);
    setBuilding(addr.building);
    setStreet(addr.street);
    setLandmark(addr.landmark || '');
    setCity(addr.city);
    setStateName(addr.stateName);
    setShowNewAddressForm(true);

    const filtered = addresses.filter(a => a.id !== addr.id);
    setAddresses(filtered);
    persistAddresses(filtered);
    if (selectedAddressId === addr.id) {
      setSelectedAddressId(filtered[0]?.id || null);
    }
  };

  const handleProceedToPaymentWhatsApp = (e) => {
    if (e) e.preventDefault();
    setOrderError('');
    const activeAddress = addresses.find(a => a.id === selectedAddressId);
    const dispatched = redirectToWhatsApp(cart, activeAddress, deliveryOption);

    if (dispatched) {
      // Only clear the cart once the order has actually been sent -- a
      // failed/blocked redirect must leave the customer's items untouched.
      setOrderPlaced(true);
      clearCart();
    } else {
      setOrderError('Could not open WhatsApp to send your order. Please try again -- your cart has not been changed.');
    }
  };

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

  // Once the order is sent (or if the customer lands here with nothing in
  // cart), show a dedicated state instead of empty address/order-item cards.
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#FDFBFD] pt-20 sm:pt-24 pb-16 px-3.5 sm:px-6 lg:px-8 text-brand-dark flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-8 sm:p-10 rounded-[28px] border border-brand-purple/20 shadow-sm bg-white/40 text-center max-w-md w-full"
        >
          {orderPlaced ? (
            <>
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <Check className="w-7 h-7" />
              </div>
              <h2 className="font-serif text-xl font-bold mb-2">Order Sent!</h2>
              <p className="text-xs sm:text-sm text-brand-dark/70 leading-relaxed mb-6">
                Your order details have been sent via WhatsApp. Our team will confirm final pricing and delivery with you shortly.
              </p>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-full bg-brand-purple/10 text-brand-plum flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <h2 className="font-serif text-xl font-bold mb-2">Your cart is empty</h2>
              <p className="text-xs sm:text-sm text-brand-dark/70 leading-relaxed mb-6">
                Add a few handcrafted pieces to your cart before checking out.
              </p>
            </>
          )}
          <a
            href="/collections"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-brand-plum hover:bg-brand-violet text-white font-semibold text-xs uppercase tracking-wider transition-all cursor-pointer"
          >
            Continue Shopping
          </a>
        </motion.div>
      </div>
    );
  }

  // No logged-out gate needed here: App.jsx's route guard never mounts
  // Checkout unless the user is authenticated.
  return (
    <div className="min-h-screen bg-[#FDFBFD] pt-20 sm:pt-24 pb-16 px-3.5 sm:px-6 lg:px-8 text-brand-dark max-w-[1250px] mx-auto overflow-x-hidden">
      {/* Checkout Header */}
      <div className="text-center mb-6 sm:mb-8">
        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-plum">Secure Checkout</span>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold mt-1 text-brand-dark">Craftoria</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left"
      >
        {/* Address & Delivery Column */}
        <div className="lg:col-span-8 space-y-6">
          {/* Back to Shop Link */}
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-plum hover:underline cursor-pointer focus:outline-none"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Shop
          </a>

          <div className="glass-card p-5 sm:p-6 rounded-[28px] border border-brand-purple/20 shadow-sm bg-white/40">
            <h2 className="font-serif text-xl font-bold mb-4">Select a delivery address</h2>

            {/* List of saved addresses */}
            <div className="flex flex-col gap-3">
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  onClick={() => setSelectedAddressId(addr.id)}
                  className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer relative flex items-start gap-3 ${
                    selectedAddressId === addr.id
                      ? 'border-brand-plum bg-brand-purple/5 shadow-xs'
                      : 'border-brand-purple/15 hover:border-brand-purple'
                  }`}
                >
                  <input
                    type="radio"
                    name="shippingAddress"
                    checked={selectedAddressId === addr.id}
                    onChange={() => setSelectedAddressId(addr.id)}
                    className="mt-1 accent-brand-plum"
                  />
                  <div className="flex-grow text-xs leading-relaxed">
                    <span className="font-bold text-sm block mb-1">{addr.fullName}</span>
                    <span>{addr.building}, {addr.street}</span>
                    {addr.landmark && <span className="block italic text-brand-dark/70">Landmark: {addr.landmark}</span>}
                    <span className="block">{addr.city}, {addr.stateName} - <strong>{addr.pinCode}</strong></span>
                    <span className="block mt-1 font-semibold text-brand-plum">Mobile: {addr.phone}</span>

                    <div className="flex gap-4 mt-3 pt-2.5 border-t border-brand-purple/10">
                      <button
                        onClick={(e) => handleEditAddress(addr, e)}
                        className="text-[10px] font-bold text-brand-plum hover:underline cursor-pointer"
                      >
                        Edit Address
                      </button>
                      <button
                        onClick={(e) => handleRequestDeleteAddress(addr, e)}
                        className="text-[10px] font-bold text-red-500 hover:underline cursor-pointer inline-flex items-center gap-1"
                      >
                        <Trash className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add new address toggler */}
            {!showNewAddressForm && (
              <button
                onClick={() => setShowNewAddressForm(true)}
                className="w-full flex items-center justify-center gap-2 mt-4 py-3 rounded-2xl border border-dashed border-brand-purple/40 text-brand-plum font-semibold text-xs hover:bg-brand-purple/5 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add New Address
              </button>
            )}

            {/* Add address Form */}
            {showNewAddressForm && (
              <form onSubmit={handleAddNewAddressSubmit} className="mt-6 pt-5 border-t border-brand-purple/15 flex flex-col gap-4 text-xs">
                <h3 className="font-bold text-sm text-brand-plum mb-1">Add shipping details</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col text-left">
                    <label className="font-semibold text-brand-dark/80 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Recipient name"
                      className="px-4 py-2.5 rounded-full glass-input h-10 text-xs"
                    />
                    {addressErrors.fullName && <span className="text-[10px] text-red-500 mt-1">{addressErrors.fullName}</span>}
                  </div>

                  <div className="flex flex-col text-left">
                    <label className="font-semibold text-brand-dark/80 mb-1">Mobile Number (10-digit)</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit number"
                      className="px-4 py-2.5 rounded-full glass-input h-10 text-xs"
                    />
                    {addressErrors.phone && <span className="text-[10px] text-red-500 mt-1">{addressErrors.phone}</span>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="flex flex-col text-left">
                    <label className="font-semibold text-brand-dark/80 mb-1">PIN Code (6-digit)</label>
                    <input
                      type="text"
                      value={pinCode}
                      onChange={(e) => setPinCode(e.target.value)}
                      placeholder="e.g. 400001"
                      className="px-4 py-2.5 rounded-full glass-input h-10 text-xs"
                    />
                    {addressErrors.pinCode && <span className="text-[10px] text-red-500 mt-1">{addressErrors.pinCode}</span>}
                  </div>

                  <div className="flex flex-col text-left">
                    <label className="font-semibold text-brand-dark/80 mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="City"
                      className="px-4 py-2.5 rounded-full glass-input h-10 text-xs"
                    />
                    {addressErrors.city && <span className="text-[10px] text-red-500 mt-1">{addressErrors.city}</span>}
                  </div>

                  <div className="flex flex-col text-left">
                    <label className="font-semibold text-brand-dark/80 mb-1">State</label>
                    <input
                      type="text"
                      value={stateName}
                      onChange={(e) => setStateName(e.target.value)}
                      placeholder="State"
                      className="px-4 py-2.5 rounded-full glass-input h-10 text-xs"
                    />
                    {addressErrors.stateName && <span className="text-[10px] text-red-500 mt-1">{addressErrors.stateName}</span>}
                  </div>
                </div>

                <div className="flex flex-col text-left">
                  <label className="font-semibold text-brand-dark/80 mb-1">House / Flat / Building</label>
                  <input
                    type="text"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    placeholder="House/Apartment details"
                    className="px-4 py-2.5 rounded-full glass-input h-10 text-xs"
                  />
                  {addressErrors.building && <span className="text-[10px] text-red-500 mt-1">{addressErrors.building}</span>}
                </div>

                <div className="flex flex-col text-left">
                  <label className="font-semibold text-brand-dark/80 mb-1">Area / Street</label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    placeholder="Street/Locality"
                    className="px-4 py-2.5 rounded-full glass-input h-10 text-xs"
                  />
                  {addressErrors.street && <span className="text-[10px] text-red-500 mt-1">{addressErrors.street}</span>}
                </div>

                <div className="flex flex-col text-left">
                  <label className="font-semibold text-brand-dark/80 mb-1">Landmark (Optional)</label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="Famous nearby spot"
                    className="px-4 py-2.5 rounded-full glass-input h-10 text-xs"
                  />
                </div>

                <div className="flex items-center gap-2 mt-1 select-none">
                  <input
                    type="checkbox"
                    id="saveAddressForFuture"
                    checked={saveAddressForFuture}
                    onChange={(e) => setSaveAddressForFuture(e.target.checked)}
                    className="accent-brand-plum cursor-pointer w-4 h-4"
                  />
                  <label htmlFor="saveAddressForFuture" className="cursor-pointer font-medium text-brand-dark/85">
                    Save this address for future orders
                  </label>
                </div>

                <div className="flex gap-3 justify-end mt-2">
                  {addresses.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowNewAddressForm(false)}
                      className="px-5 py-2.5 rounded-full border border-brand-purple/35 text-brand-plum font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-full bg-brand-plum hover:bg-brand-violet text-white font-semibold cursor-pointer"
                  >
                    Save Address
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Delivery Speed Section */}
          <div className="glass-card p-5 sm:p-6 rounded-[28px] border border-brand-purple/20 shadow-sm bg-white/40">
            <h2 className="font-serif text-xl font-bold mb-4">Delivery Options</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div
                onClick={() => setDeliveryOption('standard')}
                className={`p-4 rounded-2xl border cursor-pointer relative flex items-start gap-3 transition-colors ${
                  deliveryOption === 'standard'
                    ? 'border-brand-plum bg-brand-purple/5'
                    : 'border-brand-purple/15'
                }`}
              >
                <input
                  type="radio"
                  checked={deliveryOption === 'standard'}
                  onChange={() => setDeliveryOption('standard')}
                  className="mt-0.5 accent-brand-plum"
                />
                <div className="flex flex-col text-left leading-normal">
                  <span className="font-bold text-sm">Standard Delivery</span>
                  <span className="text-brand-dark/70 mt-0.5">Estimated delivery: 3–5 business days</span>
                  <span className="font-bold text-emerald-600 uppercase mt-1 tracking-wider text-[10px]">FREE</span>
                </div>
              </div>

              <div
                onClick={() => setDeliveryOption('express')}
                className={`p-4 rounded-2xl border cursor-pointer relative flex items-start gap-3 transition-colors ${
                  deliveryOption === 'express'
                    ? 'border-brand-plum bg-brand-purple/5'
                    : 'border-brand-purple/15'
                }`}
              >
                <input
                  type="radio"
                  checked={deliveryOption === 'express'}
                  onChange={() => setDeliveryOption('express')}
                  className="mt-0.5 accent-brand-plum"
                />
                <div className="flex flex-col text-left leading-normal">
                  <span className="font-bold text-sm">Express Delivery</span>
                  <span className="text-brand-dark/70 mt-0.5">Estimated delivery: 1–2 business days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Order Items Review */}
          <div className="glass-card p-5 sm:p-6 rounded-[28px] border border-brand-purple/20 shadow-sm bg-white/40">
            <h2 className="font-serif text-xl font-bold mb-4">Your Order</h2>
            <div className="flex flex-col gap-3">
              {cart.map(item => {
                const img = getProductImage(item);
                return (
                  <div key={item.id} className="flex flex-col gap-2 bg-white/60 p-3 rounded-2xl border border-brand-purple/10 text-left">
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-white border border-brand-purple/10 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {img ? (
                            <img src={img} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <ShoppingBag className="w-4 h-4 text-brand-plum/50" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-serif font-bold text-brand-dark text-xs sm:text-sm">{item.name}</span>
                          <span className="text-[10px] text-brand-dark/70 mt-0.5 font-mono">Qty: {item.quantity}</span>
                          <span className="text-xs font-bold text-brand-plum mt-0.5">₹{((item.price || 0) * item.quantity).toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 flex-shrink-0">
                        Custom Crafted
                      </span>
                    </div>

                    {/* Customization Details Sub-card */}
                    {(item.customText || item.customization) && (
                      <div className="bg-brand-purple/10 border border-brand-purple/15 rounded-xl p-2.5 text-[10px] space-y-1 text-brand-dark/85">
                        <div className="font-semibold text-brand-plum">
                          ✍️ <strong>Personalization:</strong> <span className="italic">"{item.customText || item.customization?.text}"</span>
                        </div>
                        {item.customization?.occasion && (
                          <div>🎁 <strong>Occasion:</strong> {item.customization.occasion}</div>
                        )}
                        {item.customization?.packaging && (
                          <div>📦 <strong>Packaging:</strong> {item.customization.packaging}</div>
                        )}
                        {item.customization?.giftNote && (
                          <div>💌 <strong>Gift Note:</strong> "{item.customization.giftNote}"</div>
                        )}
                        {item.customization?.specialNotes && (
                          <div>📝 <strong>Artisan Notes:</strong> "{item.customization.specialNotes}"</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Button */}
          <button
            disabled={!selectedAddressId || cart.length === 0}
            onClick={handleProceedToPaymentWhatsApp}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs uppercase tracking-widest shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Place Order via WhatsApp</span>
          </button>
          {orderError && (
            <p className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" /> {orderError}
            </p>
          )}
        </div>

        {/* Sticky Order Summary Column (Right) */}
        <div className="lg:col-span-4 relative">
          <div className="sticky top-28 space-y-4">
            <div className="glass-card p-5 rounded-[28px] border border-brand-purple/20 shadow-sm text-xs leading-loose bg-white/40">
              <h3 className="font-serif text-base font-bold border-b border-brand-purple/10 pb-2.5 mb-3 text-left">Order Summary</h3>
              <div className="flex flex-col gap-1.5 border-b border-brand-purple/10 pb-3">
                <div className="flex justify-between font-semibold">
                  <span>Total Items:</span>
                  <span className="font-bold text-brand-plum">{totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Shipping Option:</span>
                  <span className="capitalize">{deliveryOption === 'express' ? 'Express Delivery' : 'Standard Delivery'}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Estimated Time:</span>
                  <span>{deliveryOption === 'express' ? '1–2 Business Days' : '3–5 Business Days'}</span>
                </div>
              </div>
              <div className="flex justify-between font-bold text-xs pt-2.5 text-brand-dark/80">
                <span>Packaging:</span>
                <span className="text-emerald-600 font-semibold">Artisan Gift Packaging</span>
              </div>
              <div className="flex flex-col gap-1.5 pt-3 mt-3 border-t border-brand-purple/10">
                <div className="flex justify-between font-semibold">
                  <span>Subtotal:</span>
                  <span>{formatINR(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Delivery Estimate:</span>
                  <span>{deliveryCharge > 0 ? formatINR(deliveryCharge) : 'FREE'}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-brand-plum pt-1">
                  <span>Total:</span>
                  <span>{formatINR(grandTotal)}</span>
                </div>
              </div>
              {selectedAddress && (
                <div className="pt-2.5 mt-2.5 text-[10px] text-brand-dark/70 leading-relaxed border-t border-brand-purple/10">
                  <span className="font-bold block uppercase mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Delivering to:
                  </span>
                  <span>{selectedAddress.fullName}, {selectedAddress.building}, {selectedAddress.city} - {selectedAddress.pinCode}</span>
                </div>
              )}
              <div className="pt-3 mt-3 border-t border-brand-purple/10 flex items-start gap-2 text-[10px] text-brand-dark/60 leading-relaxed">
                <Sparkles className="w-3.5 h-3.5 text-brand-plum flex-shrink-0 mt-0.5" />
                <span>Final pricing and payment details are confirmed with our team directly on WhatsApp before your order ships.</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Delete Address Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!addressPendingDelete}
        title="Delete this address?"
        message={addressPendingDelete ? `"${addressPendingDelete.fullName}" — ${addressPendingDelete.building}, ${addressPendingDelete.city} will be permanently removed from your saved addresses.` : ''}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isLoading={isDeletingAddress}
        errorMessage={deleteAddressError}
        onConfirm={handleConfirmDeleteAddress}
        onCancel={handleCancelDeleteAddress}
      />
    </div>
  );
};

export default Checkout;
