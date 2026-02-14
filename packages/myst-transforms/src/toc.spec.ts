import { describe, expect, test } from 'vitest';
import { buildTocTransform } from './toc';
import { VFile } from 'vfile';
import { toText } from 'myst-common';

describe('Test toc transformation', () => {
  test('Project Toc - basic', () => {
    const vfile = new VFile();
    const mdast = {
      type: 'root',
      children: [{ type: 'toc', kind: 'project', children: [] }],
    } as any;
    buildTocTransform(mdast, vfile, [
      { title: 'One', level: 1, slug: '' },
      { title: 'Two', level: 1, slug: 'two' },
      { title: 'Three', level: 2, slug: 'three' },
      { title: 'Four', level: 1, slug: 'four' },
    ]);
    expect(mdast.children[0].type).toBe('block');
    expect(mdast.children[0].data.part).toBe('toc:project');
    expect(mdast.children[0].children[0].type).toBe('list');
    expect(mdast.children[0].children[0].children.length).toBe(3);
    expect(mdast.children[0].children[0].children[0].children.length).toBe(1);
    expect(mdast.children[0].children[0].children[1].children.length).toBe(2);
    expect(mdast.children[0].children[0].children[0].children[0].url).toBe('/');
    expect(mdast.children[0].children[0].children[1].children[0].url).toBe('/two');
    expect(toText(mdast.children[0].children[0].children[1].children[0])).toBe('Two');
  });
  test('Project Toc - with external link', () => {
    const externalUrl = 'https://foo.bar/baz';
    const vfile = new VFile();
    const mdast = {
      type: 'root',
      children: [{ type: 'toc', kind: 'project', children: [] }],
    } as any;
    buildTocTransform(mdast, vfile, [
      { title: 'One', level: 1, url: externalUrl },
      { title: 'Two', level: 1, slug: 'two', url: externalUrl },
    ]);
    expect(mdast.children[0].type).toBe('block');
    expect(mdast.children[0].data.part).toBe('toc:project');
    expect(mdast.children[0].children[0].type).toBe('list');
    expect(mdast.children[0].children[0].children.length).toBe(2);
    expect(mdast.children[0].children[0].children[0].children.length).toBe(1);
    expect(mdast.children[0].children[0].children[1].children.length).toBe(1);
    expect(mdast.children[0].children[0].children[0].children[0].url).toBe(externalUrl);
    const secondItem = mdast.children[0].children[0].children[1].children[0];
    expect(secondItem.url).toBe(externalUrl);
    expect(secondItem.internal).toBe(false);
    expect(toText(secondItem)).toBe('Two');
  });
  test('Project Toc - with project slug and enumerators', () => {
    const vfile = new VFile();
    const mdast = {
      type: 'root',
      children: [{ type: 'toc', kind: 'project', children: [] }],
    } as any;
    buildTocTransform(
      mdast,
      vfile,
      [
        { title: 'One', level: 1, slug: '', enumerator: '1.1' },
        { title: 'Two', level: 1, slug: 'two', enumerator: '1.2' },
        { title: 'Three', level: 2, slug: 'three', enumerator: '1.2.1' },
        { title: 'Four', level: 1, slug: 'four', enumerator: '1.3' },
      ],
      'slug',
    );
    expect(mdast.children[0].type).toBe('block');
    expect(mdast.children[0].data.part).toBe('toc:project');
    expect(mdast.children[0].children[0].type).toBe('list');
    expect(mdast.children[0].children[0].children.length).toBe(3);
    expect(mdast.children[0].children[0].children[0].children.length).toBe(1);
    expect(mdast.children[0].children[0].children[1].children.length).toBe(2);
    expect(mdast.children[0].children[0].children[0].children[0].url).toBe('/slug/');
    expect(mdast.children[0].children[0].children[1].children[0].url).toBe('/slug/two');
    expect(toText(mdast.children[0].children[0].children[1].children[0])).toBe('1.2 Two');
  });
  test('Project Toc - no links', () => {
    const vfile = new VFile();
    const mdast = {
      type: 'root',
      children: [{ type: 'toc', kind: 'project', children: [] }],
    } as any;
    buildTocTransform(mdast, vfile, [
      { title: 'One', level: 1 },
      { title: 'Two', level: 1 },
      { title: 'Three', level: 2 },
      { title: 'Four', level: 1 },
    ]);
    expect(mdast.children[0].type).toBe('block');
    expect(mdast.children[0].data.part).toBe('toc:project');
    expect(mdast.children[0].children[0].type).toBe('list');
    expect(mdast.children[0].children[0].children.length).toBe(3);
    expect(mdast.children[0].children[0].children[0].children.length).toBe(1);
    expect(mdast.children[0].children[0].children[1].children.length).toBe(2);
    expect(mdast.children[0].children[0].children[0].children[0].url).toBeUndefined();
    expect(mdast.children[0].children[0].children[1].children[0].value).toBe('Two');
  });
  test('Project Toc - heading depth', () => {
    const vfile = new VFile();
    const mdast = {
      type: 'root',
      children: [{ type: 'toc', kind: 'project', depth: 1, children: [] }],
    } as any;
    buildTocTransform(
      mdast,
      vfile,
      [
        { title: 'One', level: 1, slug: '', enumerator: '1.1' },
        { title: 'Two', level: 1, slug: 'two', enumerator: '1.2' },
        { title: 'Three', level: 2, slug: 'three', enumerator: '1.2.1' },
        { title: 'Four', level: 1, slug: 'four', enumerator: '1.3' },
      ],
      'slug',
    );
    expect(mdast.children[0].type).toBe('block');
    expect(mdast.children[0].data.part).toBe('toc:project');
    expect(mdast.children[0].children[0].type).toBe('list');
    expect(mdast.children[0].children[0].children.length).toBe(3);
    expect(mdast.children[0].children[0].children[0].children.length).toBe(1);
    expect(mdast.children[0].children[0].children[1].children.length).toBe(1);
    expect(mdast.children[0].children[0].children[0].children[0].url).toBe('/slug/');
    expect(mdast.children[0].children[0].children[1].children[0].url).toBe('/slug/two');
    expect(toText(mdast.children[0].children[0].children[1].children[0])).toBe('1.2 Two');
  });
  test('Page Toc - basic', () => {
    const vfile = new VFile();
    const mdast = {
      type: 'root',
      children: [
        {
          type: 'heading',
          children: [{ type: 'text', value: 'One' }],
          depth: 1,
          identifier: 'one',
        },
        {
          type: 'heading',
          children: [{ type: 'text', value: 'Two' }],
          depth: 1,
          identifier: 'two',
        },
        {
          type: 'heading',
          children: [{ type: 'text', value: 'Three' }],
          depth: 2,
          identifier: 'three',
        },
        {
          type: 'heading',
          children: [{ type: 'text', value: 'Four' }],
          depth: 1,
          identifier: 'four',
        },
        { type: 'toc', kind: 'page', children: [] },
      ],
    } as any;
    buildTocTransform(mdast, vfile);
    expect(mdast.children[4].type).toBe('block');
    expect(mdast.children[4].data.part).toBe('toc:page');
    expect(mdast.children[4].children[0].type).toBe('list');
    expect(mdast.children[4].children[0].children.length).toBe(3);
    expect(mdast.children[4].children[0].children[0].children.length).toBe(1);
    expect(mdast.children[4].children[0].children[1].children.length).toBe(2);
    expect(mdast.children[4].children[0].children[0].children[0].url).toBe('#one');
    expect(mdast.children[4].children[0].children[1].children[0].url).toBe('#two');
    expect(toText(mdast.children[4].children[0].children[1].children[0])).toBe('Two');
  });
  test('Page Toc - with enumerators', () => {
    const vfile = new VFile();
    const mdast = {
      type: 'root',
      children: [
        {
          type: 'heading',
          children: [{ type: 'text', value: 'One' }],
          depth: 1,
          identifier: 'one',
          enumerator: '1.1',
        },
        {
          type: 'heading',
          children: [{ type: 'text', value: 'Two' }],
          depth: 1,
          identifier: 'two',
          enumerator: '1.2',
        },
        {
          type: 'heading',
          children: [{ type: 'text', value: 'Three' }],
          depth: 2,
          identifier: 'three',
          enumerator: '1.2.1',
        },
        {
          type: 'heading',
          children: [{ type: 'text', value: 'Four' }],
          depth: 1,
          identifier: 'four',
          enumerator: '1.3',
        },
        { type: 'toc', kind: 'page', children: [] },
      ],
    } as any;
    buildTocTransform(mdast, vfile);
    expect(mdast.children[4].type).toBe('block');
    expect(mdast.children[4].data.part).toBe('toc:page');
    expect(mdast.children[4].children[0].type).toBe('list');
    expect(mdast.children[4].children[0].children.length).toBe(3);
    expect(mdast.children[4].children[0].children[0].children.length).toBe(1);
    expect(mdast.children[4].children[0].children[1].children.length).toBe(2);
    expect(mdast.children[4].children[0].children[0].children[0].url).toBe('#one');
    expect(mdast.children[4].children[0].children[1].children[0].url).toBe('#two');
    expect(toText(mdast.children[4].children[0].children[1].children[0])).toBe('1.2 Two');
  });
  test('Page Toc - no identifiers', () => {
    const vfile = new VFile();
    const mdast = {
      type: 'root',
      children: [
        {
          type: 'heading',
          children: [{ type: 'text', value: 'One' }],
          depth: 1,
        },
        {
          type: 'heading',
          children: [{ type: 'text', value: 'Two' }],
          depth: 1,
        },
        {
          type: 'heading',
          children: [{ type: 'text', value: 'Three' }],
          depth: 2,
        },
        {
          type: 'heading',
          children: [{ type: 'text', value: 'Four' }],
          depth: 1,
        },
        { type: 'toc', kind: 'page', children: [] },
      ],
    } as any;
    buildTocTransform(mdast, vfile);
    expect(mdast.children[4].type).toBe('block');
    expect(mdast.children[4].data.part).toBe('toc:page');
    expect(mdast.children[4].children[0].type).toBe('list');
    expect(mdast.children[4].children[0].children.length).toBe(3);
    expect(mdast.children[4].children[0].children[0].children.length).toBe(1);
    expect(mdast.children[4].children[0].children[1].children.length).toBe(2);
    expect(mdast.children[4].children[0].children[0].children[0].url).toBeUndefined();
    expect(toText(mdast.children[4].children[0].children[1].children[0])).toBe('Two');
  });
  test('Page Toc - heading depth', () => {
    const vfile = new VFile();
    const mdast = {
      type: 'root',
      children: [
        {
          type: 'heading',
          children: [{ type: 'text', value: 'One' }],
          depth: 1,
          identifier: 'one',
        },
        {
          type: 'heading',
          children: [{ type: 'text', value: 'Two' }],
          depth: 1,
          identifier: 'two',
        },
        {
          type: 'heading',
          children: [{ type: 'text', value: 'Three' }],
          depth: 2,
          identifier: 'three',
        },
        {
          type: 'heading',
          children: [{ type: 'text', value: 'Four' }],
          depth: 1,
          identifier: 'four',
        },
        { type: 'toc', kind: 'page', depth: 1, children: [] },
      ],
    } as any;
    buildTocTransform(mdast, vfile);
    expect(mdast.children[4].type).toBe('block');
    expect(mdast.children[4].data.part).toBe('toc:page');
    expect(mdast.children[4].children[0].type).toBe('list');
    expect(mdast.children[4].children[0].children.length).toBe(3);
    expect(mdast.children[4].children[0].children[0].children.length).toBe(1);
    expect(mdast.children[4].children[0].children[1].children.length).toBe(1);
    expect(mdast.children[4].children[0].children[0].children[0].url).toBe('#one');
    expect(mdast.children[4].children[0].children[1].children[0].url).toBe('#two');
    expect(toText(mdast.children[4].children[0].children[1].children[0])).toBe('Two');
  });
  test('Section Toc - basic', () => {
    const vfile = new VFile();
    const mdast = {
      type: 'root',
      children: [
        {
          type: 'heading',
          children: [{ type: 'text', value: 'One' }],
          depth: 1,
          identifier: 'one',
        },
        {
          type: 'heading',
          children: [{ type: 'text', value: 'Two' }],
          depth: 1,
          identifier: 'two',
        },
        { type: 'toc', kind: 'section', children: [] },
        {
          type: 'heading',
          children: [{ type: 'text', value: 'Three' }],
          depth: 2,
          identifier: 'three',
        },
        {
          type: 'heading',
          children: [{ type: 'text', value: 'Four' }],
          depth: 1,
          identifier: 'four',
        },
      ],
    } as any;
    buildTocTransform(mdast, vfile);
    expect(mdast.children[2].type).toBe('block');
    expect(mdast.children[2].data.part).toBe('toc:section');
    expect(mdast.children[2].children[0].type).toBe('list');
    expect(mdast.children[2].children[0].children.length).toBe(1);
    expect(mdast.children[2].children[0].children[0].children.length).toBe(1);
    expect(mdast.children[2].children[0].children[0].children[0].url).toBe('#three');
    expect(toText(mdast.children[2].children[0].children[0].children[0])).toBe('Three');
  });
  test('Section Toc - nested', () => {
    const vfile = new VFile();
    const mdast = {
      type: 'root',
      children: [
        {
          type: 'heading',
          children: [{ type: 'text', value: 'One' }],
          depth: 1,
          identifier: 'one',
        },
        { type: 'toc', kind: 'section', children: [] },
        {
          type: 'heading',
          children: [{ type: 'text', value: 'Two' }],
          depth: 1,
          identifier: 'two',
        },
        {
          type: 'heading',
          children: [{ type: 'text', value: 'Three' }],
          depth: 2,
          identifier: 'three',
        },
        {
          type: 'heading',
          children: [{ type: 'text', value: 'Four' }],
          depth: 1,
          identifier: 'four',
        },
      ],
    } as any;
    buildTocTransform(mdast, vfile);
    expect(mdast.children[1].type).toBe('block');
    expect(mdast.children[1].data.part).toBe('toc:section');
    expect(mdast.children[1].children[0].type).toBe('list');
    expect(mdast.children[1].children[0].children.length).toBe(2);
    expect(mdast.children[1].children[0].children[0].children.length).toBe(2);
    expect(mdast.children[1].children[0].children[0].children[0].url).toBe('#two');
    expect(toText(mdast.children[1].children[0].children[0].children[0])).toBe('Two');
    expect(mdast.children[1].children[0].children[1].children[0].url).toBe('#four');
  });
  test('Section Toc - with heading', () => {
    const vfile = new VFile();
    const mdast = {
      type: 'root',
      children: [
        {
          type: 'heading',
          children: [{ type: 'text', value: 'One' }],
          depth: 1,
          identifier: 'one',
        },
        {
          type: 'toc',
          kind: 'section',
          children: [
            {
              type: 'heading',
              children: [{ type: 'text', value: 'My ToC' }],
              depth: 2,
              identifier: 'my-toc',
            },
          ],
        },
        {
          type: 'heading',
          children: [{ type: 'text', value: 'Two' }],
          depth: 1,
          identifier: 'two',
        },
        {
          type: 'heading',
          children: [{ type: 'text', value: 'Three' }],
          depth: 2,
          identifier: 'three',
        },
        {
          type: 'heading',
          children: [{ type: 'text', value: 'Four' }],
          depth: 1,
          identifier: 'four',
        },
      ],
    } as any;
    buildTocTransform(mdast, vfile);
    expect(mdast.children[1].type).toBe('block');
    expect(mdast.children[1].data.part).toBe('toc:section');
    expect(mdast.children[1].children[0].type).toBe('heading');
    expect(toText(mdast.children[1].children[0])).toBe('My ToC');
    expect(mdast.children[1].children[1].type).toBe('list');
    expect(mdast.children[1].children[1].children.length).toBe(2);
    expect(mdast.children[1].children[1].children[0].children.length).toBe(2);
    expect(mdast.children[1].children[1].children[0].children[0].url).toBe('#two');
    expect(toText(mdast.children[1].children[1].children[0].children[0])).toBe('Two');
    expect(mdast.children[1].children[1].children[1].children[0].url).toBe('#four');
  });
  // Shared pages for children toc tests
  const childrenPages = [
    { title: 'Parent', level: 1, slug: 'parent' },
    { title: 'Child A', level: 2, slug: 'child-a' },
    { title: 'Child B', level: 2, slug: 'child-b' },
    { title: 'Grandchild', level: 3, slug: 'grandchild' },
    { title: 'Sibling', level: 1, slug: 'sibling' },
  ];
  test('Children Toc - lists children and grandchildren', () => {
    const vfile = new VFile();
    const mdast = {
      type: 'root',
      children: [{ type: 'toc', kind: 'children', children: [] }],
    } as any;
    buildTocTransform(mdast, vfile, childrenPages, 'proj', 'parent');
    expect(mdast.children[0].data.part).toBe('toc:children');
    const list = mdast.children[0].children[0];
    // Only the level 2 pages are at the top of the toc list
    expect(list.children.length).toBe(2);
    expect(list.children[0].children[0].url).toBe('/proj/child-a');
    expect(list.children[1].children[0].url).toBe('/proj/child-b');
    // Grandchild is nested under Child B
    expect(list.children[1].children.length).toBe(2);
  });
  test('Children Toc - depth filter excludes grandchildren', () => {
    const vfile = new VFile();
    const mdast = {
      type: 'root',
      children: [{ type: 'toc', kind: 'children', depth: 1, children: [] }],
    } as any;
    buildTocTransform(mdast, vfile, childrenPages, undefined, 'parent');
    const list = mdast.children[0].children[0];
    // Same as above, but grandchild is now excluded
    expect(list.children.length).toBe(2);
    expect(list.children[0].children.length).toBe(1);
    expect(list.children[1].children.length).toBe(1);
  });
  test('Children Toc - empty toc for leaf page', () => {
    const vfile = new VFile();
    const mdast = {
      type: 'root',
      children: [{ type: 'toc', kind: 'children', children: [] }],
    } as any;
    buildTocTransform(mdast, vfile, childrenPages, undefined, 'sibling');
    expect(mdast.children[0].data.part).toBe('toc:children');
    expect(mdast.children[0].children[0].children.length).toBe(0);
  });
});
