/**
 * NewCollectionSection — CSH Merch Shop
 * Full-bleed teaser for the upcoming new collection
 * Asymmetric layout: large image left, editorial text right
 */

import { images } from "@/assets/images";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

export default function NewCollectionSection() {
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
    <section id="neue-kollektion" ref={ref} className="relative bg-[#F5F2ED] overflow-hidden">
      {/* Section label */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 hidden xl:flex items-center">
        <span className="vertical-label text-[#0F1F3D]/20 text-[9px]">
          Neue Kollektion — Coming Soon
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-[80vh]">
        {/* Left: Large editorial image */}
        <div
          className={`relative overflow-hidden transition-all duration-1000 ${visible ? "opacity-100" : "opacity-0"}`}
          style={{ minHeight: "500px" }}
        >
          <img
            src={images.newCollectionTeaser}
            alt="Neue CSH Kollektion"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#F5F2ED]/20" />

          {/* "NEU" badge */}
          <div className="absolute top-8 left-8">
            <div className="bg-[#C9A84C] px-4 py-2">
              <span className="font-mono-label text-[#0F1F3D] text-[10px]">Neue Kollektion</span>
            </div>
          </div>
        </div>

        {/* Right: Text content */}
        <div className="flex flex-col justify-center px-8 md:px-12 lg:px-16 py-20 lg:py-0">
          <p
            className={`font-mono-label text-[#C9A84C] text-xs mb-6 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            style={{ transitionDelay: "200ms" }}
          >
            Kollektion 2025 · Demnächst
          </p>

          <h2
            className={`font-display text-4xl md:text-5xl lg:text-6xl font-bold text-[#0F1F3D] leading-[1.05] mb-6 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}`}
            style={{ transitionDelay: "320ms" }}
          >
            Eine neue
            <br />
            <em className="italic font-light">Generation.</em>
          </h2>

          <p
            className={`font-body text-[#0F1F3D]/60 text-base font-light leading-relaxed max-w-sm mb-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            style={{ transitionDelay: "440ms" }}
          >
            Unsere neue Kollektion kommt. Cleaner als je zuvor, mit neuem Design
            und denselben Werten. Trag die Schule, die dich geprägt hat.
          </p>

          {/* Notify form */}
          <div
            className={`transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
            style={{ transitionDelay: "560ms" }}
          >
            <p className="font-mono-label text-[#0F1F3D]/40 text-[9px] mb-3">
              Benachrichtigung erhalten
            </p>
            <div className="flex gap-0 max-w-sm">
              <input
                type="email"
                placeholder="deine@email.de"
                className="flex-1 bg-transparent border border-[#0F1F3D]/20 border-r-0 px-4 py-3 font-body text-sm text-[#0F1F3D] placeholder:text-[#0F1F3D]/30 outline-none focus:border-[#0F1F3D]/60 transition-colors"
              />
              <button
                onClick={() => toast("Du wirst benachrichtigt, wenn die neue Kollektion live geht.")}
                className="bg-[#0F1F3D] text-[#F5F2ED] px-6 py-3 font-mono-label text-[10px] hover:bg-[#0F1F3D]/80 transition-colors active:scale-[0.97]"
              >
                Notify
              </button>
            </div>
          </div>

          {/* Decorative element */}
          <div
            className={`mt-16 flex items-center gap-6 transition-all duration-700 ${visible ? "opacity-100" : "opacity-0"}`}
            style={{ transitionDelay: "700ms" }}
          >
            <div className="w-16 h-px bg-[#0F1F3D]/20" />
            <div className="w-8 h-8 rounded-full border border-[#0F1F3D]/20 flex items-center justify-center">
              <span className="font-mono-label text-[7px] text-[#0F1F3D]/40">CSH</span>
            </div>
            <div className="w-16 h-px bg-[#0F1F3D]/20" />
          </div>
        </div>
      </div>
    </section>
  );
}
