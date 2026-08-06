import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, CheckCircle2, Sparkles } from 'lucide-react';
import { HibiscusFlower, WatercolorWash } from './PremiumBackground';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    productType: 'Resin Art',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      alert('Please fill out all fields.');
      return;
    }
    setIsSubmitted(true);
    setFormData({
      name: '',
      email: '',
      productType: 'Resin Art',
      message: '',
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <section id="contact" className="py-24 px-6 relative overflow-hidden border-t border-brand-purple/10">
      {/* Section Background Washes */}
      <WatercolorWash
        className="w-[500px] h-[500px] -left-16 bottom-[-5%]"
        gradientId="wash-contact-left"
        fromColor1="rgba(190, 154, 205, 0.20)" // stronger watercolor purple
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

      {/* Delicate floral/stem illustration framing the form area */}
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Heading and Lavender Illustration (span 5) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 text-left space-y-6 flex flex-col items-start"
          >
            <span className="text-xs font-semibold tracking-widest text-brand-plum uppercase">
              Bespoke Commission
            </span>
            <h2 className="font-serif text-3xl sm:text-4.5xl font-bold leading-tight text-brand-dark">
              Have a Custom <br className="hidden sm:inline" />
              Idea in Mind?
            </h2>
            <p className="text-xs sm:text-sm text-brand-dark/80 leading-relaxed font-normal max-w-sm">
              We'll craft a creation that matches your love, detail, and passion. Pick your colors, shapes, and personalized name plates.
            </p>
            
            <button
              onClick={() => {
                const inputEl = document.getElementById('form-name');
                if (inputEl) inputEl.focus();
              }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-brand-purple text-brand-plum text-xs font-semibold hover:bg-brand-purple hover:text-white transition-all duration-300 shadow-sm"
            >
              Request a Custom Order
            </button>

            {/* Hand-drawn lavender stems vector graphic representation */}
            <div className="pt-4 self-center lg:self-start opacity-70">
              <svg className="w-44 h-44 text-brand-purple" viewBox="0 0 120 120" fill="none">
                <path d="M40,110 C50,80 45,50 35,25" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                <path d="M60,110 C60,75 55,40 50,15" stroke="currentColor" strokeWidth="1.2" />
                <path d="M80,110 C70,80 75,55 85,30" stroke="currentColor" strokeWidth="1" strokeDasharray="3 3" />
                {/* Petals */}
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

          {/* Right Column: Form (span 7) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7"
          >
            <div className="glass-card p-8 sm:p-10 rounded-[32px] relative overflow-hidden border border-brand-purple/20 shadow-md">
              <AnimatePresence mode="wait">
                {!isSubmitted ? (
                  <motion.form
                    key="contact-form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    onSubmit={handleSubmit}
                    className="space-y-5 text-left"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      {/* Name Input */}
                      <div className="flex flex-col">
                        <label htmlFor="form-name" className="text-[10px] font-semibold text-brand-dark/70 uppercase tracking-wider mb-2">
                          Your Name
                        </label>
                        <input
                          type="text"
                          id="form-name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Enter your name"
                          className="glass-input px-4.5 py-3 rounded-xl text-xs transition-all duration-300 w-full"
                          required
                        />
                      </div>

                      {/* Email Input */}
                      <div className="flex flex-col">
                        <label htmlFor="form-email" className="text-[10px] font-semibold text-brand-dark/70 uppercase tracking-wider mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          id="form-email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="Enter your email"
                          className="glass-input px-4.5 py-3 rounded-xl text-xs transition-all duration-300 w-full"
                          required
                        />
                      </div>
                    </div>

                    {/* Product Type Select */}
                    <div className="flex flex-col">
                      <label htmlFor="form-productType" className="text-[10px] font-semibold text-brand-dark/70 uppercase tracking-wider mb-2">
                        Product Type
                      </label>
                      <div className="relative">
                        <select
                          id="form-productType"
                          name="productType"
                          value={formData.productType}
                          onChange={handleChange}
                          className="glass-input px-4.5 py-3 rounded-xl text-xs transition-all duration-300 w-full appearance-none pr-10 cursor-pointer"
                        >
                          <option value="Resin Art">Resin Art (Serving Trays, Coasters, Clocks)</option>
                          <option value="Handmade Decor">Handmade Decor (Macrame, Botanical Frames)</option>
                          <option value="Clay Crafts">Clay Crafts (Earrings, Planters, Ornaments)</option>
                          <option value="Custom Gifts">Custom Gift Hampers & Personal Boxes</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-brand-purple/70 text-[9px]">
                          ▼
                        </div>
                      </div>
                    </div>

                    {/* Message Input */}
                    <div className="flex flex-col">
                      <label htmlFor="form-message" className="text-[10px] font-semibold text-brand-dark/70 uppercase tracking-wider mb-2">
                        Message
                      </label>
                      <textarea
                        id="form-message"
                        name="message"
                        rows="4"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Describe your design idea, color requirements, or preferred delivery date..."
                        className="glass-input px-4.5 py-3 rounded-xl text-xs transition-all duration-300 w-full resize-none"
                        required
                      />
                    </div>

                    {/* Submit button */}
                    <div className="pt-2 text-right">
                      <button
                        type="submit"
                        className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full bg-brand-plum text-white font-semibold text-xs uppercase tracking-wider hover:bg-brand-violet hover:translate-y-[-1px] transition-all duration-300 shadow-md hover:shadow-lg w-full sm:w-auto cursor-pointer"
                      >
                        <span>Send Message</span>
                        <Send className="w-3.5 h-3.5" />
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
                    className="py-10 flex flex-col items-center justify-center text-center space-y-5"
                  >
                    <div className="w-16 h-16 rounded-full bg-brand-pink/30 flex items-center justify-center border border-brand-purple/15">
                      <CheckCircle2 className="w-8 h-8 text-brand-plum" />
                    </div>

                    <h3 className="font-serif text-xl sm:text-2xl font-bold text-brand-dark">
                      Thank You!
                    </h3>

                    <p className="text-xs sm:text-sm text-brand-dark/80 max-w-sm leading-relaxed">
                      Your request has been noted. Craftoria will contact you soon.
                    </p>

                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-brand-cream/80 border border-brand-purple/15 text-[10px] font-semibold text-brand-plum">
                      <Sparkles className="w-3 h-3 text-brand-purple" />
                      <span>We will reach out to you via email in 24 hours</span>
                    </div>

                    <button
                      onClick={() => setIsSubmitted(false)}
                      className="mt-4 px-5 py-2 rounded-full border border-brand-purple/35 text-brand-plum text-[10px] uppercase tracking-wider font-bold hover:bg-brand-purple/10 transition-all duration-300"
                    >
                      Send Another Request
                    </button>
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
