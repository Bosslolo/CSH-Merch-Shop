import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import type { CatalogFile, CatalogProduct } from "@shared/shop-types";
import { AdminGuard } from "@/contexts/AdminContext";
import {
  fetchAdminCatalog,
  fetchAdminInventory,
  fetchAdminSettings,
  saveAdminCatalog,
  saveInventoryUpdates,
  uploadAdminImage,
} from "@/lib/admin-api";
import { slugify } from "@/lib/admin-utils";
import { useAdminAutoSave } from "@/lib/use-admin-auto-save";
import AdminLayout from "./AdminLayout";
import AdminSaveStatus from "./AdminSaveStatus";

interface SizeRow {
  size: string;
  quantity: number;
}

interface ProductRow {
  slug: string;
  sizes: SizeRow[];
}

function stockWatchKey(catalog: CatalogFile, stockRows: ProductRow[]) {
  const stock = stockRows
    .map((row) => ({
      slug: row.slug,
      sizes: [...row.sizes]
        .map((entry) => ({ size: entry.size, quantity: entry.quantity }))
        .sort((a, b) => a.size.localeCompare(b.size)),
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
  return JSON.stringify({ products: catalog.products, stock });
}

export default function AdminStockPage() {
  const [catalog, setCatalog] = useState<CatalogFile>({ collections: [], products: [], updatedAt: "" });
  const [groupOptions, setGroupOptions] = useState<{ key: string; label: string }[]>([]);
  const [stockRows, setStockRows] = useState<ProductRow[]>([]);
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadGeneration, setLoadGeneration] = useState(0);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [inventory, nextCatalog, settings] = await Promise.all([
        fetchAdminInventory(),
        fetchAdminCatalog(),
        fetchAdminSettings(),
      ]);
      setCatalog(nextCatalog);
      setGroupOptions(settings.categories ?? []);
      setStockRows((inventory.products ?? []).map((product: { slug: string; sizes: SizeRow[] }) => ({
        slug: product.slug,
        sizes: product.sizes ?? [],
      })));
      setUpdatedAt(inventory.updatedAt ?? "");
      const nextCollapsed: Record<string, boolean> = {};
      for (const product of nextCatalog.products) {
        nextCollapsed[product.slug] = true;
      }
      setCollapsed(nextCollapsed);
    } finally {
      setLoading(false);
      setLoadGeneration((gen) => gen + 1);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  const stockMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const product of stockRows) {
      for (const size of product.sizes) {
        map[`${product.slug}|${size.size}`] = size.quantity;
      }
    }
    return map;
  }, [stockRows]);

  const visibleProducts = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return catalog.products.map((product, index) => ({ product, index }));
    return catalog.products
      .map((product, index) => ({ product, index }))
      .filter(
        ({ product }) =>
          product.name.toLowerCase().includes(q) ||
          product.slug.toLowerCase().includes(q) ||
          product.groupLabel.toLowerCase().includes(q)
      );
  }, [catalog.products, filter]);

  function setProductField(index: number, patch: Partial<CatalogProduct>) {
    setCatalog((prev) => ({
      ...prev,
      products: prev.products.map((product, current) =>
        current === index ? { ...product, ...patch } : product
      ),
    }));
  }

  function setProductSizes(index: number, value: string) {
    const sizes = Array.from(
      new Set(
        value
          .split(/[,\n]/)
          .map((size) => size.trim().toUpperCase())
          .filter(Boolean)
      )
    );
    setProductField(index, { sizes });
  }

  function getQty(slug: string, size: string) {
    return stockMap[`${slug}|${size}`] ?? 20;
  }

  function setQty(slug: string, size: string, quantity: number) {
    setStockRows((prev) => {
      const next = prev.slice();
      const idx = next.findIndex((product) => product.slug === slug);
      if (idx < 0) {
        next.push({ slug, sizes: [{ size, quantity }] });
        return next;
      }
      const current = next[idx]!;
      const sizes = current.sizes.some((entry) => entry.size === size)
        ? current.sizes.map((entry) =>
            entry.size === size
              ? { ...entry, quantity: Math.max(0, Math.min(500, quantity)) }
              : entry
          )
        : [...current.sizes, { size, quantity: Math.max(0, Math.min(500, quantity)) }];
      next[idx] = { ...current, sizes };
      return next;
    });
  }

  function syncStockRows(products: CatalogProduct[]) {
    setStockRows((prev) => {
      const existing = new Map(prev.map((product) => [product.slug, product]));
      return products.map((product) => ({
        slug: product.slug,
        sizes: product.sizes.map((size) => ({
          size,
          quantity: existing.get(product.slug)?.sizes.find((entry) => entry.size === size)?.quantity ?? 20,
        })),
      }));
    });
  }

  function addProduct() {
    const slug = `produkt-${catalog.products.length + 1}`;
    setCatalog((prev) => ({
      ...prev,
      products: [
        ...prev.products,
        {
          slug,
          name: "Neues Produkt",
          subtitle: "Neu",
          price: 0,
          material: "",
          sizingNote: "",
          unityLine: "",
          colors: [{ name: "Standard", hex: "#1A1A1A" }],
          sizes: ["S", "M", "L"],
          image: "",
          flatLay: "",
          gallery: [],
          tag: "Neu",
          collection: prev.collections[0]?.id || "large",
          groupKey: groupOptions[0]?.key || "neu",
          groupLabel: groupOptions[0]?.label || "Neue Produkte",
          active: true,
        },
      ],
    }));
    setCollapsed((prev) => ({ ...prev, [slug]: false }));
  }

  function setAllExpanded(expanded: boolean) {
    setCollapsed(() => {
      const next: Record<string, boolean> = {};
      for (const product of catalog.products) {
        next[product.slug] = !expanded;
      }
      return next;
    });
  }

  async function handleUpload(productIndex: number, files: FileList | null) {
    if (!files?.length) return;
    const key = `${productIndex}-upload`;
    setUploadingKey(key);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) {
          toast(`${file.name}: kein Bild.`);
          continue;
        }
        urls.push(await uploadAdminImage(file));
      }
      if (!urls.length) return;
      setCatalog((prev) => {
        const products = prev.products.map((product, index) => {
          if (index !== productIndex) return product;
          const gallery = [...product.gallery, ...urls];
          return {
            ...product,
            gallery,
            image: gallery[0] || product.image,
            flatLay: gallery[0] || product.flatLay,
          };
        });
        return { ...prev, products };
      });
      toast(`${urls.length} Bild${urls.length === 1 ? "" : "er"} hochgeladen.`);
    } catch (error) {
      toast(error instanceof Error ? error.message : "Upload fehlgeschlagen.");
    } finally {
      setUploadingKey(null);
    }
  }

  function removeGalleryImage(productIndex: number, url: string) {
    setCatalog((prev) => {
      const products = prev.products.map((product, index) => {
        if (index !== productIndex) return product;
        const gallery = product.gallery.filter((entry) => entry !== url);
        const primary = gallery[0] || "";
        return {
          ...product,
          gallery,
          image: primary,
          flatLay: primary,
        };
      });
      return { ...prev, products };
    });
  }

  function applyGalleryOrder(productIndex: number, gallery: string[]) {
    const primary = gallery[0] || "";
    setProductField(productIndex, { gallery, image: primary, flatLay: primary });
  }

  function moveGalleryImage(productIndex: number, from: number, delta: number) {
    const product = catalog.products[productIndex];
    if (!product) return;
    const to = from + delta;
    if (to < 0 || to >= product.gallery.length) return;
    const gallery = [...product.gallery];
    const [item] = gallery.splice(from, 1);
    gallery.splice(to, 0, item!);
    applyGalleryOrder(productIndex, gallery);
  }

  function removeProduct(index: number) {
    const product = catalog.products[index];
    if (!product) return;
    if (!window.confirm(`„${product.name || product.slug}" wirklich löschen?`)) return;
    setCatalog((prev) => ({
      ...prev,
      products: prev.products.filter((_, current) => current !== index),
    }));
    setStockRows((prev) => prev.filter((row) => row.slug !== product.slug));
    setCollapsed((prev) => {
      const next = { ...prev };
      delete next[product.slug];
      return next;
    });
  }

  const watchKey = useMemo(() => stockWatchKey(catalog, stockRows), [catalog, stockRows]);

  const performSave = useCallback(async () => {
    const preparedCatalog: CatalogFile = {
      ...catalog,
      products: catalog.products.map((product) => {
        const category = groupOptions.find((entry) => entry.key === product.groupKey);
        return {
          ...product,
          slug: slugify(product.slug || product.name),
          groupKey: category?.key || slugify(product.groupKey || product.groupLabel || "weitere"),
          groupLabel: category?.label || product.groupLabel || "Weitere",
          image: product.image || product.gallery[0] || "",
          flatLay: product.flatLay || product.image || product.gallery[0] || "",
          active: product.active !== false,
          soldOut: Boolean(product.soldOut),
        };
      }),
    };
    const savedCatalog = await saveAdminCatalog(preparedCatalog);
    syncStockRows(savedCatalog.products);
    const stockUpdates = savedCatalog.products.flatMap((product) =>
      product.sizes.map((size) => {
        const row = stockRows.find((entry) => entry.slug === product.slug);
        const quantity = row?.sizes.find((entry) => entry.size === size)?.quantity ?? 20;
        return { slug: product.slug, size, quantity };
      })
    );
    const inventory = await saveInventoryUpdates(stockUpdates);
    const nextStockRows = (inventory.products ?? []).map((product: { slug: string; sizes: SizeRow[] }) => ({
      slug: product.slug,
      sizes: product.sizes ?? [],
    }));
    setCatalog(savedCatalog);
    setStockRows(nextStockRows);
    setUpdatedAt(inventory.updatedAt ?? "");
    return stockWatchKey(savedCatalog, nextStockRows);
  }, [catalog, stockRows, groupOptions]);

  const { status: saveStatus, saveNow } = useAdminAutoSave({
    enabled: !loading,
    loadGeneration,
    watchKey,
    onSave: performSave,
    delayMs: 1200,
  });

  return (
    <AdminGuard>
      <AdminLayout
        title="Produkte"
        actions={<AdminSaveStatus status={saveStatus} onRetry={() => void saveNow()} />}
      >
        {loading && <p className="admin-muted">Lade…</p>}
        {!loading && (
          <>
            <div className="admin-surface admin-page-toolbar">
              <div className="admin-page-toolbar__row">
                <label className="admin-page-toolbar__search">
                  <span className="sr-only">Produkte suchen</span>
                  <input
                    className="admin-input"
                    placeholder="Suchen nach Name, Slug oder Gruppe…"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                </label>
                <div className="admin-page-toolbar__actions">
                  <button
                    type="button"
                    className="admin-btn admin-btn--quiet admin-btn--sm"
                    onClick={() => setAllExpanded(false)}
                  >
                    Alle zu
                  </button>
                  <button
                    type="button"
                    className="admin-btn admin-btn--quiet admin-btn--sm"
                    onClick={() => setAllExpanded(true)}
                  >
                    Alle auf
                  </button>
                  <button type="button" className="admin-btn admin-btn--secondary admin-btn--sm" onClick={addProduct}>
                    + Produkt
                  </button>
                </div>
              </div>
              <p className="admin-page-toolbar__meta admin-muted">
                {updatedAt ? `Bestand ${new Date(updatedAt).toLocaleString("de-DE")}` : "—"} ·{" "}
                {catalog.products.length} Produkte ·{" "}
                <Link href="/verwaltung/einstellungen" className="admin-inline-link">
                  Kollektionen & Einstellungen
                </Link>
              </p>
            </div>

            <div className="admin-product-list">
              {visibleProducts.length === 0 && <p className="admin-muted">Keine Treffer.</p>}
              {visibleProducts.map(({ product, index }) => {
                const isCollapsed = collapsed[product.slug] !== false;
                const uploadBusy = uploadingKey === `${index}-upload`;
                const collectionName =
                  catalog.collections.find((c) => c.id === product.collection)?.name || product.collection;

                return (
                  <article
                    key={product.slug}
                    className={`admin-product-card${isCollapsed ? " is-collapsed" : ""}`}
                  >
                    <div className="admin-product-card__summary">
                      <div className="admin-product-card__media admin-product-card__media--sm">
                        {product.image ? (
                          <img src={product.image} alt="" className="admin-product-card__preview" />
                        ) : (
                          <div className="admin-product-card__placeholder">—</div>
                        )}
                      </div>
                      <div className="admin-product-card__summary-text">
                        <strong>{product.name || "Neues Produkt"}</strong>
                        <span className="admin-muted">
                          {product.price} € · {product.groupLabel} · {collectionName}
                          {product.soldOut ? " · Ausverkauft" : ""}
                          {product.active === false ? " · Versteckt" : ""}
                        </span>
                      </div>
                      <div className="admin-inline-actions">
                        <label className="admin-check admin-check--inline">
                          <input
                            type="checkbox"
                            checked={product.soldOut === true}
                            onChange={(e) => setProductField(index, { soldOut: e.target.checked })}
                          />
                          <span>Ausverkauft</span>
                        </label>
                        <label className="admin-check admin-check--inline">
                          <input
                            type="checkbox"
                            checked={product.active !== false}
                            onChange={(e) => setProductField(index, { active: e.target.checked })}
                          />
                          <span>Live</span>
                        </label>
                        <button
                          type="button"
                          className="admin-btn admin-btn--secondary admin-btn--sm"
                          onClick={() => setCollapsed((prev) => ({ ...prev, [product.slug]: !isCollapsed }))}
                        >
                          {isCollapsed ? "Bearbeiten" : "Schließen"}
                        </button>
                      </div>
                    </div>

                    <AnimatePresence initial={false}>
                      {!isCollapsed && (
                        <motion.div
                          key="body"
                          className="admin-product-card__collapse"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                        >
                      <div className="admin-product-card__body">
                        <div className="admin-product-edit-layout">
                          <div className="admin-product-edit-layout__main">
                            <h3 className="admin-mini-title">Stammdaten</h3>
                            <div className="admin-form-grid admin-form-grid--3">
                              <label className="admin-label">
                                Name
                                <input
                                  className="admin-input"
                                  value={product.name}
                                  onChange={(e) => setProductField(index, { name: e.target.value })}
                                />
                              </label>
                              <label className="admin-label">
                                Preis €
                                <input
                                  className="admin-input"
                                  type="number"
                                  min={0}
                                  step={0.5}
                                  value={product.price}
                                  onChange={(e) => setProductField(index, { price: Number(e.target.value) || 0 })}
                                />
                              </label>
                              <label className="admin-label">
                                Durchgestrichen €
                                <input
                                  className="admin-input"
                                  type="number"
                                  min={0}
                                  step={0.5}
                                  value={product.compareAt ?? ""}
                                  onChange={(e) =>
                                    setProductField(index, {
                                      compareAt: e.target.value ? Number(e.target.value) : undefined,
                                    })
                                  }
                                />
                                <span className="admin-label-hint">
                                  Optional: alter Preis im Shop (durchgestrichen), z. B. vor einem Sale oder manuell.
                                </span>
                              </label>
                              <label className="admin-label admin-label--span-2">
                                Slug
                                <input
                                  className="admin-input"
                                  value={product.slug}
                                  onChange={(e) => setProductField(index, { slug: e.target.value })}
                                />
                              </label>
                              <label className="admin-label">
                                Kollektion
                                <select
                                  className="admin-select"
                                  value={product.collection}
                                  onChange={(e) => setProductField(index, { collection: e.target.value })}
                                >
                                  {catalog.collections.map((collection) => (
                                    <option key={collection.id} value={collection.id}>
                                      {collection.name}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="admin-label">
                                Gruppe
                                <select
                                  className="admin-select"
                                  value={product.groupKey}
                                  onChange={(e) => {
                                    const category = groupOptions.find((entry) => entry.key === e.target.value);
                                    setProductField(index, {
                                      groupKey: e.target.value,
                                      groupLabel: category?.label || e.target.value,
                                    });
                                  }}
                                >
                                  {groupOptions.map((category) => (
                                    <option key={category.key} value={category.key}>
                                      {category.label}
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="admin-label">
                                Untertitel
                                <input
                                  className="admin-input"
                                  value={product.subtitle}
                                  onChange={(e) =>
                                    setProductField(index, { subtitle: e.target.value, tag: e.target.value })
                                  }
                                />
                              </label>
                              <label className="admin-label admin-label--span-2">
                                Größen (kommagetrennt)
                                <input
                                  className="admin-input"
                                  value={product.sizes.join(", ")}
                                  onChange={(e) => setProductSizes(index, e.target.value)}
                                />
                              </label>
                            </div>

                            <h3 className="admin-mini-title">Texte</h3>
                            <div className="admin-form-grid admin-form-grid--2">
                              <label className="admin-label">
                                Material
                                <input
                                  className="admin-input"
                                  value={product.material}
                                  onChange={(e) => setProductField(index, { material: e.target.value })}
                                />
                              </label>
                              <label className="admin-label">
                                Größenhinweis
                                <input
                                  className="admin-input"
                                  value={product.sizingNote}
                                  onChange={(e) => setProductField(index, { sizingNote: e.target.value })}
                                />
                              </label>
                              <label className="admin-label admin-label--span-2">
                                Kurzbeschreibung
                                <textarea
                                  className="admin-input admin-textarea"
                                  rows={2}
                                  value={product.unityLine}
                                  onChange={(e) => setProductField(index, { unityLine: e.target.value })}
                                />
                              </label>
                            </div>
                          </div>

                          <aside className="admin-product-edit-layout__side">
                            <div className="admin-side-box">
                              <div className="admin-gallery-block__head">
                                <h3 className="admin-mini-title">Bilder</h3>
                                <p className="admin-muted admin-gallery-block__hint">
                                  Nr. 1 = Hauptbild im Shop. Reihenfolge mit ↑↓ ändern.
                                </p>
                                <label className="admin-btn admin-btn--secondary admin-btn--sm admin-upload-btn">
                                  {uploadBusy ? "…" : "Upload"}
                                  <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                    multiple
                                    hidden
                                    disabled={uploadBusy}
                                    onChange={(e) => {
                                      void handleUpload(index, e.target.files);
                                      e.target.value = "";
                                    }}
                                  />
                                </label>
                              </div>
                              <div className="admin-gallery-thumbs">
                                {product.gallery.length === 0 && (
                                  <p className="admin-muted">Noch keine Bilder.</p>
                                )}
                                {product.gallery.map((src, imageIndex) => (
                                  <div key={`${src}-${imageIndex}`} className="admin-gallery-item">
                                    <span className="admin-gallery-item__num" aria-hidden>
                                      {imageIndex + 1}
                                    </span>
                                    <img src={src} alt="" className="admin-gallery-item__img" />
                                    <div className="admin-gallery-item__actions">
                                      <button
                                        type="button"
                                        className="admin-btn admin-btn--ghost admin-btn--sm"
                                        disabled={imageIndex === 0}
                                        onClick={() => moveGalleryImage(index, imageIndex, -1)}
                                        aria-label={`Bild ${imageIndex + 1} nach oben`}
                                      >
                                        ↑
                                      </button>
                                      <button
                                        type="button"
                                        className="admin-btn admin-btn--ghost admin-btn--sm"
                                        disabled={imageIndex === product.gallery.length - 1}
                                        onClick={() => moveGalleryImage(index, imageIndex, 1)}
                                        aria-label={`Bild ${imageIndex + 1} nach unten`}
                                      >
                                        ↓
                                      </button>
                                      <button
                                        type="button"
                                        className="admin-btn admin-btn--ghost admin-btn--sm"
                                        onClick={() => removeGalleryImage(index, src)}
                                        aria-label={`Bild ${imageIndex + 1} entfernen`}
                                      >
                                        ×
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="admin-side-box admin-side-box--danger">
                              <h3 className="admin-mini-title">Gefahrenzone</h3>
                              <p className="admin-muted">
                                Live aus = Produkt im Shop unsichtbar. Löschen entfernt es dauerhaft aus dem Katalog.
                              </p>
                              <button
                                type="button"
                                className="admin-btn admin-btn--danger admin-btn--sm"
                                onClick={() => removeProduct(index)}
                              >
                                Produkt löschen
                              </button>
                            </div>

                            <div className="admin-side-box">
                              <h3 className="admin-mini-title">Bestand</h3>
                              <div className="admin-stock-size-list admin-stock-size-list--grid">
                                {product.sizes.map((size) => {
                                  const qty = getQty(product.slug, size);
                                  return (
                                    <label key={`${product.slug}-${size}`} className="admin-size-pill">
                                      <span>{size}</span>
                                      <input
                                        type="number"
                                        min={0}
                                        max={500}
                                        className={`admin-input admin-input--qty${qty <= 3 ? " is-low" : ""}`}
                                        value={qty}
                                        onChange={(e) => setQty(product.slug, size, Number(e.target.value) || 0)}
                                      />
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          </aside>
                        </div>
                      </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}
