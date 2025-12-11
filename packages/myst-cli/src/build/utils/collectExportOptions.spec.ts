import { describe, expect, it } from 'vitest';
import { VFile } from 'vfile';
import path from 'node:path';
import { ExportFormats } from 'myst-frontmatter';
import {
  resolveArticles,
  resolveArticlesFromProject,
  resolveFormat,
  resolveOutput,
  resolveTemplate,
} from './collectExportOptions';
import type { LocalProject } from '../../project';

describe('resolveArticlesFromProject', () => {
  it('multipage format uses index if no pages', async () => {
    const exp: any = { format: ExportFormats.pdf };
    const proj: Omit<LocalProject, 'bibliography'> = {
      path: '.',
      file: 'index.md',
      index: 'index',
      pages: [],
    };
    const vfile = new VFile();
    expect(resolveArticlesFromProject(exp, proj, vfile)).toEqual({
      articles: [{ file: 'index.md', level: 1 }],
    });
    expect(vfile.messages.length).toBe(0);
  });
  it('multipage format uses pages if available', async () => {
    const exp: any = { format: ExportFormats.tex };
    const proj: Omit<LocalProject, 'bibliography'> = {
      path: '.',
      file: 'index.md',
      index: 'index',
      pages: [
        {
          file: 'one.md',
          level: 1,
          slug: 'one',
        },
        {
          title: 'two',
          level: 2,
        },
        {
          file: 'three.md',
          level: 3,
          slug: 'three',
        },
      ],
    };
    const vfile = new VFile();
    expect(resolveArticlesFromProject(exp, proj, vfile)).toEqual({
      articles: [
        {
          file: 'one.md',
          level: 1,
          slug: 'one',
        },
        {
          title: 'two',
          level: 2,
        },
        {
          file: 'three.md',
          level: 3,
          slug: 'three',
        },
      ],
    });
    expect(vfile.messages.length).toBe(0);
  });
  it('jats uses index and pages but removes folders', async () => {
    const exp: any = { format: ExportFormats.xml };
    const proj: Omit<LocalProject, 'bibliography'> = {
      path: '.',
      file: 'index.md',
      index: 'index',
      pages: [
        {
          file: 'one.md',
          level: 1,
          slug: 'one',
        },
        {
          title: 'two',
          level: 2,
        },
        {
          file: 'three.md',
          level: 3,
          slug: 'three',
        },
      ],
    };
    const vfile = new VFile();
    expect(resolveArticlesFromProject(exp, proj, vfile)).toEqual({
      articles: [{ file: 'index.md', level: 1 }],
      sub_articles: ['one.md', 'three.md'],
    });
    expect(vfile.messages.length).toBe(0);
  });
  it('single page format uses index if no pages', async () => {
    const exp: any = { format: ExportFormats.docx };
    const proj: Omit<LocalProject, 'bibliography'> = {
      path: '.',
      file: 'index.md',
      index: 'index',
      pages: [],
    };
    const vfile = new VFile();
    expect(resolveArticlesFromProject(exp, proj, vfile)).toEqual({
      articles: [{ file: 'index.md', level: 1 }],
    });
    expect(vfile.messages.length).toBe(0);
  });
  it('single page format uses singe page if available', async () => {
    const exp: any = { format: ExportFormats.docx };
    const proj: Omit<LocalProject, 'bibliography'> = {
      path: '.',
      file: 'index.md',
      index: 'index',
      pages: [
        {
          file: 'one.md',
          level: 1,
          slug: 'one',
        },
      ],
    };
    const vfile = new VFile();
    expect(resolveArticlesFromProject(exp, proj, vfile)).toEqual({
      articles: [{ file: 'one.md', level: 1, slug: 'one' }],
    });
    expect(vfile.messages.length).toBe(0);
  });
  it('single page format warns on multiple pages', async () => {
    const exp: any = { format: ExportFormats.md };
    const proj: Omit<LocalProject, 'bibliography'> = {
      path: '.',
      file: 'index.md',
      index: 'index',
      pages: [
        {
          title: 'zero',
          level: 1,
        },
        {
          file: 'one.md',
          level: 1,
          slug: 'one',
        },
        {
          file: 'two.md',
          level: 2,
          slug: 'two',
        },
      ],
    };
    const vfile = new VFile();
    expect(resolveArticlesFromProject(exp, proj, vfile)).toEqual({
      articles: [{ file: 'one.md', level: 1, slug: 'one' }],
    });
    expect(vfile.messages.length).toBe(1);
  });
  it('meca format uses no articles on multiple pages', async () => {
    const exp: any = { format: ExportFormats.meca };
    const proj: Omit<LocalProject, 'bibliography'> = {
      path: '.',
      file: 'index.md',
      index: 'index',
      pages: [
        {
          title: 'zero',
          level: 1,
        },
        {
          file: 'one.md',
          level: 1,
          slug: 'one',
        },
        {
          file: 'two.md',
          level: 2,
          slug: 'two',
        },
      ],
    };
    const vfile = new VFile();
    expect(resolveArticlesFromProject(exp, proj, vfile)).toEqual({
      articles: [{ file: 'index.md', level: 1 }],
      sub_articles: ['one.md', 'two.md'],
    });
    expect(vfile.messages?.length).toBeFalsy();
  });
});

