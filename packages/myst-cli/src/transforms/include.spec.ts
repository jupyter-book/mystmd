import { describe, expect, it, beforeEach, vi } from 'vitest';
import memfs from 'memfs';
import { VFile } from 'vfile';
import { Session } from '../session';
import { parseMyst } from '../process/myst';
import { selectFileWarnings } from '../store/selectors';
import { includeFilesTransform } from './include';

vi.mock('fs', () => ({ ['default']: memfs.fs }));

beforeEach(() => memfs.vol.reset());

describe('includeFilesTransform', () => {
  it('logs errors in included files against the included file', async () => {
    const session = new Session();
    const top = '# Top\n\nSome text.\n\n:::{include} sub.md\n:::\n';
    const sub = 'Included text.\n\n:::{not-a-directive}\n:::\n';
    memfs.vol.fromJSON({ '/project/top.md': top, '/project/sub.md': sub });
    const vfile = new VFile();
    vfile.path = '/project/top.md';
    const mdast = parseMyst(session, top, '/project/top.md');
    await includeFilesTransform(session, '/project/top.md', mdast, {}, vfile);
    const state = session.store.getState();
    expect(selectFileWarnings(state, '/project/top.md')).toBeUndefined();
    expect(
      selectFileWarnings(state, '/project/sub.md')?.map(({ message, position }) => [
        message,
        position?.start.line,
      ]),
    ).toEqual([['unknown directive: not-a-directive', 3]]);
  });
});
