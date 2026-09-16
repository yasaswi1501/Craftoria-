import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Heart, ShoppingBag, Search, SlidersHorizontal, X,
  Star, Check, Sparkles, Filter, Eye, Minus, Plus
} from 'lucide-react';
import { useRouter } from '../context/RouterContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { productsData, collectionsData } from '../data/products';

import sellerMemoryCanvas from '../assets/seller-memory-canvas.png';
import sellerEmbroideryHoop from '../assets/seller-embroidery-hoop.png';
import sellerBloomBouquets from '../assets/seller-bloom-bouquets.png';
import sellerBloomKeychains from '../assets/seller-bloom-keychains.png';
import coverPolaroids from '../assets/polaroids-new.jpg';
import coverClips from '../assets/clips-rubber-bands.jpg';
import coverMacrame from '../assets/macrame-wall-hanging.jpg';
import coverBouquets from '../assets/bloom-bouquets-cover.jpg';

const CollectionPage = ({ collectionId }) => {
  const { navigate } = useRouter();
  const { addToCart, cart, updateQuantity } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  // Mobile filter drawer visibility
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  // Add to cart animation tracking
  const [addedStates, setAddedStates] = useState({});

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [priceRange, setPriceRange] = useState(1600);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [onlyCustomizable, setOnlyCustomizable] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('popularity'); // 'popularity' | 'newest' | 'price-low' | 'price-high' | 'rating' | 'alpha'

  // Reset filters when changing collections
  useEffect(() => {
    setSearchQuery('');
    setSelectedTags([]);
    setPriceRange(1600);
    setOnlyInStock(false);
    setOnlyCustomizable(false);
    setMinRating(0);
    setSortBy('popularity');
  }, [collectionId]);

  // Load collection metadata
  const collection = useMemo(() => {
    return collectionsData.find(c => c.id === collectionId) || {
      id: collectionId,
      name: 'Artisan Collection',
      desc: 'Exclusive handcrafted Craftoria designs.',
      descriptionLong: 'Discover our luxury handcrafted catalog made with premium threads, canvases, and chenille wire materials by local artisans.'
    };
  }, [collectionId]);

  // Get matching product image helper
  const getProductImage = (product) => {
    switch (product.category) {
      case 'photo-frames': return sellerMemoryCanvas;
      case 'embroidery': return sellerEmbroideryHoop;
      case 'keychains': return sellerBloomKeychains;
      case 'polaroids': return coverPolaroids;
      case 'clips-rubber-bands': return coverClips;
      case 'handmade-decor': return coverMacrame;
      case 'craftoria-bloom-bouquets': return coverBouquets;
      case 'custom-gifts': return sellerBloomBouquets;
      default: return sellerMemoryCanvas;
    }
  };

  // Collect all unique tags for filter checkboxes
  const uniqueTags = useMemo(() => {
    const colProducts = productsData.filter(p => p.category === collectionId);
    const tagsSet = new Set();
    colProducts.forEach(p => p.tags && p.tags.forEach(t => tagsSet.add(t)));
    return Array.from(tagsSet);
  }, [collectionId]);

  // Filtering & Sorting Products logic
  const filteredProducts = useMemo(() => {
    // 1. Strict category partition check (reusable database category matching)
    let result = productsData.filter(p => p.category === collectionId);

    // 2. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q));
    }

    // 3. Price slider range
    result = result.filter(p => p.price <= priceRange);

    // 4. In Stock availability
    if (onlyInStock) {
      result = result.filter(p => p.stock > 0);
    }

    // 5. Customization
    if (onlyCustomizable) {
      result = result.filter(p => p.customizable);
    }

    // 6. Minimum Rating
    if (minRating > 0) {
      result = result.filter(p => p.rating >= minRating);
    }

    // 7. Tags checkboxes
    if (selectedTags.length > 0) {
      result = result.filter(p => p.tags && p.tags.some(t => selectedTags.includes(t)));
    }

    // 8. Sorting options
    if (sortBy === 'popularity') {
      result.sort((a, b) => b.reviewCount - a.reviewCount);
    } else if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded));
    } else if (sortBy === 'price-low') {
      result.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      result.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sortBy === 'alpha') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [collectionId, searchQuery, priceRange, onlyInStock, onlyCustomizable, minRating, selectedTags, sortBy]);

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
    setPriceRange(1600);
    setOnlyInStock(false);
    setOnlyCustomizable(false);
    setMinRating(0);
    setSortBy('popularity');
  };

  return (
    <div className="min-h-screen bg-[#FDFBFD] pt-24 pb-16 px-4 sm:px-6 lg:px-8 text-brand-dark max-w-[1250px] mx-auto text-left">
      
      {/* Breadcrumb Path */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 text-xs font-semibold text-brand-plum">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 hover:underline focus:outline-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </a>
        <div className="text-brand-dark/50 select-none">
          Home <span className="mx-1">/</span> Collections <span className="mx-1">/</span> <span className="text-brand-plum font-bold">{collection.name}</span>
        </div>
      </div>

      {/* Category Header Banner */}
      <div className="border-b border-brand-purple/10 pb-6 mb-8 text-left">
        <span className="text-[10px] font-bold uppercase tracking-widest text-brand-plum font-mono">Artisan Catalog</span>
        <h1 className="font-serif text-3xl sm:text-4xl font-bold mt-1 text-brand-dark">{collection.name}</h1>
        <p className="text-xs sm:text-sm text-brand-dark/70 font-medium leading-relaxed max-w-3xl mt-2.5">
          {collection.descriptionLong}
        </p>
        <div className="flex items-center gap-2 mt-4 text-xs font-bold text-brand-plum/95 bg-brand-purple/10 w-fit px-3.5 py-1.5 rounded-full uppercase tracking-wider font-mono">
          <Sparkles className="w-3.5 h-3.5 text-brand-plum animate-pulse" /> Showing {filteredProducts.length} Products
        </div>
      </div>

      {/* Toolbar: Search, Mobile filters drawer toggle, sorting select */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white/40 border border-brand-purple/15 p-4 rounded-[24px] mb-8 shadow-xs">
        {/* Search Input */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-dark/45" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${collection.name}...`}
            className="w-full pl-10 pr-4 py-2 rounded-full border border-brand-purple/15 bg-white text-xs h-9 focus:outline-none focus:border-brand-purple transition-all"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          {/* Mobile Filter Button */}
          <button
            onClick={() => setIsFilterDrawerOpen(true)}
            className="lg:hidden flex items-center justify-center gap-1.5 px-4 h-9 rounded-full border border-brand-purple/15 bg-white text-xs font-bold text-brand-plum cursor-pointer"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
          </button>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-brand-dark/70 hidden sm:inline font-mono">SORT BY:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-white border border-brand-purple/15 rounded-full px-3.5 py-1.5 h-9 font-semibold text-brand-dark/85 cursor-pointer text-xs focus:outline-none"
            >
              <option value="popularity">Popularity</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price Low to High</option>
              <option value="price-high">Price High to Low</option>
              <option value="rating">Customer Rating</option>
              <option value="alpha">Alphabetical</option>
            </select>
          </div>
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

            {/* B. Price Range Slider */}
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between font-semibold">
                <span className="text-brand-dark/85">Max Price</span>
                <span className="text-brand-plum font-bold">₹{priceRange}</span>
              </div>
              <input
                type="range"
                min="100"
                max="2000"
                step="50"
                value={priceRange}
                onChange={(e) => setPriceRange(Number(e.target.value))}
                className="w-full accent-brand-plum h-1 bg-brand-purple/20 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] font-semibold text-brand-dark/50">
                <span>₹100</span>
                <span>₹2000</span>
              </div>
            </div>

            {/* C. Minimum Star Ratings Filter */}
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

            {/* D. Availability & Customization switches */}
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

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyCustomizable}
                  onChange={(e) => setOnlyCustomizable(e.target.checked)}
                  className="accent-brand-plum cursor-pointer rounded w-4 h-4"
                />
                <span className="font-medium text-brand-dark/75">Customization Available</span>
              </label>
            </div>
          </div>
        </aside>

        {/* 2. PRODUCT GRID SECTION */}
        <section className="lg:col-span-9 w-full">
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
                  Adjust your price slider, selected styles, or ratings to discover handmade items in this collection.
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
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
              >
                {filteredProducts.map((product) => {
                  const isFav = isInWishlist(product.id);
                  const isAdded = addedStates[product.id];
                  const cartQty = cart.find((item) => item.id === product.id)?.quantity || 0;

                  return (
                    <motion.div
                      key={product.id}
                      layout
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={() => navigate(`/product/${product.slug}`)}
                      className="glass-card rounded-[24px] overflow-hidden flex flex-col group border border-brand-purple/20 shadow-sm relative bg-white/40 cursor-pointer min-h-[365px]"
                    >
                      {/* Product Image */}
                      <div className="h-[185px] sm:h-[200px] w-full border-b border-brand-purple/10 overflow-hidden relative bg-gradient-to-tr from-[#FCF7FF] via-[#F3E7FA] to-[#E9D7F5] flex items-center justify-center p-4">
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
                          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-white/85 hover:bg-white border border-brand-purple/15 flex items-center justify-center shadow-xs cursor-pointer focus:outline-none"
                          aria-label={isFav ? "Remove from wishlist" : "Add to wishlist"}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-red-500 text-red-500' : 'text-brand-dark/50'}`} />
                        </button>
                      </div>

                      {/* Details Area */}
                      <div className="p-4 flex flex-col flex-grow text-left">
                        <span className="text-[8px] font-bold text-brand-plum/80 uppercase tracking-wider mb-1 font-mono">
                          {product.category.replace('-', ' ')}
                        </span>
                        <h3 className="font-serif text-xs sm:text-sm font-bold text-brand-dark leading-tight line-clamp-1 mb-1 group-hover:text-brand-plum transition-colors">
                          {product.title}
                        </h3>
                        <p className="text-[10px] text-brand-dark/65 line-clamp-2 leading-relaxed mb-2 flex-grow">
                          {product.description}
                        </p>

                        {/* Rating row */}
                        <div className="flex items-center gap-1 mb-2.5">
                          <div className="flex text-amber-400">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-2.5 h-2.5 ${i < Math.floor(product.rating) ? 'fill-amber-400' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                          <span className="text-[9px] font-bold text-brand-dark/50">({product.reviewCount})</span>
                        </div>

                        {/* Price Details */}
                        <div className="flex flex-wrap items-baseline gap-1.5 mb-3">
                          <span className="text-sm font-bold text-brand-plum">₹{product.price}</span>
                          {product.discount > 0 && (
                            <>
                              <span className="line-through text-brand-dark/45 text-[10px]">₹{product.price + product.discount}</span>
                              <span className="text-[9px] text-emerald-600 font-bold">(Save ₹{product.discount})</span>
                            </>
                          )}
                        </div>

                        {/* Direct purchase row */}
                        <div className="flex gap-2 mt-auto pt-2 border-t border-brand-purple/10">
                          {/* Add to Cart button / Quantity stepper */}
                          {cartQty > 0 ? (
                            <div className="flex-grow inline-flex items-center justify-between rounded-full bg-brand-plum text-white h-8 px-1 shadow-xs">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateQuantity(product.id, cartQty - 1);
                                }}
                                className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/20 cursor-pointer focus:outline-none"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-[10px] font-bold min-w-[1.25rem] text-center">{cartQty}</span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateQuantity(product.id, cartQty + 1);
                                }}
                                className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-white/20 cursor-pointer focus:outline-none"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3" />
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
                              className="flex-grow inline-flex items-center justify-center gap-1 py-2 rounded-full bg-brand-plum hover:bg-brand-violet text-white text-[9px] font-bold uppercase tracking-wider h-8 shadow-xs cursor-pointer"
                            >
                              {isAdded ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Added</span>
                                </>
                              ) : (
                                <>
                                  <ShoppingBag className="w-3 h-3" />
                                  <span>Add</span>
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
                            className="p-2 rounded-full border border-brand-purple/20 text-brand-plum hover:bg-brand-purple/10 flex items-center justify-center h-8 w-8 cursor-pointer focus:outline-none"
                            title="View Product details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      </div>

      {/* 3. MOBILE FILTERS DRAWER */}
      <AnimatePresence>
        {isFilterDrawerOpen && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterDrawerOpen(false)}
              className="absolute inset-0 bg-brand-plum/40 backdrop-blur-xs cursor-pointer"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-xs h-full bg-[#FCF8FC] border-r border-brand-purple/20 shadow-xl flex flex-col z-10 p-5 text-brand-dark text-left"
            >
              <div className="flex justify-between items-center border-b border-brand-purple/10 pb-3 mb-5">
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

              <div className="flex-grow overflow-y-auto space-y-6 pr-1 custom-scrollbar text-xs">
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

                {/* Price Slider */}
                <div className="space-y-2.5">
                  <div className="flex justify-between font-semibold">
                    <span className="text-brand-dark/85">Max Price</span>
                    <span className="text-brand-plum font-bold">₹{priceRange}</span>
                  </div>
                  <input
                    type="range"
                    min="100"
                    max="2000"
                    step="50"
                    value={priceRange}
                    onChange={(e) => setPriceRange(Number(e.target.value))}
                    className="w-full accent-brand-plum h-1 bg-brand-purple/20 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-semibold text-brand-dark/50">
                    <span>₹100</span>
                    <span>₹2000</span>
                  </div>
                </div>

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

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={onlyCustomizable}
                      onChange={(e) => setOnlyCustomizable(e.target.checked)}
                      className="accent-brand-plum cursor-pointer rounded w-4 h-4"
                    />
                    <span className="font-medium text-brand-dark/75">Customization Available</span>
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
