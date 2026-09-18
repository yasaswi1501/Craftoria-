import { Sparkles, Instagram, Mail, Heart, Phone, MapPin } from 'lucide-react';
import { HibiscusFlower } from './PremiumBackground';
import { useRouter } from '../context/RouterContext';
import { useSettings } from '../context/SettingsContext';
import { formatPhoneForDisplay } from '../utils/whatsapp';

const Footer = () => {
  const { navigate } = useRouter();
  const { whatsappNumber } = useSettings();
  const contactPhone = formatPhoneForDisplay(whatsappNumber);

  const handleLinkNavigation = (e, href) => {
    e.preventDefault();
    if (window.location.pathname !== '/') {
      navigate('/' + href);
    } else {
      const targetId = href.replace('#', '');
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <footer className="border-t border-brand-purple/15 pt-12 sm:pt-16 pb-16 sm:pb-24 px-4 sm:px-6 relative overflow-hidden text-brand-dark pb-safe bg-white/40 backdrop-blur-xs">
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
        <div className="md:col-span-5 flex flex-col items-start text-left space-y-4">
          <a href="#home" onClick={(e) => handleLinkNavigation(e, '#home')} className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-brand-purple/15 flex items-center justify-center group-hover:bg-brand-purple/25 transition-colors">
              <Sparkles className="w-4 h-4 text-brand-plum" />
            </div>
            <span className="font-serif text-xl font-bold tracking-wide text-brand-dark">
              Craftoria
            </span>
          </a>
          <p className="text-xs sm:text-sm text-brand-dark/75 max-w-sm leading-relaxed">
            Handcrafted creations crafted with love, dedication, and elegance. Bringing timeless artisanal beauty, chenille bouquets, and personalized memory gifts into your home.
          </p>
          <div className="flex items-center gap-2 text-xs text-brand-dark/70 font-medium">
            <MapPin className="w-3.5 h-3.5 text-brand-plum flex-shrink-0" />
            <span>Visakhapatnam, India</span>
          </div>
        </div>

        {/* Quick Links Column */}
        <div className="md:col-span-3 flex flex-col items-start text-left space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-widest text-brand-plum font-mono">
            Quick Links
          </h4>
          <nav className="flex flex-col gap-2.5">
            <a
              href="#home"
              onClick={(e) => handleLinkNavigation(e, '#home')}
              className="text-xs sm:text-sm text-brand-dark/75 hover:text-brand-violet transition-colors duration-200"
            >
              Home
            </a>
            <a
              href="#about"
              onClick={(e) => handleLinkNavigation(e, '#about')}
              className="text-xs sm:text-sm text-brand-dark/75 hover:text-brand-violet transition-colors duration-200"
            >
              About Us
            </a>
            <a
              href="/collections"
              onClick={(e) => {
                e.preventDefault();
                navigate('/collections');
              }}
              className="text-xs sm:text-sm text-brand-dark/75 hover:text-brand-violet transition-colors duration-200"
            >
              Explore Collections
            </a>
            <a
              href="#gallery"
              onClick={(e) => handleLinkNavigation(e, '#gallery')}
              className="text-xs sm:text-sm text-brand-dark/75 hover:text-brand-violet transition-colors duration-200"
            >
              Artisan Gallery
            </a>
            <a
              href="#contact"
              onClick={(e) => handleLinkNavigation(e, '#contact')}
              className="text-xs sm:text-sm text-brand-dark/75 hover:text-brand-violet transition-colors duration-200"
            >
              Bespoke Commissions
            </a>
          </nav>
        </div>

        {/* Contact & Customer Support Column */}
        <div className="md:col-span-4 flex flex-col items-start text-left space-y-3.5">
          <h4 className="text-xs font-bold uppercase tracking-widest text-brand-plum font-mono">
            Contact & Support
          </h4>
          
          <div className="flex flex-col gap-2 text-xs sm:text-sm">
            {/* Clickable Phone Number */}
            <a
              href={contactPhone.tel}
              className="inline-flex items-center gap-2.5 text-brand-dark/80 hover:text-brand-plum font-semibold transition-colors group"
            >
              <div className="w-7 h-7 rounded-full bg-brand-purple/10 flex items-center justify-center group-hover:bg-brand-purple/20 transition-colors">
                <Phone className="w-3.5 h-3.5 text-brand-plum" />
              </div>
              <span>{contactPhone.display}</span>
            </a>

            {/* Clickable Email Address */}
            <a
              href="mailto:thecraftoriaaa26@gmail.com"
              className="inline-flex items-center gap-2.5 text-brand-dark/80 hover:text-brand-plum font-semibold transition-colors group"
            >
              <div className="w-7 h-7 rounded-full bg-brand-purple/10 flex items-center justify-center group-hover:bg-brand-purple/20 transition-colors">
                <Mail className="w-3.5 h-3.5 text-brand-plum" />
              </div>
              <span>thecraftoriaaa26@gmail.com</span>
            </a>
          </div>

          <div className="pt-2">
            <span className="text-[10px] uppercase font-bold text-brand-plum/70 tracking-wider block mb-2">
              Follow Our Art
            </span>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/_.craftoria._26?stkn=MTlvZTVvaWJnNmdoaQ=="
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-full bg-brand-cream/90 border border-brand-purple/20 flex items-center justify-center text-brand-plum hover:bg-brand-purple hover:text-white hover:translate-y-[-2px] transition-all duration-300 shadow-xs"
                aria-label="Follow us on Instagram @_.craftoria._26"
              >
                <Instagram className="w-3.5 h-3.5" />
              </a>
              <a
                href="mailto:thecraftoriaaa26@gmail.com"
                className="w-8 h-8 rounded-full bg-brand-cream/90 border border-brand-purple/20 flex items-center justify-center text-brand-plum hover:bg-brand-purple hover:text-white hover:translate-y-[-2px] transition-all duration-300 shadow-xs"
                aria-label="Email Craftoria support"
              >
                <Mail className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="max-w-7xl mx-auto border-t border-brand-purple/10 mt-12 pt-8 pb-6 sm:pb-8 flex flex-col sm:flex-row items-center justify-between text-xs text-brand-dark/70 gap-4 text-center sm:text-left">
        <span>© 2026 Yasaswi Vadrevu. All rights reserved.</span>
        <span className="inline-flex items-center gap-1">
          Handcrafted with <Heart className="w-3.5 h-3.5 text-brand-purple fill-brand-purple" /> for art lovers everywhere.
        </span>
      </div>
    </footer>
  );
};

export default Footer;
