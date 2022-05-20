import { BlockFrontMatterProps, FrontMatterProps, ProjectFrontMatterProps } from './types';
import { extractBlockFrontMatter, extractProjectFrontMatter } from './utils';

export const TEST_PROJECT_FRONT_MATTER: ProjectFrontMatterProps = {
  authors: [],
  licenses: { content: null, code: null },
  doi: '',
  open_access: false,
  github: '',
  binder: '',
  subtitle: '',
  short_title: '',
};

export const TEST_BLOCK_FRONT_MATTER: BlockFrontMatterProps = {
  ...TEST_PROJECT_FRONT_MATTER,
  venue: { title: '', url: '' },
  biblio: {},
};

const TEST_FRONT_MATTER_OBJ = {
  authors: [],
  license: undefined, // handles undefined
  github: null,
  short_title: '',
  open_access: false, // handles falsy boolean
  'something-else': 'test', // handles non-front-matter keys
  venue: {},
  biblio: {},
};

describe('extractBlockFrontMatter', () => {
  test('should handle correct frontmatter exhausively', () => {
    const frontmatter: FrontMatterProps = {
      authors: [],
      licenses: { content: 'MIT', code: null },
      github: null,
      doi: 'doi',
      arxiv: 'arxiv',
      binder: 'binder',
      subtitle: 'subtitle',
      short_title: '',
      open_access: false,
      venue: {},
      biblio: {},
    };

    expect(extractBlockFrontMatter(frontmatter)).toEqual(frontmatter);
  });

  test('should extract block front matter properly', () => {
    const target = { ...TEST_FRONT_MATTER_OBJ };

    expect(extractBlockFrontMatter(target as any)).toEqual({
      authors: target.authors,
      open_access: target.open_access,
      short_title: target.short_title,
      venue: target.venue,
      github: null,
      biblio: target.biblio,
    });
  });
});

describe('extractProjectFrontMatter', () => {
  test('should extract project front matter properly', () => {
    const target = { ...TEST_FRONT_MATTER_OBJ };

    expect(extractProjectFrontMatter(target as any)).toEqual({
      authors: target.authors,
      open_access: target.open_access,
      short_title: target.short_title,
      github: null,
    });
  });
});
