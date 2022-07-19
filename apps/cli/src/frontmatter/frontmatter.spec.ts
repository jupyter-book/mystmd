import { Block, CitationStyles, KINDS, Project, ProjectVisibility } from '@curvenote/blocks';
import { prepareToWrite, unnestKernelSpec } from '.';
import { silentLogger } from '../logging';
import { Session } from '../session';
import { Options } from '../utils/validators';
import { pageFrontmatterFromDTO, projectFrontmatterFromDTO, saveAffiliations } from './api';
import {
  Author,
  Biblio,
  Jupytext,
  KernelSpec,
  Numbering,
  PageFrontmatter,
  ProjectFrontmatter,
} from './types';
import {
  fillPageFrontmatter,
  validateAuthor,
  validateBiblio,
  validateJupytext,
  validateKernelSpec,
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
const TEST_PROJECT_FRONTMATTER: ProjectFrontmatter = {
  title: 'frontmatter',
  description: 'site frontmatter',
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
  license: {},
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
  kernelspec: {},
  jupytext: {},
};

const TEST_PROJECT: Project = {
  id: 'id',
  date_created: new Date(),
  date_modified: new Date(),
  created_by: '',
  team: 'team',
  name: 'name',
  title: 'title',
  description: 'description',
  visibility: ProjectVisibility.public,
  affiliations: [],
  settings: {
    citation_style: CitationStyles.harvard,
    reference_labels: {
      fig: 'Figure %s',
      eq: 'Equation %s',
      sec: 'Section %s',
      table: 'Table %s',
      code: 'Program %s',
    },
  },
  links: {
    access: '',
    blocks: '',
    team: '',
    site: '',
    self: '',
  },
};

let opts: Options;

beforeEach(() => {
  opts = { logger: silentLogger(), property: 'test', count: {} };
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
    expect(opts.count.errors).toBeFalsy();
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
    expect(opts.count.warnings).toEqual(undefined);
  });
  it('valid jupyter.kernelspec with extra key wawrns', async () => {
    const frontmatter = {
      jupyter: { kernelspec: TEST_KERNELSPEC, extra: true },
    };
    unnestKernelSpec(frontmatter);
    expect(validatePageFrontmatter(frontmatter, opts)).toEqual({
      kernelspec: TEST_KERNELSPEC,
    });
    expect(opts.count.warnings).toEqual(1);
  });
});

