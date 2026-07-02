/**
 * ManifestSection — CSH Merch Shop
 * Brand manifesto — asymmetric layout with large display text and school image
 * Sells the feeling of belonging, not just clothing
 */

import { images } from "@/assets/images";
import { useEffect, useRef, useState } from "react";

export default function ManifestSection() {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="relative bg-[#0F1F3D] overflow-hidden"
      style={{ minHeight: "70vh" }}
    >
      {/* Decorative circle watermark */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: "600px",
          height: "600px",
          border: "1px solid rgba(245,242,237,0.06)",
          borderRadius: "50%",
          top: "50%",
          left: "60%",
          transform: "translate(-50%, -50%)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: "400px",
          height: "400px",
          border: "1px solid rgba(245,242,237,0.04)",
          borderRadius: "50%",
          top: "50%",
          left: "60%",
          transform: "translate(-50%, -50%)",
        }}
      />

      <div className="container py-24 md:py-32 lg:py-40">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left: Text */}
          <div>
            <p
              className={`font-mono-label text-[#C9A84C] text-xs mb-8 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              style={{ transitionDelay: "0ms" }}
            >
              Seit 2006 · Hilzingen · Hegau
            </p>

            <h2
              className={`font-display text-4xl md:text-5xl lg:text-6xl font-bold text-[#F5F2ED] leading-[1.05] mb-8 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
              style={{ transitionDelay: "120ms" }}
            >
              Miteinander leben.
              <br />
              <em className="italic font-light text-[#F5F2ED]/70">
                Voneinander lernen.
              </em>
              <br />
              Füreinander da sein.
            </h2>

            <p
              className={`font-body text-[#F5F2ED]/60 text-base font-light leading-relaxed max-w-md mb-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              style={{ transitionDelay: "240ms" }}
            >
              Die CSH ist mehr als ein Ort des Lernens — sie ist ein Lebensraum.
              Unsere Merch-Kollektion trägt diesen Geist nach aussen. Jedes Stück
              ist ein stilles Bekenntnis: Ich bin Teil von etwas Groesserem.
            </p>

            <div
              className={`flex items-center gap-4 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
              style={{ transitionDelay: "360ms" }}
            >
              <div className="w-12 h-px bg-[#C9A84C]" />
              <p className="font-mono-label text-[#C9A84C] text-xs">
                Lerne lernen — lerne leben
              </p>
            </div>
          </div>

          {/* Right: School image */}
          <div
            className={`relative pb-8 md:pb-10 transition-all duration-1000 ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"}`}
            style={{ transitionDelay: "200ms" }}
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              <img
                src={images.schoolSpirit}
                alt="CSH Gemeinschaft"
                className="w-full h-full object-cover object-center"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-[#0F1F3D]/20" />
            </div>

            {/* Floating stat card */}
            <div
              className="absolute -bottom-4 -left-4 md:-bottom-6 md:-left-6 bg-[#F5F2ED] p-4 md:p-6 shadow-2xl"
              style={{ maxWidth: "180px" }}
            >
              <p className="font-display text-3xl font-bold text-[#0F1F3D] leading-none mb-1">250+</p>
              <p className="font-mono-label text-[#0F1F3D]/60 text-[9px]">Schülerinnen und Schüler</p>
              <div className="w-8 h-px bg-[#C9A84C] mt-3" />
              <p className="font-body text-[#0F1F3D]/70 text-xs font-light mt-2">Eine Gemeinschaft</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
