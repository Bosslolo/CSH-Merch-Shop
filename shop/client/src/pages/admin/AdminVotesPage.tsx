import { useEffect, useState } from "react";
import { VOTE_DESIGNS } from "@/data/vote-designs";
import { AdminGuard } from "@/contexts/AdminContext";
import { fetchAdminVotes } from "@/lib/admin-api";
import AdminLayout from "./AdminLayout";

export default function AdminVotesPage() {
  const [votes, setVotes] = useState<{ totalVotes: number; tallies: Record<string, number> } | null>(null);

  useEffect(() => {
    fetchAdminVotes().then(setVotes).catch(() => setVotes({ totalVotes: 0, tallies: {} }));
  }, []);

  const total = votes?.totalVotes ?? 0;

  return (
    <AdminGuard>
      <AdminLayout title="Abstimmung">
        <p className="admin-muted">{total} Stimmen insgesamt</p>
        <div className="admin-vote-grid">
          {VOTE_DESIGNS.map((design) => {
            const count = votes?.tallies[design.id] ?? 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <article key={design.id} className="admin-vote-card">
                <img src={design.image} alt={design.title} loading="lazy" />
                <h3>{design.title}</h3>
                <p className="admin-muted">{count} Stimmen · {pct}%</p>
                <div className="admin-vote-bar" aria-hidden="true">
                  <span style={{ width: `${pct}%` }} />
                </div>
              </article>
            );
          })}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
