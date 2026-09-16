import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle2, Sparkles, Mail, Phone, AlertCircle, MessageCircle } from 'lucide-react';
import { HibiscusFlower, WatercolorWash } from './PremiumBackground';
import { sendCustomRequestToWhatsApp, sendCustomRequestEmail, TARGET_CONTACT_EMAIL, WHATSAPP_PHONE_NUMBER } from '../utils/whatsapp';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    productType: 'Craftoria Bloom Bouquets',
    message: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateEmail = (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);

  const validateForm = () => {
    const errs = {};
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

    if (!formData.message.trim()) {
      errs.message = 'Please describe your custom order requirements.';
    } else if (formData.message.trim().length < 10) {
      errs.message = 'Please provide a little more detail (at least 10 characters).';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

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
      setFormData({
        name: '',
        email: '',
        phone: '',
        productType: 'Craftoria Bloom Bouquets',
        message: '',
      });
      setErrors({});
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <section id="contact" className="py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden border-t border-brand-purple/10">
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
          
          {/* Left Column: Heading, Details & Direct Contacts */}
          <motion.div
            initial={{ opacity: 0, x: -35 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 text-left space-y-4 sm:space-y-6 flex flex-col items-start"
          >
            <span className="text-xs font-semibold tracking-widest text-brand-plum uppercase font-mono">
              Bespoke Commission
            </span>
            <h2 className="font-serif text-2.5xl sm:text-4.5xl font-bold leading-tight text-brand-dark">
              Have a Custom <br className="hidden sm:inline" />
              Idea in Mind?
            </h2>
            <p className="text-xs sm:text-sm text-brand-dark/80 leading-relaxed font-normal max-w-sm">
              We'll handcraft a personalized piece that matches your imagination. Pick your colors, shapes, personalized names, and special celebration themes.
            </p>
            
            {/* Direct Clickable Contact Cards */}
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto pt-2">
              <a
                href="mailto:thecraftoriaaa26@gmail.com"
                className="inline-flex items-center gap-2.5 px-4.5 py-2.5 rounded-2xl bg-white/70 hover:bg-white border border-brand-purple/20 text-brand-plum text-xs font-semibold shadow-xs transition-all duration-200"
              >
                <div className="w-6 h-6 rounded-full bg-brand-purple/15 flex items-center justify-center">
                  <Mail className="w-3.5 h-3.5 text-brand-plum" />
                </div>
                <span>thecraftoriaaa26@gmail.com</span>
              </a>

              <a
                href="tel:+919908860895"
                className="inline-flex items-center gap-2.5 px-4.5 py-2.5 rounded-2xl bg-white/70 hover:bg-white border border-brand-purple/20 text-brand-plum text-xs font-semibold shadow-xs transition-all duration-200"
              >
                <div className="w-6 h-6 rounded-full bg-brand-purple/15 flex items-center justify-center">
                  <Phone className="w-3.5 h-3.5 text-brand-plum" />
                </div>
                <span>+91 99088 60895</span>
              </a>
            </div>

            {/* Hand-drawn lavender stems vector graphic representation */}
            <div className="pt-2 self-center lg:self-start opacity-70">
              <svg className="w-40 h-40 text-brand-purple" viewBox="0 0 120 120" fill="none">
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

          {/* Right Column: Form with Validation & Feedback */}
          <motion.div
            initial={{ opacity: 0, x: 35 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7"
          >
            <div className="glass-card p-5 sm:p-10 rounded-[24px] sm:rounded-[32px] relative overflow-hidden border border-brand-purple/20 shadow-md">
              <AnimatePresence mode="wait">
                {!isSubmitted ? (
                  <motion.form
                    key="contact-form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    onSubmit={handleSubmit}
                    noValidate
                    className="space-y-4 sm:space-y-5 text-left"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      {/* Name Input */}
                      <div className="flex flex-col">
                        <label htmlFor="form-name" className="text-[10px] font-bold text-brand-dark/75 uppercase tracking-wider mb-1.5">
                          Your Name <span className="text-brand-plum">*</span>
                        </label>
                        <input
                          type="text"
                          id="form-name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="e.g. Ananya Sharma"
                          className={`glass-input px-4 py-3 rounded-xl text-xs sm:text-sm transition-all duration-200 w-full ${
                            errors.name ? 'border-red-400 bg-red-50/40 focus:border-red-500' : ''
                          }`}
                        />
                        {errors.name && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-red-600 font-semibold mt-1">
                            <AlertCircle className="w-3 h-3" /> {errors.name}
                          </span>
                        )}
                      </div>

                      {/* Email Input */}
                      <div className="flex flex-col">
                        <label htmlFor="form-email" className="text-[10px] font-bold text-brand-dark/75 uppercase tracking-wider mb-1.5">
                          Email Address <span className="text-brand-plum">*</span>
                        </label>
                        <input
                          type="email"
                          id="form-email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="e.g. ananya@example.com"
                          className={`glass-input px-4 py-3 rounded-xl text-xs sm:text-sm transition-all duration-200 w-full ${
                            errors.email ? 'border-red-400 bg-red-50/40 focus:border-red-500' : ''
                          }`}
                        />
                        {errors.email && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-red-600 font-semibold mt-1">
                            <AlertCircle className="w-3 h-3" /> {errors.email}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                      {/* Phone Input (Optional) */}
                      <div className="flex flex-col">
                        <label htmlFor="form-phone" className="text-[10px] font-bold text-brand-dark/75 uppercase tracking-wider mb-1.5">
                          Mobile Number <span className="text-brand-dark/40 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="tel"
                          id="form-phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          placeholder="10-digit mobile number"
                          className={`glass-input px-4 py-3 rounded-xl text-xs sm:text-sm transition-all duration-200 w-full ${
                            errors.phone ? 'border-red-400 bg-red-50/40' : ''
                          }`}
                        />
                        {errors.phone && (
                          <span className="inline-flex items-center gap-1 text-[10px] text-red-600 font-semibold mt-1">
                            <AlertCircle className="w-3 h-3" /> {errors.phone}
                          </span>
                        )}
                      </div>

                      {/* Product Type Select */}
                      <div className="flex flex-col">
                        <label htmlFor="form-productType" className="text-[10px] font-bold text-brand-dark/75 uppercase tracking-wider mb-1.5">
                          Craft Category
                        </label>
                        <div className="relative">
                          <select
                            id="form-productType"
                            name="productType"
                            value={formData.productType}
                            onChange={handleChange}
                            className="glass-input px-4 py-3 rounded-xl text-xs sm:text-sm transition-all duration-200 w-full appearance-none pr-10 cursor-pointer"
                          >
                            <option value="Craftoria Bloom Bouquets">Craftoria Bloom Bouquets (Chenille Stem Flowers)</option>
                            <option value="Embroidery">Embroidery Hoops & Apparel (Couples, Names, Floral)</option>
                            <option value="Photo Frames">Handmade Photo Frames & Canvases</option>
                            <option value="Keychains">Keychains & Bag Charms</option>
                            <option value="Polaroids">Aesthetic Polaroids & Music Strips</option>
                            <option value="Home Decor">Home Decor (Fridge Magnets & Flower Vases)</option>
                            <option value="Accessories">Accessories (Clips, Scrunchies & Barrettes)</option>
                          </select>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-plum text-[10px]">
                            ▼
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Message Input */}
                    <div className="flex flex-col">
                      <label htmlFor="form-message" className="text-[10px] font-bold text-brand-dark/75 uppercase tracking-wider mb-1.5">
                        Design Details & Requirements <span className="text-brand-plum">*</span>
                      </label>
                      <textarea
                        id="form-message"
                        name="message"
                        rows="4"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Describe your desired colors, custom names, event date, or reference ideas..."
                        className={`glass-input px-4 py-3 rounded-xl text-xs sm:text-sm transition-all duration-200 w-full resize-none ${
                          errors.message ? 'border-red-400 bg-red-50/40 focus:border-red-500' : ''
                        }`}
                      />
                      {errors.message && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-red-600 font-semibold mt-1">
                          <AlertCircle className="w-3 h-3" /> {errors.message}
                        </span>
                      )}
                    </div>

                    {/* Submit button */}
                    <div className="pt-2 text-right">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-brand-plum text-white font-semibold text-xs uppercase tracking-wider hover:bg-brand-violet hover:translate-y-[-1px] transition-all duration-300 shadow-md hover:shadow-lg w-full sm:w-auto cursor-pointer disabled:opacity-50"
                      >
                        {isSubmitting ? (
                          <span>Sending to WhatsApp & Email...</span>
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
                      Request Sent Successfully! 🎉
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
