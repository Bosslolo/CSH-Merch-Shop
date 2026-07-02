import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { catalog } from "@/assets/images";
import { fadeUp, transition } from "@/lib/motion";
import { scrollToTop } from "@/lib/scroll";

export default function CollectionSmallPage() {
  return (
    <div className="csh-site csh-site--warm">
      <SiteHeader />
      <main className="csh-main">
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={transition}>
          <p className="csh-label">In Vorbereitung</p>
          <h1 className="csh-display csh-display--sm">Kleine Kollektion</h1>
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
              src={catalog.hero.lifestyleCrossgen}
              alt="CSH — von KiTa bis Oberstufe"
            />
          </div>
          <div className="csh-small-collection__copy">
            <h2 className="csh-serif">Kleinere Groessen für KiTa und Kinder</h2>
            <p className="csh-body">
              Die nächste Kollektion wird auch die Kleinsten an der Christlichen Schule im Hegau
              mitnehmen — passende Schnitte und Groessen für KiTa und Grundschule.
            </p>
            <p className="csh-small-collection__soon">Coming soon — bald verfügbar.</p>
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
