import "@/styles/admin.css";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Redirect, useLocation } from "wouter";
import { adminLogin, adminLogout, getAdminSession } from "@/lib/admin-api";

interface AdminContextValue {
  loading: boolean;
  authenticated: boolean;
  configured: boolean;
  login: (password: string, rememberDevice?: boolean) => Promise<string | null>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AdminContext = createContext<AdminContextValue | null>(null);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [configured, setConfigured] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const session = await getAdminSession();
      setAuthenticated(session.authenticated);
      setConfigured(session.configured);
    } catch {
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (password: string, rememberDevice = false) => {
    const result = await adminLogin(password, rememberDevice);
    if (result.error) return result.error;
    await refresh();
    return null;
  }, [refresh]);

  const logout = useCallback(async () => {
    await adminLogout();
    setAuthenticated(false);
  }, []);

  return (
    <AdminContext.Provider value={{ loading, authenticated, configured, login, logout, refresh }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider");
  return ctx;
}

export function AdminGuard({ children }: { children: ReactNode }) {
  const { loading, authenticated } = useAdmin();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="admin-shell">
        <p className="admin-muted">Lade Verwaltung…</p>
      </div>
    );
  }

  if (!authenticated) {
    return <Redirect to={`/verwaltung?next=${encodeURIComponent(location)}`} />;
  }

  return <>{children}</>;
}
