import { basicLogger, LogLevel } from '../logging';
import { Options } from '../utils/validators';
import { Author, Biblio, Numbering, PageFrontmatter, ProjectFrontmatter } from './types';
import {
  fillPageFrontmatter,
  validateAuthor,
  validateBiblio,
  validateNumbering,
  validatePageFrontmatter,
  validateProjectFrontmatter,
  validateSiteFrontmatter,
  validateVenue,
} from './validators';

const TEST_AUTHOR: Author = {
  userId: '',
  name: 'test user',
  orcid: 'https://orcid.org/0000-0000-0000-0000',
  corresponding: true,
  email: 'test@example.com',
  roles: ['Software', 'Validation'],
  affiliations: ['example university'],
};

const TEST_BIBLIO: Biblio = {
  volume: 'test',
  issue: 'example',
  first_page: 1,
  last_page: 2,
};
const TEST_NUMBERING: Numbering = {
  enumerator: '',
  figure: true,
  equation: true,
  table: true,
  code: true,
  heading_1: true,
  heading_2: true,
  heading_3: true,
  heading_4: true,
  heading_5: true,
  heading_6: true,
};
const TEST_PROJECT_FRONTMATTER: ProjectFrontmatter = {
  title: 'frontmatter',
  description: 'site frontmatter',
  venue: { title: 'test' },
  authors: [{}],
  name: 'example.md',
  doi: '10.1000/abcd/efg012',
  arxiv: 'https://arxiv.org/example',
  open_access: true,
  licenses: {},
  github: 'https://github.com/example',
  binder: 'https://example.com/binder',
  subject: '',
  biblio: {},
  oxa: '',
  numbering: {},
  math: { a: 'b' },
};
const TEST_PAGE_FRONTMATTER: PageFrontmatter = {
  title: 'frontmatter',
  description: 'site frontmatter',
  venue: { title: 'test' },
  authors: [{}],
  name: 'example.md',
  doi: '10.1000/abcd/efg012',
  arxiv: 'https://arxiv.org/example',
  open_access: true,
  licenses: {},
  github: 'https://github.com/example',
  binder: 'https://example.com/binder',
  subject: '',
  biblio: {},
  oxa: '',
  numbering: {},
  math: { a: 'b' },
  subtitle: 'sub',
  short_title: 'short',
  date: '14 Dec 2021',
};

let opts: Options;

beforeEach(() => {
  opts = { logger: basicLogger(LogLevel.info), property: 'test', count: {} };
});

describe('validateVenue', () => {
  it('empty object returns self', async () => {
    expect(validateVenue({}, opts)).toEqual({});
  });
  it('object with title/url returns self', async () => {
    const venue = {
      title: 'test',
      url: 'http://example.com',
    };
    expect(validateVenue(venue, opts)).toEqual(venue);
  });
  it('string returns object with title', async () => {
    expect(validateVenue('test', opts)).toEqual({ title: 'test' });
  });
  it('invalid keys ignored', async () => {
    expect(validateVenue({ title: 'test', extra: '' }, opts)).toEqual({ title: 'test' });
  });
});

describe('validateAuthor', () => {
  it('empty object returns self', async () => {
    expect(validateAuthor({}, opts)).toEqual({});
  });
  it('extra keys removed', async () => {
    expect(validateAuthor({ extra: '' }, opts)).toEqual({});
  });
  it('full object returns self', async () => {
    expect(validateAuthor(TEST_AUTHOR, opts)).toEqual(TEST_AUTHOR);
  });
  it('invalid orcid errors', async () => {
    expect(validateAuthor({ orcid: 'https://exampale.com/example' }, opts)).toEqual({});
    expect(opts.count.errors).toEqual(1);
  });
  it('invalid email errors', async () => {
    expect(validateAuthor({ email: 'https://example.com' }, opts)).toEqual({});
    expect(opts.count.errors).toEqual(1);
  });
  it('invalid roles errors', async () => {
    expect(validateAuthor({ roles: ['example'] }, opts)).toEqual({ roles: [] });
    expect(opts.count.errors).toEqual(1);
  });
  it('corresponding with no email errors', async () => {
    expect(validateAuthor({ corresponding: true }, opts)).toEqual({ corresponding: false });
    expect(opts.count.errors).toEqual(1);
  });
});

describe('validateBiblio', () => {
  it('empty object returns self', async () => {
    expect(validateBiblio({}, opts)).toEqual({});
  });
  it('extra keys removed', async () => {
    expect(validateBiblio({ extra: '' }, opts)).toEqual({});
  });
  it('full object returns self', async () => {
    expect(validateBiblio(TEST_BIBLIO, opts)).toEqual(TEST_BIBLIO);
  });
});

