import { describe, expect, it, beforeEach, vi } from 'vitest';
import memfs from 'memfs';
import { Session } from '../session';
import { projectFromPath } from './fromPath';
import { pagesFromToc, projectFromToc } from './fromToc';
import { tocFromProject } from './toToc';
import { findProjectsOnPath } from './load';

vi.mock('fs', () => ({ ['default']: memfs.fs }));

beforeEach(() => memfs.vol.reset());

const session = new Session();

describe('site section generation', () => {
  it('empty', async () => {
    memfs.vol.fromJSON({});
    expect((async () => await projectFromPath(session, '.'))()).rejects.toThrow();
  });
  it('invalid index', async () => {
    memfs.vol.fromJSON({ 'readme.md': '' });
    expect((async () => await projectFromPath(session, '.', 'index.md'))()).rejects.toThrow();
  });
  it('readme.md only', async () => {
    memfs.vol.fromJSON({ 'readme.md': '' });
    expect(await projectFromPath(session, '.')).toEqual({
      file: 'readme.md',
      path: '.',
      index: 'readme',
      implicitIndex: true,
      pages: [],
    });
  });
  it('README.md only', async () => {
    memfs.vol.fromJSON({ 'README.md': '' });
    expect(await projectFromPath(session, '.')).toEqual({
      file: 'README.md',
      path: '.',
      index: 'readme',
      implicitIndex: true,
      pages: [],
    });
  });
  it('README.md and index.md', async () => {
    memfs.vol.fromJSON({ 'README.md': '', 'index.md': '' });
    expect(await projectFromPath(session, '.')).toEqual({
      file: 'index.md',
      path: '.',
      index: 'index',
      implicitIndex: true,
      pages: [{ file: 'README.md', level: 1, slug: 'readme' }],
    });
  });
  it('index.md only', async () => {
    memfs.vol.fromJSON({ 'index.md': '' });
    expect(await projectFromPath(session, '.', 'index.md')).toEqual({
      file: 'index.md',
      path: '.',
      index: 'index',
      implicitIndex: false,
      pages: [],
    });
  });
  it('folder/subfolder/index.md only', async () => {
    memfs.vol.fromJSON({ 'folder/subfolder/index.md': '' });
    expect(await projectFromPath(session, '.', 'folder/subfolder/index.md')).toEqual({
      file: 'folder/subfolder/index.md',
      path: '.',
      index: 'index',
      implicitIndex: false,
      pages: [],
    });
  });
  it('flat folder', async () => {
    memfs.vol.fromJSON({ 'readme.md': '', 'page.md': '', 'notebook.ipynb': '' });
    expect(await projectFromPath(session, '.')).toEqual({
      file: 'readme.md',
      path: '.',
      index: 'readme',
      implicitIndex: true,
      pages: [
        {
          file: 'notebook.ipynb',
          slug: 'notebook',
          level: 1,
        },
        {
          file: 'page.md',
          slug: 'page',
          level: 1,
        },
      ],
    });
  });
  it('single folder', async () => {
    memfs.vol.fromJSON({ 'readme.md': '', 'folder/page.md': '', 'folder/notebook.ipynb': '' });
    expect(await projectFromPath(session, '.')).toEqual({
      file: 'readme.md',
      path: '.',
      index: 'readme',
      implicitIndex: true,
      pages: [
        {
          title: 'Folder',
          level: 1,
        },
        {
          file: 'folder/notebook.ipynb',
          slug: 'notebook',
          level: 2,
        },
        {
          file: 'folder/page.md',
          slug: 'page',
          level: 2,
        },
      ],
    });
  });
  it('nested folders', async () => {
    memfs.vol.fromJSON({
      'readme.md': '',
      'folder1/01_MySecond_folder-ok/folder3/01_notebook.ipynb': '',
      'folder1/01_MySecond_folder-ok/folder3/02_page.md': '',
    });
    expect(await projectFromPath(session, '.')).toEqual({
      file: 'readme.md',
      path: '.',
      index: 'readme',
      implicitIndex: true,
      pages: [
        {
          title: 'Folder1',
          level: 1,
        },
        {
          title: 'My Second Folder Ok',
          level: 2,
        },
        {
          title: 'Folder3',
          level: 3,
        },
        {
          file: 'folder1/01_MySecond_folder-ok/folder3/01_notebook.ipynb',
          slug: 'notebook',
          level: 4,
        },
        {
          file: 'folder1/01_MySecond_folder-ok/folder3/02_page.md',
          slug: 'page',
          level: 4,
        },
      ],
    });
  });
  it('files before folders', async () => {
    memfs.vol.fromJSON({ 'readme.md': '', 'zfile.md': '', 'afolder/page.md': '' });
    expect(await projectFromPath(session, '.')).toEqual({
      file: 'readme.md',
      path: '.',
      index: 'readme',
      implicitIndex: true,
      pages: [
        {
          file: 'zfile.md',
          slug: 'zfile',
          level: 1,
        },
        {
          title: 'Afolder',
          level: 1,
        },
        {
          file: 'afolder/page.md',
          slug: 'page',
          level: 2,
        },
      ],
    });
  });
  it('specify index & folder', async () => {
    memfs.vol.fromJSON({
      'ignore.md': '',
      'folder1/page1.md': '',
      'folder1/folder2/readme.md': '',
      'folder1/folder2/page2.md': '',
      'folder1/folder2/folder3/page3.md': '',
    });
    expect(await projectFromPath(session, 'folder1', 'folder1/folder2/readme.md')).toEqual({
      file: 'folder1/folder2/readme.md',
      path: 'folder1',
      index: 'readme',
      implicitIndex: false,
      pages: [
        {
          file: 'folder1/page1.md',
          slug: 'page1',
          level: 1,
        },
        {
          title: 'Folder2',
          level: 1,
        },
        {
          file: 'folder1/folder2/page2.md',
          slug: 'page2',
          level: 2,
        },
        {
          title: 'Folder3',
          level: 2,
        },
        {
          file: 'folder1/folder2/folder3/page3.md',
          slug: 'page3',
          level: 3,
        },
      ],
    });
  });
  it('first md file as index', async () => {
    memfs.vol.fromJSON({ 'folder/page.md': '', 'folder/notebook.ipynb': '' });
    expect(await projectFromPath(session, '.')).toEqual({
      file: 'folder/page.md',
      path: '.',
      index: 'page',
      implicitIndex: true,
      pages: [
        {
          title: 'Folder',
          level: 1,
        },
        {
          file: 'folder/notebook.ipynb',
          slug: 'notebook',
          level: 2,
        },
      ],
    });
  });
  it('other md picked over default notebook', async () => {
    memfs.vol.fromJSON({ 'page.md': '', 'index.ipynb': '' });
    expect(await projectFromPath(session, '.')).toEqual({
      file: 'page.md',
      path: '.',
      index: 'page',
      implicitIndex: true,
      pages: [
        {
          file: 'index.ipynb',
          slug: 'index',
          level: 1,
        },
      ],
    });
  });
  it('index notebook picked over other notebook', async () => {
    memfs.vol.fromJSON({ 'aaa.ipynb': '', 'index.ipynb': '' });
    expect(await projectFromPath(session, '.')).toEqual({
      file: 'index.ipynb',
      path: '.',
      index: 'index',
      implicitIndex: true,
      pages: [
        {
          file: 'aaa.ipynb',
          slug: 'aaa',
          level: 1,
        },
      ],
    });
  });
  it('first notebook as index', async () => {
    memfs.vol.fromJSON({ 'folder/page.docx': '', 'folder/notebook.ipynb': '' });
    expect(await projectFromPath(session, '.')).toEqual({
      file: 'folder/notebook.ipynb',
      path: '.',
      index: 'notebook',
      implicitIndex: true,
      pages: [],
    });
  });
  it('stop traversing at myst.yml', async () => {
    memfs.vol.fromJSON({
      'readme.md': '',
      'folder/page.md': '',
      'folder/notebook.ipynb': '',
      'folder/newproj/page.md': '',
      'folder/newproj/myst.yml': '',
    });
    expect(await projectFromPath(session, '.')).toEqual({
      file: 'readme.md',
      path: '.',
      index: 'readme',
      implicitIndex: true,
      pages: [
        {
          title: 'Folder',
          level: 1,
        },
        {
          file: 'folder/notebook.ipynb',
          slug: 'notebook',
          level: 2,
        },
        {
          file: 'folder/page.md',
          slug: 'page',
          level: 2,
        },
      ],
    });
  });
  it('sort by number', async () => {
    memfs.vol.fromJSON({
      'readme.md': '',
      'chapter1.md': '',
      'chapter2.ipynb': '',
      'chapter10.ipynb': '',
    });
    expect(await projectFromPath(session, '.')).toEqual({
      file: 'readme.md',
      path: '.',
      index: 'readme',
      implicitIndex: true,
      pages: [
        {
          file: 'chapter1.md',
          slug: 'chapter1',
          level: 1,
        },
        {
          file: 'chapter2.ipynb',
          slug: 'chapter2',
          level: 1,
        },
        {
          file: 'chapter10.ipynb',
          slug: 'chapter10',
          level: 1,
        },
      ],
    });
  });
  it('do not stop traversing at root myst.yml', async () => {
    memfs.vol.fromJSON({
      'myst.yml': '',
      'readme.md': '',
      'folder/page.md': '',
      'folder/notebook.ipynb': '',
      'folder/newproj/page.md': '',
      'folder/newproj/myst.yml': '',
    });
    expect(await projectFromPath(session, '.')).toEqual({
      file: 'readme.md',
      path: '.',
      index: 'readme',
      implicitIndex: true,
      pages: [
        {
          title: 'Folder',
          level: 1,
        },
        {
          file: 'folder/notebook.ipynb',
          slug: 'notebook',
          level: 2,
        },
        {
          file: 'folder/page.md',
          slug: 'page',
          level: 2,
        },
      ],
    });
  });
});

