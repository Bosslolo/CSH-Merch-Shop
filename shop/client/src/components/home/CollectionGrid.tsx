import { Link } from "wouter";
import { motion } from "framer-motion";
import { catalog } from "@/assets/images";
import type { CatalogProduct } from "@shared/shop-types";
import { containerStagger, fadeUp, transition } from "@/lib/motion";
import { scrollToTop } from "@/lib/scroll";

function formatPrice(n: number) {
  return `${n} €`;
}

export default function CollectionGrid({ products }: { products: CatalogProduct[] }) {
  return (
    <div className="csh-collection">
      <motion.div
        className="csh-collection__grid"
        variants={containerStagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-40px" }}
      >
        {products.map((product) => (
          <motion.article key={product.slug} variants={fadeUp} transition={transition}>
            <Link href={`/produkt/${product.slug}`} className="csh-product-card" onClick={() => scrollToTop()}>
              <div className="csh-product-card__media">
                {product.soldOut && <span className="csh-product-card__badge">Ausverkauft</span>}
                <img src={product.image || product.flatLay} alt={product.name} loading="lazy" />
              </div>
              <div className="csh-product-card__info">
                <p className="csh-product-card__name">{product.name}</p>
                <p className="csh-product-card__price">
                  {product.onSale && <span className="product-page__sale-badge">−{product.salePercent}%</span>}
                  {product.compareAt && product.compareAt > product.price && (
                    <s>{formatPrice(product.compareAt)}</s>
                  )}
                  {formatPrice(product.price)}
                </p>
                <div className="csh-swatches">
                  {product.colors.map((c) => (
                    <span
                      key={c.name}
                      className="csh-swatch"
                      style={{
                        background: c.hex,
                        border: c.hex === "#FAFAF8" ? "1px solid #ddd" : "none",
                      }}
                    />
                  ))}
                </div>
              </div>
            </Link>
          </motion.article>
        ))}
      </motion.div>
    </div>
  );
}

export function CollectionPanelHero() {
  return (
    <motion.div className="csh-panel-hero" variants={containerStagger} initial="hidden" animate="visible">
      <motion.div className="csh-panel-hero__image" variants={fadeUp} transition={transition}>
        <img src={catalog.panel.heroInset} alt="CSH Hoodie Lifestyle" />
      </motion.div>
      <motion.p className="csh-panel-hero__season" variants={fadeUp} transition={{ ...transition, delay: 0.08 }}>
        Letzte Auflage <sup>26</sup>
      </motion.p>
      <motion.p className="csh-panel-hero__copy" variants={fadeUp} transition={{ ...transition, delay: 0.14 }}>
        Hoodies und Shirts für die ganze Schulgemeinschaft — von KiTa bis Oberstufe.
        Jedes Stück ein letzter Lauf vor der neuen Kollektion.
      </motion.p>
    </motion.div>
  );
}
