import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { catalog } from "@/assets/images";
import { fadeUp, transition } from "@/lib/motion";
import { scrollToTop } from "@/lib/scroll";
import { useCatalog } from "@/hooks/useCatalog";

export default function CollectionSmallPage() {
  const { collections, products } = useCatalog();
  const collection = collections.find((item) => item.id === "small");
  const smallProducts = products.filter((product) => product.collection === "small");

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
          <p className="csh-label">{smallProducts.length ? "Kollektion" : "In Vorbereitung"}</p>
          <h1 className="csh-display csh-display--sm">{collection?.name ?? "Kids Kollektion"}</h1>
          <p className="csh-body csh-collection-page__lead">
            {collection?.lead ?? "Passende Schnitte fuer KiTa und Kinder - dieselbe Schulidentitaet, kleinere Groessen."}
          </p>
          <div className="csh-collection-page__preview">
            <div className="csh-collection-page__preview-card csh-collection-page__preview-card--soon">
              <span className="csh-collection-page__preview-kicker">{collection?.badge ?? "Bald"}</span>
              <strong>{smallProducts.length ? `${smallProducts.length} Artikel` : "KiTa & Kinder"}</strong>
              <span>{collection?.cardNote ?? "Hoodies · Shirts · kleinere Groessen"}</span>
            </div>
            <div className="csh-collection-page__preview-card csh-collection-page__preview-card--soon">
              <span className="csh-collection-page__preview-kicker">Gleiche Linie</span>
              <strong>Schul-Farben</strong>
              <span>Frei fuer neue Kids-Artikel im Admin.</span>
            </div>
          </div>
        </motion.div>

        <motion.section
          className="csh-small-collection"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ ...transition, delay: 0.1 }}
        >
          <div className="csh-small-collection__visual">
            <img
              src={catalog.hero.lifestylePingpong}
              alt="CSH Gruppe — Kleine Kollektion in Vorbereitung"
            />
            <span className="csh-small-collection__badge">{collection?.badge ?? "Coming soon"}</span>
          </div>
          <div className="csh-small-collection__copy">
            <h2 className="csh-serif">{collection?.name ?? "Kleinere Groessen fuer KiTa und Kinder"}</h2>
            <p className="csh-body">
              {collection?.lead ?? "Die naechste Kollektion wird auch die Kleinsten an der Christlichen Schule im Hegau mitnehmen."}
            </p>
            <p className="csh-small-collection__soon">
              {smallProducts.length ? "Produkte koennen jetzt gepflegt werden - Freischaltung pro Artikel im Admin." : "Noch nicht bestellbar - wir arbeiten daran."}
            </p>
            <Link href="/kollektion/gross" className="csh-btn csh-btn--ghost" onClick={() => scrollToTop()}>
              Grosse Kollektion ansehen
            </Link>
          </div>
        </motion.section>
      </main>
      <SiteFooter />
    </div>
  );
}
