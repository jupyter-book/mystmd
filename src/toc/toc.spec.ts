import mock from 'mock-fs';
import { Session } from '../session';
import { projectFromPath, tocFromProject } from '.';

afterEach(() => mock.restore());

const session = new Session();

describe('site section generation', () => {
  it('empty', async () => {
    mock({});
    expect(() => projectFromPath(session, '.')).toThrow();
  });
  it('invalid index', async () => {
    mock({ 'readme.md': '' });
    expect(() => projectFromPath(session, '.', 'index.md')).toThrow();
  });
  it('readme.md only', async () => {
    mock({ 'readme.md': '' });
    expect(projectFromPath(session, '.')).toEqual({
      file: 'readme.md',
      path: '.',
      index: 'readme',
      citations: [],
      pages: [],
    });
  });
  it('README.md only', async () => {
    mock({ 'README.md': '' });
    expect(projectFromPath(session, '.')).toEqual({
      file: 'README.md',
      path: '.',
      index: 'readme',
      citations: [],
      pages: [],
    });
  });
  it('README.md and index.md', async () => {
    mock({ 'README.md': '', 'index.md': '' });
    expect(projectFromPath(session, '.')).toEqual({
      file: 'index.md',
      path: '.',
      index: 'index',
      citations: [],
      pages: [{ file: 'README.md', level: 1, slug: 'readme' }],
    });
  });
  it('index.md only', async () => {
    mock({ 'index.md': '' });
    expect(projectFromPath(session, '.', 'index.md')).toEqual({
      file: 'index.md',
      path: '.',
      index: 'index',
      citations: [],
      pages: [],
    });
  });
  it('folder/subfolder/index.md only', async () => {
    mock({ 'folder/subfolder/index.md': '' });
    expect(projectFromPath(session, '.', 'folder/subfolder/index.md')).toEqual({
      file: 'folder/subfolder/index.md',
      path: '.',
      index: 'index',
      citations: [],
      pages: [],
    });
  });
  it('flat folder', async () => {
    mock({ 'readme.md': '', 'page.md': '', 'notebook.ipynb': '' });
    expect(projectFromPath(session, '.')).toEqual({
      file: 'readme.md',
      path: '.',
      index: 'readme',
      citations: [],
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
    mock({ 'readme.md': '', folder: { 'page.md': '', 'notebook.ipynb': '' } });
    expect(projectFromPath(session, '.')).toEqual({
      file: 'readme.md',
      path: '.',
      index: 'readme',
      citations: [],
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
    mock({
      'readme.md': '',
      'folder1/01_MySecond_folder-ok/folder3': { '01_notebook.ipynb': '', '02_page.md': '' },
    });
    expect(projectFromPath(session, '.')).toEqual({
      file: 'readme.md',
      path: '.',
      index: 'readme',
      citations: [],
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
    mock({ 'readme.md': '', 'zfile.md': '', afolder: { 'page.md': '' } });
    expect(projectFromPath(session, '.')).toEqual({
      file: 'readme.md',
      path: '.',
      index: 'readme',
      citations: [],
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
    mock({
      'ignore.md': '',
      folder1: {
        'page1.md': '',
        folder2: {
          'readme.md': '',
          'page2.md': '',
          folder3: {
            'page3.md': '',
          },
        },
      },
    });
    expect(projectFromPath(session, 'folder1', 'folder1/folder2/readme.md')).toEqual({
      file: 'folder1/folder2/readme.md',
      path: 'folder1',
      index: 'readme',
      citations: [],
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
    mock({ folder: { 'page.md': '', 'notebook.ipynb': '' } });
    expect(projectFromPath(session, '.')).toEqual({
      file: 'folder/page.md',
      path: '.',
      index: 'page',
      citations: [],
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
    mock({ 'page.md': '', 'index.ipynb': '' });
    expect(projectFromPath(session, '.')).toEqual({
      file: 'page.md',
      path: '.',
      index: 'page',
      citations: [],
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
    mock({ 'aaa.ipynb': '', 'index.ipynb': '' });
    expect(projectFromPath(session, '.')).toEqual({
      file: 'index.ipynb',
      path: '.',
      index: 'index',
      citations: [],
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
    mock({ folder: { 'page.docx': '', 'notebook.ipynb': '' } });
    expect(projectFromPath(session, '.')).toEqual({
      file: 'folder/notebook.ipynb',
      path: '.',
      index: 'notebook',
      citations: [],
      pages: [],
    });
  });
  it('stop traversing at curvenote.yml', async () => {
    mock({
      'readme.md': '',
      folder: {
        'page.md': '',
        'notebook.ipynb': '',
        newproj: { 'page.md': '', 'curvenote.yml': '' },
      },
    });
    expect(projectFromPath(session, '.')).toEqual({
      file: 'readme.md',
      path: '.',
      index: 'readme',
      citations: [],
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
  it('do not stop traversing at root curvenote.yml', async () => {
    mock({
      'curvenote.yml': '',
      'readme.md': '',
      folder: {
        'page.md': '',
        'notebook.ipynb': '',
        newproj: { 'page.md': '', 'curvenote.yml': '' },
      },
    });
    expect(projectFromPath(session, '.')).toEqual({
      file: 'readme.md',
      path: '.',
      index: 'readme',
      citations: [],
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
        path: '.',
        index: 'readme',
        citations: [],
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
        path: '.',
        index: 'readme',
        citations: [],
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
        path: '.',
        index: 'readme',
        citations: [],
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
  it('root and folder and page', async () => {
    expect(
      tocFromProject({
        file: 'readme.md',
        path: '.',
        index: 'readme',
        citations: [],
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
        path: '.',
        index: 'readme',
        citations: [],
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
