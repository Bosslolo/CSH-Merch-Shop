import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { catalog } from "@/assets/images";
import { useIntro } from "@/contexts/IntroContext";
import { useNav } from "@/contexts/NavContext";
import { scrollToTop } from "@/lib/scroll";

export default function LogoSplash() {
  const { showSplash, introComplete, headerLogoRef, completeIntro } = useIntro();
  const { openMenu } = useNav();
  const [target, setTarget] = useState<{ x: number; y: number; scale: number } | null>(null);
  const [animating, setAnimating] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const springX = useSpring(x, { stiffness: 120, damping: 22 });
  const springY = useSpring(y, { stiffness: 120, damping: 22 });
  const springScale = useSpring(scale, { stiffness: 120, damping: 22 });

  const splashActive = showSplash && !introComplete;

  useLayoutEffect(() => {
    if (!animating || !headerLogoRef.current) return;
    const headerRect = headerLogoRef.current.getBoundingClientRect();
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    const logoW = Math.min(window.innerWidth * 0.4, 320);
    const headerScale = headerRect.height / logoW;
    setTarget({
      x: headerRect.left + headerRect.width / 2 - centerX,
      y: headerRect.top + headerRect.height / 2 - centerY,
      scale: headerScale,
    });
  }, [animating, headerLogoRef]);

  useEffect(() => {
    if (!target || !animating) return;
    x.set(target.x);
    y.set(target.y);
    scale.set(target.scale);
    const t = window.setTimeout(() => completeIntro(), 700);
    return () => window.clearTimeout(t);
  }, [target, animating, x, y, scale, completeIntro]);

  const wasShowing = useRef(showSplash);

  useEffect(() => {
    const replayed = showSplash && !wasShowing.current;
    wasShowing.current = showSplash;
    if (!replayed || introComplete) return;
    setAnimating(false);
    setTarget(null);
    x.set(0);
    y.set(0);
    scale.set(1);
    scrollToTop();
  }, [showSplash, introComplete, x, y, scale]);

  useEffect(() => {
    if (!splashActive) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    scrollToTop();

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [splashActive]);

  useEffect(() => {
    if (!splashActive || animating) return;

    const dismiss = () => {
      if (animating) return;
      scrollToTop();
      setAnimating(true);
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (Math.abs(e.deltaY) > 8) dismiss();
    };

    let touchY = 0;
    const onTouchStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const dy = touchY - (e.touches[0]?.clientY ?? touchY);
      if (Math.abs(dy) > 30) dismiss();
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [splashActive, animating]);

  if (!showSplash) return null;

  return (
    <motion.div
      className="csh-splash"
      initial={{ opacity: 1 }}
      animate={{ opacity: animating ? 0 : 1 }}
      transition={{ duration: 0.55, delay: animating ? 0.35 : 0 }}
      style={{ pointerEvents: splashActive ? "auto" : "none" }}
      aria-hidden={!splashActive}
    >
      <motion.button
        type="button"
        className="csh-splash__logo-btn"
        onClick={openMenu}
        aria-label="Menü öffnen"
        style={{
          x: animating ? springX : 0,
          y: animating ? springY : 0,
          scale: animating ? springScale : 1,
        }}
      >
        <img src={catalog.brand.logoWhite} alt="CSH" className="csh-splash__logo" draggable={false} />
      </motion.button>
      {!animating && (
        <p className="csh-splash__hint">Scrollen zum Entdecken</p>
      )}
    </motion.div>
  );
}