describe('fillPageFrontmatter', () => {
  it('empty frontmatters return empty', async () => {
    expect(fillPageFrontmatter({}, {}, {})).toEqual({});
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
  it('site venue added', async () => {
    expect(fillPageFrontmatter({}, {}, { venue: { title: 'my venue' } })).toEqual({
      venue: { title: 'my venue' },
    });
  });
});

describe('projectFrontmatterFromDTO', () => {
  const frontmatter: ProjectFrontmatter = {
    name: 'name',
    title: 'title',
    description: 'description',
  };
  it('minimal object returns self', async () => {
    expect(projectFrontmatterFromDTO(new Session(), TEST_PROJECT)).toEqual(frontmatter);
  });
  it('licenses coerces to license', async () => {
    expect(
      projectFrontmatterFromDTO(new Session(), {
        ...TEST_PROJECT,
        licenses: {
          content: 'CC-BY-SA-4.0',
          code: 'MIT',
        },
      }),
    ).toEqual({
      ...frontmatter,
      license: {
        content: {
          title: 'Creative Commons Attribution Share Alike 4.0 International',
          id: 'CC-BY-SA-4.0',
          CC: true,
          free: true,
          url: 'https://creativecommons.org/licenses/by-sa/4.0/',
        },
        code: {
          title: 'MIT License',
          id: 'MIT',
          free: true,
          osi: true,
          url: 'https://opensource.org/licenses/MIT',
        },
      },
    });
  });
  it('affiliations populate correctly', async () => {
    const session = new Session();
    const projectWithAffiliations = {
      ...TEST_PROJECT,
      authors: [
        {
          userId: 'abc',
          email: 'test@example.com',
          corresponding: true,
          name: 'Test 0',
          orcid: '0000-0000-0000-0000',
          id: 'abc',
          roles: ['Conceptualization', 'Investigation', 'Methodology', 'Writing – original draft'],
          affiliations: ['a0', 'a1'],
        },
        {
          affiliations: ['a0', 'a2'],
          id: 'def',
          userId: 'def',
          email: null,
          corresponding: false,
          roles: ['Writing – review & editing', 'Validation'],
          orcid: '0000-0000-0000-0001',
          name: 'Test 1',
        },
      ],
      affiliations: [
        {
          id: 'a0',
          text: 'example university',
        },
        {
          id: 'a1',
          text: 'example company',
        },
        {
          id: 'a2',
          text: 'example group',
        },
      ],
    };
    saveAffiliations(session, projectWithAffiliations);
    expect(projectFrontmatterFromDTO(session, projectWithAffiliations)).toEqual({
      ...frontmatter,
      authors: [
        {
          userId: 'abc',
          email: 'test@example.com',
          corresponding: true,
          name: 'Test 0',
          orcid: '0000-0000-0000-0000',
          roles: ['Conceptualization', 'Investigation', 'Methodology', 'Writing – original draft'],
          affiliations: ['example university', 'example company'],
        },
        {
          affiliations: ['example university', 'example group'],
          userId: 'def',
          corresponding: false,
          roles: ['Writing – review & editing', 'Validation'],
          orcid: '0000-0000-0000-0001',
          name: 'Test 1',
        },
      ],
    });
  });
  it('unknown affiliations filter', async () => {
    const session = new Session();
    const projectWithAffiliations = {
      ...TEST_PROJECT,
      authors: [
        {
          userId: 'abc',
          email: 'test@example.com',
          corresponding: true,
          name: 'Test 0',
          orcid: '0000-0000-0000-0000',
          id: 'abc',
          roles: ['Conceptualization', 'Investigation', 'Methodology', 'Writing – original draft'],
          affiliations: ['a0', 'a1'],
        },
        {
          affiliations: ['a0', 'a2'],
          id: 'def',
          userId: 'def',
          email: null,
          corresponding: false,
          roles: ['Writing – review & editing', 'Validation'],
          orcid: '0000-0000-0000-0001',
          name: 'Test 1',
        },
      ],
      affiliations: [
        {
          id: 'z0',
          text: 'example university',
        },
        {
          id: 'z1',
          text: 'example company',
        },
        {
          id: 'a2',
          text: 'example group',
        },
      ],
    };
    saveAffiliations(session, projectWithAffiliations);
    expect(projectFrontmatterFromDTO(session, projectWithAffiliations)).toEqual({
      ...frontmatter,
      authors: [
        {
          userId: 'abc',
          email: 'test@example.com',
          corresponding: true,
          name: 'Test 0',
          orcid: '0000-0000-0000-0000',
          roles: ['Conceptualization', 'Investigation', 'Methodology', 'Writing – original draft'],
          affiliations: [],
        },
        {
          affiliations: ['example group'],
          userId: 'def',
          corresponding: false,
          roles: ['Writing – review & editing', 'Validation'],
          orcid: '0000-0000-0000-0001',
          name: 'Test 1',
        },
      ],
    });
  });
});

describe('pageFrontmatterFromDTO', () => {
  const date = new Date();
  const frontmatter: PageFrontmatter = {
    title: 'title',
    description: 'description',
    name: 'name',
    date: date.toISOString(),
    oxa: 'oxa:proj/block',
    tags: ['a-tag'],
  };
  const block: Block = {
    id: {
      project: 'proj',
      block: 'block',
    },
    kind: KINDS.Article,
    title: 'title',
    description: 'description',
    name: 'name',
    caption: '',
    published: false,
    published_versions: [],
    latest_version: 0,
    num_comments: 0,
    num_versions: 0,
    created_by: '',
    date_created: date,
    date_modified: date,
    pending: '',
    tags: ['a-tag'],
    default_draft: '',
    links: {
      project: '',
      comments: '',
      versions: '',
      created_by: '',
      drafts: '',
      self: '',
    },
  };
  it('minimal object returns self', async () => {
    expect(pageFrontmatterFromDTO(new Session(), block)).toEqual(frontmatter);
  });
  it('licenses coerces to license', async () => {
    expect(
      pageFrontmatterFromDTO(new Session(), {
        ...block,
        licenses: {
          content: 'CC-BY-SA-4.0',
          code: 'MIT',
        },
      }),
    ).toEqual({
      ...frontmatter,
      license: {
        content: {
          title: 'Creative Commons Attribution Share Alike 4.0 International',
          id: 'CC-BY-SA-4.0',
          CC: true,
          free: true,
          url: 'https://creativecommons.org/licenses/by-sa/4.0/',
        },
        code: {
          title: 'MIT License',
          id: 'MIT',
          free: true,
          osi: true,
          url: 'https://opensource.org/licenses/MIT',
        },
      },
    });
  });
  it('affiliations populate correctly', async () => {
    const session = new Session();
    saveAffiliations(session, {
      ...TEST_PROJECT,
      affiliations: [
        {
          id: 'a0',
          text: 'example university',
        },
        {
          id: 'a1',
          text: 'example company',
        },
        {
          id: 'a2',
          text: 'example group',
        },
      ],
    });
    expect(
      pageFrontmatterFromDTO(session, {
        ...block,
        authors: [
          {
            userId: 'abc',
            email: 'test@example.com',
            corresponding: true,
            name: 'Test 0',
            orcid: '0000-0000-0000-0000',
            id: 'abc',
            roles: [
              'Conceptualization',
              'Investigation',
              'Methodology',
              'Writing – original draft',
            ],
            affiliations: ['a0', 'a1'],
          },
          {
            affiliations: ['a0', 'a2'],
            id: 'def',
            userId: 'def',
            email: null,
            corresponding: false,
            roles: ['Writing – review & editing', 'Validation'],
            orcid: '0000-0000-0000-0001',
            name: 'Test 1',
          },
        ],
      }),
    ).toEqual({
      ...frontmatter,
      authors: [
        {
          userId: 'abc',
          email: 'test@example.com',
          corresponding: true,
          name: 'Test 0',
          orcid: '0000-0000-0000-0000',
          roles: ['Conceptualization', 'Investigation', 'Methodology', 'Writing – original draft'],
          affiliations: ['example university', 'example company'],
        },
        {
          affiliations: ['example university', 'example group'],
          userId: 'def',
          corresponding: false,
          roles: ['Writing – review & editing', 'Validation'],
          orcid: '0000-0000-0000-0001',
          name: 'Test 1',
        },
      ],
    });
  });
});

describe('prepareToWrite', () => {
  it('empty returns self', async () => {
    expect(prepareToWrite({})).toEqual({});
  });
  it('licenses coerces', async () => {
    expect(
      prepareToWrite({
        license: {
          content: {
            title: 'Creative Commons Attribution 4.0 International',
            id: 'CC-BY-4.0',
            CC: true,
            free: true,
            url: 'https://creativecommons.org/licenses/by/4.0/',
          },
        },
      }),
    ).toEqual({ license: 'CC-BY-4.0' });
  });
});
