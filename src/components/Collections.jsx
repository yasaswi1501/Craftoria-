import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useRouter } from '../context/RouterContext';
import { collectionsData } from '../data/products';
import { getImageByFilename } from '../utils/getProductImage';

const Collections = () => {
  const { navigate } = useRouter();

  return (
    <div className="min-h-screen bg-[#FDFBFD] pt-20 sm:pt-24 pb-16 px-3.5 sm:px-6 lg:px-8 text-brand-dark max-w-[1250px] mx-auto text-left">
      {/* Breadcrumb */}
      <div className="mb-4 sm:mb-6 flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-xs font-semibold text-brand-plum">
        <a
          href="/"
          className="inline-flex items-center gap-1.5 hover:underline focus:outline-none"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </a>
        <div className="text-brand-dark/50 select-none text-[11px] sm:text-xs">
          Home <span className="mx-1">/</span> <span className="text-brand-plum font-bold">Collections</span>
        </div>
      </div>

      {/* Header */}
      <div className="border-b border-brand-purple/10 pb-4 sm:pb-6 mb-8 sm:mb-10 text-left">
        <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-brand-plum font-mono">Artisan Catalog</span>
        <h1 className="font-serif text-2.5xl sm:text-4xl font-bold mt-1 text-brand-dark">All Collections</h1>
        <p className="text-xs sm:text-sm text-brand-dark/70 font-medium leading-relaxed max-w-2xl mt-2">
          Every Craftoria category, hand-picked and organized. Explore a collection to browse ready-made pieces, or commission a fully custom design.
        </p>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-8">
        {collectionsData.map((col, idx) => (
          <motion.div
            key={col.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: 0.4, delay: idx * 0.04, ease: 'easeOut' }}
            whileHover={{ y: -6, transition: { duration: 0.2 } }}
            onClick={() => navigate(`/collections/${col.id}`)}
            className="flex flex-col w-full h-full bg-white/80 rounded-3xl border border-brand-purple/15 shadow-xs hover:shadow-lg hover:border-brand-purple/35 overflow-hidden group cursor-pointer transition-all duration-200"
          >
            <div className="w-full relative pb-[70%] h-0 overflow-hidden border-b border-brand-purple/5">
              <img
                src={getImageByFilename(col.image)}
                alt={col.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
                loading="lazy"
                decoding="async"
              />
            </div>

            <div className="p-5 flex-1 flex flex-col text-left">
              <span className="text-[9px] font-bold text-brand-plum/85 uppercase tracking-widest font-mono block mb-1">
                COLLECTION &middot; {col.count} {col.count === 1 ? 'PIECE' : 'PIECES'}
              </span>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-brand-dark leading-tight group-hover:text-brand-plum transition-colors mb-2">
                {col.name}
              </h3>
              <p className="text-xs sm:text-sm text-brand-dark/70 font-medium leading-relaxed line-clamp-3">
                {col.desc}
              </p>

              <div className="flex-1" />

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/collections/${col.id}`);
                }}
                className="inline-flex items-center justify-center gap-1.5 py-2.5 px-5 rounded-full bg-[#4F3060] hover:bg-[#683b8a] text-white font-semibold text-[10px] sm:text-xs uppercase tracking-wider transition-colors duration-200 cursor-pointer w-fit mt-4 focus:outline-none shadow-xs hover:shadow-md"
              >
                <span>Explore</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Custom Orders Callout */}
      <div className="mt-10 sm:mt-14 glass-card rounded-[24px] sm:rounded-[32px] border border-brand-purple/25 shadow-sm bg-gradient-to-br from-white via-brand-cream/40 to-brand-purple/10 p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
        <div className="w-14 h-14 rounded-full bg-brand-purple/15 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-6 h-6 text-brand-plum" />
        </div>
        <div className="flex-grow">
          <h3 className="font-serif text-lg sm:text-xl font-bold text-brand-dark mb-1">Can't find exactly what you're picturing?</h3>
          <p className="text-xs sm:text-sm text-brand-dark/70 leading-relaxed">
            Pick a category and commission a fully custom, hand-crafted piece designed around your story.
          </p>
        </div>
        <button
          onClick={() => navigate('/customize')}
          className="flex-shrink-0 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-brand-plum hover:bg-brand-violet text-white font-semibold text-xs uppercase tracking-wider transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer h-11"
        >
          <span>Start Customizing</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Collections;
