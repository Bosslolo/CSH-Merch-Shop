import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { toast } from "sonner";
import type { CatalogProduct } from "@shared/shop-types";
import { ProductHeroVisual } from "./ProductHeroVisual";
import ProductInfoPanels from "./ProductInfoPanels";
import ProductMobileBuyBar from "./ProductMobileBuyBar";
import { containerStagger, fadeUp, transition } from "@/lib/motion";
import { collectionHref } from "@/lib/collection-routes";
import { scrollToTop } from "@/lib/scroll";
import { useCart } from "@/contexts/CartContext";
import { useStock } from "@/hooks/useStock";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface Props {
  product: CatalogProduct;
  products: CatalogProduct[];
}

export default function ProductDetail({ product, products }: Props) {
  const [size, setSize] = useState("");
  const [activeImage, setActiveImage] = useState(product.image);
  const [showMobileBar, setShowMobileBar] = useState(false);
  const { addItem, items } = useCart();
  const { getAvailable, loading: stockLoading, unavailable } = useStock();
  const reduced = useReducedMotion();

  const gallery = useMemo(() => {
    if (product.gallery?.length) return product.gallery;
    if (product.image) return [product.image];
    return [];
  }, [product.gallery, product.image]);

  const productMarkedSoldOut = product.soldOut === true;

  useEffect(() => {
    setSize("");
    setActiveImage(product.image || gallery[0] || "");
    scrollToTop();
  }, [product.slug, product.image, gallery]);

  useEffect(() => {
    if (reduced || gallery.length < 2) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        setActiveImage((current) => {
          const idx = gallery.indexOf(current);
          const nextIndex = (idx >= 0 ? idx + 1 : 0) % gallery.length;
          return gallery[nextIndex] ?? gallery[0]!;
        });
        schedule();
      }, 30000);
    };
    const onActivity = () => schedule();
    schedule();
    window.addEventListener("pointerdown", onActivity);
    window.addEventListener("keydown", onActivity);
    window.addEventListener("wheel", onActivity, { passive: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", onActivity);
      window.removeEventListener("keydown", onActivity);
      window.removeEventListener("wheel", onActivity);
    };
  }, [product.slug, gallery, reduced]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 899px)");
    const onScroll = () => {
      if (!mq.matches) {
        setShowMobileBar(false);
        return;
      }
      setShowMobileBar(window.scrollY > 280);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    mq.addEventListener("change", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      mq.removeEventListener("change", onScroll);
    };
  }, [product.slug]);

  const others = useMemo(() => {
    const sameCollection = products.filter(
      (candidate) => candidate.collection === product.collection && candidate.slug !== product.slug
    );
    const sameGroup = sameCollection.filter((candidate) => candidate.groupKey === product.groupKey);
    return [...sameGroup, ...sameCollection.filter((candidate) => candidate.groupKey !== product.groupKey)].slice(0, 3);
  }, [product.collection, product.groupKey, product.slug, products]);

  const stockBlocked = unavailable || stockLoading;
  const collectionLink = collectionHref(product.collection);

  const tryAddToCart = useCallback(() => {
    if (productMarkedSoldOut) {
      toast("Dieses Produkt ist aktuell ausverkauft.");
      return;
    }
    if (stockBlocked) {
      toast("Bitte warte, bis der Bestand geladen ist.");
      return;
    }
    if (!size) {
      toast("Bitte zuerst eine Größe wählen.");
      return;
    }
    const available = getAvailable(product.slug, size);
    if (available === null || available <= 0) {
      toast("Diese Größe ist leider ausverkauft.");
      return;
    }
    const inCart = items.find((i) => i.slug === product.slug && i.size === size)?.quantity ?? 0;
    if (inCart >= available) {
      toast(`Nur noch ${available} Stück verfügbar.`);
      return;
    }
    addItem(
      {
        slug: product.slug,
        name: product.name,
        size,
        price: product.price,
        image: product.image,
      },
      1,
      available
    );
    toast(`${product.name} (${size}) wurde hinzugefügt.`);
  }, [addItem, getAvailable, items, product, productMarkedSoldOut, size, stockBlocked]);

  return (
    <article className="product-detail">
      <div className="product-page__accent" aria-hidden="true" />

      <div className="product-page__hero-row">
        <motion.div
          className="product-page__visual"
          initial={reduced ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <ProductHeroVisual product={product} image={activeImage} />
          <div className="product-page__gallery product-page__gallery--filmstrip" role="tablist" aria-label="Produktbilder">
            {gallery.map((src) => (
              <motion.button
                key={src}
                type="button"
                role="tab"
                aria-selected={activeImage === src}
                className={`product-page__thumb${activeImage === src ? " is-active" : ""}`}
                onClick={() => setActiveImage(src)}
                whileTap={reduced ? undefined : { scale: 0.96 }}
                layout={false}
              >
                <img src={src} alt="" />
              </motion.button>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="product-page__buy product-page__details--sticky"
          variants={containerStagger}
          initial="hidden"
          animate="visible"
        >
          <div className="product-page__buy-card csh-panel">
            <motion.p className="csh-label" variants={fadeUp} transition={transition}>
              {product.subtitle}
            </motion.p>
            <motion.h1 className="csh-display csh-display--sm product-page__title" variants={fadeUp} transition={transition}>
              {product.name}
            </motion.h1>

            {productMarkedSoldOut && (
              <motion.p className="product-page__sold-out-banner" variants={fadeUp} transition={transition}>
                Ausverkauft — vorerst nicht bestellbar.
              </motion.p>
            )}

            <motion.div className="product-page__price-row" variants={fadeUp} transition={transition}>
              <p className="product-page__price">
                {product.onSale && <span className="product-page__sale-badge">−{product.salePercent}%</span>}
                {product.compareAt && product.compareAt > product.price && <s>{product.compareAt} €</s>}
                {product.price} €
              </p>
              {product.colors[0] && (
                <span className="product-page__color-pill">
                  <span
                    className="csh-swatch"
                    style={{
                      backgroundColor: product.colors[0].hex,
                      border: product.colors[0].hex === "#FAFAF8" ? "1px solid rgba(15,31,61,0.15)" : "none",
                    }}
                  />
                  {product.colors[0].name}
                </span>
              )}
            </motion.div>

            <motion.p className="csh-body product-page__unity product-page__unity--clamp" variants={fadeUp} transition={transition}>
              {product.unityLine}
            </motion.p>

            <motion.div className="product-page__size-block" variants={fadeUp} transition={transition}>
              <p className="csh-label">Größe</p>
              <div className="product-page__sizes">
                {product.sizes.map((s) => {
                  const available = getAvailable(product.slug, s);
                  const sizeSoldOut =
                    productMarkedSoldOut || stockBlocked || (available !== null && available <= 0);
                  const active = size === s;
                  return (
                    <motion.button
                      key={s}
                      type="button"
                      className={`product-page__size${active ? " is-active" : ""}${sizeSoldOut ? " is-disabled" : ""}`}
                      onClick={() => !sizeSoldOut && setSize(s)}
                      disabled={sizeSoldOut}
                      aria-pressed={active}
                      whileTap={sizeSoldOut || reduced ? undefined : { scale: 0.94 }}
                      transition={{ type: "spring", stiffness: 420, damping: 28 }}
                      title={
                        productMarkedSoldOut
                          ? "Ausverkauft"
                          : unavailable
                            ? "Bestand gerade nicht ladbar"
                            : sizeSoldOut
                              ? "Ausverkauft"
                              : undefined
                      }
                    >
                      {s}
                    </motion.button>
                  );
                })}
              </div>
              {unavailable && (
                <p className="product-page__stock-hint csh-body">Bestand gerade nicht ladbar — bitte später erneut.</p>
              )}
            </motion.div>

            <motion.button
              type="button"
              className="csh-btn product-page__cta"
              variants={fadeUp}
              transition={transition}
              disabled={stockBlocked || productMarkedSoldOut}
              onClick={tryAddToCart}
            >
              {productMarkedSoldOut ? "Ausverkauft" : "In den Warenkorb"}
            </motion.button>
          </div>

          <motion.div variants={fadeUp} transition={transition}>
            <ProductInfoPanels product={product} compact />
          </motion.div>
        </motion.div>
      </div>

      <motion.section
        className="product-page__related"
        initial={reduced ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="csh-collection__header">
          <h2 className="csh-display csh-display--sm">Passt dazu</h2>
          <Link href={collectionLink} className="csh-link csh-link--ghost" onClick={() => scrollToTop()}>
            Kollektion
          </Link>
        </div>
        <div className="csh-collection__grid product-page__related-grid">
          {others.map((p, index) => (
            <motion.div
              key={p.slug}
              initial={reduced ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.06, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link href={`/produkt/${p.slug}`} className="csh-product-card" onClick={() => scrollToTop()}>
                <div className="csh-product-card__media">
                  <img src={p.flatLay} alt={p.name} loading="lazy" />
                </div>
                <div className="csh-product-card__info">
                  <p className="csh-product-card__name">{p.name}</p>
                  <p className="csh-product-card__price">{p.price} €</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <ProductMobileBuyBar
        visible={showMobileBar}
        name={product.name}
        price={product.price}
        size={size}
        disabled={stockBlocked || productMarkedSoldOut}
        onAdd={tryAddToCart}
      />
    </article>
  );
}
