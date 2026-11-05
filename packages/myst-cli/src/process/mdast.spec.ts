import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GenericParent } from 'myst-common';
import { Session } from '../session';
import { castSession } from '../session/cache';
import { selectors } from '../store/index.js';
import * as projectManifestModule from '../build/utils/projectManifest.js';
import { postProcessMdast } from './mdast';

function setupPage(mdast: GenericParent) {
  const session = new Session();
  const data = { file: 'page.md', location: '/page.md', kind: 'Article' as any, mdast };
  castSession(session).$setMdast('page.md', {
    pre: data,
    post: {
      ...data,
      sha256: '',
      frontmatter: {},
      references: { cite: { order: [], data: {} } },
      dependencies: [],
    },
  });
  vi.spyOn(selectors, 'selectCurrentProjectPath').mockReturnValue('/project');
  return session;
}

beforeEach(() => vi.restoreAllMocks());

describe('postProcessMdast', () => {
  it('does not build the project page manifest for a page without a toc', async () => {
    const session = setupPage({
      type: 'root',
      children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Some text.' }] }],
    });
    const manifest = vi.spyOn(projectManifestModule, 'manifestPagesFromProject');
    await postProcessMdast(session, { file: 'page.md', pageReferenceStates: [], site: true });
    expect(manifest).not.toHaveBeenCalled();
  });
  it('builds the project page manifest for a page with a toc', async () => {
    const session = setupPage({ type: 'root', children: [{ type: 'toc', kind: 'project' }] });
    const manifest = vi
      .spyOn(projectManifestModule, 'manifestPagesFromProject')
      .mockResolvedValue([]);
    await postProcessMdast(session, { file: 'page.md', pageReferenceStates: [], site: true });
    expect(manifest).toHaveBeenCalledOnce();
  });
});
