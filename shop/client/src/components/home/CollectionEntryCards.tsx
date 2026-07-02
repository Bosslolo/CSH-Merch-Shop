import { Link } from "wouter";
import { motion } from "framer-motion";
import { catalog } from "@/assets/images";
import { fadeUp, transition } from "@/lib/motion";
import { scrollToTop } from "@/lib/scroll";

export default function CollectionEntryCards() {
  return (
    <section id="kollektion" className="csh-collection-entry">
      <div className="csh-collection-entry__header">
        <p className="csh-label">Kollektionen</p>
        <h2 className="csh-serif csh-collection-entry__title">Zwei Welten. Ein Schulgeist.</h2>
      </div>
      <div className="csh-collection-entry__grid">
        <motion.article
          className="csh-collection-entry__card"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={transition}
        >
          <Link href="/kollektion/gross" className="csh-collection-entry__link" onClick={() => scrollToTop()}>
            <div className="csh-collection-entry__media">
              <img src={catalog.panel.collectionInset} alt="Grosse Kollektion" loading="lazy" />
            </div>
            <div className="csh-collection-entry__body">
              <h3 className="csh-serif">Grosse Kollektion</h3>
              <p className="csh-body">5 Artikel · Letzte Auflage — Hoodies und Shirts in Erwachsenengroessen.</p>
              <span className="csh-link">Kollektion ansehen</span>
            </div>
          </Link>
        </motion.article>

        <motion.article
          className="csh-collection-entry__card csh-collection-entry__card--soon"
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          transition={{ ...transition, delay: 0.08 }}
        >
          <Link href="/kollektion/klein" className="csh-collection-entry__link" onClick={() => scrollToTop()}>
            <div className="csh-collection-entry__media">
              <img src={catalog.hero.lifestyleCrossgen} alt="Kleine Kollektion — KiTa und Kinder" loading="lazy" />
              <span className="csh-collection-entry__badge">Bald</span>
            </div>
            <div className="csh-collection-entry__body">
              <h3 className="csh-serif">Kleine Kollektion</h3>
              <p className="csh-body">Kleinere Groessen für KiTa und Kinder — bald verfügbar.</p>
              <span className="csh-link">Mehr erfahren</span>
            </div>
          </Link>
        </motion.article>
      </div>
    </section>
  );
}
