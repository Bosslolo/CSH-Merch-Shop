# CSH Merch — Fotoshooting Image Catalog

Complete visual index of all **204 images** in `Fotoshooting Schülerfirma/`.

## Quick start

```bash
# Generate index + copy files to semantic names
bash scripts/organize-fotoshooting.sh

# Build shop catalog (15 curated assets)
bash scripts/build-catalog.sh
```

**Outputs:**

| File / folder | Purpose |
|---------------|---------|
| `assets/fotoshooting-index.json` | Master lookup: original DSC/UUID → semantic name + description |
| `Fotoshooting Schülerfirma/_named/` | Copies with proper names (originals untouched) |
| `shop/client/public/images/catalog/` | Assets used by the live shop |

## Naming convention

```
{product}-{farbe}-{ansicht}-{kontext}[-variant].jpg
```

| Prefix | Meaning | Example |
|--------|---------|---------|
| `hoodie-blau-` | Navy CSH hoodie | `hoodie-blau-front-studio-male-02.jpg` |
| `hoodie-schwarz-` | Black CSH hoodie | `hoodie-schwarz-back-building-print-studio-01.jpg` |
| `hoodie-weiss-` | White CSH hoodie | `hoodie-weiss-front-studio-female-02.jpg` |
| `tshirt-schwarz-` | Black CSH t-shirt | `tshirt-schwarz-front-studio-female-10.jpg` |
| `tshirt-weiss-` | White CSH t-shirt | `tshirt-weiss-front-studio-male-smile-01.jpg` |
| `combo-` | Multiple products in one shot | `combo-hoodie-blau-weiss-schwarz-front-studio-group-01.jpg` |
| `lifestyle-` | Outdoor / campus / candid | `lifestyle-courtyard-hoodie-back-front-outdoor-01.jpg` |
| `ref-` | Reference, mockup, non-merch | `ref-mockup-hoodie-schwarz-back-building.jpeg` |
| `brand-` | Logo / artwork assets | `brand-logo-weiss-front.png` |

**Ansicht (view):** `front` · `back` · `detail` · `side`  
**Kontext:** `studio` · `lifestyle` · `outdoor` · `indoor` · `campus` · `snow` · `hallway`

Colors use shop German slugs: **blau** (navy), **schwarz**, **weiss**.

## Folder overview

| Folder | Files | What's in it |
|--------|-------|--------------|
| **Shooting 1** | 38 | Early studio — **black hoodie + black t-shirt only**. Building back prints, logo details, hallway lifestyle. |
| **Shooting 2** | 123 | **Main product shoot** — all 3 hoodie colors + 2 tee colors. Studio, snow, campus. Group shots. |
| **Shooting 3** | 32 | **Outdoor lifestyle** — courtyard, field, study booth, Christmas stairs, cross-generation. |
| **Blanked** | 11 | Reference — school building photo, logo PNG, WhatsApp mockups, AI sketch. |

## Shop products (5 items)

| Product | Front | Back | Named file examples |
|---------|-------|------|---------------------|
| **Hoodie Blau** | White CSH crest logo | Building line art | `hoodie-blau-front-studio-male-02.jpg` (was DSC02623) |
| **Hoodie Schwarz** | White CSH logo | Building + „Christliche Schule im Hegau" | `hoodie-schwarz-front-studio-male-01.jpg` (DSC02110) |
| **Hoodie Weiß** | Black CSH logo | Building print | `hoodie-weiss-front-studio-female-02.jpg` (DSC02639) |
| **T-Shirt Schwarz** | White CSH circle logo | Building print | `tshirt-schwarz-front-studio-female-10.jpg` (DSC02252) |
| **T-Shirt Weiß** | Black CSH logo | Building print | `tshirt-weiss-front-studio-male-smile-01.jpg` (DSC03208) |

## Lookup: original → semantic name

Full mapping in `assets/fotoshooting-index.json`. Examples:

### Shooting 1 (DSC02070–DSC02487)