describe('resolveTemplate', () => {
  it('disableTemplate is prioritized', async () => {
    expect(resolveTemplate('index.md', { template: 'my-template' }, true)).toBe(null);
  });
  it('template that does not exist locally passes', async () => {
    expect(resolveTemplate('index.md', { template: 'my-template' })).toBe('my-template');
  });
  it('template that does exist locally resolves to absolute', async () => {
    expect(resolveTemplate('.', { template: '.' })).toBe(path.resolve('.'));
  });
});

describe('resolveFormat', () => {
  it('non-pdf format returns self', async () => {
    const vfile = new VFile();
    expect(resolveFormat(vfile, { format: ExportFormats.md })).toBe(ExportFormats.md);
    expect(vfile.messages.length).toBe(0);
  });
  it('non-pdf format ignores template/output', async () => {
    const vfile = new VFile();
    expect(
      resolveFormat(vfile, {
        format: ExportFormats.meca,
        output: 'out.md',
        template: 'template-typst',
      }),
    ).toBe(ExportFormats.meca);
    expect(vfile.messages.length).toBe(0);
  });
  it('pdf format returns pdf if no template/output', async () => {
    const vfile = new VFile();
    expect(resolveFormat(vfile, { format: ExportFormats.pdf })).toBe(ExportFormats.pdf);
    expect(vfile.messages.length).toBe(0);
  });
  it('pdf format returns pdf+tex if no template and output is folder', async () => {
    const vfile = new VFile();
    expect(resolveFormat(vfile, { format: ExportFormats.pdf, output: 'out' })).toBe(
      ExportFormats.pdftex,
    );
    expect(vfile.messages.length).toBe(0);
  });
  it('pdf format is prioritized over wrong output extension if no template', async () => {
    const vfile = new VFile();
    expect(resolveFormat(vfile, { format: ExportFormats.pdf, output: 'out.md' })).toBe(
      ExportFormats.pdf,
    );
    expect(vfile.messages.length).toBe(0);
  });
  it('returns pdf+tex if no format/template and output is folder', async () => {
    const vfile = new VFile();
    expect(resolveFormat(vfile, { output: 'out' })).toBe(ExportFormats.pdftex);
    expect(vfile.messages.length).toBe(0);
  });
  it('returns type from extension if no format/template', async () => {
    const vfile = new VFile();
    expect(resolveFormat(vfile, { output: 'out.md' })).toBe(ExportFormats.md);
    expect(vfile.messages.length).toBe(0);
  });
  it('unknown extension defaults to pdf if no format/template', async () => {
    const vfile = new VFile();
    expect(resolveFormat(vfile, { output: 'out.bad' })).toBe(ExportFormats.pdf);
    expect(vfile.messages.length).toBe(0);
  });
  it('returns pdf+tex if tex template and output is folder', async () => {
    const vfile = new VFile();
    expect(resolveFormat(vfile, { output: 'out', template: 'template-tex' })).toBe(
      ExportFormats.pdftex,
    );
    expect(vfile.messages.length).toBe(0);
  });
  it('returns pdf if tex template only', async () => {
    const vfile = new VFile();
    expect(resolveFormat(vfile, { template: 'template-tex' })).toBe(ExportFormats.pdf);
    expect(vfile.messages.length).toBe(0);
  });
  it('returns pdf if bad output with tex template', async () => {
    const vfile = new VFile();
    expect(resolveFormat(vfile, { output: 'out.bad', template: 'template-tex' })).toBe(
      ExportFormats.pdf,
    );
    expect(vfile.messages.length).toBe(0);
  });
  it('returns typst if bad output with typst template', async () => {
    const vfile = new VFile();
    expect(resolveFormat(vfile, { output: 'out.bad', template: 'template-typst' })).toBe(
      ExportFormats.typst,
    );
    expect(vfile.messages.length).toBe(0);
  });
  it('returns typst if folder output with typst template', async () => {
    const vfile = new VFile();
    expect(resolveFormat(vfile, { output: 'out', template: 'template-typst' })).toBe(
      ExportFormats.typst,
    );
    expect(vfile.messages.length).toBe(0);
  });
  it('returns typst if format pdf with typst template', async () => {
    const vfile = new VFile();
    expect(resolveFormat(vfile, { format: ExportFormats.pdf, template: 'template-typst' })).toBe(
      ExportFormats.typst,
    );
    expect(vfile.messages.length).toBe(0);
  });
  it('returns docx if docx template', async () => {
    const vfile = new VFile();
    expect(
      resolveFormat(vfile, {
        format: ExportFormats.pdf,
        output: 'out.md',
        template: 'template-docx',
      }),
    ).toBe(ExportFormats.docx);
    expect(vfile.messages.length).toBe(0);
  });
  it('defaults to pdf if format cannot be determined from template', async () => {
    const vfile = new VFile();
    expect(
      resolveFormat(vfile, {
        format: ExportFormats.pdf,
        output: 'out.pdf',
        template: 'template',
      }),
    ).toBe(ExportFormats.pdf);
  });
});

