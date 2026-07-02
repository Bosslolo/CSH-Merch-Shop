import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { scrollToTop } from "@/lib/scroll";

const INTRO_KEY = "csh_intro_seen";

interface IntroContextValue {
  introComplete: boolean;
  showSplash: boolean;
  headerLogoRef: RefObject<HTMLImageElement | null>;
  completeIntro: () => void;
  replayIntro: () => void;
}

const IntroContext = createContext<IntroContextValue | null>(null);

export function IntroProvider({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const headerLogoRef = useRef<HTMLImageElement>(null);

  const skipSplash =
    reduced ||
    (typeof sessionStorage !== "undefined" && sessionStorage.getItem(INTRO_KEY) === "1");

  const [introComplete, setIntroComplete] = useState(skipSplash);
  const [showSplash, setShowSplash] = useState(!skipSplash);

  const completeIntro = useCallback(() => {
    sessionStorage.setItem(INTRO_KEY, "1");
    setIntroComplete(true);
    setShowSplash(false);
    scrollToTop();
  }, []);

  const replayIntro = useCallback(() => {
    setIntroComplete(false);
    setShowSplash(true);
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  const value = useMemo(
    () => ({
      introComplete,
      showSplash,
      headerLogoRef,
      completeIntro,
      replayIntro,
    }),
    [introComplete, showSplash, completeIntro, replayIntro]
  );

  return <IntroContext.Provider value={value}>{children}</IntroContext.Provider>;
}

export function useIntro() {
  const ctx = useContext(IntroContext);
  if (!ctx) {
    return {
      introComplete: true,
      showSplash: false,
      headerLogoRef: { current: null },
      completeIntro: () => {},
      replayIntro: () => {},
    } satisfies IntroContextValue;
  }
  return ctx;
}