describe('tocFromProject', () => {
  it('single root', async () => {
    expect(
      tocFromProject({
        file: 'readme.md',
        pages: [],
      }),
    ).toEqual({
      format: 'jb-book',
      root: 'readme',
      chapters: [],
    });
  });
  it('root and one page', async () => {
    expect(
      tocFromProject({
        file: 'readme.md',
        pages: [
          {
            file: 'a.md',
            slug: 'a',
            level: 1,
          },
        ],
      }),
    ).toEqual({
      format: 'jb-book',
      root: 'readme',
      chapters: [
        {
          file: 'a',
        },
      ],
    });
  });
  it('root and pages with different levels', async () => {
    expect(
      tocFromProject({
        file: 'readme.md',
        pages: [
          {
            file: 'a.md',
            slug: 'a',
            level: 1,
          },
          {
            file: 'b.md',
            slug: 'b',
            level: 3,
          },
          {
            file: 'c.md',
            slug: 'c',
            level: 1,
          },
        ],
      }),
    ).toEqual({
      format: 'jb-book',
      root: 'readme',
      chapters: [
        {
          file: 'a',
          sections: [
            {
              file: 'b',
            },
          ],
        },
        {
          file: 'c',
        },
      ],
    });
  });
  it('root page with relative path', async () => {
    expect(
      tocFromProject(
        {
          file: 'path/readme.md',
          pages: [
            {
              file: 'path/a.md',
              slug: 'a',
              level: 1,
            },
          ],
        },
        'path', // This is the relative path we are calling this from!
      ),
    ).toEqual({
      format: 'jb-book',
      root: 'readme',
      chapters: [
        {
          file: 'a',
        },
      ],
    });
  });
  it('root and folder and page', async () => {
    expect(
      tocFromProject({
        file: 'readme.md',
        pages: [
          {
            title: 'folder',
            level: 1,
          },
          {
            file: 'b.md',
            slug: 'b',
            level: 3,
          },
        ],
      }),
    ).toEqual({
      format: 'jb-book',
      root: 'readme',
      chapters: [
        {
          title: 'folder',
          sections: [
            {
              file: 'b',
            },
          ],
        },
      ],
    });
  });
  it('root and nested folders', async () => {
    expect(
      tocFromProject({
        file: 'readme.md',
        pages: [
          {
            title: 'folder',
            level: 1,
          },
          {
            title: 'folder',
            level: 2,
          },
          {
            title: 'folder',
            level: 3,
          },
          {
            file: 'a.md',
            slug: 'a',
            level: 4,
          },
          {
            file: 'b.md',
            slug: 'b',
            level: 2,
          },
          {
            file: 'c.md',
            slug: 'c',
            level: 3,
          },
        ],
      }),
    ).toEqual({
      format: 'jb-book',
      root: 'readme',
      chapters: [
        {
          title: 'folder',
          sections: [
            {
              title: 'folder',
              sections: [
                {
                  title: 'folder',
                  sections: [
                    {
                      file: 'a',
                    },
                  ],
                },
              ],
            },
            {
              file: 'b',
              sections: [
                {
                  file: 'c',
                },
              ],
            },
          ],
        },
      ],
    });
  });
});

