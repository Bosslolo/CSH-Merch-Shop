import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { scrollToTop } from "@/lib/scroll";

/**
 * Scroll to top on route change. Hash targets (e.g. /#abstimmung) are handled by the caller.
 */
export default function ScrollToTop() {
  const [location] = useLocation();
  const prev = useRef(location);

  useEffect(() => {
    if (prev.current === location) return;
    prev.current = location;

    if (location.includes("#")) return;

    scrollToTop();
  }, [location]);

  return null;
}