describe('validateNumbering', () => {
  it('empty object returns self', async () => {
    expect(validateNumbering({}, opts)).toEqual({});
  });
  it('extra keys removed', async () => {
    expect(validateNumbering({ extra: '' }, opts)).toEqual({});
  });
  it('full object returns self', async () => {
    expect(validateNumbering(TEST_NUMBERING, opts)).toEqual(TEST_NUMBERING);
  });
});

describe('validateSiteFrontmatter', () => {
  it('invalid type errors', async () => {
    expect(validateSiteFrontmatter('frontmatter', opts)).toEqual({});
    expect(opts.count.errors).toEqual(1);
  });
  it('empty object returns self', async () => {
    expect(validateSiteFrontmatter({}, opts)).toEqual({});
  });
  it('full object returns valid object', async () => {
    expect(
      validateSiteFrontmatter(
        { title: 'frontmatter', description: 'site frontmatter', venue: 'test', extra: '' },
        opts,
      ),
    ).toEqual({ title: 'frontmatter', description: 'site frontmatter', venue: { title: 'test' } });
  });
});

describe('validateProjectFrontmatter', () => {
  it('invalid type errors', async () => {
    expect(validateProjectFrontmatter('frontmatter', opts)).toEqual({});
    expect(opts.count.errors).toEqual(1);
  });
  it('empty object returns self', async () => {
    expect(validateProjectFrontmatter({}, opts)).toEqual({});
  });
  it('full object returns self', async () => {
    expect(validateProjectFrontmatter(TEST_PROJECT_FRONTMATTER, opts)).toEqual(
      TEST_PROJECT_FRONTMATTER,
    );
  });
  it('boolean numbering is valid', async () => {
    expect(validateProjectFrontmatter({ numbering: 'false' }, opts)).toEqual({ numbering: false });
  });
  it('invalid doi errors', async () => {
    expect(validateProjectFrontmatter({ doi: '' }, opts)).toEqual({});
    expect(opts.count.errors).toEqual(1);
  });
  it('github username/repo coerces', async () => {
    expect(validateProjectFrontmatter({ github: 'example/repo' }, opts)).toEqual({
      github: 'https://github.com/example/repo',
    });
  });
  it('invalid github errors', async () => {
    expect(validateProjectFrontmatter({ github: 'https://example.com' }, opts)).toEqual({});
    expect(opts.count.errors).toEqual(1);
  });
  it('invalid arxiv errors', async () => {
    expect(validateProjectFrontmatter({ arxiv: 'https://example.com' }, opts)).toEqual({});
    expect(opts.count.errors).toEqual(1);
  });
  it('invalid math errors', async () => {
    expect(validateProjectFrontmatter({ math: { a: 'valid', b: 0 } }, opts)).toEqual({
      math: { a: 'valid' },
    });
    expect(opts.count.errors).toEqual(1);
  });
});

describe('validatePageFrontmatter', () => {
  it('invalid type errors', async () => {
    expect(validatePageFrontmatter('frontmatter', opts)).toEqual({});
    expect(opts.count.errors).toEqual(1);
  });
  it('empty object returns self', async () => {
    expect(validatePageFrontmatter({}, opts)).toEqual({});
  });
  it('full object returns self', async () => {
    expect(validatePageFrontmatter(TEST_PAGE_FRONTMATTER, opts)).toEqual(TEST_PAGE_FRONTMATTER);
  });
  it('invalid date errors', async () => {
    expect(validatePageFrontmatter({ date: 'https://example.com' }, opts)).toEqual({});
    expect(opts.count.errors).toEqual(1);
  });
});

describe('fillPageFrontmatter', () => {
  it('empty frontmatters return empty', async () => {
    expect(fillPageFrontmatter({}, {})).toEqual({});
  });
  it('page frontmatter returns self', async () => {
    expect(fillPageFrontmatter(TEST_PAGE_FRONTMATTER, {})).toEqual(TEST_PAGE_FRONTMATTER);
  });
  it('project frontmatter returns self without title/description/name', async () => {
    const result = { ...TEST_PROJECT_FRONTMATTER };
    delete result.title;
    delete result.description;
    delete result.name;
    delete result.oxa;
    expect(fillPageFrontmatter({}, TEST_PROJECT_FRONTMATTER)).toEqual(result);
  });
  it('page and project math are combined', async () => {
    expect(fillPageFrontmatter({ math: { a: 'macro a' } }, { math: { b: 'macro b' } })).toEqual({
      math: { a: 'macro a', b: 'macro b' },
    });
  });
  it('page and project numbering are combined', async () => {
    expect(
      fillPageFrontmatter(
        { numbering: { enumerator: '#', heading_5: true, heading_6: true } },
        { numbering: { enumerator: '$', heading_1: true, heading_6: false } },
      ),
    ).toEqual({
      numbering: { enumerator: '#', heading_1: true, heading_5: true, heading_6: true },
    });
  });
});
