import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ISession } from '../../session/types.js';
import { getBaseUrl, getSiteUrl } from './index.js';

vi.mock('../site/start.js', () => ({ startServer: vi.fn() }));
vi.mock('../site/template.js', () => ({ getSiteTemplate: vi.fn() }));
vi.mock('../../utils/copyStaticFiles.js', () => ({ copyStaticFiles: vi.fn() }));

function session() {
  return {
    store: { getState: () => ({}) },
    log: { info: vi.fn() },
  } as unknown as ISession;
}

afterEach(() => {
  vi.unstubAllEnvs();
  delete process.env.BASE_URL;
  delete process.env.READTHEDOCS_CANONICAL_URL;
});

describe('deployment URLs', () => {
  it('supports BASE_URL as a deployment path', () => {
    vi.stubEnv('BASE_URL', '/docs/');
    expect(getSiteUrl()).toBeUndefined();
    expect(getBaseUrl(session())).toBe('/docs');
  });

  it('uses an absolute BASE_URL as both the public URL and routing path', () => {
    vi.stubEnv('BASE_URL', 'https://example.org/docs/');
    expect(getSiteUrl()).toBe('https://example.org/docs');
    expect(getBaseUrl(session())).toBe('/docs');
  });

  it('uses Read the Docs as a fallback', () => {
    vi.stubEnv('READTHEDOCS_CANONICAL_URL', 'https://example.org/en/latest/');
    expect(getSiteUrl()).toBe('https://example.org/en/latest');
    expect(getBaseUrl(session())).toBe('/en/latest');
  });

  it.each([
    'ftp://example.org',
    'https://example.org/docs?preview=true',
    'https://example.org/docs#section',
  ])('rejects invalid public BASE_URL values: %s', (BASE_URL) => {
    vi.stubEnv('BASE_URL', BASE_URL);
    expect(() => getSiteUrl()).toThrow(/BASE_URL/);
  });
});
