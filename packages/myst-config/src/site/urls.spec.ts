import { describe, expect, it } from 'vitest';
import { normalizeSiteUrl, resolveSiteUrls } from './urls.js';

describe('resolveSiteUrls', () => {
  it('uses SITE_URL before configuration and Read the Docs', () => {
    expect(
      resolveSiteUrls({
        url: 'https://config.example.org/guide',
        env: {
          SITE_URL: 'https://example.org/docs/',
          READTHEDOCS_CANONICAL_URL: 'https://rtd.example.org/en/latest',
        },
      }),
    ).toEqual({ siteUrl: 'https://example.org/docs', baseUrl: '/docs' });
  });

  it.each([undefined, ''])(
    'uses configuration before Read the Docs when SITE_URL is %s',
    (SITE_URL) => {
      expect(
        resolveSiteUrls({
          url: 'https://example.org/docs/',
          env: { SITE_URL, BASE_URL: '', READTHEDOCS_CANONICAL_URL: 'https://rtd.example.org/' },
        }),
      ).toEqual({ siteUrl: 'https://example.org/docs', baseUrl: '/docs' });
    },
  );

  it.each([undefined, ''])(
    'preserves the full Read the Docs URL with overrides set to %s',
    (override) => {
      expect(
        resolveSiteUrls({
          env: {
            SITE_URL: override,
            BASE_URL: override,
            READTHEDOCS_CANONICAL_URL: 'https://example.org/en/latest/',
          },
        }),
      ).toEqual({ siteUrl: 'https://example.org/en/latest', baseUrl: '/en/latest' });
    },
  );

  it('leaves request fallback to the caller', () => {
    expect(resolveSiteUrls()).toEqual({ siteUrl: undefined, baseUrl: undefined });
    expect(resolveSiteUrls({ env: { BASE_URL: '/docs///' } })).toEqual({
      siteUrl: undefined,
      baseUrl: '/docs',
    });
  });

  it('infers the base path from site.url without environment settings', () => {
    expect(resolveSiteUrls({ url: 'https://example.org/docs/' })).toEqual({
      siteUrl: 'https://example.org/docs',
      baseUrl: '/docs',
    });
  });

  it.each([
    ['https://example.org', '/docs'],
    ['https://example.org/docs', '/'],
    ['https://example.org/docs', '/other'],
  ])('rejects conflicting paths: %s and %s', (url, BASE_URL) => {
    expect(() => resolveSiteUrls({ url, env: { BASE_URL } })).toThrow(/conflicts/);
  });

  it.each([
    ['https://example.org/', '/', undefined],
    ['https://example.org/docs/', '/docs/', '/docs'],
  ])('accepts matching paths: %s and %s', (url, BASE_URL, baseUrl) => {
    expect(resolveSiteUrls({ url, env: { BASE_URL } }).baseUrl).toBe(baseUrl);
  });

  it.each(['https://example.org/docs', '//example.org/docs', '/docs?q=1', '/docs#section'])(
    'rejects invalid BASE_URL %s',
    (BASE_URL) => {
      expect(() => resolveSiteUrls({ env: { BASE_URL } })).toThrow(/BASE_URL/);
    },
  );
});

describe('normalizeSiteUrl', () => {
  it.each([
    'example.org',
    '/docs',
    'ftp://example.org',
    'https://example.org?q=1',
    'https://example.org#section',
  ])('rejects invalid site URL %s', (url) => {
    expect(() => normalizeSiteUrl(url)).toThrow();
  });
});
