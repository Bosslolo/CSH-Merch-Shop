import { useState, useMemo } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { Product } from "@/data/products";
import { PRODUCTS } from "@/data/products";
import { ProductHeroVisual } from "./ProductHeroVisual";
import { containerStagger, fadeUp, transition } from "@/lib/motion";
import { scrollToTop } from "@/lib/scroll";
import { useCart } from "@/contexts/CartContext";
import { useStock } from "@/hooks/useStock";

interface Props {
  product: Product;
}

export default function ProductDetail({ product }: Props) {
  const [size, setSize] = useState("");
  const [activeImage, setActiveImage] = useState(product.image);
  const { addItem } = useCart();
  const { getAvailable, loading: stockLoading } = useStock();

  const others = useMemo(() => {
    const tees = PRODUCTS.filter((p) => p.slug.includes("t-shirt") && p.slug !== product.slug);
    const hoodies = PRODUCTS.filter((p) => p.slug.includes("hoodie") && p.slug !== product.slug);
    return [...tees, ...hoodies].slice(0, 3);
  }, [product.slug]);

  return (
    <article className="product-detail">
      <div className="product-page__accent" aria-hidden="true" />

      <div className="product-page__hero-row">
        <div className="product-page__visual">
          <ProductHeroVisual product={product} image={activeImage} />
          <div className="product-page__gallery product-page__gallery--filmstrip">
            {product.gallery.map((src) => (
              <button
                key={src}
                type="button"
                className={`product-page__thumb${activeImage === src ? " is-active" : ""}`}
                onClick={() => setActiveImage(src)}
              >
                <img src={src} alt="" />
              </button>
            ))}
          </div>
        </div>

        <motion.div
          className="csh-panel product-page__details product-page__details--sticky"
          variants={containerStagger}
          initial="hidden"
          animate="visible"
        >
          <motion.p className="csh-label" variants={fadeUp} transition={transition}>
            {product.subtitle}
          </motion.p>
          <motion.h1 className="csh-display csh-display--sm product-page__title" variants={fadeUp} transition={transition}>
            {product.name}
          </motion.h1>
          <motion.p className="product-page__price" variants={fadeUp} transition={transition}>
            {product.compareAt && <s>{product.compareAt} €</s>}
            {product.price} €
          </motion.p>
          <motion.p className="csh-body product-page__unity" variants={fadeUp} transition={transition}>
            {product.unityLine}
          </motion.p>

          <motion.div className="csh-swatches product-page__swatches" variants={fadeUp} transition={transition}>
            {product.colors.map((c) => (
              <span
                key={c.name}
                className="csh-swatch csh-swatch--lg"
                style={{
                  backgroundColor: c.hex,
                  border: c.hex === "#FAFAF8" ? "1px solid rgba(15,31,61,0.15)" : "none",
                }}
                title={c.name}
              />
            ))}
            <span className="csh-body">{product.colors[0]?.name}</span>
          </motion.div>

          <motion.div variants={fadeUp} transition={transition}>
            <p className="csh-label">Groesse</p>
            <div className="product-page__sizes">
              {product.sizes.map((s) => {
                const available = getAvailable(product.slug, s);
                const soldOut = !stockLoading && available !== null && available <= 0;
                return (
                  <button
                    key={s}
                    type="button"
                    className={`product-page__size${size === s ? " is-active" : ""}${soldOut ? " is-disabled" : ""}`}
                    onClick={() => !soldOut && setSize(s)}
                    disabled={soldOut}
                    title={soldOut ? "Ausverkauft" : undefined}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </motion.div>

          <motion.button
            type="button"
            className="csh-btn"
            variants={fadeUp}
            transition={transition}
            onClick={() => {
              if (!size) {
                toast("Bitte zuerst eine Groesse wählen.");
                return;
              }
              const available = getAvailable(product.slug, size);
              if (available !== null && available <= 0) {
                toast("Diese Groesse ist leider ausverkauft.");
                return;
              }
              addItem({
                slug: product.slug,
                name: product.name,
                size,
                price: product.price,
                image: product.image,
              });
              toast(`${product.name} (${size}) wurde hinzugefügt.`);
            }}
          >
            In den Warenkorb
          </motion.button>

          <motion.div className="product-page__meta" variants={fadeUp} transition={transition}>
            <p>{product.material}</p>
            <p>{product.sizingNote}</p>
          </motion.div>
        </motion.div>
      </div>

      <section className="product-page__related">
        <div className="csh-collection__header">
          <h2 className="csh-display csh-display--sm">Passt dazu</h2>
          <Link href="/kollektion/gross" className="csh-link csh-link--ghost" onClick={() => scrollToTop()}>
            Alle ansehen
          </Link>
        </div>
        <div className="csh-collection__grid product-page__related-grid">
          {others.map((p) => (
            <Link key={p.slug} href={`/produkt/${p.slug}`} className="csh-product-card" onClick={() => scrollToTop()}>
              <div className="csh-product-card__media">
                <img src={p.flatLay} alt={p.name} loading="lazy" />
              </div>
              <div className="csh-product-card__info">
                <p className="csh-product-card__name">{p.name}</p>
                <p className="csh-product-card__price">{p.price} €</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </article>
  );
}
