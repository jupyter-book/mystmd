import { describe, expect, it } from 'vitest';
import { Session } from '../session/session';
import { castSession } from '../session/cache';
import { resolveFrontmatterPartsReferences } from './resolveFrontmatterParts';

function sessionWithPart(file: string, order: string[]) {
  const session = new Session();
  castSession(session).$setMdast(file, {
    pre: { kind: 'Part', file, mdast: { type: 'root', children: [] }, location: `/${file}` },
    post: {
      kind: 'Part',
      file,
      location: `/${file}`,
      sha256: 'abc',
      frontmatter: {},
      mdast: { type: 'root', children: [] },
      references: { cite: { order, data: {} } },
      dependencies: [],
    },
  } as any);
  return session;
}

describe('resolveFrontmatterPartsReferences', () => {
  it('returns references from a frontmatter part file', () => {
    const session = sessionWithPart('abstract.md', ['inabstract2021']);
    const result = resolveFrontmatterPartsReferences(session, {
      parts: { abstract: ['abstract.md'] },
    } as any);
    expect(result).toEqual([{ references: { cite: { order: ['inabstract2021'], data: {} } } }]);
  });

  it('returns an empty list when frontmatter has no parts', () => {
    const session = sessionWithPart('abstract.md', ['inabstract2021']);
    expect(resolveFrontmatterPartsReferences(session, {} as any)).toEqual([]);
  });
});
