import SiteHeader from "@/components/layout/SiteHeader";
import SiteFooter from "@/components/layout/SiteFooter";
import PremiumStage from "@/components/home/PremiumStage";
import CollectionEntryCards from "@/components/home/CollectionEntryCards";
import SpotlightSection from "@/components/home/SpotlightSection";
import MarqueeTicker from "@/components/MarqueeTicker";
import LogoSplash from "@/components/intro/LogoSplash";
import { motion } from "framer-motion";
import { catalog } from "@/assets/images";
import { fadeUp, transition } from "@/lib/motion";

export default function Home() {
  return (
    <div className="csh-site">
      <SiteHeader />
      <LogoSplash />
      <main>
        <PremiumStage />

        <MarqueeTicker />

        <motion.section
          className="csh-editorial csh-editorial--home"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          transition={transition}
        >
          <img src={catalog.hero.lifestyleCrossgen} alt="CSH — von KiTa bis Oberstufe" />
          <div className="csh-editorial__text">
            <p className="csh-label">Gemeinschaft</p>
            <h2 className="csh-serif">
              <a
                href="https://www.cs-bodensee.de"
                target="_blank"
                rel="noreferrer"
                className="csh-editorial__title-link"
              >
                Von KiTa bis Oberstufe.
              </a>
            </h2>
            <p className="csh-body">Ein Shop für alle an der Christlichen Schule im Hegau.</p>
          </div>
        </motion.section>

        <SpotlightSection />
        <CollectionEntryCards />
      </main>
      <SiteFooter />
    </div>
  );
}
