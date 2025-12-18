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
          // Instant, non-locking jump to top
          window.lenis.scrollTo(0, {
            immediate: true,
            force: true
          });
        } else {
          // Fallback to native scroll (instant)
          window.scrollTo(0, 0);
        }

        // Do not mutate Lenis internals; rely on scrollTo only

      } catch (err) {
        // Fallback to basic scroll
        window.scrollTo(0, 0);
      }
    };

    // Execute scroll immediately
    scrollToTop();

    // Defensive: clear any leftover global overflow locks/styles after navigation
    try {
      const html = document.documentElement;
      const body = document.body;
      html.style.overflow = '';
      body.style.overflow = '';
      html.style.position = '';
      body.style.position = '';
      html.style.height = '';
      body.style.height = '';
      html.classList.remove('overflow-hidden');
      body.classList.remove('overflow-hidden');
    } catch (e) {}

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
      // Ensure overflow restored on unmount as well
      try {
        const html = document.documentElement;
        const body = document.body;
        html.style.overflow = '';
        body.style.overflow = '';
        html.style.position = '';
        body.style.position = '';
        html.style.height = '';
        body.style.height = '';
        html.classList.remove('overflow-hidden');
        body.classList.remove('overflow-hidden');
      } catch (e) {}
    };
  }, [location.pathname]);

  return null;
}