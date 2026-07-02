import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { VOTE_DESIGNS } from "@/data/vote-designs";
import { getVisitorFingerprint } from "@/lib/fingerprint";
import { containerStagger, fadeUp, transition } from "@/lib/motion";

interface VoteState {
  tallies: Record<string, number>;
  hasVoted: boolean;
  votedDesignId: string | null;
}

export default function DropVoteSection() {
  const [state, setState] = useState<VoteState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const fingerprint = await getVisitorFingerprint();
        const res = await fetch(`/api/votes?fingerprint=${encodeURIComponent(fingerprint)}`, {
          credentials: "include",
        });
        const data = await res.json();
        setState(data);
      } catch {
        setState({ tallies: {}, hasVoted: false, votedDesignId: null });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalVotes = state
    ? Object.values(state.tallies).reduce((a, b) => a + b, 0)
    : 0;

  async function vote(designId: string) {
    if (state?.hasVoted || submitting) return;
    setSubmitting(designId);
    try {
      const fingerprint = await getVisitorFingerprint();
      const res = await fetch("/api/votes", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designId, fingerprint }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Abstimmung nicht möglich.");
        if (data.hasVoted) {
          setState((s) => (s ? { ...s, hasVoted: true, votedDesignId: data.votedDesignId ?? s.votedDesignId } : s));
        }
        return;
      }
      setState(data);
      localStorage.setItem("csh_vote_design", designId);
      toast("Danke — deine Stimme zählt!");
    } catch {
      toast("Verbindungsfehler. Bitte später erneut versuchen.");
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <section id="abstimmung" className="csh-vote">
      <div className="csh-vote__header">
        <p className="csh-label">Nächster Drop</p>
        <h2 className="csh-serif csh-vote__title">Welches Design soll es werden?</h2>
        <p className="csh-body csh-vote__lead">
          Stimme einmal für dein Lieblingsdesign ab — jede Stimme zählt für die neue Kollektion.
        </p>
      </div>

      {loading ? (
        <p className="csh-body csh-vote__loading">Lade Abstimmung…</p>
      ) : (
        <motion.div
          className="csh-vote__grid"
          variants={containerStagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          {VOTE_DESIGNS.map((design) => {
            const count = state?.tallies[design.id] ?? 0;
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
            const isChosen = state?.votedDesignId === design.id;

            return (
              <motion.article
                key={design.id}
                className={`csh-vote__card${isChosen ? " is-chosen" : ""}`}
                variants={fadeUp}
                transition={transition}
              >
                <div className="csh-vote__media">
                  <img src={design.image} alt={design.title} loading="lazy" />
                </div>
                <div className="csh-vote__body">
                  <h3 className="csh-serif">{design.title}</h3>
                  <p className="csh-body">{design.description}</p>
                  {totalVotes > 0 && (
                    <div className="csh-vote__bar" aria-hidden="true">
                      <span style={{ width: `${pct}%` }} />
                    </div>
                  )}
                  <p className="csh-vote__count">
                    {count} {count === 1 ? "Stimme" : "Stimmen"}
                    {totalVotes > 0 && ` · ${pct}%`}
                  </p>
                  <button
                    type="button"
                    className="csh-btn csh-btn--vote"
                    disabled={state?.hasVoted || submitting !== null}
                    onClick={() => vote(design.id)}
                  >
                    {state?.hasVoted
                      ? isChosen
                        ? "Deine Wahl"
                        : "Bereits abgestimmt"
                      : submitting === design.id
                        ? "Wird gesendet…"
                        : "Abstimmen"}
                  </button>
                </div>
              </motion.article>
            );
          })}
        </motion.div>
      )}

      <p className="csh-vote__fineprint">
        Eine Stimme pro Person. Wiederholte Versuche werden serverseitig über Geräte-Fingerabdruck erkannt.
      </p>
    </section>
  );
}
