import { BlockChild, BlockId } from './blocks/types';
import {
  projectIdToString,
  blockListToString,
  blockIdToString,
  parseGitUrl,
  ensureConsistentChildren,
} from './utils';
import { ProjectId } from './projects';

const CASES: [string, { url: string; owner: string; repo: string; provider: string }][] = [
  [
    'https://github.com/stevejpurves/seg_tutorial#branch',
    {
      url: 'https://github.com/stevejpurves/seg_tutorial.git',
      owner: 'stevejpurves',
      repo: 'seg_tutorial',
      provider: 'github',
    },
  ],
  [
    'https://github.com/stevejpurves/seg_tutorial/tree/some/file',
    {
      url: 'https://github.com/stevejpurves/seg_tutorial.git',
      owner: 'stevejpurves',
      repo: 'seg_tutorial',
      provider: 'github',
    },
  ],
  [
    'github.com/stevejpurves/seg_tutorial',
    {
      url: 'https://github.com/stevejpurves/seg_tutorial.git',
      owner: 'stevejpurves',
      repo: 'seg_tutorial',
      provider: 'github',
    },
  ],
  [
    'github.com/stevejpurves/seg_tutorial.git',
    {
      url: 'https://github.com/stevejpurves/seg_tutorial.git',
      owner: 'stevejpurves',
      repo: 'seg_tutorial',
      provider: 'github',
    },
  ],
  [
    'https://github.com/stevejpurves/seg_tutorial.git',
    {
      url: 'https://github.com/stevejpurves/seg_tutorial.git',
      owner: 'stevejpurves',
      repo: 'seg_tutorial',
      provider: 'github',
    },
  ],
  [
    'http://github.com/stevejpurves/seg_tutorial.git',
    {
      url: 'https://github.com/stevejpurves/seg_tutorial.git',
      owner: 'stevejpurves',
      repo: 'seg_tutorial',
      provider: 'github',
    },
  ],
  [
    'https://github.com/stevejpurves/seg_tutorial',
    {
      url: 'https://github.com/stevejpurves/seg_tutorial.git',
      owner: 'stevejpurves',
      repo: 'seg_tutorial',
      provider: 'github',
    },
  ],
  [
    'https://github.com/stevejpurves/seg_tutorial/folder/file.ts',
    {
      url: 'https://github.com/stevejpurves/seg_tutorial.git',
      owner: 'stevejpurves',
      repo: 'seg_tutorial',
      provider: 'github',
    },
  ],
  [
    'git@github.com:stevejpurves/seg_tutorial.git',
    {
      url: 'https://github.com/stevejpurves/seg_tutorial.git',
      owner: 'stevejpurves',
      repo: 'seg_tutorial',
      provider: 'github',
    },
  ],
  [
    'https://gitlab.com/stevejpurves/seg_tutorial',
    {
      url: 'https://gitlab.com/stevejpurves/seg_tutorial.git',
      owner: 'stevejpurves',
      repo: 'seg_tutorial',
      provider: 'gitlab',
    },
  ],
  [
    'git@gitlab.com:stevejpurves/seg_tutorial.git',
    {
      url: 'https://gitlab.com/stevejpurves/seg_tutorial.git',
      owner: 'stevejpurves',
      repo: 'seg_tutorial',
      provider: 'gitlab',
    },
  ],
];

describe('utils', () => {
  describe('URI mutators', () => {
    it('projectIdToString', () => {
      expect(projectIdToString('abcdef' as ProjectId)).toEqual('abcdef');
    });

    it('blockListToString', () => {
      expect(blockListToString('abcdef' as ProjectId)).toEqual('abcdef/blocks');
    });

    it('blockIdToString', () => {
      expect(blockIdToString({ project: 'a', block: 'b' } as BlockId)).toEqual('a/b');
    });
  });
  describe('converting a github url', () => {
    test.each(CASES)('%s', (input, expected) => {
      const parsed = parseGitUrl(input as string);
      expect(parsed.url).toBe(expected.url);
      expect(parsed.owner).toBe(expected.owner);
      expect(parsed.repo).toBe(expected.repo);
      expect(parsed.provider).toBe(expected.provider);
    });
  });
  describe('ensureConsistentChildren', () => {
    test('empty', () => {
      const { order, children } = ensureConsistentChildren([], {});
      expect(order).toHaveLength(0);
      expect(Object.keys(children)).toHaveLength(0);
    });
    test('orphaned id in order', () => {
      const { order, children } = ensureConsistentChildren(['orphan123', 'x'], {
        x: { id: '1', src: { block: '1', project: 'a' }, style: {} } as BlockChild,
      });
      expect(order).toHaveLength(1);
      expect(Object.keys(children)).toHaveLength(1);
      expect(children['x']).toHaveProperty('id', '1');
    });
    test('additional children in dict', () => {
      const { order, children } = ensureConsistentChildren(['x'], {
        x: { id: '1', src: { block: '1', project: 'a' }, style: {} } as BlockChild,
        y: { id: '2', src: { block: '2', project: 'b' }, style: {} } as BlockChild,
      });
      expect(order).toHaveLength(1);
      expect(Object.keys(children)).toHaveLength(1);
      expect(children['x']).toHaveProperty('id', '1');
    });
  });
});
