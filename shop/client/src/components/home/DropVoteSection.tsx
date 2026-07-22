import { useEffect, useState } from "react";
import { Check, Users } from "lucide-react";
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
  const [focusedId, setFocusedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const fingerprint = await getVisitorFingerprint();
        const res = await fetch(`/api/votes?fingerprint=${encodeURIComponent(fingerprint)}`, {
          credentials: "include",
        });
        const data = await res.json();
        setState(data);
        if (data.votedDesignId) setFocusedId(data.votedDesignId);
      } catch {
        setState({ tallies: {}, hasVoted: false, votedDesignId: null });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalVotes = state ? Object.values(state.tallies).reduce((a, b) => a + b, 0) : 0;
  const leadingId =
    totalVotes > 0
      ? VOTE_DESIGNS.map((d) => d.id).sort(
          (a, b) => (state?.tallies[b] ?? 0) - (state?.tallies[a] ?? 0)
        )[0]
      : null;

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
          setState((s) =>
            s ? { ...s, hasVoted: true, votedDesignId: data.votedDesignId ?? s.votedDesignId } : s
          );
          if (data.votedDesignId) setFocusedId(data.votedDesignId);
        }
        return;
      }
      setState(data);
      setFocusedId(designId);
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
      <div className="csh-vote__shell">
        <header className="csh-vote__header">
          <div className="csh-vote__header-text">
            <p className="csh-label">Nächster Drop · Deine Stimme</p>
            <h2 className="csh-serif csh-vote__title">Welches Design soll es werden?</h2>
            <p className="csh-body csh-vote__lead">
              Tippe ein Design an und bestätige. Eine Stimme pro Person — klar und fair.
            </p>
          </div>
          <div className="csh-vote__total" aria-live="polite">
            <Users size={18} strokeWidth={1.5} aria-hidden="true" />
            <div>
              <strong>{loading ? "…" : totalVotes}</strong>
              <span>{totalVotes === 1 ? "Stimme bisher" : "Stimmen bisher"}</span>
            </div>
          </div>
        </header>

        {loading ? (
          <p className="csh-body csh-vote__loading">Lade Abstimmung…</p>
        ) : (
          <>
            {!state?.hasVoted && (
              <p className="csh-vote__instruction">
                {focusedId
                  ? "Auswahl getroffen — tippe „Stimme abgeben“, um zu bestätigen."
                  : "Wähle ein Design aus den drei Optionen."}
              </p>
            )}
            {state?.hasVoted && (
              <p className="csh-vote__instruction csh-vote__instruction--done">
                Du hast abgestimmt. Die Balken zeigen den aktuellen Stand.
              </p>
            )}

            <motion.div
              className="csh-vote__grid"
              variants={containerStagger}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-60px" }}
            >
              {VOTE_DESIGNS.map((design) => {
                const count = state?.tallies[design.id] ?? 0;
                const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                const isChosen = state?.votedDesignId === design.id;
                const isFocused = focusedId === design.id;
                const isLeading = leadingId === design.id && totalVotes > 0;
                const canSelect = !state?.hasVoted && !submitting;

                return (
                  <motion.article
                    key={design.id}
                    className={[
                      "csh-vote__card",
                      isFocused ? "is-focused" : "",
                      isChosen ? "is-chosen" : "",
                      state?.hasVoted && !isChosen ? "is-dimmed" : "",
                      isLeading ? "is-leading" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    variants={fadeUp}
                    transition={transition}
                  >
                    <button
                      type="button"
                      className="csh-vote__select"
                      disabled={!canSelect}
                      aria-pressed={isFocused}
                      aria-label={`${design.title} auswählen`}
                      onClick={() => {
                        if (!canSelect) return;
                        setFocusedId(design.id);
                      }}
                    >
                      <div className="csh-vote__media">
                        <img src={design.image} alt="" loading="lazy" />
                        {isLeading && (
                          <span className="csh-vote__badge csh-vote__badge--lead">Führend</span>
                        )}
                        {isChosen && (
                          <span className="csh-vote__badge csh-vote__badge--yours">
                            <Check size={14} strokeWidth={2.5} /> Deine Wahl
                          </span>
                        )}
                        {isFocused && !state?.hasVoted && (
                          <span className="csh-vote__check" aria-hidden="true">
                            <Check size={18} strokeWidth={2.5} />
                          </span>
                        )}
                      </div>
                      <div className="csh-vote__body">
                        <h3 className="csh-serif">{design.title}</h3>
                        <p className="csh-body">{design.description}</p>

                        <div className="csh-vote__stats">
                          <div className="csh-vote__numbers">
                            <span className="csh-vote__number">{count}</span>
                            <span className="csh-vote__number-label">
                              {count === 1 ? "Stimme" : "Stimmen"}
                            </span>
                            <span className="csh-vote__pct">{totalVotes > 0 ? `${pct}%` : "—"}</span>
                          </div>
                          <div className="csh-vote__bar" aria-hidden="true">
                            <motion.span
                              initial={false}
                              animate={{ width: `${totalVotes > 0 ? pct : 0}%` }}
                              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                            />
                          </div>
                        </div>
                      </div>
                    </button>

                    {!state?.hasVoted && (
                      <div className="csh-vote__actions">
                        <button
                          type="button"
                          className={`csh-btn csh-btn--vote${isFocused ? " is-ready" : ""}`}
                          disabled={!isFocused || submitting !== null}
                          onClick={() => vote(design.id)}
                        >
                          {submitting === design.id
                            ? "Wird gesendet…"
                            : isFocused
                              ? "Stimme abgeben"
                              : "Zuerst auswählen"}
                        </button>
                      </div>
                    )}
                  </motion.article>
                );
              })}
            </motion.div>
          </>
        )}

        <p className="csh-vote__fineprint">
          Eine Stimme pro Person. Wiederholte Versuche werden serverseitig erkannt.
        </p>
      </div>
    </section>
  );
}
