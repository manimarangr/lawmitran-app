/**
 * Canonical practice-area names — keep in sync with the seeded PracticeArea
 * reference data (backend/prisma/seed.ts). The lawyer search API filters with
 * exact (case-insensitive) equality, so filter values must match these names.
 */
export const PRACTICE_AREAS = [
  'Banking & Finance', 'Cheque Bounce', 'Civil Law', 'Consumer Law',
  'Corporate Law', 'Criminal Law', 'Cyber Law', 'Divorce',
  'Documentation', 'Employment Law', 'Family Law', 'Immigration',
  'Intellectual Property', 'Motor Accident Claims', 'Property Law', 'Tax Law',
];

/**
 * Map a loose value (URL param, intake payload, old links — e.g. "Property",
 * "criminal", "Motor Accident") to the canonical name ("Property Law", …).
 * Falls back to the original value when nothing matches.
 */
export function normalizePracticeArea(value?: string | null): string | undefined {
  if (!value) return undefined;
  const v = value.trim().toLowerCase();
  if (!v) return undefined;
  return (
    PRACTICE_AREAS.find((a) => a.toLowerCase() === v) ??
    PRACTICE_AREAS.find((a) => a.toLowerCase().startsWith(v)) ??
    PRACTICE_AREAS.find((a) => a.toLowerCase().includes(v) || v.includes(a.toLowerCase())) ??
    value
  );
}
