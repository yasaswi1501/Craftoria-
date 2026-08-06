import { createContext, useContext, useState, useEffect } from 'react';

const RouterContext = createContext();

// Helper to handle scroll restoration safely for async renders
const restoreScroll = (targetY) => {
  if (typeof targetY !== 'number') return;
  
  let attempts = 0;
  const tryScroll = () => {
    window.scrollTo(0, targetY);
    
    const documentHeight = document.documentElement.scrollHeight;
    const windowHeight = window.innerHeight;
    const currentScroll = window.scrollY;

    // Retry if we are not at target position AND the document height hasn't loaded enough to support it
    if (
      Math.abs(currentScroll - targetY) > 10 &&
      documentHeight < targetY + windowHeight &&
      attempts < 30
    ) {
      attempts++;
      requestAnimationFrame(tryScroll);
    }
  };
  requestAnimationFrame(tryScroll);
};

export const RouterProvider = ({ children }) => {
  const [currentPath, setCurrentPath] = useState(window.location.pathname + window.location.hash);
  const [navigationType, setNavigationType] = useState('push'); // 'push' | 'pop'

  useEffect(() => {
    // Disable automatic browser scroll restoration behavior
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    // Save initial scroll state
    if (!window.history.state) {
      window.history.replaceState({ scrollY: window.scrollY }, '');
    }

    const handlePopState = () => {
      setNavigationType('pop');
      setCurrentPath(window.location.pathname + window.location.hash);
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('hashchange', handlePopState);

    // Global click interceptor for SPA navigation on all normal links
    const handleGlobalClick = (e) => {
      const anchor = e.target.closest('a');
      if (
        anchor &&
        anchor.href &&
        anchor.host === window.location.host &&
        !anchor.getAttribute('download') &&
        anchor.target !== '_blank'
      ) {
        e.preventDefault();
        const destPath = anchor.pathname + anchor.search + anchor.hash;
        
        // Save current page's scroll before pushing new state
        window.history.replaceState({ scrollY: window.scrollY }, '');
        
        // Push to browser history with scrollY: 0
        window.history.pushState({ scrollY: 0 }, '', destPath);
        
        // Update router state to trigger render
        setNavigationType('push');
        setCurrentPath(destPath);
      }
    };

    window.addEventListener('click', handleGlobalClick);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('hashchange', handlePopState);
      window.removeEventListener('click', handleGlobalClick);
    };
  }, []);

  // Watch route changes to scroll to top or restore position
  useEffect(() => {
    if (navigationType === 'pop') {
      const state = window.history.state;
      if (state && typeof state.scrollY === 'number') {
        restoreScroll(state.scrollY);
      } else {
        window.scrollTo(0, 0);
      }
    } else {
      // Check if the current route has a hash anchor
      const hash = window.location.hash;
      if (hash) {
        const targetId = hash.replace('#', '');
        let attempts = 0;
        const tryScrollToHash = () => {
          const element = document.getElementById(targetId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          } else if (attempts < 30) {
            attempts++;
            requestAnimationFrame(tryScrollToHash);
          }
        };
        requestAnimationFrame(tryScrollToHash);
      } else {
        // Unconditionally scroll to top instantly for new navigations
        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'instant'
        });
      }
    }
  }, [currentPath, navigationType]);

  const navigate = (to) => {
    // Save current page's scroll before pushing new state
    window.history.replaceState({ scrollY: window.scrollY }, '');
    
    // Push new state with scrollY: 0
    window.history.pushState({ scrollY: 0 }, '', to);
    setNavigationType('push');
    setCurrentPath(to);
  };

  return (
    <RouterContext.Provider value={{ currentPath, navigate }}>
      {children}
    </RouterContext.Provider>
  );
};

export const useRouter = () => useContext(RouterContext);
