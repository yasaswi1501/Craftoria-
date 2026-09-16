// Hand-drawn botanical line art blossom (5 broad organic petals + stamen + vein details + leaves)
export const HibiscusFlower = ({ className, stroke = "#76558F", opacity = 1, style = {} }) => (
  <svg
    className={`absolute pointer-events-none ${className}`}
    viewBox="0 0 100 100"
    fill="none"
    stroke={stroke}
    strokeWidth="1.2"
    strokeLinecap="round"
    strokeLinejoin="round"
    style={{ opacity, zIndex: 2, transform: 'translateZ(0)', contain: 'paint', ...style }}
    aria-hidden="true"
  >
    {/* Center core */}
    <circle cx="50" cy="50" r="2.5" strokeWidth="0.8" />
    
    {/* Petal 1 (Top) */}
    <path d="M 50,47 C 45,35 38,20 50,11 C 62,20 55,35 50,47 Z" />
    <path d="M 50,22 C 48,27 49,34 50,40" strokeWidth="0.8" opacity="0.6" />
    <path d="M 45,26 C 47,30 48,35 50,40" strokeWidth="0.6" opacity="0.4" />
    <path d="M 55,26 C 53,30 52,35 50,40" strokeWidth="0.6" opacity="0.4" />
    
    {/* Petal 2 (Top Right) */}
    <path d="M 52,49 C 65,42 81,32 87,44 C 78,53 62,51 52,49 Z" />
    <path d="M 72,46 C 66,47 60,48 54,49" strokeWidth="0.8" opacity="0.6" />
    <path d="M 68,41 C 63,44 58,47 54,49" strokeWidth="0.6" opacity="0.4" />
    <path d="M 72,51 C 66,50 61,49 54,49" strokeWidth="0.6" opacity="0.4" />
    
    {/* Petal 3 (Bottom Right) */}
    <path d="M 51,52 C 60,64 71,77 61,85 C 50,78 50,63 51,52 Z" />
    <path d="M 57,69 C 55,63 53,58 51,52" strokeWidth="0.8" opacity="0.6" />
    <path d="M 62,66 C 59,61 56,56 51,52" strokeWidth="0.6" opacity="0.4" />
    <path d="M 53,71 C 52,65 52,59 51,52" strokeWidth="0.6" opacity="0.4" />
    
    {/* Petal 4 (Bottom Left) */}
    <path d="M 48,52 C 38,62 25,74 17,64 C 24,53 37,51 48,52 Z" />
    <path d="M 31,58 C 37,56 42,54 48,52" strokeWidth="0.8" opacity="0.6" />
    <path d="M 32,63 C 38,59 43,56 48,52" strokeWidth="0.6" opacity="0.4" />
    <path d="M 34,53 C 39,53 44,53 48,52" strokeWidth="0.6" opacity="0.4" />
    
    {/* Petal 5 (Top Left) */}
    <path d="M 47,48 C 34,42 15,37 17,24 C 28,27 38,39 47,48 Z" />
    <path d="M 30,34 C 36,39 41,43 47,48" strokeWidth="0.8" opacity="0.6" />
    <path d="M 35,31 C 39,37 43,42 47,48" strokeWidth="0.6" opacity="0.4" />
    <path d="M 28,39 C 34,42 40,45 47,48" strokeWidth="0.6" opacity="0.4" />
    
    {/* Long Stamen in center extending out */}
    <path d="M 50,50 Q 56,40 71,31 T 83,19" strokeWidth="1.3" />
    {/* Stamen details (anthers/pollen beads) */}
    <circle cx="83" cy="19" r="1.3" fill={stroke} />
    <circle cx="79" cy="23" r="0.9" fill={stroke} />
    <circle cx="85" cy="23" r="0.9" fill={stroke} />
    <circle cx="75" cy="27" r="0.9" fill={stroke} />
    
    {/* Accompanying Leaves */}
    <path d="M 40,15 Q 24,5 14,17 T 34,27 Z" opacity="0.65" />
    <path d="M 27,13 L 18,21" strokeWidth="0.6" opacity="0.5" />
    <path d="M 70,76 Q 86,86 83,96 T 60,91 Z" opacity="0.65" />
    <path d="M 76,83 L 72,93" strokeWidth="0.6" opacity="0.5" />
  </svg>
);

