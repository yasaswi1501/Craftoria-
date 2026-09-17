import { motion } from 'framer-motion';
import { Heart, Leaf, Users, ArrowRight } from 'lucide-react';
import { useRouter } from '../context/RouterContext';

const About = () => {
  const { navigate } = useRouter();

  const highlights = [
    {
      title: 'Made with Love',
      desc: 'Meticulously shaped with care, ensuring every creation has a soul.',
      icon: <Heart className="w-4.5 h-4.5 text-brand-plum" />,
      bg: 'bg-brand-pink/25',
    },
    {
      title: 'Sustainable Materials',
      desc: 'We use non-toxic, locally-sourced, and organic ingredients.',
      icon: <Leaf className="w-4.5 h-4.5 text-brand-plum" />,
      bg: 'bg-brand-lavender/35',
    },
    {
      title: 'Supporting Artisans',
      desc: 'Promoting traditional slow-crafting techniques & local talent.',
      icon: <Users className="w-4.5 h-4.5 text-brand-plum" />,
      bg: 'bg-brand-cream/70',
    },
  ];

  return (
    <section id="about" className="pt-12 sm:pt-14 pb-16 sm:pb-24 px-4 sm:px-6 relative overflow-hidden scroll-mt-20 sm:scroll-mt-24">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-12 items-center">
          
          {/* Left Column: Vertical Oval Craft Graphic */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, x: -40 }}
            whileInView={{ opacity: 1, scale: 1, x: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-5 flex justify-center"
          >
            {/* Vertical Oval Window */}
            <div className="w-full max-w-[280px] sm:max-w-[340px] h-[360px] sm:h-[450px] rounded-[140px] sm:rounded-[180px] bg-gradient-to-tr from-brand-pink/45 via-brand-purple/20 to-brand-cream/60 border border-brand-purple/25 shadow-xl overflow-hidden relative flex items-center justify-center group">
              {/* Soft background glows inside oval */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,249,243,0.35)_0%,_transparent_70%)]" />
              
              {/* potter's wheel design (SVG/CSS illustration) */}
              <div className="relative flex flex-col items-center justify-center">
                {/* Potter's wheel base */}
                <div className="w-48 h-10 bg-brand-dark/15 border-t border-brand-dark/25 rounded-[100%] shadow-inner flex items-center justify-center">
                  <div className="w-36 h-6 border border-brand-dark/20 rounded-[100%]" />
                </div>
                {/* Clay pot being molded on the wheel */}
                <div className="w-20 h-28 bg-gradient-to-b from-amber-700/60 to-amber-900/50 border border-amber-800/30 rounded-t-3xl shadow-inner -mt-16 relative flex items-center justify-center">
                  <div className="absolute top-2 w-14 h-4 rounded-full border border-amber-800/35 bg-amber-700/30" />
                  <div className="absolute top-8 w-18 h-8 rounded-full border border-amber-850/20 bg-amber-850/15" />
                </div>
                {/* Hands molding clay (vector representation) */}
                <div className="absolute -top-4 w-28 h-16 flex justify-between items-center opacity-75">
                  <svg className="w-10 h-10 text-brand-plum fill-current transform -rotate-12" viewBox="0 0 24 24">
                    <path d="M12,2A10,10 0 0,0 2,12C2,16.4 4.9,20.1 9,21.4V19.3C6.1,18.1 4,15.3 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12C20,15.3 17.9,18.1 15,19.3V21.4C19.1,20.1 22,16.4 22,12A10,10 0 0,0 12,2Z" />
                  </svg>
                  <svg className="w-10 h-10 text-brand-plum fill-current transform rotate-12" viewBox="0 0 24 24">
                    <path d="M12,2C6.5,2 2,6.5 2,12c0,4.4 2.9,8.1 7,9.4v-2.1C6.1,18.1 4,15.3 4,12c0-4.4 3.6-8 8-8s8,3.6 8,8c0,3.3-2.1,6.1-5,7.3v2.1c4.1-1.3 7-5 7-9.4C22,6.5 17.5,2 12,2z" />
                  </svg>
                </div>
              </div>

              {/* Decorative botanical branch drawing overlay */}
              <div className="absolute bottom-4 left-6 text-brand-plum/45">
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M2,22 C8,18 16,16 22,12 M12,15 C10,12 8,8 6,6 M16,13 C18,10 20,8 21,5" />
                  <circle cx="6" cy="6" r="1.5" fill="currentColor" />
                  <circle cx="21" cy="5" r="1.5" fill="currentColor" />
                  <circle cx="12" cy="9" r="1.5" fill="currentColor" />
                </svg>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Story Text & Values List */}
          <motion.div
            initial={{ opacity: 0, x: 35 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="lg:col-span-7 grid grid-cols-1 md:grid-cols-12 gap-8 items-start text-left"
          >
            {/* Story block (span 7) */}
            <div className="md:col-span-7 flex flex-col items-start space-y-4">
              <span className="text-xs font-semibold tracking-widest text-brand-plum uppercase">
                About Craftoria
              </span>
              <h2 className="font-serif text-3xl sm:text-4.5xl font-bold leading-tight text-brand-dark">
                Where Creativity <br />
                Meets Craftsmanship
              </h2>
              <p className="text-xs sm:text-sm text-brand-dark/85 leading-relaxed font-normal">
                At Craftoria, every piece is more than just a product—it's a story. We believe in slow craftsmanship, eco-friendly materials, and designs that add warmth and beauty to your everyday life.
              </p>
              
              <div className="pt-4">
                <button
                  onClick={() => navigate('/collections')}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-brand-plum text-white font-semibold text-xs tracking-wider uppercase hover:bg-brand-violet hover:translate-y-[-2px] transition-all duration-300 shadow-md hover:shadow-lg cursor-pointer"
                >
                  <span>Explore Collections</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Vertical separator */}
            <div className="hidden md:block md:col-span-1 h-44 w-[1px] bg-brand-purple/20 self-center justify-self-center" />

            {/* Values Stack with staggered reveal */}
            <div className="md:col-span-4 flex flex-col gap-6 pt-4 md:pt-0">
              {highlights.map((item, idx) => (
                <motion.div 
                  key={item.title} 
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.5, delay: 0.2 + idx * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  className="flex gap-3 group"
                >
                  <div className={`w-9 h-9 rounded-xl ${item.bg} flex items-center justify-center shrink-0 border border-brand-purple/10 shadow-sm group-hover:scale-105 transition-transform duration-200`}>
                    {item.icon}
                  </div>
                  <div className="flex flex-col">
                    <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wider">
                      {item.title}
                    </h4>
                    <p className="text-[10.5px] text-brand-dark/70 leading-relaxed mt-0.5 font-medium">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default About;
