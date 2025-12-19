import { useEffect, useRef } from 'react';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import usePerformanceHints from './usePerformance';

gsap.registerPlugin(ScrollTrigger);

export const useSmoothScroll = (options = {}) => {
  const lenisRef = useRef(null);
  const rafRef = useRef(null);
  const { isLowEnd } = usePerformanceHints();

  useEffect(() => {
    // If an app-level Lenis is already present (e.g. created in App.js), reuse it
    if (typeof window !== 'undefined' && window.lenis) {
      lenisRef.current = window.lenis;
      try { lenisRef.current.on && lenisRef.current.on('scroll', ScrollTrigger.update); } catch (e) {}

      // We don't manage the RAF loop or destroy a shared Lenis instance
      return () => {
        try { lenisRef.current.off && lenisRef.current.off('scroll', ScrollTrigger.update); } catch (e) {}
        lenisRef.current = null;
      };
    }

    // Initialize Lenis; for low-end devices prefer reduced smoothing
    const lenisOptions = {
      duration: isLowEnd ? 0.6 : 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: !isLowEnd,
      smoothTouch: !isLowEnd,
      touchMultiplier: isLowEnd ? 1.2 : 2,
      ...options
    };

    lenisRef.current = new Lenis(lenisOptions);

    // Connect Lenis to GSAP ScrollTrigger
    try { lenisRef.current.on('scroll', ScrollTrigger.update); } catch (e) {}

    // Use a lower-frequency RAF loop on low-end devices to reduce CPU
    let lastCall = 0;
    const tick = (time) => {
      if (!lenisRef.current) return;
      const now = performance.now();
      const minInterval = isLowEnd ? 33 : 16; // ~30fps on low-end, ~60fps otherwise
      if (now - lastCall >= minInterval) {
        try { lenisRef.current.raf(time * 1000); } catch (e) {}
        lastCall = now;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    gsap.ticker.lagSmoothing(0);

    // Update ScrollTrigger on resize
    const handleResize = () => {
      try { ScrollTrigger.refresh(); } catch (e) {}
    };
    window.addEventListener('resize', handleResize, { passive: true });

    // Cleanup
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      try { lenisRef.current.destroy(); } catch (e) {}
      window.removeEventListener('resize', handleResize);
      try { ScrollTrigger.getAll().forEach(trigger => trigger.kill()); } catch (e) {}
      lenisRef.current = null;
    };
  }, [isLowEnd]);

  return lenisRef.current;
};