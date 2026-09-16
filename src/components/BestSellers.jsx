import { motion } from 'framer-motion';
import { useRouter } from '../context/RouterContext';
import { HibiscusFlower } from './PremiumBackground';

import sellerMemoryCanvas from '../assets/seller-memory-canvas.png';
import sellerEmbroideryHoop from '../assets/seller-embroidery-hoop.png';
import sellerBloomKeychains from '../assets/seller-bloom-keychains.png';
import coverPolaroids from '../assets/polaroids-new.jpg';
import coverClips from '../assets/clips-rubber-bands.jpg';
import coverMacrame from '../assets/macrame-wall-hanging.jpg';
import sellerBloomBouquets from '../assets/seller-bloom-bouquets.png';
import coverBouquets from '../assets/bloom-bouquets-cover.jpg';

const BestSellers = () => {
  const { navigate } = useRouter();

  // The 7 collections in the exact request catalog order:
  const collections = [
    {
      id: 'photo-frames',
      name: 'Photo Frames',
      desc: 'Handmade frames designed to preserve your sweetest memories.',
      image: sellerMemoryCanvas,
    },
    {
      id: 'embroidery',
      name: 'Embroidery',
      desc: 'Soft, detailed threadwork crafted with patience and love.',
      image: sellerEmbroideryHoop,
    },
    {
      id: 'keychains',
      name: 'Key Chains',
      desc: 'Cute handmade keychains made for everyday joy.',
      image: sellerBloomKeychains,
    },
    {
      id: 'polaroids',
      name: 'Polaroids',
      desc: 'Aesthetic memory-style polaroids for gifts and decor.',
      image: coverPolaroids,
    },
    {
      id: 'craftoria-bloom-bouquets',
      name: 'Craftoria Bloom Bouquets',
      desc: 'Handcrafted everlasting bouquets made with premium pipe cleaners, designed to celebrate every special moment.',
      image: coverBouquets,
    },
    {
      id: 'handmade-decor',
      name: 'Home Decor',
      desc: 'Artisanal fridge magnets, flower vases, and keepsakes to add warmth to your space.',
      image: coverMacrame,
    },
    {
      id: 'accessories',
      name: 'Accessories',
      desc: 'Stylish handmade hair clips and personalized hair accessories for everyday charm.',
      image: coverClips,
    },
  ];

  const renderCard = (col, idx) => (
    <motion.div
      key={col.id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.4, delay: idx * 0.05, ease: 'easeOut' }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      onClick={() => navigate(`/collections/${col.id}`)}
      className="flex flex-col w-full h-full bg-white/80 rounded-3xl border border-brand-purple/15 shadow-xs hover:shadow-lg hover:border-brand-purple/35 overflow-hidden group cursor-pointer transition-all duration-200"
      style={{ contain: 'content' }}
    >
      {/* Top: Collection Image */}
      <div className="w-full relative pb-[75%] h-0 overflow-hidden border-b border-brand-purple/5">
        <img
          src={col.image}
          alt={col.name}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* Content Area */}
      <div className="p-5 flex-1 flex flex-col text-left">
        <span className="text-[9px] font-bold text-brand-plum/85 uppercase tracking-widest font-mono block mb-1">
          COLLECTION
        </span>
        <h3 className="font-serif text-lg sm:text-xl font-bold text-brand-dark leading-tight group-hover:text-brand-plum transition-colors mb-2">
          {col.name}
        </h3>
        <p className="text-xs sm:text-sm text-brand-dark/70 font-medium leading-relaxed line-clamp-3">
          {col.desc}
        </p>

        {/* Flexible spacer to push the button to the bottom */}
        <div className="flex-1" />

        {/* Explore Collection Action Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/collections/${col.id}`);
          }}
          className="inline-flex items-center justify-center py-2.5 px-5 rounded-full bg-[#4F3060] hover:bg-[#683b8a] text-white font-semibold text-[10px] sm:text-xs uppercase tracking-wider transition-colors duration-200 cursor-pointer w-fit mt-4 focus:outline-none shadow-xs hover:shadow-md"
        >
          EXPLORE COLLECTION
        </button>
      </div>
    </motion.div>
  );

  return (
    <section id="bestsellers" className="py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden bg-transparent scroll-mt-20 sm:scroll-mt-24">
      {/* Decorative Lavender Floral Illustrations */}
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        {/* Top-right corner blossom */}
        <HibiscusFlower className="absolute top-[3%] right-[-5%] w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] text-brand-purple/10 rotate-[120deg]" />
        
        {/* Bottom-right corner blossom */}
        <HibiscusFlower className="absolute bottom-[2%] right-[-6%] w-[300px] h-[300px] sm:w-[360px] sm:h-[360px] text-brand-purple/12 -rotate-[15deg]" />
      </div>

      <div className="max-w-[1250px] mx-auto relative z-10">
        {/* Section Heading Banner with subtle entrance */}
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10 sm:mb-16"
        >
          <span className="text-[10px] sm:text-xs font-bold text-brand-plum/85 uppercase tracking-[0.18em] block mb-2 font-mono">
            ARTISAN CATALOG
          </span>
          <h2 className="font-serif text-2.5xl sm:text-4xl md:text-5xl font-bold text-brand-dark tracking-wide leading-tight">
            Explore Our Collections
          </h2>
          <div className="w-16 h-0.5 bg-brand-purple/40 mx-auto mt-4 sm:mt-5" />
        </motion.div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
          {collections.map((col, idx) => renderCard(col, idx))}
        </div>
      </div>
    </section>
  );
};

export default BestSellers;
