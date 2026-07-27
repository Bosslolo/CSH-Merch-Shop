import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import type {
  CatalogCollection,
  CatalogFile,
  CatalogProduct,
  SaleRule,
  SaleScope,
  SiteSettings,
  SpotlightMode,
} from "@shared/shop-types";
import { AdminGuard } from "@/contexts/AdminContext";
import {
  fetchAdminCatalog,
  fetchAdminSettings,
  saveAdminCatalog,
  saveAdminSettings,
} from "@/lib/admin-api";
import {
  collectionPathLabel,
  fromLocalInput,
  newSaleId,
  slugify,
  toLocalInput,
} from "@/lib/admin-utils";
import { useAdminAutoSave } from "@/lib/use-admin-auto-save";
import AdminLayout from "./AdminLayout";
import AdminSaveStatus from "./AdminSaveStatus";

export default function AdminSettingsPage() {
  const [catalog, setCatalog] = useState<CatalogFile>({ collections: [], products: [], updatedAt: "" });
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadGeneration, setLoadGeneration] = useState(0);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [nextCatalog, nextSettings] = await Promise.all([fetchAdminCatalog(), fetchAdminSettings()]);
      setCatalog(nextCatalog);
      setSettings(nextSettings);
    } finally {
      setLoading(false);
      setLoadGeneration((gen) => gen + 1);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function setCollectionField(index: number, patch: Partial<CatalogCollection>) {
    setCatalog((prev) => ({
      ...prev,
      collections: prev.collections.map((collection, current) =>
        current === index ? { ...collection, ...patch } : collection
      ),
    }));
  }

  function addCollection() {
    const id = `kollektion-${catalog.collections.length + 1}`;
    setCatalog((prev) => ({
      ...prev,
      collections: [
        ...prev.collections,
        { id, name: "Neue Kollektion", lead: "", cardNote: "" },
      ],
    }));
  }

  function removeCollection(index: number) {
    const target = catalog.collections[index];
    if (!target) return;
    if (catalog.collections.length <= 1) {
      toast("Mindestens eine Kollektion muss bleiben.");
      return;
    }
    if (catalog.products.some((product) => product.collection === target.id)) {
      toast("Zuerst Produkte aus dieser Kollektion verschieben.");
      return;
    }
    setCatalog((prev) => ({
      ...prev,
      collections: prev.collections.filter((_, current) => current !== index),
    }));
  }

  function addCategory() {
    if (!settings) return;
    const label = newCategoryLabel.trim();
    if (!label) return;
    const key = slugify(label);
    if (!key) return;
    if (settings.categories.some((category) => category.key === key)) {
      toast("Diese Gruppe gibt es schon.");
      return;
    }
    setSettings({
      ...settings,
      categories: [...settings.categories, { key, label }],
    });
    setNewCategoryLabel("");
  }

  function removeCategory(key: string) {
    if (!settings) return;
    if (catalog.products.some((product) => product.groupKey === key)) {
      toast("Zuerst Produkte auf eine andere Gruppe umstellen.");
      return;
    }
    setSettings({
      ...settings,
      categories: settings.categories.filter((category) => category.key !== key),
    });
  }

  function setSaleField(saleId: string, patch: Partial<SaleRule>) {
    if (!settings) return;
    setSettings({
      ...settings,
      sales: settings.sales.map((sale) => (sale.id === saleId ? { ...sale, ...patch } : sale)),
    });
  }

  function addSale() {
    if (!settings) return;
    setSettings({
      ...settings,
      sales: [
        ...settings.sales,
        {
          id: newSaleId(),
          enabled: false,
          label: "Sale",
          scope: "all",
          targetId: "",
          percentOff: 10,
          startsAt: null,
          endsAt: null,
        },
      ],
    });
  }

  function removeSale(saleId: string) {
    if (!settings) return;
    setSettings({
      ...settings,
      sales: settings.sales.filter((sale) => sale.id !== saleId),
    });
  }

  function saleTargetOptions(scope: SaleScope) {
    if (scope === "product") {
      return catalog.products.map((product) => ({ value: product.slug, label: product.name }));
    }
    if (scope === "group") {
      return (settings?.categories ?? []).map((category) => ({
        value: category.key,
        label: category.label,
      }));
    }
    if (scope === "collection") {
      return catalog.collections.map((collection) => ({
        value: collection.id,
        label: collection.name,
      }));
    }
    return [];
  }

  const watchKey = useMemo(
    () => (settings ? JSON.stringify({ catalog, settings }) : ""),
    [catalog, settings]
  );

  const performSave = useCallback(async () => {
    if (!settings) return;
    const preparedCatalog: CatalogFile = {
      ...catalog,
      collections: catalog.collections.map((collection) => ({
        ...collection,
        id: slugify(collection.id || collection.name),
      })),
    };
    const [savedCatalog, savedSettings] = await Promise.all([
      saveAdminCatalog(preparedCatalog),
      saveAdminSettings(settings),
    ]);
    setCatalog(savedCatalog);
    setSettings(savedSettings);
    return JSON.stringify({ catalog: savedCatalog, settings: savedSettings });
  }, [catalog, settings]);

  const { status: saveStatus, saveNow } = useAdminAutoSave({
    enabled: !loading && settings !== null,
    loadGeneration,
    watchKey,
    onSave: performSave,
    delayMs: 1200,
  });

  return (
    <AdminGuard>
      <AdminLayout
        title="Shop-Einstellungen"
        actions={<AdminSaveStatus status={saveStatus} onRetry={() => void saveNow()} />}
      >
        {loading && <p className="admin-muted">Lade…</p>}
        {!loading && settings && (
          <>
            <div className="admin-surface admin-settings-intro">
              <p className="admin-settings-intro__text">
                Startseite, Rabatte, Kollektionen und Gruppen — getrennt von den Produkten.
              </p>
              <Link href="/verwaltung/bestand" className="admin-btn admin-btn--secondary admin-btn--sm">
                Zu Produkten
              </Link>
            </div>

            <div className="admin-settings-panels">
              <section id="admin-settings-spotlight" className="admin-panel admin-panel--compact">
                <div className="admin-panel__head">
                  <div>
                    <h2 className="admin-panel__title">Startseite</h2>
                    <p className="admin-muted">Countdown, Abstimmung oder Drop-Link im Spotlight.</p>
                  </div>
                </div>
                <div className="admin-form-grid admin-form-grid--2">
                  <label className="admin-label">
                    Modus
                    <select
                      className="admin-select"
                      value={settings.spotlight.mode}
                      onChange={(e) =>
                        setSettings({
                          ...settings,
                          spotlight: { ...settings.spotlight, mode: e.target.value as SpotlightMode },
                        })
                      }
                    >
                      <option value="countdown">Countdown</option>
                      <option value="votes">Abstimmung</option>
                      <option value="drop">Neuer Drop</option>
                    </select>
                  </label>
                  {settings.spotlight.mode === "countdown" && (
                    <label className="admin-label">
                      Countdown bis
                      <input
                        className="admin-input"
                        type="datetime-local"
                        value={toLocalInput(settings.spotlight.countdownUntil)}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            spotlight: {
                              ...settings.spotlight,
                              countdownUntil: fromLocalInput(e.target.value),
                            },
                          })
                        }
                      />
                    </label>
                  )}
                  {settings.spotlight.mode === "drop" && (
                    <>
                      <label className="admin-label">
                        Ziel
                        <select
                          className="admin-select"
                          value={settings.spotlight.dropKind}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              spotlight: {
                                ...settings.spotlight,
                                dropKind: e.target.value === "product" ? "product" : "collection",
                              },
                            })
                          }
                        >
                          <option value="collection">Kollektion</option>
                          <option value="product">Produkt</option>
                        </select>
                      </label>
                      <label className="admin-label">
                        Verknüpfung
                        <select
                          className="admin-select"
                          value={settings.spotlight.dropTarget}
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              spotlight: { ...settings.spotlight, dropTarget: e.target.value },
                            })
                          }
                        >
                          {settings.spotlight.dropKind === "product"
                            ? catalog.products.map((product: CatalogProduct) => (
                                <option key={product.slug} value={product.slug}>
                                  {product.name}
                                </option>
                              ))
                            : catalog.collections.map((collection) => (
                                <option key={collection.id} value={collection.id}>
                                  {collection.name}
                                </option>
                              ))}
                        </select>
                      </label>
                    </>
                  )}
                  {settings.spotlight.mode === "votes" && (
                    <p className="admin-muted admin-label--span-2">
                      Abstimmung auf der Startseite — Freigabe unter „Abstimmung“ / Env.
                    </p>
                  )}
                  {(settings.spotlight.mode === "countdown" || settings.spotlight.mode === "drop") && (
                    <>
                      <label className="admin-label admin-label--span-2">
                        Titel
                        <input
                          className="admin-input"
                          value={
                            settings.spotlight.mode === "countdown"
                              ? settings.spotlight.countdownTitle
                              : settings.spotlight.dropTitle
                          }
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              spotlight:
                                settings.spotlight.mode === "countdown"
                                  ? { ...settings.spotlight, countdownTitle: e.target.value }
                                  : { ...settings.spotlight, dropTitle: e.target.value },
                            })
                          }
                        />
                      </label>
                      <label className="admin-label admin-label--span-2">
                        Text
                        <textarea
                          className="admin-input admin-textarea"
                          rows={2}
                          value={
                            settings.spotlight.mode === "countdown"
                              ? settings.spotlight.countdownLead
                              : settings.spotlight.dropLead
                          }
                          onChange={(e) =>
                            setSettings({
                              ...settings,
                              spotlight:
                                settings.spotlight.mode === "countdown"
                                  ? { ...settings.spotlight, countdownLead: e.target.value }
                                  : { ...settings.spotlight, dropLead: e.target.value },
                            })
                          }
                        />
                      </label>
                      {settings.spotlight.mode === "drop" && (
                        <label className="admin-label">
                          Button-Text
                          <input
                            className="admin-input"
                            value={settings.spotlight.dropCta}
                            onChange={(e) =>
                              setSettings({
                                ...settings,
                                spotlight: { ...settings.spotlight, dropCta: e.target.value },
                              })
                            }
                          />
                        </label>
                      )}
                    </>
                  )}
                </div>
              </section>

              <section id="admin-settings-gruppen" className="admin-panel admin-panel--compact">
                <div className="admin-panel__head">
                  <div>
                    <h2 className="admin-panel__title">Produktgruppen</h2>
                    <p className="admin-muted">z. B. Hoodies, Shirts — für Sales & Sortierung.</p>
                  </div>
                </div>
                <div className="admin-category-row">
                  {settings.categories.map((category) => (
                    <div key={category.key} className="admin-category-chip">
                      <span>{category.label}</span>
                      <button type="button" onClick={() => removeCategory(category.key)} aria-label="Entfernen">
                        ×
                      </button>
                    </div>
                  ))}
                </div>
                <div className="admin-inline-add">
                  <input
                    className="admin-input"
                    placeholder="Neue Gruppe"
                    value={newCategoryLabel}
                    onChange={(e) => setNewCategoryLabel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCategory()}
                  />
                  <button type="button" className="admin-btn admin-btn--secondary admin-btn--sm" onClick={addCategory}>
                    Hinzufügen
                  </button>
                </div>
              </section>
            </div>

            <div className="admin-settings-panels admin-settings-panels--bottom">
              <section id="admin-settings-kollektionen" className="admin-panel admin-panel--compact">
                <div className="admin-panel__head">
                  <div>
                    <h2 className="admin-panel__title">Kollektionen</h2>
                    <p className="admin-muted">Namen & Texte für Shop-Kategorien.</p>
                  </div>
                  <button type="button" className="admin-btn admin-btn--secondary admin-btn--sm" onClick={addCollection}>
                    + Kollektion
                  </button>
                </div>
                <div className="admin-tile-grid">
                  {catalog.collections.map((collection, index) => (
                    <article key={collection.id} className="admin-tile-card">
                      <div className="admin-product-card__header">
                        <strong>
                          {collection.id === "large"
                            ? "Groß"
                            : collection.id === "small"
                              ? "Klein"
                              : collection.name}
                        </strong>
                        {collection.id !== "large" && collection.id !== "small" && (
                          <button
                            type="button"
                            className="admin-btn admin-btn--ghost admin-btn--sm"
                            onClick={() => removeCollection(index)}
                          >
                            ×
                          </button>
                        )}
                      </div>
                      <label className="admin-label">
                        Name
                        <input
                          className="admin-input"
                          value={collection.name}
                          onChange={(e) => setCollectionField(index, { name: e.target.value })}
                        />
                      </label>
                      <label className="admin-label">
                        Kartenhinweis
                        <input
                          className="admin-input"
                          value={collection.cardNote}
                          onChange={(e) => setCollectionField(index, { cardNote: e.target.value })}
                        />
                      </label>
                      <label className="admin-label">
                        Lead
                        <textarea
                          className="admin-input admin-textarea"
                          rows={2}
                          value={collection.lead}
                          onChange={(e) => setCollectionField(index, { lead: e.target.value })}
                        />
                      </label>
                      <label className="admin-label">
                        Badge
                        <input
                          className="admin-input"
                          value={collection.badge ?? ""}
                          onChange={(e) => setCollectionField(index, { badge: e.target.value || undefined })}
                        />
                      </label>
                      <p className="admin-muted admin-tile-card__meta">
                        /kollektion/{collectionPathLabel(collection.id)}
                      </p>
                    </article>
                  ))}
                </div>
              </section>

              <section id="admin-settings-sales" className="admin-panel admin-panel--compact">
                <div className="admin-panel__head">
                  <div>
                    <h2 className="admin-panel__title">Sales</h2>
                    <p className="admin-muted">Zeitgesteuerte Rabatte — Sale löschen entfernt die Regel dauerhaft.</p>
                  </div>
                  <button type="button" className="admin-btn admin-btn--secondary admin-btn--sm" onClick={addSale}>
                    + Sale
                  </button>
                </div>
                <div className="admin-sale-list admin-sale-list--compact">
                  {settings.sales.length === 0 && <p className="admin-muted">Noch keine Sales.</p>}
                  {settings.sales.map((sale) => {
                    const targets = saleTargetOptions(sale.scope);
                    return (
                      <article key={sale.id} className="admin-sale-card">
                        <div className="admin-product-card__header">
                          <label className="admin-check admin-check--inline">
                            <input
                              type="checkbox"
                              checked={sale.enabled}
                              onChange={(e) => setSaleField(sale.id, { enabled: e.target.checked })}
                            />
                            <span>{sale.label || "Sale"}</span>
                          </label>
                          <button
                            type="button"
                            className="admin-btn admin-btn--danger admin-btn--sm"
                            onClick={() => {
                              if (window.confirm(`Sale „${sale.label || "Sale"}" wirklich löschen?`)) {
                                removeSale(sale.id);
                              }
                            }}
                          >
                            Sale löschen
                          </button>
                        </div>
                        <div className="admin-form-grid admin-form-grid--3">
                          <label className="admin-label">
                            Name
                            <input
                              className="admin-input"
                              value={sale.label}
                              onChange={(e) => setSaleField(sale.id, { label: e.target.value })}
                            />
                          </label>
                          <label className="admin-label">
                            Rabatt %
                            <input
                              className="admin-input"
                              type="number"
                              min={1}
                              max={90}
                              value={sale.percentOff}
                              onChange={(e) => setSaleField(sale.id, { percentOff: Number(e.target.value) || 0 })}
                            />
                          </label>
                          <label className="admin-label">
                            Gilt für
                            <select
                              className="admin-select"
                              value={sale.scope}
                              onChange={(e) =>
                                setSaleField(sale.id, {
                                  scope: e.target.value as SaleScope,
                                  targetId: "",
                                })
                              }
                            >
                              <option value="all">Alles</option>
                              <option value="collection">Kollektion</option>
                              <option value="group">Gruppe</option>
                              <option value="product">Produkt</option>
                            </select>
                          </label>
                          {sale.scope !== "all" && (
                            <label className="admin-label">
                              Ziel
                              <select
                                className="admin-select"
                                value={sale.targetId}
                                onChange={(e) => setSaleField(sale.id, { targetId: e.target.value })}
                              >
                                <option value="">Wählen…</option>
                                {targets.map((target) => (
                                  <option key={target.value} value={target.value}>
                                    {target.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                          )}
                          <label className="admin-label">
                            Start
                            <input
                              className="admin-input"
                              type="datetime-local"
                              value={toLocalInput(sale.startsAt)}
                              onChange={(e) => setSaleField(sale.id, { startsAt: fromLocalInput(e.target.value) })}
                            />
                          </label>
                          <label className="admin-label">
                            Ende
                            <input
                              className="admin-input"
                              type="datetime-local"
                              value={toLocalInput(sale.endsAt)}
                              onChange={(e) => setSaleField(sale.id, { endsAt: fromLocalInput(e.target.value) })}
                            />
                          </label>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            </div>
          </>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}
