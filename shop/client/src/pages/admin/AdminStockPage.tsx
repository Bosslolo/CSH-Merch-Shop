import { useEffect, useState } from "react";
import { toast } from "sonner";
import { AdminGuard } from "@/contexts/AdminContext";
import { fetchAdminInventory, saveInventoryUpdates } from "@/lib/admin-api";
import AdminLayout from "./AdminLayout";

interface SizeRow {
  size: string;
  quantity: number;
}

interface ProductRow {
  slug: string;
  name: string;
  price: number;
  sizes: SizeRow[];
}

export default function AdminStockPage() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [updatedAt, setUpdatedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState<Record<string, number>>({});

  async function load() {
    setLoading(true);
    try {
      const data = await fetchAdminInventory();
      setProducts(data.products ?? []);
      setUpdatedAt(data.updatedAt ?? "");
      setDirty({});
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  function key(slug: string, size: string) {
    return `${slug}|${size}`;
  }

  function getQty(product: ProductRow, size: string) {
    const k = key(product.slug, size);
    if (dirty[k] !== undefined) return dirty[k];
    return product.sizes.find((s) => s.size === size)?.quantity ?? 0;
  }

  function setQty(slug: string, size: string, quantity: number) {
    setDirty((prev) => ({ ...prev, [key(slug, size)]: Math.max(0, quantity) }));
  }

  async function handleSave() {
    const updates = Object.entries(dirty).map(([k, quantity]) => {
      const [slug, size] = [k.slice(0, k.lastIndexOf("|")), k.slice(k.lastIndexOf("|") + 1)];
      return { slug, size, quantity };
    });
    if (updates.length === 0) return;
    setSaving(true);
    try {
      const data = await saveInventoryUpdates(updates);
      setProducts(data.products ?? []);
      setUpdatedAt(data.updatedAt ?? "");
      setDirty({});
      toast("Bestand gespeichert.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Speichern fehlgeschlagen.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminGuard>
      <AdminLayout title="Bestand">
        {loading && <p className="admin-muted">Lade…</p>}
        {!loading && (
          <>
            <div className="admin-toolbar">
              <p className="admin-muted">
                Zuletzt aktualisiert: {updatedAt ? new Date(updatedAt).toLocaleString("de-DE") : "—"}
              </p>
              <button
                type="button"
                className="admin-btn"
                disabled={saving || Object.keys(dirty).length === 0}
                onClick={() => void handleSave()}
              >
                {saving ? "Speichern…" : "Änderungen speichern"}
              </button>
            </div>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Produkt</th>
                    <th>Preis</th>
                    {products[0]?.sizes.map((s) => (
                      <th key={s.size}>{s.size}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.slug}>
                      <td>{product.name}</td>
                      <td>{product.price} €</td>
                      {product.sizes.map((s) => (
                        <td key={s.size}>
                          <input
                            type="number"
                            min={0}
                            className="admin-input admin-input--qty"
                            value={getQty(product, s.size)}
                            onChange={(e) => setQty(product.slug, s.size, Number(e.target.value))}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}
