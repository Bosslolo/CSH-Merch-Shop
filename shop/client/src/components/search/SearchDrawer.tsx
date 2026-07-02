import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Search } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { PRODUCTS } from "@/data/products";
import { useSearch } from "@/contexts/SearchContext";
import { scrollToTop } from "@/lib/scroll";

export default function SearchDrawer() {
  const { open, setOpen } = useSearch();
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PRODUCTS;
    return PRODUCTS.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.colors.some((c) => c.name.toLowerCase().includes(q))
    );
  }, [query]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  return (
    <Sheet
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <SheetContent side="right" className="csh-search">
        <SheetHeader className="csh-search__header">
          <SheetTitle className="csh-search__title">Suche</SheetTitle>
        </SheetHeader>

        <label className="csh-search__field">
          <Search size={16} strokeWidth={1.5} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Hoodie, Shirt, Farbe…"
            autoFocus
            className="csh-search__input"
          />
        </label>

        <ul className="csh-search__results">
          {results.length === 0 ? (
            <li className="csh-search__empty">Keine Treffer.</li>
          ) : (
            results.map((product) => (
              <li key={product.slug}>
                <Link
                  href={`/produkt/${product.slug}`}
                  className="csh-search__result"
                  onClick={() => {
                    close();
                    scrollToTop();
                  }}
                >
                  <img src={product.flatLay} alt="" />
                  <span>
                    <strong>{product.name}</strong>
                    <small>{product.price} €</small>
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>
      </SheetContent>
    </Sheet>
  );
}
