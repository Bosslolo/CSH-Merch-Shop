import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import { useCatalog } from "@/hooks/useCatalog";
import { containerStagger, fadeUp, transition } from "@/lib/motion";
import { scrollToTop } from "@/lib/scroll";

export default function ProductInfoPage() {
  const [, params] = useRoute("/produkt/:slug/infos");
  const { getProduct, loading } = useCatalog();
  const product = params?.slug ? getProduct(params.slug) : undefined;

  if (loading) {
    return (
      <div className="csh-site csh-site--warm">
        <SiteHeader />
        <main className="csh-main csh-main--centered">
          <p className="csh-body">Lade Infos…</p>
        </main>
        <SiteFooter />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="csh-site csh-site--warm">
        <SiteHeader />
        <main className="csh-main csh-main--centered">
          <h1 className="csh-display csh-display--sm">Nicht gefunden</h1>
          <Link href="/" className="csh-link" onClick={() => scrollToTop()}>
            Zum Shop
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="csh-site csh-site--warm csh-site--product">
      <SiteHeader />
      <main className="csh-main csh-main--product product-infos-page">
        <Link
          href={`/produkt/${encodeURIComponent(product.slug)}`}
          className="csh-back-link"
          onClick={() => scrollToTop()}
        >
          ← Zurück zu {product.name}
        </Link>

        <motion.article
          className="product-infos-page__shell"
          variants={containerStagger}
          initial="hidden"
          animate="visible"
        >
          <motion.header variants={fadeUp} transition={transition}>
            <p className="csh-label">{product.subtitle}</p>
            <h1 className="csh-display csh-display--sm">Produktinfos</h1>
          </motion.header>

          <motion.div className="product-infos-page__grid" variants={fadeUp} transition={transition}>
            <section className="product-infos-page__card">
              <h2 className="csh-label">Beschreibung</h2>
              <p className="csh-body">{product.unityLine}</p>
            </section>
            <section className="product-infos-page__card">
              <h2 className="csh-label">Material</h2>
              <p className="csh-body">{product.material}</p>
            </section>
            <section className="product-infos-page__card">
              <h2 className="csh-label">Größe & Passform</h2>
              <p className="csh-body">{product.sizingNote}</p>
            </section>
            <section className="product-infos-page__card">
              <h2 className="csh-label">Farbe</h2>
              <div className="product-infos-page__colors">
                {product.colors.map((c) => (
                  <span key={c.name} className="product-infos-page__color">
                    <span className="csh-swatch" style={{ background: c.hex }} />
                    {c.name}
                  </span>
                ))}
              </div>
            </section>
            <section className="product-infos-page__card product-infos-page__card--wide">
              <h2 className="csh-label">Verfügbare Größen</h2>
              <p className="product-infos-page__sizes">{product.sizes.join(" · ")}</p>
            </section>
          </motion.div>

          <motion.div variants={fadeUp} transition={transition}>
            <Link
              href={`/produkt/${encodeURIComponent(product.slug)}`}
              className="csh-btn csh-btn--ghost"
              onClick={() => scrollToTop()}
            >
              Größe wählen & bestellen
            </Link>
          </motion.div>
        </motion.article>
      </main>
      <SiteFooter />
    </div>
  );
}
