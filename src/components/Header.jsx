import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Sparkles, Heart, ShoppingBag, User } from 'lucide-react';
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
  const { navigate } = useRouter();
  
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('#home');

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Track active page sections based on scroll offset or current pathname
  useEffect(() => {
    const handleSectionTracking = () => {
      const currentPath = window.location.pathname;
      if (currentPath !== '/') {
        if (currentPath.startsWith('/collections')) {
          setActiveSection('#bestsellers');
        } else {
          setActiveSection('');
        }
        return;
      }

      const sections = ['home', 'about', 'bestsellers', 'gallery', 'contact'];
      const scrollPosition = window.scrollY + 200; // offset threshold

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(`#${section}`);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleSectionTracking);
    handleSectionTracking(); // Check initial state

    return () => window.removeEventListener('scroll', handleSectionTracking);
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
    if (isLoggedIn) {
      setIsAccountOpen(true);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  const { wishlist } = useWishlist();
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
            <a
              href="/wishlist"
              className="inline-flex items-center justify-center w-11 h-11 rounded-full hover:bg-brand-purple/10 text-brand-dark transition-colors duration-200 relative cursor-pointer"
              aria-label="Wishlist"
            >
              <Heart className="w-5 h-5 text-brand-plum" />
              {wishlistItemsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[8px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">
                  {wishlistItemsCount}
                </span>
              )}
            </a>

            {/* Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
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
              className="relative w-72 max-w-xs h-full bg-[#FCF8FC] border-r border-brand-purple/20 shadow-[0_0_40px_rgba(75,46,93,0.15)] flex flex-col z-10 text-brand-dark p-6"
            >
              {/* Close Drawer Button */}
              <div className="flex justify-end mb-8">
                <button
                  onClick={() => setIsNavOpen(false)}
                  className="w-11 h-11 rounded-full bg-brand-lavender/35 hover:bg-brand-lavender flex items-center justify-center cursor-pointer transition-all focus:outline-none"
                  aria-label="Close navigation menu"
                >
                  <X className="w-5 h-5 text-brand-plum" />
                </button>
              </div>

              {/* Navigation Links */}
              <nav className="flex flex-col gap-5 text-left">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className={`text-sm font-bold uppercase tracking-widest transition-colors duration-200 py-2.5 border-b border-brand-purple/5 ${
                      activeSection === link.href ? 'text-brand-plum font-bold' : 'text-brand-dark hover:text-brand-violet'
                    }`}
                  >
                    {link.name}
                  </a>
                ))}
              </nav>
              
              {/* Tagline footer in mobile drawer */}
              <div className="mt-auto text-left pt-6 border-t border-brand-purple/10">
                <span className="font-serif text-sm font-bold text-brand-plum">Craftoria</span>
                <span className="text-[9px] uppercase font-semibold text-brand-dark/50 block mt-1 tracking-wider">Handmade With Love</span>
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
