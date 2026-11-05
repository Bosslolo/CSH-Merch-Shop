/**
 * Curated catalog — built via scripts/build-catalog.sh from Fotoshooting Schülerfirma
 * See assets/catalog-manifest.json for source mapping
 */
const c = (path: string) => `/images/catalog/${path}`;

export const catalog = {
  hero: {
    lifestyleCrossgen: c("hero/editorial-kita-oberstufe.jpg"),
    lifestyleNavyHoodie: c("hero/lifestyle-hero-navy-hoodie-studio.jpg"),
    schoolBuilding: c("hero/school-building-gemeindezentrum.jpg"),
    schoolCommunityKids: c("hero/school-community-kids.jpg"),
    lifestylePingpong: c("hero/lifestyle-pingpong-tshirt-group-outdoor.jpg"),
  },
  panel: {
    collectionInset: c("panel/collection-campus-entry.jpg"),
    heroInset: c("panel/panel-hero-inset.jpg"),
  },
  products: {
    hoodieBlauFront: c("products/hoodie-blau-front-studio.jpg"),
    hoodieBlauDetail: c("products/hoodie-blau-shooting-dsc03988.jpg"),
    hoodieBlauShooting3: c("products/hoodie-blau-shooting-dsc03770.jpg"),
    hoodieSchwarzBack: c("products/hoodie-schwarz-back-building-print.jpg"),
    hoodieSchwarzFront: c("products/hoodie-schwarz-front-studio.jpg"),
    hoodieSchwarzLifestyle: c("products/hoodie-schwarz-shooting-dsc03708.jpg"),
    hoodieWeissFront: c("products/hoodie-weiss-front-studio.jpg"),
    hoodieWeissShooting: c("products/hoodie-weiss-shooting-dsc02656.jpg"),
    hoodieWeissShooting3: c("products/hoodie-weiss-shooting-dsc03780.jpg"),
    hoodieSharedShooting: c("products/hoodie-shared-shooting-dsc02913.jpg"),
    tshirtSchwarzFront: c("products/tshirt-schwarz-shooting-dsc02275.jpg"),
    tshirtSchwarzGroup: c("products/tshirt-schwarz-group-community.jpg"),
    tshirtSchwarzShooting2: c("products/tshirt-schwarz-shooting-dsc02315.jpg"),
    tshirtSchwarzShooting3: c("products/tshirt-schwarz-shooting-dsc02222.jpg"),
    tshirtSchwarzShooting4: c("products/tshirt-schwarz-shooting-dsc02486.jpg"),
    tshirtWeissFront: c("products/tshirt-weiss-front-studio.jpg"),
    tshirtWeissShooting2: c("products/tshirt-weiss-shooting-dsc03093.jpg"),
    tshirtWeissShooting3: c("products/tshirt-weiss-shooting-dsc03342.jpg"),
    tshirtWeissShooting4: c("products/tshirt-weiss-shooting-dsc03329.jpg"),
  },
  community: {
    groupTees: c("community/group-tees-black-studio.jpg"),
  },
  brand: {
    logoWhite: c("brand/logo-white-on-transparent.png"),
  },
} as const;
