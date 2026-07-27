import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export type AdminAutoSaveStatus = "idle" | "dirty" | "saving" | "saved" | "error";

export function useAdminAutoSave(options: {
  enabled: boolean;
  loadGeneration: number;
  watchKey: string;
  onSave: () => Promise<string | void>;
  delayMs?: number;
}) {
  const { enabled, loadGeneration, watchKey, delayMs = 1500 } = options;
  const [status, setStatus] = useState<AdminAutoSaveStatus>("idle");
  const baselineRef = useRef<string | null>(null);
  const onSaveRef = useRef(options.onSave);
  onSaveRef.current = options.onSave;
  const watchKeyRef = useRef(watchKey);
  watchKeyRef.current = watchKey;
  const savingRef = useRef(false);
  const pendingRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      baselineRef.current = null;
      setStatus("idle");
      return;
    }
    baselineRef.current = watchKeyRef.current;
    setStatus("saved");
  }, [enabled, loadGeneration]);

  const flushSave = useCallback(async () => {
    if (!enabled || baselineRef.current === null) return;
    if (watchKeyRef.current === baselineRef.current) return;

    if (savingRef.current) {
      pendingRef.current = true;
      return;
    }

    savingRef.current = true;
    setStatus("saving");
    try {
      const savedKey = await onSaveRef.current();
      baselineRef.current = savedKey ?? watchKeyRef.current;
      setStatus("saved");
    } catch (error) {
      setStatus("error");
      toast.error(error instanceof Error ? error.message : "Speichern fehlgeschlagen.");
    } finally {
      savingRef.current = false;
      if (pendingRef.current) {
        pendingRef.current = false;
        if (watchKeyRef.current !== baselineRef.current) {
          void flushSave();
        }
      }
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || baselineRef.current === null) return;
    if (watchKey === baselineRef.current) return;

    setStatus("dirty");
    const timer = window.setTimeout(() => {
      void flushSave();
    }, delayMs);
    return () => window.clearTimeout(timer);
  }, [enabled, watchKey, delayMs, flushSave]);

  return { status, saveNow: flushSave };
}
