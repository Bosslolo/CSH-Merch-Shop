/** Server-side catalog — re-exports shared meta so prices cannot drift from the client. */
export {
  CATALOG_META as CATALOG,
  getCatalogMeta as getCatalogProduct,
  stockKey,
  parseStockKey,
  defaultInventory,
} from "../shared/catalog-meta.js";
