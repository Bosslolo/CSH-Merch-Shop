import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import CollectionGrid from "@/components/home/CollectionGrid";
import { motion } from "framer-motion";
import { fadeUp, transition } from "@/lib/motion";

export default function CollectionBigPage() {
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
          <p className="csh-label">Letzte Auflage</p>
          <h1 className="csh-display csh-display--sm">Grosse Kollektion</h1>
          <p className="csh-body csh-collection-page__lead">
            Hoodies und Shirts in Erwachsenengroessen — für die ganze Schulgemeinschaft ab Grundschule.
          </p>
          <div className="csh-collection-page__preview">
            <button
              type="button"
              className="csh-collection-page__preview-card"
              onClick={() => document.getElementById("hoodies")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              <span className="csh-collection-page__preview-kicker">3 Modelle</span>
              <strong>Hoodies</strong>
              <span>Navy · Schwarz · Weiss</span>
            </button>
            <button
              type="button"
              className="csh-collection-page__preview-card"
              onClick={() => document.getElementById("tshirts")?.scrollIntoView({ behavior: "smooth", block: "start" })}
            >
              <span className="csh-collection-page__preview-kicker">2 Modelle</span>
              <strong>T-Shirts</strong>
              <span>Schwarz · Weiss</span>
            </button>
          </div>
        </motion.div>
        <section className="csh-stock csh-stock--collection">
          <CollectionGrid />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
