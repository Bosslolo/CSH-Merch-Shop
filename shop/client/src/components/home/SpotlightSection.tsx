import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import type { SiteSettings } from "@shared/shop-types";
import { catalog } from "@/assets/images";
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

function pad(n: number) {
  return String(n).padStart(2, "0");
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
    return {
      days: Math.floor(totalSec / 86400),
      hours: Math.floor((totalSec % 86400) / 3600),
      minutes: Math.floor((totalSec % 3600) / 60),
      seconds: totalSec % 60,
      done: diff <= 0,
    };
  }, [now, target]);

  return (
    <motion.section
      id="spotlight"
      className="csh-spot"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      transition={transition}
      aria-live="polite"
    >
      <div className="csh-spot__panel csh-spot__panel--countdown">
        <div className="csh-spot__copy">
          <p className="csh-label">Countdown</p>
          <h2 className="csh-serif csh-spot__title">{title}</h2>
          {lead ? <p className="csh-body csh-spot__lead">{lead}</p> : null}
          {parts?.done ? (
            <p className="csh-spot__live">
              Jetzt live.{" "}
              <Link href="/kollektion/gross" className="csh-link" onClick={() => scrollToTop()}>
                Zur Kollektion
              </Link>
            </p>
          ) : null}
        </div>

        <div className="csh-spot__aside">
          {!parts ? (
            <p className="csh-body">Datum noch nicht gesetzt.</p>
          ) : parts.done ? (
            <p className="csh-spot__aside-live">Live</p>
          ) : (
            <div className="csh-spot__clock">
              {[
                { label: "Tage", value: parts.days },
                { label: "Std", value: parts.hours },
                { label: "Min", value: parts.minutes },
                { label: "Sek", value: parts.seconds },
              ].map((unit) => (
                <div key={unit.label} className="csh-spot__clock-unit">
                  <strong>{pad(unit.value)}</strong>
                  <span>{unit.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
}

function DropBlock({ settings }: { settings: SiteSettings }) {
  const { collections, getProduct } = useCatalog();
  const isProduct = settings.spotlight.dropKind === "product";
  const product = isProduct ? getProduct(settings.spotlight.dropTarget) : undefined;
  const collection = !isProduct
    ? collections.find((c) => c.id === settings.spotlight.dropTarget)
    : undefined;

  const href = isProduct
    ? `/produkt/${encodeURIComponent(settings.spotlight.dropTarget)}`
    : collectionHref(settings.spotlight.dropTarget);

  const label = product?.name ?? collection?.name;
  const image =
    product?.image ||
    (collection?.id === "small" ? catalog.hero.lifestylePingpong : catalog.panel.collectionInset);

  return (
    <motion.section
      id="spotlight"
      className="csh-spot"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      variants={fadeUp}
      transition={transition}
    >
      <div className="csh-spot__panel csh-spot__panel--drop">
        <div className="csh-spot__drop-media">
          <img src={image} alt={label || settings.spotlight.dropTitle} loading="lazy" />
        </div>
        <div className="csh-spot__copy">
          <p className="csh-label">Neuer Drop</p>
          <h2 className="csh-serif csh-spot__title">{settings.spotlight.dropTitle}</h2>
          {settings.spotlight.dropLead ? (
            <p className="csh-body csh-spot__lead">{settings.spotlight.dropLead}</p>
          ) : null}
          {label ? <p className="csh-spot__meta">{label}</p> : null}
          <Link href={href} className="csh-link" onClick={() => scrollToTop()}>
            {settings.spotlight.dropCta || "Zum Drop"}
          </Link>
        </div>
      </div>
    </motion.section>
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
