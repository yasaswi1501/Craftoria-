import { useState, useEffect, useMemo, useRef } from 'react';
import {
  ArrowLeft, Sparkles, Upload, X, RotateCcw, ShoppingBag,
  AlertCircle, CheckCircle2, MessageCircle
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { productsData, collectionsData } from '../data/products';
import {
  getCraftStylesForCategory, MATERIALS, COLOURS, SIZES, MATERIAL_PRICE_DELTA
} from '../data/customizationOptions';
import { getProductImage } from '../utils/getProductImage';
import { formatPhoneForDisplay } from '../utils/whatsapp';
import { useSettings } from '../context/SettingsContext';

const CustomizePage = ({ categoryId }) => {
  const { addToCart } = useCart();
  const { whatsappNumber } = useSettings();
  const contactPhone = formatPhoneForDisplay(whatsappNumber);

  const [selectedCategory, setSelectedCategory] = useState(
    collectionsData.find(c => c.id === categoryId)?.id || collectionsData[0].id
  );
  const [craftStyle, setCraftStyle] = useState('');
  const [material, setMaterial] = useState('');
  const [colour, setColour] = useState('');
  const [size, setSize] = useState(SIZES[0].id);
  const [quantity, setQuantity] = useState(1);
  const [personalizationText, setPersonalizationText] = useState('');
  const [notes, setNotes] = useState('');
  const [referenceImage, setReferenceImage] = useState(null); // { name, previewUrl } -- preview only, never persisted
  const [errors, setErrors] = useState({});
  const [isAdded, setIsAdded] = useState(false);
  const isAddedTimeoutRef = useRef(null);
  useEffect(() => () => clearTimeout(isAddedTimeoutRef.current), []);
  const fileInputRef = useRef(null);

  const styleOptions = useMemo(() => getCraftStylesForCategory(selectedCategory), [selectedCategory]);

  // Reset craft-style whenever the category changes, since the option list
  // itself changes per category.
  useEffect(() => {
    setCraftStyle('');
  }, [selectedCategory]);

  const collection = collectionsData.find(c => c.id === selectedCategory);
  const basePieceProduct = useMemo(
    () => productsData.find(p => p.category === selectedCategory && p.id.startsWith('custom-')),
    [selectedCategory]
  );
  const basePrice = basePieceProduct?.price || 499;

  const sizeInfo = SIZES.find(s => s.id === size) || SIZES[0];
  const materialDelta = MATERIAL_PRICE_DELTA[material] || 0;
  const unitPrice = basePrice + sizeInfo.priceDelta + materialDelta;
  const estimatedTotal = unitPrice * quantity;

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, image: 'Please upload an image file (JPG, PNG, etc).' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'Image must be smaller than 5MB.' }));
      return;
    }
    setErrors(prev => ({ ...prev, image: '' }));
    const reader = new FileReader();
    reader.onload = () => setReferenceImage({ name: file.name, previewUrl: reader.result });
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setReferenceImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReset = () => {
    setCraftStyle('');
    setMaterial('');
    setColour('');
    setSize(SIZES[0].id);
    setQuantity(1);
    setPersonalizationText('');
    setNotes('');
    removeImage();
    setErrors({});
  };

  const validate = () => {
    const errs = {};
    if (!craftStyle) errs.craftStyle = 'Please select a craft/style.';
    if (!material) errs.material = 'Please select a material.';
    if (!colour) errs.colour = 'Please select a colour.';
    if (!personalizationText.trim()) errs.personalizationText = 'Please tell us what to personalize (names, initials, message, etc).';
    setErrors(prev => ({ ...prev, ...errs }));
    return Object.keys(errs).length === 0;
  };

  const handleAddToCart = () => {
    if (!validate()) return;

    const customizationData = {
      category: collection?.name,
      craftStyle,
      material,
      colour,
      size: sizeInfo.label,
      referenceImageNote: referenceImage ? `Reference image "${referenceImage.name}" -- share it on WhatsApp after ordering.` : undefined,
      specialNotes: notes.trim() || undefined,
    };

    const cartItem = {
      id: `custom-${selectedCategory}-${Date.now().toString(36)}`,
      productId: basePieceProduct?.id,
      name: `Custom ${collection?.name} -- ${craftStyle}`,
      price: unitPrice,
      desc: `${material}, ${colour}, ${sizeInfo.label}`,
      image: basePieceProduct?.thumbnail,
      customText: personalizationText.trim(),
      customization: customizationData,
    };

    addToCart(cartItem, quantity);
    setIsAdded(true);
    clearTimeout(isAddedTimeoutRef.current);
    isAddedTimeoutRef.current = setTimeout(() => setIsAdded(false), 2200);
    handleReset();
  };

  return (
    <div className="min-h-screen bg-[#FDFBFD] pt-20 sm:pt-24 pb-16 px-3.5 sm:px-6 lg:px-8 text-brand-dark max-w-[1250px] mx-auto text-left">
      {/* Breadcrumb */}
      <div className="mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-xs font-semibold text-brand-plum">
        <a href="/collections" className="inline-flex items-center gap-1.5 hover:underline focus:outline-none">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Collections
        </a>
      </div>

      <div className="text-center mb-8 sm:mb-10">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-brand-plum bg-brand-purple/10 px-3.5 py-1.5 rounded-full font-mono mb-3">
          <Sparkles className="w-3.5 h-3.5" /> Artisan Customization Studio
        </span>
        <h1 className="font-serif text-2.5xl sm:text-4xl font-bold text-brand-dark">Create Your Custom Piece</h1>
        <p className="text-xs sm:text-sm text-brand-dark/70 mt-2 max-w-xl mx-auto leading-relaxed">
          Choose your category, describe your style, and our artisans will hand-craft it just for you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* LEFT: Form */}
        <div className="lg:col-span-7 space-y-5">
          {/* Category */}
          <div className="glass-card p-5 sm:p-6 rounded-[28px] border border-brand-purple/20 bg-white/40 shadow-sm space-y-1.5">
            <label className="text-xs font-bold text-brand-dark flex items-center gap-1.5">
              Category
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full text-sm font-semibold p-3 rounded-xl border border-brand-purple/25 bg-white focus:outline-none focus:ring-2 focus:ring-brand-plum/30 cursor-pointer"
            >
              {collectionsData.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Craft / Style + Material + Colour */}
          <div className="glass-card p-5 sm:p-6 rounded-[28px] border border-brand-purple/20 bg-white/40 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-dark">Craft / Style <span className="text-rose-500">*</span></label>
              <select
                value={craftStyle}
                onChange={(e) => { setCraftStyle(e.target.value); setErrors(p => ({ ...p, craftStyle: '' })); }}
                className={`w-full text-xs p-2.5 rounded-xl border bg-white focus:outline-none cursor-pointer ${errors.craftStyle ? 'border-rose-400' : 'border-brand-purple/25 focus:border-brand-purple'}`}
              >
                <option value="">Select style</option>
                {styleOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {errors.craftStyle && <span className="text-[10px] text-rose-600 font-semibold">{errors.craftStyle}</span>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-dark">Material <span className="text-rose-500">*</span></label>
              <select
                value={material}
                onChange={(e) => { setMaterial(e.target.value); setErrors(p => ({ ...p, material: '' })); }}
                className={`w-full text-xs p-2.5 rounded-xl border bg-white focus:outline-none cursor-pointer ${errors.material ? 'border-rose-400' : 'border-brand-purple/25 focus:border-brand-purple'}`}
              >
                <option value="">Select material</option>
                {MATERIALS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              {errors.material && <span className="text-[10px] text-rose-600 font-semibold">{errors.material}</span>}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-dark">Colour <span className="text-rose-500">*</span></label>
              <select
                value={colour}
                onChange={(e) => { setColour(e.target.value); setErrors(p => ({ ...p, colour: '' })); }}
                className={`w-full text-xs p-2.5 rounded-xl border bg-white focus:outline-none cursor-pointer ${errors.colour ? 'border-rose-400' : 'border-brand-purple/25 focus:border-brand-purple'}`}
              >
                <option value="">Select colour</option>
                {COLOURS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {errors.colour && <span className="text-[10px] text-rose-600 font-semibold">{errors.colour}</span>}
            </div>
          </div>

          {/* Size & Quantity */}
          <div className="glass-card p-5 sm:p-6 rounded-[28px] border border-brand-purple/20 bg-white/40 shadow-sm space-y-3">
            <label className="text-xs font-bold text-brand-dark block">Size</label>
            <div className="flex gap-2">
              {SIZES.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSize(s.id)}
                  className={`flex-1 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider cursor-pointer transition-all ${
                    size === s.id ? 'bg-brand-plum text-white border-brand-plum' : 'bg-white border-brand-purple/20 hover:border-brand-purple'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-brand-purple/10">
              <span className="text-xs font-bold text-brand-dark">Quantity</span>
              <div className="flex items-center border border-brand-purple/20 rounded-full bg-white h-9 px-1">
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="w-7 h-7 flex items-center justify-center text-sm font-bold text-brand-plum hover:bg-brand-purple/10 rounded-full disabled:opacity-40 cursor-pointer"
                >-</button>
                <span className="w-8 text-center text-xs font-bold">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(q => Math.min(10, q + 1))}
                  disabled={quantity >= 10}
                  className="w-7 h-7 flex items-center justify-center text-sm font-bold text-brand-plum hover:bg-brand-purple/10 rounded-full disabled:opacity-40 cursor-pointer"
                >+</button>
              </div>
            </div>
          </div>

          {/* Personalization */}
          <div className="glass-card p-5 sm:p-6 rounded-[28px] border border-brand-purple/20 bg-white/40 shadow-sm space-y-2">
            <label className="text-xs font-bold text-brand-dark">
              Personalization Text <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={personalizationText}
              onChange={(e) => { setPersonalizationText(e.target.value); if (e.target.value.trim()) setErrors(p => ({ ...p, personalizationText: '' })); }}
              placeholder="Names, initials, a special date, or a short custom message..."
              rows={2}
              className={`w-full text-xs p-3 rounded-xl border bg-white focus:outline-none resize-none ${errors.personalizationText ? 'border-rose-400' : 'border-brand-purple/25 focus:border-brand-purple'}`}
            />
            {errors.personalizationText && (
              <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600">
                <AlertCircle className="w-3.5 h-3.5" /> {errors.personalizationText}
              </div>
            )}
          </div>

          {/* Reference Image Upload */}
          <div className="glass-card p-5 sm:p-6 rounded-[28px] border border-brand-purple/20 bg-white/40 shadow-sm space-y-2">
            <label className="text-xs font-bold text-brand-dark flex items-center justify-between">
              <span>Reference Image / Logo</span>
              <span className="text-[10px] font-normal text-brand-dark/50">(Optional)</span>
            </label>
            {!referenceImage ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex flex-col items-center justify-center gap-1.5 py-6 rounded-xl border border-dashed border-brand-purple/35 text-brand-plum hover:bg-brand-purple/5 transition-colors cursor-pointer"
              >
                <Upload className="w-5 h-5" />
                <span className="text-xs font-bold">Click to upload an image</span>
                <span className="text-[10px] text-brand-dark/50">JPG or PNG, up to 5MB</span>
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2.5 rounded-xl border border-brand-purple/15 bg-white">
                  <img src={referenceImage.previewUrl} alt="Reference preview" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                  <span className="text-xs font-semibold text-brand-dark/80 truncate flex-grow">{referenceImage.name}</span>
                  <button
                    type="button"
                    onClick={removeImage}
                    className="p-1.5 rounded-full hover:bg-rose-50 text-rose-500 cursor-pointer flex-shrink-0"
                    aria-label="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <a
                  href={`https://wa.me/${whatsappNumber}?text=${encodeURIComponent('Hi Craftoria! Sharing my reference image for a custom order -- attaching it in this chat now.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 text-xs font-bold transition-colors cursor-pointer"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Open WhatsApp to attach this photo
                </a>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            {errors.image && <span className="text-[10px] text-rose-600 font-semibold">{errors.image}</span>}
            <p className="text-[10px] text-brand-dark/50 italic">
              WhatsApp links can't attach files automatically -- this stays a local preview only. Tap the button above (or message {contactPhone.display} directly) and attach the photo yourself in the chat.
            </p>
          </div>

          {/* Notes */}
          <div className="glass-card p-5 sm:p-6 rounded-[28px] border border-brand-purple/20 bg-white/40 shadow-sm space-y-2">
            <label className="text-xs font-bold text-brand-dark flex items-center justify-between">
              <span>Notes / Instructions</span>
              <span className="text-[10px] font-normal text-brand-dark/50">(Optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special placement, charm requests, or delivery notes..."
              rows={2}
              className="w-full text-xs p-3 rounded-xl border border-brand-purple/25 bg-white focus:outline-none focus:border-brand-purple resize-none"
            />
          </div>
        </div>

        {/* RIGHT: Live Preview + Price + Actions */}
        <div className="lg:col-span-5">
          <div className="sticky top-28 space-y-4">
            {/* Preview Card */}
            <div className="glass-card rounded-[24px] border border-brand-purple/20 bg-white/60 shadow-sm overflow-hidden">
              <div className="h-56 sm:h-64 w-full relative overflow-hidden bg-[#FDFBFD]">
                {basePieceProduct && (
                  <img
                    src={getProductImage(basePieceProduct)}
                    alt={`Custom ${collection?.name} preview`}
                    className="w-full h-full object-cover pointer-events-none select-none"
                  />
                )}
                {personalizationText.trim() && (
                  <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-2 text-center">
                    <span className="font-serif text-xs sm:text-sm font-bold text-brand-plum italic truncate block">
                      "{personalizationText.trim()}"
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4 text-xs text-brand-dark/70 space-y-1 border-t border-brand-purple/10">
                <div className="flex justify-between"><span>Category</span><span className="font-semibold text-brand-dark">{collection?.name}</span></div>
                <div className="flex justify-between"><span>Style</span><span className="font-semibold text-brand-dark">{craftStyle || '--'}</span></div>
                <div className="flex justify-between"><span>Material</span><span className="font-semibold text-brand-dark">{material || '--'}</span></div>
                <div className="flex justify-between"><span>Colour</span><span className="font-semibold text-brand-dark">{colour || '--'}</span></div>
                <div className="flex justify-between"><span>Size</span><span className="font-semibold text-brand-dark">{sizeInfo.label}</span></div>
              </div>
            </div>

            {/* Price Estimate */}
            <div className="glass-card rounded-[24px] border border-brand-purple/20 bg-white/60 shadow-sm p-4 sm:p-5 space-y-2">
              <h3 className="font-serif text-sm font-bold text-brand-dark border-b border-brand-purple/10 pb-2 mb-1">Estimated Price</h3>
              <div className="flex justify-between text-xs text-brand-dark/70">
                <span>Base price</span><span>₹{basePrice.toLocaleString('en-IN')}</span>
              </div>
              {sizeInfo.priceDelta > 0 && (
                <div className="flex justify-between text-xs text-brand-dark/70">
                  <span>Size ({sizeInfo.label})</span><span>+₹{sizeInfo.priceDelta}</span>
                </div>
              )}
              {materialDelta > 0 && (
                <div className="flex justify-between text-xs text-brand-dark/70">
                  <span>Material upgrade</span><span>+₹{materialDelta}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-brand-dark/70">
                <span>Quantity</span><span>&times;{quantity}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-brand-plum pt-2 border-t border-brand-purple/10">
                <span>Total Estimate</span><span>₹{estimatedTotal.toLocaleString('en-IN')}</span>
              </div>
              <p className="text-[10px] text-brand-dark/50 italic pt-1">Final pricing confirmed with our team on WhatsApp before your order ships.</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-full border border-brand-purple/25 text-brand-dark/70 hover:bg-brand-purple/5 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer flex-shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
              <button
                type="button"
                onClick={handleAddToCart}
                className={`flex-grow inline-flex items-center justify-center gap-2 py-3 rounded-full font-semibold text-xs uppercase tracking-wider transition-all duration-300 cursor-pointer shadow-md hover:shadow-lg ${
                  isAdded ? 'bg-emerald-600 text-white' : 'bg-brand-plum hover:bg-brand-violet text-white'
                }`}
              >
                {isAdded ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Added to Cart!
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" /> Add Custom Item to Cart
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizePage;
