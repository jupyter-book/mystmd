import type { Block, Project } from '@curvenote/blocks';
import { CitationStyles, KINDS, ProjectVisibility } from '@curvenote/blocks';
import { prepareToWrite } from 'myst-cli';
import type { PageFrontmatter, ProjectFrontmatter } from 'myst-frontmatter';
import { Session } from '../session';
import { pageFrontmatterFromDTO, projectFrontmatterFromDTO, saveAffiliations } from './api';

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
    hidden: false,
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
