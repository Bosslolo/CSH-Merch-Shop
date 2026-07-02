import { createContext, useContext, useState, type ReactNode } from "react";

interface NavContextValue {
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  openMenu: () => void;
}

const NavContext = createContext<NavContextValue | null>(null);

export function NavProvider({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const openMenu = () => setMenuOpen(true);

  return (
    <NavContext.Provider value={{ menuOpen, setMenuOpen, openMenu }}>
      {children}
    </NavContext.Provider>
  );
}

export function useNav() {
  const ctx = useContext(NavContext);
  if (!ctx) throw new Error("useNav must be used within NavProvider");
  return ctx;
}
