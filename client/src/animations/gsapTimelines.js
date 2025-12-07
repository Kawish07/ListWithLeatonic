import { gsap } from 'gsap';

export const heroTimeline = (headline, highlight) => {
  return gsap.timeline()
    .from(headline, { opacity: 0, y: 40, duration: 1 })
    .from(highlight, { backgroundColor: '#fff', color: '#111', duration: 0.8 }, '-=0.5');
};

export const cardReveal = (card) => {
  gsap.from(card, { opacity: 0, y: 40, duration: 0.8, ease: 'power2.out' });
};
