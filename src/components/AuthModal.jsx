import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { X, Eye, EyeOff, Mail, Phone, Lock, User, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useScrollLock } from '../utils/scrollLock';
import { useEscapeKey } from '../utils/useEscapeKey';

const AuthModal = ({ isOpen, onClose }) => {
  const { login, signup, loginWithGoogle, forgotPassword } = useAuth();
  const [view, setView] = useState('login'); // 'login' | 'signup' | 'forgot'

  // Lock background body scroll cleanly when auth modal is open
  useScrollLock(isOpen);
  useEscapeKey(isOpen, onClose);

  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  // Reset/Forgot field
  const [resetField, setResetField] = useState('');

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Strength feedback
  const [passwordStrength, setPasswordStrength] = useState(''); // 'Weak' | 'Medium' | 'Strong'
  const [strengthColor, setStrengthColor] = useState('');

  // Error/Success state
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // Address Onboarding state (shown immediately after signup)
  const [addressRecipientName, setAddressRecipientName] = useState('');
  const [addressPhone, setAddressPhone] = useState('');
  const [addressBuilding, setAddressBuilding] = useState('');
  const [addressStreet, setAddressStreet] = useState('');
  const [addressLandmark, setAddressLandmark] = useState('');
  const [addressCity, setAddressCity] = useState('');
  const [addressState, setAddressState] = useState('');
  const [addressPinCode, setAddressPinCode] = useState('');
  const [addressType, setAddressType] = useState('Home'); // 'Home' | 'Work' | 'Other'
  const [addressErrors, setAddressErrors] = useState({});
  const [addressSavedSuccess, setAddressSavedSuccess] = useState(false);
  const addressSavedTimeoutRef = useRef(null);
  useEffect(() => () => clearTimeout(addressSavedTimeoutRef.current), []);

  // Load password strength checks
  useEffect(() => {
    if (!password) {
      setPasswordStrength('');
      setStrengthColor('');
      return;
    }
    
    if (password.length < 6) {
      setPasswordStrength('Weak (too short)');
      setStrengthColor('text-red-500 bg-red-500/10');
    } else if (password.length >= 6 && password.length < 9) {
      if (/\d/.test(password)) {
        setPasswordStrength('Medium');
        setStrengthColor('text-amber-600 bg-amber-500/10');
      } else {
        setPasswordStrength('Weak (add numbers)');
        setStrengthColor('text-red-500 bg-red-500/10');
      }
    } else {
      if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) {
        setPasswordStrength('Strong');
        setStrengthColor('text-emerald-600 bg-emerald-500/10');
      } else if (/\d/.test(password)) {
        setPasswordStrength('Medium');
        setStrengthColor('text-amber-600 bg-amber-500/10');
      } else {
        setPasswordStrength('Weak (add numbers & symbols)');
        setStrengthColor('text-red-500 bg-red-500/10');
      }
    }
  }, [password]);

  if (!isOpen) return null;

  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const validatePhone = (val) => /^\d{10}$/.test(val);

  const handleGoogleClick = async () => {
    setIsGoogleLoading(true);
    setGeneralError('');
    const res = await loginWithGoogle();
    if (res && !res.success) {
      setGeneralError(res.message);
      setIsGoogleLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');
    setSuccessMessage('');

    let validationErrors = {};
    if (!email) {
      validationErrors.email = 'Email is required.';
    }
    if (!password) {
      validationErrors.password = 'Password is required.';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    const res = await login(email, password);
    setIsSubmitting(false);
    if (res.success) {
      clearFields();
      onClose();
    } else {
      setGeneralError(res.message);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');
    setSuccessMessage('');

    let validationErrors = {};
    if (!name.trim()) {
      validationErrors.name = 'Full Name is required.';
    }
    if (!email) {
      validationErrors.email = 'Email is required.';
    } else if (!validateEmail(email)) {
      validationErrors.email = 'Please enter a valid email address.';
    }
    if (!phone) {
      validationErrors.phone = 'Mobile Number is required.';
    } else if (!validatePhone(phone)) {
      validationErrors.phone = 'Mobile Number must be exactly 10 digits.';
    }
    if (!password) {
      validationErrors.password = 'Password is required.';
    } else if (password.length < 6) {
      validationErrors.password = 'Password must be at least 6 characters.';
    }
    if (!confirmPassword) {
      validationErrors.confirmPassword = 'Confirm Password is required.';
    } else if (password !== confirmPassword) {
      validationErrors.confirmPassword = 'Passwords do not match.';
    }
    if (!agreeTerms) {
      validationErrors.agreeTerms = 'You must agree to the Terms & Conditions.';
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    const res = await signup(name.trim(), email, phone, password);
    setIsSubmitting(false);
    
    if (res.success) {
      if (res.needsConfirmation) {
        setSuccessMessage(res.message);
      } else {
        // Pre-fill address onboarding with the user's name & phone from signup
        setAddressRecipientName(name.trim());
        setAddressPhone(phone.trim());
        setAddressErrors({});
        setAddressSavedSuccess(false);
        setView('address_onboarding');
      }
    } else {
      setGeneralError(res.message);
    }
  };

  const handleSaveAddressOnboarding = (e) => {
    e.preventDefault();
    setAddressErrors({});

    const errs = {};
    if (!addressRecipientName.trim()) errs.name = 'Recipient name is required.';
    if (!addressPhone.trim() || !/^[6-9]\d{9}$/.test(addressPhone.trim().replace(/\D/g, '').slice(-10))) {
      errs.phone = 'Enter a valid 10-digit mobile number.';
    }
    if (!addressBuilding.trim()) errs.building = 'Building / Flat / House details are required.';
    if (!addressStreet.trim()) errs.street = 'Street / Area details are required.';
    if (!addressCity.trim()) errs.city = 'City is required.';
    if (!addressPinCode.trim() || !/^\d{6}$/.test(addressPinCode.trim())) {
      errs.pinCode = 'Enter a valid 6-digit PIN code.';
    }

    if (Object.keys(errs).length > 0) {
      setAddressErrors(errs);
      return;
    }

    const cleanPhone = addressPhone.trim().replace(/\D/g, '').slice(-10);

    const newAddress = {
      id: 'addr_' + Date.now(),
      type: addressType,
      recipientName: addressRecipientName.trim(),
      fullName: addressRecipientName.trim(),
      phone: cleanPhone,
      building: addressBuilding.trim(),
      street: addressStreet.trim(),
      landmark: addressLandmark.trim(),
      city: addressCity.trim(),
      state: addressState.trim() || 'Telangana',
      stateName: addressState.trim() || 'Telangana',
      pinCode: addressPinCode.trim(),
      saveAddressForFuture: true,
    };

    try {
      if (email) {
        localStorage.setItem(`craftoria_addresses_${email}`, JSON.stringify([newAddress]));
      }
      localStorage.setItem('craftoria_saved_addresses', JSON.stringify([newAddress]));
    } catch (err) {
      console.error('Failed to save address:', err);
    }

    setAddressSavedSuccess(true);
    clearTimeout(addressSavedTimeoutRef.current);
    addressSavedTimeoutRef.current = setTimeout(() => {
      clearFields();
      onClose();
    }, 1100);
  };

  const handleSkipAddressOnboarding = () => {
    clearFields();
    onClose();
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');
    setSuccessMessage('');

    if (!resetField) {
      setErrors({ resetField: 'Email address is required.' });
      return;
    }

    setIsSubmitting(true);
    const res = await forgotPassword(resetField);
    setIsSubmitting(false);
    if (res.success) {
      setSuccessMessage(res.message);
      setResetField('');
    } else {
      setGeneralError(res.message);
    }
  };

  const clearFields = () => {
    setName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setResetField('');
    setAgreeTerms(false);
    setErrors({});
    setGeneralError('');
    setSuccessMessage('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setIsSubmitting(false);
    setIsGoogleLoading(false);
    
    // Reset address onboarding fields
    setAddressRecipientName('');
    setAddressPhone('');
    setAddressBuilding('');
    setAddressStreet('');
    setAddressLandmark('');
    setAddressCity('');
    setAddressState('');
    setAddressPinCode('');
    setAddressType('Home');
    setAddressErrors({});
    setAddressSavedSuccess(false);
  };

  const handleViewChange = (newView) => {
    clearFields();
    setView(newView);
  };

  const GoogleLogoSvg = () => (
    <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-brand-plum/60 backdrop-blur-md overflow-y-auto no-scrollbar pb-safe pt-safe" role="dialog" aria-modal="true" aria-label="Sign in to Craftoria" data-lenis-prevent="true">
      <div 
        className="fixed inset-0 cursor-pointer touch-none" 
        onTouchMove={(e) => e.preventDefault()}
        onClick={() => {
          if (!isSubmitting && !isGoogleLoading) {
            clearFields();
            onClose();
          }
        }} 
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onWheel={(e) => e.stopPropagation()}
        data-lenis-prevent="true"
        className="relative w-full max-w-md glass-card rounded-[24px] sm:rounded-[32px] overflow-hidden p-5 sm:p-8 border border-brand-purple/30 shadow-[0_24px_50px_rgba(75,46,93,0.15)] z-10 flex flex-col text-brand-dark my-auto max-h-[92vh] overflow-y-auto overscroll-contain custom-scrollbar"
        style={{ touchAction: 'pan-y' }}
      >
        {/* Close Button */}
        <button
          onClick={() => {
            clearFields();
            onClose();
          }}
          disabled={isSubmitting || isGoogleLoading}
          className="absolute top-4 sm:top-6 right-4 sm:right-6 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/60 hover:bg-white/90 flex items-center justify-center shadow-sm cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/20 disabled:opacity-50 z-20"
          aria-label="Close modal"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5 text-brand-plum" />
        </button>

        {/* VIEW: LOGIN */}
        {view === 'login' && (
          <div>
            <h2 className="font-serif text-2xl font-bold text-center text-brand-dark mb-1">
              Welcome to Craftoria
            </h2>
            <p className="text-xs text-brand-dark/70 text-center uppercase tracking-widest font-semibold mb-6">
              Login to continue
            </p>

            {generalError && (
              <div className="mb-5 p-3.5 rounded-2xl bg-red-100/60 border border-red-200 text-red-700 text-xs font-medium text-left">
                {generalError}
              </div>
            )}

            {/* Social Login option */}
            <div className="mb-4">
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={isGoogleLoading || isSubmitting}
                className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold text-xs tracking-wider shadow-sm transition-all duration-200 cursor-pointer h-11 disabled:opacity-50"
              >
                {isGoogleLoading ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 animate-spin text-brand-purple" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <GoogleLogoSvg />
                    <span>Continue with Google</span>
                  </>
                )}
              </button>
            </div>

            {/* Subtle divider */}
            <div className="flex items-center gap-3 my-4">
              <hr className="flex-grow border-brand-purple/15" />
              <span className="text-[9px] uppercase font-bold text-brand-dark/40 tracking-widest">Or</span>
              <hr className="flex-grow border-brand-purple/15" />
            </div>

            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
              {/* Email Input */}
              <div className="flex flex-col text-left">
                <label className="text-[10px] font-bold text-brand-plum/80 uppercase tracking-widest mb-1.5 ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-brand-plum/50">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting || isGoogleLoading}
                    placeholder="Enter your email"
                    className="w-full pl-11 pr-4 py-3 rounded-full text-xs glass-input transition-all duration-300 focus:bg-white h-11"
                  />
                </div>
                {errors.email && (
                  <span className="text-[10px] text-red-500 font-semibold mt-1 ml-1">{errors.email}</span>
                )}
              </div>

              {/* Password Input */}
              <div className="flex flex-col text-left">
                <div className="flex items-center justify-between mb-1.5 ml-1">
                  <label className="text-[10px] font-bold text-brand-plum/80 uppercase tracking-widest">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => handleViewChange('forgot')}
                    disabled={isSubmitting || isGoogleLoading}
                    className="text-xs font-semibold text-brand-violet hover:underline cursor-pointer focus:outline-none disabled:opacity-50"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-brand-plum/50">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting || isGoogleLoading}
                    placeholder="Enter password"
                    className="w-full pl-11 pr-12 py-3 rounded-full text-xs glass-input transition-all duration-300 focus:bg-white h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting || isGoogleLoading}
                    className="absolute inset-y-0 right-4 flex items-center text-brand-plum/50 hover:text-brand-plum cursor-pointer focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <span className="text-[10px] text-red-500 font-semibold mt-1 ml-1">{errors.password}</span>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isGoogleLoading}
                className="mt-2 w-full py-3.5 px-6 rounded-full bg-brand-plum hover:bg-brand-violet text-white font-semibold text-xs uppercase tracking-widest shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer h-11 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Logging in...</span>
                  </>
                ) : (
                  <span>Login</span>
                )}
              </button>
            </form>

            <div className="mt-8 pt-5 border-t border-brand-purple/20 text-center">
              <p className="text-xs text-brand-dark/70">
                New to Craftoria?{' '}
                <button
                  onClick={() => handleViewChange('signup')}
                  disabled={isSubmitting || isGoogleLoading}
                  className="font-bold text-brand-plum hover:underline cursor-pointer focus:outline-none disabled:opacity-50"
                >
                  Create Account
                </button>
              </p>
            </div>
          </div>
        )}

        {/* VIEW: SIGNUP */}
        {view === 'signup' && (
          <div>
            <h2 className="font-serif text-2xl font-bold text-center text-brand-dark mb-1">
              Create Account
            </h2>
            <p className="text-xs text-brand-dark/70 text-center uppercase tracking-widest font-semibold mb-6">
              Create your Craftoria account
            </p>

            {generalError && (
              <div className="mb-5 p-3.5 rounded-2xl bg-red-100/60 border border-red-200 text-red-700 text-xs font-medium text-left">
                {generalError}
              </div>
            )}

            {/* Social Signup option */}
            <div className="mb-4">
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={isGoogleLoading || isSubmitting}
                className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 font-semibold text-xs tracking-wider shadow-sm transition-all duration-200 cursor-pointer h-11 disabled:opacity-50"
              >
                {isGoogleLoading ? (
                  <>
                    <Loader2 className="w-4.5 h-4.5 animate-spin text-brand-purple" />
                    <span>Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <GoogleLogoSvg />
                    <span>Continue with Google</span>
                  </>
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-4">
              <hr className="flex-grow border-brand-purple/15" />
              <span className="text-[9px] uppercase font-bold text-brand-dark/40 tracking-widest">Or</span>
              <hr className="flex-grow border-brand-purple/15" />
            </div>

            <form onSubmit={handleSignupSubmit} className="flex flex-col gap-3.5">
              {/* Full Name */}
              <div className="flex flex-col text-left">
                <label className="text-[10px] font-bold text-brand-plum/80 uppercase tracking-widest mb-1 ml-1">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-brand-plum/50">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={isSubmitting || isGoogleLoading}
                    placeholder="Full name"
                    className="w-full pl-11 pr-4 py-2.5 rounded-full text-xs glass-input focus:bg-white h-11"
                  />
                </div>
                {errors.name && (
                  <span className="text-[10px] text-red-500 font-semibold mt-1 ml-1">{errors.name}</span>
                )}
              </div>

              {/* Email Address */}
              <div className="flex flex-col text-left">
                <label className="text-[10px] font-bold text-brand-plum/80 uppercase tracking-widest mb-1 ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-brand-plum/50">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting || isGoogleLoading}
                    placeholder="email@example.com"
                    className="w-full pl-11 pr-4 py-2.5 rounded-full text-xs glass-input focus:bg-white h-11"
                  />
                </div>
                {errors.email && (
                  <span className="text-[10px] text-red-500 font-semibold mt-1 ml-1">{errors.email}</span>
                )}
              </div>

              {/* Mobile Number */}
              <div className="flex flex-col text-left">
                <label className="text-[10px] font-bold text-brand-plum/80 uppercase tracking-widest mb-1 ml-1">
                  Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-brand-plum/50">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    disabled={isSubmitting || isGoogleLoading}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full pl-11 pr-4 py-2.5 rounded-full text-xs glass-input focus:bg-white h-11"
                  />
                </div>
                {errors.phone && (
                  <span className="text-[10px] text-red-500 font-semibold mt-1 ml-1">{errors.phone}</span>
                )}
              </div>

              {/* Password */}
              <div className="flex flex-col text-left">
                <label className="text-[10px] font-bold text-brand-plum/80 uppercase tracking-widest mb-1 ml-1">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-brand-plum/50">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isSubmitting || isGoogleLoading}
                    placeholder="Min. 6 characters"
                    className="w-full pl-11 pr-12 py-2.5 rounded-full text-xs glass-input focus:bg-white h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isSubmitting || isGoogleLoading}
                    className="absolute inset-y-0 right-4 flex items-center text-brand-plum/50 hover:text-brand-plum cursor-pointer focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                
                {/* Strength Meter */}
                {passwordStrength && (
                  <div className="flex items-center gap-2 mt-1.5 ml-1">
                    <span className="text-[9px] uppercase tracking-wider font-bold">Strength:</span>
                    <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${strengthColor}`}>
                      {passwordStrength}
                    </span>
                  </div>
                )}
                {errors.password && (
                  <span className="text-[10px] text-red-500 font-semibold mt-1 ml-1">{errors.password}</span>
                )}
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col text-left">
                <label className="text-[10px] font-bold text-brand-plum/80 uppercase tracking-widest mb-1 ml-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-brand-plum/50">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isSubmitting || isGoogleLoading}
                    placeholder="Verify your password"
                    className="w-full pl-11 pr-12 py-2.5 rounded-full text-xs glass-input focus:bg-white h-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={isSubmitting || isGoogleLoading}
                    className="absolute inset-y-0 right-4 flex items-center text-brand-plum/50 hover:text-brand-plum cursor-pointer focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <span className="text-[10px] text-red-500 font-semibold mt-1 ml-1">{errors.confirmPassword}</span>
                )}
              </div>

              {/* Agree Checkbox */}
              <div className="flex items-start gap-2.5 mt-2 ml-1 text-left">
                <input
                  type="checkbox"
                  id="agreeTerms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  disabled={isSubmitting || isGoogleLoading}
                  className="mt-1 w-4 h-4 rounded text-brand-plum focus:ring-brand-purple border-brand-purple/20 cursor-pointer"
                />
                <label htmlFor="agreeTerms" className="text-[10px] sm:text-xs text-brand-dark/80 cursor-pointer select-none">
                  I agree to the <span className="font-bold text-brand-plum underline">Terms & Conditions</span> and <span className="font-bold text-brand-plum underline">Privacy Policy</span>
                </label>
              </div>
              {errors.agreeTerms && (
                <span className="text-[10px] text-red-500 font-semibold ml-1">{errors.agreeTerms}</span>
              )}

              {/* Create Account Button */}
              <button
                type="submit"
                disabled={isSubmitting || isGoogleLoading}
                className="mt-3 w-full py-3.5 px-6 rounded-full bg-brand-plum hover:bg-brand-violet text-white font-semibold text-xs uppercase tracking-widest shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer h-11 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <span>Create Account</span>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-brand-purple/20 text-center">
              <p className="text-xs text-brand-dark/70">
                Already have an account?{' '}
                <button
                  onClick={() => handleViewChange('login')}
                  disabled={isSubmitting || isGoogleLoading}
                  className="font-bold text-brand-plum hover:underline cursor-pointer focus:outline-none disabled:opacity-50"
                >
                  Login
                </button>
              </p>
            </div>
          </div>
        )}

        {/* VIEW: FORGOT */}
        {view === 'forgot' && (
          <div>
            <button
              onClick={() => handleViewChange('login')}
              disabled={isSubmitting || isGoogleLoading}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-plum/80 hover:text-brand-purple mb-6 focus:outline-none disabled:opacity-50"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
            </button>

            <h2 className="font-serif text-2xl font-bold text-center text-brand-dark mb-1">
              Reset Password
            </h2>
            <p className="text-xs text-brand-dark/70 text-center mb-6">
              Enter your email address to receive a reset link.
            </p>

            {generalError && (
              <div className="mb-5 p-3.5 rounded-2xl bg-red-100/60 border border-red-200 text-red-700 text-xs font-medium text-left">
                {generalError}
              </div>
            )}
            {successMessage && (
              <div className="mb-5 p-3.5 rounded-2xl bg-green-100/60 border border-green-200 text-green-700 text-xs font-medium text-left flex items-center gap-2">
                <CheckCircle2 className="w-4.5 h-4.5 text-green-600 flex-shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col text-left">
                <label className="text-[10px] font-bold text-brand-plum/80 uppercase tracking-widest mb-1.5 ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-4 flex items-center text-brand-plum/50">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={resetField}
                    onChange={(e) => setResetField(e.target.value)}
                    disabled={isSubmitting || isGoogleLoading}
                    placeholder="Enter email address"
                    className="w-full pl-11 pr-4 py-3 rounded-full text-xs glass-input focus:bg-white h-11"
                  />
                </div>
                {errors.resetField && (
                  <span className="text-[10px] text-red-500 font-semibold mt-1 ml-1">{errors.resetField}</span>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isGoogleLoading}
                className="mt-4 w-full py-3.5 px-6 rounded-full bg-brand-plum hover:bg-brand-violet text-white font-semibold text-xs uppercase tracking-widest shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer h-11 flex items-center justify-center"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Sending reset...</span>
                  </>
                ) : (
                  <span>Send Reset Link</span>
                )}
              </button>
            </form>
          </div>
        )}

        {/* VIEW: ADDRESS ONBOARDING (Optional / Skip allowed) */}
        {view === 'address_onboarding' && (
          <div className="text-left">
            <div className="text-center mb-4">
              <div className="w-11 h-11 rounded-full bg-brand-purple/15 text-brand-plum flex items-center justify-center mx-auto mb-2 text-base">
                🌸
              </div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-brand-dark">
                Welcome to Craftoria!
              </h2>
              <p className="text-xs text-brand-dark/70 mt-1 max-w-xs mx-auto">
                Add your delivery address for 1-click orders, or skip to start exploring now.
              </p>
            </div>

            {addressSavedSuccess && (
              <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 flex-shrink-0" />
                <span>Address saved successfully! Welcome to Craftoria ✨</span>
              </div>
            )}

            <form onSubmit={handleSaveAddressOnboarding} className="space-y-3">
              {/* Address Type Selector */}
              <div className="flex items-center justify-between pb-2 border-b border-brand-purple/10">
                <span className="text-[10px] font-bold uppercase tracking-widest text-brand-plum font-mono">Address Type</span>
                <div className="flex gap-1.5">
                  {['Home', 'Work', 'Other'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setAddressType(t)}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all cursor-pointer ${
                        addressType === t
                          ? 'bg-brand-plum text-white shadow-xs'
                          : 'bg-brand-purple/10 text-brand-plum hover:bg-brand-purple/20'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Recipient Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-dark/80 block">Recipient Name</label>
                  <input
                    type="text"
                    value={addressRecipientName}
                    onChange={(e) => setAddressRecipientName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-purple/20 bg-white focus:outline-none focus:border-brand-purple font-medium"
                  />
                  {addressErrors.name && <span className="text-[10px] text-red-500 font-semibold">{addressErrors.name}</span>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-dark/80 block">Mobile Number</label>
                  <input
                    type="tel"
                    value={addressPhone}
                    onChange={(e) => setAddressPhone(e.target.value)}
                    placeholder="10-digit number"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-purple/20 bg-white focus:outline-none focus:border-brand-purple font-medium"
                  />
                  {addressErrors.phone && <span className="text-[10px] text-red-500 font-semibold">{addressErrors.phone}</span>}
                </div>
              </div>

              {/* Building Details */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-dark/80 block">Flat / House No. / Building / Society</label>
                <input
                  type="text"
                  value={addressBuilding}
                  onChange={(e) => setAddressBuilding(e.target.value)}
                  placeholder="e.g. Flat 302, Lavender Residency"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-purple/20 bg-white focus:outline-none focus:border-brand-purple font-medium"
                />
                {addressErrors.building && <span className="text-[10px] text-red-500 font-semibold">{addressErrors.building}</span>}
              </div>

              {/* Street / Area / Landmark */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-dark/80 block">Street / Colony / Area / Landmark</label>
                <input
                  type="text"
                  value={addressStreet}
                  onChange={(e) => setAddressStreet(e.target.value)}
                  placeholder="e.g. Main Road, Near Central Park"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-brand-purple/20 bg-white focus:outline-none focus:border-brand-purple font-medium"
                />
                {addressErrors.street && <span className="text-[10px] text-red-500 font-semibold">{addressErrors.street}</span>}
              </div>

              {/* City, State & PIN Code */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-dark/80 block">City</label>
                  <input
                    type="text"
                    value={addressCity}
                    onChange={(e) => setAddressCity(e.target.value)}
                    placeholder="City"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-brand-purple/20 bg-white focus:outline-none focus:border-brand-purple font-medium"
                  />
                  {addressErrors.city && <span className="text-[10px] text-red-500 font-semibold">{addressErrors.city}</span>}
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-dark/80 block">State</label>
                  <input
                    type="text"
                    value={addressState}
                    onChange={(e) => setAddressState(e.target.value)}
                    placeholder="State"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-brand-purple/20 bg-white focus:outline-none focus:border-brand-purple font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-dark/80 block">PIN Code</label>
                  <input
                    type="text"
                    value={addressPinCode}
                    onChange={(e) => setAddressPinCode(e.target.value)}
                    placeholder="6 digits"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-brand-purple/20 bg-white focus:outline-none focus:border-brand-purple font-medium"
                  />
                  {addressErrors.pinCode && <span className="text-[10px] text-red-500 font-semibold">{addressErrors.pinCode}</span>}
                </div>
              </div>

              {/* Action Buttons: Save Address + Skip Button */}
              <div className="flex flex-col gap-2 pt-3">
                <button
                  type="submit"
                  disabled={addressSavedSuccess}
                  className="w-full py-3 px-6 rounded-full bg-brand-plum hover:bg-brand-violet text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Delivery Address</span>
                </button>

                <button
                  type="button"
                  onClick={handleSkipAddressOnboarding}
                  className="w-full py-2.5 px-4 text-xs font-bold text-brand-dark/65 hover:text-brand-plum transition-colors cursor-pointer text-center"
                >
                  Skip for Now & Start Exploring &rarr;
                </button>
              </div>
            </form>
          </div>
        )}
      </motion.div>
    </div>,
    document.body
  );
};

export default AuthModal;
