import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { HibiscusFlower, WatercolorWash } from './PremiumBackground';

const Testimonials = () => {
  const testimonials = [
    {
      name: 'Ananya Sharma',
      text: 'Absolutely in love with the quality and detail of the products. You can feel the love and effort in every piece.',
      rating: 5,
      initials: 'AS',
      gradient: 'from-brand-pink to-brand-purple',
    },
    {
      name: 'Rohit Verma',
      text: 'Craftoria never disappoints! Beautiful crafts, great quality, and super fast delivery.',
      rating: 5,
      initials: 'RV',
      gradient: 'from-brand-purple to-brand-violet',
    },
    {
      name: 'Megha Iyer',
      text: 'I ordered a personalized gift and it was beyond perfect. Highly recommended for unique handmade items!',
      rating: 5,
      initials: 'MI',
      gradient: 'from-brand-gold to-brand-pink',
    },
  ];

  return (
    <section id="testimonials" className="py-20 px-6 relative overflow-hidden border-t border-brand-purple/10">
      {/* Soft lavender watercolor band across the section */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-56 bg-gradient-to-r from-brand-lavender/15 via-brand-pink/20 to-brand-lavender/15 blur-[45px] -z-10 pointer-events-none" />
      
      <WatercolorWash
        className="w-[500px] h-[500px] left-[20%] -top-12"
        gradientId="wash-testimonials"
        fromColor1="rgba(214, 185, 225, 0.15)"
        fromColor2="rgba(233, 207, 228, 0.10)"
        fromColor3="transparent"
      />

      {/* Faint floral sketches behind the testimonial cards, not under text */}
      <HibiscusFlower
        className="w-[300px] h-[300px] left-[-60px] top-[10%]"
        stroke="#76558F"
        opacity={0.38}
        style={{ transform: "rotate(-25deg)" }}
      />
      <HibiscusFlower
        className="w-[320px] h-[320px] right-[-60px] bottom-[5%]"
        stroke="rgba(255, 255, 255, 0.70)"
        opacity={0.65}
        style={{ transform: "rotate(40deg)" }}
      />

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-semibold tracking-widest text-brand-plum uppercase block mb-2">
            What Our Customers Say
          </span>
          <div className="w-12 h-0.5 bg-brand-purple mx-auto mt-4" />
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((test, idx) => (
            <motion.div
              key={test.name}
              initial={{ opacity: 0, scale: 0.98, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.12 }}
              className="glass-card p-7 rounded-3xl relative flex flex-col justify-between h-full border border-brand-purple/15 text-left"
            >
              {/* Quote Mark */}
              <div className="absolute top-6 left-6 text-brand-purple/15">
                <Quote className="w-8 h-8 fill-current" />
              </div>

              <div className="pt-6">
                {/* Review Text */}
                <p className="font-sans text-xs sm:text-sm text-brand-dark/85 leading-relaxed mb-6 font-medium italic">
                  “{test.text}”
                </p>
              </div>

              {/* User Meta Row */}
              <div className="flex items-center gap-3.5 border-t border-brand-purple/5 pt-4 mt-auto">
                {/* Initials Avatar */}
                <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${test.gradient} flex items-center justify-center font-bold text-white text-[10px] shadow-sm`}>
                  {test.initials}
                </div>

                <div className="flex flex-col">
                  <h3 className="font-sans font-bold text-xs text-brand-dark leading-tight">
                    {test.name}
                  </h3>
                  {/* Star Ratings */}
                  <div className="flex text-brand-gold gap-0.5 mt-0.5">
                    {[...Array(test.rating)].map((_, i) => (
                      <Star key={i} className="w-2.5 h-2.5 fill-brand-gold text-brand-gold" />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
