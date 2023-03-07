// import type { FootnoteDefinition } from 'myst-spec-ext';
import { unified } from 'unified';
import { u } from 'unist-builder';
import mystToMd from '../src';

describe('myst-to-md basic features', () => {
  it('styles in paragraph', () => {
    const tree = u(
      'root',
      u('paragraph', [
        u('text', { value: 'Some % ' }),
        u('emphasis', [u('text', 'markdown')]),
        u('text', { value: ' with ' }),
        u('strong', [u('text', 'different')]),
        u('text', { value: ' ' }),
        u('inlineCode', 'styles'),
      ]),
    );
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('Some % *markdown* with **different** `styles`');
  });
  it('headings', () => {
    const tree = u('root', [
      u('heading', { depth: 1 }, [u('text', 'first')]),
      u('paragraph', [u('text', 'Some % '), u('emphasis', [u('text', 'markdown')])]),
      u('heading', { depth: 4 }, [u('text', 'fourth')]),
    ]);
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('# first\n\nSome % *markdown*\n\n#### fourth');
  });
  it('thematic break', () => {
    const tree = u('root', [
      u('paragraph', [u('text', 'Some markdown')]),
      u('thematicBreak'),
      u('paragraph', [u('text', 'Some more markdown')]),
    ]);
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('Some markdown\n\n---\n\nSome more markdown');
  });
  it('block quote', () => {
    const tree = u('root', [
      u('blockquote', [
        u('paragraph', [u('text', 'Some % '), u('emphasis', [u('text', 'markdown')])]),
      ]),
    ]);
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('> Some % *markdown*');
  });
  it('unordered list', () => {
    const tree = u('root', [
      u('list', { ordered: false }, [
        u('listItem', [u('paragraph', [u('text', 'Some markdown')])]),
        u('listItem', [u('paragraph', [u('text', 'Some more markdown')])]),
      ]),
    ]);
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('*   Some markdown\n\n*   Some more markdown');
  });
  it('ordered list', () => {
    const tree = u('root', [
      u('list', { ordered: true, start: 5 }, [
        u('listItem', [u('paragraph', [u('text', 'Some markdown')])]),
        u('listItem', [u('paragraph', [u('text', 'Some more markdown')])]),
      ]),
    ]);
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('5.  Some markdown\n\n6.  Some more markdown');
  });
  it('html', () => {
    const tree = u('root', [u('html', '<div>*Not markdown*<\\div>')]);
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('<div>*Not markdown*<\\div>');
  });
  it('code - plain', () => {
    const tree = u('root', [u('code', '5+5\nprint("hello world")')]);
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('```\n5+5\nprint("hello world")\n```');
  });
  it('code - with language', () => {
    const tree = u('root', [u('code', { lang: 'python' }, '5+5\nprint("hello world")')]);
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('```python\n5+5\nprint("hello world")\n```');
  });
  it('code - with metadata', () => {
    const tree = u('root', [
      u('code', { lang: 'python', meta: 'highlight-line="2"' }, '5+5\nprint("hello world")'),
    ]);
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('```python highlight-line="2"\n5+5\nprint("hello world")\n```');
  });
  it('definition', () => {
    const tree = u('root', [
      u('definition', {
        identifier: 'my-def',
        label: 'My-Def',
        url: 'https://example.com',
        title: 'Example',
      }),
    ]);
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('[My-Def]: https://example.com "Example"');
  });
  it('break', () => {
    const tree = u('root', [
      u('paragraph', [u('text', 'Some markdown'), u('break'), u('text', 'Some more markdown')]),
    ]);
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('Some markdown\\\nSome more markdown');
  });
  it('link', () => {
    const tree = u('root', [
      u('link', { url: 'https://example.com', title: 'my link' }, [
        u('text', 'Some % '),
        u('emphasis', [u('text', 'markdown')]),
      ]),
    ]);
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('[Some % *markdown*](https://example.com "my link")');
  });
  it('image', () => {
    const tree = u('root', [
      u('image', { url: 'https://example.com', title: 'my image', alt: 'Some text' }),
    ]);
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree);
    expect(file.result).toEqual('![Some text](https://example.com "my image")');
  });
  it('link reference', () => {
    const tree = u('root', [
      u('linkReference', { identifier: 'my-link', label: 'My-Link' }, [
        u('text', 'Some % '),
        u('emphasis', [u('text', 'markdown')]),
      ]),
    ]);
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree as any);
    expect(file.result).toEqual('[Some % *markdown*][My-Link]');
  });
  it('image reference', () => {
    const tree = u('root', [
      u('imageReference', { identifier: 'my-image', label: 'My-Image', alt: 'Some text' }),
    ]);
    const pipe = unified().use(mystToMd);
    pipe.runSync(tree as any);
    const file = pipe.stringify(tree as any);
    expect(file.result).toEqual('![Some text][My-Image]');
  });

  // it('escapes quotes and unicode', () => {
  //   const tree = u(
  //     'root',
  //     u('paragraph', [u('text', { value: '“quote” ' }), u('inlineMath', { value: '½' })]),
  //   );
  //   const pipe = unified().use(mystToMd);
  //   pipe.runSync(tree as any);
  //   const file = pipe.stringify(tree);
  //   expect(file.result).toEqual("``quote'' $\\frac{1}{2}$");
  // });
  // it('comment', () => {
  //   const tree = u('root', [u('comment', 'hello\nworld')]);
  //   const pipe = unified().use(mystToMd);
  //   pipe.runSync(tree as any);
  //   const file = pipe.stringify(tree as any);
  //   expect(file.result).toEqual('% hello\n% world');
  // });
  // it('footnote', () => {
  //   const tree = u('root', [
  //     u('paragraph', [
  //       u('text', 'hello'),
  //       u('footnoteReference', { identifier: 1 }),
  //       u('text', 'world'),
  //     ]),
  //   ]);
  //   const pipe = unified().use(mystToMd, {
  //     references: {
  //       footnotes: {
  //         '1': u('footnoteDefinition', { identifier: '1' }, [
  //           u('paragraph', [u('text', 'tex')]),
  //         ]) as FootnoteDefinition,
  //       },
  //     },
  //   });
  //   pipe.runSync(tree as any);
  //   const file = pipe.stringify(tree as any);
  //   expect((file.result as LatexResult).value).toEqual('hello\\footnote{tex}world');
  // });
});
