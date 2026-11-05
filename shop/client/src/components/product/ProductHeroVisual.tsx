import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import type { CatalogProduct } from "@shared/shop-types";
import { EASE, transitionSlow } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface Props {
  product: CatalogProduct;
  image?: string;
}

export function ProductHeroVisual({ product, image }: Props) {
  const src = image ?? product.image;
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 16]);

  return (
    <div ref={ref} className="csh-product-hero">
      <motion.div className="csh-product-hero__wrap" style={{ y }}>
        <AnimatePresence mode="wait">
          <motion.img
            key={src}
            src={src}
            alt={product.name}
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={{ duration: 0.45, ease: EASE }}
          />
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
