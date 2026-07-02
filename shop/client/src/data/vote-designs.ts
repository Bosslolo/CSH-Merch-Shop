import { catalog } from "@/assets/images";

export interface VoteDesign {
  id: string;
  title: string;
  description: string;
  image: string;
}

export const VOTE_DESIGNS: VoteDesign[] = [
  {
    id: "building-print",
    title: "Gebäude-Silhouette",
    description: "Klassischer Schulgebäude-Print — zeitlos und klar.",
    image: catalog.products.hoodieSchwarzBack,
  },
  {
    id: "crest-logo",
    title: "CSH Wappen",
    description: "Navy Hoodie mit weissem CSH-Wappen — sportlich-elegant.",
    image: catalog.products.hoodieBlauDetail,
  },
  {
    id: "community-tees",
    title: "Gemeinschaft",
    description: "Schwarze Shirts für die ganze Schulgemeinschaft.",
    image: catalog.products.tshirtSchwarzGroup,
  },
];

export const DROP_ID = "drop-2026-spring";
