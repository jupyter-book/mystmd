import mock from 'mock-fs';
import { siteSectionFromFolder } from './toc';

afterEach(() => mock.restore());

describe('site section generation', () => {
  it('empty', async () => {
    mock({});
    expect(() => siteSectionFromFolder()).toThrow();
  });
  it('invalid index', async () => {
    mock({ 'readme.md': '' });
    expect(() => siteSectionFromFolder('index.md')).toThrow();
  });
  it('readme.md only', async () => {
    mock({ 'readme.md': '' });
    expect(siteSectionFromFolder()).toEqual({
      file: 'readme.md',
      slug: 'readme',
      title: 'readme',
      pages: [],
    });
  });
  it('README.md only', async () => {
    mock({ 'README.md': '' });
    expect(siteSectionFromFolder()).toEqual({
      file: 'README.md',
      slug: 'readme',
      title: 'readme',
      pages: [],
    });
  });
  it('index.md only', async () => {
    mock({ 'index.md': '' });
    expect(siteSectionFromFolder('index.md')).toEqual({
      file: 'index.md',
      slug: 'index',
      title: 'index',
      pages: [],
    });
  });
  it('folder/subfolder/index.md only', async () => {
    mock({ 'folder/subfolder/index.md': '' });
    expect(siteSectionFromFolder('folder/subfolder/index.md')).toEqual({
      file: 'folder/subfolder/index.md',
      slug: 'index',
      title: 'index',
      pages: [],
    });
  });
  it('flat folder', async () => {
    mock({ 'readme.md': '', 'page.md': '', 'notebook.ipynb': '' });
    expect(siteSectionFromFolder()).toEqual({
      file: 'readme.md',
      slug: 'readme',
      title: 'readme',
      pages: [
        {
          file: 'notebook.ipynb',
          slug: 'notebook',
          title: 'notebook',
          level: 1,
        },
        {
          file: 'page.md',
          slug: 'page',
          title: 'page',
          level: 1,
        },
      ],
    });
  });
  it('single folder', async () => {
    mock({ 'readme.md': '', folder: { 'page.md': '', 'notebook.ipynb': '' } });
    expect(siteSectionFromFolder()).toEqual({
      file: 'readme.md',
      slug: 'readme',
      title: 'readme',
      pages: [
        {
          title: 'folder',
          level: 1,
        },
        {
          file: 'folder/notebook.ipynb',
          slug: 'notebook',
          title: 'notebook',
          level: 2,
        },
        {
          file: 'folder/page.md',
          slug: 'page',
          title: 'page',
          level: 2,
        },
      ],
    });
  });
  it('nested folders', async () => {
    mock({ 'readme.md': '', 'folder1/folder2/folder3': { 'page.md': '', 'notebook.ipynb': '' } });
    expect(siteSectionFromFolder()).toEqual({
      file: 'readme.md',
      slug: 'readme',
      title: 'readme',
      pages: [
        {
          title: 'folder1',
          level: 1,
        },
        {
          title: 'folder2',
          level: 2,
        },
        {
          title: 'folder3',
          level: 3,
        },
        {
          file: 'folder1/folder2/folder3/notebook.ipynb',
          slug: 'notebook',
          title: 'notebook',
          level: 4,
        },
        {
          file: 'folder1/folder2/folder3/page.md',
          slug: 'page',
          title: 'page',
          level: 4,
        },
      ],
    });
  });
});
