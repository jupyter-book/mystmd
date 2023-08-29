import { describe, expect, it } from 'vitest';
import type { PageFrontmatter } from 'myst-frontmatter';
import { extendFrontmatter } from './frontmatter';

describe('extendFrontmatter', () => {
  it('frontmatter extends affiliations', async () => {
    const frontmatter: PageFrontmatter = {
      authors: [
        {
          name: 'John Doe',
          affiliations: ['aff1', 'aff2', 'col1'],
        },
        {
          name: 'Jane Doe',
          affiliations: ['aff1', 'col2'],
        },
      ],
      affiliations: [
        {
          id: 'aff1',
          name: 'univ 1',
        },
        {
          id: 'aff2',
          name: 'univ 2',
        },
        {
          id: 'col1',
          name: 'group 1',
          collaboration: true,
        },
        {
          id: 'col2',
          name: 'group 2',
          collaboration: true,
        },
      ],
    };
    const doc = extendFrontmatter(frontmatter);
    expect(doc.authors).toEqual([
      {
        name: 'John Doe',
        given_name: 'John',
        surname: 'Doe',
        index: 1,
        letter: 'A',
        affiliations: [
          {
            id: 'aff1',
            name: 'univ 1',
            value: {
              id: 'aff1',
              name: 'univ 1',
            },
            index: 1,
            letter: 'A',
          },
          {
            id: 'aff2',
            name: 'univ 2',
            value: {
              id: 'aff2',
              name: 'univ 2',
            },
            index: 2,
            letter: 'B',
          },
        ],
        collaborations: [
          {
            id: 'col1',
            name: 'group 1',
            collaboration: true,
            value: {
              id: 'col1',
              name: 'group 1',
              collaboration: true,
            },
            index: 1,
            letter: 'A',
          },
        ],
      },
      {
        name: 'Jane Doe',
        given_name: 'Jane',
        surname: 'Doe',
        index: 2,
        letter: 'B',
        affiliations: [
          {
            id: 'aff1',
            name: 'univ 1',
            value: {
              id: 'aff1',
              name: 'univ 1',
            },
            index: 1,
            letter: 'A',
          },
        ],
        collaborations: [
          {
            id: 'col2',
            name: 'group 2',
            collaboration: true,
            value: {
              id: 'col2',
              name: 'group 2',
              collaboration: true,
            },
            index: 2,
            letter: 'B',
          },
        ],
      },
    ]);
    expect(doc.affiliations).toEqual([
      {
        id: 'aff1',
        name: 'univ 1',
        value: {
          id: 'aff1',
          name: 'univ 1',
        },
        index: 1,
        letter: 'A',
      },
      {
        id: 'aff2',
        name: 'univ 2',
        value: {
          id: 'aff2',
          name: 'univ 2',
        },
        index: 2,
        letter: 'B',
      },
    ]);
    expect(doc.collaborations).toEqual([
      {
        id: 'col1',
        name: 'group 1',
        collaboration: true,
        value: {
          id: 'col1',
          name: 'group 1',
          collaboration: true,
        },
        index: 1,
        letter: 'A',
      },
      {
        id: 'col2',
        name: 'group 2',
        collaboration: true,
        value: {
          id: 'col2',
          name: 'group 2',
          collaboration: true,
        },
        index: 2,
        letter: 'B',
      },
    ]);
  });
});
