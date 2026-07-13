# 27 — Awards & Recognition

Platform awards (LawRato-style "Client's Choice" badges) that verified lawyers **earn
automatically** based on measurable performance criteria. Awards build client trust on the public
profile and give lawyers a reason to respond fast and serve clients well.

Awards are **computed, never bought**: they are derived from ratings and lead activity, are scoped
to a calendar year, and cannot be self-assigned or edited by lawyers. Admins can trigger a
recomputation but do not hand-pick winners (integrity > flexibility).

## Award types & criteria

All criteria are evaluated per **calendar year** over verified (`APPROVED`) lawyers only.
Thresholds are constants in `backend/src/modules/lawyers/awards.service.ts` (env-overridable
where noted).

| Award | Key | Criteria (within the award year) |
|---|---|---|
| Client's Choice | `CLIENTS_CHOICE` | ≥ 10 ratings received in the year AND average score of those ratings ≥ 4.5 |
| Top Responder | `TOP_RESPONDER` | ≥ 20 leads moved to `CONTACTED`/`CLOSED` in the year AND ≥ 5 client-confirmed contacts (`clientConfirmedAt`) |
| Rising Star | `RISING_STAR` | Profile created in the award year AND ≥ 5 ratings in the year with average ≥ 4.0 |

Notes:

- A lawyer can earn multiple awards in the same year; each (lawyer, award, year) is unique.
- The criteria snapshot (counts/averages at computation time) is stored with each award for
  auditability (`criteriaJson`).
- Awards never expire or get revoked retroactively; a recompute only **adds** newly-qualified
  awards for the requested year (idempotent upserts).

## Computation schedule

- **Cron**: every 1 January at 02:00 server time, the previous year's awards are computed
  (`AwardsService.computeAwardsForYear`).
- **Admin trigger**: `POST /api/lawyers/admin/awards/recompute?year=YYYY` (role `ADMIN`) runs the
  same computation on demand — useful after backfills or mid-year checks (mid-year runs award
  anyone already over the thresholds).

## Data model

`LawyerAward` (Prisma): `id`, `lawyerId → Lawyer`, `type` (`CLIENTS_CHOICE | TOP_RESPONDER |
RISING_STAR`), `year`, `title` (display string, e.g. "Client's Choice"), `criteriaJson`
(snapshot), `createdAt`. Unique on `(lawyerId, type, year)`.

## Surfaces

- **Public lawyer profile** (`/lawyer/[slug]`): "Awards" card section — one card per award with
  icon, title, and year chip (visual reference: LawRato profile awards).
- Included in the public profile API response (`GET /api/lawyers/slug/:slug` → `awards[]`).
- Future (backlog): award badge chips on search result cards; "awarded lawyers" SEO landing
  filter; email/notification to the lawyer when an award is granted.

## Business rules

- Only `APPROVED` lawyers are eligible; awards of later-suspended lawyers stay in history but the
  profile is no longer public, so they are effectively hidden.
- Awards are platform recognition, **not** an endorsement of legal outcomes — the profile
  disclaimer already covers this; keep award naming neutral and performance-based.
- New award types must come with documented criteria in this file before implementation.
