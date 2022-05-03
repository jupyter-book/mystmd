import { extractBlockFrontMatter, extractProjectFrontMatter } from './utils';

const TEST_FRONT_MATTER_OBJ = {
  authors: [{ test: 'test' }],
  license: undefined, // handles undefined
  github: null, // handles undefined
  short_title: '',
  open_access: false, // handles falsy boolean
  'something-else': 'test', // handles non-front-matter keys
  venue: {},
  biblio: {},
};

describe('extractBlockFrontMatter', () => {
  test('should extract block front matter properly', () => {
    const target = { ...TEST_FRONT_MATTER_OBJ };

    expect(extractBlockFrontMatter(target as any)).toEqual({
      authors: target.authors,
      open_access: target.open_access,
      short_title: target.short_title,
      venue: target.venue,
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
    });
  });
});
