import { useRoute, Link } from "wouter";
import { motion } from "framer-motion";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import ProductDetail from "@/components/product/ProductDetail";
import { fadeUp, transition } from "@/lib/motion";
import { collectionHref } from "@/lib/collection-routes";
import { scrollToTop } from "@/lib/scroll";
import { useCatalog } from "@/hooks/useCatalog";

export default function ProductPage() {
  const [, params] = useRoute("/produkt/:slug");
  const { products, collections, getProduct, loading } = useCatalog();
  const product = params?.slug ? getProduct(params.slug) : undefined;
  const collectionId = product?.collection ?? "large";
  const backHref = collectionHref(collectionId);
  const backLabel = collections.find((collection) => collection.id === collectionId)?.name ?? "Kollektion";

  if (loading) {
    return (
      <div className="csh-site csh-site--warm">
        <SiteHeader />
        <main className="csh-main csh-main--product">
          <div className="product-page__skeleton" aria-busy="true" aria-label="Produkt wird geladen">
            <div className="product-page__skeleton-visual" />
            <div className="product-page__skeleton-lines">
              <span />
              <span />
              <span className="short" />
            </div>
          </div>
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
          <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={transition}>
            <h1 className="csh-display csh-display--sm">Produkt nicht gefunden</h1>
            <Link href="/" className="csh-link" onClick={() => scrollToTop()}>
              Zurück zum Shop
            </Link>
          </motion.div>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="csh-site csh-site--warm csh-site--product">
      <SiteHeader />
      <main className="csh-main csh-main--product">
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
          <Link href={backHref} className="csh-back-link" onClick={() => scrollToTop()}>
            ← {backLabel}
          </Link>
        </motion.div>
        <ProductDetail key={product.slug} product={product} products={products} />
      </main>
      <SiteFooter />
    </div>
  );
}
