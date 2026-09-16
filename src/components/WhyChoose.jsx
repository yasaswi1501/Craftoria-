import { motion } from 'framer-motion';
import { Award, Paintbrush, Leaf, ShieldCheck } from 'lucide-react';
import { HibiscusFlower, WatercolorWash } from './PremiumBackground';

const WhyChoose = () => {
  const features = [
    {
      title: 'Handmade Quality',
      desc: 'Each piece is carefully handcrafted by skilled artisans with love.',
      icon: <Award className="w-5 h-5 text-brand-plum" />,
      bg: 'bg-brand-pink/20',
    },
    {
      title: 'Custom Designs',
      desc: 'Get personalized creations made just for you.',
      icon: <Paintbrush className="w-5 h-5 text-brand-plum" />,
      bg: 'bg-brand-lavender/30',
    },
    {
      title: 'Eco-Friendly Materials',
      desc: 'We use sustainable and non-toxic materials.',
      icon: <Leaf className="w-5 h-5 text-brand-plum" />,
      bg: 'bg-brand-cream/65',
    },
    {
      title: 'Secure Delivery',
      desc: 'Safe packaging and on-time delivery, every time.',
      icon: <ShieldCheck className="w-5 h-5 text-brand-plum" />,
      bg: 'bg-brand-purple/15',
    },
  ];

  return (
    <section id="whychoose" className="py-20 px-6 relative overflow-hidden border-t border-brand-purple/10">
      {/* Section Background Wash */}
      <WatercolorWash
        className="w-[500px] h-[500px] right-[10%] -top-12"
        gradientId="wash-whychoose"
        fromColor1="rgba(233, 207, 228, 0.14)" // soft mauve/blush
        fromColor2="rgba(201, 175, 220, 0.10)"
        fromColor3="transparent"
      />

      {/* Large white floral outline on the left side, partially cropped */}
      <HibiscusFlower
        className="w-[340px] h-[340px] left-[-70px] -top-10"
        stroke="rgba(255, 255, 255, 0.72)"
        opacity={0.70}
        style={{ transform: "rotate(-30deg)" }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Heading Block (span 3) */}
          <motion.div
            initial={{ opacity: 0, x: -35 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-3 text-left space-y-3"
          >
            <h2 className="font-serif text-3xl sm:text-4xl font-bold leading-tight text-brand-dark">
              Why Choose <br className="hidden lg:inline" />
              Craftoria?
            </h2>
            <div className="w-12 h-0.5 bg-brand-purple" />
          </motion.div>

          {/* Right Column: Features Grid (span 9) */}
          <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, idx) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, scale: 0.94, y: 35 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.65, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
                whileHover={{ y: -6, scale: 1.02, transition: { duration: 0.25 } }}
                className="flex flex-col items-start text-left p-5 glass-card rounded-2xl border border-brand-purple/10 hover:border-brand-purple/30 hover:shadow-lg transition-shadow duration-300 h-full"
              >
                {/* Icon Container */}
                <div className={`w-9 h-9 rounded-xl ${feat.bg} flex items-center justify-center mb-4 border border-brand-purple/10 group-hover:scale-105 transition-transform duration-200`}>
                  {feat.icon}
                </div>

                {/* Title */}
                <h3 className="font-serif text-sm font-bold text-brand-dark mb-2">
                  {feat.title}
                </h3>

                {/* Description */}
                <p className="text-[11px] text-brand-dark/75 leading-relaxed font-medium">
                  {feat.desc}
                </p>
              </motion.div>
            ))}
          </div>

        </div>
      </div>
    </section>
  );
};

export default WhyChoose;
