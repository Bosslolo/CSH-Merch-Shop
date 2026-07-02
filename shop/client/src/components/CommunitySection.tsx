/**
 * CommunitySection — CSH Merch Shop
 * Full-bleed atmospheric school image with community messaging
 * Sells the feeling of belonging — the emotional core of the brand
 */

import { images } from "@/assets/images";
import { useEffect, useRef, useState } from "react";

export default function CommunitySection() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="gemeinschaft" ref={ref} className="relative overflow-hidden" style={{ minHeight: "85vh" }}>
      {/* Full-bleed background image */}
      <img
        src={images.heroCommunity}
        alt="CSH Community"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-[#0F1F3D]/70" />

      {/* Film grain */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.1'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Decorative circles */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "700px",
          height: "700px",
          border: "1px solid rgba(245,242,237,0.05)",
          borderRadius: "50%",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] py-24 text-center">
        <div className="container max-w-4xl">
          <p
            className={`font-mono-label text-[#C9A84C] text-xs mb-8 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
          >
            Gemeinschaft · Community · Zusammenhalt
          </p>

          <h2
            className={`font-display text-5xl md:text-6xl lg:text-7xl font-bold text-[#F5F2ED] leading-[1.0] mb-8 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            style={{ transitionDelay: "150ms" }}
          >
            Trag, was
            <br />
            <em className="italic font-light text-[#F5F2ED]/80">dich ausmacht.</em>
          </h2>

          <p
            className={`font-body text-[#F5F2ED]/60 text-base md:text-lg font-light leading-relaxed max-w-lg mx-auto mb-12 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            style={{ transitionDelay: "300ms" }}
          >
            Ein Hoodie ist nur Stoff. Aber ein CSH-Hoodie trägt die Geschichte
            einer Schule, die Menschen zusammenbringt. Wer ihn trägt, sagt:
            Ich war dabei.
          </p>

          {/* Three pillars */}
          <div
            className={`grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            style={{ transitionDelay: "450ms" }}
          >
            {[
              { label: "Miteinander", desc: "Jedes Stück verbindet dich mit einer Gemeinschaft, die trägt." },
              { label: "Voneinander", desc: "Design, das von Schülerinnen und Schülern inspiriert wurde." },
              { label: "Füreinander", desc: "Erlös unterstützt Schulprojekte und die CSH-Gemeinschaft." },
            ].map((pillar, i) => (
              <div
                key={pillar.label}
                className={`text-center transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
                style={{ transitionDelay: `${450 + i * 100}ms` }}
              >
                <div className="w-8 h-px bg-[#C9A84C] mx-auto mb-4" />
                <h3 className="font-display text-xl font-semibold text-[#F5F2ED] mb-2">{pillar.label}</h3>
                <p className="font-body text-[#F5F2ED]/50 text-sm font-light leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
