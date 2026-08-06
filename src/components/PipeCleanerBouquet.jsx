import { motion } from 'framer-motion';

const PipeCleanerBouquet = () => {
  return (
    <div className="w-full h-full relative flex items-center justify-center">
      
      {/* 1. SOFT WATERCOLOR BLENDS INSIDE THE CARD */}
      <div className="absolute w-[80%] h-[75%] rounded-full bg-brand-pink/25 blur-3xl top-[5%] left-[5%] pointer-events-none" />
      <div className="absolute w-[70%] h-[65%] rounded-full bg-brand-purple/20 blur-3xl bottom-[5%] right-[5%] pointer-events-none" />

      {/* 2. THE TACTILE CHENILLE ARRANGEMENT COMPOSITION */}
      <motion.svg
        initial={{ opacity: 0, y: 15, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.85, ease: 'easeOut' }}
        className="w-[90%] h-[90%] drop-shadow-md z-10"
        viewBox="0 0 160 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Light-weight procedural displacement map to simulate fuzzy chenille wire edges */}
          <filter id="chenille-fuzz" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        {/* ================= STEMS LAYER (z-order: back) ================= */}
        <g filter="url(#chenille-fuzz)" strokeWidth="3.2" strokeLinecap="round">
          {/* Sage Green (#A8B6A0) Stems */}
          {/* Left flower stem */}
          <path d="M 80,140 Q 55,100 48,72" stroke="#A8B6A0" />
          {/* Center-left stem */}
          <path d="M 80,142 Q 68,90 62,64" stroke="#A8B6A0" />
          {/* Center stem (Tulip) */}
          <path d="M 80,145 Q 80,85 80,48" stroke="#A8B6A0" />
          {/* Center-right stem */}
          <path d="M 80,142 Q 92,90 98,64" stroke="#A8B6A0" />
          {/* Right flower stem */}
          <path d="M 80,140 Q 105,100 112,72" stroke="#A8B6A0" />
          {/* Small buds stems */}
          <path d="M 80,140 Q 95,80 116,48" stroke="#A8B6A0" />
        </g>

        {/* ================= LEAVES LAYER ================= */}
        <g filter="url(#chenille-fuzz)" stroke="#A8B6A0" strokeWidth="3" strokeLinecap="round" fill="none">
          {/* Leaf 1 (Left lower) */}
          <path d="M 64,115 C 45,116 38,106 56,104 Z" />
          {/* Leaf 2 (Right lower) */}
          <path d="M 96,115 C 115,116 122,106 104,104 Z" />
          {/* Leaf 3 (Left middle) */}
          <path d="M 68,95 C 48,92 46,84 62,86 Z" />
          {/* Leaf 4 (Right middle) */}
          <path d="M 92,95 C 112,92 114,84 98,86 Z" />
        </g>

        {/* ================= FLOWERS LAYER ================= */}
        
        {/* Flower 1: Lavender Tulip (Centered, Top) */}
        {/* Thick looped plush wire petals */}
        <g filter="url(#chenille-fuzz)" strokeWidth="3.2" strokeLinecap="round" fill="none">
          {/* Back petal loop */}
          <path d="M 80,48 C 72,36 68,22 80,16 C 92,22 88,36 80,48 Z" stroke="#76558F" />
          {/* Left loop petal */}
          <path d="M 80,48 C 68,38 60,25 72,19 C 80,24 82,38 80,48 Z" stroke="#B99ACD" />
          {/* Right loop petal */}
          <path d="M 80,48 C 92,38 100,25 88,19 C 80,24 78,38 80,48 Z" stroke="#B99ACD" />
          {/* Inside stamen loop */}
          <path d="M 80,42 Q 80,32 80,25" stroke="#E9CFE4" strokeWidth="2" />
        </g>

        {/* Flower 2: Lilac 5-Petal Blossom (Left Side) */}
        <g filter="url(#chenille-fuzz)" strokeWidth="3.2" strokeLinecap="round" fill="none">
          {/* 5 Petal loops radiating from (48, 72) */}
          <path d="M 48,72 C 40,64 30,68 36,76 C 42,80 44,76 48,72 Z" stroke="#9270A9" />
          <path d="M 48,72 C 42,60 52,56 56,64 C 58,70 54,72 48,72 Z" stroke="#9270A9" />
          <path d="M 48,72 C 58,68 64,78 56,84 C 50,86 50,80 48,72 Z" stroke="#D4B9E1" />
          <path d="M 48,72 C 52,84 40,90 36,82 C 34,76 42,76 48,72 Z" stroke="#D4B9E1" />
          <path d="M 48,72 C 36,78 32,68 40,62 C 44,60 46,68 48,72 Z" stroke="#9270A9" />
          {/* Center bead loop */}
          <circle cx="48" cy="72" r="2.5" stroke="#FCF8FC" strokeWidth="2" />
        </g>

        {/* Flower 3: Blush Pink Blossom (Right Side) */}
        <g filter="url(#chenille-fuzz)" strokeWidth="3.2" strokeLinecap="round" fill="none">
          {/* Petal loops radiating from (112, 72) */}
          <path d="M 112,72 C 104,64 94,68 100,76 C 106,80 108,76 112,72 Z" stroke="#E9CFE4" />
          <path d="M 112,72 C 106,60 116,56 120,64 C 122,70 118,72 112,72 Z" stroke="#E9CFE4" />
          <path d="M 112,72 C 122,68 128,78 120,84 C 114,86 114,80 112,72 Z" stroke="#CFAFD2" />
          <path d="M 112,72 C 116,84 104,90 100,82 C 98,76 106,76 112,72 Z" stroke="#CFAFD2" />
          <path d="M 112,72 C 100,78 96,68 104,62 C 108,60 110,68 112,72 Z" stroke="#E9CFE4" />
          {/* Center bead loop */}
          <circle cx="112" cy="72" r="2.5" stroke="#FCF8FC" strokeWidth="2" />
        </g>

        {/* Flower 4: Pearl White Accent (Center-Left) */}
        <g filter="url(#chenille-fuzz)" stroke="#FCF8FC" strokeWidth="3.2" strokeLinecap="round" fill="none">
          {/* Layered loops */}
          <path d="M 62,64 C 54,52 42,56 50,66 C 54,72 58,68 62,64 Z" />
          <path d="M 62,64 C 70,52 82,56 74,66 C 70,72 66,68 62,64 Z" />
          {/* Gold core stamen */}
          <circle cx="62" cy="64" r="2" stroke="#C9A24D" strokeWidth="2.5" />
        </g>

        {/* Flower 5: Muted Violet Accent (Center-Right) */}
        <g filter="url(#chenille-fuzz)" stroke="#9270A9" strokeWidth="3.2" strokeLinecap="round" fill="none">
          {/* Layered loops */}
          <path d="M 98,64 C 90,52 78,56 86,66 C 90,72 94,68 98,64 Z" />
          <path d="M 98,64 C 106,52 118,56 110,66 C 106,72 102,68 98,64 Z" />
          {/* Gold core stamen */}
          <circle cx="98" cy="64" r="2" stroke="#C9A24D" strokeWidth="2.5" />
        </g>

        {/* Flower 6: Small Lavender Buds (Top-Right Spiral Clusters) */}
        <g filter="url(#chenille-fuzz)" strokeWidth="3" strokeLinecap="round" fill="none">
          <circle cx="116" cy="48" r="4.5" stroke="#76558F" />
          <circle cx="112" cy="38" r="3.5" stroke="#B99ACD" />
          <circle cx="121" cy="32" r="3" stroke="#D4B9E1" />
        </g>

        {/* ================= VASE / HOLDER (z-order: front) ================= */}
        {/* Rounded organic silhouette matte vase */}
        <g>
          {/* Vase Body Shadow (Subtle dark blend) */}
          <path 
            d="M 52,130 C 52,112 56,105 80,105 C 104,105 108,112 108,130 C 108,160 102,168 80,168 C 58,168 52,160 52,130 Z" 
            fill="rgba(75, 46, 93, 0.05)" 
            className="blur-[2px]" 
          />
          {/* Vase Body */}
          <path 
            d="M 52,130 C 52,112 56,105 80,105 C 104,105 108,112 108,130 C 108,160 102,168 80,168 C 58,168 52,160 52,130 Z" 
            fill="url(#vase-grad)" 
            stroke="#9270A9" 
            strokeWidth="1.2" 
          />
          {/* Handcrafted Grooves (Vertical ribbed detail) */}
          <path d="M 64,112 Q 66,134 65,158" stroke="#9270A9" strokeWidth="0.8" opacity="0.45" strokeLinecap="round" />
          <path d="M 80,110 Q 80,136 80,161" stroke="#9270A9" strokeWidth="0.8" opacity="0.5" strokeLinecap="round" />
          <path d="M 96,112 Q 94,134 95,158" stroke="#9270A9" strokeWidth="0.8" opacity="0.45" strokeLinecap="round" />
        </g>

        {/* Define Vase Matte Color Gradient */}
        <defs>
          <linearGradient id="vase-grad" x1="52" y1="105" x2="108" y2="168" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FCF8FC" /> {/* Pearl shine */}
            <stop offset="35%" stopColor="#E5D1EC" /> {/* Soft lilac */}
            <stop offset="100%" stopColor="#B99ACD" /> {/* Lavender */}
          </linearGradient>
        </defs>

      </motion.svg>

      {/* 3. SUPPORTING MINIATURE PIPE-CLEANER CRAFTS (Bottom Right of card) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, delay: 0.5 }}
        className="absolute bottom-6 right-10 flex items-end gap-3.5 z-20 pointer-events-none"
      >
        {/* Miniature Chenille Heart (sculpted wire look) */}
        <div className="w-10 h-10 flex items-center justify-center relative">
          {/* Tactile shadow */}
          <svg className="w-full h-full text-brand-dark/5 absolute top-1 left-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M12,21.35 L10.55,20.03 C5.4,15.36 2,12.27 2,8.5 C2,5.41 4.42,3 7.5,3 C9.24,3 10.91,3.81 12,5.08 C13.09,3.81 14.76,3 16.5,3 C19.58,3 22,5.41 22,8.5 C22,12.27 18.6,15.36 13.45,20.03 L12,21.35 Z" />
          </svg>
          {/* Chenille Heart stroke with fuzz filter */}
          <svg className="w-full h-full text-brand-pink" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <defs>
              <filter id="heart-fuzz">
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G" />
              </filter>
            </defs>
            <path filter="url(#heart-fuzz)" d="M12,20.35 L10.55,19.03 C5.4,14.36 2,11.27 2,7.5 C2,4.41 4.42,2 7.5,2 C9.24,2 10.91,2.81 12,4.08 C13.09,2.81 14.76,2 16.5,2 C19.58,2 22,4.41 22,7.5 C22,11.27 18.6,14.36 13.45,19.03 L12,20.35 Z" />
          </svg>
        </div>

        {/* Small Chenille Bow (sculpted gold bow loop) */}
        <div className="w-9 h-9 flex items-center justify-center relative">
          <svg className="w-full h-full text-[#C9A24D]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <defs>
              <filter id="bow-fuzz">
                <feTurbulence type="fractalNoise" baseFrequency="0.95" numOctaves="2" result="noise" />
                <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.8" xChannelSelector="R" yChannelSelector="G" />
              </filter>
            </defs>
            {/* Left loop, right loop, center node, and tails */}
            <path filter="url(#bow-fuzz)" d="M12,12 C9,8 4,8 7,12 C9,14 11,13 12,12 Z M12,12 C15,8 20,8 17,12 C15,14 13,13 12,12 Z M7,12 Q9,16 6,20 M17,12 Q15,16 18,20" />
            <circle cx="12" cy="12" r="1.5" fill="#C9A24D" />
          </svg>
        </div>
      </motion.div>

    </div>
  );
};

export default PipeCleanerBouquet;
