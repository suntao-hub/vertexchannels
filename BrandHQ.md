# Brand HQ — Product Requirements Document

Version 1.0 · Vertex Channels · October 2026

## 1. Overview

Brand HQ is an internal tool built inside the Vertex Channels admin (`/admin/deals`) that turns the Deal Desk's existing brand-prospect pipeline into a structured, searchable supplier database — our equivalent of High Ticket's Supplier HQ. It consolidates every piece of research (marketplace presence, margin, MAP policy, contact info, deal score) into one place, surfaces which brands are worth pursuing, and makes it fast to onboard a new researcher or hand off a pipeline.

## 2. Problem

The Deal Desk today is a pipeline tool — brands move through stages (sourced → researched → contacted → account\_open → active). What it lacks is a library view: a fast way to browse all 38+ brands by category, score, marketplace gap, or stage without scrolling a flat list. Research lives partly in the tool, partly in the scorer's head. There is no way to answer "which garage-equipment brands are un-contacted and score above 76?" in under a minute.

## 3. Goals

- **G1** — Make the full brand pipeline browsable and filterable in under 5 seconds.
- **G2** — Surface deal score, marketplace gap, and account status at a glance without opening each card.
- **G3** — Add structured fields the current Deal Desk doesn't capture: Walmart/eBay/Newegg presence, MAP strictness, AOV, brand tier.
- **G4** — Auto-compute a Brand HQ Score combining the existing TWF score with marketplace-gap and margin signals.
- **G5** — Keep it inside `/admin/deals` — extend what's already there, no new auth or deploy.

## 4. Non-Goals

- No public-facing product in this phase — internal only.
- No new database — extend BrandProspect model, don't create a parallel table.
- No automated marketplace scraping — manual entry + CSV import only.
- No multi-user permissions — single admin, same as today.

## 5. Users

**Primary:** the Vertex Channels admin — sourcing brands, tracking outreach, deciding where to spend research time.

**Future:** a sourcing VA or second researcher — Brand HQ's structured fields make onboarding fast because all research context is in one place.

## 6. New Data Fields (extend BrandProspect)

| Field | Type | Description |
| --- | --- | --- |
| walmartPresent | Boolean? | Brand already sells on Walmart Marketplace |
| ebayPresent | Boolean? | Brand already sells on eBay |
| neweggPresent | Boolean? | Brand already sells on Newegg |
| avgOrderValue | Float? | Typical AOV in dollars |
| mapStrictness | String? | 'strict' / 'flexible' / 'none' |
| brandTier | String? | 'independent' / 'regional' / 'national' |
| grossMarginPct | Float? | Estimated gross margin % |
| hqScore | Float? | Computed: TWF score + marketplace gap + margin bonus |
| hqScoreAt | DateTime? | When hqScore was last computed |
| researchNotes | String? | Brand-level free-text research notes |

All fields are optional — no destructive migration.

## 7. Views

### 7A. Brand Library (new default view)

A filterable card grid replacing the current flat list as the landing view for `/admin/deals`. Each card shows:

- Brand name + category badge
- HQ Score (large, color-coded: ≥80 green / 65–79 yellow / <65 grey)
- Marketplace gap pills: Walmart / eBay / Newegg — red = not present = opportunity
- Pipeline stage chip
- AOV + margin % in small text
- Quick-action buttons: Open card | Draft email

### 7B. Filter Bar

- Category (tools / automotive / garage / hardware / other)
- Pipeline stage (multi-select)
- Marketplace gap (show only brands missing Walmart / eBay / Newegg)
- MAP strictness
- Brand tier
- HQ Score range slider (0–130)
- Sort: HQ Score ↓ / Fit Rank / Stage / A-Z / Recently updated

### 7C. Pipeline Board (existing, keep)

The current Kanban-style stage board stays accessible via a View toggle (Library | Pipeline). No changes to pipeline board behavior.

## 8. HQ Score Formula

**Base:** existing TWF score (0–100) from `lib/deals/scoring.ts`

**Marketplace Gap Bonus** (max +15 pts): +5 per channel the brand is NOT present on (Walmart / eBay / Newegg)

**Margin Bonus** (max +10 pts): grossMarginPct ≥40% → +10 / 30–39% → +5 / <30% → +0

**AOV Bonus** (max +5 pts): AOV ≥$150 → +5 / $75–149 → +3 / <$75 → +0

**Final HQ Score** = min(base + gap + margin + AOV, 130)

**Bands:** ≥100 Priority · 80–99 Strong · 65–79 Watchlist · <65 Archive

## 9. Brand Detail Panel (extend existing prospect card)

Add a 'Brand HQ' section above the product scorecard:

- All new fields from §6 (inline-editable)
- HQ Score display with breakdown (base TWF + gap + margin + AOV)
- Marketplace presence toggles with optional seller-count note per channel
- Research Notes textarea (brand-level, separate from per-product notes)

## 10. CSV Import Extension

Extend the existing SmartScout CSV import to map new columns:

- walmartPresent — 'walmart', 'walmart present', 'on walmart'
- ebayPresent — 'ebay', 'ebay present'
- neweggPresent — 'newegg', 'newegg present'
- avgOrderValue — 'aov', 'avg order value', 'average order'
- grossMarginPct — 'margin', 'gross margin', 'margin %'

Absent columns stay null. The import preview shows new columns in the mapping step.

## 11. Routes & API Changes

| Route | Change |
| --- | --- |
| GET /api/admin/deals | Add hqScore + new fields to response |
| PATCH /api/admin/deals/\[id\] | Accept new fields; trigger hqScore recompute on save |
| GET /api/admin/deals/hq-score/\[id\] | NEW — recompute and return hqScore for one brand |
| POST /api/admin/deals/import | Extended column mapping (§10) |

## 12. Schema Migration

Add to `BrandProspect` in `prisma/schema.prisma` (Vertex Channels repo):

```
walmartPresent   Boolean?
ebayPresent      Boolean?
neweggPresent    Boolean?
avgOrderValue    Float?
mapStrictness    String?
brandTier        String?
grossMarginPct   Float?
hqScore          Float?
hqScoreAt        DateTime?
researchNotes    String?
```

Run: `prisma db push --url $DATABASE_URL`

## 13. Tech Stack (no changes)

Next.js 16 · Prisma 7.10 + Neon · Inline styles (`--vc-navy: #0A2333`, `--vc-orange: #F97316`) · Magic link admin auth · Vercel deploy

## 14. Build Order

| Step | Task | Est. Time |
| --- | --- | --- |
| 1 | Schema: add 10 new fields to BrandProspect + db push | 15 min |
| 2 | Scoring: extend lib/deals/scoring.ts with computeHqScore() | 30 min |
| 3 | API: update GET + PATCH /deals/\[id\] + new hq-score route | 30 min |
| 4 | Brand Detail: add Brand HQ section to prospect card | 1 hr |
| 5 | Library View: card grid with filter bar + sort as new default | 2 hr |
| 6 | CSV import: extend column mapping for new fields | 30 min |
| 7 | QA: score all 38 existing brands, verify HQ scores | 30 min |

**Total: 5–6 hours in a single session.**

## 15. Success Metrics

- All 38 pipeline brands have an HQ Score within 1 week of launch.
- Can answer "show me un-contacted brands, missing Walmart, score ≥80" in under 10 seconds.
- Research time per new brand drops from \~45 min to \~15 min.
- Pipeline capacity reaches 100+ brands without the list becoming unusable.
