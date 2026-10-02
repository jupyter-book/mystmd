import { describe, expect, it } from 'vitest';
import { join } from 'node:path';
import picomatch from 'picomatch';
import type { ProjectConfig } from 'myst-config';
import { findErrorRule, normalizeFilePath } from './addWarningForFile.js';

/**
 * Test the pattern matching logic used in error rules.
 * This mirrors the keyMatchesPattern function in addWarningForFile.ts
 */
function keyMatchesPattern(key: string | null | undefined, pattern: string): boolean {
  if (!key) return false;

  // First try exact match (fastest)
  if (key === pattern) return true;

  // Check if pattern contains wildcards or special characters
  const hasWildcard = /[*?{}[\]]/.test(pattern);
  if (!hasWildcard) {
    // No wildcards, only exact match is possible
    return false;
  }

  try {
    // Use picomatch for glob pattern matching
    const isMatch = picomatch(pattern, { nocase: false, dot: true });
    return isMatch(key);
  } catch (error) {
    // If pattern is invalid, fall back to exact match
    return false;
  }
}

describe('keyMatchesPattern', () => {
  describe('exact matches', () => {
    it('matches exact URL', () => {
      expect(keyMatchesPattern('https://example.com/page', 'https://example.com/page')).toBe(true);
    });

    it('does not match different URL', () => {
      expect(keyMatchesPattern('https://example.com/other', 'https://example.com/page')).toBe(
        false,
      );
    });

    it('handles null key', () => {
      expect(keyMatchesPattern(null, 'https://example.com')).toBe(false);
    });

    it('handles undefined key', () => {
      expect(keyMatchesPattern(undefined, 'https://example.com')).toBe(false);
    });
  });

  describe('glob patterns', () => {
    it('matches wildcard at end of path', () => {
      expect(keyMatchesPattern('https://example.com/page', 'https://example.com/*')).toBe(true);
      expect(keyMatchesPattern('https://example.com/other', 'https://example.com/*')).toBe(true);
    });

    it('matches wildcard in domain', () => {
      expect(keyMatchesPattern('https://www.example.com/page', 'https://*.example.com/*')).toBe(
        true,
      );
      expect(keyMatchesPattern('https://blog.example.com/page', 'https://*.example.com/*')).toBe(
        true,
      );
    });

    it('matches double wildcard for nested paths', () => {
      expect(keyMatchesPattern('https://example.com/a/b/c', 'https://example.com/**')).toBe(true);
      expect(
        keyMatchesPattern('https://example.com/deep/nested/path', 'https://example.com/**'),
      ).toBe(true);
    });

    it('matches wildcard in middle of URL', () => {
      expect(
        keyMatchesPattern('https://example.com/api/v1/users', 'https://example.com/*/v1/*'),
      ).toBe(true);
    });

    it('matches question mark for single character', () => {
      expect(keyMatchesPattern('https://example.com/page1', 'https://example.com/page?')).toBe(
        true,
      );
      expect(keyMatchesPattern('https://example.com/page2', 'https://example.com/page?')).toBe(
        true,
      );
      expect(keyMatchesPattern('https://example.com/page12', 'https://example.com/page?')).toBe(
        false,
      );
    });

    it('does not match when pattern does not match', () => {
      expect(keyMatchesPattern('https://different.com/page', 'https://example.com/*')).toBe(false);
    });
  });

  describe('real-world use cases', () => {
    it('matches example.org URLs', () => {
      const pattern = 'https://example.org/**';
      expect(keyMatchesPattern('https://example.org/page', pattern)).toBe(true);
      expect(keyMatchesPattern('https://example.org/another-page', pattern)).toBe(true);
      expect(keyMatchesPattern('https://example.org/', pattern)).toBe(true);
      expect(keyMatchesPattern('https://example.com/', pattern)).toBe(false);
    });

    it('matches all example.* TLDs', () => {
      const pattern = 'https://example.*/*';
      expect(keyMatchesPattern('https://example.com/page', pattern)).toBe(true);
      expect(keyMatchesPattern('https://example.org/page', pattern)).toBe(true);
      expect(keyMatchesPattern('https://example.net/page', pattern)).toBe(true);
    });

    it('matches subdomain patterns', () => {
      const pattern = 'https://*.example.com/**';
      expect(keyMatchesPattern('https://www.example.com/page', pattern)).toBe(true);
      expect(keyMatchesPattern('https://blog.example.com/post', pattern)).toBe(true);
      expect(keyMatchesPattern('https://api.example.com/v1/users', pattern)).toBe(true);
    });

    it('matches http or https with pattern', () => {
      const httpPattern = 'http://example.com/*';
      const httpsPattern = 'https://example.com/*';

      expect(keyMatchesPattern('http://example.com/page', httpPattern)).toBe(true);
      expect(keyMatchesPattern('https://example.com/page', httpsPattern)).toBe(true);
      expect(keyMatchesPattern('https://example.com/page', httpPattern)).toBe(false);
    });

    it('matches CI bot blocked domains', () => {
      const patterns = [
        'https://example.org/**',
        'https://example.com/**',
        'https://*.example.net/**',
      ];

      const urls = [
        'https://example.org/test',
        'https://example.com/page',
        'https://subdomain.example.net/path',
      ];

      urls.forEach((url, i) => {
        expect(keyMatchesPattern(url, patterns[i])).toBe(true);
      });
    });
  });

  describe('edge cases', () => {
    it('handles pattern without wildcards as exact match', () => {
      expect(keyMatchesPattern('https://example.com', 'https://example.com')).toBe(true);
      expect(keyMatchesPattern('https://example.com/', 'https://example.com')).toBe(false);
    });

    it('handles complex patterns', () => {
      const pattern = 'https://{www,blog}.example.com/*';
      // picomatch supports brace expansion
      expect(keyMatchesPattern('https://www.example.com/page', pattern)).toBe(true);
      expect(keyMatchesPattern('https://blog.example.com/post', pattern)).toBe(true);
      expect(keyMatchesPattern('https://api.example.com/page', pattern)).toBe(false);
    });

    it('handles invalid patterns gracefully', () => {
      // Even with invalid patterns, should not throw
      expect(() => keyMatchesPattern('https://example.com', '[')).not.toThrow();
    });
  });
});

