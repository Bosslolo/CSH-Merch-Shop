import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import type {
  CatalogCollection,
  CatalogFile,
  CatalogProduct,
  InventoryFile,
  Order,
  OrderLineItem,
  OrdersFile,
} from "../shared/shop-types.js";
import { ensureDir, readJsonFile } from "./json-store.js";

const dbByRoot = new Map<string, Database.Database>();

type VoteRow = {
  drop_id: string;
  design_id: string;
  fingerprint_hash: string;
  ip: string;
  voted_at: string;
};

export type VoteRecord = {
  dropId: string;
  designId: string;
  fingerprintHash: string;
  ip: string;
  votedAt: string;
};

function dbPath(root: string) {
  return path.join(root, "data", "shop.db");
}

function migrateSchema(db: Database.Database) {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      lead TEXT NOT NULL DEFAULT '',
      card_note TEXT NOT NULL DEFAULT '',
      badge TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      slug TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subtitle TEXT NOT NULL DEFAULT '',
      price REAL NOT NULL,
      compare_at REAL,
      material TEXT NOT NULL DEFAULT '',
      sizing_note TEXT NOT NULL DEFAULT '',
      unity_line TEXT NOT NULL DEFAULT '',
      colors_json TEXT NOT NULL DEFAULT '[]',
      sizes_json TEXT NOT NULL DEFAULT '[]',
      image TEXT NOT NULL DEFAULT '',
      flat_lay TEXT NOT NULL DEFAULT '',
      gallery_json TEXT NOT NULL DEFAULT '[]',
      tag TEXT,
      collection TEXT NOT NULL,
      group_key TEXT NOT NULL DEFAULT 'misc',
      group_label TEXT NOT NULL DEFAULT 'Weitere',
      active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS stock (
      slug TEXT NOT NULL,
      size TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (slug, size)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      access_token TEXT NOT NULL,
      status TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_grade TEXT,
      customer_notes TEXT,
      total REAL NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      payment_status TEXT,
      payment_method TEXT,
      payment_reference TEXT,
      stripe_session_id TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_orders_unpaid
      ON orders(status, payment_status, created_at);
    CREATE INDEX IF NOT EXISTS idx_orders_stripe_session ON orders(stripe_session_id);

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      slug TEXT NOT NULL,
      product_name TEXT NOT NULL,
      size TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

    CREATE TABLE IF NOT EXISTS orders_archive (
      id TEXT PRIMARY KEY,
      access_token TEXT,
      status TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_grade TEXT,
      customer_notes TEXT,
      total REAL NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      payment_status TEXT,
      payment_method TEXT,
      payment_reference TEXT,
      stripe_session_id TEXT,
      items_json TEXT NOT NULL DEFAULT '[]',
      archived_at TEXT NOT NULL,
      anonymized INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_orders_archive_created ON orders_archive(created_at);

    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      drop_id TEXT NOT NULL,
      design_id TEXT NOT NULL,
      fingerprint_hash TEXT NOT NULL,
      ip TEXT NOT NULL,
      voted_at TEXT NOT NULL
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_drop_fp
      ON votes(drop_id, fingerprint_hash);
    CREATE INDEX IF NOT EXISTS idx_votes_drop ON votes(drop_id);
  `);
  ensureProductColumns(db);
}

function ensureProductColumns(db: Database.Database) {
  const cols = db.prepare("PRAGMA table_info(products)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "sold_out")) {
    db.exec(`ALTER TABLE products ADD COLUMN sold_out INTEGER NOT NULL DEFAULT 0`);
  }
}

function getMeta(db: Database.Database, key: string): string | null {
  const row = db.prepare("SELECT value FROM meta WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? null;
}

function setMeta(db: Database.Database, key: string, value: string) {
  db.prepare(
    `INSERT INTO meta (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(key, value);
}

function productFromRow(row: Record<string, unknown>): CatalogProduct {
  return {
    slug: String(row.slug),
    name: String(row.name),
    subtitle: String(row.subtitle ?? ""),
    price: Number(row.price),
    compareAt: row.compare_at == null ? undefined : Number(row.compare_at),
    material: String(row.material ?? ""),
    sizingNote: String(row.sizing_note ?? ""),
    unityLine: String(row.unity_line ?? ""),
    colors: JSON.parse(String(row.colors_json || "[]")),
    sizes: JSON.parse(String(row.sizes_json || "[]")),
    image: String(row.image ?? ""),
    flatLay: String(row.flat_lay ?? ""),
    gallery: JSON.parse(String(row.gallery_json || "[]")),
    tag: row.tag ? String(row.tag) : undefined,
    collection: String(row.collection || "large"),
    groupKey: String(row.group_key ?? "misc"),
    groupLabel: String(row.group_label ?? "Weitere"),
    active: Number(row.active) !== 0,
    soldOut: Number(row.sold_out ?? 0) !== 0,
  };
}

function collectionFromRow(row: Record<string, unknown>): CatalogCollection {
  return {
    id: String(row.id || "large"),
    name: String(row.name),
    lead: String(row.lead ?? ""),
    cardNote: String(row.card_note ?? ""),
    badge: row.badge ? String(row.badge) : undefined,
  };
}

function orderFromRows(
  orderRow: Record<string, unknown>,
  items: OrderLineItem[]
): Order {
  const order: Order = {
    id: String(orderRow.id),
    accessToken: String(orderRow.access_token),
    status: orderRow.status as Order["status"],
    customer: {
      name: String(orderRow.customer_name),
      email: String(orderRow.customer_email),
      grade: orderRow.customer_grade ? String(orderRow.customer_grade) : undefined,
      notes: orderRow.customer_notes ? String(orderRow.customer_notes) : undefined,
    },
    items,
    total: Number(orderRow.total),
    createdAt: String(orderRow.created_at),
    updatedAt: String(orderRow.updated_at),
  };
  if (orderRow.payment_status) order.paymentStatus = orderRow.payment_status as Order["paymentStatus"];
  if (orderRow.payment_method) order.paymentMethod = orderRow.payment_method as Order["paymentMethod"];
  if (orderRow.payment_reference) order.paymentReference = String(orderRow.payment_reference);
  if (orderRow.stripe_session_id) order.stripeSessionId = String(orderRow.stripe_session_id);
  return order;
}

function insertOrderRow(db: Database.Database, order: Order) {
  db.prepare(
    `INSERT INTO orders (
      id, access_token, status, customer_name, customer_email, customer_grade, customer_notes,
      total, created_at, updated_at, payment_status, payment_method, payment_reference, stripe_session_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    order.id,
    order.accessToken,
    order.status,
    order.customer.name,
    order.customer.email,
    order.customer.grade ?? null,
    order.customer.notes ?? null,
    order.total,
    order.createdAt,
    order.updatedAt,
    order.paymentStatus ?? null,
    order.paymentMethod ?? null,
    order.paymentReference ?? null,
    order.stripeSessionId ?? null
  );

  const insertItem = db.prepare(
    `INSERT INTO order_items (order_id, slug, product_name, size, quantity, unit_price)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  for (const item of order.items) {
    insertItem.run(
      order.id,
      item.slug,
      item.productName,
      item.size,
      item.quantity,
      item.unitPrice
    );
  }
}

function updateOrderRow(db: Database.Database, order: Order) {
  db.prepare(
    `UPDATE orders SET
      access_token = ?, status = ?, customer_name = ?, customer_email = ?,
      customer_grade = ?, customer_notes = ?, total = ?, created_at = ?, updated_at = ?,
      payment_status = ?, payment_method = ?, payment_reference = ?, stripe_session_id = ?
     WHERE id = ?`
  ).run(
    order.accessToken,
    order.status,
    order.customer.name,
    order.customer.email,
    order.customer.grade ?? null,
    order.customer.notes ?? null,
    order.total,
    order.createdAt,
    order.updatedAt,
    order.paymentStatus ?? null,
    order.paymentMethod ?? null,
    order.paymentReference ?? null,
    order.stripeSessionId ?? null,
    order.id
  );
}

function loadOrderItems(db: Database.Database, orderId: string): OrderLineItem[] {
  const rows = db
    .prepare(
      `SELECT slug, product_name, size, quantity, unit_price
       FROM order_items WHERE order_id = ? ORDER BY id ASC`
    )
    .all(orderId) as Record<string, unknown>[];
  return rows.map((row) => ({
    slug: String(row.slug),
    productName: String(row.product_name),
    size: String(row.size),
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
  }));
}

function backupJsonOnce(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const bak = `${filePath}.migrated.${Date.now()}.bak`;
  try {
    fs.renameSync(filePath, bak);
    console.log(`[db] archived legacy JSON → ${path.basename(bak)}`);
  } catch (err) {
    console.warn(`[db] could not rename ${filePath}:`, err);
  }
}

function importLegacyJson(db: Database.Database, root: string) {
  if (getMeta(db, "json_migrated") === "1") return;

  const catalogFile = path.join(root, "data", "catalog.json");
  const inventoryFile = path.join(root, "data", "inventory.json");
  const ordersFile = path.join(root, "data", "orders.json");
  const votesFile = path.join(root, "data", "votes.json");

  const productCount = (
    db.prepare("SELECT COUNT(*) AS n FROM products").get() as { n: number }
  ).n;
  const orderCount = (
    db.prepare("SELECT COUNT(*) AS n FROM orders").get() as { n: number }
  ).n;
  const voteCount = (db.prepare("SELECT COUNT(*) AS n FROM votes").get() as { n: number }).n;

  const tx = db.transaction(() => {
    if (productCount === 0 && fs.existsSync(catalogFile)) {
      try {
        const catalog = readJsonFile<CatalogFile>(catalogFile, {
          collections: [],
          products: [],
          updatedAt: new Date().toISOString(),
        });
        writeCatalogUnlocked(db, catalog);
        console.log(`[db] migrated catalog.json (${catalog.products.length} products)`);
      } catch (err) {
        console.warn("[db] catalog migration skipped:", err);
      }
    }

    if (
      (db.prepare("SELECT COUNT(*) AS n FROM stock").get() as { n: number }).n === 0 &&
      fs.existsSync(inventoryFile)
    ) {
      try {
        const inventory = readJsonFile<InventoryFile>(inventoryFile, {
          stock: {},
          updatedAt: new Date().toISOString(),
        });
        writeInventoryUnlocked(db, inventory);
        console.log(
          `[db] migrated inventory.json (${Object.keys(inventory.stock).length} variants)`
        );
      } catch (err) {
        console.warn("[db] inventory migration skipped:", err);
      }
    }

    if (orderCount === 0 && fs.existsSync(ordersFile)) {
      try {
        const orders = readJsonFile<OrdersFile>(ordersFile, { orders: [] });
        for (const order of orders.orders) insertOrderRow(db, order);
        console.log(`[db] migrated orders.json (${orders.orders.length} orders)`);
      } catch (err) {
        console.warn("[db] orders migration skipped:", err);
      }
    }

    if (voteCount === 0 && fs.existsSync(votesFile)) {
      try {
        const votes = readJsonFile<{ records: VoteRecord[] }>(votesFile, { records: [] });
        const insert = db.prepare(
          `INSERT OR IGNORE INTO votes (drop_id, design_id, fingerprint_hash, ip, voted_at)
           VALUES (?, ?, ?, ?, ?)`
        );
        for (const v of votes.records) {
          insert.run(v.dropId, v.designId, v.fingerprintHash, v.ip, v.votedAt);
        }
        console.log(`[db] migrated votes.json (${votes.records.length} votes)`);
      } catch (err) {
        console.warn("[db] votes migration skipped:", err);
      }
    }

    setMeta(db, "json_migrated", "1");
  });

  tx();

  backupJsonOnce(catalogFile);
  backupJsonOnce(inventoryFile);
  backupJsonOnce(ordersFile);
  backupJsonOnce(votesFile);
}

export function getDb(root: string): Database.Database {
  const existing = dbByRoot.get(root);
  if (existing) return existing;

  const file = dbPath(root);
  ensureDir(file);
  const db = new Database(file);
  migrateSchema(db);
  importLegacyJson(db, root);
  dbByRoot.set(root, db);
  return db;
}

export function ensureShopDb(root: string): Database.Database {
  return getDb(root);
}

function writeCatalogUnlocked(db: Database.Database, catalog: CatalogFile) {
  db.prepare("DELETE FROM collections").run();
  db.prepare("DELETE FROM products").run();

  const insertCollection = db.prepare(
    `INSERT INTO collections (id, name, lead, card_note, badge, sort_order)
     VALUES (?, ?, ?, ?, ?, ?)`
  );
  catalog.collections.forEach((collection, index) => {
    insertCollection.run(
      collection.id,
      collection.name,
      collection.lead,
      collection.cardNote,
      collection.badge ?? null,
      index
    );
  });

  const insertProduct = db.prepare(
    `INSERT INTO products (
      slug, name, subtitle, price, compare_at, material, sizing_note, unity_line,
      colors_json, sizes_json, image, flat_lay, gallery_json, tag, collection,
      group_key, group_label, active, sold_out, sort_order
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  catalog.products.forEach((product, index) => {
    insertProduct.run(
      product.slug,
      product.name,
      product.subtitle,
      product.price,
      product.compareAt ?? null,
      product.material,
      product.sizingNote,
      product.unityLine,
      JSON.stringify(product.colors),
      JSON.stringify(product.sizes),
      product.image,
      product.flatLay,
      JSON.stringify(product.gallery),
      product.tag ?? null,
      product.collection,
      product.groupKey,
      product.groupLabel,
      product.active === false ? 0 : 1,
      product.soldOut ? 1 : 0,
      index
    );
  });

  setMeta(db, "catalog_updated_at", catalog.updatedAt || new Date().toISOString());
}

export function dbLoadCatalog(root: string): CatalogFile {
  const db = getDb(root);
  const collections = (
    db.prepare("SELECT * FROM collections ORDER BY sort_order ASC, id ASC").all() as Record<
      string,
      unknown
    >[]
  ).map(collectionFromRow);
  const products = (
    db.prepare("SELECT * FROM products ORDER BY sort_order ASC, slug ASC").all() as Record<
      string,
      unknown
    >[]
  ).map(productFromRow);
  return {
    collections,
    products,
    updatedAt: getMeta(db, "catalog_updated_at") || new Date().toISOString(),
  };
}

export function dbSaveCatalog(root: string, catalog: CatalogFile) {
  const db = getDb(root);
  db.transaction(() => writeCatalogUnlocked(db, catalog))();
}

function writeInventoryUnlocked(db: Database.Database, inventory: InventoryFile) {
  db.prepare("DELETE FROM stock").run();
  const insert = db.prepare(
    `INSERT INTO stock (slug, size, quantity) VALUES (?, ?, ?)`
  );
  for (const [key, quantity] of Object.entries(inventory.stock)) {
    const i = key.lastIndexOf("|");
    if (i < 1) continue;
    insert.run(key.slice(0, i), key.slice(i + 1), quantity);
  }
  setMeta(db, "inventory_updated_at", inventory.updatedAt || new Date().toISOString());
}

export function dbLoadInventory(root: string): InventoryFile {
  const db = getDb(root);
  const rows = db.prepare("SELECT slug, size, quantity FROM stock").all() as {
    slug: string;
    size: string;
    quantity: number;
  }[];
  const stock: Record<string, number> = {};
  for (const row of rows) {
    stock[`${row.slug}|${row.size}`] = row.quantity;
  }
  return {
    stock,
    updatedAt: getMeta(db, "inventory_updated_at") || new Date().toISOString(),
  };
}

export function dbSaveInventory(root: string, inventory: InventoryFile) {
  const db = getDb(root);
  db.transaction(() => writeInventoryUnlocked(db, inventory))();
}

export function dbGetOrder(root: string, orderId: string): Order | undefined {
  const db = getDb(root);
  const row = db.prepare("SELECT * FROM orders WHERE id = ?").get(orderId) as
    | Record<string, unknown>
    | undefined;
  if (!row) return undefined;
  return orderFromRows(row, loadOrderItems(db, orderId));
}

export function dbListOrders(root: string): Order[] {
  const db = getDb(root);
  const rows = db
    .prepare("SELECT * FROM orders ORDER BY created_at DESC")
    .all() as Record<string, unknown>[];
  return rows.map((row) => orderFromRows(row, loadOrderItems(db, String(row.id))));
}

export function dbCountOpenUnpaidByEmail(root: string, email: string): number {
  const db = getDb(root);
  const row = db
    .prepare(
      `SELECT COUNT(*) AS n FROM orders
       WHERE customer_email = ?
         AND status = 'pending'
         AND IFNULL(payment_status, 'unpaid') != 'paid'`
    )
    .get(email) as { n: number };
  return row.n;
}

export function dbInsertOrder(root: string, order: Order) {
  const db = getDb(root);
  db.transaction(() => insertOrderRow(db, order))();
}

export function dbUpdateOrder(root: string, order: Order) {
  const db = getDb(root);
  db.transaction(() => updateOrderRow(db, order))();
}

export function dbDeleteOrder(root: string, orderId: string) {
  const db = getDb(root);
  db.transaction(() => {
    db.prepare("DELETE FROM order_items WHERE order_id = ?").run(orderId);
    db.prepare("DELETE FROM orders WHERE id = ?").run(orderId);
  })();
}

export function dbWithShopTransaction<T>(root: string, fn: () => T): T {
  const db = getDb(root);
  return db.transaction(fn)();
}

export function dbListVotes(root: string, dropId?: string): VoteRecord[] {
  const db = getDb(root);
  const rows = (
    dropId
      ? (db
          .prepare("SELECT * FROM votes WHERE drop_id = ? ORDER BY voted_at ASC")
          .all(dropId) as VoteRow[])
      : (db.prepare("SELECT * FROM votes ORDER BY voted_at ASC").all() as VoteRow[])
  );
  return rows.map((row) => ({
    dropId: row.drop_id,
    designId: row.design_id,
    fingerprintHash: row.fingerprint_hash,
    ip: row.ip,
    votedAt: row.voted_at,
  }));
}

export function dbFindVote(
  root: string,
  dropId: string,
  fingerprintHash: string,
  cookieHash: string | null
): VoteRecord | undefined {
  const db = getDb(root);
  const byFp = db
    .prepare("SELECT * FROM votes WHERE drop_id = ? AND fingerprint_hash = ?")
    .get(dropId, fingerprintHash) as VoteRow | undefined;
  if (byFp) {
    return {
      dropId: byFp.drop_id,
      designId: byFp.design_id,
      fingerprintHash: byFp.fingerprint_hash,
      ip: byFp.ip,
      votedAt: byFp.voted_at,
    };
  }
  if (!cookieHash) return undefined;
  const byCookie = db
    .prepare("SELECT * FROM votes WHERE drop_id = ? AND fingerprint_hash = ?")
    .get(dropId, cookieHash) as VoteRow | undefined;
  if (!byCookie) return undefined;
  return {
    dropId: byCookie.drop_id,
    designId: byCookie.design_id,
    fingerprintHash: byCookie.fingerprint_hash,
    ip: byCookie.ip,
    votedAt: byCookie.voted_at,
  };
}

export function dbInsertVote(root: string, vote: VoteRecord): boolean {
  const db = getDb(root);
  try {
    db.prepare(
      `INSERT INTO votes (drop_id, design_id, fingerprint_hash, ip, voted_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(vote.dropId, vote.designId, vote.fingerprintHash, vote.ip, vote.votedAt);
    return true;
  } catch {
    return false;
  }
}

/** Move old terminal orders into archive (optional anonymize). Returns archived count. */
export function dbArchiveOldOrders(root: string): number {
  const retentionDays = Math.max(
    30,
    Number(process.env.ORDER_RETENTION_DAYS || 1095)
  );
  const anonymize =
    (process.env.ORDER_ARCHIVE_ANONYMIZE || "true").toLowerCase() === "true" ||
    process.env.ORDER_ARCHIVE_ANONYMIZE === "1";
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();
  const db = getDb(root);

  const candidates = db
    .prepare(
      `SELECT id FROM orders
       WHERE created_at < ?
         AND status IN ('fulfilled', 'cancelled')`
    )
    .all(cutoff) as { id: string }[];

  if (!candidates.length) return 0;

  const archiveOne = db.transaction((orderId: string) => {
    const order = dbGetOrder(root, orderId);
    if (!order) return;
    const archivedAt = new Date().toISOString();
    let name = order.customer.name;
    let email = order.customer.email;
    let grade = order.customer.grade ?? null;
    let notes = order.customer.notes ?? null;
    let anonymized = 0;
    if (anonymize) {
      anonymized = 1;
      name = "archiviert";
      email = `redacted+${order.id.slice(-8).toLowerCase()}@archive.local`;
      grade = null;
      notes = null;
    }
    db.prepare(
      `INSERT OR REPLACE INTO orders_archive (
        id, access_token, status, customer_name, customer_email, customer_grade, customer_notes,
        total, created_at, updated_at, payment_status, payment_method, payment_reference,
        stripe_session_id, items_json, archived_at, anonymized
      ) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      order.id,
      order.status,
      name,
      email,
      grade,
      notes,
      order.total,
      order.createdAt,
      order.updatedAt,
      order.paymentStatus ?? null,
      order.paymentMethod ?? null,
      order.paymentReference ?? null,
      order.stripeSessionId ?? null,
      JSON.stringify(order.items),
      archivedAt,
      anonymized
    );
    db.prepare("DELETE FROM orders WHERE id = ?").run(order.id);
  });

  let archived = 0;
  for (const { id } of candidates) {
    archiveOne(id);
    archived += 1;
  }
  return archived;
}

export function startOrderArchiveCleanup(
  archiveFn: () => number,
  intervalMs = 24 * 60 * 60 * 1000
): void {
  const tick = () => {
    try {
      const n = archiveFn();
      if (n > 0) console.log(`[orders] archived ${n} old order(s)`);
    } catch (err) {
      console.warn("[orders] archive sweep failed:", err);
    }
  };
  void tick();
  const timer = setInterval(tick, intervalMs);
  timer.unref?.();
}
