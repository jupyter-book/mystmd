import { describe, expect, it } from 'vitest';
import { Session } from '../session/session';
import { castSession } from '../session/cache';
import { resolveFrontmatterPartsReferences } from './resolveFrontmatterParts';

function sessionWithPart(file: string, order: string[], session = new Session()) {
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

  it('ignores parts with multiple files, matching resolveFrontmatterParts', () => {
    const session = sessionWithPart(
      'appendix-b.md',
      ['inb2021'],
      sessionWithPart('appendix-a.md', ['ina2021']),
    );
    // resolveFrontmatterParts does not render these, so their citations must not
    // be harvested either - the bibliography follows what is rendered.
    expect(
      resolveFrontmatterPartsReferences(session, {
        parts: { appendix: ['appendix-a.md', 'appendix-b.md'] },
      } as any),
    ).toEqual([]);
  });
});
