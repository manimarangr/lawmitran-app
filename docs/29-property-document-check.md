# 29 — Property Document Check (AI-assisted analysis + lawyer opinion)

**Positioning:** "Upload your land documents for an AI-assisted preliminary analysis. A verified
property lawyer can then review and provide a professional legal opinion."

The split is a legal requirement, not just framing: under the Advocates Act only enrolled
advocates give legal opinions. The platform's output is always a **document checklist /
preliminary scan** — never "title is clear", never "safe to buy". Client-facing name avoids the
word *verification*: it is the **Property Document Check**.

## Flow

1. Client creates a case: state + city + transaction type (flat purchase, site purchase,
   resale house, agricultural land).
2. The checklist engine (seeded per state × transaction type, admin-configurable later) lists
   the documents that matter — Sale Deed, Mother Deed, EC, Khata Certificate/Extract, RTC/Pahani,
   Patta/Chitta, Survey Sketch, Layout Approval, DC Conversion, Mutation Records, Tax Receipts,
   Building Plan Approval, OC — each with a plain-language "why it matters".
3. Client ticks what they have and/or uploads scans (MinIO/S3, `property/` prefix).
4. **Analyze** → deterministic report: PROVIDED / MISSING per item, required-vs-optional,
   completeness score, next-step guidance. Stored as `PropertyCase.reportJson`; status `ANALYZED`.
5. **Get a legal opinion** → picks a verified property lawyer in the case city → creates a
   normal `Lead` whose description embeds the case summary (present/missing lists). Case gets
   `leadId`, status `LAWYER_REVIEW`. Lawyer contacts the client directly (standard model).

## Phasing

- **P0 (shipped with this doc):** rules-based checklist + uploads + report + lead handoff.
  No AI calls — the checklist is deterministic and legally safe.
- **P1:** OCR (Indic scripts) + LLM classification of uploads ("this file looks like an EC"),
  field extraction (parties, survey no., extents, reg. no.) with confidence labels; LLM keys
  already live in Settings.
- **P2:** cross-document consistency (survey no. across Deed/EC/RTC, seller chain), EC
  gap/encumbrance parsing, red-flag rules (B-Khata, missing mutation, no DC conversion, stale
  tax receipts); fixed-price opinion product with lawyer payouts + SLA.

## Data model

`PropertyCase` (user, state, city, transactionType, status `OPEN → ANALYZED → LAWYER_REVIEW → CLOSED`,
reportJson, leadId?) · `PropertyCaseDocument` (caseId, docType key, provided flag, fileUrl?) ·
`PropertyChecklist` (state, transactionType, items JSON `{key,label,why,required}` — seeded for
Karnataka + a generic fallback; `state='ANY'` matches everywhere).

## Compliance rails

Documents carry heavy PII (deeds often embed Aadhaar): stored privately, shown to a lawyer only
via the lead the client initiates; cases/documents are included in the DPDP export and removed
on PII erasure. Every report footer: *preliminary informational scan, not legal advice or a
title opinion*. Audit separation: what the engine said (`reportJson`) is stored verbatim,
distinct from anything the lawyer later advises.

---
**Related:** [12-ai-module.md](./12-ai-module.md) · [14-lead-management.md](./14-lead-management.md) · [02-business-rules.md](./02-business-rules.md)
