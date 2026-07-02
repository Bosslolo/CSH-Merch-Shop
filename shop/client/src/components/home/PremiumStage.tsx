import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { catalog } from "@/assets/images";
import { CollectionPanelHero } from "@/components/home/CollectionGrid";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { heroBg, motionProps, panelSlide, transition, transitionSlow } from "@/lib/motion";

export default function PremiumStage() {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 24]);

  return (
    <section ref={ref} className="csh-stage">
      <motion.div
        className="csh-stage__sky"
        aria-hidden="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />

      <motion.div
        className="csh-stage__bg"
        style={{
          backgroundImage: `url(${catalog.hero.lifestyleNavyHoodie})`,
          y: bgY,
        }}
        aria-hidden="true"
        {...motionProps(reduced, heroBg)}
        transition={transitionSlow}
      />

      <motion.aside
        className="csh-stage__panel"
        {...motionProps(reduced, panelSlide)}
        transition={{ ...transition, delay: reduced ? 0 : 0.15 }}
      >
        <CollectionPanelHero />
      </motion.aside>
    </section>
  );
}
