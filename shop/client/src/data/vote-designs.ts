import { catalog } from "@/assets/images";

export interface VoteDesign {
  id: string;
  title: string;
  description: string;
  image: string;
  /** When true, design is teaser-only — voting disabled. */
  comingSoon: boolean;
}

export const VOTE_DESIGNS: VoteDesign[] = [
  {
    id: "building-print",
    title: "Gebäude-Silhouette",
    description: "Klassischer Schulgebäude-Print — zeitlos und klar.",
    image: catalog.products.hoodieSchwarzBack,
    comingSoon: true,
  },
  {
    id: "crest-logo",
    title: "CSH Logo",
    description: "Navy Hoodie mit weissem CSH-Logo — sportlich-elegant.",
    image: catalog.products.hoodieBlauDetail,
    comingSoon: true,
  },
  {
    id: "community-tees",
    title: "Gemeinschaft",
    description: "Schwarze Shirts für die ganze Schulgemeinschaft.",
    image: catalog.products.tshirtSchwarzGroup,
    comingSoon: true,
  },
];

export const DROP_ID = "drop-2026-spring";

/** True while the next-drop vote is not open yet. */
export const VOTE_COMING_SOON = VOTE_DESIGNS.every((d) => d.comingSoon);
