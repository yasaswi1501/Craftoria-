import { useEffect, Suspense, lazy } from 'react';

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
import NotFound from './components/NotFound';
import { useRouter } from './context/RouterContext';
import { useAuth } from './context/AuthContext';
import { collectionsData, productsData } from './data/products';

// Route-only components: code-split out of the initial bundle since the
// homepage (the most-visited route) never needs them on first paint.
const ResetPassword = lazy(() => import('./components/ResetPassword'));
const Checkout = lazy(() => import('./components/Checkout'));
const Wishlist = lazy(() => import('./components/Wishlist'));
const Collections = lazy(() => import('./components/Collections'));
const CollectionPage = lazy(() => import('./components/CollectionPage'));
const ProductPage = lazy(() => import('./components/ProductPage'));
const CustomizePage = lazy(() => import('./components/CustomizePage'));
const AdminPanel = lazy(() => import('./components/admin/AdminPanel'));

const RouteLoadingFallback = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="w-8 h-8 rounded-full border-2 border-brand-purple/20 border-t-brand-plum animate-spin" />
  </div>
);

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
  const isCollectionsIndexPage = pathname === '/collections';
  const isCollectionsPage = pathname.startsWith('/collections/');
  const rawCollectionId = isCollectionsPage ? pathname.split('/')[2] : null;
  const effectiveCollectionId = rawCollectionId === 'clips-rubber-bands' ? 'accessories' : rawCollectionId;
  const validCollection = isCollectionsPage ? collectionsData.find(c => c.id === effectiveCollectionId) : null;
  const isInvalidCollection = isCollectionsPage && !validCollection;

  const isProductPage = pathname.startsWith('/product/');
  const rawProductSlug = isProductPage ? pathname.split('/')[2] : null;
  const validProduct = isProductPage ? productsData.find(p => p.slug === rawProductSlug) : null;
  const isInvalidProduct = isProductPage && !validProduct;

  const isCustomizePage = pathname === '/customize' || pathname.startsWith('/customize/');
  const rawCustomizeCategoryId = isCustomizePage ? pathname.split('/')[2] : null;

  // Access is gated inside AdminPanel itself (distinct "sign in" vs.
  // "signed in but not admin" states), not by the blanket bounce-home logic
  // below -- so this route is simply excluded from isNotFound, same as any
  // other real page.
  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/');

  const isHomePage = pathname === '/' || pathname === '';
  const isNotFound = isInvalidCollection || isInvalidProduct || (
    !isHomePage && !isResetPage && !isCheckoutPage && !isWishlistPage &&
    !isCollectionsIndexPage && !isCollectionsPage && !isProductPage && !isCustomizePage && !isAdminPage
  );

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
    } else if (isCollectionsIndexPage) {
      title = 'All Collections | Craftoria';
      description = 'Browse every Craftoria collection -- handmade frames, embroidery, keychains, polaroids, bouquets, decor, and accessories.';
    } else if (isCustomizePage) {
      title = 'Custom Order | Craftoria';
      description = 'Design a fully custom handcrafted piece -- choose your style, material, colour, and personalization.';
    } else if (isAdminPage) {
      title = 'Admin Panel | Craftoria';
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
  }, [pathname, isNotFound, validProduct, validCollection, isCollectionsIndexPage, isCustomizePage, isAdminPage, isWishlistPage, isCheckoutPage, isResetPage]);

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
          ) : (
            <Suspense fallback={<RouteLoadingFallback />}>
              {isResetPage ? (
                <ResetPassword />
              ) : isCheckoutPage ? (
                <Checkout />
              ) : isWishlistPage ? (
                <Wishlist />
              ) : isCollectionsIndexPage ? (
                <Collections />
              ) : validCollection ? (
                <CollectionPage collectionId={effectiveCollectionId || rawCollectionId} />
              ) : validProduct ? (
                <ProductPage productSlug={rawProductSlug} />
              ) : isCustomizePage ? (
                <CustomizePage categoryId={rawCustomizeCategoryId} />
              ) : isAdminPage ? (
                <AdminPanel />
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
            </Suspense>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}

export default App;
