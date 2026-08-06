import { Sparkles, Instagram, Facebook, Mail, Heart } from 'lucide-react';
import { HibiscusFlower } from './PremiumBackground';

const Footer = () => {
  const handleScroll = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer className="border-t border-brand-purple/15 mt-16 py-12 px-6 relative overflow-hidden text-brand-dark" style={{ background: "rgba(252, 248, 252, 0.90)" }}>
      {/* Subtle floral corner line arts in the footer */}
      <HibiscusFlower
        className="w-[200px] h-[200px] left-[-30px] bottom-[-30px]"
        stroke="#76558F"
        opacity={0.35}
        style={{ transform: "rotate(-10deg)" }}
      />
      <HibiscusFlower
        className="w-[220px] h-[220px] right-[-30px] top-[-30px]"
        stroke="rgba(255, 255, 255, 0.72)"
        opacity={0.65}
        style={{ transform: "rotate(25deg)" }}
      />

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-start relative z-10">
        {/* Brand Information Column */}
        <div className="md:col-span-6 flex flex-col items-start text-left space-y-4">
          <a href="#home" onClick={(e) => handleScroll(e, 'home')} className="flex items-center gap-2 group">
            <Sparkles className="w-5 h-5 text-brand-plum" />
            <span className="font-serif text-xl font-bold tracking-wide text-brand-dark">
              Craftoria
            </span>
          </a>
          <p className="text-sm text-brand-dark/70 max-w-sm leading-relaxed">
            Handcrafted creations crafted with love and elegance. Bringing timeless artistry, warmth, and personality into your modern spaces.
          </p>
        </div>

        {/* Quick Links Column */}
        <div className="md:col-span-3 flex flex-col items-start text-left space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-plum">
            Quick Links
          </h4>
          <nav className="flex flex-col gap-2">
            <a
              href="#home"
              onClick={(e) => handleScroll(e, 'home')}
              className="text-sm text-brand-dark/75 hover:text-brand-violet transition-colors duration-200"
            >
              Home
            </a>
            <a
              href="#about"
              onClick={(e) => handleScroll(e, 'about')}
              className="text-sm text-brand-dark/75 hover:text-brand-violet transition-colors duration-200"
            >
              About
            </a>
            <a
              href="#collections"
              onClick={(e) => handleScroll(e, 'collections')}
              className="text-sm text-brand-dark/75 hover:text-brand-violet transition-colors duration-200"
            >
              Collections
            </a>
            <a
              href="#contact"
              onClick={(e) => handleScroll(e, 'contact')}
              className="text-sm text-brand-dark/75 hover:text-brand-violet transition-colors duration-200"
            >
              Contact
            </a>
          </nav>
        </div>

        {/* Social Presence Column */}
        <div className="md:col-span-3 flex flex-col items-start text-left space-y-4">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-brand-plum">
            Connect With Us
          </h4>
          <div className="flex gap-4">
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-brand-cream/80 border border-brand-purple/20 flex items-center justify-center text-brand-plum hover:bg-brand-purple hover:text-white hover:translate-y-[-2px] transition-all duration-300 shadow-sm"
              aria-label="Follow us on Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-brand-cream/80 border border-brand-purple/20 flex items-center justify-center text-brand-plum hover:bg-brand-purple hover:text-white hover:translate-y-[-2px] transition-all duration-300 shadow-sm"
              aria-label="Like us on Facebook"
            >
              <Facebook className="w-4 h-4" />
            </a>
            <a
              href="mailto:hello@craftoria.com"
              className="w-9 h-9 rounded-full bg-brand-cream/80 border border-brand-purple/20 flex items-center justify-center text-brand-plum hover:bg-brand-purple hover:text-white hover:translate-y-[-2px] transition-all duration-300 shadow-sm"
              aria-label="Email Craftoria support"
            >
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="max-w-7xl mx-auto border-t border-brand-purple/10 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-brand-dark/50 gap-4">
        <span>© 2026 Craftoria. All rights reserved.</span>
        <span className="inline-flex items-center gap-1">
          Designed with <Heart className="w-3.5 h-3.5 text-brand-purple fill-brand-purple" /> for artisan boutiques.
        </span>
      </div>
    </footer>
  );
};

export default Footer;
