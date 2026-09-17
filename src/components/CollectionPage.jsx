import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Heart, ShoppingBag, Search, SlidersHorizontal, X,
  Star, Check, Sparkles, Filter, Eye, Minus, Plus, Paintbrush, ArrowRight
} from 'lucide-react';
import { useRouter } from '../context/RouterContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { productsData, collectionsData } from '../data/products';
import { useScrollLock } from '../utils/scrollLock';
import { useEscapeKey } from '../utils/useEscapeKey';
import { getProductImage } from '../utils/getProductImage';

const SORT_OPTIONS = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'rating-desc', label: 'Rating: High to Low' },
];

const CollectionPage = ({ collectionId }) => {
  const { navigate } = useRouter();
  const { addToCart, cart, updateQuantity } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [sortBy, setSortBy] = useState('featured');

  // Mobile filter drawer visibility
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  // Add to cart animation tracking
  const [addedStates, setAddedStates] = useState({});

  // Lock background body scroll cleanly when filter drawer is open
  useScrollLock(isFilterDrawerOpen);
  useEscapeKey(isFilterDrawerOpen, () => setIsFilterDrawerOpen(false));

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [minRating, setMinRating] = useState(0);

  const targetCategory = collectionId === 'clips-rubber-bands' ? 'accessories' : collectionId;

  useEffect(() => {
    setSearchQuery('');
    setSelectedTags([]);
    setOnlyInStock(false);
    setMinRating(0);
    setSortBy('featured');
  }, [collectionId]);

  // Load collection metadata
  const collection = useMemo(() => {
    return collectionsData.find(c => c.id === targetCategory || c.id === collectionId) || {
      id: collectionId,
      name: 'Artisan Collection',
      desc: 'Exclusive handcrafted Craftoria designs.',
      descriptionLong: 'Discover our luxury handcrafted catalog made with premium threads, canvases, and chenille wire materials by local artisans.'
    };
  }, [collectionId, targetCategory]);

  // The one "build your own" product per category (id always starts with
  // "custom-") is surfaced separately as a single dedicated CTA card, never
  // inside the regular ready-made grid.
  const customPieceProduct = useMemo(() => {
    return productsData.find(p =>
      (p.category === targetCategory || p.category === collectionId) && p.id.startsWith('custom-')
    );
  }, [collectionId, targetCategory]);

  // Collect all unique tags for filter checkboxes (ready-made products only)
  const uniqueTags = useMemo(() => {
    const colProducts = productsData.filter(p =>
      (p.category === targetCategory || p.category === collectionId) && !p.id.startsWith('custom-')
    );
    const tagsSet = new Set();
    colProducts.forEach(p => p.tags && p.tags.forEach(t => tagsSet.add(t)));
    return Array.from(tagsSet);
  }, [collectionId, targetCategory]);

  // Filtering & Sorting Products logic
  const filteredProducts = useMemo(() => {
    // 1. Strict category partition, ready-made products only (the custom
    // piece is shown once, separately, as its own CTA card below)
    let result = productsData.filter(p =>
      (p.category === targetCategory || p.category === collectionId) && !p.id.startsWith('custom-')
    );

    // 2. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }

    // 3. In Stock availability
    if (onlyInStock) {
      result = result.filter(p => p.stock > 0);
    }

    // 4. Minimum Rating
    if (minRating > 0) {
      result = result.filter(p => p.rating >= minRating);
    }

    // 5. Tags checkboxes
    if (selectedTags.length > 0) {
      result = result.filter(p => p.tags && p.tags.some(t => selectedTags.includes(t)));
    }

    // 6. Sort
    const sorted = [...result];
    if (sortBy === 'price-asc') {
      sorted.sort((a, b) => (a.price - (a.discount || 0)) - (b.price - (b.discount || 0)));
    } else if (sortBy === 'price-desc') {
      sorted.sort((a, b) => (b.price - (b.discount || 0)) - (a.price - (a.discount || 0)));
    } else if (sortBy === 'rating-desc') {
      sorted.sort((a, b) => b.rating - a.rating);
    }

    return sorted;
  }, [collectionId, searchQuery, onlyInStock, minRating, selectedTags, sortBy]);

  const handleAddToCart = (product, e) => {
    e.stopPropagation();
    addToCart(product);
    setAddedStates(prev => ({ ...prev, [product.id]: true }));
    setTimeout(() => {
      setAddedStates(prev => ({ ...prev, [product.id]: false }));
    }, 1500);
  };

  const handleTagToggle = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag) 
        : [...prev, tag]
    );
  };

  const resetAllFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
    setOnlyInStock(false);
    setMinRating(0);
    setSortBy('featured');
  };

  return (
    <div className="min-h-screen bg-[#FDFBFD] pt-20 sm:pt-24 pb-16 px-3.5 sm:px-6 lg:px-8 text-brand-dark max-w-[1250px] mx-auto text-left">
      
      {/* Breadcrumb Path */}
      <div className="mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-xs font-semibold text-brand-plum">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 hover:underline focus:outline-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </a>
        <div className="text-brand-dark/50 select-none text-[11px] sm:text-xs">
          Home <span className="mx-1">/</span> Collections <span className="mx-1">/</span> <span className="text-brand-plum font-bold">{collection.name}</span>
        </div>
      </div>

      {/* Category Header Banner */}
      <div className="border-b border-brand-purple/10 pb-4 sm:pb-6 mb-6 sm:mb-8 text-left">
        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-brand-plum font-mono">Artisan Catalog</span>
        <h1 className="font-serif text-2.5xl sm:text-4xl font-bold mt-1 text-brand-dark">{collection.name}</h1>
        <p className="text-xs sm:text-sm text-brand-dark/70 font-medium leading-relaxed max-w-3xl mt-2">
          {collection.descriptionLong}
        </p>
        <div className="flex items-center gap-2 mt-3 sm:mt-4 text-[11px] sm:text-xs font-bold text-brand-plum/95 bg-brand-purple/10 w-fit px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full uppercase tracking-wider font-mono">
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-plum animate-pulse" /> Showing {filteredProducts.length} Products
        </div>
      </div>

      {/* Toolbar: Search, Sort & Mobile Filter Toggle */}
      <div className="flex flex-wrap gap-2 sm:gap-4 justify-between items-center bg-white/50 border border-brand-purple/15 p-2.5 sm:p-4 rounded-[20px] sm:rounded-[24px] mb-6 sm:mb-8 shadow-xs">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[140px] sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-dark/45" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${collection.name}...`}
            className="w-full pl-9 pr-3 py-1.5 rounded-full border border-brand-purple/15 bg-white text-xs h-9 focus:outline-none focus:border-brand-purple transition-all"
          />
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Sort Dropdown */}
          <label className="relative flex-shrink-0">
            <span className="sr-only">Sort products</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              aria-label="Sort products"
              className="appearance-none pl-3 pr-8 h-9 rounded-full border border-brand-purple/20 bg-white text-xs font-semibold text-brand-dark cursor-pointer focus:outline-none focus:border-brand-purple"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-brand-plum text-[9px]">▼</div>
          </label>

          {/* Mobile Filter Button */}
          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className="lg:hidden flex items-center justify-center gap-1.5 px-3.5 h-9 rounded-full border border-brand-purple/20 bg-white text-xs font-bold text-brand-plum cursor-pointer flex-shrink-0 shadow-2xs hover:bg-brand-purple/5"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" /> <span>Filters</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* 1. DESKTOP FILTERS PANEL */}
        <aside className="hidden lg:block lg:col-span-3 space-y-6 sticky top-24">
          <div className="glass-card p-5 rounded-[28px] border border-brand-purple/20 shadow-xs bg-white/40 text-left space-y-6">
            <div className="flex justify-between items-center border-b border-brand-purple/10 pb-3">
              <h3 className="font-serif text-sm font-bold flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-brand-plum" /> Filters
              </h3>
              <button
                onClick={resetAllFilters}
                className="text-[10px] font-bold text-brand-plum hover:underline cursor-pointer"
              >
                Clear All
              </button>
            </div>

            {/* A. Tags / Styles Filter */}
            {uniqueTags.length > 0 && (
              <div className="space-y-2 text-xs">
                <span className="font-semibold text-brand-dark/85 block mb-1">Styles / Tags</span>
                {uniqueTags.map(tag => (
                  <label key={tag} className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={selectedTags.includes(tag)}
                      onChange={() => handleTagToggle(tag)}
                      className="accent-brand-plum cursor-pointer rounded w-4 h-4"
                    />
                    <span className="font-medium text-brand-dark/75 hover:text-brand-dark capitalize">{tag}</span>
                  </label>
                ))}
              </div>
            )}

            {/* B. Minimum Star Ratings Filter */}
            <div className="space-y-2.5 text-xs">
              <span className="font-semibold text-brand-dark/85 block mb-1">Customer Rating</span>
              {[4.5, 4, 3].map(stars => (
                <label key={stars} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="radio"
                    name="minRatingFilter"
                    checked={minRating === stars}
                    onChange={() => setMinRating(stars)}
                    className="accent-brand-plum cursor-pointer w-4 h-4"
                  />
                  <span className="font-medium text-brand-dark/75 flex items-center gap-1">
                    {stars}★ & Above
                  </span>
                </label>
              ))}
              {minRating > 0 && (
                <button
                  onClick={() => setMinRating(0)}
                  className="text-[9px] font-bold text-red-500 hover:underline block mt-1 cursor-pointer"
                >
                  Clear Rating Filter
                </button>
              )}
            </div>

            {/* C. Availability switch */}
            <div className="space-y-3 pt-3 border-t border-brand-purple/10 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="accent-brand-plum cursor-pointer rounded w-4 h-4"
                />
                <span className="font-medium text-brand-dark/75">In Stock Only</span>
              </label>
            </div>
          </div>
        </aside>

        {/* 2. PRODUCT GRID SECTION */}
        <section className="lg:col-span-9 w-full space-y-8 sm:space-y-10">
          <AnimatePresence mode="wait">
            {filteredProducts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center text-center py-20 bg-white/40 border border-brand-purple/10 rounded-[32px] p-6 max-w-md mx-auto"
              >
                <div className="w-14 h-14 rounded-full bg-brand-purple/10 flex items-center justify-center mb-4 text-brand-plum/70">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold mb-1">No products found</h3>
                <p className="text-xs text-brand-dark/65 max-w-xs mb-6 leading-relaxed">
                  Adjust your selected styles or ratings to discover handmade items in this collection.
                </p>
                <button
                  onClick={resetAllFilters}
                  className="px-6 py-2.5 rounded-full bg-brand-plum hover:bg-brand-violet text-white text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Clear All Filters
                </button>
              </motion.div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
              >
                {filteredProducts.map((product) => {
                  const isFav = isInWishlist(product.id);
                  const isAdded = addedStates[product.id];
                  const cartQty = cart.find((item) => item.id === product.id)?.quantity || 0;
                  const finalPrice = product.price - (product.discount || 0);

                  return (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => navigate(`/product/${product.slug}`)}
                      className="glass-card rounded-[20px] sm:rounded-[24px] overflow-hidden flex flex-col group border border-brand-purple/20 shadow-xs hover:shadow-md relative bg-white/50 cursor-pointer min-h-[300px] sm:min-h-[340px] transition-all"
                    >
                      {/* Product Image */}
                      <div className="h-[200px] sm:h-[200px] w-full border-b border-brand-purple/10 overflow-hidden relative bg-gradient-to-tr from-[#FCF7FF] via-[#F3E7FA] to-[#E9D7F5] flex items-center justify-center p-2.5 sm:p-4">
                        <img
                          src={getProductImage(product)}
                          alt={product.title}
                          loading="lazy"
                          decoding="async"
                          style={{
                            objectFit: 'contain',
                            objectPosition: 'center',
                            width: '100%',
                            height: '100%',
                            maxWidth: collectionId === 'photo-frames' ? '96%' : collectionId === 'embroidery' ? '90%' : '84%',
                            maxHeight: collectionId === 'photo-frames' ? '96%' : collectionId === 'embroidery' ? '90%' : '84%'
                          }}
                          className="select-none pointer-events-none group-hover:scale-105 transition-transform duration-500"
                        />

                        {/* Wishlist Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist({
                              id: product.id,
                              name: product.title,
                              price: product.price,
                              desc: product.description,
                              image: product.thumbnail
                            });
                          }}
                          className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 w-7 h-7 rounded-full bg-white/85 hover:bg-white border border-brand-purple/15 flex items-center justify-center shadow-xs cursor-pointer focus:outline-none"
                          aria-label={isFav ? "Remove from wishlist" : "Add to wishlist"}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-500 text-red-500' : 'text-brand-dark/50'}`} />
                        </button>
                      </div>

                      {/* Details Area */}
                      <div className="p-3 sm:p-4 flex flex-col flex-grow text-left">
                        <span className="text-[7.5px] sm:text-[8px] font-bold text-brand-plum/80 uppercase tracking-wider mb-0.5 sm:mb-1 font-mono">
                          {product.category.replace('-', ' ')}
                        </span>
                        <h3 className="font-serif text-xs sm:text-sm font-bold text-brand-dark leading-tight line-clamp-1 mb-1 group-hover:text-brand-plum transition-colors">
                          {product.title}
                        </h3>
                        <p className="text-[9.5px] sm:text-[10px] text-brand-dark/65 line-clamp-1 sm:line-clamp-2 leading-relaxed mb-2 flex-grow">
                          {product.description}
                        </p>

                        {/* Price + Rating row */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <span className="text-sm sm:text-base font-bold text-brand-plum font-serif">
                            ₹{finalPrice.toLocaleString('en-IN')}
                          </span>
                          <div className="flex items-center gap-1">
                            <div className="flex text-amber-400">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-2.5 h-2.5 ${i < Math.floor(product.rating) ? 'fill-amber-400' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                            <span className="text-[8.5px] sm:text-[9px] font-bold text-brand-dark/50">({product.reviewCount})</span>
                          </div>
                        </div>

                        {/* Action buttons row */}
                        <div className="flex flex-col gap-1.5 sm:gap-2 mt-auto pt-2 border-t border-brand-purple/10">
                          <div className="flex gap-1.5 sm:gap-2">
                            {/* Add to Cart button / Quantity stepper */}
                            {cartQty > 0 ? (
                              <div className="flex-grow inline-flex items-center justify-between rounded-full bg-brand-plum/90 text-white h-7 px-1 shadow-2xs">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateQuantity(product.id, cartQty - 1);
                                  }}
                                  className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/20 cursor-pointer focus:outline-none"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="w-2.5 h-2.5" />
                                </button>
                                <span className="text-[9.5px] sm:text-[10px] font-bold min-w-[1.2rem] text-center">{cartQty}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateQuantity(product.id, cartQty + 1);
                                  }}
                                  className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/20 cursor-pointer focus:outline-none"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="w-2.5 h-2.5" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={(e) => handleAddToCart({
                                  id: product.id,
                                  name: product.title,
                                  price: product.price,
                                  desc: product.description,
                                  image: product.thumbnail
                                }, e)}
                                className="flex-grow inline-flex items-center justify-center gap-1 py-1 px-1.5 rounded-full border border-brand-purple/25 bg-white hover:bg-brand-purple/10 text-brand-plum text-[8.5px] sm:text-[9px] font-bold uppercase tracking-wider h-7 shadow-2xs cursor-pointer transition-colors"
                              >
                                {isAdded ? (
                                  <>
                                    <Check className="w-2.5 h-2.5 text-emerald-600" />
                                    <span className="text-emerald-600">Added</span>
                                  </>
                                ) : (
                                  <>
                                    <ShoppingBag className="w-2.5 h-2.5" />
                                    <span className="truncate">Quick Add</span>
                                  </>
                                )}
                              </button>
                            )}

                            {/* View details button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/product/${product.slug}`);
                              }}
                              className="p-1 rounded-full border border-brand-purple/20 text-brand-plum hover:bg-brand-purple/10 flex items-center justify-center h-7 w-7 cursor-pointer focus:outline-none flex-shrink-0"
                              title="View Product details"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* One dedicated "Create Your Custom [Category]" CTA card -- never
              repeated per product, shown once at the end of every category page. */}
          {customPieceProduct && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="glass-card rounded-[24px] sm:rounded-[32px] overflow-hidden border border-brand-purple/25 shadow-sm bg-gradient-to-br from-white via-brand-cream/40 to-brand-purple/10 flex flex-col sm:flex-row items-center gap-5 sm:gap-8 p-5 sm:p-8"
            >
              <div className="w-full sm:w-44 h-40 sm:h-44 rounded-2xl bg-gradient-to-tr from-[#FCF7FF] via-[#F3E7FA] to-[#E9D7F5] border border-brand-purple/15 flex items-center justify-center p-4 flex-shrink-0">
                <img
                  src={getProductImage(customPieceProduct)}
                  alt={`Custom ${collection.name}`}
                  loading="lazy"
                  className="w-full h-full object-contain pointer-events-none select-none"
                />
              </div>
              <div className="flex-grow text-center sm:text-left">
                <span className="inline-flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-brand-plum bg-brand-purple/10 px-3 py-1 rounded-full font-mono mb-2.5">
                  <Sparkles className="w-3 h-3" /> Bespoke Commission
                </span>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-brand-dark mb-1.5">
                  Create Your Custom {collection.name}
                </h3>
                <p className="text-xs sm:text-sm text-brand-dark/70 leading-relaxed max-w-lg mx-auto sm:mx-0 mb-4">
                  Design a one-of-a-kind piece from scratch -- pick your style, material, colour, and add a personal message. Our artisans hand-craft it just for you.
                </p>
                <button
                  onClick={() => navigate(`/customize/${collectionId}`)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-brand-plum hover:bg-brand-violet text-white font-semibold text-xs uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer h-11"
                >
                  <Paintbrush className="w-4 h-4" />
                  <span>Customize Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          )}
        </section>
      </div>

      {/* 3. MOBILE FILTERS DRAWER */}
      <AnimatePresence>
        {isFilterDrawerOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden" data-lenis-prevent="true">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterDrawerOpen(false)}
              onTouchMove={(e) => e.preventDefault()}
              className="fixed inset-0 bg-brand-plum/40 backdrop-blur-xs cursor-pointer touch-none"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              onWheel={(e) => e.stopPropagation()}
              data-lenis-prevent="true"
              className="relative w-full max-w-xs h-full bg-[#FCF8FC] border-r border-brand-purple/20 shadow-xl flex flex-col z-10 p-5 text-brand-dark text-left pb-safe overscroll-contain"
            >
              <div className="flex justify-between items-center border-b border-brand-purple/10 pb-3 mb-5 flex-shrink-0">
                <h3 className="font-serif text-base font-bold flex items-center gap-1.5">
                  <Filter className="w-4 h-4 text-brand-plum" /> Filters
                </h3>
                <button
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="w-7 h-7 rounded-full bg-brand-purple/10 flex items-center justify-center text-brand-plum"
                  aria-label="Close filters"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div 
                className="flex-grow overflow-y-auto space-y-6 pr-1 custom-scrollbar text-xs overscroll-contain"
                style={{ touchAction: 'pan-y' }}
              >
                {/* Styles / Tags */}
                {uniqueTags.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-semibold text-brand-dark/85 block mb-1">Styles / Tags</span>
                    {uniqueTags.map(tag => (
                      <label key={tag} className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={selectedTags.includes(tag)}
                          onChange={() => handleTagToggle(tag)}
                          className="accent-brand-plum cursor-pointer rounded w-4 h-4"
                        />
                        <span className="font-medium text-brand-dark/75 capitalize">{tag}</span>
                      </label>
                    ))}
                  </div>
                )}

                {/* Rating filter */}
                <div className="space-y-2.5">
                  <span className="font-semibold text-brand-dark/85 block mb-1">Customer Rating</span>
                  {[4.5, 4, 3].map(stars => (
                    <label key={stars} className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="radio"
                        name="mobileRatingFilter"
                        checked={minRating === stars}
                        onChange={() => setMinRating(stars)}
                        className="accent-brand-plum cursor-pointer w-4 h-4"
                      />
                      <span className="font-medium text-brand-dark/75">{stars}★ & Above</span>
                    </label>
                  ))}
                </div>

                {/* Switches */}
                <div className="space-y-3 pt-3 border-t border-brand-purple/10">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={onlyInStock}
                      onChange={(e) => setOnlyInStock(e.target.checked)}
                      className="accent-brand-plum cursor-pointer rounded w-4 h-4"
                    />
                    <span className="font-medium text-brand-dark/75">In Stock Only</span>
                  </label>
                </div>
              </div>

              <div className="mt-auto pt-4 border-t border-brand-purple/10 flex gap-3">
                <button
                  onClick={resetAllFilters}
                  className="flex-grow py-2.5 rounded-full border border-brand-purple/35 text-brand-plum font-semibold text-[11px] text-center cursor-pointer"
                >
                  Clear All
                </button>
                <button
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="flex-grow py-2.5 rounded-full bg-brand-plum text-white font-semibold text-[11px] text-center cursor-pointer"
                >
                  Apply Filters
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CollectionPage;
