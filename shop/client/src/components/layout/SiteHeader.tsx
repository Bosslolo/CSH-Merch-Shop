import { Link, useLocation } from "wouter";
import { Search, ShoppingBag, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { containerStagger, fadeUp, transition } from "@/lib/motion";
import { useCart } from "@/contexts/CartContext";
import { useIntro } from "@/contexts/IntroContext";
import { useNav } from "@/contexts/NavContext";
import { useSearch } from "@/contexts/SearchContext";
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
  const { setOpen: setSearchOpen } = useSearch();
  const { introComplete, showSplash, headerLogoRef } = useIntro();
  const { menuOpen, setMenuOpen } = useNav();

  const closeMenu = () => setMenuOpen(false);

  const handleLogoHome = () => {
    closeMenu();
    if (location !== "/") navigate("/");
    scrollToTop();
  };

  const handleNavLink = () => {
    closeMenu();
    scrollToTop();
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

  const navItems = [
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
            onClick={handleLogoHome}
            aria-label="Zur Startseite"
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
              className="csh-header__icon"
              aria-label="Suche"
              onClick={() => setSearchOpen(true)}
            >
              <Search size={17} strokeWidth={1.5} />
            </button>
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={transition}
          >
            <motion.button
              type="button"
              className="csh-menu__close"
              onClick={closeMenu}
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
