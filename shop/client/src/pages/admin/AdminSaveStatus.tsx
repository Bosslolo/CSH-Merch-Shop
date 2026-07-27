import type { AdminAutoSaveStatus } from "@/lib/use-admin-auto-save";

const LABELS: Record<AdminAutoSaveStatus, string> = {
  idle: "Auto-Save aktiv",
  dirty: "Änderungen…",
  saving: "Speichert…",
  saved: "Alles gespeichert",
  error: "Speichern fehlgeschlagen",
};

export default function AdminSaveStatus({
  status,
  onRetry,
}: {
  status: AdminAutoSaveStatus;
  onRetry?: () => void;
}) {
  if (status === "error") {
    return (
      <button
        type="button"
        className="admin-sync admin-sync--error"
        onClick={onRetry}
        aria-live="polite"
      >
        <span className="admin-sync__dot" aria-hidden />
        <span>{LABELS.error} — Tippen zum Wiederholen</span>
      </button>
    );
  }

  return (
    <span className={`admin-sync admin-sync--${status}`} aria-live="polite">
      <span className="admin-sync__dot" aria-hidden />
      <span>{LABELS[status]}</span>
    </span>
  );
}
