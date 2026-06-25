export function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]*>/g, '');
}

export function sanitizeValue(value: unknown): unknown {
  if (typeof value === 'string') {
    return stripHtmlTags(value);
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = sanitizeValue(val);
    }
    return result;
  }
  return value;
}
