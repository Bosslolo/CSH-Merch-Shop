/**
 * Navigation — CSH Merch Shop
 * Transparent on hero, transitions to navy with blur on scroll
 * Left: CSH wordmark | Center: nav links | Right: cart icon
 */

import { useState } from "react";
import { ShoppingBag, Menu, X } from "lucide-react";
import { toast } from "sonner";

interface NavigationProps {
  scrollY: number;
}

export default function Navigation({ scrollY }: NavigationProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const isScrolled = scrollY > 60;

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMobileOpen(false);
  };

  const navItems = [
    { label: "Kollektion", id: "kollektion" },
    { label: "Neue Drops", id: "neue-kollektion" },
    { label: "Über uns", id: "gemeinschaft" },
  ];

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          backgroundColor: isScrolled ? "rgba(15, 31, 61, 0.96)" : "transparent",
          backdropFilter: isScrolled ? "blur(12px)" : "none",
        }}
      >
        <div className="container flex items-center justify-between h-16 md:h-20">
          {/* Logo / Wordmark */}
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0"
              style={{ borderColor: isScrolled || mobileOpen ? "#F5F2ED" : "rgba(245,242,237,0.9)" }}
            >
              <span
                className="font-mono-label text-[9px] font-medium"
                style={{ color: isScrolled || mobileOpen ? "#F5F2ED" : "rgba(245,242,237,0.9)" }}
              >
                CSH
              </span>
            </div>
            <div>
              <p
                className="font-display font-semibold text-sm leading-tight tracking-wide"
                style={{ color: isScrolled || mobileOpen ? "#F5F2ED" : "rgba(245,242,237,0.95)" }}
              >
                CSH Merch
              </p>
              <p
                className="font-mono-label text-[8px] leading-none"
                style={{ color: isScrolled || mobileOpen ? "rgba(245,242,237,0.6)" : "rgba(245,242,237,0.6)" }}
              >
                Christliche Schule im Hegau
              </p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={() => scrollTo(item.id)}
                className="link-underline font-body text-sm font-light tracking-wide transition-opacity hover:opacity-70"
                style={{ color: isScrolled ? "#F5F2ED" : "rgba(245,242,237,0.9)" }}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Right: Cart + Mobile Menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => toast("Warenkorb — Checkout kommt mit Shopify-Anbindung.")}
              className="relative transition-opacity hover:opacity-70"
              aria-label="Warenkorb"
            >
              <ShoppingBag
                size={20}
                style={{ color: isScrolled ? "#F5F2ED" : "rgba(245,242,237,0.9)" }}
              />
            </button>
            <button
              className="md:hidden transition-opacity hover:opacity-70"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menü"
            >
              {mobileOpen ? (
                <X size={20} style={{ color: "#F5F2ED" }} />
              ) : (
                <Menu size={20} style={{ color: isScrolled ? "#F5F2ED" : "rgba(245,242,237,0.9)" }} />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 flex flex-col justify-center items-center gap-8"
          style={{ backgroundColor: "rgba(15, 31, 61, 0.98)" }}
        >
          {navItems.map((item, i) => (
            <button
              key={item.label}
              onClick={() => scrollTo(item.id)}
              className="font-display text-3xl font-light text-[#F5F2ED] opacity-0 animate-fade-up"
              style={{ animationDelay: `${i * 80}ms`, animationFillMode: "forwards" }}
            >
              {item.label}
            </button>
          ))}
          <div className="mt-8 font-mono-label text-[#F5F2ED] opacity-40 text-xs">
            cs-bodensee.de
          </div>
        </div>
      )}
    </>
  );
}
