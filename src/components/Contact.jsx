import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, CheckCircle2, Sparkles, Mail, Phone, AlertCircle, 
  MessageCircle, Gift, Package, HelpCircle, Check, ShoppingBag 
} from 'lucide-react';
import { HibiscusFlower, WatercolorWash } from './PremiumBackground';
import { 
  sendCustomRequestToWhatsApp, 
  sendCustomRequestEmail, 
  WHATSAPP_PHONE_NUMBER 
} from '../utils/whatsapp';
import { OCCASIONS, PACKAGING_OPTIONS } from './CustomizationModal';
import { useCart } from '../context/CartContext';

import sellerMemoryCanvas from '../assets/seller-memory-canvas.png';
import sellerEmbroideryHoop from '../assets/seller-embroidery-hoop.png';
import sellerBloomBouquets from '../assets/seller-bloom-bouquets.png';
import sellerBloomKeychains from '../assets/seller-bloom-keychains.png';
import coverPolaroids from '../assets/polaroids-new.jpg';
import coverClips from '../assets/clips-rubber-bands.jpg';
import coverMacrame from '../assets/macrame-wall-hanging.jpg';

const CRAFT_CATEGORIES = [
  'Craftoria Bloom Bouquets (Chenille Stem Flowers)',
  'Embroidery Hoops (Couples, Names, Floral)',
  'Handmade Photo Frames & Canvas',
  'Keychains & Bag Charms',
  'Aesthetic Polaroids',
  'Home Decor & Macrame Wall Hangings',
  'Clips & Hair Accessories',
];

