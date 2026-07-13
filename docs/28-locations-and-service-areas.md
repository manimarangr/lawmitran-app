# 28 — Office Locations & Service Areas

A lawyer's **identity**, **physical presence**, and **lead-serving territory** are three different
things. This doc separates them so a Gurgaon lawyer who serves Delhi and Noida stops being
invisible in two-thirds of their market.

## Business rules

1. A lawyer has **one primary Bar Council enrollment** used for verification. Verification is
   identity-based and never touches geography — the existing flow is unchanged.
2. A lawyer can have **unlimited office locations** (label, address, pincode, city, coordinates).
   Exactly one is the **primary office**; the last remaining office can never be deleted.
3. A lawyer can select **multiple service areas** — reference cities where they accept leads.
   Free-text areas are not allowed; service areas always point at the seeded `City` table.
4. **Service-area entitlement is plan-driven** (`SubscriptionPlanPrice.maxServiceAreas`,
   admin-configurable per plan; `NULL` = unlimited). Intended defaults: **Basic = 3**,
   **Premium = unlimited (NULL)**. This is both an anti-spam control and the Premium upsell:
   "serve every city you practise in" is a paid capability.
5. Service areas are independent of offices, but **never empty**: onboarding auto-creates one
   service area (and one primary office) from the lawyer's chosen city.
6. **Search matches active service areas only** — not office locations, not the profile city.
   A lawyer appears in the results of every city they actively serve. (Safe because the backfill
   guarantees every lawyer has a service area equal to their profile city.)
7. **Map pins show offices** (things with coordinates); the result list shows service-area matches.
   The two intentionally answer different questions: "who is near me" vs "who serves me".
8. **No duplicate lawyer records, ever.** `Lawyer` is a strict 1:1 extension of `User`
   (`userId @unique`); offices and service areas are child rows of that single record, and the
   service-area primary key `(lawyerId, cityId)` makes the same city unrepeatable.
9. Lead flow note: leads are client-initiated to a specific lawyer, so "routing" today equals
   search visibility. If broadcast routing is added later, it must filter on active service areas.

## Acceptance criteria

| # | Criterion | Status |
|---|---|---|
| 1 | Existing lawyers continue to function after migration | ✅ Backfill created 1 primary office + 1 active service area per lawyer |
| 2 | Unlimited office locations | ✅ No cap; only last-office / primary-office guards |
| 3 | Service areas unlimited **per plan entitlement** | ✅ Mechanism live; set Premium cap to blank (NULL) in `/admin/plans` |
| 4 | Search uses service areas instead of office locations | ⏳ Currently `profile city OR service area`; switch to service-area-only pending (see below) |
| 5 | No duplicate lawyer records | ✅ `userId @unique` + composite PK `(lawyerId, cityId)` |
| 6 | Schema, APIs, forms, validation, admin pages updated | ⏳ Core done; onboarding map-pin fields + admin visibility pending |
| 7 | Follows existing architecture & conventions | ✅ Same module/guard/DTO/pagination patterns |

## Data model

```prisma
model LawyerOffice {
  id          String  @id @default(uuid())
  lawyerId    String
  lawyer      Lawyer  @relation(...)
  label       String?   // "Main office", "High Court chamber"
  addressLine String?
  pincode     String?   // PLANNED — Indian local search + SEO
  landmark    String?   // PLANNED — optional, common in Indian addresses
  cityId      String
  city        City    @relation(...)
  latitude    Float?
  longitude   Float?
  isPrimary   Boolean @default(false)
}

model LawyerServiceArea {
  lawyerId String
  cityId   String
  active   Boolean @default(true)
  @@id([lawyerId, cityId])
}
```

`Lawyer.cityId` / `latitude` / `longitude` remain as the denormalized **primary** city/coords
(kept in sync with the primary office) so profiles, SEO pages, and markers keep working.

## Onboarding field spec ("Practice & review" step — per sample-ui)

| Field | Maps to | Required | Notes |
|---|---|---|---|
| Practice areas (chips) | `LawyerPracticeArea[]` | yes | From seeded `PracticeArea` list |
| City (autocomplete) | `Lawyer.cityId` + auto office + auto service area | yes | Seeded `City` table only |
| Languages | `Lawyer.languages` | no | Comma list |
| Short bio | `Lawyer.bio` | no | |
| Office address search + "Locate" | `LawyerOffice.addressLine` | no | Geocodes to set the pin |
| Draggable map pin / "Use my location" | `LawyerOffice.latitude/longitude` | no | Falls back to city centroid |
| Pincode | `LawyerOffice.pincode` | no | PLANNED |

## Migration & backfill (rule: nothing breaks)

Migration `add_offices_service_areas` (applied):
1. Create both tables + `SubscriptionPlanPrice.maxServiceAreas`.
2. Backfill: for every lawyer with a `cityId`, insert one primary office (copying lat/lng) and one
   active service area for that city.
3. Search switches to the service-area join in the same release — results are identical
   post-backfill until lawyers add more areas.

## API surface

| Endpoint | Who | Purpose |
|---|---|---|
| `GET /api/lawyers/me/locations` | LAWYER | Offices + service areas + plan cap |
| `POST /api/lawyers/me/offices` | LAWYER | Add office (first one becomes primary) |
| `PATCH /api/lawyers/me/offices/:id` | LAWYER | Edit / set primary (syncs Lawyer.cityId+coords) |
| `DELETE /api/lawyers/me/offices/:id` | LAWYER | Remove (cannot remove the last office) |
| `PUT /api/lawyers/me/service-areas` | LAWYER | Replace list (validated against plan cap, ≥1) |
| `PATCH /api/subscriptions/admin/plans/:planName` | ADMIN | Sets `maxServiceAreas` (blank = unlimited) |

Public profile (`/lawyer/:slug`) exposes `offices[]` and `serviceAreas[]`.

## Pending implementation (agreed, not yet coded)

1. **Search switch**: `buildWhere` city filter → active service areas only (drop the
   `profile city OR …` half). Zero-risk post-backfill.
2. **Plan seed**: Premium `maxServiceAreas` default → `NULL` (unlimited) for new installs;
   existing DBs adjust via `/admin/plans`.

## Shipped in onboarding v2 (migration `add_office_details`)

- `LawyerOffice.pincode`, `landmark`, `photoUrls[]` (max 3, images, replace-on-upload via
  `POST /api/lawyers/me/offices/:id/photos`).
- Onboarding "Practice & work / Office address" step: **required** profile photo, courts (seeded
  reference list + `GET /api/lawyers/courts`), languages (seeded + `GET /api/lawyers/languages`),
  bio (50–1000 chars), office address + 6-digit PIN, Leaflet map pin with address search
  (Nominatim) and "Use my location"; landmark + office label optional. Required-ness is enforced
  in the DTO/form only — existing lawyers are untouched.
- Admin review page: profile photo + office address shown, popup viewer for photo/ID card, two
  new pre-checks (photo uploaded, office address + PIN set).
- `/dashboard/locations`: office form gains PIN/landmark; per-office photo upload + thumbnails.

## Phase 2 (not built yet)

- Ranking tie-breaker: office-in-city above serve-only lawyers.
- Map: one marker per office instead of one per lawyer.
- District-level service areas ("all of Bengaluru Urban district").
- Broadcast lead routing by service area.

---
**Related:** [02-business-rules.md](./02-business-rules.md) · [15-search-and-matching.md](./15-search-and-matching.md) · [24-seo-and-landing-pages.md](./24-seo-and-landing-pages.md)
