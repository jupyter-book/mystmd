import { BlockId } from './blocks/types';
import { projectIdToString, blockListToString, blockIdToString, parseGitUrl } from './utils';
import { ProjectId } from './projects';

const CASES: [string, { url: string; owner: string; repo: string; provider: string }][] = [
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
    test.each(CASES)('%s -> %s', (input, expected) => {
      const parsed = parseGitUrl(input as string);
      expect(parsed.url).toBe(expected.url);
      expect(parsed.owner).toBe(expected.owner);
      expect(parsed.repo).toBe(expected.repo);
      expect(parsed.provider).toBe(expected.provider);
    });
  });
});
