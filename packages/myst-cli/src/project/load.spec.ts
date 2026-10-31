import { describe, expect, it } from 'vitest';
import { Session } from '../session';
import { projects } from '../store/reducers';
import type { LocalProject } from './types';
import { loadProjectFromDisk } from './load';

describe('loadProjectFromDisk', () => {
  it('returns the stored project without copying it', async () => {
    const session = new Session();
    const project: LocalProject = {
      path: '/project',
      file: '/project/index.md',
      index: 'index',
      pages: [{ file: '/project/page.md', slug: 'page', level: 1 }],
      bibliography: [],
    };
    session.store.dispatch(projects.actions.receive(project));
    expect(await loadProjectFromDisk(session, '/project')).toBe(project);
  });
});
