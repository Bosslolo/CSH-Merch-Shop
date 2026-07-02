import { catalog } from "@/assets/images";

export interface Product {
  slug: string;
  name: string;
  subtitle: string;
  price: number;
  compareAt?: number;
  material: string;
  sizingNote: string;
  unityLine: string;
  colors: { name: string; hex: string }[];
  sizes: string[];
  image: string;
  flatLay: string;
  gallery: string[];
  tag?: string;
}

export const PRODUCTS: Product[] = [
  {
    slug: "csh-hoodie-blau",
    name: "CSH Hoodie Blau",
    subtitle: "Letzte Auflage",
    price: 25,
    compareAt: 35,
    material: "80 % Baumwolle / 20 % Polyester",
    sizingNote: "Fällt klein aus — bei Bedarf eine Groesse groesser.",
    unityLine: "Navy, klar, CSH — für die ganze Schulgemeinschaft.",
    colors: [{ name: "Blau", hex: "#4070a0" }],
    sizes: ["S", "M", "L", "XL"],
    image: catalog.products.hoodieBlauFront,
    flatLay: catalog.products.hoodieBlauFront,
    gallery: [catalog.products.hoodieBlauFront, catalog.products.hoodieBlauDetail, catalog.community.groupTees],
    tag: "Letzte Auflage",
  },
  {
    slug: "csh-hoodie-schwarz",
    name: "CSH Hoodie Schwarz",
    subtitle: "Letzte Auflage",
    price: 25,
    compareAt: 35,
    material: "80 % Baumwolle / 20 % Polyester",
    sizingNote: "Fällt klein aus — bei Bedarf eine Groesse groesser.",
    unityLine: "Gebäude-Print auf dem Rücken — Schulstolz zum Anziehen.",
    colors: [{ name: "Schwarz", hex: "#1A1A1A" }],
    sizes: ["S", "M", "L", "XL"],
    image: catalog.products.hoodieSchwarzFront,
    flatLay: catalog.products.hoodieSchwarzFront,
    gallery: [catalog.products.hoodieSchwarzFront, catalog.products.hoodieSchwarzBack, catalog.products.hoodieSchwarzLifestyle],
    tag: "Letzte Auflage",
  },
  {
    slug: "csh-hoodie-weiss",
    name: "CSH Hoodie Weiss",
    subtitle: "Letzte Auflage",
    price: 25,
    compareAt: 35,
    material: "80 % Baumwolle / 20 % Polyester",
    sizingNote: "Fällt klein aus — bei Bedarf eine Groesse groesser.",
    unityLine: "Hell und klar — KiTa bis Oberstufe.",
    colors: [{ name: "Weiss", hex: "#FAFAF8" }],
    sizes: ["S", "M", "L", "XL"],
    image: catalog.products.hoodieWeissFront,
    flatLay: catalog.products.hoodieWeissFront,
    gallery: [catalog.products.hoodieWeissFront, catalog.hero.lifestyleCrossgen, catalog.products.hoodieSchwarzLifestyle],
    tag: "Letzte Auflage",
  },
  {
    slug: "csh-t-shirt-schwarz",
    name: "CSH T-Shirt Schwarz",
    subtitle: "Letzte Auflage",
    price: 15,
    compareAt: 25,
    material: "100 % Bio-Baumwolle",
    sizingNote: "Unisex und Mädels (enger). Fällt klein aus.",
    unityLine: "Drei Generationen, ein Shirt — schwarz, schlicht, CSH.",
    colors: [{ name: "Schwarz", hex: "#1A1A1A" }],
    sizes: ["S", "M", "L", "XL"],
    image: catalog.products.tshirtSchwarzFront,
    flatLay: catalog.products.tshirtSchwarzFront,
    gallery: [catalog.products.tshirtSchwarzFront, catalog.products.tshirtSchwarzGroup, catalog.products.tshirtWeissFront],
    tag: "Letzte Auflage",
  },
  {
    slug: "csh-t-shirt-weiss",
    name: "CSH T-Shirt Weiss",
    subtitle: "Letzte Auflage",
    price: 15,
    compareAt: 25,
    material: "100 % Bio-Baumwolle",
    sizingNote: "Unisex und Mädels (enger). Fällt klein aus.",
    unityLine: "Bio-Baumwolle, weiss, für jeden Tag an der CSH.",
    colors: [{ name: "Weiss", hex: "#FAFAF8" }],
    sizes: ["S", "M", "L", "XL"],
    image: catalog.products.tshirtWeissFront,
    flatLay: catalog.products.tshirtWeissFront,
    gallery: [catalog.products.tshirtWeissFront, catalog.products.tshirtSchwarzGroup, catalog.hero.lifestyleCrossgen],
    tag: "Letzte Auflage",
  },
];

export function getProduct(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}
