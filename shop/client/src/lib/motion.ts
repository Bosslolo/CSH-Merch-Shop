/**
 * Shared motion language — one easing family across the whole site.
 */
import type { Transition, Variants } from "framer-motion";

export const EASE = [0.22, 1, 0.36, 1] as const;

export const transition: Transition = {
  duration: 0.65,
  ease: EASE,
};

export const transitionSlow: Transition = {
  duration: 0.9,
  ease: EASE,
};

export const transitionDrawer: Transition = {
  duration: 0.5,
  ease: EASE,
};

export const stagger = 0.1;

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: { opacity: 1, scale: 1 },
};

export const panelSlide: Variants = {
  hidden: { opacity: 0, x: -32 },
  visible: { opacity: 1, x: 0 },
};

export const drawerSlide: Variants = {
  hidden: { opacity: 0, x: "100%" },
  visible: { opacity: 1, x: 0 },
};

export const heroBg: Variants = {
  hidden: { opacity: 0, scale: 1.04 },
  visible: { opacity: 1, scale: 1 },
};

export const containerStagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: stagger, delayChildren: 0.08 },
  },
};

/** Returns motion props with no movement when user prefers reduced motion */
export function motionProps(reduced: boolean, variants: Variants) {
  if (reduced) {
    return {
      initial: false as const,
      animate: "visible" as const,
      variants: { hidden: {}, visible: {} },
    };
  }
  return {
    initial: "hidden" as const,
    animate: "visible" as const,
    variants,
  };
}
