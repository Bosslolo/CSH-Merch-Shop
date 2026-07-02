# CSH Merch Shop — Design Brainstorm

## Three Approaches

### 1. Nordic Editorial Minimalism
**Theme Name:** Stille & Stärke (Stillness & Strength)
**Brief:** Clean Scandinavian editorial aesthetic — vast whitespace, stark typographic hierarchy, photography-first. The merch becomes art objects.
**Probability:** 0.07

### 2. Collegiate Heritage Revival
**Theme Name:** Hegau Crest
**Brief:** Draws on classic European school traditions — serif type, crests, deep navy and gold. Feels like a premium university store.
**Probability:** 0.04

### 3. Contemporary School Culture
**Theme Name:** Gemeinschaft (Community)
**Brief:** Inspired by modern streetwear editorial brands like Balmoral — asymmetric layouts, full-bleed photography, cinematic typography, a deep sense of belonging and identity.
**Probability:** 0.09

---

## Chosen Approach: **Gemeinschaft** (Contemporary School Culture)

### Design Movement
Contemporary editorial fashion — inspired by premium school/streetwear brands (Balmoral, Palace, Aimé Leon Dore). Clean but bold, photography-driven, deeply community-oriented.

### Core Principles
1. **Photography First** — images carry the emotional weight; layout serves them
2. **Asymmetric Tension** — text and images never sit in predictable grids; they overlap, offset, and breathe
3. **Typographic Contrast** — ultra-light tracking vs heavy display weight creates visual rhythm
4. **Belonging Over Product** — every section sells the feeling of being CSH, not just a hoodie

### Color Philosophy
- **Signature Navy** `#0F1F3D` — deep, authoritative, the CSH blue taken to its most premium expression
- **Warm Off-White** `#F5F2ED` — aged paper warmth, not clinical white
- **Warm Gold** `#C9A84C` — used sparingly as the accent for "new collection" moments
- **Charcoal** `#1A1A1A` — body text, grounding
- Emotional intent: serious yet warm, proud yet approachable

### Layout Paradigm
Asymmetric editorial — hero takes full viewport with offset text. Sections alternate between full-bleed image panels and tight typographic grids. Product cards sit in a left-anchored horizontal scroll. No centered hero text blocks.

### Signature Elements
1. **The Circle Mark** — CSH's circular logo motif appears as a watermark, a section divider, and an accent throughout
2. **Vertical Text Labels** — rotated section labels (e.g., "KOLLEKTION 2024") run vertically along section edges
3. **Film Grain Overlay** — subtle noise texture on hero images for warmth and tactility

### Interaction Philosophy
Hover states reveal; nothing jumps. Product cards lift with a subtle shadow. The hero image has a slow parallax. CTAs use underline-grow animations, not background fills.

### Animation
- Hero entrance: staggered text fade-up (0ms, 120ms, 240ms delays)
- Product cards: scale(1.02) on hover, 200ms ease-out
- Navigation: fade-in on scroll, backdrop-blur transition 150ms
- Section reveals: IntersectionObserver fade-up, 60ms stagger

### Typography System
- **Display:** "Playfair Display" — italic for emotional headlines, weight 700
- **Body/UI:** "DM Sans" — clean, geometric, weight 300–500
- **Labels/Tags:** "DM Mono" — uppercase tracking for category labels
- Hierarchy: 96px display → 48px section → 24px subhead → 16px body → 11px label

### Brand Essence
**CSH Merch** — for students who carry their school with them. Premium, purposeful, earned.
Adjectives: **Proud · Grounded · Alive**

### Brand Voice
Headlines sound like a quiet declaration, not a shout.
- "Mehr als eine Schule. Eine Gemeinschaft."
- "Trag, was dich ausmacht."
Ban: "Welcome to our shop", "Get started today", "Shop now for great deals"

### Wordmark & Logo
The CSH circle mark — the existing circular logo — rendered in deep navy on off-white, or white on navy. Used at 40px in nav, large as a watermark in hero.

### Signature Brand Color
**CSH Navy** `#0F1F3D` — unmistakably this brand's.
