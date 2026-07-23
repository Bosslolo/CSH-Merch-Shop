import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { CartProvider } from "./contexts/CartContext";
import { AdminProvider } from "./contexts/AdminContext";
import { NavProvider } from "./contexts/NavContext";
import { IntroProvider } from "./contexts/IntroContext";
import ScrollToTop from "./components/layout/ScrollToTop";
import CartDrawer from "./components/cart/CartDrawer";
import Home from "./pages/Home";
import ProductPage from "./pages/ProductPage";
import CollectionBigPage from "./pages/CollectionBigPage";
import CollectionSmallPage from "./pages/CollectionSmallPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentReturnPage from "./pages/PaymentReturnPage";

const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminOrdersPage = lazy(() => import("./pages/admin/AdminOrdersPage"));
const AdminStockPage = lazy(() => import("./pages/admin/AdminStockPage"));
const AdminVotesPage = lazy(() => import("./pages/admin/AdminVotesPage"));

function AdminFallback() {
  return <div className="admin-shell"><p className="admin-muted">Lade Verwaltung…</p></div>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/kollektion/gross" component={CollectionBigPage} />
      <Route path="/kollektion/klein" component={CollectionSmallPage} />
      <Route path="/produkt/:slug" component={ProductPage} />
      <Route path="/kasse" component={CheckoutPage} />
      <Route path="/kasse/bezahlt" component={PaymentReturnPage} />
      <Route path="/verwaltung">
        <Suspense fallback={<AdminFallback />}>
          <AdminLoginPage />
        </Suspense>
      </Route>
      <Route path="/verwaltung/dashboard">
        <Suspense fallback={<AdminFallback />}>
          <AdminDashboardPage />
        </Suspense>
      </Route>
      <Route path="/verwaltung/bestellungen">
        <Suspense fallback={<AdminFallback />}>
          <AdminOrdersPage />
        </Suspense>
      </Route>
      <Route path="/verwaltung/bestand">
        <Suspense fallback={<AdminFallback />}>
          <AdminStockPage />
        </Suspense>
      </Route>
      <Route path="/verwaltung/abstimmung">
        <Suspense fallback={<AdminFallback />}>
          <AdminVotesPage />
        </Suspense>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <AdminProvider>
            <CartProvider>
              <NavProvider>
                <IntroProvider>
                  <ScrollToTop />
                  <CartDrawer />
                  <Toaster />
                  <Router />
                </IntroProvider>
              </NavProvider>
            </CartProvider>
          </AdminProvider>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
