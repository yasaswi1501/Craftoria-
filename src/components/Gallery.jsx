import { motion } from 'framer-motion';
import { HibiscusFlower, WatercolorWash } from './PremiumBackground';

import gallery1Polaroid from '../assets/gallery-1-polaroid.jpg';
import gallery2BlueFlowerKeychain from '../assets/gallery-2-blue-flower-keychain.jpg';
import gallery3CoupleEmbroidery from '../assets/gallery-3-couple-embroidery.jpg';
import gallery4HeartKeychain from '../assets/gallery-4-heart-keychain.jpg';
import gallery5ChildFrame from '../assets/gallery-5-child-frame.jpg';
import gallery6PinkBouquetKeychain from '../assets/gallery-6-pink-bouquet-keychain.jpg';
import gallery7TwoFlowerKeychain from '../assets/gallery-7-two-flower-keychain.jpg';

const Gallery = () => {
  const items = [
    {
      id: 1,
      src: gallery1Polaroid,
      alt: 'Lavender flat-lay with Polaroid photographs, candles, books, and flowers',
      objectFit: 'cover',
      objectPosition: 'center',
    },
    {
      id: 2,
      src: gallery2BlueFlowerKeychain,
      alt: 'Blue and purple flower keychain hanging from antique brass wall hook',
      objectFit: 'cover',
      objectPosition: 'center',
    },
    {
      id: 3,
      src: gallery3CoupleEmbroidery,
      alt: 'Handmade embroidery hoop artwork featuring a couple, J ♥ H, and flower accents',
      objectFit: 'contain',
      objectPosition: 'center',
      bgColor: '#FDFBFD',
    },
    {
      id: 4,
      src: gallery4HeartKeychain,
      alt: 'Lavender heart-shaped crochet keychain hanging from antique brass wall hook',
      objectFit: 'cover',
      objectPosition: 'center',
    },
    {
      id: 5,
      src: gallery5ChildFrame,
      alt: 'White photo frame showing child photograph adorned with red embroidered hearts',
      objectFit: 'contain',
      objectPosition: 'center',
      bgColor: '#FAF7FA',
    },
    {
      id: 6,
      src: gallery6PinkBouquetKeychain,
      alt: 'Pink flower bouquet style keychain hanging from antique brass wall hook',
      objectFit: 'cover',
      objectPosition: 'center',
    },
    {
      id: 7,
      src: gallery7TwoFlowerKeychain,
      alt: 'Wrapped two-flower bouquet keychain with purple and pink flowers on brass hook',
      objectFit: 'cover',
      objectPosition: 'center',
    },
  ];

  return (
    <section id="gallery" className="py-20 px-6 relative overflow-hidden border-t border-brand-purple/10">
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
          className="text-center max-w-3xl mx-auto mb-12"
        >
          <span className="text-xs font-semibold tracking-widest text-brand-plum uppercase block mb-2">
            A Glimpse of Our Craft
          </span>
          <div className="w-12 h-0.5 bg-brand-purple mx-auto mt-4" />
        </motion.div>

        {/* 7 Card Gallery Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 md:gap-5 lg:gap-6">
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
                boxShadow: "0 20px 35px -10px rgba(118, 85, 143, 0.32)",
                transition: { duration: 0.25 }
              }}
              className={`relative rounded-[22px] overflow-hidden group border border-brand-purple/15 shadow-sm transition-all duration-300 ease-out cursor-pointer ${
                idx === 6 
                  ? 'col-span-2 md:col-span-2 lg:col-span-1 aspect-[16/9] md:aspect-[3/4]' 
                  : 'aspect-[3/4]'
              }`}
              style={{ backgroundColor: item.bgColor || 'transparent' }}
            >
              <img
                src={item.src}
                alt={item.alt}
                loading="lazy"
                decoding="async"
                className="w-full h-full select-none pointer-events-none transition-transform duration-700 ease-out group-hover:scale-110"
                style={{
                  objectFit: item.objectFit,
                  objectPosition: item.objectPosition,
                }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Gallery;
