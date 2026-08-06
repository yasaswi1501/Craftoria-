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
import { useRouter } from './context/RouterContext';

function App() {
  const { currentPath } = useRouter();
  
  // Parse pathname to strip any query params or hash anchors
  const pathname = currentPath.split('#')[0].split('?')[0];

  const isResetPage = pathname === '/reset-password';
  const isCheckoutPage = pathname === '/checkout';
  const isWishlistPage = pathname === '/wishlist';
  const isCollectionsPage = pathname.startsWith('/collections/');
  const collectionId = isCollectionsPage ? pathname.split('/').pop() : null;
  const isProductPage = pathname.startsWith('/product/');
  const productSlug = isProductPage ? pathname.split('/').pop() : null;

  // Scroll to top on routing changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentPath]);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
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
    <div className="relative min-h-screen flex flex-col overflow-x-hidden">
      
      {/* Stacking Context 1: Background Layer System */}
      <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
        <PremiumBackground />
      </div>

      {/* Stacking Context 2: Content Layers */}
      <div className="relative z-10 flex flex-col flex-grow">
        <Header />

        <main className="flex-grow">
          {isResetPage ? (
            <ResetPassword />
          ) : isCheckoutPage ? (
            <Checkout />
          ) : isWishlistPage ? (
            <Wishlist />
          ) : isCollectionsPage ? (
            <CollectionPage collectionId={collectionId} />
          ) : isProductPage ? (
            <ProductPage productSlug={productSlug} />
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
