import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import CollectionGrid from "@/components/home/CollectionGrid";
import { motion } from "framer-motion";
import { fadeUp, transition } from "@/lib/motion";
import { useCatalog } from "@/hooks/useCatalog";

export default function CollectionBigPage() {
  const { collections, products, loading } = useCatalog();
  const collection = collections.find((item) => item.id === "large");
  const largeProducts = products.filter((product) => product.collection === "large");
  const groups = Array.from(new Set(largeProducts.map((product) => product.groupLabel)));

  return (
    <div className="csh-site csh-site--warm">
      <SiteHeader />
      <main className="csh-main">
        <motion.div
          className="csh-collection-page__intro"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={transition}
        >
          <p className="csh-label">Kollektion</p>
          <h1 className="csh-display csh-display--sm">{collection?.name ?? "Campus Kollektion"}</h1>
          <p className="csh-body csh-collection-page__lead">
            {collection?.lead ?? "Hoodies und Shirts in Erwachsenengroessen fuer die ganze Schulgemeinschaft."}
          </p>
          <div className="csh-collection-page__preview">
            <button
              type="button"
              className="csh-collection-page__preview-card"
              onClick={() => document.getElementById("hoodies")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              <span className="csh-collection-page__preview-kicker">{largeProducts.length} Artikel</span>
              <strong>{groups[0] ?? "Produkte"}</strong>
              <span>{collection?.cardNote ?? "Fuer den Schulalltag."}</span>
            </button>
            <div className="csh-collection-page__preview-card">
              <span className="csh-collection-page__preview-kicker">{groups.length} Gruppen</span>
              <strong>{groups.slice(0, 2).join(" & ") || "Kollektion"}</strong>
              <span>{loading ? "Laedt…" : "Live aus dem Katalog."}</span>
            </div>
          </div>
        </motion.div>
        <section className="csh-stock csh-stock--collection">
          <CollectionGrid products={largeProducts} title={collection?.name ?? "Campus Kollektion"} />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
