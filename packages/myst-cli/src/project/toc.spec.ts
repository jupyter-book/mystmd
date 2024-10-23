import { describe, expect, it, beforeEach, vi } from 'vitest';
import memfs from 'memfs';
import { Session } from '../session';
import { projectFromPath } from './fromPath';
import { pagesFromSphinxTOC, projectFromSphinxTOC } from './fromTOC';
import { tocFromProject } from './toTOC';
import { findProjectsOnPath } from './load';

vi.mock('fs', () => ({ ['default']: memfs.fs }));

beforeEach(() => memfs.vol.reset());

const session = new Session();

describe('site section generation', () => {
  it('empty', async () => {
    memfs.vol.fromJSON({});
    expect((async () => projectFromPath(session, '.'))()).rejects.toThrow();
  });
  it('invalid index', async () => {
    memfs.vol.fromJSON({ 'readme.md': '' });
    expect((async () => projectFromPath(session, '.', 'index.md'))()).rejects.toThrow();
  });
  it('readme.md only', async () => {
    memfs.vol.fromJSON({ 'readme.md': '' });
    expect(projectFromPath(session, '.')).toEqual({
      file: 'readme.md',
      path: '.',
      index: 'readme',
      implicitIndex: true,
      pages: [],
    });
  });
  it('README.md only', async () => {
    memfs.vol.fromJSON({ 'README.md': '' });
    expect(projectFromPath(session, '.')).toEqual({
      file: 'README.md',
      path: '.',
      index: 'readme',
      implicitIndex: true,
      pages: [],
    });
  });
  it('README.md and index.md', async () => {
    memfs.vol.fromJSON({ 'README.md': '', 'index.md': '' });
    expect(projectFromPath(session, '.')).toEqual({
      file: 'index.md',
      path: '.',
      index: 'index',
      implicitIndex: true,
      pages: [{ file: 'README.md', level: 1, slug: 'readme', implicit: true }],
    });
  });
  it('index.md only', async () => {
    memfs.vol.fromJSON({ 'index.md': '' });
    expect(projectFromPath(session, '.', 'index.md')).toEqual({
      file: 'index.md',
      path: '.',
      index: 'index',
      implicitIndex: false,
      pages: [],
    });
  });
  it('folder/subfolder/index.md only', async () => {
    memfs.vol.fromJSON({ 'folder/subfolder/index.md': '' });
    expect(projectFromPath(session, '.', 'folder/subfolder/index.md')).toEqual({
      file: 'folder/subfolder/index.md',
      path: '.',
      index: 'index',
      implicitIndex: false,
      pages: [],
    });
  });
  it('flat folder', async () => {
    memfs.vol.fromJSON({ 'readme.md': '', 'page.md': '', 'notebook.ipynb': '' });
    expect(projectFromPath(session, '.')).toEqual({
      file: 'readme.md',
      path: '.',
      index: 'readme',
      implicitIndex: true,
      pages: [
        {
          file: 'notebook.ipynb',
          slug: 'notebook',
          level: 1,
          implicit: true,
        },
        {
          file: 'page.md',
          slug: 'page',
          level: 1,
          implicit: true,
        },
      ],
    });
  });
  it('single folder', async () => {
    memfs.vol.fromJSON({ 'readme.md': '', 'folder/page.md': '', 'folder/notebook.ipynb': '' });
    expect(projectFromPath(session, '.')).toEqual({
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
          implicit: true,
        },
        {
          file: 'folder/page.md',
          slug: 'page',
          level: 2,
          implicit: true,
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
    expect(projectFromPath(session, '.')).toEqual({
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
          implicit: true,
        },
        {
          file: 'folder1/01_MySecond_folder-ok/folder3/02_page.md',
          slug: 'page',
          level: 4,
          implicit: true,
        },
      ],
    });
  });
  it('files before folders', async () => {
    memfs.vol.fromJSON({ 'readme.md': '', 'zfile.md': '', 'afolder/page.md': '' });
    expect(projectFromPath(session, '.')).toEqual({
      file: 'readme.md',
      path: '.',
      index: 'readme',
      implicitIndex: true,
      pages: [
        {
          file: 'zfile.md',
          slug: 'zfile',
          level: 1,
          implicit: true,
        },
        {
          title: 'Afolder',
          level: 1,
        },
        {
          file: 'afolder/page.md',
          slug: 'page',
          level: 2,
          implicit: true,
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
    expect(projectFromPath(session, 'folder1', 'folder1/folder2/readme.md')).toEqual({
      file: 'folder1/folder2/readme.md',
      path: 'folder1',
      index: 'readme',
      implicitIndex: false,
      pages: [
        {
          file: 'folder1/page1.md',
          slug: 'page1',
          level: 1,
          implicit: true,
        },
        {
          title: 'Folder2',
          level: 1,
        },
        {
          file: 'folder1/folder2/page2.md',
          slug: 'page2',
          level: 2,
          implicit: true,
        },
        {
          title: 'Folder3',
          level: 2,
        },
        {
          file: 'folder1/folder2/folder3/page3.md',
          slug: 'page3',
          level: 3,
          implicit: true,
        },
      ],
    });
  });
  it('first md file as index', async () => {
    memfs.vol.fromJSON({ 'folder/page.md': '', 'folder/notebook.ipynb': '' });
    expect(projectFromPath(session, '.')).toEqual({
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
          implicit: true,
        },
      ],
    });
  });
  it('index notebook picked over md', async () => {
    memfs.vol.fromJSON({ 'page.md': '', 'index.ipynb': '' });
    expect(projectFromPath(session, '.')).toEqual({
      file: 'index.ipynb',
      path: '.',
      index: 'index',
      implicitIndex: true,
      pages: [
        {
          file: 'page.md',
          slug: 'page',
          level: 1,
          implicit: true,
        },
      ],
    });
  });
  it('index notebook picked over other notebook', async () => {
    memfs.vol.fromJSON({ 'aaa.ipynb': '', 'index.ipynb': '' });
    expect(projectFromPath(session, '.')).toEqual({
      file: 'index.ipynb',
      path: '.',
      index: 'index',
      implicitIndex: true,
      pages: [
        {
          file: 'aaa.ipynb',
          slug: 'aaa',
          level: 1,
          implicit: true,
        },
      ],
    });
  });
  it('first notebook as index', async () => {
    memfs.vol.fromJSON({ 'folder/page.docx': '', 'folder/notebook.ipynb': '' });
    expect(projectFromPath(session, '.')).toEqual({
      file: 'folder/notebook.ipynb',
      path: '.',
      index: 'notebook',
      implicitIndex: true,
      pages: [],
    });
  });
  it('tex file as index over notebook', async () => {
    memfs.vol.fromJSON({
      'page.md': '',
      'index.ipynb': '',
      'main.tex': '',
    });
    expect(projectFromPath(session, '.')).toEqual({
      file: 'main.tex',
      path: '.',
      index: 'main',
      implicitIndex: true,
      pages: [
        {
          file: 'index.ipynb',
          slug: 'index',
          level: 1,
          implicit: true,
        },
        {
          file: 'page.md',
          slug: 'page',
          level: 1,
          implicit: true,
        },
      ],
    });
  });
  it('first md file alphabetically as index in subfolder', async () => {
    memfs.vol.fromJSON({
      'folder/index.ipynb': '',
      'folder/page.md': '',
      'folder/main.tex': '',
    });
    expect(projectFromPath(session, '.')).toEqual({
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
          file: 'folder/index.ipynb',
          slug: 'index',
          level: 2,
          implicit: true,
        },
        {
          file: 'folder/main.tex',
          slug: 'main',
          level: 2,
          implicit: true,
        },
      ],
    });
  });
  it('root index file preferred over nested file', async () => {
    memfs.vol.fromJSON({
      'folder/page.md': '',
      'index.ipynb': '',
      'folder/main.tex': '',
    });
    expect(projectFromPath(session, '.')).toEqual({
      file: 'index.ipynb',
      path: '.',
      index: 'index',
      implicitIndex: true,
      pages: [
        {
          title: 'Folder',
          level: 1,
        },
        {
          file: 'folder/main.tex',
          slug: 'main',
          level: 2,
          implicit: true,
        },
        {
          file: 'folder/page.md',
          slug: 'page',
          level: 2,
          implicit: true,
        },
      ],
    });
  });
  it('md file preferred for index even if not at root level', async () => {
    memfs.vol.fromJSON({
      'folder/page.md': '',
      'notebook.ipynb': '',
      'folder/main.tex': '',
    });
    expect(projectFromPath(session, '.')).toEqual({
      file: 'folder/page.md',
      path: '.',
      index: 'page',
      implicitIndex: true,
      pages: [
        {
          file: 'notebook.ipynb',
          slug: 'notebook',
          level: 1,
          implicit: true,
        },
        {
          title: 'Folder',
          level: 1,
        },
        {
          file: 'folder/main.tex',
          slug: 'main',
          level: 2,
          implicit: true,
        },
      ],
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
    expect(projectFromPath(session, '.')).toEqual({
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
          implicit: true,
        },
        {
          file: 'folder/page.md',
          slug: 'page',
          level: 2,
          implicit: true,
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
    expect(projectFromPath(session, '.')).toEqual({
      file: 'readme.md',
      path: '.',
      index: 'readme',
      implicitIndex: true,
      pages: [
        {
          file: 'chapter1.md',
          slug: 'chapter1',
          level: 1,
          implicit: true,
        },
        {
          file: 'chapter2.ipynb',
          slug: 'chapter2',
          level: 1,
          implicit: true,
        },
        {
          file: 'chapter10.ipynb',
          slug: 'chapter10',
          level: 1,
          implicit: true,
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
    expect(projectFromPath(session, '.')).toEqual({
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
          implicit: true,
        },
        {
          file: 'folder/page.md',
          slug: 'page',
          level: 2,
          implicit: true,
        },
      ],
    });
  });
  it('urlFolders puts folders in slugs', async () => {
    memfs.vol.fromJSON({
      'ignore.md': '',
      'folder1/page1.md': '',
      'folder1/folder2/readme.md': '',
      'folder1/folder2/page2.md': '',
      'folder1/folder2/folder3/page3.md': '',
    });
    expect(projectFromPath(session, 'folder1', undefined, { urlFolders: true })).toEqual({
      file: 'folder1/page1.md',
      path: 'folder1',
      index: 'page1',
      implicitIndex: true,
      pages: [
        {
          title: 'Folder2',
          level: 1,
        },
        {
          file: 'folder1/folder2/readme.md',
          slug: 'folder2.readme',
          level: 2,
          implicit: true,
        },
        {
          file: 'folder1/folder2/page2.md',
          slug: 'folder2.page2',
          level: 2,
          implicit: true,
        },
        {
          title: 'Folder3',
          level: 2,
        },
        {
          file: 'folder1/folder2/folder3/page3.md',
          slug: 'folder2.folder3.page3',
          level: 3,
          implicit: true,
        },
      ],
    });
  });
  it('matching file and folder-with-index deduplicate', async () => {
    memfs.vol.fromJSON({
      'ignore.md': '',
      'folder1/index.md': '',
      'folder1/page1.md': '',
      'folder1/page1/index.md': '',
      'folder1/page1/page2.md': '',
    });
    expect(projectFromPath(session, 'folder1', undefined, { urlFolders: true })).toEqual({
      file: 'folder1/index.md',
      path: 'folder1',
      index: 'index',
      implicitIndex: true,
      pages: [
        {
          file: 'folder1/page1.md',
          slug: 'page1',
          level: 1,
          implicit: true,
        },
        {
          title: 'Page1',
          level: 1,
        },
        {
          file: 'folder1/page1/index.md',
          slug: 'page1-1.index',
          level: 2,
          implicit: true,
        },
        {
          file: 'folder1/page1/page2.md',
          slug: 'page1.page2',
          level: 2,
          implicit: true,
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
    ).toEqual([{ file: 'readme.md' }]);
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
    ).toEqual([
      { file: 'readme.md' },
      {
        file: 'a.md',
      },
    ]);
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
    ).toEqual([
      { file: 'readme.md' },
      {
        file: 'a.md',
        children: [
          {
            file: 'b.md',
          },
        ],
      },
      {
        file: 'c.md',
      },
    ]);
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
    ).toEqual([{ file: 'readme.md' }, { file: 'a.md' }]);
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
    ).toEqual([
      { file: 'readme.md' },
      {
        title: 'folder',
        children: [
          {
            file: 'b.md',
          },
        ],
      },
    ]);
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
    ).toEqual([
      { file: 'readme.md' },
      {
        title: 'folder',
        children: [
          {
            title: 'folder',
            children: [
              {
                title: 'folder',
                children: [
                  {
                    file: 'a.md',
                  },
                ],
              },
            ],
          },
          {
            file: 'b.md',
            children: [
              {
                file: 'c.md',
              },
            ],
          },
        ],
      },
    ]);
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
    expect(await findProjectsOnPath(session, '.')).toEqual([]);
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
    expect(await findProjectsOnPath(session, '.')).toEqual(['.', 'folder/newproj']);
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

describe('pagesFromSphinxTOC', () => {
  it('pages from toc', async () => {
    memfs.vol.fromJSON({
      '_toc.yml': TOC_FILE,
      'index.md': '',
      'a.md': '',
      'b.md': '',
      'c.md': '',
    });
    expect(pagesFromSphinxTOC(session, '.', 1)).toEqual([
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
    expect(projectFromSphinxTOC(session, '.', 1)).toEqual({
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
    expect(projectFromSphinxTOC(session, '.', 0)).toEqual({
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
    expect(projectFromSphinxTOC(session, '.', -1)).toEqual({
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
    expect(pagesFromSphinxTOC(session, '.', 1)).toEqual([
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
    expect(projectFromPath(session, '.')).toEqual({
      path: '.',
      index: 'readme',
      file: 'readme.md',
      implicitIndex: true,
      pages: [
        { slug: 'x', file: 'x.md', level: 1, implicit: true },
        { slug: 'index', file: 'project/index.md', level: 1 },
        { slug: 'a', file: 'project/a.md', level: 2 },
        { title: 'Sections', level: 2 },
        { slug: 'b', file: 'project/b.md', level: 3 },
        { slug: 'c', file: 'project/c.md', level: 3 },
        { title: 'Section', level: 1 },
        { slug: 'y', file: 'section/y.md', level: 2, implicit: true },
        { slug: 'z', file: 'section/z.md', level: 2, implicit: true },
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
    expect(projectFromPath(session, '.')).toEqual({
      path: '.',
      index: 'readme',
      file: 'readme.md',
      implicitIndex: true,
      pages: [
        { slug: 'x', file: 'x.md', level: 1, implicit: true },
        { title: 'Project', level: 1 },
        { slug: 'index', file: 'project/index.md', level: 2, implicit: true },
        { slug: 'a', file: 'project/a.md', level: 2, implicit: true },
        { slug: 'b', file: 'project/b.md', level: 2, implicit: true },
        { slug: 'c', file: 'project/c.md', level: 2, implicit: true },
        { slug: 'd', file: 'project/d.md', level: 2, implicit: true },
        { title: 'Section', level: 1 },
        { slug: 'y', file: 'section/y.md', level: 2, implicit: true },
        { slug: 'z', file: 'section/z.md', level: 2, implicit: true },
      ],
    });
  });
  it('urlFolders puts folders in slugs', async () => {
    memfs.vol.fromJSON({
      '_toc.yml': `
format: jb-book
root: index
chapters:
  - file: a
  - title: Sections
    sections:
      - file: folder1/b
      - file: folder2/folder3/c
`,
      'index.md': '',
      'a.md': '',
      'folder1/b.md': '',
      'folder2/folder3/c.md': '',
    });
    expect(projectFromSphinxTOC(session, '.', 1, { urlFolders: true })).toEqual({
      index: 'index',
      file: 'index.md',
      path: '.',
      pages: [
        { slug: 'a', file: 'a.md', level: 1 },
        { title: 'Sections', level: 1 },
        { slug: 'folder1.b', file: 'folder1/b.md', level: 2 },
        { slug: 'folder2.folder3.c', file: 'folder2/folder3/c.md', level: 2 },
      ],
    });
  });
  it('file outside project path warns for urlFolders', async () => {
    memfs.vol.fromJSON({
      'folder1/_toc.yml': `
format: jb-book
root: index
chapters:
  - file: a
  - title: Sections
    sections:
      - file: folder2/b
      - file: ../folder3/folder4/c
`,
      'folder1/index.md': '',
      'folder1/a.md': '',
      'folder1/folder2/b.md': '',
      'folder3/folder4/c.md': '',
    });
    expect(projectFromSphinxTOC(session, 'folder1', 1, { urlFolders: true })).toEqual({
      index: 'index',
      file: 'folder1/index.md',
      path: 'folder1',
      pages: [
        { slug: 'a', file: 'folder1/a.md', level: 1 },
        { title: 'Sections', level: 1 },
        { slug: 'folder2.b', file: 'folder1/folder2/b.md', level: 2 },
        { slug: 'c', file: 'folder3/folder4/c.md', level: 2 },
      ],
    });
  });
  it('urlFolders for nested toc', async () => {
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
    expect(projectFromPath(session, '.', undefined, { urlFolders: true })).toEqual({
      path: '.',
      index: 'readme',
      file: 'readme.md',
      implicitIndex: true,
      pages: [
        { slug: 'x', file: 'x.md', level: 1, implicit: true },
        { slug: 'project.index', file: 'project/index.md', level: 1 },
        { slug: 'project.a', file: 'project/a.md', level: 2 },
        { title: 'Sections', level: 2 },
        { slug: 'project.b', file: 'project/b.md', level: 3 },
        { slug: 'project.c', file: 'project/c.md', level: 3 },
        { title: 'Section', level: 1 },
        { slug: 'section.y', file: 'section/y.md', level: 2, implicit: true },
        { slug: 'section.z', file: 'section/z.md', level: 2, implicit: true },
      ],
    });
  });
});