type ErrorRule = NonNullable<ProjectConfig['error_rules']>[number];

describe('findErrorRule', () => {
  const rule = (r: Partial<ErrorRule>): ErrorRule => ({
    id: 'link-resolves',
    severity: 'ignore',
    ...r,
  });

  it('matches by id only', () => {
    expect(findErrorRule([rule({})], 'link-resolves')?.severity).toBe('ignore');
    expect(findErrorRule([rule({})], 'other')).toBeUndefined();
  });
  it('matches by path glob, relative to the current directory', () => {
    const rules = [rule({ path: 'meeting-notes/**/*' })];
    expect(findErrorRule(rules, 'link-resolves', null, 'meeting-notes/a/b.md')).toBeDefined();
    expect(findErrorRule(rules, 'link-resolves', null, 'other/b.md')).toBeUndefined();
    expect(
      findErrorRule(rules, 'link-resolves', null, join(process.cwd(), 'meeting-notes/b.md')),
    ).toBeDefined();
  });
  it('a rule with a path never matches a message without a file', () => {
    expect(findErrorRule([rule({ path: '**' })], 'link-resolves', 'k', null)).toBeUndefined();
  });
  it('empty key/path patterns do not turn a rule into an unrestricted match', () => {
    expect(findErrorRule([rule({ path: '' })], 'link-resolves', null, null)).toBeUndefined();
    expect(findErrorRule([rule({ path: '' })], 'link-resolves', null, 'a.md')).toBeUndefined();
    expect(findErrorRule([rule({ key: '' })], 'link-resolves', 'https://a.org')).toBeUndefined();
  });
  it('requires both key and path to match', () => {
    const rules = [rule({ key: 'https://a.org/**', path: 'notes/**' })];
    expect(findErrorRule(rules, 'link-resolves', 'https://a.org/x', 'notes/a.md')).toBeDefined();
    expect(findErrorRule(rules, 'link-resolves', 'https://b.org/x', 'notes/a.md')).toBeUndefined();
    expect(findErrorRule(rules, 'link-resolves', 'https://a.org/x', 'docs/a.md')).toBeUndefined();
  });
  it('first matching rule wins', () => {
    const rules = [
      rule({ path: 'notes/**', severity: 'ignore' }),
      rule({ key: 'https://github.com/**', severity: 'warn' }),
      rule({ severity: 'error' }),
    ];
    expect(
      findErrorRule(rules, 'link-resolves', 'https://github.com/x', 'notes/a.md')?.severity,
    ).toBe('ignore');
    expect(findErrorRule(rules, 'link-resolves', 'https://github.com/x', 'a.md')?.severity).toBe(
      'warn',
    );
    expect(findErrorRule(rules, 'link-resolves', 'https://x.org', 'a.md')?.severity).toBe('error');
  });
});

describe('normalizeFilePath', () => {
  it('returns a posix path relative to cwd and leaves URLs alone', () => {
    expect(normalizeFilePath('a/b.md')).toBe('a/b.md');
    expect(normalizeFilePath(join(process.cwd(), 'a', 'b.md'))).toBe('a/b.md');
    expect(normalizeFilePath('https://example.org/x.png')).toBe('https://example.org/x.png');
    expect(normalizeFilePath(null)).toBeUndefined();
  });
});
