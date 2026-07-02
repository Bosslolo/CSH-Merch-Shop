/**
 * HeroSection — CSH Merch Shop
 * Full-bleed cinematic hero with community image, offset text, slow zoom animation
 * Dark text overlay gradient from bottom
 */

import { images } from "@/assets/images";
import { useEffect, useRef, useState } from "react";

export default function HeroSection() {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  return (
    <section className="relative w-full h-screen min-h-[600px] overflow-hidden">
      {/* Background Image */}
      <img
        ref={imgRef}
        src={images.heroCommunity}
        alt="CSH Gemeinschaft"
        onLoad={() => setLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover object-center transition-opacity duration-700 ${loaded ? "opacity-100 animate-slow-zoom" : "opacity-0"}`}
        style={{ transformOrigin: "center center" }}
      />

      {/* Gradient overlays */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0F1F3D]/80 via-[#0F1F3D]/20 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#0F1F3D]/40 to-transparent" />

      {/* Film grain */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end pb-16 md:pb-24">
        <div className="container">
          <div className="max-w-2xl">
            {/* Label */}
            <p
              className="font-mono-label text-[#C9A84C] text-xs mb-6 opacity-0 animate-fade-up"
              style={{ animationDelay: "200ms", animationFillMode: "forwards" }}
            >
              Christliche Schule im Hegau · Hilzingen
            </p>

            {/* Main headline */}
            <h1
              className="font-display text-5xl md:text-7xl lg:text-8xl font-bold text-[#F5F2ED] leading-[0.92] mb-6 opacity-0 animate-fade-up"
              style={{ animationDelay: "350ms", animationFillMode: "forwards" }}
            >
              Mehr als
              <br />
              <em className="italic font-light">eine Schule.</em>
            </h1>

            {/* Subline */}
            <p
              className="font-body text-[#F5F2ED]/80 text-base md:text-lg font-light max-w-md leading-relaxed mb-10 opacity-0 animate-fade-up"
              style={{ animationDelay: "500ms", animationFillMode: "forwards" }}
            >
              Eine Gemeinschaft, die trägt. Ein Hoodie, ein T-Shirt — ein Zeichen, dass du dazugehörst.
            </p>

            {/* CTAs */}
            <div
              className="flex flex-col sm:flex-row gap-4 opacity-0 animate-fade-up"
              style={{ animationDelay: "650ms", animationFillMode: "forwards" }}
            >
              <a
                href="#kollektion"
                className="inline-flex items-center gap-3 bg-[#F5F2ED] text-[#0F1F3D] px-8 py-4 font-body font-medium text-sm tracking-wide transition-all duration-200 hover:bg-white active:scale-[0.97]"
              >
                Kollektion entdecken
                <span className="font-mono-label text-xs">→</span>
              </a>
              <a
                href="#neue-kollektion"
                className="inline-flex items-center gap-3 border border-[#F5F2ED]/50 text-[#F5F2ED] px-8 py-4 font-body font-light text-sm tracking-wide transition-all duration-200 hover:border-[#F5F2ED] hover:bg-[#F5F2ED]/10 active:scale-[0.97]"
              >
                Neue Kollektion
                <span className="text-[#C9A84C] font-mono-label text-xs">BALD</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Vertical label — right edge */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-2">
        <span className="vertical-label text-[#F5F2ED]/40 text-[9px]">
          Lerne lernen — lerne leben
        </span>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 right-8 hidden md:flex flex-col items-center gap-2">
        <div className="w-px h-12 bg-[#F5F2ED]/30 relative overflow-hidden">
          <div
            className="absolute top-0 left-0 w-full bg-[#C9A84C]"
            style={{
              height: "40%",
              animation: "scrollLine 2s ease-in-out infinite",
            }}
          />
        </div>
        <span className="font-mono-label text-[#F5F2ED]/40 text-[8px]">Scroll</span>
      </div>

      <style>{`
        @keyframes scrollLine {
          0% { top: -40%; }
          100% { top: 140%; }
        }
      `}</style>
    </section>
  );
}