const Contact = () => {
  const { addToCart } = useCart();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    productType: CRAFT_CATEGORIES[0],
    personalization: '',
    occasion: OCCASIONS[0],
    giftNote: '',
    packaging: PACKAGING_OPTIONS[0].label,
    specialNotes: '',
  });

  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [addedToCartSuccess, setAddedToCartSuccess] = useState(false);

  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const validateForm = (forCartOnly = false) => {
    const errs = {};

    if (!formData.personalization.trim()) {
      errs.personalization = 'Please enter your personalized name, initials, or custom text.';
    }

    if (!forCartOnly) {
      if (!formData.name.trim()) {
        errs.name = 'Please enter your name.';
      } else if (formData.name.trim().length < 2) {
        errs.name = 'Name must be at least 2 characters.';
      }

      if (!formData.email.trim()) {
        errs.email = 'Please enter your email address.';
      } else if (!validateEmail(formData.email.trim())) {
        errs.email = 'Please enter a valid email address (e.g., name@example.com).';
      }

      if (formData.phone.trim() && !/^\d{10}$/.test(formData.phone.trim())) {
        errs.phone = 'Phone number should be 10 digits if provided.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const getCategoryDefaultImage = (catName) => {
    if (catName.includes('Embroidery')) return sellerEmbroideryHoop;
    if (catName.includes('Photo Frames')) return sellerMemoryCanvas;
    if (catName.includes('Keychains')) return sellerBloomKeychains;
    if (catName.includes('Polaroids')) return coverPolaroids;
    if (catName.includes('Clips')) return coverClips;
    if (catName.includes('Home Decor') || catName.includes('Macrame')) return coverMacrame;
    return sellerBloomBouquets;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm(false)) return;

    setIsSubmitting(true);
    const submissionPayload = { ...formData };

    try {
      // 1. Dispatch email to thecraftoriaaa26@gmail.com
      await sendCustomRequestEmail(submissionPayload);

      // 2. Open WhatsApp pre-filled message to 9908860895
      sendCustomRequestToWhatsApp(submissionPayload);
    } catch (err) {
      console.warn('Dispatch note:', err);
      sendCustomRequestToWhatsApp(submissionPayload);
    } finally {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setErrors({});
    }
  };

  const handleAddToCart = () => {
    if (!validateForm(true)) return;

    const customItem = {
      id: `custom-bespoke-${Date.now()}`,
      name: `Bespoke Custom Order (${formData.productType.split('(')[0].trim()})`,
      desc: `Custom handcrafted creation (${formData.occasion})`,
      image: getCategoryDefaultImage(formData.productType),
      customText: formData.personalization.trim(),
      customization: {
        text: formData.personalization.trim(),
        occasion: formData.occasion,
        packaging: formData.packaging,
        giftNote: formData.giftNote.trim() || undefined,
        specialNotes: formData.specialNotes.trim() || undefined,
        clientName: formData.name.trim() || undefined,
        clientEmail: formData.email.trim() || undefined,
        clientPhone: formData.phone.trim() || undefined,
        category: formData.productType,
      },
      qty: 1,
    };

    addToCart(customItem, 1);
    setAddedToCartSuccess(true);
    setTimeout(() => {
      setAddedToCartSuccess(false);
    }, 2500);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <section id="contact" className="py-24 px-6 relative overflow-hidden border-t border-brand-purple/10">
      {/* Anchor for direct custom orders linking */}
      <div id="custom-orders" className="absolute -top-24" />

      {/* Section Background Washes */}
      <WatercolorWash
        className="w-[500px] h-[500px] -left-16 bottom-[-5%]"
        gradientId="wash-contact-left"
        fromColor1="rgba(190, 154, 205, 0.20)"
        fromColor2="rgba(214, 185, 225, 0.16)"
        fromColor3="rgba(233, 207, 228, 0.10)"
      />
      <WatercolorWash
        className="w-[550px] h-[550px] right-[-10%] top-[10%]"
        gradientId="wash-contact-right"
        fromColor1="rgba(214, 185, 225, 0.18)"
        fromColor2="rgba(233, 207, 228, 0.12)"
        fromColor3="transparent"
      />

      {/* Delicate floral/stem illustration */}
      <HibiscusFlower
        className="w-[320px] h-[320px] right-[-40px] bottom-[15%]"
        stroke="#76558F"
        opacity={0.48}
        style={{ transform: "rotate(15deg)" }}
      />
      <HibiscusFlower
        className="w-[280px] h-[280px] left-[45%] -top-10"
        stroke="rgba(255, 255, 255, 0.70)"
        opacity={0.68}
        style={{ transform: "rotate(-25deg)" }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          
          {/* Left Column: Heading, Details & Direct Contacts */}
          <motion.div
            initial={{ opacity: 0, x: -35 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 text-left space-y-6 flex flex-col items-start lg:sticky lg:top-28"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-purple/15 border border-brand-purple/25 text-brand-plum text-xs font-bold uppercase tracking-widest font-mono">
              <Sparkles className="w-3.5 h-3.5 text-brand-plum" />
              <span>Bespoke Custom Orders</span>
            </div>

            <h2 className="font-serif text-3xl sm:text-4.5xl font-bold leading-tight text-brand-dark">
              Have a Custom <br className="hidden sm:inline" />
              Idea in Mind?
            </h2>

            <p className="text-xs sm:text-sm text-brand-dark/80 leading-relaxed font-normal max-w-sm">
              We handcraft custom creations tailored specifically to your story. Choose your craft category, occasion, packaging style, custom names, and artisan instructions.
            </p>

            {/* Direct Clickable Contact Cards */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto pt-2">
              <a
                href="mailto:thecraftoriaaa26@gmail.com"
                className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/75 hover:bg-white border border-brand-purple/20 text-brand-plum text-xs font-semibold shadow-xs transition-all duration-200"
              >
                <div className="w-6 h-6 rounded-full bg-brand-purple/15 flex items-center justify-center">
                  <Mail className="w-3.5 h-3.5 text-brand-plum" />
                </div>
                <span>thecraftoriaaa26@gmail.com</span>
              </a>

              <a
                href="https://wa.me/919908860895"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/75 hover:bg-white border border-brand-purple/20 text-brand-plum text-xs font-semibold shadow-xs transition-all duration-200"
              >
                <div className="w-6 h-6 rounded-full bg-brand-purple/15 flex items-center justify-center">
                  <Phone className="w-3.5 h-3.5 text-brand-plum" />
                </div>
                <span>+91 99088 60895</span>
              </a>
            </div>

            {/* Handcrafted Highlights Box */}
            <div className="w-full bg-white/60 border border-brand-purple/15 rounded-2xl p-4 text-xs space-y-2.5 text-brand-dark/85">
              <div className="font-bold text-brand-plum text-[11px] uppercase tracking-wider font-mono">
                ✨ How Craftoria Custom Orders Work:
              </div>
              <div className="flex items-start gap-2 text-[11px]">
                <span className="font-bold text-brand-plum">1.</span>
                <span>Fill in your bespoke details & personalized text.</span>
              </div>
              <div className="flex items-start gap-2 text-[11px]">
                <span className="font-bold text-brand-plum">2.</span>
                <span>Submit to get instant confirmation on WhatsApp & Email, or Add directly to Cart.</span>
              </div>
              <div className="flex items-start gap-2 text-[11px]">
                <span className="font-bold text-brand-plum">3.</span>
                <span>Share your photo references or sketches in WhatsApp (+91 99088 60895).</span>
              </div>
            </div>

            {/* Decorative Vector Graphic */}
            <div className="pt-2 self-center lg:self-start opacity-70">
              <svg className="w-36 h-36 text-brand-purple" viewBox="0 0 120 120" fill="none">
                <path d="M40,110 C50,80 45,50 35,25" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                <path d="M60,110 C60,75 55,40 50,15" stroke="currentColor" strokeWidth="1.2" />
                <path d="M80,110 C70,80 75,55 85,30" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                <circle cx="35" cy="25" r="2.5" fill="currentColor" />
                <circle cx="33" cy="35" r="2.5" fill="currentColor" />
                <circle cx="38" cy="45" r="2" fill="currentColor" />
                <circle cx="48" cy="15" r="3" fill="currentColor" />
                <circle cx="52" cy="28" r="3" fill="currentColor" />
                <circle cx="50" cy="40" r="2.5" fill="currentColor" />
                <circle cx="85" cy="30" r="2.5" fill="currentColor" />
                <circle cx="82" cy="42" r="2" fill="currentColor" />
                <circle cx="87" cy="52" r="2.5" fill="currentColor" />
              </svg>
            </div>
          </motion.div>

          {/* Right Column: Custom Orders Questionnaire Form */}
          <motion.div
            initial={{ opacity: 0, x: 35 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7"
          >
            <div className="glass-card p-6 sm:p-9 rounded-[32px] relative overflow-hidden border border-brand-purple/20 shadow-md bg-white/70">
              <AnimatePresence mode="wait">
                {!isSubmitted ? (
                  <motion.form
                    key="custom-orders-form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handleSubmit}
                    noValidate
                    className="space-y-5 text-left"
                  >
                    {/* Header Banner */}
                    <div className="border-b border-brand-purple/15 pb-3.5 flex items-center justify-between">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-brand-plum font-mono">
                          Artisan Studio Questionnaire
                        </span>
                        <h3 className="font-serif text-lg sm:text-xl font-bold text-brand-dark">
                          Customize Your Custom Order
                        </h3>
                      </div>
                      <Sparkles className="w-5 h-5 text-brand-plum" />
                    </div>

                    {/* Section: Client Details */}
                    <div className="space-y-3">
                      <span className="text-[10px] font-bold text-brand-plum uppercase tracking-wider font-mono">
                        👤 Client Contact Details
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        {/* Name Input */}
                        <div className="flex flex-col">
                          <label htmlFor="custom-name" className="text-[11px] font-bold text-brand-dark/80 mb-1">
                            Your Name <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="custom-name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="e.g. Ananya Sharma"
                            className={`glass-input px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 w-full ${
                              errors.name ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500' : 'border-brand-purple/20'
                            }`}
                          />
                          {errors.name && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-rose-600 font-semibold mt-1">
                              <AlertCircle className="w-3 h-3" /> {errors.name}
                            </span>
                          )}
                        </div>

                        {/* Email Input */}
                        <div className="flex flex-col">
                          <label htmlFor="custom-email" className="text-[11px] font-bold text-brand-dark/80 mb-1">
                            Email Address <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="email"
                            id="custom-email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="e.g. ananya@example.com"
                            className={`glass-input px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 w-full ${
                              errors.email ? 'border-rose-400 bg-rose-50/40 focus:border-rose-500' : 'border-brand-purple/20'
                            }`}
                          />
                          {errors.email && (
                            <span className="inline-flex items-center gap-1 text-[10px] text-rose-600 font-semibold mt-1">
                              <AlertCircle className="w-3 h-3" /> {errors.email}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Phone Input */}
                      <div className="flex flex-col">
                        <label htmlFor="custom-phone" className="text-[11px] font-bold text-brand-dark/80 mb-1">
                          Mobile Number <span className="text-brand-dark/40 font-normal">(Optional, for WhatsApp updates)</span>
                        </label>
                        <input
                          type="tel"
                          id="custom-phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="e.g. 9908860895"
                          className={`glass-input px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 w-full ${
                            errors.phone ? 'border-rose-400 bg-rose-50/40' : 'border-brand-purple/20'
                          }`}
                        />
                        {errors.phone && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-rose-600 font-semibold mt-1">
                            <AlertCircle className="w-3 h-3" /> {errors.phone}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Step: Craft Category */}
                    <div className="space-y-1.5 pt-2 border-t border-brand-purple/10">
                      <label htmlFor="custom-productType" className="text-xs font-bold text-brand-dark flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-brand-plum" />
                        <span>Craft Category</span>
                      </label>
                      <div className="relative">
                        <select
                          id="custom-productType"
                          name="productType"
                          value={formData.productType}
                          onChange={handleChange}
                          className="glass-input px-3.5 py-2.5 rounded-xl text-xs transition-all duration-200 w-full appearance-none pr-10 cursor-pointer border-brand-purple/20 bg-white/90"
                        >
                          {CRAFT_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-plum text-[10px]">
                          ▼
                        </div>
                      </div>
                    </div>

                    {/* 1. Personalization Text / Monogram (Required) */}
                    <div className="space-y-1.5 pt-2 border-t border-brand-purple/10">
                      <label className="text-xs font-bold text-brand-dark flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-brand-plum" />
                          <span>1. Personalization Text / Monogram</span>
                        </span>
                        <span className="text-rose-500 font-normal text-[11px]">*Required</span>
                      </label>
                      <textarea
                        name="personalization"
                        value={formData.personalization}
                        onChange={handleChange}
                        placeholder="e.g. Names ('Aarav & Priya'), Monogram Initials ('S & R'), Special Date ('14.02.2026'), or Custom Quote / Message..."
                        rows={2}
                        className={`w-full text-xs p-3 rounded-2xl border bg-white/90 focus:outline-none focus:ring-2 focus:ring-brand-plum/30 transition-all resize-none leading-relaxed ${
                          errors.personalization ? 'border-rose-400 bg-rose-50/40' : 'border-brand-purple/20 focus:border-brand-purple'
                        }`}
                      />
                      {errors.personalization && (
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-rose-600">
                          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>{errors.personalization}</span>
                        </div>
                      )}
                      <p className="text-[10px] text-brand-dark/60 italic">
                        ✨ Our artisans hand-letter, stitch, or engrave this into your handcrafted order.
                      </p>
                    </div>

                    {/* 2. Occasion / Purpose */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-brand-dark flex items-center gap-1.5">
                        <Gift className="w-3.5 h-3.5 text-brand-plum" />
                        <span>2. Occasion / Purpose</span>
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {OCCASIONS.map((occ) => {
                          const isSelected = formData.occasion === occ;
                          return (
                            <button
                              key={occ}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, occasion: occ }))}
                              className={`px-2.5 py-1 rounded-full text-[10px] font-semibold cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-brand-plum text-white shadow-xs'
                                  : 'bg-white/80 border border-brand-purple/15 text-brand-dark/80 hover:bg-white hover:text-brand-plum'
                              }`}
                            >
                              {occ}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 3. Gift Note & Packaging Style */}
                    <div className="space-y-2.5 pt-2 border-t border-brand-purple/10">
                      <label className="text-xs font-bold text-brand-dark flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-brand-plum" />
                          <span>3. Gift Note & Packaging Style</span>
                        </span>
                        <span className="text-[10px] font-normal text-brand-dark/50">(Optional)</span>
                      </label>
                      
                      <textarea
                        name="giftNote"
                        value={formData.giftNote}
                        onChange={handleChange}
                        placeholder="Include a heartfelt handwritten gift note to your loved one (e.g. 'Happy Anniversary! Forever yours, Yash')..."
                        rows={2}
                        className="w-full text-xs p-2.5 rounded-xl border border-brand-purple/20 bg-white/90 focus:outline-none focus:border-brand-purple resize-none leading-relaxed"
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {PACKAGING_OPTIONS.map((pkg) => {
                          const isSelected = formData.packaging === pkg.label;
                          return (
                            <button
                              key={pkg.id}
                              type="button"
                              onClick={() => setFormData(prev => ({ ...prev, packaging: pkg.label }))}
                              className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-brand-purple/15 border-brand-plum ring-1 ring-brand-plum/40'
                                  : 'bg-white/70 border-brand-purple/15 hover:bg-white'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-bold text-brand-dark">{pkg.label}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-brand-plum" />}
                              </div>
                              <span className="text-[9px] text-brand-dark/65 block mt-0.5">{pkg.note}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 4. Special Artisan Instructions */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-brand-dark flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <HelpCircle className="w-3.5 h-3.5 text-brand-plum" />
                          <span>4. Special Artisan Instructions / Charm Requests</span>
                        </span>
                        <span className="text-[10px] font-normal text-brand-dark/50">(Optional)</span>
                      </label>
                      <textarea
                        name="specialNotes"
                        value={formData.specialNotes}
                        onChange={handleChange}
                        placeholder="Any specific requests? (e.g. 'Please place initials on the bottom right corner', 'Use golden brass clasp')..."
                        rows={2}
                        className="w-full text-xs p-2.5 rounded-xl border border-brand-purple/20 bg-white/90 focus:outline-none focus:border-brand-purple resize-none leading-relaxed"
                      />
                    </div>

                    {/* Photo Reference Tip via WhatsApp */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-emerald-500/5 border border-emerald-500/25 flex items-start gap-3 text-left">
                      <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <div className="text-[11px] leading-relaxed text-emerald-900">
                        <strong className="font-bold">Have photos or custom reference images?</strong>
                        <p className="text-emerald-800/85 mt-0.5">
                          You can share reference photos, portraits, or design sketches with our artisans directly on WhatsApp (<strong>+91 99088 60895</strong>) after submitting!
                        </p>
                      </div>
                    </div>

                    {/* Feedback when added to cart */}
                    {addedToCartSuccess && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-brand-plum text-xs font-semibold flex items-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-brand-plum" />
                        <span>Custom order successfully added to your cart!</span>
                      </motion.div>
                    )}

                    {/* Action Buttons: Send via WhatsApp & Email + Add to Cart */}
                    <div className="pt-3 flex flex-wrap sm:flex-nowrap gap-3 items-center justify-end">
                      <button
                        type="button"
                        onClick={handleAddToCart}
                        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white border border-brand-purple/30 text-brand-plum font-semibold text-xs uppercase tracking-wider hover:bg-brand-purple/10 hover:shadow-xs transition-all duration-300 w-full sm:w-auto cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Add Custom Order to Cart</span>
                      </button>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-full bg-brand-plum text-white font-semibold text-xs uppercase tracking-wider hover:bg-brand-violet hover:translate-y-[-1px] transition-all duration-300 shadow-md hover:shadow-lg w-full sm:w-auto cursor-pointer disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <span>Dispatching Request...</span>
                        ) : (
                          <>
                            <span>Send Custom Request</span>
                            <Send className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </motion.form>
                ) : (
                  <motion.div
                    key="success-message"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.96 }}
                    transition={{ duration: 0.4 }}
                    className="py-8 sm:py-10 flex flex-col items-center justify-center text-center space-y-4"
                  >
                    <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center border border-emerald-200 shadow-xs">
                      <CheckCircle2 className="w-7 h-7 text-emerald-600" />
                    </div>

                    <h3 className="font-serif text-2xl font-bold text-brand-dark">
                      Custom Request Sent Successfully! 🎉
                    </h3>

                    <p className="text-xs sm:text-sm text-brand-dark/80 max-w-md leading-relaxed">
                      Your custom design request has been sent to our email (<span className="font-semibold text-brand-plum">thecraftoriaaa26@gmail.com</span>) and WhatsApp (<span className="font-semibold text-brand-plum">+91 99088 60895</span>). Our artisan team will review your requirements and respond promptly!
                    </p>

                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-cream border border-brand-purple/20 text-xs font-semibold text-brand-plum">
                      <Sparkles className="w-3.5 h-3.5 text-brand-purple" />
                      <span>Artisan Commission Assigned</span>
                    </div>

                    <div className="pt-3 flex flex-wrap gap-3 items-center justify-center">
                      <a
                        href={`https://wa.me/${WHATSAPP_PHONE_NUMBER}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-emerald-600 text-white text-xs uppercase tracking-wider font-bold hover:bg-emerald-700 transition-all duration-200 shadow-sm cursor-pointer"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Chat on WhatsApp</span>
                      </a>

                      <button
                        onClick={() => setIsSubmitted(false)}
                        className="px-6 py-2.5 rounded-full border border-brand-purple/40 text-brand-plum text-xs uppercase tracking-wider font-bold hover:bg-brand-purple/10 transition-all duration-200 cursor-pointer"
                      >
                        Submit Another Request
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default Contact;
