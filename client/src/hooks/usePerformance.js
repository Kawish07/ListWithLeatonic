import { useEffect, useState } from 'react';

// Simple performance hint hook
export default function usePerformanceHints() {
  const [isLowEnd, setIsLowEnd] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // reduced-motion media query
    try {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReducedMotion(mq.matches);
      const onChange = () => setPrefersReducedMotion(mq.matches);
      if (mq.addEventListener) mq.addEventListener('change', onChange);
      else mq.addListener(onChange);

      // Basic low-end heuristic: device memory & hardwareConcurrency
      const lowMemory = navigator.deviceMemory && navigator.deviceMemory <= 2; // GB
      const lowCores = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
      const userAgentLowEnd = /iphone|android.*(mobile)/i.test(navigator.userAgent) && (lowMemory || lowCores);

      // Also detect some older Android/webviews heuristics
      const low = !!(lowMemory || lowCores || userAgentLowEnd);
      setIsLowEnd(low);

      // Add a DOM class/attribute to allow CSS to reduce heavy visuals
      try {
        if (low || mq.matches) {
          document.documentElement.classList.add('reduced-visuals');
          document.documentElement.setAttribute('data-performance', 'reduced');
        } else {
          document.documentElement.classList.remove('reduced-visuals');
          document.documentElement.setAttribute('data-performance', 'normal');
        }
      } catch (e) {}

      return () => {
        if (mq.removeEventListener) mq.removeEventListener('change', onChange);
        else mq.removeListener(onChange);
      };
    } catch (e) {
      // default to modern device
      setIsLowEnd(false);
    }
  }, []);

  return { isLowEnd, prefersReducedMotion };
}
