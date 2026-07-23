import { motion } from "framer-motion";
import { VOTE_DESIGNS, VOTE_COMING_SOON } from "@/data/vote-designs";
import { containerStagger, fadeUp, transition } from "@/lib/motion";

export default function DropVoteSection() {
  return (
    <section id="abstimmung" className="csh-vote">
      <div className="csh-vote__shell">
        <header className="csh-vote__header">
          <div className="csh-vote__header-text">
            <p className="csh-label">Nächster Drop</p>
            <h2 className="csh-serif csh-vote__title">Welches Design soll es werden?</h2>
            <p className="csh-body csh-vote__lead">
              {VOTE_COMING_SOON
                ? "Die Abstimmung für den nächsten Drop öffnet bald. Hier schon ein Blick auf die Ideen."
                : "Tippe ein Design an und bestätige. Eine Stimme pro Person — klar und fair."}
            </p>
          </div>
          <div className="csh-vote__total csh-vote__total--soon" aria-live="polite">
            <div>
              <strong>Bald</strong>
              <span>Abstimmung kommt</span>
            </div>
          </div>
        </header>

        <p className="csh-vote__instruction csh-vote__instruction--soon">
          Alle drei Designs sind noch in Vorbereitung — Coming soon.
        </p>

        <motion.div
          className="csh-vote__grid"
          variants={containerStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-60px" }}
        >
          {VOTE_DESIGNS.map((design) => (
            <motion.article
              key={design.id}
              className="csh-vote__card csh-vote__card--soon"
              variants={fadeUp}
              transition={transition}
            >
              <div className="csh-vote__media">
                <img src={design.image} alt="" loading="lazy" />
                <span className="csh-vote__badge csh-vote__badge--soon">Coming soon</span>
              </div>
              <div className="csh-vote__body">
                <h3 className="csh-serif">{design.title}</h3>
                <p className="csh-body">{design.description}</p>
                <p className="csh-vote__soon-note">Noch nicht abstimmbar</p>
              </div>
            </motion.article>
          ))}
        </motion.div>

        <p className="csh-vote__fineprint">
          Sobald die Abstimmung live geht, kannst du einmal für dein Lieblingsdesign stimmen.
        </p>
      </div>
    </section>
  );
}
