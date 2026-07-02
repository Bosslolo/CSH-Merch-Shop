/**
 * FooterSection — CSH Merch Shop
 * Dark navy footer with school info, links, and brand mark
 */

import { toast } from "sonner";

export default function FooterSection() {
  const handleComingSoon = () => toast("Kommt bald — Stay tuned.");

  return (
    <footer className="bg-[#0A1628] text-[#F5F2ED]">
      {/* Main footer content */}
      <div className="container py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full border border-[#F5F2ED]/30 flex items-center justify-center">
                <span className="font-mono-label text-[10px] text-[#F5F2ED]">CSH</span>
              </div>
              <div>
                <p className="font-display font-semibold text-base text-[#F5F2ED]">CSH Merch</p>
                <p className="font-mono-label text-[8px] text-[#F5F2ED]/40">Christliche Schule im Hegau</p>
              </div>
            </div>

            <p className="font-body text-[#F5F2ED]/50 text-sm font-light leading-relaxed max-w-xs mb-8">
              Offizieller Merch-Shop der Christlichen Schule im Hegau.
              Trag, was dich ausmacht — und zeig, dass du dazugehörst.
            </p>

            <div className="flex items-center gap-3">
              <div className="w-8 h-px bg-[#C9A84C]" />
              <p className="font-mono-label text-[#C9A84C] text-[9px]">Lerne lernen — lerne leben</p>
            </div>
          </div>

          {/* Shop links */}
          <div>
            <p className="font-mono-label text-[#F5F2ED]/30 text-[9px] mb-6">Shop</p>
            <ul className="space-y-3">
              {["Alle Produkte", "Hoodies", "T-Shirts", "Crewnecks", "Neue Kollektion"].map((item) => (
                <li key={item}>
                  <button
                    onClick={handleComingSoon}
                    className="font-body text-[#F5F2ED]/60 text-sm font-light hover:text-[#F5F2ED] transition-colors link-underline"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Info links */}
          <div>
            <p className="font-mono-label text-[#F5F2ED]/30 text-[9px] mb-6">Info</p>
            <ul className="space-y-3">
              {["Über die CSH", "Bestellungen", "Versand und Rückgabe", "Kontakt", "Impressum"].map((item) => (
                <li key={item}>
                  <button
                    onClick={handleComingSoon}
                    className="font-body text-[#F5F2ED]/60 text-sm font-light hover:text-[#F5F2ED] transition-colors link-underline"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>

            {/* School contact */}
            <div className="mt-8 pt-8 border-t border-[#F5F2ED]/10">
              <p className="font-mono-label text-[#F5F2ED]/30 text-[9px] mb-3">Schule</p>
              <p className="font-body text-[#F5F2ED]/50 text-xs font-light leading-relaxed">
                Am Sportplatz 16<br />
                78247 Hilzingen<br />
                <a
                  href="https://www.cs-bodensee.de"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#C9A84C] hover:text-[#C9A84C]/80 transition-colors"
                >
                  cs-bodensee.de
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#F5F2ED]/8">
        <div className="container py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono-label text-[#F5F2ED]/20 text-[9px]">
            © 2025 Christliche Schule im Hegau · CSH Merch
          </p>

          <div className="flex items-center gap-6">
            <button onClick={handleComingSoon} className="font-mono-label text-[#F5F2ED]/20 text-[9px] hover:text-[#F5F2ED]/40 transition-colors">
              Datenschutz
            </button>
            <button onClick={handleComingSoon} className="font-mono-label text-[#F5F2ED]/20 text-[9px] hover:text-[#F5F2ED]/40 transition-colors">
              Impressum
            </button>
          </div>

          {/* CSH circle mark */}
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full border border-[#F5F2ED]/20 flex items-center justify-center">
              <span className="font-mono-label text-[6px] text-[#F5F2ED]/30">CSH</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
