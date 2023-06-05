import type { ValidationOptions } from 'simple-validators';
import type {
  Author,
  Biblio,
  Jupytext,
  KernelSpec,
  Numbering,
  PageFrontmatter,
  ProjectFrontmatter,
  SiteFrontmatter,
  Thebe,
} from './types';
import {
  fillPageFrontmatter,
  unnestKernelSpec,
  validateAuthor,
  validateBiblio,
  validateExport,
  validateJupytext,
  validateKernelSpec,
  validateNumbering,
  validatePageFrontmatter,
  validateProjectFrontmatter,
  validateSiteFrontmatterKeys,
  validateThebe,
  validateVenue,
} from './validators';

const TEST_AUTHOR: Author = {
  userId: '',
  name: 'test user',
  orcid: '0000-0000-0000-0000',
  corresponding: true,
  email: 'test@example.com',
  roles: ['Software', 'Validation'],
  affiliations: ['example university'],
  collaborations: ['example collaboration'],
  twitter: '@test',
  github: 'test',
  website: 'https://example.com',
};

const TEST_BIBLIO: Biblio = {
  volume: 'test',
  issue: 'example',
  first_page: 1,
  last_page: 2,
};

const TEST_THEBE: Thebe = {
  lite: false,
  binder: {
    url: 'https://my.binder.org/blah',
    ref: 'HEAD',
    repo: 'my-org/my-repo',
    provider: 'github' as any,
  },
  server: {
    url: 'https://my.server.org',
    token: 'legit-secret',
  },
  kernelName: 'python3',
  sessionName: 'some-path',
  disableSessionSaving: true,
  mathjaxConfig: 'TeX-AMS_CHTML-full,Safe',
  mathjaxUrl: 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/MathJax.js',
  local: {
    url: 'http://localhost:8888',
    token: 'test-secret',
    kernelName: 'python27',
    sessionName: 'another-path',
  },
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
const TEST_KERNELSPEC: KernelSpec = {
  name: 'python3',
  language: 'python',
  display_name: 'Python 3',
  argv: ['python3', '-m', 'IPython.kernel', '-f', '{connection_file}'],
  env: {
    a: 1,
    b: 'two',
  },
};
const TEST_JUPYTEXT: Jupytext = {
  formats: 'md:myst',
  text_representation: {
    extension: '.md',
    format_name: 'myst',
    format_version: '0.9',
    jupytext_version: '1.5.2',
  },
};
const TEST_SITE_FRONTMATTER: SiteFrontmatter = {
  title: 'frontmatter',
  description: 'project frontmatter',
  venue: { title: 'test' },
  authors: [{}],
  github: 'https://github.com/example',
  keywords: ['example', 'test'],
};
const TEST_PROJECT_FRONTMATTER: ProjectFrontmatter = {
  title: 'frontmatter',
  description: 'project frontmatter',
  venue: { title: 'test' },
  authors: [{}],
  date: '14 Dec 2021',
  name: 'example.md',
  doi: '10.1000/abcd/efg012',
  arxiv: 'https://arxiv.org/example',
  open_access: true,
  license: {},
  github: 'https://github.com/example',
  binder: 'https://example.com/binder',
  source: 'https://example.com/source',
  subject: '',
  biblio: {},
  oxa: '',
  numbering: {},
  math: { a: 'b' },
  keywords: ['example', 'test'],
  exports: [
    {
      format: 'pdf' as any,
      template: 'default',
      output: 'out.tex',
      a: 1,
      article: 'my-file.md',
    },
    {
      format: 'xml' as any,
      article: 'my-file.md',
      sub_articles: ['my-notebook.ipynb'],
    },
  ],
};
const TEST_PAGE_FRONTMATTER: PageFrontmatter = {
  title: 'frontmatter',
  description: 'page frontmatter',
  venue: { title: 'test' },
  authors: [{}],
  name: 'example.md',
  doi: '10.1000/abcd/efg012',
  arxiv: 'https://arxiv.org/example',
  open_access: true,
  license: {},
  github: 'https://github.com/example',
  binder: 'https://example.com/binder',
  source: 'https://example.com/source',
  subject: '',
  biblio: {},
  oxa: '',
  numbering: {},
  math: { a: 'b' },
  subtitle: 'sub',
  short_title: 'short',
  date: '14 Dec 2021',
  kernelspec: {},
  jupytext: {},
  keywords: ['example', 'test'],
  exports: [{ format: 'pdf' as any, template: 'default', output: 'out.tex', a: 1 }],
  thebe: false,
};

let opts: ValidationOptions;

beforeEach(() => {
  opts = { property: 'test', messages: {} };
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
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('invalid email errors', async () => {
    expect(validateAuthor({ email: 'https://example.com' }, opts)).toEqual({});
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('unknown roles warn', async () => {
    expect(validateAuthor({ roles: ['example'] }, opts)).toEqual({ roles: ['example'] });
    expect(opts.messages.warnings?.length).toEqual(1);
  });
  it('invalid roles errors', async () => {
    expect(validateAuthor({ roles: [1] }, opts)).toEqual({ roles: [] });
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('corresponding with no email errors', async () => {
    expect(validateAuthor({ corresponding: true }, opts)).toEqual({ corresponding: false });
    expect(opts.messages.errors?.length).toEqual(1);
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

describe('validateThebe', () => {
  it('empty object returns self', async () => {
    expect(validateThebe({}, opts)).toEqual({});
  });
  it('extra keys removed', async () => {
    expect(validateThebe({ extra: '' }, opts)).toEqual({});
  });
  it('full object returns self', async () => {
    expect(validateThebe(TEST_THEBE, opts)).toEqual(TEST_THEBE);
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

describe('validateKernelSpec', () => {
  it('empty object returns self', async () => {
    expect(validateKernelSpec({}, opts)).toEqual({});
  });
  it('extra keys removed', async () => {
    expect(validateKernelSpec({ extra: '' }, opts)).toEqual({});
  });
  it('full object returns self', async () => {
    expect(validateKernelSpec(TEST_KERNELSPEC, opts)).toEqual(TEST_KERNELSPEC);
  });
});

describe('validateJupytext', () => {
  it('empty object returns self', async () => {
    expect(validateJupytext({}, opts)).toEqual({});
  });
  it('extra keys removed', async () => {
    expect(validateJupytext({ extra: '' }, opts)).toEqual({});
  });
  it('full object returns self', async () => {
    expect(validateJupytext(TEST_JUPYTEXT, opts)).toEqual(TEST_JUPYTEXT);
  });
});

describe('validateExport', () => {
  it('empty object errors', async () => {
    expect(validateExport({}, opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('format only passes', async () => {
    expect(validateExport({ format: 'pdf' }, opts)).toEqual({ format: 'pdf' });
  });
  it('pdf+tex passes', async () => {
    expect(validateExport({ format: 'pdf+tex' }, opts)).toEqual({ format: 'pdf+tex' });
  });
  it('tex+pdf passes', async () => {
    expect(validateExport({ format: 'tex+pdf' }, opts)).toEqual({ format: 'pdf+tex' });
  });
  it('invalid format errors passes', async () => {
    expect(validateExport({ format: 'str' }, opts)).toEqual(undefined);
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('invalid template errors', async () => {
    expect(validateExport({ format: 'pdf', template: true }, opts)).toEqual({ format: 'pdf' });
  });
  it('invalid output errors', async () => {
    expect(validateExport({ format: 'pdf', output: true }, opts)).toEqual({ format: 'pdf' });
  });
  it('full object returns self', async () => {
    expect(
      validateExport({ format: 'pdf', template: 'default', output: 'main.tex' }, opts),
    ).toEqual({ format: 'pdf', template: 'default', output: 'main.tex' });
  });
  it('extra keys are maintained', async () => {
    expect(
      validateExport({ format: 'pdf', template: 'default', output: 'main.tex', a: 1 }, opts),
    ).toEqual({ format: 'pdf', template: 'default', output: 'main.tex', a: 1 });
  });
});

describe('validateSiteFrontmatter', () => {
  it('empty object returns self', async () => {
    expect(validateSiteFrontmatterKeys({}, opts)).toEqual({});
  });
  it('full object returns self', async () => {
    expect(validateSiteFrontmatterKeys(TEST_SITE_FRONTMATTER, opts)).toEqual(TEST_SITE_FRONTMATTER);
  });
  it('full object returns valid object', async () => {
    expect(
      validateSiteFrontmatterKeys(
        { title: 'frontmatter', description: 'site frontmatter', venue: 'test', extra: '' },
        opts,
      ),
    ).toEqual({ title: 'frontmatter', description: 'site frontmatter', venue: { title: 'test' } });
  });
});

describe('validateProjectFrontmatter', () => {
  it('invalid type errors', async () => {
    expect(validateProjectFrontmatter('frontmatter', opts)).toEqual({});
    expect(opts.messages.errors?.length).toEqual(1);
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
    expect(opts.messages.errors?.length).toBeFalsy();
  });
  it('invalid doi errors', async () => {
    expect(validateProjectFrontmatter({ doi: '' }, opts)).toEqual({});
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('github username/repo coerces', async () => {
    expect(validateProjectFrontmatter({ github: 'example/repo' }, opts)).toEqual({
      github: 'https://github.com/example/repo',
    });
  });
  it('invalid github errors', async () => {
    expect(validateProjectFrontmatter({ github: 'https://example.com' }, opts)).toEqual({});
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('invalid arxiv errors', async () => {
    expect(validateProjectFrontmatter({ arxiv: 'https://example.com' }, opts)).toEqual({});
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('invalid math errors', async () => {
    expect(validateProjectFrontmatter({ math: { a: 'valid', b: 0 } }, opts)).toEqual({
      math: { a: 'valid' },
    });
    expect(opts.messages.errors?.length).toEqual(1);
  });
});

describe('validatePageFrontmatter', () => {
  it('invalid type errors', async () => {
    expect(validatePageFrontmatter('frontmatter', opts)).toEqual({});
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('empty object returns self', async () => {
    expect(validatePageFrontmatter({}, opts)).toEqual({});
  });
  it('full object returns self', async () => {
    expect(validatePageFrontmatter(TEST_PAGE_FRONTMATTER, opts)).toEqual(TEST_PAGE_FRONTMATTER);
  });
  it('invalid date errors', async () => {
    expect(validatePageFrontmatter({ date: 'https://example.com' }, opts)).toEqual({});
    expect(opts.messages.errors?.length).toEqual(1);
  });
  it('valid kernelspec returns self', async () => {
    expect(validatePageFrontmatter({ kernelspec: TEST_KERNELSPEC }, opts)).toEqual({
      kernelspec: TEST_KERNELSPEC,
    });
  });
  it('valid jupyter.kernelspec returns kernelspec', async () => {
    const frontmatter = {
      jupyter: { kernelspec: TEST_KERNELSPEC },
    };
    unnestKernelSpec(frontmatter);
    expect(validatePageFrontmatter(frontmatter, opts)).toEqual({
      kernelspec: TEST_KERNELSPEC,
    });
    expect(opts.messages.warnings).toEqual(undefined);
  });
  it('valid jupyter.kernelspec with extra key wawrns', async () => {
    const frontmatter = {
      jupyter: { kernelspec: TEST_KERNELSPEC, extra: true },
    };
    unnestKernelSpec(frontmatter);
    expect(validatePageFrontmatter(frontmatter, opts)).toEqual({
      kernelspec: TEST_KERNELSPEC,
    });
    expect(opts.messages.warnings?.length).toEqual(1);
  });
});

describe('fillPageFrontmatter', () => {
  it('empty frontmatters return empty', async () => {
    expect(fillPageFrontmatter({}, {})).toEqual({});
  });
  it('page frontmatter returns self', async () => {
    expect(fillPageFrontmatter(TEST_PAGE_FRONTMATTER, {})).toEqual(TEST_PAGE_FRONTMATTER);
  });
  it('project frontmatter returns self without title/description/name/etc', async () => {
    const result = { ...TEST_PROJECT_FRONTMATTER };
    delete result.title;
    delete result.description;
    delete result.name;
    delete result.oxa;
    delete result.exports;
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
