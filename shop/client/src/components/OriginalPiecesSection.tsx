/**
 * OriginalPiecesSection — CSH Merch Shop
 * Showcase of original pieces — editorial product grid
 * Sell-out urgency + premium product presentation
 * Design: Gemeinschaft — asymmetric grid, photography-first, warm off-white bg
 */

import { images } from "@/assets/images";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const PRODUCTS = [
  {
    id: 1,
    name: "CSH Hoodie Blau",
    subtitle: "Letzte Auflage",
    price: "25 €",
    image: images.heroHoodieModel,
    tag: "Letzte Auflage",
    tagBg: "#C9A84C",
    tagText: "#0F1F3D",
    colors: ["#0F1F3D", "#1A1A1A"],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: 2,
    name: "CSH T-Shirt Schwarz",
    subtitle: "Letzte Auflage",
    price: "15 €",
    image: images.tshirtModel,
    tag: "Letzte Auflage",
    tagBg: "#0F1F3D",
    tagText: "#F5F2ED",
    colors: ["#F5F2ED", "#0F1F3D"],
    sizes: ["S", "M", "L", "XL"],
  },
  {
    id: 3,
    name: "CSH Hoodie Weiss",
    subtitle: "Letzte Auflage",
    price: "25 €",
    image: images.newCollectionTeaser,
    tag: "Letzte Auflage",
    tagBg: "#C9A84C",
    tagText: "#0F1F3D",
    colors: ["#0F1F3D"],
    sizes: ["S", "M", "L"],
  },
  {
    id: 4,
    name: "CSH Hoodie Schwarz",
    subtitle: "Letzte Auflage",
    price: "25 €",
    image: images.collectionBanner,
    tag: "Letzte Auflage",
    tagBg: "#0F1F3D",
    tagText: "#F5F2ED",
    colors: ["#1A1A1A"],
    sizes: ["S", "M", "L", "XL"],
  },
];

interface ProductCardProps {
  product: typeof PRODUCTS[0];
  index: number;
  visible: boolean;
}

