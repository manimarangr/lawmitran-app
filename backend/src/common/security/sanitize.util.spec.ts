import { sanitizeValue, stripHtmlTags } from './sanitize.util';

describe('stripHtmlTags', () => {
  it('removes script tags', () => {
    expect(stripHtmlTags('<script>alert(1)</script>hello')).toBe(
      'alert(1)hello',
    );
  });

  it('removes arbitrary HTML tags', () => {
    expect(stripHtmlTags('<img src=x onerror=alert(1)>plain text')).toBe(
      'plain text',
    );
  });

  it('leaves plain text untouched', () => {
    expect(stripHtmlTags('Need help with a sale deed in Mumbai')).toBe(
      'Need help with a sale deed in Mumbai',
    );
  });
});

describe('sanitizeValue', () => {
  it('sanitizes strings nested in objects and arrays', () => {
    const input = {
      name: '<b>John</b>',
      tags: ['<i>urgent</i>', 'normal'],
      nested: { comment: '<script>steal()</script>ok' },
    };

    expect(sanitizeValue(input)).toEqual({
      name: 'John',
      tags: ['urgent', 'normal'],
      nested: { comment: 'steal()ok' },
    });
  });

  it('passes through non-string primitives unchanged', () => {
    expect(sanitizeValue(42)).toBe(42);
    expect(sanitizeValue(true)).toBe(true);
    expect(sanitizeValue(null)).toBeNull();
  });
});
