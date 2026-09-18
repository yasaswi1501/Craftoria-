import { motion } from 'framer-motion';
import { HibiscusFlower, WatercolorWash } from './PremiumBackground';

import hairbandMagentaDaisy from '../assets/hairband-magenta-daisy.jpg';
import gallery2BlueFlowerKeychain from '../assets/gallery-2-blue-flower-keychain.jpg';
import gallery4HeartKeychain from '../assets/gallery-4-heart-keychain.jpg';
import gallery3CoupleEmbroidery from '../assets/gallery-3-couple-embroidery.jpg';
import gallery5ChildFrame from '../assets/gallery-5-child-frame.jpg';
import gallery6PinkBouquetKeychain from '../assets/gallery-6-pink-bouquet-keychain.jpg';
import potMagnetPinkBlossom from '../assets/pot-magnet-pink-blossom.jpg';

const Gallery = () => {
  const items = [
    {
      id: 1,
      src: potMagnetPinkBlossom,
      alt: 'Pink Blossom Flower Pot Fridge Magnet with daisies and pearl centers on lavender satin',
      objectPosition: 'center',
    },
    {
      id: 2,
      src: gallery2BlueFlowerKeychain,
      alt: 'Blue and purple flower keychain hanging from antique brass wall hook',
      objectPosition: 'center',
    },
    {
      id: 3,
      src: gallery4HeartKeychain,
      alt: 'Lavender flat-lay with Polaroid photographs, candles, books, and flowers',
      objectPosition: 'center',
    },
    {
      id: 4,
      src: gallery3CoupleEmbroidery,
      alt: 'Handmade embroidery hoop artwork featuring a couple, J ♥ H, and flower accents',
      objectPosition: 'center',
    },
    {
      id: 5,
      src: gallery5ChildFrame,
      alt: 'White photo frame showing child photograph adorned with red embroidered hearts',
      objectPosition: 'center',
    },
    {
      id: 6,
      src: gallery6PinkBouquetKeychain,
      alt: 'Lavender heart-shaped crochet keychain hanging from antique brass wall hook',
      objectPosition: 'center',
    },
    {
      id: 7,
      src: hairbandMagentaDaisy,
      alt: 'Magenta Daisy Hair Band with bright yellow center and green leaves on lavender satin',
      objectPosition: 'center',
    },
  ];

  return (
    <section id="gallery" className="py-16 sm:py-20 px-3.5 sm:px-6 relative overflow-hidden border-t border-brand-purple/10 scroll-mt-20 sm:scroll-mt-24">
      {/* Section Background Washes */}
      <WatercolorWash
        className="w-[450px] h-[450px] left-[15%] -top-10"
        gradientId="wash-gallery-left"
        fromColor1="rgba(190, 154, 205, 0.16)"
        fromColor2="rgba(214, 185, 225, 0.12)"
        fromColor3="transparent"
      />
      <WatercolorWash
        className="w-[500px] h-[500px] -right-12 -bottom-16"
        gradientId="wash-gallery-right"
        fromColor1="rgba(214, 185, 225, 0.18)"
        fromColor2="rgba(233, 207, 228, 0.12)"
        fromColor3="rgba(201, 175, 220, 0.08)"
      />

      {/* Subtle botanical line art near the bottom-right */}
      <HibiscusFlower
        className="w-[280px] h-[280px] right-[-40px] bottom-[-20px]"
        stroke="#76558F"
        opacity={0.45}
        style={{ transform: "rotate(15deg)" }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div 
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-3xl mx-auto mb-8 sm:mb-12"
        >
          <span className="text-xs font-semibold tracking-widest text-brand-plum uppercase block mb-2">
            A Glimpse of Our Craft
          </span>
          <div className="w-12 h-0.5 bg-brand-purple mx-auto mt-4" />
        </motion.div>

        {/* 7 Card Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 sm:gap-4 lg:gap-6">
          {items.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.92, y: 35 }}
              whileInView={{ opacity: 1, scale: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.65, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{
                y: -8,
                scale: 1.04,
                transition: { duration: 0.25 }
              }}
              className={`relative rounded-[20px] sm:rounded-[24px] overflow-hidden group border border-brand-purple/15 shadow-sm hover:shadow-[0_20px_35px_-10px_rgba(118,85,143,0.32)] transition-shadow duration-300 ease-out cursor-pointer bg-white/40 ${
                idx === 6 
                  ? 'col-span-2 md:col-span-2 lg:col-span-1 aspect-[16/9] md:aspect-[3/4]' 
                  : 'aspect-[3/4]'
              }`}
            >
              <img
                src={item.src}
                alt={item.alt}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover object-center select-none pointer-events-none transition-transform duration-700 ease-out group-hover:scale-110"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Gallery;
