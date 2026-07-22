import { Link, useLocation } from "wouter";
import { ShoppingBag, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import { containerStagger, fadeUp, transition } from "@/lib/motion";
import { useCart } from "@/contexts/CartContext";
import { useIntro } from "@/contexts/IntroContext";
import { useNav } from "@/contexts/NavContext";
import { scrollToTop } from "@/lib/scroll";
import { catalog } from "@/assets/images";

const ROUTE_LINKS = [
  { href: "/kollektion/gross", label: "Grosse Kollektion" },
  { href: "/kollektion/klein", label: "Kleine Kollektion" },
] as const;

function scrollToAbstimmung() {
  requestAnimationFrame(() => {
    document.getElementById("abstimmung")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

export default function SiteHeader() {
  const [location, navigate] = useLocation();
  const { setOpen: setCartOpen, itemCount } = useCart();
  const { introComplete, showSplash, headerLogoRef, replayIntro } = useIntro();
  const { menuOpen, setMenuOpen, openMenu } = useNav();

  const closeMenu = () => setMenuOpen(false);

  /** Same full-screen nav as the splash big-logo click. */
  const handleLogoClick = () => {
    if (menuOpen) {
      closeMenu();
      return;
    }
    openMenu();
  };

  const handleNavLink = () => {
    closeMenu();
    scrollToTop();
  };

  const handleStartLogo = () => {
    closeMenu();
    replayIntro();
    if (location !== "/") navigate("/");
  };

  const handleAbstimmung = () => {
    closeMenu();
    if (location !== "/") {
      navigate("/");
      window.setTimeout(scrollToAbstimmung, 120);
    } else {
      scrollToAbstimmung();
    }
  };

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMenu();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const navItems = [
    { key: "start", label: "Start", onClick: handleStartLogo },
    ...ROUTE_LINKS.map((l) => ({ key: l.href, label: l.label, href: l.href })),
    { key: "abstimmung", label: "Abstimmung", onClick: handleAbstimmung },
    { key: "back", label: "Zurück", onClick: closeMenu },
  ];

  return (
    <>
      <header className={`csh-header${showSplash && !introComplete ? " csh-header--splash" : ""}`}>
        <div className="csh-header__inner">
          <button
            type="button"
            className="csh-header__logo-link"
            onClick={handleLogoClick}
            aria-label={menuOpen ? "Menü schliessen" : "Menü öffnen"}
            aria-expanded={menuOpen}
          >
            <img
              ref={headerLogoRef}
              src={catalog.brand.logoWhite}
              alt="CSH Merch"
              className="csh-header__logo-img"
            />
          </button>
          <div className="csh-header__actions">
            <button
              type="button"
              className="csh-header__icon csh-header__icon--bag"
              aria-label="Warenkorb"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingBag size={17} strokeWidth={1.5} />
              {itemCount > 0 && <span className="csh-header__badge">{itemCount}</span>}
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="csh-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition}
            onClick={closeMenu}
          >
            <motion.button
              type="button"
              className="csh-menu__close"
              onClick={(e) => {
                e.stopPropagation();
                closeMenu();
              }}
              aria-label="Schliessen"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              exit="hidden"
              transition={{ ...transition, delay: 0.04 }}
            >
              <X size={22} />
            </motion.button>

            <motion.nav
              className="csh-menu__nav"
              variants={containerStagger}
              initial="hidden"
              animate="visible"
              exit="hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {navItems.map((item) => (
                <motion.div key={item.key} variants={fadeUp} transition={transition}>
                  {"href" in item ? (
                    <Link href={item.href} className="csh-menu__link" onClick={handleNavLink}>
                      {item.label}
                    </Link>
                  ) : (
                    <button type="button" className="csh-menu__link csh-menu__link--btn" onClick={item.onClick}>
                      {item.label}
                    </button>
                  )}
                </motion.div>
              ))}
            </motion.nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
