import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import type { CatalogProduct } from "@shared/shop-types";
import { EASE } from "@/lib/motion";
import { scrollToTop } from "@/lib/scroll";

interface Props {
  product: CatalogProduct;
  compact?: boolean;
}

function Panel({
  id,
  title,
  open,
  onToggle,
  children,
}: {
  id: string;
  title: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className={`product-page__info-panel${open ? " is-open" : ""}`}>
      <button type="button" className="product-page__info-panel-trigger" aria-expanded={open} onClick={onToggle}>
        <span>{title}</span>
        <span className="product-page__info-panel-icon" aria-hidden="true">
          {open ? "−" : "+"}
        </span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            className="product-page__info-panel-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <div className="product-page__info-panel-inner">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ProductInfoPanels({ product, compact }: Props) {
  const [materialOpen, setMaterialOpen] = useState(false);
  const [fitOpen, setFitOpen] = useState(false);

  return (
    <div className="product-page__info-stack">
      <Panel
        id="product-info-material"
        title="Material"
        open={materialOpen}
        onToggle={() => setMaterialOpen((v) => !v)}
      >
        <p className="csh-body">{product.material || "—"}</p>
      </Panel>
      <Panel
        id="product-info-fit"
        title="Größe & Passform"
        open={fitOpen}
        onToggle={() => setFitOpen((v) => !v)}
      >
        <p className="csh-body">{product.sizingNote || "—"}</p>
      </Panel>
      {!compact && (
        <Link
          href={`/produkt/${encodeURIComponent(product.slug)}/infos`}
          className="product-page__infos-link"
          onClick={() => scrollToTop()}
        >
          Alle Produktinfos
        </Link>
      )}
    </div>
  );
}
