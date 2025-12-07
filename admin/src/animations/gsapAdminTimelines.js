import { gsap } from 'gsap';

export const dashboardReveal = (el) => {
  gsap.from(el, { opacity: 0, y: 40, duration: 1, ease: 'power2.out' });
};

export const cardReveal = (card) => {
  gsap.from(card, { opacity: 0, y: 40, duration: 0.8, ease: 'power2.out' });
};