| Original | Semantic name | Shows |
|----------|---------------|-------|
| DSC02110.jpg | `hoodie-schwarz-front-studio-male-01.jpg` | Black hoodie front, smiling male |
| DSC02195.jpg | `hoodie-schwarz-back-building-print-studio-01.jpg` | Black hoodie back, building print |
| DSC02252.jpg | `tshirt-schwarz-front-studio-female-10.jpg` | Black t-shirt front |
| DSC02443.jpg | `combo-hoodie-tshirt-schwarz-back-building-print-lifestyle-01.jpg` | Duo walking hallway, back prints |

### Shooting 2 (selected)

| Original | Semantic name | Shows |
|----------|---------------|-------|
| DSC02623.jpg | `hoodie-blau-front-studio-male-02.jpg` | Navy hoodie front (hero) |
| DSC02613.jpg | `hoodie-blau-detail-logo-studio-01.jpg` | Navy logo close-up |
| DSC02639.jpg | `hoodie-weiss-front-studio-female-02.jpg` | White hoodie front |
| DSC02907.jpg | `combo-hoodie-blau-weiss-schwarz-front-studio-group-03.jpg` | All 3 hoodies group |
| DSC03419.jpg | `tshirt-schwarz-front-studio-group-three-01.jpg` | Three models black tees |
| DSC03468.jpg | `hoodie-schwarz-front-studio-female-laughing-01.jpg` | Woman laughing, black hoodie |
| DSC03208.jpg | `tshirt-weiss-front-studio-male-smile-01.jpg` | White t-shirt front |
| DSC03942.jpg | `combo-hoodie-schwarz-weiss-back-outdoor-campus-walking-01.jpg` | Campus walk, back prints |

### Shooting 3 (UUID → named)

| Original | Semantic name | Shows |
|----------|---------------|-------|
| 34931596-…JPG | `lifestyle-courtyard-hoodie-back-front-outdoor-01.jpg` | Cross-gen courtyard hero |
| 1531A501-…JPG | `lifestyle-field-tshirt-back-walking-outdoor-01.jpg` | Field walk, t-shirt backs |
| 41B7CD8A-…JPG | `lifestyle-stairs-hoodie-christmas-indoor-group-01.jpg` | Santa hats on stairs |

## Non-merch / reference files

| Semantic name | Was | Notes |
|---------------|-----|-------|
| `ref-hoodie-grau-front-lifestyle-outdoor-01.jpg` | DSC02516 | Plain grey hoodie, no CSH branding |
| `ref-sweater-grau-front-lifestyle-indoor-01.jpg` | DSC02741 | Grey knit sweater, not shop stock |
| `ref-styling-jeans-sneaker-detail-01.jpg` | DSC04184 | Ed Hardy jeans + Nike Dunks |
| `ref-prop-tulips-table-indoor-01.jpg` | 65242502-… | Shoot prop (flowers) |
| `ref-mockup-*` | WhatsApp exports | Early product mockups |
| `brand-logo-weiss-front.png` | CSH_white.png | Logo asset |

## Directory structure after organize

```
Fotoshooting Schülerfirma/
├── Shooting 1/          ← originals (DSC*.jpg)
├── Shooting 2/
├── Shooting 3/
├── Blanked/
└── _named/              ← semantic copies
    ├── shooting-1/    (38 files)
    ├── shooting-2/    (123 files)
    ├── shooting-3/    (32 files)
    └── blanked/       (11 files)
```

## Search the index

```bash
# Find what DSC02623 is
python3 -c "
import json; d=json.load(open('assets/fotoshooting-index.json'))
for f in d['files']:
    if f['original']=='DSC02623.jpg':
        print(f['proposed_name'], '—', f['description'])
"

# List all hoodie-blau shots
python3 -c "
import json; d=json.load(open('assets/fotoshooting-index.json'))
for f in d['files']:
    if f.get('product') and 'hoodie-blau' in f['product']:
        print(f['proposed_name'])
"
```
