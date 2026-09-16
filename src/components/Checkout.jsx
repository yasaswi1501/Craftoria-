import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MapPin, CreditCard, ChevronDown, ChevronUp, Check, Plus, Trash, 
  ArrowLeft, ShoppingBag, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw, MessageCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart as useCartContext } from '../context/CartContext';
import { paymentService } from '../services/paymentService';
import { supabase } from '../lib/supabase';
import { redirectToWhatsApp } from '../utils/whatsapp';

import sellerMemoryCanvas from '../assets/seller-memory-canvas.png';
import sellerEmbroideryHoop from '../assets/seller-embroidery-hoop.png';
import sellerBloomBouquets from '../assets/seller-bloom-bouquets.png';
import sellerBloomKeychains from '../assets/seller-bloom-keychains.png';
import coverPolaroids from '../assets/polaroids-new.jpg';
import coverClips from '../assets/clips-rubber-bands.jpg';
import coverMacrame from '../assets/macrame-wall-hanging.jpg';
import coverBouquets from '../assets/bloom-bouquets-cover.jpg';
import coverChildFrame from '../assets/gallery-5-child-frame.jpg';
import coverCoupleEmbroidery from '../assets/gallery-3-couple-embroidery.jpg';
import coverBlueFlowerKeychain from '../assets/gallery-2-blue-flower-keychain.jpg';
import coverHeartKeychain from '../assets/gallery-4-heart-keychain.jpg';

