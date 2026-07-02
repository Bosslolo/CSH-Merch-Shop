import { useRoute, Link } from "wouter";
import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import ProductDetail from "@/components/product/ProductDetail";
import { getProduct } from "@/data/products";
import { motion } from "framer-motion";
import { fadeUp, transition } from "@/lib/motion";
import { scrollToTop } from "@/lib/scroll";

export default function ProductPage() {
  const [, params] = useRoute("/produkt/:slug");
  const product = params?.slug ? getProduct(params.slug) : undefined;

  if (!product) {
    return (
      <div className="csh-site csh-site--warm">
        <SiteHeader />
        <main className="csh-main csh-main--centered">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={transition}>
            <h1 className="csh-display csh-display--sm">Produkt nicht gefunden</h1>
            <Link href="/" className="csh-link" onClick={() => scrollToTop()}>Zurück zum Shop</Link>
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
        <Link href="/kollektion/gross" className="csh-back-link" onClick={() => scrollToTop()}>
          ← Kollektion
        </Link>
        <ProductDetail product={product} />
      </main>
      <SiteFooter />
    </div>
  );
}
