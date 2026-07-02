import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import type { Product } from "@/data/products";
import { transitionSlow } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface Props {
  product: Product;
  image?: string;
}

export function ProductHeroVisual({ product, image }: Props) {
  const src = image ?? product.image;
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, reduced ? 0 : 20]);

  return (
    <div ref={ref} className="csh-product-hero">
      <motion.div className="csh-product-hero__wrap" style={{ y }} key={src}>
        <motion.img
          src={src}
          alt={product.name}
          initial={reduced ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={transitionSlow}
        />
      </motion.div>
    </div>
  );
}
