import { Link } from "wouter";
import { motion } from "framer-motion";
import { catalog } from "@/assets/images";
import { PRODUCTS } from "@/data/products";
import { containerStagger, fadeUp, transition } from "@/lib/motion";
import { scrollToTop } from "@/lib/scroll";

function formatPrice(n: number) {
  return `${n} €`;
}

const GROUPS = [
  { id: "hoodies", label: "Hoodies", filter: (slug: string) => slug.includes("hoodie") },
  { id: "tshirts", label: "T-Shirts", filter: (slug: string) => slug.includes("t-shirt") },
] as const;

function scrollToGroup(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export default function CollectionGrid() {
  const groups = GROUPS.map((g) => ({
    ...g,
    products: PRODUCTS.filter((p) => g.filter(p.slug)),
  }));

  return (
    <div className="csh-collection">
      <div className="csh-collection__header">
        <h2 className="csh-collection__title">Kollektion</h2>
        <span className="csh-collection__filter">Letzte Auflage · {PRODUCTS.length} Artikel</span>
      </div>

      <nav className="csh-collection__chips" aria-label="Produktgruppen">
        {groups.map((g) => (
          <button
            key={g.id}
            type="button"
            className="csh-collection__chip"
            onClick={() => scrollToGroup(g.id)}
          >
            {g.label}
            <span className="csh-collection__chip-count">{g.products.length}</span>
          </button>
        ))}
      </nav>

      <p className="csh-collection__hint">Hoodies und T-Shirts — tippe oben, um zu springen.</p>

      {groups.map((g) => (
        <section key={g.id} id={g.id} className="csh-collection__group">
          <div className="csh-collection__group-head">
            <p className="csh-collection__group-label">{g.label}</p>
            <span className="csh-collection__group-meta">{g.products.length} Modelle</span>
          </div>
          <ProductRow products={g.products} />
        </section>
      ))}
    </div>
  );
}

function ProductRow({ products }: { products: typeof PRODUCTS }) {
  return (
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
              <img src={product.flatLay} alt={product.name} loading="lazy" />
            </div>
            <div className="csh-product-card__info">
              <p className="csh-product-card__name">{product.name}</p>
              <p className="csh-product-card__price">
                {product.compareAt && <s>{formatPrice(product.compareAt)}</s>}
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
  );
}

export function CollectionPanelHero() {
  return (
    <motion.div className="csh-panel-hero" variants={containerStagger} initial="hidden" animate="visible">
      <motion.div className="csh-panel-hero__image" variants={fadeUp} transition={transition}>
        <img src={catalog.panel.collectionInset} alt="CSH Hoodie Lifestyle" />
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
