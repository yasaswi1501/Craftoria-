import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, X, Sparkles, Heart, ShoppingBag, User, Phone, Mail, ChevronRight, 
  ChevronDown, MapPin, LogOut, Package, Edit2 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import AuthModal from './AuthModal';
import AccountMenu from './AccountMenu';
import CartDrawer from './CartDrawer';
import { useRouter } from '../context/RouterContext';

const Header = () => {
  const { isLoggedIn, user, logout, isAuthModalOpen, setIsAuthModalOpen } = useAuth();
  const { cart, setIsCartOpen } = useCart();
  const { wishlist } = useWishlist();
  const { navigate } = useRouter();
  
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [accountInitialTab, setAccountInitialTab] = useState('menu');
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('#home');

  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsAccountDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // High-performance scroll listener with IntersectionObserver for sections (zero layout thrashing)
  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const isScrolled = window.scrollY > 20;
          setScrolled(prev => (prev !== isScrolled ? isScrolled : prev));
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    let observer;
    if (window.location.pathname === '/') {
      const sectionIds = ['home', 'about', 'bestsellers', 'gallery', 'contact'];
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setActiveSection(`#${entry.target.id}`);
            }
          });
        },
        { threshold: 0.25, rootMargin: '-60px 0px -40% 0px' }
      );

      sectionIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.observe(el);
      });
    } else {
      const currentPath = window.location.pathname;
      const targetSection = currentPath.startsWith('/collections') ? '#bestsellers' : '';
      setActiveSection(targetSection);
    }

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (observer) observer.disconnect();
    };
  }, [window.location.pathname]);

  // Prevent scroll when mobile nav is open
  useEffect(() => {
    if (isNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isNavOpen]);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Collections', href: '#bestsellers' },
    { name: 'Gallery', href: '#gallery' },
    { name: 'Contact', href: '#contact' },
  ];

  const handleLinkClick = (e, href) => {
    e.preventDefault();
    setIsNavOpen(false);
    
    if (window.location.pathname !== '/') {
      navigate('/' + href);
    } else {
      window.history.pushState({ scrollY: window.scrollY }, '', '/' + href);
      const targetId = href.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      setActiveSection(href);
    }
  };

  const openAccountSection = (tab = 'menu') => {
    setIsAccountDropdownOpen(false);
    setIsNavOpen(false);
    if (!isLoggedIn) {
      setIsAuthModalOpen(true);
      return;
    }
    setAccountInitialTab(tab);
    setIsAccountOpen(true);
  };

  const handleWishlistClick = (e) => {
    e.preventDefault();
    setIsNavOpen(false);
    setIsAccountDropdownOpen(false);
    navigate('/wishlist');
  };

  const handleCartClick = () => {
    setIsNavOpen(false);
    setIsAccountDropdownOpen(false);
    setIsCartOpen(true);
  };

  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);
  const wishlistItemsCount = wishlist.length;

  const firstName = user?.name ? user.name.split(' ')[0] : 'Account';

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled ? 'glass-nav py-3.5' : 'bg-transparent py-6'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
          
          {/* Mobile Left Hamburger Menu Toggle */}
          <div className="flex lg:hidden">
            <button
              onClick={() => setIsNavOpen(true)}
              className="w-11 h-11 rounded-full hover:bg-brand-lavender/35 text-brand-dark flex items-center justify-center cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-purple/20"
              aria-label="Open navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {/* Brand Logo & Tagline */}
          <a
            href="#home"
            onClick={(e) => handleLinkClick(e, '#home')}
            className="flex items-center gap-2 group mx-auto lg:mx-0"
          >
            <div className="w-9 h-9 rounded-full bg-brand-purple/15 flex items-center justify-center group-hover:bg-brand-purple/25 transition-colors duration-300">
              <Sparkles className="w-5 h-5 text-brand-plum" />
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="font-serif text-2xl font-bold tracking-wide text-brand-dark leading-tight">
                Craftoria
              </span>
              <span className="text-[8px] font-semibold tracking-widest text-brand-plum/80 uppercase -mt-0.5">
                Handmade With Love
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className={`text-xs font-semibold uppercase tracking-wider transition-colors duration-200 relative group py-1 ${
                  activeSection === link.href ? 'text-brand-plum font-bold' : 'text-brand-dark hover:text-brand-violet'
                }`}
              >
                {link.name}
                <span className={`absolute bottom-0 left-0 h-0.5 bg-brand-purple transition-all duration-300 ${
                  activeSection === link.href ? 'w-full' : 'w-0 group-hover:w-full'
                }`} />
              </a>
            ))}
          </nav>

          {/* Action Controls (Desktop/Tablet) */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            
            {/* E-Commerce Style Account Menu Dropdown (Flipkart / Amazon pattern) */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsAccountDropdownOpen((prev) => !prev)}
                className={`inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 rounded-full text-xs font-semibold cursor-pointer transition-all duration-200 h-10 border ${
                  isAccountDropdownOpen
                    ? 'bg-brand-purple/15 border-brand-purple/30 text-brand-plum shadow-xs'
                    : 'bg-white/50 border-brand-purple/15 hover:bg-brand-purple/10 text-brand-dark'
                }`}
                aria-label={isLoggedIn ? `Account menu for ${user?.name}` : 'Login or Sign up'}
                aria-expanded={isAccountDropdownOpen}
              >
                <div className="w-6 h-6 rounded-full bg-brand-plum/10 text-brand-plum flex items-center justify-center text-[10px] font-bold">
                  {isLoggedIn && user?.picture ? (
                    <img src={user.picture} alt={user.name} className="w-full h-full rounded-full object-cover" />
                  ) : isLoggedIn && user?.name ? (
                    user.name[0].toUpperCase()
                  ) : (
                    <User className="w-3.5 h-3.5 text-brand-plum" />
                  )}
                </div>
                <span className="hidden sm:inline font-medium">
                  {isLoggedIn ? `Hi, ${firstName}` : 'Login / Sign In'}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isAccountDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Floating Dropdown Menu Card */}
              <AnimatePresence>
                {isAccountDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.96, transition: { duration: 0.15 } }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute right-0 top-full mt-2 w-72 rounded-[22px] bg-white/95 backdrop-blur-md border border-brand-purple/20 shadow-[0_16px_40px_rgba(75,46,93,0.18)] z-50 p-3 text-left overflow-hidden"
                  >
                    {/* Header: User Profile or Sign-in Prompt */}
                    {isLoggedIn ? (
                      <div className="p-3 bg-brand-purple/10 rounded-2xl mb-2 flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full bg-brand-plum text-white font-bold flex items-center justify-center text-sm flex-shrink-0 overflow-hidden">
                            {user?.picture ? (
                              <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                            ) : (
                              user?.name ? user.name[0].toUpperCase() : '👤'
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-brand-dark truncate">{user?.name || 'Customer'}</span>
                            <span className="text-[10px] text-brand-dark/60 truncate">{user?.email}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => openAccountSection('profile')}
                          className="p-1.5 rounded-full hover:bg-white/80 text-brand-plum cursor-pointer transition-colors flex-shrink-0"
                          title="Edit Profile"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="p-3.5 bg-brand-purple/10 rounded-2xl mb-2 text-center">
                        <span className="font-serif text-xs font-bold text-brand-dark block mb-1">
                          Welcome to Craftoria
                        </span>
                        <p className="text-[10px] text-brand-dark/65 mb-2.5">
                          Sign in to manage custom orders, wishlist & addresses
                        </p>
                        <button
                          onClick={() => {
                            setIsAccountDropdownOpen(false);
                            setIsAuthModalOpen(true);
                          }}
                          className="w-full py-2 px-4 rounded-full bg-brand-plum hover:bg-brand-violet text-white text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
                        >
                          Login / Sign Up
                        </button>
                      </div>
                    )}

                    {/* Quick E-Commerce Menu Options */}
                    <div className="flex flex-col gap-0.5 text-xs font-semibold text-brand-dark">
                      <button
                        onClick={() => openAccountSection('profile')}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-brand-purple/10 transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <User className="w-4 h-4 text-brand-plum" />
                          <span>My Profile</span>
                        </div>
                        <span className="text-[10px] text-brand-plum/80 font-mono font-bold">Edit</span>
                      </button>

                      <button
                        onClick={() => openAccountSection('orders')}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-brand-purple/10 transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <Package className="w-4 h-4 text-brand-plum" />
                          <span>My Orders</span>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-brand-dark/40" />
                      </button>

                      <button
                        onClick={handleWishlistClick}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-brand-purple/10 transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <Heart className="w-4 h-4 text-brand-plum" />
                          <span>My Wishlist</span>
                        </div>
                        {wishlistItemsCount > 0 && (
                          <span className="bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                            {wishlistItemsCount}
                          </span>
                        )}
                      </button>

                      <button
                        onClick={() => openAccountSection('addresses')}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-brand-purple/10 transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-2.5">
                          <MapPin className="w-4 h-4 text-brand-plum" />
                          <span>Saved Addresses</span>
                        </div>
                        <span className="text-[10px] text-brand-plum/80 font-mono font-bold">Edit</span>
                      </button>
                    </div>

                    {/* Logout Option (if logged in) */}
                    {isLoggedIn && (
                      <div className="pt-1 mt-1 border-t border-brand-purple/10">
                        <button
                          onClick={() => {
                            setIsAccountDropdownOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 transition-colors cursor-pointer text-xs font-bold text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Wishlist Button */}
            <button
              onClick={handleWishlistClick}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/50 border border-brand-purple/15 hover:bg-brand-purple/10 text-brand-dark transition-colors duration-200 relative cursor-pointer"
              aria-label="Wishlist"
            >
              <Heart className="w-4.5 h-4.5 text-brand-plum" />
              {wishlistItemsCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {wishlistItemsCount}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={handleCartClick}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/50 border border-brand-purple/15 hover:bg-brand-purple/10 text-brand-dark transition-colors duration-200 relative cursor-pointer"
              aria-label="Shopping bag"
            >
              <ShoppingBag className="w-4.5 h-4.5 text-brand-plum" />
              {cartItemsCount > 0 && (
                <span className="absolute top-1 right-1 bg-brand-plum text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Drawer (Slide in from Left - Flipkart/Amazon style with Top Account Card) */}
      <AnimatePresence>
        {isNavOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNavOpen(false)}
              className="absolute inset-0 bg-brand-plum/45 backdrop-blur-xs cursor-pointer"
            />

            {/* Nav Menu Content */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-80 max-w-[85vw] h-full bg-[#FCF8FC] border-r border-brand-purple/20 shadow-[0_0_40px_rgba(75,46,93,0.15)] flex flex-col z-10 text-brand-dark p-5 overflow-y-auto"
            >
              {/* Drawer Top Row: Flipkart/Amazon Brand & Close */}
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-brand-purple/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brand-purple/15 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-brand-plum" />
                  </div>
                  <span className="font-serif text-lg font-bold text-brand-dark">Craftoria</span>
                </div>
                
                <button
                  onClick={() => setIsNavOpen(false)}
                  className="w-9 h-9 rounded-full bg-brand-lavender/40 hover:bg-brand-lavender flex items-center justify-center cursor-pointer transition-all focus:outline-none"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5 text-brand-plum" />
                </button>
              </div>

              {/* Flipkart/Amazon Style Account Banner In Mobile Menu */}
              <div className="mb-5 p-4 rounded-2xl bg-gradient-to-br from-white via-white/80 to-brand-purple/10 border border-brand-purple/20 shadow-xs text-left">
                {isLoggedIn ? (
                  <div>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full bg-brand-plum text-white font-bold flex items-center justify-center text-base flex-shrink-0 overflow-hidden shadow-xs">
                          {user?.picture ? (
                            <img src={user.picture} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            user?.name ? user.name[0].toUpperCase() : '👤'
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[10px] text-brand-dark/60 font-semibold uppercase tracking-wider font-mono">Hello,</span>
                          <h4 className="font-serif text-sm font-bold text-brand-dark leading-tight truncate">{user?.name || 'Customer'}</h4>
                        </div>
                      </div>
                      <button
                        onClick={() => openAccountSection('profile')}
                        className="p-2 rounded-full hover:bg-brand-purple/10 text-brand-plum cursor-pointer"
                        title="Edit Profile"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quick Account Links Inside Menu */}
                    <div className="grid grid-cols-2 gap-2 pt-2.5 border-t border-brand-purple/10 text-[11px] font-bold">
                      <button
                        onClick={() => openAccountSection('orders')}
                        className="py-1.5 px-2.5 rounded-xl bg-brand-purple/10 hover:bg-brand-purple/20 text-brand-plum flex items-center gap-1.5 cursor-pointer"
                      >
                        <Package className="w-3.5 h-3.5" /> Orders
                      </button>
                      <button
                        onClick={() => openAccountSection('addresses')}
                        className="py-1.5 px-2.5 rounded-xl bg-brand-purple/10 hover:bg-brand-purple/20 text-brand-plum flex items-center gap-1.5 cursor-pointer"
                      >
                        <MapPin className="w-3.5 h-3.5" /> Addresses
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-full bg-brand-plum/15 flex items-center justify-center text-brand-plum">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-serif text-xs font-bold text-brand-dark">Hello, Sign In</span>
                        <span className="text-[10px] text-brand-dark/60">Orders & Wishlist</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIsNavOpen(false);
                        setIsAuthModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-full bg-brand-plum text-white text-[11px] font-bold hover:bg-brand-violet cursor-pointer transition-colors shadow-xs"
                    >
                      Login
                    </button>
                  </div>
                )}
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col gap-1 text-left mb-6">
                <span className="text-[9px] uppercase font-bold text-brand-plum/80 tracking-widest block px-2 mb-1">
                  Explore Craftoria
                </span>
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className={`text-xs font-bold uppercase tracking-wider transition-colors duration-200 py-2.5 px-3 rounded-xl flex items-center justify-between ${
                      activeSection === link.href ? 'text-brand-plum bg-brand-purple/15' : 'text-brand-dark hover:bg-brand-purple/5'
                    }`}
                  >
                    <span>{link.name}</span>
                    <ChevronRight className="w-3.5 h-3.5 opacity-40" />
                  </a>
                ))}
              </nav>

              {/* Wishlist & Shopping Bag Shortcuts */}
              <div className="flex flex-col gap-2 pt-3 border-t border-brand-purple/10 mb-6 text-left">
                <button
                  onClick={handleWishlistClick}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/60 border border-brand-purple/15 text-xs font-bold text-brand-dark hover:bg-brand-purple/10 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Heart className="w-4 h-4 text-brand-plum" />
                    <span>My Wishlist</span>
                  </div>
                  {wishlistItemsCount > 0 && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {wishlistItemsCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={handleCartClick}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/60 border border-brand-purple/15 text-xs font-bold text-brand-dark hover:bg-brand-purple/10 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className="w-4 h-4 text-brand-plum" />
                    <span>Shopping Bag</span>
                  </div>
                  {cartItemsCount > 0 && (
                    <span className="bg-brand-plum text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {cartItemsCount}
                    </span>
                  )}
                </button>

                {isLoggedIn && (
                  <button
                    onClick={() => {
                      setIsNavOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-2.5 p-3 rounded-xl text-red-600 hover:bg-red-50 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
              
              {/* Direct Support Links in Mobile Drawer */}
              <div className="mt-auto pt-3 border-t border-brand-purple/10 text-left space-y-1.5">
                <span className="text-[9px] uppercase font-bold text-brand-plum/80 tracking-widest block">Customer Support</span>
                <a
                  href="tel:+919908860895"
                  className="flex items-center gap-2 text-xs font-semibold text-brand-dark hover:text-brand-plum transition-colors py-0.5"
                >
                  <Phone className="w-3.5 h-3.5 text-brand-plum" />
                  <span>+91 99088 60895</span>
                </a>
                <a
                  href="mailto:thecraftoriaaa26@gmail.com"
                  className="flex items-center gap-2 text-xs font-semibold text-brand-dark hover:text-brand-plum transition-colors py-0.5"
                >
                  <Mail className="w-3.5 h-3.5 text-brand-plum" />
                  <span>thecraftoriaaa26@gmail.com</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Overlays */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <AccountMenu 
        isOpen={isAccountOpen} 
        onClose={() => setIsAccountOpen(false)} 
        initialTab={accountInitialTab}
      />
      <CartDrawer />
    </>
  );
};

export default Header;