const SITE_CONFIG = `
version: 1
site:
  projects: []
  nav: []
  actions: []
  domains: []
`;

const PROJECT_CONFIG = `
version: 1
project: {}
`;

describe('findProjectPaths', () => {
  it('site myst.ymls', async () => {
    memfs.vol.fromJSON({
      'myst.yml': SITE_CONFIG,
      'readme.md': '',
      'folder/page.md': '',
      'folder/notebook.ipynb': '',
      'folder/newproj/page.md': '',
      'folder/newproj/myst.yml': SITE_CONFIG,
    });
    expect(findProjectsOnPath(session, '.')).toEqual([]);
  });
  it('project myst.ymls', async () => {
    memfs.vol.fromJSON({
      'myst.yml': PROJECT_CONFIG,
      'readme.md': '',
      'folder/page.md': '',
      'folder/notebook.ipynb': '',
      'folder/newproj/page.md': '',
      'folder/newproj/myst.yml': PROJECT_CONFIG,
    });
    expect(findProjectsOnPath(session, '.')).toEqual(['.', 'folder/newproj']);
  });
});

const TOC_FILE = `
format: jb-book
root: index
chapters:
  - file: a
  - title: Sections
    sections:
      - file: b
      - file: c
`;

describe('pagesFromToc', () => {
  it('pages from toc', async () => {
    memfs.vol.fromJSON({
      '_toc.yml': TOC_FILE,
      'index.md': '',
      'a.md': '',
      'b.md': '',
      'c.md': '',
    });
    expect(pagesFromToc(session, '.', 1)).toEqual([
      { slug: 'index', file: 'index.md', level: 1 },
      { slug: 'a', file: 'a.md', level: 2 },
      { title: 'Sections', level: 2 },
      { slug: 'b', file: 'b.md', level: 3 },
      { slug: 'c', file: 'c.md', level: 3 },
    ]);
  });
  it('project from toc', async () => {
    memfs.vol.fromJSON({
      '_toc.yml': TOC_FILE,
      'index.md': '',
      'a.md': '',
      'b.md': '',
      'c.md': '',
    });
    expect(projectFromToc(session, '.', 1)).toEqual({
      index: 'index',
      file: 'index.md',
      path: '.',
      pages: [
        { slug: 'a', file: 'a.md', level: 1 },
        { title: 'Sections', level: 1 },
        { slug: 'b', file: 'b.md', level: 2 },
        { slug: 'c', file: 'c.md', level: 2 },
      ],
    });
  });
  it('project from toc, level = 0', async () => {
    memfs.vol.fromJSON({
      '_toc.yml': TOC_FILE,
      'index.md': '',
      'a.md': '',
      'b.md': '',
      'c.md': '',
    });
    expect(projectFromToc(session, '.', 0)).toEqual({
      index: 'index',
      file: 'index.md',
      path: '.',
      pages: [
        { slug: 'a', file: 'a.md', level: 0 },
        { title: 'Sections', level: 0 },
        { slug: 'b', file: 'b.md', level: 1 },
        { slug: 'c', file: 'c.md', level: 1 },
      ],
    });
  });
  it('project from toc, level = -1', async () => {
    memfs.vol.fromJSON({
      '_toc.yml': TOC_FILE,
      'index.md': '',
      'a.md': '',
      'b.md': '',
      'c.md': '',
    });
    expect(projectFromToc(session, '.', -1)).toEqual({
      index: 'index',
      file: 'index.md',
      path: '.',
      pages: [
        { slug: 'a', file: 'a.md', level: 0 },
        { title: 'Sections', level: 0 },
        { slug: 'b', file: 'b.md', level: 1 },
        { slug: 'c', file: 'c.md', level: 1 },
      ],
    });
  });
  it('pages from toc, with extra files', async () => {
    memfs.vol.fromJSON({
      '_toc.yml': TOC_FILE,
      'index.md': '',
      'a.md': '',
      'b.md': '',
      'c.md': '',
      'd.md': '',
      'e.md': '',
    });
    expect(pagesFromToc(session, '.', 1)).toEqual([
      { slug: 'index', file: 'index.md', level: 1 },
      { slug: 'a', file: 'a.md', level: 2 },
      { title: 'Sections', level: 2 },
      { slug: 'b', file: 'b.md', level: 3 },
      { slug: 'c', file: 'c.md', level: 3 },
    ]);
  });
  it('pages from toc, nested', async () => {
    memfs.vol.fromJSON({
      'readme.md': '',
      'x.md': '',
      'section/y.md': '',
      'section/z.md': '',
      'project/_toc.yml': TOC_FILE,
      'project/index.md': '',
      'project/a.md': '',
      'project/b.md': '',
      'project/c.md': '',
      'project/d.md': '',
    });
    expect(await projectFromPath(session, '.')).toEqual({
      path: '.',
      index: 'readme',
      file: 'readme.md',
      implicitIndex: true,
      pages: [
        { slug: 'x', file: 'x.md', level: 1 },
        { slug: 'index', file: 'project/index.md', level: 1 },
        { slug: 'a', file: 'project/a.md', level: 2 },
        { title: 'Sections', level: 2 },
        { slug: 'b', file: 'project/b.md', level: 3 },
        { slug: 'c', file: 'project/c.md', level: 3 },
        { title: 'Section', level: 1 },
        { slug: 'y', file: 'section/y.md', level: 2 },
        { slug: 'z', file: 'section/z.md', level: 2 },
      ],
    });
  });
  it('pages from bad toc', async () => {
    memfs.vol.fromJSON({
      'readme.md': '',
      'x.md': '',
      'section/y.md': '',
      'section/z.md': '',
      'project/_toc.yml': '',
      'project/index.md': '',
      'project/a.md': '',
      'project/b.md': '',
      'project/c.md': '',
      'project/d.md': '',
    });
    expect(await projectFromPath(session, '.')).toEqual({
      path: '.',
      index: 'readme',
      file: 'readme.md',
      implicitIndex: true,
      pages: [
        { slug: 'x', file: 'x.md', level: 1 },
        { title: 'Project', level: 1 },
        { slug: 'a', file: 'project/a.md', level: 2 },
        { slug: 'b', file: 'project/b.md', level: 2 },
        { slug: 'c', file: 'project/c.md', level: 2 },
        { slug: 'd', file: 'project/d.md', level: 2 },
        { slug: 'index', file: 'project/index.md', level: 2 },
        { title: 'Section', level: 1 },
        { slug: 'y', file: 'section/y.md', level: 2 },
        { slug: 'z', file: 'section/z.md', level: 2 },
      ],
    });
  });
});
