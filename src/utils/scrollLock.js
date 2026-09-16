import { useEffect } from 'react';

let lockCount = 0;

export const lockScroll = () => {
  lockCount++;
  if (lockCount === 1) {
    document.documentElement.classList.add('lock-scroll');
    document.body.classList.add('lock-scroll');
  }
};

export const unlockScroll = () => {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.documentElement.classList.remove('lock-scroll');
    document.body.classList.remove('lock-scroll');
  }
};

export const useScrollLock = (isLocked) => {
  useEffect(() => {
    if (!isLocked) return;
    lockScroll();
    return () => {
      unlockScroll();
    };
  }, [isLocked]);
};
