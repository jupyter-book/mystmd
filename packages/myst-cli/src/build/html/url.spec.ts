import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ISession } from '../../session/types.js';
import { getBaseUrl, getSiteUrl } from './index.js';

vi.mock('../site/start.js', () => ({ startServer: vi.fn() }));
vi.mock('../site/template.js', () => ({ getSiteTemplate: vi.fn() }));
vi.mock('../../utils/copyStaticFiles.js', () => ({ copyStaticFiles: vi.fn() }));

vi.mock('../../store/index.js', () => ({
  selectors: { selectCurrentSiteConfig: (state: unknown) => state },
}));

function session(url?: string) {
  return {
    store: { getState: () => ({ url }) },
    log: { info: vi.fn() },
  } as unknown as ISession;
}

afterEach(() => vi.unstubAllEnvs());

describe('deployment URLs', () => {
  it('rejects a subpath BASE_URL when the site URL is at the root', () => {
    vi.stubEnv('SITE_URL', 'https://example.org/');
    vi.stubEnv('BASE_URL', '/docs');
    expect(() => getBaseUrl(session())).toThrow(/conflicts/);
    expect(() => getSiteUrl(session())).toThrow(/conflicts/);
  });

  it('allows an explicit root BASE_URL with a root site URL', () => {
    vi.stubEnv('SITE_URL', 'https://example.org/');
    vi.stubEnv('BASE_URL', '/');
    expect(getBaseUrl(session())).toBeUndefined();
  });

  it('still rejects an explicit root BASE_URL with a subpath site URL', () => {
    vi.stubEnv('SITE_URL', 'https://example.org/docs');
    vi.stubEnv('BASE_URL', '/');
    expect(() => getBaseUrl(session())).toThrow(/conflicts/);
  });

  it('ignores an empty SITE_URL and falls back to site.url', () => {
    vi.stubEnv('SITE_URL', '');
    vi.stubEnv('BASE_URL', '');
    const configured = session('https://example.org/docs');
    expect(getSiteUrl(configured)).toBe('https://example.org/docs');
    expect(getBaseUrl(configured)).toBe('/docs');
  });

  it('ignores empty overrides and preserves the Read the Docs deployment path', () => {
    vi.stubEnv('SITE_URL', '');
    vi.stubEnv('BASE_URL', '');
    vi.stubEnv('READTHEDOCS_CANONICAL_URL', 'https://example.org/en/latest/');
    expect(getSiteUrl(session())).toBe('https://example.org/en/latest');
    expect(getBaseUrl(session())).toBe('/en/latest');
  });
});
