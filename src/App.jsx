import { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';

import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import BestSellers from './components/BestSellers';
import WhyChoose from './components/WhyChoose';
import Gallery from './components/Gallery';
import Testimonials from './components/Testimonials';
import Contact from './components/Contact';
import Footer from './components/Footer';
import PremiumBackground from './components/PremiumBackground';
import ResetPassword from './components/ResetPassword';
import Checkout from './components/Checkout';
import Wishlist from './components/Wishlist';
import CollectionPage from './components/CollectionPage';
import ProductPage from './components/ProductPage';
import NotFound from './components/NotFound';
import { useRouter } from './context/RouterContext';
import { useAuth } from './context/AuthContext';
import { collectionsData, productsData } from './data/products';

const PROTECTED_PATHS = ['/checkout', '/wishlist'];

function App() {
  const { currentPath, navigate } = useRouter();
  const { isLoggedIn, requireAuth, consumePostLoginRedirect } = useAuth();

  // Parse pathname to strip any query params or hash anchors
  const pathname = currentPath.split('#')[0].split('?')[0];
  const isProtectedPath = PROTECTED_PATHS.includes(pathname);
  const blockedByAuth = isProtectedPath && !isLoggedIn;

  const isResetPage = pathname === '/reset-password';
  const isCheckoutPage = pathname === '/checkout' && !blockedByAuth;
  const isWishlistPage = pathname === '/wishlist' && !blockedByAuth;
  
  // Route matching with database existence validation
  const isCollectionsPage = pathname.startsWith('/collections/');
  const rawCollectionId = isCollectionsPage ? pathname.split('/')[2] : null;
  const validCollection = isCollectionsPage ? collectionsData.find(c => c.id === rawCollectionId) : null;
  const isInvalidCollection = isCollectionsPage && !validCollection;

  const isProductPage = pathname.startsWith('/product/');
  const rawProductSlug = isProductPage ? pathname.split('/')[2] : null;
  const validProduct = isProductPage ? productsData.find(p => p.slug === rawProductSlug) : null;
  const isInvalidProduct = isProductPage && !validProduct;

  const isHomePage = pathname === '/' || pathname === '';
  const isNotFound = isInvalidCollection || isInvalidProduct || (!isHomePage && !isResetPage && !isCheckoutPage && !isWishlistPage && !isCollectionsPage && !isProductPage);

  // Dynamic document title and meta description updates
  useEffect(() => {
    let title = 'Craftoria | Luxury Handmade Craft Boutique & Artisan Decor';
    let description = 'Discover unique handcrafted creations designed with love, detail, and timeless beauty. Explore artisanal bouquets, embroidered hoops, resin art, and personalized gifts.';

    if (isNotFound) {
      title = '404 - Page Not Found | Craftoria';
      description = 'The page you are looking for does not exist. Explore Craftoria handmade boutique collections.';
    } else if (validProduct) {
      title = `${validProduct.title} | Craftoria Handmade Boutique`;
      description = validProduct.description || description;
    } else if (validCollection) {
      title = `${validCollection.name} Collection | Craftoria`;
      description = validCollection.desc || description;
    } else if (isWishlistPage) {
      title = 'My Wishlist | Craftoria';
      description = 'View and manage your saved handcrafted favorites on Craftoria.';
    } else if (isCheckoutPage) {
      title = 'Secure Checkout | Craftoria';
      description = 'Complete your order with secure checkout and doorstep delivery.';
    } else if (isResetPage) {
      title = 'Reset Password | Craftoria';
    }

    document.title = title;

    // Update meta description tag dynamically
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute('content', description);
    }
  }, [pathname, isNotFound, validProduct, validCollection, isWishlistPage, isCheckoutPage, isResetPage]);

  // Protected routes: bounce logged-out visitors home and prompt login
  useEffect(() => {
    if (blockedByAuth) {
      requireAuth(pathname);
      navigate('/');
    }
  }, [blockedByAuth, pathname]);

  useEffect(() => {
    if (isLoggedIn) {
      const redirectPath = consumePostLoginRedirect();
      if (redirectPath && redirectPath !== currentPath) {
        navigate(redirectPath);
      }
    }
  }, [isLoggedIn]);

  // Initialize smooth scrolling strictly for desktop mouse/trackpad environments
  useEffect(() => {
    const isDesktop = window.matchMedia('(hover: hover) and (pointer: fine) and (min-width: 1024px)').matches;
    if (!isDesktop) return;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.05,
      touchMultiplier: 0,
      smoothTouch: false,
    });

    let rafId;
    function raf(time) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }

    rafId = requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden max-w-full">
      
      {/* Stacking Context 1: Background Layer System */}
      <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
        <PremiumBackground />
      </div>

      {/* Stacking Context 2: Content Layers */}
      <div className="relative z-10 flex flex-col flex-grow">
        <Header />

        <main className="flex-grow">
          {isNotFound ? (
            <NotFound />
          ) : isResetPage ? (
            <ResetPassword />
          ) : isCheckoutPage ? (
            <Checkout />
          ) : isWishlistPage ? (
            <Wishlist />
          ) : validCollection ? (
            <CollectionPage collectionId={rawCollectionId} />
          ) : validProduct ? (
            <ProductPage productSlug={rawProductSlug} />
          ) : (
            <>
              <Hero />
              <About />
              <BestSellers />
              <WhyChoose />
              <Gallery />
              <Testimonials />
              <Contact />
            </>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default App;
