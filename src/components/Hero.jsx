import { motion } from 'framer-motion';
import { Heart, Sparkles, ArrowRight, Paintbrush } from 'lucide-react';
import heroCraftShowcase from '../assets/hero-craft-showcase.jpg';
import { useRouter } from '../context/RouterContext';

const Hero = () => {
  const { navigate } = useRouter();

  return (
    <section
      id="home"
      className="min-h-[580px] lg:min-h-[calc(100vh-80px)] lg:max-h-[760px] flex items-center justify-center pt-28 sm:pt-32 pb-14 sm:pb-20 px-4 sm:px-6 relative overflow-hidden scroll-mt-20 sm:scroll-mt-24"
    >
      {/* Soft lavender/pink glow blobs behind the hero text and hero visual */}
      <div 
        className="absolute top-[20%] left-[8%] w-80 h-80 rounded-full -z-10 pointer-events-none" 
        style={{ background: 'radial-gradient(circle, rgba(200, 162, 200, 0.22) 0%, transparent 70%)', contain: 'strict' }}
      />
      {/* Overlapping glows behind the card visual for atmospheric integration */}
      <div 
        className="absolute top-[12%] right-[2%] w-[420px] h-[420px] rounded-full -z-10 pointer-events-none" 
        style={{ background: 'radial-gradient(circle, rgba(200, 162, 200, 0.18) 0%, transparent 70%)', contain: 'strict' }}
      />
      <div 
        className="absolute top-[28%] right-[5%] w-[380px] h-[380px] rounded-full -z-10 pointer-events-none" 
        style={{ background: 'radial-gradient(circle, rgba(246, 221, 235, 0.20) 0%, transparent 70%)', contain: 'strict' }}
      />

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-12 lg:gap-16 items-center relative z-10">
        {/* Left Content Column */}
        <div className="lg:col-span-7 flex flex-col items-start text-left">
          {/* Badge */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-cream/80 border border-brand-purple/20 shadow-sm text-xs font-semibold tracking-wider text-brand-plum mb-4 sm:mb-6"
          >
            <span className="text-[10px] uppercase font-serif tracking-widest flex items-center gap-1.5">
              Handmade with passion <Heart className="w-3 h-3 text-brand-purple fill-brand-purple inline" />
            </span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif text-3xl sm:text-5xl md:text-6.5xl font-bold leading-[1.2] sm:leading-[1.12] text-brand-dark mb-4 sm:mb-6 tracking-tight"
          >
            Handmade Happiness, <br />
            <span className="text-brand-plum italic font-normal">from Our Hands to</span> <br />
            <span className="text-brand-plum italic font-normal">Your Heart</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="text-xs sm:text-base md:text-lg text-brand-dark/80 font-normal leading-relaxed mb-6 sm:mb-8 max-w-lg"
          >
            Discover unique handmade creations designed with passion, detail, and timeless beauty. Bring warmth and personality into your space.
          </motion.p>

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8 w-full sm:w-auto"
          >
            <button
              onClick={() => navigate('/collections')}
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 rounded-full bg-brand-plum text-white font-semibold hover:bg-brand-violet hover:translate-y-[-2px] transition-all duration-300 shadow-md hover:shadow-lg text-xs uppercase tracking-wider cursor-pointer h-12"
            >
              <span>Explore Collection</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => navigate('/customize')}
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-7 py-3.5 rounded-full bg-brand-cream/70 border border-brand-purple/35 text-brand-plum font-semibold hover:bg-brand-purple/10 hover:translate-y-[-2px] transition-all duration-300 text-xs uppercase tracking-wider cursor-pointer h-12"
            >
              <Paintbrush className="w-4 h-4 text-brand-purple" />
              <span>Custom Orders</span>
            </button>
          </motion.div>
        </div>

        {/* Right Content Column (Artistic Mockup Representation) */}
        <div className="lg:col-span-5 relative w-full h-[320px] sm:h-[450px] lg:h-[500px] flex items-center justify-center">
          {/* Main Watercolor Backdrop Frame */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="w-full h-full glass-card rounded-[32px] sm:rounded-[40px] overflow-hidden p-4 sm:p-6 flex items-center justify-center relative border border-brand-purple/15 shadow-[0_24px_70px_rgba(75,46,93,0.08)]"
          >
            {/* Main visual focus: actual uploaded craft image (contain, not cover, no cropping) */}
            <div className="w-full h-full relative flex items-center justify-center">
              <div className="absolute w-[80%] h-[75%] rounded-full bg-brand-pink/20 blur-3xl top-[5%] left-[5%] pointer-events-none" />
              <div className="absolute w-[70%] h-[65%] rounded-full bg-brand-purple/15 blur-3xl bottom-[5%] right-[5%] pointer-events-none" />
              
              {/* Radial fading mask-image container to blend square edges into glass card */}
              <div 
                className="w-full h-full relative z-10 flex items-center justify-center overflow-hidden rounded-[24px] sm:rounded-[32px] opacity-[0.95]"
                style={{
                  maskImage: 'radial-gradient(circle at center, black 58%, rgba(0,0,0,0.75) 72%, rgba(0,0,0,0.22) 88%, transparent 100%)',
                  WebkitMaskImage: 'radial-gradient(circle at center, black 58%, rgba(0,0,0,0.75) 72%, rgba(0,0,0,0.22) 88%, transparent 100%)'
                }}
              >
                <img 
                  src={heroCraftShowcase} 
                  alt="Handmade pipe cleaner and crochet craft ornaments" 
                  className="w-full h-full object-contain object-center rounded-[20px] sm:rounded-[24px]"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                />
              </div>
            </div>
          </motion.div>

          {/* Floating badge details */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: -20 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-2 sm:left-[-25px] bottom-3 sm:bottom-10 z-20"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              style={{ willChange: 'transform' }}
              className="glass-card px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-2xl border border-brand-purple/20 shadow-md flex items-center gap-2 sm:gap-2.5 bg-white/90"
            >
              <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-brand-pink/40 flex items-center justify-center">
                <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-brand-plum" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider text-brand-plum">Handcrafted</span>
                <span className="text-[7.5px] sm:text-[8px] text-brand-dark/70 font-medium">Made with chenille stems</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