const Checkout = () => {
  const { user } = useAuth();
  const { cart, clearCart } = useCartContext();

  // Steps: 'address' | 'payment' | 'review' | 'success' | 'failure'
  const [activeStep, setActiveStep] = useState('address');

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

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking' | 'cod' | 'wallet'
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay'); // 'gpay' | 'phonepe' | 'paytm' | 'other'
  const [upiId, setUpiId] = useState('');
  const [upiVerified, setUpiVerified] = useState(false);
  const [upiErrors, setUpiErrors] = useState('');
  const [upiLoading, setUpiLoading] = useState(false);

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [saveCard, setSaveCard] = useState(false);
  const [cardErrors, setCardErrors] = useState({});

  // Netbanking selection
  const [selectedBank, setSelectedBank] = useState('sbi'); // 'sbi' | 'hdfc' | 'icici' | 'axis' | 'other'

  // Wallet selection
  const [selectedWallet, setSelectedWallet] = useState('paytm'); // 'paytm' | 'amazonpay'

  // Summary collapse state on mobile
  const [isSummaryCollapsed, setIsSummaryCollapsed] = useState(true);

  // Simulation settings
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Placed Order Details
  const [placedOrder, setPlacedOrder] = useState(null);
  const [checkoutError, setCheckoutError] = useState('');

  // One key per checkout attempt: a retried "Place Order" (double click,
  // slow-network retry) reuses this and the backend returns the order
  // already created instead of making a second one. Rotated after success.
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());

  // Image Mapper helper
  const getProductImage = (item) => {
    const id = (typeof item === 'string' ? item : item?.id || '').toLowerCase();
    const imgName = typeof item === 'object' ? item?.image || item?.thumbnail || '' : '';

    if (imgName === 'gallery-2-blue-flower-keychain.jpg' || id.includes('blue-blossom')) return coverBlueFlowerKeychain;
    if (imgName === 'gallery-4-heart-keychain.jpg' || id.includes('heart-keychain') || id.includes('purple-heart')) return coverHeartKeychain;
    if (imgName === 'gallery-3-couple-embroidery.jpg' || id.includes('couple-embroidery')) return coverCoupleEmbroidery;
    if (imgName === 'gallery-5-child-frame.jpg' || id.includes('child-frame') || id.includes('wooden-frame')) return coverChildFrame;
    if (imgName === 'bloom-bouquets-cover.jpg' || id.includes('craftoria-bloom') || id.includes('bloom-bouquets')) return coverBouquets;
    if (imgName === 'macrame-wall-hanging.jpg' || id.includes('macrame') || id.includes('decor')) return coverMacrame;
    if (imgName === 'clips-rubber-bands.jpg' || id.includes('clip') || id.includes('rubber-band')) return coverClips;
    if (imgName === 'polaroids-new.jpg' || imgName === 'gallery-1-polaroid.jpg' || id.includes('polaroid')) return coverPolaroids;
    if (imgName === 'seller-bloom-keychains.png' || id.includes('keychain')) return sellerBloomKeychains;
    if (imgName === 'seller-embroidery-hoop.png' || id.includes('embroidery') || id.includes('hoop')) return sellerEmbroideryHoop;
    if (imgName === 'seller-bloom-bouquets.png' || id.includes('bouquet') || id.includes('gift')) return sellerBloomBouquets;
    if (imgName === 'seller-memory-canvas.png' || id.includes('canvas') || id.includes('frame')) return sellerMemoryCanvas;
    return sellerMemoryCanvas;
  };

  // Sync active step with URL Hash for native Back/Forward browser buttons
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      // Do not allow forward steps if they are not completed
      if (hash === '#payment' && selectedAddressId) {
        setActiveStep('payment');
      } else if (hash === '#review' && selectedAddressId && (paymentMethod === 'cod' || paymentMethod === 'card' || (paymentMethod === 'upi' && upiVerified) || paymentMethod === 'netbanking' || paymentMethod === 'wallet')) {
        setActiveStep('review');
      } else {
        // default step
        setActiveStep('address');
        window.location.hash = '';
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [selectedAddressId, upiVerified, paymentMethod]);

  const goToStep = (stepName) => {
    setActiveStep(stepName);
    if (stepName === 'address') {
      window.location.hash = '';
    } else {
      window.location.hash = stepName;
    }
  };

  // Fetch / Initialize addresses
  useEffect(() => {
    const saved = localStorage.getItem('craftoria_saved_addresses');
    let loadedAddresses = [];
    if (saved) {
      try {
        loadedAddresses = JSON.parse(saved);
      } catch (e) {
        loadedAddresses = [];
      }
    }
    
    // Fallback default address for seamless first-time review
    if (loadedAddresses.length === 0) {
      loadedAddresses = [
        {
          id: 'addr_default_1',
          fullName: user?.name || 'Rahul Sharma',
          phone: user?.phone || '9876543210',
          pinCode: '110001',
          building: 'A-24, 3rd Floor',
          street: 'Connaught Place',
          landmark: 'Near Metro Station Gate 3',
          city: 'New Delhi',
          stateName: 'Delhi',
          saveAddressForFuture: true
        }
      ];
      localStorage.setItem('craftoria_saved_addresses', JSON.stringify(loadedAddresses));
    }
    
    setAddresses(loadedAddresses);
    if (loadedAddresses.length > 0) {
      setSelectedAddressId(loadedAddresses[0].id);
    }
  }, [user]);

  // Pricing & Cart calculations
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartSubtotal = cart.reduce((acc, item) => acc + (item.price || 249) * item.quantity, 0);
  const deliveryCharge = deliveryOption === 'express' ? 150 : 0;
  const discountAmount = 150;
  const taxAmount = Math.round(cartSubtotal * 0.05);
  const grandTotal = cartSubtotal + deliveryCharge + taxAmount - discountAmount;

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
      localStorage.setItem('craftoria_saved_addresses', JSON.stringify(updated));
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

  const handleDeleteAddress = (id, e) => {
    e.stopPropagation(); // prevent selection click
    const filtered = addresses.filter(a => a.id !== id);
    setAddresses(filtered);
    localStorage.setItem('craftoria_saved_addresses', JSON.stringify(filtered));
    if (selectedAddressId === id) {
      setSelectedAddressId(filtered[0]?.id || null);
    }
  };

  // UPI verification
  const handleVerifyUpi = () => {
    setUpiErrors('');
    if (!upiId) {
      setUpiErrors('Please enter a UPI ID.');
      return;
    }
    if (!/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(upiId)) {
      setUpiErrors('Enter a valid UPI ID structure (e.g. user@okaxis).');
      return;
    }

    setUpiLoading(true);
    setTimeout(() => {
      setUpiLoading(false);
      setUpiVerified(true);
    }, 1200);
  };

  // Form validations for Card
  const validateCardForm = () => {
    const errs = {};
    if (!cardNumber || !/^\d{16}$/.test(cardNumber.replace(/\s/g, ''))) {
      errs.cardNumber = 'Enter a valid 16-digit Card Number.';
    }
    if (!cardExpiry || !/^\d{2}\/\d{2}$/.test(cardExpiry)) {
      errs.cardExpiry = 'Enter expiry in MM/YY format.';
    }
    if (!cardCvv || !/^\d{3}$/.test(cardCvv)) {
      errs.cardCvv = 'Enter a valid 3-digit CVV.';
    }
    if (!cardholderName.trim()) {
      errs.cardholderName = 'Cardholder name is required.';
    }
    setCardErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const PAYMENT_STATUS_LABELS = {
    pending: 'PAY ON DELIVERY',
    created: 'PAYMENT PENDING',
    authorized: 'AUTHORIZED',
    paid: 'PAID',
    failed: 'FAILED',
  };

  const buildConfirmOrder = (data, activeAddress) => ({
    orderId: data.order_number,
    date: new Date().toLocaleDateString(),
    items: cart.map(i => ({ name: i.name, quantity: i.quantity, price: i.price || 249 })),
    total: data.total_amount,
    paymentStatus: PAYMENT_STATUS_LABELS[data.payment_status] || data.payment_status?.toUpperCase(),
    orderStatus: data.status,
    shippingAddress: activeAddress,
    estimatedDate: deliveryOption === 'express' ? '1-2 Business Days' : '3-5 Business Days'
  });

  const handleProceedToPaymentWhatsApp = (e) => {
    if (e) e.preventDefault();
    const activeAddress = addresses.find(a => a.id === selectedAddressId);
    redirectToWhatsApp(cart, activeAddress, deliveryOption);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setPaymentProcessing(true);

    const activeAddress = addresses.find(a => a.id === selectedAddressId);
    const addressSnapshot = {
      fullName: activeAddress.fullName,
      phone: activeAddress.phone,
      pinCode: activeAddress.pinCode,
      building: activeAddress.building,
      street: activeAddress.street,
      landmark: activeAddress.landmark,
      city: activeAddress.city,
      stateName: activeAddress.stateName,
    };

    if (paymentMethod === 'card' && !validateCardForm()) {
      setPaymentProcessing(false);
      return;
    }
    if (paymentMethod === 'upi' && !upiVerified) {
      setPaymentProcessing(false);
      setUpiErrors('Verify your UPI ID before completing payment.');
      return;
    }

    // The order (and its stock reservation) is created first, for every
    // payment method -- Razorpay needs a real order_id/total_amount to
    // create its own order against, and this is also what makes the
    // reservation exist while the customer is in the gateway's UI.
    const { data: order, error: orderError } = await supabase.rpc('checkout', {
      p_idempotency_key: idempotencyKey,
      p_shipping_address: addressSnapshot,
      p_billing_address: addressSnapshot,
      p_payment_method: paymentMethod,
      p_delivery_option: deliveryOption,
      p_coupon_code: null,
    });

    if (orderError) {
      setPaymentProcessing(false);
      console.error('Checkout failed:', orderError);
      setCheckoutError(orderError.message || '');
      setActiveStep('failure');
      return;
    }
    setCheckoutError('');

    if (paymentMethod === 'cod') {
      setPaymentProcessing(false);
      setPlacedOrder(buildConfirmOrder(order, activeAddress));
      clearCart();
      setActiveStep('success');
      setIdempotencyKey(crypto.randomUUID());
      return;
    }

    // Online methods: the order exists as pending_payment with stock
    // reserved. Everything below either confirms it (server-verified) or
    // leaves it as a recorded failed/pending attempt -- nothing here can
    // mark it paid on its own say-so.
    try {
      const session = await paymentService.createPaymentSession({ orderId: order.order_id });
      const customerInfo = {
        name: activeAddress.fullName,
        email: user?.email || '',
        phone: activeAddress.phone
      };
      const gatewayRes = await paymentService.triggerGatewayCheckout(session, customerInfo);
      const verifyRes = await paymentService.verifyPaymentSignature(gatewayRes);

      setPaymentProcessing(false);

      if (verifyRes.verified) {
        setPlacedOrder(buildConfirmOrder(
          { ...order, status: verifyRes.orderStatus, payment_status: verifyRes.paymentStatus },
          activeAddress
        ));
        clearCart();
        setActiveStep('success');
        setIdempotencyKey(crypto.randomUUID());
      } else {
        setCheckoutError(verifyRes.message || '');
        setActiveStep('failure');
      }
    } catch (err) {
      setPaymentProcessing(false);
      if (err.status === 'CANCELLED') {
        // Keep user on review/payment step with inputs preserved. The order
        // stays pending_payment -- nothing to undo, no new checkout() call
        // needed if they retry (same idempotency key still applies... but
        // note a fresh Razorpay order is created on retry, see Phase 6 notes).
        console.warn('Payment Cancelled:', err.message);
      } else {
        setCheckoutError(err.message || '');
        setActiveStep('failure');
      }
    }
  };

  const selectedAddress = addresses.find(a => a.id === selectedAddressId);

  // No logged-out gate needed here: App.jsx's route guard never mounts
  // Checkout unless the user is authenticated.
  return (
    <div className="min-h-screen bg-[#FDFBFD] pt-24 pb-16 px-4 sm:px-6 lg:px-8 text-brand-dark max-w-[1250px] mx-auto">
      {/* Checkout Header */}
      <div className="text-center mb-8">
        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-plum">Secure Checkout</span>
        <h1 className="font-serif text-3xl font-bold mt-1 text-brand-dark">Craftoria</h1>
        
        {/* Step progress bar indicator */}
        <div className="flex items-center justify-center gap-2 sm:gap-4 mt-6 text-xs font-semibold uppercase tracking-wider text-brand-dark/50 select-none">
          <span 
            className={`cursor-pointer transition-colors ${activeStep === 'address' ? 'text-brand-plum font-bold' : 'hover:text-brand-plum'}`}
            onClick={() => goToStep('address')}
          >
            1. Address
          </span>
          <span className="opacity-35">➔</span>
          <span 
            className={`transition-colors ${selectedAddressId ? 'cursor-pointer hover:text-brand-plum' : 'cursor-not-allowed'} ${activeStep === 'payment' ? 'text-brand-plum font-bold' : ''}`}
            onClick={() => selectedAddressId && goToStep('payment')}
          >
            2. Payment
          </span>
          <span className="opacity-35">➔</span>
          <span 
            className={`transition-colors ${(selectedAddressId && upiVerified) || (selectedAddressId && paymentMethod !== 'upi') ? 'cursor-pointer hover:text-brand-plum' : 'cursor-not-allowed'} ${activeStep === 'review' ? 'text-brand-plum font-bold' : ''}`}
            onClick={() => selectedAddressId && goToStep('review')}
          >
            3. Review
          </span>
          <span className="opacity-35">➔</span>
          <span className={`${activeStep === 'success' ? 'text-brand-plum font-bold' : ''}`}>
            4. Confirmation
          </span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1: ADDRESS */}
        {activeStep === 'address' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left"
          >
            {/* Address Selection Column */}
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
                            onClick={(e) => {
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
                              handleDeleteAddress(addr.id, e);
                            }}
                            className="text-[10px] font-bold text-brand-plum hover:underline cursor-pointer"
                          >
                            Edit Address
                          </button>
                          <button
                            onClick={(e) => handleDeleteAddress(addr.id, e)}
                            className="text-[10px] font-bold text-red-500 hover:underline cursor-pointer"
                          >
                            Delete
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
                      <button
                        type="button"
                        onClick={() => setShowNewAddressForm(false)}
                        className="px-5 py-2.5 rounded-full border border-brand-purple/35 text-brand-plum font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
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

              {/* Action Button */}
              <button
                disabled={!selectedAddressId}
                onClick={handleProceedToPaymentWhatsApp}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs uppercase tracking-widest shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Proceed to Payment</span>
              </button>
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
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: PAYMENT METHOD */}
        {activeStep === 'payment' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left"
          >
            {/* Payment Selector Column */}
            <div className="lg:col-span-8 space-y-6">
              {/* Back Link */}
              <button
                onClick={() => goToStep('address')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-plum hover:underline cursor-pointer focus:outline-none"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Shipping Address
              </button>

              {/* Gateway trust indicator -- replaced the old dev-only simulation toggle
                  now that card/UPI/netbanking/wallet route through real Razorpay Checkout. */}
              <div className="flex items-center gap-2 p-3.5 rounded-2xl bg-brand-purple/10 border border-brand-purple/20 text-brand-plum text-[11px] font-medium">
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                Payments are processed securely by Razorpay. Card and UPI details never touch Craftoria's servers.
              </div>

              {/* Payment Methods Card */}
              <div className="glass-card p-5 sm:p-6 rounded-[28px] border border-brand-purple/20 shadow-sm bg-white/40">
                <h2 className="font-serif text-xl font-bold mb-4">Select a payment method</h2>
                
                <div className="flex flex-col gap-3.5">
                  {/* Option 1: UPI */}
                  <div
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-4 rounded-2xl border transition-colors cursor-pointer text-xs ${
                      paymentMethod === 'upi' ? 'border-brand-plum bg-brand-purple/5' : 'border-brand-purple/15'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={paymentMethod === 'upi'}
                        onChange={() => setPaymentMethod('upi')}
                        className="accent-brand-plum"
                      />
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">UPI (GPay / PhonePe / Paytm)</span>
                        <span className="text-brand-dark/65 mt-0.5">Pay instantly using any UPI app</span>
                      </div>
                    </div>

                    {paymentMethod === 'upi' && (
                      <div className="mt-4 pt-4 border-t border-brand-purple/10 flex flex-col gap-4 text-left ml-7">
                        <span className="font-semibold text-brand-dark/80">Choose UPI App:</span>
                        <div className="flex flex-wrap gap-2.5">
                          {['gpay', 'phonepe', 'paytm', 'other'].map(app => (
                            <button
                              key={app}
                              type="button"
                              onClick={() => {
                                setSelectedUpiApp(app);
                                setUpiVerified(false);
                                setUpiErrors('');
                              }}
                              className={`px-4 py-1.5 rounded-full border text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all ${
                                selectedUpiApp === app
                                  ? 'bg-brand-plum text-white border-brand-plum'
                                  : 'bg-white border-brand-purple/20 hover:border-brand-purple'
                              }`}
                            >
                              {app}
                            </button>
                          ))}
                        </div>

                        <div className="flex flex-col gap-2 mt-2">
                          <label className="font-semibold text-brand-dark/80">Enter UPI ID</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={upiId}
                              onChange={(e) => {
                                setUpiId(e.target.value);
                                setUpiVerified(false);
                                setUpiErrors('');
                              }}
                              placeholder="e.g. mobile@upi"
                              className="px-4 py-2 rounded-full glass-input h-10 max-w-xs text-xs flex-grow"
                            />
                            <button
                              type="button"
                              onClick={handleVerifyUpi}
                              disabled={upiLoading}
                              className="px-5 py-2.5 rounded-full bg-brand-plum hover:bg-brand-violet text-white font-semibold flex items-center justify-center cursor-pointer disabled:opacity-50"
                            >
                              {upiLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Verify'}
                            </button>
                          </div>
                          {upiVerified && (
                            <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                              <Check className="w-3.5 h-3.5" /> UPI ID Verified Successfully
                            </span>
                          )}
                          {upiErrors && (
                            <span className="text-[10px] text-red-500 font-semibold mt-0.5">{upiErrors}</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Option 2: Card */}
                  <div
                    onClick={() => setPaymentMethod('card')}
                    className={`p-4 rounded-2xl border transition-colors cursor-pointer text-xs ${
                      paymentMethod === 'card' ? 'border-brand-plum bg-brand-purple/5' : 'border-brand-purple/15'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={paymentMethod === 'card'}
                        onChange={() => setPaymentMethod('card')}
                        className="accent-brand-plum"
                      />
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">Credit / Debit Card</span>
                        <span className="text-brand-dark/65 mt-0.5">Visa • Mastercard • RuPay • Maestro</span>
                      </div>
                    </div>

                    {paymentMethod === 'card' && (
                      <div className="mt-4 pt-4 border-t border-brand-purple/10 flex flex-col gap-4 text-left ml-7">
                        <div className="flex flex-col">
                          <label className="font-semibold text-brand-dark/80 mb-1">Card Number</label>
                          <input
                            type="text"
                            maxLength="19"
                            value={cardNumber}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                              const matches = v.match(/\d{4,16}/g);
                              const match = (matches && matches[0]) || '';
                              const parts = [];
                              for (let i = 0, len = match.length; i < len; i += 4) {
                                parts.push(match.substring(i, i + 4));
                              }
                              setCardNumber(parts.length > 0 ? parts.join(' ') : v);
                              setCardErrors(prev => ({ ...prev, cardNumber: '' }));
                            }}
                            placeholder="4321 8765 2345 9876"
                            className="px-4 py-2.5 rounded-full glass-input h-10 text-xs max-w-sm"
                          />
                          {cardErrors.cardNumber && <span className="text-[10px] text-red-500 mt-1">{cardErrors.cardNumber}</span>}
                        </div>

                        <div className="grid grid-cols-2 gap-4 max-w-sm">
                          <div className="flex flex-col">
                            <label className="font-semibold text-brand-dark/80 mb-1">Expiry Date</label>
                            <input
                              type="text"
                              maxLength="5"
                              value={cardExpiry}
                              onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setCardExpiry(val.length >= 2 ? val.substring(0, 2) + '/' + val.substring(2, 4) : val);
                                setCardErrors(prev => ({ ...prev, cardExpiry: '' }));
                              }}
                              placeholder="MM/YY"
                              className="px-4 py-2.5 rounded-full glass-input h-10 text-xs text-center"
                            />
                            {cardErrors.cardExpiry && <span className="text-[10px] text-red-500 mt-1">{cardErrors.cardExpiry}</span>}
                          </div>

                          <div className="flex flex-col">
                            <label className="font-semibold text-brand-dark/80 mb-1">CVV</label>
                            <input
                              type="password"
                              maxLength="3"
                              value={cardCvv}
                              onChange={(e) => {
                                setCardCvv(e.target.value.replace(/[^0-9]/g, ''));
                                setCardErrors(prev => ({ ...prev, cardCvv: '' }));
                              }}
                              placeholder="•••"
                              className="px-4 py-2.5 rounded-full glass-input h-10 text-xs text-center"
                            />
                            {cardErrors.cardCvv && <span className="text-[10px] text-red-500 mt-1">{cardErrors.cardCvv}</span>}
                          </div>
                        </div>

                        <div className="flex flex-col">
                          <label className="font-semibold text-brand-dark/80 mb-1">Cardholder Name</label>
                          <input
                            type="text"
                            value={cardholderName}
                            onChange={(e) => {
                              setCardholderName(e.target.value);
                              setCardErrors(prev => ({ ...prev, cardholderName: '' }));
                            }}
                            placeholder="Name as on card"
                            className="px-4 py-2.5 rounded-full glass-input h-10 text-xs max-w-sm"
                          />
                          {cardErrors.cardholderName && <span className="text-[10px] text-red-500 mt-1">{cardErrors.cardholderName}</span>}
                        </div>

                        <div className="flex items-center gap-2 select-none">
                          <input
                            type="checkbox"
                            id="saveCard"
                            checked={saveCard}
                            onChange={(e) => setSaveCard(e.target.checked)}
                            className="accent-brand-plum cursor-pointer w-4 h-4"
                          />
                          <label htmlFor="saveCard" className="cursor-pointer font-semibold text-brand-dark/80">
                            Save this card securely for future payments
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Option 3: Netbanking */}
                  <div
                    onClick={() => setPaymentMethod('netbanking')}
                    className={`p-4 rounded-2xl border transition-colors cursor-pointer text-xs ${
                      paymentMethod === 'netbanking' ? 'border-brand-plum bg-brand-purple/5' : 'border-brand-purple/15'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={paymentMethod === 'netbanking'}
                        onChange={() => setPaymentMethod('netbanking')}
                        className="accent-brand-plum"
                      />
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">Net Banking</span>
                        <span className="text-brand-dark/65 mt-0.5">Select from popular Indian banks</span>
                      </div>
                    </div>

                    {paymentMethod === 'netbanking' && (
                      <div className="mt-4 pt-4 border-t border-brand-purple/10 flex flex-col gap-3.5 text-left ml-7">
                        <span className="font-semibold text-brand-dark/80">Popular Banks:</span>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {['sbi', 'hdfc', 'icici', 'axis'].map(bank => (
                            <button
                              key={bank}
                              type="button"
                              onClick={() => setSelectedBank(bank)}
                              className={`px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
                                selectedBank === bank
                                  ? 'bg-brand-plum text-white border-brand-plum'
                                  : 'bg-white border-brand-purple/15 hover:border-brand-purple'
                              }`}
                            >
                              {bank === 'sbi' ? 'SBI' : bank === 'hdfc' ? 'HDFC' : bank === 'icici' ? 'ICICI' : 'Axis Bank'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Option 4: Wallet */}
                  <div
                    onClick={() => setPaymentMethod('wallet')}
                    className={`p-4 rounded-2xl border transition-colors cursor-pointer text-xs ${
                      paymentMethod === 'wallet' ? 'border-brand-plum bg-brand-purple/5' : 'border-brand-purple/15'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={paymentMethod === 'wallet'}
                        onChange={() => setPaymentMethod('wallet')}
                        className="accent-brand-plum"
                      />
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">Wallets</span>
                        <span className="text-brand-dark/65 mt-0.5">Pay using Paytm or Amazon Pay Wallet</span>
                      </div>
                    </div>

                    {paymentMethod === 'wallet' && (
                      <div className="mt-4 pt-4 border-t border-brand-purple/10 flex flex-col gap-3 text-left ml-7">
                        <span className="font-semibold text-brand-dark/80 font-serif">Supported Wallets:</span>
                        <div className="flex gap-2">
                          {['paytm', 'amazonpay'].map(wallet => (
                            <button
                              key={wallet}
                              type="button"
                              onClick={() => setSelectedWallet(wallet)}
                              className={`px-4 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
                                selectedWallet === wallet
                                  ? 'bg-brand-plum text-white border-brand-plum'
                                  : 'bg-white border-brand-purple/15 hover:border-brand-purple'
                              }`}
                            >
                              {wallet === 'paytm' ? 'Paytm Wallet' : 'Amazon Pay'}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Option 5: COD */}
                  <div
                    onClick={() => setPaymentMethod('cod')}
                    className={`p-4 rounded-2xl border transition-colors cursor-pointer text-xs ${
                      paymentMethod === 'cod' ? 'border-brand-plum bg-brand-purple/5' : 'border-brand-purple/15'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="accent-brand-plum"
                      />
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">Cash on Delivery (COD)</span>
                        <span className="text-brand-dark/65 mt-0.5">Pay when your order is delivered</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Secure Trust Bar */}
              <div className="flex items-start gap-2.5 p-4 rounded-2xl bg-brand-cream border border-brand-purple/10 text-[11px] leading-relaxed">
                <ShieldCheck className="w-5 h-5 text-brand-plum flex-shrink-0 mt-0.5" />
                <div className="flex flex-col text-left">
                  <strong className="font-serif text-brand-plum">🔒 Secure Payment Processing</strong>
                  <span className="text-brand-dark/70">Your payment information is encrypted and securely processed. We do not store raw card numbers, CVV codes, bank credentials, or UPI PINs.</span>
                </div>
              </div>

              {/* Navigation CTAs */}
              <div className="flex flex-wrap gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (paymentMethod === 'card' && !validateCardForm()) return;
                    if (paymentMethod === 'upi' && !upiVerified) {
                      setUpiErrors('Please verify your UPI ID to proceed.');
                      return;
                    }
                    goToStep('review');
                  }}
                  className="px-8 py-3.5 rounded-full bg-brand-plum hover:bg-brand-violet text-white font-semibold text-xs uppercase tracking-widest shadow-md hover:shadow-lg transition-all cursor-pointer"
                >
                  Continue to Review
                </button>
              </div>

            </div>

            {/* Sticky Order Summary Column (Right) */}
            <div className="lg:col-span-4 relative">
              <div className="sticky top-28 space-y-4">
                <div className="glass-card p-5 rounded-[28px] border border-brand-purple/20 shadow-sm text-xs leading-loose text-left bg-white/40">
                  <h3 className="font-serif text-base font-bold border-b border-brand-purple/10 pb-2.5 mb-3">Order Summary</h3>
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
                  <div className="flex justify-between font-bold text-xs pt-2.5 mb-3 text-brand-dark/80">
                    <span>Packaging:</span>
                    <span className="text-emerald-600 font-semibold">Artisan Gift Packaging</span>
                  </div>

                  <div className="pt-2 text-[10px] text-brand-dark/70 leading-relaxed border-t border-brand-purple/10">
                    <span className="font-bold block uppercase mb-1">Delivering to:</span>
                    <span>{selectedAddress?.fullName}, {selectedAddress?.building}, {selectedAddress?.city} - {selectedAddress?.pinCode}</span>
                  </div>
                </div>
              </div>
            </div>

          </motion.div>
        )}

        {/* STEP 3: ORDER REVIEW */}
        {activeStep === 'review' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left"
          >
            {/* Review Details Column */}
            <div className="lg:col-span-8 space-y-6">
              {/* Back Link */}
              <button
                onClick={() => goToStep('payment')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand-plum hover:underline cursor-pointer focus:outline-none"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Payment Method
              </button>

              <div className="glass-card p-5 sm:p-6 rounded-[28px] border border-brand-purple/20 shadow-sm space-y-5 text-xs leading-relaxed bg-white/40">
                <h2 className="font-serif text-xl font-bold border-b border-brand-purple/10 pb-3 mb-4">Review Your Order</h2>
                
                {/* 1. Delivery Details */}
                <div className="flex flex-col gap-1 border-b border-brand-purple/10 pb-4">
                  <span className="font-bold text-brand-plum uppercase tracking-wider text-[10px]">Delivery Details</span>
                  <span className="font-semibold block text-sm mt-1">{selectedAddress?.fullName}</span>
                  <span>{selectedAddress?.building}, {selectedAddress?.street}</span>
                  <span>{selectedAddress?.city}, {selectedAddress?.stateName} - {selectedAddress?.pinCode}</span>
                  <span className="font-semibold mt-1">Mobile: {selectedAddress?.phone}</span>
                  <span className="text-brand-plum mt-1 block font-semibold uppercase text-[9px] tracking-wider bg-brand-purple/10 px-2 py-0.5 rounded-md w-fit">
                    {deliveryOption === 'express' ? 'Express Shipping (1-2 days)' : 'Standard Free Shipping (3-5 days)'}
                  </span>
                </div>

                {/* 2. Payment Method Details */}
                <div className="flex flex-col gap-1 border-b border-brand-purple/10 pb-4">
                  <span className="font-bold text-brand-plum uppercase tracking-wider text-[10px]">Payment Details</span>
                  <span className="font-semibold text-sm capitalize mt-1">
                    {paymentMethod === 'upi' && `UPI Payment (${selectedUpiApp.toUpperCase()}: ${upiId})`}
                    {paymentMethod === 'card' && `Credit/Debit Card (ending in ${cardNumber.substring(cardNumber.length - 4)})`}
                    {paymentMethod === 'netbanking' && `Net Banking (${selectedBank.toUpperCase()})`}
                    {paymentMethod === 'wallet' && `Wallet (${selectedWallet === 'paytm' ? 'Paytm' : 'Amazon Pay'})`}
                    {paymentMethod === 'cod' && 'Cash on Delivery (COD)'}
                  </span>
                </div>

                {/* 3. Items Review */}
                <div className="flex flex-col gap-3">
                  <span className="font-bold text-brand-plum uppercase tracking-wider text-[10px] mb-1">Review Items</span>
                  <div className="flex flex-col gap-3">
                    {cart.map(item => {
                      const img = getProductImage(item);
                      return (
                        <div key={item.id} className="flex justify-between items-center bg-white/50 p-2.5 rounded-xl border border-brand-purple/5">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-white border border-brand-purple/10 overflow-hidden flex-shrink-0 flex items-center justify-center p-1">
                              {img ? (
                                <img src={img} alt={item.name} className="w-full h-full object-contain" />
                              ) : (
                                <ShoppingBag className="w-4 h-4 text-brand-plum/50" />
                              )}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-serif font-bold text-brand-dark">{item.name}</span>
                              <span className="text-[10px] text-brand-dark/70 mt-0.5">Quantity: {item.quantity}</span>
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">Ready</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* Complete Payment Button */}
              <button
                onClick={handleProceedToPaymentWhatsApp}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs uppercase tracking-widest shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Proceed to Payment on WhatsApp</span>
              </button>

            </div>

            {/* Sticky Order Summary Column (Right) */}
            <div className="lg:col-span-4 relative">
              <div className="sticky top-28 space-y-4">
                <div className="glass-card p-5 rounded-[28px] border border-brand-purple/20 shadow-sm text-xs leading-loose text-left bg-white/40">
                  <h3 className="font-serif text-base font-bold border-b border-brand-purple/10 pb-2.5 mb-3">Order Summary</h3>
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
                  <div className="flex justify-between font-bold text-xs pt-2.5 mb-3 text-brand-dark/80">
                    <span>Packaging:</span>
                    <span className="text-emerald-600 font-semibold">Artisan Gift Packaging</span>
                  </div>

                  <div className="pt-2 text-[10px] text-brand-dark/70 leading-relaxed border-t border-brand-purple/10">
                    <span className="font-bold block uppercase mb-1">Delivering to:</span>
                    <span>{selectedAddress?.fullName}, {selectedAddress?.building}, {selectedAddress?.city} - {selectedAddress?.pinCode}</span>
                  </div>
                </div>
              </div>
            </div>

          </motion.div>
        )}

        {/* STEP 4: ORDER SUCCESS */}
        {activeStep === 'success' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto glass-card rounded-[32px] overflow-hidden p-6 sm:p-8 border border-brand-purple/25 shadow-md text-center flex flex-col items-center bg-white/40"
          >
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-5 animate-bounce" />
            <h2 className="font-serif text-2xl font-bold mb-2">Order placed successfully! 🎉</h2>
            <p className="text-xs text-brand-dark/70 leading-relaxed max-w-sm mb-6">
              Thank you for shopping with Craftoria. Your support directly aids local artisans in keeping handcrafted techniques alive.
            </p>

            {/* Order Detail Summary Box */}
            <div className="w-full text-left bg-white/60 border border-brand-purple/10 p-5 rounded-2xl text-xs space-y-3 mb-6">
              <div className="flex justify-between border-b border-brand-purple/10 pb-2 font-mono">
                <span className="font-bold text-brand-plum">ORDER ID</span>
                <span className="font-semibold">{placedOrder?.orderId}</span>
              </div>
              <div className="flex justify-between border-b border-brand-purple/10 pb-2">
                <span className="font-semibold text-brand-dark/70">Payment Status</span>
                <span className="font-bold text-emerald-600">{placedOrder?.paymentStatus}</span>
              </div>
              <div className="flex justify-between border-b border-brand-purple/10 pb-2">
                <span className="font-semibold text-brand-dark/70">Total Items</span>
                <span className="font-bold text-brand-plum">{placedOrder?.items?.reduce((a, b) => a + (b.quantity || 1), 0) || totalItemsCount} items</span>
              </div>
              <div className="flex justify-between border-b border-brand-purple/10 pb-2">
                <span className="font-semibold text-brand-dark/70">Est. Delivery</span>
                <span className="font-bold">{placedOrder?.estimatedDate}</span>
              </div>
              <div className="text-[11px] text-brand-dark/80 pt-1 leading-normal">
                <span className="font-bold block uppercase text-[9px] text-brand-plum mb-0.5">Shipping Address:</span>
                <span>{placedOrder?.shippingAddress?.fullName}, {placedOrder?.shippingAddress?.building}, {placedOrder?.shippingAddress?.street}, {placedOrder?.shippingAddress?.city} - {placedOrder?.shippingAddress?.pinCode}</span>
              </div>
            </div>

            {/* Tracking Progress Section */}
            <div className="w-full mb-8 text-left text-[10px] font-semibold uppercase tracking-widest text-brand-dark/60">
              <span className="block mb-3 font-serif font-bold text-xs text-brand-dark normal-case tracking-normal">Shipping Status:</span>
              <div className="flex justify-between items-center text-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center"><Check className="w-3.5 h-3.5" /></div>
                  <span>Placed</span>
                </div>
                <div className="h-0.5 bg-brand-purple/20 flex-grow -mt-7" />
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full bg-brand-plum text-white flex items-center justify-center font-bold">1</div>
                  <span>Processing</span>
                </div>
                <div className="h-0.5 bg-brand-purple/20 flex-grow -mt-7" />
                <div className="flex flex-col items-center gap-1.5 opacity-40">
                  <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold">2</div>
                  <span>Shipped</span>
                </div>
                <div className="h-0.5 bg-brand-purple/20 flex-grow -mt-7" />
                <div className="flex flex-col items-center gap-1.5 opacity-40">
                  <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold">3</div>
                  <span>Delivered</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 justify-center w-full">
              <a
                href="/"
                className="px-6 py-3 rounded-full border border-brand-purple text-brand-plum font-semibold text-xs uppercase tracking-widest hover:bg-brand-purple/10 transition-colors"
              >
                Continue Shopping
              </a>
            </div>
          </motion.div>
        )}

        {/* STEP 5: FAILURE */}
        {activeStep === 'failure' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto glass-card rounded-[32px] overflow-hidden p-6 sm:p-8 border border-red-200 shadow-md text-center flex flex-col items-center bg-white/40"
          >
            <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="font-serif text-2xl font-bold mb-2">Payment failed</h2>
            <p className="text-xs text-brand-dark/70 leading-relaxed max-w-sm mb-6">
              Your order has not been placed. The card or UPI authorization transaction was declined by the cardholder bank.
              {checkoutError && (
                <span className="block mt-2 font-semibold text-red-600">{checkoutError}</span>
              )}
            </p>

            <div className="flex flex-col gap-2.5 w-full">
              <button
                type="button"
                onClick={() => goToStep('review')}
                className="w-full py-3.5 rounded-full bg-brand-plum hover:bg-brand-violet text-white font-semibold text-xs uppercase tracking-widest shadow-md transition-colors cursor-pointer"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={() => goToStep('payment')}
                className="w-full py-3.5 rounded-full border border-brand-purple text-brand-plum font-semibold text-xs uppercase tracking-widest hover:bg-brand-purple/15 transition-colors cursor-pointer"
              >
                Choose Another Payment Method
              </button>
              <a
                href="/"
                className="w-full py-3.5 rounded-full border border-gray-300 text-gray-700 font-semibold text-xs uppercase tracking-widest hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                Return to Cart
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Checkout;
