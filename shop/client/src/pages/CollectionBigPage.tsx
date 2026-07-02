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
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={transition}>
          <p className="csh-label">Letzte Auflage</p>
          <h1 className="csh-display csh-display--sm">Grosse Kollektion</h1>
          <p className="csh-body csh-collection-page__lead">
            Hoodies und Shirts in Erwachsenengroessen — für die ganze Schulgemeinschaft ab Grundschule.
          </p>
        </motion.div>
        <section className="csh-stock">
          <CollectionGrid />
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
