import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export default function ScrollToTopOnRouteChange() {
  const location = useLocation();

  useEffect(() => {
    // Immediately scroll to top when route changes
    const scrollToTop = () => {
      try {
        // First, kill all ScrollTriggers to prevent conflicts
        ScrollTrigger.getAll().forEach(trigger => trigger.kill());

        // Immediately jump to top using Lenis if available
        if (window.lenis) {
          // Use immediate: true for instant scroll without animation
          window.lenis.scrollTo(0, { 
            immediate: true,
            force: true,
            lock: true
          });
        } else {
          // Fallback to native scroll (instant)
          window.scrollTo(0, 0);
        }

        // Reset Lenis scroll position directly
        if (window.lenis && window.lenis.scroll) {
          window.lenis.scroll = 0;
        }

      } catch (err) {
        // Fallback to basic scroll
        window.scrollTo(0, 0);
      }
    };

    // Execute scroll immediately
    scrollToTop();

    // Refresh ScrollTrigger after a brief delay to recalculate positions
    // This ensures all animations and pinned sections work correctly
    const refreshTimer = setTimeout(() => {
      try {
        ScrollTrigger.refresh(true);
      } catch (err) {
        console.warn('ScrollTrigger refresh failed:', err);
      }
    }, 100);

    return () => {
      clearTimeout(refreshTimer);
    };
  }, [location.pathname]);

  return null;
}