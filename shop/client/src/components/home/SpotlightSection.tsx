import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import type { SiteSettings } from "@shared/shop-types";
import { fetchSiteSettings } from "@/lib/admin-api";
import { fadeUp, transition } from "@/lib/motion";
import { scrollToTop } from "@/lib/scroll";
import DropVoteSection from "@/components/home/DropVoteSection";
import { useCatalog } from "@/hooks/useCatalog";

function collectionHref(id: string) {
  if (id === "large") return "/kollektion/gross";
  if (id === "small") return "/kollektion/klein";
  return `/kollektion/${encodeURIComponent(id)}`;
}

function CountdownBlock({
  until,
  title,
  lead,
}: {
  until: string | null;
  title: string;
  lead: string;
}) {
  const target = until ? Date.parse(until) : NaN;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!Number.isFinite(target)) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [target]);

  const parts = useMemo(() => {
    if (!Number.isFinite(target)) return null;
    const diff = Math.max(0, target - now);
    const totalSec = Math.floor(diff / 1000);
    const days = Math.floor(totalSec / 86400);
    const hours = Math.floor((totalSec % 86400) / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return { days, hours, minutes, seconds, done: diff <= 0 };
  }, [now, target]);

  return (
    <section id="spotlight" className="csh-vote csh-spotlight">
      <div className="csh-vote__shell">
        <header className="csh-vote__header">
          <div className="csh-vote__header-text">
            <p className="csh-label">Countdown</p>
            <h2 className="csh-serif csh-vote__title">{title}</h2>
            <p className="csh-body csh-vote__lead">{lead}</p>
          </div>
        </header>
        {!parts ? (
          <p className="csh-body">Datum noch nicht gesetzt.</p>
        ) : parts.done ? (
          <p className="csh-serif csh-spotlight__live">Jetzt live.</p>
        ) : (
          <div className="csh-spotlight__timer" aria-live="polite">
            {[
              { label: "Tage", value: parts.days },
              { label: "Std", value: parts.hours },
              { label: "Min", value: parts.minutes },
              { label: "Sek", value: parts.seconds },
            ].map((unit) => (
              <div key={unit.label} className="csh-spotlight__unit">
                <strong>{String(unit.value).padStart(2, "0")}</strong>
                <span>{unit.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function DropBlock({ settings }: { settings: SiteSettings }) {
  const { collections, getProduct } = useCatalog();
  const href =
    settings.spotlight.dropKind === "product"
      ? `/produkt/${encodeURIComponent(settings.spotlight.dropTarget)}`
      : collectionHref(settings.spotlight.dropTarget);
  const label =
    settings.spotlight.dropKind === "product"
      ? getProduct(settings.spotlight.dropTarget)?.name
      : collections.find((c) => c.id === settings.spotlight.dropTarget)?.name;

  return (
    <section id="spotlight" className="csh-vote csh-spotlight">
      <div className="csh-vote__shell">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} transition={transition}>
          <p className="csh-label">Neuer Drop</p>
          <h2 className="csh-serif csh-vote__title">{settings.spotlight.dropTitle}</h2>
          <p className="csh-body csh-vote__lead">{settings.spotlight.dropLead}</p>
          {label && <p className="csh-body">{label}</p>}
          <Link href={href} className="csh-btn csh-spotlight__cta" onClick={() => scrollToTop()}>
            {settings.spotlight.dropCta}
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default function SpotlightSection() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const next = await fetchSiteSettings();
        if (!cancelled) setSettings(next);
      } catch {
        if (!cancelled) setSettings(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!settings || settings.spotlight.mode === "votes") {
    return <DropVoteSection />;
  }
  if (settings.spotlight.mode === "countdown") {
    return (
      <CountdownBlock
        until={settings.spotlight.countdownUntil}
        title={settings.spotlight.countdownTitle}
        lead={settings.spotlight.countdownLead}
      />
    );
  }
  return <DropBlock settings={settings} />;
}
