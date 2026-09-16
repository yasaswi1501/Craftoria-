import { motion } from 'framer-motion';
import { Sparkles, ArrowLeft, Home, ShoppingBag, Compass } from 'lucide-react';
import { useRouter } from '../context/RouterContext';
import { HibiscusFlower, WatercolorWash } from './PremiumBackground';

const NotFound = () => {
  const { navigate } = useRouter();

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-6 py-20 relative overflow-hidden text-brand-dark">
      {/* Background Decorative Ambient Washes */}
      <WatercolorWash
        className="w-[450px] h-[450px] -left-20 top-[10%]"
        gradientId="wash-404-left"
        fromColor1="rgba(214, 185, 225, 0.20)"
        fromColor2="rgba(233, 207, 228, 0.15)"
        fromColor3="transparent"
      />
      <WatercolorWash
        className="w-[500px] h-[500px] -right-20 bottom-[10%]"
        gradientId="wash-404-right"
        fromColor1="rgba(190, 154, 205, 0.22)"
        fromColor2="rgba(214, 185, 225, 0.14)"
        fromColor3="transparent"
      />

      {/* Decorative Botanical Illustrations */}
      <HibiscusFlower
        className="w-[280px] h-[280px] left-[-40px] bottom-[-20px]"
        stroke="#76558F"
        opacity={0.45}
        style={{ transform: "rotate(-20deg)" }}
      />
      <HibiscusFlower
        className="w-[300px] h-[300px] right-[-40px] top-[-30px]"
        stroke="rgba(255, 255, 255, 0.75)"
        opacity={0.70}
        style={{ transform: "rotate(35deg)" }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="max-w-xl w-full glass-card rounded-[36px] p-8 sm:p-12 text-center border border-brand-purple/20 shadow-[0_20px_60px_rgba(75,46,93,0.10)] relative z-10 my-8"
      >
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-cream/80 border border-brand-purple/20 text-xs font-semibold tracking-wider text-brand-plum mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-brand-purple animate-pulse" />
          <span className="text-[10px] uppercase font-mono tracking-widest">404 Error</span>
        </div>

        {/* Large 404 Headline */}
        <h1 className="font-serif text-6xl sm:text-7xl font-bold text-brand-dark tracking-tight mb-2">
          404
        </h1>
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-brand-plum mb-4">
          Piece of Art Not Found
        </h2>

        <p className="text-xs sm:text-sm text-brand-dark/75 leading-relaxed max-w-md mx-auto mb-8">
          The page you are looking for might have been moved, renamed, or is temporarily unavailable. Let's guide you back to our handmade collections.
        </p>

        {/* Navigation Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-brand-plum hover:bg-brand-violet text-white font-semibold text-xs uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </button>
          
          <button
            onClick={() => navigate('/#bestsellers')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-white/70 hover:bg-white border border-brand-purple/30 text-brand-plum font-semibold text-xs uppercase tracking-wider transition-all duration-300 shadow-xs cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 text-brand-purple" />
            <span>Explore Collections</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;
