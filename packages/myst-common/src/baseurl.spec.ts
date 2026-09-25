import { describe, expect, it } from 'vitest';
import { resolveBaseUrl } from './baseurl.js';

describe('resolveBaseUrl', () => {
  it('keeps a path-only deployment prefix', () => {
    expect(resolveBaseUrl('/docs/')).toEqual({ pathname: '/docs' });
  });

  it('derives a deployment prefix from an absolute public URL', () => {
    expect(resolveBaseUrl('https://example.org/docs/')).toEqual({
      pathname: '/docs',
      publicUrl: 'https://example.org/docs',
    });
  });

  it('normalizes a root public URL', () => {
    expect(resolveBaseUrl('https://example.org/')).toEqual({
      pathname: undefined,
      publicUrl: 'https://example.org',
    });
  });

  it.each([
    'ftp://example.org',
    'https://example.org/docs?preview=true',
    'https://example.org/docs#section',
  ])('rejects invalid public URLs: %s', (value) => {
    expect(() => resolveBaseUrl(value)).toThrow(/BASE_URL/);
  });
});
