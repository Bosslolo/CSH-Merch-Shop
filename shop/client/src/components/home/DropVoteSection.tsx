import { motion } from "framer-motion";
import { VOTE_DESIGNS, VOTE_COMING_SOON } from "@/data/vote-designs";
import { containerStagger, fadeUp, transition } from "@/lib/motion";

export default function DropVoteSection() {
  return (
    <section id="abstimmung" className="csh-spot">
      <div className="csh-spot__panel csh-spot__panel--vote">
        <motion.div
          className="csh-spot__copy"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          transition={transition}
        >
          <p className="csh-label">Nächster Drop</p>
          <h2 className="csh-serif csh-spot__title">Welches Design soll es werden?</h2>
          <p className="csh-body csh-spot__lead">
            {VOTE_COMING_SOON
              ? "Die Abstimmung öffnet bald — hier schon ein Blick auf die Ideen."
              : "Eine Stimme pro Person. Das Design mit den meisten Stimmen wird produziert."}
          </p>
        </motion.div>

        <motion.div
          className="csh-spot__vote-grid"
          variants={containerStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-40px" }}
        >
          {VOTE_DESIGNS.map((design) => (
            <motion.article
              key={design.id}
              className="csh-spot__vote-item"
              variants={fadeUp}
              transition={transition}
            >
              <div className="csh-spot__vote-media">
                <img src={design.image} alt="" loading="lazy" />
              </div>
              <h3 className="csh-spot__vote-name">{design.title}</h3>
              <p className="csh-body">{design.description}</p>
              {(design.comingSoon || VOTE_COMING_SOON) && (
                <p className="csh-spot__vote-note">Bald</p>
              )}
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
