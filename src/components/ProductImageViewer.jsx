import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useScrollLock } from '../utils/scrollLock';
import { useEscapeKey } from '../utils/useEscapeKey';

/**
 * Full-screen product image lightbox (Amazon/Flipkart style). Always shows
 * the complete image via object-fit: contain -- never crops, never
 * distorts. Supports keyboard (Escape/Left/Right), swipe, click-outside,
 * and a thumbnail strip when there's more than one image.
 */
const ProductImageViewer = ({ images, activeIndex, onClose, onNavigate, altText }) => {
  useScrollLock(true);
  useEscapeKey(true, onClose);

  const touchStartX = useRef(null);
  const hasMultiple = images.length > 1;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!hasMultiple) return;
      if (e.key === 'ArrowLeft') onNavigate(-1);
      if (e.key === 'ArrowRight') onNavigate(1);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onNavigate, hasMultiple]);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartX.current === null || !hasMultiple) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(deltaX) > 50) {
      onNavigate(deltaX > 0 ? -1 : 1);
    }
    touchStartX.current = null;
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-[9999] bg-black/92 backdrop-blur-sm flex flex-col items-center justify-center touch-none"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={`${altText} image viewer`}
      >
        {/* Close button */}
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className="absolute top-3 right-3 sm:top-6 sm:right-6 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center z-10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/40 transition-colors"
          aria-label="Close image viewer"
        >
          <X className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Image counter */}
        {hasMultiple && (
          <div className="absolute top-3 left-3 sm:top-6 sm:left-6 text-white/85 text-[11px] sm:text-xs font-bold font-mono bg-white/10 px-3 py-1.5 rounded-full z-10">
            {activeIndex + 1} / {images.length}
          </div>
        )}

        {/* Prev / Next controls (desktop + tablet; mobile relies on swipe too) */}
        {hasMultiple && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate(-1); }}
              className="absolute left-1.5 sm:left-6 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center z-10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/40 transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onNavigate(1); }}
              className="absolute right-1.5 sm:right-6 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-12 sm:h-12 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center z-10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/40 transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </>
        )}

        {/* Full image -- always contain, never cropped or distorted */}
        <div
          className="w-full flex-grow flex items-center justify-center px-4 sm:px-16 md:px-24 py-16 sm:py-20 min-h-0"
          onClick={(e) => e.stopPropagation()}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <AnimatePresence mode="wait">
            <motion.img
              key={activeIndex}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              src={images[activeIndex]}
              alt={`${altText}${hasMultiple ? ` - image ${activeIndex + 1}` : ''}`}
              className="max-w-full max-h-full w-auto h-auto object-contain select-none"
              draggable={false}
            />
          </AnimatePresence>
        </div>

        {/* Thumbnail strip */}
        {hasMultiple && (
          <div
            className="relative z-10 flex gap-2 px-3 py-2 mb-3 sm:mb-4 rounded-full bg-white/10 backdrop-blur-sm max-w-[92vw] overflow-x-auto no-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            {images.map((src, idx) => (
              <button
                key={idx}
                onClick={() => onNavigate(idx - activeIndex)}
                className={`w-9 h-9 sm:w-12 sm:h-12 rounded-lg overflow-hidden border-2 flex-shrink-0 cursor-pointer transition-all ${idx === activeIndex ? 'border-white' : 'border-white/25 opacity-60 hover:opacity-100'}`}
                aria-label={`View image ${idx + 1} of ${images.length}`}
                aria-current={idx === activeIndex}
              >
                <img src={src} alt="" className="w-full h-full object-cover pointer-events-none" />
              </button>
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>,
    document.body
  );
};

export default ProductImageViewer;