// High-performance hardware-accelerated Watercolor wash using CSS radial gradients
export const WatercolorWash = ({ 
  className, 
  gradientId, 
  fromColor1, 
  fromColor2, 
  fromColor3, 
  color1, 
  color2, 
  color3, 
  scale = 1, 
  opacity,
  style = {} 
}) => {
  const c1 = fromColor1 || color1 || 'rgba(214, 185, 225, 0.22)';
  const c2 = fromColor2 || color2 || 'rgba(190, 154, 205, 0.16)';
  const targetOpacity = opacity !== undefined ? opacity : 0.85;

  return (
    <div
      className={`absolute pointer-events-none rounded-full ${className}`}
      style={{
        opacity: targetOpacity,
        background: `radial-gradient(ellipse at 45% 45%, ${c1} 0%, ${c2} 45%, transparent 72%)`,
        transform: `scale(${scale}) translateZ(0)`,
        zIndex: 1,
        contain: 'strict',
        ...style
      }}
    />
  );
};

const PremiumBackground = () => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none w-full h-full">
      
      {/* 1. LAYER 5: PROCEDURAL PAPER ATMOSPHERE GRAIN (Rendered on desktop, excluded on mobile to avoid GPU thrashing) */}
      <div 
        className="hidden md:block fixed inset-0 opacity-[0.02] pointer-events-none" 
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          zIndex: 4,
          transform: 'translateZ(0)'
        }}
      />

      {/* 2. LAYER 2: LARGE IRREGULAR WATERCOLOR WASHES */}
      
      {/* Watercolor Wash A — Top Left */}
      <WatercolorWash
        className="w-[320px] h-[320px] sm:w-[580px] sm:h-[580px] -left-16 -top-20"
        gradientId="wash-a"
        fromColor1="rgba(233, 207, 228, 0.22)"
        fromColor2="rgba(214, 185, 225, 0.18)"
        fromColor3="rgba(190, 154, 205, 0.12)"
      />

      {/* Watercolor Wash B — Top Center */}
      <WatercolorWash
        className="w-[380px] h-[380px] sm:w-[720px] sm:h-[720px] left-[15%] sm:left-[28%] -top-24"
        gradientId="wash-b"
        fromColor1="rgba(190, 154, 205, 0.22)"
        fromColor2="rgba(173, 137, 191, 0.18)"
        fromColor3="rgba(214, 185, 225, 0.14)"
      />

      {/* Watercolor Wash C — Top Right */}
      <WatercolorWash
        className="w-[300px] h-[300px] sm:w-[520px] sm:h-[520px] right-[-10%] -top-16"
        gradientId="wash-c"
        fromColor1="rgba(233, 207, 228, 0.16)"
        fromColor2="rgba(201, 175, 220, 0.12)"
        fromColor3="rgba(255, 249, 243, 0.15)"
      />

      {/* Watercolor Wash D — Left Middle */}
      <WatercolorWash
        className="w-[300px] h-[300px] sm:w-[540px] sm:h-[540px] -left-20 top-[26vh]"
        gradientId="wash-d"
        fromColor1="rgba(214, 185, 225, 0.15)"
        fromColor2="rgba(233, 207, 228, 0.12)"
        fromColor3="rgba(201, 175, 220, 0.08)"
      />

      {/* Watercolor Wash F — Lower Left */}
      <WatercolorWash
        className="w-[380px] h-[380px] sm:w-[750px] sm:h-[750px] -left-24 top-[60vh]"
        gradientId="wash-f"
        fromColor1="rgba(185, 154, 205, 0.26)"
        fromColor2="rgba(169, 137, 191, 0.22)"
        fromColor3="rgba(212, 185, 225, 0.18)"
      />

      {/* Watercolor Wash G — Lower Center */}
      <WatercolorWash
        className="w-[300px] h-[300px] sm:w-[520px] sm:h-[520px] left-[15%] sm:left-[30%] top-[72vh]"
        gradientId="wash-g"
        fromColor1="rgba(214, 185, 225, 0.14)"
        fromColor2="rgba(255, 248, 252, 0.15)"
        fromColor3="rgba(201, 175, 220, 0.08)"
      />

      {/* Watercolor Wash H — Lower Right */}
      <WatercolorWash
        className="w-[340px] h-[340px] sm:w-[620px] sm:h-[620px] right-[-10%] top-[58vh]"
        gradientId="wash-h"
        fromColor1="rgba(214, 185, 225, 0.16)"
        fromColor2="rgba(233, 207, 228, 0.14)"
        fromColor3="rgba(201, 175, 220, 0.10)"
      />

      {/* 3. LAYER 3 & 9: BOTANICAL CORNER & EDGE FLORALS */}
      
      {/* Floral Cluster 1 — Upper Left */}
      <HibiscusFlower
        className="w-[220px] h-[220px] sm:w-[320px] sm:h-[320px]"
        stroke="#76558F"
        opacity={0.58}
        style={{ left: "-60px", top: "50px", transform: "rotate(-15deg)" }}
      />

      {/* Floral Cluster 2 — Upper Center-Right */}
      <HibiscusFlower
        className="w-[280px] h-[280px] sm:w-[420px] sm:h-[420px]"
        stroke="rgba(255, 255, 255, 0.76)"
        opacity={0.78}
        style={{ left: "60%", top: "-70px", transform: "rotate(45deg)" }}
      />

      {/* Floral Cluster 3 — Upper Right */}
      <HibiscusFlower
        className="w-[240px] h-[240px] sm:w-[340px] sm:h-[340px]"
        stroke="#76558F"
        opacity={0.52}
        style={{ right: "-50px", top: "140px", transform: "rotate(30deg)" }}
      />

      {/* Floral Cluster 4 — Left Upper-Middle */}
      <HibiscusFlower
        className="w-[260px] h-[260px] sm:w-[400px] sm:h-[400px]"
        stroke="rgba(255, 255, 255, 0.72)"
        opacity={0.72}
        style={{ left: "-80px", top: "30vh", transform: "rotate(-40deg)" }}
      />

      {/* Floral Cluster 5 — Left Lower-Middle */}
      <HibiscusFlower
        className="w-[200px] h-[200px] sm:w-[280px] sm:h-[280px]"
        stroke="rgba(255, 255, 255, 0.65)"
        opacity={0.48}
        style={{ left: "-50px", top: "60vh", transform: "rotate(10deg)" }}
      />

      {/* Floral Cluster 6 — Lower Left */}
      <HibiscusFlower
        className="w-[260px] h-[260px] sm:w-[380px] sm:h-[380px]"
        stroke="#76558F"
        opacity={0.50}
        style={{ left: "-40px", top: "82vh", transform: "rotate(-25deg)" }}
      />

      {/* Floral Cluster 7 — Lower Right Main */}
      <HibiscusFlower
        className="w-[280px] h-[280px] sm:w-[450px] sm:h-[450px]"
        stroke="#76558F"
        opacity={0.62}
        style={{ right: "-60px", top: "78vh", transform: "rotate(20deg)" }}
      />

      {/* Floral Cluster 8 — Bottom Right White */}
      <HibiscusFlower
        className="w-[260px] h-[260px] sm:w-[380px] sm:h-[380px]"
        stroke="rgba(255, 255, 255, 0.76)"
        opacity={0.76}
        style={{ right: "-30px", top: "90vh", transform: "rotate(-10deg)" }}
      />

      {/* Floral Cluster 9 — Bottom Center-Right */}
      <HibiscusFlower
        className="w-[240px] h-[240px] sm:w-[360px] sm:h-[360px]"
        stroke="#82629A"
        opacity={0.55}
        style={{ left: "62%", top: "92vh", transform: "rotate(5deg)" }}
      />

      {/* 4. LAYER 4: CENTER READABILITY ZONE */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 50% 35%, rgba(252, 248, 252, 0.45) 0%, rgba(248, 238, 248, 0.20) 38%, rgba(248, 238, 248, 0) 72%)',
          zIndex: 3
        }}
      />

      {/* 5. CONTINUITY LOWER SECTIONS */}
      <WatercolorWash
        className="hidden md:block w-[480px] h-[480px] -left-16"
        gradientId="wash-scrolling-left"
        fromColor1="rgba(214, 185, 225, 0.12)"
        fromColor2="rgba(233, 207, 228, 0.08)"
        fromColor3="transparent"
        style={{ top: "215vh" }}
      />
      <HibiscusFlower
        className="w-[200px] h-[200px] sm:w-[280px] sm:h-[280px]"
        stroke="#76558F"
        opacity={0.35}
        style={{ right: "-40px", top: "205vh", transform: "rotate(15deg)" }}
      />

      <WatercolorWash
        className="hidden md:block w-[500px] h-[500px] right-[-10%]"
        gradientId="wash-scrolling-right"
        fromColor1="rgba(190, 154, 205, 0.10)"
        fromColor2="rgba(214, 185, 225, 0.08)"
        fromColor3="transparent"
        style={{ top: "335vh" }}
      />
      <HibiscusFlower
        className="w-[200px] h-[200px] sm:w-[290px] sm:h-[290px]"
        stroke="rgba(255, 255, 255, 0.70)"
        opacity={0.42}
        style={{ left: "-45px", top: "325vh", transform: "rotate(-30deg)" }}
      />

    </div>
  );
};

export default PremiumBackground;