describe('resolveArticles', () => {
  it('empty articles/sub_articles error', async () => {
    const vfile = new VFile();
    expect(
      resolveArticles({} as any, '', vfile, {
        format: ExportFormats.pdf,
        articles: [],
        sub_articles: [],
      }),
    ).toEqual({ articles: [], sub_articles: [] });
    expect(vfile.messages.length).toBe(1);
  });
  it('empty articles/sub_articles pass for meca', async () => {
    const vfile = new VFile();
    expect(
      resolveArticles({} as any, '', vfile, {
        format: ExportFormats.meca,
        articles: [],
        sub_articles: [],
      }),
    ).toEqual({ articles: [], sub_articles: [] });
    expect(vfile.messages.length).toBe(0);
  });
  it('basic resolution/filtering of existing articles/sub_articles', async () => {
    const vfile = new VFile();
    expect(
      resolveArticles({} as any, '', vfile, {
        format: ExportFormats.pdf,
        articles: [
          {
            title: 'folder',
            level: 1,
          },
          {
            file: '.',
            slug: 'index',
            level: 1,
          },
          {
            file: 'does-not-exist',
            slug: 'does-not-exist',
            level: 1,
          },
        ],
        sub_articles: ['does-not-exist', '.'],
      }),
    ).toEqual({
      articles: [
        {
          title: 'folder',
          level: 1,
        },
        {
          file: path.resolve('.'),
          slug: 'index',
          level: 1,
        },
      ],
      sub_articles: [path.resolve('.')],
    });
    expect(vfile.messages.length).toBe(2);
  });
});

describe('resolveOutput', () => {
  it('output with correct extension passes', async () => {
    const vfile = new VFile();
    expect(
      resolveOutput({} as any, '.', vfile, { format: ExportFormats.pdf, output: 'out.pdf' }),
    ).toEqual(path.resolve(path.dirname('.'), 'out.pdf'));
    expect(vfile.messages.length).toBe(0);
  });
  it('meca format with zip:false warns', async () => {
    const vfile = new VFile();
    expect(
      resolveOutput({} as any, '.', vfile, {
        format: ExportFormats.meca,
        zip: false,
        output: 'out.zip',
      }),
    ).toEqual(path.resolve(path.dirname('.'), 'out.zip'));
    expect(vfile.messages.length).toBe(1);
  });
  it('non-zippable format with zip:true warns', async () => {
    const vfile = new VFile();
    expect(
      resolveOutput({} as any, '.', vfile, {
        format: ExportFormats.md,
        zip: true,
        output: 'out.md',
      }),
    ).toEqual(path.resolve(path.dirname('.'), 'out.md'));
    expect(vfile.messages.length).toBe(1);
  });
  it('output with incorrect extension errors', async () => {
    const vfile = new VFile();
    expect(
      resolveOutput({} as any, '.', vfile, { format: ExportFormats.pdf, output: 'out.md' }),
    ).toEqual(undefined);
    expect(vfile.messages.length).toBe(1);
  });
  it('non-zip output with zip:true warns', async () => {
    const vfile = new VFile();
    expect(
      resolveOutput({} as any, '.', vfile, {
        format: ExportFormats.pdftex,
        zip: true,
        output: 'out.pdf',
      }),
    ).toEqual(path.resolve(path.dirname('.'), 'out.pdf'));
    expect(vfile.messages.length).toBe(1);
  });
});