function ProductCard({ product, index, visible }: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const [selectedSize, setSelectedSize] = useState("");

  return (
    <div
      className={`group transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}
      style={{ transitionDelay: `${index * 120}ms` }}
    >
      {/* Image container */}
      <div
        className="relative overflow-hidden cursor-pointer"
        style={{ aspectRatio: "3/4", backgroundColor: "#E8E4DE" }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => toast(`${product.name} — Bestellung in Kürze möglich.`)}
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover object-center transition-transform duration-700"
          style={{ transform: hovered ? "scale(1.06)" : "scale(1)" }}
        />

        {/* Subtle dark overlay on hover */}
        <div
          className="absolute inset-0 transition-opacity duration-400"
          style={{
            background: "linear-gradient(to top, rgba(15,31,61,0.5) 0%, transparent 60%)",
            opacity: hovered ? 1 : 0.3,
          }}
        />

        {/* Tag */}
        <div className="absolute top-3 left-3">
          <span
            className="font-mono-label text-[9px] px-3 py-1.5"
            style={{ backgroundColor: product.tagBg, color: product.tagText }}
          >
            {product.tag}
          </span>
        </div>

        {/* Quick add on hover */}
        <div
          className="absolute bottom-0 left-0 right-0 p-4 transition-all duration-300"
          style={{
            opacity: hovered ? 1 : 0,
            transform: hovered ? "translateY(0)" : "translateY(12px)",
          }}
        >
          {/* Size selector */}
          <div className="flex gap-1 mb-2 flex-wrap">
            {product.sizes.map((size) => (
              <button
                key={size}
                onClick={(e) => { e.stopPropagation(); setSelectedSize(size); }}
                className="font-mono-label text-[8px] px-2 py-1 border transition-colors"
                style={{
                  borderColor: selectedSize === size ? "#F5F2ED" : "rgba(245,242,237,0.4)",
                  backgroundColor: selectedSize === size ? "#F5F2ED" : "transparent",
                  color: selectedSize === size ? "#0F1F3D" : "#F5F2ED",
                }}
              >
                {size}
              </button>
            ))}
          </div>
          <button
            className="w-full py-2.5 font-mono-label text-[10px] transition-colors"
            style={{ backgroundColor: "#F5F2ED", color: "#0F1F3D" }}
            onClick={(e) => {
              e.stopPropagation();
              toast(selectedSize
                ? `${product.name} (${selectedSize}) zum Warenkorb hinzugefügt.`
                : `Bitte wähle eine Groesse für ${product.name}.`
              );
            }}
          >
            In den Warenkorb
          </button>
        </div>
      </div>

      {/* Product info */}
      <div className="mt-4">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h3 className="font-body text-[#0F1F3D] font-medium text-sm leading-tight">{product.name}</h3>
            <p className="font-mono-label text-[#0F1F3D]/40 text-[8px] mt-0.5">{product.subtitle}</p>
          </div>
          <p className="font-display text-[#0F1F3D] font-semibold text-sm">{product.price}</p>
        </div>

        {/* Color swatches */}
        <div className="flex gap-1.5 mt-2">
          {product.colors.map((color, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full"
              style={{
                backgroundColor: color,
                border: color === "#F5F2ED" ? "1px solid rgba(15,31,61,0.2)" : "none",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function OriginalPiecesSection() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.08 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="kollektion" ref={ref} className="bg-[#F5F2ED]">
      {/* School building strip */}
      <div className="relative h-48 md:h-64 overflow-hidden">
        <img
          src={images.schoolCourtyard}
          alt="CSH Schulgebäude"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-[#0F1F3D]/50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="font-mono-label text-[#C9A84C] text-[10px] mb-2">Hilzingen · Baden-Württemberg</p>
            <p className="font-display text-[#F5F2ED] text-2xl md:text-3xl font-light italic">
              Christliche Schule im Hegau
            </p>
          </div>
        </div>
      </div>

      <div className="container py-20 md:py-28">
        {/* Section header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-6">
          <div>
            <p
              className={`font-mono-label text-[#C9A84C] text-xs mb-4 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            >
              Original Kollektion · Jetzt kaufen
            </p>
            <h2
              className={`font-display text-4xl md:text-5xl font-bold text-[#0F1F3D] leading-tight transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              style={{ transitionDelay: "100ms" }}
            >
              Die Stücke,
              <br />
              <em className="italic font-light">die es noch gibt.</em>
            </h2>
          </div>

          <div
            className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
            style={{ transitionDelay: "200ms" }}
          >
            <p className="font-body text-[#0F1F3D]/50 text-sm font-light max-w-xs leading-relaxed">
              Unsere originalen Stücke aus den Anfangsjahren.
              Limitiert, authentisch — und bald vergriffen.
            </p>
          </div>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {PRODUCTS.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} visible={visible} />
          ))}
        </div>

        {/* Bottom CTA */}
        <div
          className={`mt-14 flex flex-col sm:flex-row items-center justify-between gap-6 pt-8 border-t border-[#0F1F3D]/10 transition-all duration-700 ${visible ? "opacity-100" : "opacity-0"}`}
          style={{ transitionDelay: "600ms" }}
        >
          <p className="font-body text-[#0F1F3D]/40 text-sm font-light">
            Alle Stücke sind limitiert verfügbar. Bestellungen werden gesammelt und verarbeitet.
          </p>
          <button
            onClick={() => toast("Vollständige Kollektion — Bestellung in Kürze möglich.")}
            className="flex items-center gap-2 font-mono-label text-[#0F1F3D] text-[10px] hover:opacity-60 transition-opacity"
          >
            Alle Stücke ansehen
            <span className="w-6 h-px bg-[#0F1F3D] inline-block" />
          </button>
        </div>
      </div>
    </section>
  );
}
