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
        <motion.div
          className="csh-collection-page__intro"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={transition}
        >
          <p className="csh-label">In Vorbereitung</p>
          <h1 className="csh-display csh-display--sm">Kleine Kollektion</h1>
          <p className="csh-body csh-collection-page__lead">
            Passende Schnitte für KiTa und Kinder — dieselbe Schulidentität, kleinere Groessen.
          </p>
          <div className="csh-collection-page__preview">
            <div className="csh-collection-page__preview-card csh-collection-page__preview-card--soon">
              <span className="csh-collection-page__preview-kicker">Bald</span>
              <strong>KiTa &amp; Kinder</strong>
              <span>Hoodies · Shirts · Groessen XXS–S</span>
            </div>
            <div className="csh-collection-page__preview-card csh-collection-page__preview-card--soon">
              <span className="csh-collection-page__preview-kicker">Gleiche Linie</span>
              <strong>Schul-Farben</strong>
              <span>Navy · Schwarz · Weiss</span>
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
              src={catalog.hero.lifestyleCrossgen}
              alt="CSH — von KiTa bis Oberstufe"
            />
            <span className="csh-small-collection__badge">Coming soon</span>
          </div>
          <div className="csh-small-collection__copy">
            <h2 className="csh-serif">Kleinere Groessen für KiTa und Kinder</h2>
            <p className="csh-body">
              Die nächste Kollektion wird auch die Kleinsten an der Christlichen Schule im Hegau
              mitnehmen — passende Schnitte und Groessen für KiTa und Grundschule.
            </p>
            <p className="csh-small-collection__soon">Noch nicht bestellbar — wir arbeiten daran.</p>
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
