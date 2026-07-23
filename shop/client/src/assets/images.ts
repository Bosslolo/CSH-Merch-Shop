/**
 * Curated catalog — built via scripts/build-catalog.sh from Fotoshooting Schülerfirma
 * See assets/catalog-manifest.json for source mapping
 */
const c = (path: string) => `/images/catalog/${path}`;

export const catalog = {
  hero: {
    lifestyleCrossgen: c("hero/lifestyle-crossgen-hoodies-outdoor.jpg"),
    lifestyleNavyHoodie: c("hero/lifestyle-hero-navy-hoodie-studio.jpg"),
    schoolBuilding: c("hero/school-building-gemeindezentrum.jpg"),
    schoolCommunityKids: c("hero/school-community-kids.jpg"),
    lifestylePingpong: c("hero/lifestyle-pingpong-tshirt-group-outdoor.jpg"),
  },
  panel: {
    collectionInset: c("panel/collection-inset-hoodie-lifestyle.jpg"),
  },
  products: {
    hoodieBlauFront: c("products/hoodie-blau-front-studio.jpg"),
    hoodieBlauDetail: c("products/hoodie-blau-detail-logo.jpg"),
    hoodieSchwarzBack: c("products/hoodie-schwarz-back-building-print.jpg"),
    hoodieSchwarzFront: c("products/hoodie-schwarz-front-studio.jpg"),
    hoodieSchwarzLifestyle: c("products/hoodie-schwarz-front-lifestyle.jpg"),
    hoodieWeissFront: c("products/hoodie-weiss-front-studio.jpg"),
    tshirtSchwarzFront: c("products/tshirt-schwarz-front-studio.jpg"),
    tshirtSchwarzGroup: c("products/tshirt-schwarz-group-community.jpg"),
    tshirtWeissFront: c("products/tshirt-weiss-front-studio.jpg"),
  },
  community: {
    groupTees: c("community/group-tees-black-studio.jpg"),
  },
  brand: {
    logoWhite: c("brand/logo-white-on-transparent.png"),
  },
} as const;

/** @deprecated use catalog — kept for gradual migration */
export const images = {
  heroCommunity: catalog.community.groupTees,
  schoolSpirit: catalog.hero.schoolBuilding,
  newCollectionTeaser: catalog.products.hoodieSchwarzBack,
  heroHoodieModel: catalog.hero.lifestyleNavyHoodie,
  tshirtModel: catalog.products.tshirtSchwarzFront,
  collectionBanner: catalog.products.hoodieWeissFront,
  schoolCourtyard: catalog.hero.schoolBuilding,
  logoBlue: "/images/logo-blue.png",
  logoBlack: "/images/logo-black.png",
};
