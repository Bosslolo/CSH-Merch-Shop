import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import CollectionGrid from "@/components/home/CollectionGrid";
import { Link, useLocation, useParams } from "wouter";
import { motion } from "framer-motion";
import { catalog } from "@/assets/images";
import { fadeUp, transition } from "@/lib/motion";
import { scrollToTop } from "@/lib/scroll";
import { useCatalog } from "@/hooks/useCatalog";

function resolveCollectionId(raw?: string) {
  const value = (raw || "").toLowerCase();
  if (!value || value === "gross" || value === "grosse" || value === "große" || value === "large") {
    return "large";
  }
  if (value === "klein" || value === "small") return "small";
  return decodeURIComponent(value);
}

export default function CollectionPage() {
  const params = useParams<{ id?: string }>();
  const [location] = useLocation();
  const fromPath = location.split("/").filter(Boolean).pop();
  const collectionId = resolveCollectionId(params.id || fromPath);
  const { collections, products, loading } = useCatalog();
  const collection = collections.find((item) => item.id === collectionId);
  const list = products.filter((product) => product.collection === collectionId);
  const groups = Array.from(new Set(list.map((product) => product.groupLabel)));
  const isSmallEmpty = collectionId === "small" && list.length === 0;

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
          <p className="csh-label">{isSmallEmpty ? "In Vorbereitung" : "Kollektion"}</p>
          <h1 className="csh-display csh-display--sm">
            {collection?.name ?? (collectionId === "small" ? "Kids Kollektion" : "Campus Kollektion")}
          </h1>
          <p className="csh-body csh-collection-page__lead">
            {collection?.lead ??
              (collectionId === "small"
                ? "Passende Schnitte für KiTa und Kinder – dieselbe Schulidentität, kleinere Größen."
                : "Hoodies und Shirts in Erwachsenengrößen für die ganze Schulgemeinschaft.")}
          </p>
          <div className="csh-collection-page__preview">
            <div className="csh-collection-page__preview-card">
              <span className="csh-collection-page__preview-kicker">
                {list.length ? `${list.length} Artikel` : collection?.badge || "Bald"}
              </span>
              <strong>{groups[0] ?? (collectionId === "small" ? "KiTa & Kinder" : "Produkte")}</strong>
              <span>{collection?.cardNote ?? (collectionId === "small" ? "Kleinere Größen" : "Für den Schulalltag.")}</span>
            </div>
            <div className="csh-collection-page__preview-card">
              <span className="csh-collection-page__preview-kicker">{groups.length || 1} Gruppen</span>
              <strong>{groups.slice(0, 2).join(" & ") || "Kollektion"}</strong>
              <span>{loading ? "Lädt…" : "Live aus dem Katalog."}</span>
            </div>
          </div>
        </motion.div>

        {list.length > 0 ? (
          <section className="csh-stock csh-stock--collection">
            <CollectionGrid products={list} title={collection?.name ?? "Kollektion"} />
          </section>
        ) : (
          <motion.section
            className="csh-small-collection"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ ...transition, delay: 0.1 }}
          >
            <div className="csh-small-collection__visual">
              <img src={catalog.hero.lifestylePingpong} alt="" />
              <span className="csh-small-collection__badge">{collection?.badge ?? "Bald"}</span>
            </div>
            <div className="csh-small-collection__copy">
              <h2 className="csh-serif">{collection?.name ?? "Noch im Aufbau"}</h2>
              <p className="csh-body">
                {collection?.lead ?? "Hier erscheinen bald passende Artikel für diese Kategorie."}
              </p>
              <Link href="/kollektion/gross" className="csh-btn csh-btn--ghost" onClick={() => scrollToTop()}>
                Große Kollektion ansehen
              </Link>
            </div>
          </motion.section>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
