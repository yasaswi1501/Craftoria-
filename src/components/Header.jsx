import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sparkles, Heart, ShoppingBag, User, Phone, Mail, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import AuthModal from './AuthModal';
import AccountMenu from './AccountMenu';
import CartDrawer from './CartDrawer';
import { useRouter } from '../context/RouterContext';

const Header = () => {
  const { isLoggedIn, user, isAuthModalOpen, setIsAuthModalOpen } = useAuth();
  const { cart, setIsCartOpen } = useCart();
  const { wishlist } = useWishlist();
  const { navigate } = useRouter();
  
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('#home');

  // Combined, rAF-throttled passive scroll listener
  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          
          // 1. Scrolled state check
          const isScrolled = scrollY > 20;
          setScrolled(prev => (prev !== isScrolled ? isScrolled : prev));

          // 2. Active section tracking on homepage
          const currentPath = window.location.pathname;
          if (currentPath !== '/') {
            const targetSection = currentPath.startsWith('/collections') ? '#bestsellers' : '';
            setActiveSection(prev => (prev !== targetSection ? targetSection : prev));
          } else {
            const sections = ['home', 'about', 'bestsellers', 'gallery', 'contact'];
            const scrollPosition = scrollY + 200;

            for (const section of sections) {
              const el = document.getElementById(section);
              if (el) {
                const top = el.offsetTop;
                const height = el.offsetHeight;
                if (scrollPosition >= top && scrollPosition < top + height) {
                  const newSection = `#${section}`;
                  setActiveSection(prev => (prev !== newSection ? newSection : prev));
                  break;
                }
              }
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener('scroll', onScroll);
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
    
    // If not on home page, route to home first then scroll to anchor hash
    if (window.location.pathname !== '/') {
      navigate('/' + href);
    } else {
      // Direct smooth scroll for homepage sections
      window.history.pushState({ scrollY: window.scrollY }, '', '/' + href);
      const targetId = href.replace('#', '');
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
      setActiveSection(href);
    }
  };

  const handleAccountClick = () => {
    setIsNavOpen(false);
    if (isLoggedIn) {
      setIsAccountOpen(true);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const handleWishlistClick = (e) => {
    e.preventDefault();
    setIsNavOpen(false);
    navigate('/wishlist');
  };

  const handleCartClick = () => {
    setIsNavOpen(false);
    setIsCartOpen(true);
  };

  const cartItemsCount = cart.reduce((total, item) => total + item.quantity, 0);
  const wishlistItemsCount = wishlist.length;

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
            {/* Account Option */}
            <button
              onClick={handleAccountClick}
              className="inline-flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2.5 rounded-full hover:bg-brand-purple/10 text-brand-dark/95 text-xs font-semibold cursor-pointer transition-colors duration-200 h-11"
              aria-label={isLoggedIn ? "My Account" : "Login / Signup"}
            >
              <User className="w-4.5 h-4.5 text-brand-plum" />
              <span className="hidden sm:inline">
                {isLoggedIn ? 'Account' : 'Login / Sign Up'}
              </span>
            </button>

            {/* Wishlist Button */}
            <button
              onClick={handleWishlistClick}
              className="inline-flex items-center justify-center w-11 h-11 rounded-full hover:bg-brand-purple/10 text-brand-dark transition-colors duration-200 relative cursor-pointer"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5 text-brand-plum" />
              {wishlistItemsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[8px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">
                  {wishlistItemsCount}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={handleCartClick}
              className="inline-flex items-center justify-center w-11 h-11 rounded-full hover:bg-brand-purple/10 text-brand-dark transition-colors duration-200 relative cursor-pointer"
              aria-label="Shopping bag"
            >
              <ShoppingBag className="w-5 h-5 text-brand-plum" />
              {cartItemsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-brand-plum text-white text-[8px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">
                  {cartItemsCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* Mobile Drawer (Slide in from Left) */}
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
              className="relative w-80 max-w-[85vw] h-full bg-[#FCF8FC] border-r border-brand-purple/20 shadow-[0_0_40px_rgba(75,46,93,0.15)] flex flex-col z-10 text-brand-dark p-6 overflow-y-auto"
            >
              {/* Drawer Top Row */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-brand-purple/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brand-purple/15 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-brand-plum" />
                  </div>
                  <span className="font-serif text-lg font-bold text-brand-dark">Craftoria</span>
                </div>
                
                <button
                  onClick={() => setIsNavOpen(false)}
                  className="w-10 h-10 rounded-full bg-brand-lavender/40 hover:bg-brand-lavender flex items-center justify-center cursor-pointer transition-all focus:outline-none"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5 text-brand-plum" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col gap-1 text-left mb-6">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className={`text-sm font-bold uppercase tracking-wider transition-colors duration-200 py-3 px-3 rounded-xl flex items-center justify-between ${
                      activeSection === link.href ? 'text-brand-plum bg-brand-purple/15' : 'text-brand-dark hover:bg-brand-purple/5'
                    }`}
                  >
                    <span>{link.name}</span>
                    <ChevronRight className="w-4 h-4 opacity-40" />
                  </a>
                ))}
              </nav>

              {/* Account & Shop Shortcut Actions */}
              <div className="flex flex-col gap-2 pt-4 border-t border-brand-purple/10 mb-6 text-left">
                <button
                  onClick={handleAccountClick}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/60 border border-brand-purple/15 text-xs font-bold text-brand-dark hover:bg-brand-purple/10 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-brand-plum" />
                    <span>{isLoggedIn ? (user?.email || 'My Account') : 'Login / Sign Up'}</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-40" />
                </button>

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
              </div>
              
              {/* Clickable Direct Support Links in Mobile Drawer */}
              <div className="mt-auto pt-4 border-t border-brand-purple/10 text-left space-y-2">
                <span className="text-[9px] uppercase font-bold text-brand-plum/80 tracking-widest block">Customer Support</span>
                <a
                  href="tel:+919908860895"
                  className="flex items-center gap-2 text-xs font-semibold text-brand-dark hover:text-brand-plum transition-colors py-1"
                >
                  <Phone className="w-3.5 h-3.5 text-brand-plum" />
                  <span>+91 99088 60895</span>
                </a>
                <a
                  href="mailto:contact@craftoria.com"
                  className="flex items-center gap-2 text-xs font-semibold text-brand-dark hover:text-brand-plum transition-colors py-1"
                >
                  <Mail className="w-3.5 h-3.5 text-brand-plum" />
                  <span>contact@craftoria.com</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Overlays */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
      <AccountMenu isOpen={isAccountOpen} onClose={() => setIsAccountOpen(false)} />
      <CartDrawer />
    </>
  );
};

export default Header;
