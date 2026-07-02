#!/bin/bash
# Build curated catalog from Fotoshooting → shop/client/public/images/catalog
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/Fotoshooting Schülerfirma"
DST="$ROOT/shop/client/public/images/catalog"
IMG="$ROOT/csh-merch-images"

mkdir -p "$DST"/{hero,panel,products,community,brand}

copy() {
  local rel="$1" dest="$2"
  local from="$ROOT/$rel"
  if [[ -f "$from" ]]; then
    cp "$from" "$DST/$dest"
    echo "✓ $dest"
  else
    echo "⚠ missing: $rel"
  fi
}

copy "Fotoshooting Schülerfirma/Shooting 3/34931596-78D8-4EC5-81C7-94074588E2E9.JPG" "hero/lifestyle-crossgen-hoodies-outdoor.jpg"
copy "Fotoshooting Schülerfirma/Shooting 2/DSC02623.jpg" "hero/lifestyle-hero-navy-hoodie-studio.jpg"
copy "Fotoshooting Schülerfirma/Blanked/CSH-Front.jpeg" "hero/school-building-gemeindezentrum.jpg"
copy "Fotoshooting Schülerfirma/Shooting 2/DSC03468.jpg" "panel/collection-inset-hoodie-lifestyle.jpg"
copy "Fotoshooting Schülerfirma/Shooting 2/DSC02623.jpg" "products/hoodie-blau-front-studio.jpg"
copy "Fotoshooting Schülerfirma/Shooting 1/DSC02195.jpg" "products/hoodie-schwarz-back-building-print.jpg"
copy "Fotoshooting Schülerfirma/Shooting 1/DSC02110.jpg" "products/hoodie-schwarz-front-studio.jpg"
copy "Fotoshooting Schülerfirma/Shooting 2/DSC03468.jpg" "products/hoodie-schwarz-front-lifestyle.jpg"
copy "Fotoshooting Schülerfirma/Shooting 2/DSC02613.jpg" "products/hoodie-blau-detail-logo.jpg"
copy "Fotoshooting Schülerfirma/Shooting 2/DSC02639.jpg" "products/hoodie-weiss-front-studio.jpg"
copy "Fotoshooting Schülerfirma/Shooting 1/DSC02252.jpg" "products/tshirt-schwarz-front-studio.jpg"
copy "Fotoshooting Schülerfirma/Shooting 2/DSC03419.jpg" "products/tshirt-schwarz-group-community.jpg"
copy "Fotoshooting Schülerfirma/Shooting 2/DSC03208.jpg" "products/tshirt-weiss-front-studio.jpg"
copy "Fotoshooting Schülerfirma/Shooting 2/DSC03419.jpg" "community/group-tees-black-studio.jpg"
copy "Fotoshooting Schülerfirma/Shooting 2/CSH_white.png" "brand/logo-white-on-transparent.png"

# Fallbacks from csh-merch-images if needed
[[ -f "$DST/hero/lifestyle-crossgen-hoodies-outdoor.jpg" ]] || copy "csh-merch-images/school-community.jpg" "hero/lifestyle-crossgen-hoodies-outdoor.jpg"

echo "Done → $DST"
