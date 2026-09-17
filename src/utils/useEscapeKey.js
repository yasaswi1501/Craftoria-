import { useEffect } from 'react';

// Closes the calling overlay (drawer, modal, dropdown) on Escape, matching
// native dialog behavior. No-ops while `isActive` is false so unmounted /
// closed overlays never fight each other for the keydown listener.
export const useEscapeKey = (isActive, onEscape) => {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onEscape();
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, onEscape]);
};
