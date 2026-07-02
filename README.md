# CSH Merch Shop (React)

Editorial landing page from Manus — runs locally with Vite.

## Start

```bash
cd shop
npm install --legacy-peer-deps
npm run dev
```

Open http://localhost:5174

## Assets

- Product/school photos: `../csh-merch-images/` (copied into `client/public/images/` for dev)
- Full fotoshooting library: `../Fotoshooting Schülerfirma/`
- Design reference: `../Design inspo.jpg`

## Notes

- Images originally pointed at Manus cloud storage — now wired to local files via `client/src/assets/images.ts`
- Cart/checkout is placeholder (toast) — Shopify integration is next step
- Production build: `npm run build && npm start`
